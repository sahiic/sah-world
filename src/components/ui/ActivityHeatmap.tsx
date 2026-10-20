import type { ActivityEvent } from "@/lib/activity";
import { dayKey } from "@/lib/activity";
import { useEffect, useMemo, useRef } from "react";

const CELL = 15;          // was 13
const GAP = 4;            // keep or try 5
const STEP = CELL + GAP;
const MONTH_GUTTER = 12;  // was 11 (slightly larger gap between months)
const TOP = 2;
const LABEL_GAP = 14;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

function levelFromCount(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  const month = MONTHS_TR[Number(m) - 1] ?? m;
  return `${Number(d)} ${month} ${y}`;
}

type DayCell = {
  date: string;
  count: number;
  level: number;
  x: number;
  y: number;
};

/**
 * Each month is its own week-block (Mon-start). Days that belong to the
 * neighbouring month are not drawn, so the first and last columns are jagged
 * and a gutter separates the blocks.
 */
function layoutYear(events: ActivityEvent[], year: number) {
  // Correct counting using the real field + dayKey from the library
  const countMap = new Map<string, number>();
  for (const e of events) {
    const key = dayKey(e.createdAt);
    if (!key || !key.startsWith(`${year}-`)) continue;
    countMap.set(key, (countMap.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const isCurrentYear = year === today.getFullYear();
  const todayKey = isCurrentYear
    ? `${year}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
    : null;

  const cells: DayCell[] = [];
  const labels: { text: string; x: number }[] = [];
  let cursor = 0;

  // Only go up to the current month when viewing the current year
  const lastMonth = isCurrentYear ? today.getMonth() : 11;

  for (let month = 0; month <= lastMonth; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startRow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
    const colCount = Math.ceil((startRow + daysInMonth) / 7);
    const origin = cursor;

    // For the current month of the current year, stop at today
    const maxDay =
      isCurrentYear && month === today.getMonth() ? today.getDate() : daysInMonth;

    for (let index = startRow; index < startRow + maxDay; index++) {
      const day = index - startRow + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Safety: never draw past today
      if (todayKey && date > todayKey) break;

      const count = countMap.get(date) ?? 0;
      cells.push({
        date,
        count,
        level: levelFromCount(count),
        x: origin + Math.floor(index / 7) * STEP,
        y: TOP + (index % 7) * STEP,
      });
    }

    // Only add a month label if we actually drew days for it
    if (maxDay > 0) {
      const blockWidth = colCount * CELL + Math.max(0, colCount - 1) * GAP;
      labels.push({
        text: MONTHS_TR[month],
        x: origin + blockWidth / 2,
      });

      cursor += blockWidth;
      if (month < lastMonth) cursor += MONTH_GUTTER;
    }
  }

  const gridBottom = TOP + 6 * STEP + CELL;
  const labelY = gridBottom + LABEL_GAP;

  return {
    cells,
    labels,
    labelY,
    width: Math.max(cursor, 1),
    height: labelY + 18,
    activeDays: cells.filter((cell) => cell.count > 0).length,
  };
}

export default function ActivityHeatmap({
  events,
  year = new Date().getFullYear(),
}: {
  events: ActivityEvent[];
  year?: number;
}) {
  const data = useMemo(() => layoutYear(events, year), [events, year]);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollLeft = el.scrollWidth;
    }
  }, [data.width]);
  return (
    <div className="heatmap-wrapper">
      <div className="heatmap-container" ref={containerRef}>
        <svg
          viewBox={`0 0 ${data.width} ${data.height}`}
          className="heatmap-svg"
          role="img"
          aria-label={`${year}: ${data.activeDays} aktif gün`}
        >
          {data.cells.map((day) => (
            <rect
              key={day.date}
              x={day.x}
              y={day.y}
              width={CELL}
              height={CELL}
              rx={2.5}
              ry={2.5}
              className={`heatmap-cell level-${day.level}`}
            >
              <title>{`${formatDate(day.date)}: ${day.count} kayıt`}</title>
            </rect>
          ))}

          {data.labels.map(({ text, x }) => (
            <text
              key={text}
              x={x}
              y={data.labelY}
              textAnchor="middle"
              className="heatmap-month-label"
            >
              {text}
            </text>
          ))}
        </svg>
      </div>
      <div className="heatmap-footer">
        <p className="heatmap-summary">
          {year} · <strong>{data.activeDays}</strong> aktif gün
        </p>
        <div className="heatmap-legend" aria-hidden>
          <small>Az</small>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={`heatmap-legend-cell level-${level}`} />
          ))}
          <small>Çok</small>
        </div>
      </div>
    </div>
  );
}