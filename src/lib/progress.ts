import { addDays, daysBetween, startOfWeek } from "./dates";

export type TopicProgressInput = {
  targetHours: number;
  weeklyGoalHours: number | null;
  startDate: string | null;
  deadline: string | null;
  status: "active" | "paused" | "completed";
  createdAt: string;
  sessions: { date: string; hours: number }[];
};

export type TopicProgress = {
  totalHours: number;
  remainingHours: number;
  percent: number;
  weekHours: number;
  weekPercent: number | null;
  sessionsCount: number;
  lastSessionDate: string | null;
  weeklyAverage: number;
  estimatedFinish: string | null;
  daysLeft: number | null;
  requiredWeeklyPace: number | null;
  pace: "done" | "ahead" | "on-track" | "behind" | "no-data";
};

const PACE_WINDOW_DAYS = 28;

export function topicProgress(topic: TopicProgressInput, today: string): TopicProgress {
  const totalHours = topic.sessions.reduce((total, session) => total + session.hours, 0);
  const remainingHours = Math.max(0, topic.targetHours - totalHours);
  const percent = topic.targetHours > 0 ? Math.min(100, (totalHours / topic.targetHours) * 100) : 0;

  const weekStart = startOfWeek(today);
  const weekHours = topic.sessions.filter((s) => s.date >= weekStart && s.date <= today).reduce((t, s) => t + s.hours, 0);
  const weekPercent = topic.weeklyGoalHours ? Math.min(100, (weekHours / topic.weeklyGoalHours) * 100) : null;

  const dates = topic.sessions.map((s) => s.date).sort();
  const firstDay = topic.startDate ?? dates[0] ?? topic.createdAt.slice(0, 10);
  const windowStart = [firstDay, addDays(today, -(PACE_WINDOW_DAYS - 1))].sort()[1];
  const windowDays = Math.max(7, daysBetween(windowStart, today) + 1);
  const windowHours = topic.sessions.filter((s) => s.date >= windowStart && s.date <= today).reduce((t, s) => t + s.hours, 0);
  const weeklyAverage = (windowHours / windowDays) * 7;

  const estimatedFinish =
    remainingHours === 0 ? null : weeklyAverage > 0 ? addDays(today, Math.ceil((remainingHours / weeklyAverage) * 7)) : null;
  const daysLeft = topic.deadline ? daysBetween(today, topic.deadline) : null;
  const requiredWeeklyPace =
    topic.deadline && remainingHours > 0 ? remainingHours / Math.max(1, (Math.max(daysLeft ?? 0, 0) + 1) / 7) : null;

  let pace: TopicProgress["pace"] = "no-data";
  if (remainingHours === 0 || topic.status === "completed") pace = "done";
  else if (requiredWeeklyPace !== null) pace = weeklyAverage >= requiredWeeklyPace * 1.1 ? "ahead" : weeklyAverage >= requiredWeeklyPace * 0.9 ? "on-track" : "behind";
  else if (topic.weeklyGoalHours) pace = weeklyAverage >= topic.weeklyGoalHours * 1.1 ? "ahead" : weeklyAverage >= topic.weeklyGoalHours * 0.9 ? "on-track" : "behind";
  else if (weeklyAverage > 0) pace = "on-track";

  return {
    totalHours,
    remainingHours,
    percent,
    weekHours,
    weekPercent,
    sessionsCount: topic.sessions.length,
    lastSessionDate: dates.at(-1) ?? null,
    weeklyAverage,
    estimatedFinish,
    daysLeft,
    requiredWeeklyPace,
    pace,
  };
}

export const PACE_LABELS: Record<TopicProgress["pace"], { label: string; tone: string }> = {
  done: { label: "Meta concluída", tone: "bg-brand-100 text-brand-800" },
  ahead: { label: "Adiantado", tone: "bg-brand-100 text-brand-800" },
  "on-track": { label: "No ritmo", tone: "bg-lime-100 text-lime-800" },
  behind: { label: "Atrasado", tone: "bg-amber-100 text-amber-800" },
  "no-data": { label: "Sem sessões recentes", tone: "bg-slate-100 text-slate-600" },
};
