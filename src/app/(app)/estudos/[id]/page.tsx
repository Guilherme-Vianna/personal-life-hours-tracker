import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { CountUp } from "@/components/count-up";
import { connection } from "next/server";
import { EntryList } from "@/components/entries/entry-list";
import { QuickAddButton } from "@/components/entries/quick-add";
import { PageSuspense } from "@/components/page-suspense";
import { ArchiveTopicButton, IconArchive } from "@/components/study/archive-topic-button";
import { DeleteTopicButton } from "@/components/study/delete-topic-button";
import { TopicStatusBadge } from "@/components/study/topic-card";
import { TopicFormButton } from "@/components/study/topic-form";
import { Card, CardTitle, EmptyState, ProgressBar } from "@/components/ui";
import { addDays, formatDate, startOfWeek, todayISO } from "@/lib/dates";
import { formatHours, STUDY_TYPE_LABELS } from "@/lib/format";
import { listCategories } from "@/lib/services/categories";
import { listEntries, type EntryRow } from "@/lib/services/entries";
import { listRoutines } from "@/lib/services/routines";
import { getTopic } from "@/lib/services/topics";

export const metadata: Metadata = { title: "Tema de estudo" };

export default function TopicPage(props: PageProps<"/estudos/[id]">) {
  return (
    <PageSuspense>
      <Topic params={props.params} />
    </PageSuspense>
  );
}

async function Topic({ params }: { params: PageProps<"/estudos/[id]">["params"] }) {
  const { id } = await params;
  await connection();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const today = todayISO();
  const [topic, sessions, categories, routines] = await Promise.all([getTopic(id, today), listEntries({ studyTopicId: id }), listCategories(), listRoutines()]);
  if (!topic) notFound();
  const linkedRoutines = routines.filter((routine) => routine.studyTopicId === id && routine.active && (!routine.endDate || routine.endDate > today)).length;
  const { progress } = topic;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/estudos" className="group -my-2 self-start py-2 text-sm font-semibold text-brand-700">
        <span className="inline-block transition-transform group-hover:-translate-x-1">←</span> <span className="group-hover:underline">Estudos</span>
      </Link>

      <div className={`chalkboard relative overflow-hidden rounded-3xl p-5 text-chalk shadow-lg sm:p-8 ${topic.archivedAt ? "grayscale-[0.6]" : ""}`}>
        <span className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full opacity-25 blur-2xl" style={{ background: topic.color }} aria-hidden />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <ViewTransition name={`topic-name-${topic.id}`} share="morph" default="none">
                <h1 className="min-w-0 font-hand text-4xl leading-none font-bold break-words sm:text-5xl">{topic.name}</h1>
              </ViewTransition>
              <TopicStatusBadge topic={topic} />
            </div>
            {topic.description && <p className="mt-2 max-w-2xl text-sm text-chalk/80">{topic.description}</p>}
          </div>
          <span className="shrink-0 font-hand text-5xl leading-none font-bold text-pencil sm:text-6xl">
            <CountUp value={progress.percent} suffix="%" />
          </span>
        </div>
        <div className="mt-6">
          <ProgressBar value={progress.percent} color="var(--color-pencil)" size="lg" label={`Progresso de ${topic.name}`} />
          <p className="mt-2 text-sm text-chalk/80">
            <strong className="text-chalk">{formatHours(progress.totalHours)}</strong> de {formatHours(topic.targetHours)} ·{" "}
            {progress.remainingHours > 0 ? `faltam ${formatHours(progress.remainingHours)}` : "meta batida! 🎉"}
          </p>
        </div>
      </div>

      {topic.archivedAt && (
        <div className="flex gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-4 text-stone-800">
          <span className="mt-0.5 text-stone-500">
            <IconArchive />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-bold">Arquivado em {formatDate(todayISO(new Date(topic.archivedAt)), { day: "2-digit", month: "long", year: "numeric" })}</p>
            {topic.archiveReason && <p className="mt-0.5 break-words">“{topic.archiveReason}”</p>}
            <p className="mt-1 text-xs text-stone-600">As horas continuam no histórico e nos totais. Desarquive para voltar a registrar sessões.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {topic.status !== "completed" && !topic.archivedAt && <QuickAddButton className="col-span-2" preset={{ studyTopicId: topic.id, categoryId: topic.categoryId ?? undefined, activity: `Estudando ${topic.name}` }}>+ Registrar sessão</QuickAddButton>}
        <TopicFormButton variant="secondary" categories={categories} initial={topic}>
          Editar tema
        </TopicFormButton>
        <ArchiveTopicButton id={topic.id} name={topic.name} archived={Boolean(topic.archivedAt)} linkedRoutines={linkedRoutines} />
        <DeleteTopicButton id={topic.id} name={topic.name} />
      </div>

      <dl className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Média semanal" value={formatHours(progress.weeklyAverage)} detail="últimas 4 semanas" />
        <Stat
          label="Previsão de término"
          value={progress.estimatedFinish ? formatDate(progress.estimatedFinish, { day: "2-digit", month: "short", year: "numeric" }) : progress.remainingHours === 0 ? "Concluído" : "—"}
          detail={progress.estimatedFinish ? "no ritmo atual" : "registre sessões para estimar"}
        />
        <Stat
          label="Prazo"
          value={topic.deadline ? formatDate(topic.deadline, { day: "2-digit", month: "short", year: "numeric" }) : "Sem prazo"}
          detail={progress.daysLeft !== null ? (progress.daysLeft >= 0 ? `${progress.daysLeft} dia(s) restantes` : `vencido há ${-progress.daysLeft} dia(s)`) : "defina um prazo ao editar"}
        />
        <Stat
          label="Ritmo necessário"
          value={progress.requiredWeeklyPace !== null ? `${formatHours(progress.requiredWeeklyPace)}/sem` : topic.weeklyGoalHours ? `${formatHours(topic.weeklyGoalHours)}/sem` : "—"}
          detail={progress.requiredWeeklyPace !== null ? "para cumprir o prazo" : topic.weeklyGoalHours ? "meta semanal" : "sem prazo nem meta semanal"}
        />
      </dl>

      <Card>
        <CardTitle>Teórico × Prático</CardTitle>
        <StudyTypeSplit sessions={sessions} />
      </Card>

      <Card>
        <CardTitle>Horas por semana (últimas 12)</CardTitle>
        <WeeklyBars sessions={sessions} today={today} goal={topic.weeklyGoalHours ?? progress.requiredWeeklyPace} />
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold">Sessões ({sessions.length})</h2>
        {sessions.length ? (
          <EntryList entries={sessions} today={today} />
        ) : (
          <EmptyState icon="✏️" title="Nenhuma sessão ainda" description="Registre sua primeira sessão de estudo para começar a encher a barra." />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="lift min-w-0 rounded-2xl border border-border bg-surface p-4 shadow-card">
      <dt className="text-[11px] font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-lg leading-tight font-extrabold sm:text-xl">{value}</dd>
      <dd className="text-xs text-muted">{detail}</dd>
    </div>
  );
}

function StudyTypeSplit({ sessions }: { sessions: EntryRow[] }) {
  const practice = sessions.filter((s) => s.studyType === "practice").reduce((t, s) => t + s.hours, 0);
  const theory = sessions.reduce((t, s) => t + s.hours, 0) - practice;
  const total = theory + practice;
  if (!total) return <p className="text-sm text-muted">Nenhuma hora registrada ainda.</p>;
  const practicePercent = (practice / total) * 100;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-4 overflow-hidden rounded-full bg-sky-200" role="img" aria-label={`${Math.round(100 - practicePercent)}% teórico, ${Math.round(practicePercent)}% prático`}>
        <div className="bg-pencil" style={{ width: `${practicePercent}%`, marginLeft: `${100 - practicePercent}%` }} />
      </div>
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
        <span>
          📖 {STUDY_TYPE_LABELS.theory}: <strong>{formatHours(theory)}</strong> ({Math.round(100 - practicePercent)}%)
        </span>
        <span>
          🛠️ {STUDY_TYPE_LABELS.practice}: <strong>{formatHours(practice)}</strong> ({Math.round(practicePercent)}%)
        </span>
      </div>
    </div>
  );
}

function WeeklyBars({ sessions, today, goal }: { sessions: EntryRow[]; today: string; goal: number | null }) {
  const current = startOfWeek(today);
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(current, (i - 11) * 7)).map((start) => {
    const end = addDays(start, 6);
    return { start, hours: sessions.filter((s) => s.date >= start && s.date <= end).reduce((t, s) => t + s.hours, 0) };
  });
  const max = Math.max(...weeks.map((week) => week.hours), goal ?? 0, 1);
  return (
    <div className="relative flex h-44 items-end gap-1 sm:gap-2">
      {goal ? (
        <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-pencil" style={{ bottom: `calc(1.25rem + (100% - 2.5rem) * ${goal / max})` }}>
          <span className="absolute -top-5 right-0 rounded bg-pencil-soft px-1.5 text-[10px] font-bold text-amber-800">meta {formatHours(goal)}</span>
        </div>
      ) : null}
      {weeks.map((week, index) => (
        <div key={week.start} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="h-4 text-[9px] font-semibold whitespace-nowrap text-muted sm:text-[10px]">
            {week.hours ? (
              <>
                {formatHours(week.hours).slice(0, -1)}
                <span className="hidden sm:inline">h</span>
              </>
            ) : (
              ""
            )}
          </span>
          <div className={`bar-rise w-full rounded-t-md ${goal && week.hours >= goal ? "bg-brand-600" : "bg-brand-300"}`} style={{ height: `calc((100% - 2.5rem) * ${week.hours / max})`, animationDelay: `${index * 35}ms` }} />
          <span className={`h-4 text-[10px] whitespace-nowrap text-muted ${(weeks.length - 1 - index) % 3 ? "max-sm:invisible" : ""}`}>{formatDate(week.start, { day: "2-digit", month: "2-digit" })}</span>
        </div>
      ))}
    </div>
  );
}
