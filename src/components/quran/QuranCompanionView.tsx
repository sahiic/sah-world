"use client";
import { type WisdomEntry } from "@/components/core/DailyWisdomWheel";
import QuranAchievements from "@/components/quran/QuranAchievements";
import QuranDashboard from "@/components/quran/QuranDashboard";
import { AppIcon } from "@/components/ui/AppIcon";
import { QURAN_TABS } from "@/lib/appLocation";
import { AnimatePresence,motion } from "framer-motion";


import SectionSkeleton from "@/components/ui/SectionSkeleton";
import dynamic from "next/dynamic";
import CompanionSkeleton from "./CompanionSkeleton";
import LevelOnboarding from "./LevelOnboarding";
import { useQuranCompanion } from "./useQuranCompanion";
const QuranReadTab = dynamic(() => import("./QuranReadTab"), { loading: () => <SectionSkeleton /> });
const QuranStudyTab = dynamic(() => import("./QuranStudyTab"), { loading: () => <SectionSkeleton /> });
const QuranCommunityTab = dynamic(() => import("./QuranCommunityTab"), { loading: () => <SectionSkeleton /> });
interface QuranCompanionViewProps { onNavigate: (view: string) => void; wheelEntry?: WisdomEntry; }
export default function QuranCompanionView({onNavigate}: QuranCompanionViewProps) {
 const controller = useQuranCompanion();
 const {profile, tab, mainTab, setTab, reducedMotion, teachers, loading, notice, error, isRealUser, surahProgress, streak, totalHasanat, recentExercises, newBadges, setNewBadges, weeklySummary, tabsRef, socialError, sharePresence, setSharePresence, pilotDemo, upcoming, saveLevel, todaysReviews, navItems, load} = controller;
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

      <header className="page-heading"><div><span className="eyebrow">KUR’AN-I KERİM KARDEŞİM</span><h1>Oku, çalış, birlikte ilerle.</h1><p>Kendi ritminde bir ayet, küçük bir pratik, güvenilir bir kardeşlik.</p></div></header>

      <nav
        ref={tabsRef}
        className="quran-companion-tabs"
        role="tablist"
        aria-label="Kur'an Kardeşim alanları"
        onKeyDown={event => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const index = QURAN_TABS.indexOf(mainTab);
          const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
          setTab(QURAN_TABS[next]);
          tabsRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
        }}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            role="tab"
            aria-label={item.label}
            className={mainTab === item.id ? "active" : ""}
            aria-selected={mainTab === item.id}
            id={`quran-tab-${item.id}`}
            aria-controls="quran-main-panel"
            tabIndex={mainTab === item.id ? 0 : -1}
            onClick={() => setTab(item.id)}
          >
            <AppIcon name={item.icon} />
            <span>{item.label}</span>
            {Boolean(item.badge && item.badge > 0) && (
              <em
                className="qc-nav-badge"
                aria-label={`${item.badge} okunmamış mesaj veya bekleyen istek`}
              >
                {(item.badge ?? 0) > 99 ? "99+" : item.badge}
              </em>
            )}
          </button>
        ))}
      </nav>
      {isRealUser && mainTab === "topluluk" && (
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
      {socialError && mainTab === "topluluk" && (
        <p className="quran-inline-error" role="alert">
          {socialError}
        </p>
      )}
      {mainTab === "oku" && !loading && tab !== "wheel" && (
        <div className="qc-reading-summary"><QuranDashboard
          progress={surahProgress}
          streak={streak}
          summary={weeklySummary}
          hasanat={totalHasanat}
          reviews={todaysReviews.length}
          teacher={teachers.find((t) => t.is_active)}
          nextAppointment={upcoming[0]}
          onOpen={setTab}
          demo={pilotDemo}
        /></div>
      )}

      {mainTab === "oku" && !loading && isRealUser && !profile?.quran_level && (
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
          key={loading ? "loading" : mainTab}
          className="quran-tab-transition"
          role="tabpanel"
          id="quran-main-panel"
          aria-labelledby={`quran-tab-${mainTab}`}
          initial={reducedMotion ? false : { opacity: 0, y: 7 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
          transition={{
            duration: reducedMotion ? 0 : 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {loading ? <CompanionSkeleton /> : <div className="qc-learning-stack">
            {mainTab === "oku" && <QuranReadTab controller={controller} onNavigate={onNavigate} />}
            {mainTab === "calis" && <QuranStudyTab controller={controller} onNavigate={onNavigate} />}
            {mainTab === "topluluk" && <QuranCommunityTab controller={controller} onNavigate={onNavigate} />}
          </div>}
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
