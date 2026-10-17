"use client";
import { useEffect, useState } from "react";
import type { Json } from "@/types/database";
import type { StudySession } from "./peerMatchingUtils";
export default function PeerStudySession({
  session,
  userId,
  busy,
  onAction,
}: {
  session: StudySession | null;
  userId: string;
  busy: boolean;
  onAction: (action: string, payload: Json) => Promise<boolean>;
}) {
  const [duration, setDuration] = useState(25),
    [surah, setSurah] = useState(1),
    [scheduled, setScheduled] = useState(""),
    [pages, setPages] = useState(1),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!session)
    return (
      <form
        className="peer-session"
        onSubmit={(e) => {
          e.preventDefault();
          void onAction("create", {
            duration_minutes: duration,
            surah,
            scheduled_at: scheduled ? new Date(scheduled).toISOString() : null,
          });
        }}
      >
        <h4>Birlikte bir çalışma planlayın</h4>
        <p>
          İkiniz de “Hazırım” dediğinizde ortak sayaç başlar. Sesli görüşme
          sunulmaz; sohbet ve çalışma odasını kullanabilirsiniz.
        </p>
        <div className="peer-session-fields">
          <label>
            Süre
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {[5, 15, 25, 45, 60].map((v) => (
                <option key={v} value={v}>
                  {v} dakika
                </option>
              ))}
            </select>
          </label>
          <label>
            Sure numarası
            <input
              type="number"
              required
              min={1}
              max={114}
              value={surah}
              onChange={(e) => setSurah(Number(e.target.value))}
            />
          </label>
          <label>
            Çalışma zamanı (isteğe bağlı)
            <input
              type="datetime-local"
              value={scheduled}
              onChange={(e) => setScheduled(e.target.value)}
            />
            <small>Cihazının yerel saati · boş bırakırsan şimdi</small>
          </label>
        </div>
        <button className="peer-primary" disabled={busy}>
          Çalışma planı oluştur
        </button>
      </form>
    );
  const member = session.members.find((m) => m.user_id === userId),
    remaining = session.started_at
      ? Math.max(
          0,
          Math.ceil(
            (Date.parse(session.started_at) +
              session.duration_minutes * 60000 -
              now) /
              1000,
          ),
        )
      : session.duration_minutes * 60;
  const due = Date.parse(session.scheduled_at) <= now;
  return (
    <section className="peer-session">
      <header>
        <div>
          <span className="peer-eyebrow">ORTAK ÇALIŞMA</span>
          <h4>
            {session.surah}. sure · {session.duration_minutes} dakika
          </h4>
          <p>{new Date(session.scheduled_at).toLocaleString("tr-TR")}</p>
        </div>
        <span>{session.members.filter((m) => m.ready_at).length}/2 hazır</span>
      </header>
      <div className="peer-session-clock" role="timer" aria-label="Kalan süre">
        {String(Math.floor(remaining / 60)).padStart(2, "0")}:
        {String(remaining % 60).padStart(2, "0")}
      </div>
      {!session.started_at ? (
        <>
          <p>
            {due
              ? "İkiniz de hazır olduğunuzda başlayacak."
              : "Planlanan çalışma saati bekleniyor."}
          </p>
          <button
            className="peer-primary"
            disabled={busy || !due || !!member?.ready_at}
            onClick={() => void onAction("ready", { session_id: session.id })}
          >
            {member?.ready_at ? "Kardeşin bekleniyor…" : "Hazırım"}
          </button>
        </>
      ) : remaining > 0 ? (
        <p>
          Sakin bir okuma, ortak bir ritim. Sayfadan çıksan da süre devam eder.
        </p>
      ) : member?.completed_at ? (
        <p role="status">
          Okuman kaydedildi. Kardeşinin tamamlaması bekleniyor.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onAction("complete", { session_id: session.id, pages });
          }}
        >
          <label>
            Bu oturumda okuduğun sayfa
            <input
              required
              type="number"
              min={0}
              max={100}
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
            />
          </label>
          <button className="peer-primary" disabled={busy}>
            Okumamı tamamla
          </button>
        </form>
      )}
      <button
        className="peer-text-button"
        disabled={busy}
        onClick={() => {
          if (window.confirm("Bu ortak çalışma planı iptal edilsin mi?"))
            void onAction("cancel", { session_id: session.id });
        }}
      >
        Çalışmayı iptal et
      </button>
    </section>
  );
}
