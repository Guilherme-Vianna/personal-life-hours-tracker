import { z } from "zod";

const isoDate = z.iso.date({ error: "Data inválida" });
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => value || null);
const hours = z.coerce.number({ error: "Informe as horas" }).gt(0, "Precisa ser maior que zero").max(24, "No máximo 24h");
const studyType = z.enum(["theory", "practice"]).nullish().transform((value) => value ?? null);
const withDefaultStudyType = <T extends { studyTopicId: string | null; studyType: "theory" | "practice" | null }>(value: T) => ({
  ...value,
  studyType: value.studyType ?? (value.studyTopicId ? ("theory" as const) : null),
});
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const categoryInput = z.object({
  name: z.string().trim().min(1, "Informe o nome").max(60),
  description: optionalText(300),
  color: color.default("#16a34a"),
  isFixed: z.boolean().default(false),
});

export const entryInput = z.object({
  date: isoDate,
  activity: z.string().trim().min(1, "Informe a atividade").max(120),
  categoryId: z.uuid("Escolha uma categoria"),
  hours,
  notes: optionalText(500),
  studyTopicId: z.uuid().nullish().transform((value) => value ?? null),
  studyType,
}).transform(withDefaultStudyType);

export const topicInput = z
  .object({
    name: z.string().trim().min(1, "Informe o tema").max(100),
    description: optionalText(1000),
    categoryId: z.uuid().nullish().transform((value) => value ?? null),
    targetHours: z.coerce.number().gt(0, "Meta precisa ser maior que zero").max(10000),
    weeklyGoalHours: z.coerce.number().gt(0).max(168).nullish().transform((value) => value ?? null),
    startDate: isoDate.nullish().transform((value) => value ?? null),
    deadline: isoDate.nullish().transform((value) => value ?? null),
    status: z.enum(["active", "paused", "completed"]).default("active"),
    color: color.default("#16a34a"),
  })
  .refine((topic) => !topic.startDate || !topic.deadline || topic.deadline >= topic.startDate, {
    path: ["deadline"],
    message: "O prazo precisa ser depois do início",
  });

export const routineInput = z
  .object({
    activity: z.string().trim().min(1, "Informe a atividade").max(120),
    categoryId: z.uuid("Escolha uma categoria"),
    studyTopicId: z.uuid().nullish().transform((value) => value ?? null),
    studyType,
    hours,
    weekdays: z.array(z.number().int().min(0).max(6)).min(1, "Escolha ao menos um dia"),
    startDate: isoDate,
    endDate: isoDate.nullish().transform((value) => value ?? null),
    notes: optionalText(300),
    active: z.boolean().default(true),
  })
  .refine((routine) => !routine.endDate || routine.endDate >= routine.startDate, {
    path: ["endDate"],
    message: "A data final precisa ser depois do início",
  })
  .transform(withDefaultStudyType);

export type CategoryInput = z.infer<typeof categoryInput>;
export type EntryInput = z.infer<typeof entryInput>;
export type TopicInput = z.infer<typeof topicInput>;
export type RoutineInput = z.infer<typeof routineInput>;
