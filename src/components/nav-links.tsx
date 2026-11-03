"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useEntryModal } from "@/components/entries/quick-add";
import { Modal } from "@/components/ui";

const PAINEL = { href: "/", label: "Painel", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" };
const ANALISES = { href: "/analises", label: "Análises", hint: "Foco, tendências e insights", icon: "M3 3v18h18M7 15l4-4 3 3 5-6" };
const REGISTROS = { href: "/registros", label: "Registros", icon: "M4 6h16M4 12h16M4 18h10" };
const ESTUDOS = { href: "/estudos", label: "Estudos", icon: "M12 6.5 3 11l9 4.5 9-4.5-9-4.5Zm-6 6.3V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.2" };
const ROTINAS = { href: "/rotinas", label: "Rotinas", hint: "O que se repete toda semana", icon: "M4 4v5h5M20 20v-5h-5M5.6 15A7.5 7.5 0 0 0 19 16.5M18.4 9A7.5 7.5 0 0 0 5 7.5" };
const CATEGORIAS = { href: "/categorias", label: "Categorias", hint: "As tags das suas atividades", icon: "M7 7h.01M3 3h8l10 10-8 8L3 11V3Z" };

const NAV = [PAINEL, ANALISES, REGISTROS, ESTUDOS, ROTINAS, CATEGORIAS];
const MORE = [ANALISES, ROTINAS, CATEGORIAS];

function isActive(href: string, pathname: string | null) {
  if (pathname === null) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavIcon({ d, strokeWidth = 2 }: { d: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function CurrentNavLinks() {
  return <StaticNavLinks pathname={usePathname()} />;
}

function StaticNavLinks({ pathname }: { pathname: string | null }) {
  return NAV.map((item) => {
    const active = isActive(item.href, pathname);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-chalk text-board-dark shadow" : "text-chalk/80 hover:bg-white/10 hover:text-chalk"}`}
      >
        <NavIcon d={item.icon} />
        {item.label}
      </Link>
    );
  });
}

export function NavLinks({ pathname }: { pathname?: string | null }) {
  return pathname === undefined ? <CurrentNavLinks /> : <StaticNavLinks pathname={pathname} />;
}

const TAB_CLASS = "flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold";

function MobileTab({ item, pathname }: { item: { href: string; label: string; icon: string }; pathname: string | null }) {
  const active = isActive(item.href, pathname);
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} className={`${TAB_CLASS} ${active ? "text-brand-700" : "text-muted"}`}>
      <NavIcon d={item.icon} />
      {item.label}
    </Link>
  );
}

function CurrentMobileNav() {
  return <StaticMobileNav pathname={usePathname()} />;
}

function StaticMobileNav({ pathname }: { pathname: string | null }) {
  const { open, modal } = useEntryModal();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = MORE.some((item) => isActive(item.href, pathname));
  return (
    <>
      <MobileTab item={PAINEL} pathname={pathname} />
      <MobileTab item={REGISTROS} pathname={pathname} />
      <button type="button" onClick={() => open()} className={`${TAB_CLASS} text-ink`}>
        <span className="-mt-6 flex size-13 items-center justify-center rounded-full bg-pencil text-board-dark shadow-lg ring-4 ring-surface transition active:scale-95">
          <svg viewBox="0 0 20 20" fill="currentColor" className="size-7" aria-hidden>
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </span>
        Registrar
      </button>
      <MobileTab item={ESTUDOS} pathname={pathname} />
      <button type="button" onClick={() => setMoreOpen(true)} aria-haspopup="dialog" aria-expanded={moreOpen} className={`${TAB_CLASS} ${moreActive ? "text-brand-700" : "text-muted"}`}>
        <NavIcon d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={3} />
        Mais
      </button>
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais opções">
        <ul className="flex flex-col gap-1">
          {MORE.map((item) => {
            const active = isActive(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2 ${active ? "bg-brand-50 text-brand-800" : "text-ink hover:bg-brand-50"}`}
                >
                  <NavIcon d={item.icon} />
                  <span className="min-w-0">
                    <span className="block font-semibold">{item.label}</span>
                    <span className="block text-xs text-muted">{item.hint}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Modal>
      {modal}
    </>
  );
}

export function MobileNav({ pathname }: { pathname?: string | null }) {
  return pathname === undefined ? <CurrentMobileNav /> : <StaticMobileNav pathname={pathname} />;
}
