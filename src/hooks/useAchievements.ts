'use client'

import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { computeGlobalStreaks, type GlobalStreaks } from '@/lib/streaks'
import { evaluateBadges, type BadgeStatus } from '@/lib/badges'

export interface AchievementSummary {
  badges: BadgeStatus[]
  streaks: GlobalStreaks
  earnedCount: number
  totalCount: number
}

export function useAchievements(): AchievementSummary {
  const store = useJourneyStore(useShallow(s => ({
    journal: s.journal,
    quranNotes: s.quranNotes,
    hadisNotes: s.hadisNotes,
    eisenhower: s.eisenhower,
    lessons: s.lessons,
    sukurList: s.sukurList,
    totalZikir: s.totalZikir,
    focusSessions: s.focusSessions,
  })));

  return useMemo(() => {
    const source: ActivitySource = {
      journal: store.journal,
      quranNotes: store.quranNotes,
      hadisNotes: store.hadisNotes,
      eisenhower: store.eisenhower,
      lessons: store.lessons,
      sukurList: store.sukurList,
      totalZikir: store.totalZikir,
      focusSessions: store.focusSessions,
    }

    const events = buildActivityFeed(source)
    const streaks = computeGlobalStreaks(events)
    const badges = evaluateBadges(source, streaks)
    const earnedCount = badges.filter(b => b.earned).length

    return { badges, streaks, earnedCount, totalCount: badges.length }
  }, [
    store.journal,
    store.quranNotes,
    store.hadisNotes,
    store.eisenhower,
    store.lessons,
    store.sukurList,
    store.totalZikir,
    store.focusSessions,
  ])
}
