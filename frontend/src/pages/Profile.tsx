import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, CircleHelp, FolderKanban, Info, LogOut, Pencil, UserRound } from 'lucide-react';
import { useApi, type Stats } from '../api';
import { useAuth } from '../auth';
import { dayKey } from '../util';
import { Avatar } from '../ui';

export default function Profile() {
  const { user, logout, unread } = useAuth();
  const nav = useNavigate();
  const { data: s } = useApi<Stats>(`/stats?today=${dayKey()}`);
  if (!user) return null;

  const items = [
    { to: '/perfil/conta', label: 'Informações da conta', icon: UserRound },
    { to: '/notificacoes', label: 'Notificações', icon: Bell, badge: unread },
    { to: '/projetos', label: 'Projetos', icon: FolderKanban },
    { to: '/ajuda', label: 'Ajuda e perguntas frequentes', icon: CircleHelp },
    { to: '/ajuda#sobre', label: 'Sobre o app', icon: Info },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-4">
        <Avatar name={user.name} size={68} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xl font-bold">{user.name}</p>
          <p className="truncate text-sm text-[#64748b]">{user.email}</p>
        </div>
        <Link to="/perfil/conta" className="icon-btn -mr-2 text-[#64748b]" aria-label="Editar perfil">
          <Pencil className="h-5 w-5" />
        </Link>
      </div>

      <div className="card mb-5 grid grid-cols-3 divide-x divide-[#eef2f7] py-4 text-center">
        {[
          ['Total', s?.total],
          ['Concluídas', s?.done],
          ['Pendentes', s?.pending],
        ].map(([label, v]) => (
          <div key={label as string} className="px-1">
            <p className="text-2xl font-bold">{v ?? '–'}</p>
            <p className="text-xs text-[#64748b]">{label}</p>
          </div>
        ))}
      </div>

      <div className="card divide-y divide-[#eef2f7]">
        {items.map((it) => (
          <Link key={it.label} to={it.to} className="flex min-h-[56px] items-center gap-3 px-4">
            <it.icon className="h-5 w-5 shrink-0 text-[#334155]" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.label}</span>
            {!!it.badge && <span className="rounded-md bg-[#ef4444] px-1.5 text-xs font-bold text-white">{it.badge}</span>}
            <ChevronRight className="h-5 w-5 shrink-0 text-[#94a3b8]" />
          </Link>
        ))}
      </div>

      <button
        className="mt-6 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-[#fca5a5] bg-white font-semibold text-[#dc2626] active:scale-[0.98]"
        onClick={() => {
          logout();
          nav('/entrar', { replace: true });
        }}
      >
        <LogOut className="h-5 w-5" /> Sair
      </button>
    </div>
  );
}
