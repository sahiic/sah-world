"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { ProfessionLesson, ProfessionTrack } from "@/lib/professionSchool";

type Props = {tracks: ProfessionTrack[]; lessons: ProfessionLesson[]; followed: Set<string>; completedIds: Set<string>; activeTrackId: string; onFollow: (id: string) => void};
export default function ProfessionTrackSelector({tracks, lessons, followed, completedIds, activeTrackId, onFollow}: Props) { return (<section
        className="profession-selector"
        aria-labelledby="profession-select-title"
      >
        <header>
          <div>
            <span className="eyebrow">KİŞİSEL ÖĞRENME ALANIN</span>
            <h2 id="profession-select-title">Meslek seç</h2>
            <p>
              Birden fazla yolu takip edebilir, her birinde kaldığın yerden
              devam edebilirsin.
            </p>
          </div>
        </header>
        <div className="profession-track-grid">
          {tracks.map((track) => {
            const lessonSet = lessons.filter(
              (lesson) => lesson.trackId === track.id,
            );
            const completed = lessonSet.filter((lesson) =>
              completedIds.has(lesson.id),
            ).length;
            const percent = lessonSet.length
              ? Math.round((completed / lessonSet.length) * 100)
              : 0;
            const isFollowed = followed.has(track.id);
            return (
              <button
                key={track.id}
                className={`${isFollowed ? "is-followed" : ""} ${activeTrackId === track.id ? "is-active" : ""}`}
                style={
                  { "--track-accent": track.colorAccent } as React.CSSProperties
                }
                onClick={() => void onFollow(track.id)}
              >
                <span className="track-icon">
                  <AppIcon name={track.icon} />
                </span>
                <span className="track-copy">
                  <strong>{track.professionName}</strong>
                  <small>{track.description}</small>
                </span>
                <span className="track-progress">
                  <i>
                    <b style={{ width: `${percent}%` }} />
                  </i>
                  <em>{isFollowed ? `%${percent}` : "Yolu ekle"}</em>
                </span>
              </button>
            );
          })}
        </div>
      </section>); }
