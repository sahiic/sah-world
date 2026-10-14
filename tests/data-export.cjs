const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, dependencies = {}) {
  const result = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => { if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`); return dependencies[name]; }, result);
  return result;
}

function dayKey(d) {
  if (typeof d === 'string') d = new Date(d);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const activityStub = {
  CATEGORY_META: {
    journal: { label: 'Günlük', icon: 'notebook', color: '#4f46e5' },
    quran: { label: 'Kuran', icon: 'book-2', color: '#d97706' },
    hadis: { label: 'Hadis', icon: 'quote', color: '#0f766e' },
    sukur: { label: 'Şükür', icon: 'sparkles', color: '#059669' },
  },
  dayKey,
};

const typesStub = {};

const { buildExportData, exportToJSON, exportToText, ALL_SECTIONS, SECTION_META } = load('src/lib/dataExport.ts', { '@/lib/activity': activityStub, '@/types': typesStub });

const source = {
  journal: [{ id: 'j1', content: 'Bugün güzel bir gündü', mood: 'happy', createdAt: '2026-10-10T10:00:00' }],
  quranNotes: [{ id: 'q1', sure: 'Bakara', ayet: '152', tefsir: 'Zikir hakkında', ders: 'Allah\'ı anmak', createdAt: '2026-10-10T11:00:00' }],
  hadisNotes: [{ id: 'h1', konu: 'Sabır', metin: 'Sabır imanın yarısıdır', kaynak: 'Müslim', uygulama: 'Zorluklarda sabır', createdAt: '2026-10-10T12:00:00' }],
  lessons: [{ id: 'l1', title: 'Vakit yönetimi', wrong: 'Erteleme', learned: 'Planlama şart', createdAt: '2026-10-10T13:00:00' }],
  sukurList: [{ id: 's1', text: 'Sağlık', nimets: ['Aile', 'Huzur'], createdAt: '2026-10-10T14:00:00' }],
  events: [
    { id: 'e1', category: 'journal', label: 'Günlük', detail: 'Test', xp: 25, createdAt: '2026-10-10T10:00:00' },
    { id: 'e2', category: 'quran', label: 'Kuran notu', detail: 'Test', xp: 35, createdAt: '2026-10-10T11:00:00' },
  ],
  xp: 500,
  streakCurrent: 5,
};

test('ALL_SECTIONS has 7 entries', () => {
  assert.equal(ALL_SECTIONS.length, 7);
});

test('SECTION_META has label and icon for each section', () => {
  for (const s of ALL_SECTIONS) {
    assert.ok(SECTION_META[s].label);
    assert.ok(SECTION_META[s].icon);
  }
});

test('buildExportData includes selected sections only', () => {
  const data = buildExportData(source, ['stats', 'journal']);
  assert.ok(data.sections.stats);
  assert.ok(data.sections.journal);
  assert.equal(data.sections.quran, undefined);
  assert.equal(data.sections.hadis, undefined);
});

test('buildExportData stats are correct', () => {
  const data = buildExportData(source, ['stats']);
  const stats = data.sections.stats;
  assert.equal(stats.totalEvents, 2);
  assert.equal(stats.totalXP, 500);
  assert.equal(stats.currentStreak, 5);
});

test('buildExportData journal entries are mapped', () => {
  const data = buildExportData(source, ['journal']);
  const entries = data.sections.journal;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].content, 'Bugün güzel bir gündü');
  assert.equal(entries[0].mood, 'happy');
});

test('buildExportData quran notes are mapped', () => {
  const data = buildExportData(source, ['quran']);
  const notes = data.sections.quran;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].sure, 'Bakara');
});

test('buildExportData hadis notes are mapped', () => {
  const data = buildExportData(source, ['hadis']);
  const notes = data.sections.hadis;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].kaynak, 'Müslim');
});

test('buildExportData lessons are mapped', () => {
  const data = buildExportData(source, ['lessons']);
  assert.equal(data.sections.lessons.length, 1);
  assert.equal(data.sections.lessons[0].title, 'Vakit yönetimi');
});

test('buildExportData sukur entries are mapped', () => {
  const data = buildExportData(source, ['sukur']);
  assert.equal(data.sections.sukur.length, 1);
  assert.deepEqual(data.sections.sukur[0].nimets, ['Aile', 'Huzur']);
});

test('exportToJSON returns valid JSON', () => {
  const data = buildExportData(source, ALL_SECTIONS);
  const json = exportToJSON(data);
  const parsed = JSON.parse(json);
  assert.ok(parsed.exportDate);
  assert.ok(parsed.sections);
});

test('exportToText contains SAHİ World header', () => {
  const data = buildExportData(source, ['stats']);
  const text = exportToText(data);
  assert.ok(text.includes('SAHİ World'));
  assert.ok(text.includes('İSTATİSTİKLER'));
});

test('exportToText includes journal content', () => {
  const data = buildExportData(source, ['journal']);
  const text = exportToText(data);
  assert.ok(text.includes('GÜNLÜK'));
  assert.ok(text.includes('güzel bir gündü'));
});

test('exportToText includes all selected sections', () => {
  const data = buildExportData(source, ALL_SECTIONS);
  const text = exportToText(data);
  assert.ok(text.includes('GÜNLÜK'));
  assert.ok(text.includes('KUR\'AN'));
  assert.ok(text.includes('HADİS'));
  assert.ok(text.includes('HATALAR'));
  assert.ok(text.includes('ŞÜKÜR'));
});

test('export data has version and date', () => {
  const data = buildExportData(source, ['stats']);
  assert.equal(data.version, '1.0');
  assert.ok(data.exportDate);
});

test('activity section is capped at 500', () => {
  const bigSource = { ...source, events: Array.from({ length: 600 }, (_, i) => ({ id: `e${i}`, category: 'journal', label: 'Test', detail: '', xp: 10, createdAt: '2026-10-10T10:00:00' })) };
  const data = buildExportData(bigSource, ['activity']);
  assert.equal(data.sections.activity.length, 500);
});
