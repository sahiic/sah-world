const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./helpers/load-typescript.cjs');
const school = load('src/lib/professionSchool.ts');

function harness() {
  let userId='account-a', state, effect, cleanup;
  const pending=[], listeners=new Map(), filters=[];
  const fakeWindow={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:name=>listeners.delete(name)};
  const hook=load('src/hooks/useProfessionRecommendation.ts',{
    react:{useState:initial=>{state ??= initial;return [state,next=>{state=next}]},useEffect:fn=>{effect=fn}},
    '@/lib/professionSchool':school,
    '@/store/useAuthStore':{useAuthStore:selector=>selector({session:userId?{access_token:'test-session',user:{id:userId}}:null})},
    '@/lib/supabase':{supabase:{from:table=>{
      const promise=new Promise(resolve=>pending.push({table,resolve}));
      const query={select:()=>query,eq:(column,value)=>{filters.push([column,value]);return query},order:()=>query,then:promise.then.bind(promise)};
      return query;
    }}},
  }).useProfessionRecommendation;
  return {
    render:()=>hook(),
    mount:()=>{global.window=fakeWindow;cleanup=effect()},
    unmount:()=>cleanup?.(),
    account:value=>{userId=value},pending,filters,listeners,
  };
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('recommendation loads only current account records and clears on logout',async()=>{
  const h=harness();assert.equal(h.render(),null);h.mount();
  assert.deepEqual(h.filters,[['user_id','account-a'],['user_id','account-a']]);
  h.pending[0].resolve({data:[{track_id:'avukat'}]});h.pending[1].resolve({data:[]});await flush();
  assert.equal(h.render().trackId,'avukat');
  h.account(null);assert.equal(h.render(),null);h.unmount();assert.equal(h.listeners.size,0);
});
test('late responses after cleanup cannot reveal another account recommendation',async()=>{
  const h=harness();h.render();h.mount();h.unmount();h.account('account-b');
  h.pending[0].resolve({data:[{track_id:'avukat'}]});h.pending[1].resolve({data:[]});await flush();
  assert.equal(h.render(),null);
});
test('a newer refresh wins and query errors hide recommendations',async()=>{
  const h=harness();h.render();h.mount();h.listeners.get('sah:activity-changed')();
  h.pending[2].resolve({data:[],error:{message:'unavailable'}});h.pending[3].resolve({data:[]});await flush();
  h.pending[0].resolve({data:[{track_id:'avukat'}]});h.pending[1].resolve({data:[]});await flush();
  assert.equal(h.render(),null);h.unmount();
});
