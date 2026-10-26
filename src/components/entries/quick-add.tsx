"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { apiRequest } from "@/lib/api-client";
import { todayISO } from "@/lib/dates";
import { Button, IconPlus, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { EntryForm, type CategoryOption, type EntryDraft, type SuggestionOption, type TopicOption } from "./entry-form";

type Options = { categories: CategoryOption[]; topics: TopicOption[]; suggestions: SuggestionOption[] };

export function useEntryModal() {
  const router = useRouter();
  const toast = useToast();
  const [state, setState] = useState<{ initial?: Partial<EntryDraft>; options: Options | null } | null>(null);

  async function open(initial?: Partial<EntryDraft>) {
    setState({ initial, options: null });
    const [categories, topics, suggestions] = await Promise.all([
      apiRequest<CategoryOption[]>("/api/categories"),
      apiRequest<TopicOption[]>("/api/topics"),
      apiRequest<SuggestionOption[]>("/api/activities"),
    ]);
    setState({ initial, options: { categories, topics, suggestions } });
  }

  function close() {
    setState(null);
    router.refresh();
  }

  const modal = (
    <Modal open={state !== null} onClose={close} title={state?.initial?.id ? "Editar registro" : "Registrar horas"} wide>
      {state?.options ? (
        state.options.categories.length === 0 ? (
          <p className="text-sm text-muted">Crie uma categoria primeiro na página Categorias.</p>
        ) : (
          <EntryForm
            {...state.options}
            today={todayISO()}
            initial={state.initial}
            onDone={(message) => {
              toast(message);
              close();
            }}
          />
        )
      ) : (
        <div className="flex flex-col gap-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-brand-50" />
          ))}
        </div>
      )}
    </Modal>
  );

  return { open, modal };
}

export function QuickAddButton({ children, preset, className, variant = "primary" }: { children?: ReactNode; preset?: Partial<EntryDraft>; className?: string; variant?: "primary" | "secondary" }) {
  const { open, modal } = useEntryModal();
  return (
    <>
      <Button variant={variant} className={className} onClick={() => open(preset)}>
        {children ?? (
          <>
            <IconPlus /> Registrar horas
          </>
        )}
      </Button>
      {modal}
    </>
  );
}
