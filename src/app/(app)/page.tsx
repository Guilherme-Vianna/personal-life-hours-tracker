import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { CategoryDonut, CategoryTable, SeriesChart, StatCard, WeekdayChart } from "@/components/dashboard/charts";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { QuickAddButton } from "@/components/entries/quick-add";
import { PageSkeleton } from "@/components/skeleton";
import { TopicCard } from "@/components/study/topic-card";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { formatDate, isPeriod, PERIODS, todayISO } from "@/lib/dates";
import { formatHours, formatPercent } from "@/lib/format";
import { dashboardStats } from "@/lib/services/stats";
import { listTopics } from "@/lib/services/topics";

export default function DashboardPage(props: PageProps<"/">) {
  return (
    <>
      <PageHeader title="Painel" subtitle="Para onde está indo o seu tempo livre" action={<div className="hidden lg:block"><QuickAddButton /></div>} />
      <Suspense fallback={<PageSkeleton />}>
        <Dashboard searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const period = isPeriod(params.periodo) ? params.periodo : "month";
  const includeFixed = params.fixos === "1";
  const today = todayISO();
  const [stats, topics] = await Promise.all([dashboardStats({ period, includeFixed, today }), listTopics(today)]);
  const activeTopics = topics.filter((topic) => topic.status === "active");
  const periodLabel = PERIODS.find((p) => p.value === period)!.label.toLowerCase();

  return (
    <div className="flex flex-col gap-6">
      <DashboardFilters period={period} includeFixed={includeFixed} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard highlight label={includeFixed ? "Total de horas" : "Tempo livre investido"} value={formatHours(stats.totalHours)} detail={`${periodLabel} · ${formatDate(stats.range.from)} a ${formatDate(stats.range.to)}`} />
        <StatCard label="Média diária" value={formatHours(stats.dailyAverage)} detail={`em ${stats.activeDays} dia(s) ativo(s)`} />
        <StatCard label="Maior foco" value={stats.topCategory?.name ?? "—"} detail={stats.topCategory ? `${formatHours(stats.topCategory.hours)} · ${formatPercent(stats.topCategory.percent)}` : "sem registros"} />
        <StatCard label="Sequência" value={`${stats.streak} dia${stats.streak === 1 ? "" : "s"}`} detail={`${stats.entriesCount} registros no período`} />
      </div>

      {stats.entriesCount === 0 ? (
        <EmptyState title="Nada registrado nesse período" description="Registre o que você fez no seu tempo livre e acompanhe aqui para onde suas horas estão indo." action={<QuickAddButton />} />
      ) : (
        <>
          <Card>
            <CardTitle>Distribuição por categoria</CardTitle>
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <CategoryDonut data={stats.byCategory} total={stats.totalHours} />
              <CategoryTable data={stats.byCategory} />
            </div>
          </Card>

          <Card>
            <CardTitle>{stats.seriesKind === "daily" ? "Horas por dia" : "Horas por mês"}</CardTitle>
            <SeriesChart series={stats.series} kind={stats.seriesKind} />
          </Card>

          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <Card>
              <CardTitle>Por dia da semana</CardTitle>
              <WeekdayChart data={stats.byWeekday} />
            </Card>
            <Card>
              <CardTitle>Dias úteis × fim de semana</CardTitle>
              <SplitBar weekday={stats.weekdayHours} weekend={stats.weekendHours} />
            </Card>
          </div>
        </>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Estudos em andamento</h2>
          <Link href="/estudos" className="text-sm font-semibold text-brand-700 hover:underline">
            Ver todos →
          </Link>
        </div>
        {activeTopics.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {activeTopics.slice(0, 6).map((topic) => (
              <TopicCard key={topic.id} topic={topic} today={today} compact />
            ))}
          </div>
        ) : (
          <EmptyState icon="🎓" title="Nenhum tema de estudo ativo" description="Crie um tema com uma meta de horas e acompanhe o progresso com uma barra." action={<Link href="/estudos" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">Criar tema</Link>} />
        )}
      </section>
    </div>
  );
}

function SplitBar({ weekday, weekend }: { weekday: number; weekend: number }) {
  const total = weekday + weekend || 1;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-5 overflow-hidden rounded-full">
        <div className="bg-brand-500" style={{ width: `${(weekday / total) * 100}%` }} />
        <div className="bg-pencil" style={{ width: `${(weekend / total) * 100}%` }} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="flex items-center gap-1.5 text-muted">
            <span className="size-2.5 rounded-full bg-brand-500" /> Seg a Sex
          </dt>
          <dd className="text-xl font-extrabold">{formatHours(weekday)}</dd>
          <dd className="text-xs text-muted">{formatPercent(weekday / total)}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-muted">
            <span className="size-2.5 rounded-full bg-pencil" /> Sáb e Dom
          </dt>
          <dd className="text-xl font-extrabold">{formatHours(weekend)}</dd>
          <dd className="text-xs text-muted">{formatPercent(weekend / total)}</dd>
        </div>
      </dl>
    </div>
  );
}
