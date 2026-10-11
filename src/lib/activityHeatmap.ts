import type { ActivityEvent } from '@/lib/activity'
import { dayKey } from '@/lib/activity'

export interface HeatmapDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface HeatmapData {
  days: HeatmapDay[]
  totalDays: number
  activeDays: number
  maxCount: number
  weeks: number
}

function getLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (max <= 1) return count > 0 ? 2 : 0
  const ratio = count / max
  if (ratio >= 0.75) return 4
  if (ratio >= 0.5) return 3
  if (ratio >= 0.25) return 2
  return 1
}

export function buildHeatmap(events: ActivityEvent[], weeks = 20, now = new Date()): HeatmapData {
  const counts = new Map<string, number>()
  for (const e of events) {
    const key = dayKey(e.createdAt)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }

  const totalDays = weeks * 7
  const end = new Date(now)
  end.setHours(12, 0, 0, 0)

  const dayOfWeek = end.getDay()
  const endOfWeek = new Date(end)
  endOfWeek.setDate(end.getDate() + (6 - dayOfWeek))

  const start = new Date(endOfWeek)
  start.setDate(endOfWeek.getDate() - totalDays + 1)

  let maxCount = 0
  const raw: Array<{ date: string; count: number }> = []

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d)
    const count = counts.get(key) ?? 0
    if (count > maxCount) maxCount = count
    raw.push({ date: key, count })
  }

  const days: HeatmapDay[] = raw.map(({ date, count }) => ({
    date,
    count,
    level: getLevel(count, maxCount),
  }))

  return {
    days,
    totalDays,
    activeDays: days.filter(d => d.count > 0).length,
    maxCount,
    weeks,
  }
}

export function getMonthLabels(days: HeatmapDay[]): Array<{ label: string; col: number }> {
  const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const labels: Array<{ label: string; col: number }> = []
  let lastMonth = -1
  for (let i = 0; i < days.length; i++) {
    const d = new Date(`${days[i].date}T12:00:00`)
    const month = d.getMonth()
    if (month !== lastMonth) {
      const col = Math.floor(i / 7)
      if (labels.length === 0 || col - labels[labels.length - 1].col >= 2) {
        labels.push({ label: MONTHS[month], col })
      }
      lastMonth = month
    }
  }
  return labels
}
