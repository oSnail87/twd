// Turn-based fights with no screen: the odds, the dead, running, biting, and fights with people (witnesses, giving up, robbing, killing).
// node tests/fight.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(p=>p.endsWith('.js')&&p!=='90_boot.js');
const src=order.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({}),querySelectorAll:()=>[]},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump","save"])globalThis[f]=()=>{}');
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"",mark:"",bg:"Nurse",traits:[],story:"",household:"alone",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average",start:"home"});UI.modal=null;S.flags.alarm=1;S.zeds=[]`);
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
// stand out in the open, by your front door
X(`(()=>{const pl=S.player;const bd=BMAP[pl.home];const d=bd.exits[0];const p=d.p[d.outSide];pl.x=p.x;pl.z=p.z;for(let i=0;i<40;i++){const a=i*.7,r=2+i*.15;const x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(!bldAt(x,z)&&free(x,z,.4,"pl")){pl.x=x;pl.z=z;break}}})()`);
// somewhere r metres away that you can see and that's open ground
X(`globalThis.spot=(r)=>{const pl=S.player;for(let i=0;i<60;i++){const a=i*.9,x=pl.x+Math.sin(a)*r,z=pl.z+Math.cos(a)*r;if(!bldAt(x,z)&&free(x,z,.35,"zed")&&losClear(pl.x,pl.z,x,z))return{x,z}}return{x:pl.x+r,z:pl.z}}`);
X(`globalThis.fresh=()=>{const pl=S.player;UI.fight=null;W3.fightCd=0;S.zeds=[];pl.hp=100;pl.energy=80;pl.bitten=null;pl.body=null;pl.bleeding=0;pl.alive=true;UI.modal=null;pl.sk.fight=1;pl.sk.speak=1;pl.eq.weapon=null;pl.eq.body=mkInst("hoodie");pl.eq.legs=mkInst("jeans");pl.eq.outer=null}`);
X(`globalThis.zedAt=(r,o={})=>{const s=spot(r);const z=spawnZed(s.x,s.z,o);syncFigsLite();return z};globalThis.syncFigsLite=()=>{W3.zmap=new Map(S.zeds.map(z=>[z.id,z]))}`);

// ---------- the odds ----------
const o00=X('fOdds(0,0)'),hi=X('fOdds(100,0)'),lo=X('fOdds(-100,0)'),none=X('fOddsAll(0,[])');
ok(Math.abs(o00-.4775)<.001&&Math.abs(hi-.95)<1e-9&&Math.abs(lo-.05)<1e-9&&none===1,`odds: even ${(o00*100).toFixed(1)}%, a natural 1 always misses (${hi*100}% at best), a natural 20 always lands (${lo*100}% at worst)`);
const emp=X('(()=>{let n=0;for(let i=0;i<40000;i++)if(fBeats(fRoll(3),fRoll(1)))n++;return n/40000})()'),exact=X('fOdds(3,1)');
ok(Math.abs(emp-exact)<.012,`the shown odds match the dice: ${(exact*100).toFixed(1)}% shown, ${(emp*100).toFixed(1)}% rolled`);
const run2=X('fOddsAll(2,[0,0])'),emp2=X('(()=>{let n=0;for(let i=0;i<40000;i++){const a=fRoll(2);if(fBeats(a,fRoll(0))&&fBeats(a,fRoll(0)))n++}return n/40000})()');
ok(Math.abs(run2-emp2)<.012,`running from two at once: ${(run2*100).toFixed(1)}% shown, ${(emp2*100).toFixed(1)}% rolled`);

// ---------- one of the dead walks up ----------
X('fresh()');X('globalThis.Z1=zedAt(1)');
const st=X(`(()=>{startFight({zed:Z1,them:true});const F=UI.fight;return{on:!!F,paused:worldPaused(),foes:F.foes.length,log:F.log.map(e=>e.h||"").join(" | "),gap:F.foes[0].gap}})()`);
ok(st.on&&st.paused&&st.foes===1&&st.gap===0,'when one of the dead reaches you, a fight opens and the world holds still');
ok(/class="die/.test(st.log)&&/vs/.test(st.log),'it gets a first grab at you, and the roll is shown: '+st.log.replace(/<[^>]+>/g,'').slice(0,160));
const end=X(`(()=>{S.player.hp=100;let n=0;while(UI.fight&&!UI.fight.over&&n<60){fightAct("attack");n++}const F=UI.fight;return{over:F&&F.over,rounds:n,kills:S.stats.kills,left:S.zeds.length,sum:F&&F.sum}})()`);
ok(end.over==="won"&&end.left===0&&end.kills>=1,`attack until it's down: won in ${end.rounds} rounds, "${end.sum}"`);
X('closeFight()');ok(X('!UI.fight&&!worldPaused()'),'closing the fight lets time run again');
ok(X('W3.fightCd>performance.now()'),'and you get a moment before the next one can grab you');

// ---------- defending ----------
const def=X(`(()=>{let a=0,b=0;for(let i=0;i<4000;i++){if(fBeats(fRoll(1),fRoll(youDef(false))))a++;if(fBeats(fRoll(1),fRoll(youDef(true))))b++}return[a/4000,b/4000]})()`);
ok(def[0]>.38&&def[0]<.55&&def[1]<.3,`defending cuts how often the dead get you: ${(def[0]*100).toFixed(0)}% down to ${(def[1]*100).toFixed(0)}%`);

// ---------- how often a plain fight ends in a bite ----------
// a bite only ever comes after the dead get hold of you, which the screen shows, so you get a turn to answer it
X(`globalThis.bout=(wid,fight,smart)=>{fresh();S.player.sk.fight=fight;S.player.eq.weapon=mkInst(wid);const z=zedAt(1);startFight({zed:z,them:true});let n=0;
  while(UI.fight&&!UI.fight.over&&n<40){const held=UI.fight.foes.some(f=>f.grab&&!f.out);fightAct(smart&&held?"shove":"attack");n++}
  const L=(UI.fight?UI.fight.log:[]).map(e=>e.h||"");const bi=L.findIndex(h=>/been bitten/.test(h)),gi=L.findIndex(h=>/has hold of/.test(h));
  return{bit:!!S.player.bitten,warned:bi<0||gi>=0&&gi<bi,n,dead:S.player.alive===false}}`);
const rate=(w,f,smart,N=800)=>X(`(()=>{let bit=0,warned=0,n=0,dead=0;for(let i=0;i<${N};i++){const r=bout("${w}",${f},${smart});if(r.bit)bit++;if(r.warned)warned++;n+=r.n;if(r.dead)dead++}return{bit:bit/${N},warned:warned/${N},n:n/${N},dead}})()`);
const careless=rate("kitchen_knife",1,false),careful=rate("kitchen_knife",1,true),vet=rate("machete",4,true);
ok(careless.warned===1,'every bite comes after a warning that it has hold of you');
ok(careless.bit<.12&&careless.dead===0,`a fresh survivor with a kitchen knife who only swings: bitten in ${(careless.bit*100).toFixed(1)}% of fights (${careless.n.toFixed(1)} rounds on average), never killed outright`);
ok(careful.bit<careless.bit,`breaking free when it grabs you helps: ${(careful.bit*100).toFixed(1)}%`);
ok(vet.bit<careful.bit,`practice and a better blade help more: ${(vet.bit*100).toFixed(1)}% with a machete and some fights behind you`);

// ---------- a crowd, and running ----------
X('fresh()');X('globalThis.ZS=[zedAt(1),zedAt(1.6),zedAt(3.2)];for(const z of ZS){z.st="chase";zst(z).tgt=S.player}');
const crowd=X(`(()=>{startFight({zed:ZS[0],them:true});const F=UI.fight;return{n:F.foes.length,gaps:F.foes.map(f=>f.gap).join(","),log:F.log.map(e=>(e.h||"").replace(/<[^>]+>/g,"")).join(" | ")}})()`);
ok(crowd.n===3,`the others close by join in (${crowd.n} in the fight, steps away: ${crowd.gaps})`);
const ran=X(`(()=>{S.player.sk.survive=30;fightAct("run");const F=UI.fight;return{over:F.over,stun:ZS.every(z=>z.stun>1),cd:W3.fightCd>performance.now()}})()`);
ok(ran.over==="ran"&&ran.stun&&ran.cd,'running works on a good roll, and leaves them stumbling for a moment');
X('S.player.sk.survive=1;closeFight()');

// ---------- the dead hear a shot ----------
X('fresh();S.player.eq.weapon=mkInst("pistol");invAdd("ammo",6,true);globalThis.Z2=zedAt(1);globalThis.Z3=zedAt(9);Z3.st="idle"');
const shot=X(`(()=>{const a0=invCount("ammo");startFight({zed:Z2});fightAct("attack");const F=UI.fight;const a1=invCount("ammo");if(F&&!F.over)fightAct("defend");if(UI.fight&&!UI.fight.over)fightAct("defend");return{used:a0-a1,heard:Z3.st,joined:!!(UI.fight&&UI.fight.foes.some(f=>f.id===Z3.id))||dist(Z3.x,Z3.z,S.player.x,S.player.z)<8||dist(Z3.tx,Z3.tz,S.player.x,S.player.z)<4}})()`);
ok(shot.used===1&&shot.heard!=="idle"&&shot.joined,`a shot uses a round and brings the dead running (${JSON.stringify(shot)})`);
X('UI.fight=null');

// ---------- people ----------
// someone to fight, and someone to see it
X(`(()=>{fresh();const pl=S.player;const L=living().filter(p=>p.age>=25&&p.age<60&&!p.fam.you&&p.hh);globalThis.V=L[0];
  globalThis.W=living().find(q=>q.hh===V.hh&&q!==V&&q.age>=8)||living().find(q=>q!==V&&!q.fam.you&&q.age>=8&&q.hh!==V.hh);
  globalThis.N2=living().find(q=>q!==V&&q!==W&&q.hh!==V.hh&&!q.fam.you&&q.age>=18&&(!q.group||q.group!==V.group));
  const a=spot(1.1);V.x=a.x;V.z=a.z;const b=spot(5);N2.x=b.x;N2.z=b.z;W.x=pl.x+80;W.z=pl.z+80;
  for(const q of [V,N2]){q.trust=20;q.aff=20;q.met=true;q.health=100;q.pack={canned_food:2,lighter:1}}})()`);
ok(X('armAttack(living().find(p=>p.age<18&&p.age>5).id),!UI.fight'),'you can\'t start a fight with a child');
const pv=X(`(()=>{const t0=V.trust,w0=N2.trust;const n0=S.news.length;armAttack(V.id);armAttack(V.id);const F=UI.fight;return{on:!!F,you:F&&F.you,vt:V.trust-t0,wt:N2.trust-w0,news:S.news.length>n0?S.news[0].x:"",mem:N2.mem.slice(-1)[0]?.x}})()`);
ok(pv.on&&pv.you,'Attack in the talk window takes two clicks, then the fight starts');
ok(pv.vt<=-25&&pv.wt<=-10,`going after someone costs you with them (${pv.vt}) and with anyone who saw (${pv.wt}): "${pv.mem}"`);
ok(/attacked/.test(pv.news),`word gets around: "${pv.news}"`);
// bare hands knock them down but don't kill them
const fist=X(`(()=>{S.player.hp=100;S.player.sk.fight=6;let n=0;while(UI.fight&&!UI.fight.over&&!UI.fight.ask&&n<80){S.player.hp=100;fightAct("attack");n++}const F=UI.fight;return{ask:F&&F.ask===V.id,alive:V.alive,hp:Math.round(V.health),n,intents:F.log.filter(e=>e.w==="them").length}})()`);
ok(fist.ask&&fist.alive&&fist.hp>0,`with bare hands they end up beaten but alive (health ${fist.hp} after ${fist.n} rounds), and you decide what happens`);
const rob=X(`(()=>{const c0=invCount("canned_food");fDecide("rob");const F=UI.fight;return{over:F.over,got:invCount("canned_food")-c0,pack:Object.keys(V.pack).length,mem:V.mem.slice(-1)[0]?.x,sum:F.sum}})()`);
ok(rob.over==="won"&&rob.got===2&&rob.pack===0,`taking their things moves them to you: "${rob.sum}"`);
ok(/took everything/.test(rob.mem),`and they remember it: "${rob.mem}"`);
X('closeFight()');

// a fight someone else starts, with a weapon in your hand, that ends with them dead
X(`(()=>{fresh();S.player.eq.weapon=mkInst("axe");S.player.sk.fight=8;V.health=100;V.alive=true;V.tr.brave=.9;V.tr.temper=.9;const a=spot(1.1);V.x=a.x;V.z=a.z;N2.x=spot(5).x;N2.z=spot(5).z;globalThis.FAM=living().filter(q=>q.fam[V.id]);for(const q of FAM){q.trust=10;q.aff=10}})()`);
const k=X(`(()=>{const t0=N2.trust;startFight({person:V,them:true});const F=UI.fight;const first=F.log.length;let n=0;while(UI.fight&&!UI.fight.over&&n<60){S.player.hp=100;if(UI.fight.ask){fDecide("finish");break}fightAct("attack");n++}
  return{dead:!V.alive,news:S.news.find(x=>x.a&&x.a.includes(V.id))?.x||"",wt:N2.trust-t0,sum:UI.fight&&UI.fight.sum,firstHit:F.log.slice(0,first).some(e=>/class="die/.test(e.h||""))}})()`);
ok(!k.firstHit,'when someone else starts it, nobody gets a free blow before your first turn');
ok(k.dead&&/killed by Dana Reyes|found dead/.test(k.news),`with an axe it can end in a death: "${k.news}" / "${k.sum}"`);
ok(k.wt<0&&k.wt>-20,`someone who saw you kill a person who came at you trusts you a little less (${k.wt}), not like a murder`);
X('closeFight()');

// talking someone down
X(`(()=>{fresh();S.player.sk.speak=10;globalThis.T=living().find(q=>q.alive&&q.age>=20&&q!==V&&q!==N2&&!q.fam.you);T.health=100;T.tr.temper=.3;const a=spot(1.1);T.x=a.x;T.z=a.z})()`);
const talk=X(`(()=>{startFight({person:T,them:true});let n=0;while(UI.fight&&!UI.fight.over&&n<20){S.player.hp=100;if(UI.fight.ask)fDecide("spare");else fightAct("talk");n++}return{over:UI.fight&&UI.fight.over,sum:UI.fight&&UI.fight.sum,mem:T.mem.slice(-1)[0]?.x}})()`);
ok(talk.over==="talked",`a good talker can end it with words: "${talk.sum}" / they remember: "${talk.mem}"`);
X('closeFight()');

// nothing about a fight goes into the save
X('fresh();globalThis.Z4=zedAt(1);startFight({zed:Z4,them:true})');
ok(!/"foes"/.test(X('JSON.stringify(S)')),'a fight in progress is never written into the save');
X('UI.fight=null');

// the dead nearby come to the noise while you fight
X('fresh();globalThis.Z5=zedAt(1);globalThis.Z6=zedAt(8);Z6.st="chase";zst(Z6).tgt=S.player');
const drift=X(`(()=>{startFight({zed:Z5});const F=UI.fight;const d0=dist(Z6.x,Z6.z,S.player.x,S.player.z);let n=0;while(UI.fight&&!UI.fight.over&&n<4&&!F.foes.some(f=>f.id===Z6.id)){S.player.hp=100;fightAct("defend");n++}return{joined:F.foes.some(f=>f.id===Z6.id),n,d0:d0.toFixed(1)}})()`);
ok(drift.joined,`one coming from ${drift.d0} m away joins the fight after ${drift.n} rounds`);
X('UI.fight=null');

// the fight screen itself renders with numbers on every button
const html=X(`(()=>{fresh();const z=zedAt(1);startFight({zed:z,them:true});return fightHtml(UI.fight)})()`);
ok(/data-act="fact" data-v="attack"/.test(html)&&/\d+% to hit/.test(html)&&/to get away/.test(html)&&/Their odds drop from \d+% to \d+%/.test(html),'the fight screen shows your odds on each move');
console.log(fails?fails+' FAILED':'all passed');process.exitCode=fails?1:0;
