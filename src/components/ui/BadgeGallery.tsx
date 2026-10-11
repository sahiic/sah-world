'use client'

import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { useAchievements } from '@/hooks/useAchievements'
import { CATEGORY_META } from '@/lib/activity'
import type { BadgeStatus, LockedBadge } from '@/lib/badges'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Genel',
  journal: 'Günlük',
  focus: 'Odak',
  quran: 'Kur\'an',
  hadis: 'Hadis',
  sukur: 'Şükür',
  mescidim: 'Mescidim',
  matrix: 'Matris',
  lessons: 'Hatalar ve Dersler',
}

function BadgeCard({ status }: { status: BadgeStatus }) {
  const { badge } = status
  return (
    <article className={`badge-card ${status.earned ? '' : 'locked'}`} aria-label={`${badge.name}: ${status.earned ? 'kazanıldı' : 'devam ediyor'}`}>
      <div className={`badge-icon ${badge.tier}`}>
        <AppIcon name={badge.icon} />
      </div>
      <strong>{badge.name}</strong>
      <p>{badge.desc}</p>
      {!status.earned && (
        <>
          <div className="badge-progress" role="progressbar" aria-label={`${badge.name} ilerlemesi`} aria-valuemin={0} aria-valuemax={(status as LockedBadge).target} aria-valuenow={Math.min((status as LockedBadge).current, (status as LockedBadge).target)}>
            <div
              className={`badge-progress-fill ${badge.tier}`}
              style={{ width: `${Math.round(((status as LockedBadge).current / (status as LockedBadge).target) * 100)}%` }}
            />
          </div>
          <span className="badge-progress-label">
            {(status as LockedBadge).current} / {(status as LockedBadge).target}
          </span>
        </>
      )}
    </article>
  )
}

export default function BadgeGallery() {
  const { badges, streaks, earnedCount, totalCount } = useAchievements()

  const grouped = useMemo(() => {
    const map = new Map<string, BadgeStatus[]>()
    for (const b of badges) {
      const cat = b.badge.category
      const list = map.get(cat) ?? []
      list.push(b)
      map.set(cat, list)
    }
    const earned: BadgeStatus[] = []
    const locked: BadgeStatus[] = []
    for (const b of badges) {
      if (b.earned) earned.push(b)
      else locked.push(b)
    }
    return { map, earned, locked }
  }, [badges])

  return (
    <div className="achievements-view">
      <div className="streak-overview">
        <span className="streak-flame"><AppIcon name="flame" /></span>
        <div className="streak-numbers">
          <div className="streak-stat">
            <strong>{streaks.overall.current}</strong>
            <small>Güncel seri</small>
          </div>
          <div className="streak-stat">
            <strong>{streaks.overall.longest}</strong>
            <small>En uzun seri</small>
          </div>
          <div className="streak-stat">
            <strong>{streaks.activeDaysThisWeek}</strong>
            <small>Bu hafta</small>
          </div>
          <div className="streak-stat">
            <strong>{streaks.totalActiveDays}</strong>
            <small>Toplam aktif gün</small>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24 }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>Rozetlerin</h3>
        <span className="badge-count">
          <AppIcon name="trophy" /> {earnedCount} / {totalCount}
        </span>
      </div>

      {grouped.earned.length > 0 && (
        <>
          <div className="badge-section-title">Kazanılan</div>
          <div className="badge-gallery">
            {grouped.earned.map(b => <BadgeCard key={b.badge.id} status={b} />)}
          </div>
        </>
      )}

      {grouped.locked.length > 0 && (
        <>
          <div className="badge-section-title">Devam eden</div>
          <div className="badge-gallery">
            {grouped.locked.map(b => <BadgeCard key={b.badge.id} status={b} />)}
          </div>
        </>
      )}
    </div>
  )
}
