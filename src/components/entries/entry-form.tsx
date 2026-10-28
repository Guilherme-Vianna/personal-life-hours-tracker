"use client";

import { useId, useState, type FormEvent } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { addDays } from "@/lib/dates";
import type { StudyType } from "@/db/schema";
import { hoursToInput, parseHours, STUDY_TYPE_LABELS } from "@/lib/format";
import { Button, Field, inputClass } from "@/components/ui";

export type CategoryOption = { id: string; name: string; color: string };
export type TopicOption = { id: string; name: string; categoryId: string | null; status: string };
export type SuggestionOption = { activity: string; categoryId: string; studyTopicId: string | null; studyType: StudyType | null };

export type EntryDraft = {
  id?: string;
  date: string;
  activity: string;
  categoryId: string;
  hours: number | null;
  notes: string | null;
  studyTopicId: string | null;
  studyType: StudyType | null;
};

const HOUR_CHIPS = [0.5, 1, 1.5, 2, 3, 4];

export function EntryForm({
  categories,
  topics,
  suggestions,
  today,
  initial,
  onDone,
}: {
  categories: CategoryOption[];
  topics: TopicOption[];
  suggestions: SuggestionOption[];
  today: string;
  initial?: Partial<EntryDraft>;
  onDone: (message: string) => void;
}) {
  const id = useId();
  const editing = Boolean(initial?.id);
  const [date, setDate] = useState(initial?.date ?? today);
  const [activity, setActivity] = useState(initial?.activity ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [hours, setHours] = useState(hoursToInput(initial?.hours));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [studyTopicId, setStudyTopicId] = useState(initial?.studyTopicId ?? "");
  const [studyType, setStudyType] = useState<StudyType>(initial?.studyType ?? "theory");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const activeTopics = topics.filter((topic) => topic.status !== "completed" || topic.id === studyTopicId);
  const isStudy = Boolean(studyTopicId) || topics.some((topic) => topic.categoryId && topic.categoryId === categoryId);

  function pickActivity(value: string) {
    setActivity(value);
    const match = suggestions.find((s) => s.activity.toLowerCase() === value.trim().toLowerCase());
    if (match) {
      setCategoryId(match.categoryId);
      if (match.studyTopicId) setStudyTopicId(match.studyTopicId);
      if (match.studyType) setStudyType(match.studyType);
    }
  }

  function pickTopic(value: string) {
    setStudyTopicId(value);
    const topic = topics.find((t) => t.id === value);
    if (topic?.categoryId && !categoryId) setCategoryId(topic.categoryId);
  }

  async function submit(event: FormEvent<HTMLFormElement>, keepOpen = false) {
    event.preventDefault();
    const parsed = parseHours(hours);
    const local: Record<string, string> = {};
    if (!activity.trim()) local.activity = "Informe a atividade";
    if (!categoryId) local.categoryId = "Escolha uma categoria";
    if (!(parsed > 0) || parsed > 24) local.hours = "Use um valor entre 0,1 e 24";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const body = { date, activity, categoryId, hours: parsed, notes: notes || null, studyTopicId: studyTopicId || null, studyType: isStudy ? studyType : null };
      await apiRequest(editing ? `/api/entries/${initial!.id}` : "/api/entries", { method: editing ? "PUT" : "POST", body });
      const message = `${editing ? "Atualizado" : "Registrado"}: ${activity} · ${hoursToInput(parsed)}h`;
      if (keepOpen) {
        setActivity("");
        setHours("");
        setNotes("");
        setSaved(message);
      } else {
        onDone(message);
      }
    } catch (error) {
      if (error instanceof ApiClientError) setErrors({ ...error.fieldErrors, _: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => submit(event)} className="flex flex-col gap-4" noValidate>
      {saved && <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">✓ {saved}</p>}

      <Field label="O que você fez?" htmlFor={`${id}-activity`} error={errors.activity}>
        <input
          id={`${id}-activity`}
          list={`${id}-suggestions`}
          className={inputClass}
          value={activity}
          onChange={(event) => pickActivity(event.target.value)}
          placeholder="Ex.: Estudando React, Treino, Projeto Delivery…"
          aria-invalid={Boolean(errors.activity)}
          autoComplete="off"
          autoFocus={!editing}
        />
        <datalist id={`${id}-suggestions`}>
          {suggestions.map((s) => (
            <option key={s.activity} value={s.activity} />
          ))}
        </datalist>
      </Field>

      <Field label="Categoria" error={errors.categoryId}>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const selected = category.id === categoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                aria-pressed={selected}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selected ? "border-transparent text-white shadow-sm" : "border-border bg-surface text-ink hover:border-brand-300"
                }`}
                style={selected ? { background: category.color } : undefined}
              >
                <span className="size-2.5 rounded-full" style={{ background: selected ? "white" : category.color }} />
                {category.name}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Horas" htmlFor={`${id}-hours`} error={errors.hours}>
          <input
            id={`${id}-hours`}
            className={inputClass}
            inputMode="decimal"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="1,5"
            aria-invalid={Boolean(errors.hours)}
          />
          <div className="flex flex-wrap gap-1.5">
            {HOUR_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setHours(hoursToInput(chip))}
                className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  parseHours(hours) === chip ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                }`}
              >
                {hoursToInput(chip)}h
              </button>
            ))}
          </div>
        </Field>

        <Field label="Data" htmlFor={`${id}-date`} error={errors.date}>
          <input id={`${id}-date`} type="date" className={inputClass} value={date} max={addDays(today, 366)} onChange={(event) => setDate(event.target.value)} />
          <div className="flex gap-1.5">
            {[
              { label: "Hoje", value: today },
              { label: "Ontem", value: addDays(today, -1) },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setDate(chip.value)}
                className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                  date === chip.value ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {activeTopics.length > 0 && (
        <Field label="Tema de estudo (opcional)" htmlFor={`${id}-topic`} hint="Conta horas para a barra de progresso do tema.">
          <select id={`${id}-topic`} className={inputClass} value={studyTopicId} onChange={(event) => pickTopic(event.target.value)}>
            <option value="">Nenhum</option>
            {activeTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {isStudy && <StudyTypePicker value={studyType} onChange={setStudyType} error={errors.studyType} />}

      <Field label="Observações (opcional)" htmlFor={`${id}-notes`}>
        <textarea id={`${id}-notes`} rows={2} className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>

      {errors._ && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errors._}</p>}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        {!editing && (
          <Button variant="secondary" disabled={busy} onClick={(event) => submit(event as unknown as FormEvent<HTMLFormElement>, true)}>
            Salvar e registrar outro
          </Button>
        )}
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando…" : editing ? "Salvar alterações" : "Registrar horas"}
        </Button>
      </div>
    </form>
  );
}

export function StudyTypePicker({ value, onChange, error }: { value: StudyType; onChange: (value: StudyType) => void; error?: string }) {
  return (
    <Field label="Tipo de estudo" error={error} hint="Teórico: aulas, leitura, cursos. Prático: exercícios, projetos, mão na massa.">
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de estudo">
        {(["theory", "practice"] as const).map((option) => {
          const selected = option === value;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                selected ? "border-transparent bg-brand-600 text-white shadow-sm" : "border-border bg-surface text-ink hover:border-brand-300"
              }`}
            >
              {option === "theory" ? "📖" : "🛠️"} {STUDY_TYPE_LABELS[option]}
            </button>
          );
        })}
      </div>
    </Field>
  );
}
