import type { AlertColor } from "@/lib/types/database";

export const DEFAULT_NET_CHANGE_PERIOD_DAYS = 60;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value + "T00:00:00");
}

export function daysBetween(from: string | Date, to: string | Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / msPerDay);
}

export function addDays(date: string | Date, days: number): Date {
  const d = toDate(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function nextChangeDate(
  installationDate: string | Date,
  periodDays: number = DEFAULT_NET_CHANGE_PERIOD_DAYS,
): Date {
  return addDays(installationDate, periodDays);
}

export function daysRemaining(expectedChangeDate: string | Date, today: Date = new Date()): number {
  return daysBetween(today, expectedChangeDate);
}

export function daysInWater(installationDate: string | Date, today: Date = new Date()): number {
  return daysBetween(installationDate, today);
}

/**
 * Green >14d, Yellow <=14d, Orange <=7d, Red due today or overdue.
 * Thresholds are configurable via system_settings; callers may override.
 */
export function alertColor(
  daysRemainingValue: number,
  yellowThreshold = 14,
  orangeThreshold = 7,
): AlertColor {
  if (daysRemainingValue <= 0) return "red";
  if (daysRemainingValue <= orangeThreshold) return "orange";
  if (daysRemainingValue <= yellowThreshold) return "yellow";
  return "green";
}

export const ALERT_COLOR_CLASSES: Record<AlertColor, string> = {
  green: "bg-status-green-bg text-status-green border-status-green/30",
  yellow: "bg-status-yellow-bg text-status-yellow-foreground border-status-yellow/40",
  orange: "bg-status-orange-bg text-status-orange border-status-orange/30",
  red: "bg-status-red-bg text-status-red border-status-red/30",
};

export const ALERT_DOT_CLASSES: Record<AlertColor | "grey", string> = {
  green: "bg-status-green",
  yellow: "bg-status-yellow",
  orange: "bg-status-orange",
  red: "bg-status-red",
  grey: "bg-status-grey",
};

export function formatDate(value: string | Date | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!value) return "—";
  const d = toDate(value);
  return d.toLocaleDateString("en-GB", opts ?? { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDaysRemaining(days: number): string {
  if (days < 0) return `${Math.abs(days)} DAYS OVERDUE`;
  if (days === 0) return "DUE TODAY";
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

/** Status → badge color key, used when a net_statuses lookup color isn't loaded */
export const STATUS_COLOR_FALLBACK: Record<string, string> = {
  "Available in Store": "green",
  "Installed in Cage": "blue",
  "Sent for Cleaning": "purple",
  "Under Cleaning": "purple",
  "Ready for Use": "green",
  "Under Repair": "orange",
  "Ready After Repair": "green",
  Reserved: "blue",
  Lost: "grey",
  Damaged: "red",
  "Beyond Repair": "red",
  Disposed: "grey",
};
