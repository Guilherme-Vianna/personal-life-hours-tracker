import type { DashboardStats } from "@/lib/services/stats";
import { formatHours, formatPercent } from "@/lib/format";

export function StatCard({ label, value, detail, highlight = false }: { label: string; value: string; detail: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${highlight ? "chalkboard border-transparent text-chalk" : "border-border bg-surface"}`}>
      <p className={`text-[11px] font-bold tracking-wider uppercase ${highlight ? "text-chalk/70" : "text-muted"}`}>{label}</p>
      <p
        className={`mt-1.5 line-clamp-2 leading-tight font-extrabold break-words ${
          highlight ? "font-hand text-4xl sm:text-5xl" : value.length > 12 ? "text-base text-ink sm:text-lg" : "text-2xl text-ink sm:text-3xl"
        }`}
      >
        {value}
      </p>
      <p className={`mt-0.5 text-xs ${highlight ? "text-chalk/70" : "text-muted"}`}>{detail}</p>
    </div>
  );
}

export function CategoryDonut({ data, total }: { data: DashboardStats["byCategory"]; total: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const lengths = data.map((category) => (total ? (category.hours / total) * circumference : 0));
  const offsets = lengths.map((_, index) => lengths.slice(0, index).reduce((sum, length) => sum + length, 0));
  return (
    <div className="relative mx-auto size-44 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label="Distribuição de horas por categoria">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-brand-50)" strokeWidth="14" />
        {data.map((category, index) => (
          <circle
              key={category.id}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={category.color}
              strokeWidth="14"
              strokeDasharray={`${lengths[index]} ${circumference - lengths[index]}`}
              strokeDashoffset={-offsets[index]}
            >
              <title>{`${category.name}: ${formatHours(category.hours)}`}</title>
            </circle>
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold">{formatHours(total)}</span>
        <span className="text-xs text-muted">no período</span>
      </div>
    </div>
  );
}

export function CategoryTable({ data }: { data: DashboardStats["byCategory"] }) {
  const max = Math.max(...data.map((category) => category.hours), 0.01);
  return (
    <ul className="flex w-full flex-col gap-3">
      {data.map((category) => (
        <li key={category.id}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-semibold">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
              <span className="truncate">{category.name}</span>
              {category.isFixed && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 uppercase">fixo</span>}
            </span>
            <span className="shrink-0 text-muted tabular-nums">
              <strong className="text-ink">{formatHours(category.hours)}</strong> · {formatPercent(category.percent)} · {category.count} reg.
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-50">
            <div className="bar-grow h-2 rounded-full" style={{ width: `${(category.hours / max) * 100}%`, background: category.color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SeriesChart({ series, kind }: { series: DashboardStats["series"]; kind: DashboardStats["seriesKind"] }) {
  const max = Math.max(...series.map((point) => point.hours), 1);
  const step = Math.ceil(max / 4);
  const top = step * 4;
  const labelEvery = series.length > 31 ? 7 : series.length > 14 ? 3 : 1;
  return (
    <div className="flex gap-2">
      <div className="flex h-48 flex-col justify-between pb-5 text-right text-[10px] text-muted tabular-nums">
        {[4, 3, 2, 1, 0].map((i) => (
          <span key={i}>{step * i}h</span>
        ))}
      </div>
      <div className="min-w-0 flex-1 overflow-x-auto">
        <div className="relative flex h-48 items-end gap-[3px]" style={{ minWidth: series.length * 10 }}>
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-5 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-dashed border-brand-100" />
            ))}
          </div>
          {series.map((point, index) => (
            <div key={point.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="flex flex-col-reverse overflow-hidden rounded-t-md" style={{ height: `calc((100% - 1.25rem) * ${point.hours / top})` }}>
                {point.segments.map((segment) => (
                  <div key={segment.color} style={{ height: `${(segment.hours / point.hours) * 100}%`, background: segment.color }} />
                ))}
              </div>
              <span className="h-5 pt-1 text-center text-[10px] text-muted">{index % labelEvery === 0 ? (kind === "daily" ? point.label.slice(0, 2) : point.label.slice(0, 3)) : ""}</span>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-ink px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block">
                {point.label}: {formatHours(point.hours)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WeekdayChart({ data }: { data: { key: string; label: string; hours: number }[] }) {
  const max = Math.max(...data.map((day) => day.hours), 0.01);
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((day) => (
        <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] font-semibold text-muted tabular-nums">{day.hours ? formatHours(day.hours) : ""}</span>
          <div
            className={`w-full rounded-t-lg ${day.key === "0" || day.key === "6" ? "bg-pencil" : "bg-brand-500"}`}
            style={{ height: `calc((100% - 2.5rem) * ${day.hours / max})`, minHeight: day.hours ? 4 : 0 }}
          />
          <span className="text-xs font-semibold text-muted">{day.label}</span>
        </div>
      ))}
    </div>
  );
}
