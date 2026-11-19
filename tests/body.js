// Wounds over time with no screen: bleeding, dressings, infection, stitches, splints and healing.
// node tests/body.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const parts=['10_base.js','20_interior.js','30_inventory.js','35_body.js','40_sim.js','45_mind.js','48_coma.js','50_talk.js','52_bond.js','55_ai.js','60_world.js','65_figs.js','68_play.js','70_ui.js','75_health.js','80_inv_ui.js'];
const src=parts.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump"])globalThis[f]=()=>{}');
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"",mark:"",bg:"Nurse",traits:[],story:"",household:"alone",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average"});UI.modal=null;S.pending=[];`);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
const keep=X(`()=>{const pl=S.player;pl.food=80;pl.water=80;pl.warmth=80;pl.energy=80}`);
const hours=n=>{for(let i=0;i<n;i++){keep();X('advance(60)');if(X('UI.modal'))X('UI.modal=null')}};
const show=()=>console.log(X(`wounds().map(w=>"    "+woundName(w)+" @"+w.at+" bleed "+wBleed(w).toFixed(2)+" dirt "+w.dirt.toFixed(2)+" inf "+w.inf.toFixed(0)+" heal "+w.heal.toFixed(0)+(w.band?" band "+w.band.k+" q"+w.band.q.toFixed(2)+" d"+w.band.d.toFixed(2):"")+(w.st?" stitched":"")+(w.spl?" splinted":"")).join("\\n")+"\\n    hp "+S.player.hp.toFixed(1)+" pain "+painNow().toFixed(0)+" speed "+bodySpeed().toFixed(2)+" sick "+S.player.sick`));

console.log('1. a deep cut left alone bleeds');
X(`S.player.hp=100;const w=addWound("deep","larm",{at:"forearm"});globalThis.TW1=w.id`);
hours(1);show();ok(X('S.player.hp')<96&&X('S.player.hp')>90,'lost about six health in an hour');
ok(X('S.player.bleeding')>.9,'pl.bleeding still reports it');

console.log('2. a snug bandage stops most of it');
X(`S.player.eq.back=mkInst("hiking_pack");invAdd("bandage",3,true);invAdd("rubbing_alcohol",1,true);invAdd("suture_kit",1,true);invAdd("splint",1,true);dressWound(woundById(TW1),"bandage",1)`);
ok(X('wBleed(woundById(TW1))')<.1,'bleeding under a bandage is a trickle');
hours(2);const hp2=X('S.player.hp');show();

console.log('3. stitch it after cleaning; it heals in days');
X(`const w=woundById(TW1);undress(w);cleanWound(w,"rubbing_alcohol",1);stitchWound(w,"suture_kit",.9);dressWound(w,"bandage",1)`);
ok(X('woundById(TW1).dirt')<.05,'alcohol cleaned it');ok(X('invCount("dirty_bandage")')===1,'the old bandage came off bloody');
ok(X('usesLeft("rubbing_alcohol")')===4,'one use of the alcohol is gone');

console.log('4. a scratch left dirty turns, and brings a fever');
X(`const s=addWound("scratch","rhand");s.dirt=.7;globalThis.TW2=s.id`);
hours(30);show();ok(X('woundById(TW2)?woundById(TW2).inf:0')>40,'the dirty scratch got infected');ok(X('S.player.sick')===1,'fever came with it');
X(`invAdd("antibiotics",1,true);takeAntibiotics()`);hours(12);show();ok(X('S.player.sick')===0,'antibiotics broke the fever');

console.log('5. a broken leg: slow, no running, splint helps');
X(`globalThis.TW3=addWound("fracture","lleg",{at:"shin"}).id`);ok(X('bodySpeed()')<=.5,'unsplinted leg halves your speed');ok(!X('canRun()'),'no running on it');
X(`splintWound(woundById(TW3),"splint",.9)`);ok(X('bodySpeed()')>.7,'splinted, you can walk');ok(X('canRun()'),'and hobble faster');
console.log('6. a week later');
for(let d=0;d<7;d++){hours(24);X('S.player.body.w.forEach(w=>{if(w.band&&w.band.d>.6){undress(w);if(invHas("bandage"))dressWound(w,"bandage",1)}})')}
show();ok(!X('woundById(TW1)'),'the stitched deep cut healed');ok(!X('woundById(TW2)'),'the scratch healed');
ok(X('woundById(TW3)?woundById(TW3).heal:100')>60,'the leg is mending');
console.log('7. the dead hit you where you are');
X(`S.player.body.w=[];for(let i=0;i<200;i++){const r=zedWound();if(r.bite){S.player.bitten=null}}`);
console.log(X(`(()=>{const c={};for(const w of wounds())c[w.k]=(c[w.k]||0)+1;const p={};for(const w of wounds())p[w.p]=(p[w.p]||0)+1;return "    kinds "+JSON.stringify(c)+"\\n    parts "+JSON.stringify(p)})()`));
ok(X('wounds().length')<=14,'wounds merge instead of piling up past 14');
console.log(fails?`${fails} failed`:'all passed');process.exitCode=fails?1:0;
