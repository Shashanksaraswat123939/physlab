// What the student actually hands in, and what test mode withholds.
const A=require('./harness.js');
let fail=0; const bad=m=>{ if(fail<10) console.log('  FAIL '+m); fail++; };

// a fully worked experiment
A.setExp('v1');
const s=A.S.v1, z=s.sp.zeroTicks;
['l','b','h'].forEach(k=>{ s.rows[k]=[];
  for(let i=0;i<5;i++){ const t=s.sp.dims[k]+z+[-1,0,0,0,1][i], msr=Math.floor(t/10)*10;
    s.rows[k].push({t,msr:(msr/100).toFixed(2),vsr:String(t-msr)}); } });
s.zeroTyped=String(z); s.lcTyped='0.1';

console.log('1. the printed record carries every section the class record has');
A.printRecord();
const html=A.__slots['#printArea'].innerHTML||'';
['Experiment No. 1','Aim','Apparatus','Formula','Procedure','Observations',
 'Readings for the length','Readings for the breadth','Readings for the height',
 'Calculations','Result','Precautions','Sources of error'].forEach(h=>{
  if(html.indexOf(h)<0) bad('the printed record has no "'+h+'" section');
});
const rows=(html.match(/<tr>/g)||[]).length;
if(rows<18) bad('only '+rows+' rows printed; three tables of five plus headers were expected');
if(html.indexOf(A.fx(A.EXP.v1.trueResult(s.sp).value,3))<0
   &&html.indexOf('Volume of the given object')<0) bad('the result line is missing from the print');
console.log('   all sections present, '+rows+' table rows');

console.log('2. learning mode marks each reading; test mode does not');
A.setModeOnly('learn'); A.renderObt();
const learn=A.__slots['#obt'].innerHTML||'';
A.setModeOnly('test'); A.renderObt();
const test=A.__slots['#obt'].innerHTML||'';
if(learn.indexOf('i-check')<0) bad('learning mode did not mark a correct reading');
if(test.indexOf('i-check')>=0||test.indexOf('i-x')>=0) bad('test mode marked a reading before it was checked');
if(test.indexOf('class="cell good"')>=0||test.indexOf('class="cell bad"')>=0) bad('test mode coloured a cell');
if(learn.indexOf('M.S.R.')<0||test.indexOf('M.S.R.')<0) bad('a column heading went missing');
console.log('   learning marks them, test stays quiet, both keep the record\u2019s columns');

console.log('3. the viva answers are shown in learning mode only');
A.setModeOnly('learn'); A.renderGuide();
const gl=A.__slots['#guide'].innerHTML||'';
A.setModeOnly('test'); A.renderGuide();
const gt=A.__slots['#guide'].innerHTML||'';
if(gl.indexOf('Pierre Vernier')<0) bad('learning mode is missing the viva answers');
if(gt.indexOf('Pierre Vernier')>=0) bad('test mode is giving away the viva answers');
if(gt.indexOf('Procedure')<0||gt.indexOf('Precautions')<0) bad('test mode dropped part of the method');
console.log('   answers hidden in test mode, the method kept in both');

console.log(fail?('\n'+fail+' PROBLEMS'):'\nall clean');
process.exit(fail?1:0);
