#!/usr/bin/env node
/** One-time refactor audit: node scripts/verify-css-split.cjs <base-ref>.
 * Compares parsed rules including their enclosing media/supports/keyframe context.
 * Deliberately ignores formatting and grouping of selector lists/conditional wrappers.
 * A mixed selector list is equivalent to its component selectors with the same body.
 */
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');

const base = process.argv[2] || 'origin/main';
const source = 'src/app/globals.css';
const readBase = file => cp.execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
const before = postcss.parse(readBase(source));
const after = postcss.parse(fs.readFileSync(source, 'utf8'));
const imports = root => root.nodes.filter(n => n.type === 'atrule' && n.name === 'import').map(n => n.params);
const oldImports = imports(before);
const newImports = imports(after);
assert.deepEqual(newImports.slice(0, oldImports.length), oldImports, 'Existing imports/order changed');
assert.equal(oldImports[0], '"tailwindcss"');
assert.equal(newImports.length - oldImports.length, 14, 'Expected 14 domain files');
for (const param of oldImports) {
  if (!param.startsWith('"./')) continue;
  const file = path.posix.join('src/app', param.slice(1, -1));
  assert.equal(fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n'), readBase(file).replace(/\r\n/g, '\n'), `Existing imported file changed: ${file}`);
}
const expanded = postcss.root();
for (const node of after.nodes) {
  if (node.type === 'atrule' && node.name === 'import' && !oldImports.includes(node.params)) {
    const file = path.join('src/app', node.params.slice(1, -1));
    expanded.append(postcss.parse(fs.readFileSync(file, 'utf8')).nodes);
  } else expanded.append(node.clone());
}
function inventory(root) {
  const rules = [], declarations = [], comments = [], cascade = new Map();
  function walk(node, parents) {
    if (node.type === 'comment') { comments.push(node.text); return; }
    if (node.type === 'rule') {
      const body = node.nodes.filter(n => n.type === 'decl').map(n => [n.prop, n.value, !!n.important]);
      for (const selector of postcss.list.comma(node.selector)) {
        rules.push(JSON.stringify([parents, selector, body]));
        node.nodes.forEach(n => { if(n.type !== 'comment') walk(n, [...parents, selector]); });
        for (const [prop, value, important] of body) {
        const key = JSON.stringify([parents, selector, prop, important]);
        cascade.set(key, value);
        }
      }
      node.nodes.filter(n=>n.type === 'comment').forEach(n => walk(n, parents));
      return;
    }
    if (node.type === 'decl') { declarations.push(JSON.stringify([parents, node.prop, node.value, !!node.important])); return; }
    const next = node.type === 'atrule' ? [...parents, `@${node.name} ${node.params}`] : parents;
    if (node.nodes) node.nodes.forEach(n => walk(n, next));
  }
  walk(root, []);
  return { rules: rules.sort(), declarations: declarations.sort(), comments: comments.sort(), cascade };
}
const a = inventory(before), b = inventory(expanded);
assert.deepEqual(b.rules, a.rules, 'Rule/selector/declaration or conditional context changed');
assert.deepEqual(b.declarations, a.declarations, 'Declaration added, removed, or changed');
assert.deepEqual(b.comments, a.comments, 'Original comments must be preserved');
const conflicts = [...a.cascade].filter(([key, value]) => b.cascade.get(key) !== value);
console.log(`Preserved ${a.rules.length} rules, ${a.declarations.length} declarations, ${a.comments.length} comments, and ${oldImports.length} existing imports.`);
if (conflicts.length) {
  console.error('Same-selector cascade winner changes:', conflicts.map(([key, value]) => ({ key: JSON.parse(key), before: value, after: b.cascade.get(key) })));
  process.exitCode = 1;
} else console.log('Same-selector cascade winners unchanged. Confirm cross-selector/layout behavior with browser comparisons.');
