"use client";
import { BookCheck, CalendarDays, Clock3, Search } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useFocusStore } from "@/stores/focusStore";
import { formatMinutes, localDateKey } from "@/utils/timerUtils";
import styles from "../focus.module.css";
const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  weekday: "short",
});
const timeFormatter = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
});
export default function FocusHistory() {
  const headingId = useId();
  const sessions = useFocusStore((state) => state.sessions);
  const [period, setPeriod] = useState("week");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(12);
  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    if (period === "week") cutoff.setDate(cutoff.getDate() - 6);
    return sessions
      .filter(
        (session) =>
          new Date(session.startTime).getTime() >=
            (period === "all" ? 0 : cutoff.getTime()) &&
          `${session.niyet} ${session.tags.join(" ")}`
            .toLocaleLowerCase("tr")
            .includes(query.toLocaleLowerCase("tr")),
      )
      .sort((a, b) => Date.parse(b.startTime) - Date.parse(a.startTime));
  }, [sessions, period, query]);
  return (
    <section className={styles.panelCard} aria-labelledby={headingId}>
      <header className={styles.panelHeader}>
        <span>
          <CalendarDays aria-hidden />
        </span>
        <div>
          <small>{filtered.length} kayıt</small>
          <h2 id={headingId}>Odak Geçmişi</h2>
        </div>
      </header>
      <div
        className={styles.historyFilters}
        role="group"
        aria-label="Geçmiş dönemi"
      >
        {[
          ["today", "Bugün"],
          ["week", "7 gün"],
          ["all", "Tümü"],
        ].map(([id, label]) => (
          <button
            key={id}
            aria-pressed={period === id}
            onClick={() => {
              setPeriod(id);
              setLimit(12);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <label className={styles.historySearch}>
        <Search aria-hidden />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setLimit(12);
          }}
          placeholder="Niyet veya etikette ara"
          aria-label="Odak geçmişinde ara"
        />
      </label>
      {!filtered.length ? (
        <div className={styles.emptyHistory}>
          <BookCheck aria-hidden />
          <strong>
            {sessions.length
              ? "Bu aralıkta kayıt yok"
              : "İlk adımın burada iz bırakacak"}
          </strong>
          <p>
            {sessions.length
              ? "Başka bir dönem seç veya aramanı değiştir."
              : "Oturumunu bitirdiğinde süren ve niyetin burada görünür."}
          </p>
        </div>
      ) : (
        <div className={styles.historyList}>
          {filtered.slice(0, limit).map((session, index) => {
            const date = new Date(session.startTime),
              day = localDateKey(date),
              previous = index
                ? localDateKey(new Date(filtered[index - 1].startTime))
                : "";
            return (
              <div key={session.id}>
                {day !== previous && (
                  <h3 className={styles.historyDay}>
                    {dateFormatter.format(date)}
                  </h3>
                )}
                <article>
                  <span
                    className={
                      session.completed
                        ? styles.historySuccess
                        : styles.historyCancelled
                    }
                  >
                    {session.completed ? (
                      <BookCheck aria-hidden />
                    ) : (
                      <Clock3 aria-hidden />
                    )}
                  </span>
                  <div>
                    <strong>{session.niyet || "Mola"}</strong>
                    <small>
                      {timeFormatter.format(date)} ·{" "}
                      {session.mode !== "focus"
                        ? "Mola"
                        : session.completed
                          ? "Tamamlandı"
                          : "Kısmi oturum"}
                      {session.tags.length > 0
                        ? ` · ${session.tags.join(", ")}`
                        : ""}
                    </small>
                    {session.shukurNote && <p>{session.shukurNote}</p>}
                  </div>
                  <b>
                    {session.duration > 0 && session.duration < 1
                      ? "<1 dk"
                      : formatMinutes(session.duration)}
                  </b>
                </article>
              </div>
            );
          })}
          {filtered.length > limit && (
            <button
              className={styles.loadHistory}
              onClick={() => setLimit((value) => value + 12)}
            >
              Daha fazla kayıt göster
            </button>
          )}
        </div>
      )}
    </section>
  );
}
