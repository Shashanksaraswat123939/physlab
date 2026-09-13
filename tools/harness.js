// Load the page's own script into Node behind a DOM stub, so the real functions
// can be exercised rather than a copy of them.
const fs=require('fs');
require('./extract.js');                 // keep app.js in step with the page
const src=fs.readFileSync(require('path').join(__dirname,'app.js'),'utf8');
function el(){
  const o={ _v:'', style:{setProperty(){},display:''}, classList:{add(){},remove(){},toggle(){},contains(){return false}},
    dataset:{}, children:[], hidden:false, textContent:'', innerHTML:'', value:'',
    addEventListener(){}, removeEventListener(){}, setAttribute(){}, getAttribute(){return null},
    querySelector(){return el()}, querySelectorAll(){return []}, closest(){return null},
    focus(){}, click(){}, appendChild(){}, setPointerCapture(){},
    getBoundingClientRect(){return {left:0,top:0,width:800,height:200}} };
  return new Proxy(o,{get(t,k){ if(k in t) return t[k]; if(typeof k==='string'&&k.startsWith('on')) return null; return el(); },
                      set(t,k,v){ t[k]=v; return true; }});
}
const SLOTS={};
const document={ querySelector:(q)=>(SLOTS[q]||(SLOTS[q]=el())), querySelectorAll:()=>[], addEventListener(){},
  documentElement:el(), body:el(), createElement:()=>el(), activeElement:null, getElementById:()=>el() };
const window={ addEventListener(){}, innerWidth:1600, innerHeight:900, print(){} };
const store={};
const localStorage={ getItem:k=>(k in store?store[k]:null), setItem:(k,v)=>{store[k]=String(v)}, removeItem:k=>{delete store[k]} };
const EXPORT='\n;return {VERNIER,SCREW,INSTR,EXPERIMENTS,EXP,S,st,cur,expId,freshState,ensure,'
  +'setTicks,closeJaws,setHeld,stopTicks,gripped,maxTicks,magVernier,drawVernier,magScrew,drawScrew,'
  +'gravSolve,gOC,drawBoard,drawPaper,syncWeights,WEIGHTS,SCALES,paperDirs,P_O,snapPoint,snapEnd,nearestPoint,knownPoints,COLSPEC,specOf,meanOf,rowTotal,studentResult,means,num,fx,tolOf,nRows,'
  +'setExp:(id)=>{expId=id;ensure(id);},getExpId:()=>expId,setMode:(m)=>{mode=m;},takeReading,save,load,resetAll,KEY,printRecord,renderObt,renderCalc,renderGuide,obsHead,setModeOnly:(m)=>{mode=m;},mode:()=>mode,theme:()=>theme,cols:()=>cols};';
const fn=new Function('document','window','localStorage','requestAnimationFrame','cancelAnimationFrame','confirm','alert','Element',
  src+EXPORT);
const api=fn(document,window,localStorage,f=>0,()=>{},()=>true,()=>{},function(){});
api.__store=store;                       // so a test can poison what was saved
api.__slots=SLOTS;                       // and read back what was rendered
module.exports=api;
