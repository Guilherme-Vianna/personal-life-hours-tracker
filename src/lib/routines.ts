import { eachDay, weekdayOf } from "./dates";

export type RoutineLike = {
  id: string;
  hours: number;
  weekdays: number[];
  startDate: string;
  endDate: string | null;
  active: boolean;
};

export function routineDates(routine: RoutineLike, from: string, to: string) {
  if (!routine.active) return [];
  const start = from > routine.startDate ? from : routine.startDate;
  const end = routine.endDate && routine.endDate < to ? routine.endDate : to;
  if (start > end) return [];
  return eachDay(start, end).filter((date) => routine.weekdays.includes(weekdayOf(date)));
}

export function routineEntryId(routineId: string, date: string) {
  return `rotina:${routineId}:${date}`;
}

export function weeklyHours(routine: Pick<RoutineLike, "hours" | "weekdays">) {
  return routine.hours * routine.weekdays.length;
}

export function routineStatus(routine: RoutineLike, today: string) {
  if (!routine.active) return "inactive" as const;
  if (routine.startDate > today) return "scheduled" as const;
  if (routine.endDate && routine.endDate < today) return "ended" as const;
  return "running" as const;
}
