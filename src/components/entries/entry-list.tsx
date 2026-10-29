"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { formatDayHeading, formatTimestamp } from "@/lib/dates";
import { formatHours, STUDY_TYPE_LABELS } from "@/lib/format";
import type { EntryRow } from "@/lib/services/entries";
import { ConfirmButton, IconPencil, IconTrash } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useEntryModal } from "./quick-add";

export function EntryList({ entries, today }: { entries: EntryRow[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  const { open, modal } = useEntryModal();

  const days = new Map<string, EntryRow[]>();
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);

  return (
    <div className="flex flex-col gap-5">
      {[...days].map(([day, rows]) => (
        <section key={day}>
          <header className="mb-2 flex items-baseline justify-between px-1">
            <h3 className="font-bold capitalize">{formatDayHeading(day, today)}</h3>
            <span className="text-sm font-semibold text-brand-700 tabular-nums">{formatHours(rows.reduce((t, r) => t + r.hours, 0))}</span>
          </header>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
            {rows.map((entry) => (
              <li key={entry.id} className="group flex items-center gap-3 px-4 py-3">
                <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ background: entry.categoryColor }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{entry.activity}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span>{entry.categoryName}</span>
                    {entry.studyTopicName && <span className="rounded bg-brand-50 px-1.5 font-semibold text-brand-800">🎓 {entry.studyTopicName}</span>}
                    {entry.studyType && (
                      <span className={`rounded px-1.5 font-semibold ${entry.studyType === "practice" ? "bg-pencil-soft text-amber-800" : "bg-sky-50 text-sky-800"}`}>
                        {entry.studyType === "practice" ? "🛠️" : "📖"} {STUDY_TYPE_LABELS[entry.studyType]}
                      </span>
                    )}
                    {entry.routineId && <span className="rounded bg-slate-100 px-1.5 font-semibold text-slate-600">🔁 rotina</span>}
                    {entry.notes && <span className="truncate">· {entry.notes}</span>}
                  </p>
                  {entry.createdAt && <LoggedAt createdAt={entry.createdAt} updatedAt={entry.updatedAt} />}
                </div>
                <span className="shrink-0 font-bold tabular-nums">{formatHours(entry.hours)}</span>
                {entry.routineId ? (
                  <Link href="/rotinas" aria-label={`Editar rotina ${entry.activity}`} title="Gerado pela rotina — edite em Rotinas" className="shrink-0 rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-800 sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                    <IconPencil />
                  </Link>
                ) : (
                <div className="flex shrink-0 gap-1 sm:opacity-0 sm:transition sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  <button type="button" onClick={() => open(entry)} aria-label={`Editar ${entry.activity}`} className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-800">
                    <IconPencil />
                  </button>
                  <ConfirmButton
                    title="Apagar registro?"
                    message={`"${entry.activity}" (${formatHours(entry.hours)}) será removido.`}
                    className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                    onConfirm={async () => {
                      await apiRequest(`/api/entries/${entry.id}`, { method: "DELETE" });
                      toast("Registro apagado");
                      router.refresh();
                    }}
                  >
                    <IconTrash />
                    <span className="sr-only">Apagar {entry.activity}</span>
                  </ConfirmButton>
                </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {modal}
    </div>
  );
}

function LoggedAt({ createdAt, updatedAt }: { createdAt: Date | string; updatedAt: Date | string | null }) {
  const edited = updatedAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;
  return (
    <p className="text-[11px] text-muted tabular-nums" title="Momento em que o registro foi feito no app">
      🕒 lançado em {formatTimestamp(createdAt)}
      {edited && <> · editado em {formatTimestamp(updatedAt)}</>}
    </p>
  );
}
