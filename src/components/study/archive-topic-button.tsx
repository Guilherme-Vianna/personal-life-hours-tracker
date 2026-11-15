"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { Button, Field, FormActions, hasFinePointer, inputClass, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";

const REASON_CHIPS = ["Mudei de prioridade", "Não faz mais sentido pra mim", "Troquei por outro tema", "Já aprendi o suficiente"];

export function IconArchive() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden>
      <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
      <path fillRule="evenodd" d="M2 7.5h16l-.811 7.71a2 2 0 0 1-1.99 1.79H4.802a2 2 0 0 1-1.99-1.79L2 7.5ZM7 11a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd" />
    </svg>
  );
}

export function ArchiveTopicButton({ id, name, archived, linkedRoutines }: { id: string; name: string; archived: boolean; linkedRoutines: number }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (archived) {
    return (
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await apiRequest(`/api/topics/${id}/archive`, { method: "DELETE" });
            toast(`"${name}" voltou para os estudos`);
            router.refresh();
          } catch {
            toast("Não foi possível desarquivar. Tente de novo.", "error");
          } finally {
            setBusy(false);
          }
        }}
      >
        <IconArchive /> {busy ? "Restaurando…" : "Desarquivar"}
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <IconArchive /> Arquivar
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Arquivar tema">
        <ArchiveForm id={id} name={name} linkedRoutines={linkedRoutines} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function ArchiveForm({ id, name, linkedRoutines, onDone }: { id: string; name: string; linkedRoutines: number; onDone: () => void }) {
  const fieldId = useId();
  const router = useRouter();
  const toast = useToast();
  const [reason, setReason] = useState("");
  const [endRoutines, setEndRoutines] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Conte em poucas palavras por que está arquivando");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/topics/${id}/archive`, { method: "POST", body: { reason, endRoutines: linkedRoutines > 0 && endRoutines } });
      toast(`"${name}" arquivado`);
      onDone();
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? (err.fieldErrors?.reason ?? err.message) : "Não foi possível arquivar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm text-muted">
        <strong className="text-ink">{name}</strong> sai da lista de estudos em andamento, mas todas as horas e sessões continuam registradas e contando no
        histórico. Você pode desarquivar quando quiser.
      </p>
      <Field label="Por que você está arquivando?" htmlFor={`${fieldId}-reason`} error={error ?? undefined}>
        <textarea
          id={`${fieldId}-reason`}
          rows={3}
          className={inputClass}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ex.: mudei o foco para outra linguagem"
          autoFocus={hasFinePointer()}
          aria-invalid={Boolean(error)}
          maxLength={500}
        />
        <div className="flex flex-wrap gap-1.5">
          {REASON_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setReason(chip)}
              className={`min-h-10 rounded-full px-3 py-1 text-xs font-semibold transition sm:min-h-0 ${reason === chip ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-800 hover:bg-brand-100"}`}
            >
              {chip}
            </button>
          ))}
        </div>
      </Field>
      {linkedRoutines > 0 && (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm has-checked:border-brand-300 has-checked:bg-brand-50">
          <input type="checkbox" className="mt-0.5 size-5 accent-brand-600 sm:size-4" checked={endRoutines} onChange={(e) => setEndRoutines(e.target.checked)} />
          <span>
            <span className="block font-semibold">Encerrar {linkedRoutines === 1 ? "a rotina ligada" : `as ${linkedRoutines} rotinas ligadas`} a este tema hoje</span>
            <span className="block text-xs text-muted">As horas que elas já geraram continuam contando; só param de somar a partir de amanhã.</span>
          </span>
        </label>
      )}
      <FormActions>
        <Button variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Arquivando…" : "Arquivar tema"}
        </Button>
      </FormActions>
    </form>
  );
}
