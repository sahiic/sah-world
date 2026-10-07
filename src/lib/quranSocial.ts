import type { ChatMessageRow, QuranThreadSummary } from "@/types/database";

export const istanbulDay = (value: string | Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
export function chatDateLabel(value: string, now = new Date()) {
  const key = istanbulDay(value);
  if (key === istanbulDay(now)) return "Bugün";
  if (key === istanbulDay(new Date(now.getTime() - 86400000))) return "Dün";
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
export function quranWeek(now: Date, offset = 0) {
  const start = new Date(`${istanbulDay(now)}T12:00:00+03:00`);
  start.setUTCDate(
    start.getUTCDate() - ((start.getUTCDay() + 6) % 7) + offset * 7,
  );
  return Array.from(
    { length: 7 },
    (_, i) => new Date(start.getTime() + i * 86400000),
  );
}
export function mergeChatMessages(
  old: ChatMessageRow[],
  incoming: ChatMessageRow[],
) {
  const messages = new Map(old.map((m) => [m.id, m]));
  for (const m of incoming)
    messages.set(m.id, {
      ...m,
      is_read: m.is_read || Boolean(messages.get(m.id)?.is_read),
    });
  return [...messages.values()].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
export function quranUnreadCounts(rows: QuranThreadSummary[]) {
  return rows.reduce(
    (acc, row) => {
      acc[row.kind === "peer" ? "peers" : "appointments"] += Number(
        row.unread_count,
      );
      return acc;
    },
    { peers: 0, appointments: 0 },
  );
}
// Calendar output is downloaded locally only after an explicit user click.
// Do not include private lesson notes or other participants' identifiers.
export function appointmentCalendar(item: {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  hoca_name: string;
}) {
  const escape = (s: string) =>
    s
      .replace(/\\/g, "\\\\")
      .replace(/\r\n|\r|\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  const stamp = (s: string) =>
    new Date(s)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SAH World//Quran Study//TR",
    "BEGIN:VEVENT",
    `UID:${item.id}@sah-world`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(item.scheduled_start)}`,
    `DTEND:${stamp(item.scheduled_end)}`,
    `SUMMARY:${escape("Kur'an dersi · " + item.hoca_name)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
