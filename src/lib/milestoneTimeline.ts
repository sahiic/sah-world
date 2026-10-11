import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { CATEGORY_META, dayKey } from '@/lib/activity'

export interface Milestone {
  id: string
  icon: string
  title: string
  description: string
  date: string
  category: 'general' | ActivityCategory
}

interface MilestoneContext {
  events: ActivityEvent[]
  xp: number
  streakLongest: number
}

interface MilestoneRule {
  id: string
  icon: string
  title: string
  category: 'general' | ActivityCategory
  describe: (date: string) => string
  detect: (ctx: MilestoneContext) => string | null
}

function nthEvent(events: ActivityEvent[], category: ActivityCategory, n: number): string | null {
  const filtered = [...events]
    .filter(e => e.category === category)
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  return filtered.length >= n ? dayKey(filtered[n - 1].createdAt) : null
}

function xpMilestone(events: ActivityEvent[], threshold: number): string | null {
  const sorted = [...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  let total = 0
  for (const e of sorted) {
    total += e.xp
    if (total >= threshold) return dayKey(e.createdAt)
  }
  return null
}

function totalActiveDaysMilestone(events: ActivityEvent[], threshold: number): string | null {
  const sorted = [...events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
  const seen = new Set<string>()
  for (const e of sorted) {
    seen.add(dayKey(e.createdAt))
    if (seen.size >= threshold) return dayKey(e.createdAt)
  }
  return null
}

const RULES: MilestoneRule[] = [
  {
    id: 'first-entry',
    icon: 'shoe',
    title: 'İlk Adım',
    category: 'general',
    describe: (d) => `${d} tarihinde ilk kaydını oluşturdun`,
    detect: (ctx) => {
      if (!ctx.events.length) return null
      const sorted = [...ctx.events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      return dayKey(sorted[0].createdAt)
    },
  },
  {
    id: 'first-journal',
    icon: 'notebook',
    title: 'İlk Günlük',
    category: 'journal',
    describe: (d) => `${d} — ilk günlük kaydını yazdın`,
    detect: (ctx) => nthEvent(ctx.events, 'journal', 1),
  },
  {
    id: 'first-quran',
    icon: 'book-2',
    title: 'İlk Tefekkür',
    category: 'quran',
    describe: (d) => `${d} — ilk Kuran notunu aldın`,
    detect: (ctx) => nthEvent(ctx.events, 'quran', 1),
  },
  {
    id: 'first-hadis',
    icon: 'quote',
    title: 'İlk Hadis Dersi',
    category: 'hadis',
    describe: (d) => `${d} — ilk hadis notunu kaydettin`,
    detect: (ctx) => nthEvent(ctx.events, 'hadis', 1),
  },
  {
    id: 'first-focus',
    icon: 'target-arrow',
    title: 'İlk Odak',
    category: 'focus',
    describe: (d) => `${d} — ilk odak oturumunu tamamladın`,
    detect: (ctx) => nthEvent(ctx.events, 'focus', 1),
  },
  {
    id: 'first-sukur',
    icon: 'sparkles',
    title: 'İlk Şükür',
    category: 'sukur',
    describe: (d) => `${d} — ilk şükür kaydını oluşturdun`,
    detect: (ctx) => nthEvent(ctx.events, 'sukur', 1),
  },
  {
    id: 'journal-10',
    icon: 'notebook',
    title: '10 Günlük',
    category: 'journal',
    describe: (d) => `${d} — 10. günlük kaydına ulaştın`,
    detect: (ctx) => nthEvent(ctx.events, 'journal', 10),
  },
  {
    id: 'quran-10',
    icon: 'book-2',
    title: '10 Kuran Notu',
    category: 'quran',
    describe: (d) => `${d} — 10 Kuran tefekkür notuna ulaştın`,
    detect: (ctx) => nthEvent(ctx.events, 'quran', 10),
  },
  {
    id: 'focus-10',
    icon: 'target-arrow',
    title: '10 Odak Oturumu',
    category: 'focus',
    describe: (d) => `${d} — 10 odak oturumu tamamladın`,
    detect: (ctx) => nthEvent(ctx.events, 'focus', 10),
  },
  {
    id: 'sukur-20',
    icon: 'heart',
    title: '20 Şükür',
    category: 'sukur',
    describe: (d) => `${d} — 20 şükür kaydına ulaştın`,
    detect: (ctx) => nthEvent(ctx.events, 'sukur', 20),
  },
  {
    id: 'total-50',
    icon: 'star',
    title: '50 Kayıt',
    category: 'general',
    describe: (d) => `${d} — toplam 50 kayda ulaştın`,
    detect: (ctx) => {
      const sorted = [...ctx.events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      return sorted.length >= 50 ? dayKey(sorted[49].createdAt) : null
    },
  },
  {
    id: 'total-100',
    icon: 'trophy',
    title: '100 Kayıt',
    category: 'general',
    describe: (d) => `${d} — toplam 100 kayda ulaştın`,
    detect: (ctx) => {
      const sorted = [...ctx.events].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
      return sorted.length >= 100 ? dayKey(sorted[99].createdAt) : null
    },
  },
  {
    id: 'xp-500',
    icon: 'bolt',
    title: '500 XP',
    category: 'general',
    describe: (d) => `${d} — 500 XP barajını aştın`,
    detect: (ctx) => xpMilestone(ctx.events, 500),
  },
  {
    id: 'xp-2000',
    icon: 'bolt',
    title: '2000 XP',
    category: 'general',
    describe: (d) => `${d} — 2000 XP'ye ulaştın`,
    detect: (ctx) => xpMilestone(ctx.events, 2000),
  },
  {
    id: 'xp-5000',
    icon: 'crown',
    title: '5000 XP',
    category: 'general',
    describe: (d) => `${d} — 5000 XP seviyesine ulaştın`,
    detect: (ctx) => xpMilestone(ctx.events, 5000),
  },
  {
    id: 'active-7',
    icon: 'calendar-check',
    title: '7 Aktif Gün',
    category: 'general',
    describe: (d) => `${d} — 7 farklı günde aktif oldun`,
    detect: (ctx) => totalActiveDaysMilestone(ctx.events, 7),
  },
  {
    id: 'active-30',
    icon: 'calendar-star',
    title: '30 Aktif Gün',
    category: 'general',
    describe: (d) => `${d} — 30 farklı günde aktif oldun`,
    detect: (ctx) => totalActiveDaysMilestone(ctx.events, 30),
  },
  {
    id: 'streak-7',
    icon: 'flame',
    title: '7 Gün Serisi',
    category: 'general',
    describe: () => '7 gün kesintisiz aktif kaldın',
    detect: (ctx) => ctx.streakLongest >= 7 ? 'streak' : null,
  },
  {
    id: 'streak-30',
    icon: 'flame',
    title: '30 Gün Serisi',
    category: 'general',
    describe: () => '30 gün kesintisiz aktif kaldın — muhteşem!',
    detect: (ctx) => ctx.streakLongest >= 30 ? 'streak' : null,
  },
]

function formatDateTR(dateStr: string): string {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
  const [y, m, d] = dateStr.split('-').map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

export function detectMilestones(
  events: ActivityEvent[],
  xp: number,
  streakLongest: number,
): Milestone[] {
  const ctx: MilestoneContext = { events, xp, streakLongest }
  const milestones: Milestone[] = []

  for (const rule of RULES) {
    const dateResult = rule.detect(ctx)
    if (dateResult) {
      const dateDisplay = dateResult === 'streak' ? '' : formatDateTR(dateResult)
      milestones.push({
        id: rule.id,
        icon: rule.icon,
        title: rule.title,
        description: rule.describe(dateDisplay),
        date: dateResult === 'streak' ? '' : dateResult,
        category: rule.category,
      })
    }
  }

  return milestones.sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date.localeCompare(b.date)
  })
}

export function getMilestoneRuleCount(): number {
  return RULES.length
}
