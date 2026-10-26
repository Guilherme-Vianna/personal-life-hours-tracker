"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Painel", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { href: "/registros", label: "Registros", icon: "M4 6h16M4 12h16M4 18h10" },
  { href: "/estudos", label: "Estudos", icon: "M12 6.5 3 11l9 4.5 9-4.5-9-4.5Zm-6 6.3V17c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.2" },
  { href: "/rotinas", label: "Rotinas", icon: "M4 4v5h5M20 20v-5h-5M5.6 15A7.5 7.5 0 0 0 19 16.5M18.4 9A7.5 7.5 0 0 0 5 7.5" },
  { href: "/categorias", label: "Categorias", icon: "M7 7h.01M3 3h8l10 10-8 8L3 11V3Z" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

function CurrentNavLinks({ variant }: { variant: "sidebar" | "bottom" }) {
  return <StaticNavLinks variant={variant} pathname={usePathname()} />;
}

function StaticNavLinks({ variant, pathname }: { variant: "sidebar" | "bottom"; pathname: string | null }) {
  return NAV.map((item) => {
    const active = pathname !== null && (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));
    const className =
      variant === "sidebar"
        ? `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-chalk text-board-dark shadow" : "text-chalk/80 hover:bg-white/10 hover:text-chalk"}`
        : `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-brand-700" : "text-muted"}`;
    return (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={className}>
        <NavIcon d={item.icon} />
        {item.label}
      </Link>
    );
  });
}

export function NavLinks({ variant, pathname }: { variant: "sidebar" | "bottom"; pathname?: string | null }) {
  return pathname === undefined ? <CurrentNavLinks variant={variant} /> : <StaticNavLinks variant={variant} pathname={pathname} />;
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.replace("/entrar");
        router.refresh();
      }}
      className="text-xs text-chalk/60 hover:text-chalk"
    >
      Sair
    </button>
  );
}
