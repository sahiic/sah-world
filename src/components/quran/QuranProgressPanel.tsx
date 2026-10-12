'use client';

import { AppIcon } from '@/components/ui/AppIcon';
import type { QuranStreak, WeeklySummary } from '@/lib/quranSurahs';

/** Display-only summary; the controller remains the single data owner. */
export default function QuranProgressPanel({streak, weeklySummary}: {
  streak: QuranStreak;
  weeklySummary: WeeklySummary;
}) {
  return <div className="qc-study-overview">
    <article className="qc-study-stat"><AppIcon name="flame" /><div><strong>{streak.current} gün</strong><span>Aktif seri</span></div></article>
    <article className="qc-study-stat"><AppIcon name="book-2" /><div><strong>{weeklySummary.totalAyahs}</strong><span>Bu hafta çalışılan ayet</span></div></article>
    <article className="qc-study-stat"><AppIcon name="clock" /><div><strong>{weeklySummary.totalMinutes} dk</strong><span>Bu hafta pratik</span></div></article>
  </div>;
}
