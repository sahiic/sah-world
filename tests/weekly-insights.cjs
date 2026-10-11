const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./helpers/load-typescript.cjs');
const {buildWeeklyInsights}=load('src/lib/weeklyInsights.ts',{'@/lib/activity':load('src/lib/activity.ts')});
const now=new Date('2026-10-11T18:00:00');
const entry=(date,mood=3,extra={})=>({id:date,date,mood,...extra});
test('insufficient data does not invent mood trends',()=>{
  assert.match(buildWeeklyInsights([],[],now)[0],/henüz/);
  const lines=buildWeeklyInsights([entry('2026-10-10')],[],now);
  assert.match(lines[0],/1 günlük/);
  assert.ok(lines.every(line=>!line.includes('en yüksek')));
});
test('weekly insights exclude old, invalid and future dates and report actual rituals',()=>{
  const journal=[entry('2026-10-05',4,{ritualType:'sabah'}),entry('2026-10-09',3,{entryMode:'quick'}),entry('2026-10-11',5),entry('2026-10-12'),entry('invalid'),entry('2026-09-01')];
  const copy=structuredClone(journal);
  const lines=buildWeeklyInsights(journal,[],now);
  assert.match(lines[0],/3 günlük/);
  assert.match(lines[0],/1 sabah/);
  assert.match(lines[0],/1 hızlı/);
  assert.ok(lines.length<=4);
  assert.deepEqual(journal,copy);
});
test('real prior-week mood data produces a bounded comparison',()=>{
  const journal=[entry('2026-10-05',5),entry('2026-10-09',5),entry('2026-10-11',5),entry('2026-10-02',2),entry('2026-10-03',2)];
  assert.ok(buildWeeklyInsights(journal,[],now).some(line=>line.includes('yükseldi (2.0 → 5.0)')));
});
