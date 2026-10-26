"use client";

import { useEffect, useState } from "react";
import { Segmented, useQueryUpdater } from "@/components/filters";
import { inputClass } from "@/components/ui";
import { PERIODS, type Period } from "@/lib/dates";

export function EntryFilters({ period, categoryId, q, categories }: { period: Period; categoryId: string; q: string; categories: { id: string; name: string }[] }) {
  const { update, pending } = useQueryUpdater();
  const [search, setSearch] = useState(q);

  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => update({ q: search }), 350);
    return () => clearTimeout(timer);
  }, [search, q, update]);

  return (
    <div className={`flex flex-col gap-3 transition-opacity xl:flex-row xl:items-center ${pending ? "opacity-60" : ""}`}>
      <Segmented label="Período" options={PERIODS} value={period} onChange={(value) => update({ periodo: value === "30d" ? null : value })} />
      <div className="flex flex-1 gap-2">
        <select aria-label="Categoria" className={`${inputClass} max-w-52`} value={categoryId} onChange={(event) => update({ categoria: event.target.value })}>
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <input type="search" aria-label="Buscar" placeholder="Buscar atividade ou observação…" className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>
    </div>
  );
}
