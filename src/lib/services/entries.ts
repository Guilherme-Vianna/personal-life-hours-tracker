import "server-only";
import { and, desc, eq, gte, ilike, lte, max, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { categories, entries, studyTopics } from "@/db/schema";
import { notFound } from "@/lib/api-errors";
import { entryInput } from "@/lib/validation";
import { listRoutineEntries } from "./routines";

export type EntryFilters = {
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  studyTopicId?: string | null;
  q?: string | null;
  limit?: number;
};

export async function listEntries(filters: EntryFilters = {}) {
  const conditions: SQL[] = [];
  if (filters.from) conditions.push(gte(entries.date, filters.from));
  if (filters.to) conditions.push(lte(entries.date, filters.to));
  if (filters.categoryId) conditions.push(eq(entries.categoryId, filters.categoryId));
  if (filters.studyTopicId) conditions.push(eq(entries.studyTopicId, filters.studyTopicId));
  if (filters.q) {
    const term = `%${filters.q}%`;
    conditions.push(or(ilike(entries.activity, term), ilike(entries.notes, term))!);
  }

  const [manual, fromRoutines] = await Promise.all([
    db
      .select({
        id: entries.id,
        date: entries.date,
        activity: entries.activity,
        hours: entries.hours,
        notes: entries.notes,
        categoryId: entries.categoryId,
        studyTopicId: entries.studyTopicId,
        studyType: entries.studyType,
        routineId: sql<string | null>`null`,
        createdAt: entries.createdAt,
        updatedAt: entries.updatedAt,
        categoryName: categories.name,
        categoryColor: categories.color,
        categoryIsFixed: categories.isFixed,
        studyTopicName: studyTopics.name,
      })
      .from(entries)
      .innerJoin(categories, eq(categories.id, entries.categoryId))
      .leftJoin(studyTopics, eq(studyTopics.id, entries.studyTopicId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(entries.date), desc(entries.createdAt))
      .limit(filters.limit ?? 2000),
    listRoutineEntries(filters),
  ]);
  const byDateDesc = (a: { date: string }, b: { date: string }) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);
  return [...manual, ...fromRoutines].sort(byDateDesc).slice(0, filters.limit ?? 2000);
}

export type EntryRow = Awaited<ReturnType<typeof listEntries>>[number];

export async function createEntry(body: unknown) {
  const data = entryInput.parse(body);
  const [created] = await db.insert(entries).values(data).returning();
  return created;
}

export async function updateEntry(id: string, body: unknown) {
  const data = entryInput.parse(body);
  const [updated] = await db.update(entries).set(data).where(eq(entries.id, id)).returning();
  if (!updated) throw notFound("Registro");
  return updated;
}

export async function deleteEntry(id: string) {
  const deleted = await db.delete(entries).where(eq(entries.id, id)).returning({ id: entries.id });
  if (!deleted.length) throw notFound("Registro");
}

export async function activitySuggestions() {
  const rows = await db
    .select({
      activity: entries.activity,
      categoryId: entries.categoryId,
      studyTopicId: entries.studyTopicId,
      studyType: entries.studyType,
      lastUsed: max(entries.date),
      uses: sql<number>`count(*)`.mapWith(Number),
    })
    .from(entries)
    .groupBy(entries.activity, entries.categoryId, entries.studyTopicId, entries.studyType)
    .orderBy(desc(max(entries.date)))
    .limit(200);
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = row.activity.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type ActivitySuggestion = Awaited<ReturnType<typeof activitySuggestions>>[number];
