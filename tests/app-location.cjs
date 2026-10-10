/* eslint-disable @typescript-eslint/no-require-imports -- Existing Node CommonJS test runner */
const { test } = require('node:test'); const assert = require('node:assert/strict'); const fs = require('node:fs'); const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,filename);
const { APP_VIEWS, appLocation, readAppView, selectedValue, JOURNAL_TABS } = require('../src/lib/appLocation.ts');
test('three Quran areas preserve legacy deep-link meaning', () => {
  const { QURAN_TABS, readQuranTab } = require('../src/lib/appLocation.ts');
  assert.deepEqual(QURAN_TABS,['oku','calis','topluluk']);
  for(const tab of ['home','study','wheel',null,'invalid']) assert.equal(readQuranTab(tab),'oku');
  for(const tab of ['progress','exercises','achievements']) assert.equal(readQuranTab(tab),'calis');
  for(const tab of ['teachers','appointments','peers','manage']) assert.equal(readQuranTab(tab),'topluluk');
});
test('all canonical views round-trip and legacy focus links remain valid',()=>{for(const view of APP_VIEWS)assert.equal(readAppView(new URLSearchParams(appLocation('',view))),view);assert.equal(readAppView(new URLSearchParams('focus=1')),'focus');assert.equal(readAppView(new URLSearchParams('view=__proto__')),'dashboard');});
test('one atomic destination drops stale tab/wisdom state and preserves unrelated query params',()=>{const next=appLocation('?view=quran-companion&tab=wheel&wisdom=hadith&focus=1&campaign=pilot','journal','matrix');const params=new URLSearchParams(next);assert.equal(params.get('tab'),'matrix');assert.equal(params.get('wisdom'),null);assert.equal(params.get('focus'),null);assert.equal(params.get('campaign'),'pilot');assert.equal(selectedValue('unknown',JOURNAL_TABS,'journal'),'journal');});

test('journal-only navigation parameters are replaced atomically and cannot leak into another module', () => {
  const start = '?view=journal&tab=journal&journalPanel=history&journalDate=2026-10-01&journalRitual=sabah&campaign=pilot';
  const other = new URLSearchParams(appLocation(start, 'mescidim', 'vakitler'));
  for (const key of ['journalPanel', 'journalDate', 'journalRitual']) assert.equal(other.get(key), null);
  assert.equal(other.get('campaign'), 'pilot');
  const history = new URLSearchParams(appLocation(start, 'journal', 'journal', { journalPanel: 'history' }));
  assert.equal(history.get('journalDate'), null); assert.equal(history.get('journalPanel'), 'history');
});
