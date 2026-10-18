"use client";

import { useEffect, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { useFocusDialog } from "@/hooks/useFocusDialog";
import FocusCompletionScreen from "@/components/core/FocusCompletionScreen";

export default function SessionComplete() {
  const session = useFocusStore((state) => state.pendingCompletedSession);
  const currentRound = useFocusStore((state) => state.currentRound);
  const totalRounds = useFocusStore((state) => state.totalRounds);
  const coins = useFocusStore((state) => state.coins);
  const saveShukurNote = useFocusStore((state) => state.saveShukurNote);
  const dismissCompletion = useFocusStore((state) => state.dismissCompletion);
  const skipToNext = useFocusStore((state) => state.skipToNext);
  const setMode = useFocusStore((state) => state.setMode);
  const setNiyet = useFocusStore((state) => state.setNiyet);
  const setTag = useFocusStore((state) => state.setTag);
  const startTimer = useFocusStore((state) => state.startTimer);
  const autoStartBreak = useFocusStore((state) => state.autoStartBreak);
  const [note, setNote] = useState(session?.shukurNote ?? "");
  const [autoStartIn, setAutoStartIn] = useState(6);
  useFocusDialog(Boolean(session));

  useEffect(() => {
    if (!session || !autoStartBreak) return;
    const countdown = window.setInterval(
      () => setAutoStartIn((value) => Math.max(0, value - 1)),
      1000,
    );
    const launch = window.setTimeout(() => {
      skipToNext();
      startTimer();
    }, 6000);
    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(launch);
    };
  }, [autoStartBreak, session, skipToNext, startTimer]);

  if (!session) return null;
  const earnedCoins = Math.max(1, Math.round(session.duration / 5));
  const persistNote = () => saveShukurNote(session.id, note);

  return (
    <FocusCompletionScreen
      duration={session.duration}
      autoStartBreak={autoStartBreak}
      autoStartIn={autoStartIn}
      earnedCoins={earnedCoins}
      coins={coins}
      note={note}
      setNote={setNote}
      quoteSeed={session.endTime.length + session.duration}
      onBreak={() => {
        persistNote();
        skipToNext();
        startTimer();
      }}
      onNewSession={() => {
        persistNote();
        dismissCompletion();
        setMode("focus");
        setNiyet("");
        setTag("");
      }}
      onFinish={() => {
        persistNote();
        dismissCompletion();
        if (currentRound >= totalRounds) setMode("focus");
      }}
    />
  );
}
