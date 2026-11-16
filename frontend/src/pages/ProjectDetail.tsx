import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { api, useApi, type Project } from '../api';
import { useTaskList } from '../tasks';
import { Empty, ErrorBox, Menu, PageHeader, Spinner, TaskRow } from '../ui';
import { ProjectCard } from './Projects';
import ProjectModal from './ProjectModal';

export default function ProjectDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const proj = useApi<{ project: Project }>(`/projects/${id}`);
  const list = useTaskList(`/tasks?projectId=${id}`);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');

  // Progresso acompanha as tarefas marcadas nesta tela.
  const doneCount = list.tasks.filter((t) => t.done).length;
  useEffect(() => {
    if (list.data) proj.reload();
  }, [doneCount, list.tasks.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (proj.loading && !proj.data) return <Spinner />;
  if (proj.error || !proj.data)
    return (
      <div>
        <PageHeader title="Projeto" back />
        <ErrorBox message={proj.error || 'Projeto não encontrado'} onRetry={proj.reload} />
      </div>
    );
  const p = proj.data.project;

  const remove = async () => {
    if (!confirm(`Excluir o projeto "${p.name}"? As tarefas continuam existindo, só ficam sem projeto.`)) return;
    try {
      await api.del(`/projects/${p.id}`);
      nav('/projetos', { replace: true });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div>
      <PageHeader
        title={p.name}
        back
        right={
          <Menu
            items={[
              { label: 'Editar projeto', icon: <Pencil className="h-4 w-4" />, onClick: () => setEditing(true) },
              { label: 'Excluir projeto', icon: <Trash2 className="h-4 w-4" />, danger: true, onClick: remove },
            ]}
          />
        }
      />
      <ProjectCard p={p} />
      {p.description && <p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#475569]">{p.description}</p>}

      <div className="mb-3 mt-6 flex items-center justify-between">
        <h2 className="font-bold">Tarefas do projeto</h2>
        <Link to={`/tarefas/nova?projeto=${p.id}`} className="flex min-h-[44px] items-center gap-1 text-sm font-semibold text-brand">
          <Plus className="h-4 w-4" /> Adicionar
        </Link>
      </div>
      <div className="space-y-2.5">
        <ErrorBox message={error || list.error || list.actionError} />
        {list.loading && !list.data ? (
          <Spinner />
        ) : list.tasks.length ? (
          list.tasks.map((t) => <TaskRow key={t.id} task={t} onToggle={() => list.toggle(t)} onOpen={() => nav(`/tarefas/${t.id}`)} />)
        ) : (
          <Empty icon={<ClipboardList className="h-7 w-7" />} title="Nenhuma tarefa neste projeto" text="Adicione tarefas para acompanhar o progresso." />
        )}
      </div>

      {editing && (
        <ProjectModal
          project={p}
          onClose={() => setEditing(false)}
          onSaved={(np) => {
            setEditing(false);
            proj.setData({ project: np });
          }}
        />
      )}
    </div>
  );
}
