import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { api, type User } from '../api';
import { useAuth } from '../auth';
import { ErrorBox, PageHeader } from '../ui';

function Success({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3 text-sm text-[#15803d]">
      <CheckCircle2 className="h-4 w-4 shrink-0" /> {message}
    </div>
  );
}

export default function Account() {
  const { user, setUser, refreshUnread } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [msg, setMsg] = useState({ ok: '', err: '' });
  const [busy, setBusy] = useState(false);

  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pmsg, setPmsg] = useState({ ok: '', err: '' });
  const [pbusy, setPbusy] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.put<{ user: User }>('/me', { name, email });
      setUser(r.user);
      setMsg({ ok: 'Dados atualizados.', err: '' });
    } catch (err) {
      setMsg({ ok: '', err: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setPmsg({ ok: '', err: 'A nova senha deve ter pelo menos 6 caracteres' });
    if (password !== confirm) return setPmsg({ ok: '', err: 'As senhas não conferem' });
    setPbusy(true);
    try {
      await api.put('/me/password', { current, password });
      setCurrent('');
      setPassword('');
      setConfirm('');
      setPmsg({ ok: 'Senha alterada.', err: '' });
      refreshUnread();
    } catch (err) {
      setPmsg({ ok: '', err: (err as Error).message });
    } finally {
      setPbusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Informações da conta" back />

      <form onSubmit={saveProfile} className="card space-y-4 p-4 sm:p-5">
        <h2 className="font-bold">Dados pessoais</h2>
        <label className="block">
          <span className="label">Nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required autoComplete="name" />
        </label>
        <label className="block">
          <span className="label">E-mail</span>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <ErrorBox message={msg.err} />
        <Success message={msg.ok} />
        <button className="btn-primary w-full sm:w-auto" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar dados'}
        </button>
      </form>

      <form onSubmit={savePassword} className="card mt-5 space-y-4 p-4 sm:p-5">
        <h2 className="font-bold">Alterar senha</h2>
        <label className="block">
          <span className="label">Senha atual</span>
          <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Nova senha</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </label>
          <label className="block">
            <span className="label">Confirmar nova senha</span>
            <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
          </label>
        </div>
        <ErrorBox message={pmsg.err} />
        <Success message={pmsg.ok} />
        <button className="btn-primary w-full sm:w-auto" disabled={pbusy}>
          {pbusy ? 'Salvando…' : 'Alterar senha'}
        </button>
      </form>
    </div>
  );
}
