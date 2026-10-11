"use client";
import QuranWisdomWheel from "./QuranWisdomWheel";
import QuranStudyWorkspace from "@/components/quran/QuranStudyWorkspace";
import { supabase } from "@/lib/supabase";

import type { QuranController } from "./useQuranCompanion";

interface QuranReadTabProps {
  controller: QuranController;
  onNavigate: (view: string) => void;
}
export default function QuranReadTab({
  controller,
  onNavigate,
}: QuranReadTabProps) {
  const {
    mainTab,
    tab,
    goal,
    journey,
    appointments,
    userId,
    isRealUser,
    pilotDemo,
    guest,
    setGoal,
    streak,
    weeklySummary,
    recentExercises,
  } = controller;
  return (
    <>
      {" "}
      {mainTab === "oku" && (
        <>
          {tab === "wheel" ? (
            <QuranWisdomWheel />
          ) : (
            <>
              <section id="quran-study" aria-label="Okuma ve günlük hedef">
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
              </section>
              <details className="qc-module-details">
                <summary>Ayet ve hadis notlarım</summary>
                <QuranWisdomWheel />
              </details>
            </>
          )}
        </>
      )}
    </>
  );
}
