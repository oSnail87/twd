// Run the town for several days with no screen, to catch crashes in people, the dead, doors and paths.
// node tests/sim.js [days]
const fs=require('fs'),vm=require('vm'),path=require('path');
const parts=['10_base.js','20_interior.js','30_inventory.js','40_sim.js','50_talk.js','55_ai.js','60_world.js','65_figs.js','68_play.js','70_ui.js','80_inv_ui.js'];
const src=parts.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles"])globalThis[f]=()=>{}');
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"average build, long brown hair",mark:"",bg:"Nurse",traits:["Tough","Handy"],story:"",household:"partner",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average"});doorsIn();UI.modal=null`);
const days=+(process.argv[2]||3);const t0=Date.now();let frames=0,lastDay=1;
const step=X(`(dt)=>{playerMove(dt);moveNPCs(dt);moveZeds(dt);companions(dt);taskTick(dt);invTick(dt)}`);
const minute=X(`()=>{const pl=S.player;pl.hp=Math.max(pl.hp,60);pl.food=Math.max(pl.food,60);pl.water=Math.max(pl.water,60);pl.bitten=null;advance(1);if(UI.modal){if(UI.modal.type==="event")choose(0);UI.modal=null}}`);
const every=X(`()=>{syncFigs();dropDead();autoDoors()}`);
try{for(let m=0;m<days*1440;m++){minute();for(let f=0;f<6;f++){step(1/6);frames++}if(m%5===0)every();
  const d=X('dayOf(S.t)');if(d!==lastDay){lastDay=d;console.log(X(`"day "+dayOf(S.t)+": alive "+living().length+", dead walking "+S.zeds.length+", groups "+Object.values(S.groups).filter(g=>!g.dead&&groupSize(g.id)>0).map(g=>g.name+"("+groupSize(g.id)+")").join(" ")`))}}
  console.log('ok',X('stamp(S.t)'),frames,'frames',((Date.now()-t0)/1000).toFixed(1)+'s')}
catch(e){console.log('CRASH at',X('stamp(S.t)'),e.stack.split('\n').slice(0,6).join('\n'));process.exitCode=1}
