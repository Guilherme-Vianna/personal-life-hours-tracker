import "server-only";
import { addDays, eachDay, MONTHS, periodRange, weekdayOf, WEEKDAYS, type Period } from "@/lib/dates";
import { listCategories } from "./categories";
import { listEntries, type EntryRow } from "./entries";

export type SeriesPoint = { key: string; label: string; hours: number; segments: { color: string; hours: number }[] };

export async function dashboardStats({ period, includeFixed, today }: { period: Period; includeFixed: boolean; today: string }) {
  const range = periodRange(period, today);
  const [allEntries, categories, lastYear] = await Promise.all([
    listEntries({ from: range.from, to: range.to, limit: 100_000 }),
    listCategories(),
    listEntries({ from: addDays(today, -366), to: today, limit: 100_000 }),
  ]);
  const rows = includeFixed ? allEntries : allEntries.filter((entry) => !entry.categoryIsFixed);

  const totalHours = rows.reduce((total, entry) => total + entry.hours, 0);
  const freeTimeHours = allEntries.filter((entry) => !entry.categoryIsFixed).reduce((total, entry) => total + entry.hours, 0);
  const activeDays = new Set(rows.map((entry) => entry.date)).size;

  const byCategory = categories
    .map((category) => {
      const own = rows.filter((entry) => entry.categoryId === category.id);
      const hours = own.reduce((total, entry) => total + entry.hours, 0);
      return { id: category.id, name: category.name, color: category.color, isFixed: category.isFixed, hours, count: own.length, percent: totalHours ? hours / totalHours : 0 };
    })
    .filter((category) => category.count > 0)
    .sort((a, b) => b.hours - a.hours);

  const byWeekday = WEEKDAYS.map((day) => ({
    key: String(day.value),
    label: day.short,
    hours: rows.filter((entry) => weekdayOf(entry.date) === day.value).reduce((total, entry) => total + entry.hours, 0),
  }));
  const weekendHours = byWeekday.filter((day) => day.key === "0" || day.key === "6").reduce((total, day) => total + day.hours, 0);

  const firstDate = range.from ?? rows.at(-1)?.date ?? today;
  const monthly = period === "year" || (period === "all" && firstDate < addDays(today, -62));
  const series = monthly ? monthlySeries(rows, firstDate, today) : dailySeries(rows, firstDate, today);

  return {
    range: { from: firstDate, to: today },
    totalHours,
    freeTimeHours,
    entriesCount: rows.length,
    activeDays,
    dailyAverage: activeDays ? totalHours / activeDays : 0,
    topCategory: byCategory[0] ?? null,
    byCategory,
    byWeekday,
    weekdayHours: totalHours - weekendHours,
    weekendHours,
    series,
    seriesKind: monthly ? ("monthly" as const) : ("daily" as const),
    streak: freeTimeStreak(lastYear, today),
  };
}

export type DashboardStats = Awaited<ReturnType<typeof dashboardStats>>;

function segmentsOf(rows: EntryRow[]) {
  const byColor = new Map<string, number>();
  for (const entry of rows) byColor.set(entry.categoryColor, (byColor.get(entry.categoryColor) ?? 0) + entry.hours);
  return [...byColor].map(([color, hours]) => ({ color, hours })).sort((a, b) => b.hours - a.hours);
}

function dailySeries(rows: EntryRow[], from: string, to: string): SeriesPoint[] {
  return eachDay(from, to).map((day) => {
    const own = rows.filter((entry) => entry.date === day);
    return {
      key: day,
      label: `${day.slice(8, 10)}/${day.slice(5, 7)}`,
      hours: own.reduce((total, entry) => total + entry.hours, 0),
      segments: segmentsOf(own),
    };
  });
}

function monthlySeries(rows: EntryRow[], from: string, to: string): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  let [year, month] = from.split("-").map(Number);
  const [endYear, endMonth] = to.split("-").map(Number);
  while (year < endYear || (year === endYear && month <= endMonth)) {
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const own = rows.filter((entry) => entry.date.startsWith(key));
    points.push({
      key,
      label: `${MONTHS[month - 1]}/${String(year).slice(2)}`,
      hours: own.reduce((total, entry) => total + entry.hours, 0),
      segments: segmentsOf(own),
    });
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return points;
}

function freeTimeStreak(rows: EntryRow[], today: string) {
  const days = new Set(rows.filter((entry) => !entry.categoryIsFixed).map((entry) => entry.date));
  let day = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
