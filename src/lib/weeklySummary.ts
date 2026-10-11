import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { CATEGORY_META, dayKey } from '@/lib/activity'

export interface WeeklySummary {
  weekLabel: string
  totalEvents: number
  activeDays: number
  topCategory: { category: ActivityCategory; label: string; count: number } | null
  streakCurrent: number
  xpEarned: number
  dailyCounts: number[]
  message: string
}

const DAY_NAMES = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']

function getWeekRange(now: Date): { start: Date; end: Date; label: string } {
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)

  const fmt = (d: Date) => `${d.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()]}`

  return { start, end, label: `${fmt(start)} – ${fmt(end)}` }
}

function pickMessage(totalEvents: number, activeDays: number, streakCurrent: number): string {
  if (totalEvents === 0) return 'Bu hafta henüz bir adım atmadın. Tek bir kayıtla başlayabilirsin.'
  if (streakCurrent >= 7) return `${streakCurrent} gündür kesintisiz devam ediyorsun. Bu istikrar güçlü bir erdem.`
  if (activeDays >= 6) return 'Neredeyse her gün aktiftin. Bu tutarlılık fark yaratıyor.'
  if (activeDays >= 4) return 'Haftanın büyük bölümünde aktiftin. Biraz daha düzenlilik seni üst seviyeye taşır.'
  if (activeDays >= 2) return 'İyi bir başlangıç. Her gün küçük bir adım, büyük bir yolculuk oluşturur.'
  return 'Tek bir gün bile kayıt bıraktın — bu önemli bir ilk adım.'
}

export function buildWeeklySummary(
  events: ActivityEvent[],
  streakCurrent: number,
  now = new Date(),
): WeeklySummary {
  const { start, end, label } = getWeekRange(now)

  const weekEvents = events.filter(e => {
    const d = new Date(e.createdAt)
    return d >= start && d <= end
  })

  const activeDaysSet = new Set<string>()
  const catCounts = new Map<ActivityCategory, number>()
  let xpEarned = 0

  for (const e of weekEvents) {
    activeDaysSet.add(dayKey(e.createdAt))
    catCounts.set(e.category, (catCounts.get(e.category) ?? 0) + 1)
    xpEarned += e.xp
  }

  let topCategory: WeeklySummary['topCategory'] = null
  let maxCount = 0
  for (const [cat, count] of catCounts) {
    if (count > maxCount) {
      maxCount = count
      const meta = CATEGORY_META[cat]
      topCategory = { category: cat, label: meta?.label ?? cat, count }
    }
  }

  const dailyCounts: number[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const key = dayKey(d)
    dailyCounts.push(weekEvents.filter(e => dayKey(e.createdAt) === key).length)
  }

  return {
    weekLabel: label,
    totalEvents: weekEvents.length,
    activeDays: activeDaysSet.size,
    topCategory,
    streakCurrent,
    xpEarned,
    dailyCounts,
    message: pickMessage(weekEvents.length, activeDaysSet.size, streakCurrent),
  }
}

export function summaryToText(summary: WeeklySummary): string {
  const lines = [
    `📊 SAH World — Haftalık Özet`,
    `📅 ${summary.weekLabel}`,
    ``,
    `✅ ${summary.totalEvents} kayıt · ${summary.activeDays}/7 aktif gün`,
    summary.topCategory ? `🏆 En aktif: ${summary.topCategory.label} (${summary.topCategory.count})` : '',
    `🔥 Seri: ${summary.streakCurrent} gün`,
    `⭐ ${summary.xpEarned} XP kazanıldı`,
    ``,
    `📈 ${DAY_NAMES.map((d, i) => `${d}:${summary.dailyCounts[i] || '·'}`).join(' ')}`,
    ``,
    summary.message,
  ]
  return lines.filter(Boolean).join('\n')
}
