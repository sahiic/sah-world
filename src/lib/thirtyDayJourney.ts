export type JourneyDay = {
  day: number
  title: string
  task: string
  category: "read" | "reflect" | "act" | "share" | "boycott"
  xpReward: number
}

export const JOURNEY_DAYS: JourneyDay[] = [
  { day: 1, title: "Tarihsel başlangıç", task: "Filistin veya Doğu Türkistan'ın tarihsel arka planını oku.", category: "read", xpReward: 10 },
  { day: 2, title: "İlk tefekkür", task: "Öğrendiğin 1 bilgiyi kendi cümlelerinle yaz.", category: "reflect", xpReward: 10 },
  { day: 3, title: "Kaynak zinciri", task: "Güvenilir bir kaynak bul ve kaydet.", category: "read", xpReward: 10 },
  { day: 4, title: "Boykot bilinci", task: "Boykot listesinden 1 markayı incele.", category: "boycott", xpReward: 15 },
  { day: 5, title: "Alternatif keşfi", task: "Boykot ettiğin markanın yerli alternatifini dene.", category: "boycott", xpReward: 15 },
  { day: 6, title: "Dua ve niyet", task: "Mazlum coğrafyalar için 1 dua yaz.", category: "reflect", xpReward: 10 },
  { day: 7, title: "Haftalık paylaşım", task: "Öğrendiğin 1 bilgiyi kaynağıyla paylaş.", category: "share", xpReward: 20 },
  { day: 8, title: "Tanık ifadeleri", task: "Tanık duvarından 2 ifadeyi kaynağıyla oku.", category: "read", xpReward: 10 },
  { day: 9, title: "Zaman çizelgesi", task: "Tarihsel zaman çizelgesindeki olayları incele.", category: "read", xpReward: 10 },
  { day: 10, title: "Bilinçli alışveriş", task: "Bugünkü alışverişinde boykot listesini kontrol et.", category: "boycott", xpReward: 15 },
  { day: 11, title: "Derinleşme", task: "Doğu Türkistan hakkında 1 makale oku.", category: "read", xpReward: 10 },
  { day: 12, title: "Empati günlüğü", task: "Okuduğun tanıklık hakkında 3 cümle yaz.", category: "reflect", xpReward: 10 },
  { day: 13, title: "Bilgi testi", task: "Filistin veya Doğu Türkistan bilgi testini çöz.", category: "act", xpReward: 20 },
  { day: 14, title: "Topluluk etkisi", task: "Kaynağıyla birlikte 1 kişiye bilgi aktar.", category: "share", xpReward: 20 },
  { day: 15, title: "Nefes molası", task: "Nefes egzersizi yap ve kendine zaman tanı.", category: "reflect", xpReward: 5 },
  { day: 16, title: "Market kontrolü", task: "Market alışverişinde 3 ürünü boykot listesiyle karşılaştır.", category: "boycott", xpReward: 15 },
  { day: 17, title: "Küresel farkındalık", task: "Uluslararası kuruluşların raporlarını incele.", category: "read", xpReward: 10 },
  { day: 18, title: "Dijital temizlik", task: "Sosyal medyada güvenilir kaynak hesaplarını takip et.", category: "act", xpReward: 10 },
  { day: 19, title: "Yardım kanalları", task: "Onaylanmış insani yardım kuruluşlarını incele.", category: "act", xpReward: 10 },
  { day: 20, title: "Derinleşen empati", task: "Diasporadaki tanıkların sesini dinle (kaynak izle).", category: "read", xpReward: 10 },
  { day: 21, title: "Haftalık muhasebe", task: "Bu haftaki öğrenimlerin hakkında 5 cümle yaz.", category: "reflect", xpReward: 15 },
  { day: 22, title: "Boykot genişletme", task: "Boykot listesinden 2 yeni marka bırak.", category: "boycott", xpReward: 20 },
  { day: 23, title: "Çevre etkisi", task: "Aile veya arkadaş çevresinden 1 kişiye kaynakla bilgi ver.", category: "share", xpReward: 20 },
  { day: 24, title: "Karşılaştırma", task: "Her iki coğrafyanın ortak noktalarını yaz.", category: "reflect", xpReward: 15 },
  { day: 25, title: "Sivil sorumluluk", task: "Barışçıl dayanışma eylemlerini araştır.", category: "act", xpReward: 10 },
  { day: 26, title: "Sürdürülebilir boykot", task: "Tüm boykot alternatiflerini gözden geçir.", category: "boycott", xpReward: 15 },
  { day: 27, title: "Hikâye anlatıcısı", task: "Öğrendiklerini 1 paragrafta özetle ve paylaş.", category: "share", xpReward: 20 },
  { day: 28, title: "Dua ve tefekkür", task: "Haftanın duasını yaz ve paylaş.", category: "reflect", xpReward: 10 },
  { day: 29, title: "Gelecek planı", task: "30 gün sonra farkındalığını nasıl sürdüreceksin, planla.", category: "reflect", xpReward: 15 },
  { day: 30, title: "Tamamlama", task: "30 günlük yolculuğunu değerlendir, kazanımlarını yaz.", category: "reflect", xpReward: 30 },
]

export const CATEGORY_COLORS: Record<JourneyDay["category"], string> = {
  read: "#2563eb",
  reflect: "#7c3aed",
  act: "#059669",
  share: "#d97706",
  boycott: "#dc2626",
}

export const CATEGORY_LABELS: Record<JourneyDay["category"], string> = {
  read: "Oku",
  reflect: "Düşün",
  act: "Harekete geç",
  share: "Paylaş",
  boycott: "Boykot",
}
