import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/app-shell";
import { PageSuspense } from "@/components/page-suspense";
import { TopicCard } from "@/components/study/topic-card";
import { TopicFormButton } from "@/components/study/topic-form";
import { EmptyState, ProgressBar } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { listCategories } from "@/lib/services/categories";
import { listTopics } from "@/lib/services/topics";

export const metadata: Metadata = { title: "Estudos" };

export default function StudyPage() {
  return (
    <PageSuspense>
      <Study />
    </PageSuspense>
  );
}

async function Study() {
  await connection();
  const today = todayISO();
  const [topics, categories] = await Promise.all([listTopics(today), listCategories()]);
  const studyCategory = categories.find((category) => category.name.toLowerCase().startsWith("estud"));
  const newButton = (
    <TopicFormButton categories={categories} defaultCategoryId={studyCategory?.id}>
      + Novo tema
    </TopicFormButton>
  );

  const current = topics.filter((topic) => !topic.archivedAt);
  const archived = topics.filter((topic) => topic.archivedAt);
  const active = current.filter((topic) => topic.status === "active");
  const others = current.filter((topic) => topic.status !== "active");
  const weekHours = active.reduce((total, topic) => total + topic.progress.weekHours, 0);
  const weekGoal = active.reduce((total, topic) => total + (topic.weeklyGoalHours ?? 0), 0);

  return (
    <>
      <PageHeader title="Estudos" subtitle="Temas novos com meta de horas e barra de progresso" action={newButton} />

      {topics.length === 0 ? (
        <EmptyState
          icon="🎓"
          title="Comece um tema de estudo"
          description="Defina uma meta (ex.: 20h de Docker) e, opcionalmente, uma meta semanal e prazo. Cada sessão registrada enche a barra."
          action={newButton}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {weekGoal > 0 && (
            <div className="chalkboard flex flex-col gap-3 rounded-2xl p-5 text-chalk sm:flex-row sm:items-center sm:gap-6">
              <div className="shrink-0">
                <p className="text-xs font-bold tracking-wider text-chalk/70 uppercase">Estudos nesta semana</p>
                <p className="font-hand text-4xl font-bold">
                  {formatHours(weekHours)} <span className="text-2xl text-chalk/70">/ {formatHours(weekGoal)}</span>
                </p>
              </div>
              <div className="flex-1">
                <ProgressBar value={(weekHours / weekGoal) * 100} color="var(--color-pencil)" size="lg" label="Meta semanal de estudos" />
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((topic) => (
                <TopicCard key={topic.id} topic={topic} today={today} />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">Pausados e concluídos</h2>
              <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {others.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} today={today} />
                ))}
              </div>
            </section>
          )}

          {archived.length > 0 && (
            <details className="group" open={current.length === 0}>
              <summary className="mb-3 flex cursor-pointer list-none items-center gap-2 text-lg font-bold select-none [&::-webkit-details-marker]:hidden">
                <svg viewBox="0 0 20 20" fill="currentColor" className="size-5 text-muted transition-transform group-open:rotate-90" aria-hidden>
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                </svg>
                Arquivados
                <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-700">{archived.length}</span>
                <span className="text-sm font-normal text-muted">· {formatHours(archived.reduce((total, topic) => total + topic.progress.totalHours, 0))} estudadas</span>
              </summary>
              <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {archived.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} today={today} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </>
  );
}
