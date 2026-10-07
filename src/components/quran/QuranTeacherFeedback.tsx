"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AppIcon } from "@/components/ui/AppIcon";
import type { AppointmentView } from "../core/QuranCompanionView";
import QuranModal from "./QuranModal";
export default function QuranTeacherFeedback({
  appointment,
  userId,
  onClose,
}: {
  appointment: AppointmentView;
  userId: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(5),
    [comment, setComment] = useState(""),
    [published, setPublished] = useState(false),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(true);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void supabase
      .from("quran_teacher_reviews")
      .select("*")
      .eq("appointment_id", appointment.id)
      .eq("student_id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus("Önceki yorum yüklenemedi. Lütfen yeniden aç.");
          return;
        }
        if (data) {
          setRating(data.rating);
          setComment(data.comment);
          setPublished(data.published);
        }
        setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [appointment.id, userId]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const { error } = await supabase.from("quran_teacher_reviews").upsert(
        {
          appointment_id: appointment.id,
          hoca_id: appointment.hoca_id,
          student_id: userId,
          rating,
          comment: comment.trim(),
          published,
        },
        { onConflict: "appointment_id" },
      );
      if (error) throw error;
      setStatus(
        published
          ? "Yorumun anonim olarak paylaşıldı."
          : "Yorumun özel olarak kaydedildi; paylaşılmadı.",
      );
    } catch {
      setStatus("Yorum kaydedilemedi. Metnin korunuyor; yeniden dene.");
    } finally {
      setBusy(false);
      lock.current = false;
    }
  };
  return (
    <QuranModal
      onClose={onClose}
      label="Hoca değerlendirmesi"
      className="qc-teacher-profile"
    >
      <header>
        <h2>{appointment.hoca_name} · Ders deneyimim</h2>
        <button aria-label="Yorumu kapat" onClick={onClose}>
          <AppIcon name="x" />
        </button>
      </header>
      <form onSubmit={(e) => void save(e)}>
        <label>
          Değerlendirmem
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map((v) => (
              <option value={v} key={v}>
                {v}/5
              </option>
            ))}
          </select>
        </label>
        <label>
          Yorumum
          <textarea
            required
            minLength={3}
            maxLength={600}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ders deneyimini yaz. Özel veya kişisel bilgi ekleme."
          />
        </label>
        <label className="qc-group-toggle">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />{" "}
          Bu yorumu hoca profilinde anonim olarak paylaş
        </label>
        <p className="qc-caption">
          Paylaşmak zorunlu değil. Özel ders notların ayrı tutulur. Bu kutuyu
          kapatıp tekrar kaydederek yayından kaldırabilirsin.
        </p>
        <button className="qc-btn-primary" disabled={busy}>
          Yorumu kaydet
        </button>
        <p role="status">{status}</p>
      </form>
    </QuranModal>
  );
}
