"use client";

import { Pause, Play, RotateCcw, SkipForward, Square } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import { useTimer } from "@/hooks/useTimer";
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
  const completeSession = useFocusStore((state) => state.completeSession);
  const { start, pause, reset, skip } = useTimer();

  const handlePrimary = () => {
    if (isRunning) {
      pause();
      return;
    }
    if (!currentNiyet) {
      onNeedNiyet();
      return;
    }
    void start();
  };

  return (
    <div className={styles.timerControls} aria-label="Zamanlayıcı kontrolleri">
      <button
        className={styles.primaryControl}
        onClick={handlePrimary}
        aria-label={isRunning ? "Zamanlayıcıyı duraklat" : "Zamanlayıcıyı başlat"}
      >
        {isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
        <span>{isRunning ? "Duraklat" : isPaused ? "Devam Et" : "Başla"}</span>
      </button>
      <button
        className={styles.roundControl}
        onClick={reset}
        aria-label="Zamanlayıcıyı sıfırla"
        title="Sıfırla (R)"
      >
        <RotateCcw aria-hidden />
      </button>
      {sessionStartTime ? (
        <button
          className={`${styles.roundControl} ${styles.dangerControl}`}
          onClick={() => completeSession({ completed: true })}
          aria-label="Oturumu şimdi tamamla"
          title="Oturumu şimdi tamamla"
        >
          <Square aria-hidden />
        </button>
      ) : (
        <button
          className={styles.roundControl}
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
