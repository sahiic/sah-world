"use client";

import Image from "next/image";
import { Check, Leaf, Mountain } from "lucide-react";
import { FOCUS_BACKGROUNDS, getFocusBackground } from "@/lib/focusBackgrounds";
import styles from "./focusStudio.module.css";

export function FocusBackdrop({ backgroundId }: { backgroundId: string }) {
  const scene = getFocusBackground(backgroundId);
  return (
    <div className={`${styles.backdrop} ${!scene.image ? styles.plain : ""}`} aria-hidden="true" data-scene={scene.id}>
      {scene.image && <Image key={scene.id} className={styles.landscape} src={scene.image} alt="" fill sizes="100vw" priority unoptimized />}
      <div className={styles.shade} />
    </div>
  );
}

export function FocusStudioIntro({ active }: { active: boolean }) {
  return (
    <header className={styles.intro}>
      <span><Leaf aria-hidden="true" /> SAH WORLD · ODAK STÜDYOSU</span>
      <h1>{active ? "Şimdi, yalnızca bu an." : "Bir işe alan aç."}</h1>
      <p>{active ? "Küçük adımlar, derin bir iz bırakır." : "Niyetini seç. Nefes al. Gerisini zamana bırak."}</p>
    </header>
  );
}

export function FocusScenePicker({ backgroundId, onSelect, compact = false }: {
  backgroundId: string;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  const selected = getFocusBackground(backgroundId);
  return (
    <div className={compact ? styles.sceneStrip : styles.scenePicker}>
      {compact && <p className={styles.sceneCaption}><Mountain aria-hidden="true" /> MANZARANI SEÇ <small>{selected.label}</small></p>}
      <div className={styles.sceneOptions} role="group" aria-label="Odak manzaraları">
        {FOCUS_BACKGROUNDS.map((scene) => (
          <button key={scene.id} type="button" className={`${styles.sceneOption} ${scene.id === selected.id ? styles.sceneSelected : ""}`} aria-label={`${scene.label} arka planı`} aria-pressed={scene.id === selected.id} onClick={() => onSelect(scene.id)}>
            <span className={styles.scenePreview}>
              {scene.image ? <Image src={scene.image} alt="" fill sizes={compact ? "160px" : "320px"} unoptimized /> : <span className={styles.plainPreview}>◐</span>}
            </span>
            <span className={styles.sceneText}><strong>{scene.label}</strong>{!compact && <small>{scene.description}</small>}</span>
            {scene.id === selected.id && <Check className={styles.sceneCheck} aria-hidden="true" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export function FocusPresets({ minutes, disabled, onSelect }: {
  minutes: number | null;
  disabled: boolean;
  onSelect: (minutes: number) => void;
}) {
  return (
    <div className={styles.presets} role="group" aria-label="Hızlı odak süreleri">
      {[{ minutes: 25, label: "Kısa odak" }, { minutes: 50, label: "Derin çalışma" }, { minutes: 90, label: "Uzun akış" }].map((preset) => (
        <button key={preset.minutes} type="button" className={minutes === preset.minutes ? styles.presetSelected : ""} disabled={disabled} aria-pressed={minutes === preset.minutes} onClick={() => onSelect(preset.minutes)}>
          <strong>{preset.minutes} dk</strong><small>{preset.label}</small>
        </button>
      ))}
    </div>
  );
}
