import { AppIcon } from "./AppIcon";

export interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  compact?: boolean;
  className?: string;
  variant?: "default" | "quran";
  action?: { label: string; onClick: () => void };
}

export default function EmptyState({
  icon,
  title,
  description,
  compact = false,
  className = "",
  variant = "default",
  action,
}: EmptyStateProps) {
  const artwork = /^[a-z0-9-]+$/.test(icon) ? <AppIcon name={icon} /> : icon;
  return (
    <div
      className={`${variant === "quran" ? "quran-empty" : "empty-state"} ${compact ? "compact" : ""} ${className}`}
    >
      {variant === "quran" ? (
        <span aria-hidden="true">{artwork}</span>
      ) : (
        <i aria-hidden="true">{artwork}</i>
      )}
      <strong>{title}</strong>
      <p>{description}</p>
      {action && (
        <button type="button" className="ghost-button" onClick={action.onClick}>
          {action.label} <AppIcon name="arrow-right" />
        </button>
      )}
    </div>
  );
}
