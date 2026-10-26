import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="chalkboard flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-3xl bg-chalk p-8 shadow-2xl">
        <p className="font-hand text-4xl font-bold text-board">Horas na Vida</p>
        <p className="mt-1 mb-6 text-sm text-muted">Digite a senha para continuar.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
