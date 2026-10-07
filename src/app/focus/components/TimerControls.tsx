"use client";

import { Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import { useTimer } from "@/hooks/useTimer";
import { ambientEngine } from "@/lib/ambientEngine";
import styles from "../focus.module.css";

export default function TimerControls({
  onNeedNiyet,
}: {
  onNeedNiyet: () => void;
}) {
  const isRunning = useFocusStore((state) => state.isRunning);
  const isPaused = useFocusStore((state) => state.isPaused);
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const sessionStartTime = useFocusStore((state) => state.sessionStartTime);
  const mode = useFocusStore((state) => state.mode);
  const completeSession = useFocusStore((state) => state.completeSession);
  const { start, pause, reset, skip } = useTimer();

  const handlePrimary = () => {
    if (isRunning) {
      pause();
      return;
    }
    if (!currentNiyet && mode === "focus") {
      onNeedNiyet();
      return;
    }
    void start();
  };

  return (
    <div className={`focus-action-row ${styles.timerControls}`} aria-label="Zamanlayıcı kontrolleri">
      <button
        className={`focus-main-btn ${styles.primaryControl}`}
        onClick={handlePrimary}
        aria-label={isRunning ? "Zamanlayıcıyı duraklat" : "Zamanlayıcıyı başlat"}
      >
        {isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
        <span>{isRunning ? "Duraklat" : isPaused ? "Devam Et" : "Başla"}</span>
      </button>
      <button
        className={`focus-secondary-btn ${styles.roundControl}`}
        onClick={() => { if (!sessionStartTime || window.confirm("Süreyi kaydetmeden bu oturumu sıfırlamak istiyor musun?")) reset(); }}
        aria-label="Zamanlayıcıyı sıfırla"
        title="Sıfırla (R)"
      >
        <RotateCcw aria-hidden />
      </button>
      {sessionStartTime ? (
        <button
          className={`focus-secondary-btn ${styles.roundControl} ${styles.dangerControl}`}
          onClick={() => { if (window.confirm("Geçen süreyi kısmi oturum olarak kaydet ve bitir?")) { useFocusStore.getState().tick(); completeSession({ completed: false }); ambientEngine.stop(); } }}
          aria-label="Oturumu bitir ve kaydet"
          title="Bitir ve kaydet"
        >
          <Square aria-hidden />
        </button>
      ) : (
        <button
          className={`focus-secondary-btn ${styles.roundControl}`}
          onClick={skip}
          aria-label="Sonraki oturum türüne geç"
          title="Sonraki aşamaya geç"
        >
          <SkipForward aria-hidden />
        </button>
      )}
    </div>
  );
}
