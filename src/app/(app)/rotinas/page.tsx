import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { StatCard } from "@/components/dashboard/charts";
import { RoutineFormButton } from "@/components/routines/routine-form";
import { RoutineList } from "@/components/routines/routine-list";
import { PageSkeleton } from "@/components/skeleton";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { todayISO } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { routineDates, routineStatus, weeklyHours } from "@/lib/routines";
import { listCategories } from "@/lib/services/categories";
import { listRoutines } from "@/lib/services/routines";
import { listTopics } from "@/lib/services/topics";

export const metadata: Metadata = { title: "Rotinas" };

export default function RoutinesPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routines />
    </Suspense>
  );
}

async function Routines() {
  await connection();
  const today = todayISO();
  const [routines, categories, topics] = await Promise.all([listRoutines(), listCategories(), listTopics(today)]);
  const topicOptions = topics.filter((topic) => topic.status !== "completed").map((topic) => ({ id: topic.id, name: topic.name }));
  const active = routines.filter((routine) => routineStatus(routine, today) === "running");
  const accumulated = routines.reduce((total, routine) => total + routineDates(routine, routine.startDate, today).length * routine.hours, 0);
  const perWeek = active.reduce((total, routine) => total + weeklyHours(routine), 0);
  const fixedIds = new Set(categories.filter((category) => category.isFixed).map((category) => category.id));
  const fixedPerWeek = active.filter((routine) => fixedIds.has(routine.categoryId)).reduce((total, routine) => total + weeklyHours(routine), 0);

  const newButton = (
    <RoutineFormButton categories={categories} topics={topicOptions}>
      + Nova rotina
    </RoutineFormButton>
  );

  return (
    <>
      <PageHeader title="Rotinas" subtitle="O que se repete toda semana entra sozinho nos painéis (CLT, treino, estudos fixos…)" action={newButton} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard highlight label="Horas por semana" value={formatHours(perWeek)} detail="carga fixa semanal" />
        <StatCard label="Estimativa mensal" value={formatHours(perWeek * 4.33)} detail="média de ~4,33 semanas" />
        <StatCard label="Compromissos fixos" value={formatHours(fixedPerWeek)} detail="por semana (ex.: CLT)" />
        <StatCard label="Já contabilizado" value={formatHours(accumulated)} detail={`${active.length} de ${routines.length} rotina(s) em vigor`} />
      </div>
      {routines.length === 0 ? (
        <EmptyState icon="🔁" title="Nenhuma rotina ainda" description="Cadastre o que se repete (ex.: Trabalho CLT, 8h, seg a sex) e as horas passam a contar sozinhas nos painéis." action={newButton} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <RoutineList routines={routines} categories={categories} topics={topicOptions} today={today} />
          <Card className="notebook xl:sticky xl:top-6 xl:self-start">
            <CardTitle>Como funciona</CardTitle>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li>🔁 Cada rotina vale de <strong className="text-ink">Começa em</strong> até <strong className="text-ink">Termina em</strong> (ou para sempre, se ficar em branco).</li>
              <li>📊 Nos dias marcados, as horas entram automaticamente em Painel, Registros e Estudos — só até hoje, nada é lançado no futuro.</li>
              <li>✏️ Mudou o horário? Edite a rotina e todos os totais são recalculados.</li>
              <li>⏸️ Desativar ou apagar a rotina remove as horas dela de tudo. Seus registros manuais não são afetados.</li>
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
