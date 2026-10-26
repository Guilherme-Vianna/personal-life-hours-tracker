"use client";

import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { ConfirmButton, IconTrash } from "@/components/ui";
import { useToast } from "@/components/toast";

export function DeleteTopicButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const toast = useToast();
  return (
    <ConfirmButton
      title="Apagar tema?"
      message={`O tema "${name}" será apagado. Os registros de horas continuam existindo, só deixam de contar para esse tema.`}
      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-danger-soft hover:text-danger"
      onConfirm={async () => {
        await apiRequest(`/api/topics/${id}`, { method: "DELETE" });
        toast("Tema apagado");
        router.push("/estudos");
        router.refresh();
      }}
    >
      <IconTrash /> Apagar
    </ConfirmButton>
  );
}
