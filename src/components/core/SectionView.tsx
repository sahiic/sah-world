"use client";
import EntrySection from "./SectionEntryList";
import Matrix from "./SectionEisenhower";
import ContextLinks from "./SectionContextLinks";

import { useState } from "react";
import { useJourneyStore } from "@/store/useJourneyStore";
import { recordXpEvent } from "@/lib/xp";
import { AppIcon } from "@/components/ui/AppIcon";
import MescidimView from "./MescidimView";
import JournalNotebook from "./JournalNotebook";
import { dayKey } from "@/lib/activity";
import SectionTagline from "./SectionTagline";

export type SectionKey =
  | "journal"
  | "quran"
  | "hadis"
  | "matrix"
  | "lessons"
  | "sukur"
  | "mescidim";

const meta: Record<
  SectionKey,
  { title: string; eyebrow: string; description: string; icon: string }
> = {
  journal: {
    title: "Günlük",
    eyebrow: "KENDİNE DÖN",
    description:
      "Duygularını yargılamadan fark et ve gününe küçük bir not bırak.",
    icon: "notebook",
  },
  quran: {
    title: "Kur’an Notlarım",
    eyebrow: "TEFEKKÜR",
    description:
      "Okuduğun ayetlerden sende kalan anlamı ve hayata taşıyacağın dersi kaydet.",
    icon: "book-2",
  },
  hadis: {
    title: "Hadis Notlarım",
    eyebrow: "ÖĞREN VE UYGULA",
    description:
      "Kaynağıyla birlikte not al, günlük hayata dönük bir niyet belirle.",
    icon: "quote",
  },
  matrix: {
    title: "Öncelik Matrisi",
    eyebrow: "SADELEŞTİR",
    description: "Önemli olanı acil olandan ayır ve enerjini bilinçli kullan.",
    icon: "layout-grid",
  },
  lessons: {
    title: "Hatalar ve Dersler",
    eyebrow: "ŞEFKATLİ MUHASEBE",
    description:
      "Kendini suçlamadan olanı gör, öğrendiğin dersi geleceğe taşı.",
    icon: "history",
  },
  sukur: {
    title: "Şükür Alanım",
    eyebrow: "FARK ET",
    description: "Bugünün içindeki küçük ve büyük nimetlere sakinlikle bak.",
    icon: "sparkles",
  },
  mescidim: {
    title: "Allah’a en sevimli olan mekânlar",
    eyebrow: "MANEVİ MOLA",
    description: "Kısa bir duruş, zikir sayacı ve günün tefekkür notları.",
    icon: "building-mosque",
  },
};

export default function SectionView({
  section,
  onNavigate,
  embedded = false,
}: {
  section: SectionKey;
  onNavigate: (view: string) => void;
  embedded?: boolean;
}) {
  const store = useJourneyStore();
  const [notice, setNotice] = useState("");
  const info = meta[section];

  const reward = (
    amount: number,
    label: string,
    sourceType: string,
    sourceId: string,
  ) => {
    store.addXP(amount);
    store.updateStreak();
    store.checkBadges();
    setNotice(`${label} kaydedildi · +${amount} XH`);
    void recordXpEvent({ sourceType, sourceId, label, amount });
    window.setTimeout(() => setNotice(""), 3200);
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const id = crypto.randomUUID();
    const now = new Date();
    const createdAt = now.toISOString();
    const date = dayKey(now);
    if (section === "journal") {
      store.addJournal({
        id,
        date,
        mood: Number(fd.get("mood")),
        energy: Number(fd.get("energy")),
        stress: Number(fd.get("stress")),
        content: String(fd.get("content")),
        tags: [],
        createdAt,
      });
      reward(25, "Günlük kaydı", "journal", id);
    }
    if (section === "quran") {
      store.addQuranNote({
        id,
        date,
        sure: String(fd.get("sure")),
        ayet: String(fd.get("ayet")),
        tefsir: String(fd.get("tefsir")),
        ders: String(fd.get("ders")),
        createdAt,
      });
      reward(35, "Kuran notu", "quran", id);
    }
    if (section === "hadis") {
      store.addHadisNote({
        id,
        date,
        metin: String(fd.get("metin")),
        kaynak: String(fd.get("kaynak")),
        konu: String(fd.get("konu")),
        uygulama: String(fd.get("uygulama")),
        createdAt,
      });
      reward(30, "Hadis notu", "hadis", id);
    }
    if (section === "lessons") {
      store.addLesson({
        id,
        date,
        title: String(fd.get("title")),
        wrong: String(fd.get("wrong")),
        learned: String(fd.get("learned")),
        severity: Number(fd.get("severity")),
        createdAt,
      });
      reward(25, "Ders kaydı", "lessons", id);
    }
    if (section === "sukur") {
      store.addSukur({
        id,
        date,
        text: String(fd.get("text")),
        nimets: [
          String(fd.get("n1")),
          String(fd.get("n2")),
          String(fd.get("n3")),
        ],
        createdAt,
      });
      reward(20, "Şükür kaydı", "sukur", id);
    }
    form.reset();
  };

  return (
    <div className={`view-stack ${embedded ? "embedded-section" : ""}`}>
      {!embedded && section !== "journal" && (
        <header className="page-heading section-heading">
          <div>
            <span className="eyebrow">{info.eyebrow}</span>
            <h1>
              <i>
                <AppIcon name={info.icon} />
              </i>{" "}
              {info.title}
            </h1>
            <p>{info.description}</p>
          </div>
          {section === "mescidim" && (
            <SectionTagline section="mescidim" compact />
          )}
          {notice && (
            <span className="success-toast">
              <AppIcon name="check" /> {notice}
            </span>
          )}
        </header>
      )}
      {embedded && notice && (
        <span className="success-toast embedded-toast">
          <AppIcon name="check" /> {notice}
        </span>
      )}
      {section === "journal" ? (
        <JournalNotebook onNavigate={onNavigate} />
      ) : section === "matrix" ? (
        <Matrix reward={reward} onNavigate={onNavigate} />
      ) : section === "mescidim" ? (
        <>
          <MescidimView reward={reward} />
          <ContextLinks section="mescidim" onNavigate={onNavigate} />
        </>
      ) : (
        <EntrySection
          section={section}
          onSubmit={submit}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
