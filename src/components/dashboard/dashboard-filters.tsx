"use client";

import { Segmented, Toggle, useQueryUpdater } from "@/components/filters";
import { PERIODS, type Period } from "@/lib/dates";

export function DashboardFilters({ period, includeFixed }: { period: Period; includeFixed: boolean }) {
  const { update, pending } = useQueryUpdater();
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Segmented label="Período" options={PERIODS} value={period} onChange={(value) => update({ periodo: value === "month" ? null : value })} />
      <Toggle checked={includeFixed} onChange={(checked) => update({ fixos: checked ? "1" : null })} label="Incluir compromissos fixos (ex.: CLT)" />
    </div>
  );
}
