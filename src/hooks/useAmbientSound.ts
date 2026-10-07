"use client";
import { useSyncExternalStore } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { ambientEngine } from "@/lib/ambientEngine";
export const AMBIENT_SOUNDS = [
  { id: "rain", name: "Yağmur", category: "Doğa" },
  { id: "soft-rain", name: "Hafif yağmur", category: "Doğa" },
  { id: "birds", name: "Kuş sesleri", category: "Doğa" },
  { id: "wind", name: "Rüzgâr", category: "Doğa" },
  { id: "ocean", name: "Okyanus", category: "Doğa" },
  { id: "fireplace", name: "Şömine", category: "Doğa" },
  { id: "forest", name: "Orman", category: "Doğa" },
  { id: "stream", name: "Dere", category: "Doğa" },
  { id: "waterfall", name: "Şelale", category: "Doğa" },
  { id: "night-garden", name: "Gece bahçesi", category: "Doğa" },
  { id: "white-noise", name: "Beyaz gürültü", category: "Gürültü" },
  { id: "brown-noise", name: "Kahverengi gürültü", category: "Gürültü" },
  { id: "pink-noise", name: "Pembe gürültü", category: "Gürültü" },
  { id: "fan", name: "Vantilatör", category: "Ortam" },
  { id: "train", name: "Tren ritmi", category: "Ortam" },
] as const;
export function useAmbientSound() {
  const soundVolumes = useFocusStore((state) => state.soundVolumes);
  const masterVolume = useFocusStore((state) => state.soundVolume);
  const status = useSyncExternalStore(
    ambientEngine.subscribe,
    ambientEngine.snapshot,
    () => "",
  );
  const enable = async () => {
    await ambientEngine.unlock();
    const state = useFocusStore.getState();
    ambientEngine.sync(state.isPaused ? {} : state.soundVolumes, state.soundVolume);
  };
  const updateChannel = async (id: string, volume: number) => {
    useFocusStore.getState().setSoundVolume(id, volume);
    await enable();
  };
  return {
    sounds: AMBIENT_SOUNDS,
    soundVolumes,
    masterVolume,
    status,
    enable,
    updateChannel,
    setMasterVolume: useFocusStore.getState().setMasterVolume,
  };
}
