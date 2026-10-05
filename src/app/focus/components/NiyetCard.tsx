"use client";

import { ArrowRight, Clock3, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { useTimer } from "@/hooks/useTimer";
import styles from "../focus.module.css";

const tags = [
  "Ders Çalışma",
  "Proje",
  "Okuma",
  "Yazma",
  "Kodlama",
  "Araştırma",
  "Ezberleme",
  "Kur’an Okuma",
];

export default function NiyetCard({ onClose }: { onClose?: () => void }) {
  const savedNiyet = useFocusStore((state) => state.currentNiyet);
  const currentTags = useFocusStore((state) => state.currentTags);
  const recentNiyets = useFocusStore((state) => state.recentNiyets);
  const focusDuration = useFocusStore((state) => state.focusDuration);
  const setNiyet = useFocusStore((state) => state.setNiyet);
  const toggleTag = useFocusStore((state) => state.toggleTag);
  const [draft, setDraft] = useState(savedNiyet);
  const { start } = useTimer();

  const submit = () => {
    const clean = draft.trim();
    if (!clean) return;
    setNiyet(clean);
    void start();
    onClose?.();
  };

  return (
    <div className={styles.niyetBackdrop} role="dialog" aria-modal="true" aria-labelledby="niyet-title">
      <section className={styles.niyetCard}>
        {onClose && savedNiyet && (
          <button className={styles.closeButton} onClick={onClose} aria-label="Niyet kartını kapat">
            <X aria-hidden />
          </button>
        )}
        <span className={styles.cardKicker}><Sparkles aria-hidden /> Niyetini berraklaştır</span>
        <h1 id="niyet-title">Bu oturumda neye odaklanacaksın?</h1>
        <p>Zihnindeki işi tek cümleye indir. Gerisini bu sakin alana bırak.</p>
        <label className={styles.niyetInput}>
          <span>Niyet / hedef</span>
          <input
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 100))}
            onKeyDown={(event) => {
              if (event.key === "Enter") submit();
            }}
            placeholder="Örn. Lineer cebir finaline hazırlanacağım"
            maxLength={100}
          />
          <small>{draft.length}/100</small>
        </label>
        <div className={styles.tagList} aria-label="Odak kategorileri">
          {tags.map((tag) => (
            <button
              key={tag}
              className={currentTags.includes(tag) ? styles.tagActive : ""}
              onClick={() => toggleTag(tag)}
              aria-pressed={currentTags.includes(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {recentNiyets.length > 0 && (
          <div className={styles.recentNiyets}>
            <span>Son niyetlerin</span>
            <div>
              {recentNiyets.map((item) => (
                <button key={item} onClick={() => setDraft(item)}>{item}</button>
              ))}
            </div>
          </div>
        )}
        <button className={styles.bismillahButton} onClick={submit} disabled={!draft.trim()}>
          <span><strong>Bismillah, Başla</strong><small><Clock3 aria-hidden /> {focusDuration} dakikalık alan</small></span>
          <ArrowRight aria-hidden />
        </button>
      </section>
    </div>
  );
}

