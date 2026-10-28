"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { todayISO, WEEKDAYS } from "@/lib/dates";
import type { StudyType } from "@/db/schema";
import { hoursToInput, parseHours } from "@/lib/format";
import { Button, Field, inputClass, Modal } from "@/components/ui";
import { StudyTypePicker } from "@/components/entries/entry-form";
import { Toggle } from "@/components/filters";
import { useToast } from "@/components/toast";

export type RoutineDraft = {
  id?: string;
  activity: string;
  categoryId: string;
  studyTopicId: string | null;
  studyType: StudyType | null;
  hours: number;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  notes: string | null;
  active: boolean;
};

type Option = { id: string; name: string };
type TopicOption = Option & { categoryId: string | null };

export function RoutineFormButton({
  categories,
  topics,
  initial,
  children,
  variant = "primary",
  className,
}: {
  categories: Option[];
  topics: TopicOption[];
  initial?: RoutineDraft;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={variant === "ghost" ? "sm" : "md"} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={initial ? "Editar rotina" : "Nova rotina"} wide>
        <RoutineForm categories={categories} topics={topics} initial={initial} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function RoutineForm({ categories, topics, initial, onDone }: { categories: Option[]; topics: TopicOption[]; initial?: RoutineDraft; onDone: () => void }) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [activity, setActivity] = useState(initial?.activity ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [studyTopicId, setStudyTopicId] = useState(initial?.studyTopicId ?? "");
  const [studyType, setStudyType] = useState<StudyType>(initial?.studyType ?? "theory");
  const [hours, setHours] = useState(hoursToInput(initial?.hours));
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const isStudy = Boolean(studyTopicId) || topics.some((topic) => topic.categoryId && topic.categoryId === categoryId);

  function toggleDay(day: number) {
    setWeekdays((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseHours(hours);
    const local: Record<string, string> = {};
    if (!activity.trim()) local.activity = "Informe a atividade";
    if (!categoryId) local.categoryId = "Escolha uma categoria";
    if (!(parsed > 0) || parsed > 24) local.hours = "Entre 0,1 e 24";
    if (!weekdays.length) local.weekdays = "Escolha ao menos um dia";
    if (!startDate) local.startDate = "Informe o início";
    if (endDate && startDate && endDate < startDate) local.endDate = "Precisa ser depois do início";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const body = { activity, categoryId, studyTopicId: studyTopicId || null, studyType: isStudy ? studyType : null, hours: parsed, weekdays, startDate, endDate: endDate || null, notes, active };
      await apiRequest(initial?.id ? `/api/routines/${initial.id}` : "/api/routines", { method: initial?.id ? "PUT" : "POST", body });
      toast(initial ? "Rotina atualizada" : "Rotina criada");
      onDone();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError) setErrors({ ...error.fieldErrors, _: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Atividade" htmlFor={`${id}-activity`} error={errors.activity}>
        <input id={`${id}-activity`} className={inputClass} value={activity} onChange={(e) => setActivity(e.target.value)} placeholder="Ex.: Trabalho CLT, Treino, Inglês" autoFocus />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Categoria" htmlFor={`${id}-category`} error={errors.categoryId}>
          <select id={`${id}-category`} className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Escolha…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Horas por dia" htmlFor={`${id}-hours`} error={errors.hours}>
          <input id={`${id}-hours`} className={inputClass} inputMode="decimal" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="8" />
        </Field>
      </div>
      <Field label="Dias da semana" error={errors.weekdays}>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => (
            <button
              key={day.value}
              type="button"
              aria-pressed={weekdays.includes(day.value)}
              onClick={() => toggleDay(day.value)}
              className={`w-12 rounded-xl py-2 text-sm font-bold transition ${weekdays.includes(day.value) ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}
            >
              {day.short}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Começa em" htmlFor={`${id}-start`} error={errors.startDate}>
          <input id={`${id}-start`} type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Termina em" htmlFor={`${id}-end`} error={errors.endDate} hint={endDate ? undefined : "Em branco = sem data final"}>
          <div className="flex gap-2">
            <input id={`${id}-end`} type="date" className={inputClass} value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} />
            {endDate && (
              <Button variant="ghost" size="sm" onClick={() => setEndDate("")}>
                Limpar
              </Button>
            )}
          </div>
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">As horas da rotina entram automaticamente nos painéis em cada dia marcado dentro desse período (até hoje). Desativar ou apagar a rotina remove essas horas.</p>
      {topics.length > 0 && (
        <Field label="Tema de estudo (opcional)" htmlFor={`${id}-topic`}>
          <select id={`${id}-topic`} className={inputClass} value={studyTopicId} onChange={(e) => setStudyTopicId(e.target.value)}>
            <option value="">Nenhum</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      {isStudy && <StudyTypePicker value={studyType} onChange={setStudyType} error={errors.studyType} />}
      <Field label="Observações (opcional)" htmlFor={`${id}-notes`}>
        <input id={`${id}-notes`} className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: Expediente CLT" />
      </Field>
      <Toggle checked={active} onChange={setActive} label="Rotina ativa (conta nos painéis)" />
      {errors._ && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errors._}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
