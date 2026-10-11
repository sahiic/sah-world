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

const activityStub = { CATEGORY_META: { journal: { label: 'Günlük', icon: 'notebook', color: '#4f46e5' }, quran: { label: 'Kuran', icon: 'book-2', color: '#d97706' }, hadis: { label: 'Hadis', icon: 'quote', color: '#0f766e' }, sukur: { label: 'Şükür', icon: 'sparkles', color: '#059669' }, focus: { label: 'Odak', icon: 'target-arrow', color: '#0d9488' }, matrix: { label: 'Matris', icon: 'layout-grid', color: '#0284c7' }, lessons: { label: 'Hatalar', icon: 'history', color: '#be123c' } }, dayKey };
const { getDailyChallenges, getChallengeMessage, getChallengePool } = load('src/lib/dailyChallenge.ts', { '@/lib/activity': activityStub });

const NOW = new Date('2026-10-10T15:00:00');

const event = (category, labelOverride) => ({
  id: `e-${Math.random().toString(36).slice(2, 8)}`,
  createdAt: NOW.toISOString(),
  category,
  xp: 10,
  type: 'entry',
  label: labelOverride || 'Test',
});

test('returns 3 challenges by default', () => {
  const result = getDailyChallenges([], 3, NOW);
  assert.equal(result.challenges.length, 3);
  assert.equal(result.totalCount, 3);
});

test('custom count returns requested number of challenges', () => {
  const result = getDailyChallenges([], 5, NOW);
  assert.equal(result.challenges.length, 5);
});

test('all challenges start uncompleted when no events', () => {
  const result = getDailyChallenges([], 3, NOW);
  assert.equal(result.completedCount, 0);
  assert.equal(result.allCompleted, false);
});

test('date is set correctly', () => {
  const result = getDailyChallenges([], 3, NOW);
  assert.equal(result.date, '2026-10-10');
});

test('same date produces same challenges (deterministic)', () => {
  const a = getDailyChallenges([], 3, NOW);
  const b = getDailyChallenges([], 3, NOW);
  assert.deepEqual(
    a.challenges.map(c => c.title),
    b.challenges.map(c => c.title),
  );
});

test('different date produces different order', () => {
  const tomorrow = new Date('2026-10-11T15:00:00');
  const a = getDailyChallenges([], 3, NOW);
  const b = getDailyChallenges([], 3, tomorrow);
  const titlesA = a.challenges.map(c => c.title).join(',');
  const titlesB = b.challenges.map(c => c.title).join(',');
  assert.notEqual(titlesA, titlesB);
});

test('matching events mark challenges completed', () => {
  const result = getDailyChallenges([], 12, NOW);
  const categories = result.challenges.map(c => c.category);
  const events = categories.map(cat => event(cat));
  const result2 = getDailyChallenges(events, 12, NOW);
  assert.ok(result2.completedCount > 0);
});

test('events from other days do not count', () => {
  const yesterday = new Date('2026-10-09T12:00:00');
  const oldEvent = { ...event('journal'), createdAt: yesterday.toISOString() };
  const result = getDailyChallenges([oldEvent], 12, NOW);
  const journalChallenge = result.challenges.find(c => c.category === 'journal' && c.title === 'Günlük yaz');
  if (journalChallenge) {
    assert.equal(journalChallenge.completed, false);
  }
});

test('allCompleted is true when all challenges done', () => {
  const result = getDailyChallenges([], 3, NOW);
  const events = [];
  for (const c of result.challenges) {
    for (let i = 0; i < 3; i++) events.push(event(c.category, c.title.includes('Sabah') ? '🌅 Sabah Niyeti' : c.title.includes('Akşam') ? '🌙 Akşam Muhasebesi' : 'Test'));
  }
  const result2 = getDailyChallenges(events, 3, NOW);
  assert.equal(result2.allCompleted, true);
});

test('challenge pool has at least 10 entries', () => {
  const pool = getChallengePool();
  assert.ok(pool.length >= 10);
});

test('getChallengeMessage returns appropriate messages', () => {
  const none = { totalCount: 3, completedCount: 0, allCompleted: false, date: '', challenges: [] };
  assert.ok(getChallengeMessage(none).includes('bekliyor'));

  const some = { totalCount: 3, completedCount: 2, allCompleted: false, date: '', challenges: [] };
  assert.ok(getChallengeMessage(some).includes('2/3'));

  const all = { totalCount: 3, completedCount: 3, allCompleted: true, date: '', challenges: [] };
  assert.ok(getChallengeMessage(all).includes('Tebrikler'));
});

test('each challenge has required fields', () => {
  const result = getDailyChallenges([], 5, NOW);
  for (const c of result.challenges) {
    assert.ok(c.id);
    assert.ok(c.category);
    assert.ok(c.icon);
    assert.ok(c.title);
    assert.ok(c.description);
    assert.equal(typeof c.completed, 'boolean');
  }
});
