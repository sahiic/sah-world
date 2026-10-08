import { create } from "zustand";
import { emptyProgress, emptyStreak } from "@/lib/quranLearning";
import type { QuranStudyGoalRow } from "@/types/database";
import type {
  SurahProgress,
  QuranStreak,
  QuranExerciseResult,
  SpacedRepetitionItem,
} from "@/lib/quranSurahs";
type Session = {
  goal: QuranStudyGoalRow | null;
  progress: SurahProgress[];
  streak: QuranStreak;
  results: QuranExerciseResult[];
  reviews: SpacedRepetitionItem[];
  hasanat: number;
  patch: (values: Partial<Omit<Session, "patch">>) => void;
};
// Guest practice is memory-only. No storage middleware, cookie, or production auth bypass.
export const useQuranSession = create<Session>((set) => ({
  goal: null,
  progress: emptyProgress(),
  streak: emptyStreak(),
  results: [],
  reviews: [],
  hasanat: 0,
  patch: (values) => set(values),
}));
