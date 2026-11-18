
// ================= state =================
let S=null;
const UI={tab:"journal",talkTo:null,draft:"",modal:null,buildSel:null,tileSel:null,trade:null,peopleQ:"",peopleFilter:"known",peopleSel:null,create:null,speed:1,paused:false,toast:null};
const SAVE_KEY="stillbreathing.save.v1";
let PMAP={};
function P(id){return id==="you"?S.player:PMAP[id]}
function reindex(){PMAP={};for(const p of S.people)PMAP[p.id]=p}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
function loadSave(){try{const r=localStorage.getItem(SAVE_KEY);return r?JSON.parse(r):null}catch(e){return null}}
function wipeSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
function journal(text,kind=""){S.journal.unshift({t:S.t,x:text,k:kind});S.journal.length=Math.min(S.journal.length,100)}
function news(text,kind="",about=[]){S.news.unshift({t:S.t,x:text,k:kind,a:about});S.news.length=Math.min(S.news.length,200)}
function living(){return S.people.filter(p=>p.alive)}
function fullName(p){return p.id==="you"?S.player.name:p.name+(p.sur?" "+p.sur:"")}
function G(id){return S.groups[id]}
function members(gid){return S.people.filter(p=>p.alive&&p.group===gid)}
function groupSize(gid){return members(gid).length+(S.player.group===gid&&S.player.alive!==false?1:0)}
function mem(p,text,v=0,about="you"){if(!p||p.id==="you")return;p.mem.push({d:dayOf(S.t),t:S.t,x:text,v,a:about});if(p.mem.length>24)p.mem.splice(0,p.mem.length-24)}
function relGet(a,b){return a.rel[b.id]||0}
function relSet(a,b,v){v=clamp(v,-100,100);a.rel[b.id]=v;b.rel[a.id]=v}
function relAdd(a,b,d){relSet(a,b,relGet(a,b)+d)}
function feel(p){return (p.trust+p.aff)/2}

// ================= people =================
let NEXT=1;
function traits(){return{kind:rf(),brave:rf(),ambit:rf(),temper:rf(),social:rf(),curious:rf(),honest:rf(),faith:rf()}}
function traitWords(tr){const w=[];
  if(tr.kind>.72)w.push("kind");else if(tr.kind<.25)w.push("cold");
  if(tr.brave>.75)w.push("brave");else if(tr.brave<.22)w.push("timid");
  if(tr.ambit>.75)w.push("ambitious");
  if(tr.temper>.75)w.push("hot-headed");else if(tr.temper<.2)w.push("calm");
  if(tr.social>.75)w.push("talkative");else if(tr.social<.22)w.push("quiet");
  if(tr.curious>.8)w.push("curious");
  if(tr.honest<.22)w.push("shifty");else if(tr.honest>.8)w.push("honest");
  if(tr.faith>.85)w.push("devout");
  if(!w.length)w.push("steady");return w.slice(0,4)}
function makePerson(o={}){
  const sex=o.sex||(rf()<.5?"F":"M");const job=o.job||"unemployed";
  const sk={fight:rnd(0,2),scavenge:rnd(0,2),craft:rnd(0,2),build:rnd(0,2),medic:rnd(0,1),speak:rnd(0,2),survive:rnd(0,2)};
  for(const [k,v] of Object.entries(JOBS[job]?.sk||{}))sk[k]+=v;
  const age=o.age??rnd(18,60);
  const p={id:"p"+(NEXT++),name:o.name||pick(sex==="F"?FIRST_F:FIRST_M),sur:o.sur??pick(SUR),sex,age,job,tr:o.tr||traits(),sk,
    style:o.style||(age<13?"kid":pick(Object.keys(STYLES))),home:o.home||null,hh:o.hh||null,
    facts:{from:o.from||pick(HOMETOWN),fear:pick(FEARS),hope:pick(HOPES),secret:pick(SECRETS),likes:pick(LIKES),bio:o.bio||""},told:{},
    look:o.look||(pick(["tall","short","heavyset","wiry","broad-shouldered","slight","stooped","athletic"])+", "+pick(["gray hair","black hair","red hair","blond hair","a shaved head","brown curls","a ponytail","a beard","glasses","a sunburn"])),
    x:0,z:0,tx:0,tz:0,loc:"town",act:"at home",hunger:85,health:100,mood:60,rel:{},fam:{},trust:0,aff:0,met:false,
    group:null,role:null,partner:null,kids:[],parents:[],preg:null,alive:true,status:"",bitten:null,mem:[],chat:[],pack:{},want:null,follow:false,seed:o.seed||null};
  return p}
function famLink(a,b,ra,rb,v){a.fam[b.id]=ra;b.fam[a.id]=rb;relSet(a,b,v)}
function packFor(p){const k={};const add=(i,n)=>{if(n>0&&ITEMS[i])k[i]=(k[i]||0)+n};
  add(pick(["snacks","canned_food","water_bottle","cereal"]),rnd(0,2));
  if(p.role==="scavenger"){add("canned_food",rnd(0,2));add(pick(["bandage","duct_tape","nails","cloth","flashlight","cigarettes"]),1)}
  if(p.role==="hunter"){add("raw_meat",rnd(0,2))}if(p.role==="medic"||p.job==="nurse"||p.job==="doctor"){add("bandage",rnd(1,2));add("painkillers",rnd(0,1))}
  if(p.role==="crafter"){add(pick(["duct_tape","nails","rope","scrap"]),rnd(1,2))}if(p.role==="fisher")add("raw_fish",rnd(0,2));
  if(rf()<.2)add("cigarettes",1);if(rf()<.1)add("whiskey",1);if(p.age<13){delete k.whiskey;delete k.cigarettes}
  return k}

function homePos(p){if(p.group&&G(p.group)?.home){const s=G(p.group).home;return randIn(s,3)}const b=BMAP[p.home];if(b)return{x:b.x+(rf()-.5)*b.w*.6,z:b.z+b.d/2+1.2};return randIn("town")}
function placeTo(p,pos,instant){p.tx=pos.x;p.tz=pos.z;p.loc=regionAt(pos.x,pos.z);if(instant||(S&&dist(p.x,p.z,S.player.x,S.player.z)>90&&dist(pos.x,pos.z,S.player.x,S.player.z)>90)){p.x=pos.x;p.z=pos.z}}

function newWorld(c){
  NEXT=1;
  S={v:2,t:7*60,people:[],groups:{},zeds:[],cont:{},sites:{},news:[],journal:[],pending:[],flags:{},wx:{},nextG:1,stats:{kills:0},player:null};
  for(const k of Object.keys(PLACES))if(PLACES[k].site)S.sites[k]={grid:Array(PLACES[k].site.gw*PLACES[k].site.gh).fill(null),build:[]};
  S.sites.farm.grid[2*10+4]={b:"firepit",by:"start"};
  // seeded characters
  const ppl=S.people;const P_=o=>{const p=makePerson(o);ppl.push(p);return p};
  const used=new Set(["farmhouse","hall","h3","trailer2"]);const freeHouse=()=>{const h=HOUSES.find(h=>!used.has(h.id));if(h){used.add(h.id);return h.id}return pick(HOUSES).id};
  const walt=P_({name:"Walt",sur:"Holloway",sex:"M",age:61,job:"farmer",home:"farmhouse",hh:"hol",style:"dry",tr:{kind:.7,brave:.7,ambit:.45,temper:.35,social:.4,curious:.3,honest:.9,faith:.6},seed:"walt",bio:"Has farmed this land for forty years. Lost his son in the city on the first night, though he doesn't know it yet."});
  const june=P_({name:"June",sur:"Holloway",sex:"F",age:59,job:"farmer",home:"farmhouse",hh:"hol",style:"warm",tr:{kind:.9,brave:.5,ambit:.3,temper:.2,social:.7,curious:.4,honest:.8,faith:.8}});
  const eli=P_({name:"Eli",sur:"Holloway",sex:"M",age:11,job:"kid",home:"farmhouse",hh:"hol",style:"kid"});
  famLink(walt,june,"wife","husband",85);walt.partner=june.id;june.partner=walt.id;famLink(walt,eli,"grandson","grandfather",80);famLink(june,eli,"grandson","grandmother",90);
  const grace=P_({name:"Grace",sur:"Okafor",sex:"F",age:47,job:"pastor",home:"hall",hh:"grace",style:"preachy",tr:{kind:.92,brave:.6,ambit:.55,temper:.15,social:.85,curious:.6,honest:.85,faith:.98},seed:"grace",bio:"Pastor of St. Brigid's for eleven years. Believes the church should be a lifeboat."});
  const rayH=freeHouse();
  const ray=P_({name:"Ray",sur:"Castell",sex:"M",age:39,job:"deputy",home:rayH,hh:"cas",style:"plain",tr:{kind:.45,brave:.85,ambit:.8,temper:.55,social:.6,curious:.4,honest:.6,faith:.4},seed:"ray",bio:"The only deputy left after the sheriff drove to the city and didn't come back. Thinks someone has to be in charge."});
  const carmen=P_({name:"Carmen",sur:"Castell",sex:"F",age:37,job:"teacher",home:rayH,hh:"cas",tr:{kind:.75,brave:.5,ambit:.4,temper:.4,social:.7,curious:.7,honest:.75,faith:.5}});
  const lila=P_({name:"Lila",sur:"Castell",sex:"F",age:9,job:"kid",home:rayH,hh:"cas",style:"kid"});
  famLink(ray,carmen,"wife","husband",70);ray.partner=carmen.id;carmen.partner=ray.id;famLink(ray,lila,"daughter","dad",90);famLink(carmen,lila,"daughter","mom",95);
  const coleH=freeHouse();
  const cole=P_({name:"Cole",sur:"Briggs",sex:"M",age:44,job:"foreman",home:coleH,hh:"bri",style:"crude",tr:{kind:.2,brave:.85,ambit:.9,temper:.8,social:.6,curious:.3,honest:.35,faith:.2},seed:"cole",bio:"Ran the quarry crew. Respected, feared, owed money by half the town."});
  const hank=P_({name:"Hank",sur:"Briggs",sex:"M",age:40,job:"quarry",home:coleH,hh:"bri",style:"dry",tr:{kind:.5,brave:.6,ambit:.3,temper:.5,social:.3,curious:.3,honest:.6,faith:.3}});
  famLink(cole,hank,"brother","brother",55);
  const nadia=P_({name:"Nadia",sur:"Ferris",sex:"F",age:45,job:"doctor",home:freeHouse(),hh:"fer",style:"formal",tr:{kind:.7,brave:.6,ambit:.5,temper:.3,social:.4,curious:.9,honest:.7,faith:.2},seed:"nadia",bio:"Town doctor. Treated the first patient at the clinic. She saw what it did before anyone else."});
  // generic households
  const types=["couple","family","family","single","single","single","roommates","elders","parent","family","couple","single"];
  let hh=0;
  while(ppl.length<70){const ty=pick(types);const h=freeHouse();const id="hh"+(hh++);const sur=pick(SUR);
    const adult=(o={})=>P_({sur,home:h,hh:id,job:o.job||pick(["nurse","clerk","hardware","cook","waitress","bartender","attendant","mechanic","teacher","librarian","farmhand","quarry","trucker","electrician","unemployed","vet","soldier","hunter","pharmacist","clerk","quarry"]),...o});
    if(ty==="single")adult({age:rnd(19,55)});
    else if(ty==="couple"||ty==="elders"){const old=ty==="elders";const a=adult({sex:"F",age:old?rnd(64,78):rnd(22,50),job:old?"retiree":undefined}),b=adult({sex:"M",age:clamp(a.age+rnd(-4,5),18,85),job:old?"retiree":undefined});famLink(a,b,"husband","wife",rnd(40,85));a.partner=b.id;b.partner=a.id}
    else if(ty==="roommates"){const a=adult({age:rnd(19,30)}),b=P_({home:h,hh:id,age:rnd(19,30),job:pick(["student","clerk","waitress","unemployed","attendant"])});relSet(a,b,rnd(20,60));a.fam[b.id]="roommate";b.fam[a.id]="roommate"}
    else{const two=ty==="family";const a=adult({sex:"F",age:rnd(28,46)});let b=null;if(two){b=adult({sex:"M",age:clamp(a.age+rnd(-3,6),24,60)});famLink(a,b,"husband","wife",rnd(30,85));a.partner=b.id;b.partner=a.id}
      const nk=rnd(1,3);for(let i=0;i<nk;i++){const age=rnd(4,17);const k=P_({sur,home:h,hh:id,age,job:age>=14?"student":"kid",style:age<13?"kid":undefined});k.parents=[a.id,b?.id].filter(Boolean);a.kids.push(k.id);if(b)b.kids.push(k.id);famLink(a,k,k.sex==="F"?"daughter":"son","mom",rnd(60,95));if(b)famLink(b,k,k.sex==="F"?"daughter":"son","dad",rnd(40,95))}}
  }
  reindex();
  // social web: neighbors, coworkers, friends, feuds
  for(const p of ppl){const n=rnd(3,7);for(let j=0;j<n;j++){const q=pick(ppl);if(q===p||q.id in p.rel)continue;let v=rnd(-20,45);if(q.job===p.job&&JOBS[p.job].work!=="home")v+=10;if(rf()<.06)v=rnd(-70,-40);relSet(p,q,v)}}
  // player household
  const pl={id:"you",name:c.name,sur:"",pron:c.pron,sex:c.sex,age:c.age,look:c.look,mark:c.mark,bg:c.bg,traits:c.traits,story:c.story,
    hp:100,food:75,water:70,warmth:90,energy:85,sick:0,bleeding:0,bitten:null,sk:{fight:1,scavenge:1,craft:1,build:1,medic:1,speak:1,survive:1},
    x:0,z:0,inv:{water_bottle:1,snacks:1,photo:1},gear:[],eq:{},partner:null,trying:false,preg:null,kids:[],group:null,flags:{},alive:true,hutTile:null,fam:{},home:"h3",hair:c.hair||"brown",skin:c.skin||"#c99873"};
  const bgSk={"Nurse":{medic:3},"Mechanic":{craft:3,build:1},"Sheriff's deputy":{fight:2,speak:1},"Line cook":{survive:1,speak:1,craft:1},"Teacher":{speak:3},"Farmhand":{survive:2,build:1},"Construction worker":{build:3,fight:1},"College student":{scavenge:2,speak:1},"Between jobs":{scavenge:2}};
  for(const [k,v] of Object.entries(bgSk[c.bg]||{}))pl.sk[k]+=v;
  if(c.traits.includes("Charming"))pl.sk.speak+=2;if(c.traits.includes("Tough"))pl.sk.fight+=1;if(c.traits.includes("Handy"))pl.sk.craft+=1;if(c.traits.includes("Resourceful"))pl.sk.scavenge+=1;if(c.traits.includes("Kind"))pl.sk.medic+=1;if(c.traits.includes("Outdoorsy"))pl.sk.survive+=1;
  S.player=pl;
  const hb=BMAP[pl.home];pl.x=hb.x;pl.z=hb.z+hb.d/2+1.5;
  addGear("tshirt",true);addGear(c.age>40?"flannel":"hoodie",true);addGear("jeans",true);addGear("sneakers",true);
  // who's home with you
  const hhKind=c.household;
  if(hhKind!=="alone"){let o={home:pl.home,hh:"you"};let rel="roommate",back="roommate";
    if(hhKind==="sibling"){o={...o,sur:c.name.split(" ")[1]||pick(SUR),age:clamp(c.age-rnd(3,7),8,40)};rel=o.age<13?"little sibling":"sibling";back="sibling"}
    if(hhKind==="partner"){o={...o,sex:c.sex==="F"?"M":"F",age:clamp(c.age+rnd(-3,3),18,70),job:pick(["nurse","mechanic","teacher","cook","clerk","electrician"])};rel="partner";back="partner"}
    if(hhKind==="child"){o={...o,age:rnd(6,12),job:"kid",style:"kid",sur:c.name.split(" ")[1]||""};rel=o.age<13?"kid":"son";back="parent"}
    if(hhKind==="parent"){o={...o,age:clamp(c.age+rnd(24,32),55,85),job:"retiree"};rel="mom or dad";back="kid"}
    if(hhKind==="roommate"){o={...o,age:clamp(c.age+rnd(-3,4),18,60),job:pick(["student","clerk","bartender","attendant","unemployed"])}}
    const q=P_(o);q.style=q.age<13?"kid":q.style;q.fam.you=back;pl.fam[q.id]=rel;q.trust=hhKind==="roommate"?35:60;q.aff=hhKind==="roommate"?30:75;q.met=true;q.follow=true;
    if(hhKind==="partner"){q.partner="you";pl.partner=q.id}
    if(hhKind==="child"){q.parents=["you"];pl.kids.push(q.id)}
    mem(q,hhKind==="roommate"?`Shared a house with ${c.name} on Birch Street before it all happened.`:`Family. ${c.name} is the person I trust most in the world.`,5);
    reindex();q.x=pl.x+1.5;q.z=pl.z+.5;q.tx=q.x;q.tz=q.z}
  // neighbors know you a little
  for(const p of ppl)if(p.home&&BMAP[p.home]&&dist(BMAP[p.home].x,BMAP[p.home].z,hb.x,hb.z)<20&&p.id!==pl.home){p.met=true;p.trust+=rnd(0,15);p.aff+=rnd(-5,15);mem(p,`${c.name} lives a few houses down.`,0)}
  for(const p of ppl){const pos=homePos(p);p.x=pos.x;p.z=pos.z;p.tx=p.x;p.tz=p.z;p.loc=regionAt(p.x,p.z);p.pack=packFor(p)}
  rollWeather();
  news("Morning in Millbrook. The radio says there's 'an unusual flu' going around in the city. Nobody's worried yet.","");
  journal(`Day 1. You wake up in your house in Millbrook. It's an ordinary Tuesday, as far as anyone knows.`,"big");
  queueEvent("morning","any",S.t+600,{});S.pending[S.pending.length-1].at=9*60+30;
}

// ================= player gear =================
function addGear(id,equip=false){const g={u:"g"+(NEXT++),id,dur:ITEMS[id].dur};S.player.gear.push(g);if(equip)S.player.eq[ITEMS[id].slot]=g.u;return g}
function gearEq(slot){const u=S.player.eq[slot];return u?S.player.gear.find(g=>g.u===u):null}
function invAdd(id,n=1){if(!ITEMS[id])return;if(ITEMS[id].slot){for(let i=0;i<n;i++)addGear(id);return}S.player.inv[id]=(S.player.inv[id]||0)+n;if(S.player.inv[id]<=0)delete S.player.inv[id]}
function invHas(id,n=1){if(ITEMS[id]?.slot)return S.player.gear.filter(g=>g.id===id).length>=n;return (S.player.inv[id]||0)>=n}
function invTake(id,n=1){if(ITEMS[id].slot){for(let i=0;i<n;i++){const g=S.player.gear.find(g=>g.id===id&&!Object.values(S.player.eq).includes(g.u))||S.player.gear.find(g=>g.id===id);if(!g)return;unequip(g.u);S.player.gear=S.player.gear.filter(x=>x!==g)}return}invAdd(id,-n)}
function unequip(u){for(const s of SLOTS)if(S.player.eq[s]===u)delete S.player.eq[s]}
function weight(){let w=0;for(const [k,n] of Object.entries(S.player.inv))w+=ITEMS[k].w*n;for(const g of S.player.gear)w+=ITEMS[g.id].w*(Object.values(S.player.eq).includes(g.u)?.5:1);return w}
function maxW(){const b=gearEq("back");return 12+(b?ITEMS[b.id].carry:0)+S.player.sk.build*.3}
function clothesWarm(){let w=0;for(const s of ["head","body","outer","hands","legs","feet"]){const g=gearEq(s);if(g)w+=ITEMS[g.id].warm||0}return w}
function armor(){let a=0;for(const s of SLOTS){const g=gearEq(s);if(g)a+=ITEMS[g.id].armor||0}return a}
function weapon(){return gearEq("weapon")}
function wearWeapon(n){const w=weapon();if(!w)return"";w.dur-=n;if(w.dur<=0){unequip(w.u);S.player.gear=S.player.gear.filter(g=>g!==w);const t=` Your ${ITEMS[w.id].n.toLowerCase()} breaks.`;journal(t.trim(),"bad");return t}return""}
function wearClothes(h){for(const s of ["head","body","outer","hands","legs","feet","back"]){const g=gearEq(s);if(!g)continue;g.dur-=h*.12;if(g.dur<=0){unequip(g.u);S.player.gear=S.player.gear.filter(x=>x!==g);journal(`Your ${ITEMS[g.id].n.toLowerCase()} falls apart.`,"bad")}}}
function skillUp(k,a=.12){S.player.sk[k]=Math.min(10,+(S.player.sk[k]+a).toFixed(2))}
function hasTool(t){return S.player.gear.some(g=>ITEMS[g.id].tool===t)}
function here(){return regionAt(S.player.x,S.player.z)}
function myGroup(){return S.player.group?G(S.player.group):null}
function atHome(){const g=myGroup();return g&&g.home&&here()===g.home}
function siteHas(site,b){return S.sites[site]?.grid.some(c=>c&&c.b===b)}
function siteCount(site,b){return S.sites[site]?S.sites[site].grid.filter(c=>c&&c.b===b).length:0}
function nearFire(){const pl=S.player;const r=here();if(PLACES[r]?.site&&siteHas(r,"firepit"))return true;return pl.fire&&dist(pl.fire.x,pl.fire.z,pl.x,pl.z)<6&&pl.fire.until>S.t}

// ================= weather =================
function rollWeather(){const d=dayOf(S.t);const base=19-(d-1)*.55;const r=rf();let kind;
  if(base<2)kind=r<.35?"snow":r<.6?"overcast":r<.72?"fog":"clear";else kind=r<.22?"rain":r<.45?"overcast":r<.55?"fog":"clear";S.wx[d]={kind,base:Math.max(-12,base)}}
function temp(t=S.t){const d=dayOf(t);if(!S.wx[d])rollWeather();const w=S.wx[d];const h=hourOf(t);let v=w.base+(h<6?-6:h<10?-2:h<16?3:h<20?0:-4);v+=w.kind==="rain"?-3:w.kind==="snow"?-2:w.kind==="overcast"?-1:0;return Math.round(v)}
function wxName(){const w=S.wx[dayOf(S.t)];return w?w.kind:"clear"}

// ================= time =================
function advance(mins,opt={}){let left=mins;
  while(left>0.0001){const toH=60-(S.t%60);const step=Math.min(left,toH);decay(step,opt);S.t+=step;left-=step;
    if(Math.abs(S.t%60)<1e-6||S.t%60>59.9999){S.t=Math.round(S.t);simHour()}
    if(S.player.hp<=0)return die();
    const pl=S.player;if(opt.sleep&&(pl.water<6||pl.food<6||pl.warmth<15||pl.hp<30)){S.woke=pl.water<6?"thirst":pl.food<6?"hunger":pl.warmth<15?"cold":"pain";break}}
  checkPending()}
function decay(m,opt){const pl=S.player,h=m/60;const sl=opt.sleep;
  pl.food=clamp(pl.food-h*(sl?1.5:2.6)*(pl.preg?1.3:1)*(pl.sick?1.3:1),0,100);
  pl.water=clamp(pl.water-h*(sl?2:3.8)*(pl.sick?1.5:1),0,100);
  pl.energy=clamp(pl.energy+h*(sl?(opt.safe?13:9):-(opt.work?5:3.2)),0,100);
  let comfort=temp()+clothesWarm()*2.2+(nearFire()?12:0)+(sl&&opt.safe?10:0);if(wxName()==="rain"&&!gearEq("outer"))comfort-=4;
  if(comfort>=12)pl.warmth=clamp(pl.warmth+h*6,0,100);else pl.warmth=clamp(pl.warmth-h*(12-comfort)*.7,0,100);
  let dhp=0;if(pl.food<=0)dhp-=3;if(pl.water<=0)dhp-=5;if(pl.warmth<=0)dhp-=6;else if(pl.warmth<15)dhp-=1;if(pl.energy<=0)dhp-=1;if(pl.sick)dhp-=1.2;if(pl.bleeding)dhp-=pl.bleeding*4;
  if(pl.bitten){const hrs=(S.t-pl.bitten)/60;if(hrs>20)dhp-=4;if(hrs>36)dhp-=12}
  if(dhp>=0&&pl.food>35&&pl.water>35&&pl.warmth>35&&!pl.sick&&!pl.bitten)dhp=sl?3:1;
  pl.hp=clamp(pl.hp+dhp*h,0,100);
  if(pl.sick&&rf()<h*.03){pl.sick=0;journal("The fever breaks. You feel human again.","good")}
  if(pl.bleeding&&rf()<h*.25)pl.bleeding=0;
  if(here()!=="town"||true)wearClothes(h)}

// ================= hourly sim =================
function zedsIn(region){let n=0;for(const z of S.zeds)if(z.r===region)n++;return n}
function spawnZed(x,z,o={}){const r=regionAt(x,z);S.zeds.push({id:"z"+(NEXT++),x,z,hp:o.hp||14,r,name:o.name||null,pid:o.pid||null,st:"idle",tx:x,tz:z});}
function turnPerson(p){p.alive=false;p.status="turned";p.loc="gone";p.why="turned";const g=p.group?G(p.group):null;const atCamp=g&&g.home&&regionAt(p.x,p.z)===g.home&&!(S.player.group===g.id&&atHome());
  if(!atCamp)spawnZed(p.x,p.z,{name:fullName(p),pid:p.id});const how=atCamp?pick(["Someone had to put them down.","It took three people to hold the door.","Nobody saw the bite until it was too late."]):g?"They never made it back to camp.":"";
  if(atCamp&&how.startsWith("Nobody")&&rf()<.4){const v=pick(members(g.id).filter(q=>q!==p&&q.age>=12));if(v)hurt(v,rnd(10,30),"was hurt when "+p.name+" turned")}
  news(`${fullName(p)} turned${g?" at "+(PLACES[g.home]?.n||"camp"):""}. ${how}`.trim(),"bad",[p.id]);
  grief(p,"turned");if(p.group&&G(p.group)?.leader===p.id)newLeader(p.group);if(p.partner&&p.partner!=="you"&&P(p.partner))P(p.partner).partner=null;if(p.partner==="you"){S.player.partner=null;S.player.trying=false;journal(`${p.name} is gone. Turned. You keep hearing their voice in your head.`,"bad")}
  if(p.follow)p.follow=false}
function kill(p,how){if(!p.alive)return;p.alive=false;p.status="dead";p.why=how;p.loc="gone";news(`${fullName(p)} ${how}.`,"bad",[p.id]);grief(p,"died");
  if(p.partner&&p.partner!=="you"&&P(p.partner))P(p.partner).partner=null;if(p.partner==="you"){S.player.partner=null;S.player.trying=false;journal(`${p.name} is dead.`,"bad")}
  if(p.group&&G(p.group)?.leader===p.id)newLeader(p.group)}
function grief(p,how){for(const q of living()){const r=relGet(q,p);const fam=q.fam[p.id];if(fam||r>40){q.mood-=fam?30:12;mem(q,`${fullName(p)} ${how}. ${fam?`My ${fam}.`:"We were close."}`,-8,p.id)}}}
function hurt(p,n,how){p.health-=n;if(p.health<=0)kill(p,how.replace(/^was /,"was killed, "));else if(n>20&&rf()<.6)news(`${fullName(p)} ${how}. They'll live.`,"bad",[p.id])}

function outbreakHour(){const d=dayOf(S.t),h=hourOf(S.t),t=S.t;const F=S.flags;
  if(!F.clinic&&t>=9*60){F.clinic=true;const c=BMAP.clinic;for(let i=0;i<3;i++)spawnZed(c.x+rnd(-3,3),c.z+c.d/2+2+rnd(0,2));news("Screaming at Millbrook Clinic. A patient attacked a nurse, and then the nurse got up again.","bad");}
  if(!F.alarm&&t>=12*60){F.alarm=true;news("Emergency broadcast: residents of Millbrook are advised to stay indoors. 'Do not approach anyone who appears sick or confused.'","big")}
  // generic dead filling the town during the fall
  const phase=d===1?(h>=10?1:0):d<=3?2:d===4?1:0;const cap=d<=4?100:110;
  if(phase&&S.zeds.length<cap)for(let i=0;i<phase*rnd(1,3);i++){const p=randIn(rf()<.85?"town":pick(["road","fields","school"]));spawnZed(p.x,p.z)}
  if(d>4&&S.zeds.length<85&&h%3===0){const p=randIn(pick(["town","town","road","woods","fields","hills"]));spawnZed(p.x,p.z)}
  if(d===1&&h===20)news("The power flickers out across town. Gunshots on Main Street.","bad");
  if(d===2&&h===9)news("A Guard helicopter passes over town without slowing down.","");
  if(d===3&&h===12){news("Radio: an evacuation center is open at Ashby, forty miles north. Some families pack their cars.","big");for(const p of living().filter(p=>!p.group&&!p.follow&&!p.seed&&rf()<.25&&p.hh!=="you"))leave(p,"left for the Ashby evacuation center")}
  if(d===5&&h===8)news("The radio's gone to static. Ashby isn't answering anymore.","bad");
}
function leave(p,how){p.alive=false;p.status="left";p.loc="gone";news(`${fullName(p)} ${how}.`,"",[p.id]);if(p.group&&G(p.group)?.leader===p.id)newLeader(p.group)}

function simHour(){const h=hourOf(S.t),d=dayOf(S.t);const tmp=temp();const night=h<6||h>=22,work=h>=8&&h<17;
  outbreakHour();
  const townZ=zedsIn("town");
  for(const p of S.people){if(!p.alive)continue;
    if(p.preg&&S.t>=p.preg.due)birth(p);
    p.hunger=clamp(p.hunger-2.4,0,100);if(p.hunger<=0)p.health-=1.5;
    if(!p.group&&!p.follow&&(h===8||h===18)&&p.hunger<75){const f=Object.keys(p.pack||{}).find(k=>ITEMS[k]?.eat&&!ITEMS[k].eat.sick);if(f){p.pack[f]--;if(!p.pack[f])delete p.pack[f];p.hunger=clamp(p.hunger+38,0,100)}else{if(p.pantry==null)p.pantry=rnd(5,14);if(p.pantry>0){p.pantry--;p.hunger=clamp(p.hunger+40,0,100)}}}
    if(p.bitten&&S.t>=p.bitten){turnPerson(p);continue}
    if(UI.talkTo===p.id&&S.t-(p.lastTalk||-99)<20&&dist(p.x,p.z,S.player.x,S.player.z)<6)continue; // mid-conversation
    // where are they going this hour
    if(p.follow&&!p.group||p.follow&&S.player.group===p.group){p.act="with you";p.loc=here();continue}
    let dest=null,act="";
    if(!p.group){ // civilian life during the fall
      const home=homePos(p);
      if(!S.flags.alarm&&work&&p.age>=6&&JOBS[p.job].work!=="home"){const w=JOBS[p.job].work;const b=BMAP[w];dest=b?{x:b.x+(rf()-.5)*b.w,z:b.z+b.d/2+1.5}:randIn(w==="farm"?"farm":w==="woods"?"woods":w==="church"?"church":w==="quarry"?"quarry":"road");act="at work"}
      else if(S.flags.alarm&&!S.flags.hidden?.[p.id]&&(p.job==="nurse"||p.job==="doctor"||p.job==="deputy")&&d===1&&h<18&&rf()<.5){const c=BMAP[p.job==="deputy"?"sheriff":"clinic"];dest={x:c.x+rnd(-4,4),z:c.z+c.d/2+2};act="trying to help"}
      else{dest=home;act=night?"asleep":S.flags.alarm?"holed up at home":"at home"}
      if(p.flee){dest=randIn(p.flee,3);act="heading for "+PLACES[p.flee].n}
    } else {const g=G(p.group);const home=g.home;
      const hurtNow=p.health<45;
      if(night){dest=home?randIn(home,3):null;act="asleep"}
      else if(work&&!hurtNow&&p.role&&p.age>=12){const R=ROLES[p.role];const L=R.loc==="home"?home:R.loc;dest=L?randIn(L,3):null;act=R.act;groupWork(p,g,tmp)}
      else{dest=home?randIn(home,3):null;act=hurtNow?"resting, injured":h>=17?"by the fire":"eating"}
      if(!home){const lead=g.leader==="you"?S.player:P(g.leader);if(lead){dest={x:lead.x+(rf()-.5)*6,z:lead.z+(rf()-.5)*6}}}
    }
    if(dest&&(rf()<.6||p.act!==act))placeTo(p,dest);p.act=act;
    // exposure to the dead
    const reg=regionAt(p.tx,p.tz);const dens=reg==="town"?townZ/120:reg==="road"||reg==="school"?zedsIn(reg)/40:zedsIn(reg)/80;
    const expo=(act==="asleep"?.06:act.startsWith("holed")||act==="at home"?.07:1)*(p.group?.22:1);
    if(dens>0&&rf()<dens*.03*expo*(1.2-p.sk.fight*.1)){if(rf()<.55){p.bitten=S.t+rnd(5,30)*60;mem(p,"I got bit. I haven't told anyone.",-10,p.id);if(rf()<.3)news(`Rumor: ${fullName(p)} was seen with a bloody bandage on their arm.`,"",[p.id])}else hurt(p,rnd(10,35),"was attacked by the dead")}
  }
  worldHour(h);
  if(!S.flags.alarm)return; // before the alarm, nobody moves to groups
  groupsHour(h,tmp);
  householdDecisions(h,d);
  if(h>=18&&h<22)socialHour();
  for(const p of S.people)if(p.alive&&p.health<=0)kill(p,p.hunger<=0?"starved":"died of their wounds");
  if(h===0)dailyTick();
  // zeds far from the player drift
  for(const z of S.zeds)if(dist(z.x,z.z,S.player.x,S.player.z)>80&&rf()<.3){z.x=clamp(z.x+rnd(-6,6),WB.x0,WB.x1);z.z=clamp(z.z+rnd(-6,6),WB.z0,WB.z1);z.r=regionAt(z.x,z.z);const sp=siteBlocked(z.x,z.z);if(sp){z.x-=6;z.r=regionAt(z.x,z.z)}}
}
function siteBlocked(x,z){const r=regionAt(x,z);if(!PLACES[r]?.site)return null;const owner=Object.values(S.groups).find(g=>g.home===r);if(owner&&siteCount(r,"wall")+(r==="quarry"?3:0)+(r==="school"?2:0)>=1)return r;return null}

// ================= groups =================
function newGroup(name,leader,home){const id="g"+(S.nextG++);S.groups[id]={id,name,leader,home,stock:{food:20,water:20,wood:10,stone:0,nails:0,scrap:0,cloth:4,meds:2,ammo:0},pol:{focus:"balanced",ration:"normal",stance:"neutral"},rel:{},allied:{},founded:S.t,tools:0,color:pick(["#e48a3f","#86aac4","#a9c38d","#c98bb0","#d6c35a","#9a8bd6"])};
  for(const o of Object.values(S.groups))if(o.id!==id){S.groups[id].rel[o.id]=0;o.rel[id]=0}return S.groups[id]}
function joinGroup(p,gid,quiet){const old=p.group;p.group=gid;p.role=roleFor(p,gid);p.flee=null;if(p.id!=="you")p.follow=p.follow&&S.player.group===gid;
  if(!quiet){const g=G(gid);if(rf()<.5||p.seed)news(`${fullName(p)} joined ${g.name}${g.home?" at "+PLACES[g.home].n:""}.`,"",[p.id])}
  for(const q of members(gid))if(q!==p){relAdd(p,q,rnd(0,6))}
  if(old&&G(old)?.leader===p.id)newLeader(old)}
function roleFit(p,r){return({scavenger:p.sk.scavenge+p.tr.brave,hunter:p.sk.survive+p.sk.fight*.5,forager:p.sk.survive,fisher:p.sk.survive*.8,farmer:p.sk.survive+(p.job.startsWith("farm")?3:0),woodcutter:p.sk.build*.5+p.sk.fight*.5+.5,builder:p.sk.build+(p.job==="builder"||p.job==="foreman"?2:0),guard:p.sk.fight+p.tr.brave*2,medic:p.sk.medic*1.5+(p.job==="nurse"||p.job==="doctor"?4:0),cook:p.sk.survive*.5+p.tr.kind,crafter:p.sk.craft})[r]||0}
function roleQuota(g,n){const h=g.home;return{medic:n>=5?1:0,guard:Math.max(1,Math.round(n*.13)),woodcutter:Math.max(1,Math.round(n*.13)),builder:h?Math.max(1,Math.round(n*.12)):0,hunter:n>=3?Math.max(1,Math.round(n*.12)):0,
  farmer:h==="farm"?Math.max(1,Math.round(n*.2)):h&&siteCount(h,"garden")?1:0,fisher:n>=6?1:0,forager:n>=7?1:0,cook:n>=9?1:0,crafter:n>=11?1:0,scavenger:n>=4?1:0}}
const ROLE_ORDER=["medic","guard","woodcutter","builder","hunter","scavenger","farmer","fisher","forager","cook","crafter"];
function roleFor(p,gid){if(p.age<12)return"kid";if(p.age>70)return"elder";const g=G(gid);const ms=members(gid).filter(q=>q!==p);const counts={};for(const q of ms)if(q.role)counts[q.role]=(counts[q.role]||0)+1;
  const q=roleQuota(g,ms.filter(x=>x.age>=12&&x.age<=70).length+1+(S.player.group===gid?1:0));let best="scavenger",bs=-1e9;
  for(const r of ROLE_ORDER){const gap=(q[r]||0)-(counts[r]||0);if(gap<=0)continue;const v=gap*2+roleFit(p,r)+rf();if(v>bs){bs=v;best=r}}return best}
function assignRoles(g){const ms=members(g.id);const W=[];const mine=g.leader==="you";for(const p of ms){if(p.age<12)p.role="kid";else if(p.age>70)p.role="elder";else W.push(p)}
  const n=W.length+(S.player.group===g.id?1:0);const q=roleQuota(g,n);const filled={};const free=new Set(W);
  for(const p of W)if(mine&&p.roleSet){filled[p.role]=(filled[p.role]||0)+1;free.delete(p)}
  const building=g.home&&S.sites[g.home].build.length;if(building)q.builder=Math.max(q.builder||0,1);
  const order=[...new Set([...(building?["builder"]:[]),...(g.stock.food<n*3?["hunter","scavenger"]:[]),...(g.stock.water<n*2?["fisher"]:[]),...ROLE_ORDER])];
  for(const r of order)while((filled[r]||0)<(q[r]||0)&&free.size){let bp=[...free].find(p=>p.role===r);if(!bp){let bv=-1e9;for(const p of free){const v=roleFit(p,r)+rf()*.5;if(v>bv){bv=v;bp=p}}}bp.role=r;filled[r]=(filled[r]||0)+1;free.delete(bp)}
  for(const p of free)p.role="scavenger"}
function groupWork(p,g,tmp){const st=g.stock;const f=.6+(({scavenger:p.sk.scavenge,hunter:p.sk.survive,forager:p.sk.survive,fisher:p.sk.survive,farmer:p.sk.survive,woodcutter:p.sk.build,builder:p.sk.build,crafter:p.sk.craft,medic:p.sk.medic})[p.role]||1)*.1;
  const foc=g.pol.focus==="food"?(["hunter","forager","fisher","farmer","scavenger"].includes(p.role)?1.3:.85):g.pol.focus==="build"?(["builder","woodcutter"].includes(p.role)?1.35:.85):1;const k=f*foc;const winter=tmp<0?.4:tmp<5?.75:1;
  switch(p.role){
    case"scavenger":{const left=Math.max(.15,1-dayOf(S.t)/60);st.food+=.7*k*left;st.water+=.6*k*left;if(rf()<.25)st.meds+=.4*left;if(rf()<.3)st.nails+=.6;st.cloth+=.3;st.scrap+=.3;if(rf()<.05)st.ammo+=rnd(1,4);break}
    case"hunter":if(rf()<.3){st.food+=1.6*k*winter}if(rf()<.002)hurt(p,rnd(10,30),"was hurt in a hunting accident");break;
    case"forager":st.food+=.3*k*winter;if(rf()<.1)st.meds+=.1;break;
    case"fisher":st.food+=.35*k*(tmp<0?.5:1);st.water+=.2;break;
    case"farmer":st.food+=(g.home==="farm"?.45:.15)*k*winter+siteCount(g.home,"garden")*.15;break;
    case"woodcutter":st.wood+=1.3*k;st.stone+=.12;break;
    case"builder":buildWork(g,k);break;
    case"crafter":g.tools=Math.min(100,g.tools+.1*k);break;
    case"guard":case"medic":case"cook":break;}
  st.water+=siteCount(g.home,"well")*.25+siteCount(g.home,"catcher")*.12+(g.home==="farm"||g.home==="church"?.3:0)}
function groupsHour(h,tmp){
  for(const g of Object.values(S.groups)){const ms=members(g.id);const n=ms.length+(S.player.group===g.id?1:0);if(!n){if(!g.dead){g.dead=true;news(`${g.name} is no more. Its people are dead, scattered, or gone.`,"bad")}continue}
    const st=g.stock;
    // healing
    const medics=ms.filter(p=>p.role==="medic").length;const heal=(siteHas(g.home,"infirmary")?2:1)*(1+medics*.5);
    for(const p of ms)if(p.health<100&&p.hunger>0)p.health=Math.min(100,p.health+(h<6?1.2:.5)*heal*(st.meds>1&&p.health<50?1.5:1));
    if(medics&&st.meds>0&&ms.some(p=>p.health<50)&&rf()<.15)st.meds-=1;
    // firewood
    if(tmp<8&&g.home){st.wood-=n/70;if(st.wood<0){st.wood=0;for(const p of ms)if(rf()<.3){p.mood-=1;if(tmp<0)p.health-=1}}}
    // meals
    if(h===8||h===18){const cooks=ms.filter(p=>p.role==="cook").length;const half=g.pol.ration==="half";const need=ms.reduce((a,p)=>a+(p.age<12?.25:.5),0)*(1-Math.min(.25,cooks*.06))*(half?.6:1);const wneed=n*.4*(half?.7:1);
      if(st.food>=need){st.food-=need;for(const p of ms)p.hunger=clamp(p.hunger+(half?30:50),0,100)}else{const ratio=st.food/Math.max(need,.01);st.food=0;for(const p of ms){if(rf()<ratio)p.hunger=clamp(p.hunger+40,0,100);else p.mood-=4}if(!g.hungry||S.t-g.hungry>DAY){g.hungry=S.t;news(`${g.name} ran out of food at ${h===8?"breakfast":"supper"}.`,"bad")}}
      if(st.water>=wneed)st.water-=wneed;else{st.water=0;for(const p of ms){p.health-=3;p.mood-=3}}
      if(S.player.group===g.id&&S.player.alive!==false&&atHome()){const pl=S.player;if(st.food>=.5){st.food-=.5;pl.food=clamp(pl.food+(half?25:40),0,100);if(st.water>=.4){st.water-=.4;pl.water=clamp(pl.water+30,0,100)}journal(h===8?"Breakfast with the others. It isn't much, but it's warm.":"Supper around the fire. People talk about anything but the dead.","")}else journal("There's nothing in the pot tonight.","bad")}}
    st.water=Math.min(st.water,60+n*8);st.food=Math.min(st.food,120+n*14);
    // builds
    if(h%6===3&&g.home&&(g.leader!=="you"||g.pol.auto))planBuilds(g);
  }}
function planBuilds(g){const site=S.sites[g.home];if(!site||site.build.length>=2)return;const L=g.leader==="you"?{id:"you",tr:{brave:.6,kind:.7}}:P(g.leader);if(!L)return;const st=g.stock;const n=groupSize(g.id);
  const cap=siteHousing(g.home);const pri=[];
  if(cap<n)pri.push(st.wood>=30&&st.nails>=8&&rf()<.5?"cabin":"tent");
  if(!siteHas(g.home,"firepit"))pri.push("firepit");
  if(siteCount(g.home,"wall")<4&&(L.tr.brave>.5||dayOf(S.t)>5))pri.push("wall");
  if(!siteHas(g.home,"catcher"))pri.push("catcher");
  if(L.tr.kind>.6&&!siteHas(g.home,"infirmary"))pri.push("infirmary");
  for(const b of ["storehouse","garden","tower","smokehouse","workshop","well","hall","infirmary"])if(!siteHas(g.home,b))pri.push(b);
  if(members(g.id).some(p=>p.age<6)&&!siteHas(g.home,"nursery"))pri.push("nursery");
  if(siteCount(g.home,"garden")<3&&temp()>4)pri.push("garden");
  if(siteCount(g.home,"wall")<10)pri.push("wall");
  for(const b of pri){if(site.build.some(s=>s.b===b)&&b!=="wall"&&b!=="tent")continue;if(canAfford(g,BLD[b].cost)){startSite(g,b,autoTile(g.home,b),L.id);return}}}
function siteHousing(site){if(!site)return 0;let c=BUILDINGS.filter(b=>b.site===site).reduce((a,b)=>a+(b.house||0),0);c+=S.sites[site].grid.reduce((a,x)=>a+(x?BLD[x.b].house||0:0),0);return c}
function canAfford(g,cost){for(const [k,v] of Object.entries(cost||{}))if((g.stock[k]||0)<v)return false;return true}
function autoTile(site,b){const P_=PLACES[site].site;const s=S.sites[site];const free=i=>!s.grid[i]&&!s.build.some(x=>x.tile===i);const idx=[];for(let i=0;i<P_.gw*P_.gh;i++)if(free(i))idx.push(i);if(!idx.length)return -1;
  const cx=(P_.gw-1)/2,cy=(P_.gh-1)/2;const edge=i=>{const x=i%P_.gw,y=Math.floor(i/P_.gw);return x===0||y===0||x===P_.gw-1||y===P_.gh-1};const dd=i=>Math.hypot(i%P_.gw-cx,Math.floor(i/P_.gw)-cy);
  if(b==="wall"||b==="tower"){const e=idx.filter(edge);if(e.length)return e.sort((a,c)=>dd(a)-dd(c))[0]}
  const inner=idx.filter(i=>!edge(i));return (inner.length?inner:idx).sort((a,c)=>dd(a)-dd(c)+(rf()-.5)*1.5)[0]}
function startSite(g,b,tile,by){if(tile<0)return false;if(!canAfford(g,BLD[b].cost))return false;for(const [k,v] of Object.entries(BLD[b].cost))g.stock[k]-=v;S.sites[g.home].build.push({b,tile,prog:0,by});return true}
function buildWork(g,f){const s=S.sites[g.home];if(!s){g.stock.wood+=.2;return}const site=s.build.find(x=>x.by==="you")||s.build[0];if(!site){g.stock.stone+=.15*f;g.stock.wood+=.15;return}site.prog+=f*.7;if(site.prog>=BLD[site.b].work)finishSite(g.home,site)}
function finishSite(home,site){const s=S.sites[home];s.build=s.build.filter(x=>x!==site);s.grid[site.tile]={b:site.b,by:site.by};if(site.b==="hut"&&site.by==="you")S.player.hutTile={site:home,tile:site.tile};
  const g=Object.values(S.groups).find(g=>g.home===home);if(rf()<.5||site.by==="you")news(`A new ${BLD[site.b].n.toLowerCase()} went up at ${PLACES[home].n}.`,"good");if(site.by==="you"){S.flags.built=(S.flags.built||0)+1;journal(`Your ${BLD[site.b].n.toLowerCase()} is finished.`,"good")}}
function defense(gid){const g=G(gid);if(!g)return 0;let d=g.home?S.sites[g.home].grid.reduce((a,c)=>a+(c?BLD[c.b].def||0:0),0)+(g.home==="quarry"?14:g.home==="school"?8:g.home==="church"?5:4):0;
  d+=members(gid).filter(p=>p.role==="guard"&&p.health>45).length*2;d+=members(gid).filter(p=>p.age>=16&&p.health>45).length*.5;d+=members(gid).reduce((a,p)=>a+p.sk.fight*.15,0);d+=Math.min(20,g.stock.ammo*.3);
  if(S.player.group===gid&&here()===g.home)d+=S.player.sk.fight*2+(weapon()?ITEMS[weapon().id].dmg:0);return Math.round(d)}
function influence(p){const friends=Object.entries(p.rel).filter(([id,v])=>v>40&&P(id)?.alive&&P(id)?.group===p.group).length;return p.tr.ambit*35+p.tr.social*15+p.tr.brave*12+friends*3+p.sk.speak*2.5+(p.age>=25&&p.age<65?6:0)+(p.seed?10:0)}
function playerInfluence(gid){const ms=members(gid);const avg=ms.length?ms.reduce((a,p)=>a+p.trust,0)/ms.length:0;const friends=ms.filter(p=>p.trust>40||p.aff>40).length;return 12+avg*.8+friends*3+S.player.sk.speak*2.5+(S.flags.built||0)*1.2}
function newLeader(gid){const g=G(gid);if(!g)return;const ms=members(gid).filter(p=>p.age>=16);if(!ms.length&&S.player.group!==gid)return;ms.sort((a,b)=>influence(b)-influence(a));
  if(S.player.group===gid&&(!ms.length||playerInfluence(gid)>influence(ms[0]))){g.leader="you";news(`With nobody else stepping up, ${S.player.name} is leading ${g.name} now.`,"big");journal(`${g.name} looks to you now.`,"big");return}
  g.leader=ms[0].id;news(`${fullName(ms[0])} is leading ${g.name} now.`,"big",[ms[0].id])}
function reviewLeader(g){const ms=members(g.id).filter(p=>p.age>=16);if(!ms.length)return;ms.sort((a,b)=>influence(b)-influence(a));const top=ms[0];
  if(g.leader==="you"){const avg=ms.reduce((a,p)=>a+p.trust,0)/ms.length;if(avg<-5&&influence(top)>playerInfluence(g.id)){g.leader=top.id;news(`${g.name} has turned on ${S.player.name}. ${fullName(top)} speaks for them now.`,"big");journal(`${g.name} doesn't follow you anymore. ${top.name} does.`,"bad")}return}
  const cur=P(g.leader);if(!cur||!cur.alive){newLeader(g.id);return}
  if(S.player.group===g.id&&playerInfluence(g.id)>influence(cur)+5&&!S.flags.declinedLead){queueEvent("lead_offer",g.home||"any",S.t+DAY*2,{gid:g.id});return}
  if(top!==cur&&influence(top)>influence(cur)+12&&rf()<.5){g.leader=top.id;relAdd(top,cur,-20);mem(cur,`${top.name} took ${g.name} from me.`,-10,top.id);news(`${fullName(top)} has taken over ${g.name}. ${cur.name} ${cur.tr.temper>.6?"didn't take it quietly":"stepped aside"}.`,"big",[top.id,cur.id])}}

// households pick a side during the fall
function rally(seed,place,name){const L=S.people.find(p=>p.seed===seed&&p.alive);if(!L||L.group)return;const want=place;if(ownerOf(place)){place=freeSites().filter(k=>k!=="lodge")[0];if(!place)return;name=`${L.name}'s people`}const g=newGroup(name,L.id,place);joinGroup(L,g.id,true);
  for(const q of S.people)if(q.alive&&q.hh===L.hh&&q!==L&&q.hh!=="you")joinGroup(q,g.id,true);for(const q of members(g.id))placeTo(q,randIn(place,3));
  if(place!==want){news(`${fullName(L)} found ${PLACES[want].n} already taken and led people to ${PLACES[place].n} instead.`,"big",[L.id]);return g}
  news(({walt:`Walt Holloway drove into town with a stock trailer and an offer: anyone who can work is welcome at the farm.`,grace:`Pastor Grace rang the bell at St. Brigid's. The church doors are open to anyone who needs them.`,ray:`Deputy Ray Castell is gathering survivors at Millbrook High. 'Stay together, stay armed, stay alive.'`,cole:`Cole Briggs and his quarry crew took the trucks up to Redstone Quarry. He says only people who pull their weight should follow.`,nadia:``})[seed],"big",[L.id]);
  return g}
function householdDecisions(h,d){const F=S.flags;const t=S.t;
  if(!F.r_church&&t>=18*60){F.r_church=true;rally("grace","church","St. Brigid's")}
  if(!F.r_school&&t>=21*60){F.r_school=true;rally("ray","school","Millbrook Watch")}
  if(!F.r_farm&&t>=DAY+10*60){F.r_farm=true;rally("walt","farm","Holloway Farm")}
  if(!F.r_quarry&&t>=DAY+15*60){F.r_quarry=true;rally("cole","quarry","Quarry Crew")}
  const late=d>6;
  const hhs={};for(const p of S.people)if(p.alive&&!p.group&&p.hh&&p.hh!=="you"&&!p.follow)(hhs[p.hh]=hhs[p.hh]||[]).push(p);
  const groups=Object.values(S.groups).filter(g=>g.home&&!g.dead&&g.leader!=="you"||g.leader==="you"&&g.home);
  const RF={walt:"r_farm",grace:"r_church",ray:"r_school",cole:"r_quarry"};if(!S.hold)S.hold={};
  for(const [hid,ps] of Object.entries(hhs)){if(rf()>.12)continue;if(ps.some(p=>p.seed&&RF[p.seed]&&!F[RF[p.seed]]))continue;
    const hungry=ps.some(p=>p.hunger<35);const head=ps.filter(p=>p.age>=16).sort((a,b)=>b.tr.ambit-a.tr.ambit)[0];if(!head)continue;
    if(S.hold[hid]==null)S.hold[hid]=clamp(Math.round(rf()*4+(1-head.tr.social)*4+head.tr.brave*2-(ps.some(p=>p.age<12)?1:0)),1,12);
    if(d<S.hold[hid]&&!hungry)continue;if(late&&!hungry&&rf()>.15)continue;
    let best=null,bs=(d<=2?14:4)+head.tr.brave*4-(zedsIn("town")/20);
    for(const g of groups){let s=10+rf()*8;const L=g.leader==="you"?null:P(g.leader);for(const p of ps){for(const m of members(g.id))s+=Math.max(-5,relGet(p,m))/25;if(L)s+=relGet(p,L)/12}
      if(g.home==="church")s+=head.tr.faith*10+head.tr.kind*4;if(g.home==="quarry")s+=head.tr.brave*6+head.tr.ambit*4-head.tr.kind*6-(ps.some(p=>p.age<12)?6:0);if(g.home==="farm")s+=(head.job.startsWith("farm")?8:0)+3;if(g.home==="school")s+=(ps.some(p=>p.age<18)?4:0)+head.tr.honest*3;
      if(g.leader==="you"){for(const p of ps)s+=feel(p)/8}
      const gs=groupSize(g.id);s-=gs/4+Math.max(0,gs-12)*.9;if(s>bs){bs=s;best=g}}
    const fleeScore=(1-head.tr.brave)*10+rf()*6;
    if(!best&&d>=2&&fleeScore>bs+3&&!ps.some(p=>p.seed)){for(const p of ps)leave(p,"packed the car and drove north");continue}
    if(best){for(const p of ps){joinGroup(p,best.id,true);placeTo(p,randIn(best.home,3))}if(best.leader==="you"||ps.length>2||rf()<.4)news(`The ${head.sur||head.name} household${ps.length>1?` (${ps.length} people)`:""} made it to ${PLACES[best.home].n} and joined ${best.name}.`,"",ps.map(p=>p.id));if(best.leader==="you")journal(`${head.name} ${head.sur} and their family have come to join you.`,"good")}}
}

// ================= social sim =================
function compat(a,b){const ks=["kind","temper","social","curious","honest","faith"];let d=0;for(const k of ks)d+=Math.abs(a.tr[k]-b.tr[k]);return 1-d/ks.length}
function attraction(a,b){const s=(a.id<b.id?a.id+b.id:b.id+a.id);let h=0;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return (h%100)/100}
function canPair(a,b){return a.age>=18&&b.age>=18&&Math.abs(a.age-b.age)<16&&a.id!==b.id&&!a.partner&&!b.partner&&a.alive&&b.alive&&!a.fam[b.id]&&!b.fam[a.id]}
function socialHour(){const byGroup={};for(const p of S.people)if(p.alive&&p.act!=="with you"&&p.age>=8){const k=p.group||p.hh||p.id;(byGroup[k]=byGroup[k]||[]).push(p)}
  for(const ps of Object.values(byGroup)){if(ps.length<2)continue;
    for(const a of ps){if(rf()>a.tr.social*.35)continue;const known=ps.filter(q=>q!==a&&relGet(a,q)>0);let b=known.length&&rf()<.65?known.sort((x,y)=>(relGet(a,y)+rf()*30)-(relGet(a,x)+rf()*30))[0]:pick(ps);if(!b||b===a)continue;
      const before=relGet(a,b);let dd=(compat(a,b)-.5)*14+(rf()*6-3)-(a.tr.temper>.7&&b.tr.temper>.7?3:0)+(a.mood<30?-2:0)+(a.partner===b.id?2:0)+(canPair(a,b)&&attraction(a,b)>.7?1.5:0);
      const after=clamp(before+dd,-100,100);relSet(a,b,after);
      if(before<50&&after>=50){mem(a,`${b.name} and I have gotten close.`,3,b.id);mem(b,`${a.name} and I have gotten close.`,3,a.id);if(rf()<.3)news(`${fullName(a)} and ${fullName(b)} have become close friends.`,"good",[a.id,b.id])}
      if(before>-40&&after<=-40){mem(a,`${b.name} gets under my skin.`,-3,b.id);mem(b,`${a.name} gets under my skin.`,-3,a.id);if(rf()<.5)news(`Bad blood between ${fullName(a)} and ${fullName(b)}.`,"",[a.id,b.id])}
      if(after<-55&&(a.tr.temper>.65||b.tr.temper>.65)&&rf()<.1){a.health-=rnd(5,20);b.health-=rnd(5,20);a.mood-=5;b.mood-=5;mem(a,`I fought with ${b.name}.`,-6,b.id);mem(b,`${a.name} started a fight with me.`,-6,a.id);news(`${a.name} and ${b.name} came to blows. ${pick(["Over a can of peaches.","Nobody will say why.","Over who sleeps by the stove.","About someone who didn't make it."])}`,"bad",[a.id,b.id])}
      if(canPair(a,b)&&after>=55&&attraction(a,b)>.5&&rf()<.2){a.partner=b.id;b.partner=a.id;mem(a,`${b.name} and I are together.`,8,b.id);mem(b,`${a.name} and I are together.`,8,a.id);news(`${fullName(a)} and ${fullName(b)} are together now.`,"good",[a.id,b.id])}
      if(a.partner===b.id&&after<15&&rf()<.3){a.partner=null;b.partner=null;news(`${a.name} and ${b.name} split up.`,"",[a.id,b.id])}
      // gossip: they talk about you
      if(a.met&&b.met&&Math.abs(feel(a)-feel(b))>10){const avg=(a.trust+b.trust)/2;a.trust+=(avg-a.trust)*.1;b.trust+=(avg-b.trust)*.1;
        const juicy=a.mem.filter(m=>m.a==="you"&&Math.abs(m.v)>=4).slice(-1)[0];if(juicy&&rf()<.3){b.trust+=juicy.v*.3;mem(b,`${a.name} told me: "${juicy.x}"`,Math.round(juicy.v/2))}}
      if(!b.met&&a.met&&rf()<.05){b.met=true;b.trust+=a.trust*.2}
    }}}

// ================= daily =================
function dailyTick(){const d=dayOf(S.t);rollWeather();
  for(const g of Object.values(S.groups)){if(g.dead)continue;const st=g.stock;const ms=members(g.id);const n=ms.length+(S.player.group===g.id?1:0);
    st.food*=1-(siteHas(g.home,"smokehouse")?.02:siteHas(g.home,"storehouse")?.04:.08);
    if(temp(S.t+12*60)>2)st.food+=siteCount(g.home,"garden")*7;
    const cap=siteHousing(g.home);if(g.home&&n>cap&&temp(S.t+3*60)<8){for(const p of shuffle([...ms]).slice(0,n-cap)){p.health-=rnd(2,8);p.mood-=4}}
    for(const p of ms){let tgt=55+(p.hunger>40?5:-15)+(p.partner?6:0)+Object.entries(p.rel).filter(([id,v])=>v>40&&P(id)?.group===g.id).length*1.5+(siteHas(g.home,"hall")?4:0)-(g.pol.ration==="half"?6:0)+(g.leader!=="you"&&P(g.leader)?relGet(p,P(g.leader))/10:g.leader==="you"?p.trust/10:0);p.mood=clamp(p.mood+(tgt-p.mood)*.25,0,100)}
    // desertion: to a group with friends, or away
    for(const p of ms){if(p.mood<15&&p.age>=16&&!p.follow&&rf()<.15){const alt=Object.values(S.groups).filter(o=>o.id!==g.id&&!o.dead&&o.home).map(o=>[o,members(o.id).reduce((a,q)=>a+Math.max(0,relGet(p,q)),0)]).sort((a,b)=>b[1]-a[1])[0];
      const fam=ms.filter(q=>q.hh===p.hh&&q!==p);if(alt&&alt[1]>40){for(const q of [p,...fam]){joinGroup(q,alt[0].id,true);placeTo(q,randIn(alt[0].home,3))}news(`${fullName(p)}${fam.length?" and family":""} left ${g.name} for ${alt[0].name}.`,"",[p.id]);g.rel[alt[0].id]=(g.rel[alt[0].id]||0)-4}
      else{for(const q of [p,...fam])leave(q,`walked away from ${g.name}`)}}}
    // the living push the dead back: patrols around camp and in town
    let cull=Math.round(ms.filter(p=>p.age>=14&&["guard","scavenger","hunter","woodcutter"].includes(p.role)).length*.6+rf());
    while(cull-->0){const c=S.zeds.filter(z=>!z.pid&&(z.r===g.home||z.r==="town")&&dist(z.x,z.z,S.player.x,S.player.z)>45);if(!c.length)break;S.zeds.splice(S.zeds.indexOf(pick(c)),1)}
    assignRoles(g);
    if(d%4===0)reviewLeader(g);
    if(g.leader!=="you")leaderAI(g);
  }
  intergroup(d);
  if(d>=5)for(const g of Object.values(S.groups))if(!g.dead&&g.leader!=="you"&&members(g.id).length>=8&&rf()<.25)splinter(g);
  // pregnancies
  for(const a of living()){if(!a.partner||a.partner==="you"||a.sex!=="F"||a.preg||a.age<18||a.age>44)continue;const b=P(a.partner);if(!b||b.sex!=="M"||!b.alive)continue;const last=a.kids.length?P(a.kids[a.kids.length-1]):null;if(last&&last.born&&S.t-last.born<DAY*12)continue;if(rf()<.02){a.preg={due:S.t+DAY*rnd(16,20),with:b.id};news(`${fullName(a)} is expecting.`,"good",[a.id,b.id])}}
  const pl=S.player;if(pl.partner&&pl.trying){const q=P(pl.partner);if(q&&q.alive){if(pl.sex==="F"&&q.sex==="M"&&!pl.preg&&rf()<.3){pl.preg={due:S.t+DAY*18,with:q.id};pl.trying=false;journal("You're pregnant. You're sure of it now.","big")}else if(pl.sex==="M"&&q.sex==="F"&&!q.preg&&rf()<.3){q.preg={due:S.t+DAY*18,with:"you"};pl.trying=false;journal(`${q.name} tells you, quietly, that she's pregnant.`,"big")}}}
  if(pl.preg&&S.t>=pl.preg.due)playerBirth();
  if(d%12===0)for(const p of S.people)if(p.alive)p.age++;
  for(const p of living())if(p.role==="kid"&&p.age>=12&&p.group){p.role=roleFor(p,p.group);news(`${p.name} is old enough to work now.`,"",[p.id])}
  for(const p of living())if(rf()<.5)p.pack=packFor(p);
  for(const p of living())if(!p.want&&p.met&&rf()<.08)makeWant(p);
  // containers restock a little
  for(const [id,c] of Object.entries(S.cont))if(c.s>0&&rf()<.1)c.s--;
  storyBeats(d);
}
function ownerOf(site){return Object.values(S.groups).find(g=>g.home===site&&!g.dead)||null}
function freeSites(){return Object.keys(PLACES).filter(k=>PLACES[k].site&&!ownerOf(k))}
function splinter(g){const L=P(g.leader);if(!L)return;const ms=members(g.id).filter(p=>p.age>=18&&!p.follow);
  const big=ms.length>=10&&dayOf(S.t)>=8;const rebel=ms.filter(p=>p!==L&&p.tr.ambit>.55&&(p.mood<50||relGet(p,L)<-10||big&&p.tr.ambit>.68&&influence(p)>influence(L)*.65&&rf()<.35)).sort((a,b)=>influence(b)-influence(a))[0];if(!rebel)return;
  const free=freeSites();if(!free.length)return;
  const crew=ms.filter(p=>p!==L&&p!==rebel&&relGet(p,rebel)>15&&relGet(p,rebel)>relGet(p,L)+3&&(p.mood<70||p.partner===rebel.id));if(crew.length<2)return;
  const site=pick(free);const names={lodge:"The Cabin Folk",mill:"The Millers",farm:"Free Acre",church:"New Brigid's",school:"The Schoolhouse",quarry:"Red Rock"};
  const ng=newGroup(names[site]||`${rebel.name}'s people`,rebel.id,site);const share=Math.min(.4,(crew.length+1)/members(g.id).length);
  for(const k of STOCK_KEYS){const v=g.stock[k]*share;g.stock[k]-=v;ng.stock[k]=v}
  for(const p of [rebel,...crew]){const fam=members(g.id).filter(q=>q.hh===p.hh&&q.hh&&q!==p&&q!==L);for(const q of [p,...fam]){if(q.group===ng.id)continue;joinGroup(q,ng.id,true);placeTo(q,randIn(site,3));mem(q,`We broke away from ${g.name} with ${rebel.name}.`,-2,rebel.id)}}
  g.rel[ng.id]=ng.rel[g.id]=-25;relAdd(rebel,L,-20);mem(L,`${rebel.name} split ${g.name} and took people with them.`,-8,rebel.id);
  news(`${fullName(rebel)} broke away from ${g.name} with ${members(ng.id).length-1} others and took over ${PLACES[site].n}. They call themselves ${ng.name}.`,"big",[rebel.id,L.id])}
function leaderAI(g){const L=P(g.leader);if(!L)return;const st=g.stock;const n=groupSize(g.id);
  g.pol.ration=st.food<n*1.2?"half":"normal";g.pol.focus=st.food<n*2?"food":g.home&&S.sites[g.home].build.length?"build":"balanced";
  g.pol.stance=L.tr.kind<.35||L.tr.ambit>.85&&L.tr.kind<.5?"hostile":L.tr.kind>.65?"friendly":"neutral"}
function intergroup(d){const gs=Object.values(S.groups).filter(g=>!g.dead&&groupSize(g.id)>0);
  for(let i=0;i<gs.length;i++)for(let j=i+1;j<gs.length;j++){const a=gs[i],b=gs[j];const r=a.rel[b.id]||0;
    const scA=members(a.id).filter(p=>p.role==="scavenger").length,scB=members(b.id).filter(p=>p.role==="scavenger").length;
    if(r>-10&&rf()<.15&&(a.pol.stance!=="hostile"||b.pol.stance!=="hostile")){a.rel[b.id]=b.rel[a.id]=r+rnd(2,5);const give=(x,y)=>{if(x.stock.food>groupSize(x.id)*3&&y.stock.meds>2){x.stock.food-=10;y.stock.food+=10;y.stock.meds-=1;x.stock.meds+=1}};give(a,b);give(b,a);if(rf()<.35)news(`${a.name} and ${b.name} traded supplies at the bridge.`,"good")}
    const sf=(a.pol.stance==="hostile"||b.pol.stance==="hostile"?1.6:1)*(a.pol.stance==="friendly"&&b.pol.stance==="friendly"?.25:1);
    if(scA&&scB&&rf()<.06*sf*(r<20?1:.3)){a.rel[b.id]=b.rel[a.id]=r-rnd(5,12);const v=pick([...members(a.id),...members(b.id)].filter(p=>p.role==="scavenger"));if(v){if(rf()<.15)kill(v,`was shot in a standoff in town between ${a.name} and ${b.name}`);else{hurt(v,rnd(10,25),`was hurt in a fight ${pick(["over the last shelf at the pharmacy","over a gas can on Main Street","over a car full of canned food","over who saw a house first"])} between ${a.name} and ${b.name}`)}}}
    if(a.allied?.[b.id])continue;
    if(r>55&&rf()<.2&&a.pol.stance!=="hostile"&&b.pol.stance!=="hostile"){a.allied[b.id]=b.allied[a.id]=true;news(`${a.name} and ${b.name} have made a pact to help each other.`,"good")}
    for(const [x,y] of [[a,b],[b,a]]){const hungry=x.stock.food<groupSize(x.id)*1.5;if(x.pol.stance==="hostile"&&(hungry||rf()<.08)&&(x.rel[y.id]||0)<10&&y.stock.food>20&&rf()<.25&&d>=5)raid(x,y)}
  }}
function raid(x,y){const pow=members(x.id).filter(p=>p.age>=16).length*3+members(x.id).reduce((a,p)=>a+p.sk.fight,0)+Math.min(20,x.stock.ammo*.4)+rnd(0,20);
  if(S.player.group===y.id&&here()===y.home&&S.player.alive!==false){queueEvent("raid",y.home,S.t+90,{att:x.id,pow});return}
  resolveRaid(x,y,pow,defense(y.id),false)}
function resolveRaid(x,y,pow,def,withYou){x.rel[y.id]=y.rel[x.id]=Math.min(-40,(x.rel[y.id]||0)-30);
  if(def>=pow){const loss=rnd(0,2);const v=shuffle(members(x.id).filter(p=>p.age>=16)).slice(0,loss);for(const p of v)kill(p,`was killed raiding ${y.name}`);return `${x.name} hit ${y.name} at night and was driven off.${withYou?" You were on the line when it held.":""}${loss?` They left ${loss} of their own behind.`:""}`}
  const lf=Math.round(Math.min(y.stock.food,rnd(20,50)));y.stock.food-=lf;x.stock.food+=lf;const lm=Math.round(Math.min(y.stock.meds,rnd(0,4)));y.stock.meds-=lm;x.stock.meds+=lm;
  const dead=rnd(0,Math.max(1,Math.round((pow-def)/15)));const v=shuffle(members(y.id).filter(p=>p.age>=16)).slice(0,dead);for(const p of v){kill(p,`was killed when ${x.name} raided ${y.name}`);for(const q of members(y.id))if(relGet(q,p)>30)mem(q,`${x.name} killed ${p.name}. I won't forget it.`,-6,p.id)}
  return `${x.name} raided ${y.name}. They took ${lf} food${lm?` and ${lm} medical supplies`:""}${dead?`, and ${dead} people died`:""}.`}
function storyBeats(d){const F=S.flags;
  if(d===7&&!F.fever){F.fever=true;const g=pick(Object.values(S.groups).filter(g=>!g.dead&&g.home&&groupSize(g.id)>3));if(g){g.fever=S.t;news(`A fever is going through ${g.name}. They need antibiotics.`,"bad");const sick=shuffle(members(g.id)).slice(0,4);for(const p of sick){p.health-=25;p.mood-=10}
    const L=g.leader==="you"?null:P(g.leader);if(L){L.want={type:"fetch",item:"antibiotics",qty:2,text:`Fever's going through our people. We need antibiotics, two courses at least. The pharmacy in town might still have some.`,reward:{trust:25,aff:15}}}}}
  if(d===8&&!F.fever2){F.fever2=true;for(const g of Object.values(S.groups))if(g.fever&&!g.feverCured){const v=shuffle(members(g.id).filter(p=>p.health<60)).slice(0,2);for(const p of v)kill(p,`died of the fever at ${PLACES[g.home]?.n||"camp"}`)}}
  if(d===14&&!F.herd){F.herd=true;news("A herd. Hundreds of the dead are pouring down Highway 9 from the north.","big");for(let i=0;i<70;i++){const z=rnd(-100,40);spawnZed(rnd(20,36),z);}for(let i=0;i<20;i++){const p=randIn(pick(["fields","school","town"]));spawnZed(p.x,p.z)}
    for(const g of Object.values(S.groups))if(!g.dead&&(g.home==="school"||g.home==="farm")){const def=defense(g.id);const pow=rnd(25,55);if(g.home===myGroup()?.home&&here()===g.home)queueEvent("herd",g.home,S.t+120,{pow});else if(def<pow){const v=shuffle(members(g.id)).slice(0,rnd(1,3));for(const p of v)kill(p,`was dragged down when the herd hit ${PLACES[g.home].n}`)}}}
  if(d===20&&!F.winter){F.winter=true;news("First hard frost. Gardens are done for the year. Winter is coming in fast.","big")}
}
function birth(mother){const dadId=mother.preg.with;mother.preg=null;const dad=dadId==="you"?null:P(dadId);
  const c=makePerson({age:0,job:"kid",style:"kid",sur:mother.sur||dad?.sur||""});c.born=S.t;c.parents=[mother.id,dadId];c.group=mother.group;c.role="kid";c.hh=mother.hh;c.x=mother.x;c.z=mother.z;c.tx=c.x;c.tz=c.z;
  S.people.push(c);PMAP[c.id]=c;mother.kids.push(c.id);if(dad)dad.kids.push(c.id);famLink(mother,c,c.sex==="F"?"daughter":"son","mom",90);if(dad)famLink(dad,c,c.sex==="F"?"daughter":"son","dad",85);
  if(dadId==="you"){S.player.kids.push(c.id);c.trust=60;c.aff=80;c.fam.you="dad";S.player.fam[c.id]="kid";queueEvent("name_child","any",S.t+DAY*3,{child:c.id});news(`${mother.name} gave birth. The baby is ${S.player.name}'s.`,"big")}
  else news(`${fullName(mother)} gave birth${mother.group?" at "+(PLACES[G(mother.group)?.home]?.n||"camp"):""}.`,"good",[mother.id])}
function playerBirth(){const pl=S.player;const partner=P(pl.preg.with);pl.preg=null;const c=makePerson({age:0,job:"kid",style:"kid",sur:partner?.sur||""});c.born=S.t;c.parents=["you",partner?.id];c.group=pl.group;c.role="kid";c.x=pl.x;c.z=pl.z;c.tx=c.x;c.tz=c.z;
  c.trust=60;c.aff=80;c.fam.you="mom";pl.fam[c.id]="kid";S.people.push(c);PMAP[c.id]=c;pl.kids.push(c.id);if(partner){partner.kids.push(c.id);famLink(partner,c,c.sex==="F"?"daughter":"son","dad",85)}
  pl.energy=10;pl.hp=Math.min(pl.hp,60);news(`${pl.name} gave birth.`,"big");queueEvent("name_child","any",S.t+DAY*3,{child:c.id})}

// wants (personal requests)
function makeWant(p){const opts=[];const lostFam=Object.entries(p.fam).map(([id,r])=>[P(id),r]).filter(([q])=>q&&q.status==="turned");
  if(lostFam.length&&!p.want){const [q,r]=lostFam[0];opts.push({type:"mercy",about:q.id,text:`My ${r}, ${q.name}... they turned. They're still out there, somewhere around ${PLACES[regionAt(q.x,q.z)]?.n||"town"}. I can't do it. Will you put them to rest?`,reward:{trust:30,aff:20}})}
  const missing=Object.entries(p.fam).map(([id,r])=>[P(id),r]).filter(([q])=>q&&q.alive&&q.group!==p.group);
  if(missing.length){const [q,r]=missing[0];opts.push({type:"find",about:q.id,text:`Have you seen my ${r}, ${q.name}? We got separated when everything went to hell. If you find them, tell them I'm alive. Tell them where I am.`,reward:{trust:20,aff:20}})}
  if(p.job==="nurse"||p.job==="doctor"||p.role==="medic")opts.push({type:"fetch",item:"bandage",qty:3,text:"We're out of bandages. If you're going into town, could you bring me three? Cloth works too if you make them yourself.",reward:{trust:12,aff:8}});
  if(p.kids.length)opts.push({type:"fetch",item:"canned_fruit",qty:1,text:`My kid hasn't had anything sweet in days. If you find a can of peaches or anything like it... I'd owe you.`,reward:{trust:10,aff:14}});
  if(p.mem.some(m=>/cigarette|smok/.test(m.x))||rf()<.2)opts.push({type:"fetch",item:"cigarettes",qty:1,text:"I'd kill for a smoke. Not literally. Probably.",reward:{trust:6,aff:10}});
  if(p.role==="guard"||p.tr.brave>.7)opts.push({type:"fetch",item:pick(["crowbar","machete","bat"]),qty:1,text:"I'm on the wall every night with a broom handle. Find me something real to fight with?",reward:{trust:15,aff:8}});
  opts.push({type:"fetch",item:pick(["water_bottle","canned_food","flashlight","duct_tape"]),qty:rnd(1,2),text:"",reward:{trust:8,aff:6}});
  const w=opts[0]&&(opts[0].type==="mercy"||opts[0].type==="find")?opts[0]:pick(opts);if(!w.text)w.text=`Could you find me ${itemPhrase(w.item,w.qty)}? I'll make it worth your while.`;p.want=w}
