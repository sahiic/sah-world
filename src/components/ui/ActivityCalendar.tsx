'use client'

import { useCallback, useMemo, useState } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { buildCalendarMonth, getAdjacentMonth } from '@/lib/activityCalendar'

const DAY_HEADERS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']

export default function ActivityCalendar() {
  const store = useJourneyStore()
  const now = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth())

  const events = useMemo(() => {
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
    return buildActivityFeed(source)
  }, [store])

  const calendar = useMemo(
    () => buildCalendarMonth(events, viewYear, viewMonth, now),
    [events, viewYear, viewMonth, now],
  )

  const navigate = useCallback((dir: -1 | 1) => {
    const next = getAdjacentMonth(viewYear, viewMonth, dir)
    setViewYear(next.year)
    setViewMonth(next.month)
  }, [viewYear, viewMonth])

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth()

  return (
    <div className="ac-card">
      <header className="ac-header">
        <button className="ac-nav-btn" onClick={() => navigate(-1)} aria-label="Önceki ay">
          <AppIcon name="chevron-left" />
        </button>
        <h3>{calendar.label}</h3>
        <button
          className="ac-nav-btn"
          onClick={() => navigate(1)}
          disabled={isCurrentMonth}
          aria-label="Sonraki ay"
        >
          <AppIcon name="chevron-right" />
        </button>
      </header>

      <div className="ac-stats-row">
        <span><strong>{calendar.activeDays}</strong> aktif gün</span>
        <span><strong>{calendar.totalEvents}</strong> kayıt</span>
      </div>

      <div className="ac-grid">
        {DAY_HEADERS.map(d => (
          <span key={d} className="ac-day-header">{d}</span>
        ))}

        {Array.from({ length: calendar.startDayOfWeek }, (_, i) => (
          <span key={`pad-${i}`} className="ac-cell empty" />
        ))}

        {calendar.days.map(day => (
          <span
            key={day.date}
            className={`ac-cell level-${day.level} ${day.isToday ? 'today' : ''}`}
            title={`${day.day}: ${day.count} kayıt`}
          >
            {day.day}
          </span>
        ))}
      </div>

      <div className="ac-legend">
        <small>Az</small>
        <span className="ac-legend-cell level-0" />
        <span className="ac-legend-cell level-1" />
        <span className="ac-legend-cell level-2" />
        <span className="ac-legend-cell level-3" />
        <span className="ac-legend-cell level-4" />
        <small>Çok</small>
      </div>
    </div>
  )
}
