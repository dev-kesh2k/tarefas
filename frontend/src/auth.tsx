import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler, type User } from './api';

interface AuthCtx {
  user: User | null;
  ready: boolean;
  unread: number;
  refreshUnread: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (u: User) => void;
}

const Ctx = createContext<AuthCtx>(null as unknown as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setUnread(0);
  }, []);

  const refreshUnread = useCallback(() => {
    if (!getToken()) return;
    api
      .get<{ count: number }>('/notifications/unread-count')
      .then((r) => setUnread(r.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return setReady(true);
    api
      .get<{ user: User }>('/me')
      .then((r) => setUser(r.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [logout]);

  // Contador de não lidas: ao entrar, a cada minuto e quando a aba volta a ficar visível.
  useEffect(() => {
    if (!user) return;
    refreshUnread();
    const id = setInterval(refreshUnread, 60_000);
    const onVis = () => document.visibilityState === 'visible' && refreshUnread();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [user?.id, refreshUnread]); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    setToken(r.token);
    setUser(r.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const r = await api.post<{ token: string; user: User }>('/auth/register', { name, email, password });
    setToken(r.token);
    setUser(r.user);
  };

  return (
    <Ctx.Provider value={{ user, ready, unread, refreshUnread, login, register, logout, setUser }}>{children}</Ctx.Provider>
  );
}
