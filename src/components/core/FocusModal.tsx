"use client";
import { motion } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";

export default function FocusModal({
  title,
  onClose,
  compact = false,
  children,
}: {
  title: string;
  onClose: () => void;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      className="focus-modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.section
        className={`focus-modal ${compact ? "compact" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-modal-title"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.99 }}
      >
        <header>
          <h2 id="focus-modal-title">{title}</h2>
          <button onClick={onClose} aria-label="Pencereyi kapat">
            <AppIcon name="x" />
          </button>
        </header>
        {children}
      </motion.section>
    </motion.div>
  );
}

export function ModalActions({
  onCancel,
  onConfirm,
  cancelLabel = "İptal",
  confirmLabel = "Onayla",
  danger = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <footer className="focus-modal-actions">
      <button onClick={onCancel}>{cancelLabel}</button>
      <button className={danger ? "danger" : "primary"} onClick={onConfirm}>
        {confirmLabel}
      </button>
    </footer>
  );
}
