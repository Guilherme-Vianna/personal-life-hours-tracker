import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { PageSkeleton } from "@/components/skeleton";
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
    <Suspense fallback={<PageSkeleton />}>
      <Study />
    </Suspense>
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

  const active = topics.filter((topic) => topic.status === "active");
  const others = topics.filter((topic) => topic.status !== "active");
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {active.map((topic) => (
                <TopicCard key={topic.id} topic={topic} today={today} />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold">Pausados e concluídos</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {others.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} today={today} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}
