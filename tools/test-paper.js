// Construct the parallelogram the way a student would with the pencil: drag from
// O along each marked direction, run the two parallels past where they meet, then
// draw the diagonal. The diagonal is never handed over -- it falls out of the
// intersection of their own two lines. It must come back as the unknown weight.
const A=require('./harness.js');
let fail=0; const bad=m=>{ if(fail<10) console.log('  FAIL '+m); fail++; };
A.setExp('pg'); const s=A.S.pg;
const jitter=()=>(Math.random()-0.5)*0.5;          // a hand that is not quite steady
// A student who watches the length readout and nudges until it is right, which
// is what the live readout is there for.
function draw(a,b,want){
  let best=null,bd=Infinity;
  for(let k=0;k<8;k++){
    const j=(k?0.5/(k+1):1);
    const p=A.snapPoint([a[0]+jitter()*j,a[1]+jitter()*j]);
    const q=A.snapEnd(p,[b[0]+jitter()*j,b[1]+jitter()*j]);
    const off=Math.hypot(p[0]-a[0],p[1]-a[1])
      +(want?Math.abs(Math.hypot(q[0]-p[0],q[1]-p[1])-want):Math.hypot(q[0]-b[0],q[1]-b[1]));
    if(off<bd){ bd=off; best={p,q}; }
    if(off<0.06) break;
  }
  s.paper.strokes.push({t:'l',a:best.p,b:best.q}); return best;
}

let n=0,worst=0,worstMsg='';
for(let trial=0;trial<600;trial++){
  const R=70+Math.floor(Math.random()*110);
  s.sp.R=R;
  // find a pair of weights that actually balances, the way the student would
  let P=0,Q=0;
  for(let g=0;g<400;g++){
    P=(2+Math.floor(Math.random()*24))*10; Q=(2+Math.floor(Math.random()*24))*10;
    if(!A.gravSolve(P,Q,R).err) break; P=0;
  }
  if(!P) continue;
  s.P=P; s.Q=Q;
  s.scale=A.SCALES.find(v=>Math.max(P,Q)/v<=13&&R/v>=4)||25;
  s.paper.strokes=[];
  const d=A.paperDirs(); if(!d){ bad('no directions for P='+P+' Q='+Q+' R='+R); continue; }
  const O=A.P_O, OA=P/s.scale, OB=Q/s.scale;
  const Apt=[O[0]+d.P[0]*OA,O[1]+d.P[1]*OA], Bpt=[O[0]+d.Q[0]*OB,O[1]+d.Q[1]*OB];
  draw(O,Apt,OA);                                          // OA
  draw(O,Bpt,OB);                                          // OB
  // the two sides, run on past the corner so that they cross
  draw(Apt,[Apt[0]+d.Q[0]*(OB*1.25),Apt[1]+d.Q[1]*(OB*1.25)]);
  draw(Bpt,[Bpt[0]+d.P[0]*(OA*1.25),Bpt[1]+d.P[1]*(OA*1.25)]);
  // C: the crossing of those two, found by the same snap the pencil uses
  const Cwant=[Apt[0]+d.Q[0]*OB, Apt[1]+d.Q[1]*OB];
  const C=A.nearestPoint([Cwant[0]+jitter()*0.3,Cwant[1]+jitter()*0.3],null);
  if(!C){ bad('the two sides did not give a corner to snap to (P='+P+' Q='+Q+' R='+R+')'); continue; }
  const oc=draw(O,C);
  const len=Math.hypot(oc.q[0]-oc.p[0],oc.q[1]-oc.p[1]);
  const got=Math.round(len*10)/10*s.scale;                 // read to the millimetre
  const pct=Math.abs(got-R)/R*100;
  if(pct>3) bad('P='+P+' Q='+Q+' R='+R+' scale='+s.scale+' -> OC='+len.toFixed(2)+' cm gives '+got+' g wt ('+pct.toFixed(1)+'%)');
  if(pct>worst){ worst=pct; worstMsg='P='+P+' Q='+Q+' R='+R+' scale 1cm='+s.scale+'g'; }
  n++;
}
console.log('  '+n+' constructions drawn freehand-with-snapping');
console.log('  worst error '+worst.toFixed(2)+'%  ('+worstMsg+')');
console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean \u2014 the diagonal the student builds is the unknown weight');
process.exit(fail?1:0);
