"use client";

import { Timer, Waves } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import { formatTimer } from "@/utils/timerUtils";
import TimerControls from "./TimerControls";
import styles from "../focus.module.css";

const modeLabels = {
  focus: "Odaklanma",
  shortBreak: "Kısa Mola",
  longBreak: "Uzun Mola",
};

export default function FocusTimer({
  onNeedNiyet,
}: {
  onNeedNiyet: () => void;
}) {
  const mode = useFocusStore((state) => state.mode);
  const timerKind = useFocusStore((state) => state.timerKind);
  const timeLeft = useFocusStore((state) => state.timeLeft);
  const totalTime = useFocusStore((state) => state.totalTime);
  const isRunning = useFocusStore((state) => state.isRunning);
  const currentRound = useFocusStore((state) => state.currentRound);
  const totalRounds = useFocusStore((state) => state.totalRounds);
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const currentTags = useFocusStore((state) => state.currentTags);

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const progress =
    timerKind === "stopwatch"
      ? (timeLeft % 3600) / 3600
      : totalTime > 0
        ? (totalTime - timeLeft) / totalTime
        : 0;

  return (
    <section
      className={`${styles.timerCard} ${styles[mode]} ${isRunning ? styles.timerRunning : ""}`}
      aria-label="Odaklanma zamanlayıcısı"
    >
      <div className={styles.timerAura} aria-hidden />
      <div className={styles.timerEyebrow}>
        {timerKind === "stopwatch" ? <Timer aria-hidden /> : <Waves aria-hidden />}
        <span>{timerKind === "stopwatch" ? "Serbest çalışma" : "Pomodoro ritmi"}</span>
      </div>

      <div className={styles.timerDial}>
        <svg viewBox="0 0 340 340" aria-hidden>
          <circle className={styles.timerTrack} cx="170" cy="170" r={radius} />
          <circle
            className={styles.timerProgress}
            cx="170"
            cy="170"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className={styles.timerValue} aria-live="polite" aria-atomic="true">
          <strong>{formatTimer(timeLeft)}</strong>
          <span>{modeLabels[mode]}</span>
        </div>
      </div>

      <div className={styles.rounds} aria-label={`Tur ${currentRound} / ${totalRounds}`}>
        <span>Tur</span>
        {Array.from({ length: totalRounds }, (_, index) => (
          <i
            key={index}
            className={index < currentRound ? styles.roundDone : ""}
            aria-hidden
          />
        ))}
        <b>{currentRound}/{totalRounds}</b>
      </div>

      {currentNiyet && (
        <button className={styles.activeIntention} onClick={onNeedNiyet}>
          <span>{currentNiyet}</span>
          {currentTags.length > 0 && <small>{currentTags.join(" · ")}</small>}
        </button>
      )}

      <TimerControls onNeedNiyet={onNeedNiyet} />
    </section>
  );
}

