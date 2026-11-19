// ================= your body: where you're hurt, what each wound is doing, and what it needs =================
// Twelve parts. A wound sits on one part at a named spot and keeps its own bleeding, dirt, infection, dressing and healing.
// pl.hp is still your overall strength; wounds drain it (bleeding, fever) and slow you down (breaks, pain).
// pl.bleeding stays as the total of what's bleeding right now, so older code that reads it keeps working.

const BODY={
  head:{n:"head",armor:["head"],hit:.05},
  neck:{n:"neck",armor:[],hit:.035},
  chest:{n:"chest",armor:["outer","body"],hit:.13},
  belly:{n:"belly",armor:["outer","body"],hit:.09},
  rarm:{n:"right arm",armor:["outer","body"],hit:.17,limb:"arm",side:"right"},
  larm:{n:"left arm",armor:["outer","body"],hit:.17,limb:"arm",side:"left"},
  rhand:{n:"right hand",armor:["hands"],hit:.07,limb:"hand",side:"right"},
  lhand:{n:"left hand",armor:["hands"],hit:.07,limb:"hand",side:"left"},
  rleg:{n:"right leg",armor:["legs"],hit:.085,limb:"leg",side:"right"},
  lleg:{n:"left leg",armor:["legs"],hit:.085,limb:"leg",side:"left"},
  rfoot:{n:"right foot",armor:["feet"],hit:.025,limb:"foot",side:"right"},
  lfoot:{n:"left foot",armor:["feet"],hit:.025,limb:"foot",side:"left"}};
const BODY_KEYS=Object.keys(BODY);
// named spots on each part: [name, how far down the part (0 top, 1 bottom), how far to one side (-1..1)]
const SPOTS={
  head:[["scalp",.12,0],["forehead",.3,0],["cheek",.55,-.55],["jaw",.82,.3],["ear",.45,.95]],
  neck:[["throat",.55,0],["side of the neck",.45,.75]],
  chest:[["collarbone",.1,.35],["chest",.45,-.3],["ribs",.78,.65]],
  belly:[["stomach",.35,0],["side",.5,-.85],["hip",.85,.7]],
  arm:[["shoulder",.05,0],["upper arm",.3,0],["elbow",.52,0],["forearm",.75,0],["forearm",.7,0],["wrist",.95,0]],
  hand:[["palm",.45,0],["knuckles",.3,.2],["fingers",.82,0],["thumb",.4,-.9]],
  leg:[["thigh",.22,0],["knee",.48,0],["shin",.72,0],["calf",.68,.4],["ankle",.97,0]],
  foot:[["ankle",.1,0],["heel",.35,0],["top of the foot",.55,0],["toes",.9,0]]};
// kinds of wound. bleed: how fast it starts; clot: how fast that slows by itself, per hour; days: to heal under good conditions
const WOUND={
  scratch:{n:"Scratch",bleed:.12,clot:.15,pain:4,days:1.2,dirt:.55},
  cut:{n:"Cut",bleed:.45,clot:.05,pain:9,days:3,dirt:.3},
  deep:{n:"Deep cut",bleed:1.05,clot:.012,pain:18,days:6,dirt:.3},
  bite:{n:"Bite",bleed:.55,clot:.03,pain:16,days:5,dirt:1},
  bruise:{n:"Bruise",bleed:0,clot:0,pain:6,days:2,dirt:0,closed:true},
  fracture:{n:"Broken bone",bleed:0,clot:0,pain:30,days:9,dirt:0,closed:true},
  incision:{n:"Surgical incision",bleed:0,clot:0,pain:7,days:5,dirt:0}};
// what you can clean, dress, stitch and splint with, best first: [item, how good, what to call it]
const CLEANERS=[["rubbing_alcohol",1,"rubbing alcohol"],["whiskey",.9,"whiskey"],["boiled_water",.6,"boiled water"],["water_bottle",.45,"bottled water"]];
const DRESSINGS=[["bandage",1,"a bandage"],["poultice",.9,"an herb poultice"],["cloth",.72,"a strip of cloth"]];
const NEEDLES=[["suture_kit",1,"the suture kit"],["sewing_kit",.8,"a sewing needle"]];
const SPLINTS=[["splint",1,"the splint"],["boards",.8,"a board and a strip of cloth"]];

function body(){const pl=S.player;if(!pl.body){pl.body={w:[],ache:0,pk:0,abx:0,nid:1};
    // an older save that only knew "bleeding": give it a real wound
    if(pl.bleeding>0)addWound("cut",pick(["larm","rarm"]))}
  return pl.body}
function wounds(){return body().w}
function woundById(id){return wounds().find(w=>w.id===id)||null}
function spotName(p,s,v){const b=BODY[p];if(b.side)return `${b.side} ${s}`;if(v&&["cheek","ear","side","hip","collarbone","side of the neck","ribs"].includes(s))return `${v<0?"right":"left"} ${s}`;return s}
function addWound(k,p,o={}){const B=body();const b=BODY[p];
  if(k==="fracture"&&!(b.limb||p==="chest"))k="bruise";const K=WOUND[k];
  // the same kind of small hurt on the same part makes the old one worse instead of adding another
  const same=B.w.find(w=>w.p===p&&w.k===k&&(k==="bruise"||k==="scratch")&&w.heal<60);
  if(same||B.w.length>=14){const w=same||B.w.filter(x=>x.p===p)[0]||B.w[0];w.sev=Math.min(2,w.sev+.3);w.heal=Math.max(0,w.heal-25);if(K.bleed)w.bl+=K.bleed*.6;w.dirt=Math.max(w.dirt,K.dirt);if(w.band)w.band.d=Math.min(1,w.band.d+.3);return w}
  const list=SPOTS[b.limb||p];const s=o.at?list.find(x=>x[0]===o.at)||pick(list):pick(list);const v=s[2]||(rf()<.5?-1:1)*rf()*.4;
  const sev=o.sev||.8+rf()*.4;
  const w={id:B.nid++,p,k,at:spotName(p,s[0],s[2]?(rf()<.5?-1:1):0),u:s[1],v,sev,bl:K.bleed*sev,dirt:K.dirt,cl:0,inf:0,band:null,st:0,spl:0,heal:o.heal||0,born:S.t,why:o.why||""};
  if(s[2]&&!b.side){w.v=Math.abs(s[2])*(w.at.startsWith("left")?1:-1)}
  B.w.push(w);return w}
function woundName(w){if(w.k!=="fracture")return WOUND[w.k].n;if(w.p==="chest")return"Cracked ribs";const b=BODY[w.p];return `Broken ${b.limb==="hand"?"fingers":b.limb}`}
// how fast it's bleeding right now, after stitches and dressings
function wBleed(w){if(!w.bl)return 0;let b=w.bl;if(w.st)b*=.08;if(w.band){const q=w.band.q*(w.band.d>.85?.55:1);b*=.62-.56*q}return b}
function bleedTotal(){let t=0;for(const w of wounds())t+=wBleed(w);return t}
function wPain(w){const K=WOUND[w.k];let p=K.pain*w.sev*(1-w.heal/100*.65);if(w.k==="fracture"&&w.spl)p*=.45;if(w.band)p*=.85;if(w.inf>40)p+=8;return p}
function painNow(){const B=body();let p=B.ache||0;for(const w of B.w)p+=wPain(w);if(B.pk>S.t)p*=.35;return clamp(p,0,100)}
function infMax(){let m=0;for(const w of wounds())m=Math.max(m,w.inf);return m}
function broken(limb){return wounds().filter(w=>w.k==="fracture"&&BODY[w.p].limb===limb)}
// what the hurts do to you
function bodySpeed(){let m=1;for(const w of broken("leg"))m=Math.min(m,w.spl?.72:.5);for(const w of broken("foot"))m=Math.min(m,w.spl?.8:.62);const p=painNow();if(p>80)m*=.8;else if(p>60)m*=.9;return m}
function canRun(){return!wounds().some(w=>w.k==="fracture"&&!w.spl&&(BODY[w.p].limb==="leg"||BODY[w.p].limb==="foot"))}
function armPower(){const n=broken("arm").length+broken("hand").length*.5;if(!n)return 1;const spl=[...broken("arm"),...broken("hand")].every(w=>w.spl);return n>=2?.4:spl?.8:.55}
function aimPenalty(){return painNow()*.0012+(broken("arm").length||broken("hand").length?.08:0)}

// where a blow lands, and what the clothes there soak up
function hitPart(){let r=rf()*BODY_KEYS.reduce((a,k)=>a+BODY[k].hit,0);for(const k of BODY_KEYS){r-=BODY[k].hit;if(r<0)return k}return"larm"}
function partArmor(p){let a=0;for(const s of BODY[p].armor){const g=gearEq(s);if(g)a+=ITEMS[g.id].armor||0}return a}
function partGear(p){for(const s of BODY[p].armor){const g=gearEq(s);if(g)return{s,g}}return null}
// one of the dead gets a hand or its teeth on you
function zedWound(z){const pl=S.player;const p=hitPart();const ar=partArmor(p);
  if(!pl.bitten&&!(z&&z.weak)&&rf()<.13*(1-Math.min(ar,8)/9)*(p==="neck"?1.6:1)){const w=addWound("bite",p,{why:"the dead"});pl.bitten=S.t;return{w,bite:true,ar}}
  const r=rf();let k;
  if(ar>=3)k=r<.72?"bruise":r<.95?"scratch":"cut";
  else if(ar>=1)k=r<.45?"bruise":r<.8?"scratch":r<.97?"cut":"deep";
  else k=r<.25?"bruise":r<.65?"scratch":r<.92?"cut":"deep";
  return{w:addWound(k,p,{why:"the dead"}),bite:false,ar}}
// a person, a fall, a fight: n is how much it took out of you
function hurtPlayer(n,how="fight"){const pl=S.player;pl.hp=Math.max(0,pl.hp-n);const B=body();B.ache=Math.min(60,(B.ache||0)+n);if(n<3)return null;
  if(how==="dead")return zedWound().w;
  let p=hitPart(),k;const r=rf();
  if(how==="fall"){p=pick(["lleg","rleg","lfoot","rfoot","larm","rarm","lhand","rhand","chest"]);k=r<.25?"fracture":r<.72?"bruise":"cut"}
  else if(how==="knife")k=r<.25?"bruise":r<.75?"cut":"deep";
  else k=n>14&&r<.12?"fracture":r<.58?"bruise":r<.85?"cut":"deep";
  return addWound(k,p,{why:how})}
function hitLine(w){const at=w.at;switch(w.k){
  case"scratch":return pick([`Nails rake your ${at}.`,`Scratched across the ${at}.`,`It claws your ${at}. Just a scratch. Probably.`]);
  case"cut":return pick([`The skin on your ${at} tears open. You're bleeding.`,`A cut across your ${at}. It's bleeding.`]);
  case"deep":return `A deep gash in your ${at}. It's bleeding badly.`;
  case"bruise":return pick([`A blow to the ${at}. That'll bruise.`,`Your ${at} takes a hard knock.`]);
  case"fracture":return `Something cracks in your ${at}. The pain is white and total.`;
  default:return `Hit in the ${at}.`}}

// ---------- the hours passing ----------
// returns how much health the bleeding took over this stretch
function bodyTick(h,opt={}){const pl=S.player;const B=body();if(!B.w.length&&!B.ache){pl.bleeding=0;return 0}
  const fed=pl.food>25&&pl.water>25;const g=myGroup();const camp=g&&g.home&&here()===g.home&&siteHas(g.home,"infirmary");const abx=B.abx>S.t;
  let lost=0;const done=[];
  for(const w of B.w){const K=WOUND[w.k];
    // blood slows as it clots, faster under a dressing or stitches
    if(w.bl>0)w.bl=Math.max(0,w.bl-K.clot*(w.band?2.2:1)*(w.st?4:1)*h);
    const b=wBleed(w);lost+=b*6*h;
    // a dressing soaks through; an open wound picks up dirt
    if(w.band)w.band.d=Math.min(1,w.band.d+h*(.018+b*.3+(w.band.k==="rag"?.012:0)));
    else if(!K.closed&&w.heal<85)w.dirt=Math.min(1,w.dirt+h*.008);
    // infection: dirt in an open wound, or a filthy dressing; antibiotics push it back
    if(!K.closed){if(abx)w.inf=Math.max(0,w.inf-3*h);else{const r=w.dirt*(w.k==="bite"?1.2:1)+(w.band&&w.band.d>.7?.35:0);if(r>.12)w.inf=Math.min(100,w.inf+r*3*h);else w.inf=Math.max(0,w.inf-1.4*h)}}
    // healing
    let rate=100/(K.days*24)*(fed?1:.3)*(opt.sleep?1.5:1)*(camp?1.4:1);
    if(w.inf>40)rate=0;
    if(w.k==="deep"&&!w.st)rate*=.3;
    if((w.k==="cut"||w.k==="incision")&&w.st)rate*=1.5;
    if(!K.closed)rate*=w.band?1.25:.85;
    if(w.k==="fracture"&&!w.spl){rate*=.3;if(w.heal>=60)rate=0}
    w.heal=Math.min(100,w.heal+rate*h);if(w.heal>=100)done.push(w)}
  for(const w of done)healed(w);
  B.ache=Math.max(0,(B.ache||0)-h*25);
  pl.bleeding=+bleedTotal().toFixed(2);
  // a wound that's gone bad brings a fever with it
  if(!pl.sick&&!abx){const w=B.w.find(x=>x.inf>=55);if(w){pl.sick=1;journal(`The ${woundName(w).toLowerCase()} on your ${w.at} is hot, swollen and leaking. You're running a fever. It's infected.`,"bad");if(typeof toast==="function")toast("A wound has gone bad. You have a fever.")}}
  return lost}
function healed(w){const B=body();B.w=B.w.filter(x=>x!==w);
  const t={cut:`The cut on your ${w.at} has closed. It'll scar.`,deep:`The gash on your ${w.at} has finally closed. You'll carry the scar.`,incision:`The incision on your ${w.at} has healed to a pink line.`,
    fracture:`Your ${w.p==="chest"?"ribs have":BODY[w.p].n+" has"} knit. ${w.spl?(w.cast?"You peel off what's left of the cast":w.splItem==="strap"?"You unwind the strapping":"You take the splint off")+" and test it. It holds.":"It's stiff, but it holds."}`,bite:`The bite on your ${w.at} has closed over.`}[w.k];
  if(t)journal(t,"good");if(w.spl&&!w.cast&&w.splItem==="splint")invAdd("splint",1,true)}

// ---------- treating a wound ----------
// q is how well you did it, 0 to 1, from the hands-on part on the health screen
function usesLeft(id){const it=ITEMS[id];let n=0;for(const {c} of pConts())for(const g of c.items)if(g.id===id)n+=it.uses?Math.max(0,it.uses-(g.used||0))*g.n:g.n;return n}
function useUp(id){const it=ITEMS[id];for(const {c} of pConts())for(const g of c.items){if(g.id!==id)continue;
    if(it.uses){g.used=(g.used||0)+1;if(g.used<it.uses)return true}
    g.n-=1;g.used=0;if(g.n<=0){cRemove(c,g);if(g.c)spill(g)}if(it.after)invAdd(it.after,1,true);return true}
  return false}
function haveFor(list){return list.filter(([id])=>id==="boards"?invHas("wood")&&invHas("cloth"):usesLeft(id)>0)}
function needsClean(w){return!WOUND[w.k].closed&&(w.dirt>.04||w.inf>0||!w.cl)}
function canStitch(w){return(w.k==="cut"||w.k==="deep")&&!w.st}
function cleanWound(w,item,q){const c=CLEANERS.find(x=>x[0]===item)||CLEANERS[3];const s=c[1]*clamp(q,0,1);
  w.dirt=Math.max(0,w.dirt*(1-s)-(s>.8?.08:0));w.cl=Math.max(w.cl||0,s);if(w.inf<50)w.inf=Math.max(0,w.inf-28*s);
  useUp(item);const B=body();B.ache=Math.min(70,(B.ache||0)+(item==="rubbing_alcohol"||item==="whiskey"?(B.pk>S.t?6:18):4));skillUp("medic",.05)}
function dressWound(w,item,q){if(w.band)undress(w);const d=DRESSINGS.find(x=>x[0]===item)||DRESSINGS[2];
  w.band={k:item==="cloth"?"rag":item,q:clamp(q*d[1],.1,1),d:item==="cloth"?.25:item==="poultice"?.08:0};
  if(item==="poultice"){w.dirt=Math.max(0,w.dirt-.35);if(w.inf<50)w.inf=Math.max(0,w.inf-10)}
  invTake(item,1);skillUp("medic",.05)}
// a used bandage can be boiled clean; a soaked rag goes in the fire
function undress(w){const b=w.band;if(!b)return;w.band=null;if(b.k==="bandage")invAdd("dirty_bandage",1,true)}
function stitchWound(w,item,q){const B=body();w.st=clamp(q*(item==="suture_kit"?1:.85),.2,1);w.bl*=w.k==="deep"?.15:0;
  if(item==="sewing_kit"&&!(w.cl>.7))w.dirt=Math.min(1,w.dirt+.25);
  if(q<.5)w.sev=Math.min(2,w.sev+.15);
  useUp(item);B.ache=Math.min(80,(B.ache||0)+(B.pk>S.t?8:24));skillUp("medic",.12)}
function splintWound(w,how,q){w.spl=clamp(q,.3,1);w.splItem=how;if(how==="splint")invTake("splint",1);else{invTake("wood",1);invTake("cloth",1)}const B=body();B.ache=Math.min(80,(B.ache||0)+(B.pk>S.t?6:16));skillUp("medic",.08)}
function takePainkillers(){const B=body();if(!invHas("painkillers"))return false;invTake("painkillers",1);B.pk=S.t+6*60;journal(painNow()>8?"You dry-swallow two pills. Twenty minutes later the edges soften.":"You take two painkillers.");return true}
function takeAntibiotics(){const pl=S.player;const B=body();if(!invHas("antibiotics"))return false;invTake("antibiotics",1);B.abx=S.t+36*60;const bad=infMax();for(const w of B.w)w.inf=Math.max(0,w.inf-35);
  if(pl.sick){pl.sick=0;journal(bad>=40?"You start the antibiotics. By evening the fever's down and the wound looks less angry.":"The antibiotics knock the fever down.","good")}else journal(bad>0?"You start a course of antibiotics. The redness around the wound should fade.":"You take the antibiotics. Nothing was infected, so all it does is use them up.");return true}

// ---------- reading a wound ----------
function bleedWord(b){return b>.6?"Bleeding heavily":b>.25?"Bleeding":b>.03?"Seeping blood":""}
function wSeverity(w){if(w.k==="bite"||w.inf>=40)return 3;const b=wBleed(w);if(b>.3)return 3;if(w.k==="fracture")return w.spl?2:3;if(w.k==="deep")return w.st?2:3;if(b>.05||w.k==="cut"&&!w.band||w.inf>15)return 2;return 1}
function partSeverity(p){let s=0;for(const w of wounds())if(w.p===p)s=Math.max(s,wSeverity(w));return s}
// rough days left to heal if nothing changes
function healEta(w){const K=WOUND[w.k];if(w.inf>40)return-1;let rate=100/(K.days*24);if(w.k==="deep"&&!w.st)rate*=.3;if((w.k==="cut"||w.k==="incision")&&w.st)rate*=1.5;if(!K.closed)rate*=w.band?1.25:.85;
  if(w.k==="fracture"&&!w.spl)return-2;return(100-w.heal)/rate/24}
function woundStatus(w){const L=[];const K=WOUND[w.k];const b=wBleed(w);
  const bw=bleedWord(b);if(bw)L.push(bw);else if(!K.closed&&w.bl>0)L.push("Barely bleeding");
  if(w.k==="bite")L.push("There's no cure. A dressing only keeps it clean");
  if(!K.closed){if(w.inf>=55)L.push("Infected: hot, swollen and leaking");else if(w.inf>=30)L.push("Red and angry around the edges. It's turning");else if(w.inf>=12)L.push("A little pink around the edges");
    if(!w.band){if(w.dirt>.5)L.push("Dirty");else if(w.dirt>.15)L.push("Could be cleaner");else if(w.cl)L.push("Cleaned")}}
  if(w.band){const k=w.band.k;const name=k==="rag"?"a cloth rag":k==="poultice"?"a poultice":"a bandage";
    L.push(w.band.d>.7?`Wrapped in ${name}, soaked through. Change it`:w.band.d>.4?`Wrapped in ${name}, getting dirty`:`Wrapped in ${name}${w.band.q>.8?", snug":w.band.q<.5?", loosely":""}`)}
  else if(!K.closed&&w.k!=="scratch"&&!(w.st&&w.heal>=80))L.push("Not dressed");
  if(w.st)L.push(w.st>.75?"Stitched shut, neatly":"Stitched shut, roughly");
  else if(w.k==="deep")L.push("Needs stitches to close");
  if(w.k==="fracture")L.push(w.cast?"In a cast":w.splItem==="strap"?"Strapped":w.spl?"Splinted":"Not splinted. Every move grinds");
  const eta=healEta(w);L.push(eta===-1?"Not healing while it's infected":eta===-2?"It won't heal right without a splint":w.heal<5&&S.t-w.born<120?"Fresh":eta<1?"Nearly healed":`About ${Math.round(eta)} day${Math.round(eta)===1?"":"s"} to heal`);
  return L}
function bodySummary(){const pl=S.player;const W=wounds();const L=[];const b=bleedTotal();const pn=painNow();
  if(b>.03)L.push({t:`${bleedWord(b)||"Bleeding"} (about ${Math.max(1,Math.round(b*6))} health an hour)`,k:3});
  if(pl.bitten)L.push({t:"Bitten. No cure",k:3});
  const im=infMax();if(im>=55||pl.sick&&im>=40)L.push({t:"Fever from an infected wound",k:3});else if(pl.sick)L.push({t:"Sick",k:2});else if(im>=30)L.push({t:"A wound is turning",k:2});
  for(const w of W)if(w.k==="fracture")L.push({t:woundName(w)+(w.spl?"":", not splinted"),k:w.spl?2:3});
  if(pn>60)L.push({t:body().pk>S.t?"In a lot of pain, even with pills":"In agony",k:3});else if(pn>30)L.push({t:"In pain",k:2});else if(pn>10)L.push({t:"Sore",k:1});
  if(pl.food<15)L.push({t:"Starving",k:3});else if(pl.food<35)L.push({t:"Hungry",k:2});
  if(pl.water<15)L.push({t:"Parched",k:3});else if(pl.water<35)L.push({t:"Thirsty",k:2});
  if(pl.energy<15)L.push({t:"Exhausted",k:3});else if(pl.energy<35)L.push({t:"Tired",k:2});
  if(pl.warmth<15)L.push({t:"Freezing",k:3});else if(pl.warmth<35)L.push({t:"Cold",k:2});
  return L}
// the wound most in need of a dressing right now
function worstBleeder(){let best=null,bb=.03;for(const w of wounds()){const b=wBleed(w);if(w.band&&w.band.d<=.7&&w.band.q>=.6)continue;if(b>bb){bb=b;best=w}}return best}
// which wound a supply would go on, if you just reach for it
function woundFor(k){const W=wounds();const by=f=>W.filter(f).sort((a,b)=>wSeverity(b)-wSeverity(a)||wBleed(b)-wBleed(a))[0]||null;
  if(k==="wrap")return worstBleeder()||by(w=>!WOUND[w.k].closed&&(!w.band||w.band.d>.7)&&w.k!=="scratch")||by(w=>!WOUND[w.k].closed&&(!w.band||w.band.d>.7));
  if(k==="clean")return W.filter(needsClean).sort((a,b)=>b.inf+b.dirt*50-a.inf-a.dirt*50)[0]||null;
  if(k==="stitch")return by(w=>w.k==="deep"&&!w.st)||by(canStitch);
  if(k==="splint")return by(w=>w.k==="fracture"&&!w.spl);return null}
