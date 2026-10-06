"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { FocusMode, FocusSession, TimerKind } from "@/types/focus";
import {
  durationForMode,
  localDateKey,
  uniqueId,
} from "@/utils/timerUtils";

interface FocusSettings {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartBreak: boolean;
  autoStartFocus: boolean;
  dailyGoalMinutes: number;
}

interface CompleteOptions {
  completed?: boolean;
  durationMinutes?: number;
}

export interface FocusState extends FocusSettings {
  mode: FocusMode;
  timerKind: TimerKind;
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  currentRound: number;
  totalRounds: number;
  lastTickAt: number | null;
  currentNiyet: string;
  currentTag: string;
  currentTags: string[];
  sessionStartTime: string | null;
  activeSound: string | null;
  soundVolume: number;
  soundVolumes: Record<string, number>;
  backgroundId: string;
  favoriteMixes: Record<string, Record<string, number>>;
  sessions: FocusSession[];
  recentNiyets: string[];
  pendingCompletedSession: FocusSession | null;
  todayFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  coins: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipToNext: () => void;
  setMode: (mode: FocusMode) => void;
  setTimerKind: (kind: TimerKind) => void;
  setNiyet: (niyet: string) => void;
  setTag: (tag: string) => void;
  toggleTag: (tag: string) => void;
  updateSettings: (settings: Partial<FocusSettings>) => void;
  tick: (now?: number) => void;
  completeSession: (options?: CompleteOptions) => FocusSession | null;
  cancelSession: () => void;
  dismissCompletion: () => void;
  saveShukurNote: (sessionId: string, note: string) => void;
  setSoundVolume: (soundId: string, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setBackgroundId: (id: string) => void;
  saveFavoriteMix: (name: string) => void;
  loadFavoriteMix: (name: string) => void;
}

const defaultSettings: FocusSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreak: false,
  autoStartFocus: false,
  dailyGoalMinutes: 120,
};

function initialSeconds(mode: FocusMode, settings = defaultSettings): number {
  return durationForMode(mode, settings);
}

function calculateStats(sessions: FocusSession[]) {
  const completed = sessions.filter(
    (session) => session.completed && session.mode === "focus",
  );
  const today = localDateKey();
  const todayFocusMinutes = completed
    .filter((session) => localDateKey(new Date(session.startTime)) === today)
    .reduce((sum, session) => sum + session.duration, 0);

  const activeDays = new Set(
    completed.map((session) => localDateKey(new Date(session.startTime))),
  );
  let currentStreak = 0;
  const cursor = new Date();
  if (!activeDays.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (activeDays.has(localDateKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const sortedDays = [...activeDays].sort();
  let longestStreak = 0;
  let runningStreak = 0;
  let previous: Date | null = null;
  for (const day of sortedDays) {
    const current = new Date(`${day}T12:00:00`);
    const gap = previous
      ? Math.round((current.getTime() - previous.getTime()) / 86_400_000)
      : 0;
    runningStreak = previous && gap === 1 ? runningStreak + 1 : 1;
    longestStreak = Math.max(longestStreak, runningStreak);
    previous = current;
  }

  return {
    todayFocusMinutes,
    currentStreak,
    longestStreak,
    totalSessions: completed.length,
  };
}

function nextMode(state: FocusState): { mode: FocusMode; round: number } {
  if (state.mode === "focus") {
    const isLongBreak = state.currentRound >= state.totalRounds;
    return {
      mode: isLongBreak ? "longBreak" : "shortBreak",
      round: state.currentRound,
    };
  }
  return {
    mode: "focus",
    round:
      state.mode === "longBreak"
        ? 1
        : Math.min(state.totalRounds, state.currentRound + 1),
  };
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,
      mode: "focus",
      timerKind: "pomodoro",
      timeLeft: initialSeconds("focus"),
      totalTime: initialSeconds("focus"),
      isRunning: false,
      isPaused: false,
      currentRound: 1,
      totalRounds: 4,
      lastTickAt: null,
      currentNiyet: "",
      currentTag: "",
      currentTags: [],
      sessionStartTime: null,
      activeSound: null,
      soundVolume: 0.65,
      soundVolumes: {},
      backgroundId: "kaaba-night",
      favoriteMixes: {},
      sessions: [],
      recentNiyets: [],
      pendingCompletedSession: null,
      todayFocusMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalSessions: 0,
      coins: 0,

      startTimer: () => {
        const state = get();
        const now = Date.now();
        set({
          isRunning: true,
          isPaused: false,
          lastTickAt: now,
          sessionStartTime:
            state.sessionStartTime ?? new Date(now).toISOString(),
          pendingCompletedSession: null,
        });
      },
      pauseTimer: () => {
        get().tick();
        set({ isRunning: false, isPaused: true, lastTickAt: null });
      },
      resetTimer: () => {
        const state = get();
        const total =
          state.timerKind === "stopwatch"
            ? 0
            : durationForMode(state.mode, state);
        set({
          timeLeft: total,
          totalTime: total,
          isRunning: false,
          isPaused: false,
          lastTickAt: null,
          sessionStartTime: null,
          pendingCompletedSession: null,
        });
      },
      skipToNext: () => {
        const state = get();
        const next = nextMode(state);
        const total =
          state.timerKind === "stopwatch"
            ? 0
            : durationForMode(next.mode, state);
        set({
          mode: next.mode,
          currentRound: next.round,
          timeLeft: total,
          totalTime: total,
          isRunning: false,
          isPaused: false,
          lastTickAt: null,
          sessionStartTime: null,
          pendingCompletedSession: null,
        });
      },
      setMode: (mode) => {
        const state = get();
        if (state.isRunning) return;
        const total =
          state.timerKind === "stopwatch"
            ? 0
            : durationForMode(mode, state);
        set({
          mode,
          timeLeft: total,
          totalTime: total,
          isPaused: false,
          sessionStartTime: null,
          pendingCompletedSession: null,
        });
      },
      setTimerKind: (timerKind) => {
        const state = get();
        if (state.isRunning) return;
        const total =
          timerKind === "stopwatch"
            ? 0
            : durationForMode(state.mode, state);
        set({
          timerKind,
          timeLeft: total,
          totalTime: total,
          isPaused: false,
          sessionStartTime: null,
          pendingCompletedSession: null,
        });
      },
      setNiyet: (currentNiyet) =>
        set({ currentNiyet: currentNiyet.trim().slice(0, 100) }),
      setTag: (currentTag) =>
        set({ currentTag, currentTags: currentTag ? [currentTag] : [] }),
      toggleTag: (tag) => {
        const tags = get().currentTags;
        const currentTags = tags.includes(tag)
          ? tags.filter((item) => item !== tag)
          : [...tags, tag];
        set({ currentTags, currentTag: currentTags[0] ?? "" });
      },
      updateSettings: (settings) => {
        const state = get();
        const next = { ...state, ...settings };
        const total =
          state.timerKind === "stopwatch"
            ? state.totalTime
            : durationForMode(state.mode, next);
        set({
          ...settings,
          ...(state.isRunning
            ? {}
            : { totalTime: total, timeLeft: total, isPaused: false }),
        });
      },
      tick: (now = Date.now()) => {
        const state = get();
        if (!state.isRunning || state.lastTickAt === null) return;
        const elapsed = Math.max(
          0,
          Math.floor((now - state.lastTickAt) / 1000),
        );
        if (elapsed < 1) return;
        if (state.timerKind === "stopwatch") {
          set({ timeLeft: state.timeLeft + elapsed, lastTickAt: now });
          return;
        }
        const remaining = Math.max(0, state.timeLeft - elapsed);
        set({
          timeLeft: remaining,
          lastTickAt: now,
          ...(remaining === 0 ? { isRunning: false, lastTickAt: null } : {}),
        });
      },
      completeSession: (options = {}) => {
        const state = get();
        if (!state.sessionStartTime) return null;
        const measuredMinutes =
          state.timerKind === "stopwatch"
            ? Math.max(1, Math.round(state.timeLeft / 60))
            : Math.max(1, Math.round((state.totalTime - state.timeLeft) / 60));
        const duration = options.durationMinutes ?? measuredMinutes;
        const session: FocusSession = {
          id: uniqueId(),
          startTime: state.sessionStartTime,
          endTime: new Date().toISOString(),
          duration,
          mode: state.mode,
          completed: options.completed ?? true,
          niyet: state.currentNiyet,
          tags: state.currentTags,
        };
        const sessions = [session, ...state.sessions].slice(0, 500);
        const recentNiyets = state.currentNiyet
          ? [
              state.currentNiyet,
              ...state.recentNiyets.filter(
                (item) => item !== state.currentNiyet,
              ),
            ].slice(0, 5)
          : state.recentNiyets;
        const stats = calculateStats(sessions);
        set({
          sessions,
          recentNiyets,
          ...stats,
          coins:
            state.coins +
            (session.completed && session.mode === "focus"
              ? Math.max(1, Math.round(duration / 5))
              : 0),
          isRunning: false,
          isPaused: false,
          lastTickAt: null,
          sessionStartTime: null,
          pendingCompletedSession:
            session.completed && session.mode === "focus" ? session : null,
        });
        return session;
      },
      cancelSession: () => {
        const state = get();
        if (state.sessionStartTime) get().completeSession({ completed: false });
        get().resetTimer();
      },
      dismissCompletion: () => set({ pendingCompletedSession: null }),
      saveShukurNote: (sessionId, note) => {
        const cleanNote = note.trim().slice(0, 200);
        set((state) => ({
          sessions: state.sessions.map((session) =>
            session.id === sessionId
              ? { ...session, shukurNote: cleanNote }
              : session,
          ),
          pendingCompletedSession:
            state.pendingCompletedSession?.id === sessionId
              ? { ...state.pendingCompletedSession, shukurNote: cleanNote }
              : state.pendingCompletedSession,
        }));
      },
      setSoundVolume: (soundId, volume) => {
        const safeVolume = Math.min(1, Math.max(0, volume));
        set((state) => ({
          activeSound: safeVolume > 0 ? soundId : state.activeSound,
          soundVolumes: { ...state.soundVolumes, [soundId]: safeVolume },
        }));
      },
      setMasterVolume: (soundVolume) =>
        set({ soundVolume: Math.min(1, Math.max(0, soundVolume)) }),
      setBackgroundId: (backgroundId) => set({ backgroundId }),
      saveFavoriteMix: (name) => {
        const cleanName = name.trim().slice(0, 32);
        if (!cleanName) return;
        set((state) => ({
          favoriteMixes: {
            ...state.favoriteMixes,
            [cleanName]: { ...state.soundVolumes },
          },
        }));
      },
      loadFavoriteMix: (name) => {
        const mix = get().favoriteMixes[name];
        if (mix) set({ soundVolumes: { ...mix } });
      },
    }),
    {
      name: "sah-focus-sanctuary-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        timerKind: state.timerKind,
        timeLeft: state.timeLeft,
        totalTime: state.totalTime,
        isRunning: state.isRunning,
        isPaused: state.isPaused,
        currentRound: state.currentRound,
        totalRounds: state.totalRounds,
        lastTickAt: state.lastTickAt,
        focusDuration: state.focusDuration,
        shortBreakDuration: state.shortBreakDuration,
        longBreakDuration: state.longBreakDuration,
        autoStartBreak: state.autoStartBreak,
        autoStartFocus: state.autoStartFocus,
        dailyGoalMinutes: state.dailyGoalMinutes,
        currentNiyet: state.currentNiyet,
        currentTag: state.currentTag,
        currentTags: state.currentTags,
        sessionStartTime: state.sessionStartTime,
        activeSound: state.activeSound,
        soundVolume: state.soundVolume,
        soundVolumes: state.soundVolumes,
        backgroundId: state.backgroundId,
        favoriteMixes: state.favoriteMixes,
        sessions: state.sessions,
        recentNiyets: state.recentNiyets,
        pendingCompletedSession: state.pendingCompletedSession,
        todayFocusMinutes: state.todayFocusMinutes,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        totalSessions: state.totalSessions,
        coins: state.coins,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<FocusState>) };
        return { ...merged, ...calculateStats(merged.sessions ?? []) };
      },
    },
  ),
);

