"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { CATEGORY_COLORS, hoursToInput, parseHours } from "@/lib/format";
import { Button, ColorPicker, Field, inputClass, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";

export type TopicDraft = {
  id?: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  targetHours: number | null;
  weeklyGoalHours: number | null;
  startDate: string | null;
  deadline: string | null;
  status: "active" | "paused" | "completed";
  color: string;
};

const TARGET_CHIPS = [10, 20, 50, 100];

export function TopicFormButton({
  categories,
  initial,
  defaultCategoryId,
  children,
  variant = "primary",
}: {
  categories: { id: string; name: string }[];
  initial?: TopicDraft;
  defaultCategoryId?: string | null;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={initial ? "Editar tema" : "Novo tema de estudo"} wide>
        <TopicForm categories={categories} initial={initial} defaultCategoryId={defaultCategoryId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function TopicForm({ categories, initial, defaultCategoryId, onDone }: { categories: { id: string; name: string }[]; initial?: TopicDraft; defaultCategoryId?: string | null; onDone: () => void }) {
  const id = useId();
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? defaultCategoryId ?? "");
  const [target, setTarget] = useState(hoursToInput(initial?.targetHours));
  const [weekly, setWeekly] = useState(hoursToInput(initial?.weeklyGoalHours));
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [color, setColor] = useState(initial?.color ?? CATEGORY_COLORS[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const targetHours = parseHours(target);
    const weeklyGoalHours = weekly.trim() ? parseHours(weekly) : null;
    const local: Record<string, string> = {};
    if (!name.trim()) local.name = "Dê um nome ao tema";
    if (!(targetHours > 0)) local.targetHours = "Informe a meta em horas";
    if (weeklyGoalHours !== null && !(weeklyGoalHours > 0 && weeklyGoalHours <= 168)) local.weeklyGoalHours = "Entre 0,5 e 168";
    setErrors(local);
    if (Object.keys(local).length) return;

    setBusy(true);
    try {
      const body = { name, description, categoryId: categoryId || null, targetHours, weeklyGoalHours, startDate: startDate || null, deadline: deadline || null, status, color };
      await apiRequest(initial?.id ? `/api/topics/${initial.id}` : "/api/topics", { method: initial?.id ? "PUT" : "POST", body });
      toast(initial ? "Tema atualizado" : `Tema "${name}" criado`);
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
      <Field label="Tema" htmlFor={`${id}-name`} error={errors.name}>
        <input id={`${id}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Next.js, Docker, Inglês B2…" autoFocus aria-invalid={Boolean(errors.name)} />
      </Field>
      <Field label="Descrição (opcional)" htmlFor={`${id}-desc`}>
        <textarea id={`${id}-desc`} rows={2} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="O que você quer conseguir fazer ao final?" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Meta total (horas)" htmlFor={`${id}-target`} error={errors.targetHours}>
          <input id={`${id}-target`} className={inputClass} inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="20" aria-invalid={Boolean(errors.targetHours)} />
          <div className="flex gap-1.5">
            {TARGET_CHIPS.map((chip) => (
              <button key={chip} type="button" onClick={() => setTarget(String(chip))} className={`rounded-lg px-2 py-1 text-xs font-semibold ${parseHours(target) === chip ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}>
                {chip}h
              </button>
            ))}
          </div>
        </Field>
        <Field label="Meta semanal (opcional)" htmlFor={`${id}-weekly`} error={errors.weeklyGoalHours} hint="Horas por semana que você quer dedicar.">
          <input id={`${id}-weekly`} className={inputClass} inputMode="decimal" value={weekly} onChange={(e) => setWeekly(e.target.value)} placeholder="5" />
        </Field>
        <Field label="Início (opcional)" htmlFor={`${id}-start`}>
          <input id={`${id}-start`} type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Prazo (opcional)" htmlFor={`${id}-deadline`} error={errors.deadline} hint="Calcula o ritmo necessário.">
          <input id={`${id}-deadline`} type="date" className={inputClass} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </Field>
        <Field label="Categoria das sessões" htmlFor={`${id}-category`} hint="Usada ao registrar sessões desse tema.">
          <select id={`${id}-category`} className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Escolher na hora</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        {initial && (
          <Field label="Situação" htmlFor={`${id}-status`}>
            <select id={`${id}-status`} className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as TopicDraft["status"])}>
              <option value="active">Em andamento</option>
              <option value="paused">Pausado</option>
              <option value="completed">Concluído</option>
            </select>
          </Field>
        )}
      </div>

      <Field label="Cor da barra">
        <ColorPicker value={color} onChange={setColor} colors={CATEGORY_COLORS} />
      </Field>

      {errors._ && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errors._}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando…" : initial ? "Salvar" : "Criar tema"}
        </Button>
      </div>
    </form>
  );
}
