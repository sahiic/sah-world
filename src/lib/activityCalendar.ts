import type { ActivityEvent } from '@/lib/activity'
import { dayKey } from '@/lib/activity'

export interface CalendarDay {
  date: string
  day: number
  count: number
  level: 0 | 1 | 2 | 3 | 4
  isToday: boolean
  isCurrentMonth: boolean
}

export interface CalendarMonth {
  year: number
  month: number
  label: string
  days: CalendarDay[]
  startDayOfWeek: number
  totalDays: number
  activeDays: number
  totalEvents: number
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getStartDayOfWeek(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1
}

function computeLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0
  if (max <= 1) return 1
  const ratio = count / max
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

export function buildCalendarMonth(
  events: ActivityEvent[],
  year: number,
  month: number,
  now = new Date(),
): CalendarMonth {
  const totalDays = getDaysInMonth(year, month)
  const startDayOfWeek = getStartDayOfWeek(year, month)
  const todayKey = dayKey(now)

  const countMap = new Map<string, number>()
  for (const e of events) {
    const key = dayKey(e.createdAt)
    const eDate = new Date(e.createdAt)
    if (eDate.getFullYear() === year && eDate.getMonth() === month) {
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
  }

  const maxCount = Math.max(0, ...countMap.values())

  const days: CalendarDay[] = []
  let activeDays = 0
  let totalEvents = 0

  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const count = countMap.get(dateStr) ?? 0
    if (count > 0) {
      activeDays++
      totalEvents += count
    }

    days.push({
      date: dateStr,
      day: d,
      count,
      level: computeLevel(count, maxCount),
      isToday: dateStr === todayKey,
      isCurrentMonth: true,
    })
  }

  return {
    year,
    month,
    label: `${MONTH_NAMES[month]} ${year}`,
    days,
    startDayOfWeek,
    totalDays,
    activeDays,
    totalEvents,
  }
}

export function getAdjacentMonth(year: number, month: number, direction: -1 | 1): { year: number; month: number } {
  const m = month + direction
  if (m < 0) return { year: year - 1, month: 11 }
  if (m > 11) return { year: year + 1, month: 0 }
  return { year, month: m }
}

export function getMonthNames(): string[] {
  return MONTH_NAMES
}
