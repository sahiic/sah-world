"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import type { AmbientSoundDefinition } from "@/types/focus";

export const AMBIENT_SOUNDS: AmbientSoundDefinition[] = [
  { id: "rain", name: "Yağmur", category: "Doğa", file: "/sounds/rain.mp3", icon: "CloudRain" },
  { id: "birds", name: "Kuş sesleri", category: "Doğa", file: "/sounds/birds.mp3", icon: "Bird" },
  { id: "wind", name: "Rüzgâr", category: "Doğa", file: "/sounds/wind.mp3", icon: "Wind" },
  { id: "ocean", name: "Okyanus", category: "Doğa", file: "/sounds/ocean.mp3", icon: "Waves" },
  { id: "fireplace", name: "Şömine", category: "Doğa", file: "/sounds/fireplace.mp3", icon: "Flame" },
  { id: "forest", name: "Orman", category: "Doğa", file: "/sounds/forest.mp3", icon: "Trees" },
  { id: "white-noise", name: "Beyaz gürültü", category: "Gürültü", file: "/sounds/white-noise.mp3", icon: "AudioLines" },
  { id: "brown-noise", name: "Kahverengi gürültü", category: "Gürültü", file: "/sounds/brown-noise.mp3", icon: "AudioWaveform" },
  { id: "pink-noise", name: "Pembe gürültü", category: "Gürültü", file: "/sounds/pink-noise.mp3", icon: "Activity" },
  { id: "quran-tilawah", name: "Kur’an tilaveti", category: "İslami", file: "/sounds/quran-tilawah.mp3", icon: "BookOpen" },
  { id: "tasbih-ambient", name: "Tesbih / zikir", category: "İslami", file: "/sounds/tasbih-ambient.mp3", icon: "CircleDot" },
  { id: "mosque-ambience", name: "Cami atmosferi", category: "İslami", file: "/sounds/mosque-ambience.mp3", icon: "MoonStar" },
];

interface Channel {
  audio: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

export function useAmbientSound() {
  const soundVolumes = useFocusStore((state) => state.soundVolumes);
  const masterVolume = useFocusStore((state) => state.soundVolume);
  const setSoundVolume = useFocusStore((state) => state.setSoundVolume);
  const setMasterVolume = useFocusStore((state) => state.setMasterVolume);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const channelsRef = useRef(new Map<string, Channel>());
  const [unavailable, setUnavailable] = useState<string[]>([]);

  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return null;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = masterVolume;
    master.connect(context.destination);
    contextRef.current = context;
    masterRef.current = master;
    return context;
  }, [masterVolume]);

  const updateChannel = useCallback(
    async (soundId: string, volume: number) => {
      setSoundVolume(soundId, volume);
      const existing = channelsRef.current.get(soundId);
      if (existing) {
        const now = contextRef.current?.currentTime ?? 0;
        existing.gain.gain.cancelScheduledValues(now);
        existing.gain.gain.linearRampToValueAtTime(volume, now + 0.28);
        if (volume === 0) {
          window.setTimeout(() => existing.audio.pause(), 320);
        } else {
          try {
            await existing.audio.play();
          } catch {
            setUnavailable((items) => [...new Set([...items, soundId])]);
          }
        }
        return;
      }
      if (volume === 0) return;
      const definition = AMBIENT_SOUNDS.find((sound) => sound.id === soundId);
      const context = ensureContext();
      const master = masterRef.current;
      if (!definition || !context || !master) return;
      if (context.state === "suspended") await context.resume();
      const audio = new Audio(definition.file);
      audio.loop = true;
      audio.preload = "none";
      const source = context.createMediaElementSource(audio);
      const gain = context.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(master);
      channelsRef.current.set(soundId, { audio, source, gain });
      audio.addEventListener("error", () => {
        setUnavailable((items) => [...new Set([...items, soundId])]);
      });
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + 0.35);
      try {
        await audio.play();
      } catch {
        setUnavailable((items) => [...new Set([...items, soundId])]);
      }
    },
    [ensureContext, setSoundVolume],
  );

  useEffect(() => {
    if (masterRef.current && contextRef.current) {
      masterRef.current.gain.linearRampToValueAtTime(
        masterVolume,
        contextRef.current.currentTime + 0.2,
      );
    }
  }, [masterVolume]);

  useEffect(
    () => () => {
      channelsRef.current.forEach((channel) => channel.audio.pause());
      void contextRef.current?.close();
    },
    [],
  );

  return {
    sounds: AMBIENT_SOUNDS,
    soundVolumes,
    masterVolume,
    unavailable,
    updateChannel,
    setMasterVolume,
  };
}

