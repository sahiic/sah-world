"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Expand, Headphones, Pause, Play, Square, Timer } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import { ambientEngine } from "@/lib/ambientEngine";
import { focusStorageStatus } from "@/lib/focusStorage";
import { useTimer } from "@/hooks/useTimer";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { formatTimer } from "@/utils/timerUtils";
import SessionComplete from "@/app/focus/components/SessionComplete";
import styles from "@/app/focus/focus.module.css";

export default function FocusSessionRuntime() {
  const state = useFocusStore();
  const controls = useTimer();
  const { status, enable } = useAmbientSound();
  const [ready, setReady] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const storageWarning = useSyncExternalStore(
    focusStorageStatus.subscribe,
    focusStorageStatus.snapshot,
    () => "",
  );

  useEffect(() => {
    // Hydrate after mount to avoid rendering private local state in server HTML.
    void useFocusStore.persist.rehydrate();
    const readyTimer = window.setTimeout(() => setReady(true), 0);
    let disposed = false;
    const reconcile = async () => {
      const advance = async () => {
        if (disposed) return;
        // Another open tab may have paused/completed this same session.
        await useFocusStore.persist.rehydrate();
        const current = useFocusStore.getState();
        if (
          !current.isRunning &&
          !(
            current.sessionStartTime &&
            current.timerKind === "pomodoro" &&
            current.timeLeft === 0
          )
        )
          return;
        current.tick();
        const next = useFocusStore.getState();
        if (
          next.timerKind !== "pomodoro" ||
          next.timeLeft !== 0 ||
          !next.sessionStartTime
        )
          return;
        const session = next.completeSession({
          completed: true,
          durationMinutes: next.totalTime / 60,
        });
        if (!session) return;
        ambientEngine.stop();
        ambientEngine.chime(next.soundMuted ? 0 : next.soundVolume);
        if (session.mode !== "focus") {
          next.skipToNext();
          if(next.autoStartFocus) next.startTimer();
        }
        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          try {
            new Notification(
              session.mode === "focus"
                ? "Odak oturumun tamamlandı"
                : "Molan tamamlandı",
              {
                body: `${session.duration} dakika kaydedildi.`,
                icon: "/icon.svg",
              },
            );
          } catch {
            /* optional */
          }
        }
      };
      // One write/completion at a time across tabs, where Web Locks is available.
      if (navigator.locks)
        await navigator.locks.request(
          "sah-focus-clock",
          { ifAvailable: true },
          (lock) => (lock ? advance() : undefined),
        );
      else await advance();
    };
    void reconcile();
    const interval = window.setInterval(() => void reconcile(), 1000);
    const visible = () => {
      if (document.visibilityState === "visible") void reconcile();
    };
    const storage = (event: StorageEvent) => {
      if (event.key === "sah-focus-sanctuary-v1")
        void useFocusStore.persist.rehydrate();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("storage", storage);
    return () => {
      disposed = true;
      window.clearTimeout(readyTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("storage", storage);
    };
  }, []);

  useEffect(() => {
    ambientEngine.sync(
      state.isPaused || state.soundMuted ? {} : state.soundVolumes,
      state.soundVolume,
    );
  }, [state.soundVolumes, state.soundVolume, state.isPaused, state.soundMuted]);

  if (!ready) return null;
  return (
    <div className={styles.runtime}>
      {storageWarning && (
        <p className={styles.storageWarning} role="status">
          {storageWarning}
        </p>
      )}
      {state.sessionStartTime && (
        <aside
          className={styles.miniTimer}
          aria-label="Devam eden odak oturumu"
          data-focus-mini
        >
          <header>
            <span>
              <Timer aria-hidden />{" "}
              {state.isPaused
                ? "Duraklatıldı"
                : state.mode === "focus"
                  ? "Odak sürüyor"
                  : "Mola sürüyor"}
            </span>
            <Link href="/focus" aria-label="Odak ekranını büyüt">
              <Expand aria-hidden />
            </Link>
          </header>
          <div className={styles.miniBody}>
            <strong>{formatTimer(state.timeLeft)}</strong>
            <span>{state.currentNiyet || "Sakin bir mola"}</span>
          </div>
          <footer>
            <button
              onClick={() =>
                state.isRunning ? controls.pause() : void controls.start()
              }
            >
              <span>
                {state.isRunning ? <Pause aria-hidden /> : <Play aria-hidden />}
              </span>
              {state.isRunning ? "Duraklat" : "Devam et"}
            </button>
            <button
              aria-label="Küçük sayaçtan oturumu bitir"
              onClick={() => setConfirmStop(true)}
            >
              <Square aria-hidden />
            </button>
          </footer>
          {status && (
            <button className={styles.miniAudio} onClick={() => void enable()}>
              <Headphones aria-hidden /> Dinlemeyi aç
            </button>
          )}
          {confirmStop && (
            <div className={styles.miniConfirm}>
              <p>Geçen süreyi kaydedip oturumu bitir?</p>
              <button onClick={() => setConfirmStop(false)}>Devam et</button>
              <button
                onClick={() => {
                  useFocusStore.getState().tick();
                  useFocusStore
                    .getState()
                    .completeSession({ completed: false });
                  ambientEngine.stop();
                  setConfirmStop(false);
                }}
              >
                Bitir ve kaydet
              </button>
            </div>
          )}
        </aside>
      )}
      <SessionComplete key={state.pendingCompletedSession?.id ?? "empty"} />
    </div>
  );
}
