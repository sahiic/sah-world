import { AppIcon } from '@/components/ui/AppIcon'
import type { ProfessionLesson, ProfessionTrack } from '@/lib/professionSchool'

export default function DailyLessonCard({lesson,track,onOpen,compact=false}:{lesson:ProfessionLesson;track:ProfessionTrack;onOpen:()=>void;compact?:boolean}) {
  return <section className={`daily-lesson-card${compact?' is-compact':''}`} aria-label="Bugünkü dersin">
    <span className="daily-lesson-icon" aria-hidden="true"><AppIcon name={track.icon}/></span>
    <div><span className="daily-lesson-eyebrow">BUGÜNKÜ DERSİN</span><h2>{lesson.title}</h2><p>{track.professionName} · {lesson.durationEstimateMinutes} dakika · Ders {lesson.orderIndex}/8</p></div>
    <button type="button" onClick={onOpen}>{compact?'Devam et':'Derse başla'}<AppIcon name="arrow-right"/></button>
  </section>
}
