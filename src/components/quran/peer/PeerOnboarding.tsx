"use client";
import { useState } from "react";
import { LEVELS } from "../companionShared";
import PeerAvailabilityPicker from "./PeerAvailabilityPicker";
import {
  completion,
  GOALS,
  PREFERENCES,
  hasContact,
  type PeerProfile,
} from "./peerMatchingUtils";
export default function PeerOnboarding({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: PeerProfile;
  busy: boolean;
  onSave: (p: PeerProfile) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [profile, setProfile] = useState(initial),
    [step, setStep] = useState(0),
    [validation, setValidation] = useState("");
  const change = (p: Partial<PeerProfile>) => setProfile({ ...profile, ...p });
  const titles = [
    "Başlangıç noktan",
    "Birlikte ne çalışalım?",
    "Sana uygun zaman",
    "Kendini kısaca tanıt",
  ];
  function valid() {
    if (
      step === 1 &&
      (!Number.isInteger(profile.current_surah) ||
        profile.current_surah < 1 ||
        profile.current_surah > 114)
    )
      return "1–114 arasında bir sure numarası seç.";
    if (step === 2) {
      if (!Object.keys(profile.availability).length)
        return "En az bir müsait gün seç.";
      if (
        Object.values(profile.availability).some((slots) =>
          slots.some((slot) => slot.split("-")[0] >= slot.split("-")[1]),
        )
      )
        return "Bitiş saati başlangıç saatinden sonra olmalı.";
      try {
        new Intl.DateTimeFormat("tr", { timeZone: profile.timezone });
      } catch {
        return "Geçerli bir zaman dilimi yaz: Europe/Istanbul gibi.";
      }
    }
    if (
      step === 3 &&
      (profile.bio_short.trim().length < 5 || hasContact(profile.bio_short))
    )
      return "En az 5 karakterlik, iletişim bilgisi içermeyen bir tanıtım yaz.";
    return "";
  }
  return (
    <section className="peer-onboarding" aria-label="Eşleşme profili">
      <header>
        <div>
          <span className="peer-eyebrow">SENİN RİTMİN · {step + 1}/4</span>
          <h3>{titles[step]}</h3>
        </div>
        <button type="button" onClick={onCancel} disabled={busy}>
          Kapat
        </button>
      </header>
      <progress
        value={completion(profile)}
        max={100}
        aria-label="Profil tamamlanma oranı"
      />
      <small>Profilin %{completion(profile)} tamamlandı</small>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const problem = valid();
          setValidation(problem);
          if (problem) return;
          if (step < 3) setStep(step + 1);
          else await onSave(profile);
        }}
      >
        {step === 0 && (
          <div className="peer-choice-grid">
            {LEVELS.map((l) => (
              <button
                type="button"
                key={l.value}
                aria-pressed={profile.level === l.value}
                onClick={() => change({ level: l.value })}
              >
                <strong>{l.title}</strong>
                <span>{l.detail}</span>
              </button>
            ))}
          </div>
        )}
        {step === 1 && (
          <>
            <label>
              Öğrenme hedefin
              <select
                value={profile.learning_goal}
                onChange={(e) =>
                  change({
                    learning_goal: e.target
                      .value as PeerProfile["learning_goal"],
                  })
                }
              >
                {Object.entries(GOALS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Çalıştığın sure numarası
              <input
                type="number"
                min={1}
                max={114}
                required
                value={profile.current_surah}
                onChange={(e) =>
                  change({ current_surah: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Çalışma tercihin
              <select
                value={profile.study_preference}
                onChange={(e) =>
                  change({
                    study_preference: e.target
                      .value as PeerProfile["study_preference"],
                  })
                }
              >
                {Object.entries(PREFERENCES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {step === 2 && (
          <>
            <PeerAvailabilityPicker
              value={profile.availability}
              onChange={(availability) => change({ availability })}
            />
            <label>
              Zaman dilimin
              <input
                required
                value={profile.timezone}
                onChange={(e) => change({ timezone: e.target.value })}
                placeholder="Europe/Istanbul"
              />
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <label>
              Kısa tanıtım
              <textarea
                required
                minLength={5}
                maxLength={240}
                rows={4}
                value={profile.bio_short}
                onChange={(e) => change({ bio_short: e.target.value })}
                placeholder="Örneğin: Her akşam kısa bir tekrar ile okumamı geliştirmek istiyorum."
              />
            </label>
            <small>
              {profile.bio_short.length}/240 · Telefon, adres ve kişisel
              iletişim bilgisi paylaşma.
            </small>
            <label className="peer-consent">
              <input
                type="checkbox"
                checked={profile.discoverable}
                onChange={(e) => change({ discoverable: e.target.checked })}
              />
              Eşleşme profilimi diğer Kur’an kardeşi adaylarına göster.
            </label>
            <p>
              Seviyen, hedefin, tanıtımın ve müsaitlik saatlerin paylaşılır. Bu
              izni profilinden istediğin zaman kapatabilirsin.
            </p>
          </>
        )}
        {validation && <p role="alert">{validation}</p>}
        <footer>
          {step > 0 && (
            <button
              type="button"
              onClick={() => {
                setStep(step - 1);
                setValidation("");
              }}
            >
              Geri
            </button>
          )}
          <button className="peer-primary" disabled={busy}>
            {busy
              ? "Kaydediliyor…"
              : step === 3
                ? "Profilimi kaydet"
                : "Devam et"}
          </button>
        </footer>
      </form>
    </section>
  );
}
