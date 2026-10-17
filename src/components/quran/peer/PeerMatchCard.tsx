import AvatarImage from "@/components/ui/AvatarImage";
import { SURAHS } from "@/lib/quranSurahs";
import { avatar, LEVELS } from "../companionShared";
import {
  GOALS,
  PREFERENCES,
  availabilityLabel,
  matchReasons,
  type PeerCandidate,
  type PeerProfile,
} from "./peerMatchingUtils";
export default function PeerMatchCard({
  candidate: c,
  profile,
  disabled,
  onRequest,
}: {
  candidate: PeerCandidate;
  profile: PeerProfile;
  disabled: boolean;
  onRequest: () => void;
}) {
  return (
    <article className="peer-candidate">
      <header>
        <AvatarImage
          src={avatar(c.display_name, c.avatar_url)}
          alt=""
          size={56}
        />
        <div>
          <h3>{c.display_name}</h3>
          <span>{LEVELS.find((l) => l.value === c.level)?.title}</span>
        </div>
        <div
          className={`peer-score ${c.score >= 70 ? "high" : ""}`}
          aria-label={`Uyum skoru yüzde ${c.score}`}
        >
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r="19" />
            <circle
              cx="22"
              cy="22"
              r="19"
              pathLength="100"
              strokeDasharray={`${c.score} 100`}
            />
          </svg>
          <strong>%{c.score}</strong>
        </div>
      </header>
      <p>{c.bio_short}</p>
      <dl>
        <div>
          <dt>Çalıştığı sure</dt>
          <dd>{SURAHS.find(surah=>surah.id===c.current_surah)?.name || `${c.current_surah}. sure`}</dd>
        </div>
        <div>
          <dt>Hedef</dt>
          <dd>{GOALS[c.learning_goal]}</dd>
        </div>
        <div>
          <dt>Tercih</dt>
          <dd>{PREFERENCES[c.study_preference]}</dd>
        </div>
      </dl>
      <p className="peer-times">
        {availabilityLabel(c)}
        <small>{c.timezone}</small>
      </p>
      <div className="peer-reasons">
        {matchReasons(profile, c)
          .slice(0, 3)
          .map((r) => (
            <span key={r}>{r}</span>
          ))}
      </div>
      <button
        className="peer-primary"
        disabled={disabled}
        onClick={onRequest}
      >
        {c.new_partner ? "Tanışma isteği gönder" : "Yeniden çalışma isteği gönder"}
      </button>
    </article>
  );
}
