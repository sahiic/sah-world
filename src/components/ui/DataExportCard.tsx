'use client'

import { useCallback, useMemo, useState } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { computeGlobalStreaks } from '@/lib/streaks'
import {
  ALL_SECTIONS,
  SECTION_META,
  buildExportData,
  exportToJSON,
  exportToText,
  type ExportSection,
} from '@/lib/dataExport'

type Format = 'json' | 'text'

export default function DataExportCard() {
  const store = useJourneyStore()
  const [selected, setSelected] = useState<Set<ExportSection>>(new Set(ALL_SECTIONS))
  const [format, setFormat] = useState<Format>('text')
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const source = useMemo(() => {
    const actSource: ActivitySource = {
      journal: store.journal,
      quranNotes: store.quranNotes,
      hadisNotes: store.hadisNotes,
      eisenhower: store.eisenhower,
      lessons: store.lessons,
      sukurList: store.sukurList,
      totalZikir: store.totalZikir,
      focusSessions: store.focusSessions,
    }
    const events = buildActivityFeed(actSource)
    const streaks = computeGlobalStreaks(events)
    return {
      journal: store.journal,
      quranNotes: store.quranNotes,
      hadisNotes: store.hadisNotes,
      lessons: store.lessons,
      sukurList: store.sukurList,
      events,
      xp: store.xp,
      streakCurrent: streaks.overall.current,
    }
  }, [store])

  const toggle = useCallback((section: ExportSection) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === ALL_SECTIONS.length ? new Set<ExportSection>() : new Set(ALL_SECTIONS),
    )
  }, [])

  const handleExport = useCallback(async () => {
    if (!selected.size) return
    const data = buildExportData(source, [...selected])
    const output = format === 'json' ? exportToJSON(data) : exportToText(data)

    try {
      await navigator.clipboard.writeText(output)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2500)
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }, [source, selected, format])

  return (
    <div className="de-card">
      <header className="de-header">
        <div>
          <span className="de-eyebrow">VERİ DIŞA AKTARMA</span>
          <h3>Yolculuğunu Kaydet</h3>
        </div>
        <AppIcon name="download" />
      </header>

      <div className="de-format-row">
        <button
          className={`de-format-btn ${format === 'text' ? 'active' : ''}`}
          onClick={() => setFormat('text')}
        >
          <AppIcon name="file-text" /> Metin
        </button>
        <button
          className={`de-format-btn ${format === 'json' ? 'active' : ''}`}
          onClick={() => setFormat('json')}
        >
          <AppIcon name="braces" /> JSON
        </button>
      </div>

      <div className="de-sections">
        <button className="de-toggle-all" onClick={toggleAll}>
          {selected.size === ALL_SECTIONS.length ? 'Tümünü kaldır' : 'Tümünü seç'}
        </button>
        {ALL_SECTIONS.map(s => (
          <label key={s} className={`de-section-item ${selected.has(s) ? 'checked' : ''}`}>
            <input
              type="checkbox"
              checked={selected.has(s)}
              onChange={() => toggle(s)}
            />
            <AppIcon name={SECTION_META[s].icon} />
            <span>{SECTION_META[s].label}</span>
          </label>
        ))}
      </div>

      <button
        className="de-export-btn"
        onClick={handleExport}
        disabled={!selected.size}
      >
        <AppIcon name={status === 'copied' ? 'check' : status === 'error' ? 'alert-circle' : 'clipboard'} />
        {status === 'copied' ? 'Panoya kopyalandı!' : status === 'error' ? 'Kopyalanamadı' : 'Panoya kopyala'}
      </button>

      <p className="de-hint">
        Veriler cihazında saklanır. Dışa aktarma panoya kopyalar, hiçbir yere göndermez.
      </p>
    </div>
  )
}
