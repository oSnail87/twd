// ================= the long sleep: waking in Limon Hospital a week after it began =================
// You were already in a coma on the ward when the outbreak started. The town lives its first week without you:
// the same hours run as in any game, only faster and with you lying still. Then you wake on day 8, alone,
// behind a door your nurse locked from the hall.

const COMA_CAUSES={
  crash:{n:"A truck crash",sub:"Highway 9, in the rain",since:"the truck crash out on Highway 9",
    how:"The last thing you remember is rain on the windshield on Highway 9, and a grain truck drifting over the center line.",
    body:"Your left arm is in a cast from wrist to elbow. There are stitches in your scalp and a dressing taped over your side.",
    hurt:[["fracture","larm",{at:"forearm",cast:1,heal:72}],["incision","belly",{at:"side",heal:82,band:1}],["cut","head",{at:"scalp",st:1,heal:90}]]},
  fall:{n:"A fall",sub:"Off a roof, cleaning the gutters",since:"the fall from a roof on Elm Street",
    how:"The last thing you remember is the ladder sliding on wet shingles, and the gutter coming away in your hand.",
    body:"Your ribs are strapped tight and every breath catches on them. There are stitches in your scalp.",
    hurt:[["fracture","chest",{strap:1,heal:74}],["cut","head",{at:"scalp",st:1,heal:88}],["bruise","rleg",{heal:80}]]},
  surgery:{n:"Surgery that went wrong",sub:"A reaction to the anesthetic",since:"the surgery that went wrong",
    how:"It was supposed to be routine. The last thing you remember is counting backward from ten and never reaching seven.",
    body:"There's a long dressing taped over your stomach, and under it, a line of stitches.",
    hurt:[["incision","belly",{at:"stomach",heal:66,band:1}]]},
  car:{n:"Hit by a car",sub:"Crossing Main Street at night",since:"the hit-and-run on Main Street",
    how:"The last thing you remember is headlights on Main Street, after dark. Whoever it was never stopped.",
    body:"Your right leg is in a cast from the knee down, and there's a stitched cut along your right forearm.",
    hurt:[["fracture","rleg",{at:"shin",cast:1,heal:76}],["cut","rarm",{at:"forearm",st:1,heal:86}]]}};

// what's left of the old injuries when you wake: weeks of hospital care, partly healed
function comaHurt(cause){const C=COMA_CAUSES[cause]||COMA_CAUSES.crash;const B=body();B.w=[];
  for(const [k,p,o] of C.hurt){const w=addWound(k,p,{at:o.at,heal:o.heal,why:"before"});w.sev=.9;w.bl=0;w.dirt=0;w.cl=1;w.inf=0;w.born=S.t-DAY*28;
    if(o.st||k==="incision")w.st=.9;
    if(o.cast){w.spl=1;w.cast=true;w.splItem="cast"}
    if(o.strap){w.spl=.85;w.splItem="strap"}
    if(o.band)w.band={k:"bandage",q:.9,d:.5}}
  B.ache=22;B.pk=0;B.abx=0;S.player.bleeding=0}

// ---------- the week you sleep through ----------
const SLEEP_DAYS=["Day one. A patient at the hospital attacks a nurse, and the nurse gets back up. By dark the power is out across town.",
  "Day two. A helicopter passes over Limon without slowing down. That afternoon the taps run dry.",
  "Day three. The radio says there's an evacuation center at Ashby. Some families pack their cars.",
  "Day four. People stop going out alone. Neighbors who never spoke start sharing walls.",
  "Day five. The radio goes to static. Ashby isn't answering anymore.",
  "Day six. There are more of the dead on Main Street than the living.",
  "Day seven. The hospital has been quiet for days. In a room at the end of the ward, behind a locked door, you're still breathing."];
const WAKE_AT=DAY*7+7*60+30;
// runs the town's hours in slices so the page stays responsive; step(fraction) after each slice, done() at the end
function sleepThrough(step,done){const t0=S.t,span=Math.max(1,WAKE_AT-t0);
  const slice=()=>{if(!S||!S.player.coma)return;const end=performance.now()+30;
    try{while(S.t<WAKE_AT-1e-6&&performance.now()<end)advance(Math.min(60,WAKE_AT-S.t))}catch(e){console.error(e);S.t=WAKE_AT}
    step(clamp((S.t-t0)/span,0,1));if(S.t<WAKE_AT-1e-6)setTimeout(slice,0);else done()};
  setTimeout(slice,60)}

// ---------- opening your eyes ----------
function comaWake(){const pl=S.player;const F=S.flags;const b=BMAP.clinic;
  const ri=Math.max(0,b.rooms.findIndex(r=>r.t==="patient")),wr=Math.max(0,b.rooms.findIndex(r=>r.t==="waiting"));
  pl.coma=false;F.wake=S.t;S.pending=[];for(const p of S.people)p.want=null; // nobody could ask you for anything while you slept
  // beside the bed, with your things at its foot
  const bed=b.beds.find(x=>x.room===ri)||b.beds[0]||insidePos(b,ri);const spots=[];
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r=1.05+(i%2)*.3;const x=bed.x+Math.cos(a)*r,z=bed.z+Math.sin(a)*r;if(free(x,z,.3,"pl")&&roomAt(x,z)?.b===b&&roomAt(x,z).ri===ri)spots.push({x,z})}
  const me=spots[0]||insidePos(b,ri);pl.x=me.x;pl.z=me.z;
  const at=spots.slice(1).sort((p,q)=>dist(q.x,q.z,me.x,me.z)-dist(p.x,p.z,me.x,me.z))[0]||{x:me.x+.4,z:me.z};
  // the door to the waiting room, shut the way she left it
  doorsIn();const D=b.doors.find(d=>!d.ext&&d.dw.r.includes(ri));if(D){D.open=false;D.lock=null;D.bar=0;D.hp=100;D.broken=false;doorSave(D)}
  // nothing dead in the ward but the one she warned you about
  S.zeds=S.zeds.filter(z=>dist(z.x,z.z,b.x,b.z)>16);S.rise=(S.rise||[]).filter(r=>{const p=P(r.id);return!p||dist(p.x,p.z,b.x,b.z)>16});
  for(const p of S.people)if(p.alive&&bldAt(p.x,p.z)===b){const o=doorOut(b);p.x=o.x+rnd(-3,3);p.z=o.z+rnd(3,6);p.tx=p.x;p.tz=p.z;p.path=null}
  // a week on, most of the dead that mobbed the hospital have drifted off after other noise; a few still wander the streets between you and home
  const hb=BMAP[pl.home],bo=doorOut(b),ho=hb?doorOut(hb):bo;const vx=ho.x-bo.x,vz=ho.z-bo.z,vv=vx*vx+vz*vz||1;
  const way=(x,z)=>{const t=clamp(((x-bo.x)*vx+(z-bo.z)*vz)/vv,0,1);return dist(x,z,bo.x+t*vx,bo.z+t*vz)};
  const away=()=>{for(let i=0;i<12;i++){const p=randIn(pick(["woods","woods","hills","fields"]));if(dist(p.x,p.z,b.x,b.z)>60&&dist(p.x,p.z,ho.x,ho.z)>45)return p}return randIn("woods")};
  let onWay=0;for(const z of S.zeds){const d=dist(z.x,z.z,b.x,b.z),w=way(z.x,z.z);
    if(d>=24&&(w>=9?d>=45||rf()<.3:onWay<2&&rf()<.3)){if(w<9)onWay++;continue}
    const p=away();Object.assign(z,{x:p.x,z:p.z,tx:p.x,tz:p.z,r:regionAt(p.x,p.z),st:"idle"})}
  const wp=insidePos(b,wr);const z=spawnZed(wp.x,wp.z,{hp:8});if(z)z.weak=1;
  // you
  Object.assign(pl,{hp:58,food:28,water:22,energy:38,warmth:70,sick:0,bitten:null,bleeding:0});comaHurt(pl.comaCause);
  const g=mkInst("belongings");for(const [id,n] of [["water_bottle",1],["snacks",2],["photo",1],["bandage",1]])cAdd(g.c,id,n);
  const pile={id:"pile"+(S.nextU++),x:at.x,z:at.z,c:{g:[6,6],items:[]},t:S.t,n:"Your things"};S.piles.push(pile);
  for(const it of [g,mkInst(pl.age>40?"flannel":"hoodie"),mkInst("jeans"),mkInst("sneakers"),mkInst("iv_pole")]){const pos=cFind(pile.c,it);if(pos)cPut(pile.c,it,pos.x,pos.y,pos.r)}
  // what happened to the people you live with, as far as a note on the kitchen table can say
  F.homeNote=homeNoteFor();
  // a clean slate: you slept through all of it
  S.journal=S.journal.filter(j=>/^Before all this/.test(j.x));
  const fam=Object.keys(pl.fam).map(P).filter(Boolean);
  journal(`Day 8. You woke up in a locked room at ${b.n}. The last thing you remember is ${COMA_CAUSES[pl.comaCause].since}. A week has gone by since the dead started walking, and you slept through all of it.${fam.length?` You don't know where ${fam.map(q=>(famWord(q)+" "+q.name).trim()).join(" and ")} ${fam.length>1?"are":"is"}. Home is ${BMAP[pl.home].n}.`:""}`,"big");
  UI.modal={type:"wake",then:"help"}}
// whoever lived with you leaves word at home, if they could
function homeNoteFor(){const pl=S.player;const ids=Object.keys(pl.fam);if(!ids.length)return null;const q=P(ids[0]);if(!q||!q.alive&&q.status!=="left")return null;const me=pl.name.split(" ")[0];
  const grp=p=>{const g=p&&p.alive&&p.group?G(p.group):null;return g&&g.home?g:null};const at=g=>g.name===PLACES[g.home].n?"the people at "+g.name:g.name+" at "+PLACES[g.home].n;
  const N=(who,text)=>({who,title:"A note on the kitchen table",pid:q.id,read:0,text});
  // a kid: the neighbors who took them in write, or the kid does, in capitals
  if(q.age<13){const g=grp(q);const c=q.carer&&P(q.carer);
    if(c&&c.alive&&grp(c)===g)return N(`${c.name} ${c.sur}`,`${me},\n\nIt's ${c.name} ${c.sur} from down the street. ${q.name} is with us, and safe. Asks about you every night.\n\n${g?`We've gone to ${PLACES[g.home].n}${g.name===PLACES[g.home].n?"":" with "+g.name}. It's safer there, with more people. Come and find us.`:`We're still at our house. Knock three times so we know it's you.`}\n\nWe tried to get to the hospital the first night. We couldn't get near it.\n\n${c.name}`);
    return N(q.name,(g?`${me.toUpperCase()}\n\nI'M WITH ${at(g).toUpperCase()}. THEY HAVE FOOD AND A FIRE. COME GET ME. PLEASE.\n\n`:`${me.toUpperCase()}\n\nI'M OK. I'M HIDING LIKE YOU SAID TO. COME HOME.\n\n`)+q.name.toUpperCase())}
  if(q.status==="left")return N(q.name,`${me},\n\nThe radio says there's an evacuation center at Ashby, forty miles north, with soldiers and doctors. I'm going. I'll tell them about you. I'll make them send someone to the hospital.\n\nIf you read this, I was wrong about something. Come north if you can.\n\n${q.name}`);
  const g=grp(q);
  if(g)return N(q.name,`${me},\n\nI went to the hospital the first day. The doors were full of them. I couldn't get to you. I'm sorry. I'm so sorry.\n\nI'm with ${at(g)}. It's safer there, with more people. If you ever read this, come to ${PLACES[g.home].n}. I'll be there. I check every day.\n\n${q.name}`);
  return N(q.name,`${me},\n\nI'm still here. I go out for water and food and I always come back before dark. If you get home and I'm not here, wait. Lock the door. Don't open it for anyone who doesn't say your name.\n\n${q.name}`)}
// what you'd call the people you live with
function famWord(q){const r=S.player.fam[q.id]||"";const F=q.sex==="F";
  return r==="partner"?"your partner":/sibling/.test(r)?(F?"your sister":"your brother"):r==="kid"||r==="son"?(F?"your daughter":"your son"):r==="mom or dad"?(F?"your mom":"your dad"):r==="roommate"?"your roommate":""}
function wakeHtml(){const pl=S.player;const C=COMA_CAUSES[pl.comaCause]||COMA_CAUSES.crash;const me=esc(pl.name.split(" ")[0]);
  return `<h2>Awake</h2>
  <p>You come up slowly, like surfacing through cold water. A ceiling tile with a brown water stain. Blinds half drawn, gray light behind them. Your mouth is so dry it hurts to close it.</p>
  <p>The bag on the IV stand beside you is empty, and the line taped to your arm has gone dark. Nothing beeps. Nothing hums. No carts, no phones, no voices in the hall. Whatever this is, it isn't how a hospital sounds.</p>
  <p>${esc(C.how)} ${esc(C.body)}</p>
  <p>On the whiteboard across from the bed, in blue marker: <span class="mono">YOUR NURSE TODAY: MARISOL</span>. Someone has taped a folded sheet of paper under it, with your name on the outside.</p>
  <div class="hnote"><p>${me}, if you're reading this, you woke up. I always said you would.</p>
  <p>Something happened while you were under. People got sick, and the sick ones died, and then they got up again and went after everyone else. I know how that sounds. Don't let them near you. A bite kills you, slowly.</p>
  <p>They got into the ward. I couldn't move you on my own, so I locked your door from the hall to keep them out. The latch turns from your side.</p>
  <p>There's one of them in the waiting room. Maybe more by now. Your things are in the bag by the bed, and there's water in it. Small sips first.</p>
  <p>I'm sorry I left you. M.</p></div>
  <div class="row"><button class="btn pri" data-act="wakeup">Sit up</button></div>`}

// ---------- what you know about people you haven't seen since you woke ----------
// in a coma start the town changed without you; the people screen only shows what you've seen or heard since
function pKnown(p){const F=S.flags;if(!F.wake||!p)return true;
  return(p.pseen||0)>=F.wake||(p.pknown||0)>=F.wake||isFollower(p)||S.news.some(n=>n.t>=F.wake&&n.a&&n.a.includes(p.id))}
function seeAround(){const F=S.flags;const pl=S.player;if(pl.coma)return;const inB=bldAt(pl.x,pl.z);
  for(const p of S.people){if(!p.alive||Math.abs(p.x-pl.x)>16||Math.abs(p.z-pl.z)>16)continue;if(dist(p.x,p.z,pl.x,pl.z)<16&&(bldAt(p.x,p.z)===inB||losClear(p.x,p.z,pl.x,pl.z)))p.pseen=S.t}
  if(!F.wake)return;
  for(const z of S.zeds){if(!z.pid||z.pid==="you"||Math.abs(z.x-pl.x)>10||Math.abs(z.z-pl.z)>10)continue;const p=P(z.pid);if(p&&p.met&&dist(z.x,z.z,pl.x,pl.z)<10&&losClear(z.x,z.z,pl.x,pl.z))p.pseen=S.t}}
