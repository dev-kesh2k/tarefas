import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, CheckCheck, CheckCircle2, FolderKanban, Shield, Sparkles, Trash2, UserPlus, XCircle } from 'lucide-react';
import { api, useApi, type Notification } from '../api';
import { useAuth } from '../auth';
import { timeAgo } from '../util';
import { Empty, ErrorBox, PageHeader, Spinner } from '../ui';

const TABS = [
  { id: '', label: 'Todas' },
  { id: 'task', label: 'Tarefas' },
  { id: 'system', label: 'Sistema' },
];

const ICONS: Record<string, { icon: typeof Bell; cls: string }> = {
  done: { icon: CheckCircle2, cls: 'bg-[#e8f8ef] text-[#16a34a]' },
  assigned: { icon: UserPlus, cls: 'bg-[#eaf1ff] text-[#2563eb]' },
  reminder: { icon: BellRing, cls: 'bg-[#f3e8ff] text-[#9333ea]' },
  deleted: { icon: XCircle, cls: 'bg-[#fef2f2] text-[#dc2626]' },
  project: { icon: FolderKanban, cls: 'bg-[#eaf1ff] text-[#2563eb]' },
  welcome: { icon: Sparkles, cls: 'bg-[#fff7e6] text-[#d97706]' },
  security: { icon: Shield, cls: 'bg-[#f1f5f9] text-[#475569]' },
};

export default function Notifications() {
  const nav = useNavigate();
  const { refreshUnread } = useAuth();
  const [tab, setTab] = useState('');
  const { data, error, loading, reload, setData } = useApi<{ notifications: Notification[] }>(`/notifications${tab ? `?type=${tab}` : ''}`);
  const [actionError, setActionError] = useState('');
  const list = data?.notifications || [];

  useEffect(() => {
    refreshUnread();
  }, [data, refreshUnread]);

  const open = async (n: Notification) => {
    if (!n.read) {
      setData((d) => (d ? { notifications: d.notifications.map((x) => (x.id === n.id ? { ...x, read: true } : x)) } : d));
      api.post(`/notifications/${n.id}/read`).then(refreshUnread).catch(() => {});
    }
    if (n.taskId) nav(`/tarefas/${n.taskId}`);
  };

  const readAll = async () => {
    try {
      await api.post('/notifications/read-all');
      setData((d) => (d ? { notifications: d.notifications.map((x) => ({ ...x, read: true })) } : d));
      refreshUnread();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const remove = async (n: Notification) => {
    try {
      await api.del(`/notifications/${n.id}`);
      setData((d) => (d ? { notifications: d.notifications.filter((x) => x.id !== n.id) } : d));
      refreshUnread();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Notificações"
        back
        right={
          list.some((n) => !n.read) && (
            <button className="icon-btn -mr-2 text-brand" onClick={readAll} aria-label="Marcar todas como lidas" title="Marcar todas como lidas">
              <CheckCheck className="h-5 w-5" />
            </button>
          )
        }
      />
      <div className="mb-4 flex gap-2">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'tab-on' : 'tab-off'}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBox message={error || actionError} onRetry={error ? reload : undefined} />
      {loading && !data ? (
        <Spinner />
      ) : list.length ? (
        <div className="card divide-y divide-[#eef2f7]">
          {list.map((n) => {
            const ic = ICONS[n.kind] || { icon: Bell, cls: 'bg-[#f1f5f9] text-[#475569]' };
            return (
              <div key={n.id} className={`flex items-start gap-3 py-3 pl-4 pr-1 ${n.read ? '' : 'bg-[#f6f9ff]'}`}>
                <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={() => open(n)}>
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ic.cls}`}>
                    <ic.icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</span>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />}
                    </span>
                    {n.body && <span className="mt-0.5 block break-words text-xs text-[#64748b]">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-[#94a3b8]">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
                <button className="icon-btn text-[#cbd5e1] hover:text-[#dc2626]" onClick={() => remove(n)} aria-label="Apagar notificação">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !error && <Empty icon={<Bell className="h-7 w-7" />} title="Nenhuma notificação" text="Avisos de tarefas atribuídas, concluídas e lembretes aparecem aqui." />
      )}
    </div>
  );
}
