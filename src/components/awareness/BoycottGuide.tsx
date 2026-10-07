"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  BOYCOTT_CATEGORIES,
  BOYCOTT_ITEMS,
  BOYCOTT_SOURCE,
  getWeeklyFocus,
  type BoycottCategory,
  type BoycottItem,
} from "@/lib/boycottData";

export default function BoycottGuide({ userBoycotts, onToggleBoycott }: {
  userBoycotts: Set<string>;
  onToggleBoycott: (itemId: string) => void;
}) {
  const [category, setCategory] = useState<BoycottCategory | "all">("all");
  const [search, setSearch] = useState("");
  const weeklyFocus = useMemo(() => getWeeklyFocus(), []);

  const filtered = useMemo(() => {
    let items = BOYCOTT_ITEMS.filter((item) => item.isActive);
    if (category !== "all") items = items.filter((item) => item.category === category);
    if (search.trim()) {
      const q = search.toLocaleLowerCase("tr-TR");
      items = items.filter((item) =>
        item.brandName.toLocaleLowerCase("tr-TR").includes(q) ||
        item.parentCompany.toLocaleLowerCase("tr-TR").includes(q) ||
        item.alternatives.some((alt) => alt.name.toLocaleLowerCase("tr-TR").includes(q)),
      );
    }
    return items;
  }, [category, search]);

  const boycottCount = BOYCOTT_ITEMS.filter((item) => userBoycotts.has(item.id)).length;

  return (
    <section className="awareness-boycott">
      <header className="awareness-boycott-header">
        <span>BİLİNÇLİ TÜKETİM REHBERİ</span>
        <h2>Boykot et, yerli alternatifini keşfet.</h2>
        <p>Her markanın boykot nedeni kaynağa dayalıdır. Alternatifler yerli ve etik seçeneklerdir.</p>
      </header>

      {weeklyFocus && (
        <div className="awareness-boycott-weekly">
          <span><AppIcon name="star" /> BU HAFTANIN ODAĞI</span>
          <strong>{weeklyFocus.brandName}</strong>
          <p>{weeklyFocus.reason}</p>
          <div className="awareness-boycott-alts">
            {weeklyFocus.alternatives.map((alt) => (
              <span key={alt.name} className="awareness-alt-chip"><AppIcon name="leaf" /> {alt.name}</span>
            ))}
          </div>
        </div>
      )}

      <div className="awareness-boycott-progress">
        <div className="awareness-boycott-bar">
          <span style={{ width: `${(boycottCount / Math.max(BOYCOTT_ITEMS.length, 1)) * 100}%` }} />
        </div>
        <small>{boycottCount}/{BOYCOTT_ITEMS.length} markayı bıraktın</small>
      </div>

      <div className="awareness-boycott-controls">
        <div className="awareness-boycott-search">
          <AppIcon name="search" />
          <input
            type="text"
            placeholder="Marka veya alternatif ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Marka arama"
          />
          {search && <button onClick={() => setSearch("")} aria-label="Aramayı temizle"><AppIcon name="x" /></button>}
        </div>
        <div className="awareness-boycott-cats">
          <button className={category === "all" ? "active" : ""} onClick={() => setCategory("all")}>
            <AppIcon name="list" /> Tümü
          </button>
          {BOYCOTT_CATEGORIES.map((cat) => (
            <button key={cat.id} className={category === cat.id ? "active" : ""} onClick={() => setCategory(cat.id)}>
              <AppIcon name={cat.icon} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="awareness-boycott-grid" role="list">
        <AnimatePresence mode="popLayout">
          {filtered.map((item) => (
            <BoycottCard key={item.id} item={item} isBoycotting={userBoycotts.has(item.id)} onToggle={() => onToggleBoycott(item.id)} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="awareness-boycott-empty">
            <AppIcon name="search-off" />
            <p>Aramanızla eşleşen marka bulunamadı.</p>
          </div>
        )}
      </div>

      <footer className="awareness-boycott-source">
        <AppIcon name="shield-check" />
        <div>
          <strong>Kaynak</strong>
          <a href={BOYCOTT_SOURCE.url} target="_blank" rel="noopener noreferrer">
            {BOYCOTT_SOURCE.name} <AppIcon name="external-link" />
          </a>
        </div>
      </footer>
    </section>
  );
}

function BoycottCard({ item, isBoycotting, onToggle }: { item: BoycottItem; isBoycotting: boolean; onToggle: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const catMeta = BOYCOTT_CATEGORIES.find((c) => c.id === item.category);

  return (
    <motion.article
      className={`awareness-boycott-card ${isBoycotting ? "is-boycotting" : ""}`}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      role="listitem"
    >
      <div className="awareness-boycott-card-top">
        <div>
          <small><AppIcon name={catMeta?.icon ?? "dots"} /> {catMeta?.label ?? item.category}</small>
          <h3>{item.brandName}</h3>
          <span className="awareness-boycott-parent">{item.parentCompany}</span>
        </div>
        <button
          className={`awareness-boycott-toggle ${isBoycotting ? "active" : ""}`}
          onClick={onToggle}
          aria-label={isBoycotting ? `${item.brandName} boykotunu kaldır` : `${item.brandName} markasını boykot et`}
        >
          <AppIcon name={isBoycotting ? "circle-check-filled" : "circle-dashed"} />
          <span>{isBoycotting ? "Boykot ediyorum" : "Boykot et"}</span>
        </button>
      </div>

      <p className="awareness-boycott-reason">{item.reason}</p>

      <button className="awareness-boycott-expand" onClick={() => setExpanded(!expanded)}>
        <AppIcon name={expanded ? "chevron-up" : "chevron-down"} />
        {expanded ? "Kapat" : `${item.alternatives.length} alternatif gör`}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className="awareness-boycott-alts-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span className="awareness-alt-label"><AppIcon name="leaf" /> YERLİ ALTERNATİFLER</span>
            {item.alternatives.map((alt) => (
              <div key={alt.name} className="awareness-alt-row">
                <strong>{alt.name}</strong>
                <small>{alt.note}</small>
              </div>
            ))}
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="awareness-boycott-src">
              Kaynak: {item.sourceName} <AppIcon name="external-link" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}
