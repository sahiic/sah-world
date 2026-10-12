'use client'
import { useEffect, useMemo, useState } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { PROFESSION_LESSONS, PROFESSION_TRACKS, type ProfessionLesson, type ProfessionTrack } from '@/lib/professionSchool'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { isValidUUID, useJourneyStore } from '@/store/useJourneyStore'
import { loadProfessionSchool, type Progress } from './professionData'
import ProfessionHero from './ProfessionHero'
import ProfessionTrackSelector from './ProfessionTrackSelector'
import ProfessionLearningShell from './ProfessionLearningShell'
import ProfessionLessonReader from './ProfessionLessonReader'
import ProfessionEmptyState from './ProfessionEmptyState'

export default function ProfessionSchoolView({onNavigate}: {onNavigate:(view:string)=>void}) {
  const user = useAuthStore(state=>state.user)
  const journey = useJourneyStore()
  const [tracks, setTracks] = useState<ProfessionTrack[]>(PROFESSION_TRACKS)
  const [lessons, setLessons] = useState<ProfessionLesson[]>(PROFESSION_LESSONS)
  const [followed, setFollowed] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<Map<string,Progress>>(new Map())
  const [activeTrackId, setActiveTrackId] = useState('')
  const [activeLesson, setActiveLesson] = useState<ProfessionLesson|null>(null)
  const [reflection, setReflection] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  useEffect(()=>{
    let active = true
    void loadProfessionSchool().then(data=>{
      if (!active) return
      setTracks(data.tracks); setLessons(data.lessons); setFollowed(data.followed); setProgress(data.progress)
      setActiveTrackId(data.followed.values().next().value || '')
    })
    return ()=>{active=false}
  },[])
  const completedIds = useMemo(()=>new Set(progress.keys()),[progress])
  const activeTrack = tracks.find(track=>track.id===activeTrackId)
  const activeTrackLessons = lessons.filter(lesson=>lesson.trackId===activeTrackId).sort((a,b)=>a.orderIndex-b.orderIndex)
  const overall = followed.size ? Math.round([...followed].reduce((sum,id)=>{
    const subset=lessons.filter(lesson=>lesson.trackId===id)
    return sum+(subset.length ? subset.filter(lesson=>completedIds.has(lesson.id)).length/subset.length : 0)
  },0)/followed.size*100) : 0
  const flash = (message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),3600)}
  const follow = async (trackId:string)=>{
    if (followed.has(trackId)) {setActiveTrackId(trackId);return}
    if (user?.id && isValidUUID(user.id)) {
      const {error}=await supabase.from('user_profession_tracks').upsert({user_id:user.id,track_id:trackId},{onConflict:'user_id,track_id'})
      if (error) {flash('Alan eklenemedi. Bağlantını kontrol edip yeniden dene.');return}
    }
    setFollowed(current=>new Set(current).add(trackId));setActiveTrackId(trackId)
    flash('Meslek yolu çalışma alanına eklendi.')
  }
  const openLesson = (lesson:ProfessionLesson,unlocked:boolean)=>{
    if (!unlocked) {flash('Bu ders, önceki adımı tamamladığında açılacak.');return}
    setActiveLesson(lesson);setReflection(progress.get(lesson.id)?.reflectionNote || '')
  }
  const complete = async ()=>{
    if (!activeLesson || saving || completedIds.has(activeLesson.id)) return
    setSaving(true)
    const isDemo=!user?.id || !isValidUUID(user.id)
    let awarded=isDemo, trackCompleted=false
    if (!isDemo) {
      const {data,error}=await supabase.rpc('complete_profession_lesson',{target_lesson_id:activeLesson.id,reflection_text:reflection.trim() || null})
      if (error) {setSaving(false);flash('Ders kaydedilemedi. Lütfen yeniden dene.');return}
      const result=Array.isArray(data)?data[0]:data
      awarded=Boolean(result?.awarded);trackCompleted=Boolean(result?.track_completed)
    }
    setProgress(current=>new Map(current).set(activeLesson.id,{lessonId:activeLesson.id,reflectionNote:reflection.trim() || null,completedAt:new Date().toISOString()}))
    window.dispatchEvent(new Event('sah:activity-changed'))
    if (awarded) {journey.addXP(activeLesson.xpReward);journey.updateStreak()}
    setSaving(false)
    flash(trackCompleted ? `Meslek Ahlakı rozeti açıldı · +${activeLesson.xpReward} XH` : awarded ? `Ders tamamlandı · +${activeLesson.xpReward} XH` : 'Ders daha önce tamamlanmıştı.')
    window.setTimeout(()=>setActiveLesson(null),650)
  }
  return <div className="view-stack profession-school">
    <ProfessionHero followed={followed} completedIds={completedIds} overall={overall}/>
    {notice && <div className="profession-notice" role="status"><AppIcon name="circle-check"/> {notice}</div>}
    <ProfessionTrackSelector tracks={tracks} lessons={lessons} followed={followed} completedIds={completedIds} activeTrackId={activeTrackId} onFollow={follow}/>
    {activeTrack ? <ProfessionLearningShell activeTrack={activeTrack} activeTrackLessons={activeTrackLessons} completedIds={completedIds} onOpenLesson={openLesson}/> : <ProfessionEmptyState/>}
    <div className="context-links"><span><AppIcon name="link"/> Öğrendiğini günlük hayata taşı</span><div>
      <button type="button" onClick={()=>onNavigate('journal')}><AppIcon name="notebook"/> Ders üzerine günlük notu yaz<AppIcon name="arrow-right"/></button>
      <button type="button" onClick={()=>onNavigate('matrix')}><AppIcon name="layout-grid"/> Uygulama adımını planla<AppIcon name="arrow-right"/></button>
    </div></div>
    <ProfessionLessonReader activeLesson={activeLesson} activeTrack={activeTrack} reflection={reflection} completedIds={completedIds} saving={saving} onReflection={setReflection} onClose={()=>setActiveLesson(null)} onComplete={complete}/>
  </div>
}
