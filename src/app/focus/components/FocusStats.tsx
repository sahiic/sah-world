"use client";

import { BarChart3, Clock3, Target, Trophy } from "lucide-react";
import { useFocusStats } from "@/hooks/useFocusStats";
import { formatMinutes } from "@/utils/timerUtils";
import StreakCounter from "./StreakCounter";
import styles from "../focus.module.css";

const dayFormatter = new Intl.DateTimeFormat("tr-TR", { weekday: "short" });

export default function FocusStats() {
  const stats = useFocusStats();
  const maximum = Math.max(30, ...stats.week.map((day) => day.totalFocusMinutes));
  const bestLabel = dayFormatter.format(new Date(`${stats.bestDay.date}T12:00:00`));

  return (
    <section className={styles.panelCard} aria-labelledby="focus-stats-title">
      <header className={styles.panelHeader}>
        <span><BarChart3 aria-hidden /></span>
        <div><small>Son yedi gün</small><h2 id="focus-stats-title">Odak İstatistikleri</h2></div>
      </header>
      <div className={styles.todayStats}>
        <div><Clock3 aria-hidden /><span><small>Bugün</small><strong>{formatMinutes(stats.today.totalFocusMinutes)}</strong></span></div>
        <div><Target aria-hidden /><span><small>Oturum</small><strong>{stats.today.sessionsCompleted}</strong></span></div>
        <div><Trophy aria-hidden /><span><small>En uzun</small><strong>{formatMinutes(stats.today.longestSession)}</strong></span></div>
      </div>
      <div className={styles.goalBlock}>
        <div><span>Günlük hedef</span><strong>{stats.goalProgress}%</strong></div>
        <progress
          className={styles.goalTrack}
          max="100"
          value={stats.goalProgress}
          aria-label={`Günlük hedefin yüzde ${stats.goalProgress} kadarı tamamlandı`}
        />
        <small>{formatMinutes(stats.today.totalFocusMinutes)} / {formatMinutes(stats.dailyGoalMinutes)}</small>
      </div>
      <div className={styles.weekChart} aria-label="Haftalık odaklanma grafiği">
        {stats.week.map((day) => (
          <div key={day.date} className={day.date === stats.bestDay.date && day.totalFocusMinutes > 0 ? styles.bestBar : ""}>
            <output>{day.totalFocusMinutes || ""}</output>
            <svg viewBox="0 0 30 120" role="img" aria-label={`${day.date}: ${day.totalFocusMinutes} dakika`}>
              <rect className={styles.chartTrack} x="3" y="0" width="24" height="120" rx="5" />
              <rect className={styles.chartFill} x="3" y={120 - day.totalFocusMinutes / maximum * 120} width="24" height={day.totalFocusMinutes / maximum * 120} rx="5" />
            </svg>
            <small>{dayFormatter.format(new Date(`${day.date}T12:00:00`)).slice(0, 3)}</small>
          </div>
        ))}
      </div>
      <div className={styles.weekSummary}><span><small>Haftalık toplam</small><strong>{formatMinutes(stats.weeklyTotal)}</strong></span><span><small>Günlük ortalama</small><strong>{formatMinutes(stats.dailyAverage)}</strong></span><span><small>En verimli gün</small><strong>{stats.bestDay.totalFocusMinutes ? bestLabel : "—"}</strong></span></div>
      <StreakCounter />
    </section>
  );
}

