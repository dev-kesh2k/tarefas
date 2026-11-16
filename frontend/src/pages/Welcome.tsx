import { Link } from 'react-router-dom';
import { ChevronRight, Clock, Laptop, ListChecks } from 'lucide-react';
import { Logo } from '../ui';

export default function Welcome() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center px-6 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] text-center">
      <Logo size={76} />
      <h1 className="mt-5 text-4xl font-extrabold text-brand">Tarefas</h1>
      <p className="mt-3 max-w-xs text-[#475569]">Organize tarefas, alcance metas e seja mais produtivo todos os dias.</p>

      {/* Ilustração */}
      <div className="relative my-10 flex aspect-[4/3] w-full max-w-xs items-end justify-center">
        <div className="absolute inset-x-0 bottom-0 h-3/4 rounded-t-full bg-brand-light" />
        <div className="absolute right-4 top-2 rounded-2xl bg-white p-3 shadow-lg">
          <ListChecks className="h-10 w-10 text-brand" />
        </div>
        <div className="absolute right-0 top-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand shadow-lg">
          <Clock className="h-7 w-7" />
        </div>
        <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-brand text-white shadow-xl">
          <Laptop className="h-14 w-14" />
        </div>
      </div>

      <div className="mt-auto w-full">
        <Link to="/cadastro" className="btn-primary w-full">
          Começar <ChevronRight className="h-5 w-5" />
        </Link>
        <p className="mt-5 text-sm text-[#64748b]">
          Já tem conta?{' '}
          <Link to="/entrar" className="inline-block py-2 font-semibold text-brand">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
