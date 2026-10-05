"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFocusStore } from "@/stores/focusStore";

function playCompletionTone() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(523.25, context.currentTime);
    oscillator.frequency.setValueAtTime(659.25, context.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.56);
    oscillator.addEventListener("ended", () => void context.close());
  } catch {
    // The timer remains functional when the browser blocks audio.
  }
}

export function useTimer() {
  const store = useFocusStore();
  const completionHandled = useRef(false);

  const finish = useCallback(() => {
    const state = useFocusStore.getState();
    if (!state.sessionStartTime || completionHandled.current) return;
    completionHandled.current = true;
    const session = state.completeSession({
      completed: true,
      durationMinutes:
        state.mode === "focus"
          ? state.focusDuration
          : state.mode === "shortBreak"
            ? state.shortBreakDuration
            : state.longBreakDuration,
    });
    if (!session) return;
    if (session.mode !== "focus" && state.autoStartFocus) {
      state.skipToNext();
      state.startTimer();
    }
    playCompletionTone();
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      new Notification(
        session.mode === "focus"
          ? "Mâşâallah, odak oturumun tamamlandı"
          : "Molan tamamlandı",
        {
          body:
            session.mode === "focus"
              ? `${session.duration} dakikalık niyetin tamamlandı.`
              : "Yeni bir odak için hazırsın.",
          icon: "/icon.svg",
        },
      );
    }
  }, []);

  useEffect(() => {
    if (!store.isRunning) return;
    const interval = window.setInterval(() => {
      const state = useFocusStore.getState();
      const hadTime = state.timeLeft > 0;
      state.tick();
      const next = useFocusStore.getState();
      if (
        state.timerKind === "pomodoro" &&
        hadTime &&
        next.timeLeft === 0 &&
        !next.isRunning
      ) {
        finish();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [finish, store.isRunning]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const state = useFocusStore.getState();
      const hadTime = state.timeLeft > 0;
      state.tick();
      const next = useFocusStore.getState();
      if (
        state.timerKind === "pomodoro" &&
        hadTime &&
        next.timeLeft === 0 &&
        !next.isRunning
      ) {
        finish();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [finish]);

  useEffect(() => {
    if (store.sessionStartTime) completionHandled.current = false;
  }, [store.sessionStartTime]);

  const start = useCallback(async () => {
    completionHandled.current = false;
    useFocusStore.getState().startTimer();
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        // Permission is optional.
      }
    }
  }, []);

  return {
    start,
    pause: store.pauseTimer,
    reset: store.resetTimer,
    skip: store.skipToNext,
  };
}
