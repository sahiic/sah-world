"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import type { Geography } from "@/lib/awareness";
import {
  TIMELINE_EVENTS,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  type TimelineEvent,
} from "@/lib/awarenessTimeline";

export default function AwarenessTimeline({ geography }: { geography: Geography }) {
  const events = TIMELINE_EVENTS.filter((e) => e.geography === geography);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = events.find((e) => e.id === selectedId);

  return (
    <section className="awareness-timeline">
      <header className="awareness-timeline-header">
        <AppIcon name="timeline" />
        <div>
          <h3>Tarihsel Zaman Çizelgesi</h3>
          <p>Olayları tarihsel bağlamında incele. Her nokta kaynağa dayalıdır.</p>
        </div>
      </header>

      <div className="awareness-timeline-track">
        <div className="awareness-timeline-line" />
        {events.map((event, i) => (
          <motion.button
            key={event.id}
            className={`awareness-timeline-node ${selectedId === event.id ? "active" : ""}`}
            data-category={event.category}
            onClick={() => setSelectedId(selectedId === event.id ? null : event.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            aria-label={`${event.year}: ${event.title}`}
          >
            <span className="awareness-timeline-year">{event.year}</span>
            <span className="awareness-timeline-dot">
              <AppIcon name={CATEGORY_ICONS[event.category]} />
            </span>
            <span className="awareness-timeline-label">{event.title}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <TimelineDetail key={selected.id} event={selected} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      <div className="awareness-timeline-legend">
        {(Object.keys(CATEGORY_LABELS) as TimelineEvent["category"][]).map((cat) => (
          <span key={cat} className="awareness-timeline-legend-item" data-category={cat}>
            <AppIcon name={CATEGORY_ICONS[cat]} /> {CATEGORY_LABELS[cat]}
          </span>
        ))}
      </div>
    </section>
  );
}

function TimelineDetail({ event, onClose }: { event: TimelineEvent; onClose: () => void }) {
  return (
    <motion.article
      className="awareness-timeline-detail"
      data-category={event.category}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
    >
      <header>
        <span className="awareness-timeline-detail-badge">
          <AppIcon name={CATEGORY_ICONS[event.category]} />
          {CATEGORY_LABELS[event.category]} · {event.year}
        </span>
        <button onClick={onClose} aria-label="Kapat"><AppIcon name="x" /></button>
      </header>
      <h4>{event.title}</h4>
      <p>{event.summary}</p>
      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="awareness-source-link">
        <AppIcon name="external-link" /> {event.sourceName}
      </a>
    </motion.article>
  );
}
