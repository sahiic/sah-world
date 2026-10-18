"use client";
import FocusSettingsDialogs from "./FocusSettingsDialogs";

import FocusHistoryDashboard from "@/components/core/FocusHistoryDashboard";
import FocusTimeline from "@/components/core/FocusTimeline";
import { AppIcon } from "@/components/ui/AppIcon";
import { formatTimer } from "@/lib/focus";
import {
  FOCUS_SOUNDS,
  FocusAudioEngine,
  type FocusSoundId,
} from "@/lib/focusAudio";
import { getFocusBackground } from "@/lib/focusBackgrounds";
import { getAdaptiveFocusSuggestion } from "@/lib/focusInsights";
import { finalizeFocusSession } from "@/lib/focusRuntime";
import {
  getFocusDisplaySeconds,
  getFocusElapsedSeconds,
  useFocusTimerStore,
} from "@/store/useFocusTimerStore";
import { useJourneyStore } from "@/store/useJourneyStore";
import type { FocusTimerType } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FocusBackdrop,
  FocusPresets,
  FocusScenePicker,
  FocusStudioIntro,
} from "./FocusAmbience";
import studioStyles from "./focusStudio.module.css";
type Modal = "timer-type" | "sound" | "background" | "stop" | null;

export default function FocusTimerView({
  onExit,
  onNavigate,
}: {
  onExit: () => void;
  onNavigate: (view: string) => void;
}) {
  const journey = useJourneyStore();
  const timer = useFocusTimerStore();
  const [taskDraft, setTaskDraft] = useState("");
  const [now, setNow] = useState(0);
  const [modal, setModal] = useState<Modal>(null);
  const [draftTimerType, setDraftTimerType] = useState<FocusTimerType>(
    timer.timerType,
  );
  const [draftDurationSeconds, setDraftDurationSeconds] = useState(
    timer.plannedDurationSeconds || 50 * 60,
  );
  const [draftSound, setDraftSound] = useState<FocusSoundId>(timer.sound);
  const [draftVolume, setDraftVolume] = useState(timer.volume);
  // Start with the timer unobstructed, especially on narrow screens where
  // the timeline is an overlay. Records remain available through the toggle.
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [focusView, setFocusView] = useState<"timer" | "history">("timer");
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const lastBeepSecondRef = useRef<number | null>(null);
  const audioRef = useRef<FocusAudioEngine | null>(null);
  const clockNow = now || timer.startedAt || timer.sessionStartedAt || 0;
  const elapsedSeconds = getFocusElapsedSeconds(timer, clockNow);
  const displaySeconds = getFocusDisplaySeconds(timer, clockNow);
  const progress =
    timer.timerType === "countdown"
      ? Math.min(1, elapsedSeconds / Math.max(1, timer.plannedDurationSeconds))
      : (elapsedSeconds % 3600) / 3600;
  const phase = timer.isActive
    ? timer.isPaused
      ? "paused"
      : "running"
    : timer.completedSession
      ? "finished"
      : "idle";
  const circleRadius = 154;
  const circumference = 2 * Math.PI * circleRadius;
  const activeBackground = getFocusBackground(timer.backgroundId);
  const showSetup = Boolean(
    timer.isActive ||
      timer.completedSession ||
      timer.taskLabel ||
      journey.focusSessions.length ||
      timer.plannedDurationSeconds !== 25 * 60 ||
      timer.timerType !== "countdown" ||
      timer.sound !== "none" ||
      timer.backgroundId !== "kaaba-night",
  );

  useEffect(() => {
    timer.setFullscreen(true);
    audioRef.current = new FocusAudioEngine();
    return () => {
      audioRef.current?.stop();
    };
    // Minimise explicitly releases fullscreen ownership. The exit animation must
    // not clear a newer expand action that may already have occurred.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!timer.isActive || timer.isPaused) return;
    const tick = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(tick);
  }, [timer.isActive, timer.isPaused]);

  useEffect(() => {
    if (
      !timer.isActive ||
      timer.isPaused ||
      timer.sound !== "countdown" ||
      timer.timerType !== "countdown"
    )
      return;
    const remaining = Math.ceil(displaySeconds);
    if (
      remaining <= 0 ||
      remaining > 5 ||
      lastBeepSecondRef.current === remaining
    )
      return;
    lastBeepSecondRef.current = remaining;
    audioRef.current?.beep(remaining === 1 ? 940 : 680, 0.09);
  }, [
    displaySeconds,
    timer.isActive,
    timer.isPaused,
    timer.sound,
    timer.timerType,
  ]);

  const requestNotifications = async () => {
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "default"
    ) {
      try {
        await Notification.requestPermission();
      } catch {}
    }
  };

  const start = async () => {
    if (!timer.taskLabel.trim())
      timer.setTaskLabel(taskDraft.trim() || "Odak oturumu");
    lastBeepSecondRef.current = null;
    timer.start();
    await requestNotifications();
    await audioRef.current?.start(timer.sound, timer.volume);
  };
  const pause = () => {
    timer.pause();
    audioRef.current?.stop();
  };
  const resume = async () => {
    timer.resume();
    await audioRef.current?.start(timer.sound, timer.volume);
  };
  const requestStop = () =>
    elapsedSeconds >= 60 ? setModal("stop") : finalizeFocusSession(false);
  const reset = () => {
    timer.reset();
    lastBeepSecondRef.current = null;
  };
  const minimise = () => {
    timer.setFullscreen(false);
    onExit();
  };
  const attachTask = () => {
    const clean = taskDraft.trim().slice(0, 120);
    if (!clean) return;
    timer.setTaskLabel(clean);
    setTaskDraft("");
  };
  const openTimerModal = () => {
    setDraftTimerType(timer.timerType);
    setDraftDurationSeconds(timer.plannedDurationSeconds || 50 * 60);
    setModal("timer-type");
  };
  const openSoundModal = () => {
    setDraftSound(timer.sound);
    setDraftVolume(timer.volume);
    setModal("sound");
  };
  const confirmSound = async () => {
    timer.setSound(draftSound, draftVolume);
    setModal(null);
    if (timer.isActive && !timer.isPaused)
      await audioRef.current?.start(draftSound, draftVolume);
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {}
  };
  const popOut = () =>
    window.open(
      `${window.location.origin}/?focus=1`,
      "sah-focus-timer",
      "popup,width=1180,height=820",
    );

  const durationLabel =
    timer.timerType === "countdown"
      ? timer.plannedDurationSeconds < 60
        ? `${timer.plannedDurationSeconds} saniyelik alan`
        : `${Math.round(timer.plannedDurationSeconds / 60)} dakikalık alan`
      : "Serbest odak";
  const soundLabel =
    FOCUS_SOUNDS.find((item) => item.id === timer.sound)?.label ?? "Hiçbiri";
  const dialLabel =
    phase === "finished"
      ? "Oturum tamamlandı"
      : phase === "running"
        ? "Derin odak"
        : phase === "paused"
          ? "Kısa bir nefes"
          : durationLabel;
  const tickMarks = useMemo(
    () => Array.from({ length: 60 }, (_, index) => index),
    [],
  );
  const adaptiveSuggestion = useMemo(
    () => getAdaptiveFocusSuggestion(journey.focusSessions),
    [journey.focusSessions],
  );
  const openJournalDay = (date: string) => {
    window.localStorage.setItem("sah-journal-open-date", date);
    timer.setFullscreen(false);
    onNavigate("journal");
  };

  return (
    <div
      className={`focus-shell ${studioStyles.studio} ${focusView === "timer" && timelineOpen ? "with-timeline" : ""} ${focusView === "history" ? "focus-history-mode" : ""}`}
    >
      <FocusBackdrop backgroundId={timer.backgroundId} />
      <main className="focus-stage">
        <header className="focus-topbar">
          <div className="focus-window-actions">
            <button
              className="focus-back-button"
              onClick={minimise}
              aria-label="Odak ekranını küçült"
            >
              <AppIcon name="arrow-left" />
              <span>Geri</span>
            </button>
          </div>
          <div className="focus-top-center">
            <nav className="focus-view-tabs" aria-label="Odak bölümü">
              <button
                className={focusView === "timer" ? "active" : ""}
                onClick={() => setFocusView("timer")}
              >
                <AppIcon name="hourglass" /> Oturum
              </button>
              <button
                className={focusView === "history" ? "active" : ""}
                onClick={() => setFocusView("history")}
              >
                <AppIcon name="chart-histogram" /> Geçmişim
              </button>
            </nav>
          </div>
          <div className="focus-window-actions">
            {focusView === "timer" && (
              <button
                className="focus-timeline-toggle"
                onClick={() => setTimelineOpen((value) => !value)}
                aria-expanded={timelineOpen}
                aria-label="Bugünün kayıtlarını aç veya kapat"
                title={
                  timelineOpen
                    ? "Zaman çizelgesini kapat"
                    : "Zaman çizelgesini aç"
                }
              >
                <AppIcon
                  name={
                    timelineOpen
                      ? "layout-sidebar-right-collapse"
                      : "layout-sidebar-right-expand"
                  }
                />
              </button>
            )}
            <button
              onClick={popOut}
              aria-label="Odak ekranını ayrı pencerede aç"
              title="Ayrı pencerede aç"
            >
              <AppIcon name="external-link" />
            </button>
            <button
              onClick={() => void toggleFullscreen()}
              title="Tam ekran"
              aria-label="Tam ekran"
            >
              <AppIcon name="maximize" />
            </button>
          </div>
        </header>
        {focusView === "timer" ? (
          <>
            <section className="focus-center" aria-live="polite">
              <FocusStudioIntro active={timer.isActive} />
              <span className="focus-mode-eyebrow">
                <i className={phase === "running" ? "live" : ""} /> {dialLabel}
              </span>
              {timer.isActive && timer.intentionText && (
                <p className="focus-active-intention">
                  <AppIcon name="flag" /> {timer.intentionText}
                </p>
              )}
              {!timer.isActive &&
                adaptiveSuggestion &&
                !suggestionDismissed && (
                  <aside className="focus-adaptive-suggestion">
                    <AppIcon name="bulb" />
                    <div>
                      <strong>Sana uygun bir ritim önerisi</strong>
                      <p>{adaptiveSuggestion.message}</p>
                    </div>
                    <button
                      onClick={() => {
                        timer.configure({
                          timerType: "countdown",
                          plannedDurationSeconds:
                            adaptiveSuggestion.minutes * 60,
                        });
                        setSuggestionDismissed(true);
                      }}
                    >
                      {adaptiveSuggestion.minutes} dk ayarla
                    </button>
                    <button
                      onClick={() => setSuggestionDismissed(true)}
                      aria-label="Öneriyi kapat"
                    >
                      <AppIcon name="x" />
                    </button>
                  </aside>
                )}
              {showSetup && (
                <div className="focus-task-slot">
                  {timer.taskLabel ? (
                    <span className="focus-task-chip">
                      <i />
                      <strong>{timer.taskLabel}</strong>
                      {timer.isActive && <b aria-label="Oturum etkin" />}
                      {!timer.isActive && (
                        <button
                          onClick={() => timer.setTaskLabel("")}
                          aria-label="Görevi ayır"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ) : (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        attachTask();
                      }}
                    >
                      <span>
                        <AppIcon name="target-arrow" />
                      </span>
                      <input
                        value={taskDraft}
                        onChange={(event) => setTaskDraft(event.target.value)}
                        maxLength={120}
                        placeholder="Şu an neye odaklanacaksın?"
                        aria-label="Odak görevi"
                      />
                      <button type="submit">Ekle</button>
                    </form>
                  )}
                </div>
              )}
              {timer.taskLabel && !timer.isActive && (
                <details className="focus-intention">
                  <summary>
                    <AppIcon name="flag" /> Oturum niyeti · isteğe bağlı
                  </summary>
                  <textarea
                    aria-label="Oturum niyeti"
                    value={timer.intentionText}
                    onChange={(event) =>
                      timer.setIntentionText(event.target.value)
                    }
                    maxLength={280}
                    rows={2}
                    placeholder="Bu oturumda neyi başarmayı hedefliyorsun?"
                  />
                </details>
              )}
              {showSetup && (
                <FocusPresets
                  minutes={
                    timer.timerType === "countdown"
                      ? timer.plannedDurationSeconds / 60
                      : null
                  }
                  disabled={timer.isActive}
                  onSelect={(minutes) =>
                    timer.configure({
                      timerType: "countdown",
                      plannedDurationSeconds: minutes * 60,
                    })
                  }
                />
              )}
              <div
                className="focus-dial"
                aria-label={
                  timer.timerType === "countdown"
                    ? `${formatTimer(displaySeconds)} kaldı`
                    : `${formatTimer(displaySeconds)} geçti`
                }
              >
                <svg viewBox="0 0 360 360" aria-hidden>
                  <g className="focus-ticks">
                    {tickMarks.map((tick) => (
                      <line
                        key={tick}
                        x1="180"
                        y1={tick % 5 === 0 ? 10 : 15}
                        x2="180"
                        y2={tick % 5 === 0 ? 23 : 20}
                        transform={`rotate(${tick * 6} 180 180)`}
                      />
                    ))}
                  </g>
                  <circle
                    className="focus-progress-track"
                    cx="180"
                    cy="180"
                    r={circleRadius}
                  />
                  <circle
                    className="focus-progress-ring"
                    cx="180"
                    cy="180"
                    r={circleRadius}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                  />
                </svg>
                <div>
                  <strong>{formatTimer(displaySeconds)}</strong>
                  <span>
                    {timer.timerType === "countdown"
                      ? "GERİ SAYIM"
                      : "SERBEST ZAMAN"}
                  </span>
                </div>
              </div>

              <div className="focus-primary-actions">
                {phase === "idle" && (
                  <button
                    className="focus-start-button"
                    onClick={() => void start()}
                  >
                    <AppIcon name="player-play-filled" /> Başla
                  </button>
                )}
                {phase === "running" && (
                  <button className="focus-start-button pause" onClick={pause}>
                    <AppIcon name="player-pause-filled" /> Duraklat
                  </button>
                )}
                {phase === "paused" && (
                  <button
                    className="focus-start-button"
                    onClick={() => void resume()}
                  >
                    <AppIcon name="player-play-filled" /> Devam Et
                  </button>
                )}
                {phase === "finished" && (
                  <button className="focus-start-button" onClick={reset}>
                    <AppIcon name="refresh" /> Yeni Oturum
                  </button>
                )}
                {timer.isActive && (
                  <button className="focus-stop-button" onClick={requestStop}>
                    <AppIcon name="player-stop-filled" /> Oturumu bitir
                  </button>
                )}
              </div>

              {showSetup && (
                <nav
                  className="focus-controls"
                  aria-label="Zamanlayıcı ayarları"
                >
                  <button onClick={openTimerModal} disabled={timer.isActive}>
                    <span>
                      <AppIcon name="hourglass" />
                    </span>
                    <strong>Zamanlayıcı</strong>
                    <small>{durationLabel}</small>
                  </button>
                  <button onClick={openSoundModal}>
                    <span>
                      <AppIcon name="headphones" />
                    </span>
                    <strong>Arka Plan Sesi</strong>
                    <small>{soundLabel}</small>
                  </button>
                  <button onClick={() => setModal("background")}>
                    <span>
                      <AppIcon name="video" />
                    </span>
                    <strong>Arka Plan</strong>
                    <small>{activeBackground.label}</small>
                  </button>
                  <button onClick={() => void toggleFullscreen()}>
                    <span>
                      <AppIcon name="maximize" />
                    </span>
                    <strong>Tam Ekran</strong>
                    <small>Dikkat dağıtanları gizle</small>
                  </button>
                </nav>
              )}
              <FocusScenePicker
                compact
                backgroundId={timer.backgroundId}
                onSelect={timer.setBackgroundId}
              />
            </section>
            <p className="focus-privacy">
              <AppIcon name="shield-lock" /> Oturumun güvende. Sayfa değiştirsen
              veya yenilesen de kaldığın yerden devam eder.
            </p>
          </>
        ) : (
          <div className="focus-history-stage">
            <FocusHistoryDashboard
              sessions={journey.focusSessions}
              onOpenJournal={openJournalDay}
            />
          </div>
        )}
      </main>

      <AnimatePresence>
        {focusView === "timer" && timelineOpen && (
          <motion.aside
            className="focus-side-panel"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
          >
            <FocusTimeline sessions={journey.focusSessions} />
            <button
              className="focus-side-close"
              onClick={() => setTimelineOpen(false)}
              aria-label="Kayıt panelini kapat"
            >
              <AppIcon name="chevron-right" />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      <FocusSettingsDialogs
        modal={modal}
        setModal={setModal}
        adaptiveSuggestion={adaptiveSuggestion}
        draftTimerType={draftTimerType}
        setDraftTimerType={setDraftTimerType}
        draftDurationSeconds={draftDurationSeconds}
        setDraftDurationSeconds={setDraftDurationSeconds}
        timer={timer}
        draftVolume={draftVolume}
        setDraftVolume={setDraftVolume}
        audioRef={audioRef}
        draftSound={draftSound}
        setDraftSound={setDraftSound}
        confirmSound={confirmSound}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  );
}
