"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ProfessionLesson, ProfessionTrack } from "@/lib/professionSchool";
import type { ReactNode } from 'react';

type Props = {activeTrack: ProfessionTrack; activeTrackLessons: ProfessionLesson[]; completedIds: Set<string>; onOpenLesson: (lesson: ProfessionLesson, unlocked: boolean) => void; reflections?: ReactNode; showReflections: boolean; onToggleReflections: () => void};
export default function ProfessionLearningShell({activeTrack, activeTrackLessons, completedIds, onOpenLesson, reflections, showReflections, onToggleReflections}: Props) {
  const completed = activeTrackLessons.filter(lesson=>completedIds.has(lesson.id)).length;
  const percent = activeTrackLessons.length ? Math.round(completed/activeTrackLessons.length*100) : 0;
  return <section className="profession-learning-shell" id="profession-learning">
    <aside className="profession-course-summary">
      <span className="track-icon"><AppIcon name={activeTrack.icon}/></span>
      <p className="eyebrow">ÇALIŞMA ALANIN</p><h2>{activeTrack.professionName}</h2><p>{activeTrack.description}</p>
      <div className="course-progress"><progress value={percent} max={100} aria-label="Ders yolu ilerlemesi"/><strong>%{percent}</strong></div>
      <small>{completed}/{activeTrackLessons.length} ders tamamlandı</small>
      <div className="course-principles"><span>Niyet</span><span>Emanet</span><span>İhsan</span><span>Adalet</span></div>
      <button className="reflection-toggle" type="button" aria-expanded={showReflections} aria-controls="profession-reflections" onClick={onToggleReflections}><AppIcon name="notebook"/> {showReflections ? 'Ders yoluna dön' : 'Yansımalarım'}</button>
    </aside>
    {showReflections ? reflections : <div className="lesson-path" aria-label={`${activeTrack.professionName} ders yolu`}>
      <header><span className="eyebrow">ADIM ADIM ÖĞREN</span><h3>Ders programın</h3><p>Her ders bir sonrakine kapı açar. Tamamladığın dersleri istediğin zaman yeniden okuyabilirsin.</p></header>
      {activeTrackLessons.map((lesson,index)=>{
        const done=completedIds.has(lesson.id);
        const unlocked=index===0 || completedIds.has(activeTrackLessons[index-1].id);
        return <button key={lesson.id} type="button" className={done ? 'is-complete' : unlocked ? 'is-unlocked' : 'is-locked'} onClick={()=>onOpenLesson(lesson,unlocked)} aria-label={`${lesson.orderIndex}. ders: ${lesson.title} · ${done ? 'tamamlandı' : unlocked ? 'açık' : 'kilitli'}`}>
          <span className="path-node">{done ? <AppIcon name="check"/> : unlocked ? String(lesson.orderIndex).padStart(2,'0') : <AppIcon name="lock"/>}</span>
          <span className="path-label"><small>{lesson.orderIndex<=5 ? 'ORTAK TEMEL' : 'MESLEĞE ÖZEL'} · {lesson.durationEstimateMinutes} dk</small><strong>{lesson.title}</strong></span>
          <span className="path-status">{done ? 'Tamamlandı' : unlocked ? 'Başla' : 'Sıradaki adım'}<AppIcon name={done ? 'circle-check' : unlocked ? 'arrow-right' : 'lock'}/></span>
        </button>;
      })}
    </div>}
  </section>;
}
