import { formatDate } from "@/lib/dates";
import { formatHours, formatPercent } from "@/lib/format";
import type { Insights } from "@/lib/insights";

export function Delta({ value, suffix = "vs. período anterior" }: { value: number | null; suffix?: string }) {
  if (value === null) return <span className="text-xs text-muted">sem base de comparação</span>;
  const up = value > 0.005;
  const down = value < -0.005;
  return (
    <span className="inline-flex flex-wrap items-center gap-1 text-xs">
      <span className={`rounded-md px-1.5 py-0.5 font-bold tabular-nums ${up ? "bg-brand-100 text-brand-800" : down ? "bg-danger-soft text-danger" : "bg-slate-100 text-slate-600"}`}>
        {up ? "▲" : down ? "▼" : "■"} {up ? "+" : down ? "−" : ""}
        {formatPercent(Math.abs(value))}
      </span>
      <span className="text-muted">{suffix}</span>
    </span>
  );
}

export function KpiCard({ label, value, detail, delta, highlight = false }: { label: string; value: string; detail: string; delta: number | null; highlight?: boolean }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-2xl border p-4 sm:p-5 ${highlight ? "chalkboard border-transparent text-chalk" : "border-border bg-surface"}`}>
      <p className={`text-[11px] font-bold tracking-wider uppercase ${highlight ? "text-chalk/70" : "text-muted"}`}>{label}</p>
      <p className={`leading-tight font-extrabold ${highlight ? "font-hand text-4xl sm:text-5xl" : "text-2xl text-ink sm:text-3xl"}`}>{value}</p>
      <p className={`text-xs ${highlight ? "text-chalk/70" : "text-muted"}`}>{detail}</p>
      <div className={highlight ? "[&_.text-muted]:text-chalk/70" : ""}>
        <Delta value={delta} />
      </div>
    </div>
  );
}

const TONES = {
  good: "border-brand-200 bg-brand-50",
  warn: "border-amber-200 bg-pencil-soft",
  info: "border-border bg-surface",
};

export function InsightList({ insights }: { insights: Insights["insights"] }) {
  if (!insights.length) return <p className="text-sm text-muted">Registre mais alguns dias para os insights aparecerem.</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {insights.map((insight) => (
        <li key={insight.title} className={`flex gap-3 rounded-2xl border p-4 ${TONES[insight.tone]}`}>
          <span className="text-2xl leading-none" aria-hidden>
            {insight.icon}
          </span>
          <div className="min-w-0">
            <p className="leading-snug font-bold">{insight.title}</p>
            <p className="mt-0.5 text-sm text-muted">{insight.detail}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

const TREND = {
  up: { label: "em alta", icon: "▲", className: "bg-brand-100 text-brand-800" },
  new: { label: "novo", icon: "✦", className: "bg-brand-100 text-brand-800" },
  down: { label: "em queda", icon: "▼", className: "bg-danger-soft text-danger" },
  steady: { label: "estável", icon: "■", className: "bg-slate-100 text-slate-600" },
  idle: { label: "parado", icon: "○", className: "bg-slate-100 text-slate-500" },
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 0.01);
  const width = 96;
  const height = 28;
  const step = width / (values.length - 1 || 1);
  const points = values.map((value, i) => `${(i * step).toFixed(1)},${(height - 2 - (value / max) * (height - 4)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-24 shrink-0 overflow-visible" role="img" aria-label={`Últimas ${values.length} semanas: ${values.map(formatHours).join(", ")}`}>
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={(values.length - 1) * step} cy={points.at(-1)!.split(",")[1]} r="3" fill={color} stroke="var(--color-surface)" strokeWidth="1.5" />
    </svg>
  );
}

export function FocusTable({ focus, days }: { focus: Insights["focus"]; days: number }) {
  const max = Math.max(...focus.map((category) => category.share), 0.01);
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-sm">
        <thead>
          <tr className="text-left text-[11px] font-bold tracking-wider text-muted uppercase">
            <th className="pb-2 font-bold">Categoria</th>
            <th className="pb-2 font-bold">Fatia ({days} dias)</th>
            <th className="pb-2 text-right font-bold">{days} dias</th>
            <th className="pb-2 text-right font-bold">Antes</th>
            <th className="pb-2 pl-4 font-bold">Tendência</th>
            <th className="pb-2 font-bold">8 semanas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {focus.map((category) => {
            const trend = TREND[category.trend];
            return (
              <tr key={category.id}>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
                    <span className="truncate">{category.name}</span>
                  </span>
                  {category.daysSince !== null && category.daysSince > 0 && <span className="pl-4.5 text-xs text-muted">último há {category.daysSince}d</span>}
                </td>
                <td className="w-40 py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-50">
                      <div className="bar-grow h-2 rounded-full" style={{ width: `${(category.share / max) * 100}%`, background: category.color }} />
                    </div>
                    <span className="w-9 text-right text-xs text-muted tabular-nums">{formatPercent(category.share)}</span>
                  </div>
                </td>
                <td className="py-2.5 text-right font-bold tabular-nums">{formatHours(category.recent)}</td>
                <td className="py-2.5 text-right text-muted tabular-nums">{formatHours(category.older)}</td>
                <td className="py-2.5 pl-4">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold whitespace-nowrap ${trend.className}`}>
                    {trend.icon} {trend.label}
                    {category.change !== null && category.trend !== "idle" && ` ${category.change > 0 ? "+" : "−"}${formatPercent(Math.abs(category.change))}`}
                  </span>
                </td>
                <td className="py-2.5">
                  <Sparkline values={category.spark} color={category.color} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function WeeklyTrend({ weekly, slope }: { weekly: Insights["weekly"]; slope: number }) {
  const max = Math.max(...weekly.map((week) => week.hours), 1);
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const labelEvery = weekly.length > 26 ? 4 : weekly.length > 13 ? 2 : 1;
  const linePoints = weekly
    .map((week, i) => (week.average === null ? null : `${((i + 0.5) / weekly.length) * 100},${100 - (week.average / top) * 100}`))
    .filter(Boolean)
    .join(" ");
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex h-52 flex-col justify-between pb-5 text-right text-[10px] text-muted tabular-nums">
          {[4, 3, 2, 1, 0].map((i) => (
            <span key={i}>{step * i}h</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-dashed border-brand-100" />
            ))}
          </div>
          <div className="relative flex h-52 items-end gap-[2px]">
            {weekly.map((week, i) => (
              <div key={week.start} className="group relative flex h-full flex-1 flex-col justify-end">
                <div
                  className={`rounded-t-[4px] ${week.partial ? "bg-brand-200" : "bg-brand-400 group-hover:bg-brand-500"}`}
                  style={{ height: `calc((100% - 1.25rem) * ${week.hours / top})`, minHeight: week.hours ? 2 : 0 }}
                />
                <span className="h-5 pt-1 text-center text-[10px] whitespace-nowrap text-muted">{i % labelEvery === 0 ? formatDate(week.start, { day: "2-digit", month: "2-digit" }) : ""}</span>
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                  Semana de {formatDate(week.start)}: <strong>{formatHours(week.hours)}</strong>
                  {week.average !== null && ` · média 4 sem.: ${formatHours(week.average)}`}
                  {week.partial && " (em andamento)"}
                </span>
              </div>
            ))}
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 h-[calc(100%-1.25rem)] w-full overflow-visible" aria-hidden>
            <polyline points={linePoints} fill="none" stroke="var(--color-ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeDasharray="5 4" />
          </svg>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand-400" /> Horas na semana
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t-2 border-dashed border-ink" /> Média móvel (4 semanas)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-brand-200" /> Semana atual (parcial)
        </span>
        <span className="ml-auto font-semibold text-ink">
          Tendência: {slope >= 0 ? "+" : "−"}
          {formatHours(Math.abs(slope))}/semana
        </span>
      </div>
    </div>
  );
}

const HEAT = ["bg-brand-50", "bg-brand-200", "bg-brand-400", "bg-brand-600", "bg-brand-800"];

export function Heatmap({ weeks, max }: { weeks: Insights["heatmap"]; max: number }) {
  const labels = ["Seg", "", "Qua", "", "Sex", "", "Dom"];
  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pt-4 text-[10px] text-muted">
          {labels.map((label, i) => (
            <span key={i} className="flex h-3 items-center">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week, w) => {
          const month = week[0].date.slice(5, 7);
          const showMonth = w === 0 || weeks[w - 1][0].date.slice(5, 7) !== month;
          return (
            <div key={week[0].date} className="flex flex-col gap-[3px]">
              <span className="h-4 text-[10px] whitespace-nowrap text-muted">{showMonth ? formatDate(week[0].date, { month: "short" }).replace(".", "") : ""}</span>
              {week.map((day) => (
                <span
                  key={day.date}
                  title={day.future ? undefined : `${formatDate(day.date, { weekday: "short", day: "2-digit", month: "short" })}: ${formatHours(day.hours)}`}
                  className={`size-3 rounded-[3px] ${day.future ? "bg-transparent" : HEAT[day.level]}`}
                />
              ))}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted">
        0h
        {HEAT.map((className) => (
          <span key={className} className={`size-3 rounded-[3px] ${className}`} />
        ))}
        {formatHours(max)}
      </div>
    </div>
  );
}

export function TopActivities({ items, total }: { items: Insights["topActivities"]; total: number }) {
  if (!items.length) return <p className="text-sm text-muted">Nada registrado na janela.</p>;
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={item.activity} className="flex items-center gap-3 text-sm">
          <span className="w-5 text-right font-bold text-muted tabular-nums">{i + 1}</span>
          <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: item.color }} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{item.activity}</p>
            <p className="text-xs text-muted">
              {item.categoryName} · {item.sessions} sessão(ões) · média {formatHours(item.hours / item.sessions)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold tabular-nums">{formatHours(item.hours)}</p>
            <p className="text-xs text-muted">{formatPercent(total ? item.hours / total : 0)}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
