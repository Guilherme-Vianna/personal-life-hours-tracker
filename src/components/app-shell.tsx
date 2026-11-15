import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { QuickAddButton } from "@/components/entries/quick-add";
import { MobileNav, NavLinks } from "@/components/nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <aside className="chalkboard sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r-8 border-[#8b5e3c] px-4 py-6 text-chalk lg:flex">
        <Link href="/" className="group px-2">
          <p className="font-hand text-3xl leading-none font-bold transition-transform duration-300 ease-(--ease-spring) group-hover:-rotate-2">Horas na Vida</p>
          <p className="mt-1 text-xs text-chalk/60">onde seu tempo livre vai parar</p>
        </Link>
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          <Suspense fallback={<NavLinks pathname={null} />}>
            <NavLinks />
          </Suspense>
        </nav>
        <div className="mt-auto">
          <QuickAddButton className="w-full bg-pencil! text-board-dark! hover:brightness-95" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="chalkboard sticky top-0 z-20 px-4 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-2 text-chalk lg:hidden">
          <Link href="/" className="font-hand text-2xl font-bold transition-transform active:scale-95">
            Horas na Vida
          </Link>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:pt-6 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>
        <nav className="mobile-nav fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Principal (celular)">
          <Suspense fallback={<MobileNav pathname={null} />}>
            <MobileNav />
          </Suspense>
        </nav>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 sm:mb-6 sm:items-end">
      <h1 className="relative w-fit text-2xl font-extrabold tracking-tight text-ink sm:col-start-1 sm:text-3xl">
        {title}
        <svg viewBox="0 0 120 8" preserveAspectRatio="none" className="squiggle absolute -bottom-1.5 left-0 h-2 w-full text-pencil" aria-hidden>
          <path d="M2 5.5C20 2 32 7 50 4s30-2 44 0 18 1.5 24-1" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </h1>
      {action && <div className="col-start-2 row-start-1 sm:row-span-2">{action}</div>}
      {subtitle && <p className="col-span-2 mt-1 text-sm text-muted sm:col-span-1 sm:col-start-1">{subtitle}</p>}
    </div>
  );
}
