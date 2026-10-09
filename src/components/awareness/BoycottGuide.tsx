"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  BOYCOTT_CATEGORIES,
  BOYCOTT_ITEMS,
  BOYCOTT_SOURCE,
  BOYCOTT_STATUS_META,
  BOYCOTT_REVIEWED_AT,
  type BoycottCategory,
  type BoycottItem,
  type BoycottStatus,
} from "@/lib/boycottData";

export default function BoycottGuide({ userBoycotts, onToggleBoycott }: {
  userBoycotts: Set<string>;
  onToggleBoycott: (itemId: string) => void;
}) {
  const [category, setCategory] = useState<BoycottCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<BoycottStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);

  const filtered = useMemo(() => {
    let items = BOYCOTT_ITEMS.filter((item) => item.isActive);
    if (category !== "all") items = items.filter((item) => item.category === category);
    if (statusFilter !== "all") items = items.filter((item) => item.status === statusFilter);
    if (search.trim()) {
      const q = search.toLocaleLowerCase("tr-TR");
      items = items.filter((item) =>
        item.brandName.toLocaleLowerCase("tr-TR").includes(q) ||
        item.parentCompany.toLocaleLowerCase("tr-TR").includes(q) ||
        item.alternatives.some((alt) => alt.name.toLocaleLowerCase("tr-TR").includes(q)),
      );
    }
    return items;
  }, [category, statusFilter, search]);

  const stats = useMemo(() => ({
    boykot: BOYCOTT_ITEMS.filter((i) => i.isActive && i.status === "boykot").length,
    supheli: BOYCOTT_ITEMS.filter((i) => i.status === "supheli").length,
    uygun: BOYCOTT_ITEMS.filter((i) => i.status === "uygun").length,
  }), []);


  return (
    <section className="awareness-boycott">
      <header className="awareness-boycott-header">
        <span>BİLİNÇLİ TÜKETİM REHBERİ</span>
        <h2>Tercihini bilgiyle yap.</h2>
        <p>{BOYCOTT_ITEMS.filter((i) => i.isActive).length} marka · {BOYCOTT_CATEGORIES.length} kategori · kaynak değerlendirmeleri.</p>
        <p className="awareness-source-policy">Etiketler Boykot Dedektifi’nin görüşünü yansıtır; bağımsız bir uygunluk garantisi değildir. Kontrol: {new Date(`${BOYCOTT_REVIEWED_AT}T12:00:00`).toLocaleDateString("tr-TR")}. Yerel seçenekler birebir ürün veya boykot uygunluğu garantisi taşımaz.</p>
      </header>

      <div className="awareness-boycott-stats">
        {(["boykot", "supheli", "uygun"] as BoycottStatus[]).map((s) => {
          const meta = BOYCOTT_STATUS_META[s];
          return (
            <button
              key={s}
              className={`awareness-status-chip ${statusFilter === s ? "active" : ""}`}
              style={{ "--chip-color": meta.color, "--chip-bg": meta.bg, "--chip-dark-bg": meta.darkBg } as React.CSSProperties}
              aria-pressed={statusFilter === s}
              onClick={() => { setStatusFilter(statusFilter === s ? "all" : s); setVisibleCount(6); }}
            >
              <span className="awareness-status-dot" />
              <strong>{stats[s]}</strong>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="awareness-boycott-controls">
        <div className="awareness-boycott-search">
          <AppIcon name="search" />
          <input
            type="text"
            placeholder="Marka veya alternatif ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setVisibleCount(6); }}
            aria-label="Marka arama"
          />
          {search && <button onClick={() => setSearch("")} aria-label="Aramayı temizle"><AppIcon name="x" /></button>}
        </div>
        <div className="awareness-boycott-cats">
          <button className={category === "all" ? "active" : ""} aria-pressed={category === "all"} onClick={() => { setCategory("all"); setVisibleCount(6); }}>
            <AppIcon name="list" /> Tümü
          </button>
          {BOYCOTT_CATEGORIES.map((cat) => (
            <button key={cat.id} className={category === cat.id ? "active" : ""} aria-pressed={category === cat.id} onClick={() => { setCategory(cat.id); setVisibleCount(6); }}>
              <AppIcon name={cat.icon} /> {cat.label}
            </button>
          ))}
        </div>
      </div>

      {(category !== "all" || statusFilter !== "all" || search) && (
        <p className="awareness-boycott-filter-info" role="status">
          <AppIcon name="filter" /> <strong>{filtered.length}</strong> marka gösteriliyor
          {statusFilter !== "all" && <> · <span style={{ color: BOYCOTT_STATUS_META[statusFilter].color }}>{BOYCOTT_STATUS_META[statusFilter].label}</span></>}
          {category !== "all" && <> · {BOYCOTT_CATEGORIES.find((c) => c.id === category)?.label}</>}
          {search && <> · &ldquo;{search}&rdquo;</>}
        </p>
      )}

      <div className="awareness-boycott-grid" role="list">
        <AnimatePresence mode="popLayout">
          {filtered.slice(0, visibleCount).map((item) => (
            <BoycottCard key={item.id} item={item} isBoycotting={userBoycotts.has(item.id)} onToggle={() => onToggleBoycott(item.id)} />
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="awareness-boycott-empty">
            <AppIcon name="search-x" />
            <p>Aramanızla eşleşen marka bulunamadı.</p>
          </div>
        )}
      </div>

      {visibleCount < filtered.length && <button className="ghost-button" onClick={() => setVisibleCount((count) => count + 6)}>Daha fazla marka ({filtered.length - visibleCount})</button>}
      <footer className="awareness-boycott-source">
        <AppIcon name="shield-check" />
        <div>
          <strong>Kaynaklar</strong>
          <a href={BOYCOTT_SOURCE.url} target="_blank" rel="noopener noreferrer">
            {BOYCOTT_SOURCE.name} <AppIcon name="external-link" />
          </a>
        </div>
      </footer>
    </section>
  );
}

function BoycottCard({ item, isBoycotting, onToggle }: { item: BoycottItem; isBoycotting: boolean; onToggle: () => void }) {
  const catMeta = BOYCOTT_CATEGORIES.find((c) => c.id === item.category);
  const statusMeta = BOYCOTT_STATUS_META[item.status];

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
          <div className="awareness-boycott-card-meta">
            <small><AppIcon name={catMeta?.icon ?? "dots"} /> {catMeta?.label ?? item.category}</small>
            <span
              className="awareness-status-badge"
              style={{ "--badge-color": statusMeta.color, "--badge-bg": statusMeta.bg, "--badge-dark-bg": statusMeta.darkBg } as React.CSSProperties}
            >
              {statusMeta.label}
            </span>
          </div>
          <h3>{item.brandName}</h3>
          <span className="awareness-boycott-parent">{item.parentCompany}</span>
        </div>
        {item.status === "boykot" && (
          <button
            className={`awareness-boycott-toggle ${isBoycotting ? "active" : ""}`}
            onClick={onToggle}
            aria-label={isBoycotting ? `${item.brandName} boykotunu kaldır` : `${item.brandName} markasını boykot et`}
          >
            <AppIcon name={isBoycotting ? "circle-check-filled" : "circle-dashed"} />
            <span>{isBoycotting ? "Boykot ediyorum" : "Boykot et"}</span>
          </button>
        )}
      </div>

      <p className="awareness-boycott-reason">{item.reason}</p>

      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="awareness-boycott-src">Kaynak değerlendirmesi <AppIcon name="external-link" /></a>
      <div className="awareness-boycott-alts-detail">
        <span className="awareness-alt-label">YEREL SEÇENEK</span>
        {item.alternatives.map((alt) => <div key={alt.name} className="awareness-alt-row">
          <strong>{alt.sourceUrl ? <a href={alt.sourceUrl} target="_blank" rel="noopener noreferrer">{alt.name} ↗</a> : alt.name}</strong><small>{alt.note}</small>
        </div>)}
      </div>
    </motion.article>
  );
}
