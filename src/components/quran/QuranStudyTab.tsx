"use client";
import QuranAchievements from "@/components/quran/QuranAchievements";
import QuranExercises from "@/components/quran/QuranExercises";
import QuranProgressMap from "@/components/quran/QuranProgressMap";

import TabSkeleton from "./TabSkeleton";
import type { QuranController } from "./useQuranCompanion";

interface QuranStudyTabProps {
  controller: QuranController;
  onNavigate: (view: string) => void;
}
export default function QuranStudyTab({ controller }: QuranStudyTabProps) {
  const {
    mainTab,
    bgLoading,
    surahProgress,
    spacedItems,
    streak,
    recordExercise,
    saveReview,
    totalHasanat,
    saveProgressToDb,
    recentExercises,
  } = controller;
  return (
    <>
      {" "}
      {mainTab === "calis" &&
        (bgLoading ? (
          <TabSkeleton />
        ) : (
          <>
            <section id="quran-exercises" aria-label="Alıştırmalar">
              <QuranExercises
                surahProgress={surahProgress}
                spacedItems={spacedItems}
                streak={streak}
                onRecordExercise={recordExercise}
                onReview={saveReview}
                totalHasanat={totalHasanat}
              />
            </section>
            <section id="quran-progress" aria-label="İlerleme haritası">
              <QuranProgressMap
                surahProgress={surahProgress}
                onUpdate={saveProgressToDb}
              />
            </section>
            <section id="quran-achievements" aria-label="Başarımlarım">
              <QuranAchievements
                progress={surahProgress}
                streak={streak}
                results={recentExercises}
                hasanat={totalHasanat}
              />
            </section>
          </>
        ))}
    </>
  );
}
