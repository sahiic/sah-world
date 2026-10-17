/* eslint-disable @typescript-eslint/no-require-imports -- Node's existing test runner uses CommonJS. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { shallow } = require('zustand/vanilla/shallow');
const load = require('./helpers/load-typescript.cjs');

const exceptions = new Set([
  'src/components/core/CommandPalette.tsx',
  'src/components/quran/useQuranCompanion.ts',
]);
const selectors = [];
const broadSubscriptions = [];
for (const file of fs.readdirSync('src', { recursive: true }).filter(f => /\.tsx?$/.test(f))) {
  const path = `src/${file.replaceAll('\\', '/')}`;
  const source = ts.createSourceFile(path, fs.readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.getText(source) === 'useJourneyStore') {
      if (!node.arguments.length) broadSubscriptions.push(path);
      else {
        let selector = node.arguments[0];
        const isShallow = ts.isCallExpression(selector) && selector.expression.getText(source) === 'useShallow';
        if (isShallow) selector = selector.arguments[0];
        if (ts.isArrowFunction(selector)) {
          const fields = new Set();
          const parameter = selector.parameters[0].name.getText(source);
          function scan(child) {
            if (ts.isPropertyAccessExpression(child) && child.expression.getText(source) === parameter) fields.add(child.name.text);
            ts.forEachChild(child, scan);
          }
          scan(selector.body);
          // Execute the real projection from the component, without importing
          // the persisted store or initializing authentication/network clients.
          const compiled = ts.transpileModule(`(${selector.getText(source)})`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
          const select = new Function(`return ${compiled}`)();
          selectors.push({ path, select, fields: [...fields], isShallow });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

test('only the two explicit exceptions retain whole-journey subscriptions', () => {
  assert.deepEqual(new Set(broadSubscriptions), exceptions);
  assert.ok(selectors.length >= 50, 'all action and data subscriptions must be covered');
});

test('granular projections ignore unrelated writes and react to selected data', () => {
  for (const { path, select, fields, isShallow } of selectors) {
    assert.ok(fields.length > 0, path);
    const state = Object.fromEntries(fields.map(field => [field, field === 'xp' ? 100 : field === 'totalZikir' ? 33 : field === 'streak' ? { current: 2 } : []]));
    // Preserve selected references exactly as a Zustand partial update does.
    const before = select(state);
    const unrelated = select({ ...state, unusedForThisSelector: {} });
    assert.ok(isShallow ? shallow(before, unrelated) : Object.is(before, unrelated), `${path}: unrelated update`);
    for (const field of fields) {
      const changed = select({ ...state, [field]: field === 'xp' ? 200 : field === 'totalZikir' ? 66 : field === 'streak' ? { current: 3 } : [{}] });
      assert.equal(isShallow ? shallow(before, changed) : Object.is(before, changed), false, `${path}: ${field} update`);
    }
  }
});

test('actions have individual subscriptions; grouped projections use useShallow', () => {
  for (const { path, fields, isShallow } of selectors) {
    const actions = fields.filter(field => /^(add|set|update|delete|reset|increment|save|upsert|check|unlock|log|import|export)[A-Z]/.test(field));
    if (actions.length) {
      assert.equal(fields.length, 1, `${path}: action mixed with state`);
      assert.equal(isShallow, false, `${path}: unnecessary action shallow wrapper`);
    }
    if (fields.length > 1) assert.equal(isShallow, true, `${path}: unstable object selector`);
  }
});

test('activity and search projections work without unrelated store state/actions', () => {
  const { buildActivityFeed, buildSearchIndex, getCategoryCounts } = load('src/lib/activity.ts');
  const source = { journal: [], quranNotes: [], hadisNotes: [], eisenhower: { q1: [], q2: [], q3: [], q4: [] }, lessons: [], sukurList: [], focusSessions: [] };
  assert.deepEqual(buildActivityFeed(source), []);
  assert.deepEqual(buildSearchIndex(source), []);
  assert.equal(getCategoryCounts({ ...source, totalZikir: 66 }).mescidim, 2);
});
