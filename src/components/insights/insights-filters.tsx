"use client";

import { Segmented, Toggle, useQueryUpdater } from "@/components/filters";
import { INSIGHT_WINDOWS, type InsightWindow } from "@/lib/insights";

export function InsightsFilters({ window, includeFixed }: { window: InsightWindow; includeFixed: boolean }) {
  const { update, pending } = useQueryUpdater();
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <Segmented label="Janela" options={INSIGHT_WINDOWS} value={window} onChange={(value) => update({ janela: value === "7" ? null : value })} />
      <Toggle checked={includeFixed} onChange={(checked) => update({ fixos: checked ? "1" : null })} label="Incluir compromissos fixos (ex.: CLT)" />
    </div>
  );
}
