// The calliper has three measuring faces and they do not behave alike: the outer
// jaws close on to a thing, the inner jaws open into a bore, and the depth rod
// runs down a hole. Each has to stop in the right place, from the right side, and
// the depth rod has a zero of its own.
const A=require('./harness.js');
let fail=0; const bad=m=>{ if(fail<12) console.log('  FAIL '+m); fail++; };
const xs=d=>[...d.matchAll(/M(-?[\d.]+) /g)].map(m=>+m[1]);
const RE_MAIN=/<g stroke="var\(--scale-tick\)"[^>]*><path d="([^"]*)"/;
const RE_VERN=/<g stroke="var\(--vern-ink\)"[^>]*><path d="([^"]*)"/;
const grp=(s,re)=>{ const m=s.match(re); return m?xs(m[1]):[]; };
function eye(svg){                                   // read the drawn scale back
  const main=grp(svg,RE_MAIN), vern=grp(svg,RE_VERN);
  const lab=[...svg.matchAll(/<text x="([\d.]+)" y="26" text-anchor="middle">([\d.]+) cm<\/text>/g)]
    .map(m=>({x:+m[1],mm:+m[2]*10}));
  if(!lab.length||main.length<2||vern.length!==11) return null;
  const u=(main[main.length-1]-main[0])/(main.length-1), ref=lab[0];
  let vsr=0,bd=Infinity;
  vern.forEach((x,k)=>{ const d=Math.min(...main.map(t=>Math.abs(t-x))); if(d<bd){bd=d;vsr=k;} });
  let msx=null; main.forEach(x=>{ if(x<=vern[0]+1e-6&&(msx===null||x>msx)) msx=x; });
  return {msrMM:msx===null?null:Math.round(ref.mm+(msx-ref.x)/u),vsr};
}
const FACES=[['l','outer'],['b','outer'],['h','outer'],['id','inner'],['dp','depth']];

console.log('1. each face stops where its specimen is, and from the right side');
let n=0;
for(let k=0;k<400;k++){
  A.S.v1=A.freshState(A.EXP.v1,(k*2654435761+29)>>>0); A.setExp('v1');
  const s=A.S.v1;
  FACES.forEach(([key,want])=>{
    if(A.faceOf(key)!==want) bad(key+' should use the '+want+' face, uses '+A.faceOf(key));
    A.setHeld(key);
    if(A.curFace()!==want) bad('selecting '+key+' did not switch to the '+want+' face');
    const z=(want==='depth')?s.sp.depthZeroTicks:s.sp.zeroTicks;
    const at=s.sp.dims[key]+z+s.jit;
    if(!A.gripped()) bad(key+': seating it did not reach the specimen');
    if(s.ticks!==at) bad(key+': seated at '+s.ticks+', the specimen is at '+at);
    const b=A.bounds();
    if(want==='outer'){
      if(b.dir!=='min') bad('the outer jaws should be bounded from below');
      A.setTicks(at-50);                              // try to squeeze past the block
      if(s.ticks!==at) bad('the outer jaws closed through the block to '+s.ticks);
      A.setTicks(at+50);                              // opening is free
      if(s.ticks!==at+50) bad('the outer jaws would not open');
    } else {
      if(b.dir!=='max') bad('the '+want+' face should be bounded from above');
      A.setTicks(at+50);                              // try to push past the wall / bottom
      if(s.ticks!==at) bad('the '+want+' face went past the specimen to '+s.ticks);
      A.setTicks(at-50);                              // coming back is free
      if(s.ticks!==at-50) bad('the '+want+' face would not come back');
    }
    n++;
  });
}
console.log('   '+n+' seatings across the three faces');

console.log('2. the scale drawn for each face reads back as the reading');
let m=0;
for(let k=0;k<150;k++){
  A.S.v1=A.freshState(A.EXP.v1,(k*40503+7)>>>0); A.setExp('v1');
  const s=A.S.v1;
  FACES.forEach(([key])=>{
    A.setHeld(key); A.seat();
    const got=eye(A.magVernier()); if(!got){ bad('the magnified scale was unreadable for '+key); return; }
    const want=A.VERNIER.read(s.ticks);
    if(s.ticks>=0&&got.msrMM!==want.msrMM) bad(key+': M.S.R. drawn '+got.msrMM+', want '+want.msrMM);
    if(got.vsr!==want.vsr) bad(key+': V.S.R. drawn '+got.vsr+', want '+want.vsr);
    m++;
  });
}
console.log('   '+m+' drawings read back');

console.log('3. the depth rod keeps its own zero, found at its own home');
let differ=0;
for(let k=0;k<400;k++){
  A.S.v1=A.freshState(A.EXP.v1,(k*97+3)>>>0); A.setExp('v1');
  const s=A.S.v1;
  if(s.sp.depthZeroTicks!==s.sp.zeroTicks) differ++;
  A.setFace('depth'); A.setHeld(null); A.seat();
  if(s.ticks!==s.sp.depthZeroTicks) bad('the rod at home reads '+s.ticks+', its zero is '+s.sp.depthZeroTicks);
  A.setFace('outer'); A.setHeld(null); A.seat();
  if(s.ticks!==s.sp.zeroTicks) bad('the jaws closed read '+s.ticks+', their zero is '+s.sp.zeroTicks);
}
if(differ<200) bad('the two zero errors are nearly always the same ('+differ+'/400 differ) — one of them is not being drawn');
console.log('   the two zeros differ in '+differ+' of 400 specimens, and each is read at its own home');

console.log('4. the hollow cylinder stays out of the record');
const rec=A.EXP.v1.targets.filter(t=>!t.practice).map(t=>t.key).join(',');
if(rec!=='l,b,h') bad('the record\u2019s tables are '+rec+', expected l,b,h');
const d=A.rowsDone(A.EXP.v1,A.S.v1);
if(d.t!==15) bad('the progress count expects '+d.t+' readings, the record asks for 15');
console.log('   the record is still length, breadth and height: '+d.t+' readings');

console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
