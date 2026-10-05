"use client";

import { ArrowRight, Check, Coins, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import MotivationQuote from "./MotivationQuote";
import styles from "../focus.module.css";

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
    <div className={styles.completeBackdrop} role="dialog" aria-modal="true" aria-labelledby="complete-title">
      <section className={styles.completeCard}>
        <div className={styles.geometricParticles} aria-hidden>{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</div>
        <span className={styles.completeIcon}><Check aria-hidden /></span>
        <span className={styles.cardKicker}><Sparkles aria-hidden /> Niyet tamamlandı</span>
        <h2 id="complete-title">Mâşâallah! <strong>{session.duration} dakika</strong> odaklandın.</h2>
        <p>
          Gayretin kaydedildi. Şimdi bu emeğin sende bıraktığı izi fark et.
          {autoStartBreak && ` Mola ${autoStartIn} saniye içinde başlayacak.`}
        </p>
        <div className={styles.coinReward}><Coins aria-hidden /><span><strong>+{earnedCoins} odak puanı</strong><small>Toplam birikim: {coins}</small></span></div>
        <label className={styles.shukurField}>
          <span>Şükür Notu <small>isteğe bağlı</small></span>
          <textarea value={note} onChange={(event) => setNote(event.target.value.slice(0, 200))} maxLength={200} placeholder="Bu oturumda ne öğrendin, ne hissettin?" rows={3} />
          <small>{note.length}/200</small>
        </label>
        <MotivationQuote seed={session.endTime.length + session.duration} />
        <div className={styles.completeActions}>
          <button className={styles.completePrimary} onClick={() => { persistNote(); skipToNext(); startTimer(); }}><span>Molaya Geç</span><ArrowRight aria-hidden /></button>
          <button onClick={() => { persistNote(); dismissCompletion(); setMode("focus"); setNiyet(""); setTag(""); }}><RotateCcw aria-hidden /> Yeni Oturum</button>
          <button className={styles.completeGhost} onClick={() => { persistNote(); dismissCompletion(); if (currentRound >= totalRounds) setMode("focus"); }}>Bitir</button>
        </div>
      </section>
    </div>
  );
}
