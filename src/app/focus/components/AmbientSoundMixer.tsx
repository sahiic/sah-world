"use client";

import {
  AudioLines,
  CloudRain,
  Headphones,
  Leaf,
  Save,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AMBIENT_MIXES, useAmbientSound } from "@/hooks/useAmbientSound";
import { useFocusStore } from "@/stores/focusStore";
import styles from "../focus.module.css";

const categoryIcons = {
  Doğa: CloudRain,
  Gürültü: AudioLines,
  Ortam: Headphones,
};

export default function AmbientSoundMixer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    sounds,
    soundVolumes,
    masterVolume,
    muted,
    toggleMute,
    applyMix,
    status,
    enable,
    updateChannel,
    setMasterVolume,
  } = useAmbientSound();
  const favoriteMixes = useFocusStore((state) => state.favoriteMixes);
  const saveFavoriteMix = useFocusStore((state) => state.saveFavoriteMix);
  const isPaused = useFocusStore((state) => state.isPaused);
  const [mixName, setMixName] = useState("");
  const grouped = useMemo(
    () =>
      ["Doğa", "Gürültü", "Ortam"].map((category) => ({
        category: category as keyof typeof categoryIcons,
        items: sounds.filter((sound) => sound.category === category),
      })),
    [sounds],
  );
  const activeCount = sounds.filter(sound => (soundVolumes[sound.id] ?? 0) > 0).length;

  if (!open) return null;

  return (
    <div
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambient-sound-title"
    >
      <section className={`${styles.modalShell} ${styles.soundMixer}`}>
        <header className={styles.modalHeader}>
          <span><Headphones aria-hidden /></span>
          <div>
            <small>{muted ? "Sessize alındı · karışımın korunuyor" : activeCount ? `${activeCount} katman seçili` : "Sakin bir arka plan kur"}</small>
            <h2 id="ambient-sound-title">Arka Plan Sesi</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Arka plan sesi penceresini kapat">
            <X aria-hidden />
          </button>
        </header>
        <div className={styles.soundPanel}>
          <div className={styles.mixPresets} role="group" aria-label="Hazır ses karışımları">
            {AMBIENT_MIXES.map(mix => <button key={mix.name} onClick={() => void applyMix(mix.volumes)} aria-pressed={sounds.every(sound => (soundVolumes[sound.id] ?? 0) === (mix.volumes[sound.id] ?? 0))}>
              <strong>{mix.name}</strong><small>{mix.description}</small>
            </button>)}
          </div>
          <div className={styles.masterVolume}>
            <label htmlFor="master-volume">{masterVolume > 0 ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} Ana ses</label>
            <input id="master-volume" type="range" min="0" max="100" value={Math.round(masterVolume * 100)} onChange={(event) => setMasterVolume(Number(event.target.value) / 100)} />
            <output>{Math.round(masterVolume * 100)}%</output>
          </div>
          <p className={styles.placeholderNote}><Leaf aria-hidden /> 15 sentezlenmiş ortam sesi. Katmanları karıştır; kendine ait bir ses alanı kur.</p>
          {status && <p className={styles.audioStatus} role="status">{status} <button onClick={()=>void enable()}>Dinlemeyi aç</button></p>}
          {isPaused && <p className={styles.audioStatus}>Oturum duraklatıldı. Sesler oturumla birlikte devam edecek.</p>}
          <div className={styles.mixActions}>
            <button onClick={() => void toggleMute()} aria-pressed={muted}>{muted ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}{muted ? "Sesi geri aç" : "Sessize al"}</button>
            <button onClick={() => void applyMix({})} disabled={!activeCount}>Tüm sesleri kapat</button>
            <small>Sesler bu cihazda üretilir; kayıt veya tilavet değildir.</small>
          </div>
          <div className={styles.soundCategories}>
            {grouped.map(({ category, items }) => {
              const CategoryIcon = categoryIcons[category];
              return (
                <div key={category} className={styles.soundCategory}>
                  <h3><CategoryIcon aria-hidden /> {category}</h3>
                  {items.map((sound) => (
                    <div key={sound.id} className={styles.soundRow}>
                      <button aria-pressed={(soundVolumes[sound.id] ?? 0)>0} aria-label={`${sound.name} sesini ${(soundVolumes[sound.id] ?? 0)>0 ? "kapat" : "aç"}`} onClick={()=>void updateChannel(sound.id,(soundVolumes[sound.id] ?? 0)>0 ? 0 : .5)}><i aria-hidden />{sound.name}</button>
                      <input
                        aria-label={`${sound.name} ses düzeyi`}
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((soundVolumes[sound.id] ?? 0) * 100)}
                        onChange={(event) => void updateChannel(sound.id, Number(event.target.value) / 100)}
                      />
                      <output>{Math.round((soundVolumes[sound.id] ?? 0) * 100)}</output>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className={styles.mixSaver}>
            <input value={mixName} onChange={(event) => setMixName(event.target.value)} placeholder="Karışım adı" maxLength={32} aria-label="Favori karışım adı" />
            <button onClick={() => { saveFavoriteMix(mixName); setMixName(""); }} disabled={!mixName.trim()}><Save aria-hidden /> Kaydet</button>
            {Object.keys(favoriteMixes).length > 0 && (
              <select onChange={(event) => { if (event.target.value) void applyMix(favoriteMixes[event.target.value]); event.target.value = ""; }} defaultValue="" aria-label="Favori karışımı yükle">
                <option value="" disabled>Favori karışım</option>
                {Object.keys(favoriteMixes).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

