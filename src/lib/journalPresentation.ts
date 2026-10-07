import type { JournalEntry } from '@/types';

export type JournalRitual = 'sabah' | 'aksam';
export const JOURNAL_MOODS = [
  { value: 1, emoji: '😔', label: 'Zor' },
  { value: 2, emoji: '😕', label: 'Düşük' },
  { value: 3, emoji: '😌', label: 'Sakin' },
  { value: 4, emoji: '🙂', label: 'İyi' },
  { value: 5, emoji: '✨', label: 'Harika' },
];

export function validJournalDate(value: string | null | undefined, today: string): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function journalRitual(entry: JournalEntry): JournalRitual {
  return entry.ritualType === 'sabah' ? 'sabah' : 'aksam';
}

export function journalPreview(entry: JournalEntry): string {
  return entry.content || entry.intentionText || entry.selfNote || entry.gratitudeText || entry.moments?.find(Boolean) || entry.expectedChallengeText || 'Bu güne ait kısa bir kayıt var.';
}

export function journalDateLabel(value: string, short = false): string {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: short ? undefined : 'long', day: 'numeric', month: short ? 'short' : 'long', year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export function normalizeJournalSearch(value: string): string {
  return value.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/\p{M}/gu, '').replace(/ı/g, 'i').replace(/\s+/g, ' ').trim();
}

export function filterJournalEntries(entries: JournalEntry[], filters: { query: string; from: string; to: string; ritual: 'all' | JournalRitual }): JournalEntry[] {
  const terms = normalizeJournalSearch(filters.query).split(' ').filter(Boolean);
  return entries.filter(entry => {
    if (filters.from && entry.date < filters.from || filters.to && entry.date > filters.to) return false;
    if (filters.ritual !== 'all' && journalRitual(entry) !== filters.ritual) return false;
    const text = normalizeJournalSearch([
      entry.content, entry.intentionText, entry.expectedChallengeText, entry.gratitudeText,
      entry.selfNote, ...(entry.moments ?? []), ...(entry.tags ?? []),
    ].filter(Boolean).join(' '));
    return terms.every(term => text.includes(term));
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

/** New local revisions take precedence over an older server snapshot. */
export function mergeJournalEntries(remote: JournalEntry[], local: JournalEntry[]): JournalEntry[] {
  const byId = new Map(remote.map(entry => [entry.id, entry]));
  for (const entry of local) byId.set(entry.id, entry);
  return [...byId.values()];
}

export function mapJournalRow(row: Record<string, unknown>): JournalEntry {
  const text = (key: string) => typeof row[key] === 'string' ? row[key] as string : '';
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const number = (key: string, fallback: number) => typeof row[key] === 'number' && Number.isFinite(row[key]) ? row[key] as number : fallback;
  return {
    id: text('id'), date: text('date'), content: text('content'), mood: number('mood', 3),
    energy: number('energy', 7), stress: number('stress', 3), sleep: typeof row.sleep === 'number' ? row.sleep : undefined,
    moments: strings(row.moments), selfNote: text('self_note'), tags: strings(row.tags),
    ritualType: row.ritual_type === 'sabah' || row.ritual_type === 'aksam' ? row.ritual_type : null,
    entryMode: row.entry_mode === 'quick' ? 'quick' : 'full', intentionText: text('niyet_text'),
    expectedChallengeText: text('beklenen_zorluk_text'), gratitudeText: text('gratitude_text'),
    xpAwarded: number('xp_awarded', 0), createdAt: text('created_at'), updatedAt: text('updated_at') || undefined,
  };
}

export function journalCalendar(month: string): Array<{ date: string; currentMonth: boolean }> {
  const first = new Date(`${month}-01T12:00:00`);
  const start = new Date(first);
  start.setDate(1 - (first.getDay() + 6) % 7);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const count = Math.ceil(((first.getDay() + 6) % 7 + last.getDate()) / 7) * 7;
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return { date: key, currentMonth: key.startsWith(month) };
  });
}
