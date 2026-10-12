'use client'

import { useCallback, useMemo, useState } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { computeGlobalStreaks } from '@/lib/streaks'
import { buildWeeklySummary, summaryToText } from '@/lib/weeklySummary'

export default function WeeklySummaryCard() {
  const store = useJourneyStore()
  const [copied, setCopied] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')

  const summary = useMemo(() => {
    const source: ActivitySource = {
      journal: store.journal,
      quranNotes: store.quranNotes,
      hadisNotes: store.hadisNotes,
      eisenhower: store.eisenhower,
      lessons: store.lessons,
      sukurList: store.sukurList,
      totalZikir: store.totalZikir,
      focusSessions: store.focusSessions,
    }
    const events = buildActivityFeed(source)
    const streaks = computeGlobalStreaks(events)
    return buildWeeklySummary(events, streaks.overall.current)
  }, [store])

  const maxDaily = Math.max(1, ...summary.dailyCounts)

  const handleCopy = useCallback(async () => {
    const text = summaryToText(summary)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setCopyStatus('Haftalık özet panoya kopyalandı.')
      setTimeout(() => setCopied(false), 2000)
    } catch { setCopyStatus('Kopyalanamadı. Tarayıcı pano iznini kontrol edip yeniden dene.') }
  }, [summary])

  return (
    <div className="ws-card">
      <header className="ws-header">
        <div>
          <span className="ws-eyebrow">HAFTALIK ÖZET</span>
          <h3>{summary.weekLabel}</h3>
        </div>
        <button
          className="ws-copy-btn"
          onClick={handleCopy}
          aria-label="Özeti kopyala"
        >
          <AppIcon name={copied ? 'check' : 'copy'} />
          {copied ? 'Kopyalandı' : 'Kopyala'}
        </button>
      </header>
      <p className="sr-only" role="status" aria-live="polite">{copyStatus}</p>

      <div className="ws-stats-row">
        <div className="ws-stat">
          <strong>{summary.totalEvents}</strong>
          <small>Kayıt</small>
        </div>
        <div className="ws-stat">
          <strong>{summary.activeDays}<span>/7</span></strong>
          <small>Aktif gün</small>
        </div>
        <div className="ws-stat">
          <strong>{summary.streakCurrent}</strong>
          <small>Gün serisi</small>
        </div>
        <div className="ws-stat">
          <strong>{summary.xpEarned}</strong>
          <small>XP</small>
        </div>
      </div>

      <div className="ws-daily-chart">
        {summary.dailyCounts.map((count, i) => (
          <div key={i} className="ws-day-col" aria-label={`${i + 1}. gün: ${count} kayıt`}>
            <div className="ws-day-bar-track">
              <div
                className={`ws-day-bar-fill ${count > 0 ? 'active' : ''}`}
                style={{ height: `${count > 0 ? Math.max(12, Math.round((count / maxDaily) * 100)) : 0}%` }}
              />
            </div>
            <small className={count > 0 ? 'active' : ''}>{summary.dailyLabels[i]}</small>
          </div>
        ))}
      </div>

      {summary.topCategory && (
        <div className="ws-top-category">
          <AppIcon name="trophy" />
          <span>En aktif alan: <strong>{summary.topCategory.label}</strong> ({summary.topCategory.count} kayıt)</span>
        </div>
      )}

      <p className="ws-message">{summary.message}</p>
    </div>
  )
}
