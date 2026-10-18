"use client";
import { AnimatePresence } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import { formatFocusDuration, formatTimer } from "@/lib/focus";
import {
  FOCUS_SOUNDS,
  type FocusAudioEngine,
  type FocusSoundId,
} from "@/lib/focusAudio";
import type { getAdaptiveFocusSuggestion } from "@/lib/focusInsights";
import { finalizeFocusSession } from "@/lib/focusRuntime";
import type { useFocusTimerStore } from "@/store/useFocusTimerStore";
import type { FocusTimerType } from "@/types";
import { FocusScenePicker } from "./FocusAmbience";
import FocusModal, { ModalActions } from "./FocusModal";

type FocusSettingsProps = {
  modal: "timer-type" | "sound" | "background" | "stop" | null;
  setModal: (value: FocusSettingsProps["modal"]) => void;
  adaptiveSuggestion: ReturnType<typeof getAdaptiveFocusSuggestion>;
  draftTimerType: FocusTimerType;
  setDraftTimerType: (value: FocusTimerType) => void;
  draftDurationSeconds: number;
  setDraftDurationSeconds: (value: number) => void;
  timer: Pick<
    ReturnType<typeof useFocusTimerStore.getState>,
    "configure" | "backgroundId" | "setBackgroundId"
  >;
  draftVolume: number;
  setDraftVolume: (value: number) => void;
  audioRef: React.RefObject<FocusAudioEngine | null>;
  draftSound: FocusSoundId;
  setDraftSound: (value: FocusSoundId) => void;
  confirmSound: () => Promise<void>;
  elapsedSeconds: number;
};

export default function FocusSettingsDialogs({
  modal,
  setModal,
  adaptiveSuggestion,
  draftTimerType,
  setDraftTimerType,
  draftDurationSeconds,
  setDraftDurationSeconds,
  timer,
  draftVolume,
  setDraftVolume,
  audioRef,
  draftSound,
  setDraftSound,
  confirmSound,
  elapsedSeconds,
}: FocusSettingsProps) {
  return (
    <AnimatePresence>
      {modal === "timer-type" && (
        <FocusModal title="Zamanlayıcı Türü" onClose={() => setModal(null)}>
          {adaptiveSuggestion && (
            <div className="focus-modal-suggestion">
              <AppIcon name="bulb" />
              <span>
                <strong>
                  Kişisel öneri: {adaptiveSuggestion.minutes} dakika
                </strong>
                <small>{adaptiveSuggestion.message}</small>
              </span>
              <button
                onClick={() => {
                  setDraftTimerType("countdown");
                  setDraftDurationSeconds(adaptiveSuggestion.minutes * 60);
                }}
              >
                Uygula
              </button>
            </div>
          )}
          <div className="timer-type-options">
            <button
              className={draftTimerType === "countdown" ? "selected" : ""}
              onClick={() => setDraftTimerType("countdown")}
            >
              <span>
                <strong>{formatTimer(draftDurationSeconds)} → 00:00</strong>
                <small>Seçtiğin süreden zamanın sonuna kadar geri sayım.</small>
              </span>
              <AppIcon
                name={
                  draftTimerType === "countdown"
                    ? "circle-check-filled"
                    : "circle"
                }
              />
            </button>
            {draftTimerType === "countdown" && (
              <div className="duration-picker">
                <span>Tercih edilen süre</span>
                <div>
                  {[25, 50].map((minutes) => (
                    <button
                      key={minutes}
                      className={
                        draftDurationSeconds === minutes * 60 ? "active" : ""
                      }
                      onClick={() => setDraftDurationSeconds(minutes * 60)}
                    >
                      {minutes} dk
                    </button>
                  ))}
                  <label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={Math.max(1, Math.round(draftDurationSeconds / 60))}
                      onChange={(event) =>
                        setDraftDurationSeconds(
                          Math.min(
                            180,
                            Math.max(1, Number(event.target.value) || 1),
                          ) * 60,
                        )
                      }
                    />
                    <span>dk</span>
                  </label>
                  {process.env.NODE_ENV === "development" && (
                    <button
                      className={draftDurationSeconds === 15 ? "active" : ""}
                      onClick={() => setDraftDurationSeconds(15)}
                    >
                      15 sn test
                    </button>
                  )}
                </div>
              </div>
            )}
            <button
              className={draftTimerType === "stopwatch" ? "selected" : ""}
              onClick={() => setDraftTimerType("stopwatch")}
            >
              <span>
                <strong>00:00 → ∞</strong>
                <small>00:00&apos;dan başla durdurana kadar devam et.</small>
              </span>
              <AppIcon
                name={
                  draftTimerType === "stopwatch"
                    ? "circle-check-filled"
                    : "circle"
                }
              />
            </button>
          </div>
          <ModalActions
            onCancel={() => setModal(null)}
            onConfirm={() => {
              timer.configure({
                timerType: draftTimerType,
                plannedDurationSeconds: draftDurationSeconds,
              });
              setModal(null);
            }}
          />
        </FocusModal>
      )}

      {modal === "sound" && (
        <FocusModal title="Arka Plan Sesi" onClose={() => setModal(null)}>
          <label className="focus-volume">
            <span>
              <strong>Ses Seviyesi</strong>
              <small>{Math.round(draftVolume * 100)}%</small>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={draftVolume}
              onChange={(event) => {
                const next = Number(event.target.value);
                setDraftVolume(next);
                audioRef.current?.setVolume(next);
              }}
            />
          </label>
          <div className="focus-sound-list">
            {FOCUS_SOUNDS.map((item) => (
              <button
                key={item.id}
                className={draftSound === item.id ? "selected" : ""}
                onClick={() => setDraftSound(item.id)}
              >
                <span>
                  <AppIcon name={item.icon} />
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.note}</small>
                </div>
                <AppIcon
                  name={
                    draftSound === item.id ? "circle-check-filled" : "circle"
                  }
                />
              </button>
            ))}
          </div>
          <p className="focus-audio-note">
            <AppIcon name="sparkles" /> Ortam sesleri cihazında Web Audio ile
            üretilir; harici ses kaynağına veri gönderilmez.
          </p>
          <ModalActions
            onCancel={() => setModal(null)}
            onConfirm={() => void confirmSound()}
          />
        </FocusModal>
      )}

      {modal === "background" && (
        <FocusModal title="Arka Plan Seç" onClose={() => setModal(null)}>
          <FocusScenePicker
            backgroundId={timer.backgroundId}
            onSelect={(id) => {
              timer.setBackgroundId(id);
              setModal(null);
            }}
          />
        </FocusModal>
      )}

      {modal === "stop" && (
        <FocusModal
          title="Oturumu şimdi bitir?"
          onClose={() => setModal(null)}
          compact
        >
          <div className="focus-confirm-message">
            <span>
              <AppIcon name="clock-pause" />
            </span>
            <p>
              <strong>
                {formatFocusDuration(elapsedSeconds)} boyunca odaktaydın.
              </strong>{" "}
              Pomodoro tamamlanmadı. Bu süre geçmişe kaydedilmeyecek.
            </p>
          </div>
          <ModalActions
            onCancel={() => setModal(null)}
            cancelLabel="Devam et"
            confirmLabel="Bitir ve sil"
            onConfirm={() => {
              setModal(null);
              finalizeFocusSession(false);
            }}
            danger
          />
        </FocusModal>
      )}
    </AnimatePresence>
  );
}
