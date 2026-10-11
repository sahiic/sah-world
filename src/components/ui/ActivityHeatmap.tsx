'use client'

import { useMemo } from 'react'
import { buildHeatmap, getMonthLabels, type HeatmapDay } from '@/lib/activityHeatmap'
import type { ActivityEvent } from '@/lib/activity'

const DAY_LABELS = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']
const CELL = 13
const GAP = 3
const ROW = CELL + GAP

function formatDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function ActivityHeatmap({
  events,
  weeks = 20,
}: {
  events: ActivityEvent[]
  weeks?: number
}) {
  const data = useMemo(() => buildHeatmap(events, weeks), [events, weeks])
  const months = useMemo(() => getMonthLabels(data.days), [data.days])

  const colCount = data.weeks
  const svgWidth = colCount * ROW + 30
  const svgHeight = 7 * ROW + 24

  return (
    <div className="heatmap-container">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="heatmap-svg"
        role="img"
        aria-label={`Son ${weeks} haftalık aktivite haritası: ${data.activeDays} aktif gün`}
      >
        {DAY_LABELS.map((label, i) =>
          i % 2 === 1 ? (
            <text
              key={label}
              x={0}
              y={24 + i * ROW + CELL - 2}
              className="heatmap-day-label"
            >
              {label}
            </text>
          ) : null
        )}

        {months.map(({ label, col }) => (
          <text
            key={`${label}-${col}`}
            x={30 + col * ROW}
            y={12}
            className="heatmap-month-label"
          >
            {label}
          </text>
        ))}

        {data.days.map((day, i) => {
          const col = Math.floor(i / 7)
          const row = i % 7
          return (
            <rect
              key={day.date}
              x={30 + col * ROW}
              y={20 + row * ROW}
              width={CELL}
              height={CELL}
              rx={3}
              className={`heatmap-cell level-${day.level}`}
            >
              <title>{`${formatDate(day.date)}: ${day.count} kayıt`}</title>
            </rect>
          )
        })}
      </svg>

      <div className="heatmap-footer">
        <span className="heatmap-summary">
          Son {weeks} haftada <strong>{data.activeDays}</strong> aktif gün
        </span>
        <div className="heatmap-legend">
          <small>Az</small>
          {[0, 1, 2, 3, 4].map(level => (
            <span key={level} className={`heatmap-legend-cell level-${level}`} />
          ))}
          <small>Çok</small>
        </div>
      </div>
    </div>
  )
}
