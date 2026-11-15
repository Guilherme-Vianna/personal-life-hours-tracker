import Link from "next/link";
import { ViewTransition } from "react";
import { CountUp } from "@/components/count-up";
import { QuickAddButton } from "@/components/entries/quick-add";
import { ProgressBar } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { PACE_LABELS } from "@/lib/progress";
import type { TopicWithProgress } from "@/lib/services/topics";

export function PaceBadge({ pace }: { pace: TopicWithProgress["progress"]["pace"] }) {
  const { label, tone } = PACE_LABELS[pace];
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap ${tone}`}>{label}</span>;
}

export function TopicStatusBadge({ topic }: { topic: Pick<TopicWithProgress, "archivedAt" | "status" | "progress"> }) {
  if (topic.archivedAt) return <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-stone-700">Arquivado</span>;
  if (topic.status === "paused") return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-slate-600">Pausado</span>;
  return <PaceBadge pace={topic.progress.pace} />;
}

export function TopicCard({ topic, today, compact = false }: { topic: TopicWithProgress; today: string; compact?: boolean }) {
  const { progress } = topic;
  return (
    <article
      className={`lift relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-4 pt-5 shadow-card sm:p-5 sm:pt-6 ${topic.archivedAt ? "bg-stone-50/60 saturate-50" : topic.status === "paused" ? "opacity-75" : ""}`}
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: topic.color }} aria-hidden />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="max-w-full min-w-0">
          <Link href={`/estudos/${topic.id}`} className="-my-1.5 flex items-center gap-2 py-1.5 text-lg leading-snug font-bold hover:text-brand-700">
            <span className="size-3 shrink-0 rounded-full ring-4 ring-current/10" style={{ background: topic.color, color: topic.color }} />
            <ViewTransition name={`topic-name-${topic.id}`} share="morph" default="none">
              <span className="line-clamp-2 min-w-0">{topic.name}</span>
            </ViewTransition>
          </Link>
          {!compact && topic.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{topic.description}</p>}
        </div>
        <TopicStatusBadge topic={topic} />
      </div>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="font-hand text-3xl leading-none font-bold text-brand-800">
            <CountUp value={progress.percent} suffix="%" />
          </span>
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

      {topic.archivedAt && topic.archiveReason && !compact && (
        <p className="rounded-xl border border-dashed border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-700">
          <span className="font-bold">Arquivado em {formatDate(todayISO(new Date(topic.archivedAt)), { day: "2-digit", month: "short", year: "numeric" })}:</span> {topic.archiveReason}
        </p>
      )}

      {topic.status !== "completed" && !topic.archivedAt && (
        <QuickAddButton variant="secondary" className="mt-auto" preset={{ studyTopicId: topic.id, categoryId: topic.categoryId ?? undefined, activity: `Estudando ${topic.name}` }}>
          + Registrar sessão
        </QuickAddButton>
      )}
    </article>
  );
}
