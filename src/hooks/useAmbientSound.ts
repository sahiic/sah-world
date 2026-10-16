"use client";
import { useSyncExternalStore } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { AMBIENT_RECORDINGS, ambientEngine } from "@/lib/ambientEngine";

export const AMBIENT_SOUNDS = AMBIENT_RECORDINGS;
export function useAmbientSound() {
  const soundVolumes = useFocusStore((state) => state.soundVolumes);
  const masterVolume = useFocusStore((state) => state.soundVolume);
  const muted = useFocusStore((state) => state.soundMuted);
  const status = useSyncExternalStore(
    ambientEngine.subscribe,
    ambientEngine.snapshot,
    () => "",
  );
  const enable = async () => {
    await ambientEngine.unlock();
    const state = useFocusStore.getState();
    ambientEngine.sync(state.isPaused || state.soundMuted ? {} : state.soundVolumes, state.soundVolume);
  };
  const updateChannel = async (id: string, volume: number) => {
    useFocusStore.getState().setSoundMix(volume > 0 ? { [id]: volume } : {});
    if (volume > 0) await enable();
    else ambientEngine.stop();
  };
  const applyMix = async (volumes: Record<string, number>) => {
    useFocusStore.getState().setSoundMix(volumes);
    if (Object.values(volumes).some(value => value > 0)) await enable();
    else ambientEngine.stop();
  };
  const toggleMute = async () => {
    const next = !useFocusStore.getState().soundMuted;
    useFocusStore.getState().setSoundMuted(next);
    if (next) ambientEngine.stop();
    else await enable();
  };
  return {
    sounds: AMBIENT_SOUNDS,
    soundVolumes,
    masterVolume,
    muted,
    toggleMute,
    applyMix,
    status,
    enable,
    updateChannel,
    setMasterVolume: useFocusStore.getState().setMasterVolume,
  };
}
