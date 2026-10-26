export function formatHours(hours: number) {
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}h`;
}

export function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

export function parseHours(input: string) {
  const value = Number(input.trim().replace(",", "."));
  return Number.isFinite(value) ? value : NaN;
}

export function hoursToInput(hours: number | null | undefined) {
  return hours === null || hours === undefined ? "" : String(hours).replace(".", ",");
}

export function sum<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0);
}

export const CATEGORY_COLORS = [
  "#16a34a",
  "#0d9488",
  "#65a30d",
  "#0891b2",
  "#ca8a04",
  "#ea580c",
  "#dc2626",
  "#db2777",
  "#7c3aed",
  "#2563eb",
  "#475569",
];
