// Wounds over time with no screen: bleeding, washing, wrapping, infection, antibiotics, food and healing.
// node tests/body.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(p=>p.endsWith('.js')&&p!=='90_boot.js');
const src=order.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump"])globalThis[f]=()=>{}');
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"",mark:"",bg:"Nurse",traits:[],story:"",household:"alone",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average",start:"home"});UI.modal=null;S.flags.alarm=1;S.zeds=[]`);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
let fed=80;const keep=()=>X(`(()=>{const pl=S.player;pl.food=${fed};pl.water=${fed};pl.warmth=80;pl.energy=80})()`);
const hours=n=>{for(let i=0;i<n;i++){keep();X('advance(60)');if(X('UI.modal'))X('UI.modal=null')}};
const show=()=>console.log(X(`wounds().map(w=>"    "+woundName(w)+" @"+w.at+" bleed "+wBleed(w).toFixed(2)+" inf "+w.inf.toFixed(0)+" heal "+w.heal.toFixed(0)+(washed(w)?" washed":"")+(w.band?" wrapped":"")+(w.spl?" bound":"")+" | "+woundStatus(w).join("; ")).join("\\n")`));

console.log('1. a deep cut left alone bleeds');
X(`S.player.hp=100;S.player.eq.back=mkInst("hiking_pack");globalThis.TW1=addWound("deep","larm",{at:"forearm"}).id`);
hours(1);show();ok(X('S.player.hp')<96&&X('S.player.hp')>90,'lost about six health in an hour');ok(X('S.player.bleeding')>.6,'pl.bleeding still reports it');
ok(X('nextFix(woundById(TW1))')==="wrap",'the screen says wrap it first');

console.log('2. wrap it: one click, the bleeding all but stops');
X(`invAdd("bandage",2,true);invAdd("cloth",2,true);invAdd("water_bottle",2,true)`);
ok(X('wrapWound(woundById(TW1))')==="bandage",'the bandage goes on first');ok(X('wBleed(woundById(TW1))')<.2,'under the wrap it barely bleeds: '+X('wBleed(woundById(TW1)).toFixed(2)'));
ok(X('nextFix(woundById(TW1))')==="wash",'next it wants washing');

console.log('3. wash it: one click, and it stays clean');
ok(X('washWound(woundById(TW1))')==="water_bottle",'bottled water washes it');ok(X('washed(woundById(TW1))')&&X('nextFix(woundById(TW1))')==="",'washed and wrapped: nothing left to do');
ok(X('invCount("empty_bottle")')===1,'the bottle is empty now');

console.log('4. a scratch nobody washes turns, and brings a fever; antibiotics cure it');
X(`globalThis.TW2=addWound("scratch","rhand").id`);hours(36);show();
ok(X('woundById(TW2)?woundById(TW2).inf:0')>=40,'the unwashed scratch got infected');ok(X('S.player.sick')===1,'a fever came with it');
ok(X('woundById(TW1).inf')<5,'the washed cut did not turn');
X(`invAdd("antibiotics",1,true);takeAntibiotics()`);ok(X('S.player.sick')===0&&X('infMax()')===0,'antibiotics cure the fever and the infection at once');

console.log('5. a broken leg: slow and no running until it is wrapped tight');
X(`globalThis.TW3=addWound("fracture","lleg",{at:"shin"}).id`);ok(X('bodySpeed()')<=.5,'a loose broken leg halves your speed');ok(!X('canRun()'),'no running on it');
ok(X('wrapWound(woundById(TW3))')==="bandage",'a bandage wrapped tight binds it when there is no splint');ok(X('bodySpeed()')>.7&&X('canRun()'),'bound, you can walk and hobble faster');

console.log('6. food heals: the same cut, fed and hungry');
X(`globalThis.TWF=addWound("cut","rleg",{at:"thigh"}).id;globalThis.TWH=addWound("cut","larm",{at:"upper arm"}).id;for(const id of [TWF,TWH]){const w=woundById(id);w.cl=1;w.dirt=0;w.band={k:"bandage",q:1,d:0}}`);
fed=80;hours(12);const healFed=X('woundById(TWF).heal');fed=15;X('woundById(TWF).heal=0;woundById(TWH).heal=0');hours(12);const healHungry=X('woundById(TWH).heal');
ok(healFed>healHungry*3,`fed it heals far faster (${healFed.toFixed(0)} vs ${healHungry.toFixed(0)} in 12 hours)`);fed=80;

console.log('7. a week later');
hours(24*7);show();ok(!X('woundById(TW1)'),'the wrapped deep cut healed');ok(!X('woundById(TW2)'),'the scratch healed');
ok(X('woundById(TW3)?woundById(TW3).heal:100')>60,'the leg is mending');ok(X('S.player.hp')>90,'health came back while fed: '+X('Math.round(S.player.hp)'));

console.log('8. wash and wrap everything at once');
X(`S.player.body.w=[];addWound("cut","rarm");addWound("scratch","lhand");addWound("fracture","rleg");invAdd("cloth",3,true);invAdd("water_bottle",3,true)`);
const r=JSON.parse(X('JSON.stringify(tendAll())'));console.log('    '+r.did.join(', ')+(r.miss.length?' | missing: '+r.miss:''));
ok(X('wounds().every(w=>!needsWash(w)&&!needsWrap(w))'),'everything washed and wrapped in one go ('+r.mins+' minutes)');

console.log('9. the dead hit you where you are');
X(`S.player.body.w=[];for(let i=0;i<200;i++){const r=zedWound();if(r.bite){S.player.bitten=null}}`);
console.log(X(`(()=>{const c={};for(const w of wounds())c[w.k]=(c[w.k]||0)+1;const p={};for(const w of wounds())p[w.p]=(p[w.p]||0)+1;return "    kinds "+JSON.stringify(c)+"\\n    parts "+JSON.stringify(p)})()`));
ok(X('wounds().length')<=14,'wounds merge instead of piling up past 14');
console.log(fails?`${fails} failed`:'all passed');process.exitCode=fails?1:0;
