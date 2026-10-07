"use client";
import { useFocusStore } from "@/stores/focusStore";
import { ambientEngine } from "@/lib/ambientEngine";

// The shared layout owns the clock; controls never create another interval.
export function useTimer() {
  const start = async () => {
    useFocusStore.getState().startTimer();
    await ambientEngine.unlock();
    const state = useFocusStore.getState();
    ambientEngine.sync(state.soundVolumes, state.soundVolume);
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch {
        /* optional */
      }
    }
  };
  return {
    start,
    pause: useFocusStore.getState().pauseTimer,
    reset: useFocusStore.getState().resetTimer,
    skip: useFocusStore.getState().skipToNext,
  };
}
