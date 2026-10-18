"use client";
import { ArrowRight, Check, Coins, RotateCcw, Sparkles } from "lucide-react";
import MotivationQuote from "@/app/focus/components/MotivationQuote";
import styles from "@/app/focus/focus.module.css";

type Props = {
  duration: number;
  autoStartBreak: boolean;
  autoStartIn: number;
  earnedCoins: number;
  coins: number;
  note: string;
  setNote: (note: string) => void;
  quoteSeed: number;
  onBreak: () => void;
  onNewSession: () => void;
  onFinish: () => void;
};

export default function FocusCompletionScreen({
  duration,
  autoStartBreak,
  autoStartIn,
  earnedCoins,
  coins,
  note,
  setNote,
  quoteSeed,
  onBreak,
  onNewSession,
  onFinish,
}: Props) {
  return (
    <div
      className={styles.completeBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-title"
    >
      <section className={styles.completeCard}>
        <div className={styles.geometricParticles} aria-hidden>
          {Array.from({ length: 9 }, (_, index) => (
            <i key={index} />
          ))}
        </div>
        <span className={styles.completeIcon}>
          <Check aria-hidden />
        </span>
        <span className={styles.cardKicker}>
          <Sparkles aria-hidden /> Niyet tamamlandı
        </span>
        <h2 id="complete-title">
          Mâşâallah! <strong>{duration} dakika</strong> odaklandın.
        </h2>
        <p>
          Gayretin kaydedildi. Şimdi bu emeğin sende bıraktığı izi fark et.
          {autoStartBreak && ` Mola ${autoStartIn} saniye içinde başlayacak.`}
        </p>
        <div className={styles.coinReward}>
          <Coins aria-hidden />
          <span>
            <strong>+{earnedCoins} odak puanı</strong>
            <small>Toplam birikim: {coins}</small>
          </span>
        </div>
        <label className={styles.shukurField}>
          <span>
            Şükür Notu <small>isteğe bağlı</small>
          </span>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value.slice(0, 200))}
            maxLength={200}
            placeholder="Bu oturumda ne öğrendin, ne hissettin?"
            rows={3}
          />
          <small>{note.length}/200</small>
        </label>
        <MotivationQuote seed={quoteSeed} />
        <div className={styles.completeActions}>
          <button
            className={styles.completePrimary}
            onClick={() => {
              onBreak();
            }}
          >
            <span>Molaya Geç</span>
            <ArrowRight aria-hidden />
          </button>
          <button
            onClick={() => {
              onNewSession();
            }}
          >
            <RotateCcw aria-hidden /> Yeni Oturum
          </button>
          <button
            className={styles.completeGhost}
            onClick={() => {
              onFinish();
            }}
          >
            Bitir
          </button>
        </div>
      </section>
    </div>
  );
}
