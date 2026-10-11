import type { ActivityEvent, ActivityCategory } from '@/lib/activity'
import { CATEGORY_META, dayKey } from '@/lib/activity'
import type { JournalEntry, QuranNote, HadisNote, LessonEntry, SukurEntry } from '@/types'

export interface ExportOptions {
  format: 'json' | 'text'
  sections: ExportSection[]
}

export type ExportSection =
  | 'journal'
  | 'quran'
  | 'hadis'
  | 'lessons'
  | 'sukur'
  | 'activity'
  | 'stats'

export interface ExportData {
  exportDate: string
  version: string
  sections: Partial<Record<ExportSection, unknown>>
}

export interface ExportSource {
  journal: JournalEntry[]
  quranNotes: QuranNote[]
  hadisNotes: HadisNote[]
  lessons: LessonEntry[]
  sukurList: SukurEntry[]
  events: ActivityEvent[]
  xp: number
  streakCurrent: number
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function buildStats(source: ExportSource) {
  const categoryCount: Partial<Record<ActivityCategory, number>> = {}
  for (const e of source.events) {
    categoryCount[e.category] = (categoryCount[e.category] ?? 0) + 1
  }

  const activeDays = new Set(source.events.map(e => dayKey(e.createdAt))).size

  return {
    totalEvents: source.events.length,
    totalXP: source.xp,
    currentStreak: source.streakCurrent,
    activeDays,
    categoryCounts: Object.entries(categoryCount).map(([cat, count]) => ({
      category: cat,
      label: CATEGORY_META[cat as ActivityCategory]?.label ?? cat,
      count,
    })),
  }
}

export function buildExportData(
  source: ExportSource,
  sections: ExportSection[],
): ExportData {
  const data: ExportData = {
    exportDate: new Date().toISOString(),
    version: '1.0',
    sections: {},
  }

  for (const section of sections) {
    switch (section) {
      case 'journal':
        data.sections.journal = source.journal.map(j => ({
          id: j.id,
          content: j.content,
          mood: j.mood,
          createdAt: j.createdAt,
        }))
        break
      case 'quran':
        data.sections.quran = source.quranNotes.map(q => ({
          id: q.id,
          sure: q.sure,
          ayet: q.ayet,
          tefsir: q.tefsir,
          ders: q.ders,
          createdAt: q.createdAt,
        }))
        break
      case 'hadis':
        data.sections.hadis = source.hadisNotes.map(h => ({
          id: h.id,
          konu: h.konu,
          metin: h.metin,
          kaynak: h.kaynak,
          uygulama: h.uygulama,
          createdAt: h.createdAt,
        }))
        break
      case 'lessons':
        data.sections.lessons = source.lessons.map(l => ({
          id: l.id,
          title: l.title,
          wrong: l.wrong,
          learned: l.learned,
          createdAt: l.createdAt,
        }))
        break
      case 'sukur':
        data.sections.sukur = source.sukurList.map(s => ({
          id: s.id,
          text: s.text,
          nimets: s.nimets,
          createdAt: s.createdAt,
        }))
        break
      case 'activity':
        data.sections.activity = source.events.slice(0, 500).map(e => ({
          category: e.category,
          label: e.label,
          detail: e.detail,
          xp: e.xp,
          createdAt: e.createdAt,
        }))
        break
      case 'stats':
        data.sections.stats = buildStats(source)
        break
    }
  }

  return data
}

export function exportToJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

export function exportToText(data: ExportData): string {
  const lines: string[] = [
    '═══════════════════════════════════════',
    '  SAH World — Veri Dışa Aktarma',
    `  ${formatDate(data.exportDate)}`,
    '═══════════════════════════════════════',
    '',
  ]

  if (data.sections.stats) {
    const stats = data.sections.stats as ReturnType<typeof buildStats>
    lines.push('📊 GENEL İSTATİSTİKLER')
    lines.push('───────────────────────')
    lines.push(`Toplam kayıt: ${stats.totalEvents}`)
    lines.push(`Toplam XP: ${stats.totalXP}`)
    lines.push(`Aktif gün: ${stats.activeDays}`)
    lines.push(`Mevcut seri: ${stats.currentStreak} gün`)
    if (stats.categoryCounts.length) {
      lines.push('')
      lines.push('Kategori dağılımı:')
      for (const c of stats.categoryCounts) {
        lines.push(`  • ${c.label}: ${c.count}`)
      }
    }
    lines.push('')
  }

  if (data.sections.journal) {
    const entries = data.sections.journal as Array<{ content: string; mood?: string; createdAt: string }>
    lines.push(`📓 GÜNLÜK (${entries.length} kayıt)`)
    lines.push('───────────────────────')
    for (const e of entries) {
      lines.push(`[${formatDate(e.createdAt)}]${e.mood ? ` (${e.mood})` : ''}`)
      lines.push(e.content || '(boş)')
      lines.push('')
    }
  }

  if (data.sections.quran) {
    const notes = data.sections.quran as Array<{ sure?: string; ayet?: string; tefsir?: string; ders?: string; createdAt: string }>
    lines.push(`📖 KUR'AN NOTLARI (${notes.length} kayıt)`)
    lines.push('───────────────────────')
    for (const n of notes) {
      lines.push(`[${formatDate(n.createdAt)}] ${n.sure || ''} ${n.ayet || ''}`)
      if (n.tefsir) lines.push(`  Tefsir: ${n.tefsir}`)
      if (n.ders) lines.push(`  Ders: ${n.ders}`)
      lines.push('')
    }
  }

  if (data.sections.hadis) {
    const notes = data.sections.hadis as Array<{ konu?: string; metin?: string; kaynak?: string; uygulama?: string; createdAt: string }>
    lines.push(`📜 HADİS NOTLARI (${notes.length} kayıt)`)
    lines.push('───────────────────────')
    for (const h of notes) {
      lines.push(`[${formatDate(h.createdAt)}] ${h.konu || 'Hadis notu'}`)
      if (h.metin) lines.push(`  "${h.metin}"`)
      if (h.kaynak) lines.push(`  Kaynak: ${h.kaynak}`)
      if (h.uygulama) lines.push(`  Uygulama: ${h.uygulama}`)
      lines.push('')
    }
  }

  if (data.sections.lessons) {
    const entries = data.sections.lessons as Array<{ title?: string; wrong?: string; learned?: string; createdAt: string }>
    lines.push(`📝 HATALAR VE DERSLER (${entries.length} kayıt)`)
    lines.push('───────────────────────')
    for (const l of entries) {
      lines.push(`[${formatDate(l.createdAt)}] ${l.title || 'Ders kaydı'}`)
      if (l.wrong) lines.push(`  Hata: ${l.wrong}`)
      if (l.learned) lines.push(`  Ders: ${l.learned}`)
      lines.push('')
    }
  }

  if (data.sections.sukur) {
    const entries = data.sections.sukur as Array<{ text?: string; nimets?: string[]; createdAt: string }>
    lines.push(`✨ ŞÜKÜR KAYITLARI (${entries.length} kayıt)`)
    lines.push('───────────────────────')
    for (const s of entries) {
      lines.push(`[${formatDate(s.createdAt)}] ${s.text || ''}`)
      if (s.nimets?.length) lines.push(`  Nimetler: ${s.nimets.join(', ')}`)
      lines.push('')
    }
  }

  lines.push('═══════════════════════════════════════')
  lines.push('  SAH World — sah-world.vercel.app')
  lines.push('═══════════════════════════════════════')

  return lines.join('\n')
}

export const ALL_SECTIONS: ExportSection[] = [
  'stats', 'journal', 'quran', 'hadis', 'lessons', 'sukur', 'activity',
]

export const SECTION_META: Record<ExportSection, { label: string; icon: string }> = {
  stats: { label: 'Genel İstatistikler', icon: 'chart-bar' },
  journal: { label: 'Günlük Kayıtları', icon: 'notebook' },
  quran: { label: 'Kur\'an Notları', icon: 'book-2' },
  hadis: { label: 'Hadis Notları', icon: 'quote' },
  lessons: { label: 'Hatalar ve Dersler', icon: 'history' },
  sukur: { label: 'Şükür Kayıtları', icon: 'sparkles' },
  activity: { label: 'Aktivite Akışı', icon: 'activity' },
}
