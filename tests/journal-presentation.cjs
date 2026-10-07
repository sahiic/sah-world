/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS test runner and TypeScript transpilation fixture */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { validJournalDate, normalizeJournalSearch, filterJournalEntries, mapJournalRow, journalCalendar, mergeJournalEntries, journalPreview, journalRitual } = require('../src/lib/journalPresentation.ts');
const make = (id, fields = {}) => ({ id, date: '2026-10-06', content: '', moments: [], tags: [], createdAt: '2026-10-06T12:00:00Z', ...fields });
const filters = { query: '', from: '', to: '', ritual: 'all' };

test('Turkish case, dotted/undotted I, decomposed accents and whitespace normalize consistently', () => {
  assert.equal(normalizeJournalSearch('  İYİLİK\n IŞIK   ŞÜKÜR  '), 'iyilik isik sukur');
  assert.equal(normalizeJournalSearch('şükrüm'), normalizeJournalSearch('s\u0327u\u0308kru\u0308m'));
});
test('search covers separate content, intentions, gratitude, self note, moments and tags, with AND filters', () => {
  const row = make('a', { content: 'Çalışma', intentionText: 'İyilik', gratitudeText: 'Sağlık', selfNote: 'Şefkat', moments: ['Kardeşim'], tags: ['odak'], ritualType: 'sabah' });
  for (const query of ['calisma', 'IYILIK', 'saglik', 'sefkat', 'kardesim', 'odak', 'iyilik   saglik']) assert.equal(filterJournalEntries([row], { ...filters, query }).length, 1, query);
  assert.equal(filterJournalEntries([row], { ...filters, query: 'iyilik', ritual: 'aksam' }).length, 0);
  assert.equal(filterJournalEntries([row], { ...filters, from: '2026-10-07' }).length, 0);
  assert.equal(filterJournalEntries([row], { ...filters, to: '2026-10-05' }).length, 0);
  assert.equal(filterJournalEntries([row], { ...filters, query: 'iyilik', from: row.date, to: row.date, ritual: 'sabah' }).length, 1);
});
test('history is newest first without mutating entries, and legacy records remain readable', () => {
  const legacy = mapJournalRow({ id: 'old', date: '2026-09-30', content: 'Old note', tags: ['kept'], moments: ['Memory'], self_note: 'Private', created_at: '2026-09-30T12:00:00Z' });
  const original = [legacy, make('new')];
  assert.deepEqual(filterJournalEntries(original, filters).map(row => row.id), ['new', 'old']);
  assert.equal(original[0].id, 'old'); assert.equal(legacy.entryMode, 'full'); assert.equal(journalRitual(legacy), 'aksam');
  assert.deepEqual(legacy.tags, ['kept']); assert.equal(journalPreview(legacy), 'Old note');
});
test('valid date navigation rejects malformed, impossible and future dates', () => {
  for (const date of ['2026-02-30', '2026-13-01', '2026-10-08', 'bad', null, '2026-1-01']) assert.equal(validJournalDate(date, '2026-10-07'), false);
  assert.equal(validJournalDate('2024-02-29', '2026-10-07'), true);
});
test('Monday-first calendar handles leap years and six-week months with exact date keys', () => {
  for (const month of ['2024-02', '2026-08', '2026-10']) {
    const cells = journalCalendar(month); assert.equal(cells.length % 7, 0);
    assert.equal(new Date(`${cells[0].date}T12:00:00`).getDay(), 1);
    assert.equal(new Set(cells.map(cell => cell.date)).size, cells.length);
    const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5)), 0).getDate();
    assert.equal(cells.filter(cell => cell.currentMonth).length, days);
  }
});
test('a stale server snapshot never overrides newer local revisions of the same UUID', () => {
  const old = make('stable', { content: 'old' }); const fresh = { ...old, content: 'new last!' };
  assert.deepEqual(mergeJournalEntries([old], [fresh]), [fresh]);
});

test('actual light/dark journal tokens meet WCAG AA text and focus contrast', () => {
  const css = fs.readFileSync(require.resolve('../src/app/journal.css'), 'utf8');
  const luminance = hex => {
    const rgb = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const ratio = (a, b) => { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + 0.05) / (values[1] + 0.05); };
  const blocks = [css.match(/\.core-app \.journal-workspace\.journal-hub \{([^}]+)\}/)[1], css.match(/\[data-theme="dark"\] \.journal-workspace\.journal-hub \{([^}]+)\}/)[1]];
  blocks.forEach((block, i) => {
    const tokens = Object.fromEntries([...block.matchAll(/--j-([\w-]+):\s*(#[\da-f]{6})/g)].map(match => [match[1], match[2]]));
    for (const foreground of ['ink', 'muted', 'accent', 'error']) for (const background of ['paper', 'surface', 'soft']) assert.ok(ratio(tokens[foreground], tokens[background]) >= 4.5, `${i ? 'dark' : 'light'} ${foreground}/${background}`);
    assert.ok(ratio(i ? '#123626' : '#ffffff', tokens.accent) >= 4.5, 'save button');
    assert.ok(ratio(tokens.accent, tokens.paper) >= 3, 'focus ring');
  });
});
