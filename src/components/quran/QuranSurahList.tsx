import { AppIcon } from "@/components/ui/AppIcon";
import { type SurahProgress, SURAHS } from "@/lib/quranSurahs";
interface QuranSurahListProps {
  shown: { surah: (typeof SURAHS)[number]; start: number; end: number }[];
  id: number;
  progress: (id: number) => SurahProgress | undefined;
  onSelect: (id: number) => void;
}
export default function QuranSurahList({
  shown,
  id,
  progress,
  onSelect,
}: QuranSurahListProps) {
  return (
    <div className="qc-surah-grid">
      {shown.map(({ surah: s, start, end }) => (
        <button
          key={s.id}
          className={`qc-surah-cell ${progress(s.id)?.readStatus ?? "none"}`}
          onClick={() => {
            onSelect(s.id);
          }}
        >
          <span className="qc-surah-num">{s.id}</span>
          <strong>{s.name}</strong>
          <small>{id ? `${start}–${end}. ayet` : `${s.ayahCount} ayet`}</small>
          {progress(s.id)?.memorizeStatus === "memorized" && (
            <i className="qc-mem-badge">
              <AppIcon name="star-filled" />
            </i>
          )}
        </button>
      ))}
    </div>
  );
}
