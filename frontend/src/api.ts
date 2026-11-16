import { useCallback, useEffect, useState } from 'react';

const BASE = `${import.meta.env.BASE_URL}api`;
const TOKEN_KEY = 'tarefas:token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => (onUnauthorized = fn);

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Sem conexão com o servidor');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized();
    throw new ApiError(res.status, data.error || `Erro ${res.status}`);
  }
  return data as T;
}

export const api = {
  get: <T>(p: string) => request<T>('GET', p),
  post: <T>(p: string, b: unknown = {}) => request<T>('POST', p, b),
  put: <T>(p: string, b: unknown) => request<T>('PUT', p, b),
  del: <T>(p: string) => request<T>('DELETE', p),
};

/** Carrega um recurso da API; `reload` busca de novo sem piscar a tela. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api.get<T>(path));
      setError('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

// ---------- Tipos ----------
export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
}

export type Priority = 'low' | 'medium' | 'high';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  done: boolean;
  doneAt: string | null;
  ownerId: string;
  assigneeId: string | null;
  projectId: string | null;
  project: { id: string; name: string; color: string } | null;
  assignee: User | null;
  owner: User;
  checklist: ChecklistItem[];
  checklistDone: number;
  checklistTotal: number;
  canEdit: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  total: number;
  done: number;
  percent: number;
}

export interface Stats {
  total: number;
  done: number;
  pending: number;
  high: number;
  todayTotal: number;
  todayDone: number;
  overdue: number;
}

export interface Notification {
  id: string;
  type: 'task' | 'system';
  kind: string;
  title: string;
  body: string;
  taskId: string | null;
  read: boolean;
  createdAt: string;
}
