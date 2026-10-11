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
const { computeGlobalStreaks } = load('src/lib/streaks.ts', { '@/lib/activity': activity });

const ev = (date, category = 'journal') => ({
  id: `e-${date}`, category, label: '', detail: '', xp: 10, createdAt: `${date}T10:00:00`
});

test('empty events produce zero streaks', () => {
  const result = computeGlobalStreaks([], new Date('2026-10-10'));
  assert.equal(result.overall.current, 0);
  assert.equal(result.overall.longest, 0);
  assert.equal(result.totalActiveDays, 0);
});

test('single day activity gives streak of 1 when today', () => {
  const result = computeGlobalStreaks([ev('2026-10-10')], new Date('2026-10-10'));
  assert.equal(result.overall.current, 1);
  assert.equal(result.overall.longest, 1);
  assert.equal(result.totalActiveDays, 1);
});

test('consecutive days build a streak', () => {
  const events = [ev('2026-10-07'), ev('2026-10-08'), ev('2026-10-09'), ev('2026-10-10')];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.overall.current, 4);
  assert.equal(result.overall.longest, 4);
});

test('gap breaks current streak but longest is preserved', () => {
  const events = [
    ev('2026-10-01'), ev('2026-10-02'), ev('2026-10-03'), ev('2026-10-04'), ev('2026-10-05'),
    ev('2026-10-09'), ev('2026-10-10'),
  ];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.overall.current, 2);
  assert.equal(result.overall.longest, 5);
});

test('yesterday is still counted in current streak', () => {
  const events = [ev('2026-10-08'), ev('2026-10-09')];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.overall.current, 2);
});

test('two days ago breaks current streak', () => {
  const events = [ev('2026-10-07'), ev('2026-10-08')];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.overall.current, 0);
});

test('category streaks are computed independently', () => {
  const events = [
    ev('2026-10-09', 'journal'), ev('2026-10-10', 'journal'),
    ev('2026-10-10', 'focus'),
  ];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.byCategory.journal?.current, 2);
  assert.equal(result.byCategory.focus?.current, 1);
  assert.equal(result.overall.current, 2);
});

test('multiple events on same day count as one active day', () => {
  const events = [ev('2026-10-10'), ev('2026-10-10', 'focus'), ev('2026-10-10', 'quran')];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.equal(result.overall.current, 1);
  assert.equal(result.totalActiveDays, 1);
});

test('active days this week counts correctly', () => {
  const events = [
    ev('2026-10-06'), ev('2026-10-08'), ev('2026-10-10'),
  ];
  const result = computeGlobalStreaks(events, new Date('2026-10-10'));
  assert.ok(result.activeDaysThisWeek >= 2);
});
