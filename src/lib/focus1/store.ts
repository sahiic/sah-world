
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { localDayKey, uid } from "./format";
import type { SceneId, SoundId } from "./scenes";

export type FocusMode = "focus" | "break";
export type FocusPhase = "idle" | "running" | "paused" | "finished";

export type FocusTodo = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

export type FocusSession = {
  id: string;
  mode: FocusMode;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  completed: boolean;
  task: string;
};

type FocusState = {
  mode: FocusMode;
  phase: FocusPhase;
  focusMinutes: number;
  breakMinutes: number;
  startedAt: number | null;
  pausedAt: number | null;
  pausedAccumMs: number;
  intention: string;
  todos: FocusTodo[];
  sessions: FocusSession[];
  sceneId: SceneId;
  soundId: SoundId;
  volume: number;
  setMode: (mode: FocusMode) => void;
  setFocusMinutes: (minutes: number) => void;
  setBreakMinutes: (minutes: number) => void;
  setIntention: (value: string) => void;
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  removeTodo: (id: string) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  complete: (completed: boolean) => void;
  reset: () => void;
  setScene: (id: SceneId) => void;
  setSound: (id: SoundId) => void;
  setVolume: (volume: number) => void;
};

function plannedSeconds(state: Pick<FocusState, "mode" | "focusMinutes" | "breakMinutes">) {
  return (state.mode === "focus" ? state.focusMinutes : state.breakMinutes) * 60;
}

export function getElapsedSeconds(state: FocusState, now: number): number {
  if (state.phase === "idle" || !state.startedAt) return 0;
  if (state.phase === "finished") {
    const last = state.sessions[state.sessions.length - 1];
    return last?.durationSeconds ?? 0;
  }
  const pauseDelta = state.pausedAt ? now - state.pausedAt : 0;
  return Math.max(0, (now - state.startedAt - state.pausedAccumMs - pauseDelta) / 1000);
}

export function getRemainingSeconds(state: FocusState, now: number): number {
  return Math.max(0, plannedSeconds(state) - getElapsedSeconds(state, now));
}

export function getProgress(state: FocusState, now: number): number {
  const planned = plannedSeconds(state);
  if (state.phase === "idle") return 0;
  return Math.min(1, getElapsedSeconds(state, now) / Math.max(1, planned));
}

export function todayFocusSeconds(sessions: FocusSession[], extra = 0, now = Date.now()) {
  const day = localDayKey(now);
  const logged = sessions
    .filter((session) => session.mode === "focus" && localDayKey(session.endedAt) === day)
    .reduce((sum, session) => sum + session.durationSeconds, 0);
  return logged + extra;
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      mode: "focus",
      phase: "idle",
      focusMinutes: 25,
      breakMinutes: 5,
      startedAt: null,
      pausedAt: null,
      pausedAccumMs: 0,
      intention: "",
      todos: [],
      sessions: [],
      sceneId: "lagoon",
      soundId: "none",
      volume: 0.4,
      setMode: (mode) => {
        const { phase } = get();
        if (phase === "running" || phase === "paused") return;
        set({ mode, phase: "idle", startedAt: null, pausedAt: null, pausedAccumMs: 0 });
      },
      setFocusMinutes: (minutes) => {
        if (get().phase === "running" || get().phase === "paused") return;
        set({ focusMinutes: Math.min(180, Math.max(1, Math.round(minutes))) });
      },
      setBreakMinutes: (minutes) => {
        if (get().phase === "running" || get().phase === "paused") return;
        set({ breakMinutes: Math.min(60, Math.max(1, Math.round(minutes))) });
      },
      setIntention: (value) => set({ intention: value.slice(0, 80) }),
      addTodo: (text) => {
        const clean = text.trim().slice(0, 80);
        if (!clean) return;
        const { todos } = get();
        if (todos.some((todo) => todo.text.toLowerCase() === clean.toLowerCase() && !todo.done)) {
          set({ intention: clean });
          return;
        }
        set({
          intention: clean,
          todos: [
            ...todos,
            { id: uid(), text: clean, done: false, createdAt: Date.now() },
          ].slice(-12),
        });
      },
      toggleTodo: (id) =>
        set({
          todos: get().todos.map((todo) =>
            todo.id === id ? { ...todo, done: !todo.done } : todo,
          ),
        }),
      removeTodo: (id) => set({ todos: get().todos.filter((todo) => todo.id !== id) }),
      start: () => {
        const now = Date.now();
        const { intention, todos } = get();
        const draft = intention.trim();
        if (draft && !todos.some((todo) => todo.text.toLowerCase() === draft.toLowerCase() && !todo.done)) {
          get().addTodo(draft);
        }
        set({
          phase: "running",
          startedAt: now,
          pausedAt: null,
          pausedAccumMs: 0,
        });
      },
      pause: () => {
        if (get().phase !== "running") return;
        set({ phase: "paused", pausedAt: Date.now() });
      },
      resume: () => {
        const { phase, pausedAt, pausedAccumMs } = get();
        if (phase !== "paused" || !pausedAt) return;
        set({
          phase: "running",
          pausedAt: null,
          pausedAccumMs: pausedAccumMs + (Date.now() - pausedAt),
        });
      },
      complete: (completed) => {
        const state = get();
        if (state.phase !== "running" && state.phase !== "paused") return;
        const now = Date.now();
        const elapsed = Math.round(getElapsedSeconds(state, now));
        const current =
          state.intention.trim() ||
          state.todos.find((todo) => !todo.done)?.text ||
          "";
        const session: FocusSession = {
          id: uid(),
          mode: state.mode,
          startedAt: state.startedAt ?? now,
          endedAt: now,
          durationSeconds: elapsed,
          completed,
          task: current,
        };
        set({
          phase: "finished",
          pausedAt: null,
          sessions: [...state.sessions, session].slice(-200),
        });
      },
      reset: () =>
        set({
          phase: "idle",
          startedAt: null,
          pausedAt: null,
          pausedAccumMs: 0,
        }),
      setScene: (id) => set({ sceneId: id }),
      setSound: (id) => set({ soundId: id }),
      setVolume: (volume) => set({ volume: Math.min(1, Math.max(0, volume)) }),
    }),
    {
      name: "cove-focus",
      skipHydration: true,
      partialize: (state) => ({
        mode: state.mode,
        phase: state.phase,
        focusMinutes: state.focusMinutes,
        breakMinutes: state.breakMinutes,
        startedAt: state.startedAt,
        pausedAt: state.pausedAt,
        pausedAccumMs: state.pausedAccumMs,
        intention: state.intention,
        todos: state.todos,
        sessions: state.sessions,
        sceneId: state.sceneId,
        soundId: state.soundId,
        volume: state.volume,
      }),
    },
  ),
);