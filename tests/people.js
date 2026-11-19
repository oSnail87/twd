// Who lives in town: American names that fit when people were born, and ways of talking that fit their age.
// node tests/people.js [worlds]
const fs=require('fs'),vm=require('vm'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(p=>p.endsWith('.js')&&p!=='90_boot.js');
const src=order.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump"])globalThis[f]=()=>{}');
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
const N=+(process.argv[2]||5);let dupes=0,bad=[];
X('buildInteriors();buildCollision()');
for(let w=0;w<N;w++){
  X(`newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"average build",mark:"",bg:"Nurse",traits:["Tough","Handy"],story:"I fixed fences.",household:"partner",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average",start:"home",cause:"crash"})`);
  const ppl=JSON.parse(X('JSON.stringify(S.people.map(p=>({n:p.name,s:p.sur,a:p.age,x:p.sex,st:p.style,look:p.look,f:p.facts,pz:persona(p),seed:p.seed})))'));
  const names=ppl.map(p=>p.n);dupes+=names.length-new Set(names).size;
  for(const p of ppl){const why=[];
    if(p.st==="folksy"&&p.a<50)why.push("pet names under 50");
    if(p.a<13&&p.st!=="kid")why.push("kid not talking like a kid");
    if(p.a>=13&&p.a<18&&!["sullen","chatty","tough","shy","joker","nervous"].includes(p.st))why.push("teen with an adult style: "+p.st);
    if(/beard|mustache/.test(p.look)&&(p.x==="F"||p.a<18))why.push("beard: "+p.look);
    if(/gray/.test(p.look)&&p.a<45)why.push("gray hair at "+p.a);
    const all=[p.f.fear,p.f.hope,p.f.secret,p.f.likes,p.pz.quirk,p.pz.hook,p.pz.morning,p.pz.flaw].join(" | ");
    if(p.a<18&&/parole|drink|divorc|retir|my kids|grandkid|propose|hungover|sober|wife|husband|job interview|owes money/.test(all))why.push("grown-up life for a "+p.a+"-year-old: "+all);
    if(p.a>=18&&/school play|training wheels|bouncy castle|driver's test|homeroom|my mom and dad/.test(all))why.push("kid's life for a "+p.a+"-year-old");
    if(why.length)bad.push(`${p.n} ${p.s} (${p.a}): ${why.join("; ")}`)}
  if(w===0){console.log('  a sample of the town:');for(const p of ppl.filter((p,i)=>i%5===0).slice(0,14))console.log(`    ${p.n} ${p.s}, ${p.a}, ${p.st}, ${p.look}. Fears ${p.f.fear}. ${p.pz.hook}`)}
}
ok(dupes<=N,`first names barely repeat (${dupes} repeats in ${N} towns of 70)`);
ok(!bad.length,'everyone fits their age'+(bad.length?':\n    '+bad.slice(0,12).join('\n    '):''));
ok(X('["Linda","Gary","Debbie","Mike","Jennifer","Jason","Ashley","Tyler","Madison","Ethan","Harper","Liam"].every(n=>[...NAMES.F,...NAMES.M].some(([,L])=>L.includes(n)))'),'name lists cover every generation');
ok(X('(()=>{S.people=[];const old=firstName("F",70,false),young=firstName("F",8,false);return NAMES.F.slice(0,2).some(([,L])=>L.includes(old))&&NAMES.F.slice(4).some(([,L])=>L.includes(young))})()'),'a 70-year-old and an 8-year-old get names from their own eras');
console.log(fails?`${fails} failed`:'all passed');process.exitCode=fails?1:0;
