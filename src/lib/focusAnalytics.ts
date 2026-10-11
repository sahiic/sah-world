import type { FocusSession } from '@/types/focus'

export interface HourlyPattern {
  hour: number
  sessions: number
  totalMinutes: number
  avgMinutes: number
}

export interface QualityDataPoint {
  date: string
  sessions: number
  completionRate: number
}

export interface TagBreakdown {
  tag: string
  sessions: number
  totalMinutes: number
}

export interface FocusAnalytics {
  hourlyPatterns: HourlyPattern[]
  bestHour: number | null
  qualityTrend: QualityDataPoint[]
  tagBreakdown: TagBreakdown[]
  completionRate: number
  averageSessionMinutes: number
  totalLifetimeMinutes: number
  totalSessions: number
  longestSessionMinutes: number
  productivityScore: number
}

function getHour(dateStr: string): number {
  return new Date(dateStr).getHours()
}

function dayKey(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function computeFocusAnalytics(sessions: FocusSession[]): FocusAnalytics {
  const focusSessions = sessions.filter(s => s.mode === 'focus')
  const completed = focusSessions.filter(s => s.completed)

  if (!focusSessions.length) {
    return {
      hourlyPatterns: [],
      bestHour: null,
      qualityTrend: [],
      tagBreakdown: [],
      completionRate: 0,
      averageSessionMinutes: 0,
      totalLifetimeMinutes: 0,
      totalSessions: 0,
      longestSessionMinutes: 0,
      productivityScore: 0,
    }
  }

  const hourMap = new Map<number, { sessions: number; totalMinutes: number }>()
  for (const s of completed) {
    const h = getHour(s.startTime)
    const prev = hourMap.get(h) ?? { sessions: 0, totalMinutes: 0 }
    hourMap.set(h, { sessions: prev.sessions + 1, totalMinutes: prev.totalMinutes + s.duration })
  }

  const hourlyPatterns: HourlyPattern[] = []
  for (let h = 0; h < 24; h++) {
    const data = hourMap.get(h)
    if (data) {
      hourlyPatterns.push({
        hour: h,
        sessions: data.sessions,
        totalMinutes: data.totalMinutes,
        avgMinutes: Math.round(data.totalMinutes / data.sessions),
      })
    }
  }

  let bestHour: number | null = null
  let bestCount = 0
  for (const p of hourlyPatterns) {
    if (p.sessions > bestCount) { bestCount = p.sessions; bestHour = p.hour }
  }

  const dayMap = new Map<string, { total: number; completed: number }>()
  for (const s of focusSessions) {
    const key = dayKey(s.startTime)
    const prev = dayMap.get(key) ?? { total: 0, completed: 0 }
    dayMap.set(key, { total: prev.total + 1, completed: prev.completed + (s.completed ? 1 : 0) })
  }

  const qualityTrend: QualityDataPoint[] = [...dayMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, data]) => ({
      date,
      sessions: data.total,
      completionRate: Math.round((data.completed / data.total) * 100),
    }))

  const tagMap = new Map<string, { sessions: number; totalMinutes: number }>()
  for (const s of completed) {
    for (const tag of s.tags.length ? s.tags : ['Etiketsiz']) {
      const prev = tagMap.get(tag) ?? { sessions: 0, totalMinutes: 0 }
      tagMap.set(tag, { sessions: prev.sessions + 1, totalMinutes: prev.totalMinutes + s.duration })
    }
  }

  const tagBreakdown = [...tagMap.entries()]
    .map(([tag, data]) => ({ tag, ...data }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 8)

  const totalMinutes = completed.reduce((sum, s) => sum + s.duration, 0)
  const completionRate = Math.round((completed.length / focusSessions.length) * 100)
  const avgSession = Math.round(totalMinutes / completed.length)
  const longest = Math.max(0, ...completed.map(s => s.duration))

  const consistencyBonus = Math.min(1, dayMap.size / 14)
  const completionBonus = completionRate / 100
  const volumeBonus = Math.min(1, totalMinutes / 600)
  const productivityScore = Math.round((consistencyBonus * 35 + completionBonus * 35 + volumeBonus * 30))

  return {
    hourlyPatterns,
    bestHour,
    qualityTrend,
    tagBreakdown,
    completionRate,
    averageSessionMinutes: avgSession,
    totalLifetimeMinutes: totalMinutes,
    totalSessions: completed.length,
    longestSessionMinutes: longest,
    productivityScore,
  }
}

export function formatHour(hour: number): string {
  if (hour === 0) return '00:00'
  return `${String(hour).padStart(2, '0')}:00`
}

export function getProductivityLabel(score: number): { label: string; message: string } {
  if (score >= 80) return { label: 'Mükemmel', message: 'Odak alışkanlığın çok güçlü. Aynı istikrarla devam et.' }
  if (score >= 60) return { label: 'İyi', message: 'Düzenli odaklanıyorsun. Biraz daha tutarlılık seni üst seviyeye taşır.' }
  if (score >= 40) return { label: 'Gelişiyor', message: 'Temeli atıyorsun. Kısa ama düzenli oturumlar daha etkili.' }
  if (score >= 20) return { label: 'Başlangıç', message: 'İlk adımlar önemli. Her gün tek bir odak oturumu alışkanlık oluşturur.' }
  return { label: 'Keşif', message: 'Henüz yeterli veri yok. Birkaç oturum tamamla, analizler şekillensin.' }
}
