"use client";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { QURAN_TABS, openAppView, selectedValue } from "@/lib/appLocation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import { supabase } from "@/lib/supabase";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import { useAuthStore } from "@/store/useAuthStore";
import { isValidUUID, useJourneyStore } from "@/store/useJourneyStore";
import {
  SURAHS,
  getDemoSurahProgress,
  getDemoStreak,
  getDemoWeeklySummary,
  getDemoSpacedItems,
  TAJWEED_RULES,
  type SurahInfo,
  type SurahProgress,
  type SurahStatus,
  type QuranStreak,
  type WeeklySummary,
  type SpacedRepetitionItem,
  type QuranExerciseResult,
} from "@/lib/quranSurahs";
import type {
  AppointmentRow,
  ChatMessageRow,
  HocaAvailabilityRow,
  HocaProfileRow,
  HocaTimeOffRow,
  QuranLevel,
  QuranPeerMatchRow,
  QuranStudyGoalRow,
} from "@/types/database";
import type { WisdomEntry } from "./DailyWisdomWheel";
import SectionTagline from "./SectionTagline";
import AppointmentChat from "./AppointmentChat";
import AppointmentReview from "./AppointmentReview";

type CompanionTab =
  | "home"
  | "progress"
  | "exercises"
  | "teachers"
  | "appointments"
  | "peers"
  | "study"
  | "manage";
const DailyWisdomWheel = dynamic(() => import("./DailyWisdomWheel"), {
  loading: () => <CompanionSkeleton />,
});
export type AppointmentView = AppointmentRow & {
  hoca_name: string;
  hoca_title: string;
  hoca_photo: string | null;
  student_name: string;
  student_avatar: string | null;
  is_demo?: boolean;
};
type PeerView = {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  direction: "sent" | "received";
  status: QuranPeerMatchRow["status"];
  message: string;
  created_at: string;
};
type HelperView = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  quran_level: QuranLevel;
};

const SAMPLE_HOCA: HocaProfileRow = {
  id: "7ca2b35d-8c4f-4d62-9c91-1f4898e7c201",
  user_id: null,
  display_name: "İmam Hatip Ramazan Hoca",
  title: "İmam Hatip",
  bio: "Kur'an-ı Kerim öğretmenliği yapmaktadır. Bu örnek profil, yönetici tarafından gerçek bilgilerle güncellenmek üzere hazırlanmıştır.",
  specialties: ["Tecvid", "Mahreç", "Yeni Başlayanlar"],
  photo_url: null,
  is_active: true,
  is_placeholder: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};
const sampleAppointments = (studentId: string): AppointmentView[] => {
  const upcomingStart = new Date(Date.now() + 86_400_000);
  upcomingStart.setHours(19, 0, 0, 0);
  const completedStart = new Date(Date.now() - 2 * 86_400_000);
  completedStart.setHours(19, 0, 0, 0);
  return [
    {
      id: "2f0fd187-0cae-43fb-aa80-79459acd7d71",
      hoca_id: SAMPLE_HOCA.id,
      student_id: studentId,
      scheduled_start: upcomingStart.toISOString(),
      scheduled_end: new Date(upcomingStart.getTime() + 30 * 60_000).toISOString(),
      status: "confirmed",
      topic_notes: "Fâtiha suresi ve temel mahreç çalışması",
      created_at: new Date().toISOString(),
      cancelled_at: null,
      cancellation_reason: null,
      hoca_name: SAMPLE_HOCA.display_name,
      hoca_title: SAMPLE_HOCA.title,
      hoca_photo: SAMPLE_HOCA.photo_url,
      student_name: "Örnek Öğrenci",
      student_avatar: null,
      is_demo: true,
    },
    {
      id: "0f3689f5-c0fd-4b65-b9e9-7829d24a7f5c",
      hoca_id: SAMPLE_HOCA.id,
      student_id: studentId,
      scheduled_start: completedStart.toISOString(),
      scheduled_end: new Date(completedStart.getTime() + 30 * 60_000).toISOString(),
      status: "completed",
      topic_notes: "İhlâs suresi, tecvid ve kısa tekrar",
      created_at: new Date(completedStart.getTime() - 86_400_000).toISOString(),
      cancelled_at: null,
      cancellation_reason: null,
      hoca_name: SAMPLE_HOCA.display_name,
      hoca_title: SAMPLE_HOCA.title,
      hoca_photo: SAMPLE_HOCA.photo_url,
      student_name: "Örnek Öğrenci",
      student_avatar: null,
      is_demo: true,
    },
  ];
};
const LEVELS: Array<{
  value: QuranLevel;
  title: string;
  detail: string;
  icon: string;
}> = [
  { value: "beginner", title: "Yeni başlıyorum", detail: "Harfleri ve temel okumayı öğrenmek istiyorum.", icon: "seedling" },
  { value: "alphabet", title: "Elifba biliyorum", detail: "Okuyorum fakat henüz akıcı değilim.", icon: "book" },
  { value: "fluent", title: "Akıcı okuyorum", detail: "Tecvidimi ve mahrecimi geliştirmek istiyorum.", icon: "book-2" },
  { value: "helper", title: "Destek olabilirim", detail: "İyi seviyedeyim, bir kardeşime yardımcı olmak isterim.", icon: "heart-handshake" },
];
const STATUS_LABELS: Record<AppointmentRow["status"], string> = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  no_show: "Katılmadı",
};
const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const dateKey = (date: Date) => date.toLocaleDateString("en-CA");
const avatar = (name: string, url?: string | null) => {
  if (url) {
    try {
      const host = new URL(url).hostname;
      if (host === "api.dicebear.com" || host === "lh3.googleusercontent.com" || host.endsWith(".supabase.co")) return url;
    } catch { /* fallback */ }
  }
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
};
const formatAppointment = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", weekday: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(value));
const timeOnly = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" }).format(new Date(value));

const STATUS_COLORS: Record<SurahStatus, string> = {
  none: "var(--qc-grid-empty)",
  started: "var(--qc-grid-started)",
  reading: "var(--qc-grid-reading)",
  completed: "var(--qc-grid-completed)",
  memorized: "var(--qc-grid-memorized)",
};

export default function QuranCompanionView({
  onNavigate,
  wheelEntry,
}: {
  onNavigate: (view: string) => void;
  wheelEntry?: WisdomEntry;
}) {
  const { user, profile, patchProfile } = useAuthStore();
  const journey = useJourneyStore();
  const searchParams = useSearchParams();
  const requestedTab = selectedValue(searchParams.get('tab'), QURAN_TABS, 'home');
  const pilotDemo = searchParams.get("pilot") === "demo";
  const tab = requestedTab === 'manage' && profile?.role !== 'hoca' && profile?.role !== 'admin' ? 'home' : requestedTab;
  const setTab = (next: CompanionTab) => openAppView('quran-companion', next);
  const reducedMotion = useReducedMotion();
  const [teachers, setTeachers] = useState<HocaProfileRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [goal, setGoal] = useState<QuranStudyGoalRow | null>(null);
  const [helpers, setHelpers] = useState<HelperView[]>([]);
  const [matches, setMatches] = useState<PeerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isRealUser = Boolean(user && isValidUUID(user.id));
  const userId = user?.id || "";
  const isAdmin = profile?.role === "admin";
  const isHoca = profile?.role === "hoca";

  const [surahProgress, setSurahProgress] = useState<SurahProgress[]>(() => getDemoSurahProgress());
  const [streak, setStreak] = useState<QuranStreak>(() => getDemoStreak());
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary>(() => getDemoWeeklySummary());
  const [spacedItems, setSpacedItems] = useState<SpacedRepetitionItem[]>(() => getDemoSpacedItems());

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };
  const load = async () => {
    if (pilotDemo || !isRealUser) {
      setTeachers([SAMPLE_HOCA]);
      setAppointments(sampleAppointments(userId || "demo-student"));
      setLoading(false);
      return;
    }
    setLoading(true);
    const [teacherResult, appointmentResult, goalResult, helperResult, matchResult] = await Promise.all([
      supabase.from("hoca_profiles").select("*").eq("is_active", true).order("created_at"),
      supabase.rpc("get_my_quran_appointments"),
      supabase.from("quran_study_goals").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.rpc("browse_quran_helpers"),
      supabase.rpc("get_my_quran_peer_matches"),
    ]);
    setTeachers(teacherResult.data || []);
    setAppointments(appointmentResult.data || []);
    setGoal(goalResult.data || null);
    setHelpers(helperResult.data || []);
    setMatches(matchResult.data || []);
    const firstError = teacherResult.error || appointmentResult.error || goalResult.error || helperResult.error || matchResult.error;
    setError(firstError ? "Kur'an Kardeşim verileri tamamen yüklenemedi. Lütfen tekrar dene." : "");
    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user?.id, pilotDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRealUser || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const check = () =>
      appointments
        .filter((item) => item.student_id === userId && item.status === "confirmed")
        .forEach((item) => {
          const minutes = (new Date(item.scheduled_start).getTime() - Date.now()) / 60_000;
          const key = `sah-quran-appointment-reminder-${item.id}`;
          if (minutes > 0 && minutes <= 30 && !window.localStorage.getItem(key)) {
            window.localStorage.setItem(key, "1");
            new Notification("Kur'an Kardeşim · Randevun yaklaşıyor", {
              body: `${item.hoca_name} ile görüşmen ${Math.max(1, Math.ceil(minutes))} dakika sonra.`,
              icon: "/favicon.ico",
            });
          }
        });
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, [appointments, isRealUser, userId]);

  const [renderTime] = useState(() => Date.now());
  const upcoming = appointments
    .filter((item) => ["pending", "confirmed"].includes(item.status) && new Date(item.scheduled_end).getTime() > renderTime)
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  const ownedHoca = teachers.find((item) => item.user_id === user?.id);

  const saveLevel = async (level: QuranLevel) => {
    if (!isRealUser) { patchProfile({ quran_level: level }); flash("Geliştirme görünümünde seviye seçildi."); return; }
    const { error: updateError } = await supabase.from("profiles").update({ quran_level: level }).eq("id", user!.id);
    if (updateError) { setError("Seviyen kaydedilemedi."); return; }
    patchProfile({ quran_level: level });
    flash("Kur'an okuma seviyen kaydedildi.");
    await load();
  };

  const enableReminders = async () => {
    if (typeof Notification === "undefined") { setError("Bu tarayıcı bildirimleri desteklemiyor."); return; }
    const permission = await Notification.requestPermission();
    flash(permission === "granted" ? "Randevu hatırlatmaları açıldı." : "Bildirim izni verilmedi.");
  };

  const todaysReviews = spacedItems.filter((item) => item.nextReviewDate <= new Date().toISOString().slice(0, 10));
  const progressStats = useMemo(() => {
    const completed = surahProgress.filter((s) => s.readStatus === "completed" || s.readStatus === "memorized").length;
    const memorized = surahProgress.filter((s) => s.memorizeStatus === "memorized").length;
    const inProgress = surahProgress.filter((s) => s.readStatus === "started" || s.readStatus === "reading").length;
    return { completed, memorized, inProgress, total: 114 };
  }, [surahProgress]);

  const activePeer = matches.find((m) => m.status === "accepted");

  const navItems: Array<{ id: CompanionTab; label: string; icon: string; badge?: number }> = [
    { id: "home", label: "Ana Sayfa", icon: "home-heart" },
    { id: "progress", label: "İlerleme Haritası", icon: "map-2" },
    { id: "exercises", label: "Alıştırmalar", icon: "brain" },
    { id: "teachers", label: "Hocalar", icon: "calendar-user" },
    { id: "appointments", label: "Randevularım", icon: "calendar-check", badge: upcoming.length || undefined },
    { id: "peers", label: "Kur'an Kardeşi", icon: "heart-handshake" },
    { id: "study", label: "Çalışma Alanım", icon: "notebook" },
    ...(isHoca || isAdmin ? [{ id: "manage" as const, label: "Hoca yönetimi", icon: "settings" }] : []),
  ];

  return (
    <div className="quran-companion qc-v2">
      {notice && <div className="quran-toast" role="status"><AppIcon name="circle-check" /> {notice}</div>}

      {tab === "home" && (
          <section className="qc-hero">
            <div className="qc-hero-left">
              <span className="eyebrow">KUR'AN-I KERİM KARDEŞİM</span>
              <h1>Bugün ne çalışıyoruz?</h1>
              <div className="qc-streak-badge">
                <AppIcon name="flame" />
                <strong>{streak.current}</strong>
                <span>gün seri</span>
              </div>
              {todaysReviews.length > 0 ? (
                <div className="qc-today-task">
                  <AppIcon name="refresh" />
                  <div>
                    <strong>{todaysReviews.length} tekrar bekliyor</strong>
                    <span>Bugün {todaysReviews.map((r) => SURAHS.find((s) => s.id === r.surahId)?.name).filter(Boolean).join(", ")} surelerini tekrar et</span>
                  </div>
                </div>
              ) : (
                <div className="qc-today-task completed">
                  <AppIcon name="circle-check" />
                  <div>
                    <strong>Bugünkü tekrarlar tamam!</strong>
                    <span>Yeni bir alıştırmaya başlayabilirsin</span>
                  </div>
                </div>
              )}
              <div className="qc-hero-actions">
                <button className="qc-btn-primary" onClick={() => setTab("exercises")}>
                  <AppIcon name="brain" /> Çalışmaya başla
                </button>
                <button className="qc-btn-secondary" onClick={() => setTab("progress")}>
                  <AppIcon name="map-2" /> Haritamı gör
                </button>
              </div>
            </div>
            <div className="qc-hero-right">
              {activePeer ? (
                <div className="qc-buddy-card">
                  <small>KUR'AN KARDEŞİN</small>
                  <div className="qc-buddy-info">
                    <AvatarImage src={avatar(activePeer.partner_name, activePeer.partner_avatar)} alt="" size={48} />
                    <div>
                      <strong>{activePeer.partner_name}</strong>
                      <span>Bu hafta birlikte çalışıyorsunuz</span>
                    </div>
                  </div>
                  <button className="qc-btn-ghost" onClick={() => setTab("peers")}>
                    <AppIcon name="message" /> Mesaj gönder
                  </button>
                </div>
              ) : (
                <div className="qc-buddy-card empty">
                  <small>KUR'AN KARDEŞİ BUL</small>
                  <div className="qc-buddy-steps">
                    <span><b>1</b> Seviyeni belirle</span>
                    <span><b>2</b> Kardeşini eşleştir</span>
                    <span><b>3</b> Birlikte çalışın</span>
                  </div>
                  <button className="qc-btn-ghost" onClick={() => setTab("peers")}>
                    <AppIcon name="heart-handshake" /> Kardeş bul
                  </button>
                </div>
              )}
              {upcoming[0] && (
                <div className="qc-next-appointment">
                  <AppIcon name="calendar-check" />
                  <div>
                    <small>YAKLAŞAN RANDEVU</small>
                    <strong>{upcoming[0].hoca_name}</strong>
                    <span>{formatAppointment(upcoming[0].scheduled_start)}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
      )}

      {tab !== "home" && (
        <header className="page-heading">
          <div>
            <span className="eyebrow">KUR'AN-I KERİM KARDEŞİM</span>
            <h1>{navItems.find((item) => item.id === tab)?.label}</h1>
          </div>
        </header>
      )}

      <nav className="quran-companion-tabs" aria-label="Kur'an Kardeşim alanları">
        {navItems.map((item) => (
          <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
            <AppIcon name={item.icon} />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && <em>{item.badge}</em>}
          </button>
        ))}
      </nav>

      {tab === "home" && (
        <>
          {!profile?.quran_level && <LevelOnboarding onSelect={(level) => void saveLevel(level)} />}

          {/* İLERLEME HARİTASI KÜÇÜK ÖNİZLEME */}
          <section className="qc-progress-preview">
            <header>
              <div>
                <span className="eyebrow">İLERLEME HARİTAM</span>
                <h2>114 Sure Yolculuğu</h2>
              </div>
              <button className="qc-btn-ghost" onClick={() => setTab("progress")}>
                Tümünü gör <AppIcon name="arrow-right" />
              </button>
            </header>
            <div className="qc-mini-grid">
              {SURAHS.map((surah) => {
                const p = surahProgress.find((sp) => sp.surahId === surah.id);
                const status = p?.readStatus || "none";
                return (
                  <div
                    key={surah.id}
                    className={`qc-mini-cell ${status}`}
                    title={`${surah.id}. ${surah.name} — ${status === "none" ? "Başlanmadı" : status === "started" ? "Başlandı" : status === "reading" ? "Devam ediyor" : status === "completed" ? "Tamamlandı" : "Ezberlendi"}`}
                  />
                );
              })}
            </div>
            <div className="qc-progress-legend">
              <span><i className="qc-mini-cell none" /> Başlanmadı</span>
              <span><i className="qc-mini-cell started" /> Başlandı</span>
              <span><i className="qc-mini-cell reading" /> Devam ediyor</span>
              <span><i className="qc-mini-cell completed" /> Tamamlandı</span>
              <span><i className="qc-mini-cell memorized" /> Ezberlendi</span>
            </div>
            <div className="qc-progress-stats">
              <article>
                <strong>{progressStats.completed}</strong>
                <span>Tamamlanan</span>
              </article>
              <article>
                <strong>{progressStats.memorized}</strong>
                <span>Ezberlenen</span>
              </article>
              <article>
                <strong>{progressStats.inProgress}</strong>
                <span>Devam eden</span>
              </article>
              <article>
                <strong>{progressStats.total - progressStats.completed - progressStats.inProgress}</strong>
                <span>Bekleyen</span>
              </article>
            </div>
          </section>

          {/* ALIŞTIRMA MERKEZİ */}
          <section className="qc-exercise-preview">
            <header>
              <span className="eyebrow">ALIŞTIRMA MERKEZİ</span>
              <h2>Bilgini pekiştir</h2>
            </header>
            <div className="qc-exercise-cards">
              <button className="qc-exercise-card" onClick={() => setTab("exercises")}>
                <span className="qc-exercise-icon completion"><AppIcon name="text-recognition" /></span>
                <strong>Ezberleme Modu</strong>
                <p>Gizli ayet, adım adım açılma</p>
                {todaysReviews.length > 0 && <em className="qc-badge">{todaysReviews.length}</em>}
              </button>
              <button className="qc-exercise-card" onClick={() => setTab("exercises")}>
                <span className="qc-exercise-icon repetition"><AppIcon name="refresh" /></span>
                <strong>Hızlı Tekrar</strong>
                <p>Aralıklı tekrar sistemi</p>
              </button>
              <button className="qc-exercise-card" onClick={() => setTab("exercises")}>
                <span className="qc-exercise-icon tajweed"><AppIcon name="vocabulary" /></span>
                <strong>Tecvid Alıştırması</strong>
                <p>Kural tanıma ve uygulama</p>
              </button>
            </div>
          </section>

          {/* HOCA & KARDEŞ BLOĞU */}
          <section className="qc-social-block">
            <div className="qc-social-card teacher">
              <div className="qc-social-header">
                <span><AppIcon name="calendar-user" /></span>
                <small>HOCAlarım</small>
              </div>
              {teachers[0] ? (
                <>
                  <div className="qc-social-profile">
                    <AvatarImage src={avatar(teachers[0].display_name, teachers[0].photo_url)} alt="" size={56} />
                    <div>
                      <strong>{teachers[0].display_name}</strong>
                      <span>{teachers[0].title}</span>
                      <div className="hoca-tags">{teachers[0].specialties.slice(0, 3).map((t) => <span key={t}>{t}</span>)}</div>
                    </div>
                  </div>
                  {upcoming[0] && <p className="qc-next-session"><AppIcon name="clock" /> Sonraki: {formatAppointment(upcoming[0].scheduled_start)}</p>}
                </>
              ) : (
                <p className="qc-social-empty">Henüz hoca atanmadı.</p>
              )}
              <button className="qc-btn-secondary" onClick={() => setTab("teachers")}>
                <AppIcon name="calendar-plus" /> Randevu al
              </button>
            </div>

            <div className="qc-social-card peer">
              <div className="qc-social-header">
                <span><AppIcon name="heart-handshake" /></span>
                <small>KUR'AN KARDEŞİM</small>
              </div>
              {activePeer ? (
                <div className="qc-social-profile">
                  <AvatarImage src={avatar(activePeer.partner_name, activePeer.partner_avatar)} alt="" size={56} />
                  <div>
                    <strong>{activePeer.partner_name}</strong>
                    <span>Eşleşme durumu: Aktif</span>
                  </div>
                </div>
              ) : (
                <p className="qc-social-empty">Henüz bir Kur'an kardeşin yok. Birlikte çalışmak motivasyonunu artırır!</p>
              )}
              <button className="qc-btn-secondary" onClick={() => setTab("peers")}>
                <AppIcon name={activePeer ? "message" : "user-plus"} /> {activePeer ? "Mesaj gönder" : "Kardeş bul"}
              </button>
            </div>
          </section>

          {/* HAFTALIK ÖZET */}
          <section className="qc-weekly-summary">
            <header>
              <span className="eyebrow">BU HAFTA</span>
              <h2>Haftalık Özet</h2>
            </header>
            <div className="qc-weekly-grid">
              <article>
                <AppIcon name="book-2" />
                <strong>{weeklySummary.totalAyahs}</strong>
                <span>ayet çalışıldı</span>
              </article>
              <article>
                <AppIcon name="clock" />
                <strong>{weeklySummary.totalMinutes}</strong>
                <span>dakika</span>
              </article>
              <article>
                <AppIcon name="books" />
                <strong>{weeklySummary.surahsWorkedOn}</strong>
                <span>sure üzerinde</span>
              </article>
              <article>
                <AppIcon name="sparkles" />
                <strong>{weeklySummary.xhEarned}</strong>
                <span>XH kazanıldı</span>
              </article>
            </div>
            {weeklySummary.comparedToLastWeek !== 0 && (
              <div className={`qc-weekly-comparison ${weeklySummary.comparedToLastWeek > 0 ? "up" : "down"}`}>
                <AppIcon name={weeklySummary.comparedToLastWeek > 0 ? "trending-up" : "trending-down"} />
                <span>Geçen haftaya göre %{Math.abs(weeklySummary.comparedToLastWeek)} {weeklySummary.comparedToLastWeek > 0 ? "artış" : "azalış"}</span>
              </div>
            )}
            {weeklySummary.mostReviewedSurah && (
              <p className="qc-weekly-highlight"><AppIcon name="star" /> En çok tekrar edilen: <strong>{weeklySummary.mostReviewedSurah}</strong></p>
            )}
          </section>
        </>
      )}

      {error && (
        <div className="quran-inline-error" role="alert">
          <AppIcon name="alert-circle" />
          <span>{error}</span>
          <button onClick={() => void load()}>Tekrar dene</button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={loading ? "loading" : tab}
          className="quran-tab-transition"
          initial={reducedMotion ? false : { opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={{ duration: reducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {loading ? (
            <CompanionSkeleton />
          ) : tab === "home" ? null : tab === "progress" ? (
            <ProgressMap surahProgress={surahProgress} onUpdate={setSurahProgress} />
          ) : tab === "exercises" ? (
            <ExerciseCenter
              surahProgress={surahProgress}
              spacedItems={spacedItems}
              streak={streak}
              onStreakUpdate={setStreak}
              onFlash={flash}
            />
          ) : tab === "teachers" ? (
            <TeacherDiscovery teachers={teachers} onBooked={async () => { await load(); setTab("appointments"); flash("Randevun onaylandı."); }} realUser={isRealUser} />
          ) : tab === "appointments" ? (
            <AppointmentsView appointments={appointments} userId={userId} isHoca={isHoca || isAdmin} onReload={load} onReminders={() => void enableReminders()} onNotice={flash} />
          ) : tab === "peers" ? (
            <PeerMatching helpers={helpers} matches={matches} level={profile?.quran_level || null} userId={userId} realUser={isRealUser} onReload={load} />
          ) : tab === "study" ? (
            <StudyWorkspace goal={goal} notes={journey.quranNotes} appointments={appointments} userId={userId} realUser={isRealUser} onNavigate={onNavigate} onSaved={async () => { await load(); flash("Çalışma hedefin güncellendi."); }} streak={streak} weeklySummary={weeklySummary} />
          ) : (
            <HocaManagement teachers={teachers} ownedHoca={ownedHoca} appointments={appointments} isAdmin={isAdmin} onReload={load} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════
   İLERLEME HARİTASI — 114 SURE GRID
   ═══════════════════════════════════════════ */
function ProgressMap({ surahProgress, onUpdate }: { surahProgress: SurahProgress[]; onUpdate: (p: SurahProgress[]) => void }) {
  const [selectedSurah, setSelectedSurah] = useState<SurahInfo | null>(null);
  const [filterJuz, setFilterJuz] = useState<number | null>(null);

  const filtered = filterJuz ? SURAHS.filter((s) => s.juz === filterJuz) : SURAHS;
  const selectedProgress = selectedSurah ? surahProgress.find((sp) => sp.surahId === selectedSurah.id) : null;

  const updateStatus = (surahId: number, field: "readStatus" | "memorizeStatus", value: string) => {
    onUpdate(surahProgress.map((sp) => sp.surahId === surahId ? { ...sp, [field]: value, lastStudyDate: new Date().toISOString().slice(0, 10) } : sp));
  };

  return (
    <section className="qc-progress-full">
      <div className="qc-progress-toolbar">
        <div className="qc-juz-filter">
          <button className={filterJuz === null ? "active" : ""} onClick={() => setFilterJuz(null)}>Tümü</button>
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
            <button key={juz} className={filterJuz === juz ? "active" : ""} onClick={() => setFilterJuz(juz)}>{juz}. Cüz</button>
          ))}
        </div>
      </div>

      <div className="qc-surah-grid">
        {filtered.map((surah) => {
          const p = surahProgress.find((sp) => sp.surahId === surah.id);
          const status = p?.readStatus || "none";
          const memStatus = p?.memorizeStatus || "none";
          return (
            <button
              key={surah.id}
              className={`qc-surah-cell ${status} ${selectedSurah?.id === surah.id ? "selected" : ""}`}
              onClick={() => setSelectedSurah(surah)}
            >
              <span className="qc-surah-num">{surah.id}</span>
              <strong>{surah.name}</strong>
              <small>{surah.ayahCount} ayet</small>
              {memStatus === "memorized" && <i className="qc-mem-badge"><AppIcon name="star-filled" /></i>}
              {memStatus === "studying" && <i className="qc-mem-badge studying"><AppIcon name="book" /></i>}
              {memStatus === "reviewing" && <i className="qc-mem-badge reviewing"><AppIcon name="refresh" /></i>}
            </button>
          );
        })}
      </div>

      {selectedSurah && selectedProgress && (
        <div className="qc-surah-detail">
          <header>
            <div>
              <span className="qc-surah-num-lg">{selectedSurah.id}</span>
              <div>
                <h3>{selectedSurah.name} <span lang="ar" dir="rtl">{selectedSurah.arabic}</span></h3>
                <small>{selectedSurah.ayahCount} ayet · {selectedSurah.type === "mekki" ? "Mekkî" : "Medenî"} · {selectedSurah.juz}. Cüz</small>
              </div>
            </div>
            <button onClick={() => setSelectedSurah(null)}><AppIcon name="x" /></button>
          </header>

          <div className="qc-detail-progress">
            <label>
              <span>Okuma Durumu</span>
              <select
                value={selectedProgress.readStatus}
                onChange={(e) => updateStatus(selectedSurah.id, "readStatus", e.target.value)}
              >
                <option value="none">Başlanmadı</option>
                <option value="started">Başlandı</option>
                <option value="reading">Devam ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </label>
            <label>
              <span>Ezberleme Durumu</span>
              <select
                value={selectedProgress.memorizeStatus}
                onChange={(e) => updateStatus(selectedSurah.id, "memorizeStatus", e.target.value)}
              >
                <option value="none">Başlanmadı</option>
                <option value="studying">Çalışılıyor</option>
                <option value="reviewing">Tekrar aşaması</option>
                <option value="memorized">Ezberlendi</option>
              </select>
            </label>
          </div>

          <div className="qc-detail-stats">
            <article>
              <strong>{selectedProgress.completedAyahs}/{selectedSurah.ayahCount}</strong>
              <span>Ayet tamamlandı</span>
            </article>
            <article>
              <strong>{selectedProgress.totalErrors}</strong>
              <span>Toplam hata</span>
            </article>
            <article>
              <strong>{selectedProgress.difficultAyahs.length}</strong>
              <span>Zor ayet</span>
            </article>
            <article>
              <strong>{selectedProgress.lastStudyDate || "—"}</strong>
              <span>Son çalışma</span>
            </article>
          </div>

          {selectedProgress.difficultAyahs.length > 0 && (
            <div className="qc-difficult-ayahs">
              <small>ZOR İŞARETLENEN AYETLER</small>
              <div>{selectedProgress.difficultAyahs.map((a) => <span key={a}>Ayet {a}</span>)}</div>
            </div>
          )}
        </div>
      )}

      <div className="qc-progress-legend full">
        <span><i className="qc-mini-cell none" /> Başlanmadı</span>
        <span><i className="qc-mini-cell started" /> Başlandı</span>
        <span><i className="qc-mini-cell reading" /> Devam ediyor</span>
        <span><i className="qc-mini-cell completed" /> Tamamlandı</span>
        <span><i className="qc-mini-cell memorized" /> Ezberlendi</span>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   ALIŞTIRMA MERKEZİ
   ═══════════════════════════════════════════ */
function ExerciseCenter({
  surahProgress,
  spacedItems,
  streak,
  onStreakUpdate,
  onFlash,
}: {
  surahProgress: SurahProgress[];
  spacedItems: SpacedRepetitionItem[];
  streak: QuranStreak;
  onStreakUpdate: (s: QuranStreak) => void;
  onFlash: (msg: string) => void;
}) {
  const [mode, setMode] = useState<"menu" | "completion" | "ordering" | "tajweed" | "spaced">("menu");
  const [exerciseResult, setExerciseResult] = useState<QuranExerciseResult | null>(null);

  const todaysReviews = spacedItems.filter((item) => item.nextReviewDate <= new Date().toISOString().slice(0, 10));

  if (mode === "completion") return <CompletionExercise onBack={() => setMode("menu")} onComplete={(r) => { setExerciseResult(r); setMode("menu"); onFlash(`Alıştırma tamamlandı! Skor: ${r.score}/${r.totalQuestions}`); }} />;
  if (mode === "ordering") return <OrderingExercise onBack={() => setMode("menu")} onComplete={(r) => { setExerciseResult(r); setMode("menu"); onFlash(`Sıralama tamamlandı! Skor: ${r.score}/${r.totalQuestions}`); }} />;
  if (mode === "tajweed") return <TajweedExercise onBack={() => setMode("menu")} onComplete={(r) => { setExerciseResult(r); setMode("menu"); onFlash(`Tecvid alıştırması bitti! Skor: ${r.score}/${r.totalQuestions}`); }} />;
  if (mode === "spaced") return <SpacedReview items={todaysReviews} onBack={() => setMode("menu")} onComplete={() => { setMode("menu"); onFlash("Bugünkü tekrarlar tamamlandı!"); }} />;

  return (
    <section className="qc-exercise-center">
      <div className="qc-exercise-streak">
        <div className="qc-streak-display">
          <AppIcon name="flame" />
          <div>
            <strong>{streak.current} gün seri</strong>
            <span>En uzun: {streak.longest} gün · Toplam: {streak.totalDays} gün</span>
          </div>
        </div>
        <div className="qc-streak-dots">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dayStr = date.toISOString().slice(0, 10);
            const isActive = streak.lastDate >= dayStr && i >= 7 - streak.current;
            return (
              <div key={i} className={`qc-streak-dot ${isActive ? "active" : ""}`}>
                <span>{["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"][date.getDay() === 0 ? 6 : date.getDay() - 1]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {todaysReviews.length > 0 && (
        <button className="qc-spaced-cta" onClick={() => setMode("spaced")}>
          <span className="qc-spaced-icon"><AppIcon name="refresh" /></span>
          <div>
            <strong>{todaysReviews.length} tekrar bekliyor</strong>
            <span>Aralıklı tekrar — bugünkü porsiyonun hazır</span>
          </div>
          <AppIcon name="arrow-right" />
        </button>
      )}

      {exerciseResult && (
        <div className="qc-last-result">
          <AppIcon name="trophy" />
          <span>Son alıştırma: <strong>{exerciseResult.score}/{exerciseResult.totalQuestions}</strong> doğru · {exerciseResult.type === "completion" ? "Ayet Tamamlama" : exerciseResult.type === "ordering" ? "Sıralama" : "Tecvid"}</span>
        </div>
      )}

      <div className="qc-exercise-modes">
        <button className="qc-mode-card completion" onClick={() => setMode("completion")}>
          <span><AppIcon name="text-recognition" /></span>
          <h3>Ayet Tamamlama</h3>
          <p>Ayetin başı gösterilir, devamını hatırla ve tamamla. Ezberleme gücünü test et.</p>
          <em><AppIcon name="arrow-right" /> Başla</em>
        </button>
        <button className="qc-mode-card ordering" onClick={() => setMode("ordering")}>
          <span><AppIcon name="arrows-sort" /></span>
          <h3>Ayet Sıralama</h3>
          <p>Karışık ayetleri doğru sıraya diz. Surelerdeki akışı pekiştir.</p>
          <em><AppIcon name="arrow-right" /> Başla</em>
        </button>
        <button className="qc-mode-card tajweed" onClick={() => setMode("tajweed")}>
          <span><AppIcon name="vocabulary" /></span>
          <h3>Tecvid Tanıma</h3>
          <p>Verilen ayette tecvid kurallarını tanı ve işaretle. Okuma kaliteni geliştir.</p>
          <em><AppIcon name="arrow-right" /> Başla</em>
        </button>
      </div>
    </section>
  );
}

/* — Ayet Tamamlama Alıştırması — */
function CompletionExercise({ onBack, onComplete }: { onBack: () => void; onComplete: (r: QuranExerciseResult) => void }) {
  const questions = useMemo(() => [
    { surahId: 1, ayah: 1, start: "بِسْمِ اللَّهِ", answer: "الرَّحْمَٰنِ الرَّحِيمِ", options: ["الرَّحْمَٰنِ الرَّحِيمِ", "الْعَالَمِينَ", "الْمُسْتَقِيمَ", "نَسْتَعِينُ"] },
    { surahId: 1, ayah: 2, start: "الْحَمْدُ لِلَّهِ", answer: "رَبِّ الْعَالَمِينَ", options: ["رَبِّ الْعَالَمِينَ", "مَالِكِ يَوْمِ الدِّينِ", "الرَّحْمَٰنِ الرَّحِيمِ", "صِرَاطَ الْمُسْتَقِيمَ"] },
    { surahId: 112, ayah: 1, start: "قُلْ هُوَ اللَّهُ", answer: "أَحَدٌ", options: ["أَحَدٌ", "الصَّمَدُ", "كُفُوًا أَحَدٌ", "يُولَدْ"] },
    { surahId: 113, ayah: 1, start: "قُلْ أَعُوذُ بِرَبِّ", answer: "الْفَلَقِ", options: ["الْفَلَقِ", "النَّاسِ", "الْعَالَمِينَ", "الرَّحِيمِ"] },
    { surahId: 114, ayah: 1, start: "قُلْ أَعُوذُ بِرَبِّ", answer: "النَّاسِ", options: ["النَّاسِ", "الْفَلَقِ", "الْمَلِكِ", "الْإِلَٰهِ"] },
  ], []);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const startTime = useRef(Date.now());

  const q = questions[current];
  const surahName = SURAHS.find((s) => s.id === q.surahId)?.name || "";

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    if (option === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      onComplete({ id: crypto.randomUUID(), type: "completion", surahId: q.surahId, score: score + (selected === q.answer ? 0 : 0), totalQuestions: questions.length, completedAt: new Date().toISOString(), timeSpentSeconds: Math.round((Date.now() - startTime.current) / 1000) });
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}><AppIcon name="arrow-left" /> Geri</button>
        <div className="qc-exercise-progress">
          <span>{current + 1}/{questions.length}</span>
          <i><b style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></i>
        </div>
        <span className="qc-exercise-score"><AppIcon name="star" /> {score}</span>
      </header>

      <div className="qc-exercise-question">
        <small>{surahName} Suresi · Ayet {q.ayah}</small>
        <h2 className="qc-exercise-prompt">
          <span lang="ar" dir="rtl">{q.start}</span>
          <span className="qc-blank">???</span>
        </h2>
        <p>Devamını seç:</p>
      </div>

      <div className="qc-exercise-options">
        {q.options.map((opt) => (
          <button
            key={opt}
            className={`qc-option ${showResult ? (opt === q.answer ? "correct" : opt === selected ? "wrong" : "") : selected === opt ? "selected" : ""}`}
            onClick={() => handleSelect(opt)}
            disabled={showResult}
          >
            <span lang="ar" dir="rtl">{opt}</span>
            {showResult && opt === q.answer && <AppIcon name="circle-check" />}
            {showResult && opt === selected && opt !== q.answer && <AppIcon name="circle-x" />}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="qc-exercise-feedback">
          <p className={selected === q.answer ? "correct" : "wrong"}>
            {selected === q.answer ? "Doğru! Mâşallah." : `Doğru cevap: ${q.answer}`}
          </p>
          <button className="qc-btn-primary" onClick={next}>
            {current + 1 >= questions.length ? "Sonuçları gör" : "Sonraki"} <AppIcon name="arrow-right" />
          </button>
        </div>
      )}
    </section>
  );
}

/* — Ayet Sıralama Alıştırması — */
function OrderingExercise({ onBack, onComplete }: { onBack: () => void; onComplete: (r: QuranExerciseResult) => void }) {
  const verses = useMemo(() => [
    { id: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" },
    { id: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ" },
    { id: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ" },
    { id: 4, text: "مَالِكِ يَوْمِ الدِّينِ" },
    { id: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ" },
    { id: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ" },
    { id: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ" },
  ], []);

  const [shuffled, setShuffled] = useState(() => [...verses].sort(() => Math.random() - 0.5));
  const [ordered, setOrdered] = useState<typeof verses>([]);
  const [checked, setChecked] = useState(false);
  const startTime = useRef(Date.now());

  const addToOrder = (verse: typeof verses[0]) => {
    if (checked) return;
    setOrdered((o) => [...o, verse]);
    setShuffled((s) => s.filter((v) => v.id !== verse.id));
  };

  const removeFromOrder = (verse: typeof verses[0]) => {
    if (checked) return;
    setShuffled((s) => [...s, verse]);
    setOrdered((o) => o.filter((v) => v.id !== verse.id));
  };

  const checkAnswer = () => {
    setChecked(true);
  };

  const score = ordered.filter((v, i) => v.id === i + 1).length;

  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}><AppIcon name="arrow-left" /> Geri</button>
        <h3>Fâtiha Suresi — Sıralama</h3>
      </header>

      <div className="qc-ordering-exercise">
        <div className="qc-ordering-instructions">
          <AppIcon name="arrows-sort" />
          <p>Ayetleri doğru sıraya yerleştir. Önce okunan ayete tıkla.</p>
        </div>

        <div className="qc-ordering-target">
          <small>SIRALI AYETLER</small>
          {ordered.length === 0 && <p className="qc-ordering-hint">Aşağıdan ayetlere tıklayarak sırala</p>}
          {ordered.map((v, i) => (
            <button key={v.id} className={`qc-ordered-verse ${checked ? (v.id === i + 1 ? "correct" : "wrong") : ""}`} onClick={() => removeFromOrder(v)}>
              <span className="qc-verse-num">{i + 1}</span>
              <span lang="ar" dir="rtl">{v.text}</span>
              {checked && v.id === i + 1 && <AppIcon name="circle-check" />}
              {checked && v.id !== i + 1 && <AppIcon name="circle-x" />}
            </button>
          ))}
        </div>

        {shuffled.length > 0 && (
          <div className="qc-ordering-pool">
            <small>KARIŞIK AYETLER</small>
            {shuffled.map((v) => (
              <button key={v.id} className="qc-pool-verse" onClick={() => addToOrder(v)}>
                <span lang="ar" dir="rtl">{v.text}</span>
                <AppIcon name="plus" />
              </button>
            ))}
          </div>
        )}

        {ordered.length === verses.length && !checked && (
          <button className="qc-btn-primary" onClick={checkAnswer}>
            <AppIcon name="check" /> Kontrol et
          </button>
        )}

        {checked && (
          <div className="qc-exercise-feedback">
            <p className={score === verses.length ? "correct" : "partial"}>
              {score === verses.length ? "Hepsini doğru sıraladın! Mâşallah!" : `${score}/${verses.length} doğru sırada.`}
            </p>
            <button className="qc-btn-primary" onClick={() => onComplete({ id: crypto.randomUUID(), type: "ordering", surahId: 1, score, totalQuestions: verses.length, completedAt: new Date().toISOString(), timeSpentSeconds: Math.round((Date.now() - startTime.current) / 1000) })}>
              Bitir <AppIcon name="arrow-right" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* — Tecvid Tanıma Alıştırması — */
function TajweedExercise({ onBack, onComplete }: { onBack: () => void; onComplete: (r: QuranExerciseResult) => void }) {
  const questions = useMemo(() => [
    { text: "مِن رَّبِّهِمْ", rule: "idgham", surahId: 2 },
    { text: "مِنْ خَيْرٍ", rule: "izhar", surahId: 2 },
    { text: "أَنبِئْهُم", rule: "iqlab", surahId: 2 },
    { text: "مِن شَرِّ", rule: "ikhfa", surahId: 113 },
    { text: "وَلَا الضَّالِّينَ", rule: "madd", surahId: 1 },
  ], []);

  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const startTime = useRef(Date.now());
  const q = questions[current];
  const correctRule = TAJWEED_RULES.find((r) => r.id === q.rule)!;

  const handleSelect = (ruleId: string) => {
    if (showResult) return;
    setSelected(ruleId);
    setShowResult(true);
    if (ruleId === q.rule) setScore((s) => s + 1);
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      onComplete({ id: crypto.randomUUID(), type: "tajweed", surahId: q.surahId, score, totalQuestions: questions.length, completedAt: new Date().toISOString(), timeSpentSeconds: Math.round((Date.now() - startTime.current) / 1000) });
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}><AppIcon name="arrow-left" /> Geri</button>
        <div className="qc-exercise-progress">
          <span>{current + 1}/{questions.length}</span>
          <i><b style={{ width: `${((current + 1) / questions.length) * 100}%` }} /></i>
        </div>
        <span className="qc-exercise-score"><AppIcon name="star" /> {score}</span>
      </header>

      <div className="qc-exercise-question tajweed">
        <small>Tecvid Tanıma</small>
        <h2 lang="ar" dir="rtl" className="qc-tajweed-text">{q.text}</h2>
        <p>Bu ifadede hangi tecvid kuralı var?</p>
      </div>

      <div className="qc-tajweed-options">
        {TAJWEED_RULES.map((rule) => (
          <button
            key={rule.id}
            className={`qc-tajweed-option ${showResult ? (rule.id === q.rule ? "correct" : rule.id === selected ? "wrong" : "") : selected === rule.id ? "selected" : ""}`}
            onClick={() => handleSelect(rule.id)}
            disabled={showResult}
            style={{ "--rule-color": rule.color } as React.CSSProperties}
          >
            <strong>{rule.name}</strong>
            <small>{rule.description}</small>
            {showResult && rule.id === q.rule && <AppIcon name="circle-check" />}
            {showResult && rule.id === selected && rule.id !== q.rule && <AppIcon name="circle-x" />}
          </button>
        ))}
      </div>

      {showResult && (
        <div className="qc-exercise-feedback">
          <p className={selected === q.rule ? "correct" : "wrong"}>
            {selected === q.rule ? `Doğru! Bu bir ${correctRule.name} kuralı.` : `Doğru cevap: ${correctRule.name} — ${correctRule.description}`}
          </p>
          <button className="qc-btn-primary" onClick={next}>
            {current + 1 >= questions.length ? "Sonuçları gör" : "Sonraki"} <AppIcon name="arrow-right" />
          </button>
        </div>
      )}
    </section>
  );
}

/* — Aralıklı Tekrar (Spaced Repetition) — */
function SpacedReview({ items, onBack, onComplete }: { items: SpacedRepetitionItem[]; onBack: () => void; onComplete: () => void }) {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (items.length === 0) {
    return (
      <section className="qc-exercise-active">
        <header><button onClick={onBack}><AppIcon name="arrow-left" /> Geri</button></header>
        <div className="qc-spaced-empty">
          <AppIcon name="circle-check" />
          <h2>Bugünkü tekrarlar tamam!</h2>
          <p>Yarın yeni tekrarlar gelecek. Aralıklı tekrar sistemi ezberinizi kalıcı hale getirir.</p>
        </div>
      </section>
    );
  }

  const item = items[current];
  const surah = SURAHS.find((s) => s.id === item.surahId);

  const rate = (quality: "hard" | "good" | "easy") => {
    if (current + 1 >= items.length) { onComplete(); return; }
    setCurrent((c) => c + 1);
    setRevealed(false);
  };

  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}><AppIcon name="arrow-left" /> Geri</button>
        <div className="qc-exercise-progress">
          <span>{current + 1}/{items.length}</span>
          <i><b style={{ width: `${((current + 1) / items.length) * 100}%` }} /></i>
        </div>
      </header>

      <div className="qc-spaced-card">
        <small>ARALIKLI TEKRAR · {surah?.name} {item.startAyah}-{item.endAyah}. Ayet</small>
        <div className="qc-spaced-content">
          <h2>{surah?.name} Suresi</h2>
          <p>Ayet {item.startAyah} — {item.endAyah} arası</p>
          <span className="qc-spaced-interval">Tekrar #{item.reviewCount + 1} · Aralık: {[1, 3, 7, 21, 60][item.intervalIndex]} gün</span>
        </div>

        {!revealed ? (
          <button className="qc-btn-primary qc-reveal-btn" onClick={() => setRevealed(true)}>
            <AppIcon name="eye" /> Ayetleri göster ve kendini değerlendir
          </button>
        ) : (
          <div className="qc-spaced-rating">
            <p>Bu ayetleri ne kadar hatırlıyorsun?</p>
            <div className="qc-rating-buttons">
              <button className="qc-rate hard" onClick={() => rate("hard")}>
                <AppIcon name="mood-sad" />
                <span>Zor</span>
                <small>Tekrar yarın</small>
              </button>
              <button className="qc-rate good" onClick={() => rate("good")}>
                <AppIcon name="mood-smile" />
                <span>İyi</span>
                <small>3 gün sonra</small>
              </button>
              <button className="qc-rate easy" onClick={() => rate("easy")}>
                <AppIcon name="mood-happy" />
                <span>Kolay</span>
                <small>7 gün sonra</small>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   MEVCUT BÖLÜMLER (GÜNCELLENEN)
   ═══════════════════════════════════════════ */

function LevelOnboarding({ onSelect }: { onSelect: (level: QuranLevel) => void }) {
  return (
    <section className="quran-level-onboarding">
      <header>
        <span className="eyebrow">SANA UYGUN YOLCULUK</span>
        <h2>Kur'an okuma seviyeni değerlendir</h2>
        <p>Bu seçim yalnızca sana uygun hoca ve akran desteğini göstermek içindir; bir üstünlük ölçüsü değildir.</p>
      </header>
      <div>
        {LEVELS.map((item) => (
          <button key={item.value} onClick={() => onSelect(item.value)}>
            <AppIcon name={item.icon} />
            <span><strong>{item.title}</strong><small>{item.detail}</small></span>
            <AppIcon name="arrow-right" />
          </button>
        ))}
      </div>
    </section>
  );
}

function TeacherDiscovery({ teachers, onBooked, realUser }: { teachers: HocaProfileRow[]; onBooked: () => Promise<void>; realUser: boolean }) {
  const [selected, setSelected] = useState<HocaProfileRow | null>(null);
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">RANDEVU SİSTEMİ</span>
          <h2>Hocalar</h2>
          <p>Uzmanlık alanını incele, uygun günü seç ve görüşme konunu ekle.</p>
        </div>
      </header>
      {teachers.length === 0 ? (
        <EmptyState icon="calendar-off" title="Henüz aktif hoca yok" text="Yeni hocalar eklendiğinde burada görünecek." />
      ) : (
        <div className="hoca-grid">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="hoca-card">
              <div className="hoca-avatar">
                {teacher.photo_url ? <AvatarImage src={teacher.photo_url} alt={`${teacher.display_name} profil fotoğrafı`} size={160} /> : <span>{teacher.display_name.split(" ").slice(-1)[0][0]}</span>}
                {teacher.is_placeholder && <em>Örnek profil</em>}
              </div>
              <div>
                <small>{teacher.title}</small>
                <h3>{teacher.display_name}</h3>
                <p>{teacher.bio}</p>
                <div className="hoca-tags">{teacher.specialties.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </div>
              <button onClick={() => setSelected(teacher)}>Randevu al <AppIcon name="arrow-right" /></button>
            </article>
          ))}
        </div>
      )}
      {selected && <BookingFlow teacher={selected} onClose={() => setSelected(null)} onBooked={onBooked} realUser={realUser} />}
    </section>
  );
}

function BookingFlow({ teacher, onClose, onBooked, realUser }: { teacher: HocaProfileRow; onClose: () => void; onBooked: () => Promise<void>; realUser: boolean }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [availableDays, setAvailableDays] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<Array<{ slot_start: string; slot_end: string }>>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!realUser) {
      const result: Record<string, number> = {};
      for (let d = 1; d <= 31; d += 1) {
        const date = new Date(month.getFullYear(), month.getMonth(), d);
        if ([1, 3, 6].includes(date.getDay()) && date > new Date()) result[dateKey(date)] = 4;
      }
      const timer = window.setTimeout(() => setAvailableDays(result), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void supabase.rpc("get_hoca_available_days", { target_hoca_id: teacher.id, month_date: dateKey(month) })
        .then(({ data }) => setAvailableDays(Object.fromEntries((data || []).map((item) => [item.available_date, Number(item.slot_count)]))));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [month, realUser, teacher.id]);

  const chooseDate = async (key: string) => {
    setSelectedDate(key); setSelectedSlot(""); setBusy(true);
    if (!realUser) {
      setSlots(["10:00", "10:30", "11:00", "11:30"].map((time) => { const start = new Date(`${key}T${time}:00+03:00`); return { slot_start: start.toISOString(), slot_end: new Date(start.getTime() + 30 * 60_000).toISOString() }; }));
      setBusy(false); return;
    }
    const { data, error: slotError } = await supabase.rpc("get_hoca_available_slots", { target_hoca_id: teacher.id, target_date: key });
    setSlots(data || []); setError(slotError ? "Saatler yüklenemedi." : ""); setBusy(false);
  };
  const confirm = async () => {
    if (!selectedSlot || !realUser) { if (!realUser) setError("Canlı randevu oluşturmak için gerçek hesabınla giriş yap."); return; }
    setBusy(true); setError("");
    const { error: bookingError } = await supabase.rpc("book_hoca_appointment", { target_hoca_id: teacher.id, target_start: selectedSlot, notes });
    if (bookingError) { setError(bookingError.message.includes("SLOT_UNAVAILABLE") ? "Bu saat az önce doldu." : "Randevu oluşturulamadı."); setBusy(false); await chooseDate(selectedDate); return; }
    await onBooked(); onClose();
  };
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const calendar = [...Array(new Date(month.getFullYear(), month.getMonth(), 1).getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];
  return (
    <div className="quran-modal-backdrop" role="presentation">
      <section className="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="modal-close" onClick={onClose} aria-label="Kapat"><AppIcon name="x" /></button>
        <aside>
          <AvatarImage src={avatar(teacher.display_name, teacher.photo_url)} alt={`${teacher.display_name} profil fotoğrafı`} size={120} />
          <span className="eyebrow">{teacher.title}</span>
          <h2 id="booking-title">{teacher.display_name}</h2>
          <p>{teacher.bio}</p>
          <div className="hoca-tags">{teacher.specialties.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <small><AppIcon name="clock" /> Saatler Türkiye saatiyle gösterilir.</small>
        </aside>
        <div className="booking-calendar">
          <header>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Önceki ay"><AppIcon name="chevron-left" /></button>
            <strong>{month.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}</strong>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Sonraki ay"><AppIcon name="chevron-right" /></button>
          </header>
          <div className="calendar-weekdays">{DAYS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="booking-days">
            {calendar.map((date, index) => date ? (
              <button key={date.toISOString()} disabled={!availableDays[dateKey(date)]} className={selectedDate === dateKey(date) ? "selected" : ""} onClick={() => void chooseDate(dateKey(date))}>
                <span>{date.getDate()}</span>{availableDays[dateKey(date)] ? <i>{availableDays[dateKey(date)]}</i> : null}
              </button>
            ) : <i key={`blank-${index}`} />)}
          </div>
        </div>
        <div className="booking-slots">
          <span className="eyebrow">{selectedDate ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "ÖNCE BİR GÜN SEÇ"}</span>
          <h3>Uygun saatler</h3>
          {busy ? <div className="slot-loading">Saatler hazırlanıyor…</div> : selectedDate && slots.length === 0 ? <p>Bu gün için uygun saat kalmadı.</p> : (
            <div className="slot-list">{slots.map((slot) => <button key={slot.slot_start} className={selectedSlot === slot.slot_start ? "selected" : ""} onClick={() => setSelectedSlot(slot.slot_start)}>{timeOnly(slot.slot_start)}{selectedSlot === slot.slot_start && <AppIcon name="check" />}</button>)}</div>
          )}
          {selectedSlot && <label className="booking-note"><span>Bugün ne üzerinde çalışmak istersin?</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={600} placeholder="Örn. Tecvid kuralları, ezber tekrarı…" /></label>}
          {error && <p className="booking-error">{error}</p>}
          <button className="primary-button booking-confirm" disabled={!selectedSlot || busy} onClick={() => void confirm()}><AppIcon name="calendar-check" /> Randevuyu onayla</button>
          <small className="booking-policy">Randevu anında onaylanır. Başlangıçtan 2 saat öncesine kadar ücretsiz iptal edebilirsin.</small>
        </div>
      </section>
    </div>
  );
}

function AppointmentsView({ appointments, userId, isHoca, onReload, onReminders, onNotice }: { appointments: AppointmentView[]; userId: string; isHoca: boolean; onReload: () => Promise<void>; onReminders: () => void; onNotice: (message: string) => void }) {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [reviewAppointment, setReviewAppointment] = useState<AppointmentView | null>(null);
  const [chatAppointment, setChatAppointment] = useState<AppointmentView | null>(null);
  const [now] = useState(() => Date.now());
  const items = appointments.filter((item) => filter === "upcoming" ? ["pending", "confirmed"].includes(item.status) && new Date(item.scheduled_end).getTime() > now : !["pending", "confirmed"].includes(item.status) || new Date(item.scheduled_end).getTime() <= now).sort((a, b) => filter === "upcoming" ? a.scheduled_start.localeCompare(b.scheduled_start) : b.scheduled_start.localeCompare(a.scheduled_start));
  const cancel = async (item: AppointmentView) => {
    if (!window.confirm("Bu randevuyu iptal etmek istediğine emin misin?")) return;
    const { error } = await supabase.rpc("cancel_hoca_appointment", { target_appointment_id: item.id, reason: "Kullanıcı tarafından iptal edildi." });
    if (error) window.alert(error.message.includes("CANCELLATION_WINDOW") ? "Randevuya 2 saatten az kaldığı için uygulamadan iptal edilemez." : "Randevu iptal edilemedi.");
    else await onReload();
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading split">
        <div><span className="eyebrow">PROGRAMIN</span><h2>Randevularım</h2><p>Yaklaşan görüşmelerini ve tamamlanan çalışma geçmişini tek yerde izle.</p></div>
        <button className="secondary-button" onClick={onReminders}><AppIcon name="bell" /> 30 dk önce hatırlat</button>
      </header>
      <div className="appointment-toggle">
        <button className={filter === "upcoming" ? "active" : ""} onClick={() => setFilter("upcoming")}>Yaklaşan</button>
        <button className={filter === "past" ? "active" : ""} onClick={() => setFilter("past")}>Geçmiş</button>
      </div>
      {items.length === 0 ? <EmptyState icon="calendar-smile" title={filter === "upcoming" ? "Yaklaşan randevun yok" : "Henüz geçmiş randevu yok"} text="Uygun olduğunda yeni bir çalışma saati seçebilirsin." /> : (
        <div className="appointment-list">
          {items.map((item) => {
            const asHoca = item.student_id !== userId;
            return (
              <article key={item.id}>
                <time><strong>{new Date(item.scheduled_start).toLocaleDateString("tr-TR", { day: "2-digit", timeZone: "Europe/Istanbul" })}</strong><span>{new Date(item.scheduled_start).toLocaleDateString("tr-TR", { month: "short", timeZone: "Europe/Istanbul" })}</span></time>
                <AvatarImage src={avatar(asHoca ? item.student_name : item.hoca_name, asHoca ? item.student_avatar : item.hoca_photo)} alt="" size={48} />
                <div>
                  <span className={`appointment-status ${item.status}`}>{STATUS_LABELS[item.status]}</span>
                  <h3>{asHoca ? item.student_name : item.hoca_name}</h3>
                  <p>{formatAppointment(item.scheduled_start)} · {Math.round((new Date(item.scheduled_end).getTime() - new Date(item.scheduled_start).getTime()) / 60_000)} dk</p>
                  {item.topic_notes && <blockquote>"{item.topic_notes}"</blockquote>}
                </div>
                <div className="appointment-actions">
                  {["confirmed", "completed"].includes(item.status) && <button onClick={() => setChatAppointment(item)}><AppIcon name="message" /> Mesajlaş</button>}
                  {item.status === "completed" && <button onClick={() => setReviewAppointment(item)}><AppIcon name="notes" /> Ders Notu</button>}
                  {["pending", "confirmed"].includes(item.status) && <button className="danger" onClick={() => void cancel(item)}>İptal et</button>}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {reviewAppointment && <AppointmentReview appointment={reviewAppointment} isHoca={isHoca || reviewAppointment.student_id !== userId} userId={userId} onClose={() => setReviewAppointment(null)} onSaved={() => { setReviewAppointment(null); onNotice("Ders notu kaydedildi."); }} />}
      {chatAppointment && <AppointmentChat appointment={chatAppointment} currentUserId={userId} isHoca={isHoca || chatAppointment.student_id !== userId} onClose={() => setChatAppointment(null)} />}
    </section>
  );
}

function PeerMatching({ helpers, matches, level, userId, realUser, onReload }: { helpers: HelperView[]; matches: PeerView[]; level: QuranLevel | null; userId: string; realUser: boolean; onReload: () => Promise<void> }) {
  const [activeChat, setActiveChat] = useState<PeerView | null>(null);
  const request = async (helper: HelperView) => {
    const message = window.prompt(`${helper.display_name} için kısa bir tanışma notu (isteğe bağlı):`, "Birlikte Kur'an çalışmak isterim.") ?? null;
    if (message === null) return;
    if (!realUser) { window.alert("Eşleşme isteği için gerçek hesabınla giriş yap."); return; }
    const { error } = await supabase.rpc("send_quran_peer_request", { target_helper_id: helper.id, request_message: message });
    if (error) window.alert("İstek gönderilemedi.");
    else await onReload();
  };
  const respond = async (match: PeerView, accept: boolean) => {
    const { error } = await supabase.rpc("respond_quran_peer_match", { target_match_id: match.id, accept_request: accept });
    if (!error) await onReload();
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading"><div><span className="eyebrow">KUR'AN KARDEŞİ</span><h2>Birlikte öğrenmek kolaylaştırır</h2><p>Bu alan yalnızca Kur'an öğrenme desteği içindir. Kişisel bilgilerini paylaşmadan uygulama içinden iletişim kur.</p></div></header>
      {level === "helper" ? (
        <div className="peer-helper-note"><AppIcon name="heart-handshake" /><div><strong>Destek veren olarak görünüyorsun</strong><span>Daha erken aşamadaki kullanıcılar sana eşleşme isteği gönderebilir.</span></div></div>
      ) : (
        <>
          <h3 className="subsection-title">Destek olabilecek kardeşler</h3>
          {helpers.length === 0 ? <EmptyState icon="users-minus" title="Şimdilik uygun destekçi yok" text="Yeni gönüllüler katıldığında burada görünecek." /> : (
            <div className="helper-grid">{helpers.map((helper) => (
              <article key={helper.id}><AvatarImage src={avatar(helper.display_name, helper.avatar_url)} alt="" size={48} /><div><strong>{helper.display_name}</strong><span>Gönüllü akran desteği</span></div><button onClick={() => void request(helper)}>İstek gönder</button></article>
            ))}</div>
          )}
        </>
      )}
      <h3 className="subsection-title">Eşleşmelerim</h3>
      {matches.length === 0 ? <EmptyState icon="message-circle" title="Henüz eşleşmen yok" text="Gönderdiğin ve sana gelen istekler burada görünür." compact /> : (
        <div className="peer-match-list">{matches.map((match) => (
          <article key={match.id}>
            <AvatarImage src={avatar(match.partner_name, match.partner_avatar)} alt="" size={48} />
            <div><strong>{match.partner_name}</strong><span>{match.direction === "received" ? "Sana gönderildi" : "Sen gönderdin"} · {match.status === "pending" ? "Yanıt bekliyor" : match.status === "accepted" ? "Eşleşti" : "Olumsuz"}</span>{match.message && <p>{match.message}</p>}</div>
            {match.direction === "received" && match.status === "pending" ? <span className="peer-actions"><button onClick={() => void respond(match, true)}>Kabul et</button><button onClick={() => void respond(match, false)}>Reddet</button></span> : match.status === "accepted" ? <button onClick={() => setActiveChat(match)}>Mesajlaş</button> : null}
          </article>
        ))}</div>
      )}
      {activeChat && <PeerChat match={activeChat} userId={userId} onClose={() => setActiveChat(null)} />}
    </section>
  );
}

function PeerChat({ match, userId, onClose }: { match: PeerView; userId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    const query = `and(sender_id.eq.${userId},receiver_id.eq.${match.partner_id}),and(sender_id.eq.${match.partner_id},receiver_id.eq.${userId})`;
    void supabase.from("chat_messages").select("*").is("group_id", null).or(query).order("created_at").then(({ data }) => setMessages(data || []));
    const channel = ownedRealtimeChannel(supabase, `quran-peer-${match.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const item = payload.new as ChatMessageRow;
        if ((item.sender_id === userId && item.receiver_id === match.partner_id) || (item.sender_id === match.partner_id && item.receiver_id === userId))
          setMessages((current) => current.some((message) => message.id === item.id) ? current : [...current, item]);
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [match.id, match.partner_id, userId]);
  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");
    await supabase.from("chat_messages").insert({ sender_id: userId, receiver_id: match.partner_id, group_id: null, content, is_read: false });
  };
  return (
    <div className="quran-modal-backdrop">
      <section className="peer-chat-modal" role="dialog" aria-modal="true" aria-label={`${match.partner_name} ile mesajlaşma`}>
        <header><AvatarImage src={avatar(match.partner_name, match.partner_avatar)} size={44} /><div><strong>{match.partner_name}</strong><span>Kur'an çalışma eşleşmesi</span></div><button onClick={onClose}><AppIcon name="x" /></button></header>
        <div className="peer-messages">{messages.length === 0 && <p>Çalışma zamanını belirlemek için ilk mesajı gönderebilirsin.</p>}{messages.map((message) => <article key={message.id} className={message.sender_id === userId ? "mine" : ""}>{message.content}<time>{new Date(message.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</time></article>)}</div>
        <form onSubmit={(event) => void send(event)}><input value={text} onChange={(event) => setText(event.target.value)} maxLength={1000} placeholder="Mesajını yaz…" /><button aria-label="Mesaj gönder"><AppIcon name="send" /></button></form>
      </section>
    </div>
  );
}

function StudyWorkspace({ goal, notes, appointments, userId, realUser, onNavigate, onSaved, streak, weeklySummary }: { goal: QuranStudyGoalRow | null; notes: ReturnType<typeof useJourneyStore.getState>["quranNotes"]; appointments: AppointmentView[]; userId: string; realUser: boolean; onNavigate: (view: string) => void; onSaved: () => Promise<void>; streak: QuranStreak; weeklySummary: WeeklySummary }) {
  const [title, setTitle] = useState(goal?.title || "");
  const [progress, setProgress] = useState(goal?.progress_percent || 0);
  const related = appointments.filter((item) => item.student_id === userId && item.topic_notes).slice(0, 4);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!realUser) return;
    const payload = { id: goal?.id || crypto.randomUUID(), user_id: userId, title: title.trim(), progress_percent: progress };
    const { error } = await supabase.from("quran_study_goals").upsert(payload, { onConflict: "user_id" });
    if (!error) await onSaved();
  };
  return (
    <section className="study-workspace">
      <div className="qc-study-overview">
        <article className="qc-study-stat"><AppIcon name="flame" /><div><strong>{streak.current} gün</strong><span>Aktif seri</span></div></article>
        <article className="qc-study-stat"><AppIcon name="book-2" /><div><strong>{weeklySummary.totalAyahs}</strong><span>Bu hafta ayet</span></div></article>
        <article className="qc-study-stat"><AppIcon name="clock" /><div><strong>{weeklySummary.totalMinutes} dk</strong><span>Çalışma süresi</span></div></article>
        <article className="qc-study-stat"><AppIcon name="sparkles" /><div><strong>{weeklySummary.xhEarned} XH</strong><span>Kazanılan</span></div></article>
      </div>
      <article className="study-goal-card">
        <header><span><AppIcon name="target-arrow" /></span><div><small>ÇALIŞMA HEDEFİ</small><h2>İstikrarlı bir adım belirle</h2></div></header>
        <form onSubmit={(event) => void save(event)}>
          <label><span>Hedefin</span><textarea required minLength={3} maxLength={240} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Haftada üç kez tecvid pratiği yapmak…" /></label>
          <label className="goal-range"><span><b>İlerleme</b><strong>%{progress}</strong></span><input type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} /></label>
          <button className="primary-button" disabled={!realUser}><AppIcon name="device-floppy" /> Hedefi kaydet</button>
        </form>
      </article>
      <article className="study-notes-card">
        <header><div><small>KUR'AN NOTLARIN</small><h2>Son notların</h2></div><button onClick={() => onNavigate("quran")}>Tümünü aç <AppIcon name="arrow-right" /></button></header>
        {notes.length === 0 ? <EmptyState icon="book-off" title="Henüz Kur'an notun yok" text="Bugünün Çarkı veya not arşivinden ilk notunu ekleyebilirsin." compact /> : (
          <div>{notes.slice(0, 4).map((note) => <button key={note.id} onClick={() => onNavigate("quran")}><span><AppIcon name="book-2" /></span><div><strong>{note.ayet || note.sure}</strong><p>{note.ders || note.tefsir}</p><small>{new Date(`${note.date}T12:00:00`).toLocaleDateString("tr-TR")}</small></div></button>)}</div>
        )}
      </article>
      <article className="study-reflection-card">
        <span className="eyebrow">BU HAFTA NE ÇALIŞTIM?</span>
        <h2>Görüşme konularından izler</h2>
        {related.length === 0 ? <p>İlk hoca görüşmenden sonra çalışma başlıkların burada kısa bir hazırlık ve değerlendirme listesine dönüşecek.</p> : (
          <ul>{related.map((item) => <li key={item.id}><AppIcon name="circle-check" /><span><strong>{item.topic_notes}</strong><small>{item.hoca_name} · {formatAppointment(item.scheduled_start)}</small></span></li>)}</ul>
        )}
      </article>
    </section>
  );
}

function HocaManagement({ teachers, ownedHoca, appointments, isAdmin, onReload }: { teachers: HocaProfileRow[]; ownedHoca?: HocaProfileRow; appointments: AppointmentView[]; isAdmin: boolean; onReload: () => Promise<void> }) {
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [managedId, setManagedId] = useState(ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : ""));
  const effectiveManagedId = managedId || ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : "");
  const managed = teachers.find((item) => item.id === effectiveManagedId);
  const [availability, setAvailability] = useState<HocaAvailabilityRow[]>([]);
  const [timeOff, setTimeOff] = useState<HocaTimeOffRow[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; display_name: string; email: string; avatar_url: string | null; role: "user" | "admin" | "hoca" }>>([]);
  const loadSchedule = async () => {
    if (!effectiveManagedId) return;
    const [a, t] = await Promise.all([
      supabase.from("hoca_availability").select("*").eq("hoca_id", effectiveManagedId).order("day_of_week"),
      supabase.from("hoca_time_off").select("*").eq("hoca_id", effectiveManagedId).order("start_datetime"),
    ]);
    setAvailability(a.data || []); setTimeOff(t.data || []);
  };
  useEffect(() => { const timer = window.setTimeout(() => { void loadSchedule(); }, 0); return () => window.clearTimeout(timer); }, [effectiveManagedId]); // eslint-disable-line react-hooks/exhaustive-deps
  const searchUsers = async (event: React.FormEvent) => { event.preventDefault(); const { data } = await supabase.rpc("admin_search_quran_users", { search_text: search }); setUsers(data || []); };
  const setRole = async (id: string, role: "user" | "hoca") => { const { error } = await supabase.rpc("admin_set_quran_role", { target_user_id: id, next_role: role }); if (!error) { const { data } = await supabase.rpc("admin_search_quran_users", { search_text: search }); setUsers(data || []); await onReload(); } };
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!managed) return;
    const fd = new FormData(event.currentTarget);
    await supabase.from("hoca_profiles").update({ display_name: String(fd.get("name")), title: String(fd.get("title")), bio: String(fd.get("bio")), specialties: String(fd.get("specialties")).split(",").map((item) => item.trim()).filter(Boolean), photo_url: String(fd.get("photo")) || null, is_active: fd.get("active") === "on" }).eq("id", managed.id);
    await onReload();
  };
  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!managed) return;
    const fd = new FormData(event.currentTarget);
    setScheduleError(""); setScheduleNotice("");
    const start = String(fd.get("start")); const end = String(fd.get("end"));
    if (start >= end) { setScheduleError("Bitiş saati başlangıç saatinden sonra olmalı."); return; }
    const { error: availabilityError } = await supabase.from("hoca_availability").insert({ hoca_id: managed.id, day_of_week: Number(fd.get("day")), start_time: start, end_time: end, slot_duration_minutes: Number(fd.get("duration")), is_recurring: true, specific_date: null });
    if (availabilityError) { setScheduleError("Müsaitlik kaydedilemedi."); return; }
    event.currentTarget.reset(); await loadSchedule(); setScheduleNotice("Müsaitlik takvime eklendi.");
  };
  const addTimeOff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!managed) return;
    const fd = new FormData(event.currentTarget);
    await supabase.from("hoca_time_off").insert({ hoca_id: managed.id, start_datetime: new Date(String(fd.get("start"))).toISOString(), end_datetime: new Date(String(fd.get("end"))).toISOString(), reason: String(fd.get("reason")) });
    event.currentTarget.reset(); await loadSchedule();
  };
  const updateStatus = async (id: string, status: "completed" | "no_show") => { await supabase.from("appointments").update({ status }).eq("id", id); await onReload(); };
  return (
    <section className="quran-management">
      <header className="quran-panel-heading"><div><span className="eyebrow">YETKİLİ ALAN</span><h2>Hoca ve takvim yönetimi</h2><p>Profil, haftalık müsaitlik, izin dönemleri ve görüşme durumlarını güvenle yönet.</p></div>{isAdmin && <select value={managedId} onChange={(event) => setManagedId(event.target.value)}>{teachers.map((item) => <option key={item.id} value={item.id}>{item.display_name}</option>)}</select>}</header>
      {isAdmin && (
        <article className="admin-role-card">
          <header><span><AppIcon name="shield-check" /></span><div><small>YALNIZCA YÖNETİCİ</small><h3>Hoca yetkisi ata</h3></div></header>
          <form onSubmit={(event) => void searchUsers(event)}><input value={search} onChange={(event) => setSearch(event.target.value)} minLength={2} placeholder="Ad veya e-posta ile ara" /><button>Ara</button></form>
          {users.map((item) => <div className="admin-user-row" key={item.id}><AvatarImage src={avatar(item.display_name, item.avatar_url)} size={42} /><span><strong>{item.display_name}</strong><small>{item.email} · {item.role}</small></span>{item.role !== "admin" && <button onClick={() => void setRole(item.id, item.role === "hoca" ? "user" : "hoca")}>{item.role === "hoca" ? "Yetkiyi kaldır" : "Hoca yap"}</button>}</div>)}
        </article>
      )}
      {managed ? (
        <div className="management-grid">
          <form className="manage-profile-card" onSubmit={(event) => void saveProfile(event)}>
            <h3>Hoca profili</h3>
            <label>Görünen ad<input name="name" defaultValue={managed.display_name} required /></label>
            <label>Unvan<input name="title" defaultValue={managed.title} required /></label>
            <label>Kısa biyografi<textarea name="bio" defaultValue={managed.bio} rows={4} /></label>
            <label>Uzmanlıklar<input name="specialties" defaultValue={managed.specialties.join(", ")} /></label>
            <label>Fotoğraf URL'si<input name="photo" defaultValue={managed.photo_url || ""} /></label>
            <label className="check-field"><input type="checkbox" name="active" defaultChecked={managed.is_active} /> Aktif profilde göster</label>
            <button className="primary-button">Profili kaydet</button>
          </form>
          <section className="manage-availability-card">
            <h3>Haftalık müsaitlik</h3>
            <form onSubmit={(event) => void addAvailability(event)}><select name="day">{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select><input name="start" type="time" defaultValue="18:00" required /><input name="end" type="time" defaultValue="20:00" required /><select name="duration" defaultValue="30"><option value="20">20 dk</option><option value="30">30 dk</option><option value="40">40 dk</option><option value="45">45 dk</option><option value="60">60 dk</option><option value="90">90 dk</option></select><button><AppIcon name="plus" /> Ekle</button></form>
            {scheduleNotice && <p className="manage-success" role="status"><AppIcon name="circle-check" /> {scheduleNotice}</p>}
            {scheduleError && <p className="booking-error" role="alert">{scheduleError}</p>}
            <div className="availability-list">{availability.map((item) => <article key={item.id}><strong>{DAYS[item.day_of_week]}</strong><span>{item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} · {item.slot_duration_minutes} dk</span><button onClick={async () => { await supabase.from("hoca_availability").delete().eq("id", item.id); await loadSchedule(); }}><AppIcon name="trash" /></button></article>)}</div>
          </section>
          <section className="manage-timeoff-card">
            <h3>İzin / kapalı zaman</h3>
            <form onSubmit={(event) => void addTimeOff(event)}><input name="start" type="datetime-local" required /><input name="end" type="datetime-local" required /><input name="reason" placeholder="Kısa açıklama (isteğe bağlı)" /><button><AppIcon name="plus" /> Engelle</button></form>
            {timeOff.map((item) => <article key={item.id}><span><strong>{formatAppointment(item.start_datetime)}</strong><small>{item.reason || "Müsait değil"}</small></span><button onClick={async () => { await supabase.from("hoca_time_off").delete().eq("id", item.id); await loadSchedule(); }}><AppIcon name="trash" /></button></article>)}
          </section>
          <section className="manage-appointments-card">
            <h3>Yaklaşan öğrenciler</h3>
            {appointments.filter((item) => item.hoca_id === managed.id && ["pending", "confirmed"].includes(item.status)).map((item) => (
              <article key={item.id}><AvatarImage src={avatar(item.student_name, item.student_avatar)} alt="" size={42} /><span><strong>{item.student_name}</strong><small>{formatAppointment(item.scheduled_start)} · {item.topic_notes || "Konu belirtilmedi"}</small></span><div><button onClick={() => void updateStatus(item.id, "completed")}>Tamamlandı</button><button onClick={() => void updateStatus(item.id, "no_show")}>Gelmedi</button></div></article>
            ))}
          </section>
        </div>
      ) : <EmptyState icon="user-off" title="Yönetilecek hoca profili yok" text="Yönetici bir kullanıcıya hoca rolü atadığında profil burada oluşur." />}
    </section>
  );
}

function EmptyState({ icon, title, text, compact = false }: { icon: string; title: string; text: string; compact?: boolean }) {
  return (
    <div className={`quran-empty ${compact ? "compact" : ""}`}>
      <span><AppIcon name={icon} /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function CompanionSkeleton() {
  return (
    <div className="quran-companion-skeleton" aria-label="Kur'an Kardeşim yükleniyor">
      <i /><i /><i />
    </div>
  );
}
