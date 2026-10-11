const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const read = path => fs.readFileSync(path, 'utf8');

test('badge and challenge status is available without relying on color', () => {
  const badges = read('src/components/ui/BadgeGallery.tsx');
  assert.match(badges, /role="progressbar"/);
  assert.match(badges, /aria-valuenow=/);
  assert.match(badges, /kazanıldı/);
  const challenges = read('src/components/ui/DailyChallengeCard.tsx');
  assert.match(challenges, /henüz tamamlanmadı/);
  assert.match(challenges, /<svg[^>]*aria-hidden="true"/);
  assert.doesNotMatch(read('src/app/achievements.css'), /\.badge-card\.locked\{opacity/);
});

test('clipboard outcomes are announced and decorative mosque SVG is hidden', () => {
  const summary = read('src/components/ui/WeeklySummaryCard.tsx');
  assert.match(summary, /role="status"/);
  assert.match(summary, /Kopyalanamadı/);
  assert.match(read('src/components/core/MescidimView.tsx'), /<svg[^>]*aria-hidden="true"/);
});
