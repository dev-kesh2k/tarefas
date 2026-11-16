import { useState } from 'react';
import { api, useApi, type Task } from './api';

/** Lista de tarefas com marcar/desmarcar otimista e erro exposto. */
export function useTaskList(path: string | null) {
  const res = useApi<{ tasks: Task[] }>(path);
  const [actionError, setActionError] = useState('');

  const replace = (t: Task) => res.setData((d) => (d ? { tasks: d.tasks.map((x) => (x.id === t.id ? t : x)) } : d));

  const toggle = async (t: Task) => {
    replace({ ...t, done: !t.done });
    try {
      const r = await api.post<{ task: Task }>(`/tasks/${t.id}/toggle`, { done: !t.done });
      replace(r.task);
      setActionError('');
    } catch (e) {
      replace(t);
      setActionError((e as Error).message);
    }
  };

  const remove = async (t: Task) => {
    if (!confirm(`Excluir a tarefa "${t.title}"?`)) return false;
    try {
      await api.del(`/tasks/${t.id}`);
      res.setData((d) => (d ? { tasks: d.tasks.filter((x) => x.id !== t.id) } : d));
      setActionError('');
      return true;
    } catch (e) {
      setActionError((e as Error).message);
      return false;
    }
  };

  return { ...res, tasks: res.data?.tasks ?? [], toggle, remove, actionError };
}
