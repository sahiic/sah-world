"use client";

import { useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ActivityEvent } from "@/lib/activity";
import { formatFocusDuration, totalFocusSeconds } from "@/lib/focus";
import { getFocusHistoryStats } from "@/lib/focusInsights";
import type { EisenhowerState, FocusSession } from "@/types";
import FocusTimeline from "./FocusTimeline";

type DetailId = "focus" | "xh" | "goals";

type ReportsDetailTabsProps = {
  events: ActivityEvent[];
  sessions: FocusSession[];
  eisenhower: EisenhowerState;
  now: Date;
};

export default function ReportsDetailTabs({
  events,
  sessions,
  eisenhower,
  now,
}: ReportsDetailTabsProps) {
  const [openDetail, setOpenDetail] = useState<DetailId | null>(null);
  const [focusRange, setFocusRange] = useState<7 | 30>(7);
  const [trendRange, setTrendRange] = useState<30 | 90>(30);
  const weekStart = useMemo(() => {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(now.getDate() - 6);
    return start;
  }, [now]);
  const focusWeek = totalFocusSeconds(sessions, weekStart);
  const focusTotal = totalFocusSeconds(sessions);
  const focusStats = getFocusHistoryStats(sessions, now);
  const tasks = Object.values(eisenhower).flat();
  const completion = tasks.length
    ? Math.round((tasks.filter((task) => task.done).length / tasks.length) * 100)
    : 0;
  const totalXh = events.reduce((sum, event) => sum + event.xp, 0);

  const toggle = (detail: DetailId) => {
    setOpenDetail((current) => current === detail ? null : detail);
  };

  return (
    <section className="reports-details" aria-labelledby="reports-details-title">
      <header className="reports-section-heading">
        <div>
          <span className="eyebrow">DETAYLAR</span>
          <h2 id="reports-details-title">Merak ettiğinde derine in.</h2>
          <p>Odak süreni, gelişimini ve önceliklerini keşfet.</p>
        </div>
      </header>

      <div className="reports-detail-list">
        <DetailTrigger
          id="focus"
          icon="target-arrow"
          eyebrow="DERİN ÇALIŞMA"
          title="Odaklanma ritmi"
          summary={`${formatFocusDuration(focusWeek)} bu hafta`}
          open={openDetail === "focus"}
          onClick={() => toggle("focus")}
        />
        {openDetail === "focus" && (
          <div className="reports-detail-panel" id="reports-detail-focus">
            <div className="card-heading">
              <div><span className="eyebrow">ODAK AYRINTILARI</span><h3>Oturumlarının ritmi</h3></div>
              <Segment value={String(focusRange)} onChange={(value) => setFocusRange(Number(value) as 7 | 30)} options={[["7", "7 Gün"], ["30", "30 Gün"]]} />
            </div>
            <div className="focus-report-stats">
              <DetailMetric icon="calendar-week" label="Bu hafta" value={formatFocusDuration(focusWeek)} />
              <DetailMetric icon="infinity" label="Tüm zamanlar" value={formatFocusDuration(focusTotal)} />
              <DetailMetric icon="flame" label="Odak serisi" value={`${focusStats.currentStreak} gün`} />
              <DetailMetric icon="sparkles" label="Ortalama kalite" value={focusStats.averageQuality ? `${focusStats.averageQuality.toFixed(1)}/5` : "—"} />
              <DetailMetric icon="shield-check" label="Kesintisiz oran" value={`${Math.round(focusStats.interruptionFreeRate * 100)}%`} />
              <DetailMetric icon="notes" label="Tamamlanan" value={`${sessions.filter((session) => session.completed).length} oturum`} />
            </div>
            <div className="focus-report-grid">
              <FocusTrend sessions={sessions} days={focusRange} />
              <FocusTimeline sessions={sessions} compact />
            </div>
          </div>
        )}

        <DetailTrigger
          id="xh"
          icon="chart-line"
          eyebrow="İLERLEME"
          title="XH trendi"
          summary={`${totalXh.toLocaleString("tr-TR")} XH hareketi`}
          open={openDetail === "xh"}
          onClick={() => toggle("xh")}
        />
        {openDetail === "xh" && (
          <div className="reports-detail-panel" id="reports-detail-xh">
            <div className="card-heading">
              <div><span className="eyebrow">ZAMAN İÇİNDE</span><h3>XH hareketi</h3></div>
              <Segment value={String(trendRange)} onChange={(value) => setTrendRange(Number(value) as 30 | 90)} options={[["30", "30 Gün"], ["90", "90 Gün"]]} />
            </div>
            <TrendChart events={events} days={trendRange} />
          </div>
        )}

        <DetailTrigger
          id="goals"
          icon="circle-check"
          eyebrow="ÖNCELİKLER"
          title="Hedef tamamlama"
          summary={`%${completion} tamamlandı`}
          open={openDetail === "goals"}
          onClick={() => toggle("goals")}
        />
        {openDetail === "goals" && (
          <div className="reports-detail-panel" id="reports-detail-goals">
            <div className="card-heading">
              <div><span className="eyebrow">DÖRT ALAN</span><h3>Hedef tamamlama</h3></div>
              <strong className="completion-total">{completion}%</strong>
            </div>
            {tasks.length === 0 ? (
              <EmptyState icon="layout-grid" title="Önceliklerin şekillenmeye hazır" description="İlk görevini eklediğinde hangi alanlara enerji verdiğini burada sakin ve net biçimde görebilirsin." compact />
            ) : (
              <div className="quadrant-progress">
                {(["q1", "q2", "q3", "q4"] as const).map((quadrant, index) => {
                  const list = eisenhower[quadrant];
                  const done = list.filter((task) => task.done).length;
                  const percent = list.length ? (done / list.length) * 100 : 0;
                  const labels = ["Acil + Önemli", "Önemli", "Devredilebilir", "Sadeleştir"];
                  return (
                    <article key={quadrant}>
                      <span><b>Q{index + 1}</b>{labels[index]}</span>
                      <div><i style={{ width: `${percent}%` }} /></div>
                      <strong>{done}/{list.length}</strong>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function DetailTrigger({
  id,
  icon,
  eyebrow,
  title,
  summary,
  open,
  onClick,
}: {
  id: DetailId;
  icon: string;
  eyebrow: string;
  title: string;
  summary: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`reports-detail-trigger ${open ? "is-open" : ""}`}
      aria-expanded={open}
      aria-controls={`reports-detail-${id}`}
      onClick={onClick}
    >
      <span className="reports-detail-icon"><AppIcon name={icon} /></span>
      <span><small>{eyebrow}</small><strong>{title}</strong></span>
      <b>{summary}</b>
      <AppIcon name="chevron-down" />
    </button>
  );
}

function DetailMetric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return <article><span><AppIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function Segment({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="segment">{options.map(([option, label]) => <button type="button" className={value === option ? "active" : ""} key={option} onClick={() => onChange(option)}>{label}</button>)}</div>;
}

function TrendChart({ events, days }: { events: ActivityEvent[]; days: number }) {
  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - index));
    date.setHours(23, 59, 59, 999);
    return events.filter((event) => new Date(event.createdAt) <= date).reduce((sum, event) => sum + event.xp, 0);
  });
  const max = Math.max(1, ...points);
  const path = points.map((value, index) => `${index ? "L" : "M"} ${(index / (points.length - 1)) * 560} ${190 - (value / max) * 160}`).join(" ");
  return (
    <div className="trend-chart">
      <svg viewBox="0 0 560 210" preserveAspectRatio="none" role="img" aria-label={`Son ${days} günün XH trendi`}>
        <defs><linearGradient id="reportsTrendFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#009b77" stopOpacity=".28" /><stop offset="1" stopColor="#009b77" stopOpacity="0" /></linearGradient></defs>
        <path d={`${path} L560 205 L0 205 Z`} fill="url(#reportsTrendFill)" />
        <path d={path} fill="none" stroke="#009b77" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div><span>{days} gün önce</span><strong>+{points.at(-1)?.toLocaleString("tr-TR") ?? 0} XH hareketi</strong><span>Bugün</span></div>
    </div>
  );
}

function FocusTrend({ sessions, days }: { sessions: FocusSession[]; days: number }) {
  const points = Array.from({ length: days }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (days - 1 - index));
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const minutes = Math.round(sessions.filter((session) => {
      const started = new Date(session.startedAt);
      return started >= day && started < next;
    }).reduce((sum, session) => sum + session.actualDurationSeconds, 0) / 60);
    return { day, minutes };
  });
  const max = Math.max(1, ...points.map((point) => point.minutes));
  return (
    <div className="focus-trend">
      <header><div><span className="eyebrow">ODAK SÜRESİ TRENDİ</span><h3>Günlere yayılan odak</h3></div><strong>{formatFocusDuration(points.reduce((sum, point) => sum + point.minutes * 60, 0))}</strong></header>
      <div className="focus-trend-bars" style={{ gridTemplateColumns: `repeat(${days}, minmax(${days > 7 ? "5px" : "18px"}, 1fr))` }}>
        {points.map((point, index) => <span key={point.day.toISOString()} title={`${point.day.toLocaleDateString("tr-TR")}: ${point.minutes} dakika`}><i style={{ height: `${Math.max(point.minutes ? 8 : 2, (point.minutes / max) * 100)}%` }} className={index === points.length - 1 ? "today" : ""} />{(days <= 7 || index % Math.ceil(days / 6) === 0 || index === days - 1) && <small>{point.day.toLocaleDateString("tr-TR", { weekday: days <= 7 ? "short" : undefined, day: days > 7 ? "numeric" : undefined })}</small>}</span>)}
      </div>
    </div>
  );
}
