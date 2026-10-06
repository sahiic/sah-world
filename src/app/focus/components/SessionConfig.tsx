"use client";

import { Bell, Hourglass, TimerReset } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import type { TimerKind } from "@/types/focus";
import styles from "../focus.module.css";

const options = {
  focusDuration: [15, 25, 30, 45, 50, 60, 90],
  shortBreakDuration: [3, 5, 7],
  longBreakDuration: [10, 15, 20, 30],
} as const;

export default function SessionConfig() {
  const store = useFocusStore();
  const setKind = (kind: TimerKind) => store.setTimerKind(kind);

  return (
    <section className={styles.panelCard} aria-labelledby="session-config-title">
      <header className={styles.panelHeader}>
        <span><Hourglass aria-hidden /></span>
        <div><small>Ritmini seç</small><h2 id="session-config-title">Oturum Ayarları</h2></div>
      </header>
      <div className={styles.segmented}>
        <button className={store.timerKind === "pomodoro" ? styles.segmentActive : ""} onClick={() => setKind("pomodoro")} disabled={store.isRunning}>Pomodoro</button>
        <button className={store.timerKind === "stopwatch" ? styles.segmentActive : ""} onClick={() => setKind("stopwatch")} disabled={store.isRunning}>Serbest Sayaç</button>
      </div>
      {store.timerKind === "pomodoro" && (
        <div className={styles.configGroups}>
          {(
            [
              ["focusDuration", "Odaklanma"],
              ["shortBreakDuration", "Kısa mola"],
              ["longBreakDuration", "Uzun mola"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label>{label}</label>
              <div className={styles.durationOptions}>
                {options[key].map((value) => (
                  <button
                    key={value}
                    className={store[key] === value ? styles.durationActive : ""}
                    onClick={() => store.updateSettings({ [key]: value })}
                    disabled={store.isRunning}
                  >
                    {value} dk
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <label className={styles.toggleRow}>
        <span><TimerReset aria-hidden /><span><strong>Molayı otomatik başlat</strong><small>Odak tamamlanınca nefes alanına geç</small></span></span>
        <input type="checkbox" checked={store.autoStartBreak} onChange={(event) => store.updateSettings({ autoStartBreak: event.target.checked })} />
      </label>
      <label className={styles.toggleRow}>
        <span><Bell aria-hidden /><span><strong>Odağı otomatik başlat</strong><small>Mola bitince yeni tura geç</small></span></span>
        <input type="checkbox" checked={store.autoStartFocus} onChange={(event) => store.updateSettings({ autoStartFocus: event.target.checked })} />
      </label>
    </section>
  );
}

