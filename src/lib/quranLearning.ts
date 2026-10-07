import {
  SURAHS,
  SPACED_INTERVALS,
  type QuranExerciseResult,
  type SurahProgress,
  type QuranStreak,
  type SpacedRepetitionItem,
  type WeeklySummary,
} from "./quranSurahs";
import { MILESTONE_BADGES } from "./quranExercises";
export const quranToday = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export const emptyProgress = (): SurahProgress[] =>
  SURAHS.map((s) => ({
    surahId: s.id,
    readStatus: "none",
    memorizeStatus: "none",
    lastStudyDate: null,
    difficultAyahs: [],
    completedAyahs: 0,
    totalErrors: 0,
  }));
export const emptyStreak = (): QuranStreak => ({
  current: 0,
  longest: 0,
  lastDate: "",
  totalDays: 0,
  freezeAvailable: false,
});
export function nextStreak(
  streak: QuranStreak,
  today = quranToday(),
): QuranStreak {
  if (streak.lastDate === today) return streak;
  const gap = streak.lastDate
    ? Math.round((Date.parse(today) - Date.parse(streak.lastDate)) / 86400000)
    : Infinity;
  const current =
    gap === 1 || (gap === 2 && streak.freezeAvailable) ? streak.current + 1 : 1;
  return {
    ...streak,
    current,
    longest: Math.max(current, streak.longest),
    lastDate: today,
    totalDays: streak.totalDays + 1,
    freezeAvailable:
      gap === 2 ? false : streak.freezeAvailable || current % 7 === 0,
  };
}
export function summarizePractice(
  results: QuranExerciseResult[],
  today = quranToday(),
): WeeklySummary {
  const end = Date.parse(`${today}T00:00:00+03:00`) + 86400000;
  const week = results.filter(
    (r) =>
      Date.parse(r.completedAt) >= end - 7 * 86400000 &&
      Date.parse(r.completedAt) < end,
  );
  const verses = new Set(
    week.flatMap((r) =>
      (r.answers ?? [])
        .filter((a) => a.surahId > 0)
        .map((a) => `${a.surahId}:${a.ayah}`),
    ),
  );
  return {
    totalAyahs: verses.size,
    totalMinutes: Math.round(
      week.reduce((n, r) => n + r.timeSpentSeconds, 0) / 60,
    ),
    surahsWorkedOn: new Set(
      week.flatMap((r) =>
        (r.answers ?? []).map((a) => a.surahId).filter((id) => id > 0),
      ),
    ).size,
    xhEarned: 0,
    comparedToLastWeek: 0,
    mostReviewedSurah: null,
  };
}
export function earnedBadges(
  progress: SurahProgress[],
  streak: QuranStreak,
  results: QuranExerciseResult[],
  hasanat: number,
) {
  const values = {
    exercise: results.length,
    streak: streak.longest,
    surah_read: progress.filter((p) => p.readStatus === "completed").length,
    surah_memorized: progress.filter((p) => p.memorizeStatus === "memorized")
      .length,
    tajweed_perfect: results.filter(
      (r) => r.type === "tajweed" && r.score === r.totalQuestions,
    ).length,
    hasanat,
  };
  return MILESTONE_BADGES.filter((b) => values[b.type] >= b.threshold);
}
export function scheduleReview(
  item: SpacedRepetitionItem,
  quality: "hard" | "good" | "easy",
  today = quranToday(),
): SpacedRepetitionItem {
  const intervalIndex =
    quality === "hard"
      ? 0
      : Math.min(
          SPACED_INTERVALS.length - 1,
          item.intervalIndex + (quality === "easy" ? 2 : 1),
        );
  const next = new Date(`${today}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + SPACED_INTERVALS[intervalIndex]);
  return {
    ...item,
    intervalIndex,
    reviewCount: item.reviewCount + 1,
    lastReviewDate: today,
    nextReviewDate: next.toISOString().slice(0, 10),
  };
}
// Verified against https://api.quran.com/api/v4/juzs (2026-10-07).
// A surah may span more than one juz.
export const JUZ_STARTS = [
  [1, 1],
  [2, 142],
  [2, 253],
  [3, 93],
  [4, 24],
  [4, 148],
  [5, 82],
  [6, 111],
  [7, 88],
  [8, 41],
  [9, 93],
  [11, 6],
  [12, 53],
  [15, 1],
  [17, 1],
  [18, 75],
  [21, 1],
  [23, 1],
  [25, 21],
  [27, 56],
  [29, 46],
  [33, 31],
  [36, 28],
  [39, 32],
  [41, 47],
  [46, 1],
  [51, 31],
  [58, 1],
  [67, 1],
  [78, 1],
] as const;
export function juzSegments(juz: number) {
  const start = JUZ_STARTS[juz - 1],
    end = JUZ_STARTS[juz];
  if (!start) return [];
  return SURAHS.filter(
    (s) =>
      s.id >= start[0] &&
      (!end || s.id < end[0] || (s.id === end[0] && end[1] > 1)),
  ).map((s) => ({
    surah: s,
    start: s.id === start[0] ? start[1] : 1,
    end: end && s.id === end[0] ? end[1] - 1 : s.ayahCount,
  }));
}
