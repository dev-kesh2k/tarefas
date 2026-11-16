import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, Pencil, Plus, Search, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useApi, type Project } from '../api';
import { useTaskList } from '../tasks';
import { CATEGORIES, PRIORITIES } from '../util';
import { Empty, ErrorBox, Menu, PageHeader, Spinner, TaskRow } from '../ui';

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'done', label: 'Concluídas' },
];

export default function Tasks() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const prio = params.get('prioridade') || '';
  const cat = params.get('categoria') || '';
  const proj = params.get('projeto') || '';
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(!!(prio || cat || proj));
  const projects = useApi<{ projects: Project[] }>('/projects');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const qs = new URLSearchParams();
  if (status !== 'all') qs.set('status', status);
  if (prio) qs.set('priority', prio);
  if (cat) qs.set('category', cat);
  if (proj) qs.set('projectId', proj);
  if (debounced) qs.set('q', debounced);
  const list = useTaskList(`/tasks?${qs}`);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };
  const activeFilters = [prio, cat, proj].filter(Boolean).length;

  return (
    <div>
      <PageHeader
        title="Tarefas"
        right={
          <div className="-mr-2 flex">
            <button className="icon-btn" onClick={() => setShowSearch((s) => !s)} aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <button className="icon-btn relative" onClick={() => setShowFilters((s) => !s)} aria-label="Filtros">
              <SlidersHorizontal className="h-5 w-5" />
              {activeFilters > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-brand" />}
            </button>
          </div>
        }
      />

      {showSearch && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#94a3b8]" />
          <input autoFocus className="input pl-12 pr-12" placeholder="Buscar tarefa pelo título" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#94a3b8]" onClick={() => setQ('')} aria-label="Limpar">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {showFilters && (
        <div className="card mb-3 grid gap-3 p-4 sm:grid-cols-3">
          <label>
            <span className="label">Prioridade</span>
            <select className="input" value={prio} onChange={(e) => setParam('prioridade', e.target.value)}>
              <option value="">Todas</option>
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Categoria</span>
            <select className="input" value={cat} onChange={(e) => setParam('categoria', e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Projeto</span>
            <select className="input" value={proj} onChange={(e) => setParam('projeto', e.target.value)}>
              <option value="">Todos</option>
              {projects.data?.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {activeFilters > 0 && (
            <button
              className="text-left text-sm font-semibold text-brand sm:col-span-3"
              onClick={() => {
                const p = new URLSearchParams(params);
                ['prioridade', 'categoria', 'projeto'].forEach((k) => p.delete(k));
                setParams(p, { replace: true });
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${status === t.id ? 'tab-on' : 'tab-off'}`} onClick={() => setParam('status', t.id === 'all' ? '' : t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <ErrorBox message={list.error || list.actionError} onRetry={list.error ? list.reload : undefined} />
        {list.loading && !list.data ? (
          <Spinner />
        ) : list.tasks.length ? (
          list.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              onToggle={() => list.toggle(t)}
              onOpen={() => nav(`/tarefas/${t.id}`)}
              menu={
                t.canEdit ? (
                  <Menu
                    items={[
                      { label: 'Editar', icon: <Pencil className="h-4 w-4" />, onClick: () => nav(`/tarefas/${t.id}/editar`) },
                      { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: () => list.remove(t) },
                    ]}
                  />
                ) : undefined
              }
            />
          ))
        ) : (
          !list.error && (
            <Empty
              icon={<ClipboardList className="h-7 w-7" />}
              title={debounced || activeFilters ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa aqui'}
              text={debounced || activeFilters ? 'Tente outra busca ou limpe os filtros.' : 'Toque em + para criar sua primeira tarefa.'}
              action={
                <Link to="/tarefas/nova" className="btn-primary">
                  <Plus className="h-5 w-5" /> Nova tarefa
                </Link>
              }
            />
          )
        )}
      </div>
    </div>
  );
}
