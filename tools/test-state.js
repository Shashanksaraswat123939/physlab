// Is anything fixed that should not be? And does a table survive a reload, a
// tampered save file, and a switch between experiments?
const A=require('./harness.js');
let fail=0; const bad=m=>{ if(fail<12) console.log('  FAIL '+m); fail++; };
const IDS=['v1','v2','s1','s2','pg'];

console.log('1. every specimen and every zero error is drawn, not fixed');
IDS.forEach(id=>{
  const sig=new Set(), zs=new Set();
  for(let k=0;k<400;k++){
    const st=A.freshState(A.EXP[id],(k*2246822519+13)>>>0);
    sig.add(JSON.stringify(st.sp.dims||st.sp.R));
    if(st.sp.zeroTicks!==undefined) zs.add(st.sp.zeroTicks);
  }
  if(sig.size<40) bad(id+': only '+sig.size+' distinct specimens in 400 draws');
  const zn=(A.EXP[id].instrument==='gravesand')?0:zs.size;
  if(A.EXP[id].instrument!=='gravesand'&&zn<5) bad(id+': only '+zn+' distinct zero errors');
  console.log('   '+id.padEnd(3)+' '+String(sig.size).padStart(3)+' distinct specimens'
    +(zn?', '+zn+' distinct zero errors':''));
});

console.log('2. the true value is the specimen, worked out afresh each time');
const indep={
  v1:sp=>sp.dims.l/100*(sp.dims.b/100)*(sp.dims.h/100),
  v2:sp=>4/3*Math.PI*Math.pow(sp.dims.d/200,3),
  s1:sp=>Math.PI*Math.pow(sp.dims.d/2000,2)*sp.lengthCM,
  s2:sp=>sp.dims.t/100/sp.sheets,
  pg:sp=>sp.R
};
IDS.forEach(id=>{
  for(let k=0;k<200;k++){
    const st=A.freshState(A.EXP[id],(k*97+5)>>>0);
    const got=A.EXP[id].trueResult(st.sp).value, want=indep[id](st.sp);
    if(Math.abs(got-want)>Math.abs(want)*1e-9+1e-12) bad(id+': trueResult '+got+' but the specimen says '+want);
  }
});
console.log('   all five agree with an independent recomputation');

console.log('3. a table survives a save and a reload');
A.setExp('v1');
const s=A.S.v1;
s.rows.l=[{t:345,msr:'3.40',vsr:'5'},{t:346,msr:'3.40',vsr:'6'}];
s.zeroTyped='2'; s.lcTyped='0.1';
const specBefore=JSON.stringify(s.sp);
A.save();
Object.keys(A.S).forEach(k=>delete A.S[k]);
A.load();
const back=A.S.v1;
if(!back) bad('nothing came back from the saved state');
else {
  if(JSON.stringify(back.sp)!==specBefore) bad('the specimen changed across a reload');
  if(back.rows.l.length!==2) bad('the readings did not come back ('+back.rows.l.length+' rows)');
  if(back.zeroTyped!=='2'||back.lcTyped!=='0.1') bad('the least count or zero error did not come back');
  else console.log('   specimen, readings, least count and zero error all came back');
}

console.log('4. a tampered save file is refused, not obeyed');
const poison=[
  '{"mode":"<script>","theme":"evil","cols":{"L":"99px;background:red","R":null},"expId":"../../etc","states":1}',
  '{"states":{"v1":{"rows":{"l":[[[[1]]]]},"sp":null,"scale":"BIG","wP":[999,-1,"a"]}}}',
  '{"v":1,"lens":"yes","folded":{"L":{}},"step":-9999,"rough":12345}',
  'not json at all', '[]', 'null'
];
poison.forEach((raw,i)=>{
  A.__store['physlab']=raw;
  Object.keys(A.S).forEach(k=>delete A.S[k]);
  let threw=null;
  try{ A.load(); }catch(e){ threw=e.message; }
  if(threw) bad('poison '+i+' threw: '+threw);
  const m=A.mode(), t=A.theme(), c=A.cols();
  if(m!=='learn'&&m!=='test') bad('poison '+i+' left mode as '+JSON.stringify(m));
  if(t!=='light'&&t!=='dark') bad('poison '+i+' left theme as '+JSON.stringify(t));
  if(typeof c.L!=='number'||typeof c.R!=='number') bad('poison '+i+' left cols as '+JSON.stringify(c));
  const v=A.ensure('v1');
  if(!v||!v.sp||!v.rows||!Array.isArray(v.rows.l)) bad('poison '+i+' left an unusable experiment');
  if(A.EXP[A.getExpId()]===undefined) bad('poison '+i+' left expId as '+A.getExpId());
});
console.log('   '+poison.length+' tampered save files, all rejected with safe defaults');

console.log('5. the parallelogram never trusts a weight that is not in the box');
A.__store['physlab']='{"states":{"pg":{"wP":[50,7,"x",1e9],"wQ":[20],"scale":999,"view":"hack","tool":"eval"}}}';
Object.keys(A.S).forEach(k=>delete A.S[k]);
A.load();
const g=A.ensure('pg');
if(g.wP.some(x=>A.WEIGHTS.indexOf(x)<0)) bad('a weight not in the box got through: '+JSON.stringify(g.wP));
if(A.SCALES.indexOf(g.scale)<0) bad('a bad scale got through: '+g.scale);
if(g.view!=='board'&&g.view!=='paper') bad('a bad view got through: '+g.view);
if(['line','free','erase'].indexOf(g.tool)<0) bad('a bad tool got through: '+g.tool);
console.log('   weights, scale, view and tool all filtered to known values');

console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
