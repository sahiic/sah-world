"use client";

import {
  Headphones,
  Hourglass,
  Target,
  Timer,
  Video,
  Waves,
  X,
} from "lucide-react";
import { FormEvent } from "react";
import { AMBIENT_SOUNDS } from "@/hooks/useAmbientSound";
import { getFocusBackground } from "@/lib/focusBackgrounds";
import { FocusPresets, FocusStudioIntro } from "@/components/core/FocusAmbience";
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
  onStart,
  taskDraft,
  setTaskDraft,
  onOpenTimerSettings,
  onOpenSound,
  onOpenBackground,
}: {
  onStart: () => void;
  taskDraft: string;
  setTaskDraft: (value: string) => void;
  onOpenTimerSettings: () => void;
  onOpenSound: () => void;
  onOpenBackground: () => void;
}) {
  const mode = useFocusStore((state) => state.mode);
  const timerKind = useFocusStore((state) => state.timerKind);
  const timeLeft = useFocusStore((state) => state.timeLeft);
  const totalTime = useFocusStore((state) => state.totalTime);
  const isRunning = useFocusStore((state) => state.isRunning);
  const sessionStartTime = useFocusStore((state) => state.sessionStartTime);
  const currentRound = useFocusStore((state) => state.currentRound);
  const totalRounds = useFocusStore((state) => state.totalRounds);
  const currentNiyet = useFocusStore((state) => state.currentNiyet);
  const soundVolumes = useFocusStore((state) => state.soundVolumes);
  const soundMuted = useFocusStore((state) => state.soundMuted || state.soundVolume === 0);
  const isPaused = useFocusStore((state) => state.isPaused);
  const backgroundId = useFocusStore((state) => state.backgroundId);
  const setNiyet = useFocusStore((state) => state.setNiyet);

  const radius = 150;
  const circumference = 2 * Math.PI * radius;
  const progress =
    timerKind === "stopwatch"
      ? (timeLeft % 3600) / 3600
      : totalTime > 0
        ? (totalTime - timeLeft) / totalTime
        : 0;
  const activeSound = AMBIENT_SOUNDS.find(
    (sound) => (soundVolumes[sound.id] ?? 0) > 0,
  );
  const activeSounds = AMBIENT_SOUNDS.filter(sound => (soundVolumes[sound.id] ?? 0) > 0).length;
  const durationLabel =
    timerKind === "stopwatch"
      ? "Serbest sayaç"
      : `${Math.max(1, Math.round(totalTime / 60))} dk`;
  const activeBackground = getFocusBackground(backgroundId);

  const attachTask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const task = taskDraft.trim();
    if (!task) return;
    setNiyet(task);
    setTaskDraft("");
  };

  return (
    <section
      className={`focus-timer-stage ${styles.timerCard} ${styles[mode]} ${isRunning ? styles.timerRunning : ""}`}
      aria-label="Odaklanma zamanlayıcısı"
    >
      <div className={styles.timerAura} aria-hidden />
      <FocusStudioIntro active={Boolean(sessionStartTime)} />
      <div className={`focus-mode-eyebrow ${styles.timerEyebrow}`}>
        {timerKind === "stopwatch" ? (
          <Timer aria-hidden />
        ) : (
          <Waves aria-hidden />
        )}
        <span>
          {timerKind === "stopwatch" ? "Serbest çalışma" : "Pomodoro ritmi"}
        </span>
      </div>

      <div className="focus-task-slot">
        {currentNiyet ? (
          <span className="focus-task-chip">
            <i aria-hidden />
            <strong>{currentNiyet}</strong>
            {isRunning && <b aria-label="Oturum etkin" />}
            {!sessionStartTime && (
              <button
                onClick={() => setNiyet("")}
                aria-label="Odak görevini kaldır"
              >
                <X aria-hidden />
              </button>
            )}
          </span>
        ) : (
          <form onSubmit={attachTask}>
            <span>
              <Target aria-hidden />
            </span>
            <input
              value={taskDraft}
              onChange={(event) => setTaskDraft(event.target.value)}
              maxLength={100}
              placeholder="Şu an neye odaklanacaksın?"
              aria-label="Odak görevi"
            />
            <button type="submit">Ekle</button>
          </form>
        )}
      </div>

      {!sessionStartTime && <FocusPresets
        minutes={timerKind === "pomodoro" && mode === "focus" ? totalTime / 60 : null}
        disabled={Boolean(sessionStartTime)}
        onSelect={(minutes) => {
          const store = useFocusStore.getState();
          store.setTimerKind("pomodoro");
          store.setMode("focus");
          store.updateSettings({ focusDuration: minutes });
        }}
      />}
      <div
        className={`focus-dial ${isRunning ? "is-running" : ""} ${styles.timerDial}`}
      >
        <svg viewBox="0 0 340 340" aria-hidden>
          <circle className={styles.timerTrack} cx="170" cy="170" r={radius} />
          <circle
            className={`focus-progress-ring ${styles.timerProgress}`}
            cx="170"
            cy="170"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
          />
        </svg>
        <div className={styles.timerValue} role="timer" aria-live="off" aria-label={modeLabels[mode]}>
          <strong>{formatTimer(timeLeft)}</strong>
          {timerKind === "pomodoro" && <div
            className={styles.rounds}
            aria-label={`Tur ${currentRound} / ${totalRounds}`}
          >
            <span>Tur</span>
            {Array.from({ length: totalRounds }, (_, index) => (
              <i
                key={index}
                className={index < currentRound ? styles.roundDone : ""}
                aria-hidden
              />
            ))}
            <b>
              {currentRound}/{totalRounds}
            </b>
          </div>}
          <span>{isPaused ? "Duraklatıldı" : timerKind === "stopwatch" ? "Serbest çalışma" : modeLabels[mode]}</span>
        </div>
      </div>

      <TimerControls onStart={onStart} />

      <nav className="focus-controls" aria-label="Zamanlayıcı ayarları">
        <button onClick={onOpenTimerSettings}>
          <span>
            <Hourglass aria-hidden />
          </span>
          <strong>Zamanlayıcı</strong>
          <small>{durationLabel}</small>
        </button>
        <button onClick={onOpenSound}>
          <span>
            <Headphones aria-hidden />
          </span>
          <strong>Arka Plan Sesi</strong>
          <small>{soundMuted ? "Sessize alındı" : activeSounds > 1 ? `${activeSounds} sesli karışım` : activeSound?.name ?? "Sessiz"}</small>
        </button>
        <button onClick={onOpenBackground}>
          <span>
            <Video aria-hidden />
          </span>
          <strong>Arka Plan</strong>
          <small>{activeBackground.label}</small>
        </button>
      </nav>
      <p className={styles.sessionHint}>{isPaused ? "Süren korundu. Hazır olduğunda kaldığın yerden devam et." : sessionStartTime ? "Geri dön; oturumun ana sayfadaki küçük sayaçta devam eder." : "Niyetini yaz. Süreni seç. Kendine bir alan aç."}</p>
    </section>
  );
}
