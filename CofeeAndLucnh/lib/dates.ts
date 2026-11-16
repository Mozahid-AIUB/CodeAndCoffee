/** All app time logic/display uses Asia/Dhaka (UTC+6, no DST). */
export const TZ = "Asia/Dhaka";

/** 12-hour time with AM/PM, e.g. "10:30 PM". */
export function formatTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(d));
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(d));
}

/** YYYY-MM-DD of "now" (or given instant) in Asia/Dhaka. */
export function dhakaDateString(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
}

/** ISO timestamp N days before now. */
export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
}

/** Add days to a YYYY-MM-DD string (pure calendar math, DST-free). */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Weekday key (sun..sat) for a YYYY-MM-DD string. */
export function weekdayKey(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][
    new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  ];
}

/** Next working day after today (Dhaka), e.g. workingDays = ["sun","mon",...]. */
export function nextWorkingDay(workingDays: string[], from: Date = new Date()): string {
  let day = addDays(dhakaDateString(from), 1);
  for (let i = 0; i < 7; i++) {
    if (workingDays.includes(weekdayKey(day))) return day;
    day = addDays(day, 1);
  }
  return day;
}
