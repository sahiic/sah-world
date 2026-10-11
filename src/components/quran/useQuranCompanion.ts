"use client";
import { useQuranPresence } from "@/components/quran/useQuranPresence";
import {
  LEGACY_QURAN_TABS,
  QURAN_TABS,
  openAppView,
  readQuranTab,
  selectedValue,
  type QuranTab,
} from "@/lib/appLocation";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import { HASANAT_REWARDS } from "@/lib/quranExercises";
import {
  earnedBadges,
  emptyProgress,
  emptyStreak,
  nextStreak,
  quranToday,
  summarizePractice,
} from "@/lib/quranLearning";
import { quranUnreadCounts } from "@/lib/quranSocial";
import {
  SURAHS,
  getDemoSpacedItems,
  getDemoStreak,
  getDemoSurahProgress,
  type QuranExerciseResult,
  type QuranStreak,
  type SpacedRepetitionItem,
  type SurahProgress,
  type SurahStatus,
} from "@/lib/quranSurahs";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { isValidUUID, useJourneyStore } from "@/store/useJourneyStore";
import { useQuranSession } from "@/store/useQuranSession";
import type {
  AppointmentRow,
  HocaProfileRow,
  QuranLevel,
  QuranPeerMatchRow,
  QuranStudyGoalRow,
  QuranThreadSummary,
} from "@/types/database";
import { useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  SAMPLE_HOCA,
  STATUS_LABELS,
  sampleAppointments,
  type AppointmentView,
  type CompanionTab,
  type HelperView,
  type PeerView,
} from "./companionShared";

export function useQuranCompanion() {
  const { user, profile, patchProfile } = useAuthStore();
  const journey = useJourneyStore();
  const searchParams = useSearchParams();
  const requestedTab = selectedValue(
    searchParams.get("tab"),
    [...QURAN_TABS, ...LEGACY_QURAN_TABS],
    "oku",
  );
  const pilotDemo = searchParams.get("pilot") === "demo";
  const tab =
    requestedTab === "manage" &&
    profile?.role !== "hoca" &&
    profile?.role !== "admin"
      ? "home"
      : requestedTab;
  const mainTab = readQuranTab(tab);
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
      // Guest/demo data is synchronous; there is no second network phase.
      // Leaving this true traps progress/exercises/peers in a permanent skeleton.
      setBgLoading(false);
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
        !progressResult.error && !exerciseResult.error && !reviewResult.error,
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
    const active = tabsRef.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    active?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: "smooth",
    });
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
    id: QuranTab;
    label: string;
    icon: string;
    badge?: number;
  }> = [
    { id: "oku", label: "OKU", icon: "book-2" },
    { id: "calis", label: "ÇALIŞ", icon: "brain" },
    {
      id: "topluluk",
      label: "TOPLULUK",
      icon: "heart-handshake",
      badge:
        unreadCounts.appointments +
        unreadCounts.peers +
        matches.filter(
          (m) => m.direction === "received" && m.status === "pending",
        ).length,
    },
  ];

  return {
    user,
    profile,
    journey,
    tab,
    mainTab,
    setTab,
    reducedMotion,
    teachers,
    appointments,
    goal,
    helpers,
    matches,
    loading,
    bgLoading,
    notice,
    error,
    isRealUser,
    userId,
    isAdmin,
    isHoca,
    guest,
    surahProgress,
    streak,
    spacedItems,
    totalHasanat,
    recentExercises,
    newBadges,
    setNewBadges,
    weeklySummary,
    tabsRef,
    threads,
    socialError,
    sharePresence,
    setSharePresence,
    presence,
    unreadCounts,
    refreshThreads,
    pilotDemo,
    upcoming,
    ownedHoca,
    saveLevel,
    enableReminders,
    saveProgressToDb,
    recordExercise,
    saveReview,
    todaysReviews,
    navItems,
    load,
    flash,
    setGoal,
  };
}
export type QuranController = ReturnType<typeof useQuranCompanion>;
