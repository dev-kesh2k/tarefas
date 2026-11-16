import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Calendar, Check, CheckCircle2, Flame, Folder, List, Plus } from 'lucide-react';
import { useApi, type Stats } from '../api';
import { useAuth } from '../auth';
import { useTaskList } from '../tasks';
import { dayKey, firstName, longDate } from '../util';
import { Empty, ErrorBox, Spinner, TaskRow } from '../ui';

export default function Home() {
  const { user, unread } = useAuth();
  const nav = useNavigate();
  const today = dayKey();
  const stats = useApi<Stats>(`/stats?today=${today}`);
  const list = useTaskList(`/tasks?date=${today}`);
  const s = stats.data;

  // Atualiza os números quando uma tarefa de hoje muda.
  const doneToday = list.tasks.filter((t) => t.done).length;
  useEffect(() => {
    if (list.data) stats.reload();
  }, [doneToday]); // eslint-disable-line react-hooks/exhaustive-deps

  const shortcuts = [
    { to: '/tarefas', label: 'Todas as tarefas', icon: List, cls: 'bg-[#eaf1ff] text-[#2563eb]' },
    { to: '/tarefas?prioridade=high', label: 'Prioridade alta', icon: Flame, cls: 'bg-[#fff1e8] text-[#ea580c]', badge: s?.high },
    { to: '/calendario', label: 'Calendário', icon: Calendar, cls: 'bg-[#eaf1ff] text-[#1d4ed8]' },
    { to: '/projetos', label: 'Projetos', icon: Folder, cls: 'bg-[#e8f8ef] text-[#16a34a]' },
  ];

  return (
    <div>
      <header className="mb-5 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">Olá, {firstName(user?.name || '')} 👋</h1>
          <p className="mt-1 text-sm text-[#64748b]">
            {s && s.todayTotal - s.todayDone > 0
              ? `Você tem ${s.todayTotal - s.todayDone} tarefa(s) para hoje. Vamos lá!`
              : 'Ânimo! Hoje é um bom dia para concluir tarefas.'}
          </p>
        </div>
        <Link to="/notificacoes" className="icon-btn relative -mr-2" aria-label="Notificações">
          <Bell className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563eb] to-[#3b82f6] p-5 text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)]">
          <p className="text-sm text-white/85">Total de tarefas</p>
          <p className="mt-1 text-4xl font-extrabold">{s?.total ?? '–'}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-[#16a34a]">
              <Check className="h-3.5 w-3.5" /> {s?.done ?? 0} concluídas
            </span>
            <span className="rounded-lg bg-white/20 px-2.5 py-1.5">{s?.pending ?? 0} pendentes</span>
            {!!s?.overdue && (
              <span className="flex items-center gap-1 rounded-lg bg-[#fee2e2] px-2.5 py-1.5 text-[#dc2626]">
                <AlertTriangle className="h-3.5 w-3.5" /> {s.overdue} atrasadas
              </span>
            )}
          </div>
          <CheckCircle2 className="absolute right-5 top-5 h-12 w-12 text-white/90" />
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {shortcuts.map((c) => (
            <Link key={c.to} to={c.to} className="card relative flex min-h-[96px] flex-col items-center justify-center gap-2 p-2 text-center">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${c.cls}`}>
                <c.icon className="h-5 w-5" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-[#334155] sm:text-xs">{c.label}</span>
              {!!c.badge && (
                <span className="absolute right-1.5 top-1.5 rounded-full bg-[#ef4444] px-1.5 text-[10px] font-bold text-white">{c.badge}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">Tarefas de hoje</h2>
            <p className="truncate text-xs text-[#64748b]">{longDate(today)}</p>
          </div>
          <Link to="/tarefas" className="shrink-0 py-2 text-sm font-semibold text-brand">
            Ver todas
          </Link>
        </div>
        <div className="space-y-2.5">
          <ErrorBox message={list.error || list.actionError} onRetry={list.error ? list.reload : undefined} />
          {list.loading && !list.data ? (
            <Spinner />
          ) : list.tasks.length ? (
            list.tasks.map((t) => (
              <TaskRow key={t.id} task={t} withDay={false} onToggle={() => list.toggle(t)} onOpen={() => nav(`/tarefas/${t.id}`)} />
            ))
          ) : (
            !list.error && (
              <Empty
                icon={<CheckCircle2 className="h-7 w-7" />}
                title="Nada agendado para hoje"
                text="Crie uma tarefa com data de hoje para vê-la aqui."
                action={
                  <Link to="/tarefas/nova" className="btn-primary">
                    <Plus className="h-5 w-5" /> Nova tarefa
                  </Link>
                }
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}
