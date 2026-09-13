// Read the instrument back out of its own SVG, exactly as a student's eye would:
// find the tick that coincides, count millimetres from a numbered mark. If the
// drawing and the arithmetic ever disagree, this is where it shows.
const A=require('./harness.js');
let fail=0; const bad=(m)=>{ if(fail<12) console.log('  FAIL '+m); fail++; };

const xs=d=>[...d.matchAll(/M(-?[\d.]+) /g)].map(m=>+m[1]);
const RE_MAIN=/<g stroke="var\(--scale-tick\)"[^>]*><path d="([^"]*)"/;
const RE_VERN=/<g stroke="var\(--vern-ink\)"[^>]*><path d="([^"]*)"/;
function grp(svg,re){ const m=svg.match(re); return m?xs(m[1]):[]; }
function readVernierSVG(svg){
  const main=grp(svg,RE_MAIN), vern=grp(svg,RE_VERN);
  const labels=[...svg.matchAll(/<text x="([\d.]+)" y="26" text-anchor="middle">([\d.]+) cm<\/text>/g)]
    .map(m=>({x:+m[1],mm:+m[2]*10}));
  if(!labels.length||!main.length||vern.length!==11) return null;
  // millimetres per unit, from the spacing of consecutive main ticks
  const u=(main[main.length-1]-main[0])/(main.length-1);
  const ref=labels[0];
  const mmAt=x=>ref.mm+(x-ref.x)/u;
  const v0=vern[0];
  // M.S.R.: the main mark at or just before the vernier zero
  let msr=null;
  main.forEach(x=>{ if(x<=v0+1e-6&&(msr===null||x>msr)) msr=x; });
  // V.S.R.: the vernier division sitting on a main mark
  let best=0,bd=Infinity,second=Infinity;
  vern.forEach((x,k)=>{ const d=Math.min(...main.map(t=>Math.abs(t-x)));
    if(d<bd){ second=bd; bd=d; best=k; } else if(d<second) second=d; });
  return {msrMM:Math.round(mmAt(msr)),vsr:best,gap:bd,margin:second-bd,u};
}
function readScrewSVG(svg){
  const sleeve=[...svg.matchAll(/<text x="([\d.]+)" y="92" text-anchor="middle">(\d+)<\/text>/g)].map(m=>({x:+m[1],mm:+m[2]}));
  // the sleeve marks are pre-clipped now: whatever is drawn is what is uncovered
  const labs=[...svg.matchAll(/<text x="836" y="([\d.]+)">(\d\d)<\/text>/g)].map(m=>({y:+m[1],v:+m[2]}));
  if(!labs.length) return null;
  const psr=sleeve.length?Math.max(...sleeve.map(x=>x.mm)):0;

  const L=labs[0];                              // csr = label - (its offset from the datum)/30
  const csr=((L.v-Math.round((L.y-7-150)/30))%100+100)%100;
  return {psrMM:psr,csr};
}

console.log('1. read() is exact over the whole travel, negatives included');
for(let t=-60;t<=1500;t++){ const r=A.VERNIER.read(t);
  if(Math.abs((r.msrMM+r.vsr*0.1)-t*0.1)>1e-9) bad('vernier '+t);
  if(r.vsr<0||r.vsr>9) bad('vernier vsr out of range at '+t); }
for(let t=-60;t<=2500;t++){ const r=A.SCREW.read(t);
  if(Math.abs((r.psrMM+r.csr*0.01)-t*0.01)>1e-9) bad('screw '+t);
  if(r.csr<0||r.csr>99) bad('screw csr out of range at '+t); }

console.log('2. the drawing agrees with the arithmetic — vernier');
A.setExp('v1');
let minMargin=Infinity,n=0;
for(let t=-3;t<=1400;t+=1){
  A.S.v1.ticks=t;
  const got=readVernierSVG(A.magVernier()); if(!got){ bad('unparsable svg at '+t); continue; }
  const want=A.VERNIER.read(t);
  // Below zero there is no main scale to read an M.S.R. off -- a negative zero
  // error is read as a division count, exactly as the record has it.
  if(t>=0&&got.msrMM!==want.msrMM) bad('MSR drawn '+got.msrMM+' want '+want.msrMM+' at t='+t);
  if(got.vsr!==want.vsr) bad('VSR drawn '+got.vsr+' want '+want.vsr+' at t='+t);
  if(got.gap>0.05) bad('coincidence is not exact at t='+t+' (gap '+got.gap.toFixed(3)+' units)');
  // When the vernier zero coincides, so does its tenth mark -- 10 V.S.D. are 9
  // M.S.D., so that pair is genuinely ambiguous on a real instrument too, and
  // both readings give the same answer. Every other position must be unambiguous.
  if(want.vsr!==0) minMargin=Math.min(minMargin,got.margin);
  n++;
}
console.log('   '+n+' positions; the coinciding line is at least '+minMargin.toFixed(1)+' svg units clear of its neighbours');

console.log('3. the drawing agrees with the arithmetic — screw gauge');
A.setExp('s1'); n=0;
for(let t=-5;t<=2400;t+=1){
  A.S.s1.ticks=t;
  const got=readScrewSVG(A.magScrew()); if(!got){ bad('unparsable screw svg at '+t); continue; }
  const want=A.SCREW.read(t);
  if(got.csr!==want.csr) bad('CSR drawn '+got.csr+' want '+want.csr+' at t='+t);
  if(t>=0&&got.psrMM!==want.psrMM) bad('PSR drawn '+got.psrMM+' want '+want.psrMM+' at t='+t);
  n++;
}
console.log('   '+n+' positions checked');
console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
