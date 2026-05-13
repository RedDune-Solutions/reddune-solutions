export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function parseIsoDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function isOverdue(prazoIso: string | null | undefined, now: Date = new Date()): boolean {
  const prazo = parseIsoDate(prazoIso);
  if (!prazo) return false;
  return startOfDay(prazo).getTime() < startOfDay(now).getTime();
}

export function isToday(prazoIso: string | null | undefined, now: Date = new Date()): boolean {
  const prazo = parseIsoDate(prazoIso);
  if (!prazo) return false;
  return startOfDay(prazo).getTime() === startOfDay(now).getTime();
}

export function daysUntil(prazoIso: string | null | undefined, now: Date = new Date()): number | null {
  const prazo = parseIsoDate(prazoIso);
  if (!prazo) return null;
  const ms = startOfDay(prazo).getTime() - startOfDay(now).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function isWithinNextDays(
  prazoIso: string | null | undefined,
  days: number,
  now: Date = new Date()
): boolean {
  const d = daysUntil(prazoIso, now);
  if (d === null) return false;
  return d > 0 && d <= days;
}

export function formatRelativeDay(prazoIso: string | null | undefined, now: Date = new Date()): string {
  const d = daysUntil(prazoIso, now);
  if (d === null) return "—";
  if (d === 0) return "Hoje";
  if (d === 1) return "Amanhã";
  if (d === -1) return "Ontem";
  if (d < 0) return `Há ${Math.abs(d)} dias`;
  return `Em ${d} dias`;
}

export function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function parseMonthKey(key: string): { year: number; monthIndex: number } | null {
  const m = key.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number.parseInt(m[1], 10);
  const monthIndex = Number.parseInt(m[2], 10) - 1;
  if (Number.isNaN(year) || monthIndex < 0 || monthIndex > 11) return null;
  return { year, monthIndex };
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function firstWeekdayOfMonth(year: number, monthIndex: number): number {
  // ISO Monday=0..Sunday=6
  const d = new Date(year, monthIndex, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
