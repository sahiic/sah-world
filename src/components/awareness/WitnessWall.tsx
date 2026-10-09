"use client";
import { AWARENESS_CONTENT_FALLBACK, GEOGRAPHY_META, type Geography } from "@/lib/awareness";

export default function WitnessWall({ geography }: { geography: Geography }) {
  const items = AWARENESS_CONTENT_FALLBACK.filter(item => item.geography === geography && (item.section === "human" || item.section === "solidarity"));
  return <section className="awareness-witness-wall">
    <header className="awareness-witness-header"><div><h3>İnsan hikâyeleri</h3><p>{GEOGRAPHY_META[geography].name} · Kaynakların kısa özeti; doğrudan alıntı değildir.</p></div></header>
    <div className="awareness-witness-grid">{items.map(item => <article className="awareness-witness-card" key={item.id}><h3>{item.sectionTitle}</h3><p>{item.contentBody}</p><a className="awareness-source-link" href={item.sourceUrl} target="_blank" rel="noopener noreferrer">{item.sourceName} ↗</a></article>)}</div>
  </section>;
}
