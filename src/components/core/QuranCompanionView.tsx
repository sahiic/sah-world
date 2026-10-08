"use client";
import { useSearchParams } from "next/navigation";
import { QURAN_TABS, openAppView, selectedValue } from "@/lib/appLocation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
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
  getDemoSpacedItems,
  type SurahProgress,
  type SurahStatus,
  type QuranStreak,
  type SpacedRepetitionItem,
  type QuranExerciseResult,
} from "@/lib/quranSurahs";
import { HASANAT_REWARDS } from "@/lib/quranExercises";
import {
  emptyProgress,
  emptyStreak,
  quranToday,
  nextStreak,
  summarizePractice,
  earnedBadges,
} from "@/lib/quranLearning";
import QuranDashboard from "@/components/quran/QuranDashboard";
import QuranExercises from "@/components/quran/QuranExercises";
import QuranProgressMap from "@/components/quran/QuranProgressMap";
import QuranStudyWorkspace from "@/components/quran/QuranStudyWorkspace";
import QuranAchievements from "@/components/quran/QuranAchievements";
import QuranModal from "@/components/quran/QuranModal";
import QuranTeacherProfile from "@/components/quran/QuranTeacherProfile";
import QuranTeacherFeedback from "@/components/quran/QuranTeacherFeedback";
import QuranChat from "@/components/quran/QuranChat";
import QuranStudyGroup from "@/components/quran/QuranStudyGroup";
import {
  useQuranPresence,
  type QuranPresenceState,
} from "@/components/quran/useQuranPresence";
import {
  appointmentCalendar,
  istanbulDay,
  quranUnreadCounts,
  quranWeek,
} from "@/lib/quranSocial";
import { useQuranSession } from "@/store/useQuranSession";
import type {
  AppointmentRow,
  QuranThreadSummary,
  HocaAvailabilityRow,
  HocaProfileRow,
  HocaTimeOffRow,
  QuranLevel,
  QuranPeerMatchRow,
  QuranStudyGoalRow,
} from "@/types/database";
import DailyWisdomWheel, { type WisdomEntry } from "./DailyWisdomWheel";
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
  | "achievements"
  | "wheel"
  | "manage";
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
      scheduled_end: new Date(
        upcomingStart.getTime() + 30 * 60_000,
      ).toISOString(),
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
      scheduled_end: new Date(
        completedStart.getTime() + 30 * 60_000,
      ).toISOString(),
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
  {
    value: "beginner",
    title: "Yeni başlıyorum",
    detail: "Harfleri ve temel okumayı öğrenmek istiyorum.",
    icon: "seedling",
  },
  {
    value: "alphabet",
    title: "Elifba biliyorum",
    detail: "Okuyorum fakat henüz akıcı değilim.",
    icon: "book",
  },
  {
    value: "fluent",
    title: "Akıcı okuyorum",
    detail: "Tecvidimi ve mahrecimi geliştirmek istiyorum.",
    icon: "book-2",
  },
  {
    value: "helper",
    title: "Destek olabilirim",
    detail: "İyi seviyedeyim, bir kardeşime yardımcı olmak isterim.",
    icon: "heart-handshake",
  },
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
      if (
        host === "api.dicebear.com" ||
        host === "lh3.googleusercontent.com" ||
        host.endsWith(".supabase.co")
      )
        return url;
    } catch {
      /* fallback */
    }
  }
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
};
const formatAppointment = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
const timeOnly = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));

export default function QuranCompanionView({
  onNavigate,
}: {
  onNavigate: (view: string) => void;
  wheelEntry?: WisdomEntry;
}) {
  const { user, profile, patchProfile } = useAuthStore();
  const journey = useJourneyStore();
  const searchParams = useSearchParams();
  const requestedTab = selectedValue(
    searchParams.get("tab"),
    QURAN_TABS,
    "home",
  );
  const pilotDemo = searchParams.get("pilot") === "demo";
  const tab =
    requestedTab === "manage" &&
    profile?.role !== "hoca" &&
    profile?.role !== "admin"
      ? "home"
      : requestedTab;
  const setTab = (next: CompanionTab) => openAppView("quran-companion", next);
  const reducedMotion = useReducedMotion();
  const [teachers, setTeachers] = useState<HocaProfileRow[]>([]);
  const [appointments, setAppointments] = useState<AppointmentView[]>([]);
  const [goal, setGoal] = useState<QuranStudyGoalRow | null>(null);
  const [helpers, setHelpers] = useState<HelperView[]>([]);
  const [matches, setMatches] = useState<PeerView[]>([]);
  const [loading, setLoading] = useState(true);
  const [bgLoading, setBgLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const isRealUser = Boolean(user && isValidUUID(user.id) && !pilotDemo);
  const userId = user?.id || "";
  const isAdmin = profile?.role === "admin";
  const isHoca = profile?.role === "hoca";

  const guest = useQuranSession();
  const [surahProgress, setSurahProgress] =
    useState<SurahProgress[]>(emptyProgress);
  const [streak, setStreak] = useState<QuranStreak>(emptyStreak);
  const [spacedItems, setSpacedItems] = useState<SpacedRepetitionItem[]>([]);
  const [totalHasanat, setTotalHasanat] = useState(0);
  const [recentExercises, setRecentExercises] = useState<QuranExerciseResult[]>(
    [],
  );
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const weeklySummary = summarizePractice(recentExercises);
  const loadVersion = useRef(0);
  const loadedIdentity = useRef("");
  const recording = useRef(new Set<string>());
  const persistedResults = useRef(new Set<string>());
  const tabsRef = useRef<HTMLElement>(null);
  const [schemaReady, setSchemaReady] = useState(false);
  const [threads, setThreads] = useState<QuranThreadSummary[]>([]);
  const [socialError, setSocialError] = useState("");
  const [sharePresence, setSharePresence] = useState(false);
  const presence = useQuranPresence(
    [
      ...matches.filter((m) => m.status === "accepted").map((m) => m.id),
      ...appointments
        .filter((a) => !["cancelled", "no_show"].includes(a.status))
        .slice(0, 20)
        .map((a) => a.id),
    ],
    userId,
    isRealUser && sharePresence,
  );
  const unreadCounts = quranUnreadCounts(threads);
  const loadLatest = useRef<(quiet?: boolean) => Promise<void>>(async () => {}),
    flashLatest = useRef<(message: string) => void>(() => {});
  const appointmentLatest = useRef(appointments);
  const threadVersion = useRef(0);
  const refreshThreads = useCallback(async () => {
    if (!isRealUser) return;
    const version = ++threadVersion.current;
    const { data, error: e } = await supabase.rpc("get_quran_thread_summaries");
    // Guard account changes without keeping any other account's private state.
    if (
      version !== threadVersion.current ||
      useAuthStore.getState().user?.id !== userId
    )
      return;
    if (e) {
      setSocialError(
        "Sohbet ve bildirim altyapısı henüz hazır değil. Eski kayıtların korunuyor.",
      );
      return;
    }
    setThreads(data ?? []);
    setSocialError("");
  }, [isRealUser, userId]);
  useEffect(() => {
    if (!isRealUser) return;
    let active = true;
    const initial = window.setTimeout(() => void refreshThreads(), 0);
    let reloadTimer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      if (!active) return;
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => {
        void refreshThreads();
        void loadLatest.current(true);
      }, 250);
    };
    const channel = ownedRealtimeChannel(supabase, `quran-social-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${userId}`,
        },
        () => void refreshThreads(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => void refreshThreads(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quran_peer_matches",
          filter: `helper_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as QuranPeerMatchRow;
          if (m.status === "pending") {
            flashLatest.current("Yeni bir Kur'an kardeşliği isteği aldın.");
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            )
              new Notification("Kur'an Kardeşim", {
                body: "Yeni bir eşleşme isteğin var.",
                icon: "/favicon.ico",
              });
          }
          refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "quran_peer_matches",
          filter: `requester_id=eq.${userId}`,
        },
        (payload) => {
          const m = payload.new as QuranPeerMatchRow;
          if (m.status === "accepted")
            flashLatest.current("Kur'an kardeşliği isteğin kabul edildi.");
          refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "appointments" },
        (payload) => {
          const a = payload.new as AppointmentRow,
            old = appointmentLatest.current.find((x) => x.id === a.id);
          if (!old && a.student_id !== userId) return;
          if (old && old.status !== a.status)
            flashLatest.current(`Randevun: ${STATUS_LABELS[a.status]}.`);
          refresh();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quran_study_room_members",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refresh();
          flashLatest.current("Çalışma odası davetlerin güncellendi.");
        },
      )
      .subscribe();
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", refresh);
    const fallback = window.setInterval(visible, 30000);
    return () => {
      active = false;
      // Invalidate pending requests on account/mode change or unmount.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      threadVersion.current++;
      clearTimeout(initial);
      if (reloadTimer) clearTimeout(reloadTimer);
      clearInterval(fallback);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("online", refresh);
      void supabase.removeChannel(channel);
    };
  }, [isRealUser, userId, refreshThreads]);

  const flash = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  };
  const load = async (quiet = false) => {
    const version = ++loadVersion.current;
    const identity = pilotDemo ? "pilot" : isRealUser ? userId : "guest";
    if (loadedIdentity.current !== identity) {
      loadedIdentity.current = identity;
      setSurahProgress(emptyProgress());
      setStreak(emptyStreak());
      setRecentExercises([]);
      setTotalHasanat(0);
      setSpacedItems([]);
      setGoal(null);
      setHelpers([]);
      setMatches([]);
      setTeachers([]);
      setAppointments([]);
      setNewBadges([]);
      setSchemaReady(false);
      setThreads([]);
      setSocialError("");
      setSharePresence(false);
      persistedResults.current.clear();
    }
    if (pilotDemo || !isRealUser) {
      setTeachers([SAMPLE_HOCA]);
      setGoal(guest.goal);
      setAppointments(
        pilotDemo ? sampleAppointments(userId || "demo-student") : [],
      );
      setSurahProgress(pilotDemo ? getDemoSurahProgress() : guest.progress);
      setStreak(pilotDemo ? getDemoStreak() : guest.streak);
      setSpacedItems(pilotDemo ? getDemoSpacedItems() : guest.reviews);
      setRecentExercises(guest.results);
      setTotalHasanat(guest.hasanat);
      setSchemaReady(false);
      setError("");
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    try {
      // Phase 1: critical data for dashboard
      const [
        teacherResult,
        appointmentResult,
        goalResult,
        streakResult,
        hasanatResult,
      ] = await Promise.all([
        supabase.from("hoca_profiles").select("*").order("created_at"),
        supabase.rpc("get_my_quran_appointments"),
        supabase
          .from("quran_study_goals")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase
          .from("quran_streaks")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle(),
        supabase.rpc("get_my_hasanat_total"),
      ]);
      if (version !== loadVersion.current) return;
      setTeachers(teacherResult.data || []);
      setAppointments(appointmentResult.data || []);
      setGoal(goalResult.data || null);
      if (streakResult.data) {
        setStreak({
          current: streakResult.data.current_streak,
          longest: streakResult.data.longest_streak,
          lastDate: streakResult.data.last_activity_date || "",
          totalDays: streakResult.data.total_days,
          freezeAvailable: streakResult.data.streak_freeze_available,
        });
      } else if (!streakResult.error) {
        setStreak(emptyStreak());
      }
      if (hasanatResult.data != null)
        setTotalHasanat(Number(hasanatResult.data));
      const criticalError =
        teacherResult.error ||
        appointmentResult.error ||
        goalResult.error ||
        streakResult.error ||
        hasanatResult.error;
      if (criticalError)
        setError(
          "Bazı veriler yüklenemedi. Kayıt altyapısı hazır olmadan sonuçlar kaydedilmiş sayılmaz. Lütfen tekrar dene.",
        );
      else setError("");
      setLoading(false);

      // Phase 2: background data for secondary tabs
      if (!quiet) setBgLoading(true);
      const [
        helperResult,
        matchResult,
        progressResult,
        exerciseResult,
        reviewResult,
      ] = await Promise.all([
        supabase.rpc("browse_quran_helpers"),
        supabase.rpc("get_my_quran_peer_matches"),
        supabase
          .from("quran_surah_progress")
          .select("*")
          .eq("user_id", user!.id),
        supabase
          .from("quran_exercise_results")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("quran_review_schedule")
          .select("*")
          .eq("user_id", user!.id),
      ]);
      if (version !== loadVersion.current) return;
      setHelpers(helperResult.data || []);
      setMatches(matchResult.data || []);
      if (!progressResult.error) {
        const dbProgress: SurahProgress[] = SURAHS.map((s) => {
          const row = progressResult.data?.find((r) => r.surah_id === s.id);
          if (!row)
            return {
              surahId: s.id,
              readStatus: "none" as const,
              memorizeStatus: "none" as const,
              lastStudyDate: null,
              difficultAyahs: [],
              completedAyahs: 0,
              totalErrors: 0,
            };
          return {
            surahId: s.id,
            readStatus: row.read_status as SurahStatus,
            memorizeStatus:
              row.memorize_status as SurahProgress["memorizeStatus"],
            lastStudyDate: row.last_study_date,
            difficultAyahs: row.difficult_ayahs || [],
            completedAyahs: row.completed_ayahs,
            totalErrors: row.total_errors,
          };
        });
        setSurahProgress(dbProgress);
      }
      if (exerciseResult.data)
        setRecentExercises(
          exerciseResult.data.map((r) => ({
            id: r.id,
            type: r.exercise_type,
            surahId: r.surah_id ?? 0,
            score: r.score,
            totalQuestions: r.total_questions,
            completedAt: r.created_at,
            timeSpentSeconds: r.time_spent_seconds,
            answers: Array.isArray(r.answers)
              ? (r.answers as NonNullable<QuranExerciseResult["answers"]>)
              : [],
          })),
        );
      if (reviewResult.data)
        setSpacedItems(
          reviewResult.data.map((r) => ({
            id: r.id,
            surahId: r.surah_id,
            startAyah: r.start_ayah,
            endAyah: r.end_ayah,
            nextReviewDate: r.next_review_date,
            intervalIndex: r.interval_index,
            easeFactor: 2.5,
            reviewCount: r.review_count,
            lastReviewDate: r.last_review_date ?? "",
          })),
        );
      setSchemaReady(
        !progressResult.error &&
          !exerciseResult.error &&
          !reviewResult.error,
      );
      const bgError =
        helperResult.error ||
        matchResult.error ||
        progressResult.error ||
        exerciseResult.error ||
        reviewResult.error;
      if (bgError && !criticalError)
        setError(
          "Bazı veriler yüklenemedi. Kayıt altyapısı hazır olmadan sonuçlar kaydedilmiş sayılmaz. Lütfen tekrar dene.",
        );
      setBgLoading(false);
    } catch {
      if (version === loadVersion.current) {
        setError("Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.");
        setLoading(false);
        setBgLoading(false);
      }
    }
  };

  useEffect(() => {
    loadLatest.current = load;
    flashLatest.current = flash;
    appointmentLatest.current = appointments;
  });
  useEffect(() => {
    const active = tabsRef.current?.querySelector<HTMLElement>("[aria-selected=\"true\"]");
    active?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [tab]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => {
      window.clearTimeout(timer);
      // Invalidate in-flight responses on unmount/account change, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      loadVersion.current++;
    };
  }, [user?.id, pilotDemo]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      !isRealUser ||
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    const check = () =>
      appointments
        .filter(
          (item) => item.student_id === userId && item.status === "confirmed",
        )
        .forEach((item) => {
          const minutes =
            (new Date(item.scheduled_start).getTime() - Date.now()) / 60_000;
          const key = `sah-quran-appointment-reminder-${item.id}`;
          if (
            minutes > 0 &&
            minutes <= 30 &&
            !window.localStorage.getItem(key)
          ) {
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
    .filter(
      (item) =>
        ["pending", "confirmed"].includes(item.status) &&
        new Date(item.scheduled_end).getTime() > renderTime,
    )
    .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  const ownedHoca = teachers.find((item) => item.user_id === user?.id);

  const saveLevel = async (level: QuranLevel) => {
    if (!isRealUser) {
      if (!pilotDemo) patchProfile({ quran_level: level });
      flash("Deneme görünümünde seviye seçildi; sunucuya yazılmadı.");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ quran_level: level })
      .eq("id", user!.id);
    if (updateError) {
      setError("Seviyen kaydedilemedi.");
      return;
    }
    patchProfile({ quran_level: level });
    flash("Kur'an okuma seviyen kaydedildi.");
    await load();
  };

  const enableReminders = async () => {
    if (typeof Notification === "undefined") {
      setError("Bu tarayıcı bildirimleri desteklemiyor.");
      return;
    }
    if (Notification.permission === "granted") {
      flash("Bildirimler zaten açık.");
      return;
    }
    if (Notification.permission === "denied") {
      flash("Bildirimler engellendi. Tarayıcı ayarlarından izin verebilirsin.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      flash("Randevu hatırlatmaları açıldı.");
      new Notification("Kur'an Kardeşim", {
        body: "Bildirimlerin açıldı. Randevuların yaklaştığında seni uyaracağız.",
        icon: "/favicon.ico",
      });
    } else {
      flash("Bildirim izni verilmedi.");
    }
  };

  const saveProgressToDb = useCallback(
    async (progress: SurahProgress[]) => {
      if (pilotDemo) {
        flash("Örnek görünümdeki ilerleme sunucuya kaydedilmez.");
        throw new Error("DEMO_READ_ONLY");
      }
      if (!isRealUser || !user) {
        setSurahProgress(progress);
        guest.patch({ progress });
        return;
      }
      if (!schemaReady) {
        setError("İlerleme kaydı için veritabanı kurulumu tamamlanmalı.");
        throw new Error("SCHEMA_REQUIRED");
      }
      const changed = progress.filter(
        (p) =>
          JSON.stringify(p) !==
          JSON.stringify(
            surahProgress.find((old) => old.surahId === p.surahId),
          ),
      );
      const rows = changed.map((p) => ({
        user_id: user.id,
        surah_id: p.surahId,
        read_status: p.readStatus,
        memorize_status: p.memorizeStatus,
        completed_ayahs: p.completedAyahs,
        total_errors: p.totalErrors,
        difficult_ayahs: p.difficultAyahs,
        last_study_date: p.lastStudyDate,
      }));
      if (rows.length > 0) {
        const { error } = await supabase
          .from("quran_surah_progress")
          .upsert(rows, { onConflict: "user_id,surah_id" });
        if (error) {
          setError("İlerleme kaydedilemedi. Önceki kaydın korundu.");
          throw error;
        }
      }
      setSurahProgress(progress);
    },
    [isRealUser, user, pilotDemo, guest, schemaReady, surahProgress],
  );

  const recordExercise = async (result: QuranExerciseResult) => {
    if (persistedResults.current.has(result.id)) return;
    if (recording.current.has(result.id)) throw new Error("SAVING");
    recording.current.add(result.id);
    try {
      const before = new Set(
        earnedBadges(surahProgress, streak, recentExercises, totalHasanat).map(
          (b) => b.id,
        ),
      );
      if (isRealUser) {
        if (!schemaReady) throw new Error("SCHEMA_REQUIRED");
        const { data, error } = await supabase.rpc("submit_quran_practice", {
          session_id: result.id,
          practice_type: result.type,
          practice_score: result.score,
          question_count: result.totalQuestions,
          elapsed_seconds: result.timeSpentSeconds,
          practice_answers: result.answers ?? [],
        });
        if (error) throw error;
        persistedResults.current.add(result.id);
        await load(true);
        const newEarned = earnedBadges(
          surahProgress,
          nextStreak(streak),
          [result, ...recentExercises],
          totalHasanat + (data?.reward ?? 0),
        )
          .filter((b) => !before.has(b.id))
          .map((b) => b.id);
        if (!data?.replayed) setNewBadges(newEarned);
        return;
      }
      const reward =
        result.score === result.totalQuestions
          ? HASANAT_REWARDS.exercise_perfect
          : HASANAT_REWARDS.exercise_complete;
      const results = [result, ...recentExercises],
        next = nextStreak(streak),
        hasanat = totalHasanat + reward;
      const reviews = [...spacedItems];
      for (const a of result.answers ?? []) {
        if (
          !a.correct &&
          a.surahId > 0 &&
          !reviews.some(
            (item) => item.surahId === a.surahId && item.startAyah === a.ayah,
          )
        ) {
          reviews.push({
            id: crypto.randomUUID(),
            surahId: a.surahId,
            startAyah: a.ayah,
            endAyah: a.ayah,
            nextReviewDate: quranToday(),
            intervalIndex: 0,
            easeFactor: 2.5,
            reviewCount: 0,
            lastReviewDate: "",
          });
        }
      }
      setRecentExercises(results);
      setStreak(next);
      setTotalHasanat(hasanat);
      setSpacedItems(reviews);
      if (!pilotDemo) guest.patch({ results, streak: next, hasanat, reviews });
      persistedResults.current.add(result.id);
      setNewBadges(
        earnedBadges(surahProgress, next, results, hasanat)
          .filter((b) => !before.has(b.id))
          .map((b) => b.id),
      );
      flash(
        pilotDemo
          ? "Örnek alıştırma tamamlandı; gerçek hesabına yazılmadı."
          : "Deneme sonucu yalnızca bu oturumda tutuluyor.",
      );
    } finally {
      recording.current.delete(result.id);
    }
  };
  const saveReview = async (item: SpacedRepetitionItem) => {
    if (isRealUser) {
      const { error } = await supabase
        .from("quran_review_schedule")
        .update({
          next_review_date: item.nextReviewDate,
          interval_index: item.intervalIndex,
          review_count: item.reviewCount,
          last_review_date: item.lastReviewDate,
        })
        .eq("id", item.id)
        .eq("user_id", userId);
      if (error) throw error;
    }
    const reviews = spacedItems.map((old) => (old.id === item.id ? item : old));
    setSpacedItems(reviews);
    if (!isRealUser && !pilotDemo) guest.patch({ reviews });
  };
  const todaysReviews = spacedItems.filter(
    (item) => item.nextReviewDate <= quranToday(),
  );

  const navItems: Array<{
    id: CompanionTab;
    label: string;
    icon: string;
    badge?: number;
  }> = [
    { id: "home", label: "Ana Sayfa", icon: "home-heart" },
    { id: "progress", label: "İlerleme Haritası", icon: "map-2" },
    { id: "exercises", label: "Alıştırmalar", icon: "brain" },
    { id: "teachers", label: "Hocalar", icon: "calendar-user" },
    {
      id: "appointments",
      label: "Randevularım",
      icon: "calendar-check",
      badge: unreadCounts.appointments || undefined,
    },
    {
      id: "peers",
      label: "Kur'an Kardeşi",
      icon: "heart-handshake",
      badge:
        unreadCounts.peers +
          matches.filter(
            (m) => m.direction === "received" && m.status === "pending",
          ).length || undefined,
    },
    { id: "study", label: "Çalışma Alanım", icon: "notebook" },
    { id: "achievements", label: "Başarımlarım", icon: "award" },
    ...(isHoca || isAdmin
      ? [{ id: "manage" as const, label: "Hoca yönetimi", icon: "settings" }]
      : []),
  ];

  return (
    <div
      className="quran-companion qc-v2 qc-ready"
      data-quran-ready="learning-v3"
    >
      {notice && (
        <div className="quran-toast" role="status">
          <AppIcon name="circle-check" /> {notice}
        </div>
      )}

      {tab !== "home" && (
        <header className="page-heading">
          <div>
            <span className="eyebrow">KUR’AN-I KERİM KARDEŞİM</span>
            <h1>
              {tab === "wheel"
                ? "Ayet ve hadis notlarım"
                : navItems.find((item) => item.id === tab)?.label}
            </h1>
          </div>
        </header>
      )}

      <nav
        ref={tabsRef}
        className="quran-companion-tabs"
        role="tablist"
        aria-label="Kur'an Kardeşim alanları"
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            role="tab"
            className={tab === item.id ? "active" : ""}
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            <AppIcon name={item.icon} />
            <span>{item.label}</span>
            {item.badge && item.badge > 0 && (
              <em
                className="qc-nav-badge"
                aria-label={`${item.badge} okunmamış mesaj veya bekleyen istek`}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </em>
            )}
          </button>
        ))}
      </nav>
      {isRealUser && ["teachers", "appointments", "peers"].includes(tab) && (
        <label className="qc-presence-preference">
          <input
            type="checkbox"
            checked={sharePresence}
            onChange={(e) => setSharePresence(e.target.checked)}
          />
          Çevrimiçi durumumu yalnızca eşleştiğim kişiler ve ders
          katılımcılarıyla paylaş
        </label>
      )}
      {socialError && ["appointments", "peers"].includes(tab) && (
        <p className="quran-inline-error" role="alert">
          {socialError}
        </p>
      )}
      {tab === "home" && !loading && (
        <QuranDashboard
          progress={surahProgress}
          streak={streak}
          summary={weeklySummary}
          hasanat={totalHasanat}
          reviews={todaysReviews.length}
          teacher={teachers.find((t) => t.is_active)}
          nextAppointment={upcoming[0]}
          onOpen={setTab}
          demo={pilotDemo}
        />
      )}

      {tab === "home" && !loading && isRealUser && !profile?.quran_level && (
        <LevelOnboarding onSelect={(level) => void saveLevel(level)} />
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
          role="tabpanel"
          aria-label={navItems.find((item) => item.id === tab)?.label ?? tab}
          initial={reducedMotion ? false : { opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={{
            duration: reducedMotion ? 0 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {loading ? (
            <CompanionSkeleton />
          ) : tab === "home" ? null : tab === "progress" ? (
            bgLoading ? <TabSkeleton /> :
            <QuranProgressMap
              surahProgress={surahProgress}
              onUpdate={saveProgressToDb}
            />
          ) : tab === "exercises" ? (
            bgLoading ? <TabSkeleton /> :
            <QuranExercises
              surahProgress={surahProgress}
              spacedItems={spacedItems}
              streak={streak}
              onRecordExercise={recordExercise}
              onReview={saveReview}
              totalHasanat={totalHasanat}
            />
          ) : tab === "teachers" ? (
            <TeacherDiscovery
              teachers={teachers.filter((t) => t.is_active && (isRealUser ? !t.is_placeholder : true))}
              onBooked={async () => {
                await load();
                setTab("appointments");
                flash("Randevun onaylandı.");
              }}
              realUser={isRealUser}
              presence={presence}
            />
          ) : tab === "appointments" ? (
            <AppointmentsView
              key={`${userId}-${pilotDemo}`}
              appointments={appointments}
              userId={userId}
              onReload={() => load(true)}
              teachers={teachers}
              threads={threads}
              onRead={() => void refreshThreads()}
              presence={presence}
              onReminders={() => void enableReminders()}
              onNotice={flash}
            />
          ) : tab === "peers" ? (
            bgLoading ? <TabSkeleton /> :
            <PeerMatching
              key={`${userId}-${pilotDemo}`}
              helpers={helpers}
              matches={matches}
              level={profile?.quran_level || null}
              userId={userId}
              realUser={isRealUser}
              onReload={() => load(true)}
              threads={threads}
              onRead={() => void refreshThreads()}
              presence={presence}
            />
          ) : tab === "study" ? (
            <QuranStudyWorkspace
              goal={goal}
              notes={journey.quranNotes}
              appointments={appointments}
              userId={userId}
              realUser={isRealUser}
              onNavigate={onNavigate}
              onSave={async (nextGoal) => {
                if (pilotDemo) throw new Error("DEMO_READ_ONLY");
                if (isRealUser) {
                  const { error } = await supabase
                    .from("quran_study_goals")
                    .upsert(nextGoal, { onConflict: "user_id" });
                  if (error) throw error;
                } else guest.patch({ goal: nextGoal });
                setGoal(nextGoal);
              }}
              streak={streak}
              weeklySummary={weeklySummary}
              results={recentExercises}
            />
          ) : tab === "wheel" ? (
            <DailyWisdomWheel />
          ) : tab === "achievements" ? (
            bgLoading ? <TabSkeleton /> :
            <QuranAchievements
              progress={surahProgress}
              streak={streak}
              results={recentExercises}
              hasanat={totalHasanat}
            />
          ) : (
            <HocaManagement
              teachers={teachers}
              ownedHoca={ownedHoca}
              appointments={appointments}
              isAdmin={isAdmin}
              onReload={load}
            />
          )}
        </motion.div>
      </AnimatePresence>
      {newBadges.length > 0 && (
        <QuranAchievements
          progress={surahProgress}
          streak={streak}
          results={recentExercises}
          hasanat={totalHasanat}
          awarded={newBadges}
          onClose={() => setNewBadges([])}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   İLERLEME HARİTASI — 114 SURE GRID
   ═══════════════════════════════════════════ */
/* ═══════════════════════════════════════════
   ALIŞTIRMA MERKEZİ
   ═══════════════════════════════════════════ */
function LevelOnboarding({
  onSelect,
}: {
  onSelect: (level: QuranLevel) => void;
}) {
  return (
    <section className="quran-level-onboarding">
      <header>
        <span className="eyebrow">SANA UYGUN YOLCULUK</span>
        <h2>Kur’an okuma seviyeni değerlendir</h2>
        <p>
          Bu seçim yalnızca sana uygun hoca ve akran desteğini göstermek
          içindir; bir üstünlük ölçüsü değildir.
        </p>
      </header>
      <div>
        {LEVELS.map((item) => (
          <button key={item.value} onClick={() => onSelect(item.value)}>
            <AppIcon name={item.icon} />
            <span>
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
            </span>
            <AppIcon name="arrow-right" />
          </button>
        ))}
      </div>
    </section>
  );
}

function TeacherDiscovery({
  teachers,
  onBooked,
  realUser,
  presence,
}: {
  teachers: HocaProfileRow[];
  onBooked: () => Promise<void>;
  realUser: boolean;
  presence: QuranPresenceState;
}) {
  const [selected, setSelected] = useState<HocaProfileRow | null>(null);
  const [profileTeacher, setProfileTeacher] = useState<HocaProfileRow | null>(
    null,
  );
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
        <EmptyState
          icon="calendar-off"
          title="Henüz aktif hoca yok"
          text="Yeni hocalar eklendiğinde burada görünecek."
        />
      ) : (
        <div className="hoca-grid">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="hoca-card">
              <div className="hoca-avatar">
                {teacher.photo_url ? (
                  <AvatarImage
                    src={teacher.photo_url}
                    alt={`${teacher.display_name} profil fotoğrafı`}
                    size={160}
                  />
                ) : (
                  <span>{teacher.display_name.split(" ").slice(-1)[0][0]}</span>
                )}
                {teacher.is_placeholder && <em>Örnek profil</em>}
              </div>
              <div>
                <small>{teacher.title}</small>
                <h3>{teacher.display_name}</h3>
                {teacher.user_id && (
                  <span
                    className={`qc-presence-dot ${presence.online.has(teacher.user_id) ? "online" : "offline"}`}
                  >
                    {presence.online.has(teacher.user_id)
                      ? "Çevrimiçi"
                      : "Çevrimiçi bilgisi paylaşılmıyor"}
                  </span>
                )}
                <p>{teacher.bio}</p>
                <div className="hoca-tags">
                  {teacher.specialties.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <button onClick={() => setProfileTeacher(teacher)}>
                Profili incele <AppIcon name="user" />
              </button>
              <button
                onClick={() => setSelected(teacher)}
                disabled={Boolean(teacher.is_placeholder)}
                title={teacher.is_placeholder ? "Örnek profil — randevu alınamaz" : undefined}
              >
                {teacher.is_placeholder ? "Örnek profil" : "Randevu al"} <AppIcon name="arrow-right" />
              </button>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <BookingFlow
          teacher={selected}
          onClose={() => setSelected(null)}
          onBooked={onBooked}
          realUser={realUser}
        />
      )}
      {profileTeacher && (
        <QuranTeacherProfile
          teacher={profileTeacher}
          realUser={realUser}
          onClose={() => setProfileTeacher(null)}
          onBook={() => {
            setSelected(profileTeacher);
            setProfileTeacher(null);
          }}
        />
      )}
    </section>
  );
}

function BookingFlow({
  teacher,
  onClose,
  onBooked,
  realUser,
  reschedule,
}: {
  teacher: HocaProfileRow;
  onClose: () => void;
  onBooked: () => Promise<void>;
  realUser: boolean;
  reschedule?: AppointmentView;
}) {
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [availableDays, setAvailableDays] = useState<Record<string, number>>(
    {},
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<
    Array<{ slot_start: string; slot_end: string }>
  >([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState(reschedule?.topic_notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const slotVersion = useRef(0),
    bookingLock = useRef(false);

  useEffect(() => {
    let active = true;
    slotVersion.current++;
    if (!realUser) {
      const result: Record<string, number> = {};
      for (
        let d = 1;
        d <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        d += 1
      ) {
        const date = new Date(month.getFullYear(), month.getMonth(), d);
        if ([1, 3, 6].includes(date.getDay()) && date > new Date())
          result[dateKey(date)] = 4;
      }
      const timer = window.setTimeout(() => setAvailableDays(result), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      void supabase
        .rpc("get_hoca_available_days", {
          target_hoca_id: teacher.id,
          month_date: dateKey(month),
        })
        .then(({ data, error }) => {
          if (!active) return;
          setSelectedDate("");
          setSelectedSlot("");
          setSlots([]);
          if (error) setError("Müsait günler yüklenemedi. Yeniden açıp dene.");
          setAvailableDays(
            Object.fromEntries(
              (data || []).map((item) => [
                item.available_date,
                Number(item.slot_count),
              ]),
            ),
          );
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
      // Invalidate the previous month's slot requests, not a DOM ref.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      slotVersion.current++;
    };
  }, [month, realUser, teacher.id]);

  const chooseDate = async (key: string) => {
    const version = ++slotVersion.current;
    setSelectedDate(key);
    setSelectedSlot("");
    setBusy(true);
    if (!realUser) {
      setSlots(
        ["10:00", "10:30", "11:00", "11:30"].map((time) => {
          const start = new Date(`${key}T${time}:00+03:00`);
          return {
            slot_start: start.toISOString(),
            slot_end: new Date(start.getTime() + 30 * 60_000).toISOString(),
          };
        }),
      );
      setBusy(false);
      return;
    }
    const { data, error: slotError } = await supabase.rpc(
      "get_hoca_available_slots",
      { target_hoca_id: teacher.id, target_date: key },
    );
    if (version !== slotVersion.current) return;
    setSlots(data || []);
    setError(slotError ? "Saatler yüklenemedi." : "");
    setBusy(false);
  };
  const confirm = async () => {
    if (bookingLock.current) return;
    if (!selectedSlot || !realUser || teacher.is_placeholder) {
      if (!realUser)
        setError("Canlı randevu oluşturmak için gerçek hesabınla giriş yap.");
      if (teacher.is_placeholder)
        setError("Örnek profil ile canlı randevu oluşturulmaz.");
      return;
    }
    bookingLock.current = true;
    setBusy(true);
    setError("");
    const { error: bookingError } = reschedule
      ? await supabase.rpc("reschedule_hoca_appointment", {
          target_appointment_id: reschedule.id,
          new_start: selectedSlot,
          new_notes: notes,
        })
      : await supabase.rpc("book_hoca_appointment", {
          target_hoca_id: teacher.id,
          target_start: selectedSlot,
          notes,
        });
    if (bookingError) {
      setError(
        bookingError.message.includes("SLOT_UNAVAILABLE")
          ? "Bu saat az önce doldu."
          : bookingError.message.includes("CANCELLATION_WINDOW")
            ? "Randevuya 2 saatten az kaldı. Hocanla iletişim kur."
            : "Randevu oluşturulamadı. Mevcut randevun korunuyor.",
      );
      setBusy(false);
      bookingLock.current = false;
      await chooseDate(selectedDate);
      return;
    }
    bookingLock.current = false;
    await onBooked();
    onClose();
  };
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const calendar = [
    ...Array(new Date(month.getFullYear(), month.getMonth(), 1).getDay()).fill(
      null,
    ),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
    ),
  ];
  return (
    <QuranModal
      onClose={onClose}
      label={`${teacher.display_name} randevu`}
      className="booking-modal"
    >
      <>
        <button className="modal-close" onClick={onClose} aria-label="Kapat">
          <AppIcon name="x" />
        </button>
        <aside>
          <AvatarImage
            src={avatar(teacher.display_name, teacher.photo_url)}
            alt={`${teacher.display_name} profil fotoğrafı`}
            size={120}
          />
          <span className="eyebrow">{teacher.title}</span>
          <h2 id="booking-title">{teacher.display_name}</h2>
          {reschedule && (
            <p className="qc-reschedule-info">
              Yeniden planlanacak ders:{" "}
              {formatAppointment(reschedule.scheduled_start)}. Yeni saat
              onaylanana kadar mevcut ders korunur.
            </p>
          )}
          <p>{teacher.bio}</p>
          <div className="hoca-tags">
            {teacher.specialties.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <small>
            <AppIcon name="clock" /> Saatler Türkiye saatiyle gösterilir.
          </small>
        </aside>
        <div className="booking-calendar">
          <header>
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
              aria-label="Önceki ay"
            >
              <AppIcon name="chevron-left" />
            </button>
            <strong>
              {month.toLocaleDateString("tr-TR", {
                month: "long",
                year: "numeric",
              })}
            </strong>
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
              aria-label="Sonraki ay"
            >
              <AppIcon name="chevron-right" />
            </button>
          </header>
          <div className="calendar-weekdays">
            {DAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="booking-days">
            {calendar.map((date, index) =>
              date ? (
                <button
                  key={date.toISOString()}
                  disabled={!availableDays[dateKey(date)]}
                  className={selectedDate === dateKey(date) ? "selected" : ""}
                  onClick={() => void chooseDate(dateKey(date))}
                >
                  <span>{date.getDate()}</span>
                  {availableDays[dateKey(date)] ? (
                    <i>{availableDays[dateKey(date)]}</i>
                  ) : null}
                </button>
              ) : (
                <i key={`blank-${index}`} />
              ),
            )}
          </div>
        </div>
        <div className="booking-slots">
          <span className="eyebrow">
            {selectedDate
              ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
                  "tr-TR",
                  { day: "numeric", month: "long" },
                )
              : "ÖNCE BİR GÜN SEÇ"}
          </span>
          <h3>Uygun saatler</h3>
          {busy ? (
            <div className="slot-loading">Saatler hazırlanıyor…</div>
          ) : selectedDate && slots.length === 0 ? (
            <p>Bu gün için uygun saat kalmadı.</p>
          ) : (
            <div className="slot-list">
              {slots.map((slot) => (
                <button
                  key={slot.slot_start}
                  className={selectedSlot === slot.slot_start ? "selected" : ""}
                  onClick={() => setSelectedSlot(slot.slot_start)}
                >
                  {timeOnly(slot.slot_start)}
                  {selectedSlot === slot.slot_start && <AppIcon name="check" />}
                </button>
              ))}
            </div>
          )}
          {selectedSlot && (
            <label className="booking-note">
              <span>Bugün ne üzerinde çalışmak istersin?</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={600}
                placeholder="Örn. Tecvid kuralları, ezber tekrarı…"
              />
            </label>
          )}
          {error && <p className="booking-error">{error}</p>}
          <button
            className="primary-button booking-confirm"
            disabled={!selectedSlot || busy}
            onClick={() => void confirm()}
          >
            <AppIcon name="calendar-check" />{" "}
            {reschedule ? "Yeni saati onayla" : "Randevuyu onayla"}
          </button>
          <small className="booking-policy">
            Randevu anında onaylanır. Başlangıçtan 2 saat öncesine kadar
            ücretsiz iptal edebilirsin.
          </small>
        </div>
      </>
    </QuranModal>
  );
}

function AppointmentsView({
  appointments,
  userId,
  onReload,
  onReminders,
  onNotice,
  teachers,
  threads,
  onRead,
  presence,
}: {
  appointments: AppointmentView[];
  userId: string;
  onReload: () => Promise<void>;
  onReminders: () => void;
  onNotice: (message: string) => void;
  teachers: HocaProfileRow[];
  threads: QuranThreadSummary[];
  onRead: () => void;
  presence: QuranPresenceState;
}) {
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");
  const [reviewAppointment, setReviewAppointment] =
    useState<AppointmentView | null>(null);
  const [feedbackAppointment, setFeedbackAppointment] =
    useState<AppointmentView | null>(null);
  const [chatAppointment, setChatAppointment] =
    useState<AppointmentView | null>(null);
  const [now] = useState(() => Date.now());
  const [reschedule, setReschedule] = useState<AppointmentView | null>(null);
  const [weekView, setWeekView] = useState(false),
    [weekOffset, setWeekOffset] = useState(0);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState("");
  const weekDays = quranWeek(new Date(now), weekOffset);
  const items = appointments
    .filter((item) =>
      filter === "upcoming"
        ? ["pending", "confirmed"].includes(item.status) &&
          new Date(item.scheduled_end).getTime() > now
        : !["pending", "confirmed"].includes(item.status) ||
          new Date(item.scheduled_end).getTime() <= now,
    )
    .sort((a, b) =>
      filter === "upcoming"
        ? a.scheduled_start.localeCompare(b.scheduled_start)
        : b.scheduled_start.localeCompare(a.scheduled_start),
    );
  const cancel = async (item: AppointmentView) => {
    if (item.is_demo) {
      onNotice("Örnek randevu canlı sunucuya yazılmaz.");
      return;
    }
    if (busyId) return;
    if (!window.confirm("Bu randevuyu iptal etmek istediğine emin misin?"))
      return;
    setBusyId(item.id);
    setActionError("");
    const { error } = await supabase.rpc("cancel_hoca_appointment", {
      target_appointment_id: item.id,
      reason: "Kullanıcı tarafından iptal edildi.",
    });
    setBusyId("");
    if (error)
      setActionError(
        error.message.includes("CANCELLATION_WINDOW")
          ? "Randevuya 2 saatten az kaldığı için uygulamadan iptal edilemez."
          : "Randevu iptal edilemedi.",
      );
    else await onReload();
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading split">
        <div>
          <span className="eyebrow">PROGRAMIN</span>
          <h2>Randevularım</h2>
          <p>
            Yaklaşan görüşmelerini ve tamamlanan çalışma geçmişini tek yerde
            izle.
          </p>
        </div>
        <button className="secondary-button" onClick={onReminders}>
          <AppIcon name="bell" /> 30 dk önce hatırlat
        </button>
      </header>
      <div className="appointment-toggle">
        <button
          className={filter === "upcoming" ? "active" : ""}
          onClick={() => setFilter("upcoming")}
        >
          Yaklaşan
        </button>
        <button
          className={filter === "past" ? "active" : ""}
          onClick={() => setFilter("past")}
        >
          Geçmiş
        </button>
      </div>
      <div className="qc-appointment-tools">
        <button
          className="secondary-button"
          aria-pressed={weekView}
          onClick={() => setWeekView((v) => !v)}
        >
          <AppIcon name="calendar" />
          {weekView ? "Liste görünümü" : "Haftalık takvim"}
        </button>
      </div>
      {actionError && (
        <p role="alert" className="booking-error">
          {actionError}
        </p>
      )}
      {weekView && (
        <section
          className="qc-week-calendar"
          aria-label="Haftalık ders takvimi"
        >
          <header>
            <button
              aria-label="Önceki hafta"
              onClick={() => setWeekOffset((v) => v - 1)}
            >
              ←
            </button>
            <strong>
              {weekDays[0].toLocaleDateString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "long",
              })}{" "}
              –{" "}
              {weekDays[6].toLocaleDateString("tr-TR", {
                timeZone: "Europe/Istanbul",
                day: "numeric",
                month: "long",
              })}
            </strong>
            <button
              aria-label="Sonraki hafta"
              onClick={() => setWeekOffset((v) => v + 1)}
            >
              →
            </button>
          </header>
          <div>
            {weekDays.map((day) => (
              <section key={istanbulDay(day)}>
                <h3>
                  {day.toLocaleDateString("tr-TR", {
                    timeZone: "Europe/Istanbul",
                    weekday: "short",
                    day: "numeric",
                  })}
                </h3>
                {items
                  .filter(
                    (a) =>
                      new Date(a.scheduled_start).toLocaleDateString("en-CA", {
                        timeZone: "Europe/Istanbul",
                      }) === istanbulDay(day),
                  )
                  .map((a) => (
                    <button
                      key={a.id}
                      className={`qc-calendar-lesson ${a.status}`}
                      onClick={() => setChatAppointment(a)}
                    >
                      {timeOnly(a.scheduled_start)}
                      <strong>
                        {a.student_id === userId ? a.hoca_name : a.student_name}
                      </strong>
                      <small>{STATUS_LABELS[a.status]}</small>
                    </button>
                  ))}
              </section>
            ))}
          </div>
        </section>
      )}
      {items.length === 0 ? (
        <EmptyState
          icon="calendar-smile"
          title={
            filter === "upcoming"
              ? "Yaklaşan randevun yok"
              : "Henüz geçmiş randevu yok"
          }
          text="Uygun olduğunda yeni bir çalışma saati seçebilirsin."
        />
      ) : (
        <div className="appointment-list">
          {items.map((item) => {
            const asHoca = item.student_id !== userId;
            return (
              <article key={item.id}>
                <time>
                  <strong>
                    {new Date(item.scheduled_start).toLocaleDateString(
                      "tr-TR",
                      { day: "2-digit", timeZone: "Europe/Istanbul" },
                    )}
                  </strong>
                  <span>
                    {new Date(item.scheduled_start).toLocaleDateString(
                      "tr-TR",
                      { month: "short", timeZone: "Europe/Istanbul" },
                    )}
                  </span>
                </time>
                <AvatarImage
                  src={avatar(
                    asHoca ? item.student_name : item.hoca_name,
                    asHoca ? item.student_avatar : item.hoca_photo,
                  )}
                  alt=""
                  size={48}
                />
                <div>
                  <span className={`appointment-status ${item.status}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                  <h3>{asHoca ? item.student_name : item.hoca_name}</h3>
                  <p>
                    {formatAppointment(item.scheduled_start)} ·{" "}
                    {Math.round(
                      (new Date(item.scheduled_end).getTime() -
                        new Date(item.scheduled_start).getTime()) /
                        60_000,
                    )}{" "}
                    dk
                  </p>
                  {item.topic_notes && (
                    <blockquote>“{item.topic_notes}”</blockquote>
                  )}
                </div>
                <div className="appointment-actions">
                  {["confirmed", "completed"].includes(item.status) && (
                    <button onClick={() => setChatAppointment(item)}>
                      <AppIcon name="message" /> Mesajlaş{" "}
                      {Number(
                        threads.find((t) => t.context_id === item.id)
                          ?.unread_count,
                      ) > 0 && (
                        <span className="qc-nav-badge">
                          {
                            threads.find((t) => t.context_id === item.id)
                              ?.unread_count
                          }
                        </span>
                      )}
                    </button>
                  )}
                  {item.status === "completed" && (
                    <button onClick={() => setReviewAppointment(item)}>
                      <AppIcon name="notes" /> Ders Notu
                    </button>
                  )}
                  {item.status === "completed" &&
                    item.student_id === userId &&
                    !item.is_demo &&
                    isValidUUID(userId) && (
                      <button onClick={() => setFeedbackAppointment(item)}>
                        Hocaya yorum bırak
                      </button>
                    )}
                  {!asHoca &&
                    ["pending", "confirmed"].includes(item.status) && (
                      <button
                        disabled={busyId === item.id || item.is_demo}
                        onClick={() => {
                          if (!teachers.some((t) => t.id === item.hoca_id)) {
                            setActionError("Hoca bilgileri yüklenemedi.");
                            return;
                          }
                          setReschedule(item);
                        }}
                      >
                        <AppIcon name="calendar" />
                        Yeniden planla
                      </button>
                    )}
                  {["pending", "confirmed"].includes(item.status) && (
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(
                          new Blob([appointmentCalendar(item)], {
                            type: "text/calendar;charset=utf-8",
                          }),
                        );
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `kuran-randevu-${istanbulDay(item.scheduled_start)}.ics`;
                        a.click();
                        setTimeout(() => URL.revokeObjectURL(url), 1000);
                      }}
                    >
                      <AppIcon name="download" />
                      Takvime ekle
                    </button>
                  )}
                  {["pending", "confirmed"].includes(item.status) && (
                    <button
                      className="danger"
                      disabled={busyId === item.id}
                      onClick={() => void cancel(item)}
                    >
                      İptal et
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {reviewAppointment && (
        <AppointmentReview
          appointment={reviewAppointment}
          isHoca={reviewAppointment.student_id !== userId}
          userId={userId}
          onClose={() => setReviewAppointment(null)}
          onSaved={() => {
            setReviewAppointment(null);
            onNotice("Ders notu kaydedildi.");
          }}
        />
      )}
      {chatAppointment && (
        <AppointmentChat
          appointment={chatAppointment}
          currentUserId={userId}
          isHoca={chatAppointment.student_id !== userId}
          presence={presence}
          onRead={onRead}
          onClose={() => setChatAppointment(null)}
        />
      )}
      {feedbackAppointment && (
        <QuranTeacherFeedback
          appointment={feedbackAppointment}
          userId={userId}
          onClose={() => setFeedbackAppointment(null)}
        />
      )}
      {reschedule && (
        <BookingFlow
          teacher={teachers.find((t) => t.id === reschedule.hoca_id)!}
          reschedule={reschedule}
          realUser={!reschedule.is_demo && isValidUUID(userId)}
          onClose={() => setReschedule(null)}
          onBooked={async () => {
            await onReload();
            onNotice("Dersin yeni saati onaylandı.");
          }}
        />
      )}
    </section>
  );
}

function PeerMatching({
  helpers,
  matches,
  level,
  userId,
  realUser,
  onReload,
  threads,
  onRead,
  presence,
}: {
  helpers: HelperView[];
  matches: PeerView[];
  level: QuranLevel | null;
  userId: string;
  realUser: boolean;
  onReload: () => Promise<void>;
  threads: QuranThreadSummary[];
  onRead: () => void;
  presence: QuranPresenceState;
}) {
  const [activeChat, setActiveChat] = useState<PeerView | null>(null);
  const [requestTarget, setRequestTarget] = useState<HelperView | null>(null),
    [requestMessage, setRequestMessage] = useState(""),
    [peerError, setPeerError] = useState(""),
    [peerBusy, setPeerBusy] = useState(false);
  const peerLock = useRef(false);
  const request = async (helper: HelperView) => {
    if (!realUser) {
      setPeerError("Eşleşme isteği için gerçek hesabınla giriş yap.");
      return;
    }
    if (peerLock.current) return;
    peerLock.current = true;
    setPeerBusy(true);
    setPeerError("");
    const { error } = await supabase.rpc("send_quran_peer_request", {
      target_helper_id: helper.id,
      request_message: requestMessage,
    });
    peerLock.current = false;
    setPeerBusy(false);
    if (error)
      setPeerError(
        error.message.includes("COOLDOWN")
          ? "Bu kişiye yeniden istek göndermeden önce 24 saat bekle."
          : "İstek gönderilemedi. Notun korunuyor.",
      );
    else {
      setRequestTarget(null);
      setRequestMessage("");
      await onReload();
    }
  };
  const respond = async (match: PeerView, accept: boolean) => {
    if (peerLock.current) return;
    peerLock.current = true;
    setPeerBusy(true);
    const { error } = await supabase.rpc("respond_quran_peer_match", {
      target_match_id: match.id,
      accept_request: accept,
    });
    peerLock.current = false;
    setPeerBusy(false);
    if (!error) await onReload();
    else setPeerError("Yanıt kaydedilemedi. Yeniden dene.");
  };
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">KUR’AN KARDEŞİ</span>
          <h2>Birlikte öğrenmek kolaylaştırır</h2>
          <p>
            Bu alan yalnızca Kur’an öğrenme desteği içindir. Kişisel bilgilerini
            paylaşmadan uygulama içinden iletişim kur.
          </p>
        </div>
      </header>
      {peerError && !requestTarget && (
        <p className="booking-error" role="alert">
          {peerError}
        </p>
      )}
      {level !== "helper" && level !== "fluent" && realUser && (
        <div className="peer-helper-note">
          <AppIcon name="heart-handshake" />
          <div>
            <strong>Kur'an kardeşi olmak ister misin?</strong>
            <span>
              Seviyeni &quot;Destek olabilirim&quot; veya &quot;Akıcı okuyorum&quot; olarak güncellersen, diğer kullanıcılar seni bulabilir.
            </span>
          </div>
        </div>
      )}
      {level === "helper" ? (
        <div className="peer-helper-note">
          <AppIcon name="heart-handshake" />
          <div>
            <strong>Destek veren olarak görünüyorsun</strong>
            <span>
              Daha erken aşamadaki kullanıcılar sana eşleşme isteği
              gönderebilir.
            </span>
          </div>
        </div>
      ) : (
        <>
          <h3 className="subsection-title">Destek olabilecek kardeşler</h3>
          {helpers.length === 0 ? (
            <EmptyState
              icon="users-minus"
              title="Şu anda eşleşebilecek Kur'an kardeşi bulunmuyor"
              text="Yeni gönüllüler katıldığında burada görünecek. Seviyeni 'Destek olabilirim' olarak güncellersen, başkalarının seni bulmasını sağlarsın."
            />
          ) : (
            <div className="helper-grid">
              {helpers.map((helper) => (
                <article key={helper.id}>
                  <AvatarImage
                    src={avatar(helper.display_name, helper.avatar_url)}
                    alt=""
                    size={64}
                  />
                  <div>
                    <strong>{helper.display_name}</strong>
                    <span>Gönüllü akran desteği</span>
                    <small className="qc-peer-level">
                      {helper.quran_level === "helper" ? "Destekçi" : "Akıcı okuyor"} · {helper.xp} deneyim puanı
                    </small>
                    <span
                      className={`qc-presence-dot ${presence.online.has(helper.id) ? "online" : "offline"}`}
                    >
                      {presence.online.has(helper.id)
                        ? "Çevrimiçi"
                        : "Durum paylaşılmıyor"}
                    </span>
                  </div>
                  <button
                    disabled={matches.some(
                      (m) =>
                        m.partner_id === helper.id &&
                        ["pending", "accepted"].includes(m.status),
                    )}
                    onClick={() => {
                      setRequestTarget(helper);
                      setPeerError("");
                      setRequestMessage("Birlikte Kur'an çalışmak isterim.");
                    }}
                  >
                    İstek gönder
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
      <h3 className="subsection-title">Eşleşmelerim</h3>
      {matches.length === 0 ? (
        <EmptyState
          icon="message-circle"
          title="Henüz eşleşmen yok"
          text="Gönderdiğin ve sana gelen istekler burada görünür."
          compact
        />
      ) : (
        <div className="peer-match-list">
          {matches.map((match) => (
            <article key={match.id}>
              <AvatarImage
                src={avatar(match.partner_name, match.partner_avatar)}
                alt=""
                size={48}
              />
              <div>
                <strong>{match.partner_name}</strong>
                <span>
                  {match.direction === "received"
                    ? "Sana gönderildi"
                    : "Sen gönderdin"}{" "}
                  ·{" "}
                  {match.status === "pending"
                    ? "Yanıt bekliyor"
                    : match.status === "accepted"
                      ? "Eşleşti"
                      : "Olumsuz"}
                </span>
                {match.message && <p>{match.message}</p>}
                <ol className="qc-peer-timeline" aria-label="Eşleşme aşamaları">
                  <li className="done">İstek</li>
                  <li
                    className={match.status === "pending" ? "current" : "done"}
                  >
                    Yanıt
                  </li>
                  <li className={match.status === "accepted" ? "done" : ""}>
                    Birlikte çalışma
                  </li>
                </ol>
                {match.status === "accepted" && (
                  <>
                    <span
                      className={`qc-presence-dot ${presence.online.has(match.partner_id) ? "online" : "offline"}`}
                    >
                      {presence.online.has(match.partner_id)
                        ? "Çevrimiçi"
                        : "Durum paylaşılmıyor"}
                    </span>
                    <p className="qc-peer-preview">
                      {threads.find((t) => t.context_id === match.id)
                        ?.last_message || "İlk çalışma zamanınızı belirleyin."}
                    </p>
                  </>
                )}
              </div>
              {match.direction === "received" && match.status === "pending" ? (
                <span className="peer-actions">
                  <button
                    disabled={peerBusy}
                    onClick={() => void respond(match, true)}
                  >
                    Kabul et
                  </button>
                  <button
                    disabled={peerBusy}
                    onClick={() => void respond(match, false)}
                  >
                    Reddet
                  </button>
                </span>
              ) : match.status === "accepted" ? (
                <button onClick={() => setActiveChat(match)}>
                  Mesajlaş{" "}
                  {Number(
                    threads.find((t) => t.context_id === match.id)
                      ?.unread_count,
                  ) > 0 && (
                    <span className="qc-nav-badge">
                      {
                        threads.find((t) => t.context_id === match.id)
                          ?.unread_count
                      }
                    </span>
                  )}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {activeChat && (
        <PeerChat
          match={activeChat}
          userId={userId}
          onClose={() => setActiveChat(null)}
          onRead={onRead}
          presence={presence}
        />
      )}
      <QuranStudyGroup
        userId={userId}
        realUser={realUser}
        peers={matches
          .filter((m) => m.status === "accepted")
          .map((m) => ({ id: m.partner_id, name: m.partner_name }))}
      />
      {requestTarget && (
        <QuranModal
          label="Kur'an kardeşliği isteği"
          onClose={() => {
            if (!peerBusy) setRequestTarget(null);
          }}
          className="qc-social-modal"
        >
          <header>
            <AvatarImage
              src={avatar(requestTarget.display_name, requestTarget.avatar_url)}
              size={64}
            />
            <div>
              <h2>{requestTarget.display_name}</h2>
              <p>Gönüllü akran desteği · {requestTarget.xp} deneyim puanı</p>
            </div>
          </header>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void request(requestTarget);
            }}
          >
            <label>
              Tanışma notun{" "}
              <textarea
                maxLength={400}
                rows={4}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="Hangi sureyi veya konuyu birlikte çalışmak istersin?"
              />
            </label>
            <small>
              {requestMessage.length}/400 · Kişisel iletişim bilgilerini
              paylaşma.
            </small>
            {peerError && (
              <p role="alert" className="booking-error">
                {peerError}
              </p>
            )}
            <footer>
              <button
                type="button"
                disabled={peerBusy}
                onClick={() => setRequestTarget(null)}
              >
                Vazgeç
              </button>
              <button className="primary-button" disabled={peerBusy}>
                {peerBusy ? "Gönderiliyor…" : "İstek gönder"}
              </button>
            </footer>
          </form>
        </QuranModal>
      )}
    </section>
  );
}

function PeerChat({
  match,
  userId,
  onClose,
  onRead,
  presence,
}: {
  match: PeerView;
  userId: string;
  onClose: () => void;
  onRead?: () => void;
  presence?: QuranPresenceState;
}) {
  return (
    <QuranChat
      contextId={match.id}
      userId={userId}
      partnerId={match.partner_id}
      name={match.partner_name}
      avatar={match.partner_avatar}
      subtitle="Kur’an çalışma eşleşmesi"
      kind="peer"
      onClose={onClose}
      onRead={onRead}
      presence={presence}
    />
  );
}

function HocaManagement({
  teachers,
  ownedHoca,
  appointments,
  isAdmin,
  onReload,
}: {
  teachers: HocaProfileRow[];
  ownedHoca?: HocaProfileRow;
  appointments: AppointmentView[];
  isAdmin: boolean;
  onReload: () => Promise<void>;
}) {
  const [scheduleNotice, setScheduleNotice] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [managedId, setManagedId] = useState(
    ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : ""),
  );
  const effectiveManagedId =
    managedId || ownedHoca?.id || (isAdmin ? teachers[0]?.id || "" : "");
  const managed = teachers.find((item) => item.id === effectiveManagedId);
  const [availability, setAvailability] = useState<HocaAvailabilityRow[]>([]);
  const [timeOff, setTimeOff] = useState<HocaTimeOffRow[]>([]);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<
    Array<{
      id: string;
      display_name: string;
      email: string;
      avatar_url: string | null;
      role: "user" | "admin" | "hoca";
    }>
  >([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setScheduleError("Fotoğraf 2 MB'den küçük olmalı.");
      e.target.value = "";
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };
  const loadSchedule = async () => {
    if (!effectiveManagedId) return;
    const [a, t] = await Promise.all([
      supabase
        .from("hoca_availability")
        .select("*")
        .eq("hoca_id", effectiveManagedId)
        .order("day_of_week"),
      supabase
        .from("hoca_time_off")
        .select("*")
        .eq("hoca_id", effectiveManagedId)
        .order("start_datetime"),
    ]);
    setAvailability(a.data || []);
    setTimeOff(t.data || []);
    if (a.error || t.error)
      setScheduleError("Takvim yüklenemedi. Yeniden dene.");
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSchedule();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [effectiveManagedId]); // eslint-disable-line react-hooks/exhaustive-deps
  const searchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    const { data, error } = await supabase.rpc("admin_search_quran_users", {
      search_text: search,
    });
    if (error) {
      setScheduleError("Kullanıcı araması yapılamadı.");
      return;
    }
    setUsers(data || []);
  };
  const setRole = async (id: string, role: "user" | "hoca" | "admin") => {
    if (
      !window.confirm(
        `Bu kullanıcının rolünü ${role === "admin" ? "yönetici" : role === "hoca" ? "hoca" : "öğrenci"} olarak değiştirmek istiyor musun?`,
      )
    )
      return;
    const { error } = await supabase.rpc("admin_set_quran_role", {
      target_user_id: id,
      next_role: role,
    });
    if (error) {
      setScheduleError("Yetki değişikliği kaydedilemedi.");
      return;
    }
    if (!error) {
      const { data } = await supabase.rpc("admin_search_quran_users", {
        search_text: search,
      });
      setUsers(data || []);
      await onReload();
    }
  };
  const saveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const fd = new FormData(event.currentTarget);
    let photoUrl: string | null = String(fd.get("photo")) || null;

    if (photoFile) {
      setPhotoUploading(true);
      const ext = photoFile.name.split(".").pop() || "jpg";
      const path = `${managed.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("hoca-photos")
        .upload(path, photoFile, { upsert: true });
      setPhotoUploading(false);
      if (uploadError) {
        setScheduleError("Fotoğraf yüklenemedi. Profil diğer bilgilerle kaydedilecek.");
      } else {
        const { data: publicData } = supabase.storage.from("hoca-photos").getPublicUrl(path);
        photoUrl = publicData.publicUrl;
      }
      setPhotoFile(null);
    }

    const { error } = await supabase
      .from("hoca_profiles")
      .update({
        display_name: String(fd.get("name")),
        title: String(fd.get("title")),
        bio: String(fd.get("bio")),
        specialties: String(fd.get("specialties"))
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        photo_url: photoUrl,
        is_active: fd.get("active") === "on",
      })
      .eq("id", managed.id);
    if (error) {
      setScheduleError("Profil kaydedilemedi. Formdaki bilgilerin korunuyor.");
      return;
    }
    setScheduleNotice("Profil kaydedildi.");
    setPhotoPreview(null);
    await onReload();
  };
  const addAvailability = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const form = event.currentTarget,
      fd = new FormData(form);
    setScheduleError("");
    setScheduleNotice("");
    const start = String(fd.get("start"));
    const end = String(fd.get("end"));
    if (start >= end) {
      setScheduleError("Bitiş saati başlangıç saatinden sonra olmalı.");
      return;
    }
    const { error: availabilityError } = await supabase
      .from("hoca_availability")
      .insert({
        hoca_id: managed.id,
        day_of_week: Number(fd.get("day")),
        start_time: start,
        end_time: end,
        slot_duration_minutes: Number(fd.get("duration")),
        is_recurring: true,
        specific_date: null,
      });
    if (availabilityError) {
      setScheduleError("Müsaitlik kaydedilemedi.");
      return;
    }
    form.reset();
    await loadSchedule();
    setScheduleNotice("Müsaitlik takvime eklendi.");
  };
  const addTimeOff = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!managed) return;
    const form = event.currentTarget,
      fd = new FormData(form);
    const start = new Date(String(fd.get("start"))),
      end = new Date(String(fd.get("end")));
    if (!Number.isFinite(start.getTime()) || start >= end) {
      setScheduleError("İzin bitişi başlangıcından sonra olmalı.");
      return;
    }
    const { error } = await supabase.from("hoca_time_off").insert({
      hoca_id: managed.id,
      start_datetime: new Date(String(fd.get("start"))).toISOString(),
      end_datetime: new Date(String(fd.get("end"))).toISOString(),
      reason: String(fd.get("reason")),
    });
    if (error) {
      setScheduleError("İzin kaydedilemedi.");
      return;
    }
    form.reset();
    await loadSchedule();
  };
  const updateStatus = async (id: string, status: "completed" | "no_show") => {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (error) {
      setScheduleError("Randevu durumu kaydedilemedi.");
      return;
    }
    await onReload();
  };
  return (
    <section className="quran-management">
      {scheduleError && (
        <p className="booking-error" role="alert">
          {scheduleError}
        </p>
      )}
      {scheduleNotice && (
        <p className="manage-success" role="status">
          {scheduleNotice}
        </p>
      )}
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">YETKİLİ ALAN</span>
          <h2>Hoca ve takvim yönetimi</h2>
          <p>
            Profil, haftalık müsaitlik, izin dönemleri ve görüşme durumlarını
            güvenle yönet.
          </p>
        </div>
        {isAdmin && (
          <select
            value={managedId}
            onChange={(event) => setManagedId(event.target.value)}
          >
            {teachers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.display_name}
              </option>
            ))}
          </select>
        )}
      </header>
      {isAdmin && (
        <article className="admin-role-card">
          <header>
            <span>
              <AppIcon name="shield-check" />
            </span>
            <div>
              <small>YALNIZCA YÖNETİCİ</small>
              <h3>Hoca yetkisi ata</h3>
            </div>
          </header>
          <form onSubmit={(event) => void searchUsers(event)}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              minLength={2}
              placeholder="Ad veya e-posta ile ara"
            />
            <button>Ara</button>
          </form>
          {users.map((item) => (
            <div className="admin-user-row" key={item.id}>
              <AvatarImage
                src={avatar(item.display_name, item.avatar_url)}
                size={42}
              />
              <span>
                <strong>{item.display_name}</strong>
                <small>
                  {item.email} ·{" "}
                  <em className={`role-tag role-${item.role}`}>
                    {item.role === "admin"
                      ? "Yönetici"
                      : item.role === "hoca"
                        ? "Hoca"
                        : "Öğrenci"}
                  </em>
                </small>
              </span>
              <span className="admin-role-actions">
                {item.role !== "admin" && (
                  <button
                    className="role-btn hoca"
                    onClick={() =>
                      void setRole(
                        item.id,
                        item.role === "hoca" ? "user" : "hoca",
                      )
                    }
                  >
                    {item.role === "hoca" ? "Hoca kaldır" : "Hoca yap"}
                  </button>
                )}
                {item.role !== "admin" && (
                  <button
                    className="role-btn admin"
                    onClick={() => void setRole(item.id, "admin")}
                  >
                    Admin yap
                  </button>
                )}
              </span>
            </div>
          ))}
        </article>
      )}
      {managed ? (
        <div className="management-grid">
          <form
            className="manage-profile-card"
            key={managed.id}
            onSubmit={(event) => void saveProfile(event)}
          >
            <h3>Hoca profili</h3>
            <label>
              Görünen ad
              <input name="name" defaultValue={managed.display_name} required />
            </label>
            <label>
              Unvan
              <input name="title" defaultValue={managed.title} required />
            </label>
            <label>
              Kısa biyografi
              <textarea name="bio" defaultValue={managed.bio} rows={4} />
            </label>
            <label>
              Uzmanlıklar
              <input
                name="specialties"
                defaultValue={managed.specialties.join(", ")}
              />
            </label>
            <label>
              Fotoğraf yükle
              <input type="file" accept="image/*" onChange={handlePhotoFile} />
            </label>
            {(photoPreview || managed.photo_url) && (
              <div className="hoca-photo-preview">
                <AvatarImage
                  src={photoPreview || managed.photo_url || ""}
                  alt="Fotoğraf önizleme"
                  size={80}
                />
                {photoUploading && <small>Yükleniyor...</small>}
              </div>
            )}
            <label>
              Fotoğraf URL (alternatif)
              <input name="photo" defaultValue={managed.photo_url || ""} placeholder="Veya doğrudan URL yapıştır" />
            </label>
            <label className="check-field">
              <input
                type="checkbox"
                name="active"
                defaultChecked={managed.is_active}
              />{" "}
              Aktif profilde göster
            </label>
            <button className="primary-button">Profili kaydet</button>
          </form>
          <section className="manage-availability-card">
            <h3>Haftalık müsaitlik</h3>
            <div
              className="qc-week-grid"
              aria-label="Haftalık müsaitlik takvimi"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <article key={day}>
                  <strong>{DAYS[day]}</strong>
                  {availability
                    .filter((a) => a.day_of_week === day)
                    .map((a) => (
                      <span key={a.id}>
                        {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                        <br />
                        {a.slot_duration_minutes} dk
                      </span>
                    ))}
                  {!availability.some((a) => a.day_of_week === day) && (
                    <small>Kapalı</small>
                  )}
                </article>
              ))}
            </div>
            <form onSubmit={(event) => void addAvailability(event)}>
              <select name="day">
                {DAYS.map((day, index) => (
                  <option key={day} value={index}>
                    {day}
                  </option>
                ))}
              </select>
              <input name="start" type="time" defaultValue="18:00" required />
              <input name="end" type="time" defaultValue="20:00" required />
              <select name="duration" defaultValue="30">
                <option value="20">20 dk</option>
                <option value="30">30 dk</option>
                <option value="40">40 dk</option>
                <option value="45">45 dk</option>
                <option value="60">60 dk</option>
                <option value="90">90 dk</option>
              </select>
              <button>
                <AppIcon name="plus" /> Ekle
              </button>
            </form>
            <div className="availability-list">
              {availability.map((item) => (
                <article key={item.id}>
                  <strong>{DAYS[item.day_of_week]}</strong>
                  <span>
                    {item.start_time.slice(0, 5)}–{item.end_time.slice(0, 5)} ·{" "}
                    {item.slot_duration_minutes} dk
                  </span>
                  <button
                    onClick={async () => {
                      const { error } = await supabase
                        .from("hoca_availability")
                        .delete()
                        .eq("id", item.id);
                      if (error) {
                        setScheduleError("Müsaitlik kaldırılamadı.");
                        return;
                      }
                      await loadSchedule();
                    }}
                    aria-label={`${DAYS[item.day_of_week]} müsaitliğini kaldır`}
                  >
                    <AppIcon name="trash" />
                  </button>
                </article>
              ))}
            </div>
          </section>
          <section className="manage-timeoff-card">
            <h3>İzin / kapalı zaman</h3>
            <form onSubmit={(event) => void addTimeOff(event)}>
              <input name="start" type="datetime-local" required />
              <input name="end" type="datetime-local" required />
              <input name="reason" placeholder="Kısa açıklama (isteğe bağlı)" />
              <button>
                <AppIcon name="plus" /> Engelle
              </button>
            </form>
            {timeOff.map((item) => (
              <article key={item.id}>
                <span>
                  <strong>{formatAppointment(item.start_datetime)}</strong>
                  <small>{item.reason || "Müsait değil"}</small>
                </span>
                <button
                  onClick={async () => {
                    const { error } = await supabase
                      .from("hoca_time_off")
                      .delete()
                      .eq("id", item.id);
                    if (error) {
                      setScheduleError("Kapalı zaman kaldırılamadı.");
                      return;
                    }
                    await loadSchedule();
                  }}
                  aria-label="Kapalı zamanı kaldır"
                >
                  <AppIcon name="trash" />
                </button>
              </article>
            ))}
          </section>
          <section className="manage-appointments-card">
            <h3>Yaklaşan öğrenciler</h3>
            {appointments
              .filter(
                (item) =>
                  item.hoca_id === managed.id &&
                  ["pending", "confirmed"].includes(item.status),
              )
              .map((item) => (
                <article key={item.id}>
                  <AvatarImage
                    src={avatar(item.student_name, item.student_avatar)}
                    alt=""
                    size={42}
                  />
                  <span>
                    <strong>{item.student_name}</strong>
                    <small>
                      {formatAppointment(item.scheduled_start)} ·{" "}
                      {item.topic_notes || "Konu belirtilmedi"}
                    </small>
                  </span>
                  <div>
                    <button
                      onClick={() => void updateStatus(item.id, "completed")}
                    >
                      Tamamlandı
                    </button>
                    <button
                      onClick={() => void updateStatus(item.id, "no_show")}
                    >
                      Gelmedi
                    </button>
                  </div>
                </article>
              ))}
          </section>
        </div>
      ) : (
        <EmptyState
          icon="user-off"
          title="Yönetilecek hoca profili yok"
          text="Yönetici bir kullanıcıya hoca rolü atadığında profil burada oluşur."
        />
      )}
    </section>
  );
}

function EmptyState({
  icon,
  title,
  text,
  compact = false,
}: {
  icon: string;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={`quran-empty ${compact ? "compact" : ""}`}>
      <span>
        <AppIcon name={icon} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function CompanionSkeleton() {
  return (
    <div
      className="quran-companion-skeleton"
      aria-label="Kur'an Kardeşim yükleniyor"
    >
      <i />
      <i />
      <i />
    </div>
  );
}
function TabSkeleton() {
  return (
    <div className="qc-tab-skeleton" aria-label="Sekme yükleniyor">
      <i />
      <i />
    </div>
  );
}
