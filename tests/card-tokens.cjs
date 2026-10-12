const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('src/app/_card-tokens.css','utf8');
const luminance=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
test('shared muted card text meets AA in both themes',()=>{
  const foregrounds=[...css.matchAll(/--text-muted: (#[\da-f]{6})/g)].map(m=>m[1]);
  assert.equal(foregrounds.length,2);
  for(const [i,bg] of ['#ffffff','#141b2f'].entries()) {
    const a=luminance(foregrounds[i]),b=luminance(bg);
    assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5);
  }
});
test('journey card styles share color declarations rather than duplicating them',()=>{
  for(const file of ['weekly-summary','daily-challenge','milestone-timeline','category-progress','activity-calendar'])
    assert.doesNotMatch(fs.readFileSync(`src/app/${file}.css`,'utf8'),/--(?:card-bg|card-border|text-primary|text-secondary|text-muted):/);
});
