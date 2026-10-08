"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
export default function QuranModal({
  children,
  onClose,
  label,
  className = "",
}: {
  children: ReactNode;
  onClose: () => void;
  label: string;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null),
    close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        root.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    (focusable()[0] ?? root.current)?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close.current();
      }
      if (e.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items.at(-1);
        if (!first) {
          e.preventDefault();
          root.current?.focus();
          return;
        }
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            !root.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            !root.current?.contains(document.activeElement))
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="quran-modal-backdrop qc-modal-root">
      <section
        ref={root}
        tabIndex={-1}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
