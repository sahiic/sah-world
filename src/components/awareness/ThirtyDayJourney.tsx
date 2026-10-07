"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  JOURNEY_DAYS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  type JourneyDay,
} from "@/lib/thirtyDayJourney";

export default function ThirtyDayJourney({
  completedDays,
  onComplete,
}: {
  completedDays: Set<number>;
  onComplete: (day: number, xp: number) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const totalXP = JOURNEY_DAYS.filter((d) => completedDays.has(d.day)).reduce((sum, d) => sum + d.xpReward, 0);
  const progress = completedDays.size / 30;

  const currentDay = JOURNEY_DAYS.find((d) => !completedDays.has(d.day))?.day ?? 30;

  return (
    <section className="awareness-journey">
      <header className="awareness-journey-header">
        <div>
          <AppIcon name="road" />
          <h3>30 Günlük Farkındalık Yolculuğu</h3>
        </div>
        <div className="awareness-journey-stats">
          <span><strong>{completedDays.size}</strong>/30 gün</span>
          <span><strong>{totalXP}</strong> XH kazanıldı</span>
        </div>
      </header>

      <div className="awareness-journey-progress">
        <div className="awareness-journey-bar">
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <small>{Math.round(progress * 100)}% tamamlandı</small>
      </div>

      <div className="awareness-journey-grid">
        {JOURNEY_DAYS.map((day) => {
          const done = completedDays.has(day.day);
          const isCurrent = day.day === currentDay;
          const locked = day.day > currentDay;
          return (
            <motion.button
              key={day.day}
              className={`awareness-journey-day ${done ? "done" : ""} ${isCurrent ? "current" : ""} ${locked ? "locked" : ""}`}
              style={{ "--cat-color": CATEGORY_COLORS[day.category] } as React.CSSProperties}
              onClick={() => !locked && setSelectedDay(selectedDay === day.day ? null : day.day)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: day.day * 0.02 }}
              disabled={locked}
              aria-label={`Gün ${day.day}: ${day.title}${done ? " (tamamlandı)" : ""}`}
            >
              <span className="awareness-journey-day-num">{day.day}</span>
              {done && <AppIcon name="check" />}
            </motion.button>
          );
        })}
      </div>

      {selectedDay !== null && (
        <DayDetail
          day={JOURNEY_DAYS[selectedDay - 1]}
          completed={completedDays.has(selectedDay)}
          onComplete={() => onComplete(selectedDay, JOURNEY_DAYS[selectedDay - 1].xpReward)}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <div className="awareness-journey-categories">
        {(Object.keys(CATEGORY_LABELS) as JourneyDay["category"][]).map((cat) => (
          <span key={cat} style={{ "--cat-color": CATEGORY_COLORS[cat] } as React.CSSProperties}>
            {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
    </section>
  );
}

function DayDetail({
  day,
  completed,
  onComplete,
  onClose,
}: {
  day: JourneyDay;
  completed: boolean;
  onComplete: () => void;
  onClose: () => void;
}) {
  return (
    <motion.article
      className="awareness-journey-detail"
      style={{ "--cat-color": CATEGORY_COLORS[day.category] } as React.CSSProperties}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <header>
        <span>GÜN {day.day} · {CATEGORY_LABELS[day.category]}</span>
        <button onClick={onClose} aria-label="Kapat"><AppIcon name="x" /></button>
      </header>
      <h4>{day.title}</h4>
      <p>{day.task}</p>
      <footer>
        <span className="awareness-journey-xp">+{day.xpReward} XH</span>
        {!completed ? (
          <button className="awareness-journey-complete" onClick={onComplete}>
            <AppIcon name="check" /> Tamamladım
          </button>
        ) : (
          <span className="awareness-journey-done"><AppIcon name="circle-check" /> Tamamlandı</span>
        )}
      </footer>
    </motion.article>
  );
}
