"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { formatDayHeading, formatTimestamp } from "@/lib/dates";
import { formatHours, STUDY_TYPE_LABELS } from "@/lib/format";
import type { EntryRow } from "@/lib/services/entries";
import { ConfirmButton, dangerIconButtonClass, iconButtonClass, IconPencil, IconTrash } from "@/components/ui";
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
              <li key={entry.id} className="group flex gap-3 px-4 py-3 sm:items-center">
                <span className="w-1.5 shrink-0 self-stretch rounded-full sm:h-9 sm:self-center" style={{ background: entry.categoryColor }} />
                <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="line-clamp-2 min-w-0 font-semibold sm:line-clamp-1">{entry.activity}</p>
                    <span className="shrink-0 font-bold tabular-nums sm:hidden">{formatHours(entry.hours)}</span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted sm:mt-0">
                    <span>{entry.categoryName}</span>
                    {entry.studyTopicName && <span className="max-w-full truncate rounded bg-brand-50 px-1.5 font-semibold text-brand-800">🎓 {entry.studyTopicName}</span>}
                    {entry.studyType && (
                      <span className={`rounded px-1.5 font-semibold ${entry.studyType === "practice" ? "bg-pencil-soft text-amber-800" : "bg-sky-50 text-sky-800"}`}>
                        {entry.studyType === "practice" ? "🛠️" : "📖"} {STUDY_TYPE_LABELS[entry.studyType]}
                      </span>
                    )}
                    {entry.routineId && <span className="rounded bg-slate-100 px-1.5 font-semibold text-slate-600">🔁 rotina</span>}
                    {entry.notes && <span className="line-clamp-1 max-w-full">· {entry.notes}</span>}
                  </p>
                  {entry.createdAt && (
                    <div className="hidden sm:block">
                      <LoggedAt createdAt={entry.createdAt} updatedAt={entry.updatedAt} />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 sm:shrink-0 sm:gap-3">
                  <div className="min-w-0 sm:hidden">{entry.createdAt && <LoggedAt createdAt={entry.createdAt} updatedAt={entry.updatedAt} />}</div>
                  <span className="hidden font-bold tabular-nums sm:inline">{formatHours(entry.hours)}</span>
                {entry.routineId ? (
                  <Link href="/rotinas" aria-label={`Editar rotina ${entry.activity}`} title="Gerado pela rotina — edite em Rotinas" className={`${iconButtonClass} -mr-2 shrink-0 pointer-fine:opacity-0 pointer-fine:transition pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100 sm:mr-0`}>
                    <IconPencil />
                  </Link>
                ) : (
                <div className="-mr-2 flex shrink-0 gap-1 pointer-fine:opacity-0 pointer-fine:transition pointer-fine:group-focus-within:opacity-100 pointer-fine:group-hover:opacity-100 sm:mr-0">
                  <button type="button" onClick={() => open(entry)} aria-label={`Editar ${entry.activity}`} className={iconButtonClass}>
                    <IconPencil />
                  </button>
                  <ConfirmButton
                    title="Apagar registro?"
                    message={`"${entry.activity}" (${formatHours(entry.hours)}) será removido.`}
                    className={dangerIconButtonClass}
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
                </div>
                </div>
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
