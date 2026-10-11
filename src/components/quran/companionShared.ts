"use client";
import { type QuranTab } from "@/lib/appLocation";
import type {
  AppointmentRow,
  HocaProfileRow,
  QuranLevel,
  QuranPeerMatchRow,
} from "@/types/database";

export type CompanionTab =
  | QuranTab
  | "home"
  | "progress"
  | "exercises"
  | "teachers"
  | "appointments"
  | "peers"
  | "study"
  | "achievements"
  | "wheel"
  | "manage";
export type AppointmentView = AppointmentRow & {
  hoca_name: string;
  hoca_title: string;
  hoca_photo: string | null;
  student_name: string;
  student_avatar: string | null;
  is_demo?: boolean;
};
export type PeerView = {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_avatar: string | null;
  direction: "sent" | "received";
  status: QuranPeerMatchRow["status"];
  message: string;
  created_at: string;
};
export type HelperView = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  xp: number;
  quran_level: QuranLevel;
};

export const SAMPLE_HOCA: HocaProfileRow = {
  id: "7ca2b35d-8c4f-4d62-9c91-1f4898e7c201",
  user_id: null,
  display_name: "İmam Hatip Ramazan Hoca",
  title: "İmam Hatip",
  bio: "Kur'an-ı Kerim öğretmenliği yapmaktadır. Bu örnek profil, yönetici tarafından gerçek bilgilerle güncellenmek üzere hazırlanmıştır.",
  specialties: ["Tecvid", "Mahreç", "Yeni Başlayanlar"],
  photo_url: null,
  is_active: true,
  is_placeholder: true,
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
};
export const sampleAppointments = (studentId: string): AppointmentView[] => {
  const upcomingStart = new Date(Date.now() + 86_400_000);
  upcomingStart.setHours(19, 0, 0, 0);
  const completedStart = new Date(Date.now() - 2 * 86_400_000);
  completedStart.setHours(19, 0, 0, 0);
  return [
    {
      id: "2f0fd187-0cae-43fb-aa80-79459acd7d71",
      hoca_id: SAMPLE_HOCA.id,
      student_id: studentId,
      scheduled_start: upcomingStart.toISOString(),
      scheduled_end: new Date(
        upcomingStart.getTime() + 30 * 60_000,
      ).toISOString(),
      status: "confirmed",
      topic_notes: "Fâtiha suresi ve temel mahreç çalışması",
      created_at: new Date().toISOString(),
      cancelled_at: null,
      cancellation_reason: null,
      hoca_name: SAMPLE_HOCA.display_name,
      hoca_title: SAMPLE_HOCA.title,
      hoca_photo: SAMPLE_HOCA.photo_url,
      student_name: "Örnek Öğrenci",
      student_avatar: null,
      is_demo: true,
    },
    {
      id: "0f3689f5-c0fd-4b65-b9e9-7829d24a7f5c",
      hoca_id: SAMPLE_HOCA.id,
      student_id: studentId,
      scheduled_start: completedStart.toISOString(),
      scheduled_end: new Date(
        completedStart.getTime() + 30 * 60_000,
      ).toISOString(),
      status: "completed",
      topic_notes: "İhlâs suresi, tecvid ve kısa tekrar",
      created_at: new Date(completedStart.getTime() - 86_400_000).toISOString(),
      cancelled_at: null,
      cancellation_reason: null,
      hoca_name: SAMPLE_HOCA.display_name,
      hoca_title: SAMPLE_HOCA.title,
      hoca_photo: SAMPLE_HOCA.photo_url,
      student_name: "Örnek Öğrenci",
      student_avatar: null,
      is_demo: true,
    },
  ];
};
export const LEVELS: Array<{
  value: QuranLevel;
  title: string;
  detail: string;
  icon: string;
}> = [
  {
    value: "beginner",
    title: "Yeni başlıyorum",
    detail: "Harfleri ve temel okumayı öğrenmek istiyorum.",
    icon: "seedling",
  },
  {
    value: "alphabet",
    title: "Elifba biliyorum",
    detail: "Okuyorum fakat henüz akıcı değilim.",
    icon: "book",
  },
  {
    value: "fluent",
    title: "Akıcı okuyorum",
    detail: "Tecvidimi ve mahrecimi geliştirmek istiyorum.",
    icon: "book-2",
  },
  {
    value: "helper",
    title: "Destek olabilirim",
    detail: "İyi seviyedeyim, bir kardeşime yardımcı olmak isterim.",
    icon: "heart-handshake",
  },
];
export const STATUS_LABELS: Record<AppointmentRow["status"], string> = {
  pending: "Onay bekliyor",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal edildi",
  no_show: "Katılmadı",
};
export const DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
export const dateKey = (date: Date) => date.toLocaleDateString("en-CA");
export const avatar = (name: string, url?: string | null) => {
  if (url) {
    try {
      const host = new URL(url).hostname;
      if (
        host === "api.dicebear.com" ||
        host === "lh3.googleusercontent.com" ||
        host.endsWith(".supabase.co")
      )
        return url;
    } catch {
      /* fallback */
    }
  }
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
};
export const formatAppointment = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
export const timeOnly = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
