import { AppIcon } from "@/components/ui/AppIcon";
import {
  CATEGORY_META,
  dayKey,
  type ActivityCategory,
} from "@/lib/activity";

type RitualStats = {
  morning: number;
  evening: number;
  quick: number;
};

type WeeklySummarySectionProps = {
  daily: Map<string, number>;
  counts: Record<ActivityCategory, number>;
  insights: string[];
  ritualStats: RitualStats;
  now: Date;
};

export default function WeeklySummarySection({
  daily,
  counts,
  insights,
  ritualStats,
  now,
}: WeeklySummarySectionProps) {
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));
    return { date, count: daily.get(dayKey(date)) ?? 0 };
  });
  const maxDay = Math.max(1, ...weekDays.map((day) => day.count));
  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const categoryEntries = (Object.entries(counts) as [ActivityCategory, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
  let offset = 0;
  const stops = categoryEntries
    .map(([key, value]) => {
      const start = offset;
      offset += total ? (value / total) * 100 : 0;
      return `${CATEGORY_META[key].color} ${start}% ${offset}%`;
    })
    .join(", ");

  return (
    <section className="reports-weekly" aria-labelledby="reports-weekly-title">
      <header className="reports-section-heading">
        <div>
          <span className="eyebrow">KATMAN 02 · BU HAFTA</span>
          <h2 id="reports-weekly-title">Yedi günün sade resmi.</h2>
        </div>
        <span><AppIcon name="calendar-week" /> Son 7 gün</span>
      </header>

      <div className="reports-weekly-grid">
        <article className="reports-story-card">
          <span className="reports-card-icon"><AppIcon name="wand" /></span>
          <div>
            <small>HAFTANIN ÖZETİ</small>
            <h3>Ritmini anlatan kısa notlar</h3>
            <ul>
              {insights.slice(0, 3).map((insight, index) => (
                <li key={`${insight}-${index}`}>{insight}</li>
              ))}
            </ul>
          </div>
          <footer>
            <span>☀️ {ritualStats.morning} sabah</span>
            <span>🌙 {ritualStats.evening} akşam</span>
            <span>⚡ {ritualStats.quick} hızlı</span>
          </footer>
        </article>

        <article className="reports-week-heatmap">
          <header>
            <div>
              <small>AKTİVİTE RİTMİ</small>
              <h3>Haftanın yedi günü</h3>
            </div>
            <strong>{weekDays.reduce((sum, day) => sum + day.count, 0)} kayıt</strong>
          </header>
          <div className="reports-week-days" role="img" aria-label="Son yedi günün aktivite yoğunluğu">
            {weekDays.map(({ date, count }) => {
              const intensity = count ? Math.max(0.2, count / maxDay) : 0;
              return (
                <div key={dayKey(date)} className={dayKey(date) === dayKey(now) ? "is-today" : ""}>
                  <span style={{ opacity: count ? 0.35 + intensity * 0.65 : 1 }} className={count ? "has-activity" : ""}>
                    <b>{count}</b>
                  </span>
                  <strong>{date.toLocaleDateString("tr-TR", { weekday: "short" }).slice(0, 3)}</strong>
                  <small>{date.getDate()}</small>
                </div>
              );
            })}
          </div>
        </article>

        <article className="reports-category-card">
          <header>
            <small>KATEGORİ DENGESİ</small>
            <h3>Neye alan açtın?</h3>
          </header>
          <div className="reports-mini-donut" style={{ background: total ? `conic-gradient(${stops})` : "var(--reports-track)" }}>
            <span><strong>{total}</strong><small>kayıt</small></span>
          </div>
          <div className="reports-category-legend">
            {categoryEntries.length ? categoryEntries.map(([key, value]) => (
              <span key={key}>
                <i style={{ background: CATEGORY_META[key].color }} />
                <b>{CATEGORY_META[key].label}</b>
                <small>{value}</small>
              </span>
            )) : <p>Henüz kategori verisi yok.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
