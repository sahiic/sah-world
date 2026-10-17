import { DAYS } from "./peerMatchingUtils";
export default function PeerAvailabilityPicker({
  value,
  onChange,
}: {
  value: Record<string, string[]>;
  onChange: (v: Record<string, string[]>) => void;
}) {
  return (
    <fieldset className="peer-availability">
      <legend>Haftalık müsaitliğin</legend>
      <p>
        Saatler aşağıda seçtiğin zaman dilimine göredir. Her gün için bir aralık
        seçebilirsin.
      </p>
      {DAYS.map(([id, label]) => (
        <div key={id}>
          <label>
            <input
              type="checkbox"
              checked={!!value[id]?.length}
              onChange={(e) => {
                const next = { ...value };
                if (e.target.checked) next[id] = ["19:00-21:00"];
                else delete next[id];
                onChange(next);
              }}
            />
            {label}
          </label>
          {value[id]?.length > 0 && (
            <div>
              <input
                aria-label={`${label} başlangıç`}
                type="time"
                value={value[id][0].split("-")[0]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [id]: [`${e.target.value}-${value[id][0].split("-")[1]}`],
                  })
                }
              />
              <span>—</span>
              <input
                aria-label={`${label} bitiş`}
                type="time"
                value={value[id][0].split("-")[1]}
                onChange={(e) =>
                  onChange({
                    ...value,
                    [id]: [`${value[id][0].split("-")[0]}-${e.target.value}`],
                  })
                }
              />
            </div>
          )}
        </div>
      ))}
    </fieldset>
  );
}
