import type { ProfessionLesson } from '@/lib/professionSchool'
import type { Progress } from './professionData'

export default function ProfessionReflections({lessons,progress,onOpenLesson}:{lessons:ProfessionLesson[];progress:Map<string,Progress>;onOpenLesson:(lesson:ProfessionLesson,unlocked:boolean)=>void}) {
  const notes=[...progress.values()].filter(item=>item.reflectionNote?.trim()).sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt))
  return <section className="reflection-list" id="profession-reflections" aria-labelledby="reflection-title">
    <header><span className="eyebrow">ÖĞRENDİĞİNİ HATIRLA</span><h2 id="reflection-title">Yansımalarım</h2><p>Takip ettiğin tüm yollardan, yalnızca sana ait düşünceler.</p></header>
    {notes.length===0 ? <p className="reflection-empty">Henüz yansıma notu yazmadın. Dersleri tamamlarken düşüncelerini kaydetmeyi dene.</p> : notes.map(note=>{
      const lesson=lessons.find(item=>item.id===note.lessonId)
      const date=new Date(note.completedAt)
      return <article className="reflection-card" key={note.lessonId}>
        <h3>{lesson?.title || 'Tamamlanan ders'}</h3>
        {Number.isFinite(date.getTime()) && <time dateTime={note.completedAt}>{date.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</time>}
        <p className="reflection-note">{note.reflectionNote}</p>
        {lesson?.sourceReferences.map(source=><a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a>)}
        {lesson && <button type="button" onClick={()=>onOpenLesson(lesson,true)}>Dersi yeniden oku</button>}
      </article>
    })}
  </section>
}
