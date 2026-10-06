"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { supabase } from "@/lib/supabase";
import type { AppointmentNoteRow, QuranAppointmentView } from "@/types/database";

const TOPICS = ["Tecvid", "Mahreç", "Ezber", "Meal", "Tefsir", "Hatim", "Elif-Ba"];

export default function AppointmentReview({
  appointment,
  isHoca,
  userId,
  onClose,
  onSaved,
}: {
  appointment: QuranAppointmentView;
  isHoca: boolean;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const role: "hoca" | "student" = isHoca ? "hoca" : "student";
  const [note, setNote] = useState<AppointmentNoteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error: queryError } = await supabase
        .from("appointment_notes")
        .select("*")
        .eq("appointment_id", appointment.id)
        .eq("author_role", role)
        .maybeSingle();
      if (!active) return;
      if (queryError) setError("Ders notu yüklenemedi. Biraz sonra tekrar dene.");
      setNote(data);
      setTopics(data?.topics_covered || []);
      setDifficulty(data?.difficulty_rating || null);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [appointment.id, role]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || saving) return;
    const form = new FormData(event.currentTarget);
    const numeric = (name: string) => {
      const value = String(form.get(name) || "").trim();
      if (!value) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
    };
    const payload = {
      appointment_id: appointment.id,
      author_id: userId,
      author_role: role,
      surah_name: isHoca ? String(form.get("surah") || "").trim() || null : null,
      start_ayah: isHoca ? numeric("startAyah") : null,
      end_ayah: isHoca ? numeric("endAyah") : null,
      topics_covered: isHoca ? topics : [],
      performance_note: isHoca ? String(form.get("performance") || "").trim() || null : null,
      student_reflection: isHoca ? null : String(form.get("reflection") || "").trim() || null,
      next_assignment: isHoca ? String(form.get("assignment") || "").trim() || null : null,
      difficulty_rating: isHoca ? null : difficulty,
    };
    if (isHoca && payload.start_ayah && payload.end_ayah && payload.start_ayah > payload.end_ayah) {
      setError("Ayet aralığında başlangıç, bitişten büyük olamaz.");
      return;
    }
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase
      .from("appointment_notes")
      .upsert(payload, { onConflict: "appointment_id,author_role" });
    setSaving(false);
    if (saveError) {
      setError("Ders notu kaydedilemedi. Yetkini ve bağlantını kontrol edip tekrar dene.");
      return;
    }
    onSaved();
  };

  return (
    <div className="quran-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="quran-review-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-review-title">
        <header>
          <span className="quran-review-icon"><AppIcon name="notebook" /></span>
          <div>
            <span className="eyebrow">TAMAMLANAN GÖRÜŞME</span>
            <h2 id="appointment-review-title">Ders notu</h2>
            <p>{isHoca ? appointment.student_name : appointment.hoca_name} · {new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" }).format(new Date(appointment.scheduled_start))}</p>
          </div>
          <button className="quran-review-close" type="button" onClick={onClose} aria-label="Kapat"><AppIcon name="x" /></button>
        </header>
        {loading ? <p className="quran-review-loading">Yükleniyor…</p> : (
          <form onSubmit={(event) => void save(event)}>
            {isHoca ? <>
              <div className="quran-review-fields">
                <label>Sure<input name="surah" maxLength={100} placeholder="Örn. El-Bakara" defaultValue={note?.surah_name || ""} /></label>
                <label>Başlangıç ayeti<input name="startAyah" type="number" min="1" inputMode="numeric" placeholder="1" defaultValue={note?.start_ayah ?? ""} /></label>
                <label>Bitiş ayeti<input name="endAyah" type="number" min="1" inputMode="numeric" placeholder="7" defaultValue={note?.end_ayah ?? ""} /></label>
              </div>
              <fieldset className="quran-review-topics">
                <legend>İşlenen konular</legend>
                <div>{TOPICS.map((topic) => <button type="button" key={topic} aria-pressed={topics.includes(topic)} className={topics.includes(topic) ? "selected" : ""} onClick={() => setTopics((items) => items.includes(topic) ? items.filter((item) => item !== topic) : [...items, topic])}>{topic}</button>)}</div>
              </fieldset>
              <label>Öğrenci için kısa değerlendirme<textarea name="performance" maxLength={600} rows={4} placeholder="Güçlü yönler, gelişen noktalar ve nazik geri bildirim…" defaultValue={note?.performance_note || ""} /></label>
              <label>Bir sonraki derse kadar çalışma<textarea name="assignment" maxLength={300} rows={3} placeholder="Küçük ve uygulanabilir bir sonraki adım…" defaultValue={note?.next_assignment || ""} /></label>
            </> : <>
              <label>Bu derste ne hissettin veya ne öğrendin?<textarea name="reflection" maxLength={600} rows={6} placeholder="Kendin için not al; bunu yalnızca sen ve hocan görebilir." defaultValue={note?.student_reflection || ""} /></label>
              <fieldset className="quran-review-topics quran-difficulty">
                <legend>Bu dersin zorluğu nasıldı?</legend>
                <div>{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-pressed={difficulty === value} className={difficulty === value ? "selected" : ""} onClick={() => setDifficulty(value)}><span aria-hidden="true">{["🙂", "😊", "😐", "😮‍💨", "😓"][value - 1]}</span><small>{value}</small></button>)}</div>
                <small>1 kolay · 5 zor</small>
              </fieldset>
            </>}
            {error && <p className="quran-review-error" role="alert">{error}</p>}
            <footer><span>{note ? "Notun güncellenebilir; değişiklikleri yalnızca randevu katılımcıları görebilir." : "Kaydettiğinde bu not randevunun katılımcılarına özel kalır."}</span><button className="primary-button" disabled={saving} type="submit"><AppIcon name="device-floppy" /> {saving ? "Kaydediliyor…" : note ? "Notu güncelle" : "Ders notunu kaydet"}</button></footer>
          </form>
        )}
      </section>
    </div>
  );
}
