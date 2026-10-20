"use client";
import EmptyState from "@/components/quran/QuranEmptyState";
import QuranTeacherProfile from "@/components/quran/QuranTeacherProfile";
import { type QuranPresenceState } from "@/components/quran/useQuranPresence";
import { AppIcon } from "@/components/ui/AppIcon";
import AvatarImage from "@/components/ui/AvatarImage";
import type { HocaProfileRow } from "@/types/database";
import { useState } from "react";

import BookingFlow from "./BookingFlow";
interface TeacherDiscoveryProps {
  teachers: HocaProfileRow[];
  onBooked: () => Promise<void>;
  realUser: boolean;
  presence: QuranPresenceState;
}

export default function TeacherDiscovery({
  teachers,
  onBooked,
  realUser,
  presence,
}: TeacherDiscoveryProps) {
  const [selected, setSelected] = useState<HocaProfileRow | null>(null);
  const [profileTeacher, setProfileTeacher] = useState<HocaProfileRow | null>(
    null,
  );
  return (
    <section className="quran-panel">
      <header className="quran-panel-heading">
        <div>
          <span className="eyebrow">RANDEVU SİSTEMİ</span>
          <h2>Hocalar</h2>
          <p>Uzmanlık alanını incele, uygun günü seç ve görüşme konunu ekle.</p>
        </div>
      </header>
      {teachers.length === 0 ? (
        <EmptyState
          icon="calendar-off"
          title="Henüz aktif hoca yok"
          text="Yeni hocalar eklendiğinde burada görünecek."
        />
      ) : (
        <div className="hoca-grid">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="hoca-card">
              <div className="hoca-avatar">
                {teacher.photo_url ? (
                  <AvatarImage
                    src={teacher.photo_url}
                    alt={`${teacher.display_name} profil fotoğrafı`}
                    size={160}
                  />
                ) : (
                  <span>{teacher.display_name.split(" ").slice(-1)[0][0]}</span>
                )}
                {teacher.is_placeholder && <em>Örnek profil</em>}
              </div>
              <div>
                <small>{teacher.title}</small>
                <h3>{teacher.display_name}</h3>
                {teacher.user_id && (
                  <span
                    className={`qc-presence-dot ${presence.online.has(teacher.user_id) ? "online" : "offline"}`}
                  >
                    {presence.online.has(teacher.user_id)
                      ? "Çevrimiçi"
                      : "Çevrimiçi bilgisi paylaşılmıyor"}
                  </span>
                )}
              </div>
              <p>{teacher.bio}</p>
                <div className="hoca-tags">
                  {teacher.specialties.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              <footer className="hoca-actions">
              <button type="button" onClick={() => setProfileTeacher(teacher)}>
                Profili incele <AppIcon name="user" />
              </button>
              <button
                type="button"
                onClick={() => setSelected(teacher)}
                disabled={Boolean(teacher.is_placeholder)}
                title={
                  teacher.is_placeholder
                    ? "Örnek profil — randevu alınamaz"
                    : undefined
                }
              >
                {teacher.is_placeholder ? "Örnek profil" : "Randevu al"}{" "}
                <AppIcon name="arrow-right" />
              </button>
              </footer>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <BookingFlow
          teacher={selected}
          onClose={() => setSelected(null)}
          onBooked={onBooked}
          realUser={realUser}
        />
      )}
      {profileTeacher && (
        <QuranTeacherProfile
          teacher={profileTeacher}
          realUser={realUser}
          onClose={() => setProfileTeacher(null)}
          onBook={() => {
            setSelected(profileTeacher);
            setProfileTeacher(null);
          }}
        />
      )}
    </section>
  );
}
