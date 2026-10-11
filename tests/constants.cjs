const {test}=require('node:test');
const assert=require('node:assert/strict');
const {LEVELS,getLevelForXP,getDepotTier}=require('./helpers/load-typescript.cjs')('src/lib/constants.ts');
test('every XP threshold selects the right level and next level',()=>{
  LEVELS.forEach((level,index)=>{
    assert.deepEqual(getLevelForXP(level.xp),{level,index,nextLevel:LEVELS[index+1]??null});
    if(index) assert.equal(getLevelForXP(level.xp-1).index,index-1);
  });
  assert.equal(getLevelForXP(-1).index,0);
  assert.equal(getLevelForXP(1e9).nextLevel,null);
});
test('depot tiers handle all boundary pairs',()=>{
  for(const [xp,tier] of [[-1,1],[0,1],[499,1],[500,2],[1999,2],[2000,3],[6999,3],[7000,4],[1e9,4]]) assert.equal(getDepotTier(xp),tier);
});
