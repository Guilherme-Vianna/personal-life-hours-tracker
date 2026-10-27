import { addDays, daysBetween, eachDay, startOfMonth, startOfWeek, weekdayOf, WEEKDAYS } from "./dates";
import { formatHours, formatPercent } from "./format";

export type InsightRow = {
  date: string;
  hours: number;
  activity: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
};

export type InsightWindow = "30" | "90" | "365";

export const INSIGHT_WINDOWS: { value: InsightWindow; label: string }[] = [
  { value: "30", label: "30 dias" },
  { value: "90", label: "90 dias" },
  { value: "365", label: "12 meses" },
];

export function isInsightWindow(value: unknown): value is InsightWindow {
  return INSIGHT_WINDOWS.some((option) => option.value === value);
}

type Trend = "new" | "up" | "down" | "steady" | "idle";

type FocusItem = {
  id: string;
  name: string;
  color: string;
  recent: number;
  older: number;
  windowHours: number;
  share: number;
  change: number | null;
  trend: Trend;
  spark: number[];
  lastDate: string;
  daysSince: number | null;
};

type RhythmItem = { value: number; short: string; label: string; average: number };

type Projection = { monthSoFar: number; projected: number; monthEnd: string };

const FOCUS_DAYS = 14;
const SPARK_WEEKS = 8;

const total = (rows: { hours: number }[]) => rows.reduce((sum, row) => sum + row.hours, 0);
const within = (rows: InsightRow[], from: string, to: string) => rows.filter((row) => row.date >= from && row.date <= to);
const change = (current: number, previous: number) => (previous > 0 ? (current - previous) / previous : null);

// Days needed before `today` so every block below has its full history.
export function insightsLookback(windowDays: number) {
  return Math.max(windowDays * 2, heatmapWeeks(windowDays) * 7 + 7, FOCUS_DAYS * 2, SPARK_WEEKS * 7 + 7);
}

function heatmapWeeks(windowDays: number) {
  return windowDays > 90 ? 53 : 26;
}

function seriesWeeks(windowDays: number) {
  return windowDays > 90 ? 52 : windowDays > 30 ? 13 : 8;
}

function slope(values: number[]) {
  const n = values.length;
  if (n < 3) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - meanX) * (y - meanY);
    den += (x - meanX) ** 2;
  });
  return den ? num / den : 0;
}

function streaks(activeDays: Set<string>, from: string, today: string) {
  let best = 0;
  let run = 0;
  for (const day of eachDay(from, today)) {
    run = activeDays.has(day) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  let current = 0;
  let day = activeDays.has(today) ? today : addDays(today, -1);
  while (activeDays.has(day)) {
    current += 1;
    day = addDays(day, -1);
  }
  return { current, best };
}

export function computeInsights(rows: InsightRow[], today: string, windowDays: number) {
  const curFrom = addDays(today, -(windowDays - 1));
  const prevTo = addDays(curFrom, -1);
  const prevFrom = addDays(prevTo, -(windowDays - 1));
  const current = within(rows, curFrom, today);
  const previous = within(rows, prevFrom, prevTo);

  const curTotal = total(current);
  const prevTotal = total(previous);
  const curActive = new Set(current.map((row) => row.date));
  const prevActive = new Set(previous.map((row) => row.date));

  const kpis = {
    total: { value: curTotal, change: change(curTotal, prevTotal) },
    perDay: { value: curTotal / windowDays, change: change(curTotal / windowDays, prevTotal / windowDays) },
    consistency: { value: curActive.size / windowDays, days: curActive.size, change: change(curActive.size, prevActive.size) },
    session: { value: current.length ? curTotal / current.length : 0, count: current.length, change: change(current.length ? curTotal / current.length : 0, previous.length ? prevTotal / previous.length : 0) },
  };

  const recentFrom = addDays(today, -(FOCUS_DAYS - 1));
  const olderTo = addDays(recentFrom, -1);
  const olderFrom = addDays(olderTo, -(FOCUS_DAYS - 1));
  const sparkStart = addDays(startOfWeek(today), -(SPARK_WEEKS - 1) * 7);
  const recentTotal = total(within(rows, recentFrom, today));

  const categoryMap = new Map<string, { id: string; name: string; color: string }>();
  for (const row of rows) categoryMap.set(row.categoryId, { id: row.categoryId, name: row.categoryName, color: row.categoryColor });

  const focus: FocusItem[] = [...categoryMap.values()]
    .map((category) => {
      const own = rows.filter((row) => row.categoryId === category.id);
      const recent = total(within(own, recentFrom, today));
      const older = total(within(own, olderFrom, olderTo));
      const windowHours = total(within(own, curFrom, today));
      const lastDate = own.reduce((last, row) => (row.date > last ? row.date : last), "");
      const spark = Array.from({ length: SPARK_WEEKS }, (_, i) => {
        const start = addDays(sparkStart, i * 7);
        return total(within(own, start, addDays(start, 6)));
      });
      const trend: Trend =
        recent === 0 ? "idle" : older === 0 ? "new" : recent >= older * 1.2 ? "up" : recent <= older * 0.8 ? "down" : "steady";
      return { ...category, recent, older, windowHours, share: recentTotal ? recent / recentTotal : 0, change: change(recent, older), trend, spark, lastDate, daysSince: lastDate ? daysBetween(lastDate, today) : null };
    })
    .filter((category) => category.windowHours > 0 || category.recent > 0 || category.older > 0)
    .sort((a, b) => b.recent - a.recent || b.windowHours - a.windowHours);

  const weeks = seriesWeeks(windowDays);
  const firstWeek = addDays(startOfWeek(today), -(weeks - 1) * 7);
  const weekly = Array.from({ length: weeks }, (_, i) => {
    const start = addDays(firstWeek, i * 7);
    const end = addDays(start, 6);
    return { start, hours: total(within(rows, start, end)), partial: end > today };
  }).map((week, i, all) => {
    const span = all.slice(Math.max(0, i - 3), i + 1).filter((w) => !w.partial);
    return { ...week, average: span.length ? total(span) / span.length : null };
  });
  const firstDate = rows.reduce((first, row) => (row.date < first ? row.date : first), today);
  const complete = weekly.filter((week) => !week.partial && addDays(week.start, 6) >= firstDate);
  const weeklySlope = slope(complete.map((week) => week.hours));

  const hmWeeks = heatmapWeeks(windowDays);
  const hmStart = addDays(startOfWeek(today), -(hmWeeks - 1) * 7);
  const perDay = new Map<string, number>();
  for (const row of within(rows, hmStart, today)) perDay.set(row.date, (perDay.get(row.date) ?? 0) + row.hours);
  const hmMax = Math.max(...perDay.values(), 0);
  const heatmap = Array.from({ length: hmWeeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(hmStart, w * 7 + d);
      const hours = perDay.get(date) ?? 0;
      return { date, hours, future: date > today, level: hours === 0 || !hmMax ? 0 : Math.min(4, Math.ceil((hours / hmMax) * 4)) };
    }),
  );

  const windowDates = eachDay(curFrom, today);
  const rhythm: RhythmItem[] = WEEKDAYS.map((day) => {
    const occurrences = windowDates.filter((date) => weekdayOf(date) === day.value).length;
    const hours = total(current.filter((row) => weekdayOf(row.date) === day.value));
    return { value: day.value, short: day.short, label: day.label, average: occurrences ? hours / occurrences : 0 };
  });

  const activities = new Map<string, { activity: string; color: string; categoryName: string; hours: number; sessions: number; lastDate: string }>();
  for (const row of current) {
    const key = row.activity.trim().toLowerCase();
    const item = activities.get(key) ?? { activity: row.activity, color: row.categoryColor, categoryName: row.categoryName, hours: 0, sessions: 0, lastDate: "" };
    item.hours += row.hours;
    item.sessions += 1;
    if (row.date > item.lastDate) item.lastDate = row.date;
    activities.set(key, item);
  }
  const topActivities = [...activities.values()].sort((a, b) => b.hours - a.hours).slice(0, 8);

  const shares = focus.map((category) => (curTotal ? category.windowHours / curTotal : 0));
  const effectiveCategories = shares.reduce((sum, p) => sum + p * p, 0) ? 1 / shares.reduce((sum, p) => sum + p * p, 0) : 0;

  const last28 = total(within(rows, addDays(today, -27), today)) / 28;
  const monthStart = startOfMonth(today);
  const monthEnd = addDays(startOfMonth(addDays(monthStart, 32)), -1);
  const monthSoFar = total(within(rows, monthStart, today));
  const projection: Projection = { monthSoFar, projected: monthSoFar + last28 * daysBetween(today, monthEnd), monthEnd };

  const streak = streaks(new Set(rows.map((row) => row.date)), curFrom, today);
  const weekendShare = curTotal ? total(current.filter((row) => [0, 6].includes(weekdayOf(row.date)))) / curTotal : 0;

  return {
    range: { from: curFrom, to: today, previousFrom: prevFrom, previousTo: prevTo },
    kpis,
    focus,
    weekly,
    weeklySlope,
    heatmap,
    heatmapMax: hmMax,
    rhythm,
    topActivities,
    effectiveCategories,
    projection,
    streak,
    weekendShare,
    insights: buildInsights({ curTotal, prevTotal, focus, rhythm, weeklySlope, effectiveCategories, streak, weekendShare, projection, windowDays }),
  };
}

export type Insights = ReturnType<typeof computeInsights>;

type Insight = { tone: "good" | "warn" | "info"; icon: string; title: string; detail: string };

function buildInsights({
  curTotal,
  prevTotal,
  focus,
  rhythm,
  weeklySlope,
  effectiveCategories,
  streak,
  weekendShare,
  projection,
  windowDays,
}: {
  curTotal: number;
  prevTotal: number;
  focus: FocusItem[];
  rhythm: RhythmItem[];
  weeklySlope: number;
  effectiveCategories: number;
  streak: { current: number; best: number };
  weekendShare: number;
  projection: Projection;
  windowDays: number;
}): Insight[] {
  const list: Insight[] = [];
  const periodChange = change(curTotal, prevTotal);
  if (periodChange !== null && Math.abs(periodChange) >= 0.1) {
    list.push({
      tone: periodChange > 0 ? "good" : "warn",
      icon: periodChange > 0 ? "📈" : "📉",
      title: `${periodChange > 0 ? "+" : "−"}${formatPercent(Math.abs(periodChange))} de horas vs. os ${windowDays} dias anteriores`,
      detail: `${formatHours(curTotal)} agora contra ${formatHours(prevTotal)} antes.`,
    });
  }

  const [lead] = focus;
  if (lead && lead.recent > 0) {
    list.push({ tone: "info", icon: "🎯", title: `Seu foco agora é ${lead.name}`, detail: `${formatPercent(lead.share)} das horas dos últimos ${FOCUS_DAYS} dias (${formatHours(lead.recent)}).` });
  }

  const rising = focus.filter((c) => c.trend === "up" || c.trend === "new").sort((a, b) => b.recent - b.older - (a.recent - a.older))[0];
  if (rising && rising !== lead) {
    list.push({
      tone: "good",
      icon: "🚀",
      title: rising.trend === "new" ? `${rising.name} entrou na sua rotina` : `${rising.name} está em alta`,
      detail: rising.trend === "new" ? `${formatHours(rising.recent)} nos últimos ${FOCUS_DAYS} dias, sem nada nos ${FOCUS_DAYS} anteriores.` : `${formatHours(rising.recent)} contra ${formatHours(rising.older)} nas duas semanas anteriores.`,
    });
  }

  const falling = focus.filter((c) => c.trend === "down").sort((a, b) => a.recent - a.older - (b.recent - b.older))[0];
  if (falling) {
    list.push({ tone: "warn", icon: "🔻", title: `${falling.name} perdeu espaço`, detail: `${formatHours(falling.recent)} nas últimas 2 semanas, eram ${formatHours(falling.older)}.` });
  }

  const forgotten = focus.filter((c) => c.trend === "idle" && c.daysSince !== null && c.daysSince >= 10).sort((a, b) => b.windowHours - a.windowHours)[0];
  if (forgotten) {
    list.push({ tone: "warn", icon: "💤", title: `${forgotten.name} está parado`, detail: `Último registro há ${forgotten.daysSince} dias.` });
  }

  const bestDay = [...rhythm].sort((a, b) => b.average - a.average)[0];
  if (bestDay && bestDay.average > 0) {
    list.push({ tone: "info", icon: "📅", title: `${bestDay.label} é seu dia mais forte`, detail: `Média de ${formatHours(bestDay.average)} por ${bestDay.label.toLowerCase()} no período.` });
  }

  if (Math.abs(weeklySlope) >= 0.25) {
    list.push({
      tone: weeklySlope > 0 ? "good" : "warn",
      icon: weeklySlope > 0 ? "↗️" : "↘️",
      title: `Tendência ${weeklySlope > 0 ? "de alta" : "de queda"}: ${weeklySlope > 0 ? "+" : "−"}${formatHours(Math.abs(weeklySlope))} por semana`,
      detail: "Inclinação das semanas completas do gráfico semanal.",
    });
  }

  if (effectiveCategories > 0) {
    list.push(
      effectiveCategories < 2
        ? { tone: "info", icon: "🔍", title: "Tempo bem concentrado", detail: "Praticamente tudo vai para uma só categoria." }
        : { tone: "info", icon: "🧩", title: `Equivale a ~${Math.round(effectiveCategories)} frentes ao mesmo tempo`, detail: effectiveCategories > 4 ? "Seu tempo está bem espalhado — talvez valha concentrar." : "Bom equilíbrio entre foco e variedade." },
    );
  }

  if (streak.current >= 3) {
    list.push({ tone: "good", icon: "🔥", title: `${streak.current} dias seguidos com registro`, detail: streak.best > streak.current ? `Seu recorde no período é ${streak.best}.` : "É o seu recorde no período!" });
  }

  if (weekendShare >= 0.4) {
    list.push({ tone: "info", icon: "🏖️", title: `${formatPercent(weekendShare)} das horas caem no fim de semana`, detail: "Seus dias úteis têm espaço para mais." });
  }

  if (projection.projected > 0) {
    list.push({ tone: "info", icon: "🧮", title: `Projeção do mês: ~${formatHours(projection.projected)}`, detail: `${formatHours(projection.monthSoFar)} até agora, no ritmo dos últimos 28 dias.` });
  }

  return list;
}
