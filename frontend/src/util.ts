import type { Priority, Task } from './api';

const pad = (n: number) => String(n).padStart(2, '0');

/** Data local (YYYY-MM-DD). */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseDay = (k: string) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (k: string, n: number) => {
  const d = parseDay(k);
  d.setDate(d.getDate() + n);
  return dayKey(d);
};

export const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function dayLabel(k: string) {
  const today = dayKey();
  if (k === today) return 'Hoje';
  if (k === addDays(today, 1)) return 'Amanhã';
  if (k === addDays(today, -1)) return 'Ontem';
  const d = parseDay(k);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0, 3)}${sameYear ? '' : ` ${d.getFullYear()}`}`;
}

export function longDate(k: string) {
  const d = parseDay(k);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
}

export function taskWhen(t: Pick<Task, 'date' | 'startTime' | 'endTime'>, withDay = true) {
  const time = t.startTime ? (t.endTime ? `${t.startTime} - ${t.endTime}` : t.startTime) : '';
  if (!t.date) return 'Sem data';
  if (!withDay) return time || 'Dia todo';
  return time ? `${dayLabel(t.date)} • ${time}` : dayLabel(t.date);
}

export const isOverdue = (t: Task) => !t.done && !!t.date && t.date < dayKey();

export const CATEGORIES: { id: string; label: string; cls: string }[] = [
  { id: 'trabalho', label: 'Trabalho', cls: 'bg-[#eaf1ff] text-[#2563eb]' },
  { id: 'design', label: 'Design', cls: 'bg-[#f3e8ff] text-[#9333ea]' },
  { id: 'geral', label: 'Geral', cls: 'bg-[#f1f5f9] text-[#475569]' },
  { id: 'pesquisa', label: 'Pesquisa', cls: 'bg-[#fff7e6] text-[#d97706]' },
  { id: 'pessoal', label: 'Pessoal', cls: 'bg-[#e8f8ef] text-[#16a34a]' },
];
export const category = (id: string) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[2];

export const PRIORITIES: { id: Priority; label: string; text: string; on: string }[] = [
  { id: 'low', label: 'Baixa', text: 'text-[#16a34a]', on: 'border-[#16a34a] bg-[#e8f8ef] text-[#16a34a]' },
  { id: 'medium', label: 'Média', text: 'text-[#2563eb]', on: 'border-[#2563eb] bg-[#eaf1ff] text-[#2563eb]' },
  { id: 'high', label: 'Alta', text: 'text-[#dc2626]', on: 'border-[#ef4444] bg-[#fef2f2] text-[#dc2626]' },
];
export const priority = (id: string) => PRIORITIES.find((p) => p.id === id) || PRIORITIES[1];

export const PROJECT_COLORS: Record<string, { bg: string; fg: string; bar: string; dot: string }> = {
  blue: { bg: 'bg-[#eaf1ff]', fg: 'text-[#2563eb]', bar: 'bg-[#2563eb]', dot: 'bg-[#2563eb]' },
  emerald: { bg: 'bg-[#e8f8ef]', fg: 'text-[#16a34a]', bar: 'bg-[#16a34a]', dot: 'bg-[#16a34a]' },
  orange: { bg: 'bg-[#fff1e8]', fg: 'text-[#ea580c]', bar: 'bg-[#ea580c]', dot: 'bg-[#ea580c]' },
  violet: { bg: 'bg-[#f3e8ff]', fg: 'text-[#9333ea]', bar: 'bg-[#9333ea]', dot: 'bg-[#9333ea]' },
  rose: { bg: 'bg-[#ffe9ee]', fg: 'text-[#e11d48]', bar: 'bg-[#e11d48]', dot: 'bg-[#e11d48]' },
  amber: { bg: 'bg-[#fff7e6]', fg: 'text-[#d97706]', bar: 'bg-[#d97706]', dot: 'bg-[#d97706]' },
};
export const projectColor = (c: string) => PROJECT_COLORS[c] || PROJECT_COLORS.blue;

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase() || '?';
}

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'agora';
  if (s < 3600) return `${Math.floor(s / 60)} min`;
  if (s < 86400) return `${Math.floor(s / 3600)} h`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;
