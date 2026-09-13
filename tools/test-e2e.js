// Drive each experiment the way a student would: close the instrument, read the
// drawn scale, write the numbers down, take the mean, apply the zero correction.
// Nothing here uses the app's idea of the right answer until the final compare.
const A=require('./harness.js');
const xs=d=>[...d.matchAll(/M(-?[\d.]+) /g)].map(m=>+m[1]);
const RE_MAIN=/<g stroke="var\(--scale-tick\)"[^>]*><path d="([^"]*)"/;
const RE_VERN=/<g stroke="var\(--vern-ink\)"[^>]*><path d="([^"]*)"/;
const grp=(s,re)=>{ const m=s.match(re); return m?xs(m[1]):[]; };
function eyeVernier(svg){
  const main=grp(svg,RE_MAIN), vern=grp(svg,RE_VERN);
  const lab=[...svg.matchAll(/<text x="([\d.]+)" y="26" text-anchor="middle">([\d.]+) cm<\/text>/g)].map(m=>({x:+m[1],mm:+m[2]*10}));
  const u=(main[main.length-1]-main[0])/(main.length-1), ref=lab[0];
  let vsr=0,bd=Infinity;
  vern.forEach((x,k)=>{ const d=Math.min(...main.map(t=>Math.abs(t-x))); if(d<bd){bd=d;vsr=k;} });
  let msx=null; main.forEach(x=>{ if(x<=vern[0]+1e-6&&(msx===null||x>msx)) msx=x; });
  const msrMM=msx===null?null:Math.round(ref.mm+(msx-ref.x)/u);
  const leftOfZero=(main.length&&vern[0]<main[0]-1e-6);
  return {msrMM,vsr,leftOfZero};
}
function eyeScrew(svg){
  const sleeve=[...svg.matchAll(/<text x="([\d.]+)" y="92" text-anchor="middle">(\d+)<\/text>/g)].map(m=>({x:+m[1],mm:+m[2]}));
  // marks the thimble covers are not drawn at all, so what is there is what is read
  const L=[...svg.matchAll(/<text x="836" y="([\d.]+)">(\d\d)<\/text>/g)].map(m=>({y:+m[1],v:+m[2]}))[0];
  return { psrMM:sleeve.length?Math.max(...sleeve.map(x=>x.mm)):0,

           csr:((L.v-Math.round((L.y-7-150)/30))%100+100)%100 };
}
function runOne(id,seed){
  A.S[id]=A.freshState(A.EXP[id],seed); A.setExp(id);
  const e=A.EXP[id], s=A.S[id], vern=(e.instrument==='vernier');
  // 1. the zero error, read off the closed instrument
  A.setFace('outer'); A.setHeld(null); A.seat();
  let ze;
  if(vern){ const z=eyeVernier(A.magVernier()); ze=z.leftOfZero?z.vsr-10:z.vsr; }
  else { const z=eyeScrew(A.magScrew()); ze=z.csr<=50?z.csr:z.csr-100; }
  s.zeroTyped=String(ze); s.zcTyped=String(-ze); s.lcTyped=String(A.INSTR[e.instrument].lcMM);
  // 2. fill the record's tables, a row at a time; the instrument moves on with them
  A.recTargets(e).forEach(tg=>{
    for(let i=0;i<A.nRows(e);i++){
      A.setHeld(tg.key); A.seat();
      if(A.activeRow(tg.key)!==i) return {err:'the instrument is on row '+A.activeRow(tg.key)+', not '+i};
      // the student does every sum in the row: total, then the zero correction
      const row=s.rows[tg.key][i];
      let tot;
      if(vern){ const r=eyeVernier(A.magVernier());
        row.msr=(r.msrMM/10).toFixed(2); row.vsr=String(r.vsr);
        tot=r.msrMM/10+r.vsr*0.01; }
      else { const r=eyeScrew(A.magScrew());
        row.psr=String(r.psrMM); row.csr=String(r.csr);
        tot=r.psrMM+r.csr*0.01; }
      row.tot=tot.toFixed(2);
      row.cor=(tot+(-ze)*0.01).toFixed(2);
    }
  });
  const got=A.studentResult(); if(got.err) return {err:got.err};
  const want=A.EXP[id].trueResult(s.sp);
  return {zeOK:ze===s.sp.zeroTicks, err:null, pct:Math.abs(got.R.value-want.value)/want.value*100};
}
let fail=0,worst={};
for(const id of ['v1','v2','s1','s2']){
  let mx=0,sum=0,n=0;
  for(let k=0;k<300;k++){
    const r=runOne(id,(k*2654435761+7)>>>0);
    if(r.err){ if(fail<5) console.log('  FAIL '+id+': '+r.err); fail++; continue; }
    if(!r.zeOK){ if(fail<5) console.log('  FAIL '+id+' seed '+k+': zero error misread'); fail++; }
    if(r.pct>5){ if(fail<5) console.log('  FAIL '+id+' seed '+k+': '+r.pct.toFixed(2)+'% off'); fail++; }
    mx=Math.max(mx,r.pct); sum+=r.pct; n++;
  }
  worst[id]={max:mx.toFixed(2),mean:(sum/n).toFixed(2)};
  console.log('  '+A.EXP[id].title.padEnd(24)+' 300 runs  mean error '+(sum/n).toFixed(2)+'%  worst '+mx.toFixed(2)+'%');
}
console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean — reading the scale correctly gives the right answer every time');
process.exit(fail?1:0);
