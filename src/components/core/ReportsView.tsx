"use client";

import { useShallow } from 'zustand/react/shallow';
import { useEffect, useMemo, useState } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";
import {
  buildActivityFeed,
  dayKey,
  getCategoryCounts,
  getDailyActivity,
  mapIntegratedActivities,
  type ActivityCategory,
} from "@/lib/activity";
import { openAppView } from "@/lib/appLocation";
import { supabase } from "@/lib/supabase";
import {
  buildComparativeInsight,
  buildWeeklyInsights,
  getWeeklyNextStep,
} from "@/lib/weeklyInsights";
import { useJourneyStore } from "@/store/useJourneyStore";
import ReportsDetailTabs from "./ReportsDetailTabs";
import ReportsHero from "./ReportsHero";
import SectionTagline from "./SectionTagline";
import WeeklySummarySection from "./WeeklySummarySection";

export default function ReportsView() {
  const store = useJourneyStore(useShallow(s => ({
    journal: s.journal,
    quranNotes: s.quranNotes,
    hadisNotes: s.hadisNotes,
    eisenhower: s.eisenhower,
    lessons: s.lessons,
    sukurList: s.sukurList,
    focusSessions: s.focusSessions,
    totalZikir: s.totalZikir,
    streak: s.streak,
  })));
  const remoteActivity = useActivityLog();
  const [weeklyInsights, setWeeklyInsights] = useState<string[]>([]);
  const events = useMemo(
    () => remoteActivity.items.length
      ? mapIntegratedActivities(remoteActivity.items)
      : buildActivityFeed(store),
    [remoteActivity.items, store],
  );
  const daily = useMemo(() => getDailyActivity(events), [events]);
  const localCounts = getCategoryCounts(store, events);
  const counts = useMemo(
    () => events.length
      ? events.reduce<Record<ActivityCategory, number>>(
          (result, event) => ({
            ...result,
            [event.category]: result[event.category] + 1,
          }),
          {
            journal: 0,
            quran: 0,
            hadis: 0,
            matrix: 0,
            lessons: 0,
            sukur: 0,
            mescidim: 0,
            focus: 0,
            profession: 0,
            awareness: 0,
          },
        )
      : localCounts,
    [events, localCounts],
  );
  const now = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - 6);
    return start;
  }, [now]);
  const weekCount = events.filter((event) => new Date(event.createdAt) >= weekStart).length;
  const weekJournal = store.journal.filter((item) => new Date(`${item.date}T12:00:00`) >= weekStart);
  const ritualStats = {
    morning: weekJournal.filter((item) => item.ritualType === "sabah").length,
    evening: weekJournal.filter((item) => item.ritualType === "aksam" || !item.ritualType).length,
    quick: weekJournal.filter((item) => item.entryMode === "quick").length,
  };
  const localWeeklyInsights = buildWeeklyInsights(store.journal, events, now);
  const insightLines = [
    buildComparativeInsight(events, events, now),
    ...(weeklyInsights.length ? weeklyInsights : localWeeklyInsights)
      .filter((text) => !text.startsWith("Bu hafta en çok")),
  ].filter((text, index, list) => Boolean(text) && list.indexOf(text) === index).slice(0, 3);
  const nextStep = getWeeklyNextStep(store.journal, events, now);

  useEffect(() => {
    let active = true;
    void supabase
      .rpc("generate_weekly_insights", { target_week_start: null })
      .then(({ data, error }) => {
        if (!active || error) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (row?.insight_text_array) setWeeklyInsights(row.insight_text_array);
      });
    return () => { active = false; };
  }, [store.journal.length, events.length]);

  return (
    <div className="view-stack reports-view reports-view-clean">
      <header className="page-heading reports-page-heading">
        <div>
          <span className="eyebrow">GELİŞİM İÇGÖRÜLERİ</span>
          <h1>Gelişim Raporlarım</h1>
          <p>Rakamları yargı için değil, ritmini anlamak ve dengeni görmek için kullan.</p>
        </div>
        <SectionTagline section="reports" compact />
        <span className="quiet-chip">Son güncelleme · şimdi</span>
      </header>

      <ReportsHero
        todayCount={daily.get(dayKey(now)) ?? 0}
        streak={store.streak.current}
        weekCount={weekCount}
        nextStep={nextStep}
        onNextStep={() => openAppView(nextStep.view)}
      />

      <WeeklySummarySection
        daily={daily}
        counts={counts}
        insights={insightLines}
        ritualStats={ritualStats}
        now={now}
      />

      <ReportsDetailTabs
        events={events}
        sessions={store.focusSessions}
        eisenhower={store.eisenhower}
        now={now}
      />
    </div>
  );
}
