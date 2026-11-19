// ================= what people need, and what they do about it =================
// Every hour each person weighs what they need (food, water, sleep, safety, company, the people they love) against who
// they are (brave or timid, kind or cold, social or not) and what they remember, then picks something to do. They have the
// same choices you have: eat, drink, sleep, hide, board up a door, search a building, fetch water, forage, hunt, find their
// family, team up with the neighbors, join a group, steal, sit with a friend. What they take comes out of the same cupboards
// you search, and the dead they meet are the same dead you meet.

// ---------- what a household has at home: food in meals, water in drinks ----------
function hs(bid){if(!S.hs)S.hs={};let H=S.hs[bid];if(!H){const n=Math.max(1,S.people.filter(p=>p.alive&&p.home===bid&&!p.group).length);H=S.hs[bid]={food:Math.round(n*(3+rf()*7)),water:Math.round(n*(2+rf()*4)),boards:rf()<.45?rnd(1,3):0,med:rnd(0,2)}}return H}
const MEALS=k=>{const it=ITEMS[k];return it&&it.eat&&!it.eat.sick?it.eat.food/30:0};
const DRINKS={water_bottle:1,boiled_water:1,river_water:.9};
function packHas(p,k){return(p.pack&&p.pack[k])||0}
function packAdd(p,k,n=1){if(!p.pack)p.pack={};p.pack[k]=(p.pack[k]||0)+n}
function packTake(p,k,n=1){if(!p.pack||!p.pack[k])return 0;const t=Math.min(n,p.pack[k]);p.pack[k]-=t;if(p.pack[k]<=0)delete p.pack[k];return t}
function packCount(p){let n=0;for(const k in p.pack||{})n+=p.pack[k];return n}
function packMeals(p){let m=0;for(const k in p.pack||{})m+=MEALS(k)*p.pack[k];return m}
function packDrinks(p){let m=0;for(const k in DRINKS)m+=packHas(p,k)*DRINKS[k];return m}
// the best thing they could swing at the dead (0 if they've got nothing)
function npcArm(p){let best=0;for(const k in p.pack||{}){const it=ITEMS[k];if(it&&it.slot==="weapon"&&it.dmg>best&&(!it.gun||packHas(p,"ammo")))best=it.dmg}return best}
function npcGun(p){for(const k in p.pack||{})if(ITEMS[k]&&ITEMS[k].gun&&packHas(p,"ammo"))return k;return null}
function hisHer(p){return p.age<13?"their":p.sex==="F"?"her":"his"}
function atHomeB(p){const b=bldAt(p.x,p.z);return!!b&&b.id===p.home}
function homeBoarded(bid){const b=BMAP[bid];return!!b&&b.exits.some(d=>d.door&&d.door.bar>0)}
function unboarded(b){return b.exits.slice(1).some(d=>d.door&&!d.door.bar&&!d.door.broken)}
function setAct(p,act,ex){p.act=act;p.expo=ex}
function tally(k){if(!S.stats.tally)S.stats.tally={};S.stats.tally[k]=(S.stats.tally[k]||0)+1}

// ---------- one look at the whole town, once an hour ----------
function mindCtx(h,d,tmp){const pl=S.player;const live=!S.jump&&pl.alive!==false&&!pl.coma;const near=new Set();
  if(live)for(const p of S.people)if(p.alive&&Math.abs(p.x-pl.x)<50&&Math.abs(p.z-pl.z)<50)near.add(p.id);
  const cnt={};for(const z of S.zeds)cnt[z.r]=(cnt[z.r]||0)+1;const dz={};
  for(const k in PLACES){const div=k==="town"?100:k==="road"||k==="school"?35:["woods","fields","hills","wilds"].includes(k)?70:40;dz[k]=(cnt[k]||0)/div}
  const H=BMAP.clinic;let hz=0;for(const z of S.zeds)if(Math.abs(z.x-H.x)<15&&Math.abs(z.z-H.z)<15)hz++;
  const byHome={};for(const p of S.people)if(p.alive&&!p.group&&p.home&&!isFollower(p))(byHome[p.home]=byHome[p.home]||[]).push(p);
  const F=S.flags;
  return{h,d,tmp,live,near,dz,hosp:hz/3,byHome,night:h<6||h>=22,alarm:!!F.alarm,clinic:!!F.clinic,day1work:d===1&&!F.alarm&&h>=8&&h<17,
    groups:Object.values(S.groups).filter(g=>!g.dead&&g.home&&groupSize(g.id)>0)}}
// how badly someone needs food and water: 0 is fine, 1 is desperate
function needs(p,c){const mates=c.byHome[p.home]||[p];const n=Math.max(1,mates.length);const H=p.home&&BMAP[p.home]&&!p.group?hs(p.home):null;
  const meals=(H?H.food:0)+packMeals(p),drinks=(H?H.water:0)+packDrinks(p);const taps=!S.flags.waterOff&&H;
  const fd=meals/(n*2),wd=taps?9:drinks/(n*2.5);
  return{food:Math.max(clamp((2.5-fd)/2.5,0,1),clamp((40-p.hunger)/40,0,1)),water:Math.max(clamp((2-wd)/2,0,1),clamp((40-(p.thirst??85))/40,0,1)),fd,wd,H,n}}

// ---------- the body: hunger, thirst, sleep, fear, company ----------
function needsHour(p,c){const asleep=p.act==="asleep";
  if(p.thirst==null)p.thirst=85;if(p.rest==null)p.rest=80;if(p.fear==null)p.fear=0;if(p.soc==null)p.soc=60;
  p.hunger=clamp(p.hunger-(asleep?1.6:2.4),0,100);p.thirst=clamp(p.thirst-(asleep?2:3.4),0,100);
  p.rest=clamp(p.rest+(asleep?13:-(p.plan&&p.plan.out?6:4)),0,100);
  if(p.hunger<=0)p.health-=1.5;if(p.thirst<=0)p.health-=3;
  const company=isFollower(p)||(c.byHome[p.home]||[]).length>1||p.group&&groupSize(p.group)>1;p.soc=clamp(p.soc+(company?1:-3),0,100);
  if(!asleep)eatDrink(p,c);
  fearHour(p,c);
  const tm=60-(p.hunger<30?14:0)-(p.thirst<30?14:0)-p.fear*.25-(p.soc<25?8:0)+(p.partner?5:0);p.mood=clamp(p.mood+(tm-p.mood)*.06,0,100);
  // the people who love you hear that you're awake
  if(p.fam.you&&!p.follow&&!p.heard&&S.flags.wake&&!S.player.coma&&S.player.alive!==false){const pl=S.player;if(dist(p.x,p.z,pl.x,pl.z)<40||rf()<.02*Math.min(8,pl.flags.talks||0))p.heard=true}}
function eatDrink(p,c){const meal=c.h===7||c.h===12||c.h===18;const home=!p.group&&p.home&&atHomeB(p)?hs(p.home):null;
  if(p.group&&!isFollower(p)){const g=G(p.group);if(g&&g.home&&regionAt(p.x,p.z)===g.home&&p.thirst<45&&g.stock.water>=.25){g.stock.water-=.25;p.thirst=clamp(p.thirst+35,0,100)}}
  else{
    if(p.hunger<(meal?75:45)){let k=null;for(const q in p.pack||{})if(MEALS(q)&&(!k||MEALS(q)>MEALS(k)))k=q;
      if(home&&home.food>=1&&(p.hunger<45||!k||p.hunger<75&&home.food>4)){home.food-=1;p.hunger=clamp(p.hunger+42,0,100)}
      else if(k){packTake(p,k);p.hunger=clamp(p.hunger+MEALS(k)*42,0,100)}}
    const b=bldAt(p.x,p.z);const tap=!S.flags.waterOff&&b&&b.taps&&b.taps.length;
    if(p.thirst<(meal?80:50)){if(tap)p.thirst=100;else if(home&&home.water>=1){home.water-=1;p.thirst=clamp(p.thirst+42,0,100)}
      else{const k=Object.keys(DRINKS).find(q=>packHas(p,q));if(k){packTake(p,k);packAdd(p,"empty_bottle");p.thirst=clamp(p.thirst+40,0,100);if(k==="river_water"&&rf()<.2)p.health-=6}}}}}
function fearHour(p,c){const F=S.flags;let t=0;
  if(F.alarm)t=c.d<=1?50:c.d<=3?38:28;else if(F.clinic)t=10+p.tr.curious*5;
  t+=Math.min(30,(c.dz[regionAt(p.x,p.z)]||0)*25);
  if(p.seen&&S.t-p.seen<120)t+=22;
  if(p.mem.some(m=>m.v<=-8&&S.t-m.t<DAY))t+=12;
  const g=p.group?G(p.group):null;
  if(g&&g.home&&regionAt(p.x,p.z)===g.home)t-=12+Math.min(16,siteCount(g.home,"wall")*3)+Math.min(10,groupSize(g.id)*.6);
  else if(isFollower(p))t-=10;
  else if(atHomeB(p)){t-=4+Math.min(12,((c.byHome[p.home]||[]).length-1)*3);if(homeBoarded(p.home))t-=8}
  if(npcArm(p))t-=8;t-=p.tr.brave*22;if(p.age<13)t+=8;
  t=clamp(t,0,100);p.fear=clamp(p.fear+(t-p.fear)*.35,0,100)}

// ---------- choosing ----------
function mindHour(p,c){if(p.age<2)return;
  if(p.group){campHour(p,c);return}
  if(p.age<13){kidHour(p,c);return}
  const cur=p.plan;if(cur&&cur.until>S.t&&!urgent(p,c,cur)){planTick(p,c);return}
  startPlan(p,choosePlan(p,c),c)}
function urgent(p,c,cur){if(cur.pre&&c.alarm)return true;if(cur.out&&cur.st!=="back"&&(p.fear>90||p.health<30))return true;
  if(cur.k!=="sleep"&&p.rest<8&&!cur.out)return true;if(cur.k==="sleep"&&c.alarm&&(p.hunger<12||p.thirst<12))return true;return false}
function choosePlan(p,c){const O=[];const add=(k,s,o)=>{if(s>0)O.push(Object.assign({k,s},o||{}))};const N=needs(p,c);p._n=N;const h=c.h,tr=p.tr;const adult=p.age>=16;
  const home=p.home&&BMAP[p.home]?BMAP[p.home]:null;
  if(!c.alarm){// an ordinary day, until it isn't
    if(c.night)add("sleep",80);else if(p.rest<20)add("sleep",50);
    const w=JOBS[p.job]?.work;if(c.day1work&&w&&w!=="home"&&(adult||h<15))add("work",62);
    if(c.clinic&&dayOf(S.t)===1&&["nurse","doctor","deputy"].includes(p.job))add("duty",58+tr.brave*20+tr.kind*10);
    if(c.clinic&&adult&&h<12)add("gawk",12+tr.curious*30+tr.brave*8-(p.job==="nurse"||p.job==="doctor"?60:0));
    if(!c.night&&h>=9&&h<21&&adult)add("errand",14+tr.social*14+(h===12||h===18?14:0)+rf()*6);
    if(h>=18&&h<23&&p.age>=21)add("bar",8+tr.social*24+tr.temper*4-tr.faith*6);
    if(h>=17&&h<22)add("social",12+(100-p.soc)*.3+tr.social*14);
    add("home",h>=17&&h<22?34:26);return pickBest(p,O)}
  // after the alarm, it's about staying alive
  if(c.night)add("sleep",55+(100-p.rest)*.35-(p.fear>75?14:0));else if(p.rest<25)add("sleep",42+(25-p.rest));
  if(p.health<50)add("rest",30+(50-p.health));
  if(p.mood<40&&p.mem.some(m=>m.v<=-8&&S.t-m.t<DAY&&m.a!=="you"))add("mourn",24+(40-p.mood)*.4);
  if(home)add("hide",22+p.fear*.45+(1-tr.brave)*12+(c.d<=1?8:0));
  if(c.d===1&&h<18&&["nurse","doctor","deputy"].includes(p.job))add("duty",28+tr.brave*26+tr.kind*12-p.fear*.3);
  if(c.d===1&&h<18&&p.job==="teacher")add("duty",30+tr.kind*28-p.fear*.25);
  const fam=famMissing(p,c);if(fam)add("gofam",fam.u,{q:fam.q.id});
  const day=!c.night;
  if(home&&HOMES.includes(home.type)&&unboarded(home)&&(N.H&&N.H.boards>0||packHas(p,"wood")>=2&&packHas(p,"nails")))add("board",14+p.fear*.32+p.sk.build*4);
  if(day&&adult&&c.d<=2&&h>=8&&h<20)add("stock",10+N.food*30+N.water*22+tr.ambit*10+tr.brave*8-p.fear*.25-(c.dz.town||0)*12);
  if(day&&adult)add("scavenge",6+N.food*55+N.water*35+tr.brave*12+p.sk.scavenge*3-p.fear*.35-(c.dz.town||0)*18);
  if(S.flags.waterOff&&adult&&N.water>0)add("water",10+N.water*62-p.fear*.2-(c.dz.river||0)*10-(c.night?25:0));
  if(day&&adult&&(p.sk.survive>=2||N.food>.6)){add("forage",4+N.food*38+p.sk.survive*5-p.fear*.25-(c.dz.fields||0)*10);if(npcArm(p)||p.sk.survive>=3)add("hunt",2+N.food*40+p.sk.survive*5-p.fear*.25-(c.dz.woods||0)*10)}
  if(adult&&c.groups.length){const tg=bestGroup(p,c,N);if(tg)add("seek",tg.s,{g:tg.g.id})}
  if(adult){const pk=pactWith(p,c,N);if(pk)add("pact",pk.s,{q:pk.q.id})}
  if(adult&&c.d>=2&&!p.seed&&p.hh!=="you"&&!p.fam.you){const s=(1-tr.brave)*22+p.fear*.32+N.food*10-(fam?40:0)-p.mem.filter(m=>m.v>=5).length*2;if(s>30)add("flee",s-6)}
  if(adult&&N.food>.65&&p.hunger<35&&tr.honest<.45)add("steal",6+N.food*28+(1-tr.honest)*18-tr.kind*14-p.fear*.15+(c.night?10:0));
  if(h>=17&&h<23||p.soc<25)add("social",8+(100-p.soc)*.32+tr.social*12-p.fear*.18);
  add("home",16);
  return pickBest(p,O)}
function pickBest(p,O){let b=null;const cur=p.plan&&p.plan.until>S.t?p.plan.k:null;for(const o of O){o.s+=rf()*8+(o.k===cur?10:0);if(!b||o.s>b.s)b=o}return b||{k:"home",s:0}}
// the person they'd go out into all of this for
function famMissing(p,c){let best=null;const pl=S.player;
  for(const [id,rel] of Object.entries(p.fam)){
    if(id==="you"){if(p.follow||pl.alive===false||!["partner","sibling","little sibling","kid","son","parent","mom or dad","guardian"].includes(rel))continue;
      if(pl.coma?c.alarm&&c.d===1&&!S.flags.triedYou&&p.age>=14:p.heard&&dist(p.x,p.z,pl.x,pl.z)>8){const u=pl.coma?50:60;if(!best||u>best.u)best={q:pl,u}}continue}
    const q=P(id);if(!q||!q.alive||q.group&&q.group===p.group||isFollower(q)||dist(q.x,q.z,p.x,p.z)<7)continue;
    if(q.home===p.home&&!q.group&&atHomeB(q)&&!atHomeB(p)&&q.age>=13)continue;
    if(q.home===p.home&&!q.group&&atHomeB(q)&&atHomeB(p))continue;
    const r=relGet(p,q);if(r<20)continue;
    let u=q.age<13?72:q.age<18?58:p.partner===q.id?52:r>60?36:24;if(q.group)u*=.45;if(q.plan&&q.plan.k==="with")u*=.3;u+=p.tr.kind*8-(p.fear>85?12:0);
    if(!best||u>best.u)best={q,u}}
  return best}
// which camp a household would go to, and how much they want to
const RALLY={walt:"r_farm",grace:"r_church",ray:"r_school",cole:"r_quarry"};
function bestGroup(p,c,N){const mates=(c.byHome[p.home]||[p]).filter(q=>q.hh===p.hh);if(mates.some(q=>q!==p&&q.age>=16&&q.tr.ambit>p.tr.ambit))return null;
  if(mates.some(q=>q.seed&&RALLY[q.seed]&&!S.flags[RALLY[q.seed]]))return null; // they mean to start their own
  const kids=mates.some(q=>q.age<13);let best=null;
  for(const g of c.groups){if(p.rej&&p.rej[g.id]&&S.t-p.rej[g.id]<DAY*3)continue;if(g.pol.closed)continue;
    let s=0;const L=g.leader==="you"?null:P(g.leader);const ms=members(g.id);
    for(const q of mates){for(const m of ms)s+=Math.max(-5,relGet(q,m))/25;if(L)s+=relGet(q,L)/12;if(Object.keys(q.fam).some(id=>P(id)?.alive&&P(id).group===g.id))s+=22}
    if(g.home==="church")s+=p.tr.faith*10+p.tr.kind*4;if(g.home==="quarry")s+=p.tr.brave*6+p.tr.ambit*4-p.tr.kind*6-(kids?6:0);if(g.home==="farm")s+=(p.job.startsWith("farm")?8:0)+3;if(g.home==="school")s+=(kids?4:0)+p.tr.honest*3;
    if(g.leader==="you")for(const q of mates)s+=feel(q)/8;
    const gs=groupSize(g.id);s-=gs/5+Math.max(0,gs-14)*.9;
    if(!best||s>best.s)best={g,s}}
  if(!best)return null;if(!S.hold)S.hold={};if(S.hold[p.hh]==null)S.hold[p.hh]=clamp(Math.round(rf()*4+(1-p.tr.social)*4+p.tr.brave*2-(kids?1:0)),1,12);
  const s=6+p.fear*.3+N.food*26+N.water*18+(1-p.soc/100)*8+p.tr.social*10+(kids?6:0)+Math.min(12,(c.d-1)*3)-p.tr.ambit*10-(1-p.tr.social)*8-(c.d<S.hold[p.hh]?30:0)+best.s*.6;
  return{g:best.g,s}}
// which neighbors they'd move in with
function pactWith(p,c,N){if(c.h<8||c.h>19||p.pactT&&S.t-p.pactT<DAY||p.hh==="you"||p.fam.you)return null;const home=BMAP[p.home];if(!home||!HOMES.includes(home.type))return null;
  const mates=c.byHome[p.home]||[];if(mates.length>=6||mates.some(q=>q!==p&&q.age>=16&&q.tr.social>p.tr.social&&q.hh===p.hh))return null;
  let best=null;for(const [bid,qs] of Object.entries(c.byHome)){if(bid===p.home||bid===S.player.home)continue;const b=BMAP[bid];if(!b||!HOMES.includes(b.type))continue;
    const dd=dist(b.x,b.z,home.x,home.z);if(dd>32||qs.length+mates.length>8||qs.some(q=>q.hh==="you"||q.fam.you))continue;
    const heads=qs.filter(q=>q.age>=16);if(!heads.length)continue;let r=-100;for(const q of heads)r=Math.max(r,relGet(p,q));if(r<-5)continue;
    const s=8+p.fear*.3+(mates.length<=1?14:mates.length<=2?6:0)+Math.max(N.food,N.water)*12+p.tr.social*10+p.tr.kind*5+r*.25-dd*.3-(1-p.tr.social)*6+Math.min(9,(c.d-1)*3);
    if(!best||s>best.s)best={q:heads.sort((a,b)=>relGet(p,b)-relGet(p,a))[0],s}}
  return best}

// ---------- doing ----------
function goHome(p,night){placeTo(p,homePos(p,night))}
function trip(p,k,dest,o){const pl=Object.assign({k,t:S.t,until:S.t+8*60,st:"go",dest:{x:dest.x,z:dest.z},out:true,n:1,wait:0},o||{});p.plan=pl;placeTo(p,dest);return pl}
function stay(p,k,act,ex,dest,o){const pl=Object.assign({k,t:S.t,until:S.t+60,st:"do"},o||{});p.plan=pl;if(dest)placeTo(p,dest);setAct(p,act,ex);return pl}
function startPlan(p,o,c){const k=o.k;const home=p.home&&BMAP[p.home];const pre=!c.alarm;
  switch(k){
    case"sleep":{stay(p,k,"asleep",.03,null);const b=bldAt(p.x,p.z);if(home&&(!c.alarm||b===home||!b))goHome(p,true);else if(b&&b.beds.length){const bd=pick(b.beds);placeTo(p,{x:bd.x,z:bd.z,bed:true,rot:bd.rot})}return}
    case"work":{const w=JOBS[p.job].work;const b=BMAP[w];const pl=trip(p,k,b?insidePos(b):randIn(w==="farm"?"farm":w==="woods"?"woods":w==="church"?"church":w==="quarry"?"quarry":"road"),{pre,n:9,out:false});pl.until=S.t+60*Math.max(1,17-c.h);setAct(p,p.age<18?"at school":"at work",0);return}
    case"duty":{const ward=p.job==="nurse"||p.job==="doctor";const sch=p.job==="teacher";const b=BMAP[sch?"schoolbldg":ward?"clinic":"sheriff"];const o=doorOut(BMAP.clinic);
      const hot=S.zeds.some(z=>bldAt(z.x,z.z)===BMAP.clinic);
      const dest=sch?insidePos(b):ward?(!hot&&rf()<.6?insidePos(b):{x:o.x+rnd(-3,3),z:o.z+rnd(0,2)}):{x:o.x+rnd(-5,5),z:o.z+rnd(1,4)};
      const pl=trip(p,k,dest,{n:3,out:!sch});pl.until=S.t+180;setAct(p,sch?"keeping the kids calm at the school":ward?"helping at the hospital":"trying to keep order on Main Street",sch?.15:1.1);return}
    case"gawk":{const o=doorOut(BMAP.clinic);trip(p,k,{x:o.x+rnd(-6,6),z:o.z+rnd(3,7)},{pre,n:1});setAct(p,"watching the commotion at the hospital",.8);return}
    case"errand":{const h=c.h;let id=h===12||h===18?"diner":pick(["grocery","grocery","pharmacy","hardware","gas","library","diner"]);if(p.tr.faith>.8&&rf()<.3)id="churchbldg";const b=BMAP[id];
      const L={diner:h<15?"having lunch at Rosa's":"having supper at Rosa's",grocery:"shopping at the Food Mart",pharmacy:"picking up a prescription",hardware:"at Ellis Hardware",gas:"filling up at Kwik Gas",library:"at the library",churchbldg:"at St. Brigid's"}[id];
      trip(p,k,insidePos(b),{pre,n:1,bid:id,out:false});setAct(p,L,0);return}
    case"bar":{trip(p,k,insidePos(BMAP.bar),{pre,n:2,out:false});setAct(p,"having a drink at The Low Water",0);return}
    case"social":{const q=friendFor(p,c);if(!q){stay(p,"home",c.alarm?"holed up at home":"at home",.06,home?insidePos(home):null);return}
      const v=pairVerb(p,q,c);if(!c.alarm&&!(q.home===p.home)){const qb=BMAP[q.home];trip(p,k,qb?insidePos(qb):{x:q.x,z:q.z},{pre,n:2,q:q.id,out:false});setAct(p,`visiting ${q.name}`,0);return}
      const pl=stay(p,k,`${v} with ${q.name}`,q.home===p.home?.06:.5,{x:q.x+(rf()-.5)*1.2,z:q.z+(rf()-.5)*1.2},{q:q.id});bond(p,q,v);return}
    case"rest":stay(p,k,"resting, injured",.04,home&&!atHomeB(p)?homePos(p,true):null);return;
    case"mourn":stay(p,k,"grieving",.05,home&&!atHomeB(p)?insidePos(home):null);return;
    case"hide":stay(p,k,p.fear>60?"hiding at home with the lights off":"holed up at home",.04,home&&(!atHomeB(p)||rf()<.3)?insidePos(home):null);secureHome(p);return;
    case"home":stay(p,k,pre?"at home":"holed up at home",.06,home&&(!atHomeB(p)||rf()<.4)?insidePos(home):null);if(!pre)secureHome(p);return;
    case"board":stay(p,k,"boarding up the house",.12,home?insidePos(home):null);boardOne(p);return;
    case"gofam":{const q=o.q==="you"?S.player:P(o.q);if(!q){startPlan(p,{k:"hide"},c);return}const rel=p.fam[q.id==="you"?"you":q.id]||"family";
      const dest=q===S.player&&S.player.coma?(()=>{const d=doorOut(BMAP.clinic);return{x:d.x+rnd(-2,2),z:d.z+rnd(1,3)}})():{x:q.x+(rf()-.5)*2,z:q.z+(rf()-.5)*2};
      trip(p,k,dest,{q:o.q,n:1});setAct(p,q===S.player?`looking for ${S.player.name.split(" ")[0]}`:`looking for ${hisHer(p)} ${rel} ${q.name}`,.9);return}
    case"stock":case"scavenge":{const b=lootTarget(p,c,k);if(!b){startPlan(p,{k:"hide"},c);return}trip(p,k,insidePos(b),{bid:b.id,n:k==="stock"?1:2,ret:true});setAct(p,`${k==="stock"?"grabbing supplies at":"searching"} ${b.n}`,.75);return}
    case"water":{const hb=home||{x:p.x,z:p.z};let x=clamp(hb.x+rnd(-8,8),-120,120),z=hb.z<47?40.3:53.7;for(let i=0;i<8&&!free(x,z,.3,"npc");i++)x+=rnd(-6,6);trip(p,k,{x,z},{n:1,ret:true});setAct(p,"fetching water at the river",.7);return}
    case"forage":case"hunt":{const r=k==="hunt"?"woods":(home&&home.x<-10?"fields":rf()<.5?"fields":"woods");trip(p,k,randIn(r,4),{n:k==="hunt"?3:2,ret:true,got:0,r});setAct(p,k==="hunt"?`hunting in ${PLACES[r].n}`:`foraging in ${PLACES[r].n}`,.6);return}
    case"seek":{const g=G(o.g);if(!g||!g.home){startPlan(p,{k:"hide"},c);return}const dest=randIn(g.home,3);trip(p,k,dest,{g:g.id,n:1,ret:false});setAct(p,`heading to ${PLACES[g.home].n}`,.8);
      for(const q of (c.byHome[p.home]||[]))if(q!==p&&q.hh===p.hh){q.plan={k:"with",lead:p.id,t:S.t,until:S.t+6*60,st:"do"};placeTo(q,{x:dest.x+(rf()-.5)*2,z:dest.z+(rf()-.5)*2});setAct(q,`going with ${p.name} to ${PLACES[g.home].n}`,.8)}return}
    case"pact":{const q=P(o.q);if(!q||!BMAP[q.home]){startPlan(p,{k:"hide"},c);return}p.pactT=S.t;trip(p,k,insidePos(BMAP[q.home]),{q:q.id,n:1,ret:true});setAct(p,`talking to the ${q.sur||q.name} household`,.7);return}
    case"flee":{const mates=(c.byHome[p.home]||[p]).filter(q=>q.hh===p.hh);const how=rf()<.7?"packed the car and drove north":"left town on foot, heading north";for(const q of mates)leave(q,how);return}
    case"steal":{const b=stealTarget(p,c);if(!b){startPlan(p,{k:"hide"},c);return}trip(p,k,insidePos(b),{bid:b.id,n:1,ret:true,got:0});setAct(p,"out on their own",.6);return}
  }
  stay(p,"home",pre?"at home":"holed up at home",.06,home&&!atHomeB(p)?insidePos(home):null)}
function arrivedAt(p,c,pl){if(!c.live||!c.near.has(p.id)){p.x=p.tx;p.z=p.tz;return true}return dist(p.x,p.z,p.tx,p.tz)<3}
function planTick(p,c){const pl=p.plan;
  if(pl.k==="with"){const L=P(pl.lead);if(!L||!L.alive||L.group&&L.group!==p.group&&!p.group){if(L&&L.group&&L.alive){joinGroup(p,L.group,true)}p.plan=null;return}placeTo(p,{x:L.tx+(rf()-.5)*1.6,z:L.tz+(rf()-.5)*1.6});setAct(p,`with ${L.name}`,L.expo??.3);return}
  if(pl.st==="go"){if(arrivedAt(p,c,pl)||++pl.wait>=3){pl.st="do";onArrive(p,c,pl)}return}
  if(pl.st==="do"){onWork(p,c,pl);if(p.plan!==pl)return;pl.n--;if(pl.n<=0){if(pl.ret){pl.st="back";goHome(p);setAct(p,"heading home",.6);pl.until=S.t+180}else pl.until=S.t}return}
  if(pl.st==="back"){if(arrivedAt(p,c,pl)||(pl.wb=(pl.wb||0)+1)>=3){unpack(p,pl);pl.until=S.t}}}
function onArrive(p,c,pl){const k=pl.k;
  if(k==="stock"||k==="scavenge"){const n=lootSome(p,BMAP[pl.bid],k==="stock"?4:3);pl.found=(pl.found||0)+n;p.expo=1.1}
  else if(k==="gofam")reunite(p,c,pl);
  else if(k==="seek")askJoin(p,c,pl);
  else if(k==="pact")offerPact(p,c,pl);
  else if(k==="steal")trySteal(p,c,pl);
  else if(k==="errand"&&pl.bid==="diner")p.hunger=clamp(p.hunger+40,0,100);
  else if(k==="social"&&pl.q){const q=P(pl.q);if(q&&q.alive)bond(p,q,"talking")}
  else if(k==="bar"){p.soc=clamp(p.soc+20,0,100);const there=S.people.filter(q=>q!==p&&q.alive&&q.plan&&q.plan.k==="bar");if(there.length){const q=pick(there);relAdd(p,q,(compat(p,q)-.4)*6+rf()*3)}}}
function onWork(p,c,pl){const k=pl.k;
  if(k==="scavenge"&&pl.n>1){pl.found=(pl.found||0)+lootSome(p,BMAP[pl.bid],2)}
  if(k==="water")packAdd(p,"river_water",rnd(2,4)+(p.age>=16?1:0));
  if(k==="forage")pl.got+=(.4+p.sk.survive*.25)*(.5+rf())*(S.flags.winter?.4:1);
  if(k==="hunt"&&rf()<.22+p.sk.survive*.06+(npcArm(p)?.1:0))pl.got+=rnd(2,5);
  if(k==="duty"&&p.job==="teacher"&&c.h>=17)pl.n=0}
// bring it all home: what they found goes into the house, they keep a little on them
function unpack(p,pl){const H=p.home&&BMAP[p.home]&&!p.group?hs(p.home):null;if(!H)return;
  if(pl.got){H.food+=pl.got;pl.got=0}
  let keepF=1,keepW=1;for(const k of Object.keys(p.pack||{})){const m=MEALS(k);if(m){const n=p.pack[k]-(keepF>0?1:0);keepF=0;if(n>0){H.food+=m*n;packTake(p,k,n)}}
    else if(DRINKS[k]){const n=p.pack[k]-(keepW>0&&k==="water_bottle"?1:0);if(k==="water_bottle")keepW=0;if(n>0){H.water+=DRINKS[k]*n;packTake(p,k,n)}}
    else if(k==="wood"&&p.pack[k]>=2&&packHas(p,"nails")){H.boards+=Math.floor(p.pack[k]/2);packTake(p,k,p.pack[k]);packTake(p,"nails",1)}
    else if(["bandage","painkillers","antibiotics"].includes(k)&&p.pack[k]>1){H.med+=p.pack[k]-1;packTake(p,k,p.pack[k]-1)}}
  if(pl.found>=6&&rf()<.25)news(`${fullName(p)} came back from ${BMAP[pl.bid]?.n||"town"} with a full bag.`,"",[p.id])}

// ---------- the cupboards are the same ones you search ----------
const SHOPS=["grocery","pharmacy","gas","hardware","diner","bar","library","sheriff"];
function contLeft(b){let n=0;for(const C of b.cs){const s=S.cont[C.id];if(!s||!s.rolled||s.c.items.length)n++}return n}
function lootTarget(p,c,k,base){const home=base||BMAP[p.home]||{x:p.x,z:p.z};const N=p._n||{food:0,water:0};let best=null,bs=-1e9;
  for(const b of BUILDINGS){if(b.site||b.id===S.player.home||b.id===p.home||!b.cs.length)continue;const shop=SHOPS.includes(b.id);if(k==="stock"&&!shop)continue;
    if(!shop&&(!HOMES.includes(b.type)||(c.byHome[b.id]||[]).length))continue;
    const left=contLeft(b);if(!left)continue;const vis=(S.bl&&S.bl[b.id])||0;
    let s=left*1.2-dist(b.x,b.z,home.x,home.z)/9-vis*1.4+(shop?4:0)+rf()*4;
    if(N.water>.4&&(b.id==="grocery"||b.id==="gas"))s+=4;if(p.health<60&&b.id==="pharmacy")s+=4;if(b.id==="clinic")s-=20;
    if(s>bs){bs=s;best=b}}
  return best}
// what they'd want to carry out of a building
function npcWants(p,id){const it=ITEMS[id];if(!it)return 0;if(MEALS(id)||DRINKS[id])return 3;if(["bandage","painkillers","antibiotics"].includes(id))return 2;
  if(it.slot==="weapon"&&it.dmg>npcArm(p))return 3;if(id==="ammo"&&npcGun(p))return 2;if(["nails","wood","duct_tape","hammer"].includes(id))return 1;if(["flashlight","lighter","cards","cigarettes","whiskey"].includes(id)&&!packHas(p,id))return 1;return 0}
function lootSome(p,b,max){if(!b)return 0;let got=0;const cap=(p.age<16?8:14)+(packHas(p,"backpack")?6:0);
  for(const C of shuffle([...b.cs]).slice(0,4)){if(got>=max||packCount(p)>=cap)break;const s=rollLoot(C.id);
    const items=[...s.c.items].sort((a,o)=>npcWants(p,o.id)-npcWants(p,a.id));
    for(const o of items){if(got>=max||packCount(p)>=cap)break;const w=npcWants(p,o.id);if(w<=0||w===1&&rf()<.5)continue;
      const it=ITEMS[o.id];if(it.slot==="weapon")for(const q in p.pack)if(ITEMS[q]?.slot==="weapon")delete p.pack[q];
      cRemove(s.c,o);s.rev=(s.rev||0)+1;packAdd(p,o.id,it.slot?1:o.n);got++}}
  if(!S.bl)S.bl={};S.bl[b.id]=(S.bl[b.id]||0)+1;return got}
function stealTarget(p,c){const home=BMAP[p.home]||{x:p.x,z:p.z};let best=null,bs=-1e9;
  for(const [bid,qs] of Object.entries(c.byHome)){if(bid===p.home||bid===S.player.home)continue;const b=BMAP[bid];if(!b||!HOMES.includes(b.type))continue;const H=hs(bid);if(H.food<3)continue;
    const d=dist(b.x,b.z,home.x,home.z);if(d>40)continue;const s=H.food-d/6-qs.length*2-qs.reduce((a,q)=>a+Math.max(0,relGet(p,q)),0)/20;if(s>bs){bs=s;best=b}}
  return best}

// ---------- the people they love ----------
function reunite(p,c,pl){const pl0=S.player;
  if(pl.q==="you"){if(pl0.coma){S.flags.triedYou=p.id;mem(p,`I went to the hospital for ${pl0.name.split(" ")[0]}. The dead were already inside. I couldn't get to them.`,-6,"you");p.fear=Math.min(100,p.fear+15);news(`${fullName(p)} tried to get into the hospital to reach someone and was driven back by the dead.`,"",[p.id]);pl.until=S.t;return}
    if(dist(p.x,p.z,pl0.x,pl0.z)<8||!c.live){p.follow=true;p.plan=null;p.heard=false;const r=p.fam.you;mem(p,`Found ${pl0.name.split(" ")[0]}. Alive. Awake. I'm not letting go again.`,12,"you");p.trust=clamp(p.trust+10,-100,100);p.aff=clamp(p.aff+10,-100,100);
      journal(`${p.name} found you. Your ${pl0.fam[p.id]||r||"family"}. Neither of you can say anything for a long time.`,"big");if(c.live&&W3.ok){bubble(p,styleSay(p,pick(["You're awake. You're really awake.","I looked everywhere for you. Everywhere.","Oh my God. Come here."])),4);snapFollowers()}markUI();return}
    pl.st="go";pl.wait=0;placeTo(p,{x:pl0.x+(rf()-.5)*2,z:pl0.z+(rf()-.5)*2});return}
  const q=P(pl.q);if(!q||!q.alive){pl.until=S.t;return}
  if(c.live&&c.near.has(p.id)&&dist(p.x,p.z,q.x,q.z)>6){pl.st="go";pl.wait=(pl.wait||0);placeTo(p,{x:q.x,z:q.z});return}
  const rel=p.fam[q.id]||"family";
  if(q.group&&q.group!==p.group){p.famHint=q.group;mem(p,`${q.name} is with ${G(q.group).name} now.`,2,q.id);pl.until=S.t;return}
  q.plan={k:"with",lead:p.id,t:S.t,until:S.t+4*60,st:"do"};if(q.home!==p.home&&(q.age<18||p.partner===q.id)){q.home=p.home}
  mem(p,`Got to ${q.name}. ${q.age<13?"Never letting go of that hand again.":"We're together. That's what matters."}`,6,q.id);mem(q,`${p.name} came for me.`,8,p.id);relAdd(p,q,6);
  if(rf()<.35)news(`${fullName(p)} found ${hisHer(p)} ${rel} ${q.name}${bldAt(q.x,q.z)?" at "+bldAt(q.x,q.z).n:""} and got them home.`,"good",[p.id,q.id]);
  pl.ret=true;pl.n=0}
// a household arrives at a camp and asks to be let in
function joinVerdict(g,ps){if(g.leader==="you")return!g.pol.closed;const L=P(g.leader);if(!L)return true;const n=groupSize(g.id);const days=g.stock.food/Math.max(1,n);
  let s=8+L.tr.kind*26+L.tr.ambit*8-(n>14?(n-14)*3:0)+(days>4?10:days<1.5?-15:0)+(g.pol.stance==="hostile"?-14:g.pol.stance==="friendly"?8:0);
  for(const q of ps){s+=relGet(L,q)/8;if(q.age>=16)s+=(q.sk.fight+q.sk.medic+q.sk.build+q.sk.survive)*.7;else s-=3;if(q.job==="doctor"||q.job==="nurse")s+=8}
  const H=ps[0]&&ps[0].home&&S.hs&&S.hs[ps[0].home];if(H)s+=Math.min(12,H.food*.4);return s+rf()*14>24}
function askJoin(p,c,pl){const g=G(pl.g);pl.until=S.t;if(!g||g.dead||!g.home)return;
  const mates=S.people.filter(q=>q.alive&&!q.group&&(q===p||q.home===p.home&&q.hh===p.hh&&(dist(q.x,q.z,p.x,p.z)<10||!c.live||q.plan&&q.plan.k==="with")));
  if(joinVerdict(g,mates)){bringIn(g,mates);return}
  const L=g.leader==="you"?null:P(g.leader);if(!p.rej)p.rej={};p.rej[g.id]=S.t;mem(p,`${g.name} turned us away${L?". "+L.name+" wouldn't even open the gate":""}.`,-5,L?L.id:p.id);if(L)relAdd(p,L,-15);
  for(const q of mates)if(q!==p){mem(q,`${g.name} turned us away.`,-3,L?L.id:p.id)}
  if(rf()<.5)news(`${g.name} turned away the ${p.sur||p.name} household at the gate.`,"",[p.id]);
  pl.ret=true;pl.st="back";goHome(p);setAct(p,"heading home",.6);pl.until=S.t+180;for(const q of mates)if(q!==p&&q.plan&&q.plan.k==="with")q.plan.until=S.t+180}
// everyone they bring, and some of what they had
function bringIn(g,ps){const homes=new Set(ps.map(q=>q.home));for(const q of ps){joinGroup(q,g.id,true);placeTo(q,randIn(g.home,3));q.plan=null;mem(q,`We made it to ${PLACES[g.home].n}. ${g.name} took us in.`,4)}
  for(const bid of homes){const H=S.hs&&S.hs[bid];if(!H||(S.people.some(q=>q.alive&&!q.group&&q.home===bid)))continue;const share=ps.some(q=>q.tr.honest>.5)?.9:.6;
    g.stock.food+=H.food*.5*share;g.stock.water+=H.water*.35*share;g.stock.wood+=H.boards*2;g.stock.meds+=H.med;H.food*=1-share;H.water*=1-share;H.boards=0;H.med=0}
  const head=ps.find(q=>q.age>=16)||ps[0];
  if(g.leader==="you"||ps.length>2||rf()<.5)news(`The ${head.sur||head.name} household${ps.length>1?` (${ps.length} people)`:""} made it to ${PLACES[g.home].n} and joined ${g.name}.`,"",ps.map(q=>q.id));
  if(g.leader==="you")journal(`${fullName(head)}${ps.length>1?" and their household have":" has"} come to join you.`,"good")}
// neighbors moving in together: one roof, one pantry, more eyes at night
function offerPact(p,c,pl){const q=P(pl.q);pl.n=0;if(!q||!q.alive||q.group||!BMAP[q.home]||!BMAP[p.home])return;
  const ch=.42+q.fear*.004+q.tr.social*.2+q.tr.kind*.15+relGet(p,q)/150-(1-q.tr.social)*.15;
  if(rf()>ch){mem(p,`Asked the ${q.sur||q.name} household to team up. They said no.`,-2,q.id);relAdd(p,q,-3);return}
  formPact(p,q)}
function formPact(p,q){const A=p.home,B=q.home;const sc=bid=>{const H=hs(bid);const b=BMAP[bid];return H.food+H.water*.6+H.boards*3+b.beds.length*2+(homeBoarded(bid)?6:0)};
  const host=sc(A)>=sc(B)?A:B,guest=host===A?B:A;const HH=hs(host),HG=hs(guest);
  for(const k of ["food","water","boards","med"]){HH[k]+=HG[k];HG[k]=0}
  const movers=S.people.filter(x=>x.alive&&!x.group&&x.home===guest);const stayers=S.people.filter(x=>x.alive&&!x.group&&x.home===host);
  for(const x of movers){x.home=host;placeTo(x,insidePos(BMAP[host]));x.plan=null}
  for(const a of [...movers,...stayers])for(const b of [...movers,...stayers])if(a!==b&&a.age>=12&&b.age>=12&&a.id<b.id)relAdd(a,b,6);
  if(!S.pacts)S.pacts=[];S.pacts.push({t:S.t,home:host,hh:[p.hh,q.hh]});
  const n1=p.sur||p.name,n2=q.sur||q.name;mem(p,`We moved in with the ${n2===n1?q.name:n2} household. Safer together.`,4,q.id);mem(q,`We teamed up with the ${n1===n2?p.name:n1} household. Safer together.`,4,p.id);
  news(`The ${n1} and ${n2===n1?q.name:n2} households moved in together at ${BMAP[host].n} to pool what they have.`,"good",[p.id,q.id])}
function trySteal(p,c,pl){const b=BMAP[pl.bid];const H=hs(pl.bid);const there=(c.byHome[pl.bid]||[]).filter(q=>q.alive);const awake=there.filter(q=>q.act!=="asleep"&&q.age>=12);
  if(rf()<.55+(c.night?.25:0)-awake.length*.15){const n=Math.min(H.food,rnd(2,5));H.food-=n;pl.got=n;for(const q of there)if(q.age>=12)mem(q,`Someone got in and took food from us. ${rf()<.3?"I think I know who.":""}`.trim(),-4,p.id);if(rf()<.3)news(`Food went missing from ${b.n} overnight.`,"bad");return}
  for(const q of awake){relAdd(p,q,-45);mem(q,`Caught ${p.name} stealing our food.`,-8,p.id)}mem(p,`Got caught taking food from ${b.n}.`,-6,awake[0]?awake[0].id:p.id);
  news(`${fullName(p)} was caught stealing food from ${b.n}.`,"bad",[p.id]);if(awake.length&&rf()<.35){hurt(p,rnd(5,20),`was beaten for stealing food`);if(rf()<.4)hurt(pick(awake),rnd(4,14),`was hurt catching a thief`)}}

// ---------- doors ----------
function secureHome(p){const b=BMAP[p.home];if(!b||!S.flags.alarm||typeof doorSave!=="function")return;for(const d of b.exits){const D=d.door;if(!D||D.broken||!D.open)continue;if(typeof doorBlocked==="function"&&doorBlocked(D))continue;D.open=false;D.auto=false;doorSave(D)}}
function boardOne(p){const b=BMAP[p.home];if(!b||typeof doorSave!=="function")return;const H=hs(p.home);const d=b.exits.slice(1).find(d=>d.door&&!d.door.bar&&!d.door.broken);if(!d)return;
  if(H.boards>0)H.boards--;else if(packHas(p,"wood")>=2&&packHas(p,"nails")){packTake(p,"wood",2);packTake(p,"nails",1)}else return;
  const D=d.door;D.open=false;D.bar=(D.bar||0)+1;D.hp=Math.min(doorMaxHp(D),(D.hp||100)+150);doorSave(D);if(c_near(p))noise(D.x,D.z,10);
  if(rf()<.12)news(`The ${p.sur||p.name} household boarded up ${b.n}.`,"",[p.id])}
function c_near(p){const pl=S.player;return!S.jump&&pl.alive!==false&&!pl.coma&&dist(p.x,p.z,pl.x,pl.z)<40}

// ---------- kids ----------
function kidHour(p,c){if(p.plan&&p.plan.k==="with"&&p.plan.until>S.t){planTick(p,c);return}
  const home=BMAP[p.home];const b=bldAt(p.x,p.z);
  if(!c.alarm){if(c.day1work&&c.h<15&&p.age>=5){if(!b||b.id!=="schoolbldg")placeTo(p,insidePos(BMAP.schoolbldg));setAct(p,"at school",0);return}
    if(c.night){if(home)goHome(p,true);setAct(p,"asleep",0);return}if(home&&!atHomeB(p))placeTo(p,insidePos(home));setAct(p,pick(["playing at home","drawing at the kitchen table","watching TV"]),0);return}
  if(b&&b.id==="schoolbldg"&&p.home!=="schoolbldg"&&!atHomeB(p)){const par=p.parents.map(P).find(q=>q&&q.alive);if(rf()<.3)placeTo(p,insidePos(b));setAct(p,`waiting at the school${par?" for "+par.name:""}`,.12);return}
  if(c.night){if(home&&(!b||b===home))goHome(p,true);setAct(p,"asleep",.03);return}
  if(home&&!atHomeB(p)&&!b)placeTo(p,insidePos(home));setAct(p,p.fear>55?"hiding at home":pick(["playing quietly at home","hiding under the kitchen table","drawing at home"]),.04)}

// ---------- in a camp ----------
const ROLE_EX={scavenger:1,hunter:.45,forager:.5,fisher:.45,woodcutter:.4,guard:.2,farmer:.1,builder:.1,medic:.05,cook:.05,crafter:.05,kid:.04,elder:.04};
function campSafe(g){if(!g.home)return 1;const ms=members(g.id);return 1/(1+siteCount(g.home,"wall")*.25+ms.filter(p=>p.role==="guard").length*.15)}
function campHour(p,c){const g=G(p.group);if(!g)return;const home=g.home;const hurtNow=p.health<45;const h=c.h;let dest=null,act="",ex=.12;p.plan=null;
  const work=h>=8&&h<17;
  if(c.night){dest=home?sitePos(home,true):null;act="asleep";ex=.03}
  else if(work&&!hurtNow&&p.role&&p.age>=12){const R=ROLES[p.role];const away=R.loc!=="home";
    let w=null;
    if(away&&p.fear>88){dest=home?randIn(home,3):null;act="too scared to leave camp";ex=.1}
    else if(w=waterRun(p,g)){dest=w;act="hauling water up from the river";ex=.5}
    else{const L=R.loc==="home"?home:R.loc;dest=L?randIn(L,3):null;act=R.act;const r=groupWork(p,g,c.tmp,c);if(r){dest=r.dest||dest;act=r.act||act}ex=ROLE_EX[p.role]??.15}}
  else{let q=null;if(h>=17&&p.age>=8&&rf()<.55&&p.soc<85){const fr=members(g.id).filter(o=>o!==p&&o.age>=8&&o.act!=="asleep"&&relGet(p,o)>10);if(fr.length)q=fr.sort((a,b)=>relGet(p,b)+rf()*25-relGet(p,a)-rf()*25)[0]}
    if(q){const v=pairVerb(p,q,c);dest={x:q.tx+(rf()-.5)*1.2,z:q.tz+(rf()-.5)*1.2};act=`${v} with ${q.name}`;bond(p,q,v);ex=.08}
    else{dest=home?randIn(home,3):null;act=hurtNow?"resting, injured":h>=17?"by the fire":"eating"}}
  if(!home){const lead=g.leader==="you"?S.player:P(g.leader);if(lead)dest={x:lead.x+(rf()-.5)*6,z:lead.z+(rf()-.5)*6}}
  if(dest&&(rf()<.6||p.act!==act))placeTo(p,dest);p.act=act;p.expo=ex*(home&&regionAt(p.tx,p.tz)===home?campSafe(g):1)}

// a camp with no well sends people to the river with every bottle and bucket they have
const WR={};
function waterRun(p,g){const n=groupSize(g.id);if(!g.home||g.stock.water>=n*1.4||p.age<14)return null;if(["medic","cook","guard"].includes(p.role)&&n>4)return null;
  const R=WR[g.id]&&WR[g.id].t===S.t?WR[g.id]:(WR[g.id]={t:S.t,n:0});if(R.n>=Math.max(2,Math.ceil(n/5)))return null;R.n++;
  const cen=campXZ(g);const z=cen.z<47?40.3:53.7;let x=clamp(cen.x+rnd(-6,6),-118,118);for(let i=0;i<8&&!free(x,z,.3,"npc");i++)x=clamp(x+rnd(-5,5),-118,118);
  g.stock.water+=.9+p.sk.survive*.1;return{x,z}}

// ---------- company ----------
function friendFor(p,c){const near=c.alarm;let best=null,bs=-1e9;
  for(const q of S.people){if(q===p||!q.alive||q.age<8||q.group||isFollower(q)||q.act==="asleep")continue;const r=relGet(p,q);if(r<15&&!(q.home===p.home&&r>-10))continue;
    const same=q.home===p.home;if(near&&!same&&dist(q.x,q.z,p.x,p.z)>14)continue;if(!near&&!same&&r<35)continue;
    const s=r+(same?15:0)+(p.partner===q.id?25:0)+rf()*20;if(s>bs){bs=s;best=q}}
  return best}
function pairVerb(p,q,c){const both=k=>p.tr[k]+q.tr[k];if(p.partner===q.id)return pick(["curled up on the couch","talking quietly","holding hands"]);if(p.age<13||q.age<13)return pick(["playing a board game","reading a story","playing cards"]);
  if((packHas(p,"whiskey")||packHas(q,"whiskey"))&&p.age>=21&&q.age>=21&&rf()<.5)return"sharing a drink";if((packHas(p,"cards")||packHas(q,"cards"))&&rf()<.6||both("curious")>1.2&&rf()<.4)return"playing cards";
  if(both("faith")>1.5&&rf()<.5)return"praying";return pick(["talking","talking","sitting","telling old stories","swapping jokes"])}
// time together: how they come out of it depends on who they both are
function bond(p,q,v){const cp=compat(p,q);let d=1.5+cp*5.5+(v==="sharing a drink"?1.5:0)+(v==="playing cards"?.8:0)-(p.tr.temper>.7&&q.tr.temper>.7?2.5:0);if(v==="sharing a drink"&&rf()<.12&&(p.tr.temper>.7||q.tr.temper>.7))d=-6;
  relAdd(p,q,d);p.soc=clamp(p.soc+25,0,100);q.soc=clamp((q.soc??60)+20,0,100);p.mood=clamp(p.mood+2,0,100);q.mood=clamp(q.mood+2,0,100);
  if(v==="sharing a drink"){const k=packHas(p,"whiskey")?p:q;if(rf()<.35)packTake(k,"whiskey")}
  if(q.plan&&["home","hide"].includes(q.plan.k)||q.group&&q.act&&/fire|eating/.test(q.act))q.act=`${v} with ${p.name}`;
  const r=relGet(p,q);if(canPair(p,q)&&r>=50&&attraction(p,q)>.55&&rf()<.12){p.partner=q.id;q.partner=p.id;mem(p,`${q.name} and I are together now.`,8,q.id);mem(q,`${p.name} and I are together now.`,8,p.id);news(`${fullName(p)} and ${fullName(q)} are together now.`,"good",[p.id,q.id])}
  if(d<0){mem(p,`${q.name} and I got into it over a bottle.`,-3,q.id);mem(q,`${p.name} and I got into it over a bottle.`,-3,p.id)}}

// ---------- the dead, away from you ----------
// near you, the dead in the street do this for real; everywhere else, it's the odds of what they're doing where they are
function riskHour(p,c){if(!c.alarm&&!(c.clinic&&p.plan&&(p.plan.k==="duty"||p.plan.k==="gawk")))return;const ex=p.expo??.06;if(ex<=0)return;
  let dens=c.dz[regionAt(p.tx,p.tz)]||0;if(p.plan&&(p.plan.k==="duty"||p.plan.k==="gawk")&&p.job!=="teacher")dens=Math.max(dens,c.hosp);
  if(!p.group&&p.home&&atHomeB(p)){if((c.byHome[p.home]||[]).length>=3)dens*=.7;if(homeBoarded(p.home))dens*=.55}
  if(rf()<Math.min(.4,dens*ex*.045))encounter(p,c)}
function encounter(p,c){const b=bldAt(p.tx,p.tz);const at=b?b.n:PLACES[regionAt(p.tx,p.tz)]?.n||"town";const arm=npcArm(p);
  const odds=.15+p.sk.fight*.07+arm*.035+p.tr.brave*.12-(p.health<50?.12:0)-(p.age<16?.2:0)+(p.group?.08:0)+(p.seed?.15:0);
  p.fear=Math.min(100,p.fear+25);p.seen=S.t;
  if(rf()<odds){const k=rf()<.3?2:1;cullNear(p.tx,p.tz,k);p.kills=(p.kills||0)+k;if(rf()<.25)hurt(p,rnd(4,14),`was hurt fighting off the dead at ${at}`);
    if(rf()<.3)mem(p,`Put down ${k>1?"two of the dead":"one of the dead"} at ${at}. My hands haven't stopped shaking.`,-1,p.id);if(rf()<.1)news(`${fullName(p)} fought off the dead at ${at}.`,"",[p.id]);return}
  const r=rf();
  if(r<.5){mem(p,`The dead nearly had me at ${at}. I ran.`,-3,p.id);return}
  if(r<.78||p.seed&&r<.92&&rf()<.6){hurt(p,rnd(10,30),`was attacked by the dead at ${at}`);return}
  if(r<.92){p.bitten=S.t+rnd(5,30)*60;tally("bit away");mem(p,"I got bit. I haven't told anyone.",-10,p.id);if(rf()<.3)news(`Rumor: ${fullName(p)} was seen with a bloody bandage on their arm.`,"",[p.id]);return}
  tally("killed away");kill(p,`was dragged down by the dead at ${at}`);if(rf()<.6)riseLater(p,rnd(10,40))}
function cullNear(x,z,k){const pl=S.player;const L=S.zeds.filter(q=>!q.pid&&Math.abs(q.x-x)<30&&Math.abs(q.z-z)<30&&dist(q.x,q.z,pl.x,pl.z)>45).sort((a,b)=>dist(a.x,a.z,x,z)-dist(b.x,b.z,x,z));
  for(const q of L.slice(0,k))S.zeds.splice(S.zeds.indexOf(q),1)}
// the ones the dead pull down often get back up
function riseLater(p,mins){if(!S.rise)S.rise=[];S.rise.push({id:p.id,t:S.t+mins,x:p.x,z:p.z})}
function riseTick(){if(!S||!S.rise||!S.rise.length)return;S.rise=S.rise.filter(r=>{if(S.t<r.t)return true;const p=P(r.id);if(!p||p.status!=="dead")return false;
  p.status="turned";spawnZed(r.x,r.z,{name:fullName(p),pid:p.id});if(typeof FIG!=="undefined"&&FIG.corpses)FIG.corpses=FIG.corpses.filter(c=>c.f.id!==p.id);
  const pl=S.player;if(!S.jump&&pl.alive!==false&&!pl.coma&&dist(r.x,r.z,pl.x,pl.z)<22)toast(`${p.met?p.name:"The body on the ground"} is getting back up.`);
  if(rf()<.5)news(`${fullName(p)} got back up.`,"bad",[p.id]);return false})}

// ---------- camps take people in ----------
// leaders, or whoever talks best, go out and bring people back when the camp can feed them
function recruitHour(c){if(c.h!==10&&c.h!==15)return;
  for(const g of c.groups){if(g.leader==="you")continue;const L=P(g.leader);if(!L)continue;const n=groupSize(g.id);const days=g.stock.food/Math.max(1,n);
    const want=(n<10?1:n<16?.5:.15)*(L.tr.kind*.6+L.tr.ambit*.6)*(days>2?1:.3);if(rf()>want*.35)continue;
    const rec=[L,...members(g.id).filter(q=>q.age>=18&&q.tr.social>.6&&q.role!=="guard")].sort((a,b)=>b.tr.social+b.sk.speak*.1-a.tr.social-a.sk.speak*.1)[0];
    const homes=Object.entries(c.byHome).filter(([bid,qs])=>qs.some(q=>q.age>=16)&&!qs.some(q=>q.hh==="you"||q.fam.you||q.rej&&q.rej[g.id]&&S.t-q.rej[g.id]<DAY*2));if(!homes.length)continue;
    const [bid,qs]=pick(homes);const head=qs.filter(q=>q.age>=16).sort((a,b)=>b.tr.ambit-a.tr.ambit)[0];const N=needs(head,c);
    placeTo(rec,{x:BMAP[bid].x+rnd(-3,3),z:BMAP[bid].z+rnd(-3,3)});rec.act=`recruiting in town for ${g.name}`;rec.expo=.8;
    const will=8+head.fear*.3+N.food*26+N.water*18+head.tr.social*10+relGet(head,rec)/5+(rec.sk.speak*2)-head.tr.ambit*10+rf()*14;
    if(will>34&&joinVerdict(g,qs)){bringIn(g,qs);news(`${fullName(rec)} went door to door for ${g.name} and came back with the ${head.sur||head.name} household.`,"good",[rec.id,head.id])}
    else{mem(head,`${rec.name} came by asking us to join ${g.name}. We said no, for now.`,1,rec.id);relAdd(head,rec,2)}}}

// ---------- the dead, near you: seeing them, running, fighting back ----------
function barkSee(p,mode){if(p.age<13)return pick(["*screams*","Help! HELP!","Mom! Dad!"]);if(mode==="fight")return pick(["Get behind me!","Come on, then.","I got this one.","Stay back!","Head. Go for the head."]);return pick(["They're here!","Run!","Oh God. Oh God.","Get inside! Get inside!","No, no, no..."])}
function protectee(p,z){for(const q of W3.npcNear||[]){if(q===p||!q.alive)continue;if((q.age<13&&q.home===p.home||p.partner===q.id||p.fam[q.id])&&dist(q.x,q.z,z.x,z.z)<dist(p.x,p.z,z.x,z.z)+1&&dist(q.x,q.z,p.x,p.z)<8)return q}return null}
function fleeSpot(p,z,R){const ax=p.x-z.x,az=p.z-z.z,al=Math.hypot(ax,az)||1;const home=p.home&&BMAP[p.home];let best=null,bs=-1e9;
  for(const b of BUILDINGS){const bd=dist(b.x,b.z,p.x,p.z);if(b!==home&&bd>16||bd>28||!b.exits.length||b.type==="mill")continue;const e=b.exits[0].p[b.exits[0].outSide];const dx=e.x-p.x,dz=e.z-p.z,dl=Math.hypot(dx,dz)||1;
    const toward=(dx*-ax+dz*-az)/(dl*al);if(S.zeds.some(q=>Math.abs(q.x-b.x)<b.w/2&&Math.abs(q.z-b.z)<b.d/2))continue;const s=(b===home?7:0)-dl*.4-toward*9;if(s>bs){bs=s;best=b}}
  if(best&&bs>-9){const q=insidePos(best);R.fx=q.x;R.fz=q.z;R.inB=best.id;return}
  for(let i=0;i<10;i++){const a=Math.atan2(ax,az)+(rf()-.5)*1.4,r=7+rf()*5;const x=p.x+Math.sin(a)*r,zz=p.z+Math.cos(a)*r;if(free(x,zz,.3,"npc")){R.fx=x;R.fz=zz;R.inB=null;return}}
  R.fx=p.x+ax/al*6;R.fz=p.z+az/al*6;R.inB=null}
function npcSwing(p,z){const arm=npcArm(p);const gun=npcGun(p);const R=p._r;
  if(gun){if(rf()<.15)packTake(p,"ammo");noise(p.x,p.z,40)}
  if(rf()<.55+p.sk.fight*.05+(arm?.08:0)){z.hp-=2+arm*.9+p.sk.fight*.6;z.stun=.4;const kx=z.x-p.x,kz=z.z-p.z,l=Math.hypot(kx,kz)||1;step(z,kx/l*.4,kz/l*.4,.3,"zed");
    if(z.hp<=0){killZed(z,false);p.kills=(p.kills||0)+1;if(R&&R.bark<=0&&rf()<.5){R.bark=6;bubble(p,styleSay(p,pick(["Stay down.","Got it.","That's one.","...God forgive me."])),1.6)}}}}
// returns a speed multiplier if fear or a fight is moving them this frame, or 0 if they go about their business
function npcReact(p,dt){const R=p._r||(p._r={t:rf()*.3,mode:null,zid:null,fx:0,fz:0,cd:0,bark:0,pt:0,path:null,pi:0,seen:0});R.t-=dt;R.cd-=dt;R.bark-=dt;
  if(R.t<=0){R.t=.28+rf()*.14;const sr=p.lie?3.5:(W3.night?6:9)*(R.mode?1.6:1);let best=null,bd=sr;
    for(const z of W3.zAct||S.zeds){if(Math.abs(z.x-p.x)>bd||Math.abs(z.z-p.z)>bd)continue;const d=dist(z.x,z.z,p.x,p.z);if(d<bd&&(d<1.6||losClear(p.x,p.z,z.x,z.z))){bd=d;best=z}}
    if(best){if(R.zid!==best.id)p.fear=Math.min(100,Math.max(p.fear||0,55)+10);R.zid=best.id;R.seen=performance.now();p.seen=S.t;if(p.lie){p.lie=false;p.lieRot=null}
      const arm=npcArm(p);const brave=p.tr.brave+(p.fear>85?-.15:0);const fightOK=p.age>=15&&p.health>40&&(arm>=4||p.sk.fight>=4)&&brave>.42;
      const kid=protectee(p,best);const mode=fightOK||kid&&p.age>=16&&brave>.25&&p.health>30?"fight":"flee";R.lzx=best.x;R.lzz=best.z;
      // too close to run clean: shove it off first
      if(mode==="flee"&&bd<1.3&&p.age>=13&&R.cd<=0){R.cd=1.4;best.stun=Math.max(best.stun||0,.8);const kx=best.x-p.x,kz=best.z-p.z,l=Math.hypot(kx,kz)||1;step(best,kx/l*.5,kz/l*.5,.3,"zed")}
      if(mode!==R.mode){R.mode=mode;R.path=null;if(R.bark<=0){R.bark=8;bubble(p,styleSay(p,barkSee(p,mode)),2)}if(mode==="flee")fleeSpot(p,best,R)}
      else if(mode==="flee"&&dist(p.x,p.z,R.fx,R.fz)<1.2)fleeSpot(p,best,R)}
    else if(R.mode&&performance.now()-R.seen>(R.mode==="flee"?7000:2500)){const was=R.mode;R.mode=null;R.zid=null;p.path=null;const pl=p.plan;
      if(pl&&pl.dest&&pl.st!=="do"){if(was==="flee"&&pl.out&&pl.st==="go"&&dist(pl.dest.x,pl.dest.z,R.lzx??1e9,R.lzz??1e9)<14){pl.st="back";pl.until=S.t+180;goHome(p);setAct(p,"heading home",.6)}else{p.tx=pl.dest.x;p.tz=pl.dest.z}}
      if(R.inB){const b=BMAP[R.inB];if(b&&bldAt(p.x,p.z)===b){for(const d of b.exits){const D=d.door;if(D&&D.open&&!D.broken&&!doorBlocked(D)){D.open=false;D.auto=false;doorSave(D)}}p.tx=p.x;p.tz=p.z;
        if(p.fear>75&&!p.group&&p.age>=13&&b.id!==p.home)stay(p,"hole",`hiding in ${b.n}`,.05,null,{until:S.t+rnd(60,150),n:99})}R.inB=null}}}
  if(!R.mode)return 0;
  if(R.mode==="fight"){const z=W3.zmap&&W3.zmap.get(R.zid)||S.zeds.find(q=>q.id===R.zid);if(!z){R.mode=null;return 0}
    const d=dist(p.x,p.z,z.x,z.z);if(d<=1.15){if(R.cd<=0){R.cd=1.1+rf()*.5;npcSwing(p,z)}p.tx=p.x;p.tz=p.z;return-1}
    p.tx=z.x;p.tz=z.z;return 1.6}
  p.tx=R.fx;p.tz=R.fz;return 1.9}
