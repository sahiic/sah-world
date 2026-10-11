import { AppIcon } from "@/components/ui/AppIcon";
import { COMPLETION_QUESTIONS, TAJWEED_QUESTIONS } from "@/lib/quranExercises";
import type { QuranExerciseResult } from "@/lib/quranSurahs";
interface QuranExerciseCardProps {
  m: QuranExerciseResult["type"];
  i: number;
  label: string;
  dueCount: number;
  onSelect: () => void;
}
export default function QuranExerciseCard({
  m,
  i,
  label,
  dueCount,
  onSelect,
}: QuranExerciseCardProps) {
  return (
    <button className={`qc-mode-card ${m}`} onClick={onSelect}>
      <span>
        <AppIcon
          name={
            [
              "abc",
              "text-recognition",
              "arrows-sort",
              "vocabulary",
              "book-2",
              "refresh",
            ][i]
          }
        />
      </span>
      <h3>{label}</h3>
      <p>
        {
          [
            "28 harfi tanı; sesli okuma için hocayla çalış.",
            `${COMPLETION_QUESTIONS.length} kaynaklı sorudan 8 soruluk pratik.`,
            "Ayetleri klavyeyle veya dokunarak sırala.",
            `${TAJWEED_QUESTIONS.length} açıklamalı harf birleşimi örneği.`,
            "Arapça ayet ile kısa Türkçe anlam özetini eşleştir.",
            `${dueCount} tekrar hazır. Öz değerlendirmeyle ritmini koru.`,
          ][i]
        }
      </p>
      <em>
        {m === "spaced" && dueCount === 0 ? "Tekrar listesi" : "Başla"}
        <AppIcon name="arrow-right" />
      </em>
    </button>
  );
}
