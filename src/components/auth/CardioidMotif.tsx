'use client'

import { useEffect, useId, useState, type CSSProperties } from 'react'
import { RotateCcw } from 'lucide-react'
import styles from './LoginExperience.module.css'

const POINT_COUNT = 200
const OUTER_DOT_COUNT = 114
const CENTER = 260
const RADIUS = 222
const FORMATION_DURATION_MS = (POINT_COUNT - 1) * 14 + 950
const quoteLines = [
  'İnsan yaratılış bilgeliğini',
  'kavradıkça sorumluluğunun',
  'çemberini de genişletir.',
]
const quoteLineCharacters = quoteLines.map((line) => Array.from(line))
const quoteLineOffsets = quoteLineCharacters.map((_, index) =>
  quoteLineCharacters.slice(0, index).reduce((total, characters) => total + characters.length, 0),
)
const quoteCharacterCount = quoteLineCharacters.reduce((total, characters) => total + characters.length, 0)
const quote = quoteLines.join(' ')
const LOOP_PAUSE_MS = 1000
const LOOP_DURATION_MS = FORMATION_DURATION_MS + LOOP_PAUSE_MS

function pointAt(index: number, count = POINT_COUNT, radius = RADIUS) {
  const angle = (index / count) * Math.PI * 2
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius }
}

// Pure geometry: no per-frame React updates or persistent animation loop.
const threads = Array.from({ length: POINT_COUNT }, (_, index) => ({
  start: pointAt(index),
  end: pointAt((index * 2) % POINT_COUNT),
  opacity: 0.28 + 0.4 * Math.sin(((index + 1) / POINT_COUNT) * Math.PI),
}))

export default function CardioidMotif() {
  const uid = useId().replace(/:/g, '')
  const [replay, setReplay] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => setReplay((value) => value + 1), LOOP_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [replay])

  return (
    <div className={styles.experience}>
      <div key={replay} className={styles.reveal} data-testid="login-reveal" data-replay={replay}>
        <svg className={styles.starfield} data-testid="starfield" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <radialGradient id={`${uid}-nebula`}>
              <stop offset="0" stopColor="#9b7aff" stopOpacity=".16" />
              <stop offset=".5" stopColor="#5369b6" stopOpacity=".07" />
              <stop offset="1" stopColor="#151a36" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`${uid}-star-glow`}>
              <stop offset="0" stopColor="#fff" stopOpacity=".95" />
              <stop offset=".3" stopColor="#d8caff" stopOpacity=".56" />
              <stop offset="1" stopColor="#a9baff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="500" cy="430" rx="530" ry="420" fill={`url(#${uid}-nebula)`} />
          {Array.from({ length: 180 }, (_, index) => {
            const x = ((index * 127.13 + 31) % 997) + 1
            const y = ((index * 311.71 + 19) % 887) + 1
            const radius = index % 29 === 0 ? 2.1 : index % 7 === 0 ? 1.2 : .55 + (index % 4) * .12
            const opacity = .24 + ((index * 17) % 67) / 100
            return <circle key={index} className={index % 29 === 0 ? styles.brightStar : styles.star}
              cx={x} cy={y} r={radius} fill={index % 29 === 0 ? `url(#${uid}-star-glow)` : '#e8eaff'}
              style={{ '--star-opacity': opacity, '--twinkle-delay': `${-((index * 37) % 7000)}ms`, '--twinkle-duration': `${4200 + (index % 8) * 700}ms` } as CSSProperties} />
          })}
        </svg>
        <figure className={styles.motif} aria-label="Kıble yönüne dönük, hafifçe süzülen kardiyoid motifi">
          <svg viewBox="0 0 520 520" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
            <title id={`${uid}-title`}>Kıble yönüne dönük kardiyoid</title>
            <desc id={`${uid}-desc`}>
              Çemberin üzerinde, çizgi örgüsüyle aynı hizada duran 114 ışıklı nokta. Sivri uç Türkiye’den kıble yönüne bakar.
            </desc>
            <defs>
              <linearGradient id={`${uid}-thread`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0" stopColor="#a5b4fc" />
                <stop offset="0.48" stopColor="#8b7cf8" />
                <stop offset="1" stopColor="#d8b4fe" />
              </linearGradient>
              <radialGradient id={`${uid}-atmosphere`}>
                <stop offset="0" stopColor="#a78bfa" stopOpacity="0.17" />
                <stop offset="0.7" stopColor="#6366f1" stopOpacity="0.06" />
                <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g data-testid="cardioid-orientation" data-bearing="151°" transform={`rotate(241 ${CENTER} ${CENTER})`}>
              <circle cx={CENTER} cy={CENTER} r="256" fill={`url(#${uid}-atmosphere)`} />
              <circle className={styles.boundary} cx={CENTER} cy={CENTER} r={RADIUS} />
              <g aria-hidden="true">
                {threads.map((thread, index) => (
                  <line
                    key={index}
                    className={styles.thread}
                    x1={thread.start.x} y1={thread.start.y}
                    x2={thread.end.x} y2={thread.end.y}
                    pathLength={1}
                    stroke={`url(#${uid}-thread)`}
                    style={{ '--thread-opacity': thread.opacity, '--draw-delay': `${index * 14}ms` } as CSSProperties}
                  />
                ))}
              </g>
              <g className={styles.points} data-testid="cardioid-points" aria-hidden="true">
                {Array.from({ length: OUTER_DOT_COUNT }, (_, index) => {
                  const point = pointAt(index, OUTER_DOT_COUNT, RADIUS)
                  return <circle key={index} cx={point.x} cy={point.y} r="1.6" />
                })}
              </g>
            </g>
          </svg>
        </figure>
        <AnimatedQuote />
      </div>
      <button type="button" className={styles.replay} aria-label="Kardiyoid ve söz animasyonunu yeniden oynat" onClick={() => setReplay((value) => value + 1)}>
        <RotateCcw size={16} aria-hidden="true" />
      </button>
    </div>
  )
}

function AnimatedQuote() {
  const [typedCount, setTypedCount] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = window.setTimeout(() => setTypedCount(quoteCharacterCount), 0)
      return () => window.clearTimeout(timer)
    }

    const startedAt = performance.now()
    let characterIndex = 0
    let timer = 0
    const typeNextCharacter = () => {
      characterIndex += 1
      setTypedCount(characterIndex)
      if (characterIndex < quoteCharacterCount) {
        const nextCharacterAt = startedAt + ((characterIndex + 1) * FORMATION_DURATION_MS) / quoteCharacterCount
        timer = window.setTimeout(typeNextCharacter, Math.max(0, nextCharacterAt - performance.now()))
      }
    }

    const firstCharacterAt = startedAt + FORMATION_DURATION_MS / quoteCharacterCount
    timer = window.setTimeout(typeNextCharacter, Math.max(0, firstCharacterAt - performance.now()))
    return () => window.clearTimeout(timer)
  }, [])

  const currentLine = quoteLineCharacters.findIndex((characters, index) =>
    typedCount < quoteLineOffsets[index] + characters.length,
  )

  return (
    <h1 id="login-title" className={styles.quote} aria-label={quote} data-testid="login-quote"
      data-typed-count={typedCount} data-character-count={quoteCharacterCount}
      data-typing-duration-ms={FORMATION_DURATION_MS}>
      {quoteLines.map((line, index) => {
        const characters = quoteLineCharacters[index]
        const typedOnLine = Math.min(characters.length, Math.max(0, typedCount - quoteLineOffsets[index]))
        return (
          <span key={line} className={`${styles.quoteLine} ${index === 2 ? styles.quoteAccent : ''}`}>
            <span className={styles.lineFrame} aria-hidden="true">
              <span className={styles.quoteMeasure}>{line}</span>
              <span className={styles.typedLine}>
                {characters.slice(0, typedOnLine).join('')}
                {currentLine === index && <span className={styles.caret} />}
              </span>
            </span>
          </span>
        )
      })}
    </h1>
  )
}
