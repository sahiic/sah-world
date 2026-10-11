const {test}=require('node:test');
const assert=require('node:assert/strict');
const load=require('./helpers/load-typescript.cjs');
const {normalizeJourneyData,journeyPreferences}=load('src/lib/normalizeJourney.ts',{'./constants':load('src/lib/constants.ts')});
test('non-object backups produce safe defaults',()=>{
  for(const input of [null,undefined,[],42,'invalid']) {
    const data=normalizeJourneyData(input);
    assert.equal(data.xp,0);assert.deepEqual(data.journal,[]);
    assert.deepEqual(data.eisenhower,{q1:[],q2:[],q3:[],q4:[]});
  }
});
test('normalization is idempotent and does not mutate valid user content',()=>{
  const raw={xp:210,vehicle:{type:'bike',name:'Personal'},journal:[{id:'keep',content:'Keep exactly',createdAt:'2026-10-10T10:00:00Z',custom:'preserved'}],sukurList:[{id:'s',nimet1:'first',nimet2:'second'}]};
  const copy=structuredClone(raw),normalized=normalizeJourneyData(raw);
  assert.deepEqual(raw,copy);
  assert.deepEqual(normalizeJourneyData(normalized),normalized);
  assert.equal(normalized.journal[0].id,'keep');assert.equal(normalized.journal[0].custom,'preserved');
  assert.deepEqual(normalized.sukurList[0].nimets,['first','second','']);
});
test('invalid numeric values never create XP, durations or streaks',()=>{
  const data=normalizeJourneyData({xp:Infinity,totalZikir:-2,streak:{current:-5},focusSessions:[{plannedDurationSeconds:Infinity,actualDurationSeconds:-3}]});
  assert.equal(data.xp,0);assert.equal(data.totalZikir,0);assert.equal(data.streak.current,0);
  assert.equal(data.focusSessions[0].actualDurationSeconds,0);
  assert.equal(data.focusSessions[0].plannedDurationSeconds,0);
  assert.deepEqual(journeyPreferences({vehicleChosen:'true',currentTespih:NaN}),{vehicleChosen:false,currentTespih:0});
});
