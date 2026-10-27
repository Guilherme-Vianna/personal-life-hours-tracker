"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { registerPinPrompt } from "@/lib/api-client";
import { Button, Field, inputClass, Modal } from "@/components/ui";

type Pending = { error?: string; resolve: (pin: string | null) => void };

export function PinPrompt() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [pin, setPin] = useState("");
  const pendingRef = useRef<Pending | null>(null);

  useEffect(() => {
    registerPinPrompt(
      (error) =>
        new Promise((resolve) => {
          const next = { error, resolve };
          pendingRef.current = next;
          setPin("");
          setPending(next);
        }),
    );
    return () => registerPinPrompt(null);
  }, []);

  function finish(value: string | null) {
    pendingRef.current?.resolve(value);
    pendingRef.current = null;
    setPending(null);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (pin.trim()) finish(pin.trim());
  }

  return (
    <Modal open={pending !== null} onClose={() => finish(null)} title="🔒 Confirme com a senha">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="text-sm text-muted">Para criar, editar ou apagar dados, digite a senha. Ela fica valendo por 10 minutos neste navegador.</p>
        <Field label="Senha" htmlFor="pin-input" error={pending?.error}>
          <input
            id="pin-input"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            className={`${inputClass} text-center text-2xl tracking-[0.5em]`}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            maxLength={32}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => finish(null)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={!pin.trim()}>
            Confirmar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
