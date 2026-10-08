const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const e=require('../src/lib/quranExercises.ts'),l=require('../src/lib/quranLearning.ts'),s=require('../src/lib/quranSurahs.ts');
test('question bank has verified references, unique choices and minimum sizes',()=>{
 assert.ok(e.COMPLETION_QUESTIONS.length>=50);assert.ok(e.TAJWEED_QUESTIONS.length>=30);assert.equal(e.ARABIC_LETTERS.length,28);
 for(const q of e.COMPLETION_QUESTIONS){const v=e.ORDERING_SURAHS.find(s=>s.surahId===q.surahId).verses.find(v=>v.id===q.ayah);assert.equal(q.start+' '+q.answer,v.text);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));}
 for(const q of e.TAJWEED_QUESTIONS){assert.equal(q.surahId,0);assert.ok(s.TAJWEED_RULES.some(r=>r.id===q.rule));assert.ok(q.explanation.length>30);}
 for(const d of [1,2,3])for(const bank of [e.COMPLETION_QUESTIONS,e.TAJWEED_QUESTIONS,e.MEANING_QUESTIONS])assert.equal(e.pickQuestions(bank,8,d).length,8);
});
test('30 juz partitions cover every ayah exactly once including cross-juz surahs',()=>{
 const all=Array.from({length:30},(_,i)=>l.juzSegments(i+1)).flatMap(segments=>segments.flatMap(({surah,start,end})=>Array.from({length:end-start+1},(_,i)=>surah.id+':'+(start+i))));
 assert.equal(all.length,s.SURAHS.reduce((n,s)=>n+s.ayahCount,0));assert.equal(new Set(all).size,all.length);
 assert.deepEqual(l.juzSegments(2).map(x=>[x.surah.id,x.start,x.end]),[[2,142,252]]);
 assert.deepEqual(l.juzSegments(3).map(x=>[x.surah.id,x.start,x.end]),[[2,253,286],[3,1,92]]);
 assert.deepEqual(l.juzSegments(22).map(x=>[x.surah.id,x.start,x.end]),[[33,31,73],[34,1,54],[35,1,45],[36,1,27]]);
 assert.equal(l.juzSegments(25)[0].surah.id,41);assert.equal(l.juzSegments(25)[0].start,47);
});
test('fresh users have zero fabricated progress; streak is idempotent and freeze earned/consumed',()=>{
 assert.equal(l.emptyProgress().filter(p=>p.completedAyahs>0).length,0);
 let streak=l.emptyStreak();for(let day=1;day<=7;day++)streak=l.nextStreak(streak,'2026-10-'+String(day).padStart(2,'0'));
 assert.equal(streak.current,7);assert.equal(streak.freezeAvailable,true);assert.deepEqual(l.nextStreak(streak,'2026-10-07'),streak);
 streak=l.nextStreak(streak,'2026-10-09');assert.equal(streak.current,8);assert.equal(streak.freezeAvailable,false);
 assert.equal(l.nextStreak(streak,'2026-10-12').current,1);
 assert.equal(l.quranToday(new Date('2026-10-06T22:00:00Z')),'2026-10-07');
});
test('spaced repetition uses 1/3/7/21/60 days and preserves item identity',()=>{
 const item={id:'a',surahId:1,startAyah:2,endAyah:2,intervalIndex:0,reviewCount:0,nextReviewDate:'2026-10-07',lastReviewDate:'',easeFactor:2.5};
 assert.equal(l.scheduleReview(item,'hard','2026-10-07').nextReviewDate,'2026-10-08');
 assert.equal(l.scheduleReview(item,'good','2026-10-07').nextReviewDate,'2026-10-10');
 assert.equal(l.scheduleReview(item,'easy','2026-10-07').nextReviewDate,'2026-10-14');
 assert.equal(l.scheduleReview({...item,intervalIndex:4},'easy','2026-10-07').intervalIndex,4);
});
test('weekly summary counts unique referenced verses and respects Istanbul midnight',()=>{
 const result={id:'a',type:'completion',score:1,totalQuestions:8,timeSpentSeconds:120,completedAt:'2026-10-07T21:01:00Z',answers:[{surahId:1,ayah:1},{surahId:1,ayah:1}]};
 assert.equal(l.summarizePractice([result],'2026-10-07').totalAyahs,0);
 assert.equal(l.summarizePractice([result],'2026-10-08').totalAyahs,1);
 assert.equal(l.summarizePractice([result],'2026-10-08').totalMinutes,2);
});
