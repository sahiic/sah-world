"use client";

import {
  ArrowLeft,
  CalendarDays,
  Expand,
  Headphones,
  PanelRightClose,
  PanelRightOpen,
  Timer,
  Video,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useFocusDialog } from "@/hooks/useFocusDialog";
import { useTimer } from "@/hooks/useTimer";
import { FocusBackdrop, FocusScenePicker } from "@/components/core/FocusAmbience";
import { useFocusStore } from "@/stores/focusStore";
import AmbientSoundMixer from "./AmbientSoundMixer";
import FocusHistory from "./FocusHistory";
import FocusStats from "./FocusStats";
import FocusTimer from "./FocusTimer";
import NiyetCard from "./NiyetCard";
import SessionConfig from "./SessionConfig";
import styles from "../focus.module.css";

type FocusView = "session" | "history";

export default function FocusExperience({ onExit }: { onExit?: () => void } = {}) {
  const mode = useFocusStore((state) => state.mode);
  const isRunning = useFocusStore((state) => state.isRunning);
  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const resetTimer = useFocusStore((state) => state.resetTimer);
  const {start}=useTimer();
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const backgroundId = useFocusStore((state) => state.backgroundId);
  const setBackgroundId = useFocusStore((state) => state.setBackgroundId);
  const pendingCompletedSession = useFocusStore(
    (state) => state.pendingCompletedSession,
  );
  const [focusView, setFocusView] = useState<FocusView>("session");
  const [taskDraft, setTaskDraft] = useState("");
  const [fullscreenError, setFullscreenError] = useState("");
  const [showNiyet, setShowNiyet] = useState(false);
  const [soundOpen, setSoundOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  useFocusDialog(!pendingCompletedSession && (soundOpen || backgroundOpen || settingsOpen || showNiyet || timelineOpen));

  const requestStart = useCallback(() => {
    if (!currentNiyet && mode === "focus") {
      useFocusStore.getState().setNiyet(taskDraft.trim() || "Odak oturumu");
      setTaskDraft("");
    }
    void start();
  }, [currentNiyet, mode, taskDraft, start]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === "Escape") {
        setSoundOpen(false);
        setBackgroundOpen(false);
        setSettingsOpen(false);
        setTimelineOpen(false);
        setShowNiyet(false);
        return;
      }
      if (soundOpen || backgroundOpen || settingsOpen || showNiyet || timelineOpen || pendingCompletedSession) return;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) {
        return;
      }
      // Space on a focused button belongs to that button, not the timer.
      if (target?.closest("button, a")) return;
      if (event.code === "Space") {
        event.preventDefault();
        if (isRunning) pauseTimer();
        else requestStart();
      }
      if (event.key.toLowerCase() === "r" && (!useFocusStore.getState().sessionStartTime || window.confirm("Süreyi kaydetmeden bu oturumu sıfırlamak istiyor musun?"))) resetTimer();
      if (event.key.toLowerCase() === "s") {
        setSoundOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [requestStart, isRunning, pauseTimer, resetTimer, soundOpen, backgroundOpen, settingsOpen, showNiyet, timelineOpen, pendingCompletedSession]);

  const toggleFullscreen = async () => {
    try {
      setFullscreenError("");
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("Bu tarayıcı tam ekranı açamadı. Oturumun normal görünümde devam eder.");
    }
  };

  return (
    <main data-focus-studio="sanctuary-v2" data-focus-release="quality-audit-v1" className={`focus-root ${styles.focusPage} ${styles[`${mode}Page`]}`}>
      <FocusBackdrop backgroundId={backgroundId} />
      <header className={`focus-topbar ${styles.topbar}`}>
        {onExit ? <button className={`focus-back-button ${styles.backLink}`} onClick={onExit} aria-label="Odak ekranını küçült"><ArrowLeft aria-hidden /><span>Geri</span></button> : <Link
          href="/"
          className={`focus-back-button ${styles.backLink}`}
          aria-label="SAH World ana sayfasına dön"
        >
          <ArrowLeft aria-hidden />
          <span>Geri</span>
        </Link>}

        <nav className={`focus-view-nav ${styles.viewTabs}`} aria-label="Odak bölümü">
          <button
            aria-pressed={focusView === "session"}
            className={focusView === "session" ? `${styles.viewTabActive} is-active` : ""}
            onClick={() => setFocusView("session")}
          >
            <Timer aria-hidden /> Oturum
          </button>
          <button
            aria-pressed={focusView === "history"}
            className={focusView === "history" ? `${styles.viewTabActive} is-active` : ""}
            onClick={() => setFocusView("history")}
          >
            <CalendarDays aria-hidden /> Geçmişim
          </button>
        </nav>

        <nav className={`focus-window-actions ${styles.topActions}`} aria-label="Odak ekranı araçları">
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
        {fullscreenError && <p className={styles.audioStatus} role="status">{fullscreenError}</p>}
        {focusView === "session" ? (
          <section className={styles.mainColumn}>
            <FocusTimer
              onStart={requestStart}
              taskDraft={taskDraft}
              setTaskDraft={setTaskDraft}
              onOpenTimerSettings={() => setSettingsOpen(true)}
              onOpenSound={() => setSoundOpen(true)}
              onOpenBackground={() => setBackgroundOpen(true)}
            />
          </section>
        ) : (
          <section className={styles.historyStage} aria-label="Odak geçmişi">
            <header className={styles.historyIntro}><span>GAYRETİNİN İZİ</span><h1>Küçük adımlar, gerçek ilerleme.</h1><p>Bugününü gör, ritmini tanı. Yarış değil; sana ait bir yolculuk.</p><small>Bu cihazdaki kayıtların · yalnızca bu tarayıcıda saklanır.</small></header>
            <div className={styles.historyGrid}>
              <FocusStats />
              <FocusHistory />
            </div>
          </section>
        )}
      </div>

      {timelineOpen && !pendingCompletedSession && (
        <div className={styles.timelineBackdrop}>
          <button
            className={styles.timelineScrim}
            onClick={() => setTimelineOpen(false)}
            aria-label="Zaman çizelgesini kapat"
          />
          <aside role="dialog" aria-modal="true" className={styles.timelinePanel} aria-label="Zaman çizelgesi">
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

      {settingsOpen && !pendingCompletedSession && (
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

      {backgroundOpen && !pendingCompletedSession && (
        <div
          className={styles.modalBackdrop}
          role="dialog"
          aria-modal="true"
          aria-label="Odak arka planını seç"
        >
          <section className={styles.modalShell}>
            <header className={styles.modalHeader}>
              <span>
                <Video aria-hidden />
              </span>
              <div>
                <h2>Arka Plan Seç</h2>
                <small>Sana iyi gelen manzarayla odaklan.</small>
              </div>
            </header>
            <button
              className={styles.modalClose}
              onClick={() => setBackgroundOpen(false)}
              aria-label="Arka plan seçiciyi kapat"
            >
              <X aria-hidden />
            </button>
            <FocusScenePicker backgroundId={backgroundId} onSelect={(id) => {
              setBackgroundId(id);
              setBackgroundOpen(false);
            }} />
          </section>
        </div>
      )}

      <AmbientSoundMixer
        open={soundOpen && !pendingCompletedSession}
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
    </main>
  );
}
