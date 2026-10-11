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

const { detectMilestones, getMilestoneRuleCount } = load('src/lib/milestoneTimeline.ts', { '@/lib/activity': activityStub });

const event = (category, daysAgo = 0, xp = 25) => {
  const d = new Date('2026-10-10T12:00:00');
  d.setDate(d.getDate() - daysAgo);
  return { id: `e-${Math.random().toString(36).slice(2, 8)}`, createdAt: d.toISOString(), category, xp, label: 'Test', detail: 'Test' };
};

test('no events produce no milestones', () => {
  const result = detectMilestones([], 0, 0);
  assert.equal(result.length, 0);
});

test('single event triggers first-entry milestone', () => {
  const result = detectMilestones([event('journal')], 25, 0);
  assert.ok(result.some(m => m.id === 'first-entry'));
});

test('first category milestones are detected', () => {
  const events = [event('journal'), event('quran', 1), event('hadis', 2)];
  const result = detectMilestones(events, 75, 0);
  assert.ok(result.some(m => m.id === 'first-journal'));
  assert.ok(result.some(m => m.id === 'first-quran'));
  assert.ok(result.some(m => m.id === 'first-hadis'));
});

test('10th journal triggers journal-10', () => {
  const events = Array.from({ length: 10 }, (_, i) => event('journal', i));
  const result = detectMilestones(events, 250, 0);
  assert.ok(result.some(m => m.id === 'journal-10'));
});

test('50 events triggers total-50', () => {
  const events = Array.from({ length: 50 }, (_, i) => event('journal', i % 30));
  const result = detectMilestones(events, 1250, 0);
  assert.ok(result.some(m => m.id === 'total-50'));
});

test('500 XP triggers xp-500', () => {
  const events = Array.from({ length: 20 }, (_, i) => event('journal', i, 25));
  const result = detectMilestones(events, 500, 0);
  assert.ok(result.some(m => m.id === 'xp-500'));
});

test('7-day streak triggers streak-7', () => {
  const events = [event('journal')];
  const result = detectMilestones(events, 25, 7);
  assert.ok(result.some(m => m.id === 'streak-7'));
});

test('30-day streak triggers both streak milestones', () => {
  const events = [event('journal')];
  const result = detectMilestones(events, 25, 30);
  assert.ok(result.some(m => m.id === 'streak-7'));
  assert.ok(result.some(m => m.id === 'streak-30'));
});

test('milestones are sorted by date ascending', () => {
  const events = [event('journal', 5), event('quran', 3), event('hadis', 1)];
  const result = detectMilestones(events, 75, 0);
  const datedMilestones = result.filter(m => m.date);
  for (let i = 1; i < datedMilestones.length; i++) {
    assert.ok(datedMilestones[i].date >= datedMilestones[i - 1].date);
  }
});

test('milestone has required fields', () => {
  const result = detectMilestones([event('journal')], 25, 0);
  for (const m of result) {
    assert.ok(m.id);
    assert.ok(m.icon);
    assert.ok(m.title);
    assert.ok(m.description);
    assert.ok(m.category);
  }
});

test('active-7 triggers with 7 unique days', () => {
  const events = Array.from({ length: 7 }, (_, i) => event('journal', i));
  const result = detectMilestones(events, 175, 0);
  assert.ok(result.some(m => m.id === 'active-7'));
});

test('getMilestoneRuleCount returns total rules', () => {
  const count = getMilestoneRuleCount();
  assert.ok(count >= 15);
});
