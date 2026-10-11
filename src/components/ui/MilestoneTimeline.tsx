'use client'

import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, type ActivitySource } from '@/lib/activity'
import { computeGlobalStreaks } from '@/lib/streaks'
import { detectMilestones, getMilestoneRuleCount } from '@/lib/milestoneTimeline'

export default function MilestoneTimeline() {
  const store = useJourneyStore()

  const milestones = useMemo(() => {
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
    return detectMilestones(events, store.xp, streaks.overall.longest)
  }, [store])

  const totalRules = getMilestoneRuleCount()

  if (!milestones.length) {
    return (
      <div className="mt-card">
        <div className="mt-empty">
          <AppIcon name="flag-2" />
          <strong>Henüz kilometre taşı yok</strong>
          <p>İlk kaydını oluşturduğunda yolculuğun burada görünecek.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-card">
      <header className="mt-header">
        <div>
          <span className="mt-eyebrow">YOLCULUK</span>
          <h3>Kilometre Taşları</h3>
        </div>
        <span className="mt-count">{milestones.length}/{totalRules}</span>
      </header>

      <ol className="mt-list">
        {milestones.map((m, i) => (
          <li key={m.id} className="mt-item">
            <div className="mt-line-segment">
              <span className={`mt-dot ${i === milestones.length - 1 ? 'latest' : ''}`}>
                <AppIcon name={m.icon} />
              </span>
              {i < milestones.length - 1 && <span className="mt-connector" />}
            </div>
            <div className="mt-content">
              <strong>{m.title}</strong>
              <small>{m.description}</small>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
