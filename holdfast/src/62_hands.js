// ================= telling people (and yourself) what to do =================
// ---------- orders from the person menu ----------
function orderButtons(p){if(p.status!=="member"||p.loc!==S.player.loc||p.away&&p.away.out)return"";const b=(a,t)=>`<button data-act="${a}" data-id="${p.id}">${t}</button>`;
  const bps=S.blds.filter(x=>x.loc===p.loc&&!x.done);
  let h=`<div class="sep">Tell ${esc(p.name)} to</div>`+b("obuild",bps.length?"Build ▸":"Build something ▸")+b("ochop","Cut wood")+b("oguard","Stand watch here")+(layout(p.loc).b.length?b("oboard","Board up the windows")+b("oinside","Get inside and stay there"):"");
  if(S.push)h+=b("opush","Help push the car");if(p.order)h+=b("ostop",`Stop ${esc(orderAct(p))}`);return h}
function homeIdx(k){k=k||S.player.loc;const L=layout(k).b;if(!L.length)return -1;const h=k===campK()?homeBld():null;if(h)return L.indexOf(h);const pl=S.player;let bi=0,bd=1e9;L.forEach((r,i)=>{if(r.barn)return;const d=dist(r.x,r.z,pl.x,pl.z);if(d<bd){bd=d;bi=i}});return bi}
ACTS.obuild=d=>{const p=P(d.id);const bps=S.blds.filter(x=>x.loc===p.loc&&!x.done);const m=$("menu");
  showMenu(`<div class="h">${esc(p.name)} builds<small>${bps.length?"Pick something that's laid out, or start something new.":"Nothing's laid out yet. Pick what, then where."}</small></div>`+
    bps.map(x=>`<button data-act="obuild2" data-id="${p.id}" data-b="${x.id}">The ${esc(x.name.toLowerCase())} <span class="mut">${Math.round(x.prog/BUILDS[x.type].hrs*100)}%</span></button>`).join("")+
    `<button data-act="obuildnew" data-id="${p.id}">Something new ▸</button>`,parseFloat(m.style.left),parseFloat(m.style.top))};
ACTS.obuild2=d=>{closeMenu();const p=P(d.id);orderPerson(p,{k:"build",bid:d.b});renderAll()};
ACTS.obuildnew=d=>{closeMenu();UI.assign=d.id;openBuild()};
ACTS.ochop=d=>{closeMenu();orderPerson(P(d.id),{k:"chop",n:4})};
ACTS.oguard=d=>{closeMenu();const p=P(d.id);const pl=S.player;const c=S.camp&&p.loc===campK()?{x:0,z:4}:{x:pl.x,z:pl.z+2};orderPerson(p,{k:"guard",x:pl.x+.8,z:pl.z+.8,face:Math.atan2(pl.x-c.x,pl.z-c.z)})};
ACTS.oboard=d=>{closeMenu();const p=P(d.id);const bi=homeIdx(p.loc);if(bi<0)return;orderPerson(p,{k:"board",bi,lvl:Math.min(3,1+Math.min(...bldState(p.loc,bi).wins.map(w=>w.board)))})};
ACTS.oinside=d=>{closeMenu();const p=P(d.id);const bi=homeIdx(p.loc);if(bi<0)return;orderPerson(p,{k:"inside",bi,until:S.t+6*HOUR})};
ACTS.opush=d=>{closeMenu();const p=P(d.id);if(!S.push)return;if(p.kid){say(p,"I'm not strong enough.",true);return}p.helpPush=true;say(p,"Coming!",true)};
ACTS.ostop=d=>{closeMenu();const p=P(d.id);if(p.order)p.order.queue=null;endOrder(p,false,pick(["Okay.","Alright, stopping.","Sure."]));renderAll()};
// ---------- things you've laid out to build ----------
function bpMenu(b,cx,cy){const B=BUILDS[b.type];const W_=builders(b).filter(p=>p.id!=="you");const N=bNeed(b);
  const mats=Object.keys(N).length?Object.entries(N).map(([k,n])=>`${RES[k].toLowerCase()} ${Math.min(n,bGot(b,k))}/${n}`).join(", "):"materials in";
  showMenu(`<div class="h">${esc(b.name)}<small>Being built: ${Math.round(b.prog/B.hrs*100)}% · ${mats}${W_.length?` · ${esc(listAnd(W_.map(p=>p.name)))} on it`:" · nobody on it"}</small></div>`+
    `<button data-act="bpwork" data-id="${b.id}">Work on it yourself</button><button data-act="selfbuild" data-id="${b.id}">Build it yourself, hands-on</button><button data-act="bpwho" data-id="${b.id}">Have someone build it ▸</button><button data-act="bpall" data-id="${b.id}">Everyone free, help build it</button><button data-act="bpcancel" data-id="${b.id}">Cancel it</button>`,cx,cy)}
ACTS.bpwork=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);if(!b)return;doMyself({k:"build",bid:b.id});log(`You get to work on the ${b.name.toLowerCase()}.`)};
ACTS.bpwho=d=>{const b=S.blds.find(x=>x.id===d.id);const m=$("menu");const L=members().filter(p=>p.loc===b.loc&&!(p.away&&p.away.out)&&!p.kid);
  showMenu(`<div class="h">Who builds the ${esc(b.name.toLowerCase())}?<small>They'll get the wood and nails, cut what's missing, and see it through.</small></div>`+(L.length?L.map(p=>`<button data-act="bpwho2" data-id="${p.id}" data-b="${b.id}">${esc(p.name)} <span class="mut">${"●".repeat(Math.round(p.sk.build))||"·"}${p.order?` · ${esc(orderAct(p))}`:p.job?` · ${JOBS[p.job].n.toLowerCase()}`:""}</span></button>`).join(""):`<div class="mut" style="padding:4px 8px">There's nobody here who can.</div>`),parseFloat(m.style.left),parseFloat(m.style.top))};
ACTS.bpwho2=d=>{closeMenu();orderPerson(P(d.id),{k:"build",bid:d.b});renderAll()};
ACTS.bpall=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);const L=members().filter(p=>p.loc===b.loc&&!p.kid&&!(p.away&&p.away.out)&&!p.follow&&!(p.order&&p.order.k!=="chop")&&p.hp>=35);
  if(!L.length){toast("Nobody's free.");return}for(const p of L)orderPerson(p,{k:"build",bid:b.id});log(`${listAnd(L.map(p=>p.name))} pitch in on the ${b.name.toLowerCase()}.`)};
ACTS.bpcancel=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);if(!b)return;for(const q of builders(b))endOrder(q,true);for(const [k,n] of Object.entries(b.got||{}))S.res[k]=(S.res[k]||0)+n;
  S.blds.splice(S.blds.indexOf(b),1);S.bv++;drawBld({...b,gone:true});syncInv();log(`You call off the ${b.name.toLowerCase()}${Object.keys(b.got||{}).length?" and put the materials back":""}.`);renderAll()};
// ---------- buildings: the door, the windows, getting in and out ----------
function houseName(k,r){if(k===campK()&&r===homeBld())return"Home";if(r.barn)return"The barn";const n={farm:"Farmhouse",mill:"The mill",church:"The church",scout:"Cabin",motel:"The motel",store:"The store",police:"The station",school:"The school",gas:"The mini-mart"}[LOCS[k].kind];return n||"The building"}
function doorWords(st){const d=st.door==="broken"?"door broken in":st.door==="open"?"door standing open":"door shut";return d+(st.bar?`, barred${st.bar>1?" twice":""}`:"")+(st.furn?", blocked with furniture":"")}
function winWords(st){const n=st.wins.length;if(!n)return"no windows";const bd=st.wins.filter(w=>w.board>0).length,br=st.wins.filter(w=>w.broken&&!w.board).length;return`${bd} of ${n} window${n>1?"s":""} boarded${br?`, ${br} broken`:""}`}
function houseMenu(k,bi,cx,cy){const r=layout(k).b[bi];const st=bldState(k,bi);const pl=S.player;const inside=bldAt(k,pl.x,pl.z)===r;const b=(a,t,s)=>`<button data-act="${a}" data-bi="${bi}">${t}${s?` <span class="mut">${s}</span>`:""}</button>`;
  let h=`<div class="h">${esc(houseName(k,r))}<small>${esc(cap1(doorWords(st)))} · ${esc(winWords(st))}</small></div>`;
  h+=inside?b("hout","Go outside"):b("hin","Go inside");
  if(st.door==="open")h+=b("hshut","Shut the door");else if(st.door==="shut"&&!st.bar&&!st.furn)h+=b("hopen","Prop the door open");
  if(st.door!=="broken"&&st.bar<2)h+=b("hbar","Bar the door","2 wood");
  if(st.door!=="broken")h+=st.furn?b("hunfurn","Move the dresser back from the door"):b("hfurn","Push the dresser against the door");
  if(st.wins.some(w=>w.board<3))h+=b("hboard","Board up the windows",`1 wood each`);
  if(st.door==="broken"||st.dhp<doorMax(st)*.6)h+=b("hfixd","Fix the door","2 wood");if(st.wins.some(w=>w.broken&&!w.board))h+=b("hfixw","Patch the broken windows","1 wood each");
  h+=b("hwho","Have someone else do it ▸");
  const c=layout(k).conts.filter(c=>c.bi===bi);if(c.length)h+=b("hsearch","Search it");
  if(k===campK()&&r===homeBld())h+=b("hstove","Light the stove");else if(k!==campK()&&k!=="start"&&!place(k).burned)h+=b("hburn","Burn it down");
  UI.house={k,bi};showMenu(h,cx,cy)}
const H_ORD={hbar:"bar",hfurn:"furn",hunfurn:"unfurn",hboard:"board",hfixd:"fixdoor",hfixw:"fixwin"};
for(const [a,kind] of Object.entries(H_ORD))ACTS[a]=d=>{closeMenu();const bi=+d.bi;const o={k:kind,bi};if(kind==="board")o.lvl=Math.min(3,1+Math.min(...bldState(S.player.loc,bi).wins.map(w=>w.board)));doMyself(o);
  log({bar:"You go to bar the door.",furn:"You go to push the dresser against the door.",unfurn:"You go to move the dresser back.",board:"You start boarding up the windows.",fixdoor:"You go to fix the door.",fixwin:"You go to patch the broken windows."}[kind])};
ACTS.hshut=d=>{closeMenu();doMyself({k:"door",bi:+d.bi,to:"shut"})};ACTS.hopen=d=>{closeMenu();doMyself({k:"door",bi:+d.bi,to:"open"})};
ACTS.hin=d=>{closeMenu();const r=layout(S.player.loc).b[+d.bi];goInside(r.barn?"barn":"house",false)};ACTS.hout=()=>{closeMenu();goOutside()};
ACTS.hsearch=d=>{closeMenu();const c=layout(S.player.loc).conts.filter(c=>c.bi===+d.bi).sort((a,b)=>dist(a.x,a.z,S.player.x,S.player.z)-dist(b.x,b.z,S.player.x,S.player.z))[0];if(c)approach(c,()=>openLoot(c))};
ACTS.hstove=()=>{closeMenu();lightFire()};ACTS.hburn=()=>{closeMenu();askBurn()};
ACTS.hwho=d=>{const bi=+d.bi;const k=S.player.loc;const st=bldState(k,bi);const m=$("menu");const L=members().filter(p=>p.loc===k&&!(p.away&&p.away.out)&&!p.kid);
  const jobs=[["board","board up the windows"],...(st.bar<2&&st.door!=="broken"?[["bar","bar the door"]]:[]),...(st.door==="broken"||st.dhp<doorMax(st)*.6?[["fixdoor","fix the door"]]:[]),...(st.wins.some(w=>w.broken&&!w.board)?[["fixwin","patch the windows"]]:[]),...(!st.furn&&st.door!=="broken"?[["furn","block the door with furniture"]]:[])];
  showMenu(`<div class="h">Who, and what?</div>`+(L.length?L.flatMap(p=>jobs.slice(0,2).map(([j,t])=>`<button data-act="hwho2" data-id="${p.id}" data-j="${j}" data-bi="${bi}">${esc(p.name)}: ${t}</button>`)).join(""):`<div class="mut" style="padding:4px 8px">There's nobody here who can.</div>`),parseFloat(m.style.left),parseFloat(m.style.top))};
ACTS.hwho2=d=>{closeMenu();const bi=+d.bi;const o={k:d.j,bi};if(d.j==="board")o.lvl=Math.min(3,1+Math.min(...bldState(S.player.loc,bi).wins.map(w=>w.board)));orderPerson(P(d.id),o)};
// ---------- cars: search one, or put it in neutral and push it ----------
function carMenu(k,c,cx,cy){const car=carOf(k,c);UI.car={k,cid:c.id,ci:c.car};const st=place(k).conts[c.id];const n=withYou().filter(p=>!p.kid).length;
  showMenu(`<div class="h">${c.k==="cruiser"?"State trooper's cruiser":"A car"}<small>${st&&st.rolled?st.c.items.length?"Something's still inside.":"Searched.":"Not searched yet."} Doors locked or not, it'll roll in neutral.</small></div>`+
    `<button data-act="csearch">Search it</button><button data-act="cpush">Push it (in neutral) ▸ <span class="mut">${n?`you and ${n} other${n>1?"s":""}`:"alone: slow"}</span></button>`,cx,cy)}
ACTS.csearch=()=>{closeMenu();const c=layout(UI.car.k).conts.find(x=>x.id===UI.car.cid);if(c)approach(c,()=>openLoot(c))};
ACTS.cpush=()=>{closeMenu();const k=UI.car.k;const c=carsAt(k)[UI.car.ci];UI.pushPick={ci:UI.car.ci,x:c.x,z:c.z,rot:c.rot,ok:false};pushGhost();
  const p=$("place");p.style.display="block";p.innerHTML=`Where should it go? Move the mouse to place the car · R turns it · click to push it there · Esc cancels<br><span class="mut">Line cars up end to end with walls and buildings to close off the yard.</span>`};
function pushGhost(){const P_=UI.pushPick;if(!P_)return;const k=S.player.loc;const c=carsAt(k)[P_.ci];const far=dist(c.x,c.z,P_.x,P_.z)>16;const chk=far?{ok:false}:pushCheck(k,P_.ci,P_.x,P_.z,P_.rot);P_.ok=chk.ok;P_.far=far;
  if(typeof carGhost==="function")carGhost(P_.x,P_.z,P_.rot,P_.ok,c)}
function cancelPushPick(){UI.pushPick=null;if(typeof carGhost==="function")carGhost(null);$("place").style.display="none"}
function tryPushPick(){const P_=UI.pushPick;if(!P_)return;if(P_.far){toast("That's too far to push it. Pick somewhere closer.");return}if(!P_.ok){toast("Something's in the way of that.");return}
  const ci=P_.ci;cancelPushPick();if(!startPush(ci,P_.x,P_.z,P_.rot)){toast("It won't go there.");return}const n=pushers().length-1;
  log(n?`You put the car in neutral. ${listAnd(pushers().slice(1).map(p=>p.name))} get${n>1?"":"s"} behind it with you.`:"You put the car in neutral and lean on it. It barely moves for one person. Bring people with you (Come with me) and it goes much faster.");W.free=false}
// ---------- the yard: can the dead get in? ----------
function showPerimeter(auto){const k=S.player.loc;if(k!==campK()){if(!auto)toast("This only makes sense at camp.");return}const r=perimeter(k);if(!r)return;
  if(typeof perimLine==="function")perimLine(r.sealed?null:r.path,r.sealed);
  if(r.sealed){toast("The yard is sealed: the dead can't walk up to your door. People climb over the walls, or use a gate.",6000);if(!S.flags.sealedOnce){S.flags.sealedOnce=true;log("The yard is closed off. The dead can't walk up to your door anymore. Your people climb over, or go through a gate.","good")}}
  else toast(auto?"There's still a way in. The red line shows how the dead would walk up to your door.":"Not sealed yet. The red line shows how the dead would walk up to your door.",6000)}
// ---------- animals ----------
function animalMenu(a,cx,cy){const T=ANIMALS[a.k];const pl=S.player;const b=(x,t)=>`<button data-act="${x}" data-id="${a.id}">${t}</button>`;UI.animal=a.id;
  if(a.dead){showMenu(`<div class="h">The ${T.n}<small>Dead. About ${T.food} food once it's butchered.</small></div>`+b("abutcher","Butcher it")+members().filter(p=>p.loc===pl.loc&&!p.kid&&!(p.away&&p.away.out)).slice(0,4).map(p=>`<button data-act="abutcher2" data-id="${a.id}" data-p="${p.id}">Have ${esc(p.name)} butcher it</button>`).join(""),cx,cy);return}
  const d=dist(pl.x,pl.z,a.x,a.z);
  showMenu(`<div class="h">A ${T.n}<small>${a.flee?"Running.":"Grazing."} ${Math.round(d)} paces off. Worth ${T.food} food.${pl.sneak?" You're moving quietly.":""}</small></div>`+
    (pl.gun?b("agun",`Shoot it with the ${ITEMS[pl.gun]} <span class="mut">loud: the dead will hear</span>`):"")+(haveBow()?b("abow","Shoot it with the bow <span class=\"mut\">silent</span>"):"")+
    (!pl.gun&&!haveBow()?`<div class="mut" style="padding:4px 8px;font-size:12.5px">You've nothing to hunt with. A bow (sheds, sometimes) or a gun would do it.</div>`:"")+b("asneak",pl.sneak?"Stop sneaking":"Sneak (move slowly, get closer)"),cx,cy)}
ACTS.agun=d=>{closeMenu();huntAnimal(S.animals.find(a=>a.id===d.id),"gun")};ACTS.abow=d=>{closeMenu();huntAnimal(S.animals.find(a=>a.id===d.id),"bow")};
ACTS.asneak=()=>{closeMenu();S.player.sneak=!S.player.sneak;toast(S.player.sneak?"Sneaking: you move slowly and quietly. Animals let you get closer.":"Walking normally.")};
ACTS.abutcher=d=>{closeMenu();doMyself({k:"butcher",aid:d.id})};ACTS.abutcher2=d=>{closeMenu();orderPerson(P(d.p),{k:"butcher",aid:d.id})};
// ---------- when one of them has you ----------
// The sim stops. Shove it off (mash the button or Space) before it pulls you in; then finish it, shoot it, or run.
function grabEl(){let e=$("grab");if(!e){e=document.createElement("div");e.id="grab";$("app").appendChild(e)}return e}
function startStruggle(w,mine){const pl=S.player;if(UI.grab)return;pl.grabbed=true;w.grab=true;pl.tx=null;pl.tz=null;pl.path=null;pl.onArrive=null;if(pl.order){pl.order.queue=null;endOrder(pl,true)}
  UI.grab={w:w.id,m:mine?55:22,phase:"shove",mine:!!mine,last:performance.now(),hurt:0};W.kick=.35;if(typeof sfx==="function"){sfx("grab",w.x,w.z);sfx("moan",w.x,w.z)}
  if(!mine)log("One of the dead gets its hands on you!","bad");renderGrab()}
function weaponName(){const w=["bat","pipe","knife","shovel","hammer"].find(k=>itemCount(k)>0||gCount(S.haul,k)>0);const c=S.crafted.find(c=>c.use==="weapon");return c?c.n.toLowerCase():w?ITEMS[w]:null}
function renderGrab(){const G=UI.grab;const e=grabEl();if(!G){e.className="";e.innerHTML="";return}const pl=S.player;const wn=weaponName();e.className="open";
  if(G.phase==="shove")e.innerHTML=`<div class="card"><h2>${G.mine?"You go at it":"One of them has you!"}</h2><p>${G.mine?"It turns on you faster than you expected. Get it off balance.":"Its hands are on your jacket and its teeth are coming in. Shove it off!"}</p>
    <div class="gm"><i id="gmeter" style="width:${G.m}%"></i></div><button class="opt pri" data-act="gshove">Shove it off<small>Click fast, or hammer the space bar</small></button><p class="mut" style="font-size:12px">You: ${Math.round(pl.hp)}%</p></div>`;
  else e.innerHTML=`<div class="card"><h2>It's off you</h2><p>It staggers back, still reaching. You have a second.</p>
    <button class="opt pri" data-act="gfinish">Finish it${wn?` with the ${esc(wn)}`:" with your hands"}<small>${wn?"Good odds.":"Bad odds without a weapon."}</small></button>
    ${pl.gun&&((pl.rounds||0)>0||loadUp()>0)?`<button class="opt" data-act="gshoot">Shoot it<small>A sure thing, and every one of the dead nearby will hear it.</small></button>`:""}
    <button class="opt" data-act="grun">Run<small>Get clear. It's still out there.</small></button></div>`}
ACTS.gshove=()=>{const G=UI.grab;if(!G||G.phase!=="shove")return;G.m=Math.min(100,G.m+11);if(typeof sfx==="function"&&rf()<.5)sfx("struggle",S.player.x,S.player.z);if(G.m>=100){G.phase="free";renderGrab()}else{const m=$("gmeter");if(m)m.style.width=G.m+"%"}};
function grabFrame(dt){const G=UI.grab;if(!G)return;if(G.phase!=="shove")return;G.m-=dt*(G.mine?14:19);const m=$("gmeter");if(m)m.style.width=Math.max(0,G.m)+"%";
  if(G.m<=0){const pl=S.player;const dmg=ri(12,22);pl.hp=Math.max(0,pl.hp-dmg);W.kick=.4;G.hurt++;if(typeof sfx==="function")sfx("struggle",pl.x,pl.z);
    if(pl.hp<=0){endStruggle(false);knockOut();return}G.m=30;toast(`It's on you! (${Math.round(pl.hp)}%)`)}}
function grabWalker(){const G=UI.grab;return G&&S.walkers.find(w=>w.id===G.w)}
ACTS.gfinish=()=>{const w=grabWalker();if(!w){endStruggle(false);return}const pl=S.player;const p=clamp((weaponName()?.68:.32)+(pl.hp>60?.06:0)+(UI.grab.mine?.06:0),.2,.88);
  if(rf()<p){putDown(w);log(pick(["You put it down. Your hands won't stop shaking.","It goes down and stays down. You stand there breathing for a long moment.","You finish it. It's over. It's over."]),"good");endStruggle(true);return}
  const pl_=S.player;pl_.hp=Math.max(0,pl_.hp-ri(8,16));W.kick=.4;if(pl_.hp<=0){endStruggle(false);knockOut();return}UI.grab.phase="shove";UI.grab.m=25;toast("You miss, and it's on you again!");renderGrab()};
ACTS.gshoot=()=>{const w=grabWalker();const pl=S.player;if(!w){endStruggle(false);return}if((pl.rounds||0)<=0&&!loadUp()){toast("Empty!");return}pl.rounds--;gunNoise(pl,w);putDown(w);log("Point blank. It drops.","good");endStruggle(true)};
ACTS.grun=()=>{const w=grabWalker();const pl=S.player;if(w){w.stun=S.t+3;const a=Math.atan2(pl.x-w.x,pl.z-w.z);endStruggle(false);moveTo(pl,pl.x+Math.sin(a)*7,pl.z+Math.cos(a)*7);log("You break away and run.","warn");return}endStruggle(false)};
function endStruggle(won){const G=UI.grab;if(!G)return;const w=S.walkers.find(x=>x.id===G.w);if(w){w.grab=false;w.cool=4;if(!won)w.stun=Math.max(w.stun||0,S.t+2)}S.player.grabbed=false;UI.grab=null;renderGrab();renderAll()}
// ---------- sound ----------
// Everything is made on the fly with WebAudio: no files. Quiet by default, N mutes it.
const SFX={ctx:null,on:true,noise:null,last:{}};
try{SFX.on=localStorage.getItem("holdfast.sound")!=="off"}catch(e){}
function sfxInit(){if(SFX.ctx||!SFX.on)return;try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;SFX.ctx=new C();const n=SFX.ctx.createBuffer(1,SFX.ctx.sampleRate,SFX.ctx.sampleRate);const d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;SFX.noise=n;
  SFX.out=SFX.ctx.createGain();SFX.out.gain.value=.5;SFX.out.connect(SFX.ctx.destination)}catch(e){SFX.ctx=null}}
function sfxToggle(){SFX.on=!SFX.on;try{localStorage.setItem("holdfast.sound",SFX.on?"on":"off")}catch(e){}if(SFX.on)sfxInit();else if(SFX.ctx){SFX.ctx.close();SFX.ctx=null}toast(SFX.on?"Sound on.":"Sound off.");renderHud()}
function sfx(kind,x,z){if(!SFX.on||!SFX.ctx||!S)return;const A=SFX.ctx;const now=A.currentTime;if(SFX.last[kind]&&now-SFX.last[kind]<.08)return;SFX.last[kind]=now;
  let vol=1;if(x!=null&&W.ok){const d=dist(x,z,W.tgt.x,W.tgt.z);vol=clamp(1.2-d/28,0,1);if(vol<=.02)return}
  const g=A.createGain();g.connect(SFX.out);const env=(a,peak,dec)=>{g.gain.setValueAtTime(0,now);g.gain.linearRampToValueAtTime(peak*vol,now+a);g.gain.exponentialRampToValueAtTime(.0005,now+a+dec)};
  const nz=(f,q,type,dur)=>{const s=A.createBufferSource();s.buffer=SFX.noise;const b=A.createBiquadFilter();b.type=type||"bandpass";b.frequency.value=f;b.Q.value=q||1;s.connect(b);b.connect(g);s.start(now);s.stop(now+(dur||.5));return b};
  const osc=(type,f0,f1,dur)=>{const o=A.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,now);if(f1)o.frequency.exponentialRampToValueAtTime(f1,now+dur);o.connect(g);o.start(now);o.stop(now+dur+.05);return o};
  switch(kind){
    case"chop":env(.003,.5,.12);nz(900,2.5,"bandpass",.15);osc("sine",140,70,.1);break;
    case"hammer":env(.002,.35,.07);nz(2600,4,"bandpass",.08);osc("square",420,300,.05);break;
    case"fall":env(.05,.45,1.4);nz(300,.7,"lowpass",1.5);osc("sine",60,35,1.2);break;
    case"drop":env(.004,.4,.18);nz(260,1,"lowpass",.2);break;
    case"thud":case"bang":env(.004,.7,.3);nz(150,1,"lowpass",.35);osc("sine",90,45,.25);break;
    case"crash":env(.005,.9,.9);nz(400,.5,"lowpass",1);osc("sawtooth",80,30,.6);break;
    case"glass":env(.002,.5,.5);nz(4200,3,"highpass",.5);osc("triangle",2400,1800,.3);break;
    case"moan":{env(.25,.32,1.3);const o=osc("sawtooth",95+Math.random()*30,60,1.5);const lf=A.createOscillator();lf.frequency.value=5;const lg=A.createGain();lg.gain.value=6;lf.connect(lg);lg.connect(o.frequency);lf.start(now);lf.stop(now+1.6);
      const b=A.createBiquadFilter();b.type="lowpass";b.frequency.value=520;o.disconnect();o.connect(b);b.connect(g);break}
    case"struggle":case"grab":env(.01,.55,.4);nz(600,1.2,"bandpass",.45);{const o=osc("sawtooth",70,55,.4);const b=A.createBiquadFilter();b.type="lowpass";b.frequency.value=300;o.disconnect();o.connect(b);b.connect(g)}break;
    case"alarm":{g.gain.setValueAtTime(.18*vol,now);g.gain.setValueAtTime(.18*vol,now+3.6);g.gain.linearRampToValueAtTime(0,now+3.8);const o=A.createOscillator();o.type="square";for(let i=0;i<8;i++){o.frequency.setValueAtTime(i%2?700:950,now+i*.45)}o.connect(g);o.start(now);o.stop(now+3.8);break}
    case"roll":env(.1,.22,.8);nz(120,.8,"lowpass",.9);break;
    case"creak":env(.05,.2,.5);osc("square",180,320,.45);break;
    case"bow":env(.002,.35,.25);osc("triangle",220,110,.2);break;
    case"shot":env(.002,1,.5);nz(1200,.4,"lowpass",.55);osc("sine",110,40,.3);break;
    case"heart":env(.01,.5,.16);osc("sine",58,40,.14);break;
    case"scrape":env(.05,.25,.5);nz(700,1.5,"bandpass",.55);break}}
// the heart thumps while one of them is coming for you
let HEART=0;function heartFrame(dt){if(!S||!S.flags.heart||!SFX.ctx)return;HEART-=dt;if(HEART<=0){HEART=.75;sfx("heart");setTimeout(()=>{SFX.last.heart=0;sfx("heart")},170)}}
// ---------- what you're doing right now ----------
function myTask(){const pl=S.player;if(S.push)return S.push.go?"Pushing the car":"Getting behind the car";if(pl.order)return cap1(orderAct(pl));return""}
ACTS.snd=()=>sfxToggle();ACTS.perim=()=>{closeAll();showPerimeter()};
