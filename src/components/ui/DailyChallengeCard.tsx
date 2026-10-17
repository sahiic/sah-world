'use client'

import { useShallow } from 'zustand/react/shallow';
import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { getDailyChallenges, getChallengeMessage } from '@/lib/dailyChallenge'

export default function DailyChallengeCard() {
  const store = useJourneyStore(useShallow(s => ({
    journal: s.journal,
    quranNotes: s.quranNotes,
    hadisNotes: s.hadisNotes,
    eisenhower: s.eisenhower,
    lessons: s.lessons,
    sukurList: s.sukurList,
    totalZikir: s.totalZikir,
    focusSessions: s.focusSessions,
  })));

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
    return getDailyChallenges(events)
  }, [store])

  const message = getChallengeMessage(summary)

  return (
    <div className="dc-card">
      <header className="dc-header">
        <div>
          <span className="dc-eyebrow">GÜNÜN GÖREVLERİ</span>
          <h3>
            {summary.completedCount}/{summary.totalCount}
            <span className="dc-header-label"> tamamlandı</span>
          </h3>
        </div>
        <div className={`dc-progress-ring ${summary.allCompleted ? 'complete' : ''}`}>
          <svg viewBox="0 0 36 36" aria-hidden="true" focusable="false">
            <circle cx="18" cy="18" r="15" fill="none" stroke="var(--dc-track)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="var(--dc-accent)" strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${summary.totalCount > 0 ? (summary.completedCount / summary.totalCount) * 94.2 : 0} 94.2`}
              transform="rotate(-90 18 18)"
            />
          </svg>
          {summary.allCompleted && <AppIcon name="check" />}
        </div>
      </header>

      <ul className="dc-list">
        {summary.challenges.map(c => (
          <li key={c.id} className={`dc-item ${c.completed ? 'done' : ''}`} aria-label={`${c.title}: ${c.completed ? 'tamamlandı' : 'henüz tamamlanmadı'}. ${c.description}`}>
            <span className="dc-check">
              {c.completed ? <AppIcon name="circle-check-filled" /> : <AppIcon name="circle" />}
            </span>
            <div className="dc-item-content">
              <strong>{c.title}</strong>
              <small>{c.description}</small>
            </div>
            <span className="dc-item-icon">
              <AppIcon name={c.icon} />
            </span>
          </li>
        ))}
      </ul>

      {message && <p className="dc-message">{message}</p>}
    </div>
  )
}
