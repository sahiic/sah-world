"use client";
import QuranModal from "./QuranModal";
import { AppIcon } from "@/components/ui/AppIcon";
import { MILESTONE_BADGES } from "@/lib/quranExercises";
import { earnedBadges } from "@/lib/quranLearning";
import type {
  QuranExerciseResult,
  QuranStreak,
  SurahProgress,
} from "@/lib/quranSurahs";
export default function QuranAchievements({
  progress,
  streak,
  results,
  hasanat,
  awarded,
  onClose,
}: {
  progress: SurahProgress[];
  streak: QuranStreak;
  results: QuranExerciseResult[];
  hasanat: number;
  awarded?: string[];
  onClose?: () => void;
}) {
  const earned = new Set(
    earnedBadges(progress, streak, results, hasanat).map((b) => b.id),
  );
  const list = awarded
    ? MILESTONE_BADGES.filter((b) => awarded.includes(b.id))
    : MILESTONE_BADGES;
  const content = (
    <section
      className="qc-achievements"
      aria-label={onClose ? "Yeni başarım" : "Başarımlarım"}
    >
      <header>
        <span className="eyebrow">
          {onClose ? "YENİ BİR İZ BIRAKTIN" : "GAYRETİNİN İZLERİ"}
        </span>
        <h2>
          {onClose ? "Yeni başarımın hazır!" : "Her adımın bir karşılığı var."}
        </h2>
        <p>
          Rozetler çalışma alışkanlığını kutlar; dinî üstünlük veya yeterlilik
          belgesi değildir.
        </p>
      </header>
      <div className="qc-badge-grid">
        {list.map((b) => (
          <article
            key={b.id}
            className={
              earned.has(b.id) || awarded?.includes(b.id) ? "earned" : "locked"
            }
          >
            <AppIcon name={b.icon} />
            <strong>{b.name}</strong>
            <p>{b.description}</p>
            <span>
              {earned.has(b.id) || awarded?.includes(b.id)
                ? "Kazanıldı"
                : "Henüz kazanılmadı"}
            </span>
          </article>
        ))}
      </div>
      {onClose && (
        <button className="qc-btn-primary" onClick={onClose}>
          Çalışmaya devam et
        </button>
      )}
    </section>
  );
  return onClose ? (
    <QuranModal
      onClose={onClose}
      label="Yeni başarım"
      className="qc-award-dialog"
    >
      {content}
    </QuranModal>
  ) : (
    content
  );
}
