import type { QuranLevel } from "@/types/database";
export const DAYS = [
  ["mon", "Pazartesi"],
  ["tue", "Salı"],
  ["wed", "Çarşamba"],
  ["thu", "Perşembe"],
  ["fri", "Cuma"],
  ["sat", "Cumartesi"],
  ["sun", "Pazar"],
] as const;
export const GOALS = {
  tajweed: "Tecvid öğrenmek",
  khatm: "Hatim yolculuğu",
  memorize: "Ezberlemek",
  practice: "Okuma pratiği",
};
export const PREFERENCES = {
  reading: "Sesli okuma",
  written: "Yazılı takip",
  listening: "Karşılıklı dinleme",
};
export type PeerProfile = {
  user_id?: string;
  level: QuranLevel;
  current_surah: number;
  learning_goal: keyof typeof GOALS;
  availability: Record<string, string[]>;
  study_preference: keyof typeof PREFERENCES;
  bio_short: string;
  timezone: string;
  discoverable: boolean;
};
export type PeerCandidate = PeerProfile & {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  common_time: boolean;
  new_partner: boolean;
};
export type StudySession = {
  id: string;
  scheduled_at: string;
  started_at: string | null;
  duration_minutes: number;
  surah: number;
  members: {
    user_id: string;
    ready_at: string | null;
    completed_at: string | null;
    pages: number;
  }[];
};
export type PeerWorkspace = {
  total_pages: number;
  weekly_pages: number;
  weekly_goal: number;
  surahs: number;
  last_study: string | null;
  streak: number;
  partner_today_pages: number;
  session: StudySession | null;
};
export function emptyProfile(level: QuranLevel | null): PeerProfile {
  return {
    level: level || "beginner",
    current_surah: 1,
    learning_goal: "practice",
    availability: {},
    study_preference: "written",
    bio_short: "",
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Istanbul",
    discoverable: false,
  };
}
export function completion(p: PeerProfile) {
  return (
    [
      !!p.level,
      !!p.learning_goal && p.current_surah >= 1,
      Object.values(p.availability).some((s) => s.length),
      p.bio_short.trim().length >= 5,
    ].filter(Boolean).length * 25
  );
}
export function hasContact(text: string) {
  return /@|https?:\/\/|www\.|\d[\d ()+.-]{6,}\d/i.test(text);
}
export function availabilityLabel(p: PeerProfile) {
  return DAYS.filter(([day]) => p.availability[day]?.length)
    .map(
      ([day, label]) =>
        `${label.slice(0, 3)} ${p.availability[day].join(", ")}`,
    )
    .join(" · ");
}
export function matchReasons(me: PeerProfile, c: PeerCandidate) {
  return [
    c.common_time && "Ortak müsait zaman",
    me.learning_goal === c.learning_goal && "Aynı öğrenme hedefi",
    me.current_surah === c.current_surah && "Aynı sure üzerinde çalışma",
    c.new_partner && "Yeni bir kardeşlik",
  ].filter(Boolean) as string[];
}
export function peerError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : String((error as { message?: string })?.message || "");
  if (message.includes("ALREADY_MATCHED"))
    return "Sende veya seçtiğin kişide bir eşleşme ya da bekleyen istek var. Kardeşliğim alanını kontrol edip adayları yenile.";
  if (message.includes("PROFILE_REQUIRED"))
    return "İki kişinin de eşleşme profili görünür olmalı. Profil ayarını kontrol edip adayları yenile.";
  if (message.includes("RATE_LIMIT"))
    return "Bir saat içinde en fazla 5 istek gönderebilirsin. Biraz sonra yeniden dene.";
  if (message.includes("AUTO_QUEUE"))
    return "Bu kişi ya da sen otomatik eşleşme sırasındasınız. Önce sıradan çıkmalısın.";
  if (message.includes("COOLDOWN"))
    return "Bu kişiye tekrar istek göndermek için son yanıttan sonra 24 saat beklemelisin.";
  if (message.includes("CONTACT") || message.includes("INVALID_NOTE"))
    return "Telefon, e-posta ve bağlantı eklemeden kısa bir tanıtım yaz.";
  if (message.includes("PREVIOUS_MATCH"))
    return "Bu kişiyle geçmiş bir eşleşmeniz var. Başka bir kardeş seçebilirsin.";
  if (message.includes("NOT_FINISHED"))
    return "Çalışma süresi henüz tamamlanmadı.";
  return "İşlem tamamlanamadı. Bilgilerin korunuyor; yeniden deneyebilirsin.";
}
