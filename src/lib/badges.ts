import type { ActivitySource, ActivityCategory } from '@/lib/activity'
import type { GlobalStreaks } from '@/lib/streaks'
import type { BadgeDef } from '@/types'

export interface BadgeRule extends BadgeDef {
  tier: 'bronze' | 'silver' | 'gold'
  category: ActivityCategory | 'general'
  check: (source: ActivitySource, streaks: GlobalStreaks) => boolean
  progress: (source: ActivitySource, streaks: GlobalStreaks) => { current: number; target: number }
}

export interface EarnedBadge {
  badge: BadgeRule
  earned: true
}

export interface LockedBadge {
  badge: BadgeRule
  earned: false
  current: number
  target: number
}

export type BadgeStatus = EarnedBadge | LockedBadge

const ALL_BADGES: BadgeRule[] = [
  // --- Journal ---
  {
    id: 'first_journal', name: 'İlk Satır', desc: 'İlk günlük kaydını oluştur',
    icon: 'pencil', tier: 'bronze', category: 'journal',
    check: (s) => s.journal.length >= 1,
    progress: (s) => ({ current: Math.min(s.journal.length, 1), target: 1 }),
  },
  {
    id: 'journal_10', name: 'Kalem Yoldaşı', desc: '10 günlük kaydı tamamla',
    icon: 'notebook', tier: 'bronze', category: 'journal',
    check: (s) => s.journal.length >= 10,
    progress: (s) => ({ current: Math.min(s.journal.length, 10), target: 10 }),
  },
  {
    id: 'journal_30', name: 'Günlük Hafızası', desc: '30 günlük kaydı tamamla',
    icon: 'notebook', tier: 'silver', category: 'journal',
    check: (s) => s.journal.length >= 30,
    progress: (s) => ({ current: Math.min(s.journal.length, 30), target: 30 }),
  },
  {
    id: 'journal_100', name: 'Yüz Gün Hatırası', desc: '100 günlük kaydı tamamla',
    icon: 'notebook', tier: 'gold', category: 'journal',
    check: (s) => s.journal.length >= 100,
    progress: (s) => ({ current: Math.min(s.journal.length, 100), target: 100 }),
  },
  {
    id: 'morning_ritual', name: 'Sabah Niyetçisi', desc: '10 sabah niyeti kaydet',
    icon: 'sunrise', tier: 'silver', category: 'journal',
    check: (s) => s.journal.filter(j => j.ritualType === 'sabah').length >= 10,
    progress: (s) => ({ current: Math.min(s.journal.filter(j => j.ritualType === 'sabah').length, 10), target: 10 }),
  },

  // --- Focus ---
  {
    id: 'first_focus', name: 'İlk Odak', desc: 'İlk odak oturumunu tamamla',
    icon: 'target-arrow', tier: 'bronze', category: 'focus',
    check: (s) => s.focusSessions.filter(f => f.completed).length >= 1,
    progress: (s) => ({ current: Math.min(s.focusSessions.filter(f => f.completed).length, 1), target: 1 }),
  },
  {
    id: 'focus_hours_10', name: '10 Saat Odak', desc: 'Toplam 10 saat odaklan',
    icon: 'hourglass', tier: 'silver', category: 'focus',
    check: (s) => totalFocusHours(s) >= 10,
    progress: (s) => ({ current: Math.min(Math.floor(totalFocusHours(s)), 10), target: 10 }),
  },
  {
    id: 'focus_hours_50', name: '50 Saat Ustası', desc: 'Toplam 50 saat odaklan',
    icon: 'hourglass-high', tier: 'gold', category: 'focus',
    check: (s) => totalFocusHours(s) >= 50,
    progress: (s) => ({ current: Math.min(Math.floor(totalFocusHours(s)), 50), target: 50 }),
  },

  // --- Quran ---
  {
    id: 'first_quran', name: 'İlk Tefekkür', desc: 'İlk Kur\'an notunu yaz',
    icon: 'book-2', tier: 'bronze', category: 'quran',
    check: (s) => s.quranNotes.length >= 1,
    progress: (s) => ({ current: Math.min(s.quranNotes.length, 1), target: 1 }),
  },
  {
    id: 'kuran_dostu', name: 'Kur\'an Dostu', desc: '10 Kur\'an tefsir notu gir',
    icon: 'book-2', tier: 'silver', category: 'quran',
    check: (s) => s.quranNotes.length >= 10,
    progress: (s) => ({ current: Math.min(s.quranNotes.length, 10), target: 10 }),
  },
  {
    id: 'kuran_yoldasi', name: 'Kur\'an Yoldaşı', desc: '30 Kur\'an tefsir notu gir',
    icon: 'book-2', tier: 'gold', category: 'quran',
    check: (s) => s.quranNotes.length >= 30,
    progress: (s) => ({ current: Math.min(s.quranNotes.length, 30), target: 30 }),
  },

  // --- Hadis ---
  {
    id: 'hadis_alimi', name: 'Hadis Âlimi', desc: '10 hadis notu gir',
    icon: 'quote', tier: 'silver', category: 'hadis',
    check: (s) => s.hadisNotes.length >= 10,
    progress: (s) => ({ current: Math.min(s.hadisNotes.length, 10), target: 10 }),
  },

  // --- Şükür ---
  {
    id: 'sukur_ehli', name: 'Şükür Ehli', desc: '20 şükür kaydı oluştur',
    icon: 'sparkles', tier: 'silver', category: 'sukur',
    check: (s) => s.sukurList.length >= 20,
    progress: (s) => ({ current: Math.min(s.sukurList.length, 20), target: 20 }),
  },

  // --- Mescidim ---
  {
    id: 'zikir_halkasi', name: 'Zikir Halkası', desc: '500 zikir tamamla',
    icon: 'circle-dotted', tier: 'silver', category: 'mescidim',
    check: (s) => s.totalZikir >= 500,
    progress: (s) => ({ current: Math.min(s.totalZikir, 500), target: 500 }),
  },
  {
    id: 'zikir_deryasi', name: 'Zikir Deryası', desc: '3000 zikir tamamla',
    icon: 'circle-dotted', tier: 'gold', category: 'mescidim',
    check: (s) => s.totalZikir >= 3000,
    progress: (s) => ({ current: Math.min(s.totalZikir, 3000), target: 3000 }),
  },

  // --- Matrix ---
  {
    id: 'eisen_master', name: 'Zaman Mimarı', desc: '15 görev tamamla',
    icon: 'layout-grid', tier: 'silver', category: 'matrix',
    check: (s) => Object.values(s.eisenhower).flat().filter(t => t.done).length >= 15,
    progress: (s) => ({ current: Math.min(Object.values(s.eisenhower).flat().filter(t => t.done).length, 15), target: 15 }),
  },

  // --- Lessons ---
  {
    id: 'ders_ustasi', name: 'Ders Ustası', desc: '10 hata ve ders kaydı oluştur',
    icon: 'bulb', tier: 'silver', category: 'lessons',
    check: (s) => s.lessons.length >= 10,
    progress: (s) => ({ current: Math.min(s.lessons.length, 10), target: 10 }),
  },

  // --- Streak ---
  {
    id: 'streak_7', name: '7 Gün Sebat', desc: '7 gün kesintisiz yolculuk',
    icon: 'flame', tier: 'bronze', category: 'general',
    check: (_, st) => st.overall.longest >= 7,
    progress: (_, st) => ({ current: Math.min(st.overall.current, 7), target: 7 }),
  },
  {
    id: 'streak_21', name: '21 Gün Alışkanlık', desc: '21 gün kesintisiz yolculuk',
    icon: 'flame', tier: 'silver', category: 'general',
    check: (_, st) => st.overall.longest >= 21,
    progress: (_, st) => ({ current: Math.min(st.overall.current, 21), target: 21 }),
  },
  {
    id: 'streak_40', name: '40 Gün Çile', desc: '40 gün kesintisiz yolculuk',
    icon: 'flame', tier: 'gold', category: 'general',
    check: (_, st) => st.overall.longest >= 40,
    progress: (_, st) => ({ current: Math.min(st.overall.current, 40), target: 40 }),
  },

  // --- Cross-module ---
  {
    id: 'cok_yonlu', name: 'Çok Yönlü', desc: 'Tek haftada 4 farklı alanda aktif ol',
    icon: 'hexagon', tier: 'silver', category: 'general',
    check: (_, st) => {
      const active = Object.values(st.byCategory).filter(s => s && s.current > 0)
      return active.length >= 4
    },
    progress: (_, st) => {
      const active = Object.values(st.byCategory).filter(s => s && s.current > 0).length
      return { current: Math.min(active, 4), target: 4 }
    },
  },
  {
    id: 'first_step', name: 'İlk Adım', desc: 'Platformda ilk kaydını oluştur',
    icon: 'shoe', tier: 'bronze', category: 'general',
    check: (s) => s.journal.length + s.quranNotes.length + s.hadisNotes.length +
      s.sukurList.length + s.lessons.length + s.focusSessions.length > 0,
    progress: (s) => {
      const total = s.journal.length + s.quranNotes.length + s.hadisNotes.length +
        s.sukurList.length + s.lessons.length + s.focusSessions.length
      return { current: Math.min(total, 1), target: 1 }
    },
  },
]

function totalFocusHours(source: ActivitySource): number {
  return source.focusSessions
    .filter(f => f.completed || f.actualDurationSeconds >= 600)
    .reduce((sum, f) => sum + f.actualDurationSeconds, 0) / 3600
}

export function getAllBadges(): BadgeRule[] {
  return ALL_BADGES
}

export function evaluateBadges(source: ActivitySource, streaks: GlobalStreaks): BadgeStatus[] {
  return ALL_BADGES.map(badge => {
    const earned = badge.check(source, streaks)
    if (earned) return { badge, earned: true as const }
    const { current, target } = badge.progress(source, streaks)
    return { badge, earned: false as const, current, target }
  })
}

export function getNewlyEarned(prev: BadgeStatus[], next: BadgeStatus[]): EarnedBadge[] {
  const prevEarned = new Set(prev.filter(b => b.earned).map(b => b.badge.id))
  return next.filter((b): b is EarnedBadge => b.earned && !prevEarned.has(b.badge.id))
}
