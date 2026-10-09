const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const result = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', code)(result);
  return result;
}
const awareness = load('src/lib/awareness.ts');
const boycott = load('src/lib/boycottData.ts');
const timeline = load('src/lib/awarenessTimeline.ts');
const origins = new Set(['https://www.dijitalhafiza.com', 'https://doguturkistan.dijitalhafiza.com', 'https://boykotdedektifi.com']);
test('every geography has six sourced chapters and ten distinct, balanced questions', () => {
  for (const geography of ['filistin', 'dogu_turkistan']) {
    const chapters = awareness.AWARENESS_CONTENT_FALLBACK.filter(x => x.geography === geography);
    const questions = awareness.AWARENESS_QUIZ_FALLBACK.filter(x => x.geography === geography);
    assert.equal(chapters.length, 6);
    assert.equal(new Set(chapters.map(x => x.section)).size, 6);
    assert.equal(questions.length, 10);
    assert.equal(new Set(questions.map(x => x.questionText)).size, 10);
    assert.equal(new Set(questions.map(x => x.correctOption)).size, 4);
    for (const question of questions) {
      assert.equal(Object.keys(question.options).length, 4);
      assert.ok(question.options[question.correctOption]);
      assert.ok(question.explanationText);
    }
  }
  for (const item of [...awareness.AWARENESS_CONTENT_FALLBACK, ...awareness.AWARENESS_QUIZ_FALLBACK, ...timeline.TIMELINE_EVENTS]) {
    const url = new URL(item.sourceUrl);
    assert.ok(origins.has(url.origin), item.id);
    assert.notEqual(url.pathname, '/', item.id);
  }
});
test('all active brands have specific source pages, stable unique IDs and local options', () => {
  const items = boycott.BOYCOTT_ITEMS;
  assert.equal(new Set(items.map(x => x.id)).size, items.length);
  assert.equal(new Set(items.map(x => x.category)).size, 8);
  assert.ok(items.length >= 30);
  for (const item of items) {
    assert.match(item.sourceUrl, /^https:\/\/boykotdedektifi\.com\/b\/[^/]+-\d+$/);
    assert.ok(item.alternatives.length > 0, item.id);
    assert.ok(item.reason && item.parentCompany);
  }
  assert.equal(items.find(x => x.id === 'ulker').status, 'boykot');
  assert.equal(items.find(x => x.id === 'a101').status, 'supheli');
  assert.match(items.find(x => x.id === 'cola-turka').parentCompany, /DyDo/);
});
