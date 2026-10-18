"use client";
import { AppIcon } from "@/components/ui/AppIcon";
import type { SectionKey } from "./SectionView";

export default function ContextLinks({
  section,
  onNavigate,
}: {
  section: SectionKey;
  onNavigate: (view: string) => void;
}) {
  const links =
    section === "journal"
      ? [
          { view: "quran", icon: "book-2", label: "İlgili Kur’an notu ekle" },
          { view: "hadis", icon: "quote", label: "İlgili hadis notu ekle" },
        ]
      : section === "lessons"
        ? [
            {
              view: "journal",
              icon: "notebook",
              label: "Dersi günlüğümde düşün",
            },
            {
              view: "mescidim",
              icon: "building-mosque",
              label: "İlgili bir Esmâ ara",
            },
          ]
        : section === "quran"
          ? [
              {
                view: "journal",
                icon: "notebook",
                label: "Bunu günlüğüme yansıt",
              },
              {
                view: "mescidim",
                icon: "building-mosque",
                label: "Dua ile derinleştir",
              },
            ]
          : section === "hadis"
            ? [
                {
                  view: "journal",
                  icon: "notebook",
                  label: "Uygulama niyetini günlüğe yaz",
                },
                {
                  view: "lessons",
                  icon: "history",
                  label: "Hayata geçen dersi kaydet",
                },
              ]
            : section === "sukur"
              ? [
                  {
                    view: "journal",
                    icon: "notebook",
                    label: "Bugünün tam sayfasını aç",
                  },
                  {
                    view: "mescidim",
                    icon: "building-mosque",
                    label: "Şükür duasına geç",
                  },
                ]
              : section === "matrix"
                ? [
                    {
                      view: "focus",
                      icon: "target-arrow",
                      label: "Seçtiğim göreve odaklan",
                    },
                    {
                      view: "journal",
                      icon: "notebook",
                      label: "Gün sonunda değerlendireceğim",
                    },
                  ]
                : section === "mescidim"
                  ? [
                      {
                        view: "journal",
                        icon: "notebook",
                        label: "Bugünün manevi izlerini gör",
                      },
                      {
                        view: "lessons",
                        icon: "history",
                        label: "Tefekkürden bir ders çıkar",
                      },
                    ]
                  : [];
  if (!links.length) return null;
  return (
    <div className="context-links">
      <span>
        <AppIcon name="link" /> İstersen bu kaydı başka bir alanla derinleştir
      </span>
      <div>
        {links.map((link) => (
          <button
            type="button"
            key={link.view}
            onClick={() => onNavigate(link.view)}
          >
            <AppIcon name={link.icon} /> {link.label}
            <AppIcon name="arrow-right" />
          </button>
        ))}
      </div>
    </div>
  );
}
