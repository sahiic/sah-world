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
    focus: { label: 'Odak', icon: 'target-arrow', color: '#0d9488' },
    matrix: { label: 'Matris', icon: 'layout-grid', color: '#0284c7' },
    lessons: { label: 'Hatalar', icon: 'history', color: '#be123c' },
  },
  dayKey,
};

const { buildCategoryProgress } = load('src/lib/categoryProgress.ts', { '@/lib/activity': activityStub });

const NOW = new Date('2026-10-10T15:00:00');

const event = (category, daysAgo = 0) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - daysAgo);
  return { id: `e-${Math.random().toString(36).slice(2, 8)}`, createdAt: d.toISOString(), category, xp: 10, label: 'Test' };
};

test('no events produce empty categories', () => {
  const result = buildCategoryProgress([], NOW);
  assert.equal(result.categories.length, 0);
  assert.equal(result.thisWeekTotal, 0);
  assert.equal(result.lastWeekTotal, 0);
});

test('this week events are counted', () => {
  const events = [event('journal', 0), event('journal', 1), event('journal', 2)];
  const result = buildCategoryProgress(events, NOW);
  const journal = result.categories.find(c => c.category === 'journal');
  assert.ok(journal);
  assert.equal(journal.thisWeek, 3);
  assert.equal(journal.lastWeek, 0);
  assert.equal(journal.trend, 'new');
});

test('last week events are counted separately', () => {
  const events = [event('journal', 0), event('journal', 8), event('journal', 9)];
  const result = buildCategoryProgress(events, NOW);
  const journal = result.categories.find(c => c.category === 'journal');
  assert.ok(journal);
  assert.equal(journal.thisWeek, 1);
  assert.equal(journal.lastWeek, 2);
  assert.equal(journal.trend, 'down');
});

test('trend is up when this week exceeds last week', () => {
  const events = [event('quran', 0), event('quran', 1), event('quran', 8)];
  const result = buildCategoryProgress(events, NOW);
  const quran = result.categories.find(c => c.category === 'quran');
  assert.ok(quran);
  assert.equal(quran.trend, 'up');
  assert.equal(quran.change, 100);
});

test('trend is same when counts are equal', () => {
  const events = [event('hadis', 0), event('hadis', 8)];
  const result = buildCategoryProgress(events, NOW);
  const hadis = result.categories.find(c => c.category === 'hadis');
  assert.ok(hadis);
  assert.equal(hadis.trend, 'same');
  assert.equal(hadis.change, 0);
});

test('categories with zero both weeks are excluded', () => {
  const events = [event('journal', 0)];
  const result = buildCategoryProgress(events, NOW);
  assert.ok(!result.categories.some(c => c.category === 'quran'));
});

test('categories sorted by this week count descending', () => {
  const events = [
    event('journal', 0), event('journal', 1), event('journal', 2),
    event('quran', 0),
  ];
  const result = buildCategoryProgress(events, NOW);
  assert.equal(result.categories[0].category, 'journal');
});

test('overall totals are summed correctly', () => {
  const events = [
    event('journal', 0), event('quran', 0),
    event('journal', 8), event('hadis', 9),
  ];
  const result = buildCategoryProgress(events, NOW);
  assert.equal(result.thisWeekTotal, 2);
  assert.equal(result.lastWeekTotal, 2);
  assert.equal(result.overallTrend, 'same');
});

test('mostImproved identifies biggest gainer', () => {
  const events = [
    event('journal', 0), event('journal', 1), event('journal', 2),
    event('quran', 0),
    event('journal', 8),
  ];
  const result = buildCategoryProgress(events, NOW);
  assert.ok(result.mostImproved);
  assert.equal(result.mostImproved.category, 'journal');
});

test('needsAttention identifies biggest decliner', () => {
  const events = [
    event('journal', 0),
    event('quran', 8), event('quran', 9), event('quran', 10),
  ];
  const result = buildCategoryProgress(events, NOW);
  assert.ok(result.needsAttention);
  assert.equal(result.needsAttention.category, 'quran');
});

test('events older than 2 weeks are ignored', () => {
  const events = [event('journal', 20)];
  const result = buildCategoryProgress(events, NOW);
  assert.equal(result.categories.length, 0);
});

test('change percentage is calculated correctly', () => {
  const events = [
    event('journal', 0), event('journal', 1), event('journal', 2),
    event('journal', 8),
  ];
  const result = buildCategoryProgress(events, NOW);
  const journal = result.categories.find(c => c.category === 'journal');
  assert.ok(journal);
  assert.equal(journal.change, 200);
});
