"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { safeNextPath } from "@/lib/auth";

export function LoginForm() {
  const next = safeNextPath(useSearchParams().get("next"));
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (response.ok) {
      window.location.href = next;
      return;
    }
    setError("Senha incorreta");
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Senha" htmlFor="password" error={error ?? undefined}>
        <input id="password" type="password" autoComplete="current-password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
      </Field>
      <Button type="submit" disabled={busy || !password}>
        {busy ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
