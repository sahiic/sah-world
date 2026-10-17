import { useState } from "react";
import { LEVELS } from "../companionShared";
import PeerMatchCard from "./PeerMatchCard";
import {
  DAYS,
  GOALS,
  type PeerCandidate,
  type PeerProfile,
} from "./peerMatchingUtils";
export default function PeerDiscovery({
  candidates,
  profile,
  disabled,
  onRequest,
}: {
  candidates: PeerCandidate[];
  profile: PeerProfile;
  disabled: boolean;
  onRequest: (c: PeerCandidate) => void;
}) {
  const [level, setLevel] = useState(""),
    [goal, setGoal] = useState(""),
    [day, setDay] = useState("");
  const filtered = candidates.filter(
    (c) =>
      (!level || c.level === level) &&
      (!goal || c.learning_goal === goal) &&
      (!day || c.availability[day]?.length),
  );
  return (
    <section aria-label="Uyumlu kardeşleri keşfet">
      <header className="peer-section-head">
        <div>
          <span className="peer-eyebrow">BİRLİKTE DAHA KOLAY</span>
          <h3>Kendi ritmine yakın bir kardeş</h3>
          <p>
            {filtered.length
              ? `${filtered.length} aday, ortak yönlerinize göre sıralandı.`
              : "Şu an bu tercihlere uygun aday bulunmuyor."}
          </p>
        </div>
      </header>
      <div className="peer-filters">
        <label>
          Seviye
          <select value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="">Tüm seviyeler</option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hedef
          <select value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">Tüm hedefler</option>
            {Object.entries(GOALS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label>
          Müsait gün
          <select value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">Tüm günler</option>
            {DAYS.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="peer-score-note">
        Uyum puanı; seviye, hedef, sure, ortak saatler ve son etkinliğe dayanır.
        Saatler adayın zaman dilimine göre gösterilir.
      </p>
      {filtered.length ? (
        <div className="peer-candidate-grid">
          {filtered.map((c) => (
            <PeerMatchCard
              key={c.user_id}
              candidate={c}
              profile={profile}
              disabled={disabled}
              onRequest={() => onRequest(c)}
            />
          ))}
        </div>
      ) : (
        <div className="peer-empty">
          <strong>İyi bir kardeşliğe biraz zaman ver.</strong>
          <p>
            Filtrelerini genişletebilir veya eşleşme havuzuna katılabilirsin.
            Yeni adaylar burada görünür.
          </p>
        </div>
      )}
    </section>
  );
}
