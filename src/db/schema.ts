import { relations } from "drizzle-orm";
import { boolean, date, index, integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const hours = (name: string) => numeric(name, { precision: 6, scale: 2, mode: "number" });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#16a34a"),
  isFixed: boolean("is_fixed").notNull().default(false),
  ...timestamps,
});

export const studyTopics = pgTable("study_topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  targetHours: hours("target_hours").notNull(),
  weeklyGoalHours: hours("weekly_goal_hours"),
  startDate: date("start_date", { mode: "string" }),
  deadline: date("deadline", { mode: "string" }),
  status: text("status", { enum: ["active", "paused", "completed"] }).notNull().default("active"),
  color: text("color").notNull().default("#16a34a"),
  ...timestamps,
});

export const routines = pgTable("routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  activity: text("activity").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  studyTopicId: uuid("study_topic_id").references(() => studyTopics.id, { onDelete: "set null" }),
  hours: hours("hours").notNull(),
  weekdays: integer("weekdays").array().notNull(),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  ...timestamps,
});

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: date("date", { mode: "string" }).notNull(),
    activity: text("activity").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    hours: hours("hours").notNull(),
    notes: text("notes"),
    studyTopicId: uuid("study_topic_id").references(() => studyTopics.id, { onDelete: "set null" }),
    routineId: uuid("routine_id").references(() => routines.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    index("entries_date_idx").on(table.date),
    index("entries_category_idx").on(table.categoryId),
    index("entries_topic_idx").on(table.studyTopicId),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  entries: many(entries),
}));

export const entriesRelations = relations(entries, ({ one }) => ({
  category: one(categories, { fields: [entries.categoryId], references: [categories.id] }),
  studyTopic: one(studyTopics, { fields: [entries.studyTopicId], references: [studyTopics.id] }),
}));

export type Category = typeof categories.$inferSelect;
export type StudyTopic = typeof studyTopics.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type Entry = typeof entries.$inferSelect;
