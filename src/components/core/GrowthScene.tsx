'use client'

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { AppIcon } from '@/components/ui/AppIcon'
import { getLevelForXP, LEVELS } from '@/lib/constants'
import { getVitality, getSeason, type GrowthSceneData } from '@/lib/growthScene'
import { growthInputForCategory, type GrowthInputKey } from '@/lib/growthDiagram'
import type { ActivityEvent } from '@/lib/activity'
import type { GrowthNavigationCue } from './GrowthTree'
import { BotanicalScene } from './growth/BotanicalScene'
import styles from './growth/GrowthScene.module.css'

type Pulse = { source: GrowthInputKey; amount: number; key: string }
type Props = {
  data: GrowthSceneData
  events?: ActivityEvent[]
  loading?: boolean
  now?: number
  onNavigate: (view: string, cue?: GrowthNavigationCue) => void
}
const stageIcons = ['niyet', 'gayret', 'sebat', 'istikamet', 'muhasebe', 'tefekkur', 'hikmet', 'basiret', 'marifet', 'alem']
const descriptions = [
  'Niyet, görünmeyen başlangıcı anlamlı bir yöne çevirir.',
  'Gayret, niyetini günlük hayatın içinde küçük bir harekete dönüştürür.',
  'Sebat, iyi olanı tekrar etmeyi sakin ve güvenilir bir ritme kavuşturur.',
  'İstikamet, gayretini değerlerinle aynı yönde tutmana yardımcı olur.',
  'Muhasebe, yolculuğuna yargılamadan bakıp öğrendiğini ayırt etmektir.',
  'Tefekkür, görünenin ardındaki anlamla daha derin bir bağ kurar.',
  'Hikmet, öğrendiğin ile yaptığın arasında dengeli bir köprü kurar.',
  'Basiret, seçimlerinin etkisini daha berrak görmene alan açar.',
  'Marifet, bilgiyi davranışa ve kalıcı bir farkındalığa dönüştürür.',
  'Âlem, bütün gelişim alanlarının birbirini beslediği geniş ufuktur.',
]
// Ends enter the matching botanical region; coordinates share the orbit's viewBox.
const flows: Record<GrowthInputKey, string> = {
  quran: 'M 194 153 C 244 153 242 218 302 235',
  focus: 'M 686 153 C 613 153 643 360 451 366',
  sukur: 'M 194 341 C 236 341 225 120 530 131',
  lessons: 'M 686 341 C 619 341 647 493 530 488',
  journal: 'M 230 552 C 230 462 222 300 339 275',
  profession: 'M 650 552 C 650 425 568 337 475 321',
  mescidim: 'M 440 96 C 676 96 660 539 440 511',
}

export default function GrowthScene({ data, events = [], loading = false, now, onNavigate }: Props) {
  const root = useRef<HTMLElement>(null)
  const [reduced, setReduced] = useState(true)
  const uid = `garden-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)
  const [revealed, setRevealed] = useState(false)
  const [hovered, setHovered] = useState<GrowthInputKey | null>(null)
  const [pulse, setPulse] = useState<Pulse | null>(null)
  const [clock, setClock] = useState<number | null>(null)
  const known = useRef<Set<string> | null>(null)
  const playing = inView && visible && !reduced && !loading
  const vitality = getVitality(data.vitalityScore)
  const levelIndex = Math.max(0, Math.min(9, data.level - 1))
  const level = LEVELS[levelIndex]
  const next = LEVELS[levelIndex + 1]
  const xpLevel = getLevelForXP(data.xh)
  const progress = next ? Math.round(Math.max(0, Math.min(100, (data.xh - level.xp) / (next.xp - level.xp) * 100))) : 100

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReduced(preference.matches)
    updateMotion()
    preference.addEventListener('change', updateMotion)
    const update = () => { setVisible(!document.hidden); setClock(Date.now()) }
    update()
    const timer = window.setInterval(update, 60_000)
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting) setRevealed(true)
    }, { threshold: 0.01 })
    if (root.current) observer.observe(root.current)
    document.addEventListener('visibilitychange', update)
    return () => { observer.disconnect(); window.clearInterval(timer); document.removeEventListener('visibilitychange', update); preference.removeEventListener('change', updateMotion) }
  }, [])

  useEffect(() => {
    if (loading) return
    const eligible = events.filter((event) => growthInputForCategory(event.category))
    const keys = new Set(eligible.map((event) => `${event.category}:${event.id}`))
    if (!known.current) { known.current = keys; return }
    const added = eligible.filter((event) => !known.current!.has(`${event.category}:${event.id}`))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0]
    known.current = keys
    // Refetches, edits, deletions and historical hydration must not celebrate again.
    if (!added || Date.now() - Date.parse(added.createdAt) > 120_000 || !inView || !visible || reduced) return
    const source = growthInputForCategory(added.category)
    if (!source) return
    const start = window.setTimeout(() => setPulse({ source, amount: added.xp, key: `${added.category}:${added.id}` }), 0)
    return () => window.clearTimeout(start)
  }, [events, data.xh, loading, inView, visible, reduced])

  useEffect(() => {
    if (!pulse) return
    const end = window.setTimeout(() => setPulse(null), 1500)
    return () => window.clearTimeout(end)
  }, [pulse])

  const hour = clock === null ? 12 : new Date(clock).getHours()
  const time = hour >= 21 || hour < 5 ? 'night' : hour >= 5 && hour < 10 ? 'dawn' : hour >= 10 && hour < 17 ? 'day' : 'dusk'
  const season = getSeason(data.vitalityScore, data.activeDays)
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now ?? clock ?? 0)
    date.setDate(date.getDate() - 6 + index)
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
  })
  return <section ref={root} className={styles.root} data-growth-scene="botanical-v1" data-playing={playing} data-ready={revealed && !loading} data-vitality={vitality} data-time={time} data-season={season} data-highlight={hovered ?? pulse?.source ?? ''} aria-labelledby={`${uid}-title`} aria-busy={loading}>
    <div className={styles.info}>
      <span className={styles.eyebrow}>YAŞAYAN GELİŞİM ALANIN</span>
      <div className={styles.heading}><h2 id={`${uid}-title`}>{level.name}</h2><span>Seviye {data.level} / 10</span></div>
      <p className={styles.description}>{descriptions[levelIndex]} Son yedi gündeki gerçek hareketlerin; toprağı, ışığı ve kökleri besler.</p>
      <div className={styles.stats}>
        <div><strong><Count value={data.weeklyActions} run={playing} /></strong><span>haftalık hareket</span></div>
        <div><strong><Count value={data.fedAreas} run={playing} />/7</strong><span>beslenen alan</span></div>
      </div>
      <div className={styles.note}><AppIcon name="activity-heartbeat" /><div><strong>Gerçek verilerle büyüyor…</strong><p>Her kayıt, sahnendeki bir yaşam alanını görünür biçimde güçlendirir.</p></div></div>
      <div className={styles.progressCopy}><strong><Count value={data.xh} run={playing} /> XH</strong><span>{next ? `${progress}% · ${next.name} için ${data.xhToNext} XH` : 'Yolculuğun en geniş ufku'}</span></div>
      <div className={styles.progress} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Sonraki seviyeye ilerleme"><span style={{ width: `${progress}%` }} /></div>
      <ol className={styles.journey} aria-label="On seviyelik gelişim yolculuğu">{LEVELS.map((item, index) => <li key={item.name} data-current={index === levelIndex} data-complete={index < levelIndex}><span tabIndex={0} aria-current={index === levelIndex ? 'step' : undefined} aria-label={`${item.name}, ${index + 1}. seviye, ${item.xp} XH`}><StageIcon index={index} /><small role="tooltip">{item.name} · {item.xp} XH</small></span></li>)}</ol>
      <div className={styles.journeyCaption}><span>Niyet</span><span>10 AŞAMALI MANEVİ GELİŞİM</span><span>Âlem</span></div>
      <div className={styles.next}><StageIcon index={Math.min(9, levelIndex + 1)} /><div><strong>{next ? 'Sıradaki manevi gelişim sahnesi' : 'Manevi gelişim sahnen tamamlandı'}</strong><p>{next ? `${next.name} · ${data.xhToNext} XH kaldı` : 'Âlemin bütün gelişim katmanları görünür'}</p></div></div>
      {!loading && !data.weeklyActions && <button className={styles.emptyAction} onClick={() => onNavigate('journal')}><AppIcon name="plus" />İlk hareketini yap</button>}
    </div>
    <div className={styles.visual}>
      <header className={styles.period}><span><i />SON 7 GÜN · CANLI ETKİNLİK</span><button type="button" onClick={() => onNavigate('reports')}>Etkinlik akışını aç <AppIcon name="arrow-right" /></button></header>
      <div className={styles.orbit}>
        <div className={styles.art}>
          <BotanicalScene uid={uid} stage={data.stage} fedAreas={data.fedAreas} vitality={vitality} playing={playing} pulse={pulse !== null} label={`${level.name}, seviye ${data.level}/10, son 7 günde ${data.weeklyActions} hareket, ${data.fedAreas} alan besleniyor`} time={time} streakDays={data.activeDays} season={season} />
          <span className={styles.output}><AppIcon name="arrow-up" /><span><strong>{pulse ? `+${pulse.amount} XH` : 'XH'}</strong><small>Gelişim çıktısı</small></span></span>
        </div>
        <svg className={styles.connections} viewBox="0 0 880 624" preserveAspectRatio="none" aria-hidden="true">
          {data.habitats.map((habitat) => <g key={habitat.id} data-flow={habitat.id} data-active={habitat.count7d > 0} className={styles.flow} style={{ '--habitat': `var(--habitat-${habitat.id})` } as CSSProperties}>
            <defs><linearGradient id={`${uid}-flow-${habitat.id}`}><stop stopColor="var(--habitat)" stopOpacity=".3" /><stop offset="1" stopColor="var(--habitat)" /></linearGradient></defs>
            <path d={flows[habitat.id]} stroke={`url(#${uid}-flow-${habitat.id})`} className={styles.flowBase} />
            <path d={flows[habitat.id]} className={styles.flowDash} />
            {habitat.count7d > 0 && <path d={flows[habitat.id]} className={styles.flowLight} pathLength="100" />}
            {pulse?.source === habitat.id && <path key={pulse.key} d={flows[habitat.id]} className={styles.liveFlow} pathLength="100" />}
          </g>)}
        </svg>
        <div className={styles.habitats} aria-label="Gelişimini besleyen alanlar">
          {data.habitats.map((habitat) => <button key={habitat.id} type="button" className={styles.habitat} data-habitat={habitat.id} data-active={habitat.count7d > 0} style={{ '--habitat': `var(--habitat-${habitat.id})`, '--intensity': habitat.intensity } as CSSProperties} onMouseEnter={() => setHovered(habitat.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(habitat.id)} onBlur={() => setHovered(null)} onClick={() => onNavigate(habitat.target, { source: 'growth-diagram', accent: getComputedStyle(root.current!).getPropertyValue(`--habitat-${habitat.id}`).trim(), icon: habitat.icon, label: habitat.name })} aria-label={`${habitat.name} bölümüne git. Son 7 günde ${habitat.count7d} hareket. ${habitat.description}`}>
            <span className={styles.habitatIcon}><AppIcon name={habitat.icon} /></span>
            <span className={styles.habitatCopy}><strong>{habitat.name}</strong><small>{habitat.count7d ? `${habitat.count7d} Hareket · ${habitat.status === 'güçlü' ? 'Güçlü' : 'Filizleniyor'}` : 'Bu Hafta Henüz Kayıt Yok'}</small></span>
            <AppIcon name="arrow-up-right" className={styles.chevron} />
            <span className={styles.week} aria-label={habitat.daily.map((count, day) => `${dates[day]}: ${count} kayıt`).join(', ')}>{habitat.daily.map((count, day) => <i key={day} data-filled={count > 0} data-today={day === 6} title={`${dates[day]}: ${count} kayıt`} />)}</span>
          </button>)}
        </div>
      </div>
      <p className={styles.hint}><AppIcon name="info-circle" />Bir alana dokunarak doğrudan ilerle. Işık ve canlılık, son 7 günün gerçek kayıtlarını gösterir.</p>
    </div>
    <span className={styles.sr} role="status" aria-live="polite">{pulse ? `${pulse.amount} XH. ${xpLevel.level.name} seviyesinde gelişimin güncellendi.` : ''}</span>
  </section>
}

function Count({ value, run }: { value: number; run: boolean }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(0)
  useEffect(() => {
    if (!run) return
    const from = previous.current
    previous.current = value
    let frame = 0
    const start = performance.now()
    const tick = (time: number) => {
      const t = Math.min(1, (time - start) / 650)
      setDisplay(Math.round(from + (value - from) * (1 - (1 - t) ** 3)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, run])
  return <span>{(run ? display : value).toLocaleString('tr-TR')}</span>
}

function StageIcon({ index }: { index: number }) {
  // Quiet, abstract symbols keep the journey spiritual without assigning
  // religious worth to a user's activity score.
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" data-stage-icon={stageIcons[index]}>
    {index === 0 ? <><circle cx="12" cy="12" r="3"/><path d="M12 3v4m0 10v4M3 12h4m10 0h4"/></> :
      index === 1 ? <><path d="m5 18 5-5 3 3 6-8"/><path d="M15 8h4v4"/></> :
      index === 2 ? <><path d="M12 3v18M5 8h14"/><path d="M7 21h10M7 8c0 4-4 4-4 0m18 0c0 4-4 4-4 0"/></> :
      index === 3 ? <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/></> :
      index === 4 ? <><path d="M12 4v16M5 7h14M7 7l-3 7h6L7 7Zm10 0-3 7h6l-3-7Z"/></> :
      index === 5 ? <><path d="M9 21h6M10 17h4"/><path d="M12 3c3 3 4 5 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8Z"/></> :
      index === 6 ? <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/></> :
      index === 7 ? <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></> :
      index === 8 ? <><path d="m12 2 1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7Z"/></> :
      <><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="5"/><ellipse cx="12" cy="12" rx="5" ry="10"/></>}
  </svg>
}
