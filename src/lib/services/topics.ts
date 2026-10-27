import "server-only";
import { asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { entries, studyTopics, type StudyTopic } from "@/db/schema";
import { notFound } from "@/lib/api-errors";
import { topicProgress } from "@/lib/progress";
import { topicInput } from "@/lib/validation";
import { listRoutineEntries } from "./routines";

function withProgress(topic: StudyTopic, sessions: { date: string; hours: number }[], today: string) {
  return {
    ...topic,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    progress: topicProgress({ ...topic, createdAt: topic.createdAt.toISOString(), sessions }, today),
  };
}

export async function listTopics(today: string) {
  const [topics, manual, fromRoutines] = await Promise.all([
    db.select().from(studyTopics).orderBy(asc(studyTopics.name)),
    db.select({ studyTopicId: entries.studyTopicId, date: entries.date, hours: entries.hours }).from(entries).where(isNotNull(entries.studyTopicId)),
    listRoutineEntries({ to: today }),
  ]);
  const byTopic = new Map<string, { date: string; hours: number }[]>();
  for (const session of [...manual, ...fromRoutines]) {
    if (!session.studyTopicId) continue;
    const list = byTopic.get(session.studyTopicId) ?? [];
    list.push({ date: session.date, hours: session.hours });
    byTopic.set(session.studyTopicId, list);
  }
  const order = { active: 0, paused: 1, completed: 2 };
  return topics
    .map((topic) => withProgress(topic, byTopic.get(topic.id) ?? [], today))
    .sort((a, b) => order[a.status] - order[b.status]);
}

export type TopicWithProgress = Awaited<ReturnType<typeof listTopics>>[number];

export async function getTopic(id: string, today: string) {
  const [topic] = await db.select().from(studyTopics).where(eq(studyTopics.id, id));
  if (!topic) return null;
  const [manual, fromRoutines] = await Promise.all([
    db.select({ date: entries.date, hours: entries.hours }).from(entries).where(eq(entries.studyTopicId, id)),
    listRoutineEntries({ to: today, studyTopicId: id }),
  ]);
  return withProgress(topic, [...manual, ...fromRoutines], today);
}

export async function createTopic(body: unknown) {
  const data = topicInput.parse(body);
  const [created] = await db.insert(studyTopics).values(data).returning();
  return created;
}

export async function updateTopic(id: string, body: unknown) {
  const data = topicInput.parse(body);
  const [updated] = await db.update(studyTopics).set(data).where(eq(studyTopics.id, id)).returning();
  if (!updated) throw notFound("Tema");
  return updated;
}

export async function deleteTopic(id: string) {
  const deleted = await db.delete(studyTopics).where(eq(studyTopics.id, id)).returning({ id: studyTopics.id });
  if (!deleted.length) throw notFound("Tema");
}
