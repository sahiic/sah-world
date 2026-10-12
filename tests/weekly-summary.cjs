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

const activityStub = { CATEGORY_META: { journal: { label: 'Günlük', icon: 'notebook' }, quran: { label: 'Kuran', icon: 'book' } }, dayKey };
const { buildWeeklySummary, summaryToText } = load('src/lib/weeklySummary.ts', { '@/lib/activity': activityStub });

const event = (daysAgo, category = 'journal', xp = 10) => {
  const d = new Date('2026-10-10T12:00:00');
  d.setDate(d.getDate() - daysAgo);
  return { id: `e-${Math.random().toString(36).slice(2, 8)}`, createdAt: d.toISOString(), category, xp, type: 'entry', label: 'Test' };
};

const NOW = new Date('2026-10-10T18:00:00');

test('empty events produce zero summary', () => {
  const result = buildWeeklySummary([], 0, NOW);
  assert.equal(result.totalEvents, 0);
  assert.equal(result.activeDays, 0);
  assert.equal(result.xpEarned, 0);
  assert.equal(result.topCategory, null);
  assert.equal(result.dailyCounts.length, 7);
});

test('events within 7-day window are counted', () => {
  const events = [event(0), event(1), event(2)];
  const result = buildWeeklySummary(events, 3, NOW);
  assert.equal(result.totalEvents, 3);
  assert.equal(result.xpEarned, 30);
});

test('events older than 7 days are excluded', () => {
  const events = [event(0), event(8)];
  const result = buildWeeklySummary(events, 1, NOW);
  assert.equal(result.totalEvents, 1);
});

test('active days are counted correctly', () => {
  const events = [event(0), event(0), event(2), event(4)];
  const result = buildWeeklySummary(events, 4, NOW);
  assert.equal(result.activeDays, 3);
});

test('top category is determined by count', () => {
  const events = [event(0, 'journal'), event(0, 'journal'), event(0, 'quran')];
  const result = buildWeeklySummary(events, 1, NOW);
  assert.equal(result.topCategory.category, 'journal');
  assert.equal(result.topCategory.count, 2);
});

test('daily counts has 7 entries', () => {
  const events = [event(0), event(3)];
  const result = buildWeeklySummary(events, 1, NOW);
  assert.equal(result.dailyCounts.length, 7);
  assert.ok(result.dailyCounts.some(c => c > 0));
});

test('streak current is passed through', () => {
  const result = buildWeeklySummary([event(0)], 42, NOW);
  assert.equal(result.streakCurrent, 42);
});

test('week label contains date range', () => {
  const result = buildWeeklySummary([], 0, NOW);
  assert.ok(result.weekLabel.includes('–'));
  assert.ok(result.weekLabel.includes('Eki'));
});

test('message changes based on activity', () => {
  const noActivity = buildWeeklySummary([], 0, NOW);
  assert.ok(noActivity.message.includes('henüz'));

  const highStreak = buildWeeklySummary(
    Array.from({ length: 7 }, (_, i) => event(i)),
    7,
    NOW,
  );
  assert.ok(highStreak.message.includes('kesintisiz'));
});

test('summaryToText produces readable output', () => {
  const summary = buildWeeklySummary([event(0), event(1)], 5, NOW);
  const text = summaryToText(summary);
  assert.ok(text.includes('SAH World'));
  assert.ok(text.includes('Seri: 5'));
  assert.ok(text.includes('XP'));
});

test('rolling weekday labels and copied counts align for every ending weekday', () => {
  const names = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];
  for (let endDay = 11; endDay <= 17; endDay++) {
    const now = new Date(2026, 9, endDay, 18);
    const summary = buildWeeklySummary([{ ...event(0), createdAt: now.toISOString() }], 1, now);
    assert.deepEqual(summary.dailyCounts, [0, 0, 0, 0, 0, 0, 1]);
    assert.deepEqual(summary.dailyLabels, Array.from({ length: 7 }, (_, i) => names[(now.getDay() + 1 + i) % 7]));
    assert.ok(summaryToText(summary).includes(`${names[now.getDay()]}:1`));
  }
});

test('rolling labels cross year and leap-day boundaries without shifting', () => {
  for (const [date, expected] of [
    ['2026-01-02T18:00:00', ['Ct', 'Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu']],
    ['2024-03-02T18:00:00', ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct']],
  ]) {
    assert.deepEqual(buildWeeklySummary([], 0, new Date(date)).dailyLabels, expected);
  }
});
