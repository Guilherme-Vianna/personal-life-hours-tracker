import "server-only";
import { and, asc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { db } from "@/db";
import { categories, entries, routines } from "@/db/schema";
import { notFound } from "@/lib/api-errors";
import { planRoutineEntries } from "@/lib/routines";
import { generateInput, routineInput } from "@/lib/validation";

export async function listRoutines() {
  return db
    .select({
      id: routines.id,
      activity: routines.activity,
      categoryId: routines.categoryId,
      studyTopicId: routines.studyTopicId,
      hours: routines.hours,
      weekdays: routines.weekdays,
      notes: routines.notes,
      active: routines.active,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(routines)
    .innerJoin(categories, eq(categories.id, routines.categoryId))
    .orderBy(asc(routines.activity));
}

export type RoutineRow = Awaited<ReturnType<typeof listRoutines>>[number];

export async function createRoutine(body: unknown) {
  const data = routineInput.parse(body);
  const [created] = await db.insert(routines).values(data).returning();
  return created;
}

export async function updateRoutine(id: string, body: unknown) {
  const data = routineInput.parse(body);
  const [updated] = await db.update(routines).set(data).where(eq(routines.id, id)).returning();
  if (!updated) throw notFound("Rotina");
  return updated;
}

export async function deleteRoutine(id: string) {
  const deleted = await db.delete(routines).where(eq(routines.id, id)).returning({ id: routines.id });
  if (!deleted.length) throw notFound("Rotina");
}

export async function generateFromRoutines(body: unknown) {
  const { from, to, routineIds } = generateInput.parse(body);
  const selected = await db
    .select()
    .from(routines)
    .where(routineIds?.length ? inArray(routines.id, routineIds) : eq(routines.active, true));
  const planned = planRoutineEntries(selected, from, to);
  if (!planned.length) return { created: 0, skipped: 0 };

  const existing = await db
    .select({ date: entries.date, routineId: entries.routineId })
    .from(entries)
    .where(and(gte(entries.date, from), lte(entries.date, to), isNotNull(entries.routineId)));
  const taken = new Set(existing.map((row) => `${row.date}|${row.routineId}`));
  const fresh = planned.filter((entry) => !taken.has(`${entry.date}|${entry.routineId}`));

  if (fresh.length) await db.insert(entries).values(fresh);
  return { created: fresh.length, skipped: planned.length - fresh.length };
}
