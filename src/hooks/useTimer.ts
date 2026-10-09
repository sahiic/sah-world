"use client";
import { useCallback } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { ambientEngine } from "@/lib/ambientEngine";

// The shared layout owns the clock; controls never create another interval.
export function useTimer() {
  const start = useCallback(async () => {
    useFocusStore.getState().startTimer();
    await ambientEngine.unlock();
    const state = useFocusStore.getState();
    ambientEngine.sync(state.isPaused || state.soundMuted ? {} : state.soundVolumes, state.soundVolume);
  }, []);
  return {
    start,
    pause: useFocusStore.getState().pauseTimer,
    reset: useFocusStore.getState().resetTimer,
    skip: useFocusStore.getState().skipToNext,
  };
}
