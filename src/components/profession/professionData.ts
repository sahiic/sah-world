import { supabase } from '@/lib/supabase'
import { PROFESSION_LESSONS, PROFESSION_TRACKS, professionLessonTitle, type ProfessionLesson, type ProfessionLessonContent } from '@/lib/professionSchool'
import type { Json } from '@/types/database'
export type Progress = { lessonId: string; reflectionNote: string | null; completedAt: string }
const isLessonContent = (value: Json): value is ProfessionLessonContent => Boolean(value && typeof value === 'object' && !Array.isArray(value) && typeof value.openingType === 'string' && typeof value.openingText === 'string' && typeof value.explanation === 'string' && typeof value.action === 'string')
// Data mapping only; state, navigation and mutations remain in the orchestrator.
export async function loadProfessionSchool(userId:string|null) {
  if(!userId)return {tracks:PROFESSION_TRACKS,lessons:PROFESSION_LESSONS,followed:new Set<string>(),progress:new Map<string,Progress>()}
  const [trackResult, lessonResult, followResult, progressResult] = await Promise.all([
    supabase.from('profession_tracks').select('*').order('profession_name'),
    supabase.from('profession_lessons').select('*').order('order_index'),
    supabase.from('user_profession_tracks').select('track_id').eq('user_id',userId),
    supabase.from('user_lesson_progress').select('lesson_id, reflection_note, completed_at').eq('user_id',userId),
  ])
  if(followResult.error || progressResult.error)throw new Error('progress_load_failed')
  const mapped = (lessonResult.data ?? []).flatMap(item => {
    const content = item.content_body as Json
    if (!isLessonContent(content) || !Array.isArray(item.source_references)) return []
    return [{id:item.id, trackId:item.track_id, title:professionLessonTitle(item.title), orderIndex:item.order_index, durationEstimateMinutes:item.duration_estimate_minutes, content, sourceReferences:item.source_references as unknown as ProfessionLesson['sourceReferences'], xpReward:item.xp_reward}]
  })
  return {
    tracks: trackResult.data?.length === PROFESSION_TRACKS.length ? trackResult.data.map(item=>({id:item.id,professionName:item.profession_name,icon:item.icon,description:item.description,colorAccent:item.color_accent})) : PROFESSION_TRACKS,
    lessons: mapped.length === PROFESSION_LESSONS.length ? mapped : PROFESSION_LESSONS,
    followed: new Set((followResult.data ?? []).map(item=>item.track_id)),
    progress: new Map<string,Progress>((progressResult.data ?? []).map(item=>[item.lesson_id,{lessonId:item.lesson_id,reflectionNote:item.reflection_note,completedAt:item.completed_at}])),
  }
}
