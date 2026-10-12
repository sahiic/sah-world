"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ProfessionLesson, ProfessionTrack } from "@/lib/professionSchool";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useProfessionDialog } from './useProfessionDialog';
import { createPortal } from 'react-dom';

type Props = {activeLesson: ProfessionLesson | null; activeTrack?: ProfessionTrack; reflection: string; completedIds: Set<string>; saving: boolean; onReflection: (value: string) => void; onClose: () => void; onComplete: () => void};
export default function ProfessionLessonReader({activeLesson, activeTrack, reflection, completedIds, saving, onReflection, onClose, onComplete}: Props) {
  const ref=useProfessionDialog(Boolean(activeLesson),onClose);
  const reduced=useReducedMotion();
  return typeof document==='undefined' ? null : createPortal(<AnimatePresence>
        {activeLesson && (
          <motion.div
            className="lesson-reader-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) =>
              event.target === event.currentTarget && onClose()
            }
          >
            <motion.article
              ref={ref}
              tabIndex={-1}
              className="lesson-reader"
              role="dialog"
              aria-modal="true"
              aria-labelledby="lesson-reader-title"
              initial={reduced ? false : { opacity: 0, y: 22, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.99 }}
              transition={{duration:reduced?0:.2}}
            >
              <button
                className="lesson-close"
                onClick={() => onClose()}
                aria-label="Dersi kapat"
              >
                <AppIcon name="x" />
              </button>
              <header>
                <span className="eyebrow">
                  {activeTrack?.professionName.toLocaleUpperCase("tr-TR")} ·
                  DERS {activeLesson.orderIndex}
                </span>
                <h2 id="lesson-reader-title">{activeLesson.title}</h2>
                <p>
                  <AppIcon name="clock" />{" "}
                  {activeLesson.durationEstimateMinutes} dakika <span>·</span> +
                  {activeLesson.xpReward} XH
                </p>
              </header>
              <blockquote className="lesson-opening">
                {activeLesson.content.openingArabic && (
                  <span lang="ar" dir="rtl">
                    {activeLesson.content.openingArabic}
                  </span>
                )}
                <p>“{activeLesson.content.openingText}”</p>
                <small>
                  {activeLesson.content.openingType === "ayet"
                    ? "Kur’an-ı Kerim"
                    : "Hadis-i şerif"}
                </small>
              </blockquote>
              <section className="lesson-explanation">
                <p className="eyebrow">MESLEKTEKİ KARŞILIĞI</p>
                <p>{activeLesson.content.explanation}</p>
              </section>
              <section className="lesson-action">
                <AppIcon name="target-arrow" />
                <div>
                  <small>BUGÜN NASIL UYGULARSIN?</small>
                  <p>{activeLesson.content.action}</p>
                </div>
              </section>
              <section className="lesson-sources">
                <p className="eyebrow">DOĞRULANMIŞ KAYNAK</p>
                {activeLesson.sourceReferences.map((source) => (
                  <a
                    key={source.url}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <AppIcon name="external-link" /> {source.label}
                  </a>
                ))}
              </section>
              <label className="lesson-reflection">
                <span>
                  Kısa tefekkür notun{" "}
                  <small>İsteğe bağlı · yalnızca sana görünür</small>
                </span>
                <textarea
                  rows={3}
                  maxLength={600}
                  value={reflection}
                  onChange={(event) => onReflection(event.target.value)}
                  placeholder="Bu dersten işime taşıyacağım şey…"
                  disabled={completedIds.has(activeLesson.id)}
                />
              </label>
              <button
                className="primary-button lesson-complete"
                onClick={() => onComplete()}
                disabled={saving || completedIds.has(activeLesson.id)}
              >
                {completedIds.has(activeLesson.id) ? (
                  <>
                    <AppIcon name="circle-check-filled" /> Tamamlandı
                  </>
                ) : saving ? (
                  "Kaydediliyor…"
                ) : (
                  <>
                    <AppIcon name="check" /> Tamamladım · +
                    {activeLesson.xpReward} XH
                  </>
                )}
              </button>
            </motion.article>
          </motion.div>
        )}
      </AnimatePresence>,document.querySelector('.core-app') || document.body); }
