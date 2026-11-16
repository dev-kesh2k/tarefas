import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { api, type Project } from '../api';
import { PROJECT_COLORS } from '../util';
import { ErrorBox, Modal } from '../ui';

const COLOR_LABELS: Record<string, string> = {
  blue: 'Azul',
  emerald: 'Verde',
  orange: 'Laranja',
  violet: 'Roxo',
  rose: 'Rosa',
  amber: 'Amarelo',
};

export default function ProjectModal({ project, onClose, onSaved }: { project?: Project; onClose: () => void; onSaved: (p: Project) => void }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || 'blue');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const body = { name, description, color };
      const r = project ? await api.put<{ project: Project }>(`/projects/${project.id}`, body) : await api.post<{ project: Project }>('/projects', body);
      onSaved(r.project);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={project ? 'Editar projeto' : 'Novo projeto'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Nome *</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoFocus placeholder="Ex.: Lançamento do site" />
        </label>
        <label className="block">
          <span className="label">Descrição</span>
          <textarea className="input min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="Opcional" />
        </label>
        <div>
          <span className="label">Cor</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROJECT_COLORS).map(([id, c]) => (
              <button
                type="button"
                key={id}
                onClick={() => setColor(id)}
                aria-label={COLOR_LABELS[id]}
                className={`flex h-11 w-11 items-center justify-center rounded-full ${c.dot} text-white ring-offset-2 ${color === id ? 'ring-2 ring-[#0f172a]' : ''}`}
              >
                {color === id && <Check className="h-5 w-5" />}
              </button>
            ))}
          </div>
        </div>
        <ErrorBox message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}
