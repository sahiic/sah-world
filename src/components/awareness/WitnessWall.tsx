"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AppIcon } from "@/components/ui/AppIcon";
import type { Geography } from "@/lib/awareness";
import { GEOGRAPHY_META } from "@/lib/awareness";

type Testimony = {
  id: string;
  geography: Geography;
  quote: string;
  attribution: string;
  sourceName: string;
  sourceUrl: string;
  category: "survivor" | "journalist" | "organization";
};

const TESTIMONIES: Testimony[] = [
  {
    id: "w1", geography: "filistin", category: "survivor",
    quote: "Yaşadığımız soykırım, 1948'deki Nekbe ile kıyas dahi edilemez.",
    attribution: "Gazze'deki Filistinli tanıklar",
    sourceName: "TRT Haber",
    sourceUrl: "https://www.trthaber.com/haber/dunya/filistinliler-yasadigimiz-soykirim-1948deki-nekbe-ile-kiyas-dahi-edilemez-944861.html",
  },
  {
    id: "w2", geography: "filistin", category: "organization",
    quote: "İsrail cezaevlerinde sessiz bir soykırım uygulanıyor.",
    attribution: "Filistin Esir İşleri Kurumu Başkanı Raid Ebu Humus",
    sourceName: "TRT Haber",
    sourceUrl: "https://www.trthaber.com/haber/dunya/filistin-esir-isleri-kurumu-baskani-israil-cezaevlerinde-sessiz-soykirim-uyguluyor-924909.html",
  },
  {
    id: "w3", geography: "filistin", category: "organization",
    quote: "Filistinli mülteciler, 1948'den bu yana geri dönüş haklarını savunuyor.",
    attribution: "Dijital Hafıza platformu",
    sourceName: "Dijital Hafıza",
    sourceUrl: "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler",
  },
  {
    id: "w4", geography: "dogu_turkistan", category: "organization",
    quote: "Tahminen 1 milyondan fazla Uygur Türkü, 'mesleki eğitim' adı altındaki kamplarda tutuluyor.",
    attribution: "Dijital Hafıza platformu",
    sourceName: "Dijital Hafıza",
    sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
  },
  {
    id: "w5", geography: "dogu_turkistan", category: "survivor",
    quote: "Ailelerimizden, dilimizden, dinimizden koparıldık.",
    attribution: "Diasporadaki Uygur tanıklar",
    sourceName: "Dijital Hafıza",
    sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
  },
  {
    id: "w6", geography: "dogu_turkistan", category: "journalist",
    quote: "Sincan'daki uygulamalar, insanlığa karşı suç oluşturabilir.",
    attribution: "BM İnsan Hakları Yüksek Komiserliği (2022 raporu)",
    sourceName: "Dijital Hafıza",
    sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
  },
];

const CATEGORY_LABEL: Record<Testimony["category"], string> = {
  survivor: "Tanık",
  journalist: "Gazeteci",
  organization: "Kurum",
};
const CATEGORY_ICON: Record<Testimony["category"], string> = {
  survivor: "user", journalist: "news", organization: "building",
};

export default function WitnessWall({ geography }: { geography: Geography }) {
  const items = TESTIMONIES.filter((t) => t.geography === geography);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="awareness-witness-wall">
      <header className="awareness-witness-header">
        <AppIcon name="quote" />
        <div>
          <h3>Tanık Duvarı</h3>
          <p>{GEOGRAPHY_META[geography].name} — doğrulanmış ifadeler ve tanıklıklar</p>
        </div>
      </header>

      <div className="awareness-witness-grid">
        {items.map((testimony, i) => (
          <motion.article
            key={testimony.id}
            className={`awareness-witness-card ${expandedId === testimony.id ? "expanded" : ""}`}
            data-category={testimony.category}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setExpandedId(expandedId === testimony.id ? null : testimony.id)}
          >
            <span className="awareness-witness-badge">
              <AppIcon name={CATEGORY_ICON[testimony.category]} />
              {CATEGORY_LABEL[testimony.category]}
            </span>
            <blockquote>"{testimony.quote}"</blockquote>
            <cite>— {testimony.attribution}</cite>
            {expandedId === testimony.id && (
              <a
                href={testimony.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="awareness-source-link"
                onClick={(e) => e.stopPropagation()}
              >
                <AppIcon name="external-link" /> {testimony.sourceName}
              </a>
            )}
          </motion.article>
        ))}
      </div>
    </section>
  );
}
