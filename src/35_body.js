// ================= your body: where you're hurt, what each wound is doing, and what it needs =================
// Twelve parts. A wound sits on one part at a named spot and keeps its own bleeding, infection and healing.
// Looking after one is simple: wash it, wrap it, eat and drink, and take antibiotics if it turns.
// pl.hp is still your overall strength; wounds drain it (bleeding, fever) and a broken leg slows you down.
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
// what you can wash a wound with, and wrap it in, best first: [item, how good, what to call it]
const CLEANERS=[["rubbing_alcohol",1,"rubbing alcohol"],["whiskey",.9,"whiskey"],["boiled_water",.8,"boiled water"],["water_bottle",.7,"bottled water"]];
const DRESSINGS=[["bandage",1,"a bandage"],["poultice",.9,"an herb poultice"],["cloth",.75,"a strip of cloth"]];
// a broken bone gets bound: a splint if you have one, otherwise wrapped tight
const BINDS=[["splint",1,"the splint"],["bandage",.85,"a bandage"],["cloth",.7,"strips of cloth"]];

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
function wBleed(w){if(!w.bl)return 0;let b=w.bl;if(w.st)b*=.08;if(w.band)b*=w.k==="deep"?.15:.08;return b}
function bleedTotal(){let t=0;for(const w of wounds())t+=wBleed(w);return t}
function wPain(w){const K=WOUND[w.k];let p=K.pain*w.sev*(1-w.heal/100*.65);if(w.spl||w.band)p*=.6;if(w.inf>40)p+=8;return p}
function painNow(){const B=body();let p=B.ache||0;for(const w of B.w)p+=wPain(w);if(B.pk>S.t)p*=.5;return clamp(p,0,100)}
function infMax(){let m=0;for(const w of wounds())m=Math.max(m,w.inf);return m}
function broken(limb){return wounds().filter(w=>w.k==="fracture"&&BODY[w.p].limb===limb)}
// what the hurts do to you
function bodySpeed(){let m=1;for(const w of broken("leg"))m=Math.min(m,w.spl?.72:.5);for(const w of broken("foot"))m=Math.min(m,w.spl?.8:.62);return m}
function canRun(){return!wounds().some(w=>w.k==="fracture"&&!w.spl&&(BODY[w.p].limb==="leg"||BODY[w.p].limb==="foot"))}
function armPower(){const n=broken("arm").length+broken("hand").length*.5;if(!n)return 1;const spl=[...broken("arm"),...broken("hand")].every(w=>w.spl);return n>=2?.4:spl?.8:.55}
function aimPenalty(){return broken("arm").length||broken("hand").length?.08:0}

// where a blow lands, and what the clothes there soak up
function hitPart(){let r=rf()*BODY_KEYS.reduce((a,k)=>a+BODY[k].hit,0);for(const k of BODY_KEYS){r-=BODY[k].hit;if(r<0)return k}return"larm"}
function partArmor(p){let a=0;for(const s of BODY[p].armor){const g=gearEq(s);if(g)a+=ITEMS[g.id].armor||0}return a}
function partGear(p){for(const s of BODY[p].armor){const g=gearEq(s);if(g)return{s,g}}return null}
// one of the dead gets a hand or its teeth on you
// bc is the chance of teeth instead of hands, before clothes; a fight passes it in from the dice
function zedWound(z,bc=.13){const pl=S.player;const p=hitPart();const ar=partArmor(p);
  if(!pl.bitten&&!(z&&z.weak)&&rf()<bc*(1-Math.min(ar,8)/9)*(p==="neck"?1.6:1)){const w=addWound("bite",p,{why:"the dead"});pl.bitten=S.t;return{w,bite:true,ar}}
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
  else if(how==="shot")k=r<.65?"deep":"cut";
  else k=n>14&&r<.12?"fracture":r<.58?"bruise":r<.85?"cut":"deep";
  return addWound(k,p,{why:how})}
function hitLine(w){const at=w.at;if(w.why==="shot")return pick([`The bullet tears through your ${at}.`,`You're shot in the ${at}. It burns, then it doesn't, which is worse.`]);switch(w.k){
  case"scratch":return pick([`Nails rake your ${at}.`,`Scratched across the ${at}.`,`It claws your ${at}. Just a scratch. Probably.`]);
  case"cut":return pick([`The skin on your ${at} tears open. You're bleeding.`,`A cut across your ${at}. It's bleeding.`]);
  case"deep":return `A deep gash in your ${at}. It's bleeding badly.`;
  case"bruise":return pick([`A blow to the ${at}. That'll bruise.`,`Your ${at} takes a hard knock.`]);
  case"fracture":return `Something cracks in your ${at}. The pain is white and total.`;
  default:return `Hit in the ${at}.`}}

// ---------- the hours passing ----------
// food and water do more for healing than anything else
function feedFactor(){const pl=S.player;const m=Math.min(pl.food,pl.water);return m>=50?1.4:m>=25?1:.3}
function washed(w){return(w.cl||0)>0||(w.dirt||0)<=.02}
// returns how much health the bleeding took over this stretch
function bodyTick(h,opt={}){const pl=S.player;const B=body();if(!B.w.length&&!B.ache){pl.bleeding=0;return 0}
  const fed=feedFactor();const g=myGroup();const camp=g&&g.home&&here()===g.home&&siteHas(g.home,"infirmary");const abx=B.abx>S.t;
  let lost=0;const done=[];
  for(const w of B.w){const K=WOUND[w.k];const open=!K.closed;
    // bleeding slows by itself, and a wrap all but stops it
    if(w.bl>0)w.bl=Math.max(0,w.bl-K.clot*(w.band||w.st?3:1)*h);
    const b=wBleed(w);lost+=b*6*h;
    // a wound nobody washed can turn; a washed one stays clean; antibiotics clear it
    if(open){if(abx)w.inf=Math.max(0,w.inf-6*h);else if(!washed(w))w.inf=Math.min(100,w.inf+w.dirt*(w.band?1.5:3)*(w.k==="bite"?1.2:1)*h);else w.inf=Math.max(0,w.inf-1.5*h)}
    // healing: fed and watered, rested, wrapped
    let rate=100/(K.days*24)*fed*(opt.sleep?1.5:1)*(camp?1.3:1);
    if(w.inf>=40)rate=0;
    if(open)rate*=w.band||w.st?1.3:.8;
    if(w.k==="deep"&&!w.band&&!w.st)rate*=.4;
    if(w.k==="fracture"&&!w.spl){rate*=.3;if(w.heal>=60)rate=0}
    w.heal=Math.min(100,w.heal+rate*h);if(w.heal>=100)done.push(w)}
  for(const w of done)healed(w);
  B.ache=Math.max(0,(B.ache||0)-h*25);
  pl.bleeding=+bleedTotal().toFixed(2);
  // a wound that's gone bad brings a fever with it
  if(!pl.sick&&!abx){const w=B.w.find(x=>x.inf>=55);if(w){pl.sick=1;journal(`The ${woundName(w).toLowerCase()} on your ${w.at} is hot, swollen and leaking. You're running a fever. It's infected. Antibiotics would fix it.`,"bad");if(typeof toast==="function")toast("A wound has gone bad. You have a fever.")}}
  return lost}
function healed(w){const B=body();B.w=B.w.filter(x=>x!==w);
  const t={cut:`The cut on your ${w.at} has closed. It'll scar.`,deep:`The gash on your ${w.at} has finally closed. You'll carry the scar.`,incision:`The incision on your ${w.at} has healed to a pink line.`,
    fracture:`Your ${w.p==="chest"?"ribs have":BODY[w.p].n+" has"} knit. ${w.spl?(w.cast?"You peel off what's left of the cast":w.splItem==="strap"?"You unwind the strapping":w.splItem==="splint"?"You take the splint off":"You unwrap it")+" and test it. It holds.":"It's stiff, but it holds."}`,bite:`The bite on your ${w.at} has closed over.`}[w.k];
  if(t)journal(t,"good")}

// ---------- looking after a wound: one click each ----------
function usesLeft(id){const it=ITEMS[id];let n=0;for(const {c} of pConts())for(const g of c.items)if(g.id===id)n+=it.uses?Math.max(0,it.uses-(g.used||0))*g.n:g.n;return n}
function useUp(id){const it=ITEMS[id];for(const {c} of pConts())for(const g of c.items){if(g.id!==id)continue;
    if(it.uses){g.used=(g.used||0)+1;if(g.used<it.uses)return true}
    g.n-=1;g.used=0;if(g.n<=0){cRemove(c,g);if(g.c)spill(g)}if(it.after)invAdd(it.after,1,true);return true}
  return false}
function haveFor(list){return list.filter(([id])=>usesLeft(id)>0)}
function needsWash(w){return!WOUND[w.k].closed&&!washed(w)}
function needsWrap(w){if(w.k==="fracture")return!w.spl;return!WOUND[w.k].closed&&!w.band&&!w.st&&(w.k!=="scratch"||wBleed(w)>.05)}
// wash it: clean water, or better, alcohol. A washed wound won't turn
function washWound(w,item){const h=haveFor(CLEANERS);item=item&&h.some(x=>x[0]===item)?item:h[0]&&h[0][0];if(!item)return null;
  w.cl=1;w.dirt=0;if(w.inf<40)w.inf=Math.max(0,w.inf-25);useUp(item);skillUp("medic",.05);
  const B=body();if(item==="rubbing_alcohol"||item==="whiskey")B.ache=Math.min(60,(B.ache||0)+10);return item}
// wrap it: stops the bleeding and helps it heal. On a broken bone, wrapping binds it still
function wrapWound(w,item){const list=w.k==="fracture"?BINDS:DRESSINGS;const h=haveFor(list);item=item&&h.some(x=>x[0]===item)?item:h[0]&&h[0][0];if(!item)return null;
  if(w.k==="fracture"){w.spl=1;w.splItem=item==="splint"?"splint":"wrap"}
  else{w.band={k:item==="cloth"?"rag":item,q:1,d:0};if(item==="poultice"){w.cl=1;w.dirt=0}}
  invTake(item,1);skillUp("medic",.05);return item}
// an old needle and thread from before still closes a cut
function stitchWound(w,item){if(!(w.k==="cut"||w.k==="deep")||w.st)return null;w.st=1;w.bl*=.1;useUp(item);skillUp("medic",.08);return item}
function takePainkillers(){const pl=S.player;const B=body();if(!invHas("painkillers"))return false;invTake("painkillers",1);B.pk=S.t+6*60;B.ache=0;pl.hp=Math.min(100,pl.hp+4);journal("You take two painkillers. Twenty minutes later the edges soften.");return true}
function takeAntibiotics(){const pl=S.player;const B=body();if(!invHas("antibiotics"))return false;invTake("antibiotics",1);B.abx=S.t+36*60;const bad=infMax();for(const w of B.w)w.inf=0;
  if(pl.sick){pl.sick=0;journal(bad>=40?"You start the antibiotics. By evening the fever's down and the wound looks less angry.":"The antibiotics knock the fever down.","good")}else journal(bad>0?"You start a course of antibiotics. The redness around the wound fades.":"You take the antibiotics. Nothing was infected, so all they'll do is keep it that way for a day or so.");return true}
// wash and wrap everything you can, in the order it matters
function tendAll(){const done=new Map(),miss=new Set();let mins=0;const note=(w,v)=>{if(!done.has(w))done.set(w,[]);done.get(w).push(v)};
  const W=wounds().slice().sort((a,b)=>wSeverity(b)-wSeverity(a)||wBleed(b)-wBleed(a));
  for(const w of W)if(needsWrap(w)&&wBleed(w)>.25){if(wrapWound(w,null)){note(w,"wrapped");mins+=5}else miss.add("wrap")}
  for(const w of W)if(needsWash(w)){if(washWound(w,null)){note(w,"washed");mins+=4}else miss.add("wash")}
  for(const w of W)if(needsWrap(w)){const fr=w.k==="fracture";if(wrapWound(w,null)){note(w,fr?"bound":"wrapped");mins+=fr?10:5}else miss.add(fr?"bind":"wrap")}
  // "washed and wrapped your forehead, and bound your right shin"
  const did=[...done].map(([w,v])=>`${(v.includes("washed")?["washed",...v.filter(x=>x!=="washed")]:v).join(" and ")} your ${w.k==="fracture"?BODY[w.p].n:w.at}`);
  return{did,miss:[...miss],mins}}

// ---------- reading a wound ----------
function bleedWord(b){return b>.6?"Bleeding heavily":b>.25?"Bleeding":b>.03?"Seeping blood":""}
function wSeverity(w){if(w.k==="bite"||w.inf>=40)return 3;const b=wBleed(w);if(b>.3)return 3;if(w.k==="fracture")return w.spl?2:3;if(w.k==="deep")return w.band||w.st?2:3;if(b>.05||needsWrap(w)&&w.k!=="scratch"||needsWash(w)||w.inf>15)return 2;return 1}
function partSeverity(p){let s=0;for(const w of wounds())if(w.p===p)s=Math.max(s,wSeverity(w));return s}
// rough days left to heal if nothing changes
function healEta(w){const K=WOUND[w.k];if(w.inf>=40)return-1;let rate=100/(K.days*24)*feedFactor();if(!K.closed)rate*=w.band||w.st?1.3:.8;if(w.k==="deep"&&!w.band&&!w.st)rate*=.4;
  if(w.k==="fracture"&&!w.spl)return-2;return(100-w.heal)/rate/24}
function woundStatus(w){const L=[];const K=WOUND[w.k];const b=wBleed(w);
  const bw=bleedWord(b);if(bw)L.push(bw);
  if(w.k==="bite")L.push("There's no cure for a bite. Keeping it clean only buys time");
  if(!K.closed){if(w.inf>=55)L.push("Infected. You need antibiotics");else if(w.inf>=25)L.push("Red and angry. It's turning. Antibiotics would stop it");else if(w.inf>=10)L.push("A little pink around the edges");
    L.push(washed(w)?"Washed":"Not washed yet");
    L.push(w.band?`Wrapped${w.band.k==="rag"?" in cloth":w.band.k==="poultice"?" in a poultice":""}`:w.st?"Stitched shut":needsWrap(w)?"Not wrapped":"Doesn't need wrapping")}
  if(w.k==="fracture")L.push(w.cast?"In a cast":w.splItem==="strap"?"Strapped":w.spl?(w.splItem==="splint"?"Splinted":"Wrapped tight"):"Not bound. Wrap it to hold the bone still");
  const eta=healEta(w);L.push(eta===-1?"Not healing while it's infected":eta===-2?"Barely healing until it's bound":w.heal<5&&S.t-w.born<120?"Fresh":eta<1?"Nearly healed":`About ${Math.round(eta)} day${Math.round(eta)===1?"":"s"} to heal`);
  return L}
function bodySummary(){const pl=S.player;const W=wounds();const L=[];const b=bleedTotal();
  if(b>.03)L.push({t:`${bleedWord(b)||"Bleeding"} (about ${Math.max(1,Math.round(b*6))} health an hour)`,k:3});
  if(pl.bitten)L.push({t:"Bitten. No cure",k:3});
  const im=infMax();if(im>=55||pl.sick&&im>=40)L.push({t:"Fever from an infected wound",k:3});else if(pl.sick)L.push({t:"Sick",k:2});else if(im>=25)L.push({t:"A wound is turning",k:2});
  for(const w of W)if(w.k==="fracture")L.push({t:woundName(w)+(w.spl?"":", not bound"),k:w.spl?2:3});
  if(pl.food<15)L.push({t:"Starving",k:3});else if(pl.food<35)L.push({t:"Hungry",k:2});
  if(pl.water<15)L.push({t:"Parched",k:3});else if(pl.water<35)L.push({t:"Thirsty",k:2});
  if(pl.energy<15)L.push({t:"Exhausted",k:3});else if(pl.energy<35)L.push({t:"Tired",k:2});
  if(pl.warmth<15)L.push({t:"Freezing",k:3});else if(pl.warmth<35)L.push({t:"Cold",k:2});
  return L}
// the wound most in need of a wrap right now
function worstBleeder(){let best=null,bb=.03;for(const w of wounds()){if(w.band||w.st)continue;const b=wBleed(w);if(b>bb){bb=b;best=w}}return best}
// which wound a supply would go on, if you just reach for it
function woundFor(k){const W=wounds();const by=f=>W.filter(f).sort((a,b)=>wSeverity(b)-wSeverity(a)||wBleed(b)-wBleed(a))[0]||null;
  if(k==="wrap")return worstBleeder()||by(w=>needsWrap(w)&&w.k!=="fracture");
  if(k==="clean")return by(needsWash);
  if(k==="stitch")return by(w=>(w.k==="deep"||w.k==="cut")&&!w.st&&!w.band);
  if(k==="splint")return by(w=>w.k==="fracture"&&!w.spl);return null}
