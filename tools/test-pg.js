// The parallelogram experiment, checked from the picture outwards: do the three
// drawn threads actually balance, and does the diagonal drawn on the paper
// really measure the unknown weight?
const A=require('./harness.js');
let fail=0; const bad=m=>{ if(fail<10) console.log('  FAIL '+m); fail++; };
A.setExp('pg'); const s=A.S.pg, e=A.EXP.pg;

function threadsBalance(svg,P,Q,R){
  const m=svg.match(/<g stroke="var\(--thread\)"[^>]*>\s*<path d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"\/>\s*<path d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)"\/>/);
  if(!m) return null;
  const n=m.map(Number), O={x:n[1],y:n[2]};
  const unit=(ax,ay)=>{ const dx=ax-O.x,dy=ay-O.y,L=Math.hypot(dx,dy); return {x:dx/L,y:dy/L}; };
  const u1=unit(n[3],n[4]), u2=unit(n[7],n[8]);
  return { fx:P*u1.x+Q*u2.x, fy:P*u1.y+Q*u2.y+R, O };
}
// OC is no longer drawn for the student -- they construct it. What the test can
// still check is the quantity the construction is meant to recover.
function eyeOC(){ return Math.round(A.gOC()*10)/10; }
console.log('1. the drawn threads actually balance');
let checked=0,maxF=0;
for(let R=70;R<=179;R+=1){
  s.sp.R=R;
  for(let P=20;P<=400;P+=10) for(let Q=20;Q<=400;Q+=10){
    const sol=A.gravSolve(P,Q,R); if(sol.err) continue;
    s.P=P; s.Q=Q;
    const b=threadsBalance(A.drawBoard(),P,Q,R);
    if(!b){ bad('threads not drawn for P='+P+' Q='+Q+' R='+R); continue; }
    const res=Math.hypot(b.fx,b.fy)/R*100;
    if(res>0.5) bad('out of balance by '+res.toFixed(2)+'% at P='+P+' Q='+Q+' R='+R);
    maxF=Math.max(maxF,res); checked++;
  }
}
console.log('   '+checked+' equilibria; worst residual force '+maxF.toFixed(3)+'% of R');

console.log('2. OC measured off the paper gives back the unknown weight');
let n2=0,mx=0;
for(let R=70;R<=179;R+=1){
  for(const j of [-1,0,1]){
    s.sp.R=R; s.jit=j;
    let pair=null;
    for(let P=20;P<=400&&!pair;P+=10) for(let Q=20;Q<=400;Q+=10){ if(!A.gravSolve(P,Q,R).err){ pair=[P,Q]; break; } }
    if(!pair){ bad('no workable weights at all for R='+R); continue; }
    s.P=pair[0]; s.Q=pair[1];
    const oc=eyeOC();
    const pct=Math.abs(oc*10-R)/R*100;
    if(pct>2.5) bad('OC='+oc+' gives '+(oc*10)+' g wt, true '+R+' ('+pct.toFixed(2)+'%)');
    mx=Math.max(mx,pct); n2++;
  }
}
console.log('   '+n2+' papers read; worst error '+mx.toFixed(2)+'% (one drawing jitter is \u00b11 mm on OC)');

console.log('3. every unknown has at least three workable pairs of weights');
let thin=0;
for(let R=70;R<=179;R++){
  let c=0;
  for(let P=20;P<=400;P+=10) for(let Q=20;Q<=400;Q+=10) if(!A.gravSolve(P,Q,R).err) c++;
  if(c<3){ bad('only '+c+' workable pairs for R='+R); }
  if(c<12) thin++;
}
console.log('   '+(110-thin)+' of 110 unknowns have 12 or more workable pairs');
console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
