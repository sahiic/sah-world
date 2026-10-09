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
  {
    "id": "f-1948",
    "geography": "filistin",
    "year": 1948,
    "title": "Nekbe",
    "summary": "Belgesel özeti 1948’deki kuruluş ve yerinden edilme sürecini anlatır.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://www.dijitalhafiza.com/video-belgeseller/buyuk-felaket",
    "category": "origin"
  },
  {
    "id": "f-1967",
    "geography": "filistin",
    "year": 1967,
    "title": "Yerinden edilmenin yeni eşiği",
    "summary": "Mültecilik sayfası 1967 Haziran Savaşı sonrasındaki göçü ele alır.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://www.dijitalhafiza.com/kavramlar-sozlugu/filistinli-multeciler",
    "category": "displacement"
  },
  {
    "id": "f-2015",
    "geography": "filistin",
    "year": 2015,
    "title": "Genç yazarları desteklemek",
    "summary": "Khoudary biyografisi, We Are Not Numbers programına katılımını bu yıla tarihler.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://www.dijitalhafiza.com/biyografiler/hind-khoudary",
    "category": "resistance"
  },
  {
    "id": "dt-1755",
    "geography": "dogu_turkistan",
    "year": 1755,
    "title": "Cungarya",
    "summary": "Zaman tüneline göre Mançular Cungarya’yı ele geçirdi.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi",
    "category": "origin"
  },
  {
    "id": "dt-1759",
    "geography": "dogu_turkistan",
    "year": 1759,
    "title": "İlk Mançu istilası",
    "summary": "Kaynak ilk Doğu Türkistan istilasını bu yıla tarihler.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/zaman-tuneli/1759-mancularin-ilk-dogu-turkistan-istilasi",
    "category": "displacement"
  },
  {
    "id": "dt-2011",
    "geography": "dogu_turkistan",
    "year": 2011,
    "title": "Dil eğitimi",
    "summary": "Ayup biyografisine göre dilbilim yüksek lisansı tamamlandı; dönüşünde Uygurca okullar açtı.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/biyografiler/abdulweli-ayup",
    "category": "resistance"
  },
  {
    "id": "dt-2020",
    "geography": "dogu_turkistan",
    "year": 2020,
    "title": "Bir göç tanıklığı",
    "summary": "7 Mayıs tarihli söyleşi, bir ailenin ayrılış deneyimini anlatır.",
    "sourceName": "Dijital Hafıza",
    "sourceUrl": "https://doguturkistan.dijitalhafiza.com/kose-yazilari/bir-dogu-turkistanlinin-yasadiklari",
    "category": "today"
  }
];

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
