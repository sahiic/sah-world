"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import type { Geography } from "@/lib/awareness";
import { GEOGRAPHY_META } from "@/lib/awareness";

type Prayer = {
  id: string;
  text: string;
  geography: Geography;
  aminCount: number;
  createdAt: string;
};

const DEMO_PRAYERS: Prayer[] = [
  { id: "p1", text: "Ya Rabbi, mazlum halkları kurtar, sabır ve sebat ver.", geography: "filistin", aminCount: 47, createdAt: "2026-10-06" },
  { id: "p2", text: "Allah'ım Gazze'deki çocukları koru, ailelerine kavuştur.", geography: "filistin", aminCount: 93, createdAt: "2026-10-05" },
  { id: "p3", text: "Ya Rabbi, Doğu Türkistan'daki kardeşlerimizi esaretten kurtar.", geography: "dogu_turkistan", aminCount: 62, createdAt: "2026-10-04" },
  { id: "p4", text: "Allah'ım zulme uğrayan tüm Müslümanlara yardım et, kalplerimizi birleştir.", geography: "filistin", aminCount: 38, createdAt: "2026-10-07" },
  { id: "p5", text: "Rabbim Uygur Türklerinin dilini, dinini ve kimliğini muhafaza eyle.", geography: "dogu_turkistan", aminCount: 55, createdAt: "2026-10-06" },
];

const MAX_LENGTH = 200;

export default function PrayerWall({ geography }: { geography: Geography }) {
  const [prayers, setPrayers] = useState<Prayer[]>(DEMO_PRAYERS);
  const [newText, setNewText] = useState("");
  const [aminedIds, setAminedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  const filtered = prayers
    .filter((p) => p.geography === geography)
    .sort((a, b) => b.aminCount - a.aminCount);

  const handleAmin = useCallback((id: string) => {
    if (aminedIds.has(id)) return;
    setAminedIds((prev) => new Set(prev).add(id));
    setPrayers((prev) => prev.map((p) => p.id === id ? { ...p, aminCount: p.aminCount + 1 } : p));
  }, [aminedIds]);

  const handleSubmit = useCallback(() => {
    const text = newText.trim();
    if (!text || text.length > MAX_LENGTH) return;
    const prayer: Prayer = {
      id: `user-${Date.now()}`,
      text,
      geography,
      aminCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setPrayers((prev) => [prayer, ...prev]);
    setNewText("");
    setShowForm(false);
  }, [newText, geography]);

  return (
    <section className="awareness-prayer-wall">
      <header className="awareness-prayer-header">
        <div>
          <AppIcon name="heart-handshake" />
          <h3>Dua Duvarı</h3>
        </div>
        <p>{GEOGRAPHY_META[geography].name} için topluluk duaları</p>
        <button className="awareness-prayer-add" onClick={() => setShowForm(!showForm)}>
          <AppIcon name={showForm ? "x" : "plus"} /> {showForm ? "Kapat" : "Dua ekle"}
        </button>
      </header>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className="awareness-prayer-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value.slice(0, MAX_LENGTH))}
              placeholder="Duanı buraya yaz..."
              rows={3}
            />
            <div className="awareness-prayer-form-footer">
              <small>{newText.length}/{MAX_LENGTH}</small>
              <button onClick={handleSubmit} disabled={!newText.trim()}>
                <AppIcon name="send" /> Paylaş
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="awareness-prayer-list">
        {filtered.map((prayer, i) => (
          <motion.article
            key={prayer.id}
            className="awareness-prayer-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <p>{prayer.text}</p>
            <footer>
              <small>{prayer.createdAt}</small>
              <button
                className={`awareness-amin-btn ${aminedIds.has(prayer.id) ? "amined" : ""}`}
                onClick={() => handleAmin(prayer.id)}
                disabled={aminedIds.has(prayer.id)}
              >
                <AppIcon name="heart" /> Amin ({prayer.aminCount})
              </button>
            </footer>
          </motion.article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="awareness-prayer-empty">
          Henüz dua eklenmemiş. İlk duayı sen ekle.
        </p>
      )}
    </section>
  );
}
