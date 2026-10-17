export default function PeerMatchTimeline({ status }: { status: string }) {
  return (
    <ol className="peer-timeline" aria-label="Eşleşme aşamaları">
      {["Tanışma", "Karşılıklı kabul", "Birlikte çalışma"].map((label, i) => (
        <li
          key={label}
          className={status === "accepted" || i === 0 ? "done" : ""}
        >
          <span>{i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  );
}
