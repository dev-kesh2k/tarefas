import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, HttpError, isDay, isTime, toMinutes } from './db.js';
import { signToken, publicUser, requireAuth, tooManyAttempts, recordFailure, clearFailures } from './auth.js';
import { notify, runReminders } from './notify.js';
import { CATEGORIES, COLORS, PRIORITIES, email, password, text } from './validate.js';

export const api = Router();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const userSelect = { id: true, name: true, email: true };

// ---------- Saúde e autenticação ----------
api.get(
  '/health',
  wrap(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, db: 'ok' });
  }),
);

api.post(
  '/auth/register',
  wrap(async (req, res) => {
    const name = text(req.body?.name, 'Nome', { max: 80, required: true });
    const mail = email(req.body?.email);
    const pass = password(req.body?.password);
    if (await prisma.user.findUnique({ where: { email: mail } })) throw new HttpError(409, 'Este e-mail já está cadastrado');
    const user = await prisma.user.create({ data: { name, email: mail, passwordHash: await bcrypt.hash(pass, 10) } });
    await prisma.notification.create({
      data: { userId: user.id, type: 'system', kind: 'welcome', title: 'Bem-vindo(a) ao Tarefas!', body: 'Crie sua primeira tarefa tocando no botão +.' },
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  }),
);

api.post(
  '/auth/login',
  wrap(async (req, res) => {
    const mail = email(req.body?.email);
    const pass = typeof req.body?.password === 'string' ? req.body.password : '';
    const key = `${req.ip}|${mail}`;
    if (tooManyAttempts(key)) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos.');
    const user = await prisma.user.findUnique({ where: { email: mail } });
    if (!user || !(await bcrypt.compare(pass, user.passwordHash))) {
      recordFailure(key);
      throw new HttpError(401, 'E-mail ou senha incorretos');
    }
    clearFailures(key);
    res.json({ token: signToken(user), user: publicUser(user) });
  }),
);

api.use(requireAuth);

api.get('/me', (req, res) => res.json({ user: publicUser(req.user) }));

api.put(
  '/me',
  wrap(async (req, res) => {
    const name = text(req.body?.name, 'Nome', { max: 80, required: true });
    const mail = email(req.body?.email);
    if (mail !== req.user.email && (await prisma.user.findUnique({ where: { email: mail } })))
      throw new HttpError(409, 'Este e-mail já está em uso');
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { name, email: mail } });
    res.json({ user: publicUser(user) });
  }),
);

api.put(
  '/me/password',
  wrap(async (req, res) => {
    const current = typeof req.body?.current === 'string' ? req.body.current : '';
    if (!(await bcrypt.compare(current, req.user.passwordHash))) throw new HttpError(400, 'Senha atual incorreta');
    const pass = password(req.body?.password);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: await bcrypt.hash(pass, 10) } });
    await prisma.notification.create({
      data: { userId: req.user.id, type: 'system', kind: 'security', title: 'Senha alterada', body: 'Sua senha foi alterada com sucesso.' },
    });
    res.json({ ok: true });
  }),
);

api.get(
  '/users',
  wrap(async (_req, res) => {
    res.json({ users: await prisma.user.findMany({ select: userSelect, orderBy: { name: 'asc' } }) });
  }),
);

// ---------- Tarefas ----------
const visible = (userId) => ({ OR: [{ ownerId: userId }, { assigneeId: userId }] });

const taskInclude = {
  project: { select: { id: true, name: true, color: true } },
  assignee: { select: userSelect },
  owner: { select: userSelect },
  checklist: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
};

function shapeTask(t, userId) {
  const total = t.checklist.length;
  return {
    ...t,
    canEdit: t.ownerId === userId,
    checklistDone: t.checklist.filter((c) => c.done).length,
    checklistTotal: total,
  };
}

async function loadTask(id, userId) {
  const task = await prisma.task.findFirst({ where: { id, ...visible(userId) }, include: taskInclude });
  if (!task) throw new HttpError(404, 'Tarefa não encontrada');
  return task;
}

/** Valida o corpo de criação/edição; `partial` só para checagem de campos enviados. */
async function taskData(body, userId) {
  const title = text(body?.title, 'Título', { max: 140, required: true });
  const description = text(body?.description, 'Descrição', { max: 4000 });
  const category = CATEGORIES.includes(body?.category) ? body.category : 'geral';
  const priority = PRIORITIES.includes(body?.priority) ? body.priority : 'medium';
  const date = body?.date ? String(body.date) : null;
  if (date && !isDay(date)) throw new HttpError(400, 'Data inválida');
  const startTime = body?.startTime ? String(body.startTime) : null;
  const endTime = body?.endTime ? String(body.endTime) : null;
  if (startTime && !isTime(startTime)) throw new HttpError(400, 'Horário de início inválido');
  if (endTime && !isTime(endTime)) throw new HttpError(400, 'Horário de término inválido');
  if ((startTime || endTime) && !date) throw new HttpError(400, 'Informe a data para usar horário');
  if (endTime && !startTime) throw new HttpError(400, 'Informe o horário de início');
  if (startTime && endTime && toMinutes(endTime) < toMinutes(startTime))
    throw new HttpError(400, 'O término deve ser depois do início');

  let projectId = body?.projectId || null;
  if (projectId) {
    const project = await prisma.project.findFirst({ where: { id: String(projectId), ownerId: userId } });
    if (!project) throw new HttpError(400, 'Projeto inválido');
    projectId = project.id;
  }
  let assigneeId = body?.assigneeId || null;
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: String(assigneeId) } });
    if (!assignee) throw new HttpError(400, 'Responsável inválido');
    assigneeId = assignee.id;
  }
  return { title, description, category, priority, date, startTime, endTime, projectId, assigneeId };
}

api.get(
  '/tasks',
  wrap(async (req, res) => {
    const { status, q, date, from, to, projectId, priority, category } = req.query;
    const and = [visible(req.user.id)];
    if (status === 'pending') and.push({ done: false });
    if (status === 'done') and.push({ done: true });
    if (typeof q === 'string' && q.trim()) and.push({ title: { contains: q.trim().slice(0, 100), mode: 'insensitive' } });
    if (isDay(date)) and.push({ date });
    if (isDay(from)) and.push({ date: { gte: from } });
    if (isDay(to)) and.push({ date: { lte: to } });
    if (typeof projectId === 'string' && projectId) and.push({ projectId });
    if (PRIORITIES.includes(priority)) and.push({ priority });
    if (CATEGORIES.includes(category)) and.push({ category });
    const tasks = await prisma.task.findMany({
      where: { AND: and },
      include: taskInclude,
      orderBy: [{ done: 'asc' }, { date: { sort: 'asc', nulls: 'last' } }, { startTime: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
      take: 500,
    });
    res.json({ tasks: tasks.map((t) => shapeTask(t, req.user.id)) });
  }),
);

api.get(
  '/stats',
  wrap(async (req, res) => {
    const where = visible(req.user.id);
    const today = isDay(req.query.today) ? req.query.today : null;
    const [total, done, high, todayTotal, todayDone, overdue] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.count({ where: { AND: [where, { done: true }] } }),
      prisma.task.count({ where: { AND: [where, { done: false, priority: 'high' }] } }),
      today ? prisma.task.count({ where: { AND: [where, { date: today }] } }) : 0,
      today ? prisma.task.count({ where: { AND: [where, { date: today, done: true }] } }) : 0,
      today ? prisma.task.count({ where: { AND: [where, { done: false, date: { lt: today } }] } }) : 0,
    ]);
    res.json({ total, done, pending: total - done, high, todayTotal, todayDone, overdue });
  }),
);

api.post(
  '/tasks',
  wrap(async (req, res) => {
    const data = await taskData(req.body, req.user.id);
    const items = Array.isArray(req.body?.checklist) ? req.body.checklist : [];
    const checklist = items
      .map((s) => (typeof s === 'string' ? s.trim().slice(0, 200) : ''))
      .filter(Boolean)
      .slice(0, 50)
      .map((t, position) => ({ text: t, position }));
    const task = await prisma.task.create({
      data: { ...data, ownerId: req.user.id, checklist: { create: checklist } },
      include: taskInclude,
    });
    if (task.assigneeId && task.assigneeId !== req.user.id) {
      await notify([task.assigneeId], {
        kind: 'assigned',
        title: 'Tarefa atribuída',
        body: `${req.user.name} atribuiu a você a tarefa "${task.title}"`,
        taskId: task.id,
      });
    }
    runReminders().catch(() => {});
    res.status(201).json({ task: shapeTask(task, req.user.id) });
  }),
);

api.get(
  '/tasks/:id',
  wrap(async (req, res) => {
    res.json({ task: shapeTask(await loadTask(req.params.id, req.user.id), req.user.id) });
  }),
);

api.put(
  '/tasks/:id',
  wrap(async (req, res) => {
    const current = await loadTask(req.params.id, req.user.id);
    if (current.ownerId !== req.user.id) throw new HttpError(403, 'Só quem criou a tarefa pode editá-la');
    const data = await taskData(req.body, req.user.id);
    const scheduleChanged = data.date !== current.date || data.startTime !== current.startTime;
    const task = await prisma.task.update({
      where: { id: current.id },
      data: { ...data, ...(scheduleChanged ? { reminderSent: false } : {}) },
      include: taskInclude,
    });
    if (task.assigneeId && task.assigneeId !== current.assigneeId && task.assigneeId !== req.user.id) {
      await notify([task.assigneeId], {
        kind: 'assigned',
        title: 'Tarefa atribuída',
        body: `${req.user.name} atribuiu a você a tarefa "${task.title}"`,
        taskId: task.id,
      });
    }
    if (scheduleChanged) runReminders().catch(() => {});
    res.json({ task: shapeTask(task, req.user.id) });
  }),
);

api.post(
  '/tasks/:id/toggle',
  wrap(async (req, res) => {
    const current = await loadTask(req.params.id, req.user.id);
    const done = typeof req.body?.done === 'boolean' ? req.body.done : !current.done;
    const task = await prisma.task.update({
      where: { id: current.id },
      data: { done, doneAt: done ? new Date() : null },
      include: taskInclude,
    });
    if (done && !current.done) {
      await notify(
        [task.ownerId, task.assigneeId].filter((id) => id !== req.user.id),
        { kind: 'done', title: 'Tarefa concluída', body: `${req.user.name} concluiu "${task.title}"`, taskId: task.id },
      );
    }
    res.json({ task: shapeTask(task, req.user.id) });
  }),
);

api.delete(
  '/tasks/:id',
  wrap(async (req, res) => {
    const current = await loadTask(req.params.id, req.user.id);
    if (current.ownerId !== req.user.id) throw new HttpError(403, 'Só quem criou a tarefa pode excluí-la');
    await prisma.task.delete({ where: { id: current.id } });
    if (current.assigneeId && current.assigneeId !== req.user.id) {
      await notify([current.assigneeId], {
        kind: 'deleted',
        title: 'Tarefa cancelada',
        body: `${req.user.name} cancelou a tarefa "${current.title}"`,
      });
    }
    res.json({ ok: true });
  }),
);

// ---------- Checklist ----------
api.post(
  '/tasks/:id/checklist',
  wrap(async (req, res) => {
    const task = await loadTask(req.params.id, req.user.id);
    const t = text(req.body?.text, 'Item', { max: 200, required: true });
    if (task.checklist.length >= 100) throw new HttpError(400, 'Limite de itens atingido');
    const position = task.checklist.reduce((m, c) => Math.max(m, c.position), -1) + 1;
    await prisma.checklistItem.create({ data: { taskId: task.id, text: t, position } });
    res.status(201).json({ task: shapeTask(await loadTask(task.id, req.user.id), req.user.id) });
  }),
);

async function loadItem(id, userId) {
  const item = await prisma.checklistItem.findFirst({ where: { id, task: visible(userId) } });
  if (!item) throw new HttpError(404, 'Item não encontrado');
  return item;
}

api.put(
  '/checklist/:id',
  wrap(async (req, res) => {
    const item = await loadItem(req.params.id, req.user.id);
    const data = {};
    if (typeof req.body?.done === 'boolean') data.done = req.body.done;
    if (req.body?.text !== undefined) data.text = text(req.body.text, 'Item', { max: 200, required: true });
    await prisma.checklistItem.update({ where: { id: item.id }, data });
    res.json({ task: shapeTask(await loadTask(item.taskId, req.user.id), req.user.id) });
  }),
);

api.delete(
  '/checklist/:id',
  wrap(async (req, res) => {
    const item = await loadItem(req.params.id, req.user.id);
    await prisma.checklistItem.delete({ where: { id: item.id } });
    res.json({ task: shapeTask(await loadTask(item.taskId, req.user.id), req.user.id) });
  }),
);

// ---------- Projetos ----------
function projectData(body) {
  return {
    name: text(body?.name, 'Nome', { max: 80, required: true }),
    description: text(body?.description, 'Descrição', { max: 1000 }),
    color: COLORS.includes(body?.color) ? body.color : 'blue',
  };
}

function shapeProject(p) {
  const total = p.tasks.length;
  const done = p.tasks.filter((t) => t.done).length;
  const { tasks, ...rest } = p;
  return { ...rest, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
}

async function loadProject(id, userId) {
  const p = await prisma.project.findFirst({ where: { id, ownerId: userId }, include: { tasks: { select: { done: true } } } });
  if (!p) throw new HttpError(404, 'Projeto não encontrado');
  return p;
}

api.get(
  '/projects',
  wrap(async (req, res) => {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      include: { tasks: { select: { done: true } } },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ projects: projects.map(shapeProject) });
  }),
);

api.post(
  '/projects',
  wrap(async (req, res) => {
    const p = await prisma.project.create({
      data: { ...projectData(req.body), ownerId: req.user.id },
      include: { tasks: { select: { done: true } } },
    });
    res.status(201).json({ project: shapeProject(p) });
  }),
);

api.get(
  '/projects/:id',
  wrap(async (req, res) => {
    res.json({ project: shapeProject(await loadProject(req.params.id, req.user.id)) });
  }),
);

api.put(
  '/projects/:id',
  wrap(async (req, res) => {
    const current = await loadProject(req.params.id, req.user.id);
    const p = await prisma.project.update({
      where: { id: current.id },
      data: projectData(req.body),
      include: { tasks: { select: { done: true } } },
    });
    const assignees = await prisma.task.findMany({
      where: { projectId: p.id, assigneeId: { not: null } },
      select: { assigneeId: true },
    });
    await notify(
      assignees.map((a) => a.assigneeId).filter((id) => id !== req.user.id),
      { type: 'system', kind: 'project', title: 'Projeto atualizado', body: `O projeto "${p.name}" foi atualizado` },
    );
    res.json({ project: shapeProject(p) });
  }),
);

api.delete(
  '/projects/:id',
  wrap(async (req, res) => {
    const current = await loadProject(req.params.id, req.user.id);
    await prisma.project.delete({ where: { id: current.id } });
    res.json({ ok: true });
  }),
);

// ---------- Notificações ----------
api.get(
  '/notifications',
  wrap(async (req, res) => {
    const type = ['task', 'system'].includes(req.query.type) ? req.query.type : undefined;
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id, ...(type ? { type } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ notifications });
  }),
);

api.get(
  '/notifications/unread-count',
  wrap(async (req, res) => {
    res.json({ count: await prisma.notification.count({ where: { userId: req.user.id, read: false } }) });
  }),
);

api.post(
  '/notifications/read-all',
  wrap(async (req, res) => {
    await prisma.notification.updateMany({ where: { userId: req.user.id, read: false }, data: { read: true } });
    res.json({ ok: true });
  }),
);

api.post(
  '/notifications/:id/read',
  wrap(async (req, res) => {
    const { count } = await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { read: true } });
    if (!count) throw new HttpError(404, 'Notificação não encontrada');
    res.json({ ok: true });
  }),
);

api.delete(
  '/notifications/:id',
  wrap(async (req, res) => {
    const { count } = await prisma.notification.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!count) throw new HttpError(404, 'Notificação não encontrada');
    res.json({ ok: true });
  }),
);
