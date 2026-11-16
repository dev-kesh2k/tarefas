import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, Check, Flag, Folder, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { api, useApi, type Task } from '../api';
import { useAuth } from '../auth';
import { isOverdue, longDate, priority, projectColor } from '../util';
import { Avatar, CategoryBadge, ErrorBox, Menu, PageHeader, Spinner } from '../ui';

export default function TaskDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const { data, error, loading, reload, setData } = useApi<{ task: Task }>(`/tasks/${id}`);
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newItem, setNewItem] = useState('');

  const run = async (fn: () => Promise<{ task: Task }>) => {
    setBusy(true);
    try {
      setData(await fn());
      setActionError('');
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <Spinner />;
  if (error || !data)
    return (
      <div>
        <PageHeader title="Tarefa" back />
        <ErrorBox message={error || 'Tarefa não encontrada'} onRetry={reload} />
      </div>
    );

  const t = data.task;
  const p = priority(t.priority);
  const pc = t.project ? projectColor(t.project.color) : null;

  const remove = async () => {
    if (!confirm(`Excluir a tarefa "${t.title}"?`)) return;
    try {
      await api.del(`/tasks/${t.id}`);
      nav('/tarefas', { replace: true });
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const addItem = (e: FormEvent) => {
    e.preventDefault();
    const text = newItem.trim();
    if (!text) return;
    setNewItem('');
    run(() => api.post(`/tasks/${t.id}/checklist`, { text }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title=""
        back
        right={
          t.canEdit ? (
            <Menu
              items={[
                { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => nav(`/tarefas/${t.id}/editar`) },
                { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: remove },
              ]}
            />
          ) : undefined
        }
      />

      <h1 className={`break-words text-2xl font-bold ${t.done ? 'text-[#94a3b8] line-through' : ''}`}>{t.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <CategoryBadge id={t.category} />
        {t.done && <span className="rounded-lg bg-[#e8f8ef] px-2.5 py-1 text-xs font-semibold text-[#16a34a]">Concluída</span>}
        {isOverdue(t) && <span className="rounded-lg bg-[#fef2f2] px-2.5 py-1 text-xs font-semibold text-[#dc2626]">Atrasada</span>}
      </div>

      {t.description && <p className="mt-4 whitespace-pre-wrap break-words text-[#334155]">{t.description}</p>}

      <div className="mt-5 space-y-3 text-sm">
        <p className="flex items-center gap-3 text-[#334155]">
          <Calendar className="h-5 w-5 shrink-0 text-[#64748b]" />
          {t.date ? (
            <span>
              {longDate(t.date)}
              {t.startTime && ` • ${t.startTime}${t.endTime ? ` - ${t.endTime}` : ''}`}
            </span>
          ) : (
            'Sem data'
          )}
        </p>
        <p className="flex items-center gap-3 text-[#334155]">
          <Flag className={`h-5 w-5 shrink-0 ${p.text}`} />
          <span>
            Prioridade: <b className={p.text}>{p.label}</b>
          </span>
        </p>
        {t.project && pc && (
          <button onClick={() => nav(`/projetos/${t.project!.id}`)} className="flex min-h-[32px] items-center gap-3 text-left text-[#334155]">
            <Folder className={`h-5 w-5 shrink-0 ${pc.fg}`} />
            <span>
              Projeto: <b>{t.project.name}</b>
            </span>
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="card flex items-center gap-3 p-3">
          {t.assignee ? <Avatar name={t.assignee.name} size={40} /> : <div className="h-10 w-10 shrink-0 rounded-full bg-[#f1f5f9]" />}
          <div className="min-w-0">
            <p className="text-xs text-[#64748b]">Atribuída a</p>
            <p className="truncate font-semibold">{t.assignee ? (t.assignee.id === user?.id ? 'Você' : t.assignee.name) : 'Ninguém'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 p-3">
          <Avatar name={t.owner.name} size={40} />
          <div className="min-w-0">
            <p className="text-xs text-[#64748b]">Criada por</p>
            <p className="truncate font-semibold">{t.owner.id === user?.id ? 'Você' : t.owner.name}</p>
          </div>
        </div>
      </div>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-bold">Checklist</h2>
          <span className="text-sm font-semibold text-brand">
            {t.checklistDone}/{t.checklistTotal} concluídos
          </span>
        </div>
        {t.checklistTotal > 0 && (
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(t.checklistDone / t.checklistTotal) * 100}%` }} />
          </div>
        )}
        <div className="card divide-y divide-[#eef2f7]">
          {t.checklist.map((c) => (
            <div key={c.id} className="flex items-center gap-1 pl-2">
              <button
                className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 px-2 text-left"
                disabled={busy}
                onClick={() => run(() => api.put(`/checklist/${c.id}`, { done: !c.done }))}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                    c.done ? 'border-brand bg-brand text-white' : 'border-[#cbd5e1]'
                  }`}
                >
                  {c.done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
                <span className={`min-w-0 break-words text-sm ${c.done ? 'text-[#94a3b8] line-through' : ''}`}>{c.text}</span>
              </button>
              <button
                className="icon-btn text-[#94a3b8]"
                disabled={busy}
                onClick={() => run(() => api.del(`/checklist/${c.id}`))}
                aria-label="Remover item"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <form onSubmit={addItem} className="flex items-center gap-2 p-2">
            <input className="input" placeholder="Adicionar item ao checklist" value={newItem} maxLength={200} onChange={(e) => setNewItem(e.target.value)} />
            <button className="btn-outline px-4" disabled={busy || !newItem.trim()} aria-label="Adicionar item">
              <Plus className="h-5 w-5" />
            </button>
          </form>
        </div>
      </section>

      <div className="mt-4">
        <ErrorBox message={actionError} />
      </div>

      <button
        className={`${t.done ? 'btn-outline' : 'btn-primary'} mt-6 w-full`}
        disabled={busy}
        onClick={() => run(() => api.post(`/tasks/${t.id}/toggle`, { done: !t.done }))}
      >
        {t.done ? (
          <>
            <RotateCcw className="h-5 w-5" /> Reabrir tarefa
          </>
        ) : (
          <>
            <Check className="h-5 w-5" /> Marcar como concluída
          </>
        )}
      </button>
    </div>
  );
}
