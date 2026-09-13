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
  if(back.rows.l[0].msr!=='3.40'||back.rows.l[1].vsr!=='6') bad('the readings did not come back');
  if(back.rows.l.length!==5) bad('the table came back with '+back.rows.l.length+' rows, not the record’s five');
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

console.log('6. an unknown you never touched is drawn again; work in progress is not');
const proto=A.freshState(A.EXP.v1,424242);
const frozen=JSON.parse(JSON.stringify(proto.sp));
const payload=(rows,typed)=>JSON.stringify({v:1,mode:'learn',theme:'light',expId:'v1',
  states:{v1:{seed:424242,sp:frozen,rows:rows,zeroTyped:typed||'',lcTyped:'',depthZeroTyped:''}}});
const empty={l:[],b:[],h:[],id:[],dp:[]};

const zs=new Set(), dzs=new Set(), dims=new Set();
for(let i=0;i<300;i++){
  A.__store['physlab']=payload(empty);
  Object.keys(A.S).forEach(k=>delete A.S[k]);
  A.load();
  const v=A.ensure('v1');
  zs.add(v.sp.zeroTicks); dzs.add(v.sp.depthZeroTicks); dims.add(v.sp.dims.l);
}
if(zs.size<5) bad('an untouched experiment gave only '+zs.size+' distinct zero errors over 300 visits');
if(dzs.size<5) bad('the depth rod zero was drawn only '+dzs.size+' ways over 300 visits');
if(dims.size<40) bad('the specimen itself was redrawn only '+dims.size+' ways');
console.log('   never started: '+zs.size+' distinct zero errors, '+dzs.size+' depth-rod zeros, '+dims.size+' specimens in 300 visits');

let same=0;
for(let i=0;i<50;i++){
  A.__store['physlab']=payload({l:[{t:frozen.dims.l+frozen.zeroTicks,msr:'3.40',vsr:'5'}],b:[],h:[],id:[],dp:[]},'2');
  Object.keys(A.S).forEach(k=>delete A.S[k]);
  A.load();
  const v=A.ensure('v1');
  if(JSON.stringify(v.sp)===JSON.stringify(frozen)) same++;
  if(!v.rows.l[0]||v.rows.l[0].msr!=='3.40') bad('a recorded reading was lost on reload');
  if(v.zeroTyped!=='2') bad('the typed zero error was lost on reload');
}
if(same!==50) bad('an experiment with a reading in it was redrawn '+(50-same)+' times out of 50');
console.log('   started: the specimen, the reading and the typed zero error came back all 50 times');

A.__store['physlab']=payload(empty,'-3');
Object.keys(A.S).forEach(k=>delete A.S[k]);
A.load();
if(JSON.stringify(A.ensure('v1').sp)!==JSON.stringify(frozen))
  bad('writing the zero error down was not enough to hold on to the specimen');
console.log('   writing the zero error down alone is enough to hold the specimen');

console.log('7. a table full of blank rows is not work');
const e1=A.EXP.v1;
const blank=JSON.stringify({v:1,expId:'v1',states:{v1:{seed:777,sp:frozen,
  rows:{l:[{},{},{},{},{}],b:[{},{},{},{},{}],h:[{},{},{},{},{}],id:[],dp:[]},zeroTyped:'',lcTyped:''}}});
const zs2=new Set();
for(let i=0;i<200;i++){
  A.__store['physlab']=blank;
  Object.keys(A.S).forEach(k=>delete A.S[k]);
  A.load(); zs2.add(A.ensure('v1').sp.zeroTicks);
}
if(zs2.size<5) bad('blank rows were mistaken for work: only '+zs2.size+' zero errors in 200 visits');
// one figure written into one cell is enough to hold on to it
const oneCell=JSON.stringify({v:1,expId:'v1',states:{v1:{seed:777,sp:frozen,
  rows:{l:[{msr:'3.40'},{},{},{},{}],b:[{},{},{},{},{}],h:[{},{},{},{},{}],id:[],dp:[]},zeroTyped:'',lcTyped:''}}});
A.__store['physlab']=oneCell;
Object.keys(A.S).forEach(k=>delete A.S[k]);
A.load();
if(JSON.stringify(A.ensure('v1').sp)!==JSON.stringify(frozen)) bad('one written cell was not enough to hold the specimen');
console.log('   blank rows redraw the unknown ('+zs2.size+' zero errors in 200 visits); one written cell holds it');

console.log('8. the picture on the wall goes down and comes back');
A.__store['physlab']='{"v":1}';
A.setFrame(true); A.load();
if(A.getFrame()!==true) bad('the picture was not on the wall to begin with');
A.setFrame(false); A.save();
A.setFrame(true); A.load();
if(A.getFrame()!==false) bad('the picture came back up after a reload');
A.setFrame(true); A.save();
A.setFrame(false); A.load();
if(A.getFrame()!==true) bad('the picture did not stay up after a reload');
console.log('   down stays down, up stays up, across a save and a reload');

['{"frame":"yes"}','{"frame":1}','{"frame":null}','{"frame":{}}','{"frame":[]}'].forEach((raw,i)=>{
  A.__store['physlab']=raw;
  A.setFrame(true);
  let threw=null;
  try{ A.load(); }catch(e){ threw=e.message; }
  if(threw) bad('frame poison '+i+' threw: '+threw);
  if(typeof A.getFrame()!=='boolean') bad('frame poison '+i+' left it as '+JSON.stringify(A.getFrame()));
});
console.log('   5 tampered flags ignored, the flag stays a boolean');

A.setFrame(false); A.applyFrame();
A.setExp('v1');
if(!A.ensure('v1').sp) bad('the bench was unusable with the picture down');
A.resetAll();
if(A.getFrame()!==true) bad('reset did not put the picture back on the wall');
console.log('   reset hangs it again');

console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
