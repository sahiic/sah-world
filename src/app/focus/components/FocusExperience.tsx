"use client";

import {
  ArrowLeft,
  CalendarDays,
  Expand,
  Headphones,
  PanelRightClose,
  PanelRightOpen,
  Timer,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import AmbientSoundMixer from "./AmbientSoundMixer";
import FocusHistory from "./FocusHistory";
import FocusStats from "./FocusStats";
import FocusTimer from "./FocusTimer";
import MotivationQuote from "./MotivationQuote";
import NiyetCard from "./NiyetCard";
import SessionComplete from "./SessionComplete";
import SessionConfig from "./SessionConfig";
import styles from "../focus.module.css";

type FocusView = "session" | "history";

export default function FocusExperience() {
  const mode = useFocusStore((state) => state.mode);
  const isRunning = useFocusStore((state) => state.isRunning);
  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const resetTimer = useFocusStore((state) => state.resetTimer);
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const pendingCompletedSession = useFocusStore(
    (state) => state.pendingCompletedSession,
  );
  const [focusView, setFocusView] = useState<FocusView>("session");
  const [showNiyet, setShowNiyet] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (isRunning) pauseTimer();
        else if (!currentNiyet) setShowNiyet(true);
        else useFocusStore.getState().startTimer();
      }
      if (event.key.toLowerCase() === "r") resetTimer();
      if (event.key.toLowerCase() === "s") {
        setSoundOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setSoundOpen(false);
        setSettingsOpen(false);
        setTimelineOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentNiyet, isRunning, pauseTimer, resetTimer]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen support is optional.
    }
  };

  return (
    <main className={`${styles.focusPage} ${styles[`${mode}Page`]}`}>
      <div className={styles.geometricBackdrop} aria-hidden />
      <header className={styles.topbar}>
        <Link
          href="/"
          className={styles.backLink}
          aria-label="SAH World ana sayfasına dön"
        >
          <ArrowLeft aria-hidden />
          <span>Geri</span>
        </Link>

        <nav className={styles.viewTabs} aria-label="Odak bölümü">
          <button
            className={focusView === "session" ? styles.viewTabActive : ""}
            onClick={() => setFocusView("session")}
          >
            <Timer aria-hidden /> Oturum
          </button>
          <button
            className={focusView === "history" ? styles.viewTabActive : ""}
            onClick={() => setFocusView("history")}
          >
            <CalendarDays aria-hidden /> Geçmişim
          </button>
        </nav>

        <nav className={styles.topActions} aria-label="Odak ekranı araçları">
          <button
            className={timelineOpen ? styles.topActionActive : ""}
            onClick={() => setTimelineOpen((value) => !value)}
            aria-expanded={timelineOpen}
            aria-label={
              timelineOpen
                ? "Zaman çizelgesini kapat"
                : "Zaman çizelgesini aç"
            }
          >
            {timelineOpen ? (
              <PanelRightClose aria-hidden />
            ) : (
              <PanelRightOpen aria-hidden />
            )}
          </button>
          <button
            onClick={() => void toggleFullscreen()}
            aria-label="Tam ekranı aç veya kapat"
          >
            <Expand aria-hidden />
          </button>
        </nav>
      </header>

      <div className={styles.focusLayout}>
        {focusView === "session" ? (
          <section className={styles.mainColumn}>
            <FocusTimer
              onNeedNiyet={() => setShowNiyet(true)}
              onOpenTimerSettings={() => setSettingsOpen(true)}
              onOpenSound={() => setSoundOpen(true)}
              onToggleFullscreen={() => void toggleFullscreen()}
            />
            <MotivationQuote seed={pendingCompletedSession?.id.length ?? 0} />
          </section>
        ) : (
          <section className={styles.historyStage} aria-label="Odak geçmişi">
            <div className={styles.historyGrid}>
              <FocusStats />
              <FocusHistory />
            </div>
          </section>
        )}
      </div>

      {timelineOpen && (
        <div className={styles.timelineBackdrop}>
          <button
            className={styles.timelineScrim}
            onClick={() => setTimelineOpen(false)}
            aria-label="Zaman çizelgesini kapat"
          />
          <aside className={styles.timelinePanel} aria-label="Zaman çizelgesi">
            <button
              className={styles.modalClose}
              onClick={() => setTimelineOpen(false)}
              aria-label="Zaman çizelgesini kapat"
            >
              <X aria-hidden />
            </button>
            <FocusHistory />
          </aside>
        </div>
      )}

      {settingsOpen && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Zamanlayıcı ayarları"
        >
          <section className={styles.modalShell}>
            <button
              className={styles.modalClose}
              onClick={() => setSettingsOpen(false)}
              aria-label="Zamanlayıcı ayarlarını kapat"
            >
              <X aria-hidden />
            </button>
            <SessionConfig />
          </section>
        </div>
      )}

      <AmbientSoundMixer
        open={soundOpen}
        onClose={() => setSoundOpen(false)}
      />

      <div className={styles.shortcutHint}>
        <Headphones aria-hidden />
        <span>
          <kbd>Space</kbd> başlat/durdur · <kbd>R</kbd> sıfırla · <kbd>S</kbd>{" "}
          sesler
        </span>
      </div>
      {showNiyet && !isRunning && !pendingCompletedSession && (
        <NiyetCard onClose={() => setShowNiyet(false)} />
      )}
      <SessionComplete key={pendingCompletedSession?.id ?? "no-completion"} />
    </main>
  );
}
