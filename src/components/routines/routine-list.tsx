"use client";

import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { formatDate, WEEKDAYS } from "@/lib/dates";
import { formatHours, STUDY_TYPE_LABELS } from "@/lib/format";
import { routineStatus, weeklyHours } from "@/lib/routines";
import type { RoutineRow } from "@/lib/services/routines";
import { ConfirmButton, IconPencil, IconTrash } from "@/components/ui";
import { useToast } from "@/components/toast";
import { RoutineFormButton } from "./routine-form";

type Option = { id: string; name: string };

const STATUS = {
  running: null,
  inactive: "inativa",
  scheduled: "agendada",
  ended: "encerrada",
} as const;

function periodLabel(routine: RoutineRow) {
  const format = (iso: string) => formatDate(iso, { day: "2-digit", month: "short", year: "numeric" });
  return routine.endDate ? `${format(routine.startDate)} até ${format(routine.endDate)}` : `desde ${format(routine.startDate)} · sem data final`;
}

export function RoutineList({ routines, categories, topics, today }: { routines: RoutineRow[]; categories: Option[]; topics: (Option & { categoryId: string | null })[]; today: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <ul className="flex flex-col gap-3">
      {routines.map((routine) => {
        const status = STATUS[routineStatus(routine, today)];
        return (
        <li key={routine.id} className={`flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4 ${status ? "opacity-60" : ""}`}>
          <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: routine.categoryColor }} />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {routine.activity} {status && <span className="ml-1 rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 uppercase">{status}</span>}
            </p>
            <p className="text-xs text-muted">
              {routine.categoryName} · {formatHours(routine.hours)}/dia{routine.studyTopicName ? ` · 🎓 ${routine.studyTopicName}` : ""}{routine.studyType ? ` · ${STUDY_TYPE_LABELS[routine.studyType]}` : ""}{routine.notes ? ` · ${routine.notes}` : ""}
            </p>
            <p className="text-xs text-muted">{periodLabel(routine)}</p>
            <div className="mt-2 flex gap-1">
              {WEEKDAYS.map((day) => (
                <span
                  key={day.value}
                  className={`w-9 rounded-md py-0.5 text-center text-[11px] font-bold ${routine.weekdays.includes(day.value) ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-300"}`}
                >
                  {day.short}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-extrabold">{formatHours(weeklyHours(routine))}</p>
            <p className="text-xs text-muted">por semana</p>
          </div>
          <div className="flex gap-1">
            <RoutineFormButton variant="ghost" categories={categories} topics={topics} initial={routine} className="p-2!">
              <IconPencil />
              <span className="sr-only">Editar {routine.activity}</span>
            </RoutineFormButton>
            <ConfirmButton
              title="Apagar rotina?"
              message={`A rotina "${routine.activity}" será apagada e todas as horas dela saem dos painéis e registros.`}
              className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
              onConfirm={async () => {
                await apiRequest(`/api/routines/${routine.id}`, { method: "DELETE" });
                toast("Rotina apagada");
                router.refresh();
              }}
            >
              <IconTrash />
              <span className="sr-only">Apagar {routine.activity}</span>
            </ConfirmButton>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
