import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader } from "@/components/app-shell";
import { CategoryManager } from "@/components/categories/category-manager";
import { PageSkeleton } from "@/components/skeleton";
import { listCategories } from "@/lib/services/categories";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categorias" subtitle="As tags que agrupam suas atividades" />
      <Suspense fallback={<PageSkeleton />}>
        <Categories />
      </Suspense>
    </>
  );
}

async function Categories() {
  await connection();
  return <CategoryManager categories={await listCategories()} />;
}
