import type { FocusMode, FocusSession } from "@/types/focus";

export function formatTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function durationForMode(
  mode: FocusMode,
  settings: {
    focusDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
  },
): number {
  const minutes =
    mode === "focus"
      ? settings.focusDuration
      : mode === "shortBreak"
        ? settings.shortBreakDuration
        : settings.longBreakDuration;
  return minutes * 60;
}

export function formatMinutes(totalMinutes: number): string {
  const safeMinutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  if (!hours) return `${minutes} dk`;
  if (!minutes) return `${hours} sa`;
  return `${hours} sa ${minutes} dk`;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function completedFocusSessions(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter(
    (session) => session.completed && session.mode === "focus",
  );
}

export function uniqueId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

