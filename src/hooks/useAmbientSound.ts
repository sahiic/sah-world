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
export const AMBIENT_MIXES: { name: string; description: string; volumes: Record<string, number> }[] = [
  { name: "Yağmurlu okuma", description: "Hafif yağmur · şömine", volumes: { "soft-rain": 0.5, fireplace: 0.25 } },
  { name: "Orman yürüyüşü", description: "Orman · dere · kuşlar", volumes: { forest: 0.4, stream: 0.25, birds: 0.2 } },
  { name: "Derin odak", description: "Kahverengi gürültü · rüzgâr", volumes: { "brown-noise": 0.45, wind: 0.15 } },
  { name: "Sakin kıyı", description: "Okyanus · hafif rüzgâr", volumes: { ocean: 0.5, wind: 0.2 } },
];
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
    useFocusStore.getState().setSoundVolume(id, volume);
    if (volume > 0) await enable();
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
