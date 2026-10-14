'use client'
import { motion, useReducedMotion } from 'framer-motion'
import { createPortal } from 'react-dom'
import type { CSSProperties } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import type { ProfessionTrack } from '@/lib/professionSchool'
import { useProfessionDialog } from './useProfessionDialog'

export type Certificate = {track:ProfessionTrack;completedAt:string;lessonCount:number;xp:number}
export default function ProfessionCertificate({certificate,onClose}:{certificate:Certificate|null;onClose:()=>void}) {
  const ref=useProfessionDialog(Boolean(certificate),onClose)
  const reduced=useReducedMotion()
  if(!certificate || typeof document==='undefined')return null
  const {track,completedAt,lessonCount,xp}=certificate
  return createPortal(<div className="certificate-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <motion.article ref={ref} tabIndex={-1} className="certificate-card" role="dialog" aria-modal="true" aria-labelledby="certificate-title" style={{'--track-accent':track.colorAccent} as CSSProperties} initial={reduced?false:{opacity:0,scale:.94}} animate={{opacity:1,scale:1}} transition={{duration:reduced?0:.25}}>
      <button className="certificate-close" type="button" aria-label="Sertifikayı kapat" onClick={onClose}><AppIcon name="x"/></button>
      <span className="certificate-seal" aria-hidden="true"><AppIcon name="certificate"/></span>
      <p className="certificate-eyebrow">SAHİ WORLD · ÖĞRENME YOLCULUĞU</p>
      <h2 id="certificate-title">Meslek Ahlakı Sertifikası</h2>
      <p className="certificate-profession"><AppIcon name={track.icon}/>{track.professionName}</p>
      <p>{lessonCount} dersin tamamını başarıyla tamamladın.</p>
      <time dateTime={completedAt}>{new Date(completedAt).toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})}</time>
      <p className="certificate-principles">Niyet · Emanet · İhsan · Adalet</p>
      <strong className="certificate-reward">{xp} XH · Yol boyunca kazanılan toplam</strong>
      <p className="certificate-note">Bu, uygulama içi öğrenme belgesidir; meslekî yetki veya resmî yeterlilik belgesi değildir.</p>
      <button className="primary-button" type="button" onClick={onClose}>Yolculuğuma devam et<AppIcon name="arrow-right"/></button>
    </motion.article>
  </div>,document.querySelector('.core-app') || document.body)
}
