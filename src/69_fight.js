
// ================= fights: turn by turn, with the dice on the table =================
// When the dead get their hands on you, or you go after someone, the world holds still and the fight plays out in rounds.
// Every blow is two rolls, one for each side. The higher total wins, and a tie goes to whoever is defending.
// A natural 20 always lands, and lands hard. A natural 1 always misses.
const d20=()=>1+Math.floor(Math.random()*20);
function fRoll(m){const d=d20();m=Math.round(m);return{d,m,t:d+m}}
function fBeats(a,b){return a.d===20||a.d!==1&&a.t>b.t}
// the exact chance that one roll beats every roll against it, under the same rules
function fOddsAll(am,dms){if(!dms.length)return 1;let s=0;for(let a=2;a<=20;a++){if(a===20){s+=1;continue}let p=1;for(const dm of dms){let w=0;for(let b=1;b<=20;b++)if(a+am>b+dm)w++;p*=w/20}s+=p}return s/20}
function fOdds(am,dm){return fOddsAll(am,[dm])}
const fPct=x=>Math.round(clamp(x,0,1)*100)+"%";

// ---------- who you're up against ----------
const ZWEAR={all:["in work boots","in a torn flannel shirt","with one shoe","in a hunting jacket","in pajamas","in coveralls","in a feed store cap","in a bathrobe","in a bloody parka","in a letter jacket","with half a jaw","in a mechanic's shirt","in a reflective vest","in running shoes","in a football jersey"],
  f:["in a church dress","in a waitress apron","in scrubs","in a sundress"],m:["in a quarry vest","in a tie","with a gray beard"]};
function zedSrc(z){return z.pid&&z.pid!=="you"?P(z.pid):null}
function zedWho(z,taken){const q=zedSrc(z);if(q&&q.met)return q.name;
  const sex=q?q.sex:hashStr(z.id)%2?"F":"M",age=q?q.age:20+hashStr(z.id)%55;
  const noun=age<13?(sex==="F"?"little girl":"little boy"):age<18?(sex==="F"?"girl":"boy"):sex==="F"?"woman":"man";
  if(z.weak)return`the ${noun} in a hospital gown`;
  const L=[...ZWEAR.all,...ZWEAR[sex==="F"?"f":"m"]],i=hashStr(z.id+"w");
  for(let k=0;k<L.length;k++){const s=`the ${noun} ${L[(i+k)%L.length]}`;if(!taken||!taken.has(s))return s}return`another ${noun}`}
function proOf(p){return p.sex==="F"?["she","her","her"]:["he","him","his"]}
function gapFor(d){return d<1.7?0:Math.min(3,Math.ceil((d-1.7)/1.5))}
function zedFoe(z,F){const q=zedSrc(z);const known=!!(q&&q.met);const [he,him,his]=known?proOf(q):["it","it","its"];
  return{k:"zed",id:z.id,name:zedWho(z,new Set(F.foes.map(f=>f.name))),he,him,his,known,max:Math.max(z.hp,z.weak?8:14),gap:gapFor(dist(z.x,z.z,S.player.x,S.player.z)),stun:0,out:null}}
function personFoe(p,F){const [he,him,his]=proOf(p);let name=p.met?p.name:`the ${p.age<30?"young ":p.age>=60?"old ":""}${p.sex==="F"?"woman":"man"}`;
  if(F.foes.some(f=>f.name===name))name=p.met?fullName(p):`the other ${p.sex==="F"?"woman":"man"}`;
  return{k:"p",id:p.id,name,he,him,his,max:100,gap:0,stun:0,out:null,intent:"attack"}}
function fObj(f){return f.k==="zed"?(W3.zmap&&W3.zmap.get(f.id))||S.zeds.find(z=>z.id===f.id)||null:P(f.id)}
function fHp(f){const o=fObj(f);return o?(f.k==="zed"?o.hp:o.health):0}
function fActive(F){return F.foes.filter(f=>!f.out)}
const WHERE_AT={town:" in town",road:" on Highway 9",river:" down by the river",hills:" up in the Shale Hills",woods:" in Cedar Woods",fields:" out in the fields",wilds:" out in the backcountry"};
function whereAt(o){const b=bldAt(o.x,o.z);if(b)return` at ${b.n}`;const k=regionAt(o.x,o.z);return WHERE_AT[k]??(PLACES[k]?` at ${PLACES[k].n}`:"")}
function fWitnesses(p){const pl=S.player;return living().filter(q=>q!==p&&q.age>=5&&Math.abs(q.x-pl.x)<16&&Math.abs(q.z-pl.z)<16&&dist(q.x,q.z,pl.x,pl.z)<16&&(dist(q.x,q.z,pl.x,pl.z)<3||losClear(q.x,q.z,pl.x,pl.z)))}
function fNearZeds(z0){const pl=S.player;const out=[];for(const z of S.zeds){if(z===z0||Math.abs(z.x-pl.x)>6||Math.abs(z.z-pl.z)>6)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d>6)continue;
  if(!(z.st==="chase"&&zst(z).tgt===pl||d<2.6)||!losClear(z.x,z.z,pl.x,pl.z))continue;out.push([d,z])}return out.sort((a,b)=>a[0]-b[0]).map(x=>x[1])}

// ---------- what you're holding, and what it's worth in a fight ----------
const WNOUN={kitchen_knife:"knife",hunting_knife:"knife",bat:"bat",nail_bat:"bat",golf_club:"golf club",crowbar:"crowbar",axe:"axe",hatchet:"hatchet",machete:"machete",hammer:"hammer",iv_pole:"IV pole",pipe:"pipe",spear:"spear",club:"club",pistol:"pistol"};
function wNoun(){const w=weapon();return w?WNOUN[w.id]||ITEMS[w.id].n.toLowerCase():"fists"}
function wKind(){const w=weapon();const it=w?ITEMS[w.id]:null;if(!it)return"fist";if(it.gun)return invHas("ammo")?"gun":"butt";if(w.id==="machete"||it.tool==="axe")return"chop";if(it.tool==="knife")return"stab";if(it.reach)return"poke";return"blunt"}
function wDmg(){const w=weapon();return wKind()==="butt"?3:w?ITEMS[w.id].dmg:2}
function youAtk(f){const pl=S.player;let m=Math.floor(pl.sk.fight*1.5);if(wKind()==="gun")m+=3-(f?f.gap:0);else m+=Math.min(3,Math.round(wDmg()/3));
  if(pl.energy<10)m-=3;if(aimPenalty())m-=2;if(pl.hp<25)m-=1;return m}
function youDef(def){const pl=S.player;let m=Math.floor(pl.sk.fight)+Math.floor(armor()/2)+(def?6:0);if(pl.energy<10)m-=3;if(!canRun())m-=1;return m}
function youDmg(f,crit,k=wKind()){const pl=S.player;const base=k==="butt"?3:k==="fist"?2:wDmg();let d=(base*1.2+2+pl.sk.fight*.6)*armPower()*(.8+rf()*.4);if(crit)d*=1.6;if(f.k==="p")d*=3;return d}
function foeAtk(f){const o=fObj(f);if(f.k==="zed")return o&&o.weak?-1:1;return Math.floor(o.sk.fight*1.5)+(npcGun(o)?3:Math.min(3,Math.round(npcArm(o)/3)))-(o.health<30?2:0)}
function foeDef(f){const o=fObj(f);const off=f.stun>0?-3:0;if(f.k==="zed")return(o&&o.weak?-3:0)+off;return Math.floor(o.sk.fight)+(f.intent==="defend"?6:0)+off}
function fReach(f){if(f.out)return false;if(wKind()==="gun"||f.gap===0)return true;return f.gap===1&&(ITEMS[weapon()?.id]?.reach||0)>=2.2}
function fTarget(){const F=UI.fight;if(!F)return null;const L=fActive(F).filter(fReach);return L.find(f=>f.id===F.sel)||L[0]||null}
function fShoveMod(){const pl=S.player;return Math.floor(pl.sk.fight)+(armor()>=3?1:0)-(pl.energy<10?3:0)-(armPower()<1?2:0)}
function fShoveDef(f){const o=fObj(f);return f.k==="zed"?(o&&o.weak?-3:0):Math.floor(o.sk.fight)}
function fRunners(){return fActive(UI.fight).filter(f=>f.gap===0&&!(f.stun>0)&&!(f.k==="p"&&f.intent==="flee"))}
function fRunMod(){const pl=S.player;return Math.floor(pl.sk.survive||0)+(canRun()?2:-5)-(pl.energy<10?4:0)-(weight()>maxW()?3:0)-(UI.fight&&fActive(UI.fight).some(f=>f.grab)?4:0)}
function fRunDef(f){const o=fObj(f);return f.k==="zed"?(o&&o.weak?-3:0):Math.floor(o.sk.fight)+(o.tr.brave>.6?1:0)}
function fTalkMod(p){return S.player.sk.speak*2+(feel(p)>0?3:0)-(UI.fight&&UI.fight.you?3:0)}
function fTalkDef(p){return 4+Math.round(p.tr.temper*6)-(p.health<50?2:0)+(p.tr.brave>.7?1:0)}

// ---------- how it reads ----------
function fx(s,f,a){return s.replace(/\{(T|he|him|his|w|A)\}/g,(m,k)=>esc(k==="T"?f?.name:k==="A"?a?.name:k==="w"?wNoun():f?.[k]))
  .replace(/(^|[.!?]["”]? +)([a-z])/g,(m,x,y)=>x+y.toUpperCase())}
function fDie(r){return`<b class="die${r.d===20?" n20":r.d===1?" n1":""}">${r.d}</b>${r.m?`<i>${r.m>0?"+":"−"}${Math.abs(r.m)} = ${r.t}</i>`:""}`}
function fWho(f){return f.k==="zed"?(f.known?f.name:"it"):f.name.startsWith("the ")?"them":f.name}
function fVs(a,b,la,lb){const B=Array.isArray(b)?b:[b];return` <span class="dice" title="Both sides roll a d20 and add their edge. The higher total wins, and a tie goes to whoever is defending."><i class="who">${esc(la)}</i> ${fDie(a)} <i>vs</i> <i class="who">${esc(lb)}</i> ${B.map(fDie).join(" ")}</span>`}
function flog(h,w="sys"){const F=UI.fight;F.log.push({h,w});if(F.log.length>80)F.log.splice(0,F.log.length-80)}
const FSWING={fist:["You throw a punch at {T}.","You swing at {T} with your bare hands."],stab:["You drive your {w} at {T}.","You go for {T} with the {w}."],
  chop:["You bring the {w} down at {T}.","You swing the {w} at {T}."],blunt:["You swing your {w} at {T}.","You put your weight behind the {w} and swing at {T}."],
  poke:["You jab the {w} at {T}.","You thrust the {w} at {T} and keep your distance."],gun:["You fire at {T}.","You aim at {T} and squeeze the trigger."],butt:["Out of bullets, you swing the pistol at {T} like a hammer."]};
const FMISS={zed:["You miss.","{T} lurches at the wrong moment and you miss.","It glances off {his} shoulder.","You swing wide."],p:["{T} slips it.","{T} blocks it.","You miss.","{T} twists away."],gun:["The shot goes wide.","You miss. The shot echoes off everything."]};
const ZHIT=["{he} staggers but keeps coming.","It lands. {he} rocks back and comes on again.","You feel it connect. {he} barely notices.","{he} reels, then turns back to you."];
const ZHIT_BIG=["{he} goes down, then starts dragging {him}self back up.","That one nearly finishes {him}. {he} gets back up anyway."];
const ZKILL={fist:["You get {him} on the ground and keep at it until {he} stops moving.","It takes too long, but {he} stops moving."],stab:["The blade goes in under the jaw. {T} drops.","You find the soft spot behind the ear. {T} goes still."],
  chop:["The {w} splits {his} skull. {T} drops.","One clean blow. {T} falls and stays down."],blunt:["{his} skull gives. {T} drops.","A wet crack, and {T} folds to the ground."],
  poke:["The point goes in through the eye. {T} slides off the end of it.","You pin {him} and push. {T} stops moving."],gun:["The shot takes {him} in the head. {T} drops.","{T} jerks and falls and doesn't move."],butt:["You bring the pistol down again and again. {T} stops moving."]};
const ZKILL_A=["{A} puts {T} down.","{A} drives {T} into the ground. {he} stays down.","{A} finishes {T}."],ZHIT_A=["{A} hits {T}. {he} staggers.","{A} lands a blow on {T}."];
const PHIT={fist:["You catch {T} on the jaw.","Your fist lands in {T}'s ribs.","You clip {T} across the face."],stab:["The {w} opens a cut along {T}'s arm.","You cut {T}. {he} grabs at the wound."],
  chop:["The {w} bites into {T}'s shoulder.","You hit {T} hard with the {w}."],blunt:["The {w} cracks into {T}'s ribs.","You catch {T} across the arm with the {w}."],
  poke:["The {w} catches {T} in the side.","You jab {T} hard with the {w}."],gun:["The shot hits {T} in the side. {he} screams.","The bullet takes {T} in the leg."],butt:["You crack the pistol across {T}'s face."]};
const PHIT_A=["{A} hits {T} hard.","{A} lands one on {T}."],PKILL=["{T} goes down and doesn't get up.","{T} crumples. {he}'s not breathing.","{T} falls, and it's over."],PKILL_A=["{T} goes down under {A}'s blows and doesn't get up."];

// ---------- starting one ----------
function fightCooling(){return performance.now()<(W3.fightCd||0)}
function startFight(o={}){const pl=S&&S.player;if(!pl||pl.alive===false||UI.modal||UI.create)return false;
  const F0=UI.fight;if(F0&&!F0.over){if(o.zed&&!F0.foes.some(f=>f.id===o.zed.id)){const f=zedFoe(o.zed,F0);F0.foes.push(f);flog(fx("{T} joins in.",f),"them");render()}return true}
  if(UI.drag&&typeof cancelDrag==="function")cancelDrag();cancelWalk();if(W3.task)cancelTask(o.them?"Something grabs at you. You drop what you were doing.":null);if(UI.talkTo)closeTalk(true);UI.panel=null;UI.open=null;W3.keys={};W3.run=false;UI.atkArm=null;
  const F={foes:[],allies:[],log:[],round:1,sel:null,you:!o.them,hits:0,kills:0,ask:null,over:null,def:false,bit:false,hp0:pl.hp,cause:"the dead"};UI.fight=F;const pn=pl.name;
  if(o.person){const p=o.person;const f=personFoe(p,F);F.foes.push(f);F.cause=`a fight with ${fullName(p)}`;fCloseIn(p,1.1);
    const seen=fWitnesses(p);
    if(o.them)flog(o.line?`${fx("{T}",f)}: “${esc(o.line)}”`:fx(pick(["{T} squares up to you.","{T} comes at you."]),f),"them");
    else{p.trust=clamp(p.trust-30,-100,100);p.aff=clamp(p.aff-25,-100,100);p.fear=Math.min(100,(p.fear||0)+30);p.follow=false;mem(p,`${pn} attacked me. No warning.`,-12);
      bubble(p,styleSay(p,pick(["What the hell?!","Whoa! What are you doing?","Get off me!","Are you out of your mind?"])),1.8);
      flog(fx(pick(["You go for {T}.","You round on {T} without a word.","You lunge at {T}."]),f),"you");
      for(const q of seen){q.trust=clamp(q.trust-12,-100,100);if(q.met)q.aff=clamp(q.aff-8,-100,100);q.fear=Math.min(100,(q.fear||0)+15);mem(q,`${pn} attacked ${q.fam[p.id]?"my "+q.fam[p.id]:fullName(p)} out of nowhere.`,-6)}
      if(seen.length)news(`${pn} attacked ${fullName(p)}${whereAt(p)}.`,"bad",[p.id]);
      // their own people don't just stand there and watch
      for(const q of seen){if(F.foes.length>=3)break;const close=q.fam[p.id]||q.partner===p.id||q.group&&q.group===p.group;
        if(close&&q.age>=16&&q.health>40&&q.tr.brave>.45&&!isFollower(q)){const g=personFoe(q,F);F.foes.push(g);fCloseIn(q,1.4);q.trust=clamp(q.trust-15,-100,100);flog(fx(pick([`{T} steps in beside ${esc(f.name)}.`,"{T} isn't going to watch this. {he} comes at you too."]),g),"them")}}}
    // who stands with you
    for(const q of W3.followers){if(!q.alive||q.age<16||F.foes.some(f=>f.id===q.id)||dist(q.x,q.z,pl.x,pl.z)>8)continue;
      const tied=F.foes.some(f=>{const r=P(f.id);return q.fam[f.id]||q.partner===f.id||q.group&&r.group===q.group});
      if(o.them&&!tied&&feel(q)>0)F.allies.push(q.id);else flog(`${esc(q.name)} doesn't move to help you.`,"sys")}}
  else{const z=o.zed;const f=zedFoe(z,F);if(o.them||wKind()!=="gun"||f.gap===0){f.gap=0;fPlace(f)}F.foes.push(f);for(const q of fNearZeds(z))if(F.foes.length<6)F.foes.push(zedFoe(q,F));
    for(const q of W3.followers)if(q.alive&&q.age>=14&&dist(q.x,q.z,pl.x,pl.z)<8)F.allies.push(q.id);
    if(f.known)flog(fx("It's {T}. What's left of {him}.",f),"sys");
    if(o.them){flog(fx(pick(["{T} gets {his} hands on you.","{T} comes at you out of nowhere.","{T} lunges for you."]),f),"them");fZedTurn(f,true)}
    else flog(fx(pick(["You square up to {T}.","You go for {T} first.","You step in on {T}."]),f),"you");
    const n=F.foes.length-1;if(n)flog(n===1?"There's another one right behind it.":`${cap(numWord(n))} more are right behind it.`,"sys")}
  if(S.player.hp<=0){fightLost();return true}
  fPlan();render();return true}
function fCloseIn(o,want){const pl=S.player;const d=dist(o.x,o.z,pl.x,pl.z);if(d<=want+.3)return;const s=d-want;step(o,(pl.x-o.x)/d*s,(pl.z-o.z)/d*s,.27,"npc");o.tx=o.x;o.tz=o.z;o.path=null}
function fPlace(f){const z=fObj(f);const pl=S.player;if(!z)return;const d=dist(z.x,z.z,pl.x,pl.z)||.01;const s=d-(f.gap===0?.95:1+f.gap*1.4);if(Math.abs(s)>.05)step(z,(pl.x-z.x)/d*s,(pl.z-z.z)/d*s,.3,"zed")}
function fNudge(z,m){const pl=S.player;const d=dist(z.x,z.z,pl.x,pl.z)||.01;step(z,(z.x-pl.x)/d*m,(z.z-pl.z)/d*m,.3,"zed")}
function fFace(o){const pl=S.player;if(o)W3.ang=Math.atan2(o.x-pl.x,o.z-pl.z)}

// ---------- a round: you, then the people with you, then them ----------
function fightAct(a){const F=UI.fight;const pl=S.player;if(!F||F.over||F.ask||pl.alive===false)return;
  const t=fTarget();F.def=a==="defend";F.countered=false;F.log.push({rd:F.round});
  pl.energy=Math.max(0,pl.energy-({attack:.8,shove:.7,run:1.6,defend:.3,talk:.1}[a]??.3));
  if(a==="attack"){if(t)youAttack(t);else{F.def=true;flog("Nothing is close enough to hit. You keep your guard up and wait.","sys")}}
  else if(a==="defend")flog(pick(["You set your feet and keep your guard up.","You hold your ground and wait for it.","You brace yourself."]),"you");
  else if(a==="shove"){if(t&&t.gap===0)youShove(t);else{F.def=true;flog("There's nothing in reach to shove. You keep your guard up.","sys")}}
  else if(a==="run"){if(youRun()){skillUp("survive",.05);return endFight("ran")}}
  else if(a==="talk"){if(youTalk()==="all"){skillUp("speak",.1);return endFight("talked")}}
  if(fightOver())return;
  fAllies();if(fightOver())return;
  for(const f of fActive(F)){fFoeTurn(f);if(pl.hp<=0)return fightLost()}
  fDrift();F.round++;fPlan();
  if(fightOver())return;render()}
function fightOver(){const F=UI.fight;if(!F)return true;if(S.player.hp<=0){fightLost();return true}if(!fActive(F).length){endFight("won");return true}return false}
function youAttack(f){const F=UI.fight;const pl=S.player;const o=fObj(f);if(!o)return;const k=wKind();fFace(o);W3.swing=.2;
  const a=fRoll(youAtk(f)),b=fRoll(foeDef(f));let s=fx(pick(FSWING[k]),f);
  if(k==="gun"){noise(pl.x,pl.z,45);W3.flash=.07}else noise(pl.x,pl.z,6);
  if(!fBeats(a,b))s+=" "+fx(pick(FMISS[k==="gun"?"gun":f.k==="zed"?"zed":"p"]),f);
  else{const crit=a.d===20||a.t-b.t>=10;F.hits++;s+=" "+fHurt(f,youDmg(f,crit,k),crit,null,k);const br=wearWeapon(1);if(br)s+=" "+esc(br.trim())}
  if(k==="gun")invTake("ammo");flog(s+fVs(a,b,"you",fWho(f)),"you")}
// damage to one of them; returns how it reads
function fHurt(f,d,crit,by,k=wKind()){const F=UI.fight;const o=fObj(f);const pl=S.player;if(!o)return"";
  if(f.k==="zed"){o.hp-=d;o.st="chase";zst(o).tgt=pl;
    if(o.hp<=0){f.out="dead";F.kills++;const s=fx(pick(by?ZKILL_A:ZKILL[k]),f,by);if(by)by.kills=(by.kills||0)+1;killZed(o,!by);return s}
    return fx(pick(by?ZHIT_A:crit?ZHIT_BIG:ZHIT),f,by)}
  // a person: bare hands can knock someone out, but they won't kill them
  const fists=!by&&k==="fist";o.health=Math.max(fists?6:-50,o.health-d);o.fear=Math.min(100,(o.fear||0)+15);bubble(o,pick(["Agh!","*grunts*","Ugh!","Ow! God!"]),1.2);
  if(o.health<=0){f.out="dead";const s=fx(pick(by?PKILL_A:PKILL),f,by);fPersonDies(f,o,by,false);return s}
  if(fists&&o.health<=8){f.out="gave up";f.ko=true;return fx(pick(PHIT.fist),f)+" "+fx(pick(["{T} goes down hard and stays down, dazed.","{T} hits the ground and doesn't try to get up."]),f)}
  return fx(pick(by?PHIT_A:PHIT[k]),f,by)}
function youShove(f){const o=fObj(f);fFace(o);W3.swing=.15;const a=fRoll(fShoveMod()),b=fRoll(fShoveDef(f));
  if(fBeats(a,b)){f.stun=1;let s;if(f.k==="zed"&&f.grab){f.grab=null;f.gap=Math.max(f.gap,1);fPlace(f);s=pick(["You break {his} grip and shove {him} back.","You tear loose and plant a foot in {his} chest."])}else if(f.k==="zed"){f.gap=Math.max(f.gap,1);fPlace(f);s=pick(["You plant a foot in {T}'s chest and shove. {he} stumbles back out of reach.","You shove {T} off you. {he} staggers back."])}
    else s=pick(["You shove {T} hard. {he} stumbles back, off balance.","You drive your shoulder into {T}. {he} staggers."]);flog(fx(s,f)+fVs(a,b,"you",fWho(f)),"you")}
  else flog(fx(f.k==="zed"?pick(["You shove, but {T} hangs on.","{T} doesn't budge."]):pick(["{T} plants {his} feet. You don't move {him}.","{T} shoves you right back."]),f)+fVs(a,b,"you",fWho(f)),"you")}
function youRun(){const L=fRunners();if(!L.length){flog(pick(["Nothing has hold of you. You back off and get clear.","You back away before anything can close on you."]),"you");return true}
  const a=fRoll(fRunMod()),bs=L.map(f=>fRoll(fRunDef(f)));const ok=bs.every(b=>fBeats(a,b));
  if(ok){flog(pick(["You break away and run.","You tear free and get clear.","You duck out of reach and run for it."])+fVs(a,bs,"you","them"),"you");return true}
  flog((canRun()?pick(["You try to break away, but you can't get clear.","You turn to run and get dragged back.","You can't find an opening."]):"Your leg won't let you run.")+fVs(a,bs,"you","them"),"you");return false}
function youTalk(){const F=UI.fight;const L=fActive(F).filter(f=>f.k==="p");if(!L.length){flog("There's no one here to talk to.","sys");return null}
  const f=L[0],p=fObj(f);const a=fRoll(fTalkMod(p)),b=fRoll(fTalkDef(p));
  const said=pick(F.you?["Stop. Stop! I'm done. I'm sorry.","Okay! Enough. I was wrong. We're done."]:["Hey. Hey! This isn't worth it.","Look at us. The dead are out there and we're doing this?","Back off. Nobody needs to die today."]);
  if(fBeats(a,b)){for(const g of L)g.out="backed off";const s=styleSay(p,pick(F.you?["...You're lucky I don't finish this.","Get away from me. Now."]:["...Fine. It's not worth it.","*breathing hard* Yeah. Okay. We're done.","...Yeah. Fine."]));
    bubble(p,s,2.4);flog(`You: “${esc(said)}”<br>${fx("{T}",f)}: “${esc(s)}”`+fVs(a,b,"you",fWho(f)),"good");F.talked=f.id;return fActive(F).length?"some":"all"}
  flog(`You: “${esc(said)}”<br>`+fx(pick(["{T} isn't listening.","{T} spits. “Too late for that.”","{T} shakes {his} head and keeps coming."]),f)+fVs(a,b,"you",fWho(f)),"you");return null}
function fAllies(){const F=UI.fight;for(const id of [...F.allies]){const q=P(id);if(!q||!q.alive){F.allies=F.allies.filter(x=>x!==id);continue}
  const L=fActive(F).filter(f=>f.gap===0);if(!L.length)continue;const f=L.find(g=>g.id===F.sel)||pick(L);const arm=npcArm(q);
  const a=fRoll(Math.floor(q.sk.fight*1.5)+Math.min(3,Math.round(arm/3))),b=fRoll(foeDef(f));
  if(!fBeats(a,b)){flog(fx(pick(["{A} swings at {T} and misses.","{A} goes for {T} but can't land it."]),f,q)+fVs(a,b,q.name,fWho(f)),"ally");continue}
  const crit=a.d===20||a.t-b.t>=10;let d=(Math.max(arm,2)*1.2+2+q.sk.fight*.6)*(.8+rf()*.4)*(crit?1.6:1);if(f.k==="p")d*=3;flog(fHurt(f,d,crit,q)+fVs(a,b,q.name,fWho(f)),"ally")}}
function fFoeTurn(f){const o=fObj(f);if(!o||f.k==="p"&&!o.alive){f.out="gone";return}
  if(f.stun>0){f.stun--;flog(fx(pick(["{T} is still getting {his} feet under {him}.","{T} is off balance."]),f),"them");return}
  if(f.k==="zed"){if(f.gap>0){f.gap--;fPlace(f);flog(fx(f.gap===0?pick(["{T} closes in.","{T} reaches you."]):pick(["{T} keeps coming.","{T} shambles closer."]),f),"them");return}fZedTurn(f,false);return}
  if(f.intent==="defend"){flog(fx(pick(["{T} keeps {his} guard up.","{T} circles, waiting.","{T} hangs back and watches you."]),f),"them");return}
  if(f.intent==="flee"){fFlee(f);return}
  fPersonSwing(f)}
// one of the dead goes for you, or now and then for someone beside you
function fZedTurn(f,first){const F=UI.fight;const z=fObj(f);const pl=S.player;if(!z)return;
  const al=F.allies.map(P).filter(q=>q&&q.alive);
  if(!first&&al.length&&rf()<.3){const q=pick(al);const a=fRoll(foeAtk(f)),b=fRoll(Math.floor(q.sk.fight)+(npcArm(q)>=6?1:0));
    if(!fBeats(a,b)){flog(fx(`{T} grabs at {A}, who shakes free.`,f,q)+fVs(a,b,fWho(f),q.name),"them");return}
    q.health-=rnd(4,10);q.fear=Math.min(100,(q.fear||0)+20);q.seen=S.t;bubble(q,pick(["Get off me!","Help!","*screams*"]),1.4);let s=fx(`{T} gets hold of {A}.`,f,q);
    if(!q.bitten&&!z.weak&&a.t-b.t>=10&&rf()<.3){q.bitten=S.t+rnd(6,30)*60;tally("bit near you (with you)");mem(q,"I got bit. I haven't told anyone.",-10,q.id);s+=` ${esc(q.name)} cries out.`}
    if(q.health<=0){kill(q,`was killed by the dead${whereAt(q)}`);if(rf()<.7)riseLater(q,rnd(3,12));F.allies=F.allies.filter(id=>id!==q.id);journal(`${q.name} died beside you.`,"bad");s+=` ${esc(q.name)} goes down under it and doesn't get up.`}
    flog(s+fVs(a,b,fWho(f),q.name),"bad");return}
  fFace(z);
  // it already has hold of you, so this time it goes for the bite; clothes on that spot can still save you
  if(f.grab){const part=f.grab;f.grab=null;const a=fRoll(foeAtk(f)),b=fRoll(youDef(F.def));
    if(!fBeats(a,b)){flog(fx(F.def?"You get your forearm under {his} jaw and shove {him} off.":pick(["You twist free before {he} can bite.","You wrench loose just as {his} teeth snap shut."]),f)+fVs(a,b,fWho(f),"you"),"them");if(F.def&&b.t-a.t>=6&&!F.countered){F.countered=true;fCounter(f)}return}
    const ar=partArmor(part),gs=partGear(part),at=BODY[part].n;pl.hp=Math.max(0,pl.hp-rnd(2,5));W3.hurt=.35;
    if(rf()<1-Math.min(ar,8)/9){addWound("bite",part,{why:"the dead"});if(!pl.bitten)pl.bitten=S.t;F.bit=true;pl.bleeding=+bleedTotal().toFixed(2);
      flog(`<b>${fx("{T} bites down on your "+at+".",f)}</b> You've been bitten.`+fVs(a,b,fWho(f),"you"),"bad");
      journal(`Teeth, through ${gs?"your "+ITEMS[gs.g.id].n.toLowerCase():"bare skin"} and into your ${at}. You've been bitten. You know what that means. You have a day, maybe two.`,"bad")}
    else{const gn=gs?ITEMS[gs.g.id].n.toLowerCase():"sleeve";if(gs){gs.g.dur-=8;if(gs.g.dur<=0){breakSlot(gs.s);journal(`Your ${gn} is torn to rags.`,"bad")}}
      flog(fx(`{T} bites down on your ${at}, and the teeth catch in your ${gn}. They don't get through.`,f)+fVs(a,b,fWho(f),"you"),"them")}
    return}
  const a=fRoll(foeAtk(f)),b=fRoll(youDef(F.def));
  if(!fBeats(a,b)){flog(fx(F.def?pick(["You catch {him} on your forearm and shove {him} off.","You keep your arms up. {he} gets nothing."]):pick(["You twist out of {his} grip.","{his} hands close on air.","You keep {him} off you."]),f)+fVs(a,b,fWho(f),"you"),"them");
    if(F.def&&b.t-a.t>=6&&!F.countered){F.countered=true;fCounter(f)}return}
  // hands, nails, weight: a hit hurts, and a big one means it has hold of you for its next try
  const crit=a.d===20;const R=zedWound(z,0);const w=R.w;const dmg=Math.max(1,rnd(3,8)-R.ar*.45)*(crit?1.4:1);
  pl.hp=Math.max(0,pl.hp-dmg);const B=body();B.ache=Math.min(60,(B.ache||0)+dmg*1.5);W3.hurt=.35;
  const gs=partGear(w.p);if(gs){gs.g.dur-=3;if(gs.g.dur<=0){breakSlot(gs.s);journal(`Your ${ITEMS[gs.g.id].n.toLowerCase()} is torn to rags.`,"bad")}}
  pl.bleeding=+bleedTotal().toFixed(2);
  if(a.t-b.t>=13&&!z.weak){f.grab=w.p;flog(esc(hitLine(w))+` <b>${fx("{T} has hold of your "+BODY[w.p].n+".",f)}</b>`+fVs(a,b,fWho(f),"you"),"bad")}
  else flog(esc(hitLine(w))+fVs(a,b,fWho(f),"you"),"bad")}
function fCounter(f){const F=UI.fight;const o=fObj(f);if(!o||f.out)return;F.hits++;const k=wKind()==="gun"?"butt":wKind();flog(fx(pick(["You turn it aside and hit back.","You see it coming, slip it, and hit back."]),f)+" "+fHurt(f,youDmg(f,false,k),false,null,k),"you")}
function fPersonSwing(f){const F=UI.fight;const p=fObj(f);const pl=S.player;const gun=npcGun(p);const arm=gun?20:npcArm(p);fFace(p);
  const blade=!gun&&Object.keys(p.pack||{}).some(k=>ITEMS[k]&&ITEMS[k].slot==="weapon"&&ITEMS[k].tool==="knife"&&ITEMS[k].dmg===arm);
  if(gun){packTake(p,"ammo");noise(p.x,p.z,40)}
  const a=fRoll(foeAtk(f)),b=fRoll(youDef(F.def));
  let s=fx(gun?pick(["{T} fires at you.","{T} gets a shot off at you."]):blade?pick(["{T} comes at you with a knife.","{T} slashes at you."]):arm?pick(["{T} swings at you.","{T} comes at you swinging."]):pick(["{T} throws a punch.","{T} swings at you."]),f);
  if(!fBeats(a,b)){s+=" "+(F.def?pick(["You block it.","You take it on your arms."]):gun?pick(["It goes wide.","The shot cracks past your ear."]):pick(["You duck it.","You slip it.","It goes wide."]));
    flog(s+fVs(a,b,fWho(f),"you"),"them");if(F.def&&b.t-a.t>=6&&!F.countered){F.countered=true;fCounter(f)}return}
  const crit=a.d===20||a.t-b.t>=10;const n=((arm||2)*1.2+2+p.sk.fight*.6)*1.2*(.8+rf()*.4)*(crit?1.5:1);
  const w=hurtPlayer(n,gun?"shot":blade?"knife":"fight");W3.hurt=.35;pl.bleeding=+bleedTotal().toFixed(2);
  flog(s+" "+(w?esc(hitLine(w)):pick(["It knocks the wind out of you.","It rocks you."]))+fVs(a,b,fWho(f),"you"),"bad")}
function fFlee(f){const p=fObj(f);const pl=S.player;const a=fRoll(2+Math.floor(p.sk.survive||0)),b=fRoll(Math.floor(pl.sk.fight)-(canRun()?0:4));
  if(fBeats(a,b)){f.out="fled";p.fear=100;p.follow=false;goHome(p);bubble(p,pick(["*runs*","Get away from me!"]),1.4);flog(fx(pick(["{T} breaks away and runs.","{T} bolts.","{T} turns and runs for it."]),f)+fVs(a,b,fWho(f),"you"),"them")}
  else flog(fx(pick(["{T} tries to run. You cut {him} off.","{T} turns to run, and you're on {him} before {he} gets a step."]),f)+fVs(a,b,fWho(f),"you"),"them")}
// the dead nearby hear it and come; a round is a few seconds
function fDrift(){const F=UI.fight;const pl=S.player;const inF=new Set(F.foes.map(f=>f.id));
  for(const z of S.zeds){if(inF.has(z.id)||z.stun>0||Math.abs(z.x-pl.x)>14||Math.abs(z.z-pl.z)>14)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d>14)continue;const Z=zst(z);
    if(!(z.st==="chase"&&Z.tgt===pl||z.st==="hunt"&&dist(z.tx,z.tz,pl.x,pl.z)<12||d<3)||!losClear(z.x,z.z,pl.x,pl.z))continue;
    const s=Math.min(2.2,d-1);if(s>0)step(z,(pl.x-z.x)/d*s,(pl.z-z.z)/d*s,.3,"zed");
    if(dist(z.x,z.z,pl.x,pl.z)<=5.5&&fActive(F).length<6){z.st="chase";Z.tgt=pl;const f=zedFoe(z,F);F.foes.push(f);flog(fx(pick(["{T} comes out of nowhere.","Another one: {T}.","{T} heard the noise. {he}'s coming."]),f),"them")}}}
// what each person means to do this round, which you can read on them before you choose
function fPlan(){const F=UI.fight;const dead=fActive(F).some(f=>f.k==="zed");
  for(const f of fActive(F)){if(f.k!=="p")continue;const p=fObj(f);if(!p||!p.alive){f.out="gone";continue}
    const proud=p.tr.brave>.8&&p.tr.temper>.6;
    if(p.health<=(proud?10:25)){f.out="gave up";f.intent="surrender";const s=styleSay(p,pick(["Okay! Okay. Stop. I'm done.","Enough! You win. Just... enough.","*hands up* Take whatever you want. Please."]));bubble(p,s,2.4);flog(fx("{T} drops to {his} knees with {his} hands up.",f)+` “${esc(s)}”`,"good");continue}
    if(dead||p.health<40&&p.tr.brave<.5){f.intent="flee";continue}
    f.intent=rf()<(1-p.tr.temper)*.35+(p.health<60?.15:0)?"defend":"attack"}
  const t=fTarget();if(t)F.sel=t.id}

// ---------- how it ends ----------
function fPersonDies(f,p,by,finished){const F=UI.fight;const pl=S.player;const pn=pl.name;const seen=fWitnesses(p);const where=whereAt(p);
  kill(p,seen.length?`was killed by ${by?fullName(by):pn}${where}`:`was found dead${where}`);if(!finished&&rf()<.5)riseLater(p,rnd(5,15));
  tally(by?"killed by someone with you":"killed a person");if(!by)S.stats.pkills=(S.stats.pkills||0)+1;
  for(const q of seen){const bad=F.you;q.trust=clamp(q.trust-(bad?25:6),-100,100);q.aff=clamp(q.aff-(bad?15:3),-100,100);
    mem(q,bad?`I watched ${pn} kill ${fullName(p)}.`:`${pn} killed ${fullName(p)}. ${p.name} started it, but still.`,bad?-10:-3);
    const rel=q.fam[p.id]||(q.partner===p.id?"partner":null);if(rel){q.trust=clamp(q.trust-60,-100,100);q.aff=clamp(q.aff-60,-100,100);mem(q,`${pn} killed my ${rel}. I saw it happen.`,-20)}
    else if(q.group&&q.group===p.group)q.trust=clamp(q.trust-20,-100,100)}}
function fPackLine(p){const L=Object.entries(p.pack||{}).filter(([k,n])=>ITEMS[k]&&n>0);if(!L.length)return"They don't have much";const w=L.slice(0,3).map(([k,n])=>itemPhrase(k,n));return cap(w.join(", "))+(L.length>3?", and more":"")}
function fRob(p){const got=[];for(const [k,n] of Object.entries(p.pack||{})){if(!ITEMS[k]||n<=0)continue;invAdd(k,n,true);got.push(itemPhrase(k,n))}p.pack={};return got}
function fDecide(c){const F=UI.fight;const f=F&&F.foes.find(g=>g.id===F.ask);if(!f)return;const p=fObj(f);const pl=S.player;
  if(c==="finish"&&wKind()==="fist"){toast("Not with your bare hands.");return}
  f.done=true;F.ask=null;F.log.push({rd:0});
  if(c==="spare"){f.fate="spared";flog(fx(pick(["You step back and let {T} go.","You lower your {w}. “Go.” {T} goes."]),f),"you");p.trust=clamp(p.trust+(F.you?6:4),-100,100);
    mem(p,F.you?`${pl.name} beat me, then let me go.`:`I went after ${pl.name} and lost. They let me walk away.`,F.you?-4:2);goHome(p)}
  else if(c==="rob"){f.fate="robbed";const got=fRob(p);flog(got.length?`You take everything ${esc(f.name)} has on ${esc(f.him)}: ${esc(got.join(", "))}.`:fx("You go through {T}'s pockets. Nothing worth taking.",f),"you");
    p.trust=clamp(p.trust-15,-100,100);p.aff=clamp(p.aff-15,-100,100);mem(p,`${pl.name} beat me and took everything I had.`,-12);bubble(p,styleSay(p,pick(["...That's everything I had.","Take it. I hope it chokes you."])),2.2);goHome(p)}
  else{f.fate="killed";f.out="dead";flog(fx(pick(["You finish it. {T} stops moving. It's quieter than you thought it would be.","You make sure {he} won't get back up."]),f),"bad");fPersonDies(f,p,null,true)}
  endFight("won")}
function endFight(how){const F=UI.fight;if(!F||F.over)return;const pl=S.player;
  if(how==="won"){const s=F.foes.find(f=>f.out==="gave up"&&!f.done&&fObj(f)?.alive);if(s){F.ask=s.id;render();return}}
  F.over=how;F.ask=null;W3.fightCd=performance.now()+2500;W3.acc+=Math.min(3,F.round*.1);W3.keys={};
  // whatever is still standing loses you for a moment
  for(const f of F.foes){if(f.k!=="zed"||f.out)continue;const z=fObj(f);if(z){z.stun=1.8+rf()*.8;fNudge(z,1.6)}}
  if(F.hits)skillUp("fight",Math.min(.3,.04*F.hits));
  fAftermath(how);F.sum=fSummary(how);render()}
function fAftermath(how){const F=UI.fight;const pl=S.player;const pn=pl.name;const ppl=F.foes.filter(f=>f.k==="p");if(!ppl.length)return;
  for(const f of ppl){const p=P(f.id);if(!p||!p.alive)continue;
    if(F.you){if(p.partner==="you"){p.partner=null;pl.partner=null;pl.trying=false;journal(`You and ${p.name} are finished. You saw it in ${f.his} face.`,"bad")}
      if(how==="ran")mem(p,`${pn} came at me and then ran off.`,-3);
      const seen=fWitnesses(p);for(const q of living())if(q!==p&&(q.fam[p.id]||q.group&&q.group===p.group)&&!seen.includes(q)){q.trust=clamp(q.trust-(q.fam[p.id]?20:8),-100,100);mem(q,`${pn} attacked ${q.fam[p.id]?"my "+q.fam[p.id]:p.name}.`,-6)}}
    else if(!f.fate&&how!=="ran"&&f.out!=="backed off")mem(p,`I went after ${pn} and lost.`,-3);
    if(F.talked===p.id)mem(p,F.you?`${pn} jumped me, then tried to talk their way out of it.`:`${pn} talked me down when I was ready to fight.`,F.you?-6:3)}
  journal(fSummary(how),F.foes.some(f=>f.fate==="killed"||f.out==="dead"&&f.k==="p")?"bad":"")}
function fSummary(how){const F=UI.fight;const pl=S.player;const zk=F.foes.filter(f=>f.k==="zed"&&f.out==="dead");const ppl=F.foes.filter(f=>f.k==="p");const lost=Math.round(F.hp0-pl.hp);
  const hurt=F.bit?"And you've been bitten.":lost>=20?"You're hurt.":lost>0?"You took a few knocks.":"Not a scratch on you.";
  if(how==="ran")return ppl.length?`You got away from ${ppl.map(f=>f.name).join(" and ")}. ${hurt}`:`You got away. They're still out there. ${hurt}`;
  if(how==="talked"&&!zk.length)return`${cap(ppl[0].name)} backed off. It's over. ${hurt}`;
  const bits=[];if(zk.length)bits.push(zk.length===1?`You put ${zk[0].name} down.`:`You put ${numWord(zk.length)} of the dead down.`);
  for(const f of ppl){const n=cap(f.name);bits.push(f.fate==="spared"?`You let ${f.name} go.`:f.fate==="robbed"?`You took everything ${f.name} had.`:f.out==="dead"?`${n} is dead.`:f.out==="fled"?`${n} ran off.`:f.out==="backed off"?`${n} backed off.`:`${n} gave up.`)}
  return`${bits.join(" ")} ${hurt}`.trim()}
function fightLost(){const F=UI.fight;UI.fight=null;W3.keys={};die(F?F.cause:"the dead")}
function closeFight(){if(!UI.fight||!UI.fight.over)return;UI.fight=null;W3.keys={};save();render()}

// ---------- the screen ----------
function fIntent(f){if(f.out)return{dead:f.k==="zed"?"Down":"Dead",fled:"Ran off","gave up":f.ko?"Knocked down":"Gave up","backed off":"Backed off",gone:"Gone"}[f.out]||"";
  if(f.stun>0)return"Off balance";if(f.grab)return"Has hold of you";if(f.k==="zed")return f.gap===0?"Reaching for you":f.gap===1?"A step away":"Coming";
  const p=fObj(f);return{attack:p&&npcGun(p)?"Aiming at you":"About to swing",defend:"Guarding",flee:"Looking for a way out"}[f.intent]||""}
function fightHtml(F){const pl=S.player;const t=F.over||F.ask?null:fTarget();
  const foes=F.foes.map(f=>{const hp=f.out==="dead"?0:Math.max(0,fHp(f));const st=fIntent(f);const hot=!f.out&&(f.k==="zed"?f.gap===0&&!(f.stun>0):f.intent==="attack");const grip=!f.out&&f.grab;
    return`<button class="foe${t&&t.id===f.id?" sel":""}${f.out?" out":""}" data-act="ftarget" data-v="${esc(f.id)}"${f.out||F.over||F.ask?" disabled":""} aria-label="${esc(cap(f.name))}: ${esc(st)}"><span class="fn">${esc(cap(f.name))}</span><span class="mono ${grip?"neg":hot?"warn":"mute"}">${esc(st)}</span><span class="fbar"><i style="width:${Math.round(clamp(hp/f.max,0,1)*100)}%"></i></span></button>`}).join("");
  const al=F.allies.map(P).filter(q=>q&&q.alive);
  const log=F.log.slice(-40).map(e=>e.rd!=null?(e.rd?`<div class="flr">Round ${e.rd}</div>`:`<div class="flr">After</div>`):`<div class="fl ${e.w}">${e.h}</div>`).join("");
  const you=`<div class="fyou"><span>You</span><span class="fbar"><i style="width:${Math.round(clamp(pl.hp,0,100))}%"></i></span><span>${Math.round(pl.hp)}</span></div>
    <div class="mono mute fwho">${esc(cap(wNoun()))}${wKind()==="gun"?` · ${invCount("ammo")} rounds`:wKind()==="butt"?" · no rounds left":""}${armor()?` · armor ${armor()}`:""}${pl.energy<10?' · <span class="warn">exhausted</span>':""}${bleedTotal()>.03?' · <span class="neg">bleeding</span>':""}${pl.bitten?' · <span class="neg">bitten</span>':""}</div>`;
  let acts;
  if(F.over)acts=`<p class="fsum">${esc(F.sum||"")}</p><div class="facts one"><button class="btn pri" data-act="fclose">Back to it <small>Enter</small></button></div>`;
  else if(F.ask){const f=F.foes.find(g=>g.id===F.ask);const p=fObj(f);const fists=wKind()==="fist";
    acts=`<p class="fsum">${esc(cap(f.name))} has given up. What now?</p><div class="facts">${[["spare","Let them go",F.you?"They'll remember this either way":"They walk away"],["rob","Take their things",fPackLine(p)],["finish","Finish it",fists?"Not with your bare hands":"There's no taking it back"]].map(([v,l,s],i)=>`<button class="btn${v==="finish"?" danger":""}" data-act="fdecide" data-v="${v}"${v==="finish"&&fists?" disabled":""}><span><b class="fk">${i+1}</b> ${l}</span><small>${esc(s)}</small></button>`).join("")}</div>`}
  else{const L=fActive(F);const ppl=L.filter(f=>f.k==="p");const gun=wKind()==="gun";
    const near=L.filter(f=>f.gap===0&&!(f.stun>0)&&!(f.k==="p"&&f.intent!=="attack"));const worst=near.reduce((m,f)=>Math.max(m,foeAtk(f)),-99);
    const B=[];
    B.push(["attack",gun?"Shoot":"Attack",t?`${fPct(fOdds(youAtk(t),foeDef(t)))} to hit${L.length>1?" · "+esc(t.name):""}`:"Nothing in reach",!t]);
    B.push(["defend","Defend",near.length?`Their odds drop from ${fPct(fOdds(worst,youDef(false)))} to ${fPct(fOdds(worst,youDef(true)))}`:"Wait for them to come",false]);
    if(t&&t.gap===0)B.push(["shove",t.grab?"Break free":"Shove",`${fPct(fOdds(fShoveMod(),fShoveDef(t)))} · ${t.grab?"before it bites":"they lose a turn"}`,false]);else B.push(["shove","Shove","Nothing in reach",true]);
    const R=fRunners();B.push(["run","Run",`${fPct(fOddsAll(fRunMod(),R.map(fRunDef)))} to get away`,false]);
    if(ppl.length){const p=fObj(ppl[0]);B.push(["talk","Talk them down",`${fPct(fOdds(fTalkMod(p),fTalkDef(p)))} they back off`,false])}
    acts=`<div class="facts">${B.map(([v,l,s,dis],i)=>`<button class="btn${v==="attack"?" pri":""}" data-act="fact" data-v="${v}"${dis?" disabled":""}><span><b class="fk">${i+1}</b> ${l}</span><small>${s}</small></button>`).join("")}</div>`}
  return`<header><div><b>${F.over?"It's over":"Fight"}</b> <span class="mono mute">${F.over?"":"Round "+F.round}</span></div><span class="mono mute">${F.over?"":"Time holds still until it's done"}</span></header>
  <div class="foes">${foes}</div>${al.length?`<div class="mono mute fwho">With you: ${al.map(q=>esc(q.name)+(q.health<40?' <span class="neg">(hurt)</span>':"")).join(", ")}</div>`:""}
  <div class="flog" id="flog" aria-live="polite">${log}</div>${you}${acts}`}
function renderFight(){const el=$("fight");if(!el)return;const F=UI.fight;const on=!!(F&&S&&S.player.alive!==false);const g=$("game");if(g)g.classList.toggle("fighting",on);
  if(!on){if(!el.hidden){el.hidden=true;el.innerHTML=""}return}
  el.hidden=false;el.innerHTML=fightHtml(F);const L=$("flog");if(L)L.scrollTop=L.scrollHeight}
function onFightAct(a,v){switch(a){
  case"fact":fightAct(v);return true;
  case"ftarget":if(UI.fight&&!UI.fight.over&&!UI.fight.ask){UI.fight.sel=v;render()}return true;
  case"fdecide":fDecide(v);return true;
  case"fclose":closeFight();return true;
  case"fattackp":armAttack(v);return true}
  return false}
// going after someone you're talking to takes two clicks, so it's never an accident
function armAttack(pid){const p=P(pid);const pl=S.player;if(!p||!p.alive||p.age<18)return;
  if(dist(p.x,p.z,pl.x,pl.z)>2.6){toast(`You'd have to get closer to ${p.met?p.name:"them"} first.`);return}
  if(UI.atkArm===pid&&performance.now()-(UI.atkArmT||0)<4000){UI.atkArm=null;startFight({person:p});return}
  UI.atkArm=pid;UI.atkArmT=performance.now();renderTalk();setTimeout(()=>{if(UI.atkArm===pid){UI.atkArm=null;if(UI.talkTo===pid)renderTalk()}},4100)}
function fightKey(k,e){const F=UI.fight;if(!F)return;const onBtn=e.target&&e.target.tagName==="BUTTON";
  if(F.over){if(["enter"," ","escape","e"].includes(k)&&!onBtn){e.preventDefault();closeFight()}return}
  if(F.ask){const m={"1":"spare","2":"rob","3":"finish"}[k];if(m)fDecide(m);return}
  if(k===" "||k==="enter"){if(onBtn)return;e.preventDefault();fightAct("attack");return}
  if(["arrowleft","arrowright","arrowup","arrowdown"].includes(k)){e.preventDefault();const L=fActive(F).filter(fReach);if(L.length>1){const t=fTarget();const i=L.indexOf(t);F.sel=L[(i+(k==="arrowleft"||k==="arrowup"?L.length-1:1))%L.length].id;render()}return}
  const btn=[...document.querySelectorAll('#fight [data-act=fact]')][+k-1];if(btn&&!btn.disabled)fightAct(btn.dataset.v)}
