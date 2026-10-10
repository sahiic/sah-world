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

const activity = load('src/lib/activity.ts');
const streaksLib = load('src/lib/streaks.ts', { '@/lib/activity': activity });
const { evaluateBadges, getNewlyEarned, getAllBadges } = load('src/lib/badges.ts', {
  '@/lib/activity': activity,
  '@/lib/streaks': streaksLib,
  '@/types': {},
});

const emptySource = {
  journal: [],
  quranNotes: [],
  hadisNotes: [],
  eisenhower: { q1: [], q2: [], q3: [], q4: [] },
  lessons: [],
  sukurList: [],
  totalZikir: 0,
  focusSessions: [],
};

const emptyStreaks = {
  overall: { current: 0, longest: 0, lastActiveDate: '' },
  byCategory: {},
  activeDaysThisWeek: 0,
  activeDaysThisMonth: 0,
  totalActiveDays: 0,
};

test('empty source earns no badges', () => {
  const result = evaluateBadges(emptySource, emptyStreaks);
  const earned = result.filter(b => b.earned);
  assert.equal(earned.length, 0);
});

test('first_step badge earned with one journal entry', () => {
  const source = { ...emptySource, journal: [{ id: '1', content: 'test', createdAt: '2026-10-10T10:00:00' }] };
  const result = evaluateBadges(source, emptyStreaks);
  const firstStep = result.find(b => b.badge.id === 'first_step');
  assert.ok(firstStep);
  assert.equal(firstStep.earned, true);
});

test('journal_10 badge earned at 10 entries', () => {
  const entries = Array.from({ length: 10 }, (_, i) => ({ id: `j${i}`, content: '', createdAt: '2026-10-10T10:00:00' }));
  const source = { ...emptySource, journal: entries };
  const result = evaluateBadges(source, emptyStreaks);
  const badge = result.find(b => b.badge.id === 'journal_10');
  assert.ok(badge);
  assert.equal(badge.earned, true);
});

test('streak_7 badge earned with 7 day streak', () => {
  const streaks = { ...emptyStreaks, overall: { current: 7, longest: 7, lastActiveDate: '2026-10-10' } };
  const result = evaluateBadges(emptySource, streaks);
  const badge = result.find(b => b.badge.id === 'streak_7');
  assert.ok(badge);
  assert.equal(badge.earned, true);
});

test('progress tracking shows correct values', () => {
  const entries = Array.from({ length: 5 }, (_, i) => ({ id: `j${i}`, content: '', createdAt: '2026-10-10T10:00:00' }));
  const source = { ...emptySource, journal: entries };
  const result = evaluateBadges(source, emptyStreaks);
  const badge = result.find(b => b.badge.id === 'journal_10');
  assert.ok(badge);
  assert.equal(badge.earned, false);
  if (!badge.earned) {
    assert.equal(badge.current, 5);
    assert.equal(badge.target, 10);
  }
});

test('zikir badge earned at 500 zikir', () => {
  const source = { ...emptySource, totalZikir: 500 };
  const result = evaluateBadges(source, emptyStreaks);
  const badge = result.find(b => b.badge.id === 'zikir_halkasi');
  assert.ok(badge);
  assert.equal(badge.earned, true);
});

test('getNewlyEarned detects new badges', () => {
  const prev = evaluateBadges(emptySource, emptyStreaks);
  const source = { ...emptySource, journal: [{ id: '1', content: '', createdAt: '2026-10-10T10:00:00' }] };
  const next = evaluateBadges(source, emptyStreaks);
  const newBadges = getNewlyEarned(prev, next);
  assert.ok(newBadges.length >= 1);
  assert.ok(newBadges.some(b => b.badge.id === 'first_step'));
});

test('focus hours badge requires 10 hours of completed sessions', () => {
  const sessions = [{ id: 'f1', completed: true, actualDurationSeconds: 36000, taskLabel: 'test', endedAt: '2026-10-10T10:00:00', xpAwarded: 50 }];
  const source = { ...emptySource, focusSessions: sessions };
  const result = evaluateBadges(source, emptyStreaks);
  const badge = result.find(b => b.badge.id === 'focus_hours_10');
  assert.ok(badge);
  assert.equal(badge.earned, true);
});

test('getAllBadges returns the full list', () => {
  const all = getAllBadges();
  assert.ok(all.length >= 20);
});
