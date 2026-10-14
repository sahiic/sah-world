type FocusRingProps = {
  progress: number;
};

const CX = 200;
const CY = 200;
const R = 168;
const START = 132;
const SWEEP = 276;

function polar(angleDeg: number) {
  const radians = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(radians),
    y: CY + R * Math.sin(radians),
  };
}

function horseshoePath() {
  const start = polar(START);
  const end = polar(START + SWEEP);
  return `M ${start.x} ${start.y} A ${R} ${R} 0 1 1 ${end.x} ${end.y}`;
}

export default function FocusRing({ progress }: FocusRingProps) {
  const remaining = Math.min(1, Math.max(0, 1 - progress));
  const d = horseshoePath();
  const head = polar(START + SWEEP * progress);

  return (
    <svg viewBox="0 0 400 400" aria-hidden>
      <path className="cove-track" d={d} />
      <path
        className="cove-progress"
        d={d}
        pathLength={1}
        strokeDasharray={`${remaining} 1`}
        strokeDashoffset={-progress}
      />
      <circle className="cove-dot" cx={head.x} cy={head.y} r="4.2" />
    </svg>
  );
}