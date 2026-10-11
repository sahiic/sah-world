import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { dayKey } from '@/lib/activity'

export interface StreakInfo {
  current: number
  longest: number
  lastActiveDate: string
}

export interface GlobalStreaks {
  overall: StreakInfo
  byCategory: Partial<Record<ActivityCategory, StreakInfo>>
  activeDaysThisWeek: number
  activeDaysThisMonth: number
  totalActiveDays: number
}

function computeStreak(sortedDays: string[], today: string): StreakInfo {
  if (!sortedDays.length) return { current: 0, longest: 0, lastActiveDate: '' }

  let longest = 1
  let run = 1
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(`${sortedDays[i - 1]}T12:00:00`)
    const curr = new Date(`${sortedDays[i]}T12:00:00`)
    const diff = (curr.getTime() - prev.getTime()) / 86_400_000
    if (diff === 1) { run++; if (run > longest) longest = run }
    else { run = 1 }
  }

  const lastActive = sortedDays[sortedDays.length - 1]
  const todayDate = new Date(`${today}T12:00:00`)
  const lastDate = new Date(`${lastActive}T12:00:00`)
  const gap = (todayDate.getTime() - lastDate.getTime()) / 86_400_000

  let current = 0
  if (gap <= 1) {
    current = 1
    for (let i = sortedDays.length - 2; i >= 0; i--) {
      const prev = new Date(`${sortedDays[i]}T12:00:00`)
      const curr = new Date(`${sortedDays[i + 1]}T12:00:00`)
      if ((curr.getTime() - prev.getTime()) / 86_400_000 === 1) current++
      else break
    }
  }

  return { current, longest: Math.max(longest, current), lastActiveDate: lastActive }
}

function uniqueSortedDays(events: ActivityEvent[]): string[] {
  const set = new Set<string>()
  for (const e of events) set.add(dayKey(e.createdAt))
  return [...set].sort()
}

export function computeGlobalStreaks(events: ActivityEvent[], now = new Date()): GlobalStreaks {
  const today = dayKey(now)
  const allDays = uniqueSortedDays(events)

  const categoryMap = new Map<ActivityCategory, ActivityEvent[]>()
  for (const e of events) {
    const list = categoryMap.get(e.category) ?? []
    list.push(e)
    categoryMap.set(e.category, list)
  }

  const byCategory: Partial<Record<ActivityCategory, StreakInfo>> = {}
  for (const [cat, catEvents] of categoryMap) {
    byCategory[cat] = computeStreak(uniqueSortedDays(catEvents), today)
  }

  const weekStart = new Date(now)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekKey = dayKey(weekStart)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthKey = dayKey(monthStart)

  return {
    overall: computeStreak(allDays, today),
    byCategory,
    activeDaysThisWeek: allDays.filter(d => d >= weekKey).length,
    activeDaysThisMonth: allDays.filter(d => d >= monthKey).length,
    totalActiveDays: allDays.length,
  }
}
