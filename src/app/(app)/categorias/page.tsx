import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/app-shell";
import { CategoryManager } from "@/components/categories/category-manager";
import { PageSuspense } from "@/components/page-suspense";
import { listCategories } from "@/lib/services/categories";

export const metadata: Metadata = { title: "Categorias" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader title="Categorias" subtitle="As tags que agrupam suas atividades" />
      <PageSuspense>
        <Categories />
      </PageSuspense>
    </>
  );
}

async function Categories() {
  await connection();
  return <CategoryManager categories={await listCategories()} />;
}
