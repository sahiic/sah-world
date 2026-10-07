import type { Geography } from "./awareness"

export type TimelineEvent = {
  id: string
  geography: Geography
  year: number
  title: string
  summary: string
  sourceName: string
  sourceUrl: string
  category: "origin" | "displacement" | "resistance" | "today"
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  // Filistin
  {
    id: "f-1948", geography: "filistin", year: 1948,
    title: "Nekbe — Büyük Felaket",
    summary: "İsrail devletinin kuruluşu sırasında 700.000'den fazla Filistinli zorla yerinden edildi.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinin-76-yildir-suren-drami-nekbe-857567.html",
    category: "origin",
  },
  {
    id: "f-1967", geography: "filistin", year: 1967,
    title: "Altı Gün Savaşı ve işgalin genişlemesi",
    summary: "İsrail, Batı Şeria, Gazze Şeridi, Doğu Kudüs, Sina ve Golan Tepeleri'ni ele geçirdi.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinin-76-yildir-suren-drami-nekbe-857567.html",
    category: "displacement",
  },
  {
    id: "f-1987", geography: "filistin", year: 1987,
    title: "Birinci İntifada",
    summary: "Filistinlilerin işgale karşı sivil itaatsizlik ve direniş hareketi.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinin-76-yildir-suren-drami-nekbe-857567.html",
    category: "resistance",
  },
  {
    id: "f-2000", geography: "filistin", year: 2000,
    title: "İkinci İntifada",
    summary: "Ariel Şaron'un Harem-i Şerif ziyaretinin ardından başlayan ikinci direniş dalgası.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinin-76-yildir-suren-drami-nekbe-857567.html",
    category: "resistance",
  },
  {
    id: "f-2007", geography: "filistin", year: 2007,
    title: "Gazze ablukası",
    summary: "İsrail, Gazze Şeridi'ne kara, deniz ve hava ablukası uygulamaya başladı.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinin-76-yildir-suren-drami-nekbe-857567.html",
    category: "displacement",
  },
  {
    id: "f-2023", geography: "filistin", year: 2023,
    title: "Gazze'de yeni Nekbe",
    summary: "Ekim 2023'ten beri Gazze'de devam eden insani kriz; Filistinliler yaşananları soykırım olarak nitelendiriyor.",
    sourceName: "TRT Haber", sourceUrl: "https://www.trthaber.com/haber/dunya/filistinliler-yasadigimiz-soykirim-1948deki-nekbe-ile-kiyas-dahi-edilemez-944861.html",
    category: "today",
  },
  // Doğu Türkistan
  {
    id: "dt-1949", geography: "dogu_turkistan", year: 1949,
    title: "Doğu Türkistan'ın ilhakı",
    summary: "Çin Halk Cumhuriyeti, Doğu Türkistan'ı (Sincan) ilhak etti; bölge otonom bölge ilan edildi.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "origin",
  },
  {
    id: "dt-1990", geography: "dogu_turkistan", year: 1990,
    title: "Baren olayları",
    summary: "Doğu Türkistan'da Uygur halkının özerklik talepleri sert bir şekilde bastırıldı.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "resistance",
  },
  {
    id: "dt-2009", geography: "dogu_turkistan", year: 2009,
    title: "Ürümçi olayları",
    summary: "Ürümçi'de etnik gerginlikler; çok sayıda Uygur gözaltına alındı.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "resistance",
  },
  {
    id: "dt-2017", geography: "dogu_turkistan", year: 2017,
    title: "Kitlesel gözaltı kampları",
    summary: "Çin hükümeti, 'mesleki eğitim merkezleri' adı altında toplama kamplarını genişletti; tahminen 1 milyondan fazla Uygur gözaltında.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "displacement",
  },
  {
    id: "dt-2020", geography: "dogu_turkistan", year: 2020,
    title: "Zorla çalıştırma raporları",
    summary: "Uluslararası araştırmalar, Uygurların zorla çalıştırıldığını ve küresel tedarik zincirlerindeki bağlantıları belgeledi.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "today",
  },
  {
    id: "dt-2022", geography: "dogu_turkistan", year: 2022,
    title: "BM İnsan Hakları raporu",
    summary: "BM İnsan Hakları Yüksek Komiserliği, Sincan'daki uygulamaların insanlığa karşı suç oluşturabileceğini bildirdi.",
    sourceName: "Dijital Hafıza", sourceUrl: "https://doguturkistan.dijitalhafiza.com/",
    category: "today",
  },
]

export const CATEGORY_LABELS: Record<TimelineEvent["category"], string> = {
  origin: "Başlangıç",
  displacement: "Yerinden Edilme",
  resistance: "Direniş",
  today: "Günümüz",
}

export const CATEGORY_ICONS: Record<TimelineEvent["category"], string> = {
  origin: "flag",
  displacement: "home-off",
  resistance: "shield",
  today: "alert-triangle",
}
