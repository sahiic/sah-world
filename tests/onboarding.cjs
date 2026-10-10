const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const api = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/onboarding.ts','utf8'), { compilerOptions:{module:ts.ModuleKind.CommonJS} }).outputText)(api);
test('welcome only targets new, inactive, incomplete accounts', () => {
  const now = Date.parse('2026-10-09T12:00:00Z');
  assert.equal(api.eligibleForWelcome('2026-10-09T11:00:00Z',false,false,now),true);
  for (const args of [['invalid',false,false],['2026-10-01',false,false],['2026-10-10',false,false],['2026-10-09',true,false],['2026-10-09',false,true]]) assert.equal(api.eligibleForWelcome(...args,now),false);
});
test('onboarding progress is isolated, survives reload, and recovers invalid preferences', () => {
  const data = new Map(); const storage = {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  api.writeOnboarding(storage,'one',{stage:'writing',entryId:'entry'});
  api.writeOnboarding(storage,'two',{stage:'complete'});
  assert.deepEqual(api.readOnboarding(storage,'one'),{stage:'writing',entryId:'entry'});
  assert.equal(api.readOnboarding(storage,'two').stage,'complete');
  assert.equal(api.readOnboarding(storage,'three'),undefined);
  data.set(api.ONBOARDING_KEY,'invalid'); assert.equal(api.readOnboarding(storage,'one'),undefined);
});
