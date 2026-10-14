'use client'

import { Fragment, useId, useState, type CSSProperties } from 'react'
import { RotateCcw } from 'lucide-react'
import styles from './LoginExperience.module.css'

const POINT_COUNT = 200
const CENTER = 260
const RADIUS = 222
const quoteLines = [
  ['İnsan', 'yaratılış', 'bilgeliğini'],
  ['kavradıkça', 'sorumluluğunun'],
  ['çemberini', 'de', 'genişletir.'],
]

function pointAt(index: number) {
  const angle = (index / POINT_COUNT) * Math.PI * 2
  return { x: CENTER + Math.cos(angle) * RADIUS, y: CENTER + Math.sin(angle) * RADIUS }
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

  return (
    <div className={styles.experience}>
      <div key={replay} className={styles.reveal} data-testid="login-reveal" data-replay={replay}>
        <figure className={styles.motif} aria-label="Kardiyoid: bir çemberden doğan bütün">
          <svg viewBox="0 0 520 520" role="img" aria-labelledby={`${uid}-title ${uid}-desc`}>
            <title id={`${uid}-title`}>İki ile çarpım tablosunun oluşturduğu kardiyoid</title>
            <desc id={`${uid}-desc`}>
              Çemberdeki 200 nokta, sıra numarasının iki katına karşılık gelen noktaya bağlanır.
              Tek tek çizgiler bir bütüne dönüşür.
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
            <circle cx={CENTER} cy={CENTER} r="256" fill={`url(#${uid}-atmosphere)`} />
            <circle className={styles.outerRing} cx={CENTER} cy={CENTER} r="249" />
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
            <g className={styles.points} aria-hidden="true">
              {Array.from({ length: POINT_COUNT / 4 }, (_, index) => {
                const point = pointAt(index * 4)
                return <circle key={index} cx={point.x} cy={point.y} r="1.5" />
              })}
            </g>
          </svg>
        </figure>
        <h1 id="login-title" className={styles.quote}>
          {quoteLines.map((words, row) => (
            <span key={row} className={`${styles.quoteLine} ${row === 2 ? styles.quoteAccent : ''}`}>
              {words.map((word, column) => {
                const index = quoteLines.slice(0, row).flat().length + column
                return <Fragment key={word}>
                  <span className={styles.word} data-word={index}
                    style={{ '--word-delay': `${280 + index * 380}ms` } as CSSProperties}>{word}</span>{' '}
                </Fragment>
              })}
            </span>
          ))}
        </h1>
      </div>
      <button type="button" className={styles.replay} aria-label="Kardiyoid ve söz animasyonunu yeniden oynat" onClick={() => setReplay((value) => value + 1)}>
        <RotateCcw size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
