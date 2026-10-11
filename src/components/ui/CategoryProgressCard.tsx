'use client'

import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { buildCategoryProgress, type CategoryDelta } from '@/lib/categoryProgress'

const TREND_ICON: Record<CategoryDelta['trend'], string> = {
  up: 'trending-up',
  down: 'trending-down',
  same: 'minus',
  new: 'sparkles',
}

export default function CategoryProgressCard() {
  const store = useJourneyStore()

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
    return buildCategoryProgress(events)
  }, [store])

  if (!summary.categories.length) {
    return (
      <div className="cp-card">
        <div className="cp-empty">
          <AppIcon name="chart-arrows" />
          <strong>Henüz karşılaştırma verisi yok</strong>
          <p>İki haftalık kayıt biriktirdiğinde kategorilerin arasındaki farkı burada göreceksin.</p>
        </div>
      </div>
    )
  }

  const maxCount = Math.max(1, ...summary.categories.map(c => Math.max(c.thisWeek, c.lastWeek)))

  return (
    <div className="cp-card">
      <header className="cp-header">
        <div>
          <span className="cp-eyebrow">KATEGORİ İLERLEMESİ</span>
          <h3>Bu Hafta vs Geçen Hafta</h3>
        </div>
        <span className={`cp-overall-badge ${summary.overallTrend}`}>
          <AppIcon name={TREND_ICON[summary.overallTrend]} />
          {summary.overallTrend === 'same' ? '—' : `${summary.overallChange > 0 ? '+' : ''}${summary.overallChange}%`}
        </span>
      </header>

      <div className="cp-list">
        {summary.categories.map(c => (
          <div key={c.category} className="cp-row">
            <div className="cp-row-label">
              <AppIcon name={c.icon} />
              <span>{c.label}</span>
            </div>
            <div className="cp-row-bars">
              <div className="cp-bar-pair">
                <div className="cp-bar last" style={{ width: `${Math.max(4, Math.round((c.lastWeek / maxCount) * 100))}%` }}>
                  <span>{c.lastWeek}</span>
                </div>
                <div className="cp-bar current" style={{ width: `${Math.max(4, Math.round((c.thisWeek / maxCount) * 100))}%` }}>
                  <span>{c.thisWeek}</span>
                </div>
              </div>
            </div>
            <span className={`cp-trend ${c.trend}`}>
              <AppIcon name={TREND_ICON[c.trend]} />
            </span>
          </div>
        ))}
      </div>

      <div className="cp-insights">
        {summary.mostImproved && (
          <div className="cp-insight up">
            <AppIcon name="arrow-up-right" />
            <span>En çok gelişen: <strong>{summary.mostImproved.label}</strong></span>
          </div>
        )}
        {summary.needsAttention && (
          <div className="cp-insight down">
            <AppIcon name="alert-circle" />
            <span>İlgi bekleyen: <strong>{summary.needsAttention.label}</strong></span>
          </div>
        )}
      </div>

      <div className="cp-legend">
        <span><i className="cp-legend-dot last" /> Geçen hafta</span>
        <span><i className="cp-legend-dot current" /> Bu hafta</span>
      </div>
    </div>
  )
}
