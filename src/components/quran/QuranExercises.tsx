"use client";
import { useRef, useState } from "react";
import { AppIcon } from "@/components/ui/AppIcon";
import {
  ARABIC_LETTERS,
  COMPLETION_QUESTIONS,
  TAJWEED_QUESTIONS,
  MEANING_QUESTIONS,
  ORDERING_SURAHS,
  pickQuestions,
  shuffleArray,
} from "@/lib/quranExercises";
import {
  SURAHS,
  TAJWEED_RULES,
  type QuranExerciseResult,
  type QuranStreak,
  type SurahProgress,
  type SpacedRepetitionItem,
} from "@/lib/quranSurahs";
import { quranToday, scheduleReview } from "@/lib/quranLearning";
type Mode = QuranExerciseResult["type"];
type Question = {
  id: string;
  text: string;
  answer: string;
  options: string[];
  explanation: string;
  topic: string;
  surahId: number;
  ayah: number;
  arabicOptions: boolean;
};
export const EXERCISE_LABELS: Record<Mode, string> = {
  completion: "Ayet Tamamlama",
  ordering: "Ayet Sıralama",
  tajweed: "Tecvid Tanıma",
  spaced: "Aralıklı Tekrar",
  meaning: "Meal Eşleştirme",
  letters: "Harf Tanıma",
};
function makeQuestions(mode: Mode, difficulty: 1 | 2 | 3): Question[] {
  if (mode === "completion")
    return pickQuestions(COMPLETION_QUESTIONS, 8, difficulty).map((q) => ({
      id: `completion-${q.surahId}-${q.ayah}-${q.start}`,
      text: q.start,
      answer: q.answer,
      options: shuffleArray(q.options),
      explanation: `Ayetin tamamı: ${q.start} ${q.answer}`,
      topic: SURAHS.find((s) => s.id === q.surahId)!.name,
      surahId: q.surahId,
      ayah: q.ayah,
      arabicOptions: true,
    }));
  if (mode === "tajweed")
    return pickQuestions(TAJWEED_QUESTIONS, 8, difficulty).map((q) => ({
      id: `tajweed-${q.text}`,
      text: q.text,
      answer: q.rule,
      options: shuffleArray(TAJWEED_RULES.map((r) => r.id)),
      explanation: q.explanation,
      topic: TAJWEED_RULES.find((r) => r.id === q.rule)!.name,
      surahId: 0,
      ayah: 0,
      arabicOptions: false,
    }));
  if (mode === "meaning")
    return pickQuestions(MEANING_QUESTIONS, 8, difficulty).map((q) => ({
      id: `meaning-${q.surahId}-${q.ayah}`,
      text: q.text,
      answer: q.meaning,
      options: shuffleArray([
        q.meaning,
        ...shuffleArray(
          MEANING_QUESTIONS.filter((m) => m.meaning !== q.meaning),
        )
          .slice(0, 3)
          .map((m) => m.meaning),
      ]),
      explanation:
        "Bu kısa anlam özeti öğretim amaçlıdır. Kaynak bağlantısından tam meali inceleyebilirsin.",
      topic: SURAHS.find((s) => s.id === q.surahId)!.name,
      surahId: q.surahId,
      ayah: q.ayah,
      arabicOptions: false,
    }));
  return shuffleArray([...ARABIC_LETTERS])
    .slice(0, 8)
    .map(([letter, name]) => ({
      id: `letters-${letter}`,
      text: letter,
      answer: name,
      options: shuffleArray([
        name,
        ...shuffleArray(ARABIC_LETTERS.filter((l) => l[1] !== name))
          .slice(0, 3)
          .map((l) => l[1]),
      ]),
      explanation: `Bu harfin adı ${name}. Mahrecini bir öğreticiyle sesli çalışman önerilir.`,
      topic: name,
      surahId: 0,
      ayah: 0,
      arabicOptions: false,
    }));
}
export default function QuranExercises({
  spacedItems,
  streak,
  onRecordExercise,
  onReview,
  totalHasanat,
}: {
  surahProgress: SurahProgress[];
  spacedItems: SpacedRepetitionItem[];
  streak: QuranStreak;
  onRecordExercise: (result: QuranExerciseResult) => Promise<void>;
  onReview: (item: SpacedRepetitionItem) => Promise<void>;
  totalHasanat: number;
}) {
  const [mode, setMode] = useState<Mode | null>(null),
    [difficulty, setDifficulty] = useState<1 | 2 | 3>(1);
  const due = spacedItems.filter((item) => item.nextReviewDate <= quranToday());
  if (mode === "ordering")
    return (
      <OrderingExercise
        difficulty={difficulty}
        onBack={() => setMode(null)}
        onRecord={onRecordExercise}
      />
    );
  if (mode === "spaced")
    return (
      <ReviewExercise
        items={due}
        onBack={() => setMode(null)}
        onReview={onReview}
      />
    );
  if (mode)
    return (
      <Quiz
        key={mode}
        mode={mode}
        difficulty={difficulty}
        onBack={() => setMode(null)}
        onRecord={onRecordExercise}
      />
    );
  return (
    <section className="qc-exercise-center">
      <div className="qc-learning-toolbar">
        <div>
          <span className="eyebrow">ALIŞTIRMA MERKEZİ</span>
          <h2>Biraz pratik, gerçek ilerleme.</h2>
          <p>Her cevapta açıklama; sonunda kişisel tekrar önerileri.</p>
        </div>
        <span className="qc-learning-chip">
          <AppIcon name="flame" />
          {streak.current} gün · {totalHasanat} öğrenme puanı
        </span>
      </div>
      <fieldset className="qc-difficulty">
        <legend>Çalışma zorluğu</legend>
        {([1, 2, 3] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={difficulty === d}
            onClick={() => setDifficulty(d)}
          >
            {["Başlangıç", "Gelişen", "İleri"][d - 1]}
          </button>
        ))}
      </fieldset>
      <div className="qc-exercise-modes">
        {(
          [
            "letters",
            "completion",
            "ordering",
            "tajweed",
            "meaning",
            "spaced",
          ] as Mode[]
        ).map((m, i) => (
          <button
            className={`qc-mode-card ${m}`}
            key={m}
            onClick={() => setMode(m)}
          >
            <span>
              <AppIcon
                name={
                  [
                    "abc",
                    "text-recognition",
                    "arrows-sort",
                    "vocabulary",
                    "book-2",
                    "refresh",
                  ][i]
                }
              />
            </span>
            <h3>{EXERCISE_LABELS[m]}</h3>
            <p>
              {
                [
                  "28 harfi tanı; sesli okuma için hocayla çalış.",
                  `${COMPLETION_QUESTIONS.length} kaynaklı sorudan 8 soruluk pratik.`,
                  "Ayetleri klavyeyle veya dokunarak sırala.",
                  `${TAJWEED_QUESTIONS.length} açıklamalı harf birleşimi örneği.`,
                  "Arapça ayet ile kısa Türkçe anlam özetini eşleştir.",
                  `${due.length} tekrar hazır. Öz değerlendirmeyle ritmini koru.`,
                ][i]
              }
            </p>
            <em>
              {m === "spaced" && due.length === 0 ? "Tekrar listesi" : "Başla"}
              <AppIcon name="arrow-right" />
            </em>
          </button>
        ))}
      </div>
      <p className="qc-caption">
        Hasanat yalnızca uygulama içi öğrenme puanıdır; dinî sevabı veya okuma
        yeterliliğini ölçmez. Tecvid soruları, ayet olarak sunulmayan öğretim
        örnekleridir. Nûn geçişleri ayrı kelimeler arasında okunur; aynı kelime
        içindeki istisnaları bir hocayla çalışmalısın.
      </p>
    </section>
  );
}
function Quiz({
  mode,
  difficulty,
  onBack,
  onRecord,
}: {
  mode: Mode;
  difficulty: 1 | 2 | 3;
  onBack: () => void;
  onRecord: (r: QuranExerciseResult) => Promise<void>;
}) {
  const [questions] = useState(() => makeQuestions(mode, difficulty));
  const [answers, setAnswers] = useState<
      NonNullable<QuranExerciseResult["answers"]>
    >([]),
    [index, setIndex] = useState(0),
    [selection, setSelection] = useState<string | null>(null),
    [result, setResult] = useState<QuranExerciseResult | null>(null);
  const [start] = useState(() => Date.now());
  const lock = useRef(false);
  const q = questions[index];
  if (result)
    return <Result result={result} onBack={onBack} onRecord={onRecord} />;
  if (!q)
    return (
      <p role="status">
        Bu zorlukta soru bulunamadı. <button onClick={onBack}>Geri</button>
      </p>
    );
  const label = (value: string) =>
    mode === "tajweed"
      ? (TAJWEED_RULES.find((r) => r.id === value)?.name ?? value)
      : value;
  const choose = (value: string) => {
    if (lock.current) return;
    lock.current = true;
    setSelection(value);
    setAnswers((current) => [
      ...current,
      {
        questionId: q.id,
        surahId: q.surahId,
        ayah: q.ayah,
        topic: q.topic,
        correct: value === q.answer,
        selected: label(value),
        answer: label(q.answer),
      },
    ]);
  };
  const next = () => {
    if (index === questions.length - 1) {
      setResult({
        id: crypto.randomUUID(),
        type: mode,
        surahId: q.surahId,
        score: answers.filter((a) => a.correct).length,
        totalQuestions: questions.length,
        timeSpentSeconds: Math.max(1, Math.round((Date.now() - start) / 1000)),
        completedAt: new Date().toISOString(),
        answers,
      });
      return;
    }
    setIndex((i) => i + 1);
    setSelection(null);
    lock.current = false;
  };
  return (
    <section className="qc-exercise-active" aria-label={EXERCISE_LABELS[mode]}>
      <header>
        <button onClick={onBack}>
          <AppIcon name="arrow-left" /> Alıştırmalara dön
        </button>
        <div className="qc-exercise-progress">
          <span>
            Soru {index + 1}/{questions.length}
          </span>
          <progress
            value={index + 1}
            max={questions.length}
            aria-label="Alıştırma ilerlemesi"
          />
        </div>
        <span>{answers.filter((a) => a.correct).length} doğru</span>
      </header>
      <div className="qc-exercise-question">
        <small>
          {q.surahId > 0
            ? `${q.topic} · ${q.surahId}:${q.ayah}`
            : "ÖĞRETİM ÖRNEĞİ · AYET ALINTISI DEĞİLDİR"}
        </small>
        <h2 lang="ar" dir="rtl" className="qc-tajweed-text">
          {q.text}
          {mode === "completion" && <span className="qc-blank"> … </span>}
        </h2>
        <p>
          {mode === "completion"
            ? "Ayetin devamını seç."
            : mode === "tajweed"
              ? "Bu harf birleşiminde hangi kural uygulanır?"
              : mode === "letters"
                ? "Bu harfin adı hangisi?"
                : "Bu ayetin anlamını özetleyen ifadeyi seç."}
        </p>
      </div>
      <div className="qc-exercise-options">
        {q.options.map((option) => (
          <button
            className={`qc-option ${selection !== null ? (option === q.answer ? "correct" : option === selection ? "wrong" : "") : ""}`}
            key={option}
            disabled={selection !== null}
            onClick={() => choose(option)}
          >
            <span
              lang={q.arabicOptions ? "ar" : "tr"}
              dir={q.arabicOptions ? "rtl" : "ltr"}
            >
              {label(option)}
            </span>
            {selection !== null && option === q.answer && (
              <AppIcon name="circle-check" />
            )}
          </button>
        ))}
      </div>
      {selection !== null && (
        <div className="qc-exercise-feedback" role="status">
          <strong>
            {selection === q.answer
              ? "Doğru, güzel bir adım!"
              : `Birlikte düzeltelim: ${label(q.answer)}`}
          </strong>
          <p
            lang={mode === "completion" ? "ar" : "tr"}
            dir={mode === "completion" ? "rtl" : "ltr"}
          >
            {q.explanation}
          </p>
          {q.surahId > 0 && (
            <a
              href={`https://quran.com/${q.surahId}/${q.ayah}`}
              target="_blank"
              rel="noreferrer"
            >
              Ayeti ve tam meali kaynaktan incele ↗
            </a>
          )}
          <button className="qc-btn-primary" onClick={next}>
            {index === questions.length - 1 ? "Sonuçları gör" : "Sonraki soru"}
            <AppIcon name="arrow-right" />
          </button>
        </div>
      )}
    </section>
  );
}
function Result({
  result,
  onBack,
  onRecord,
}: {
  result: QuranExerciseResult;
  onBack: () => void;
  onRecord: (r: QuranExerciseResult) => Promise<void>;
}) {
  const [status, setStatus] = useState<"ready" | "saving" | "saved" | "error">(
    "ready",
  );
  const saveLock = useRef(false);
  const [saveError, setSaveError] = useState("");
  const topics = [...new Set((result.answers ?? []).map((a) => a.topic))];
  const save = async () => {
    if (saveLock.current) return;
    saveLock.current = true;
    setStatus("saving");
    try {
      await onRecord(result);
      setStatus("saved");
    } catch (cause) {
      const message =
        cause && typeof cause === "object" && "message" in cause
          ? String(cause.message)
          : "";
      setSaveError(
        message.includes("SCHEMA_REQUIRED")
          ? "Veritabanı kurulumu tamamlanmadığı için sonuç kaydedilemiyor."
          : message.includes("DAILY_LIMIT")
            ? "Bugünkü 20 kayıt sınırına ulaştın. Yeni kayıtlar yarın açılır."
            : message.includes("DEMO_READ_ONLY")
              ? "Örnek görünümdeki sonuçlar sunucuya kaydedilmez."
              : "Sonuç kaydedilemedi. Bu ekranda korunuyor; tekrar deneyebilirsin.",
      );
      setStatus("error");
      saveLock.current = false;
    }
  };
  return (
    <section className="qc-result" aria-label="Alıştırma sonucu">
      <div className="qc-celebration" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
      <span className="qc-result-icon">
        <AppIcon name="award" />
      </span>
      <span className="eyebrow">
        {EXERCISE_LABELS[result.type]} · TAMAMLANDI
      </span>
      <h2>Bugün bir adım daha attın.</h2>
      <p>Hatalar, bir sonraki çalışmanın yolunu gösterir.</p>
      <div className="qc-result-metrics">
        <article>
          <strong>
            {result.score}/{result.totalQuestions}
          </strong>
          <span>Doğru cevap</span>
        </article>
        <article>
          <strong>
            %{Math.round((result.score / result.totalQuestions) * 100)}
          </strong>
          <span>Bu alıştırmadaki başarı</span>
        </article>
        <article>
          <strong>
            {Math.floor(result.timeSpentSeconds / 60)}:
            {String(result.timeSpentSeconds % 60).padStart(2, "0")}
          </strong>
          <span>Çalışma süresi</span>
        </article>
      </div>
      <h3>Neleri pekiştirelim?</h3>
      <div className="qc-performance">
        {topics.map((topic) => {
          const list = (result.answers ?? []).filter((a) => a.topic === topic);
          return (
            <article key={topic}>
              <strong>{topic}</strong>
              <span>
                {list.filter((a) => a.correct).length}/{list.length} doğru
              </span>
              <small>
                {list.every((a) => a.correct)
                  ? "Güzel ilerledin"
                  : "Bir sonraki pratikte tekrar et"}
              </small>
            </article>
          );
        })}
      </div>
      <details>
        <summary>Cevaplarımı incele</summary>
        {result.answers?.map((a) => (
          <article className="qc-answer-detail" key={a.questionId}>
            <strong>
              {a.correct ? "✓" : "↻"} {a.topic}
              {a.surahId > 0 ? ` · ${a.surahId}:${a.ayah}` : ""}
            </strong>
            <p>Seçimin: {a.selected}</p>
            {!a.correct && <p>Doğru cevap: {a.answer}</p>}
          </article>
        ))}
      </details>
      <p className="qc-caption">
        Puanlar öğrenme motivasyonu içindir; manevî değer ölçüsü değildir.
      </p>
      <div className="qc-result-actions">
        <button
          className="qc-btn-primary"
          disabled={status === "saving" || status === "saved"}
          onClick={() => void save()}
        >
          {status === "saving"
            ? "Kaydediliyor…"
            : status === "saved"
              ? "Kaydedildi"
              : status === "error"
                ? "Kaydı tekrar dene"
                : "Sonucu kaydet"}
        </button>
        <button className="qc-btn-secondary" onClick={onBack}>
          Alıştırmalara dön
        </button>
      </div>
      {status === "error" && <p role="alert">{saveError}</p>}
      {status === "saved" && (
        <p role="status">
          Sonuç kaydedildi. Yeni rozetlerini Başarımlarım alanında görebilirsin.
        </p>
      )}
    </section>
  );
}
function OrderingExercise({
  difficulty,
  onBack,
  onRecord,
}: {
  difficulty: 1 | 2 | 3;
  onBack: () => void;
  onRecord: (r: QuranExerciseResult) => Promise<void>;
}) {
  const [surah] = useState(
    () => pickQuestions(ORDERING_SURAHS, 1, difficulty)[0],
  );
  const [pool, setPool] = useState(() => shuffleArray(surah.verses));
  const [ordered, setOrdered] = useState<typeof pool>([]);
  const [start] = useState(() => Date.now());
  const [result, setResult] = useState<QuranExerciseResult | null>(null);
  if (result)
    return <Result result={result} onBack={onBack} onRecord={onRecord} />;
  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}>← Alıştırmalara dön</button>
        <h2>{surah.name} · Ayet Sıralama</h2>
      </header>
      <p>
        Ayetlere sırayla dokun. Eklediğin ayeti tekrar seçerek geri alabilirsin.
      </p>
      <div className="qc-ordering-target" aria-label="Seçilen ayetler">
        {ordered.map((v, i) => (
          <button
            className="qc-ordered-verse"
            key={v.id}
            onClick={() => {
              setOrdered((list) => list.filter((x) => x.id !== v.id));
              setPool((list) => [...list, v]);
            }}
            aria-label={`${i + 1}. sıradaki ayeti geri al`}
          >
            <b>{i + 1}</b>
            <span lang="ar" dir="rtl">
              {v.text}
            </span>
          </button>
        ))}
      </div>
      <div className="qc-ordering-pool">
        {pool.map((v) => (
          <button
            className="qc-pool-verse"
            key={v.id}
            onClick={() => {
              setOrdered((list) => [...list, v]);
              setPool((list) => list.filter((x) => x.id !== v.id));
            }}
          >
            <span lang="ar" dir="rtl">
              {v.text}
            </span>
            <AppIcon name="plus" />
          </button>
        ))}
      </div>
      <button
        className="qc-btn-primary"
        disabled={pool.length > 0}
        onClick={() =>
          setResult({
            id: crypto.randomUUID(),
            type: "ordering",
            surahId: surah.surahId,
            score: ordered.filter((v, i) => v.id === i + 1).length,
            totalQuestions: surah.verses.length,
            timeSpentSeconds: Math.max(
              1,
              Math.round((Date.now() - start) / 1000),
            ),
            completedAt: new Date().toISOString(),
            answers: ordered.map((v, i) => ({
              questionId: `order-${surah.surahId}-${v.id}`,
              surahId: surah.surahId,
              ayah: v.id,
              topic: surah.name,
              correct: v.id === i + 1,
              selected: `${i + 1}. sıra`,
              answer: `${v.id}. sıra`,
            })),
          })
        }
      >
        Sıralamayı kontrol et
      </button>
    </section>
  );
}
function ReviewExercise({
  items,
  onBack,
  onReview,
}: {
  items: SpacedRepetitionItem[];
  onBack: () => void;
  onReview: (item: SpacedRepetitionItem) => Promise<void>;
}) {
  const [snapshot] = useState(items),
    [index, setIndex] = useState(0),
    [revealed, setRevealed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const item = snapshot[index];
  const rateLock = useRef(false);
  const rate = async (quality: "hard" | "good" | "easy") => {
    if (rateLock.current) return;
    rateLock.current = true;
    setBusy(true);
    try {
      await onReview(scheduleReview(item, quality));
      setIndex((i) => i + 1);
      setRevealed(false);
      setError("");
    } catch {
      setError("Tekrar kaydedilemedi. Yeniden dene.");
    } finally {
      setBusy(false);
      rateLock.current = false;
    }
  };
  return (
    <section className="qc-exercise-active">
      <header>
        <button onClick={onBack}>← Alıştırmalara dön</button>
        <h2>Aralıklı Tekrar</h2>
      </header>
      {!item ? (
        <div className="qc-spaced-empty">
          <AppIcon name="circle-check" />
          <h3>Bekleyen tekrar yok.</h3>
          <p>
            Kaydettiğin alıştırmalarda zorlandığın ayetler tekrar listene
            eklenir. Bugünlük sıran tamamlandıysa yeni tekrar tarihinde burada
            görünür.
          </p>
        </div>
      ) : (
        <div className="qc-spaced-card">
          <h3>
            {SURAHS.find((s) => s.id === item.surahId)?.name} · {item.startAyah}
            –{item.endAyah}
          </h3>
          <p>Önce hafızandan oku, sonra metinle karşılaştır.</p>
          {!revealed ? (
            <button
              className="qc-btn-primary"
              onClick={() => setRevealed(true)}
            >
              Metni aç ve kendimi değerlendir
            </button>
          ) : (
            <>
              <div className="qc-review-verses">
                {ORDERING_SURAHS.find((s) => s.surahId === item.surahId)
                  ?.verses.filter(
                    (v) => v.id >= item.startAyah && v.id <= item.endAyah,
                  )
                  .map((v) => (
                    <p key={v.id} lang="ar" dir="rtl">
                      {v.text}
                    </p>
                  ))}
              </div>
              <a
                href={`https://quran.com/${item.surahId}/${item.startAyah}`}
                target="_blank"
                rel="noreferrer"
              >
                Tam metni kaynaktan aç ↗
              </a>
              <div className="qc-rating-buttons">
                {(["hard", "good", "easy"] as const).map((quality, i) => (
                  <button
                    className={`qc-rate ${quality}`}
                    key={quality}
                    disabled={busy}
                    onClick={() => void rate(quality)}
                  >
                    <span>{["Zor", "İyi", "Kolay"][i]}</span>
                    <small>
                      Sonraki: {scheduleReview(item, quality).nextReviewDate}
                    </small>
                  </button>
                ))}
              </div>
            </>
          )}
          {error && <p role="alert">{error}</p>}
        </div>
      )}
    </section>
  );
}
