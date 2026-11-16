// Listas fixas e validação dos campos recebidos (sem banco: testável).
import { HttpError } from './errors.js';

export const CATEGORIES = ['trabalho', 'design', 'geral', 'pesquisa', 'pessoal'];
export const PRIORITIES = ['low', 'medium', 'high'];
export const COLORS = ['blue', 'emerald', 'orange', 'violet', 'rose', 'amber'];
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function text(v, field, { max = 200, required = false } = {}) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw new HttpError(400, `${field} é obrigatório`);
  if (s.length > max) throw new HttpError(400, `${field} deve ter no máximo ${max} caracteres`);
  return s;
}

export function email(v) {
  const s = text(v, 'E-mail', { max: 160, required: true }).toLowerCase();
  if (!EMAIL_RE.test(s)) throw new HttpError(400, 'E-mail inválido');
  return s;
}

export function password(v) {
  if (typeof v !== 'string' || v.length < 6) throw new HttpError(400, 'A senha deve ter pelo menos 6 caracteres');
  if (v.length > 200) throw new HttpError(400, 'Senha muito longa');
  return v;
}
