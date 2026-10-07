import { AppIcon } from "@/components/ui/AppIcon";
export const formatAppointment = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
export function EmptyState({
  icon,
  title,
  text,
  compact = false,
}: {
  icon: string;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={`quran-empty ${compact ? "compact" : ""}`}>
      <span>
        <AppIcon name={icon} />
      </span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
