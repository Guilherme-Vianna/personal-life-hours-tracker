import { eachDay, weekdayOf, WEEKDAYS } from "./dates";

export type RoutineLike = {
  id: string;
  activity: string;
  categoryId: string;
  studyTopicId: string | null;
  hours: number;
  weekdays: number[];
  notes: string | null;
};

export type PlannedEntry = {
  date: string;
  activity: string;
  categoryId: string;
  studyTopicId: string | null;
  hours: number;
  notes: string | null;
  routineId: string;
};

const weekdayLabel = new Map<number, string>(WEEKDAYS.map((day) => [day.value, day.label]));

export function planRoutineEntries(routines: RoutineLike[], from: string, to: string): PlannedEntry[] {
  const planned: PlannedEntry[] = [];
  for (const date of eachDay(from, to)) {
    const weekday = weekdayOf(date);
    for (const routine of routines) {
      if (!routine.weekdays.includes(weekday)) continue;
      planned.push({
        date,
        activity: routine.activity,
        categoryId: routine.categoryId,
        studyTopicId: routine.studyTopicId,
        hours: routine.hours,
        notes: routine.notes ? `${routine.notes} (${weekdayLabel.get(weekday)})` : `Rotina (${weekdayLabel.get(weekday)})`,
        routineId: routine.id,
      });
    }
  }
  return planned;
}

export function weeklyHours(routine: Pick<RoutineLike, "hours" | "weekdays">) {
  return routine.hours * routine.weekdays.length;
}
