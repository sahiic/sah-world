"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import { motion, useReducedMotion } from "framer-motion";
import {
  SURAHS,
  type SurahProgress,
  type QuranStreak,
  type WeeklySummary,
} from "@/lib/quranSurahs";
import type { HocaProfileRow } from "@/types/database";
import type { AppointmentView } from "../core/QuranCompanionView";
import { formatAppointment } from "./shared";
type Tab =
  | "home"
  | "progress"
  | "exercises"
  | "teachers"
  | "appointments"
  | "peers"
  | "study"
  | "manage"
  | "achievements";
export default function QuranDashboard({
  progress,
  streak,
  summary,
  hasanat,
  reviews,
  teacher,
  nextAppointment,
  onOpen,
  demo,
}: {
  progress: SurahProgress[];
  streak: QuranStreak;
  summary: WeeklySummary;
  hasanat: number;
  reviews: number;
  teacher?: HocaProfileRow;
  nextAppointment?: AppointmentView;
  onOpen: (tab: Tab) => void;
  demo: boolean;
}) {
  const reduced = useReducedMotion();
  const completed = progress.filter((p) => p.readStatus === "completed").length;
  return (
    <div className="qc-dashboard" data-quran-ready="learning-v3">
      {demo && (
        <p className="qc-demo-notice" role="status">
          Örnek veriler · Bu görünüm gerçek hesabına kayıt veya randevu eklemez.
        </p>
      )}
      <section className="qc-hero">
        <div className="qc-hero-left">
          <span className="eyebrow">
            KUR’AN-I KERİM KARDEŞİM · KÜÇÜK ADIMLAR
          </span>
          <h1>Bugün bir ayetle başla.</h1>
          <p className="qc-lead">
            Öğren, hatalarını fark et, yeniden dene. Sana ait bir yolculuk; bir
            üstünlük yarışı değil.
          </p>
          <div className="qc-hero-badges">
            <div className="qc-streak-badge">
              <AppIcon name="flame" />
              <strong>{streak.current}</strong>
              <span>gün seri</span>
            </div>
            <div
              className="qc-hasanat-badge"
              title="Hasanat, uygulama içi motivasyon puanıdır; dinî sevabın ölçüsü değildir."
            >
              <AppIcon name="sparkles" />
              <motion.strong
                key={hasanat}
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {hasanat}
              </motion.strong>
              <span>hasanat · öğrenme puanı</span>
            </div>
          </div>
          <p className="qc-freeze">
            <AppIcon name="snowflake" />
            <span>
              Seri koruması:{" "}
              <strong>{streak.freezeAvailable ? "1 gün" : "0 gün"}</strong> ·
              Düzenli çalışmanın izini tutar.
            </span>
          </p>
          <div className="qc-hero-actions">
            <button
              className="qc-btn-primary"
              onClick={() => onOpen("exercises")}
            >
              <AppIcon name="brain" /> Çalışmaya başla
            </button>
            <button
              className="qc-btn-secondary"
              onClick={() => onOpen("study")}
            >
              <AppIcon name="target" /> Günlük hedefim
            </button>
          </div>
        </div>
        <aside className="qc-today-plan">
          <small>BUGÜNÜN KÜÇÜK PLANI</small>
          <h2>Bir adım, ardından bir tekrar.</h2>
          <ol>
            <li>
              <span>01</span>
              <div>
                <strong>8 soruluk pratik</strong>
                <p>Sana uygun zorlukta çalış.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <strong>
                  {reviews
                    ? `${reviews} tekrar bekliyor`
                    : "Tekrar listeni oluştur"}
                </strong>
                <p>Zorlandığın ayetleri yeniden gör.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <strong>Bir not bırak</strong>
                <p>Bugün öğrendiğin şeyi kaydet.</p>
              </div>
            </li>
          </ol>
          <button className="qc-btn-ghost" onClick={() => onOpen("progress")}>
            Yolculuğumu gör <AppIcon name="arrow-right" />
          </button>
        </aside>
      </section>
      <section className="qc-progress-preview">
        <header>
          <div>
            <span className="eyebrow">OKUMA YOLCULUĞUM</span>
            <h2>114 sure, sana ait bir ritim.</h2>
          </div>
          <button className="qc-btn-ghost" onClick={() => onOpen("progress")}>
            Haritayı aç <AppIcon name="arrow-right" />
          </button>
        </header>
        <div
          className="qc-mini-grid"
          aria-label={`${completed} sure tamamlandı`}
        >
          {SURAHS.map((s) => {
            const p = progress.find((p) => p.surahId === s.id);
            return (
              <div
                key={s.id}
                className={`qc-mini-cell ${p?.memorizeStatus === "memorized" ? "memorized" : (p?.readStatus ?? "none")}`}
                title={`${s.id}. ${s.name}`}
              />
            );
          })}
        </div>
        <div className="qc-progress-stats">
          <article>
            <strong>{completed}</strong>
            <span>Tamamlanan sure</span>
          </article>
          <article>
            <strong>
              {progress.filter((p) => p.memorizeStatus === "memorized").length}
            </strong>
            <span>Ezberlenen sure</span>
          </article>
          <article>
            <strong>{summary.totalAyahs}</strong>
            <span>Bu hafta çalışılan ayet</span>
          </article>
          <article>
            <strong>{summary.totalMinutes} dk</strong>
            <span>Bu hafta pratik</span>
          </article>
        </div>
        <p className="qc-caption">
          Okuma ve ezberleme işaretleri kendi beyanına dayanır; sesli okuma
          doğrulaması değildir.
        </p>
      </section>
      <div className="qc-social-block">
        <article className="qc-social-card">
          <small>REHBERLİK</small>
          <h2>{teacher?.display_name ?? "Bir hocayla birlikte öğren."}</h2>
          <p>
            {teacher?.bio ??
              "Mahreç ve sesli okuma için öğretici desteği al. Alıştırmalar hoca değerlendirmesinin yerine geçmez."}
          </p>
          {nextAppointment && (
            <p className="qc-caption">
              Sonraki görüşme:{" "}
              {formatAppointment(nextAppointment.scheduled_start)}
            </p>
          )}
          <button
            className="qc-btn-secondary"
            onClick={() => onOpen("teachers")}
          >
            Hocaları keşfet <AppIcon name="arrow-right" />
          </button>
        </article>
        <article className="qc-social-card">
          <small>ÖĞRENME ARKADAŞIN</small>
          <h2>Birlikte devam etmek kolaylaşır.</h2>
          <p>
            Seviyeni belirle, destek veren bir kardeşle uygulama içinde iletişim
            kur.
          </p>
          <button className="qc-btn-secondary" onClick={() => onOpen("peers")}>
            Kur’an kardeşi bul <AppIcon name="heart-handshake" />
          </button>
          <button
            className="qc-btn-ghost"
            onClick={() => onOpen("achievements")}
          >
            Başarımlarımı gör <AppIcon name="award" />
          </button>
        </article>
      </div>
    </div>
  );
}
