import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { CATEGORY_META, dayKey } from '@/lib/activity'

export interface Challenge {
  id: string
  category: ActivityCategory
  icon: string
  title: string
  description: string
  checkCompleted: (todayEvents: ActivityEvent[]) => boolean
}

const CHALLENGE_POOL: Omit<Challenge, 'id'>[] = [
  {
    category: 'journal',
    icon: 'notebook',
    title: 'Günlük yaz',
    description: 'Bugün bir günlük kaydı oluştur',
    checkCompleted: (events) => events.some(e => e.category === 'journal'),
  },
  {
    category: 'quran',
    icon: 'book-2',
    title: 'Kuran tefekkürü',
    description: 'Bir ayet üzerine not al',
    checkCompleted: (events) => events.some(e => e.category === 'quran'),
  },
  {
    category: 'hadis',
    icon: 'quote',
    title: 'Hadis dersi',
    description: 'Bir hadis notu kaydet',
    checkCompleted: (events) => events.some(e => e.category === 'hadis'),
  },
  {
    category: 'sukur',
    icon: 'sparkles',
    title: 'Şükür anı',
    description: 'Bugün şükür edilecek bir nimeti fark et',
    checkCompleted: (events) => events.some(e => e.category === 'sukur'),
  },
  {
    category: 'focus',
    icon: 'target-arrow',
    title: 'Odak oturumu',
    description: 'Bir odak oturumu tamamla',
    checkCompleted: (events) => events.some(e => e.category === 'focus'),
  },
  {
    category: 'matrix',
    icon: 'layout-grid',
    title: 'Görev tamamla',
    description: 'Eisenhower matrisinden bir görev bitir',
    checkCompleted: (events) => events.some(e => e.category === 'matrix'),
  },
  {
    category: 'lessons',
    icon: 'history',
    title: 'Ders çıkar',
    description: 'Bir deneyimden ders kaydet',
    checkCompleted: (events) => events.some(e => e.category === 'lessons'),
  },
  {
    category: 'journal',
    icon: 'sun',
    title: 'Sabah niyeti',
    description: 'Güne niyet belirleyerek başla',
    checkCompleted: (events) => events.some(e => e.category === 'journal' && e.label.includes('Sabah')),
  },
  {
    category: 'journal',
    icon: 'moon',
    title: 'Akşam muhasebesi',
    description: 'Günü muhasebe ile kapat',
    checkCompleted: (events) => events.some(e => e.category === 'journal' && e.label.includes('Akşam')),
  },
  {
    category: 'sukur',
    icon: 'heart',
    title: 'Üç nimet say',
    description: 'Bugün en az 3 şükür kaydı oluştur',
    checkCompleted: (events) => events.filter(e => e.category === 'sukur').length >= 3,
  },
  {
    category: 'quran',
    icon: 'book-2',
    title: 'İki ayet tefekkürü',
    description: 'Bugün en az 2 Kuran notu al',
    checkCompleted: (events) => events.filter(e => e.category === 'quran').length >= 2,
  },
  {
    category: 'focus',
    icon: 'flame',
    title: 'Çift odak',
    description: 'Bugün 2 odak oturumu tamamla',
    checkCompleted: (events) => events.filter(e => e.category === 'focus').length >= 2,
  },
]

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr]
  let s = seed
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function dateSeed(date: Date): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
}

export interface DailyChallengeSummary {
  date: string
  challenges: (Challenge & { completed: boolean })[]
  completedCount: number
  totalCount: number
  allCompleted: boolean
}

export function getDailyChallenges(
  events: ActivityEvent[],
  count = 3,
  now = new Date(),
): DailyChallengeSummary {
  const today = dayKey(now)
  const todayEvents = events.filter(e => dayKey(e.createdAt) === today)

  const seed = dateSeed(now)
  const shuffled = seededShuffle(CHALLENGE_POOL, seed)
  const picked = shuffled.slice(0, Math.min(count, shuffled.length))

  const challenges = picked.map((c, i) => ({
    ...c,
    id: `dc-${today}-${i}`,
    completed: c.checkCompleted(todayEvents),
  }))

  const completedCount = challenges.filter(c => c.completed).length

  return {
    date: today,
    challenges,
    completedCount,
    totalCount: challenges.length,
    allCompleted: completedCount === challenges.length,
  }
}

export function getChallengeMessage(summary: DailyChallengeSummary): string {
  if (summary.totalCount === 0) return ''
  if (summary.allCompleted) return 'Tebrikler! Bugünün tüm görevlerini tamamladın.'
  if (summary.completedCount > 0) return `${summary.completedCount}/${summary.totalCount} görev tamam. Biraz daha gayret!`
  return 'Bugünün görevleri seni bekliyor. Küçük adımlar, büyük yolculuklar.'
}

export function getChallengePool(): Omit<Challenge, 'id'>[] {
  return CHALLENGE_POOL
}
