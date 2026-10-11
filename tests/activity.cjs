const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-typescript.cjs');
const {buildActivityFeed, getCategoryCounts, dayKey, relativeTime} = load('src/lib/activity.ts');
const empty = () => ({journal:[],quranNotes:[],hadisNotes:[],eisenhower:{q1:[],q2:[],q3:[],q4:[]},lessons:[],sukurList:[],totalZikir:0,focusSessions:[]});

test('empty activity has no synthetic events and all categories are zero', () => {
  assert.deepEqual(buildActivityFeed(empty()), []);
  assert.equal(Object.keys(getCategoryCounts(empty())).length, 10);
  assert.ok(Object.values(getCategoryCounts(empty())).every(n => n === 0));
});
test('feed preserves IDs, completion time, zero XP and sorts without mutation', () => {
  const source = empty();
  source.journal = [{id:'j',content:'note',xpAwarded:0,createdAt:'2026-10-09T10:00:00Z'}];
  source.eisenhower.q1 = [{id:'open',done:false}, {id:'done',done:true,text:'task',createdAt:'2026-10-01T10:00:00Z',completedAt:'2026-10-10T10:00:00Z'}];
  source.quranNotes = [{id:'q',sure:'Fatiha',createdAt:'2026-10-08T10:00:00Z'}];
  const snapshot = structuredClone(source);
  const feed = buildActivityFeed(source);
  assert.deepEqual(feed.map(e=>e.id), ['done','j','q']);
  assert.equal(feed[1].xp,0);
  assert.equal(feed[0].createdAt,source.eisenhower.q1[1].completedAt);
  assert.deepEqual(source,snapshot);
});
test('focus feed includes completed or at least ten-minute sessions; counts retain all sessions', () => {
  const source=empty();
  source.focusSessions=[599,600,20].map((seconds,i)=>({id:String(i),actualDurationSeconds:seconds,completed:i===2,taskLabel:'task',xpAwarded:0,endedAt:`2026-10-0${i+1}T10:00:00Z`}));
  assert.deepEqual(buildActivityFeed(source).map(e=>e.id),['2','1']);
  source.totalZikir=65;
  assert.equal(getCategoryCounts(source).mescidim,1);
  assert.equal(getCategoryCounts(source).focus,3);
  source.totalZikir=66;
  assert.equal(getCategoryCounts(source).mescidim,2);
});
test('dayKey uses the local calendar and preserves its Date input', () => {
  const date = new Date(2024,1,29,23,59,59);
  const stamp=date.getTime();
  assert.equal(dayKey(date),'2024-02-29');
  assert.equal(dayKey(date.toISOString()),'2024-02-29');
  assert.equal(date.getTime(),stamp);
});
test('relativeTime covers recent, minute, hour, day, future and older dates deterministically', () => {
  const now=new Date(2026,9,11,12).getTime();
  for (const [seconds,expected] of [[0,'az önce'],[44,'az önce'],[60,'1 dakika önce'],[3599,'59 dakika önce'],[3600,'1 saat önce'],[86400,'1 gün önce'],[-60,'az önce']])
    assert.equal(relativeTime(new Date(now-seconds*1000).toISOString(),now),expected);
  const old=new Date(now-31*86400000);
  assert.equal(relativeTime(old.toISOString(),now),new Intl.DateTimeFormat('tr-TR',{day:'numeric',month:'short'}).format(old));
});
