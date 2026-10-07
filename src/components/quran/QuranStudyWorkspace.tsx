"use client";
import { useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { supabase } from "@/lib/supabase";
import { quranToday, summarizePractice } from "@/lib/quranLearning";
import type { QuranStudyGoalRow } from "@/types/database";
import type {
  QuranExerciseResult,
  QuranStreak,
  WeeklySummary,
} from "@/lib/quranSurahs";
import type { AppointmentView } from "../core/QuranCompanionView";
import { useJourneyStore } from "@/store/useJourneyStore";
import { EmptyState, formatAppointment } from "./shared";
export default function QuranStudyWorkspace({
  goal,
  notes,
  appointments,
  userId,
  realUser,
  onNavigate,
  onSave,
  streak,
  weeklySummary,
  results,
}: {
  goal: QuranStudyGoalRow | null;
  notes: ReturnType<typeof useJourneyStore.getState>["quranNotes"];
  appointments: AppointmentView[];
  userId: string;
  realUser: boolean;
  onNavigate: (view: string) => void;
  onSave: (goal: QuranStudyGoalRow) => Promise<void>;
  streak: QuranStreak;
  weeklySummary: WeeklySummary;
  results: QuranExerciseResult[];
}) {
  const [title, setTitle] = useState(goal?.title ?? ""),
    [progress, setProgress] = useState(goal?.progress_percent ?? 0),
    [ayahs, setAyahs] = useState(goal?.daily_ayah_goal ?? 5),
    [minutes, setMinutes] = useState(goal?.daily_minutes_goal ?? 10),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState("");
  const lock = useRef(false);
  const related = appointments
      .filter((a) => a.student_id === userId && a.topic_notes)
      .slice(0, 4),
    today = summarizePractice(
      results.filter(
        (r) => quranToday(new Date(r.completedAt)) === quranToday(),
      ),
    );
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus("");
    try {
      await onSave({
        id: goal?.id ?? crypto.randomUUID(),
        user_id: userId,
        title: title.trim(),
        progress_percent: progress,
        daily_ayah_goal: ayahs,
        daily_minutes_goal: minutes,
        created_at: goal?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setStatus(
        realUser
          ? "Hedefin kaydedildi."
          : "Hedefin yalnızca bu misafir oturumunda tutuluyor.",
      );
    } catch {
      setStatus(
        "Hedef kaydedilemedi. Yazdıkların burada korunuyor; yeniden dene.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  return (
    <section className="qc-study-workspace study-workspace">
      <div className="qc-study-overview">
        <article className="qc-study-stat">
          <AppIcon name="flame" />
          <div>
            <strong>{streak.current} gün</strong>
            <span>Aktif seri</span>
          </div>
        </article>
        <article className="qc-study-stat">
          <AppIcon name="book-2" />
          <div>
            <strong>{weeklySummary.totalAyahs}</strong>
            <span>Bu hafta çalışılan ayet</span>
          </div>
        </article>
        <article className="qc-study-stat">
          <AppIcon name="clock" />
          <div>
            <strong>{weeklySummary.totalMinutes} dk</strong>
            <span>Bu hafta pratik</span>
          </div>
        </article>
      </div>
      <article className="study-goal-card">
        <header>
          <span>
            <AppIcon name="target" />
          </span>
          <div>
            <small>GÜNLÜK HEDEFİM</small>
            <h2>Az, düzenli ve sana uygun.</h2>
          </div>
        </header>
        <form onSubmit={(e) => void save(e)}>
          <label>
            Çalışma niyetim
            <textarea
              required
              minLength={3}
              maxLength={240}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Her gün kısa bir okuma ve tecvid tekrarı…"
            />
          </label>
          <div className="qc-goal-inputs">
            <label>
              Günlük ayet hedefi
              <input
                type="number"
                required
                min={1}
                max={100}
                value={ayahs}
                onChange={(e) => setAyahs(Number(e.target.value))}
              />
            </label>
            <label>
              Günlük dakika hedefi
              <input
                type="number"
                required
                min={1}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
          </div>
          <div className="qc-goal-progress">
            <article>
              <strong>
                Bugün {today.totalAyahs}/{goal?.daily_ayah_goal ?? 5} ayet
              </strong>
              <progress
                value={today.totalAyahs}
                max={goal?.daily_ayah_goal ?? 5}
              />
            </article>
            <article>
              <strong>
                Bugün {today.totalMinutes}/{goal?.daily_minutes_goal ?? 10} dk
              </strong>
              <progress
                value={today.totalMinutes}
                max={goal?.daily_minutes_goal ?? 10}
              />
            </article>
          </div>
          <label className="goal-range">
            <span>
              <b>Genel hedefimde öz değerlendirmem</b>
              <strong>%{progress}</strong>
            </span>
            <input
              aria-label="Genel hedef ilerlemesi"
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </label>
          <p className="qc-caption">
            Günlük değerler kaydedilmiş alıştırmalardan hesaplanır. Aynı ayet
            gün içinde bir kez sayılır. Bu, okuma yeterliliği değerlendirmesi
            değildir.
          </p>
          <button className="primary-button" disabled={busy}>
            <AppIcon name="device-floppy" />
            {busy ? "Kaydediliyor…" : "Hedefi kaydet"}
          </button>
          {status && <p role="status">{status}</p>}
        </form>
      </article>
      <WeeklyLeaderboard realUser={realUser} userId={userId} />
      <article className="study-notes-card">
        <header>
          <div>
            <small>KUR’AN NOTLARIN</small>
            <h2>Son notların</h2>
          </div>
          <button onClick={() => onNavigate("quran")}>
            Not arşivini aç <AppIcon name="arrow-right" />
          </button>
        </header>
        {notes.length === 0 ? (
          <EmptyState
            icon="book"
            title="Henüz Kur’an notun yok"
            text="Not arşivinde ilk notunu ekleyebilirsin."
            compact
          />
        ) : (
          <div>
            {notes.slice(0, 4).map((n) => (
              <button key={n.id} onClick={() => onNavigate("quran")}>
                <div>
                  <strong>{n.ayet || n.sure}</strong>
                  <p>{n.ders || n.tefsir}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </article>
      <article className="study-reflection-card">
        <span className="eyebrow">DERS HAZIRLIĞIM</span>
        <h2>Görüşme konularından izler</h2>
        {related.length === 0 ? (
          <p>İlk görüşmenden sonra çalışma başlıkların burada görünür.</p>
        ) : (
          <ul>
            {related.map((a) => (
              <li key={a.id}>
                <AppIcon name="circle-check" />
                <span>
                  <strong>{a.topic_notes}</strong>
                  <small>
                    {a.hoca_name} · {formatAppointment(a.scheduled_start)}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
function WeeklyLeaderboard({
  realUser,
  userId,
}: {
  realUser: boolean;
  userId: string;
}) {
  const [rows, setRows] = useState<
      Array<{ alias: string; points: number; is_me: boolean }>
    >([]),
    [optIn, setOptIn] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  useEffect(() => {
    if (!realUser) return;
    let active = true;
    void Promise.all([
      supabase
        .from("quran_leaderboard_preferences")
        .select("opted_in")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.rpc("get_quran_weekly_leaderboard"),
    ]).then(([pref, list]) => {
      if (!active) return;
      if (pref.error || list.error)
        setError(
          "Haftalık tablo yüklenemedi. Katılım tercihin değiştirilmedi.",
        );
      else {
        setOptIn(pref.data?.opted_in ?? false);
        setRows(list.data ?? []);
      }
    });
    return () => {
      active = false;
    };
  }, [realUser, userId]);
  const toggle = async (value: boolean) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase
        .from("quran_leaderboard_preferences")
        .upsert({ user_id: userId, opted_in: value });
      if (error) throw error;
      setOptIn(value);
      const list = await supabase.rpc("get_quran_weekly_leaderboard");
      if (list.error) throw list.error;
      setRows(list.data ?? []);
    } catch {
      setError("Tercih veya tablo güncellenemedi. Lütfen yeniden dene.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return (
    <article className="qc-leaderboard">
      <header>
        <span className="eyebrow">BİRLİKTE İSTİKRAR</span>
        <h2>Haftanın öğrenme adımları</h2>
        <p>
          Bir üstünlük sıralaması değil; isteğe bağlı, anonim bir motivasyon
          tablosu. Pazartesi Türkiye saatine göre yenilenir.
        </p>
      </header>
      <label className="qc-group-toggle">
        <input
          type="checkbox"
          checked={optIn}
          disabled={!realUser || busy}
          onChange={(e) => void toggle(e.target.checked)}
        />{" "}
        Öğrenme puanımı anonim olarak paylaş
      </label>
      <p className="qc-caption">
        Varsayılan olarak kapalıdır. Adın, e-postan ve özel ders notların
        paylaşılmaz. Rumuz her hafta değişir; katılımını istediğin zaman
        kapatabilirsin.
      </p>
      {!realUser ? (
        <p>Canlı tablo ve katılım tercihi için hesabınla giriş yap.</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : rows.length === 0 ? (
        <p>Bu hafta henüz paylaşım yapan yok.</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li className={r.is_me ? "is-me" : ""} key={r.alias}>
              <strong>
                {r.alias}
                {r.is_me ? " · Sen" : ""}
              </strong>
              <span>{r.points} puan</span>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
