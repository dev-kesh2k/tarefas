import { useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../auth';
import { ErrorBox, Logo } from '../ui';

function Shell({ subtitle, children, footer }: { subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))]">
      <div className="flex flex-col items-center text-center">
        <Logo size={68} />
        <h1 className="mt-4 text-3xl font-extrabold">Tarefas</h1>
        <p className="mt-1 text-[#64748b]">{subtitle}</p>
      </div>
      <div className="mt-8">{children}</div>
      <p className="mt-auto pt-8 text-center text-sm text-[#64748b]">{footer}</p>
    </div>
  );
}

function IconInput({ icon, ...props }: { icon: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">{icon}</span>
      <input {...props} className="input pl-12" />
    </label>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
        <Lock className="h-5 w-5" />
      </span>
      <input {...props} type={show ? 'text' : 'password'} className="input px-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-[#94a3b8]"
        aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      subtitle="Entre na sua conta"
      footer={
        <>
          Não tem conta?{' '}
          <Link to="/cadastro" className="inline-block py-2 font-semibold text-brand">
            Cadastre-se
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <IconInput
          icon={<Mail className="h-5 w-5" />}
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput autoComplete="current-password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <ErrorBox message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('A senha deve ter pelo menos 8 caracteres');
    if (password !== confirm) return setError('As senhas não conferem');
    setBusy(true);
    setError('');
    try {
      await register(name, email, password);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Shell
      subtitle="Crie sua conta gratuita"
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="inline-block py-2 font-semibold text-brand">
            Entrar
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <IconInput icon={<User className="h-5 w-5" />} autoComplete="name" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <IconInput
          icon={<Mail className="h-5 w-5" />}
          type="email"
          autoComplete="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput autoComplete="new-password" placeholder="Senha (mín. 8 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <PasswordInput autoComplete="new-password" placeholder="Confirmar senha" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <ErrorBox message={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>
    </Shell>
  );
}
