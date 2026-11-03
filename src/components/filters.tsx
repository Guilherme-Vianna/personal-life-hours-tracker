"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
  }
  return { update, pending, searchParams };
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid w-full auto-cols-fr grid-flow-col gap-1 rounded-xl border border-border bg-surface p-1 sm:inline-flex sm:w-auto sm:flex-wrap">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={`min-h-10 rounded-lg px-1 py-1 text-xs leading-tight font-semibold transition sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-sm ${option.value === value ? "bg-brand-600 text-white shadow-sm" : "text-muted hover:bg-brand-50 hover:text-ink"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm leading-tight font-semibold text-ink select-none sm:min-h-0">
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="h-6 w-11 rounded-full bg-border transition peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300" />
        <span className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
      {label}
    </label>
  );
}
