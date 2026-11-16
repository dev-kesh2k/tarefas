import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Folder, FolderPlus, Plus, Search } from 'lucide-react';
import { useApi, type Project } from '../api';
import { projectColor } from '../util';
import { Empty, ErrorBox, PageHeader, Spinner } from '../ui';
import ProjectModal from './ProjectModal';

export function ProjectCard({ p, onClick }: { p: Project; onClick?: () => void }) {
  const c = projectColor(p.color);
  return (
    <button onClick={onClick} className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-[#dbe5f5]">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.bg} ${c.fg}`}>
        <Folder className="h-6 w-6" fill="currentColor" fillOpacity={0.15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p.name}</p>
        <p className="mt-0.5 text-xs text-[#64748b]">
          {p.total} {p.total === 1 ? 'tarefa' : 'tarefas'} • {p.done} {p.done === 1 ? 'concluída' : 'concluídas'}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]">
            <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${p.percent}%` }} />
          </div>
          <span className="w-9 text-right text-xs text-[#64748b]">{p.percent}%</span>
        </div>
      </div>
      {onClick && <ChevronRight className="h-5 w-5 shrink-0 text-[#94a3b8]" />}
    </button>
  );
}

export default function Projects() {
  const nav = useNavigate();
  const { data, error, loading, reload } = useApi<{ projects: Project[] }>('/projects');
  const [creating, setCreating] = useState(false);
  const [q, setQ] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const projects = (data?.projects || []).filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <PageHeader
        title="Projetos"
        right={
          <div className="-mr-2 flex">
            <button className="icon-btn" onClick={() => setShowSearch((s) => !s)} aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <button className="icon-btn" onClick={() => setCreating(true)} aria-label="Novo projeto">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-white">
                <Plus className="h-5 w-5" />
              </span>
            </button>
          </div>
        }
      />
      {showSearch && <input autoFocus className="input mb-3" placeholder="Buscar projeto" value={q} onChange={(e) => setQ(e.target.value)} />}

      <ErrorBox message={error} onRetry={reload} />
      {loading && !data ? (
        <Spinner />
      ) : projects.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} p={p} onClick={() => nav(`/projetos/${p.id}`)} />
          ))}
        </div>
      ) : (
        !error && (
          <Empty
            icon={<FolderPlus className="h-7 w-7" />}
            title={q ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
            text="Agrupe suas tarefas em projetos para acompanhar o progresso."
            action={
              <button className="btn-primary" onClick={() => setCreating(true)}>
                <Plus className="h-5 w-5" /> Novo projeto
              </button>
            }
          />
        )
      )}

      {creating && (
        <ProjectModal
          onClose={() => setCreating(false)}
          onSaved={(p) => {
            setCreating(false);
            nav(`/projetos/${p.id}`);
          }}
        />
      )}
    </div>
  );
}
