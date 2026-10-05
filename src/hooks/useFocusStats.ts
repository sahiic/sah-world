"use client";

import { useMemo } from "react";
import { useFocusStore } from "@/stores/focusStore";
import type { DailyStats } from "@/types/focus";
import { localDateKey } from "@/utils/timerUtils";

export function useFocusStats() {
  const sessions = useFocusStore((state) => state.sessions);
  const dailyGoalMinutes = useFocusStore((state) => state.dailyGoalMinutes);
  const currentStreak = useFocusStore((state) => state.currentStreak);
  const longestStreak = useFocusStore((state) => state.longestStreak);

  return useMemo(() => {
    const completed = sessions.filter(
      (session) => session.completed && session.mode === "focus",
    );
    const week: DailyStats[] = Array.from({ length: 7 }, (_, offset) => {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - (6 - offset));
      const key = localDateKey(date);
      const daySessions = completed.filter(
        (session) => localDateKey(new Date(session.startTime)) === key,
      );
      return {
        date: key,
        totalFocusMinutes: daySessions.reduce(
          (sum, session) => sum + session.duration,
          0,
        ),
        sessionsCompleted: daySessions.length,
        longestSession: daySessions.reduce(
          (longest, session) => Math.max(longest, session.duration),
          0,
        ),
      };
    });
    const today = week[week.length - 1];
    const weeklyTotal = week.reduce(
      (sum, item) => sum + item.totalFocusMinutes,
      0,
    );
    const bestDay = week.reduce(
      (best, item) =>
        item.totalFocusMinutes > best.totalFocusMinutes ? item : best,
      week[0],
    );
    return {
      today,
      week,
      weeklyTotal,
      dailyAverage: Math.round(weeklyTotal / 7),
      bestDay,
      dailyGoalMinutes,
      goalProgress: Math.min(
        100,
        Math.round((today.totalFocusMinutes / dailyGoalMinutes) * 100),
      ),
      currentStreak,
      longestStreak,
      totalSessions: completed.length,
    };
  }, [currentStreak, dailyGoalMinutes, longestStreak, sessions]);
}

