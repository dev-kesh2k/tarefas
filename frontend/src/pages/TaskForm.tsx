import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Check, Flag, Plus, X } from 'lucide-react';
import { api, useApi, type Priority, type Project, type Task, type User } from '../api';
import { useAuth } from '../auth';
import { CATEGORIES, PRIORITIES, dayKey } from '../util';
import { ErrorBox, PageHeader, Spinner } from '../ui';

export default function TaskForm() {
  const { id } = useParams();
  const editing = !!id;
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const existing = useApi<{ task: Task }>(editing ? `/tasks/${id}` : null);
  const projects = useApi<{ projects: Project[] }>('/projects');
  const users = useApi<{ users: User[] }>('/users');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('trabalho');
  const [projectId, setProjectId] = useState(params.get('projeto') || '');
  const [prio, setPrio] = useState<Priority>('medium');
  const [date, setDate] = useState(params.get('data') || dayKey());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = existing.data?.task;
    if (!t) return;
    setTitle(t.title);
    setDescription(t.description);
    setCategory(t.category);
    setProjectId(t.projectId || '');
    setPrio(t.priority);
    setDate(t.date || '');
    setStartTime(t.startTime || '');
    setEndTime(t.endTime || '');
    setAssigneeId(t.assigneeId || '');
  }, [existing.data]);

  const addItem = () => {
    const v = newItem.trim();
    if (!v) return;
    setItems((l) => [...l, v]);
    setNewItem('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError('Informe o título da tarefa');
    if (endTime && !startTime) return setError('Informe o horário de início');
    if (startTime && endTime && endTime < startTime) return setError('O término deve ser depois do início');
    setBusy(true);
    setError('');
    const body = {
      title,
      description,
      category,
      priority: prio,
      projectId: projectId || null,
      date: date || null,
      startTime: date ? startTime || null : null,
      endTime: date ? endTime || null : null,
      assigneeId: assigneeId || null,
      ...(editing ? {} : { checklist: newItem.trim() ? [...items, newItem.trim()] : items }),
    };
    try {
      const r = editing ? await api.put<{ task: Task }>(`/tasks/${id}`, body) : await api.post<{ task: Task }>('/tasks', body);
      nav(`/tarefas/${r.task.id}`, { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  if (editing && existing.loading && !existing.data) return <Spinner />;
  if (editing && existing.error) return <ErrorBox message={existing.error} onRetry={existing.reload} />;
  if (editing && existing.data && !existing.data.task.canEdit)
    return <ErrorBox message="Só quem criou a tarefa pode editá-la." />;

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl">
      <PageHeader title={editing ? 'Editar tarefa' : 'Nova tarefa'} close />

      <div className="space-y-5">
        <label className="block">
          <span className="label">
            Título <span className="text-[#ef4444]">*</span>
          </span>
          <input className="input" placeholder="Digite o título da tarefa" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} required autoFocus={!editing} />
        </label>

        <label className="block">
          <span className="label">Descrição</span>
          <textarea
            className="input min-h-[110px] resize-y"
            placeholder="Adicione uma descrição (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={4000}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label">Categoria</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Projeto</span>
            <select className="input" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">Sem projeto</option>
              {projects.data?.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <span className="label">Prioridade</span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => setPrio(p.id)}
                className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition ${
                  prio === p.id ? p.on : 'border-[#e2e8f0] bg-white text-[#475569]'
                }`}
              >
                <Flag className="h-4 w-4" /> {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="label">Data e horário</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <input type="date" className="input col-span-2 sm:col-span-1" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Data" />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} disabled={!date} aria-label="Início" />
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} disabled={!date || !startTime} aria-label="Término" />
          </div>
          <p className="mt-1 text-xs text-[#64748b]">Início e término são opcionais. Você recebe um lembrete 15 min antes do início.</p>
          {date && (
            <button type="button" className="mt-1 py-1 text-xs font-semibold text-brand" onClick={() => (setDate(''), setStartTime(''), setEndTime(''))}>
              Remover data
            </button>
          )}
        </div>

        <label className="block">
          <span className="label">Atribuir a</span>
          <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Ninguém (opcional)</option>
            {users.data?.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === user?.id ? `${u.name} (você)` : u.name}
              </option>
            ))}
          </select>
        </label>

        {!editing && (
          <div>
            <span className="label">Checklist</span>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white pl-4">
                  <span className="min-w-0 flex-1 break-words py-2 text-sm">{it}</span>
                  <button type="button" className="icon-btn text-[#94a3b8]" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} aria-label="Remover item">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="Adicionar item"
                  value={newItem}
                  maxLength={200}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addItem();
                    }
                  }}
                />
                <button type="button" className="btn-outline px-4" onClick={addItem} aria-label="Adicionar item">
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <ErrorBox message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          <Check className="h-5 w-5" /> {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
