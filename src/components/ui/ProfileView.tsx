'use client'

import { useMemo } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import AvatarImage from '@/components/ui/AvatarImage'
import ActivityHeatmap from '@/components/ui/ActivityHeatmap'
import dynamic from 'next/dynamic'
import SectionErrorBoundary from '@/components/core/SectionErrorBoundary'
import { useAuthStore } from '@/store/useAuthStore'
import { useJourneyStore } from '@/store/useJourneyStore'
import { buildActivityFeed, CATEGORY_META, type ActivitySource } from '@/lib/activity'
import { getLevelForXP } from '@/lib/constants'

const BadgeGallery = dynamic(() => import('./BadgeGallery'))
const MilestoneTimeline = dynamic(() => import('./MilestoneTimeline'))
const ActivityCalendar = dynamic(() => import('./ActivityCalendar'))

export default function ProfileView() {
  const profile = useAuthStore(s => s.profile)
  const store = useJourneyStore()

  const { events, level, nextLevel, xpProgress, categoryStats } = useMemo(() => {
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
    const feed = buildActivityFeed(source)
    const { level: lvl, nextLevel: next } = getLevelForXP(store.xp)
    const progress = next
      ? Math.round(((store.xp - lvl.xp) / (next.xp - lvl.xp)) * 100)
      : 100

    const cats = new Map<string, number>()
    for (const e of feed) cats.set(e.category, (cats.get(e.category) ?? 0) + 1)
    const sorted = [...cats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

    return { events: feed, level: lvl, nextLevel: next, xpProgress: progress, categoryStats: sorted }
  }, [store])

  return (
    <div className="profile-view">
      <header className="profile-header">
        <div className="profile-avatar">
          {profile?.avatar_url ? <AvatarImage
            src={profile.avatar_url}
            alt={profile?.display_name || 'Kullanıcı'}
            size={72}
          /> : <AppIcon name="user-circle" />}
        </div>
        <div className="profile-identity">
          <h1>{profile?.display_name || 'Yolcu'}</h1>
          <div className="profile-level">
            <span className="profile-level-icon">{level.icon}</span>
            <span className="profile-level-name">{level.name}</span>
            <span className="profile-xp">{store.xp.toLocaleString('tr-TR')} XH</span>
          </div>
          {nextLevel && (
            <div className="profile-progress-summary">
              <div className="profile-xp-bar" role="progressbar" aria-label={`${nextLevel.name} seviyesine ilerleme`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={xpProgress}>
                <div className="profile-xp-fill" style={{ width: `${xpProgress}%` }} />
              </div>
              <p>{nextLevel.name} seviyesine {(nextLevel.xp - store.xp).toLocaleString('tr-TR')} XH</p>
            </div>
          )}
        </div>
      </header>

      <section className="profile-stats">
        <div className="profile-stat-card">
          <AppIcon name="notebook" />
          <strong>{store.journal.length}</strong>
          <small>Günlük</small>
        </div>
        <div className="profile-stat-card">
          <AppIcon name="target-arrow" />
          <strong>{store.focusSessions.filter(f => f.completed).length}</strong>
          <small>Odak oturumu</small>
        </div>
        <div className="profile-stat-card">
          <AppIcon name="book-2" />
          <strong>{store.quranNotes.length}</strong>
          <small>Kur'an notu</small>
        </div>
        <div className="profile-stat-card">
          <AppIcon name="circle-dotted" />
          <strong>{store.totalZikir.toLocaleString('tr-TR')}</strong>
          <small>Zikir</small>
        </div>
      </section>

      <section className="profile-section">
        <h3><AppIcon name="chart-dots-2" /> Aktivite Haritası</h3>
        <ActivityHeatmap events={events} weeks={20} />
      </section>
      <SectionErrorBoundary sectionName="Aktivite takvimi"><ActivityCalendar /></SectionErrorBoundary>

      {categoryStats.length > 0 && (
        <section className="profile-section">
          <h3><AppIcon name="chart-bar" /> En Aktif Alanların</h3>
          <div className="profile-category-bars">
            {categoryStats.map(([cat, count]) => {
              const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
              if (!meta) return null
              const max = categoryStats[0][1]
              return (
                <div key={cat} className="profile-category-row">
                  <span className="profile-category-label">
                    <AppIcon name={meta.icon} /> {meta.label}
                  </span>
                  <div className="profile-category-bar">
                    <div
                      className="profile-category-fill"
                      style={{ width: `${Math.round((count / max) * 100)}%`, background: meta.color }}
                    />
                  </div>
                  <span className="profile-category-count">{count}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="profile-section">
        <SectionErrorBoundary sectionName="Rozetlerin"><BadgeGallery /></SectionErrorBoundary>
      </section>
      <SectionErrorBoundary sectionName="Yolculuk kilometre taşları"><MilestoneTimeline /></SectionErrorBoundary>
    </div>
  )
}
