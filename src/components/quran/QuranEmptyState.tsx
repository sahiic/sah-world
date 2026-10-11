import EmptyState from "@/components/ui/EmptyState";

interface QuranEmptyStateProps {
  icon: string;
  title: string;
  text: string;
  compact?: boolean;
}

export default function QuranEmptyState({
  text,
  ...props
}: QuranEmptyStateProps) {
  return <EmptyState {...props} description={text} variant="quran" />;
}
