"use client";

import { AppIcon } from "@/components/ui/AppIcon";

type ReportsHeroProps = {
  todayCount: number;
  streak: number;
  weekCount: number;
  nextStep: {
    title: string;
    detail: string;
    action: string;
  };
  onNextStep: () => void;
};

const metrics = [
  { key: "today", label: "Bugünün kaydı", icon: "calendar-check" },
  { key: "streak", label: "Günlük seri", icon: "flame" },
  { key: "week", label: "Bu hafta toplam", icon: "calendar-week" },
] as const;

export default function ReportsHero({
  todayCount,
  streak,
  weekCount,
  nextStep,
  onNextStep,
}: ReportsHeroProps) {
  const values = {
    today: todayCount.toLocaleString("tr-TR"),
    streak: `${streak.toLocaleString("tr-TR")} gün`,
    week: weekCount.toLocaleString("tr-TR"),
  };

  return (
    <section className="reports-hero" aria-labelledby="reports-hero-title">
      <div className="reports-hero-copy">
        <span className="eyebrow">BUGÜNÜN ÖZETİ</span>
        <h2 id="reports-hero-title">Ritmin bir bakışta.</h2>
        <p>Sayıları bir yarış değil, yolculuğunun sakin işaretleri olarak oku.</p>
      </div>

      <div className="reports-hero-metrics" aria-label="Günün ana metrikleri">
        {metrics.map((metric) => (
          <article key={metric.key}>
            <span><AppIcon name={metric.icon} /></span>
            <div>
              <strong>{values[metric.key]}</strong>
              <small>{metric.label}</small>
            </div>
          </article>
        ))}
      </div>

      <aside className="reports-next-step">
        <span className="reports-next-icon"><AppIcon name="arrow-up-right" /></span>
        <div>
          <small>SIRADAKİ KÜÇÜK ADIMIN</small>
          <strong>{nextStep.title}</strong>
          <p>{nextStep.detail}</p>
        </div>
        <button type="button" onClick={onNextStep}>
          {nextStep.action} <AppIcon name="arrow-right" />
        </button>
      </aside>
    </section>
  );
}
