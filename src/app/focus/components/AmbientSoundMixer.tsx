"use client";

import {
  AudioLines,
  BookOpen,
  ChevronDown,
  CloudRain,
  Headphones,
  Leaf,
  Save,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useFocusStore } from "@/stores/focusStore";
import styles from "../focus.module.css";

const categoryIcons = {
  Doğa: CloudRain,
  Gürültü: AudioLines,
  İslami: BookOpen,
};

export default function AmbientSoundMixer({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const {
    sounds,
    soundVolumes,
    masterVolume,
    unavailable,
    updateChannel,
    setMasterVolume,
  } = useAmbientSound();
  const favoriteMixes = useFocusStore((state) => state.favoriteMixes);
  const saveFavoriteMix = useFocusStore((state) => state.saveFavoriteMix);
  const loadFavoriteMix = useFocusStore((state) => state.loadFavoriteMix);
  const [mixName, setMixName] = useState("");
  const grouped = useMemo(
    () =>
      ["Doğa", "Gürültü", "İslami"].map((category) => ({
        category: category as keyof typeof categoryIcons,
        items: sounds.filter((sound) => sound.category === category),
      })),
    [sounds],
  );
  const activeCount = Object.values(soundVolumes).filter((volume) => volume > 0).length;

  return (
    <section className={`${styles.soundMixer} ${open ? styles.soundMixerOpen : ""}`}>
      <button
        className={styles.soundToggle}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="ambient-sound-panel"
      >
        <span><Headphones aria-hidden /><span><strong>Ambient Sesler</strong><small>{activeCount ? `${activeCount} katman etkin` : "Sakin bir arka plan kur"}</small></span></span>
        <ChevronDown aria-hidden />
      </button>
      {open && (
        <div id="ambient-sound-panel" className={styles.soundPanel}>
          <div className={styles.masterVolume}>
            <label htmlFor="master-volume">{masterVolume > 0 ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />} Ana ses</label>
            <input id="master-volume" type="range" min="0" max="100" value={Math.round(masterVolume * 100)} onChange={(event) => setMasterVolume(Number(event.target.value) / 100)} />
            <output>{Math.round(masterVolume * 100)}%</output>
          </div>
          <p className={styles.placeholderNote}><Leaf aria-hidden /> Ses kanalları hazır. MP3 dosyaları eklendiğinde karışım otomatik çalışacak.</p>
          <div className={styles.soundCategories}>
            {grouped.map(({ category, items }) => {
              const CategoryIcon = categoryIcons[category];
              return (
                <div key={category} className={styles.soundCategory}>
                  <h3><CategoryIcon aria-hidden /> {category}</h3>
                  {items.map((sound) => (
                    <label key={sound.id} className={styles.soundRow}>
                      <span><i aria-hidden />{sound.name}{unavailable.includes(sound.id) && <small>dosya bekleniyor</small>}</span>
                      <input
                        aria-label={`${sound.name} ses düzeyi`}
                        type="range"
                        min="0"
                        max="100"
                        value={Math.round((soundVolumes[sound.id] ?? 0) * 100)}
                        onChange={(event) => void updateChannel(sound.id, Number(event.target.value) / 100)}
                      />
                      <output>{Math.round((soundVolumes[sound.id] ?? 0) * 100)}</output>
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
          <div className={styles.mixSaver}>
            <input value={mixName} onChange={(event) => setMixName(event.target.value)} placeholder="Karışım adı" maxLength={32} aria-label="Favori karışım adı" />
            <button onClick={() => { saveFavoriteMix(mixName); setMixName(""); }} disabled={!mixName.trim()}><Save aria-hidden /> Kaydet</button>
            {Object.keys(favoriteMixes).length > 0 && (
              <select onChange={(event) => event.target.value && loadFavoriteMix(event.target.value)} defaultValue="" aria-label="Favori karışımı yükle">
                <option value="" disabled>Favori karışım</option>
                {Object.keys(favoriteMixes).map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

