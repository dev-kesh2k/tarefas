import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Check, Loader2, MoreVertical, X } from 'lucide-react';
import type { Task } from './api';
import { category, initials, isOverdue, priority, taskWhen } from './util';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center py-10 text-brand ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1 break-words">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 font-semibold underline">
          Tentar de novo
        </button>
      )}
    </div>
  );
}

export function Empty({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light text-brand">{icon}</div>
      <p className="font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-[#64748b]">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function CategoryBadge({ id, className = '' }: { id: string; className?: string }) {
  const c = category(id);
  return <span className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${c.cls} ${className}`}>{c.label}</span>;
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = ['#2563eb', '#9333ea', '#16a34a', '#ea580c', '#e11d48', '#0891b2'];
  const color = palette[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % palette.length];
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

export function PageHeader({ title, back, right, close }: { title: string; back?: boolean; close?: boolean; right?: ReactNode }) {
  const nav = useNavigate();
  const goBack = () => (window.history.length > 1 ? nav(-1) : nav('/'));
  return (
    <header className="mb-4 flex min-h-[44px] items-center gap-2">
      {(back || close) && (
        <button onClick={goBack} className="icon-btn -ml-2" aria-label="Voltar">
          {close ? <X className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
        </button>
      )}
      <h1 className={`min-w-0 flex-1 truncate font-bold ${back || close ? 'text-lg' : 'text-2xl'}`}>{title}</h1>
      {right}
    </header>
  );
}

export function CheckCircle({ done, onClick, disabled }: { done: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={done ? 'Marcar como pendente' : 'Marcar como concluída'}
      className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center"
    >
      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
          done ? 'border-[#22c55e] bg-[#22c55e] text-white' : 'border-[#cbd5e1] bg-white'
        }`}
      >
        {done && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function TaskRow({
  task,
  onToggle,
  onOpen,
  withDay = true,
  menu,
}: {
  task: Task;
  onToggle: () => void;
  onOpen: () => void;
  withDay?: boolean;
  menu?: ReactNode;
}) {
  const overdue = isOverdue(task);
  const p = priority(task.priority);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="card flex cursor-pointer items-center gap-3 px-4 py-3 transition hover:border-[#dbe5f5]"
    >
      <CheckCircle done={task.done} onClick={onToggle} />
      <div className="min-w-0 flex-1">
        <p className={`truncate font-semibold ${task.done ? 'text-[#94a3b8] line-through' : ''}`}>{task.title}</p>
        <p className={`mt-0.5 flex flex-wrap items-center gap-x-2 text-xs ${overdue ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>
          <span>{taskWhen(task, withDay)}</span>
          {task.priority === 'high' && !task.done && <span className={`font-semibold ${p.text}`}>• Alta</span>}
          {task.checklistTotal > 0 && (
            <span>
              • {task.checklistDone}/{task.checklistTotal}
            </span>
          )}
          {task.project && <span className="truncate">• {task.project.name}</span>}
        </p>
      </div>
      <CategoryBadge id={task.category} />
      {menu}
    </div>
  );
}

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  danger?: boolean;
  onClick: () => void;
}

export function Menu({ items, className = '' }: { items: MenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | TouchEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('touchstart', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('touchstart', close);
    };
  }, [open]);
  if (!items.length) return null;
  return (
    <div ref={ref} className={`relative ${className}`} onClick={(e) => e.stopPropagation()}>
      <button className="icon-btn -mr-2 text-[#64748b]" onClick={() => setOpen((o) => !o)} aria-label="Mais opções">
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-30 min-w-[170px] overflow-hidden rounded-xl border border-[#e5eaf2] bg-white py-1 shadow-xl">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex min-h-[44px] w-full items-center gap-2 px-4 text-left text-sm font-medium hover:bg-[#f4f7fc] ${
                it.danger ? 'text-[#dc2626]' : ''
              }`}
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button className="icon-btn -mr-2" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Logo({ size = 72 }: { size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-[22%] bg-brand text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)]"
      style={{ width: size, height: size }}
    >
      <div className="flex items-center justify-center rounded-[20%] border-[3px] border-white" style={{ width: size * 0.5, height: size * 0.5 }}>
        <Check style={{ width: size * 0.32, height: size * 0.32 }} strokeWidth={3.5} />
      </div>
    </div>
  );
}
