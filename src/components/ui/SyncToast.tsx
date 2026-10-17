"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSyncToastStore } from "@/store/useSyncToastStore";
import { AppIcon } from "./AppIcon";

const LABELS: Record<string, string> = {
  addJournal: "Günlük kaydı",
  deleteJournal: "Günlük silme",
  addQuranNote: "Kur'an notu",
  deleteQuranNote: "Kur'an notu silme",
  addHadisNote: "Hadis notu",
  deleteHadisNote: "Hadis notu silme",
  addTask: "Görev",
  toggleTask: "Görev güncelleme",
  deleteTask: "Görev silme",
  addLesson: "Ders kaydı",
  deleteLesson: "Ders silme",
  addSukur: "Şükür kaydı",
  upsertSukur: "Şükür güncelleme",
  deleteSukur: "Şükür silme",
  addFocusSession: "Odak oturumu",
  updateFocusSessionReflection: "Odak yansıması",
  linkFocusSession: "Odak bağlantısı",
  logFocusToJournal: "Odak günlüğü",
  incrementTespih: "Tespih sayacı",
  setVehicle: "Araç seçimi",
  addXP: "XH puanı",
  unlockBadge: "Rozet",
  updateStreak: "Seri güncelleme",
};

export default function SyncToast() {
  const errors = useSyncToastStore((s) => s.errors);
  const dismiss = useSyncToastStore((s) => s.dismiss);

  return (
    <div className="sync-toast-container" aria-live="assertive">
      <AnimatePresence>
        {errors.map((error) => (
          <motion.div
            key={error.id}
            className="sync-toast"
            role="alert"
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <span className="sync-toast-icon">
              <AppIcon name="cloud-off" />
            </span>
            <span className="sync-toast-text">
              <strong>{LABELS[error.context] ?? error.context}</strong> senkronize edilemedi
            </span>
            <button
              type="button"
              className="sync-toast-close"
              onClick={() => dismiss(error.id)}
              aria-label="Bildirimi kapat"
            >
              <AppIcon name="x" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
