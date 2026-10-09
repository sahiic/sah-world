import { AppIcon } from '@/components/ui/AppIcon';

// RLS-scoped events are not global totals. Show actual personal progress.
export default function CommunityImpact({ readCount, totalCount, quizCount, shareCount, boycottCount }: {
  readCount: number; totalCount: number; quizCount: number; shareCount: number; boycottCount: number;
}) {
  return <aside className="awareness-progress-inline" aria-label="Kişisel ilerlemen">
    <span><AppIcon name="chart-line" /> Senin katkın</span>
    <span><strong>{readCount}/{totalCount}</strong> bölüm</span>
    <span><strong>{quizCount}</strong> test</span>
    <span><strong>{shareCount}</strong> paylaşım</span>
    <span><strong>{boycottCount}</strong> tercih</span>
  </aside>;
}
