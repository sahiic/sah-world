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
const { buildHeatmap, getMonthLabels } = load('src/lib/activityHeatmap.ts', { '@/lib/activity': activity });

const ev = (date, category = 'journal') => ({
  id: `e-${date}`, category, label: '', detail: '', xp: 10, createdAt: `${date}T10:00:00`
});

test('empty events produce all-zero heatmap', () => {
  const data = buildHeatmap([], 4, new Date('2026-10-11'));
  assert.equal(data.activeDays, 0);
  assert.equal(data.maxCount, 0);
  assert.equal(data.days.length, 28);
  assert.ok(data.days.every(d => d.level === 0));
});

test('single event marks one active day', () => {
  const data = buildHeatmap([ev('2026-10-10')], 4, new Date('2026-10-11'));
  assert.equal(data.activeDays, 1);
  const active = data.days.find(d => d.date === '2026-10-10');
  assert.ok(active);
  assert.equal(active.count, 1);
  assert.ok(active.level > 0);
});

test('multiple events on same day increase count', () => {
  const events = [ev('2026-10-10'), ev('2026-10-10', 'focus'), ev('2026-10-10', 'quran')];
  const data = buildHeatmap(events, 4, new Date('2026-10-11'));
  assert.equal(data.activeDays, 1);
  const active = data.days.find(d => d.date === '2026-10-10');
  assert.ok(active);
  assert.equal(active.count, 3);
});

test('level assignment scales with max count', () => {
  const events = [
    ev('2026-10-05'),
    ev('2026-10-08'), ev('2026-10-08'),
    ev('2026-10-10'), ev('2026-10-10'), ev('2026-10-10'), ev('2026-10-10'),
  ];
  const data = buildHeatmap(events, 4, new Date('2026-10-11'));
  const day1 = data.days.find(d => d.date === '2026-10-05');
  const day4 = data.days.find(d => d.date === '2026-10-10');
  assert.ok(day1 && day4);
  assert.ok(day1.level < day4.level);
  assert.equal(day4.level, 4);
});

test('events outside the window are excluded', () => {
  const data = buildHeatmap([ev('2026-01-01')], 4, new Date('2026-10-11'));
  assert.equal(data.activeDays, 0);
});

test('getMonthLabels returns labels for visible months', () => {
  const data = buildHeatmap([], 20, new Date('2026-10-11'));
  const labels = getMonthLabels(data.days);
  assert.ok(labels.length >= 3);
  assert.ok(labels.some(l => l.label === 'Eki'));
});

test('weeks parameter controls total days', () => {
  const d8 = buildHeatmap([], 8, new Date('2026-10-11'));
  const d16 = buildHeatmap([], 16, new Date('2026-10-11'));
  assert.equal(d8.days.length, 56);
  assert.equal(d16.days.length, 112);
});

test('heatmap days are in chronological order', () => {
  const data = buildHeatmap([], 4, new Date('2026-10-11'));
  for (let i = 1; i < data.days.length; i++) {
    assert.ok(data.days[i].date >= data.days[i - 1].date);
  }
});
