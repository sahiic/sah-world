"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ProfessionLesson, ProfessionTrack } from "@/lib/professionSchool";
import { professionProgress } from "@/lib/professionSchool";

type Props = {activeTrack: ProfessionTrack; activeTrackLessons: ProfessionLesson[]; completedIds: Set<string>; onOpenLesson: (lesson: ProfessionLesson, unlocked: boolean) => void};
export default function ProfessionLearningShell({activeTrack, activeTrackLessons, completedIds, onOpenLesson}: Props) { return (<section
          className="profession-learning-shell"
          style={
            { "--track-accent": activeTrack.colorAccent } as React.CSSProperties
          }
        >
          <aside className="profession-course-summary">
            <span className="track-icon">
              <AppIcon name={activeTrack.icon} />
            </span>
            <p className="eyebrow">AKTİF ÖĞRENME YOLU</p>
            <h2>{activeTrack.professionName}</h2>
            <p>{activeTrack.description}</p>
            {(() => {
              const value = professionProgress(completedIds, activeTrack.id);
              return (
                <>
                  <div className="course-progress">
                    <span>
                      <b style={{ width: `${value.percent}%` }} />
                    </span>
                    <strong>%{value.percent}</strong>
                  </div>
                  <small>
                    {value.completed}/{value.total} ders · Her ders 30 XH
                  </small>
                </>
              );
            })()}
            <div className="course-principles">
              <span>Niyet</span>
              <span>Emanet</span>
              <span>İhsan</span>
              <span>Adalet</span>
            </div>
          </aside>
          <div
            className="lesson-path"
            aria-label={`${activeTrack.professionName} ders yolu`}
          >
            {activeTrackLessons.map((lesson, index) => {
              const done = completedIds.has(lesson.id);
              const unlocked =
                index === 0 ||
                completedIds.has(activeTrackLessons[index - 1].id);
              return (
                <button
                  key={lesson.id}
                  className={`${done ? "is-complete" : unlocked ? "is-unlocked" : "is-locked"} path-side-${index % 3}`}
                  onClick={() => onOpenLesson(lesson, unlocked)}
                  aria-label={`${lesson.orderIndex}. ders: ${lesson.title} · ${done ? "tamamlandı" : unlocked ? "açık" : "kilitli"}`}
                >
                  <span className="path-node">
                    {done ? (
                      <AppIcon name="check" />
                    ) : unlocked ? (
                      lesson.orderIndex
                    ) : <AppIcon name="lock"/>}
                  </span>
                  <span className="path-label">
                    <small>{lesson.durationEstimateMinutes} DK · {lesson.orderIndex <= 5 ? 'ORTAK TEMEL' : 'MESLEĞE ÖZEL'}</small>
                    <strong>{lesson.title}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        </section>); }
