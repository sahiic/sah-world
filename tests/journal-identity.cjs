/* eslint-disable @typescript-eslint/no-require-imports -- Actual hooks are loaded by a scoped Node CommonJS module fixture */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const presentation = require('../src/lib/journalPresentation.ts');
const { DurableOutbox } = require('../src/lib/durableOutbox.ts');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const tick = () => new Promise(resolve => setImmediate(resolve));

/** Execute the actual hooks with a deterministic lifecycle and mocked transport; no real accounts. */
function harness(transport, outbox = {}) {
  const original = Module._load; const oldWindow = global.window; const oldNavigator = global.navigator;
  const values = []; const effects = []; const timers = new Map(); const events = []; const disk = new Map();
  let cursor = 0; let timer = 0; let owner = A; let online = false;
  const state = () => ({ user: { id: owner }, session: { user: { id: owner }, access_token: 'test-only' } });
  const auth = selector => selector(state()); auth.getState = state;
  const local = selector => selector({ journal: [{ id: 'other-account-private', date: '2026-10-01' }], sukurList: [] });
  const react = {
    useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], next => { values[index] = typeof next === 'function' ? next(values[index]) : next; }]; },
    useRef(initial) { const index = cursor++; if (!(index in values)) values[index] = { current: initial }; return values[index]; },
    useMemo: fn => fn(), useCallback: fn => fn, useEffect: fn => effects.push(fn),
  };
  global.window = { setTimeout(fn) { timers.set(++timer, fn); return timer; }, clearTimeout(id) { timers.delete(id); }, addEventListener() {}, removeEventListener() {}, dispatchEvent(event) { events.push(event); },
    localStorage: { getItem: key => disk.get(key) ?? null, setItem: (key, value) => disk.set(key, value) } };
  Object.defineProperty(global, 'navigator', { configurable: true, value: { get onLine() { return online; } } });
  Module._load = function(id, parent, main) {
    if (id === 'react') return react;
    if (id === '@/store/useAuthStore') return { useAuthStore: auth };
    if (id === '@/store/useJourneyStore') return { useJourneyStore: local };
    if (id === '@/lib/supabase') return { supabase: transport };
    if (id === '@/lib/journalPresentation') return presentation;
    if (id === '@/lib/durableOutbox') return { DurableOutbox };
    if (id === '@/lib/journalOutbox') return { pendingJournalEntries: () => [], journalWritesAfter: () => [], journalWriteVersion: () => 0, ...outbox };
    return original.call(this, id, parent, main);
  };
  return { events, disk, setOwner(value) { owner = value; }, setOnline(value) { online = value; },
    render(fn) { cursor = 0; return fn(); },
    async mountEffects() { const cleanups = effects.splice(0).map(fn => fn()); for (const fn of [...timers.values()]) fn(); timers.clear(); await tick(); return () => cleanups.forEach(fn => fn?.()); },
    restore() { Module._load = original; global.window = oldWindow; Object.defineProperty(global, 'navigator', { configurable: true, value: oldNavigator }); },
  };
}
function moduleFresh(path) { delete require.cache[require.resolve(path)]; return require(path); }

test('actual archive hook reads every capped page, scopes every request and ignores unscoped store data', async () => {
  const calls = []; const source = Array.from({ length: 340 }, (_, i) => ({ id: `row-${i}`, date: '2026-10-01', content: 'Synthetic', created_at: '2026-10-01T12:00:00Z' }));
  const h = harness({ from(table) {
    const call = { table }; calls.push(call);
    const query = { select() { return this; }, eq(key, value) { call[key] = value; return this; }, order() { return this; }, range(start, end) { call.start = start; call.end = end; return this; }, abortSignal() { return Promise.resolve({ data: source.slice(call.start, call.start + 50), count: 340, error: null }); } }; return query;
  } });
  try {
    const { useJournalArchive } = moduleFresh('../src/hooks/useJournalArchive.ts');
    h.render(useJournalArchive); await h.mountEffects(); const result = h.render(useJournalArchive);
    assert.equal(result.complete, true); assert.equal(result.entries.length, 340); assert.equal(result.total, 340);
    assert.deepEqual(calls.map(call => call.start), [0, 50, 100, 150, 200, 250, 300]);
    assert.ok(calls.every(call => call.table === 'journal_entries' && call.user_id === A));
    assert.ok(result.entries.every(row => row.id !== 'other-account-private'));
  } finally { h.restore(); }
});
test('partial archive errors are not presented as a complete history', async () => {
  let count = 0;
  const h = harness({ from() { return { select() { return this; }, eq() { return this; }, order() { return this; }, range() { return this; }, abortSignal() { return Promise.resolve(++count === 1 ? { data: [{ id: 'loaded', date: '2026-10-01', created_at: '' }], count: 2, error: null } : { data: null, error: { code: 'offline' } }); } }; } });
  try {
    const { useJournalArchive } = moduleFresh('../src/hooks/useJournalArchive.ts');
    h.render(useJournalArchive); await h.mountEffects(); const result = h.render(useJournalArchive);
    assert.equal(result.complete, false); assert.equal(result.error, true); assert.equal(result.loading, false); assert.equal(result.entries.length, 1);
  } finally { h.restore(); }
});
test('an old account response cannot populate the next account archive', async () => {
  let release;
  const h = harness({ from() { return { select() { return this; }, eq() { return this; }, order() { return this; }, range() { return this; }, abortSignal() { return new Promise(resolve => { release = resolve; }); } }; } });
  try {
    const { useJournalArchive } = moduleFresh('../src/hooks/useJournalArchive.ts');
    h.render(useJournalArchive); await h.mountEffects(); h.setOwner(B);
    release({ data: [{ id: 'A-private', date: '2026-10-01', created_at: '' }], count: 1, error: null }); await tick();
    assert.deepEqual(h.render(useJournalArchive).entries, []);
  } finally { h.restore(); }
});

test('writes during a read beat stale data, but a later confirmed read can show remote updates', async () => {
  let release; let version = 0;
  const writes = [];
  const h = harness({ from() { return { select() { return this; }, eq() { return this; }, order() { return this; }, range() { return this; }, abortSignal() { return new Promise(resolve => { release = resolve; }); } }; } }, { journalWriteVersion: () => version, journalWritesAfter: (_owner, since) => writes.filter(row => row.version > since).map(row => row.entry) });
  try {
    const { useJournalArchive } = moduleFresh('../src/hooks/useJournalArchive.ts');
    h.render(useJournalArchive); await h.mountEffects();
    writes.push({ version: ++version, entry: { id: 'stable', date: '2026-10-01', content: 'New local revision', createdAt: '' } });
    release({ data: [{ id: 'stable', date: '2026-10-01', content: 'Stale', created_at: '' }], count: 1, error: null }); await tick();
    const current = h.render(useJournalArchive); assert.equal(current.entries[0].content, 'New local revision');
    const reload = current.refresh();
    release({ data: [{ id: 'stable', date: '2026-10-01', content: 'Confirmed remote update', created_at: '' }], count: 1, error: null }); await reload;
    assert.equal(h.render(useJournalArchive).entries[0].content, 'Confirmed remote update');
  } finally { h.restore(); }
});
test('linked gratitude on a failed new-day lookup cannot reuse the old day record', async () => {
  let failing = false;
  const h = harness({ from() { return { select() { return this; }, eq() { return this; }, order() { return this; }, limit() { return this; }, abortSignal() { return this; }, maybeSingle() { return Promise.resolve(failing ? { error: { code: 'offline' }, data: null } : { error: null, data: { id: 'old-day', date: '2026-10-01', text: 'Synthetic', nimet1: 'Nimet', created_at: '' } }); } }; } });
  try {
    const { useJournalGratitude } = moduleFresh('../src/hooks/useJournalGratitude.ts');
    h.render(() => useJournalGratitude('2026-10-01')); const cleanup = await h.mountEffects();
    assert.equal(h.render(() => useJournalGratitude('2026-10-01')).entry.id, 'old-day');
    cleanup(); failing = true; h.render(() => useJournalGratitude('2026-10-02')); await h.mountEffects();
    const next = h.render(() => useJournalGratitude('2026-10-02')); assert.equal(next.entry, undefined); assert.equal(next.ready, false); assert.equal(next.error, true);
  } finally { h.restore(); }
});
test('actual journal outbox preserves offline rows and never sends A using B credentials', async () => {
  const sent = [];
  const h = harness({ from() { return { async upsert(row) { sent.push({ id: row.id, user_id: row.user_id }); return { error: null }; } }; } });
  try {
    const outbox = moduleFresh('../src/lib/journalOutbox.ts');
    const row = { id: '33333333-3333-4333-8333-333333333333', date: '2026-10-01', content: 'Synthetic', createdAt: '2026-10-01T12:00:00Z' };
    assert.equal(outbox.queueJournal(row), 'pending'); assert.equal(sent.length, 0);
    h.setOwner(B); h.setOnline(true); await outbox.flushJournalOutbox(); assert.equal(sent.length, 0);
    assert.equal(outbox.pendingJournalEntries(B).length, 0); assert.equal(outbox.pendingJournalEntries(A).length, 1);
    h.setOwner(A); await outbox.flushJournalOutbox(); assert.deepEqual(sent, [{ id: row.id, user_id: A }]); assert.equal(outbox.pendingJournalEntries(A).length, 0);
    assert.ok(h.events.some(event => event.detail?.value === 'saved' && event.detail.owner === A));
  } finally { h.restore(); }
});
