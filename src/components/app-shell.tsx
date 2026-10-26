import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { QuickAddButton } from "@/components/entries/quick-add";
import { LogoutButton, NavLinks } from "@/components/nav-links";

export function AppShell({ children, authEnabled }: { children: ReactNode; authEnabled: boolean }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="chalkboard sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-8 border-[#8b5e3c] px-4 py-6 text-chalk lg:flex">
        <Link href="/" className="px-2">
          <p className="font-hand text-3xl leading-none font-bold">Horas na Vida</p>
          <p className="mt-1 text-xs text-chalk/60">onde seu tempo livre vai parar</p>
        </Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          <Suspense fallback={<NavLinks variant="sidebar" pathname={null} />}>
            <NavLinks variant="sidebar" />
          </Suspense>
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <QuickAddButton className="w-full bg-pencil! text-board-dark! hover:brightness-95" />
          {authEnabled && <LogoutButton />}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="chalkboard sticky top-0 z-30 flex items-center justify-between px-4 py-3 text-chalk lg:hidden">
          <Link href="/" className="font-hand text-2xl font-bold">
            Horas na Vida
          </Link>
          <QuickAddButton className="bg-pencil! px-3! py-2! text-board-dark!">+ Registrar</QuickAddButton>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 backdrop-blur lg:hidden" aria-label="Principal (celular)">
          <Suspense fallback={<NavLinks variant="bottom" pathname={null} />}>
            <NavLinks variant="bottom" />
          </Suspense>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
