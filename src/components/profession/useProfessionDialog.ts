'use client'
import { useEffect, useRef } from 'react'

export function useProfessionDialog(active:boolean,onClose:()=>void) {
  const ref=useRef<HTMLElement>(null)
  const close=useRef(onClose)
  useEffect(()=>{close.current=onClose},[onClose])
  useEffect(()=>{
    if (!active) return
    const previous=document.activeElement as HTMLElement|null
    const overflow=document.body.style.overflow
    document.body.style.overflow='hidden'
    const items=()=>Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],textarea:not(:disabled),[tabindex="0"]') ?? []).filter(el=>el.getClientRects().length)
    items()[0]?.focus()
    const key=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();close.current();return}
      if(event.key!=='Tab')return
      const nodes=items(),first=nodes[0],last=nodes.at(-1)
      if(!first){event.preventDefault();ref.current?.focus();return}
      if(event.shiftKey && (document.activeElement===first || !ref.current?.contains(document.activeElement))){event.preventDefault();last?.focus()}
      else if(!event.shiftKey && (document.activeElement===last || !ref.current?.contains(document.activeElement))){event.preventDefault();first.focus()}
    }
    document.addEventListener('keydown',key)
    return ()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus()}
  },[active])
  return ref
}
