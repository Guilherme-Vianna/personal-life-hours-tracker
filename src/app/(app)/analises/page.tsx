import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { SeriesChart, WeekdayChart } from "@/components/dashboard/charts";
import { FocusTable, Heatmap, InsightList, KpiCard, TopActivities, WeeklyTrend } from "@/components/insights/insights-charts";
import { InsightsFilters } from "@/components/insights/insights-filters";
import { PageSkeleton } from "@/components/skeleton";
import { Card, CardTitle, EmptyState } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/dates";
import { formatHours, formatPercent } from "@/lib/format";
import { isInsightWindow } from "@/lib/insights";
import { insightsStats } from "@/lib/services/stats";

export const metadata: Metadata = { title: "Análises" };

export default function InsightsPage(props: PageProps<"/analises">) {
  return (
    <>
      <PageHeader title="Análises" subtitle="Onde está o seu foco, como ele está mudando e o que os números dizem" />
      <Suspense fallback={<PageSkeleton />}>
        <Insights searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Insights({ searchParams }: { searchParams: PageProps<"/analises">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const window = isInsightWindow(params.janela) ? params.janela : "7";
  const includeFixed = params.fixos === "1";
  const today = todayISO();
  const windowDays = Number(window);
  const stats = await insightsStats({ windowDays, includeFixed, today });
  const { kpis, range } = stats;
  const rangeLabel = `${formatDate(range.from)} a ${formatDate(range.to)}`;
  const bestDay = [...stats.rhythm].sort((a, b) => b.average - a.average)[0];

  return (
    <div className="flex flex-col gap-6">
      <InsightsFilters window={window} includeFixed={includeFixed} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard highlight label={includeFixed ? "Total de horas" : "Tempo livre investido"} value={formatHours(kpis.total.value)} detail={rangeLabel} delta={kpis.total.change} />
        <KpiCard label="Média por dia" value={formatHours(kpis.perDay.value)} detail={`considerando todos os ${windowDays} dias`} delta={kpis.perDay.change} />
        <KpiCard label="Consistência" value={formatPercent(kpis.consistency.value)} detail={`${kpis.consistency.days} de ${windowDays} dias com registro`} delta={kpis.consistency.change} />
        <KpiCard label="Sessão média" value={formatHours(kpis.session.value)} detail={`${kpis.session.count} sessões na janela`} delta={kpis.session.change} />
      </div>

      {kpis.session.count === 0 && stats.focus.length === 0 ? (
        <EmptyState title="Ainda não há dados suficientes" description="Registre algumas atividades (ou cadastre rotinas) para ver tendências e insights aqui." />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-lg font-bold">Insights</h2>
            <InsightList insights={stats.insights} />
          </section>

          <Card>
            <CardTitle>Onde está seu foco agora</CardTitle>
            <p className="-mt-2 mb-4 text-sm text-muted">
              Últimos {stats.focusDays} dias comparados aos {stats.focusDays} anteriores. Em alta/queda = variação de pelo menos 20%.
            </p>
            <FocusTable focus={stats.focus} days={stats.focusDays} />
          </Card>

          {windowDays <= 30 && (
            <Card>
              <CardTitle>Dia a dia</CardTitle>
              <SeriesChart series={stats.daily} kind="daily" />
            </Card>
          )}

          <Card>
            <CardTitle>Evolução semanal</CardTitle>
            <WeeklyTrend weekly={stats.weekly} slope={stats.weeklySlope} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card>
              <CardTitle>Mapa de atividade</CardTitle>
              <Heatmap weeks={stats.heatmap} max={stats.heatmapMax} />
            </Card>
            <Card>
              <CardTitle>Ritmo da semana</CardTitle>
              <p className="-mt-2 mb-4 text-sm text-muted">
                Média por dia da semana na janela{bestDay?.average ? ` · pico: ${bestDay.label.toLowerCase()}` : ""}.
              </p>
              <WeekdayChart data={stats.rhythm.map((day) => ({ key: String(day.value), label: day.short, hours: day.average }))} />
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <Card>
              <CardTitle>Atividades que mais ocupam seu tempo</CardTitle>
              <TopActivities items={stats.topActivities} total={kpis.total.value} />
            </Card>
            <Card className="notebook">
              <CardTitle>Resumo</CardTitle>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <Summary label="Sequência atual" value={`${stats.streak.current} dia(s)`} detail={`recorde na janela: ${stats.streak.best}`} />
                <Summary label="Frentes ativas" value={stats.effectiveCategories ? `~${stats.effectiveCategories.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}` : "—"} detail="categorias equivalentes" />
                <Summary label="Fim de semana" value={formatPercent(stats.weekendShare)} detail="das horas da janela" />
                <Summary label="Projeção do mês" value={formatHours(stats.projection.projected)} detail={`até ${formatDate(stats.projection.monthEnd)}`} />
              </dl>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold tracking-wider text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-xl font-extrabold">{value}</dd>
      <dd className="text-xs text-muted">{detail}</dd>
    </div>
  );
}
