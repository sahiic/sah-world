"use client";
import LoginScreen from "@/components/auth/LoginScreen";
import { AppIcon } from "@/components/ui/AppIcon";
import SectionSkeleton from "@/components/ui/SectionSkeleton";
import { useSignOut } from "@/hooks/useSignOut";
import { openAppView, readAppView } from "@/lib/appLocation";
import { getLevelForXP } from "@/lib/constants";
import { ownedRealtimeChannel } from "@/lib/ownedRealtimeChannel";
import { quranUnreadCounts } from "@/lib/quranSocial";
import type { Profile } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/useAuthStore";
import { useFocusTimerStore } from "@/store/useFocusTimerStore";
import { useJourneyStore } from "@/store/useJourneyStore";
import type { QuranThreadSummary } from "@/types/database";
import type { User } from "@supabase/supabase-js";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import CommandPalette from "./CommandPalette";
import type { GrowthNavigationCue } from "./GrowthTree";
import MilestoneCelebration, { type Milestone } from "./MilestoneCelebration";
import SahHeader from "./SahHeader";
import SahMobileNav from "./SahMobileNav";
import SahProfileMenu from "./SahProfileMenu";
import SahSidebar, {
  SahShell,
  navigationItems,
  type ViewKey,
} from "./SahSidebar";
import SectionErrorBoundary from "./SectionErrorBoundary";
import WelcomeGuide from "./WelcomeGuide";

const DashboardView = dynamic(() => import("./DashboardView"), {
  loading: () => <SectionSkeleton shape="scene" />,
});
const ReportsView = dynamic(() => import("./ReportsView"), {
  loading: () => <SectionSkeleton shape="report" />,
});
const CommunityView = dynamic(() => import("./CommunityView"), {
  loading: () => <SectionSkeleton />,
});
const SectionView = dynamic(() => import("./SectionView"), {
  loading: () => <SectionSkeleton />,
});
const JournalHubView = dynamic(() => import("./JournalHubView"), {
  loading: () => <SectionSkeleton shape="editor" />,
});
const FocusTimerView = dynamic(
  () => import("@/app/focus/components/FocusExperience"),
  {
    loading: () => <SectionSkeleton shape="timer" />,
  },
);
const AwarenessView = dynamic(() => import("./AwarenessView"), {
  loading: () => <SectionSkeleton shape="scene" />,
});
const ProfessionSchoolView = dynamic(
  () => import("../profession/ProfessionSchoolView"),
  {
    loading: () => <SectionSkeleton />,
  },
);
const QuranCompanionView = dynamic(() => import("./QuranCompanionView"), {
  loading: () => <SectionSkeleton />,
});
const AccountSettingsDialog = dynamic(() => import("./AccountSettingsDialog"));
const ProfileView = dynamic(() => import("@/components/ui/ProfileView"), {
  loading: () => <SectionSkeleton shape="report" />,
});

const viewLabels: Partial<Record<ViewKey, string>> = Object.fromEntries(
  navigationItems.map((item) => [item.id, item.label]),
);
viewLabels.dashboard = "Âlem";
viewLabels.community = "Topluluk";
viewLabels.growth = "Gelişim detaylarım";
viewLabels.profile = "Profilim";

export default function SahApp({
  initialUser,
  initialProfile,
}: {
  initialUser: User | null;
  initialProfile: Profile | null;
}) {
  const { session, user, isAuthLoading, profile } = useAuthStore();
  const { signOut, isSigningOut, signOutError } = useSignOut();
  const store = useJourneyStore();
  const searchParams = useSearchParams();
  const view = readAppView(searchParams);
  const mainRef = useRef<HTMLElement>(null);
  const previousView = useRef(view);
  useEffect(() => {
    if (previousView.current === view) return;
    previousView.current = view;
    const frame = requestAnimationFrame(() =>
      mainRef.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [view]);
  const setView = useCallback((next: string) => {
    openAppView(readAppView(new URLSearchParams({ view: next })));
  }, []);
  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [onboardingPreview, setOnboardingPreview] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [milestone, setMilestone] = useState<Milestone>(null);
  const [professionModalOpen, setProfessionModalOpen] = useState(false);
  const [transitionCue, setTransitionCue] = useState<
    (GrowthNavigationCue & { nonce: number }) | null
  >(null);
  const reducedMotion = useReducedMotion();
  const transitionCueTimer = useRef<number | null>(null);
  const milestoneArmed = useRef(false);
  const milestoneSnapshot = useRef({
    journal: store.journal.length,
    streak: store.streak.current,
    level: getLevelForXP(store.xp).level.name,
  });
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { level } = getLevelForXP(store.xp);
  const journalCount = store.journal.length;
  const streakCurrent = store.streak.current;
  const currentLevelName = level.name;
  const savedThemePreference =
    profile?.theme_preference ?? initialProfile?.theme_preference;

  const [quranThreads, setQuranThreads] = useState<QuranThreadSummary[]>([]);
  const quranUnread = useMemo(() => {
    const counts = quranUnreadCounts(quranThreads);
    return counts.appointments + counts.peers;
  }, [quranThreads]);
  useEffect(() => {
    const uid = user?.id;
    if (!uid) {
      queueMicrotask(() => setQuranThreads([]));
      return;
    }
    let active = true;
    const fetch = () =>
      void supabase.rpc("get_quran_thread_summaries").then(({ data }) => {
        if (active && data) setQuranThreads(data);
      });
    fetch();
    const channel = ownedRealtimeChannel(supabase, `sidebar-quran-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${uid}`,
        },
        fetch,
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `sender_id=eq.${uid}`,
        },
        fetch,
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    // DEV-ONLY: enables deterministic end-to-end onboarding QA without
    // creating or mutating a real Supabase account.
    if (process.env.NODE_ENV === "development") {
      queueMicrotask(() =>
        setOnboardingPreview(
          new URLSearchParams(window.location.search).get("onboarding") ===
            "preview",
        ),
      );
    }
  }, [setView]);

  useEffect(() => {
    const openFocus = () => {
      setView("focus");
      setMoreOpen(false);
      setProfileOpen(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("sah:open-focus", openFocus);
    return () => window.removeEventListener("sah:open-focus", openFocus);
  }, [setView]);

  useEffect(() => {
    const showFocus = () => {
      setView("focus");
      setMoreOpen(false);
      setProfileOpen(false);
    };
    const initialSync = window.setTimeout(() => {
      // A restored fullscreen preference must not replace an explicit shared URL.
      if (
        useFocusTimerStore.getState().isFullscreen &&
        !new URLSearchParams(window.location.search).has("view")
      )
        showFocus();
    }, 0);
    const unsubscribe = useFocusTimerStore.subscribe((state, previous) => {
      if (state.isFullscreen && !previous.isFullscreen) showFocus();
    });
    return () => {
      window.clearTimeout(initialSync);
      unsubscribe();
    };
  }, [setView]);

  useEffect(() => {
    const closeMenu = (event: PointerEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      )
        setProfileOpen(false);
    };
    document.addEventListener("pointerdown", closeMenu);
    return () => document.removeEventListener("pointerdown", closeMenu);
  }, []);

  useEffect(() => {
    const localPreference = window.localStorage.getItem("sah-theme-preference");
    const preference =
      savedThemePreference ??
      (localPreference === "light" ||
      localPreference === "dark" ||
      localPreference === "system"
        ? localPreference
        : "system");
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const nextTheme =
        preference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preference;
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    };
    const timer = window.setTimeout(apply, 0);
    if (preference === "system") media.addEventListener("change", apply);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", apply);
    };
  }, [savedThemePreference]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    document.addEventListener("keydown", shortcut);
    return () => document.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      milestoneArmed.current = true;
    }, 1500);
    return () => window.clearTimeout(timer);
  }, []); // İlk veri eşitlemesini kutlama olarak göstermeyiz.

  useEffect(() => {
    const current = {
      journal: journalCount,
      streak: streakCurrent,
      level: currentLevelName,
    };
    const previous = milestoneSnapshot.current;
    if (milestoneArmed.current && !milestone) {
      let next: Exclude<Milestone, null> | null = null;
      if (previous.journal < 10 && current.journal >= 10)
        next = {
          id: "journal-10",
          eyebrow: "BİR DÖNÜM NOKTASI",
          title: "Kendine on kez alan açtın.",
          message:
            "On günlük kaydı; hızdan çok, tekrar tekrar kendine dönmeyi seçtiğini gösteriyor.",
          icon: "notebook",
        };
      else if (
        [7, 30, 100].includes(current.streak) &&
        previous.streak < current.streak
      )
        next = {
          id: `streak-${current.streak}`,
          eyebrow: "İSTİKRARIN GÖRÜNÜR OLDU",
          title: `${current.streak} günlük seri.`,
          message:
            "Küçük adımların birbirine eklenerek nasıl bir ritim kurduğunu fark et.",
          icon: "flame",
        };
      else if (previous.level !== current.level)
        next = {
          id: `level-${current.level}`,
          eyebrow: "YENİ BİR EVRE",
          title: `${current.level} seviyesine ulaştın.`,
          message:
            "Bu seviye yalnızca uygulamadaki istikrarının yeni bir görünümüdür. Yolculuğun sana ait.",
          icon: "sparkles",
        };
      if (next && !window.localStorage.getItem(`sah-milestone-${next.id}`)) {
        window.localStorage.setItem(`sah-milestone-${next.id}`, "1");
        setMilestone(next);
      }
    }
    milestoneSnapshot.current = current;
  }, [currentLevelName, journalCount, milestone, streakCurrent]);

  useEffect(
    () => () => {
      if (transitionCueTimer.current)
        window.clearTimeout(transitionCueTimer.current);
    },
    [],
  );

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Server props are a bootstrap snapshot, not evidence of a current session.
  const activeUser = user ?? (isAuthLoading ? initialUser : null);
  const activeProfile = profile ?? (isAuthLoading ? initialProfile : null);
  if (isAuthLoading && !initialUser) return <AppLoading />;
  if (!session && !activeUser) return <LoginScreen />;

  const navigate = (next: string, cue?: GrowthNavigationCue) => {
    if (cue && !reducedMotion) {
      if (transitionCueTimer.current)
        window.clearTimeout(transitionCueTimer.current);
      setTransitionCue({ ...cue, nonce: Date.now() });
      transitionCueTimer.current = window.setTimeout(
        () => setTransitionCue(null),
        520,
      );
    }
    if (next === "focus") {
      openAppView("focus", next);
      return;
    } else if (next === "quran" || next === "hadis") {
      openAppView("quran-companion", "wheel", {
        wisdom: "archive",
        archive: next === "quran" ? "verse" : "hadith",
      });
    } else if (next === "daily-wheel") {
      openAppView("quran-companion", "wheel", { wisdom: "verse" });
    } else if (next === "matrix" || next === "sukur" || next === "lessons") {
      openAppView("journal", next);
    } else if (next === "journal") {
      setView("journal");
    } else if (next === "depot") {
      setView("dashboard");
    } else {
      setView(next as ViewKey);
    }
    setMoreOpen(false);
    setProfileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const changeTheme = (preference: "light" | "dark" | "system") => {
    const next =
      preference === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : preference;
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("sah-theme-preference", preference);
  };
  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    changeTheme(next);
    if (activeProfile) {
      useAuthStore.getState().patchProfile({ theme_preference: next });
      void supabase
        .from("profiles")
        .update({ theme_preference: next })
        .eq("id", activeProfile.id);
    }
  };
  const openPage = (path: string) => {
    setMoreOpen(false);
    setProfileOpen(false);
    window.location.assign(path);
  };
  const avatarUrl =
    activeProfile?.avatar_url ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(activeProfile?.display_name || "Yolcu")}`;

  return (
    <SahShell focusMode={view === "focus"}>
      <a href="#main-content" className="skip-link">
        İçeriğe atla
      </a>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {milestone?.title ?? `Toplam ${store.xp} XH`}
      </div>
      <SahSidebar
        view={view}
        navigate={navigate}
        openPage={openPage}
        quranUnread={quranUnread}
      />

      <div className="app-workspace">
        <SahHeader
          navigate={navigate}
          viewLabel={viewLabels[view] ?? "Kişisel alan"}
          setSearchOpen={setSearchOpen}
          profileMenuRef={profileMenuRef}
          setProfileOpen={setProfileOpen}
          profileOpen={profileOpen}
          avatarUrl={avatarUrl}
          activeProfile={activeProfile}
          level={level}
          store={store}
        >
          <SahProfileMenu
            avatarUrl={avatarUrl}
            activeProfile={activeProfile}
            store={store}
            level={level}
            navigate={navigate}
            setProfileOpen={setProfileOpen}
            setSettingsOpen={setSettingsOpen}
            toggleTheme={toggleTheme}
            theme={theme}
            activeUser={activeUser}
            openPage={openPage}
            isSigningOut={isSigningOut}
            signOut={signOut}
            signOutError={signOutError}
          />
        </SahHeader>

        <AnimatePresence>
          {transitionCue && (
            <motion.div
              key={transitionCue.nonce}
              className="context-navigation-cue"
              style={
                { "--navigation-accent": transitionCue.accent } as CSSProperties
              }
              initial={{ opacity: 0, scaleX: 0.04 }}
              animate={{ opacity: [0, 0.62, 0], scaleX: [0.04, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            >
              <span>
                <AppIcon name={transitionCue.icon} />
                {transitionCue.label}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <main
          className="app-main"
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
        >
          {activeProfile?.created_at && (
            <WelcomeGuide
              key={`${activeProfile.id}-${onboardingPreview}`}
              name={activeProfile.display_name || "Yolcu"}
              currentView={view}
              hasActivity={
                store.xp > 0 ||
                store.journal.length > 0 ||
                (activeProfile.xp ?? 0) > 0
              }
              profileId={activeProfile.id}
              createdAt={activeProfile.created_at}
              completed={
                onboardingPreview ? false : activeProfile.onboarding_completed
              }
              preview={onboardingPreview}
              onComplete={() =>
                useAuthStore
                  .getState()
                  .patchProfile({ onboarding_completed: true })
              }
              onStart={() => navigate("journal")}
              onReturn={() => navigate("dashboard")}
            />
          )}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={view}
              className="view-motion-shell"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
              transition={{
                duration: reducedMotion ? 0 : 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <SectionErrorBoundary
                key={view}
                sectionName={viewLabels[view] ?? "Kişisel alan"}
              >
                {view === "dashboard" ? (
                  <DashboardView onNavigate={navigate} />
                ) : view === "growth" ? (
                  <DashboardView onNavigate={navigate} />
                ) : view === "reports" ? (
                  <ReportsView />
                ) : view === "profile" ? (
                  <ProfileView />
                ) : view === "community" ? (
                  <CommunityView />
                ) : view === "quran-companion" ? (
                  <QuranCompanionView onNavigate={navigate} />
                ) : view === "journal" ? (
                  <JournalHubView onNavigate={navigate} />
                ) : view === "focus" ? (
                  <FocusTimerView onExit={() => navigate("dashboard")} />
                ) : view === "awareness" ? (
                  <AwarenessView onNavigate={navigate} />
                ) : view === "profession-school" ? (
                  <ProfessionSchoolView
                    onNavigate={navigate}
                    onModalChange={setProfessionModalOpen}
                  />
                ) : (
                  <SectionView section={view} onNavigate={navigate} />
                )}
              </SectionErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <SahMobileNav
        view={view}
        navigate={navigate}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
        openPage={openPage}
        activeUser={activeUser}
      />
      <CommandPalette
        open={searchOpen}
        onClose={closeSearch}
        onNavigate={navigate}
      />
      {settingsOpen && (
        <AccountSettingsDialog
          onClose={() => setSettingsOpen(false)}
          onThemeChange={changeTheme}
        />
      )}
      <MilestoneCelebration
        milestone={professionModalOpen ? null : milestone}
        onClose={() => setMilestone(null)}
      />
    </SahShell>
  );
};

function AppLoading() {
  return (
    <main className="app-loader" aria-busy="true" aria-live="polite">
      <span className="brand-mark">S</span>
      <div className="skeleton-stack">
        <i />
        <i />
        <i />
      </div>
      <p>Güvenli alanın hazırlanıyor…</p>
    </main>
  );
}
