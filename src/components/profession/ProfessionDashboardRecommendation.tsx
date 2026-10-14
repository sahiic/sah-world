'use client'
import { useProfessionRecommendation } from '@/hooks/useProfessionRecommendation'
import { PROFESSION_TRACKS } from '@/lib/professionSchool'
import DailyLessonCard from './DailyLessonCard'

export default function ProfessionDashboardRecommendation({onNavigate}:{onNavigate:(view:string)=>void}) {
  const lesson=useProfessionRecommendation()
  const track=PROFESSION_TRACKS.find(item=>item.id===lesson?.trackId)
  if(!lesson || !track)return null
  return <DailyLessonCard lesson={lesson} track={track} compact onOpen={()=>onNavigate('profession-school')}/>
}
