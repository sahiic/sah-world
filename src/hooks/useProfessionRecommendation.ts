'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getDailyLesson, type ProfessionLesson } from '@/lib/professionSchool'
import { useAuthStore } from '@/store/useAuthStore'

export function useProfessionRecommendation() {
  const userId=useAuthStore(state=>state.session?.access_token==='mock-token' ? null : state.session?.user.id ?? null)
  const [state,setState]=useState<{userId:string|null;lesson:ProfessionLesson|null}>({userId:null,lesson:null})
  useEffect(()=>{
    if(!userId)return
    let active=true,request=0
    const refresh=async()=>{
      const version=++request
      try {
        const [tracks,progress]=await Promise.all([
          supabase.from('user_profession_tracks').select('track_id').eq('user_id',userId).order('followed_at'),
          supabase.from('user_lesson_progress').select('lesson_id').eq('user_id',userId),
        ])
        if(!active || version!==request)return
        setState({userId,lesson:tracks.error || progress.error ? null : getDailyLesson((tracks.data ?? []).map(item=>item.track_id),new Set((progress.data ?? []).map(item=>item.lesson_id)))})
      } catch {if(active && version===request)setState({userId,lesson:null})}
    }
    void refresh()
    const changed=()=>void refresh()
    window.addEventListener('sah:activity-changed',changed)
    return ()=>{active=false;window.removeEventListener('sah:activity-changed',changed)}
  },[userId])
  // Never display a previous account's recommendation, even before effect cleanup.
  return userId && state.userId===userId ? state.lesson : null
}
