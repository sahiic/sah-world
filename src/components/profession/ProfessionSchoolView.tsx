'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { PROFESSION_LESSONS, PROFESSION_TRACKS, getDailyLesson, type ProfessionLesson, type ProfessionTrack } from '@/lib/professionSchool'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/useAuthStore'
import { isValidUUID, useJourneyStore } from '@/store/useJourneyStore'
import { loadProfessionSchool, type Progress } from './professionData'
import ProfessionHero from './ProfessionHero'
import ProfessionTrackSelector from './ProfessionTrackSelector'
import ProfessionLearningShell from './ProfessionLearningShell'
import ProfessionLessonReader from './ProfessionLessonReader'
import ProfessionEmptyState from './ProfessionEmptyState'
import ProfessionReflections from './ProfessionReflections'
import ProfessionCertificate, { type Certificate } from './ProfessionCertificate'

type ProfessionSchoolProps = {onNavigate:(view:string)=>void;onModalChange?:(open:boolean)=>void}

export default function ProfessionSchoolView(props: ProfessionSchoolProps) {
  const accountId = useAuthStore(state=>state.user?.id)
  return <ProfessionSchoolContent key={accountId || 'guest'} {...props}/>
}

function ProfessionSchoolContent({onNavigate,onModalChange}: ProfessionSchoolProps) {
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
  const [showReflections, setShowReflections] = useState(false)
  const [certificate, setCertificate] = useState<Certificate|null>(null)
  const savingRef=useRef(false)
  const [loading,setLoading]=useState(true)
  const userId=user?.id && isValidUUID(user.id) ? user.id : null
  useEffect(()=>{onModalChange?.(Boolean(activeLesson || certificate));return ()=>onModalChange?.(false)},[activeLesson,certificate,onModalChange])
  useEffect(()=>{
    let active = true
    void loadProfessionSchool(userId).then(data=>{
      if (!active) return
      setTracks(data.tracks); setLessons(data.lessons); setFollowed(data.followed); setProgress(data.progress)
      setActiveTrackId(data.followed.values().next().value || '')
      setLoading(false)
    }).catch(()=>{if(active){setLoading(false);setNotice('İlerlemen yüklenemedi. Verilerin korunuyor; sayfayı yenileyerek tekrar dene.')}})
    return ()=>{active=false}
  },[userId])
  const completedIds = useMemo(()=>new Set(progress.keys()),[progress])
  const suggestion = useMemo(()=>getDailyLesson([...followed],completedIds),[followed,completedIds])
  const dailyLesson = lessons.find(lesson=>lesson.id===suggestion?.id) ?? null
  const activeTrack = tracks.find(track=>track.id===activeTrackId)
  const activeTrackLessons = lessons.filter(lesson=>lesson.trackId===activeTrackId).sort((a,b)=>a.orderIndex-b.orderIndex)
  const overall = followed.size ? Math.round([...followed].reduce((sum,id)=>{
    const subset=lessons.filter(lesson=>lesson.trackId===id)
    return sum+(subset.length ? subset.filter(lesson=>completedIds.has(lesson.id)).length/subset.length : 0)
  },0)/followed.size*100) : 0
  const flash = (message:string)=>{setNotice(message);window.setTimeout(()=>setNotice(''),3600)}
  const follow = async (trackId:string)=>{
    if(loading)return
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
    setActiveTrackId(lesson.trackId)
    setActiveLesson(lesson);setReflection(progress.get(lesson.id)?.reflectionNote || '')
  }
  const complete = async ()=>{
    if (!activeLesson || savingRef.current || completedIds.has(activeLesson.id)) return
    savingRef.current=true
    setSaving(true)
    const isDemo=!user?.id || !isValidUUID(user.id)
    let awarded=isDemo, trackCompleted=false
    if (!isDemo) {
      const {data,error}=await supabase.rpc('complete_profession_lesson',{target_lesson_id:activeLesson.id,reflection_text:reflection.trim() || null})
      if (error) {savingRef.current=false;setSaving(false);flash('Ders kaydedilemedi. Lütfen yeniden dene.');return}
      const result=Array.isArray(data)?data[0]:data
      awarded=Boolean(result?.awarded);trackCompleted=Boolean(result?.track_completed)
    }
    const completedAt=new Date().toISOString()
    setProgress(current=>new Map(current).set(activeLesson.id,{lessonId:activeLesson.id,reflectionNote:reflection.trim() || null,completedAt}))
    window.dispatchEvent(new Event('sah:activity-changed'))
    if (awarded) {journey.addXP(activeLesson.xpReward);journey.updateStreak()}
    setSaving(false);savingRef.current=false
    const trackLessons=lessons.filter(lesson=>lesson.trackId===activeLesson.trackId)
    if(isDemo)trackCompleted=trackLessons.every(lesson=>lesson.id===activeLesson.id || completedIds.has(lesson.id))
    flash(trackCompleted ? `Meslek Ahlakı rozeti açıldı · +${activeLesson.xpReward} XH` : awarded ? `Ders tamamlandı · +${activeLesson.xpReward} XH` : 'Ders daha önce tamamlanmıştı.')
    const completedTrack=tracks.find(track=>track.id===activeLesson.trackId)
    if(trackCompleted && completedTrack)setCertificate({track:completedTrack,completedAt,lessonCount:trackLessons.length,xp:trackLessons.reduce((sum,lesson)=>sum+lesson.xpReward,0)})
    else window.setTimeout(()=>setActiveLesson(current=>current?.id===activeLesson.id ? null : current),650)
  }
  return <div className="view-stack profession-school">
    <ProfessionHero followed={followed} completedIds={completedIds} overall={overall} dailyLesson={dailyLesson} dailyTrack={tracks.find(track=>track.id===dailyLesson?.trackId)} onOpenLesson={openLesson}/>
    {notice && <div className="profession-notice" role="status"><AppIcon name="circle-check"/> {notice}</div>}
    <ProfessionTrackSelector tracks={tracks} lessons={lessons} followed={followed} completedIds={completedIds} activeTrackId={activeTrackId} onFollow={follow} loading={loading}/>
    {activeTrack ? <ProfessionLearningShell activeTrack={activeTrack} activeTrackLessons={activeTrackLessons} completedIds={completedIds} onOpenLesson={openLesson} showReflections={showReflections} onToggleReflections={()=>setShowReflections(value=>!value)} reflections={<ProfessionReflections lessons={lessons} progress={progress} onOpenLesson={openLesson}/>}/> : <ProfessionEmptyState/>}
    <div className="context-links"><span><AppIcon name="link"/> Öğrendiğini günlük hayata taşı</span><div>
      <button type="button" onClick={()=>onNavigate('journal')}><AppIcon name="notebook"/> Ders üzerine günlük notu yaz<AppIcon name="arrow-right"/></button>
      <button type="button" onClick={()=>onNavigate('matrix')}><AppIcon name="layout-grid"/> Uygulama adımını planla<AppIcon name="arrow-right"/></button>
    </div></div>
    <ProfessionLessonReader activeLesson={certificate ? null : activeLesson} activeTrack={tracks.find(track=>track.id===activeLesson?.trackId)} reflection={reflection} completedIds={completedIds} saving={saving} onReflection={setReflection} onClose={()=>{if(!savingRef.current)setActiveLesson(null)}} onComplete={complete}/>
    <ProfessionCertificate certificate={certificate} onClose={()=>{setCertificate(null);setActiveLesson(null)}}/>
  </div>
}
