// ================= what you do =================
const pl_=()=>S.player;
function localPeople(){const pl=pl_();return S.people.filter(p=>p.loc===pl.loc&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out))}
function nearestPerson(f){const pl=pl_();let b=null,bd=1e9;for(const p of localPeople()){if(f&&!f(p))continue;const d=dist(p.x,p.z,pl.x,pl.z);if(d<bd){bd=d;b=p}}return b}
// people named in what you typed, nearest first
function namedIn(t){t=" "+t.toLowerCase().replace(/[^a-z' ]/g," ")+" ";const pl=pl_();const all=S.people.filter(p=>p.status!=="dead"&&p.status!=="left");
  const hits=all.filter(p=>t.includes(" "+p.name.toLowerCase()+" ")||t.includes(" "+p.name.toLowerCase()+"'s "));
  hits.sort((a,b)=>(a.loc===pl.loc?0:1)-(b.loc===pl.loc?0:1)||dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z));
  const seen=new Set();return hits.filter(p=>{if(seen.has(p.name))return false;seen.add(p.name);return true})}
function everyoneIn(t){return/\b(everyone|everybody|all of you|you all|y'all|the group|people)\b/i.test(t)}
// walk up to someone or something, then do it
function approach(t,cb){const pl=pl_();if(pl.ko>0||S.flags.traveling)return;const d=dist(pl.x,pl.z,t.x,t.z);if(d<2.2){face(t);cb&&cb();return}
  const a=Math.atan2(pl.x-t.x,pl.z-t.z);moveTo(pl,t.x+Math.sin(a)*1.5,t.z+Math.cos(a)*1.5,()=>{face(t);cb&&cb()})}
function face(t){const pl=pl_();pl.dir=Math.atan2(t.x-pl.x,t.z-pl.z);if(t.id&&t.id!=="you"&&t.x!=null)t.dir=Math.atan2(pl.x-t.x,pl.z-t.z)}
function here_(p){if(!p)return false;if(p.loc!==pl_().loc||p.away&&p.away.out){toast(`${p.name} isn't here.`);return false}return true}

// ---------- talking ----------
async function speak(p,text){if(!here_(p))return;approach(p,async()=>{const pl=pl_();say(pl,text);p.chat.push({w:"you",x:text});p.lastTalk=S.t;
    const cmd=orderIn(text,p);if(cmd){await cmd();return}
    const r=chatReply(p,text);p.busyTalk=true;let out=null;
    if(aiReady()){thinking(p);out=await aiTalk(p,text,"",false,s=>sayLive(p,s))}
    p.busyTalk=false;const line=out?.say||r.line;let dt=r.dt;if(out){dt=dt*.4+out.feel*1.6;if(out.note)mem(p,out.note,Math.round(out.feel))}
    p.trust=clamp(p.trust+talkGain(p,dt),0,100);p.chat.push({w:"them",x:line});say(p,line,true);if(typeof renderTalk==="function")renderTalk();save()})}
// small talk only moves someone so far in a day
function talkGain(p,v){const d=dayOf(S.t);if(!p.tg||p.tg.d!==d)p.tg={d,n:0};if(v<=0)return v;const left=Math.max(0,8-p.tg.n);const g=Math.min(v,left)+Math.max(0,v-left)*.2;p.tg.n+=g;return g}
// an order inside something you say to one person ("come with me", "can you farm?")
function orderIn(text,p){const t=text.toLowerCase();
  if(/come with me|follow me|tag along|you're with me|let's go/.test(t))return()=>ask(p,"come",{to:null});
  if(/stay (here|put|behind)|wait here|stop following|go back to camp|head home/.test(t))return()=>ask(p,"stay");
  if(p.status==="stranger"&&/join|come in|stay with us|welcome|you can stay|let you in/.test(t))return()=>invite(p);
  if(/(fight|war|attack).*(pruitt|them|boyd)|go to war/.test(t))return()=>rally();
  if(p.status==="member"&&!JOBBY.test(t)){const tk=taskIn(orderCore(t,[p]));if(tk&&tk.k!=="perim")return()=>{runOrder(tk,[p],null,orderCore(t,[p]))}}
  const lead=/in charge|run the|manage|lead the|head of/.test(t);for(const [j,re] of Object.entries(JWORDS))if(re.test(t)&&/(can you|could you|will you|i need you|you're on|take|work|start|handle|help with|do the|be our|on (the )?\w+ duty)/.test(t))return()=>ask(p,lead?"lead":"job",{job:j});
  return null}
function thinking(p){say(p,"...",false,true)}

// ---------- asking things of people ----------
async function ask(p,kind,ctx){ctx=ctx||{};if(!here_(p))return;
  if((kind==="job"||kind==="lead")&&p.status!=="member"){say(p,"I don't even live here.");return}
  const r=weigh(p,kind,ctx);let gist=answerLine(p,kind,r,ctx);
  if(r.yes)applyOrder(p,kind,ctx);
  p.lastTalk=S.t;showWhy(p,kind,r,ctx);
  let line=gist;if(aiReady()){thinking(p);const out=await aiTalk(p,orderWords(kind,ctx),gist,true,s=>sayLive(p,s));if(out){line=out.say;if(out.note)mem(p,out.note,0)}}
  p.chat.push({w:"them",x:line});say(p,line,true);if(typeof renderTalk==="function")renderTalk();save();return r}
function orderWords(kind,ctx){return{come:"Come with me.",war:"I need you to fight the Pruitts with me.",job:`I need you on ${JOBS[ctx.job||"farm"].n.toLowerCase()}.`,lead:`I want you in charge of ${JOBS[ctx.job||"farm"].lead}.`,stay:"Stay here.",join:"You can join us.",leave:"You need to leave camp."}[kind]||"Will you?"}
function applyOrder(p,kind,ctx){
  if(kind==="job"){p.job=ctx.job==="none"?null:ctx.job;p.wp=null;p.chose=false;if(p.leads&&p.leads!==p.job)p.leads=null;log(`${p.name} is on ${p.job?JOBS[p.job].n.toLowerCase():"nothing in particular"} now.`);if(S.camp&&atCamp(p))planHour(p,hourOf(S.t))}
  if(kind==="lead"){for(const q of members())if(q.leads===ctx.job)q.leads=null;p.leads=ctx.job;p.job=ctx.job;log(`${p.name} is in charge of ${JOBS[ctx.job].lead} now. Small problems there go to ${pronoun(p,"o")} first.`,"good");mem(p,`${S.player.name} put me in charge of ${JOBS[ctx.job].lead}.`,4);p.trust=Math.min(100,p.trust+4)}
  if(kind==="come"){p.follow=true;p.busy=false;p.act="with you";if(p.loc===campK())p.away=null}
  if(kind==="stay"){p.follow=false;p.act=p.loc===campK()?"back at camp":"waiting here";if(p.loc!==campK()){p.away={kind:"wait",at:p.loc}}}
  if(kind==="leave"){p.status="left";p.follow=false;moveTo(p,ENTRY.x,ENTRY.z+4);log(`${p.name} packs a bag and walks out of camp.`,"warn");for(const q of famOf(p))if(q.status==="member"){q.trust-=20;q.mood-=20}}}
function showWhy(p,kind,r,ctx){const head=`${p.name} ${r.yes?"agrees":"says no"}${kind==="job"?` to ${JOBS[ctx.job].n.toLowerCase()}`:kind==="lead"?` to running ${JOBS[ctx.job].lead}`:kind==="come"?" to come with you":kind==="war"?" to fight":""}.`;
  if(typeof whyPanel==="function")whyPanel(p,head,r);log(head+(r.reasons[0]?` (${r.reasons.slice(0,2).map(x=>x.t.toLowerCase()).join("; ")})`:""),r.yes?"":"warn")}
async function askMany(L,kind,ctx){for(const p of L){await ask(p,kind,ctx);await new Promise(r=>setTimeout(r,250))}}
function invite(p){if(!p||p.status!=="stranger")return;approach(p,async()=>{say(pl_(),pick(["You can stay with us.","Come on in. We'll find you a spot.","Welcome to camp."]));
    const r=weigh(p,"join");if(!r.yes){showWhy(p,"join",r,{});say(p,"I... no. We'll manage on our own.",true);p.status="left";moveTo(p,ENTRY.x,ENTRY.z+4);return}
    const g=admit(p);if(!S.camp)for(const q of g)q.follow=true;say(p,answerLine(p,"join",r),true);if(typeof renderAll==="function")renderAll()})}
function sendAway(p){if(!p||p.status!=="stranger")return;approach(p,()=>{say(pl_(),pick(["We can't take anyone else. I'm sorry.","Keep moving. There's nothing for you here."]));turnAway(p);say(p,pick(["Fine. Hope it's worth it.","...Right. Come on.","You'll remember this."]),true)})}

// ---------- the war ----------
function rally(){if(!S.rival||S.rival.gone){toast("There's nobody to fight. Not yet.");return}
  const L=members().filter(p=>!p.kid&&(atCamp(p)&&pl_().loc===campK()||p.loc===pl_().loc));if(!L.length){toast("There's nobody here to ask.");return}
  const out=L.map(p=>({p,r:weigh(p,"war")}));for(const o of out){o.p.lastTalk=S.t;if(o.r.yes){o.p.follow=true;o.p.away=null}}
  if(typeof warCard==="function")warCard(out)}
function battle(){const R=S.rival;const pl=pl_();const party=withYou().filter(p=>!p.kid);let us=2+party.reduce((a,p)=>a+1.5+p.sk.fight*.8,0)+Math.min(4,S.res.ammo/6)+useVal("weapon")*.4+(pl.gun&&pl.rounds>0?1.5:0);const them=rivalStr();
  if(pl.gun)pl.rounds=Math.max(0,(pl.rounds||0)-ri(3,8));
  if(S.res.ammo>0)S.res.ammo=Math.max(0,S.res.ammo-party.length*2);
  const roll=us*(.75+rf()*.5)-them*(.75+rf()*.5);const beats=[];const foes=S.people.filter(p=>p.status==="rival");const hurtUs=[];
  beats.push(`You come at ${LOCS[R.site].n} ${hourOf(S.t)>=20||hourOf(S.t)<5?"in the dark":"in broad daylight"}, ${party.length?listAnd(party.map(p=>p.name))+" beside you":"alone"}.`);
  for(const p of party){if(rf()<.35+(roll<0?.25:0)){const dmg=ri(10,35);p.hp-=dmg;hurtUs.push(p);if(p.hp<=0)die(p,"was killed fighting the Pruitts")}}
  if(roll>0){const killed=foes.filter(()=>rf()<.5);for(const f of killed){f.status="dead";S.stats.deaths++}const left=foes.filter(f=>f.status==="rival");
    beats.push(pick(["It's fast and ugly. Doors kicked in, shouting, a shot that goes wide.","Boyd sees you coming too late. His people scatter."]));
    beats.push(killed.length?`${killed.length} of them don't get up.`:"Nobody dies. They just break and run.");
    R.gone=true;for(const f of left){f.status="stranger";f.trust=10;f.waitTill=S.t+6*HOUR;f.scened=true;f.met=true}
    const loot={food:ri(8,20),water:ri(6,14),ammo:ri(4,12),scrap:ri(2,6),"i:rope":1};addLoot(loot);beats.push(`You take their stores home: ${lootWords(loot)}.`);
    if(left.length)beats.push(`${listAnd(left.map(f=>f.name))} ${left.length>1?"throw down their weapons and ask":"throws down a weapon and asks"} to come with you. You could let them.`);
    for(const p of party){mem(p,"We beat the Pruitts.",4);p.trust+=4}log("The Pruitt crew is finished.","big")}
  else{beats.push(pick(["They were ready. Somebody shouts your name from a window, and then the shooting starts.","It goes wrong almost at once."]));beats.push("You pull back and run for home.");R.angry+=2;R.raidAt=S.t+ri(20,40)*HOUR;
    const pl=pl_();pl.hp=Math.max(20,pl.hp-ri(15,30));for(const p of party)mem(p,"We lost against the Pruitts.",-5)}
  for(const p of hurtUs)if(p.status!=="dead")beats.push(`${p.name} is hurt.`);for(const p of party)if(p.status==="dead")beats.push(`${p.name} doesn't come home.`);
  syncInv();return{won:roll>0,beats}}

// ---------- places ----------
function travelTo(k){const pl=pl_();if(S.flags.traveling||k===pl.loc||!LOCS[k])return;armUp(true);const hrs=travelHours(pl.loc,k);const party=withYou();
  S.flags.traveling={to:k,from:pl.loc,hrs,start:S.t};for(const p of party){p.loc="road";p.tx=null;p.path=null;p.onArrive=null}pl.loc="road";pl.tx=null;pl.path=null;pl.onArrive=null;if(UI.loot)closeLoot();
  log(`You set out for ${LOCS[k].n}${party.length?" with "+listAnd(party.map(p=>p.name)):""}. About ${hrs} hour${hrs>1?"s":""} on foot.`);if(typeof onTravel==="function")onTravel(hrs)}
function travelTick(){const T=S.flags.traveling;if(!T)return true;step(HOUR/2);if(S.t-T.start<T.hrs*HOUR)return false;
  const party=S.people.filter(p=>p.loc==="road");if(rf()<.12+dangerAt(T.to)*.04){const f=[pl_(),...party].reduce((a,b)=>fightOf(b)>fightOf(a)?b:a);const fx=f===pl_()?"You":f.name;
    if(rf()<.75)log(`On the road, a few of the dead stagger out of a ditch. ${fx} ${f===pl_()?"deal":"deals"} with them.`);else{const v=pick([pl_(),...party]);v.hp-=ri(6,16);log(`Walkers on the road. ${v===pl_()?"You":v.name} took a nasty knock getting past them.`,"warn")}}
  S.flags.traveling=null;arriveAt(T.to);return true}
function arriveAt(k,silent){const pl=pl_();const party=S.people.filter(p=>p.loc==="road"||p.follow&&p.loc===pl.loc);pl.loc=k;pl.x=ENTRY.x;pl.z=ENTRY.z-2;pl.tx=null;pl.path=null;
  party.forEach((p,i)=>{p.loc=k;p.x=ENTRY.x+(i%3-1)*1.6;p.z=ENTRY.z-.5+Math.floor(i/3);p.tx=null;p.path=null;p.away=k===campK()?null:{kind:"party"}});
  const pl2=place(k);const first=!pl2.seen;pl2.seen=true;topUpWalkers(k);topUpAnimals(k);
  if(k===campK()){unloadHaul();for(const p of party){p.follow=false;p.away=null;p.act="back at camp"}if(!silent&&party.length)log(`You're home. ${listAnd(party.map(p=>p.name))} go back to what they were doing.`)}
  else if(!silent){const L=LOCS[k];log(`${L.n}. ${first?L.d:""} ${walkersAt(k).length>4?"There are a lot of the dead here.":walkersAt(k).length?"Some of the dead are moving around.":"It's quiet."}`,"big");
    // sometimes someone's hiding here
    if(first&&k!=="start"&&rf()<.4&&!(S.rival&&S.rival.site===k)){const hh=mkHousehold(null,k,{x:rf()*12-6,z:rf()*6});for(const q of hh){q.status="stranger";q.trust=ri(5,25);q.waitTill=S.t+9999*HOUR;q.act="hiding";S.people.push(q)}if(typeof maybeHiddenBite==="function")maybeHiddenBite(hh);log(`Someone's here: ${hh.length>1?`${hh.length} people`:hh[0].sex==="F"?"a woman":"a man"}, hiding and watching you.`,"warn")}
    if(S.rival&&S.rival.site===k&&!S.rival.gone)log("The Pruitt crew lives here now. They're watching you.","warn")}
  armUp(true);
  if(typeof onScene==="function")onScene();save();
  if(S.flags.moveIn){const m=S.flags.moveIn;S.flags.moveIn=null;if(m===k&&!S.camp&&!silent)doCamp()}}
function goHome(){if(S.camp)travelTo(S.camp.site)}
function burnPlace(){const pl=pl_();const k=pl.loc;if(k===campK()){toast("That's your camp.");return}if(k==="road")return;const P2=place(k);if(P2.burned){toast("It's already burned.");return}
  const R=S.rival;const theirs=R&&!R.gone&&R.site===k;const h=hourOf(S.t);
  if(theirs&&!(h>=22||h<5)){toast("Not in daylight, with all of them watching. Come back at night, or fight them.");return}
  P2.burned=true;S.bv++;for(const c of layout(k).conts){const s=contState(k,c.id);if(c.vis==="door"){s.rolled=true;s.c.items=[]}}
  for(const w of walkersAt(k))if(rf()<.6)putDown(w);place(k).heat=(place(k).heat||0)+6;
  if(theirs){R.weak=true;R.angry+=2;R.raidAt=S.t+ri(18,36)*HOUR;const f=S.people.filter(p=>p.status==="rival");const v=f.length&&rf()<.3?pick(f):null;if(v)die(v,"burned in the fire");log(`You set fire to the Pruitts' place in the dark and get out before anyone's awake enough to shoot. Their stores go up with it.${v?" "+v.name+" didn't get out.":""} They'll want blood.`,"big")}
  else log(`You set ${LOCS[k].n} on fire. Whatever was inside burns with it, and so do the dead that were in there.`,"big");
  step(HOUR);if(typeof onScene==="function")onScene();save()}
function waitHours(h){h=clamp(h|0||1,1,12);for(let i=0;i<h*2;i++){step(HOUR/2);if(S.cards.length)break}log(`You wait ${h} hour${h>1?"s":""}.`)}

// ---------- reading what you typed ----------
function youFy(t){t=t.trim().replace(/^i\s+/i,"you ").replace(/^i'm\s+/i,"you're ").replace(/\bmy\b/gi,"your").replace(/\bme\b/gi,"you").replace(/\bmyself\b/gi,"yourself").replace(/\bi\b/g,"you");if(!/^you/i.test(t))t="You "+t;return cap1(t.replace(/[.!]*$/,"."))}
const VERB3={say:"say",tell:"tell",ask:"ask",yell:"yell",shout:"shout",whisper:"whisper"};
async function doCommand(raw){const text=raw.trim();if(!text)return;if(!S)return;if(S.flags.traveling){toast("You're on the road.");return}const t=text.toLowerCase().replace(/^(i|i'll|i will|let's|lets|we)\s+/,"").trim();
  const names=namedIn(t);const who=names[0];const pl=pl_();
  // saying something
  let m=/^(say|tell|ask|yell|shout|whisper|greet|wave)\b(.*)$/.exec(t);
  if(m&&!/\b(to (come|follow|farm|guard|build|cook|stay|leave|join|fight)|in charge)\b/.test(t)&&!(who&&orderIn(t,who))&&!(/^(tell|ask)\b/.test(t)&&taskIn(orderCore(t,names)))){let words=text.replace(/^(i|we)\s+/i,"").replace(/^\w+\s*/,"");const target=who||nearestPerson(p=>p.status!=="rival"||true);
    if(target)words=words.replace(new RegExp("^(to\\s+)?"+target.name+"[,:]?\\s*(that\\s+)?","i"),"");words=words.replace(/^(to\s+(them|him|her|everyone|everybody|y'all|you all|all)[,:]?\s*)/i,"").replace(/\s+to\s+(them|him|her|everyone|everybody|y'all|you all|the group|all of them)[.!]?$/i,"").replace(/^["']|["']$/g,"").trim();
    if(m[1]==="greet"||m[1]==="wave"||!words)words=m[1]==="wave"?"*waves*":"Hi.";
    if(!target){say(pl,cap1(words));return}return speak(target,cap1(words))}
  if(/^(hi|hey|hello|howdy)\b/.test(t)){const target=who||nearestPerson();if(target)return speak(target,cap1(text));say(pl,cap1(text));return}
  if(/^(talk|speak|chat)( to| with)?\b/.test(t)){const target=who||nearestPerson();if(target){openTalk(target);approach(target)}return}
  // living inside: move in, go in, step out
  const tt=t.replace(/[.!?]+$/,"").replace(/\s+(now|please|quick(ly)?|fast|together)$/,"").trim();
  if(LIVE_RE.test(tt)&&!/\b(tent|cabin|wall|tower)\b/.test(tt))return moveIn(tt);
  if(INSIDE_RE.test(tt)||/^(everyone|everybody|all of you|y'all)\b.*\b(inside|indoors)\b|^get (everyone|everybody) (inside|indoors|in)\b/.test(tt))return goInside(tt,everyoneIn(tt));
  if(OUTSIDE_RE.test(tt))return goOutside();
  // fire: the bodies, the place itself (only when you say so plainly, and you're asked first), or a fire to sit by
  if(/\b(burn|torch|set fire|on fire|ablaze|cremate|bury)\b/.test(tt)&&BODY_RE.test(tt))return clearBodies(/\bbury\b/.test(tt));
  if(/\b(burn|torch|set fire|on fire|ablaze)\b/.test(tt)&&BURN_RE.test(tt))return askBurn();
  // camp, map, travel
  if(/(make|set up|pitch|start|build|found) (our |a |the )?(camp|base|home)( here)?\b/.test(t)&&!/(tent|cabin|wall|tower)/.test(t)){return doCamp()}
  if(FIRE_RE.test(tt)&&!(/^(build|construct|put up|set up|dig|make)\b/.test(tt)&&PIT_RE.test(tt)))return lightFire();
  if(/^(open )?(the )?map$/.test(t))return openMap();
  m=/^(go|head|travel|walk|drive|run|get|move|hike|return)\s+(back\s+)?(to|over to|toward|towards|home|back)\b\s*(.*)$/.exec(t);
  if(m){const rest=(m[4]||"")+" "+(m[3]==="home"?"home":"");if(/\b(home|camp|base)\b/.test(rest)&&S.camp)return goHome();const k=locIn(rest);if(k)return travelTo(k);const tgt=namedIn(rest)[0];if(tgt){if(here_(tgt))approach(tgt);return}const c=contIn(rest);if(c)return approach(c)}
  // hunting: "shoot the deer", "go hunting", "butcher it"
  if(huntCmd(t,names))return;
  // guns are for the dead, never the living
  if(/^(shoot|open fire|aim|take a shot|blast|snipe|pick off|gun down)\b|^fire\b(?! up)/.test(t)||/\b(shoot|take a shot at)\b/.test(t)||/\bfire (at|on) (the |that |those |a |an )?(dead|walkers?|zombies?|biters?|them|it|one)\b/.test(t)){
    const living=who||/\b(pruitts?|boyd|stranger|strangers|person|people|guy|man|woman|kid|kids|survivors?)\b/.test(t);
    if(living&&!/\b(dead|walkers?|zombies?|biters?|corpses?)\b/.test(t)){toast("You won't point a gun at the living. If it comes to the Pruitts, that's a war, and it needs your people behind you.");return}
    return shootNearest()}
  if(/^(kill|take out|put down|stab|hit|fight|smash|attack)\b.*\b(dead|walkers?|zombies?|biters?|one of them)\b/.test(t)){const w=nearestWalker();if(!w){toast("There's none of the dead here.");return}
    if(pl.gun&&((pl.rounds||0)>0||loadUp()))return closeAndShoot(w);return approach(w,()=>clash(pl,w))}
  // orders: "Maya, cut some wood", "everyone board up the windows", "push that car", "stop"
  if(orderCmd(t,names,text))return;
  if(/(come with me|follow me|with me|tag along|let's go)/.test(t)){const L=everyoneIn(t)?localPeople().filter(p=>p.status==="member"&&!p.kid):names.filter(p=>p.status==="member");if(!L.length&&who)L.push(who);if(!L.length){toast("Who do you want to come with you? Use a name.");return}return askMany(L,"come")}
  if(/(stay (here|put|behind)|wait here|stop following|go (back )?home|go back to camp)/.test(t)){const L=everyoneIn(t)?withYou():names;if(!L.length)return toast("Who should stay?");return askMany(L,"stay")}
  if(/(war|attack|fight|raid|hit|go after|kill).*(pruitt|boyd|them|rival|the other camp)/.test(t)||/go to war/.test(t))return rally();
  if(/(let|bring|take|invite|welcome)\b.*\b(in|join|stay|with us)|^invite/.test(t)){const s=names.find(p=>p.status==="stranger")||nearestPerson(p=>p.status==="stranger");if(s)return invite(s);toast("There's nobody waiting to be let in.");return}
  if(/(turn .* away|send .* away|tell .* (to )?leave|no room|go away)/.test(t)){const s=names.find(p=>p.status==="stranger")||nearestPerson(p=>p.status==="stranger");if(s)return sendAway(s);if(who&&who.status==="member")return ask(who,"leave");return}
  if(who&&who.status==="member"){const lead=/(in charge|run(s|ning)? the|manag|lead|boss|head of|charge of)/.test(t);for(const [j,re] of Object.entries(JWORDS))if(re.test(t.replace(new RegExp("\\b"+who.name.toLowerCase()+"\\b"),""))){return here_(who)&&approach(who,()=>{say(pl,lead?`I want you running ${JOBS[j].lead}.`:`I need you on ${JOBS[j].n.toLowerCase()}.`);ask(who,lead?"lead":"job",{job:j})})}
    if(/(nothing|no job|take a break|rest|day off)/.test(t))return approach(who,()=>{say(pl,"Take a break.");ask(who,"job",{job:"none"})})}
  // building, crafting, searching, burning
  if(/^(build|construct|put up|set up|raise|erect|dig|plant)\b/.test(t)||/^make (a|an|some|the) /.test(t)&&Object.values(BWORDS).some(re=>re.test(t))){for(const [k,re] of Object.entries(BWORDS))if(re.test(t))return startPlace(k);if(/^(build|construct|put up|raise|erect)/.test(t)){openBuild();return}}
  if(/^(craft|make|tie|sew|carve|whittle|fashion|rig|assemble|knot|weave|sharpen|combine|put|attach|tape|nail|turn)\b/.test(t)&&(Object.keys(S.items).some(k=>t.includes(ITEMS[k].split(" ").pop()))||/^(craft|make|tie|sew|carve|whittle|fashion|weave|knot)\b/.test(t)))return craft(text);
  if(/^(search|loot|check|open|look through|look in|rummage|go through|raid)\b/.test(t)){const c=contIn(t)||nearestCont();if(c)return approach(c,()=>openLoot(c));toast("There's nothing like that to search here.");return}
  m=/^(wait|rest|sleep|nap|sit)\b.*?(\d+)?\s*(hour|hr)?/.exec(t);if(m&&/^(wait|rest|sleep|nap)/.test(t)){const h=m[2]?+m[2]:/sleep/.test(t)?8:2;return waitHours(h)}
  if(/^(help|\?)$/.test(t))return openHelp();
  // anything else: Claude reads it, or the game does its honest best
  if(aiReady()){const r=await aiInterpret(text);if(r&&Array.isArray(r.actions)&&r.actions.length){if(r.say)log(r.say);for(const a of r.actions.slice(0,4))await runAction(a);return}}
  freeAct(text,who)}
function locIn(t){t=t.toLowerCase();for(const [k,L] of Object.entries(LOCS)){const n=L.n.toLowerCase().replace(/['.]/g,"");if(t.includes(k)||t.includes(n)||n.split(" ").some(w=>w.length>4&&t.includes(w)))return k}return null}
function contIn(t){const pl=pl_();const L=layout(pl.loc).conts.slice().sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z));for(const c of L){const n=CONT[c.k].n.toLowerCase();if(t.includes(c.k)||n.split(" ").some(w=>w.length>3&&t.includes(w)))return c}if(/car|trunk|glove/.test(t))return L.find(c=>c.k==="car");return null}
function nearestCont(){const pl=pl_();let b=null,bd=1e9;for(const c of layout(pl.loc).conts){const d=dist(c.x,c.z,pl.x,pl.z);if(d<bd){bd=d;b=c}}return b}
function freeAct(text,who){const line=youFy(text.replace(/^(i|we)\s+/i,"i "));const hrs=1;
  if(who&&here_(who)){approach(who,()=>{log(line);const warm=/(hug|help|share|give|comfort|thank|teach|play|sit with|hold|carry|smile|joke|cook for)/i.test(text),cold=/(hit|punch|slap|push|shove|yell at|threaten|spit|steal|rob)/i.test(text);
      if(warm){who.trust=clamp(who.trust+3,0,100);who.mood+=3;mem(who,`${S.player.name}: ${text}`,2);say(who,pick(["Thanks.","...I needed that.","Huh. Okay."]))}
      if(cold){who.trust=clamp(who.trust-12,0,100);who.mood-=6;mem(who,`${S.player.name}: ${text}`,-5);say(who,pick(["What the hell?!","Don't touch me.","You'll regret that."]));for(const q of localPeople())if(q!==who&&q.status==="member")q.trust-=2}})}
  else{log(line);step(hrs*HOUR)}}
async function runAction(a){const nm=x=>namedIn(String(x||""))[0];const pl=pl_();
  switch(a.do){case"say":{const p=a.to?nm(a.to):nearestPerson();if(p)await speak(p,String(a.text||"Hi.").slice(0,200));else say(pl,String(a.text||"").slice(0,200));break}
    case"walk":{const p=nm(a.to);if(p&&here_(p)){approach(p);break}const c=contIn(String(a.to||"").toLowerCase());if(c)approach(c);break}
    case"travel":if(a.to===campK()||/camp|home/.test(a.to)){goHome();break}if(LOCS[a.to])travelTo(a.to);else{const k=locIn(String(a.to||""));if(k)travelTo(k)}break;
    case"camp":doCamp();break;case"build":if(BUILDS[a.what])startPlace(a.what);break;
    case"job":{const p=nm(a.who);if(p&&(JOBS[a.job]||a.job==="none"))await ask(p,"job",{job:a.job});break}
    case"lead":{const p=nm(a.who);if(p&&JOBS[a.job])await ask(p,"lead",{job:a.job});break}
    case"invite":{const p=nm(a.who)||nearestPerson(p=>p.status==="stranger");if(p)invite(p);break}
    case"turnaway":{const p=nm(a.who)||nearestPerson(p=>p.status==="stranger");if(p)sendAway(p);break}
    case"follow":{const L=(Array.isArray(a.who)?a.who:[a.who]).map(nm).filter(Boolean);await askMany(L,"come");break}
    case"stay":{const L=(Array.isArray(a.who)?a.who:[a.who]).map(nm).filter(Boolean);await askMany(L,"stay");break}
    case"search":{const c=a.what&&a.what!=="all"?contIn(String(a.what).toLowerCase()):nearestCont();if(c)approach(c,()=>openLoot(c));break}
    case"shoot":shootNearest();break;
    case"hunt":huntCmd("hunt "+String(a.what||"animal").toLowerCase(),[]);break;
    case"butcher":{const p=a.who?nm(a.who):null;huntCmd("butcher "+String(a.what||"it").toLowerCase(),p?[p]:[]);break}
    case"order":{const tk=AI_TASK(a);if(!tk)break;const names=(Array.isArray(a.who)?a.who:[a.who]).filter(Boolean).map(String);const all=names.some(n=>/^(everyone|everybody|all)$/i.test(n));
      const who=all?orderDoers("everyone",[],tk):names.map(nm).filter(Boolean).filter(p=>p.status==="member"&&p.loc===pl.loc&&!(p.away&&p.away.out));
      if(names.length&&!who.length)break;runOrder(tk,who,null,String(a.what||""));break}
    case"burn":askBurn();break;case"inside":goInside(String(a.what||""));break;case"fire":lightFire();break;case"craft":await craft(String(a.text||""));break;case"wait":waitHours(+a.hours||1);break;case"war":rally();break;
    case"act":{const p=a.trust&&Object.keys(a.trust)[0]?nm(Object.keys(a.trust)[0]):null;const go=()=>{if(a.text)log(String(a.text).slice(0,300));
        const md=clamp(+a.mood||0,-4,4);if(md)for(const q of members())q.mood=clamp(q.mood+md,0,100);
        for(const [n,v] of Object.entries(a.trust||{})){const q=nm(n);if(q){q.trust=clamp(q.trust+clamp(+v||0,-10,10),0,100);mem(q,String(a.text||"").replace(/^You /,S.player.name+" ").slice(0,120),Math.sign(+v||0)*2)}}
        for(const [k,v] of Object.entries(a.res||{}))if(RES[k])S.res[k]=Math.max(0,S.res[k]+clamp(+v||0,-3,3));syncInv();const h=clamp(+a.hours||0,0,4);if(h)step(h*HOUR)};
      if(p&&p.loc===pl.loc)approach(p,go);else go();break}}}
async function craft(text){if(!S.camp&&!Object.keys(S.items).length){toast("You don't have anything to work with yet.");return}
  log(`You try: "${text}"`);let res=null;if(aiReady()){res=await aiCraft(text)}if(!res)res=recipeCraft(text);
  if(!res.ok){log(res.reason||"It doesn't work.","warn");if(res.hint){const can=RECIPES.filter(r=>Object.entries(r.need).every(([k,n])=>itemCount(k)>=n));if(can.length)log(`With what's here you could make: ${listAnd(can.map(r=>r.make.toLowerCase()))}.`,"hint")}if(typeof renderAll==="function")renderAll();return res}
  const done=applyCraft(res);log(res.say||`You make ${res.makes.name.toLowerCase()}.`,"good");log(`${res.makes.name}: ${USES[res.makes.use]||""}.`,"hint");
  if(done&&done.harm.length)log(`That used medicine ${listAnd(done.harm.map(p=>p.name))} needs to stay alive. ${done.harm.length>1?"They":pronoun(done.harm[0],"S")} won't forget it.`,"bad");if(typeof renderAll==="function")renderAll();return res}
function doCamp(){if(S.camp){toast(`You already have a camp at ${S.camp.n}.`);return}const k=pl_().loc;const L=LOCS[k];if(!L||L.camp===false){toast("You can't live here. Open the map (M) and pick a place.");return}
  if(S.rival&&S.rival.site===k&&!S.rival.gone){toast("The Pruitts live here.");return}if(campHere()){if(typeof onScene==="function")onScene();save()}}

// ================= living inside =================
const LIVE_RE=/\b(move in(to)?|moving in(to)?|live (in|here|inside|there)|living (in|here|inside)|settle (in|here)|inhabit|hole up|bunk down|bunker down|shelter (in|here)|call (it|this|this place|here) home|(make|turn) (it|this|here|that|(the|this|that) [\w']+( [\w']+)?)( into)? (our|my|a|your) (new )?(home|base|house)|make (a|our) (new )?home|claim (this|the|that) (house|building|place|farmhouse|church|store|school|motel|mill))\b/;
const INSIDE_RE=/^((go|head|get|walk|step|move|come|run|duck|hurry|go back|head back|get back|come back)\s+(inside|indoors|in(to)? (the |that |this )?(house|farmhouse|building|barn|church|chapel|store|shop|school|station|motel|mill|cabin|office|room|place))|enter|go in|head in|get in here)\b/;
const OUTSIDE_RE=/^((go|head|get|walk|step|move|come|run)\s+(back\s+)?(outside|outdoors|out)( the (front |back )?door)?|(leave|exit) the (house|farmhouse|building|barn|church|store|school|motel|mill))$/;
const BODY_RE=/\b(bod(y|ies)|corpses?|the dead|dead (ones|walkers|bodies)|remains)\b/;
// burning the place down has to be said plainly: "burn it down", "torch the place", "set the barn on fire"
const BURN_RE=/\b(down|it|place|house|farmhouse|home|building|barn|church|chapel|store|shop|school|station|motel|mill|everything|whole|lot|town)\b/;
const FIRE_RE=/^(make|light|start|build|get|stoke|feed|kindle|fire up|relight|keep)\b.*\b(fire|stove|woodstove|fireplace|hearth|campfire)\b|^(sit|warm up|warm|gather|huddle|hang out|relax|rest)\b.*\b(by|at|around|near|next to) (the |a )?(fire|stove|woodstove|fireplace|campfire)\b/;
const PIT_RE=/\b(fire ?pits?|fire ?rings?|cook ?fires?|cook ?pits?|pits?|kitchens?|rings?)\b/;
function bldAt(loc,x,z){return LOCS[loc]?layout(loc).b.find(r=>x>r.x-r.w/2&&x<r.x+r.w/2&&z>r.z-r.d/2&&z<r.z+r.d/2)||null:null}
function pickBld(t){const pl=pl_();if(!LOCS[pl.loc])return null;const B=layout(pl.loc).b;if(!B.length)return null;t=t||"";
  if(/\bbarn\b/.test(t)){const b=B.find(r=>r.barn);if(b)return b}
  if(/\b(house|farmhouse|home|cabin|church|chapel|store|shop|school|station|motel|mill|office)\b/.test(t)){const b=B.find(r=>!r.barn);if(b)return b}
  const H=B.filter(r=>!r.barn);return(H.length?H:B).slice().sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z))[0]}
// walk in through the door (the walls do the rest: you can only get in through the doorway)
function goInside(t,all){const pl=pl_();if(pl.ko>0||S.flags.traveling)return;const r=pickBld(t);if(!r){toast("There's no building here to go into.");return}
  const spot=()=>r.floorSpots&&r.floorSpots.length?pick(r.floorSpots):{x:r.x+(rf()-.5)*2,z:r.z+(rf()-.5)*2};
  const ppl=all?localPeople().filter(p=>p.status==="member"&&!p.sleep&&!(p.ko>0)&&!(p.away&&p.away.out)&&bldAt(p.loc,p.x,p.z)!==r):[];
  if(bldAt(pl.loc,pl.x,pl.z)===r&&!ppl.length){toast(all?"Everyone's already inside.":"You're already inside.");return}
  if(bldAt(pl.loc,pl.x,pl.z)!==r){const s=spot();moveTo(pl,s.x,s.z)}
  for(const p of ppl){const s=spot();moveTo(p,s.x,s.z);p.act="heading inside"}
  log(ppl.length?`You get everyone inside${r.barn?" the barn":""}.`:r.barn?"You head into the barn.":pl.loc===campK()?"You go inside.":`You go inside ${LOCS[pl.loc].n}.`)}
function goOutside(){const pl=pl_();const r=bldAt(pl.loc,pl.x,pl.z);if(!r){toast("You're already outside.");return}moveTo(pl,r.x+(rf()-.5)*2,r.z+r.d/2+2.5);log("You step outside.")}
// a place named in so many words ("the church", "Harlan Farm"), not a word that could mean anywhere ("the store")
function locStrict(t){for(const [k,L] of Object.entries(LOCS)){if(k==="start")continue;if(new RegExp("\\b"+k+"\\b").test(t)||t.includes(L.n.toLowerCase().replace(/['.]/g,"")))return k}return null}
// "move in", "we live here now", "make this place our home": make camp here and go inside, or set off for the place you named
function moveIn(t){const pl=pl_();const k=locStrict(t);
  if(k&&k!==pl.loc){if(S.camp){toast(`You already live at ${S.camp.n}.`);return}if(LOCS[k].camp===false){toast(`Nobody could live at ${LOCS[k].n}.`);return}
    S.flags.moveIn=k;return travelTo(k)}
  if(!S.camp)return doCamp();
  if(S.camp.site===pl.loc){if(bldAt(pl.loc,pl.x,pl.z)&&!everyoneIn(t)){toast("You live here. This is home now.");return}return goInside(t,everyoneIn(t))}
  toast(`You already live at ${S.camp.n}. Head home first.`)}
// lighting a fire or the stove is something you do, not something you build, and it never burns anything down
function lightFire(){const pl=pl_();const k=pl.loc;const st=S.blds.find(b=>b.loc===k&&b.type==="fire"&&b.done);const ppl=localPeople().filter(p=>p.status==="member");
  const warm=()=>{const fresh=!S.flags.warmAt||S.t-S.flags.warmAt>6*HOUR;S.flags.warmAt=S.t;if(fresh)for(const q of ppl)q.mood=clamp(q.mood+2,0,100)};
  if(st){const indoor=!!(st.opt&&st.opt.indoor);return approach(st,()=>{
    log(indoor?`You get the woodstove going. It ticks as it heats${ppl.length?", and people drift over to warm their hands":""}.`:`You build the fire back up.${ppl.length?" People drift over to sit by it.":""}`);warm();
    for(const q of ppl.filter(q=>!q.sleep&&!(q.ko>0)&&!(q.away&&q.away.out)).slice(0,5)){if(indoor)moveTo(q,st.x+1+rf()*1.6,st.z-.4-rf()*1.6);else{const a=rf()*Math.PI*2,r=1.6+rf();moveTo(q,st.x+Math.cos(a)*r,st.z+Math.sin(a)*r)}q.act=indoor?"warming up by the stove":"sitting by the fire"}})}
  log(`You get a small fire going in a coffee can${ppl.length?" and everyone huddles around it":""} for a while.`);warm();step(HOUR)}
// the bodies of the dead, burned or buried
function clearBodies(bury){const pl=pl_();const dead=S.walkers.filter(w=>w.loc===pl.loc&&w.dead);const n=dead.length;if(!n){toast(`There are no bodies here to ${bury?"bury":"burn"}.`);return}
  const named=dead.filter(w=>w.name).map(w=>w.name);
  log(bury?`You dig ${n>1?"a long shallow trench":"a shallow grave"} and lay ${n>1?`the ${n} bodies`:"the body"} in it.${named.length?` You say a few words for ${listAnd(named)}.`:""}`:`You drag ${n>1?`the ${n} bodies`:"the body"} out into the open, well away from the buildings, and burn ${n>1?"them":"it"}. The smoke is awful. It's still better than leaving them.`);
  if(named.length)for(const q of members())q.mood=clamp(q.mood+3,0,100);
  S.walkers=S.walkers.filter(w=>!dead.includes(w));step(bury?2*HOUR:HOUR)}
// burning a place down can't be undone, so it's always asked first
function askBurn(){const pl=pl_();const k=pl.loc;if(k===campK()){toast("That's your camp. You live here.");return}if(!LOCS[k]||k==="road"||k==="start"){toast("There's nothing here to burn.");return}if(place(k).burned){toast("It's already burned.");return}
  if(typeof confirmCard==="function")confirmCard("Burn it down?",`Set ${LOCS[k].n} on fire. Anything you haven't searched burns with it, and nobody can live here after. It can't be undone.`,burnPlace);else burnPlace()}

// ================= guns =================
// Once you find a gun you keep it on you. Rounds come out of what you're carrying, or out of camp stores when you're home
// (before there's a camp, the stores are just what the group has with them).
function loadUp(){const pl=pl_();if(!pl.gun)return 0;const cap=GUNS[pl.gun].carry;let need=cap-(pl.rounds||0),got=0;if(need<=0)return 0;
  const h=S.haul;for(const o of [...h.items]){if(o.k!=="ammo"||need<=0)continue;const d=Math.min(o.n,need);o.n-=d;need-=d;got+=d;if(o.n<=0)h.items.splice(h.items.indexOf(o),1)}
  if(need>0&&(!S.camp||pl.loc===campK())){const d=Math.min(need,Math.floor(S.res.ammo+1e-6));if(d>0){S.res.ammo-=d;need-=d;got+=d;syncInv()}}
  pl.rounds=(pl.rounds||0)+got;return got}
// pick up a gun you've just found (not one someone else brought into camp), and keep it loaded
function armUp(quiet,looted){if(!S)return;const pl=pl_();if(!LOCS[pl.loc])return;
  if(!pl.gun){const h=S.haul;const hg=h.items.filter(o=>GUNS[o.k]).sort((a,b)=>GUN_RANK[b.k]-GUN_RANK[a.k])[0];let k=null;
    if(hg){k=hg.k;hg.n--;if(hg.n<=0)h.items.splice(h.items.indexOf(hg),1)}
    else if(looted&&looted.length){k=[...looted].sort((a,b)=>GUN_RANK[b]-GUN_RANK[a]).find(k=>itemCount(k)>0)||null;if(k){takeItem(k,1);syncInv()}}
    if(k){pl.gun=k;pl.rounds=pl.rounds||0;loadUp();log(`You keep the ${ITEMS[k]} on you${pl.rounds?`, with ${pl.rounds} rounds`:", but there's no ammo for it yet"}. Click one of the dead to shoot it.`,"good");return}}
  if(pl.gun&&(pl.rounds||0)<GUNS[pl.gun].carry){const got=loadUp();if(got&&!quiet)log(`You load up: ${pl.rounds} rounds for the ${ITEMS[pl.gun]}.`)}}
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d};
function nearestWalker(){const pl=pl_();return walkersAt(pl.loc).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z))[0]||null}
function inSight(w){const pl=pl_();return pl.gun&&dist(pl.x,pl.z,w.x,w.z)<=GUNS[pl.gun].range&&clearLine(pl.loc,pl.x,pl.z,w.x,w.z)}
function shoot(w){const pl=pl_();const G=GUNS[pl.gun];if(!G||!w||w.dead||w.loc!==pl.loc||pl.ko>0)return false;
  const now=typeof performance!=="undefined"?performance.now():Date.now();if(now<(pl.gunReady||0))return true;
  if((pl.rounds||0)<=0&&!loadUp()){toast(`The ${ITEMS[pl.gun]} is empty. ${S.camp&&pl.loc!==campK()?"There may be ammo back at camp.":"Cars and the police station might have ammo."}`);return false}
  const d=dist(pl.x,pl.z,w.x,w.z);pl.rounds--;pl.gunReady=now+G.cool;pl.aim=now;pl.tx=null;pl.tz=null;pl.path=null;pl.onArrive=null;pl.dir=Math.atan2(w.x-pl.x,w.z-pl.z);
  // closer is surer, hurt and shaking is worse, and a shotgun can drop more than one
  const p=clamp(G.hit*(1-.5*(d/G.range)**2)-(pl.hp<40?.12:0),.15,.95);const hits=rf()<p?[w]:[];
  if(G.spread)for(const o of walkersAt(pl.loc)){if(o===w||dist(pl.x,pl.z,o.x,o.z)>G.range)continue;if(Math.abs(angDiff(Math.atan2(o.x-pl.x,o.z-pl.z),pl.dir))<.3&&rf()<G.spread)hits.push(o)}
  for(const o of hits)putDown(o);S.stats.shot=(S.stats.shot||0)+hits.length;
  if(typeof shotFx==="function")shotFx(pl,w,hits.includes(w));noiseAt(pl.loc,pl.x,pl.z,G.noise);
  if(!hits.length)say(pl,pick(["Missed.","Damn it.","Hold still...","Come on."]));
  else if(hits.length>1)log(`One blast from the shotgun drops ${hits.length} of them.`,"good");
  else if(rf()<.25)log(pick([`You drop one of the dead with the ${ITEMS[pl.gun]}.`,"One shot. It goes down and stays down.","The shot rolls away across the empty lot. One less of them."]));
  if(pl.rounds===0)toast("That was your last round.");
  return true}
// walk until you have a clear shot, then take it
function closeAndShoot(w,tries){const pl=pl_();if(!pl.gun||!w||w.dead)return;tries=tries||0;const R=GUNS[pl.gun].range*.7;const d=dist(pl.x,pl.z,w.x,w.z);
  if(d<=GUNS[pl.gun].range&&clearLine(pl.loc,pl.x,pl.z,w.x,w.z)){shoot(w);return}
  if(tries>1){approach(w,()=>{if(!w.dead)shoot(w)});return}
  const f=Math.max(0,(d-R)/Math.max(d,.01));moveTo(pl,pl.x+(w.x-pl.x)*f,pl.z+(w.z-pl.z)*f,()=>{if(!w.dead&&w.loc===pl.loc)closeAndShoot(w,tries+1)})}
function shootNearest(){const pl=pl_();if(!pl.gun){toast("You don't have a gun. Try the police station's armory, or that trooper's cruiser on the highway.");return}
  const L=walkersAt(pl.loc).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z));const w=L.find(inSight)||L[0];
  if(!w){toast("There's nothing to shoot here.");return}closeAndShoot(w)}

// ================= typed orders =================
// The same work the menus hand out, said in words: "Maya, cut some wood", "everyone board up the windows",
// "have someone build the fence", "push that car", "shoot the deer", "stop". Nobody named means you do it yourself.
const ORD_FILL=/^(please|tell|ask|have|get|make|order|can|could|would|will|you're|you are|you|to|and|i|we|want|need|should|both|of|them|then|now|okay|ok|hey|just|go ahead and|start)\b[\s,]*/;
const JOBBY=/\b(jobs?|duty|from now on|every ?day|all day|full ?time|in charge|for good|permanently|daily|from here on|regular(ly)?|be (our|the) \w+|run(s|ning)? the|head of|manage|boss)\b/;
function orderCore(t,names){let s=" "+t.toLowerCase().replace(/[,.!?;:]/g," ")+" ";
  for(const p of names)s=s.replace(new RegExp("\\b"+p.name.toLowerCase()+"('s)?\\b","g")," ");
  s=s.replace(/\b(everyone|everybody|all of you|you all|y'all|the group|someone|somebody|anyone|anybody|you guys|guys|folks)\b/g," ").replace(/\s+/g," ").trim();
  for(let i=0;i<12&&ORD_FILL.test(s);i++)s=s.replace(ORD_FILL,"").trim();return s}
// what to build, and whether it's a new one ("a fence") or the one that's laid out ("the fence")
function buildIn(s){let best=null,at=1e9;for(const [k,re] of Object.entries(BWORDS)){const m=re.exec(s);if(m&&m.index<at){at=m.index;best=k}}
  if(!best)return{type:null,fresh:false};return{type:best,fresh:/\b(a|an|another|new|second|third|more|extra|one more)\s+(\w+\s+)?$/.test(s.slice(0,at))}}
// the work a sentence asks for, or null
function taskIn(s){if(!s)return null;
  if(/^(stop|quit|halt|enough|cancel|never ?mind|forget (it|that)|drop (it|that|everything)|knock it off|leave it)\b(?! (following|coming|tagging))/.test(s))return{k:"stop"};
  if(/\b(check|show|walk|look at|inspect|see|test)\b.{0,20}\b(walls?|perimeter|yard|fences?|fence line|defen[cs]es|gaps?|holes?)\b|\b(is|are) (the |our )?(yard|walls?|fences?|camp|we|it) (sealed|safe|closed|secure|shut)\b|\bcan (they|the dead|walkers?|zombies?|biters?) (get|walk|come) in\b/.test(s))return{k:"perim"};
  if(/\bpush\b.{0,25}\b(cars?|cruiser|truck|van|vehicle|sedan|suv|wreck)\b|\b(in|into) neutral\b|\broll (the |that |a |this )?(car|truck|van|cruiser)\b/.test(s))return{k:"push"};
  const B=buildIn(s);
  if(/\b(build|finish|work on|keep (building|working)|help (build|with|on)|put up|raise|construct|get (to work|started|going) on|start on|carry on with|go build|lay out)\b/.test(s)&&(B.type||/\b(it|that|this|blueprint|the build|site|project)\b|^(build|keep building|finish( up)?)$/.test(s)))return{k:"build",type:B.type,fresh:B.fresh};
  if(/\b(fortify|batten down|shore up|lock (it|the (house|place|building)|this place) (down|up)|barricade (it|the (house|place|building|windows))|secure (it|the (house|place|building)|this place))\b|\bmake (it|the (house|place|building)|this place) (safe|secure)\b/.test(s))return{k:"fort"};
  if(/\b(un ?block|clear|move|take|drag|pull)\b.{0,25}\b(dresser|furniture|couch|sofa|cabinet|wardrobe|bookcase|shel(f|ves)|desk|fridge|table)\b.{0,25}\b(away|off|out of the way|back|from (the )?door)\b|\bunblock\b.{0,12}\bdoor|\bclear (the |that )?door(way)?\b/.test(s))return{k:"unfurn"};
  if(/\b(push|shove|move|drag|put|pile|stack|slide|wedge)\b.{0,25}\b(dresser|furniture|couch|sofa|cabinet|wardrobe|bookcase|shel(f|ves)|desk|fridge|table|chairs?)\b|\bblock (the |that |our )?(front |back )?door(way)?\b/.test(s))return{k:"furn"};
  if(/\b(fix|repair|mend|patch|rehang|hang)\b.{0,20}\bdoors?\b/.test(s))return{k:"fixdoor"};
  if(/\b(fix|repair|mend|patch|replace|reglaze)\b.{0,20}\bwindows?\b/.test(s))return{k:"fixwin"};
  if(/\bboard(s|ing)?\b.{0,25}\b(up|windows?|it|the (house|place|building))\b|\b(nail|put)\b.{0,15}\b(boards|planks)\b/.test(s))return{k:"board"};
  if(/\b(bar|brace|wedge|lock|secure|barricade|bolt)\b.{0,20}\bdoors?\b|\bbar (it|the place)\b/.test(s))return{k:"bar"};
  if(/\b(shut|close)\b.{0,20}\bdoors?\b/.test(s))return{k:"door",to:"shut"};
  if(/\b(open|prop)\b.{0,20}\bdoors?\b/.test(s))return{k:"door",to:"open"};
  if(/\b(stay|keep|wait|hide|go|get|head|hole up)\b.{0,10}\b(inside|indoors|in the (house|building|farmhouse|barn|place))\b/.test(s))return{k:"inside"};
  if(/\b(stand|keep|take|go on|be on)\b.{0,6}\b(guard|watch|lookout|look ?out)\b|\b(guard|watch|cover|hold)\b.{0,15}\b(the )?(door|gate|here|this|spot|entrance|window|me|yard|road|car|front|back|place|fort)\b/.test(s))return{k:"guard"};
  if(/\b(cut|chop|split|fell|gather|collect|get|bring( in)?|fetch|haul|find)\b.{0,20}\b(wood|logs?|firewood|lumber|timber|trees?|kindling|deadfall)\b|^(chop|cut)( some| more| down)?$|\bwood ?cutting\b/.test(s)){const n=+((/\b(\d{1,2})\b/.exec(s)||[])[1])||4;return{k:"chop",n:clamp(n,1,20)}}
  return null}
// the building an order is about: the barn if you said so, the one you're standing in, home at camp, or the nearest
function bldIdxFor(s){const pl=pl_();const k=pl.loc;if(!LOCS[k])return -1;const L=layout(k).b;if(!L.length)return -1;
  if(/\bbarn\b/.test(s||"")){const i=L.findIndex(r=>r.barn);if(i>=0)return i}
  const inn=bldAt(k,pl.x,pl.z);if(inn)return L.indexOf(inn);return homeIdx(k)}
// who does it: the people you named (if they're here), everyone who can, or the one best suited; nobody named means you
function orderDoers(t,names,tk){const pl=pl_();const heavy=HEAVY[tk.k]||tk.k==="fort"||tk.k==="push";
  const able=p=>p.status==="member"&&p.loc===pl.loc&&!(p.away&&p.away.out)&&!p.grabbed&&!(p.ko>0);
  if(everyoneIn(t))return members().filter(p=>able(p)&&p.hp>=35&&!(heavy&&p.kid)&&!(p.bitten&&p.quarantine));
  if(/\b(someone|somebody|anyone|anybody)\b/.test(t)){const sk=tk.k==="guard"?"fight":"build";
    return members().filter(p=>able(p)&&p.hp>=35&&!p.kid&&!(p.bitten&&p.quarantine)).sort((a,b)=>(a.order||a.follow?1:0)-(b.order||b.follow?1:0)||(b.sk[sk]||0)-(a.sk[sk]||0)||dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z)).slice(0,1)}
  if(!names.length&&/^(tell|ask|have|get|order|make)\b/.test(t)){const q=nearestPerson(p=>able(p)&&!(p.bitten&&p.quarantine));return q?[q]:[]}
  const L=[];for(const p of names){if(p.status!=="member")continue;if(!able(p)){toast(`${p.name} isn't here.`);continue}L.push(p)}return L}
// "Maya, cut some wood": true if it was an order (and it's been given)
function orderCmd(t,names,text){if(JOBBY.test(t))return false;const s=orderCore(t,names);const tk=taskIn(s);if(!tk)return false;
  const some=everyoneIn(t)||/\b(someone|somebody|anyone|anybody)\b/.test(t)||!names.length&&/^(tell|ask|have|get|order|make)\b/.test(t);const named=names.some(p=>p.status==="member");
  // "help Maya": you pitch in on whatever she's doing
  if(/^help\b/.test(t)&&named&&!some){const q=names.find(p=>p.status==="member");const o=q.order;
    if(o&&["build","chop","board"].includes(o.k)&&q.loc===pl_().loc){doMyself(o.k==="build"?{k:"build",bid:o.bid}:o.k==="board"?{k:"board",bi:o.bi,lvl:o.lvl}:{k:"chop",n:o.n||4});log(`You pitch in with ${q.name}.`);return true}}
  const who=orderDoers(t,names,tk);
  if(!who.length&&(named||some)){if(some)toast(everyoneIn(t)?"There's nobody here who can.":/^(tell|ask|have|get|order|make)\b/.test(t)&&!/\b(someone|somebody|anyone|anybody)\b/.test(t)?"There's nobody here to tell.":"There's nobody free here to do it.");return true}
  return runOrder(tk,who,text,s)}
// carry it out. who is empty when it's you.
function runOrder(tk,who,text,s){const pl=pl_();const k=pl.loc;const me=!who.length;s=s||"";
  if(me&&(pl.ko>0||S.flags.traveling||pl.grabbed))return true;
  if(!me&&text&&!who.some(p=>p.busyTalk))say(pl,cap1(String(text).replace(/^(i|we)\s+/i,"").trim().slice(0,90)));
  const each=f=>{if(me){const o=f(pl,0);if(o)doMyself(o);return}who.forEach((p,i)=>{const o=f(p,i);if(o)orderPerson(p,o)})};
  const one=o=>{if(me)doMyself(o);else orderPerson(who[0],o);for(const p of who.slice(1))if(p.status==="member")say(p,pick([`${who[0].name}'s got it.`,"I'll leave it to them."]),true)};
  const bldOnly=()=>{if(!LOCS[k]||!layout(k).b.length){toast("There's no building here.");return -1}return bldIdxFor(s)};
  switch(tk.k){
    case"stop":if(me){if(pl.order){pl.order.queue=null;endOrder(pl,true)}if(S.push)endPush(false);if(UI.pushPick)cancelPushPick();pl.tx=null;pl.tz=null;pl.path=null;pl.onArrive=null;toast("You stop what you're doing.");return true}
      for(const p of who){p.helpPush=false;if(p.order){p.order.queue=null;endOrder(p,false,pick(["Okay.","Alright, stopping.","Sure."]))}else say(p,pick(["I'm not doing anything.","Stop what?"]),true)}return true;
    case"perim":showPerimeter();return true;
    case"chop":each(()=>({k:"chop",n:tk.n||4}));if(me)log("You go to cut some wood.");return true;
    case"build":{if(k==="road"||!LOCS[k]){toast("Not out here on the highway.");return true}
      const bps=S.blds.filter(b=>b.loc===k&&!b.done&&!b.gone&&(!tk.type||b.type===tk.type)).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z));
      if(bps.length&&!tk.fresh){const b=bps[0];if(me){doMyself({k:"build",bid:b.id});log(`You get to work on the ${b.name.toLowerCase()}.`);return true}each(()=>({k:"build",bid:b.id}));return true}
      if(!me){UI.assign=who[0].id;UI.assignAlso=who.slice(1).map(p=>p.id)}
      if(!tk.type){openBuild();if(!me)toast(`Pick what ${listAnd(who.map(p=>p.name))} should build, then where it goes.`);return true}
      startPlace(tk.type);return true}
    case"push":{const cs=carsAt(k);if(!cs.length){toast("There are no cars here to push.");return true}if(S.push){for(const p of who)if(!p.kid){p.helpPush=true;say(p,"Coming!",true)}return true}
      let ci=0,bd=1e9;cs.forEach((c,i)=>{const d=dist(c.x,c.z,pl.x,pl.z);if(d<bd){bd=d;ci=i}});const cont=layout(k).conts.find(c=>c.car===ci);UI.car={k,cid:cont?cont.id:null,ci};
      for(const p of who){if(p.kid){say(p,"I'm not strong enough.",true);continue}orderPerson(p,{k:"push",txt:"waiting to push a car"})}ACTS.cpush();return true}
    case"inside":{if(me){goInside(s,false);return true}const bi=bldOnly();if(bi<0)return true;each(()=>({k:"inside",bi,until:S.t+6*HOUR}));return true}
    case"guard":{if(me&&/\bme\b/.test(s))return false;const bi=LOCS[k]&&layout(k).b.length&&/\b(door|entrance|front|house)\b/.test(s)?bldIdxFor(s):-1;const r=bi>=0?layout(k).b[bi]:null;
      const gate=/\bgate\b/.test(s)&&S.blds.find(b=>b.loc===k&&b.type==="gate"&&b.done);
      const base=gate?{x:gate.x,z:gate.z+1.4,face:Math.PI}:r?{x:r.door.ox,z:r.door.oz,face:Math.atan2(r.door.ox-r.x,r.door.oz-r.z)}:{x:pl.x+.8,z:pl.z+.8,face:null};
      each((p,i)=>{const a=i*2.1;return{k:"guard",x:base.x+(i?Math.cos(a)*1.3:0),z:base.z+(i?Math.sin(a)*1.3:0),face:base.face??(S.camp&&k===campK()?Math.atan2(pl.x,pl.z-4):pl.dir)}});
      if(me)log("You stand watch.");return true}
  }
  // the rest is about a building's doors and windows
  const bi=bldOnly();if(bi<0)return true;const st=bldState(k,bi);const r=layout(k).b[bi];const nm=r.barn?"the barn":"the house";
  switch(tk.k){
    case"board":{if(!st.wins.length){toast(`There are no windows on ${nm}.`);return true}const lo=Math.min(...st.wins.map(w=>w.board));if(lo>=3){toast("The windows are boarded as heavy as they'll go.");return true}
      each(()=>({k:"board",bi,lvl:Math.min(3,lo+1)}));return true}
    case"bar":if(st.bar>=2){toast("The door's barred as tight as it'll go.");return true}if(st.door==="broken"){toast("The door's broken. Fix it first.");return true}one({k:"bar",bi});return true;
    case"furn":if(st.furn){toast("The door's already blocked.");return true}one({k:"furn",bi});return true;
    case"unfurn":if(!st.furn){toast("Nothing's blocking the door.");return true}one({k:"unfurn",bi});return true;
    case"fixdoor":if(st.door!=="broken"&&st.dhp>=doorMax(st)){toast("The door's fine.");return true}one({k:"fixdoor",bi});return true;
    case"fixwin":if(!st.wins.some(w=>w.broken||w.hp<winMax(w)*.5)){toast("The windows are fine.");return true}each(()=>({k:"fixwin",bi}));return true;
    case"door":if(st.door==="broken"){toast("The door's broken. It won't shut until it's fixed.");return true}if(st.door===tk.to&&!(tk.to==="open"&&(st.bar||st.furn))){toast(tk.to==="shut"?"It's already shut.":"It's already open.");return true}one({k:"door",bi,to:tk.to});return true;
    case"fort":{const T=fortTasks(k,bi);if(!T.length){toast(`${cap1(nm)} is as tight as you can make it.`);return true}
      if(me){doMyself({...T[0],queue:T.slice(1)});log(`You set about making ${nm} safe.`);return true}
      // the door jobs shared out in turn, and then everyone boards windows (they take different ones)
      const n=who.length,lists=who.map(()=>[]);T.filter(x=>x.k!=="board").forEach((x,j)=>lists[j%n].push(x));const bd=T.find(x=>x.k==="board");if(bd)lists.forEach(l=>l.push(bd));
      who.forEach((p,i)=>{const L=lists[i];if(!L.length){say(p,"Looks like it's covered.",true);return}orderPerson(p,{...L[0],queue:L.slice(1)})});return true}}
  return false}
// making a building safe, in order: the door first, then the windows
function fortTasks(k,bi){const st=bldState(k,bi);const T=[];
  if(st.door==="broken")T.push({k:"fixdoor",bi});else{if(st.bar<2)T.push({k:"bar",bi});if(!st.furn)T.push({k:"furn",bi});if(st.door!=="shut"&&!T.length)T.push({k:"door",bi,to:"shut"})}
  if(st.wins.some(w=>w.broken&&!w.board))T.push({k:"fixwin",bi});const lo=st.wins.length?Math.min(...st.wins.map(w=>w.board)):3;if(lo<3)T.push({k:"board",bi,lvl:Math.min(3,lo+1)});return T}
// hunting and butchering in words: "shoot the deer", "go hunting", "butcher it", "have Maya skin the rabbit"
const ANIM_RE=/\b(deer|doe|does|bucks?|fawns?|stags?|turkeys?|rabbits?|bunn(y|ies)|hares?|animals?|wildlife|game)\b/;
function animalKind(s){return/\b(deer|doe|does|bucks?|fawns?|stags?)\b/.test(s)?"deer":/\bturkeys?\b/.test(s)?"turkey":/\b(rabbits?|bunn(y|ies)|hares?)\b/.test(s)?"rabbit":null}
function huntCmd(t,names){const pl=pl_();const mem=names.filter(p=>p.status==="member");const near=(a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z);
  if(/\b(butcher|skin|dress|gut|clean|carve( up)?|cut up|process)\b/.test(t)&&(ANIM_RE.test(t)||/\b(it|the kill|carcass|meat)\b/.test(t))){const kind=animalKind(t);
    const a=animalsAt(pl.loc).filter(a=>a.dead&&(!kind||a.k===kind)).sort(near)[0];if(!a){toast("There's nothing here to butcher. Hunt something first.");return true}
    if(mem.length){const p=mem.find(p=>p.loc===pl.loc&&!(p.away&&p.away.out));if(!p){toast(`${mem[0].name} isn't here.`);return true}orderPerson(p,{k:"butcher",aid:a.id,txt:`butchering the ${ANIMALS[a.k].n}`});return true}
    doMyself({k:"butcher",aid:a.id});return true}
  const verb=/\b(hunt|hunting|shoot|kill|track|stalk|bag|bring down|take down|go after|get)\b/.test(t);
  if(!(verb&&ANIM_RE.test(t))&&!/^(go )?(hunt|hunting)( for (food|meat|dinner|supper))?$/.test(t))return false;
  if(mem.length)return false;// "Maya, go hunting" is a job for her
  const kind=animalKind(t);const L=animalsAt(pl.loc).filter(a=>!a.dead&&(!kind||a.k===kind)).sort(near);
  if(!L.length){toast(kind?`There's no ${ANIMALS[kind].n} around here.`:"There's nothing to hunt here. Deer and turkey keep to the farm, the mill and the woods by the cabin.");return true}
  const how=/\b(gun|rifle|shotgun|pistol)\b/.test(t)&&pl.gun?"gun":haveBow()?"bow":pl.gun?"gun":null;
  if(!how){toast("You've nothing to hunt with. A bow or a gun would do it.");return true}
  huntAnimal(L[0],how);return true}
// what Claude's {"do":"order"} names, as the same task the typed words would give
function AI_TASK(a){const t=String(a.task||"").toLowerCase();const w=String(a.what||"").toLowerCase();
  const m={chop:{k:"chop",n:clamp(+a.n||4,1,20)},build:{k:"build",type:BUILDS[w]?w:buildIn(w).type,fresh:!!a.fresh},board:{k:"board"},bar:{k:"bar"},block:{k:"furn"},furn:{k:"furn"},unblock:{k:"unfurn"},unfurn:{k:"unfurn"},
    shut:{k:"door",to:"shut"},door_shut:{k:"door",to:"shut"},open:{k:"door",to:"open"},door_open:{k:"door",to:"open"},fixdoor:{k:"fixdoor"},fixwin:{k:"fixwin"},guard:{k:"guard"},inside:{k:"inside"},
    push:{k:"push"},perimeter:{k:"perim"},fortify:{k:"fort"},stop:{k:"stop"}};return m[t]||null}
