export type FocusMode = "focus" | "shortBreak" | "longBreak";
export type TimerKind = "pomodoro" | "stopwatch";

export interface FocusSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  mode: FocusMode;
  completed: boolean;
  niyet: string;
  tags: string[];
  shukurNote?: string;
}

export interface DailyStats {
  date: string;
  totalFocusMinutes: number;
  sessionsCompleted: number;
  longestSession: number;
}

export interface FocusQuote {
  text: string;
  source: string;
  type: "hadis" | "ayet";
}

export interface AmbientSoundDefinition {
  id: string;
  name: string;
  category: "Doğa" | "Gürültü" | "İslami";
  file: string;
  icon: string;
}

export interface PrayerSchedule {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

