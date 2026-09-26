import { differenceInCalendarDays, differenceInMonths, differenceInYears } from "date-fns";

/** Human-friendly age from a date of birth, e.g. "3 years", "8 months". */
export function calculateAnimalAge(dateOfBirth: Date | null, today: Date = new Date()): string | null {
  if (!dateOfBirth) return null;
  const months = differenceInMonths(today, dateOfBirth);
  if (months < 1) return "Under 1 month";
  if (months < 24) return `${months} month${months === 1 ? "" : "s"}`;
  const years = differenceInYears(today, dateOfBirth);
  return `${years} year${years === 1 ? "" : "s"}`;
}

export function calculateMilkTotal(morningLiters: number | null, eveningLiters: number | null): number {
  return (morningLiters ?? 0) + (eveningLiters ?? 0);
}

export type ReminderStatus = "upcoming" | "completed" | "overdue" | "dismissed";

/**
 * Derives display status from a due date + stored status.
 * `completed`/`dismissed` are sticky (set explicitly); everything else
 * flips to `overdue` once the due date has passed.
 */
export function calculateReminderStatus(
  dueDate: Date,
  storedStatus: ReminderStatus,
  today: Date = new Date()
): ReminderStatus {
  if (storedStatus === "completed" || storedStatus === "dismissed") return storedStatus;
  const daysUntilDue = differenceInCalendarDays(dueDate, today);
  return daysUntilDue < 0 ? "overdue" : "upcoming";
}
