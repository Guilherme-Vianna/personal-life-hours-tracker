"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiRequest, ApiClientError } from "@/lib/api-client";
import { addDays, daysBetween, formatDate } from "@/lib/dates";
import { formatHours } from "@/lib/format";
import { planRoutineEntries, type RoutineLike } from "@/lib/routines";
import { Button, Card, CardTitle, Field, inputClass } from "@/components/ui";
import { useToast } from "@/components/toast";

export function RoutineGenerator({ routines, today }: { routines: (RoutineLike & { active: boolean })[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(addDays(today, 6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = routines.filter((routine) => routine.active);
  const valid = from && to && to >= from && daysBetween(from, to) <= 366;
  const planned = valid ? planRoutineEntries(active, from, to) : [];
  const plannedHours = planned.reduce((total, entry) => total + entry.hours, 0);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const result = await apiRequest<{ created: number; skipped: number }>("/api/routines/generate", { method: "POST", body: { from, to } });
      toast(`${result.created} lançamento(s) criado(s)${result.skipped ? ` · ${result.skipped} já existiam` : ""}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Não foi possível gerar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="notebook">
      <CardTitle>Gerador de lançamentos</CardTitle>
      <p className="mb-4 text-sm text-muted">Cria registros automaticamente para as rotinas ativas no período. Lançamentos que já existem são ignorados.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="De" htmlFor="gen-from">
          <input id="gen-from" type="date" className={inputClass} value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="Até" htmlFor="gen-to">
          <input id="gen-to" type="date" className={inputClass} value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[
          { label: "Esta semana", days: 6 },
          { label: "15 dias", days: 14 },
          { label: "30 dias", days: 29 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setFrom(today);
              setTo(addDays(today, preset.days));
            }}
            className="rounded-lg bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-brand-100"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm">
        {valid ? (
          <>
            <strong>{planned.length}</strong> lançamento(s) · <strong>{formatHours(plannedHours)}</strong> entre {formatDate(from)} e {formatDate(to)}
          </>
        ) : (
          <span className="text-danger">Período inválido (máx. 1 ano).</span>
        )}
      </div>
      {error && <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
      <Button className="mt-4 w-full" disabled={!valid || !planned.length || busy} onClick={generate}>
        {busy ? "Gerando…" : "Gerar lançamentos"}
      </Button>
    </Card>
  );
}
