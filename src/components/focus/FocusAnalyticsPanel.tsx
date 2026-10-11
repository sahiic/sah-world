'use client'

import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useFocusStore } from '@/stores/focusStore'
import { computeFocusAnalytics, formatHour, getProductivityLabel } from '@/lib/focusAnalytics'

export default function FocusAnalyticsPanel() {
  const sessions = useFocusStore(s => s.sessions)

  const analytics = useMemo(() => computeFocusAnalytics(sessions), [sessions])
  const { label, message } = getProductivityLabel(analytics.productivityScore)

  if (!analytics.totalSessions) {
    return (
      <div className="focus-analytics">
        <div className="fa-empty">
          <AppIcon name="chart-dots-2" />
          <strong>Henüz analiz için yeterli veri yok</strong>
          <p>Birkaç odak oturumu tamamladığında burada detaylı istatistiklerin görünecek.</p>
        </div>
      </div>
    )
  }

  const maxHourSessions = Math.max(1, ...analytics.hourlyPatterns.map(p => p.sessions))

  return (
    <div className="focus-analytics">
      {/* Productivity score */}
      <div className="fa-score-card">
        <div className="fa-score-ring">
          <svg viewBox="0 0 80 80" className="fa-ring-svg">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--fa-track)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="34" fill="none"
              stroke="var(--fa-accent)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${analytics.productivityScore * 2.136} 213.6`}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <span className="fa-score-value">{analytics.productivityScore}</span>
        </div>
        <div className="fa-score-info">
          <strong>{label}</strong>
          <p>{message}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="fa-quick-stats">
        <div className="fa-stat">
          <AppIcon name="clock" />
          <strong>{Math.round(analytics.totalLifetimeMinutes / 60)}s {analytics.totalLifetimeMinutes % 60}dk</strong>
          <small>Toplam odak</small>
        </div>
        <div className="fa-stat">
          <AppIcon name="target-arrow" />
          <strong>{analytics.totalSessions}</strong>
          <small>Oturum</small>
        </div>
        <div className="fa-stat">
          <AppIcon name="chart-line" />
          <strong>%{analytics.completionRate}</strong>
          <small>Tamamlama</small>
        </div>
        <div className="fa-stat">
          <AppIcon name="hourglass" />
          <strong>{analytics.averageSessionMinutes}dk</strong>
          <small>Ort. süre</small>
        </div>
      </div>

      {/* Best hour */}
      {analytics.bestHour !== null && (
        <section className="fa-section">
          <h4><AppIcon name="sun" /> En Verimli Saatlerin</h4>
          <div className="fa-hour-chart">
            {analytics.hourlyPatterns.map(p => (
              <div key={p.hour} className="fa-hour-bar">
                <div
                  className="fa-hour-fill"
                  style={{ height: `${Math.round((p.sessions / maxHourSessions) * 100)}%` }}
                />
                <small>{formatHour(p.hour).slice(0, 2)}</small>
                {p.hour === analytics.bestHour && <span className="fa-best-badge"><AppIcon name="star" /></span>}
              </div>
            ))}
          </div>
          <p className="fa-hint">
            <AppIcon name="bulb" /> En çok <strong>{formatHour(analytics.bestHour)}</strong> civarında odaklanıyorsun
          </p>
        </section>
      )}

      {/* Completion trend */}
      {analytics.qualityTrend.length >= 3 && (
        <section className="fa-section">
          <h4><AppIcon name="trending-up" /> Son 14 Gün Tamamlama Oranı</h4>
          <div className="fa-trend-chart">
            {analytics.qualityTrend.map(d => (
              <div key={d.date} className="fa-trend-bar">
                <div className="fa-trend-fill" style={{ height: `${d.completionRate}%` }} />
                <small>{new Date(`${d.date}T12:00:00`).getDate()}</small>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tag breakdown */}
      {analytics.tagBreakdown.length > 0 && (
        <section className="fa-section">
          <h4><AppIcon name="tags" /> Odak Alanların</h4>
          <div className="fa-tag-list">
            {analytics.tagBreakdown.map(t => {
              const max = analytics.tagBreakdown[0].totalMinutes
              return (
                <div key={t.tag} className="fa-tag-row">
                  <span className="fa-tag-name">{t.tag}</span>
                  <div className="fa-tag-bar">
                    <div className="fa-tag-fill" style={{ width: `${Math.round((t.totalMinutes / max) * 100)}%` }} />
                  </div>
                  <span className="fa-tag-value">{t.totalMinutes}dk</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
