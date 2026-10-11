interface QuranProgressChartProps {
  juz: number;
  setJuz: (juz: number) => void;
  stats: (id: number) => { done: number; total: number };
}
export default function QuranProgressChart({
  juz,
  setJuz,
  stats,
}: QuranProgressChartProps) {
  return (
    <div className="qc-juz-journey" aria-label="30 cüz ilerlemesi">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((id) => {
        const s = stats(id);
        return (
          <button
            key={id}
            aria-pressed={juz === id}
            aria-label={`${id}. Cüz: ${s.done}/${s.total} ayet`}
            className={
              s.done === s.total ? "completed" : s.done > 0 ? "started" : ""
            }
            onClick={() => setJuz(juz === id ? 0 : id)}
          >
            <strong>{id}</strong>
            <progress value={s.done} max={s.total} />
            <span>{Math.round((s.done / s.total) * 100)}%</span>
          </button>
        );
      })}
    </div>
  );
}
