export const TIME_ZONE = process.env.NEXT_PUBLIC_TIME_ZONE ?? "America/Sao_Paulo";

export const WEEKDAYS = [
  { value: 1, short: "Seg", label: "Segunda" },
  { value: 2, short: "Ter", label: "Terça" },
  { value: 3, short: "Qua", label: "Quarta" },
  { value: 4, short: "Qui", label: "Quinta" },
  { value: 5, short: "Sex", label: "Sexta" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 0, short: "Dom", label: "Domingo" },
] as const;

export const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

function toUTC(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number) {
  const date = toUTC(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUTC(date);
}

export function weekdayOf(iso: string) {
  return toUTC(iso).getUTCDay();
}

export function startOfWeek(iso: string) {
  const day = weekdayOf(iso);
  return addDays(iso, day === 0 ? -6 : 1 - day);
}

export function startOfMonth(iso: string) {
  return `${iso.slice(0, 7)}-01`;
}

export function daysBetween(from: string, to: string) {
  return Math.round((toUTC(to).getTime() - toUTC(from).getTime()) / 86_400_000);
}

export function eachDay(from: string, to: string) {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" }) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", ...options }).format(toUTC(iso));
}

export function formatDayHeading(iso: string, today: string) {
  if (iso === today) return "Hoje";
  if (iso === addDays(today, -1)) return "Ontem";
  return formatDate(iso, { weekday: "long", day: "2-digit", month: "long" });
}

export type Period = "week" | "month" | "30d" | "year" | "all";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "30d", label: "30 dias" },
  { value: "year", label: "Este ano" },
  { value: "all", label: "Tudo" },
];

export function isPeriod(value: unknown): value is Period {
  return PERIODS.some((period) => period.value === value);
}

export function periodRange(period: Period, today: string): { from: string | null; to: string } {
  switch (period) {
    case "week":
      return { from: startOfWeek(today), to: today };
    case "month":
      return { from: startOfMonth(today), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case "all":
      return { from: null, to: today };
  }
}
