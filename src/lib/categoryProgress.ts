import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { CATEGORY_META, dayKey } from '@/lib/activity'

export interface CategoryDelta {
  category: ActivityCategory
  label: string
  icon: string
  thisWeek: number
  lastWeek: number
  change: number
  trend: 'up' | 'down' | 'same' | 'new'
}

export interface CategoryProgressSummary {
  categories: CategoryDelta[]
  thisWeekTotal: number
  lastWeekTotal: number
  overallChange: number
  overallTrend: 'up' | 'down' | 'same'
  mostImproved: CategoryDelta | null
  needsAttention: CategoryDelta | null
}

function getWeekBounds(now: Date, weeksAgo: number): { start: Date; end: Date } {
  const end = new Date(now)
  end.setDate(end.getDate() - weeksAgo * 7)
  end.setHours(23, 59, 59, 999)

  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

function countInRange(events: ActivityEvent[], category: ActivityCategory, start: Date, end: Date): number {
  return events.filter(e => {
    if (e.category !== category) return false
    const d = new Date(e.createdAt)
    return d >= start && d <= end
  }).length
}

function computeTrend(thisWeek: number, lastWeek: number): 'up' | 'down' | 'same' | 'new' {
  if (lastWeek === 0 && thisWeek > 0) return 'new'
  if (thisWeek > lastWeek) return 'up'
  if (thisWeek < lastWeek) return 'down'
  return 'same'
}

function computeChange(thisWeek: number, lastWeek: number): number {
  if (lastWeek === 0) return thisWeek > 0 ? 100 : 0
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}

const TRACKED_CATEGORIES: ActivityCategory[] = [
  'journal', 'quran', 'hadis', 'sukur', 'focus', 'matrix', 'lessons',
]

export function buildCategoryProgress(
  events: ActivityEvent[],
  now = new Date(),
): CategoryProgressSummary {
  const thisWeekBounds = getWeekBounds(now, 0)
  const lastWeekBounds = getWeekBounds(now, 1)

  const categories: CategoryDelta[] = []
  let thisWeekTotal = 0
  let lastWeekTotal = 0

  for (const cat of TRACKED_CATEGORIES) {
    const tw = countInRange(events, cat, thisWeekBounds.start, thisWeekBounds.end)
    const lw = countInRange(events, cat, lastWeekBounds.start, lastWeekBounds.end)

    if (tw === 0 && lw === 0) continue

    const meta = CATEGORY_META[cat]
    categories.push({
      category: cat,
      label: meta?.label ?? cat,
      icon: meta?.icon ?? 'circle',
      thisWeek: tw,
      lastWeek: lw,
      change: computeChange(tw, lw),
      trend: computeTrend(tw, lw),
    })

    thisWeekTotal += tw
    lastWeekTotal += lw
  }

  categories.sort((a, b) => b.thisWeek - a.thisWeek)

  let mostImproved: CategoryDelta | null = null
  let needsAttention: CategoryDelta | null = null

  for (const c of categories) {
    if (c.trend === 'up' || c.trend === 'new') {
      if (!mostImproved || c.change > mostImproved.change) mostImproved = c
    }
    if (c.trend === 'down') {
      if (!needsAttention || c.change < needsAttention.change) needsAttention = c
    }
  }

  return {
    categories,
    thisWeekTotal,
    lastWeekTotal,
    overallChange: computeChange(thisWeekTotal, lastWeekTotal),
    overallTrend: computeTrend(thisWeekTotal, lastWeekTotal) === 'new' ? 'up' : computeTrend(thisWeekTotal, lastWeekTotal) as 'up' | 'down' | 'same',
    mostImproved,
    needsAttention,
  }
}
