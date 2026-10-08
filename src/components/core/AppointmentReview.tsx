"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { supabase } from "@/lib/supabase";
import { isValidUUID } from "@/store/useJourneyStore";
import type { AppointmentNoteRow } from "@/types/database";
import type { AppointmentView } from "./QuranCompanionView";
import QuranModal from "@/components/quran/QuranModal";

const TOPICS = [
  "Tecvid",
  "Mahreç",
  "Ezber",
  "Meal",
  "Tefsir",
  "Hatim",
  "Elif-Ba",
];

export default function AppointmentReview({
  appointment,
  isHoca,
  userId,
  onClose,
  onSaved,
}: {
  appointment: AppointmentView;
  isHoca: boolean;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const demoMode = Boolean(appointment.is_demo) || !isValidUUID(userId);
  const [note, setNote] = useState<AppointmentNoteRow | null>(null);
  const [surahName, setSurahName] = useState("");
  const [startAyah, setStartAyah] = useState("");
  const [endAyah, setEndAyah] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [performance, setPerformance] = useState("");
  const [reflection, setReflection] = useState("");
  const [assignment, setAssignment] = useState("");
  const [difficulty, setDifficulty] = useState(3);
  const [loading, setLoading] = useState(!demoMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const role: AppointmentNoteRow["author_role"] = isHoca ? "hoca" : "student";

  useEffect(() => {
    if (demoMode) {
      return;
    }
    let active = true;
    void supabase
      .from("appointment_notes")
      .select("*")
      .eq("appointment_id", appointment.id)
      .eq("author_role", role)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError("Ders notu yüklenemedi.");
        if (data) {
          setNote(data);
          setSurahName(data.surah_name || "");
          setStartAyah(data.start_ayah?.toString() || "");
          setEndAyah(data.end_ayah?.toString() || "");
          setTopics(data.topics_covered || []);
          setPerformance(data.performance_note || "");
          setReflection(data.student_reflection || "");
          setAssignment(data.next_assignment || "");
          setDifficulty(data.difficulty_rating || 3);
        }
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [appointment.id, demoMode, role]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (isHoca && startAyah && endAyah && Number(endAyah) < Number(startAyah)) {
      setError("Bitiş ayeti başlangıç ayetinden küçük olamaz.");
      return;
    }
    setError("");
    setSaving(true);
    if (demoMode) {
      window.setTimeout(() => {
        setSaving(false);
        onSaved();
      }, 250);
      return;
    }
    const payload = {
      appointment_id: appointment.id,
      author_id: userId,
      author_role: role,
      surah_name: isHoca ? surahName.trim() || null : null,
      start_ayah: isHoca && startAyah ? Number(startAyah) : null,
      end_ayah: isHoca && endAyah ? Number(endAyah) : null,
      topics_covered: isHoca ? topics : [],
      performance_note: isHoca ? performance.trim() || null : null,
      student_reflection: isHoca ? null : reflection.trim() || null,
      next_assignment: isHoca ? assignment.trim() || null : null,
      difficulty_rating: isHoca ? null : difficulty,
    };
    const upsertPayload: Partial<AppointmentNoteRow> = note
      ? { ...payload, id: note.id }
      : payload;
    const { error: saveError } = await supabase
      .from("appointment_notes")
      .upsert(upsertPayload, {
        onConflict: "appointment_id,author_role",
      });
    setSaving(false);
    if (saveError) {
      setError("Ders notu kaydedilemedi. Lütfen tekrar dene.");
      return;
    }
    onSaved();
  };

  return (
    <QuranModal
      onClose={onClose}
      label="Ders Notu"
      className="appointment-review-modal"
    >
      <>
        <header>
          <span>
            <AppIcon name="notes" />
          </span>
          <div>
            <small>{isHoca ? "HOCA DEĞERLENDİRMESİ" : "DERS YANSIMASI"}</small>
            <h2 id="appointment-review-title">Ders Notu</h2>
            <p>
              {isHoca ? appointment.student_name : appointment.hoca_name} ·{" "}
              {new Date(appointment.scheduled_start).toLocaleDateString(
                "tr-TR",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Ders notunu kapat"
          >
            <AppIcon name="x" />
          </button>
        </header>
        {loading ? (
          <p className="quran-form-status">Yükleniyor…</p>
        ) : (
          <form onSubmit={(event) => void save(event)}>
            {demoMode && (
              <div className="quran-pilot-badge">
                <AppIcon name="flask" /> Örnek pilot — kaydetme yalnızca bu
                denemeyi tamamlar.
              </div>
            )}
            {isHoca ? (
              <>
                <div className="review-ayah-grid">
                  <label>
                    Sure adı
                    <input
                      value={surahName}
                      onChange={(event) => setSurahName(event.target.value)}
                      placeholder="Örn. Fâtiha"
                    />
                  </label>
                  <label>
                    Başlangıç ayeti
                    <input
                      type="number"
                      min="1"
                      value={startAyah}
                      onChange={(event) => setStartAyah(event.target.value)}
                    />
                  </label>
                  <label>
                    Bitiş ayeti
                    <input
                      type="number"
                      min="1"
                      value={endAyah}
                      onChange={(event) => setEndAyah(event.target.value)}
                    />
                  </label>
                </div>
                <fieldset className="review-topics">
                  <legend>İşlenen konular</legend>
                  <div>
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        className={topics.includes(topic) ? "active" : ""}
                        onClick={() =>
                          setTopics((current) =>
                            current.includes(topic)
                              ? current.filter((item) => item !== topic)
                              : [...current, topic],
                          )
                        }
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label>
                  Öğrenci performansı
                  <textarea
                    maxLength={600}
                    value={performance}
                    onChange={(event) => setPerformance(event.target.value)}
                    placeholder="Güçlü yönler ve üzerinde çalışılacak noktalar…"
                  />
                  <small>{performance.length}/600</small>
                </label>
                <label>
                  Sonraki ders için görev
                  <textarea
                    maxLength={300}
                    value={assignment}
                    onChange={(event) => setAssignment(event.target.value)}
                    placeholder="Örn. Fâtiha suresini mahreçlere dikkat ederek üç kez oku."
                  />
                  <small>{assignment.length}/300</small>
                </label>
              </>
            ) : (
              <>
                <label>
                  Bu derste ne hissettin / ne öğrendin?
                  <textarea
                    required
                    maxLength={600}
                    value={reflection}
                    onChange={(event) => setReflection(event.target.value)}
                    placeholder="Bugünkü dersten sende kalanları birkaç cümleyle yaz…"
                  />
                  <small>{reflection.length}/600</small>
                </label>
                <fieldset className="review-difficulty">
                  <legend>Zorluk derecesi</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={difficulty === value ? "active" : ""}
                        onClick={() => setDifficulty(value)}
                        aria-label={`${value} / 5 zorluk`}
                      >
                        {
                          ["Çok kolay", "Kolay", "Dengeli", "Zor", "Çok zor"][
                            value - 1
                          ]
                        }
                        <span>{"★".repeat(value)}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            {error && (
              <p className="booking-error" role="alert">
                {error}
              </p>
            )}
            <footer>
              <button type="button" onClick={onClose}>
                Vazgeç
              </button>
              <button className="primary-button" disabled={saving}>
                {saving
                  ? "Kaydediliyor…"
                  : note
                    ? "Notu güncelle"
                    : "Ders notunu kaydet"}
              </button>
            </footer>
          </form>
        )}
      </>
    </QuranModal>
  );
}
