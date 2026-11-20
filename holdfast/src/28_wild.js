// ================= wildlife, and hunting it =================
// Deer, wild turkeys and rabbits live in the quieter places. They graze, they bolt when you get close or make noise,
// and a clean shot puts food on the table once someone butchers it. A bow is silent; a gun brings the dead.
const ANIMALS={deer:{n:"deer",food:8,fear:11,speed:1.4,size:1,butcher:30},turkey:{n:"wild turkey",food:3,fear:7,speed:.95,size:.5,butcher:14},rabbit:{n:"rabbit",food:1,fear:5,speed:1.25,size:.32,butcher:6}};
const WILD={farm:{deer:2,turkey:2,rabbit:3},mill:{deer:2,rabbit:2,turkey:1},scout:{deer:3,rabbit:2,turkey:2},church:{rabbit:2,turkey:1},school:{rabbit:2,deer:1},motel:{rabbit:1,deer:1},gas:{rabbit:1},start:{deer:1,rabbit:1}};
function animalsAt(k){return(S.animals||[]).filter(a=>a.loc===k&&!a.gone)}
// once a day a place fills back up a little: less so the more it's been hunted
function topUpAnimals(k){S.animals=S.animals||[];const Wd=WILD[k];if(!Wd||!LOCS[k])return;const P=place(k);if(P.wildDay===dayOf(S.t))return;P.wildDay=dayOf(S.t);
  S.animals=S.animals.filter(a=>a.loc===k||a.loc===campK()||a.loc===S.player.loc);
  for(const [kind,n] of Object.entries(Wd)){const have=animalsAt(k).filter(a=>a.k===kind&&!a.dead).length;const want=Math.round(n*Math.max(.25,1-(P.hunted||0)*.12)*(.6+rf()*.7));for(let i=have;i<want;i++)spawnAnimal(k,kind)}}
function spawnAnimal(k,kind){let x,z,t=0;do{x=(rf()*2-1)*(SH-4);z=(rf()*2-1)*(SH-4);t++}while(t<30&&(blockedAt(k,x,z,true)||bldAt(k,x,z)||dist(x,z,ENTRY.x,ENTRY.z)<12||dist(x,z,S.player.x,S.player.z)<14||k===campK()&&dist(x,z,0,4)<14));
  const a={id:nid("a"),k:kind,loc:k,x,z,tx:null,tz:null,path:null,dir:rf()*6.28,dead:false};S.animals.push(a);return a}
function wildTick(dt){const A=S.animals;if(!A||!A.length)return;
  for(const a of A){if(a.dead||a.gone||!LOCS[a.loc])continue;const T=ANIMALS[a.k];
    if(!a.flee||S.t>a.flee){a.flee=null;let cd=1e9,cx=0,cz=0;for(const o of liveHere(a.loc)){const d=dist(o.x,o.z,a.x,a.z)/(o.sneak?.55:1);if(d<cd){cd=d;cx=o.x;cz=o.z}}
      for(const w of S.walkers)if(w.loc===a.loc&&!w.dead){const d=dist(w.x,w.z,a.x,a.z);if(d<cd){cd=d;cx=w.x;cz=w.z}}
      if(cd<T.fear)spook(a,cx,cz)}
    if(a.flee){mv(a,MOVE*dt*T.speed*(a.k==="rabbit"?1.1:1));if(Math.abs(a.x)>SH-2.5||Math.abs(a.z)>SH-2.5){if(rf()<.6)a.gone=true}continue}
    if(a.tx==null&&rf()<dt*.04)moveTo(a,a.x+rf()*6-3,a.z+rf()*6-3);mv(a,MOVE*dt*.14);a.graze=a.tx==null}}
// something startles it: it runs, away from whatever it was
function spook(a,x,z){if(a.dead)return;a.flee=S.t+5;const ang=Math.atan2(a.x-x,a.z-z)+(rf()-.5)*.6;moveTo(a,a.x+Math.sin(ang)*18,a.z+Math.cos(ang)*18)}
function spookAll(loc,x,z,r){if(!S.animals)return;for(const a of S.animals)if(a.loc===loc&&!a.dead&&!a.gone&&dist(a.x,a.z,x,z)<r*1.5)spook(a,x,z)}
// ---------- the shot ----------
function haveBow(){return(!S.camp||S.player.loc===campK())?itemCount("bow")>0:gCount(S.haul,"bow")>0}
function huntRange(how){return how==="bow"?12:GUNS[S.player.gun]?.range||10}
// walk until it's in range (quietly, if you're sneaking), then take the shot
function huntAnimal(a,how,tries){const pl=S.player;if(!a||a.dead||a.gone||a.loc!==pl.loc)return;tries=tries||0;const R=huntRange(how);const d=dist(pl.x,pl.z,a.x,a.z);
  if(d<=R*.9&&clearLine(pl.loc,pl.x,pl.z,a.x,a.z,true)){shootAnimal(a,how);return}
  if(tries>3){toast(`You can't get a clear shot at the ${ANIMALS[a.k].n}.`);return}
  const f=Math.max(0,(d-R*.75)/Math.max(d,.01));moveTo(pl,pl.x+(a.x-pl.x)*f,pl.z+(a.z-pl.z)*f,()=>huntAnimal(a,how,tries+1))}
function shootAnimal(a,how){const pl=S.player;const T=ANIMALS[a.k];const d=dist(pl.x,pl.z,a.x,a.z);pl.dir=Math.atan2(a.x-pl.x,a.z-pl.z);pl.aim=typeof performance!=="undefined"?performance.now():0;pl.tx=null;pl.path=null;
  let p;if(how==="bow"){p=clamp(.78*(1-.55*(d/12)**2)-(a.flee?.25:0),.12,.9);if(typeof sfx==="function")sfx("bow",pl.x,pl.z);spookAll(pl.loc,a.x,a.z,4)}
  else{const G=GUNS[pl.gun];if(!G)return;if((pl.rounds||0)<=0&&!loadUp()){toast(`The ${ITEMS[pl.gun]} is empty.`);return}pl.rounds--;p=clamp(G.hit*(1-.5*(d/G.range)**2)-(a.flee?.25:0)+(a.k==="deer"?.05:-.08),.12,.93);
    if(typeof shotFx==="function")shotFx(pl,a,false);noiseAt(pl.loc,pl.x,pl.z,G.noise);spookAll(pl.loc,pl.x,pl.z,G.noise)}
  if(rf()<p){a.dead=true;a.flee=null;a.tx=null;a.path=null;const P=place(pl.loc);P.hunted=(P.hunted||0)+1;S.stats.hunted=(S.stats.hunted||0)+1;
    log(how==="bow"?`Your arrow takes the ${T.n} clean. Butcher it to carry the meat home.`:`You drop the ${T.n} with one shot. Butcher it to carry the meat home.${S.walkers.some(w=>w.loc===pl.loc&&!w.dead)?" Every one of the dead around here heard that.":""}`,"good")}
  else{say(pl,pick(["Missed.","Damn.","It's off."]));spook(a,pl.x,pl.z)}}
// ---------- butchering ----------
function orderButcher(p,o,dt){const a=(S.animals||[]).find(x=>x.id===o.aid);if(!a||!a.dead||a.gone||a.loc!==p.loc){endOrder(p,true);return}const T=ANIMALS[a.k];
  const knife=itemCount("knife")>0||gCount(S.haul,"knife")>0;
  if(handWork(p,o,dt,a.x+.9,a.z,T.butcher*(knife?1:1.6),"dig",`butchering the ${T.n}`,null)){a.gone=true;const atHome=!S.camp||p.loc===campK();
    if(atHome){S.res.food=(S.res.food||0)+T.food;if(typeof syncInv==="function")syncInv()}else{gAdd(S.haul,"food",T.food)}
    log(`${p.id==="you"?"You":p.name} butcher${p.id==="you"?"":"s"} the ${T.n}: ${T.food} food${atHome?" for the stores":", in your pack"}.${knife?"":" It would go faster with a knife."}`,"good");endOrder(p,true)}}
ORDERS.butcher=orderButcher;
// ---------- the hunters ----------
// people on the hunting job head out in the morning and come back in the afternoon with whatever they got
function sendHunters(){const L=here().filter(p=>p.job==="hunt"&&willWork(p)&&p.hp>45&&!p.kid);if(!L.length)return;
  for(const p of L){p.away={kind:"hunt",to:null,back:S.t+ri(5,7)*HOUR,out:false};p.act="heading out to hunt";if(p.order){p.order.queue=null;endOrder(p,true)}moveTo(p,ENTRY.x+rf()*2,ENTRY.z,()=>{p.away.out=true})}}
function hunterBack(p){const bow=itemCount("bow")>0,rifle=itemCount("rifle")>0;const skill=p.sk.scav*.07+(bow||rifle?.14:0);const r=rf();let food=0,what="nothing";
  if(r<.2+skill){food=8;what="a deer"}else if(r<.5+skill){food=3;what="a wild turkey"}else if(r<.78){food=2;what="a couple of rabbits"}
  p.away.out=false;p.x=ENTRY.x;p.z=ENTRY.z;if(rifle&&!bow&&food&&S.res.ammo>=1)S.res.ammo--;
  if(rf()<.08&&!bow){p.hp-=ri(8,20);log(`${p.name} ran into some of the dead out in the woods and came back scratched up.`,"warn")}
  S.res.food+=food;p.sk.scav=Math.min(3,p.sk.scav+.03);log(food?`${p.name} came back from hunting with ${what}: ${food} food.`:`${p.name} came back from hunting with nothing.`,food?"good":"");
  p.away=null;moveTo(p,rf()*6-3,6+rf()*4);syncInv()}
