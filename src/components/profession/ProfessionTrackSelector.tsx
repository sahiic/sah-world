"use client";
import { useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ProfessionLesson, ProfessionTrack } from "@/lib/professionSchool";

type Props = {tracks: ProfessionTrack[]; lessons: ProfessionLesson[]; followed: Set<string>; completedIds: Set<string>; activeTrackId: string; onFollow: (id: string) => void; loading: boolean};
export default function ProfessionTrackSelector({tracks, lessons, followed, completedIds, activeTrackId, onFollow, loading}: Props) {
  const [query, setQuery] = useState('');
  const [onlyFollowed, setOnlyFollowed] = useState(false);
  const visible = tracks.filter(track => (!onlyFollowed || followed.has(track.id)) && `${track.professionName} ${track.description}`.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR')));
  return <section className="profession-selector" aria-labelledby="profession-select-title">
    <header><div><span className="eyebrow">KENDİ ALANINDA DERİNLEŞ</span><h2 id="profession-select-title">Öğrenme yolları</h2><p>Mesleğini seç; kısa derslerle kendi hızında ilerle.</p></div><span className="profession-catalog-count">{tracks.length} meslek alanı</span></header>
    <div className="profession-catalog-tools">
      <label className="profession-search"><AppIcon name="search" /><input type="search" aria-label="Meslek ara" placeholder="Meslek veya konu ara…" value={query} onChange={event=>setQuery(event.target.value)} /></label>
      <div className="profession-catalog-filters" aria-label="Öğrenme yolu filtresi"><button type="button" aria-pressed={!onlyFollowed} onClick={()=>setOnlyFollowed(false)}>Tüm alanlar</button><button type="button" aria-pressed={onlyFollowed} onClick={()=>setOnlyFollowed(true)}>Yollarım <span>{followed.size}</span></button></div>
    </div>
    <div className="profession-track-grid">
      {visible.map(track => {
        const lessonSet = lessons.filter(lesson=>lesson.trackId===track.id);
        const completed = lessonSet.filter(lesson=>completedIds.has(lesson.id)).length;
        const percent = lessonSet.length ? Math.round(completed/lessonSet.length*100) : 0;
        const isFollowed = followed.has(track.id);
        return <button key={track.id} type="button" disabled={loading} aria-pressed={activeTrackId===track.id} className={`${isFollowed ? 'is-followed' : ''} ${activeTrackId===track.id ? 'is-active' : ''}`} onClick={()=>onFollow(track.id)}>
          <span className="track-icon"><AppIcon name={track.icon}/></span>
          <span className="track-copy"><strong>{track.professionName}</strong><small>{track.description}</small></span>
          <span className="track-meta">{lessonSet.length} ders · {lessonSet.reduce((sum,lesson)=>sum+lesson.durationEstimateMinutes,0)} dk</span>
          <span className="track-progress"><progress value={percent} max={100} aria-label={`${track.professionName} ilerlemesi`}/><em>{isFollowed ? `${completed}/${lessonSet.length} tamamlandı` : 'Öğrenmeye başla'}<AppIcon name={activeTrackId===track.id ? 'check' : 'arrow-right'}/></em></span>
        </button>;
      })}
    </div>
    {visible.length===0 && <p className="profession-catalog-empty" role="status">{onlyFollowed && followed.size===0 ? 'Henüz bir öğrenme yolu seçmedin. Tüm alanlardan mesleğini seçerek başlayabilirsin.' : 'Bu aramayla eşleşen bir alan bulunamadı.'}</p>}
  </section>;
}
