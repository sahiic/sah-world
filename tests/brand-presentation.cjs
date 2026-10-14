const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('legacy SAH branding cannot return to user-facing source text', () => {
  const root = path.resolve(__dirname, '../src');
  const stale = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (/\.(tsx?|json|svg)$/.test(file)) {
        fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
          // Internal diagnostics and comments are not UI; environment keys and
          // stable storage identifiers must not be renamed during a rebrand.
          if (/console\.|^\s*(\/\/|\*|\/\*)/.test(line)) return;
          if (/(?<![\p{L}\p{N}_])SAH(?![\p{L}\p{N}_])/u.test(line)) stale.push(`${path.relative(root, file)}:${index + 1}`);
        });
      }
    }
  }
  walk(root);
  assert.deepEqual(stale, []);
});
