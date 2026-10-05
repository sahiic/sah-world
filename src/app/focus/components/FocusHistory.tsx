"use client";

import { BookCheck, CalendarDays, CircleX } from "lucide-react";
import { useFocusStore } from "@/stores/focusStore";
import styles from "../focus.module.css";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function FocusHistory() {
  const sessions = useFocusStore((state) => state.sessions);
  return (
    <section className={styles.panelCard} aria-labelledby="focus-history-title">
      <header className={styles.panelHeader}>
        <span><CalendarDays aria-hidden /></span>
        <div><small>Son kayıtların</small><h2 id="focus-history-title">Odak Geçmişi</h2></div>
      </header>
      {sessions.length === 0 ? (
        <div className={styles.emptyHistory}><BookCheck aria-hidden /><strong>İlk mührün için hazırsın</strong><p>Tamamladığın oturumlar burada birikecek.</p></div>
      ) : (
        <div className={styles.historyList}>
          {sessions.slice(0, 12).map((session) => (
            <article key={session.id}>
              <span className={session.completed ? styles.historySuccess : styles.historyCancelled}>{session.completed ? <BookCheck aria-hidden /> : <CircleX aria-hidden />}</span>
              <div><strong>{session.niyet || "İsimsiz oturum"}</strong><small>{dateFormatter.format(new Date(session.startTime))} · {session.tags.join(", ") || "Genel"}</small>{session.shukurNote && <p>“{session.shukurNote}”</p>}</div>
              <b>{session.duration} dk</b>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

