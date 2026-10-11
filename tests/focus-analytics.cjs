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

const { computeFocusAnalytics, formatHour, getProductivityLabel } = load('src/lib/focusAnalytics.ts', { '@/types/focus': {} });

const session = (overrides = {}) => ({
  id: `s-${Math.random().toString(36).slice(2, 8)}`,
  startTime: '2026-10-10T10:00:00',
  endTime: '2026-10-10T10:25:00',
  duration: 25,
  mode: 'focus',
  completed: true,
  niyet: 'Test',
  tags: [],
  ...overrides,
});

test('empty sessions produce zero analytics', () => {
  const result = computeFocusAnalytics([]);
  assert.equal(result.totalSessions, 0);
  assert.equal(result.productivityScore, 0);
  assert.equal(result.bestHour, null);
});

test('single completed session produces valid analytics', () => {
  const result = computeFocusAnalytics([session()]);
  assert.equal(result.totalSessions, 1);
  assert.equal(result.completionRate, 100);
  assert.equal(result.averageSessionMinutes, 25);
  assert.equal(result.bestHour, 10);
});

test('break sessions are excluded from analytics', () => {
  const sessions = [
    session(),
    session({ mode: 'shortBreak', duration: 5 }),
    session({ mode: 'longBreak', duration: 15 }),
  ];
  const result = computeFocusAnalytics(sessions);
  assert.equal(result.totalSessions, 1);
});

test('completion rate accounts for incomplete sessions', () => {
  const sessions = [
    session(),
    session({ completed: false }),
    session({ completed: false }),
  ];
  const result = computeFocusAnalytics(sessions);
  assert.equal(result.completionRate, 33);
});

test('hourly patterns group sessions by start hour', () => {
  const sessions = [
    session({ startTime: '2026-10-10T09:00:00' }),
    session({ startTime: '2026-10-10T09:30:00' }),
    session({ startTime: '2026-10-10T14:00:00' }),
  ];
  const result = computeFocusAnalytics(sessions);
  assert.equal(result.bestHour, 9);
  const nineAm = result.hourlyPatterns.find(p => p.hour === 9);
  assert.ok(nineAm);
  assert.equal(nineAm.sessions, 2);
});

test('tag breakdown aggregates by tag', () => {
  const sessions = [
    session({ tags: ['matematik'], duration: 30 }),
    session({ tags: ['matematik'], duration: 20 }),
    session({ tags: ['fizik'], duration: 25 }),
  ];
  const result = computeFocusAnalytics(sessions);
  assert.equal(result.tagBreakdown.length, 2);
  assert.equal(result.tagBreakdown[0].tag, 'matematik');
  assert.equal(result.tagBreakdown[0].totalMinutes, 50);
});

test('sessions without tags show as Etiketsiz', () => {
  const result = computeFocusAnalytics([session({ tags: [] })]);
  assert.ok(result.tagBreakdown.some(t => t.tag === 'Etiketsiz'));
});

test('quality trend shows last 14 days', () => {
  const sessions = Array.from({ length: 20 }, (_, i) => {
    const d = new Date('2026-10-10');
    d.setDate(d.getDate() - i);
    return session({ startTime: d.toISOString() });
  });
  const result = computeFocusAnalytics(sessions);
  assert.ok(result.qualityTrend.length <= 14);
});

test('formatHour returns correct format', () => {
  assert.equal(formatHour(0), '00:00');
  assert.equal(formatHour(9), '09:00');
  assert.equal(formatHour(14), '14:00');
});

test('productivity label tiers are correct', () => {
  assert.equal(getProductivityLabel(85).label, 'Mükemmel');
  assert.equal(getProductivityLabel(65).label, 'İyi');
  assert.equal(getProductivityLabel(45).label, 'Gelişiyor');
  assert.equal(getProductivityLabel(25).label, 'Başlangıç');
  assert.equal(getProductivityLabel(5).label, 'Keşif');
});

test('productivity score considers volume, consistency, and completion', () => {
  const manySessions = Array.from({ length: 30 }, (_, i) => {
    const d = new Date('2026-10-10');
    d.setDate(d.getDate() - (i % 14));
    return session({ startTime: d.toISOString(), duration: 25 });
  });
  const result = computeFocusAnalytics(manySessions);
  assert.ok(result.productivityScore >= 60);
});
