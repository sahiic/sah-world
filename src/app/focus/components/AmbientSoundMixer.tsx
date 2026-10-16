"use client";

import {
  Bird,
  CloudRain,
  Flame,
  Headphones,
  Leaf,
  MoonStar,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from "lucide-react";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useFocusStore } from "@/stores/focusStore";
import styles from "../focus.module.css";

const soundIcons = {
  rain: CloudRain,
  ocean: Waves,
  forest: Bird,
  stream: Waves,
  fireplace: Flame,
  wind: Wind,
  "night-garden": MoonStar,
} as const;

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
  const isPaused = useFocusStore((state) => state.isPaused);
  const activeSound = sounds.find((sound) => (soundVolumes[sound.id] ?? 0) > 0);

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
            <small>{muted ? "Sessize alındı" : activeSound ? `${activeSound.name} dinleniyor` : "Yedi doğal kayıttan birini seç"}</small>
            <h2 id="ambient-sound-title">Arka Plan Sesi</h2>
          </div>
          <button className={styles.modalClose} onClick={onClose} aria-label="Arka plan sesi penceresini kapat">
            <X aria-hidden />
          </button>
        </header>
        <div className={styles.soundPanel}>
          <div className={styles.masterVolume}>
            <label htmlFor="master-volume">{masterVolume > 0 ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} Ses düzeyi</label>
            <input id="master-volume" type="range" min="0" max="100" value={Math.round(masterVolume * 100)} onChange={(event) => setMasterVolume(Number(event.target.value) / 100)} />
            <output>{Math.round(masterVolume * 100)}%</output>
          </div>
          <p className={styles.placeholderNote}><Leaf aria-hidden /> Sentetik gürültü yok. Her seçenek gerçek bir doğa ve ortam kaydıdır.</p>
          {status && <p className={styles.audioStatus} role="status">{status} <button onClick={() => void enable()}>Dinlemeyi aç</button></p>}
          {isPaused && <p className={styles.audioStatus}>Oturum duraklatıldı. Ses, oturumla birlikte devam edecek.</p>}
          <div className={styles.mixActions}>
            <button onClick={() => void toggleMute()} aria-pressed={muted}>{muted ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}{muted ? "Sesi geri aç" : "Sessize al"}</button>
            <button onClick={() => void applyMix({})} disabled={!activeSound}>Sesi kapat</button>
          </div>
          <div className={styles.recordingGrid} role="radiogroup" aria-label="Doğal arka plan kayıtları">
            {sounds.map((sound) => {
              const SoundIcon = soundIcons[sound.id as keyof typeof soundIcons];
              const selected = (soundVolumes[sound.id] ?? 0) > 0;
              return (
                <button
                  key={sound.id}
                  type="button"
                  className={styles.recordingCard}
                  aria-pressed={selected}
                  aria-label={`${sound.name} sesini ${selected ? "kapat" : "aç"}`}
                  onClick={() => void updateChannel(sound.id, selected ? 0 : 0.72)}
                >
                  <span>{SoundIcon ? <SoundIcon aria-hidden /> : <Leaf aria-hidden />}</span>
                  <strong>{sound.name}</strong>
                  <small>{sound.note}</small>
                  <i aria-hidden />
                </button>
              );
            })}
          </div>
          <details className={styles.recordingCredits}>
            <summary>Kayıt kaynakları ve lisanslar</summary>
            {sounds.map((sound) => (
              <p key={sound.id}>
                {sound.name}: <a href={sound.source} target="_blank" rel="noreferrer">{sound.author}</a> · <a href={sound.licenseUrl} target="_blank" rel="noreferrer">{sound.license}</a>
              </p>
            ))}
          </details>
        </div>
      </section>
    </div>
  );
}
