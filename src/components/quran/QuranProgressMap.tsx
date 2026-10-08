"use client";
import { useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import { SURAHS, type SurahProgress } from "@/lib/quranSurahs";
import { juzSegments, quranToday } from "@/lib/quranLearning";
import QuranModal from "./QuranModal";
export default function QuranProgressMap({
  surahProgress,
  onUpdate,
}: {
  surahProgress: SurahProgress[];
  onUpdate: (p: SurahProgress[]) => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(null),
    [juz, setJuz] = useState(0),
    [grouped, setGrouped] = useState(false),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  const progress = (id: number) => surahProgress.find((p) => p.surahId === id)!;
  const surah = SURAHS.find((s) => s.id === selected),
    p = selected ? progress(selected) : null;
  const save = async (patch: Partial<SurahProgress>) => {
    if (!selected || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await onUpdate(
        surahProgress.map((p) =>
          p.surahId === selected
            ? { ...p, ...patch, lastStudyDate: quranToday() }
            : p,
        ),
      );
    } catch {
      setError("İlerleme kaydedilemedi. Önceki kaydın korundu; yeniden dene.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };
  const stats = (id: number) => {
    const segments = juzSegments(id);
    return {
      total: segments.reduce((n, s) => n + s.end - s.start + 1, 0),
      done: segments.reduce(
        (n, s) =>
          n +
          Math.max(
            0,
            Math.min(s.end, progress(s.surah.id)?.completedAyahs ?? 0) -
              s.start +
              1,
          ),
        0,
      ),
    };
  };
  const groups = grouped
    ? Array.from({ length: 30 }, (_, i) => i + 1).filter(
        (id) => !juz || id === juz,
      )
    : [juz];
  return (
    <section className="qc-progress-full">
      <header className="qc-learning-toolbar">
        <div>
          <span className="eyebrow">HATİM YOLCULUĞUM</span>
          <h2>Her ayet bir adım.</h2>
          <p>
            Okuduğun son ayeti işaretle. Cüz sınırları, sure birden fazla cüzde
            olsa da doğru hesaplanır.
          </p>
        </div>
        <label className="qc-group-toggle">
          <input
            type="checkbox"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
          />{" "}
          Cüzlere göre grupla
        </label>
      </header>
      <div className="qc-juz-journey" aria-label="30 cüz ilerlemesi">
        {Array.from({ length: 30 }, (_, i) => i + 1).map((id) => {
          const s = stats(id);
          return (
            <button
              key={id}
              aria-pressed={juz === id}
              aria-label={`${id}. Cüz: ${s.done}/${s.total} ayet`}
              className={
                s.done === s.total ? "completed" : s.done > 0 ? "started" : ""
              }
              onClick={() => setJuz(juz === id ? 0 : id)}
            >
              <strong>{id}</strong>
              <progress value={s.done} max={s.total} />
              <span>{Math.round((s.done / s.total) * 100)}%</span>
            </button>
          );
        })}
      </div>
      <div className="qc-learning-toolbar">
        <label className="qc-search">
          Sure ara
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ad veya sure numarası"
          />
        </label>
        <label>
          Cüz filtresi
          <select value={juz} onChange={(e) => setJuz(Number(e.target.value))}>
            <option value={0}>Tüm sureler</option>
            {Array.from({ length: 30 }, (_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}. Cüz
              </option>
            ))}
          </select>
        </label>
      </div>
      {groups.map((id) => {
        const segments = id
          ? juzSegments(id)
          : SURAHS.map((s) => ({ surah: s, start: 1, end: s.ayahCount }));
        const shown = segments.filter((s) =>
          `${s.surah.name} ${s.surah.id}`
            .toLocaleLowerCase("tr")
            .includes(query.toLocaleLowerCase("tr")),
        );
        return (
          <section className="qc-surah-group" key={id}>
            {grouped && (
              <h3>
                {id}. Cüz{" "}
                <small>
                  {stats(id).done}/{stats(id).total} ayet okundu
                </small>
              </h3>
            )}
            <div className="qc-surah-grid">
              {shown.map(({ surah: s, start, end }) => (
                <button
                  key={s.id}
                  className={`qc-surah-cell ${progress(s.id)?.readStatus ?? "none"}`}
                  onClick={() => {
                    setError("");
                    setSelected(s.id);
                  }}
                >
                  <span className="qc-surah-num">{s.id}</span>
                  <strong>{s.name}</strong>
                  <small>
                    {id ? `${start}–${end}. ayet` : `${s.ayahCount} ayet`}
                  </small>
                  {progress(s.id)?.memorizeStatus === "memorized" && (
                    <i className="qc-mem-badge">
                      <AppIcon name="star-filled" />
                    </i>
                  )}
                </button>
              ))}
            </div>
            {shown.length === 0 && <p>Bu görünümde eşleşen sure yok.</p>}
          </section>
        );
      })}
      <p className="qc-caption">
        İlerleme, 1. ayetten başlayarak okuduğunu beyan ettiğin aralığa dayanır.
        Sesli okuma veya ezber doğrulaması değildir.
      </p>
      {surah && p && (
        <QuranModal
          onClose={() => setSelected(null)}
          label={`${surah.name} ilerlemesi`}
          className="qc-surah-detail qc-progress-dialog"
        >
          <header>
            <div>
              <span className="qc-surah-num-lg">{surah.id}</span>
              <div>
                <h3>
                  {surah.name}{" "}
                  <span lang="ar" dir="rtl">
                    {surah.arabic}
                  </span>
                </h3>
                <small>{surah.ayahCount} ayet</small>
              </div>
            </div>
            <button
              aria-label="İlerlemeyi kapat"
              onClick={() => setSelected(null)}
            >
              <AppIcon name="x" />
            </button>
          </header>
          <div className="qc-detail-progress">
            <label>
              Okuma durumu
              <select
                disabled={busy}
                value={p.readStatus}
                onChange={(e) =>
                  void save({
                    readStatus: e.target.value as SurahProgress["readStatus"],
                    completedAyahs:
                      e.target.value === "completed"
                        ? surah.ayahCount
                        : e.target.value === "none"
                          ? 0
                          : p.completedAyahs,
                  })
                }
              >
                <option value="none">Başlanmadı</option>
                <option value="started">Başlandı</option>
                <option value="reading">Devam ediyor</option>
                <option value="completed">Tamamlandı</option>
              </select>
            </label>
            <label>
              Ezber durumu
              <select
                disabled={busy}
                value={p.memorizeStatus}
                onChange={(e) =>
                  void save({
                    memorizeStatus: e.target
                      .value as SurahProgress["memorizeStatus"],
                  })
                }
              >
                <option value="none">Başlanmadı</option>
                <option value="studying">Çalışılıyor</option>
                <option value="reviewing">Tekrar aşaması</option>
                <option value="memorized">Ezberlendi</option>
              </select>
            </label>
            <label>
              Okuduğum son ayet
              <input
                key={`${selected}-${p.completedAyahs}`}
                type="number"
                min={0}
                max={surah.ayahCount}
                disabled={busy}
                defaultValue={p.completedAyahs}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (!e.target.validity.valid || !Number.isInteger(n)) return;
                  if (n !== p.completedAyahs)
                    void save({
                      completedAyahs: n,
                      readStatus:
                        n === surah.ayahCount
                          ? "completed"
                          : n > 0
                            ? "reading"
                            : "none",
                    });
                }}
              />
            </label>
          </div>
          <p role="status">
            {busy
              ? "Kaydediliyor…"
              : `${p.completedAyahs}/${surah.ayahCount} ayet okundu`}
          </p>
          {error && <p role="alert">{error}</p>}
          <a
            href={`https://quran.com/${surah.id}`}
            target="_blank"
            rel="noreferrer"
          >
            Sureyi kaynaktan aç ↗
          </a>
          <p className="qc-caption">
            Son ayet alanından çıkınca kaydedilir. Başlanmadı seçeneği okuma
            işaretini sıfırlar.
          </p>
        </QuranModal>
      )}
    </section>
  );
}
