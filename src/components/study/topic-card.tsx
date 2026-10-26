import Link from "next/link";
import { QuickAddButton } from "@/components/entries/quick-add";
import { ProgressBar } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { PACE_LABELS } from "@/lib/progress";
import type { TopicWithProgress } from "@/lib/services/topics";

export function PaceBadge({ pace }: { pace: TopicWithProgress["progress"]["pace"] }) {
  const { label, tone } = PACE_LABELS[pace];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>{label}</span>;
}

export function TopicCard({ topic, today, compact = false }: { topic: TopicWithProgress; today: string; compact?: boolean }) {
  const { progress } = topic;
  return (
    <article className={`flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 ${topic.status === "paused" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/estudos/${topic.id}`} className="flex items-center gap-2 text-lg font-bold hover:text-brand-700">
            <span className="size-3 shrink-0 rounded-full" style={{ background: topic.color }} />
            <span className="truncate">{topic.name}</span>
          </Link>
          {!compact && topic.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{topic.description}</p>}
        </div>
        {topic.status === "paused" ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">Pausado</span> : <PaceBadge pace={progress.pace} />}
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-hand text-3xl leading-none font-bold text-brand-800">{Math.floor(progress.percent)}%</span>
          <span className="text-sm text-muted tabular-nums">
            <strong className="text-ink">{formatHours(progress.totalHours)}</strong> de {formatHours(topic.targetHours)}
          </span>
        </div>
        <ProgressBar value={progress.percent} color={topic.color} size="lg" label={`Progresso de ${topic.name}`} />
        <p className="mt-1.5 text-xs text-muted">
          {progress.remainingHours > 0 ? `Faltam ${formatHours(progress.remainingHours)}` : "Meta batida! 🎉"}
          {progress.estimatedFinish && ` · previsão ${formatDate(progress.estimatedFinish, { day: "2-digit", month: "short", year: "2-digit" })}`}
          {topic.deadline && ` · prazo ${formatDate(topic.deadline, { day: "2-digit", month: "short", year: "2-digit" })}`}
        </p>
      </div>

      {topic.weeklyGoalHours && progress.weekPercent !== null && (
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold">Meta da semana</span>
            <span className="text-muted tabular-nums">
              {formatHours(progress.weekHours)} de {formatHours(topic.weeklyGoalHours)}
            </span>
          </div>
          <ProgressBar value={progress.weekPercent} color="var(--color-pencil)" size="sm" label={`Meta semanal de ${topic.name}`} />
        </div>
      )}

      {!compact && (
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold text-muted uppercase">Sessões</dt>
            <dd className="font-bold">{progress.sessionsCount}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold text-muted uppercase">Média/sem</dt>
            <dd className="font-bold">{formatHours(progress.weeklyAverage)}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 px-2 py-2">
            <dt className="text-[10px] font-bold text-muted uppercase">Última</dt>
            <dd className="font-bold">{progress.lastSessionDate ? (progress.lastSessionDate === today ? "Hoje" : formatDate(progress.lastSessionDate)) : "—"}</dd>
          </div>
        </dl>
      )}

      {topic.status !== "completed" && (
        <QuickAddButton variant="secondary" className="mt-auto" preset={{ studyTopicId: topic.id, categoryId: topic.categoryId ?? undefined, activity: `Estudando ${topic.name}` }}>
          + Registrar sessão
        </QuickAddButton>
      )}
    </article>
  );
}
