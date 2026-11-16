import { PrismaClient } from '@prisma/client';

// O Postgres do Hub é compartilhado (max_connections baixo): limita o pool deste app.
function dbUrl() {
  const raw = process.env.DATABASE_URL || '';
  try {
    const u = new URL(raw);
    // O Hub injeta connection_limit=10; com vários apps isso estoura o max_connections. Usa o menor.
    const max = Number(process.env.DB_POOL_SIZE) || 3;
    const current = Number(u.searchParams.get('connection_limit')) || Infinity;
    u.searchParams.set('connection_limit', String(Math.min(current, max)));
    return u.toString();
  } catch {
    return raw;
  }
}

export const prisma = new PrismaClient({ datasources: { db: { url: dbUrl() } } });

export const TZ = process.env.TZ || 'America/Sao_Paulo';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Data (YYYY-MM-DD) e minutos do dia no fuso do app. */
export function nowInTz(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export const isDay = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
export const isTime = (s) => typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
export const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
