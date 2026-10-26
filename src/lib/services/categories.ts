import "server-only";
import { asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, entries } from "@/db/schema";
import { ApiError, isUniqueViolation, notFound } from "@/lib/api-errors";
import { categoryInput } from "@/lib/validation";

export async function listCategories() {
  const rows = await db
    .select({
      category: categories,
      entriesCount: count(entries.id),
      totalHours: sql<number>`coalesce(sum(${entries.hours}), 0)`.mapWith(Number),
    })
    .from(categories)
    .leftJoin(entries, eq(entries.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.name));
  return rows.map((row) => ({ ...row.category, entriesCount: row.entriesCount, totalHours: row.totalHours }));
}

export type CategoryWithStats = Awaited<ReturnType<typeof listCategories>>[number];

function duplicateName(): never {
  throw new ApiError(409, "Já existe uma categoria com esse nome", { name: "Já existe uma categoria com esse nome" });
}

export async function createCategory(body: unknown) {
  const data = categoryInput.parse(body);
  try {
    const [created] = await db.insert(categories).values(data).returning();
    return created;
  } catch (error) {
    if (isUniqueViolation(error)) duplicateName();
    throw error;
  }
}

export async function updateCategory(id: string, body: unknown) {
  const data = categoryInput.parse(body);
  try {
    const [updated] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!updated) throw notFound("Categoria");
    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) duplicateName();
    throw error;
  }
}

export async function deleteCategory(id: string) {
  const [{ used }] = await db.select({ used: count() }).from(entries).where(eq(entries.categoryId, id));
  if (used > 0) throw new ApiError(409, `Essa categoria tem ${used} registro(s). Mova ou apague os registros antes.`);
  const deleted = await db.delete(categories).where(eq(categories.id, id)).returning({ id: categories.id });
  if (!deleted.length) throw notFound("Categoria");
}
