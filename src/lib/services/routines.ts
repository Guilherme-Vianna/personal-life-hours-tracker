import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, routines, studyTopics } from "@/db/schema";
import { notFound } from "@/lib/api-errors";
import { todayISO } from "@/lib/dates";
import { routineDates, routineEntryId } from "@/lib/routines";
import { routineInput } from "@/lib/validation";

export async function listRoutines() {
  return db
    .select({
      id: routines.id,
      activity: routines.activity,
      categoryId: routines.categoryId,
      studyTopicId: routines.studyTopicId,
      studyType: routines.studyType,
      hours: routines.hours,
      weekdays: routines.weekdays,
      startDate: routines.startDate,
      endDate: routines.endDate,
      notes: routines.notes,
      active: routines.active,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIsFixed: categories.isFixed,
      studyTopicName: studyTopics.name,
    })
    .from(routines)
    .innerJoin(categories, eq(categories.id, routines.categoryId))
    .leftJoin(studyTopics, eq(studyTopics.id, routines.studyTopicId))
    .orderBy(asc(routines.activity));
}

export type RoutineRow = Awaited<ReturnType<typeof listRoutines>>[number];

export type RoutineEntryFilters = {
  from?: string | null;
  to?: string | null;
  categoryId?: string | null;
  studyTopicId?: string | null;
  q?: string | null;
};

// Routines are never stored as entries: their hours are expanded on read, so editing,
// pausing or deleting a routine immediately changes every total that includes it.
export async function listRoutineEntries(filters: RoutineEntryFilters = {}) {
  const term = filters.q?.trim().toLowerCase();
  const from = filters.from ?? "0000-01-01";
  const to = filters.to ?? todayISO();
  const rows = await listRoutines();
  return rows
    .filter((routine) => !filters.categoryId || routine.categoryId === filters.categoryId)
    .filter((routine) => !filters.studyTopicId || routine.studyTopicId === filters.studyTopicId)
    .filter((routine) => !term || routine.activity.toLowerCase().includes(term) || routine.notes?.toLowerCase().includes(term))
    .flatMap((routine) =>
      routineDates(routine, from, to).map((date) => ({
        id: routineEntryId(routine.id, date),
        date,
        activity: routine.activity,
        hours: routine.hours,
        notes: routine.notes,
        categoryId: routine.categoryId,
        studyTopicId: routine.studyTopicId,
        studyType: routine.studyType,
        routineId: routine.id as string | null,
        createdAt: null as Date | null,
        updatedAt: null as Date | null,
        categoryName: routine.categoryName,
        categoryColor: routine.categoryColor,
        categoryIsFixed: routine.categoryIsFixed,
        studyTopicName: routine.studyTopicName,
      })),
    );
}

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
