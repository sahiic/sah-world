import type { ActivityEvent } from "@/lib/activity";
import { dayKey } from "@/lib/activity";
import { useMemo } from "react";

const CELL = 13;
const GAP = 4;
const STEP = CELL + GAP;
/** Edge-to-edge space between month blocks. About one cell, like the reference strip. */
const MONTH_GUTTER = 11;
const TOP = 2;
const LABEL_GAP = 8;

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

  const cells: DayCell[] = [];
  const labels: { text: string; x: number }[] = [];
  let cursor = 0;

  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startRow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon = 0
    const colCount = Math.ceil((startRow + daysInMonth) / 7);
    const origin = cursor;

    for (let index = startRow; index < startRow + daysInMonth; index++) {
      const day = index - startRow + 1;
      const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const count = countMap.get(date) ?? 0;
      cells.push({
        date,
        count,
        level: levelFromCount(count),
        x: origin + Math.floor(index / 7) * STEP,
        y: TOP + (index % 7) * STEP,
      });
    }

    const blockWidth = colCount * CELL + Math.max(0, colCount - 1) * GAP;
    labels.push({
      text: MONTHS[month],
      x: origin + blockWidth / 2,
    });

    cursor += blockWidth;
    if (month < 11) cursor += MONTH_GUTTER;
  }

  const gridBottom = TOP + 6 * STEP + CELL;
  const labelY = gridBottom + LABEL_GAP;

  return {
    cells,
    labels,
    labelY,
    width: Math.max(cursor, 1),
    height: labelY + 12,
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

  return (
    <div className="heatmap-container">
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