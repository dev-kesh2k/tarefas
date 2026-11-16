import { prisma, nowInTz, toMinutes } from './db.js';

/** Cria a mesma notificação para vários usuários (ignora vazios e repetidos). */
export async function notify(userIds, data) {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return;
  await prisma.notification.createMany({ data: ids.map((userId) => ({ userId, type: 'task', ...data })) });
}

const REMINDER_MIN = 15;

/**
 * Lembretes: tarefas pendentes de hoje que começam nos próximos 15 minutos.
 * O updateMany com reminderSent=false garante um aviso só, mesmo com várias réplicas.
 */
export async function runReminders() {
  const { day, minutes } = nowInTz();
  const tasks = await prisma.task.findMany({
    where: { date: day, done: false, reminderSent: false, startTime: { not: null } },
    select: { id: true, title: true, startTime: true, ownerId: true, assigneeId: true },
  });
  for (const t of tasks) {
    const diff = toMinutes(t.startTime) - minutes;
    if (diff < 0 || diff > REMINDER_MIN) continue;
    const { count } = await prisma.task.updateMany({ where: { id: t.id, reminderSent: false }, data: { reminderSent: true } });
    if (count !== 1) continue;
    await notify([t.ownerId, t.assigneeId], {
      kind: 'reminder',
      title: 'Lembrete',
      body: diff === 0 ? `"${t.title}" começa agora (${t.startTime})` : `"${t.title}" começa em ${diff} min (${t.startTime})`,
      taskId: t.id,
    });
  }
}

export function startReminderLoop() {
  const tick = () => runReminders().catch((e) => console.error('Lembretes:', e.message));
  setTimeout(tick, 5_000);
  setInterval(tick, 60_000);
}
