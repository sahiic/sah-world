"use client";

import { Bell, Hourglass, TimerReset } from "lucide-react";
import { useState } from "react";
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
  const [notificationMessage, setNotificationMessage] = useState("");
  const enableNotifications = async () => {
    if (typeof Notification === "undefined") { setNotificationMessage("Bu tarayıcı bildirimleri desteklemiyor."); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotificationMessage(permission === "granted" ? "Oturum bitiş bildirimleri açık." : permission === "denied" ? "Bildirimler tarayıcı ayarlarında engelli. Zamanlayıcı çalışmaya devam eder." : "Bildirim izni verilmedi; zamanlayıcı çalışmaya devam eder.");
    } catch { setNotificationMessage("Bildirim açılamadı. Zamanlayıcı çalışmaya devam eder."); }
  };

  return (
    <section className={styles.panelCard} aria-labelledby="session-config-title">
      <header className={styles.panelHeader}>
        <span><Hourglass aria-hidden /></span>
        <div><small>Ritmini seç</small><h2 id="session-config-title">Oturum Ayarları</h2></div>
      </header>
      {store.sessionStartTime && <p className={styles.configNote}>Oturum sürerken süre ve sayaç türü korunur. Diğer tercihlerini değiştirebilirsin.</p>}
      <div className={styles.segmented}>
        <button aria-pressed={store.timerKind === "pomodoro"} className={store.timerKind === "pomodoro" ? styles.segmentActive : ""} onClick={() => setKind("pomodoro")} disabled={Boolean(store.sessionStartTime)}>Pomodoro</button>
        <button aria-pressed={store.timerKind === "stopwatch"} className={store.timerKind === "stopwatch" ? styles.segmentActive : ""} onClick={() => setKind("stopwatch")} disabled={Boolean(store.sessionStartTime)}>Serbest Sayaç</button>
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
                    aria-pressed={store[key] === value}
                    className={store[key] === value ? styles.durationActive : ""}
                    onClick={() => store.updateSettings({ [key]: value })}
                    disabled={Boolean(store.sessionStartTime)}
                  >
                    {value} dk
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {store.timerKind === "pomodoro" && <><label className={styles.toggleRow}>
        <span><TimerReset aria-hidden /><span><strong>Molayı otomatik başlat</strong><small>Odak tamamlanınca nefes alanına geç</small></span></span>
        <input type="checkbox" checked={store.autoStartBreak} onChange={(event) => store.updateSettings({ autoStartBreak: event.target.checked })} />
      </label>
      <label className={styles.toggleRow}>
        <span><Bell aria-hidden /><span><strong>Odağı otomatik başlat</strong><small>Mola bitince yeni tura geç</small></span></span>
        <input type="checkbox" checked={store.autoStartFocus} onChange={(event) => store.updateSettings({ autoStartFocus: event.target.checked })} />
      </label></>}
      <div className={styles.notificationOption}>
        <div><strong>Oturum bitiş bildirimi</strong><p>Tarayıcı açıkken tamamlanan oturumlardan haberdar ol.</p></div>
        <button onClick={() => void enableNotifications()}><Bell aria-hidden /> Bildirimleri aç</button>
      </div>
      {notificationMessage && <p className={styles.configNote} role="status">{notificationMessage}</p>}
    </section>
  );
}

