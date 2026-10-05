import type { PrayerSchedule } from "@/types/focus";

const prayerLabels: Array<[keyof PrayerSchedule, string]> = [
  ["fajr", "Sabah"],
  ["dhuhr", "Öğle"],
  ["asr", "İkindi"],
  ["maghrib", "Akşam"],
  ["isha", "Yatsı"],
];

function atTime(base: Date, value: string): Date {
  const [hours, minutes] = value.split(":").map(Number);
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Dış servise bağlanmadan, uygulamanın ileride sağlayacağı günlük vakit
 * çizelgesine göre güvenli bir odak aralığı hesaplar.
 */
export function getNextPrayerWindow(
  schedule: PrayerSchedule,
  now = new Date(),
  bufferMinutes = 10,
): { name: string; at: Date; availableMinutes: number } {
  for (const [key, name] of prayerLabels) {
    const prayerAt = atTime(now, schedule[key]);
    if (prayerAt.getTime() > now.getTime()) {
      return {
        name,
        at: prayerAt,
        availableMinutes: Math.max(
          0,
          Math.floor((prayerAt.getTime() - now.getTime()) / 60_000) -
            bufferMinutes,
        ),
      };
    }
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextFajr = atTime(tomorrow, schedule.fajr);
  return {
    name: "Sabah",
    at: nextFajr,
    availableMinutes: Math.max(
      0,
      Math.floor((nextFajr.getTime() - now.getTime()) / 60_000) -
        bufferMinutes,
    ),
  };
}

