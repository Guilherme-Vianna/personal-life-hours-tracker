import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { EntryFilters } from "@/components/entries/entry-filters";
import { EntryList } from "@/components/entries/entry-list";
import { QuickAddButton } from "@/components/entries/quick-add";
import { PageSkeleton } from "@/components/skeleton";
import { EmptyState } from "@/components/ui";
import { isPeriod, periodRange, todayISO } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { listCategories } from "@/lib/services/categories";
import { listEntries } from "@/lib/services/entries";

export const metadata: Metadata = { title: "Registros" };

export default function EntriesPage(props: PageProps<"/registros">) {
  return (
    <>
      <PageHeader title="Registros" subtitle="Tudo o que você lançou, dia a dia" action={<div className="hidden lg:block"><QuickAddButton /></div>} />
      <Suspense fallback={<PageSkeleton />}>
        <Entries searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Entries({ searchParams }: { searchParams: PageProps<"/registros">["searchParams"] }) {
  const params = await searchParams;
  await connection();
  const period = isPeriod(params.periodo) ? params.periodo : "30d";
  const categoryId = typeof params.categoria === "string" ? params.categoria : "";
  const q = typeof params.q === "string" ? params.q : "";
  const today = todayISO();
  const { from, to } = periodRange(period, today);
  const [entries, categories] = await Promise.all([
    listEntries({ from, to: period === "all" ? null : to, categoryId: categoryId || null, q: q || null }),
    listCategories(),
  ]);
  const total = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="flex flex-col gap-5">
      <EntryFilters period={period} categoryId={categoryId} q={q} categories={categories} />
      <p className="text-sm text-muted">
        <strong className="text-ink">{entries.length}</strong> registro(s) · <strong className="text-ink">{formatHours(total)}</strong> no total
      </p>
      {entries.length ? (
        <EntryList entries={entries} today={today} />
      ) : (
        <EmptyState title="Nenhum registro encontrado" description="Mude os filtros ou registre uma nova atividade." action={<QuickAddButton />} />
      )}
    </div>
  );
}
