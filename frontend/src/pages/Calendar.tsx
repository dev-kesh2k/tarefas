import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTaskList } from '../tasks';
import { MONTHS, WEEKDAYS_SHORT, dayKey, longDate } from '../util';
import { Empty, ErrorBox, PageHeader, Spinner, TaskRow } from '../ui';

export default function CalendarPage() {
  const nav = useNavigate();
  const today = dayKey();
  const [selected, setSelected] = useState(today);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const first = new Date(month.y, month.m, 1);
  const last = new Date(month.y, month.m + 1, 0);
  const list = useTaskList(`/tasks?from=${dayKey(first)}&to=${dayKey(last)}`);

  const byDay = useMemo(() => {
    const map = new Map<string, { total: number; pending: number }>();
    for (const t of list.tasks) {
      if (!t.date) continue;
      const v = map.get(t.date) || { total: 0, pending: 0 };
      v.total += 1;
      if (!t.done) v.pending += 1;
      map.set(t.date, v);
    }
    return map;
  }, [list.tasks]);

  // Semana começando na segunda-feira.
  const offset = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: last.getDate() }, (_, i) => dayKey(new Date(month.y, month.m, i + 1))),
  ];

  const move = (n: number) => {
    const d = new Date(month.y, month.m + n, 1);
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(dayKey(d));
  };
  const goToday = () => {
    const d = new Date();
    setMonth({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(today);
  };

  const dayTasks = list.tasks
    .filter((t) => t.date === selected)
    .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));

  return (
    <div>
      <PageHeader
        title="Calendário"
        right={
          <button className="min-h-[44px] px-2 text-sm font-semibold text-brand" onClick={goToday}>
            Hoje
          </button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="card p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <button className="icon-btn" onClick={() => move(-1)} aria-label="Mês anterior">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-bold capitalize">
              {MONTHS[month.m]} {month.y}
            </p>
            <button className="icon-btn" onClick={() => move(1)} aria-label="Próximo mês">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-[#94a3b8]">
            {WEEKDAYS_SHORT.map((w) => (
              <div key={w} className="py-2">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((k, i) =>
              k ? (
                <button key={k} onClick={() => setSelected(k)} className="flex min-h-[44px] flex-col items-center justify-center" aria-label={longDate(k)}>
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition ${
                      k === selected ? 'bg-brand text-white' : k === today ? 'text-brand ring-2 ring-brand/30' : 'text-[#0f172a]'
                    }`}
                  >
                    {Number(k.slice(8))}
                  </span>
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                      byDay.get(k) ? (byDay.get(k)!.pending ? 'bg-brand' : 'bg-[#22c55e]') : 'bg-transparent'
                    }`}
                  />
                </button>
              ) : (
                <div key={`e${i}`} />
              ),
            )}
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="min-w-0 truncate font-bold">{selected === today ? 'Agenda de hoje' : longDate(selected)}</h2>
            <Link to={`/tarefas/nova?data=${selected}`} className="flex min-h-[44px] shrink-0 items-center gap-1 text-sm font-semibold text-brand">
              <Plus className="h-4 w-4" /> Adicionar
            </Link>
          </div>
          <div className="space-y-2.5">
            <ErrorBox message={list.error || list.actionError} onRetry={list.error ? list.reload : undefined} />
            {list.loading && !list.data ? (
              <Spinner />
            ) : dayTasks.length ? (
              dayTasks.map((t) => (
                <TaskRow key={t.id} task={t} withDay={false} onToggle={() => list.toggle(t)} onOpen={() => nav(`/tarefas/${t.id}`)} />
              ))
            ) : (
              !list.error && <Empty icon={<CalendarDays className="h-7 w-7" />} title="Nenhuma tarefa neste dia" text="Toque em Adicionar para agendar uma." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
