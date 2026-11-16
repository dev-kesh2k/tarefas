import { Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Calendar, CheckSquare, FolderKanban, Home as HomeIcon, Plus, User } from 'lucide-react';
import { useAuth } from './auth';
import { Avatar, Logo, Spinner } from './ui';
import Welcome from './pages/Welcome';
import { Login, Register } from './pages/AuthPages';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import TaskForm from './pages/TaskForm';
import TaskDetail from './pages/TaskDetail';
import CalendarPage from './pages/Calendar';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Profile from './pages/Profile';
import Account from './pages/Account';
import Notifications from './pages/Notifications';
import Help from './pages/Help';

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <Spinner className="min-h-[100dvh] items-center" />;

  if (!user)
    return (
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastro" element={<Register />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    );

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tarefas" element={<Tasks />} />
        <Route path="/tarefas/nova" element={<TaskForm />} />
        <Route path="/tarefas/:id" element={<TaskDetail />} />
        <Route path="/tarefas/:id/editar" element={<TaskForm />} />
        <Route path="/calendario" element={<CalendarPage />} />
        <Route path="/projetos" element={<Projects />} />
        <Route path="/projetos/:id" element={<ProjectDetail />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/perfil/conta" element={<Account />} />
        <Route path="/notificacoes" element={<Notifications />} />
        <Route path="/ajuda" element={<Help />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

const LINKS = [
  { to: '/', label: 'Início', icon: HomeIcon, end: true },
  { to: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { to: '/calendario', label: 'Calendário', icon: Calendar },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/perfil', label: 'Perfil', icon: User },
];

function Layout() {
  const { user, unread } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const isForm = /\/(nova|editar)$/.test(loc.pathname);
  const newTask = () => {
    const m = loc.pathname.match(/^\/projetos\/([^/]+)$/);
    nav(m ? `/tarefas/nova?projeto=${m[1]}` : '/tarefas/nova');
  };

  return (
    <div className="min-h-[100dvh] md:flex">
      {/* Menu lateral (tablet/desktop) */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-[#e8edf5] bg-white p-5 md:flex">
        <div className="mb-8 flex items-center gap-3">
          <Logo size={40} />
          <span className="text-xl font-bold text-brand">Tarefas</span>
        </div>
        <button onClick={newTask} className="btn-primary mb-6 w-full">
          <Plus className="h-5 w-5" /> Nova tarefa
        </button>
        <nav className="flex flex-col gap-1">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-light text-brand' : 'text-[#475569] hover:bg-[#f4f7fc]'
                }`
              }
            >
              <l.icon className="h-5 w-5" /> {l.label}
            </NavLink>
          ))}
          <NavLink
            to="/notificacoes"
            className={({ isActive }) =>
              `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                isActive ? 'bg-brand-light text-brand' : 'text-[#475569] hover:bg-[#f4f7fc]'
              }`
            }
          >
            <Bell className="h-5 w-5" /> Notificações
            {unread > 0 && <span className="ml-auto rounded-full bg-[#ef4444] px-2 py-0.5 text-xs text-white">{unread}</span>}
          </NavLink>
        </nav>
        {user && (
          <NavLink to="/perfil" className="mt-auto flex items-center gap-3 rounded-xl p-2 hover:bg-[#f4f7fc]">
            <Avatar name={user.name} size={38} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-[#64748b]">{user.email}</p>
            </div>
          </NavLink>
        )}
      </aside>

      <main className={`mx-auto w-full max-w-4xl min-w-0 flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 md:pb-10 md:pt-8 ${isForm ? 'pb-8' : 'pb-28'}`}>
        <Outlet />
      </main>

      {/* Barra inferior (celular) */}
      {!isForm && (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[#e8edf5] bg-white/95 backdrop-blur md:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-5 items-end px-1">
            {[LINKS[0], LINKS[1]].map((l) => (
              <BottomLink key={l.to} {...l} />
            ))}
            <div className="flex justify-center">
              <button
                onClick={newTask}
                aria-label="Nova tarefa"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_20px_rgba(37,99,235,0.45)] active:scale-95"
              >
                <Plus className="h-7 w-7" />
              </button>
            </div>
            {[LINKS[2], LINKS[4]].map((l) => (
              <BottomLink key={l.to} {...l} />
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

function BottomLink({ to, label, icon: Icon, end }: (typeof LINKS)[number]) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand' : 'text-[#94a3b8]'}`
      }
    >
      <Icon className="h-5 w-5" />
      {label}
    </NavLink>
  );
}
