"use client";
import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { supabase } from "@/lib/supabase";
import type { HocaProfileRow } from "@/types/database";
import QuranModal from "./QuranModal";
export default function QuranTeacherProfile({
  teacher,
  realUser,
  onClose,
  onBook,
}: {
  teacher: HocaProfileRow;
  realUser: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const [reviews, setReviews] = useState<
      Array<{ rating: number; comment: string; created_at: string }>
    >([]),
    [error, setError] = useState("");
  useEffect(() => {
    if (!realUser || teacher.is_placeholder) return;
    let active = true;
    void supabase
      .rpc("get_quran_teacher_reviews", { target_hoca_id: teacher.id })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError("Öğrenci yorumları yüklenemedi.");
        else setReviews(data ?? []);
      });
    return () => {
      active = false;
    };
  }, [realUser, teacher.id, teacher.is_placeholder]);
  return (
    <QuranModal
      onClose={onClose}
      label={`${teacher.display_name} profili`}
      className="qc-teacher-profile"
    >
      <header>
        <span className="eyebrow">
          {teacher.is_placeholder ? "ÖRNEK PROFİL" : teacher.title}
        </span>
        <button aria-label="Profili kapat" onClick={onClose}>
          <AppIcon name="x" />
        </button>
      </header>
      <h2>{teacher.display_name}</h2>
      <p>{teacher.bio}</p>
      <div className="hoca-tags">
        {teacher.specialties.map((s) => (
          <span key={s}>{s}</span>
        ))}
      </div>
      <p className="qc-caption">
        Unvan ve uzmanlık bilgileri profil sahibinin beyanıdır. Ders saatleri
        Türkiye saatine göre gösterilir.
      </p>
      <button className="qc-btn-primary" onClick={onBook}>
        Müsait günleri gör <AppIcon name="calendar" />
      </button>
      <h3>Öğrenci yorumları</h3>
      <p className="qc-caption">
        Yalnızca tamamlanmış derslerden, öğrencinin paylaşmayı seçtiği yorumlar.
        Özel ders notları burada yayımlanmaz.
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : reviews.length === 0 ? (
        <p>
          {!realUser
            ? "Canlı yorumları görmek için hesabınla giriş yap."
            : "Henüz paylaşılmış öğrenci yorumu yok."}
        </p>
      ) : (
        reviews.map((r, i) => (
          <article className="qc-teacher-review" key={`${r.created_at}-${i}`}>
            <strong>Öğrenci · {r.rating}/5</strong>
            <p>{r.comment}</p>
            <time>
              {new Date(r.created_at).toLocaleDateString("tr-TR", {
                timeZone: "Europe/Istanbul",
              })}
            </time>
          </article>
        ))
      )}
    </QuranModal>
  );
}
