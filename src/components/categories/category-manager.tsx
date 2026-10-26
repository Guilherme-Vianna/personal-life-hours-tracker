"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { CATEGORY_COLORS, formatHours } from "@/lib/format";
import type { CategoryWithStats } from "@/lib/services/categories";
import { Button, ColorPicker, ConfirmButton, EmptyState, Field, IconPencil, IconTrash, inputClass, Modal } from "@/components/ui";
import { Toggle } from "@/components/filters";
import { useToast } from "@/components/toast";

type Draft = Pick<CategoryWithStats, "name" | "description" | "color" | "isFixed"> & { id?: string };

export function CategoryManager({ categories }: { categories: CategoryWithStats[] }) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Draft | null>(null);
  const newDraft = (): Draft => ({ name: "", description: "", color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length], isFixed: false });

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button onClick={() => setEditing(newDraft())}>+ Nova categoria</Button>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon="🏷️" title="Nenhuma categoria" description="Categorias agrupam suas atividades: Estudos, Saúde, Lazer, Projetos…" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <li key={category.id} className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold text-white" style={{ background: category.color }}>
                {category.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-bold">
                  <span className="truncate">{category.name}</span>
                  {category.isFixed && <span className="rounded bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 uppercase">fixo</span>}
                </p>
                {category.description && <p className="truncate text-xs text-muted">{category.description}</p>}
                <p className="mt-0.5 text-xs text-muted">
                  {formatHours(category.totalHours)} · {category.entriesCount} registro(s)
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => setEditing(category)} className="rounded-lg p-2 text-muted hover:bg-brand-50 hover:text-brand-800" aria-label={`Editar ${category.name}`}>
                  <IconPencil />
                </button>
                <ConfirmButton
                  title="Apagar categoria?"
                  message={`"${category.name}" será apagada. Só é possível apagar categorias sem registros.`}
                  className="rounded-lg p-2 text-muted hover:bg-danger-soft hover:text-danger"
                  onConfirm={async () => {
                    await apiRequest(`/api/categories/${category.id}`, { method: "DELETE" });
                    toast("Categoria apagada");
                    router.refresh();
                  }}
                >
                  <IconTrash />
                  <span className="sr-only">Apagar {category.name}</span>
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Editar categoria" : "Nova categoria"}>
        {editing && (
          <CategoryForm
            initial={editing}
            onDone={(message) => {
              setEditing(null);
              toast(message);
              router.refresh();
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>
    </>
  );
}

function CategoryForm({ initial, onDone, onCancel }: { initial: Draft; onDone: (message: string) => void; onCancel: () => void }) {
  const id = useId();
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? "");
  const [color, setColor] = useState(initial.color);
  const [isFixed, setIsFixed] = useState(initial.isFixed);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return setErrors({ name: "Informe o nome" });
    setBusy(true);
    try {
      const body = { name, description, color, isFixed };
      await apiRequest(initial.id ? `/api/categories/${initial.id}` : "/api/categories", { method: initial.id ? "PUT" : "POST", body });
      onDone(initial.id ? "Categoria atualizada" : `Categoria "${name}" criada`);
    } catch (error) {
      if (error instanceof ApiClientError) setErrors({ ...error.fieldErrors, _: error.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <Field label="Nome" htmlFor={`${id}-name`} error={errors.name}>
        <input id={`${id}-name`} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-invalid={Boolean(errors.name)} />
      </Field>
      <Field label="Descrição (opcional)" htmlFor={`${id}-desc`}>
        <input id={`${id}-desc`} className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <Field label="Cor">
        <ColorPicker value={color} onChange={setColor} colors={CATEGORY_COLORS} />
      </Field>
      <div>
        <Toggle checked={isFixed} onChange={setIsFixed} label="Compromisso fixo" />
        <p className="mt-1 text-xs text-muted">Ex.: Trabalho CLT. Não conta como tempo livre no painel (a menos que você inclua).</p>
      </div>
      {errors._ && !errors.name && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errors._}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </form>
  );
}
