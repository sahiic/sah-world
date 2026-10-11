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

const activityStub = { dayKey };
const { buildCalendarMonth, getAdjacentMonth, getMonthNames } = load('src/lib/activityCalendar.ts', { '@/lib/activity': activityStub });

const NOW = new Date('2026-10-10T15:00:00');

const event = (day, month = 9) => ({
  id: `e-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: new Date(2026, month, day, 12, 0, 0).toISOString(),
  category: 'journal',
  xp: 10,
  label: 'Test',
});

test('builds correct number of days for October', () => {
  const result = buildCalendarMonth([], 2026, 9, NOW);
  assert.equal(result.days.length, 31);
  assert.equal(result.label, 'Ekim 2026');
});

test('builds correct number of days for February non-leap', () => {
  const result = buildCalendarMonth([], 2026, 1, NOW);
  assert.equal(result.days.length, 28);
  assert.equal(result.label, 'Şubat 2026');
});

test('start day of week is correct for October 2026', () => {
  const result = buildCalendarMonth([], 2026, 9, NOW);
  assert.equal(result.startDayOfWeek, 3);
});

test('events are counted per day', () => {
  const events = [event(5), event(5), event(5), event(10)];
  const result = buildCalendarMonth(events, 2026, 9, NOW);
  const day5 = result.days.find(d => d.day === 5);
  const day10 = result.days.find(d => d.day === 10);
  assert.equal(day5.count, 3);
  assert.equal(day10.count, 1);
});

test('events from other months are excluded', () => {
  const events = [event(5, 8)];
  const result = buildCalendarMonth(events, 2026, 9, NOW);
  assert.equal(result.totalEvents, 0);
  assert.equal(result.activeDays, 0);
});

test('active days and total events are summed', () => {
  const events = [event(1), event(1), event(3), event(7)];
  const result = buildCalendarMonth(events, 2026, 9, NOW);
  assert.equal(result.activeDays, 3);
  assert.equal(result.totalEvents, 4);
});

test('levels are computed based on max count', () => {
  const events = [
    event(1), event(1), event(1), event(1),
    event(5),
  ];
  const result = buildCalendarMonth(events, 2026, 9, NOW);
  const day1 = result.days.find(d => d.day === 1);
  const day5 = result.days.find(d => d.day === 5);
  const day15 = result.days.find(d => d.day === 15);
  assert.equal(day1.level, 4);
  assert.equal(day5.level, 1);
  assert.equal(day15.level, 0);
});

test('today is marked correctly', () => {
  const result = buildCalendarMonth([], 2026, 9, NOW);
  const today = result.days.find(d => d.day === 10);
  assert.equal(today.isToday, true);
  const other = result.days.find(d => d.day === 5);
  assert.equal(other.isToday, false);
});

test('getAdjacentMonth wraps correctly', () => {
  assert.deepEqual(getAdjacentMonth(2026, 0, -1), { year: 2025, month: 11 });
  assert.deepEqual(getAdjacentMonth(2026, 11, 1), { year: 2027, month: 0 });
  assert.deepEqual(getAdjacentMonth(2026, 5, 1), { year: 2026, month: 6 });
  assert.deepEqual(getAdjacentMonth(2026, 5, -1), { year: 2026, month: 4 });
});

test('getMonthNames returns 12 Turkish month names', () => {
  const names = getMonthNames();
  assert.equal(names.length, 12);
  assert.equal(names[0], 'Ocak');
  assert.equal(names[11], 'Aralık');
});

test('all days have required fields', () => {
  const result = buildCalendarMonth([event(3)], 2026, 9, NOW);
  for (const d of result.days) {
    assert.ok(d.date);
    assert.ok(d.day >= 1 && d.day <= 31);
    assert.ok(d.level >= 0 && d.level <= 4);
    assert.equal(typeof d.isToday, 'boolean');
    assert.equal(typeof d.isCurrentMonth, 'boolean');
  }
});
