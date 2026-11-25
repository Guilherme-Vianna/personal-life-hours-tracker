import "server-only";
import { timingSafeEqual } from "node:crypto";
import { and, eq, inArray, isNotNull, max, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { categories, entries, studyTopics } from "@/db/schema";
import { ApiError } from "@/lib/api-errors";

export const SYNC_ARCHIVE_REASON = "Removido na origem da sincronização";

const isoDate = z.iso.date({ error: "Data inválida" });
const externalId = z.string().trim().min(1).max(200);
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const sourceParam = z.string().regex(/^[a-z0-9-]{2,30}$/, "Origem inválida");

export const syncInput = z.object({
  mode: z.enum(["upsert", "replace"]).default("upsert"),
  categoryName: z.string().trim().min(1).max(60).default("Estudos"),
  topics: z
    .array(
      z.object({
        externalId,
        name: z.string().trim().min(1).max(100),
        color: color.optional(),
        targetHours: z.coerce.number().gt(0).max(10000).optional(),
        weeklyGoalHours: z.coerce.number().gt(0).max(168).nullish(),
      }),
    )
    .max(1000)
    .default([]),
  entries: z
    .array(
      z.object({
        externalId,
        topicExternalId: externalId.nullish(),
        date: isoDate,
        activity: z.string().trim().min(1).max(120),
        hours: z.coerce.number().gt(0).max(24),
        notes: z.string().trim().max(500).nullish().transform((value) => value || null),
        studyType: z.enum(["theory", "practice"]).nullish(),
      }),
    )
    .max(20000)
    .default([]),
  deletedEntryIds: z.array(externalId).max(20000).default([]),
});
export type SyncInput = z.infer<typeof syncInput>;

export function assertIntegrationToken(request: Request) {
  const expected = process.env.INTEGRATION_TOKEN;
  if (!expected) throw new ApiError(503, "Integração desativada: defina INTEGRATION_TOKEN");
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ApiError(401, "Token de integração inválido");
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

const sameHours = (a: number, b: number) => Math.abs(a - b) < 0.005;
const sameGoal = (a: number | null, b: number | null) => (a === null || b === null ? a === b : sameHours(a, b));

async function ensureCategory(name: string) {
  const all = await db.select({ id: categories.id, name: categories.name }).from(categories);
  const found = all.find((category) => normalize(category.name) === normalize(name));
  if (found) return found;
  const [created] = await db.insert(categories).values({ name, color: "#dc2626" }).returning({ id: categories.id, name: categories.name });
  return created;
}

/**
 * Idempotent sync from another app. Topics and entries are matched by (source, externalId), so the same payload can be
 * sent any number of times. An unlinked topic with the same name is adopted instead of duplicated. In "replace" mode the
 * payload is the full set: entries missing from it are deleted and topics missing from it are archived (hours stay).
 */
export async function syncFromSource(source: string, body: unknown) {
  const input = syncInput.parse(body);
  const category = await ensureCategory(input.categoryName);
  const topicStats = { created: 0, linked: 0, renamed: 0, goalsUpdated: 0, archived: 0, restored: 0 };
  const entryStats = { created: 0, updated: 0, deleted: 0, unchanged: 0 };

  const existingTopics = await db.select().from(studyTopics);
  const linked = new Map(existingTopics.filter((t) => t.externalSource === source && t.externalId).map((t) => [t.externalId!, t]));
  const topicIdByExternal = new Map<string, string>();

  for (const topic of input.topics) {
    const current = linked.get(topic.externalId);
    if (current) {
      const patch: Partial<typeof studyTopics.$inferInsert> = {};
      if (current.name !== topic.name) {
        patch.name = topic.name;
        topicStats.renamed++;
      }
      if (topic.weeklyGoalHours !== undefined && !sameGoal(current.weeklyGoalHours, topic.weeklyGoalHours)) {
        patch.weeklyGoalHours = topic.weeklyGoalHours;
        topicStats.goalsUpdated++;
      }
      if (current.archivedAt && current.archiveReason === SYNC_ARCHIVE_REASON) {
        patch.archivedAt = null;
        patch.archiveReason = null;
        topicStats.restored++;
      }
      if (Object.keys(patch).length) await db.update(studyTopics).set(patch).where(eq(studyTopics.id, current.id));
      topicIdByExternal.set(topic.externalId, current.id);
      continue;
    }
    const adoptable = existingTopics.find((t) => !t.externalSource && !t.archivedAt && normalize(t.name) === normalize(topic.name));
    if (adoptable) {
      await db
        .update(studyTopics)
        .set({
          externalSource: source,
          externalId: topic.externalId,
          name: topic.name,
          ...(topic.weeklyGoalHours !== undefined ? { weeklyGoalHours: topic.weeklyGoalHours } : {}),
        })
        .where(eq(studyTopics.id, adoptable.id));
      adoptable.externalSource = source;
      topicIdByExternal.set(topic.externalId, adoptable.id);
      topicStats.linked++;
      continue;
    }
    const [created] = await db
      .insert(studyTopics)
      .values({
        name: topic.name,
        categoryId: category.id,
        targetHours: topic.targetHours ?? 100,
        color: topic.color ?? "#16a34a",
        weeklyGoalHours: topic.weeklyGoalHours ?? null,
        externalSource: source,
        externalId: topic.externalId,
      })
      .returning({ id: studyTopics.id });
    topicIdByExternal.set(topic.externalId, created.id);
    topicStats.created++;
  }
  for (const [ext, topic] of linked) if (!topicIdByExternal.has(ext)) topicIdByExternal.set(ext, topic.id);

  if (input.mode === "replace") {
    const keep = new Set(input.topics.map((t) => t.externalId));
    const stale = [...linked.values()].filter((t) => !keep.has(t.externalId!) && !t.archivedAt).map((t) => t.id);
    if (stale.length) {
      await db.update(studyTopics).set({ archivedAt: new Date(), archiveReason: SYNC_ARCHIVE_REASON }).where(inArray(studyTopics.id, stale));
      topicStats.archived = stale.length;
    }
  }

  const existingEntries = await db.select().from(entries).where(eq(entries.externalSource, source));
  const entryByExternal = new Map(existingEntries.map((e) => [e.externalId!, e]));
  const inserts: (typeof entries.$inferInsert)[] = [];

  for (const entry of input.entries) {
    const studyTopicId = entry.topicExternalId ? (topicIdByExternal.get(entry.topicExternalId) ?? null) : null;
    if (entry.topicExternalId && !studyTopicId) {
      throw new ApiError(422, `Tema de origem ${entry.topicExternalId} não enviado nem sincronizado antes`);
    }
    const row = {
      date: entry.date,
      activity: entry.activity,
      categoryId: category.id,
      hours: Math.round(entry.hours * 100) / 100,
      notes: entry.notes,
      studyTopicId,
      studyType: entry.studyType ?? (studyTopicId ? ("theory" as const) : null),
    };
    const current = entryByExternal.get(entry.externalId);
    if (!current) {
      inserts.push({ ...row, externalSource: source, externalId: entry.externalId });
      continue;
    }
    const changed =
      current.date !== row.date ||
      current.activity !== row.activity ||
      current.categoryId !== row.categoryId ||
      !sameHours(current.hours, row.hours) ||
      current.notes !== row.notes ||
      current.studyTopicId !== row.studyTopicId ||
      current.studyType !== row.studyType;
    if (changed) {
      await db.update(entries).set(row).where(eq(entries.id, current.id));
      entryStats.updated++;
    } else {
      entryStats.unchanged++;
    }
  }
  for (let i = 0; i < inserts.length; i += 500) await db.insert(entries).values(inserts.slice(i, i + 500));
  entryStats.created = inserts.length;

  const toDelete = new Set(input.deletedEntryIds);
  if (input.mode === "replace") {
    const keep = new Set(input.entries.map((e) => e.externalId));
    for (const ext of entryByExternal.keys()) if (!keep.has(ext)) toDelete.add(ext);
  }
  const deleteIds = [...toDelete].filter((ext) => entryByExternal.has(ext));
  for (let i = 0; i < deleteIds.length; i += 500) {
    await db.delete(entries).where(and(eq(entries.externalSource, source), inArray(entries.externalId, deleteIds.slice(i, i + 500))));
  }
  entryStats.deleted = deleteIds.length;

  return { source, category: category.name, topics: topicStats, entries: entryStats };
}

export async function sourceStatus(source: string) {
  const [entryRow] = await db
    .select({
      entries: sql<number>`count(*)::int`,
      hours: sql<number>`coalesce(sum(${entries.hours}), 0)::float`,
      lastChange: max(entries.updatedAt),
    })
    .from(entries)
    .where(eq(entries.externalSource, source));
  const topics = await db
    .select({ externalId: studyTopics.externalId, name: studyTopics.name, archivedAt: studyTopics.archivedAt })
    .from(studyTopics)
    .where(and(eq(studyTopics.externalSource, source), isNotNull(studyTopics.externalId)));
  return {
    source,
    entries: entryRow.entries,
    hours: Math.round(entryRow.hours * 100) / 100,
    lastChange: entryRow.lastChange?.toISOString() ?? null,
    topics: topics.map((t) => ({ externalId: t.externalId, name: t.name, archived: Boolean(t.archivedAt) })),
  };
}
