// ================= the screen =================
const UI={side:null,talkTo:null,menu:null,modal:null,place:null,loot:null,paused:false,speed:1,hover:null,drag:null,tickerN:0};
const $=id=>document.getElementById(id);
function toast(x,ms){const t=$("toast");if(!t)return;t.textContent=x;t.style.display="block";clearTimeout(UI.tt);UI.tt=setTimeout(()=>t.style.display="none",ms||2600)}
function onLog(x,k){renderTicker()}
function renderTicker(){const el=$("ticker");if(!el||!S)return;const L=S.log.slice(-5);el.innerHTML=L.map((l,i)=>`<div class="${i<L.length-2?"old ":""}${l.k==="bad"?"bad":l.k==="warn"?"warn":l.k==="good"?"good":l.k==="hint"?"mut":l.k==="talk"?"talk":""}">${l.k==="big"?"<b>":""}${esc(l.x)}${l.k==="big"?"</b>":""}</div>`).join("")}
// only touch the page when something changed, so buttons aren't swapped out from under a click
function setHtml(el,h){if(el&&el._h!==h){el.innerHTML=h;el._h=h}}
function renderHud(){if(!S)return;const pl=S.player;const L=LOCS[pl.loc]||{n:"On the road"};const h=hourOf(S.t);
  const ck=$("clock");if(!$("ctime"))ck.innerHTML=`<div class="t" id="ctime"></div><div class="w" id="cwhere"></div><div class="sp" id="cspeed"></div>`;
  setHtml($("ctime"),`Day ${dayOf(S.t)} · ${clockStr(S.t)}`);setHtml($("cwhere"),`${esc(L.n)}${pl.loc===campK()?" · camp":""}${h>=21||h<5?" · night":""}`);
  setHtml($("cspeed"),[[0,"❚❚"],[1,"1×"],[3,"3×"],[8,"8×"]].map(([v,l])=>`<button data-sp="${v}" class="${(UI.paused?0:UI.speed)===v?"on":""}">${l}</button>`).join(""));
  const n=campSize();const food=S.res.food/Math.max(1,n);
  setHtml($("res"),S.camp?[["People",`${n}`],["Beds",`${bedsTotal()}`,bedsTotal()<n?"bad":""],["Food",`${Math.floor(S.res.food)} <span class="mut">(${food.toFixed(1)}d)</span>`,food<1.5?"bad":food<3?"warn":""],["Water",Math.floor(S.res.water),S.res.water<n?"bad":""],
      ["Wood",Math.floor(S.res.wood)],["Scrap",Math.floor(S.res.scrap)],["Medicine",Math.floor(S.res.meds)],["Ammo",Math.floor(S.res.ammo)],["Defense",defense()],["Mood",avgMood(),avgMood()<35?"bad":""],["You",`${Math.round(pl.hp)}%`,pl.hp<40?"bad":""],...gunHud()]
    .map(([k,v,c])=>`<span class="k">${k}</span><span class="v ${c||""}">${v}</span>`).join(""):`<span class="k">No camp yet</span><span class="v"></span><span class="k">People</span><span class="v">${members().length+1}</span><span class="k">You</span><span class="v">${Math.round(pl.hp)}%</span>`+gunHud().map(([k,v,c])=>`<span class="k">${k}</span><span class="v ${c||""}">${v}</span>`).join(""));
  renderTools();renderHint()}
function gunHud(){const pl=S.player;if(!pl.gun)return[];const r=pl.rounds||0;return[[GUNS[pl.gun].n,`${r} <span class="mut">rds</span>`,r<=0?"bad":r<5?"warn":""]]}
function avgMood(){const L=members();return L.length?Math.round(L.reduce((a,p)=>a+p.mood,0)/L.length):50}
function renderTools(){const waiting=S.people.filter(p=>p.status==="stranger"&&p.loc===S.player.loc).length;
  setHtml($("tools"),[["map","Map","M"],["people","People","P"],["build","Build","B"],["stores","Stores","I"],["camp","Camp","C"],["help","Help","H"]].map(([k,n,key])=>`<button data-tool="${k}">${n}<span class="k">${key}</span></button>`).join("")+
    (S.camp&&S.player.loc!==campK()&&S.player.loc!=="road"?`<button data-tool="home">Go home</button>`:"")+(!S.camp&&LOCS[S.player.loc]?.camp!==false&&S.player.loc!=="road"?`<button data-tool="makecamp" class="pri">Make camp here</button>`:"")+
    (S.player.loc!==campK()&&S.player.loc!=="road"&&S.player.loc!=="start"&&!place(S.player.loc).burned?`<button data-tool="burn">Burn it</button>`:"")+(waiting?`<span class="chip">${waiting} waiting to be let in</span>`:""))}
function renderHint(){const el=$("hint");if(!el)return;const t=AI.busy?"Claude is thinking...":AI.ns?(AI.on?"Claude reads what you type and voices people (uses your Claude usage).":"Claude is off: built-in rules only."):"Built-in rules (Claude isn't available here).";if(el.textContent!==t)el.textContent=t}
// ---------- labels and speech ----------
const LBL={};
function renderLabels(now){const box=$("labels");if(!box||!W.ok||!S)return;const k=W.loc;const seen=new Set();const near=W.zoom<24;
  const put=(id,cls,html,x,y,z)=>{let e=LBL[id];if(!e){e=document.createElement("div");box.appendChild(e);LBL[id]=e}e.className=cls;if(e._h!==html){e.innerHTML=html;e._h=html}const s=toScreen(x,y,z);e.style.left=s.x+"px";e.style.top=s.y+"px";e.style.display=s.vis?"block":"none";seen.add(id)};
  const ents=[S.player,...S.people.filter(p=>p.loc===k&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside))];
  for(const o of ents){if(o.loc!==k)continue;const b=BUB[o.id];const f=W.figs[o.id];const x=f?f.position.x:o.x,z=f?f.position.z:o.z;const top=o.kid?1.5:2;
    if(b&&b.until>now)put("b"+o.id,"bub"+(b.think?" think":""),`${o.id!=="you"?`<b>${esc(o.name)}</b>`:""}${esc(b.x)}`,x,top+.4,z);
    else if(near&&o.id!=="you"&&(o.status!=="member"||UI.hover===o.id||W.zoom<14))put("t"+o.id,"tag"+(o.status==="stranger"?" str":o.status==="rival"?" riv":""),esc(o.status==="stranger"&&!o.met?"?":o.name),x,top+.1,z)}
  for(const w of S.walkers)if(w.loc===k&&BUB[w.id]&&BUB[w.id].until>now)put("b"+w.id,"bub",esc(BUB[w.id].x),w.x,2.4,w.z);
  if(UI.hover&&UI.hover.startsWith?.("c:")){const c=layout(k).conts.find(c=>c.id===UI.hover.slice(2));if(c){const st=place(k).conts[c.id];put("hc","tag",esc(CONT[c.k].n+(st&&st.rolled&&!st.c.items.length?" (empty)":"")),c.x,2.2,c.z)}}
  for(const id in LBL)if(!seen.has(id)){LBL[id].remove();delete LBL[id]}}
// ---------- clicking the world ----------
function initInput(){const cv=$("gl");let down=null;
  cv.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,tx:W.tgt.x,tz:W.tgt.z,moved:false,btn:e.button};closeMenu()});
  cv.addEventListener("pointermove",e=>{if(down&&(Math.abs(e.clientX-down.x)+Math.abs(e.clientY-down.y)>6||down.moved)){down.moved=true;const a=groundAt(down.x,down.y),b=groundAt(e.clientX,e.clientY);if(a&&b){W.free=true;W.tgt.x=down.tx-(b.x-a.x);W.tgt.z=down.tz-(b.z-a.z);camUpdate();const a2=groundAt(down.x,down.y);if(a2){down.tx=W.tgt.x;down.tz=W.tgt.z;down.x=e.clientX;down.y=e.clientY}}}
    if(UI.place){const g=groundAt(e.clientX,e.clientY);if(g){UI.place.x=Math.round(g.x);UI.place.z=Math.round(g.z);placeGhost()}}else{const h=pickAt(e.clientX,e.clientY);UI.hover=h?(h.kind==="person"?h.o.id:h.kind==="cont"?"c:"+h.o.id:null):null;cv.style.cursor=h&&h.kind!=="ground"?"pointer":"default"}});
  cv.addEventListener("pointerup",e=>{const d=down;down=null;if(!d||d.moved||!S)return;if(e.button===2)return;clickWorld(e.clientX,e.clientY)});
  cv.addEventListener("contextmenu",e=>{e.preventDefault();if(UI.place){UI.place.rot=(UI.place.rot+1)%4;placeGhost()}});
  cv.addEventListener("wheel",e=>{e.preventDefault();W.zoom=clamp(W.zoom*(e.deltaY>0?1.1:.9),7,40);camUpdate()},{passive:false});
  addEventListener("resize",resizeWorld);
  addEventListener("keydown",e=>{const typing=/INPUT|TEXTAREA/.test(document.activeElement?.tagName);if(e.key==="Escape"){if(UI.place){cancelPlace();return}closeAll();document.activeElement?.blur();return}
    if(typing){if(e.key==="Enter"&&document.activeElement.id==="cmd")submitCmd();if(e.key==="Enter"&&document.activeElement.id==="tin")sendTalk();return}
    if($("build").classList.contains("open"))return;
    const k=e.key.toLowerCase();if(k==="enter"){$("cmd").focus();e.preventDefault();return}if(k==="m")openMap();if(k==="p")openPeople();if(k==="b")openBuild();if(k==="i")openStores();if(k==="c")openCamp();if(k==="h"||k==="?")openHelp();
    if(k==="r"&&UI.place){UI.place.rot=(UI.place.rot+1)%4;placeGhost()}if(k===" "){UI.paused=!UI.paused;renderHud();e.preventDefault()}if(k==="f"){W.free=false}
    const pan={w:[-1,-1],arrowup:[-1,-1],s:[1,1],arrowdown:[1,1],a:[-1,1],arrowleft:[-1,1],d:[1,-1],arrowright:[1,-1]}[k];if(pan){W.free=true;W.tgt.x+=pan[0]*2;W.tgt.z+=pan[1]*2;camUpdate()}});
  $("go").onclick=submitCmd;
  document.body.addEventListener("click",e=>{const b=e.target.closest("[data-sp],[data-tool],[data-act]");if(!b)return;
    if(b.dataset.sp!=null){const v=+b.dataset.sp;if(v===0)UI.paused=true;else{UI.paused=false;UI.speed=v}renderHud();return}
    if(b.dataset.tool){const t=b.dataset.tool;({map:openMap,people:openPeople,build:openBuild,stores:openStores,camp:openCamp,help:openHelp,home:goHome,makecamp:doCamp,burn:()=>confirmCard("Burn it down?",`Set ${LOCS[S.player.loc].n} on fire. Anything you haven't searched burns with it. It can't be undone.`,burnPlace)})[t]?.();renderHud();return}
    if(b.dataset.act){ACTS[b.dataset.act]?.(b.dataset);}})}
function submitCmd(){const i=$("cmd");const v=i.value.trim();if(!v)return;i.value="";doCommand(v).then(()=>{renderAll()}).catch(err=>{console.error(err);toast("Something went wrong with that.")})}
function clickWorld(cx,cy){if(UI.place){tryPlace();return}const h=pickAt(cx,cy);if(!h)return;const pl=S.player;if(S.flags.traveling||pl.ko>0)return;
  if(h.kind==="ground"){moveTo(pl,h.o.x,h.o.z);W.free=false;return}
  if(h.kind==="person")return personMenu(h.o,cx,cy);
  if(h.kind==="walker"){if(pl.gun&&((pl.rounds||0)>0||loadUp()>0))closeAndShoot(h.o);else approach(h.o,()=>clash(pl,h.o));W.free=false;return}
  if(h.kind==="cont"){approach(h.o,()=>openLoot(h.o));W.free=false;return}
  if(h.kind==="bld")return bldMenu(h.o,cx,cy)}
function closeMenu(){$("menu").style.display="none";UI.menu=null}
function showMenu(html,cx,cy){const m=$("menu");m.innerHTML=html;m.style.display="block";const w=m.offsetWidth,h=m.offsetHeight;m.style.left=clamp(cx+12,8,innerWidth-w-8)+"px";m.style.top=clamp(cy-20,8,innerHeight-h-8)+"px"}
const ACTS={};
function personMenu(p,cx,cy){UI.menu=p.id;const mem_=p.status==="member";const strg=p.status==="stranger";p.met=true;
  const head=`<div class="h">${esc(p.name)}${p.status==="member"?"":` <span class="chip">${p.status==="stranger"?"stranger":p.status==="rival"?"Pruitt crew":""}</span>`}<small>${esc(p.act||"")}${p.kid?` · ${p.age}`:""}</small></div>`;
  const b=(a,t,extra)=>`<button data-act="${a}" data-id="${p.id}"${extra||""}>${t}</button>`;
  let h=head+b("talk","Talk");
  if(strg)h+=b("invite","Let them in")+b("away","Turn them away");
  if(mem_){h+=p.follow?b("stay","Stay here"):b("come","Come with me");if(!p.kid||true)h+=b("jobs","Give a job ▸")+b("leads","Put in charge of ▸");h+=b("about","About "+p.name)}
  if(p.status==="rival"&&S.rival&&!S.rival.gone)h+=b("warmenu","Go to war with them");
  showMenu(h,cx,cy)}
ACTS.talk=d=>{const p=P(d.id);closeMenu();openTalk(p);approach(p)};
ACTS.invite=d=>{closeMenu();invite(P(d.id))};ACTS.away=d=>{closeMenu();sendAway(P(d.id))};
ACTS.come=d=>{closeMenu();const p=P(d.id);approach(p,()=>{say(S.player,"Come with me.");ask(p,"come")})};
ACTS.stay=d=>{closeMenu();const p=P(d.id);approach(p,()=>{say(S.player,"Stay here.");ask(p,"stay")})};
ACTS.about=d=>{closeMenu();openPerson(P(d.id))};ACTS.warmenu=()=>{closeMenu();rally()};
ACTS.jobs=d=>{const p=P(d.id);const m=$("menu");const cx=parseFloat(m.style.left),cy=parseFloat(m.style.top);
  showMenu(`<div class="h">${esc(p.name)}<small>Now: ${p.job?JOBS[p.job].n:"no job"} · good at ${Object.entries(p.sk).filter(([k,v])=>v>=2).map(([k])=>SKILLS[k].toLowerCase()).join(", ")||"nothing much yet"}</small></div>`+
    Object.entries(JOBS).map(([k,j])=>`<button data-act="job" data-id="${p.id}" data-job="${k}">${j.n} <span class="mut">${"●".repeat(Math.round(p.sk[j.sk]))||"·"}</span></button>`).join("")+`<button data-act="job" data-id="${p.id}" data-job="none">No job, their own time</button>`,cx,cy)};
ACTS.leads=d=>{const p=P(d.id);const m=$("menu");showMenu(`<div class="h">Put ${esc(p.name)} in charge of<small>Problems there go to them first. They pick it up themselves.</small></div>`+Object.entries(JOBS).map(([k,j])=>`<button data-act="lead" data-id="${p.id}" data-job="${k}">${cap1(j.lead)}${members().find(q=>q.leads===k)?` <span class="mut">(now ${esc(members().find(q=>q.leads===k).name)})</span>`:""}</button>`).join(""),parseFloat(m.style.left),parseFloat(m.style.top))};
ACTS.job=d=>{closeMenu();const p=P(d.id);approach(p,()=>{say(S.player,d.job==="none"?"Take a break. Do what you like.":`I need you on ${JOBS[d.job].n.toLowerCase()}.`);ask(p,"job",{job:d.job})})};
ACTS.lead=d=>{closeMenu();const p=P(d.id);approach(p,()=>{say(S.player,`I want you running ${JOBS[d.job].lead}.`);ask(p,"lead",{job:d.job})})};
function bldMenu(b,cx,cy){const B=BUILDS[b.type];const w=here().filter(p=>p.at===b.id);
  showMenu(`<div class="h">${esc(b.name)}<small>${b.done?esc(B.d):`Being built: ${Math.round(b.prog/B.hrs*100)}%`}${b.type==="plot"&&b.done?` · crops ${Math.round(b.grow*100)}% grown`:""}${w.length?` · ${esc(listAnd(w.map(p=>p.name)))} here`:""}</small></div>`+
    (!b.done?`<button data-act="selfbuild" data-id="${b.id}">Build it yourself</button>`:"")+`<button data-act="rename" data-id="${b.id}">Rename</button><button data-act="tear" data-id="${b.id}">Tear it down</button>`,cx,cy)}
ACTS.selfbuild=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);approach(b,()=>openMinigame(b))};
ACTS.rename=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);UI.renaming=b.id;openModal(`<h2>Rename</h2><input id="rnin" maxlength="30" value="${esc(b.name)}"><button class="opt pri" data-act="rnok" style="margin-top:10px">Save</button><button class="opt" data-act="modalclose">Cancel</button>`,true);setTimeout(()=>$("rnin")?.focus(),30)};
ACTS.rnok=()=>{const b=S.blds.find(x=>x.id===UI.renaming);const v=($("rnin")?.value||"").trim();if(b&&v){b.name=v.slice(0,30);save()}closeModal()};
ACTS.tear=d=>{closeMenu();const b=S.blds.find(x=>x.id===d.id);confirmCard("Tear it down?",`Take apart the ${b.name.toLowerCase()} and get some of the wood back.`,()=>{S.blds.splice(S.blds.indexOf(b),1);S.bv++;S.res.wood+=Math.floor((BUILDS[b.type].cost.wood||0)/2);drawBld({...b,gone:true});syncInv();renderAll()})};
// ---------- side panels ----------
function openSide(kind,html){const s=$("side");s.className="hud open";s.innerHTML=`<button class="x" data-act="closeside">×</button>`+html;UI.side=kind}
ACTS.closeside=()=>{$("side").className="hud";UI.side=null};
function closeAll(){closeMenu();ACTS.closeside();closeTalk();if(UI.loot)closeLoot();if($("modal").classList.contains("open")&&UI.modal?.soft)closeModal()}
function moodWord(m){return m>70?"happy":m>50?"okay":m>30?"low":"miserable"}
function openPeople(){if(!S)return;const L=S.people.filter(p=>p.status==="member");const W2=S.people.filter(p=>p.status==="stranger"&&(p.loc===S.player.loc||p.loc===campK()));
  const row=p=>`<div class="row" data-act="person" data-id="${p.id}"><div class="n">${esc(p.name)} ${esc(p.sur)} <span class="mut">${p.age}</span>${p.leads?` <span class="chip">runs ${JOBS[p.leads].lead}</span>`:""}${p.cond?` <span class="chip">${CONDS[p.cond].n}</span>`:""}</div>
    <div class="s">${p.job?JOBS[p.job].n:"No job"} · ${esc(p.away?(p.away.kind==="scav"?`on a run to the ${LOCS[p.away.to].n}`:p.follow?"with you":"away"):p.act||"")} · ${moodWord(p.mood)}${p.hp<60?` · <span class="bad">hurt</span>`:""}${p.sick?` · <span class="bad">sick</span>`:""}</div>
    <div class="meter"><i style="width:${p.trust}%;background:${p.trust>50?"var(--good)":p.trust>30?"var(--warn)":"var(--bad)"}"></i></div></div>`;
  openSide("people",`<h2>People</h2><div class="mut" style="font-size:12.5px">${L.length+1} in camp, counting you. The bar is how much each trusts you. Click someone for more.</div>${L.map(row).join("")}${W2.length?`<h3>Waiting to be let in</h3>${W2.map(row).join("")}`:""}`)}
ACTS.person=d=>openPerson(P(d.id));
function openPerson(p){if(!p)return;const fam=famOf(p);const T=traitWords(p);
  openSide("person",`<h2>${esc(p.name)} ${esc(p.sur)}</h2><div class="mut">${p.age}${p.job0?` · was a ${JOBS_BEFORE[p.job0].n}`:p.kid?" · a kid":""} · ${p.status==="member"?"in your camp":p.status}</div>
    <h3>Who they are</h3><div>${T.map(t=>`<span class="chip">${t}</span>`).join("")||"<span class='mut'>Even-keeled.</span>"}</div><p style="margin:6px 0">Cares most about ${MOTIVES[p.motive]}. ${cap1(p.quirk)}.</p>
    ${p.cond?`<p class="warn" style="margin:4px 0">${cap1(CONDS[p.cond].n)}: needs ${CONDS[p.cond].need}. ${itemCount(CONDS[p.cond].item)?`Camp has ${itemCount(CONDS[p.cond].item)}.`:"<b>Camp has none.</b>"}</p>`:""}
    <h3>Family</h3><div>${fam.length?fam.map(q=>`${esc(p.fam[q.id])} ${esc(q.name)}${q.status==="dead"?" (dead)":""}`).join(", "):"<span class='mut'>Nobody here.</span>"}</div>
    <h3>Skills</h3><div>${Object.entries(p.sk).map(([k,v])=>`<span class="chip">${SKILLS[k]} ${"●".repeat(Math.round(v))||"·"}</span>`).join("")}</div>
    <h3>Right now</h3><div>${esc(p.act||"")} · mood ${moodWord(p.mood)} · health ${Math.round(p.hp)}%${p.sick?" · sick":""}</div><div>Trusts you: ${Math.round(p.trust)}/100</div>
    ${p.mem.length?`<h3>Remembers</h3><div style="font-size:13px">${p.mem.slice(-5).reverse().map(m=>`<div>· ${esc(m.x)}</div>`).join("")}</div>`:""}
    <div class="btns"><button data-act="talk" data-id="${p.id}">Talk</button>${p.status==="member"?`<button data-act="jobsside" data-id="${p.id}">Job</button>`:""}${p.status==="member"&&!p.kid?`<button data-act="kick" data-id="${p.id}">Tell them to leave</button>`:""}</div>`)}
ACTS.jobsside=d=>{const p=P(d.id);const r=$("side").getBoundingClientRect();UI.menu=p.id;ACTS.jobs({id:p.id});const m=$("menu");m.style.left=(r.left-m.offsetWidth-8)+"px";m.style.top=(r.top+40)+"px"};
ACTS.kick=d=>{const p=P(d.id);confirmCard(`Tell ${p.name} to leave?`,`They'll pack up and go${famOf(p).some(q=>q.status==="member")?", and their family will hate you for it":""}.`,()=>{if(here_(p))approach(p,()=>ask(p,"leave"));else toast(`${p.name} isn't here.`)})};
function openCamp(){if(!S.camp){openSide("camp",`<h2>No camp yet</h2><p>Open the map (M), go somewhere, and choose Make camp here. Anywhere you can stand, you can live.</p>`);return}
  const n=campSize();const leads=Object.keys(JOBS).map(j=>[j,members().find(p=>p.leads===j)]);
  const by=Object.keys(JOBS).map(j=>[j,members().filter(p=>p.job===j)]).filter(x=>x[1].length);
  openSide("camp",`<h2>${esc(S.camp.n)}</h2><div class="mut">Camp since day ${S.camp.day}. ${n} people, ${bedsTotal()} beds, defense ${defense()}.</div>
    <p style="font-size:13px">${n<=4?"A small camp. Easy to keep an eye on everyone.":n<=10?"A real camp now. Problems come more often, and people want more from you.":n<=20?"A big camp. Disasters and arguments come thick and fast unless someone runs each part of it.":"A town. You can't be everywhere. Put people in charge or drown."}</p>
    <h3>Who runs what</h3>${leads.map(([j,p])=>`<div>${cap1(JOBS[j].lead)}: ${p?`<b>${esc(p.name)}</b>`:`<span class="mut">nobody (problems come to you)</span>`}</div>`).join("")}
    <h3>Who's working</h3>${by.map(([j,L])=>`<div>${JOBS[j].n}: ${esc(listAnd(L.map(p=>p.name)))}</div>`).join("")||"<div class='mut'>Nobody has a job yet. Click someone and give them one.</div>"}
    <h3>Each day</h3><div style="font-size:13px">Eating ${n} food and ${n} water. Rain barrels ${bldDone("well").length}, plots ${bldDone("plot").length} (${bldDone("plot").filter(b=>b.grow>=1).length} producing).</div>
    <h3>Lately</h3><div style="font-size:13px">${S.log.slice(-12).reverse().map(l=>`<div class="${l.k==="bad"?"bad":l.k==="good"?"good":""}">· ${esc(l.x)}</div>`).join("")}</div>`)}
function openHelp(){openSide("help",`<h2>How it works</h2>
  <p>Click the ground to walk. Click people to talk, give them jobs, put them in charge or bring them along. Drag to look around, scroll to zoom, F to follow yourself again.</p>
  <p>Or type anything in the box: <i>I say hi</i>, <i>put Ruth on the farm</i>, <i>Marcus, come with me</i>, <i>build a tent</i>, <i>tie the rope into a fishing net</i>, <i>go to the pharmacy</i>, <i>I teach the kids to whittle</i>. If Claude is on, it works out what you mean; otherwise the built-in rules do their best.</p>
  <p><b>Map (M):</b> each place is its own scene. Travel takes hours, and whoever's following you comes along. Search cars and buildings, carry it home, or burn the place down.</p>
  <p><b>Guns:</b> search cars, the trooper's cruiser on the highway, the farm's gun cabinet or the police armory. A gun you find stays on you: click one of the dead to shoot it, or type <i>shoot the walker</i>. Shots are loud, and the noise brings more of them. Spare guns go to your guards. You'll never turn one on the living; fights with the Pruitts are a war you rally people for.</p>
  <p><b>Build (B):</b> place it, pick colors, then build it yourself in a quick hands-on build, or leave it for whoever's on building. Right-click or R turns it.</p>
  <p><b>Stores (I):</b> everything the camp owns, in one grid. Anyone takes what they need, but they leave someone's insulin or EpiPen alone. Mostly.</p>
  <p><b>People decide for themselves.</b> Ask something and they weigh it: trust in you, their nature, their family. Put someone in charge of a part of camp and its small problems never reach you. A bigger camp brings in more and needs more from you.</p>
  <p class="mut">Space pauses. Your game saves on its own in this browser.</p>
  <div class="btns"><button data-act="aitoggle">${AI.on?"Turn Claude off":"Turn Claude on"}</button><button data-act="newgame">Start a new game</button></div>`)}
ACTS.aitoggle=()=>{AI.on=!AI.on;try{localStorage.setItem("holdfast.ai",AI.on?"1":"0")}catch(e){}openHelp();renderHint()};
ACTS.newgame=()=>confirmCard("Start over?","This camp and everyone in it will be gone for good.",()=>{wipeSave();location.reload()});
// ---------- talking ----------
function openTalk(p){if(!p)return;UI.talkTo=p.id;p.met=true;$("talk").classList.add("open");renderTalk();setTimeout(()=>$("tin")?.focus(),30)}
function closeTalk(){UI.talkTo=null;$("talk").classList.remove("open")}
function renderTalk(){const p=UI.talkTo&&P(UI.talkTo);const el=$("talk");if(!p){closeTalk();return}const keep=$("tin")?.value||"";
  el.innerHTML=`<button class="x" data-act="closetalk">×</button><div><b>${esc(p.name)}</b> <span class="mut" style="font-size:12px">${esc(p.act||"")}</span></div>
   <div class="log" id="tlog">${p.chat.slice(-30).map(m=>m.w==="you"?`<div class="me">You: ${esc(m.x)}</div>`:m.w==="sys"?`<div class="sys">${m.x}</div>`:`<div>${esc(p.name)}: ${esc(m.x)}</div>`).join("")||`<div class="sys">Say anything. Ask them to come along, take a job, or just talk.</div>`}</div>
   <div style="display:flex;gap:5px"><input id="tin" placeholder="Say something to ${esc(p.name)}..." autocomplete="off"><button class="pri" data-act="sendtalk">Say</button></div>`;
  $("tin").value=keep;const lg=$("tlog");lg.scrollTop=lg.scrollHeight}
ACTS.closetalk=closeTalk;ACTS.sendtalk=()=>sendTalk();
function sendTalk(){const p=P(UI.talkTo);const i=$("tin");const v=i.value.trim();if(!p||!v)return;i.value="";speak(p,v).then(()=>renderTalk());setTimeout(renderTalk,60)}
function whyPanel(p,head,r){p.chat.push({w:"sys",x:esc(head)+reasonsHtml(r)});if(UI.talkTo===p.id)renderTalk();else{const t=$("toast");t.innerHTML=`<b>${esc(head)}</b>${reasonsHtml(r)}`;t.style.display="block";t.style.textAlign="left";clearTimeout(UI.tt);UI.tt=setTimeout(()=>{t.style.display="none";t.style.textAlign="center"},6500)}}
// ---------- cards that stop the clock ----------
function openModal(html,soft){$("mcard").innerHTML=html;$("modal").classList.add("open");UI.modal={soft}}
function closeModal(){$("modal").classList.remove("open");UI.modal=null;setTimeout(nextCard,200)}
function confirmCard(title,text,yes){UI.confirm=yes;openModal(`<h2>${esc(title)}</h2><p>${esc(text)}</p><button class="opt pri" data-act="confyes">Do it</button><button class="opt" data-act="modalclose">Never mind</button>`,true)}
ACTS.confyes=()=>{const f=UI.confirm;UI.confirm=null;closeModal();f&&f();renderAll()};ACTS.modalclose=()=>closeModal();
function onCard(){if(!UI.modal)nextCard()}
function nextCard(){if(UI.modal||!S||!S.cards.length||S.flags.traveling)return;const c=S.cards[0];const d=CARDS[c.type]?.(c);if(!d){S.cards.shift();return nextCard()}
  UI.card=d;openModal(`<h2>${esc(d.title)}</h2><p>${d.text}</p>${d.opts.map((o,i)=>`<button class="opt${i===0?" pri":""}" data-act="cardopt" data-i="${i}"${o.off?" disabled":""}>${esc(o.t)}<small>${esc(o.d||"")}</small></button>`).join("")}`)}
ACTS.cardopt=d=>{const card=UI.card;const o=card.opts[+d.i];S.cards.shift();UI.card=null;$("modal").classList.remove("open");UI.modal=null;const out=o.f&&o.f();
  if(out){openModal(`<h2>${esc(card.title)}</h2><p>${out}</p><button class="opt pri" data-act="modalclose">Go on</button>`)}else setTimeout(nextCard,200);syncInv();renderAll();save()};
const nm=id=>P(id)?.name||"someone";
const CARDS={
  bitten:c=>{const p=P(c.who);if(!p||p.status!=="member")return null;const fam=famOf(p).filter(q=>q.status==="member");const doc=Math.max(0,...here().map(q=>q.sk.med));
    return{title:`${p.name} was bitten`,text:`On the ${pick(["forearm","calf","hand"])}. ${p.name} is pale and shaking${fam.length?`, and ${listAnd(fam.map(q=>q.name))} won't leave ${pronoun(p,"p")} side`:""}. Everyone's looking at you.`,
      opts:[{t:"Take the limb, now",d:`It might stop it. ${doc>=2?"There's someone here who knows what they're doing.":"Nobody here has done this before."}`,f:()=>{if(rf()<.4+doc*.12){p.bitten=false;p.cured=true;p.hp=20;p.sk.fight=Math.max(0,p.sk.fight-1);p.mood-=20;mem(p,"They took my arm to save me.",3);return`It's horrible, and it works. ${p.name} lives. ${pronoun(p,"S")}'ll never be the same, but ${pronoun(p)} lives.`}die(p,"died on the table");return`It doesn't work. ${p.name} dies before morning.`}},
        {t:"Lock them away and wait",d:"Some people don't turn. Most do.",f:()=>{p.quarantine=true;if(rf()<.15){p.bitten=false;p.cured=true;p.quarantine=false;return`Two days. Then the fever breaks. ${p.name} walks out of that shed on ${pronoun(p,"p")} own. Nobody can explain it.`}return`${p.name} is locked in. You hear ${pronoun(p,"o")} talking through the door for a long time.`}},
        {t:"Let them say goodbye",d:"Before it happens. Their way.",f:()=>{for(const q of fam)mem(q,`${S.player.name} let us say goodbye to ${p.name}.`,3);die(p,"said goodbye, and was gone before it could happen");return`They sit together by the fire until late. In the morning ${p.name} is gone, peacefully, before it could happen.`}}]}},
  blight:c=>{const f=lead("farm");return{title:"Blight in the fields",text:`Black spots on the leaves, spreading row to row.${f?` ${f.name} didn't catch it in time.`:" Nobody's watching the crops closely enough to have caught it."}`,
    opts:[{t:"Burn the sick rows",d:"Lose half of what's growing, save the rest.",f:()=>{for(const b of bldDone("plot"))b.grow*=.5;campBlds().forEach(drawBld);return"The smoke hangs over camp all afternoon. Half the crop is gone, but it stops."}},
      {t:"Try to save every plant",d:"Could work. Could lose it all.",f:()=>{if(rf()<.45)return"Days of picking leaves by hand, and it works. The crop pulls through.";for(const b of bldDone("plot"))b.grow=0;campBlds().forEach(drawBld);return"It spreads anyway. Everything in the fields has to be torn out and started again."}},
      {t:"Let it run its course",d:"Do nothing and hope.",f:()=>{for(const b of bldDone("plot"))if(rf()<.6)b.grow=0;campBlds().forEach(drawBld);return"Most of the fields die back to dirt."}}]}},
  sick:c=>{const p=P(c.who);if(!p)return null;return{title:`${p.name} has a fever`,text:`It came on overnight. Coughing, burning up. In a camp this tight, it won't stay with one person.`,
    opts:[{t:"Use medicine",d:S.res.meds>=1?`The camp has ${Math.floor(S.res.meds)}.`:"There isn't any.",off:S.res.meds<1,f:()=>{S.res.meds--;return`The antibiotics do their job. ${p.name} is back on ${pronoun(p,"p")} feet in two days.`}},
      {t:"Keep them apart from everyone",d:"Their family won't like it.",f:()=>{p.sick=3;for(const q of famOf(p))q.mood-=8;return`${p.name} sleeps alone at the edge of camp for three nights. It doesn't spread.`}},
      {t:"Let it run",d:"Fevers break. Usually.",f:()=>{p.sick=3;const L=shuffle(members().filter(q=>q!==p&&q.loc===campK())).slice(0,ri(1,Math.max(1,Math.round(campSize()/5))));for(const q of L)q.sick=2;return L.length?`It spreads: ${listAnd(L.map(q=>q.name))} come down with it too.`:"Somehow, nobody else catches it."}}]}},
  horde:c=>{const def=defense();return{title:"A herd is coming",text:`Dozens of the dead, maybe ${c.size*3}, drifting down the road toward camp in the dark. Your defense is ${def}. ${def>=c.size?"You might hold.":"That's not enough."}`,
    opts:[{t:"Hold the line",d:"Everyone who can fight, at the edge of camp.",f:()=>{const gap=c.size-def;if(gap<=0)return"It's a long night, and it holds. In the morning there are bodies piled at the fence.";const L=shuffle(here().filter(p=>!p.kid)).slice(0,Math.min(4,Math.ceil(gap/2)));const out=[];
        for(const p of L){p.hp-=ri(15,35);if(p.hp<=0&&rf()<.6)die(p,"died holding the line");else{p.hp=Math.max(5,p.hp);out.push(p.name)}}const dead=L.filter(p=>p.status==="dead");
        return`It's a long, terrible night. It holds, just.${out.length?` ${listAnd(out)} got hurt.`:""}${dead.length?` ${listAnd(dead.map(p=>p.name))} didn't make it.`:""}`}},
      {t:"Lead them away",d:"You and someone fast, making noise, drawing them off.",f:()=>{const pl=S.player;pl.hp=Math.max(15,pl.hp-ri(10,25));if(rf()<.7)return"You bang a pot and run, and they follow, mile after mile. You get home at dawn, half dead, and the camp is untouched.";const b=pick(campBlds().filter(b=>b.done&&b.type!=="fire"));if(b){S.blds.splice(S.blds.indexOf(b),1);S.bv++;drawBld({...b,gone:true})}return`Most of them follow you. Some don't.${b?` They tear down the ${b.name.toLowerCase()} before the guards put them down.`:""}`}},
      {t:"Go dark and hide",d:`Fires out, no noise. ${SITES[S.camp.site].hide>1.1?"This place is well hidden.":"This place is easy to find."}`,f:()=>{if(rf()<.35*(SITES[S.camp.site].hide||1)+.2)return"Nobody breathes for an hour. They pass by.";const p=pick(here());if(p){p.hp-=ri(10,25);if(p.hp<=0)die(p,"was dragged off by the herd")}return`They find you anyway.${p?` ${p.name} got hurt before they were driven off.`:""}`}}]}},
  quarrel:c=>{const a=P(c.a),b=P(c.b);if(!a||!b||a.status!=="member"||b.status!=="member")return null;const what=pick(["who's doing their share of the work","food going missing","a joke that went too far","whose turn it is on watch","something said about family"]);
    return{title:`${a.name} and ${b.name} are at each other's throats`,text:`It's about ${what}. It's getting loud, and people are taking sides.`,
      opts:[{t:`Side with ${a.name}`,f:()=>{a.trust+=5;b.trust-=12;b.mood-=8;mem(b,`${S.player.name} took ${a.name}'s side against me.`,-5);return`${a.name} looks satisfied. ${b.name} doesn't speak to you for the rest of the day.`}},
        {t:`Side with ${b.name}`,f:()=>{b.trust+=5;a.trust-=12;a.mood-=8;mem(a,`${S.player.name} took ${b.name}'s side against me.`,-5);return`${b.name} looks satisfied. ${a.name} storms off.`}},
        {t:"Make them work it out",d:"If they listen to you.",f:()=>{if(rf()<(a.trust+b.trust)/150){a.mood+=4;b.mood+=4;return"It takes an hour of shouting, then quiet talk. They end up sharing a cigarette."}a.trust-=4;b.trust-=4;return"Neither of them wants to hear it. They both blame you a little now."}},
        {t:"Stay out of it",f:()=>{a.mood-=6;b.mood-=6;if(rf()<.3){const l=a.tr.loyal<b.tr.loyal?a:b;l.wantsLeave=true;queueCard("leave",{who:l.id})}return"It burns itself out eventually. It isn't really over."}}]}},
  fire:c=>{const b=pick(campBlds().filter(b=>b.done&&["shed","cabin","shop","clinic"].includes(b.type)));if(!b)return null;return{title:`The ${b.name.toLowerCase()} is on fire`,text:"Somebody knocked over a lamp, or a spark from the fire caught. Flames are already through the roof.",
    opts:[{t:"Everyone grab water",d:`Uses the camp's water (${Math.floor(S.res.water)}).`,off:S.res.water<4,f:()=>{S.res.water=Math.max(0,S.res.water-6);return`A bucket line from the barrels. It's black and soaked, but the ${b.name.toLowerCase()} is still standing.`}},
      {t:"Let it burn, save what's near",f:()=>{S.blds.splice(S.blds.indexOf(b),1);S.bv++;drawBld({...b,gone:true});if(b.type==="shed")S.res.food*=.6;S.res.wood*=.8;return`The ${b.name.toLowerCase()} burns to the ground.`}}]}},
  short:c=>{const n=campSize();return{title:"Food is running out",text:`${Math.floor(S.res.food)} food left for ${n} people. That's ${(S.res.food/n).toFixed(1)} days. ${bldDone("plot").length?"The fields aren't producing enough yet.":"Nobody's growing anything."}`,
    opts:[{t:"Ration it",d:"Everyone eats less. Nobody's happy about it.",f:()=>{S.flags.ration=dayOf(S.t)+3;for(const p of members())p.mood-=5;return"Half portions, starting tonight."}},
      {t:"Send people out for food",d:"Your best scavengers go to the grocery.",f:()=>{const L=members().filter(p=>!p.kid&&p.loc===campK()).sort((a,b)=>b.sk.scav-a.sk.scav).slice(0,2);const got=[];for(const p of L){const r=weigh(p,"job",{job:"scav"});if(r.yes){p.job="scav";got.push(p.name)}}S.flags.scavTo="grocery";return got.length?`${listAnd(got)} will go to the grocery in the morning.`:"Nobody wants to go."}},
      {t:"We'll manage",f:()=>null}]}},
  demand:c=>{const R=S.rival;const b=P(R.lead);return{title:"The Pruitts want a cut",text:`${b?b.name:"Their leader"} Pruitt walks up to the edge of camp with three others behind him. "A third of your food and your bullets. Every week. Or we come and take all of it."`,
    opts:[{t:"Pay them",d:`About ${Math.floor(S.res.food/3)} food and ${Math.floor(S.res.ammo/3)} ammo.`,f:()=>{S.res.food*=.67;S.res.ammo=Math.floor(S.res.ammo*.67);R.demanded=false;R.demandDay=dayOf(S.t)+5;for(const p of members())if(p.tr.temper>.3||p.motive==="revenge")p.mood-=6;return"They load it up and leave. Some of your people won't look at you."}},
      {t:"Tell them no",d:"They'll come back for it.",f:()=>{R.angry++;R.raidAt=S.t+ri(24,48)*HOUR;for(const p of members())if(p.tr.brave>.2)p.trust+=3;return`"Your funeral," ${b?b.name:"he"} says.`}},
      {t:"Talk him down",d:"Maybe there's a deal to be had.",f:()=>{if(rf()<.4){R.demanded=false;R.demandDay=dayOf(S.t)+6;return"You talk for an hour. He leaves with a handshake and a sack of potatoes, and a promise to leave you alone. For now."}R.angry++;R.raidAt=S.t+ri(24,48)*HOUR;return"He laughs at you. They'll be back."}},
      {t:"Go to war with them",d:"Ask your people who'll fight.",f:()=>{setTimeout(rally,300);return null}}]}},
  leave:c=>{const p=P(c.who);if(!p||p.status!=="member")return null;return{title:`${p.name} wants to leave`,text:`"I can't do this anymore. I'm going to try my luck on my own."${famOf(p).some(q=>q.status==="member")?` ${pronoun(p,"S")} wants to take ${pronoun(p,"p")} family.`:""}`,
    opts:[{t:"Talk them into staying",d:`${p.name} trusts you ${p.trust>50?"well enough":"not much"}.`,f:()=>{if(rf()<p.trust/90){p.wantsLeave=false;p.mood+=18;p.trust+=3;return`${p.name} stays. "One more week," ${pronoun(p)} says.`}leaveCamp(p);return`${p.name} goes anyway.`}},
      {t:"Let them go, with supplies",d:"3 food and 3 water.",f:()=>{S.res.food=Math.max(0,S.res.food-3);S.res.water=Math.max(0,S.res.water-3);leaveCamp(p);for(const q of members())q.trust+=2;return`You pack ${pronoun(p,"o")} a bag. People notice that you did.`}},
      {t:"Let them go",f:()=>{leaveCamp(p);return`${p.name} walks out at first light.`}}]}},
  theft:c=>{const p=P(c.who),o=P(c.owner),s=P(c.saw);if(!p||!o)return null;const it=ITEMS[c.item];return{title:`${p.name} took ${o.name}'s ${it}`,text:`${s?s.name+" saw it happen":"Someone saw"}. ${o.name} needs that to stay alive. ${p.name} says it was ${SELFISH_USE[c.item]}.`,
    opts:[{t:`Make ${p.name} give it back`,d:"If it isn't already gone.",f:()=>{if(rf()<.5&&c.item!=="epipen"){giveItem(c.item,1);delete S.flags.missing[c.item];p.trust-=5;return`${p.name} hands it over, sullen. ${o.name} keeps it on ${pronoun(o,"o")} after that.`}p.trust-=5;o.trust-=4;return"It's already gone. Used, or traded away."}},
      {t:"Call them out in front of everyone",f:()=>{p.mood-=20;p.trust-=10;for(const q of members())if(q!==p)q.trust+=2;mem(p,`${S.player.name} shamed me in front of everyone.`,-6);if(p.tr.loyal<0){p.wantsLeave=true;queueCard("leave",{who:p.id})}return`Nobody sits near ${p.name} at supper.`}},
      {t:`Throw ${p.name} out`,f:()=>{leaveCamp(p,true);for(const q of members())if(q.tr.kind>.3)q.trust-=2;o.trust+=8;return`${p.name} is gone by dark.`}},
      {t:"Let it go",f:()=>{o.trust-=12;o.mood-=10;mem(o,`${S.player.name} let ${p.name} get away with taking my medicine.`,-7);return`${o.name} doesn't say anything. ${pronoun(o,"S")} doesn't have to.`}}]}},
  nomed:c=>{const p=P(c.who);if(!p||p.status!=="member")return null;const t=c.thief&&P(c.thief);return{title:`${p.name} is out of ${ITEMS[c.item]}`,text:`${p.name} is ${CONDS[p.cond].n}. Without it ${pronoun(p)}'s getting weaker every day.${t?` And you know where the last of it went: ${t.name} took it.`:""} The pharmacy is the best bet.`,
    opts:[{t:"I'll go myself",d:"Open the map.",f:()=>{setTimeout(openMap,200);return null}},{t:"Send the scavengers to the pharmacy",f:()=>{S.flags.scavTo="pharmacy";return members().some(q=>q.job==="scav")?"They'll head to the pharmacy in the morning.":"Nobody's on scavenging. Give someone the job, or go yourself."}},{t:"There's nothing we can do",f:()=>null}]}},
  sting:c=>{const p=P(c.who);if(!p||p.status!=="member")return null;const t=c.thief&&P(c.thief);const doc=Math.max(0,...here().map(q=>q.sk.med));return{title:`A bee got ${p.name}`,text:`${p.name}'s throat is closing up, and there's no EpiPen in camp.${t?` There was one. ${t.name} took it.`:""}`,
    opts:[{t:"Do whatever you can",d:doc>=2?"Someone here has medical training.":"Nobody here really knows what to do.",f:()=>{if(rf()<.3+doc*.15){p.hp=25;return`Somehow, between ${doc>=2?"steady hands and luck":"luck and stubbornness"}, ${p.name} keeps breathing.`}die(p,"died of a bee sting");if(t)for(const q of members())if(q!==t)q.trust-=0;return`${p.name} dies on the grass outside camp.${t?` Everyone knows why.`:""}`}}]}},
  council:c=>{const p=P(c.who);if(!p)return null;const A={
      ration:{t:`${p.name} wants rationing`,x:`"We eat like nothing's going to run out. Half portions, until the fields come in."`,o:[["Agree",()=>{S.flags.ration=dayOf(S.t)+5;p.trust+=4;for(const q of members())q.mood-=3;return"Half portions it is."}],["Not yet",()=>{p.trust-=3;return null}]]},
      rules:{t:"People want rules",x:`"Some folks work dawn to dark and some sit by the fire. ${p.name} wants a rule: everyone works, or they don't eat."`,o:[["Everyone works",()=>{for(const q of members()){if(q.tr.diligent>.2)q.trust+=3;if(q.tr.diligent<-.2){q.mood-=8;q.trust-=4}if(!q.job&&!q.kid)q.job="farm"}return"Everyone without a job is put on the fields."}],["People can choose",()=>{for(const q of members())if(q.motive==="freedom")q.trust+=4;p.trust-=3;return null}]]},
      guard:{t:"Nobody's watching at night",x:`"${p.name} says we're sitting ducks. Somebody needs to be on guard."`,o:[["Ask the best fighter",()=>{const g=members().filter(q=>!q.kid&&q.loc===campK()&&q.job!=="guard").sort((a,b)=>b.sk.fight-a.sk.fight)[0];if(!g)return null;const r=weigh(g,"job",{job:"guard"});if(r.yes){g.job="guard";return`${g.name} takes the watch.`}return`${g.name} says no: ${r.reasons[0]?.t.toLowerCase()||"not tonight"}.`}],["We'll be fine",()=>null]]},
      newcomers:{t:"Too many new faces",x:`"We keep taking people in. ${p.name} says we can't feed who we've got."`,o:[["Close the gates for a while",()=>{S.nextStranger=S.t+5*DAY;p.trust+=4;return"No more newcomers for a few days."}],["Keep them open",()=>{p.trust-=3;for(const q of members())if(q.tr.kind>.3)q.trust+=2;return null}]]}}[c.ask];
    return{title:A.t,text:A.x,opts:A.o.map(([t,f])=>({t,f}))}}};
function leaveCamp(p,force){const fam=famOf(p).filter(q=>q.status==="member");p.status="left";p.follow=false;moveTo(p,ENTRY.x,ENTRY.z+4);for(const q of fam){if(force||q.fam[p.id]&&rf()<.7){q.status="left";moveTo(q,ENTRY.x,ENTRY.z+4)}else{q.mood-=20;q.trust-=10}}
  log(`${p.name} left camp${fam.filter(q=>q.status==="left").length?` with ${listAnd(fam.filter(q=>q.status==="left").map(q=>q.name))}`:""}.`,"warn")}
function warCard(out){const yes=out.filter(o=>o.r.yes);UI.war=out;
  openModal(`<h2>Who'll fight?</h2><p>You ask everyone who can hold a weapon. Each of them weighs it.</p>${out.map(o=>`<div class="row" style="cursor:default"><div class="n ${o.r.yes?"good":"bad"}">${esc(o.p.name)}: ${o.r.yes?"yes":"no"}</div>${reasonsHtml(o.r)}</div>`).join("")}
   <button class="opt pri" data-act="march" ${yes.length?"":"disabled"}>March on ${esc(LOCS[S.rival.site].n)} with ${yes.length}<small>About ${travelHours(S.player.loc,S.rival.site)} hours away. Your strength against theirs: ${Math.round(2+yes.reduce((a,o)=>a+1.5+o.p.sk.fight*.8,0))} vs ${Math.round(rivalStr())}.</small></button>
   <button class="opt" data-act="nowar">Not now</button>`)}
ACTS.march=()=>{$("modal").classList.remove("open");UI.modal=null;S.flags.battle=true;const yes=UI.war.filter(o=>o.r.yes).map(o=>o.p);for(const p of yes){if(p.loc!==S.player.loc){p.loc=S.player.loc;p.x=S.player.x;p.z=S.player.z;p.away=null}p.follow=true}travelTo(S.rival.site)};
ACTS.nowar=()=>{for(const o of UI.war)if(o.r.yes)o.p.follow=false;closeModal()};
function battleCard(){const r=battle();openModal(`<h2>${r.won?"You won":"You lost"}</h2>${r.beats.map(b=>`<p>${esc(b)}</p>`).join("")}<button class="opt pri" data-act="modalclose">Go on</button>`);if(!r.won)setTimeout(()=>{if(S.camp)travelTo(S.camp.site)},400);renderAll()}
// ---------- the world map ----------
function openMap(){if(!S)return;const pl=S.player;UI.mapSel=UI.mapSel||null;const cur=pl.loc;
  const node=(k,L)=>{const pl2=place(k);const isCamp=k===campK();const riv=S.rival&&!S.rival.gone&&S.rival.site===k;const c=isCamp?"#e8a050":riv?"#e06a50":pl2.burned?"#5a5450":pl2.seen?"#cfc8b8":"#8a857a";
    return`<g data-act="mapsel" data-k="${k}" style="cursor:pointer"><circle cx="${L.mx}" cy="${L.mz}" r="${isCamp?4.2:3}" fill="${c}" stroke="${k===cur?"#fff":"#1a1a1a"}" stroke-width="${k===cur?1.2:.6}"/>${isCamp?`<text x="${L.mx}" y="${L.mz+1.3}" text-anchor="middle" font-size="4" fill="#1a1208">★</text>`:""}
     <text x="${L.mx}" y="${L.mz-5}" text-anchor="middle" font-size="4.2" fill="${c}" font-family="JetBrains Mono,monospace">${esc(L.n)}${riv?" (Pruitts)":""}${pl2.burned?" (burned)":""}</text></g>`};
  const river=[];for(let x=-100;x<=100;x+=5)river.push(`${x},${riverZ(x)+4}`);
  const sel=UI.mapSel&&LOCS[UI.mapSel]?UI.mapSel:null;const L=sel&&LOCS[sel];const party=withYou();
  const info=sel?`<h3 style="margin:0">${esc(L.n)}</h3><p style="margin:4px 0;font-size:13px">${esc(L.d)}</p><div class="mono mut">${sel===cur?"You're here.":`${travelHours(cur==="road"?"start":cur,sel)} hours on foot · danger ${"●".repeat(Math.min(5,Math.round(danger(sel))))}`}${L.camp!==false&&L.beds?` · ${L.beds} beds`:""}</div>
     ${L.camp!==false&&L.farm?`<div class="mono mut">farming ${L.farm}× · water ${L.water}× · defense ${L.def}× · wood ${L.wood}× · hidden ${L.hide}×</div>`:""}
     <div style="margin-top:8px;font-size:13px">${party.length?`With you: ${esc(listAnd(party.map(p=>p.name)))}.`:"You'd go alone."} ${S.haul.items.length?"You're carrying things.":""}</div>
     ${sel!==cur?`<button class="pri" style="margin-top:8px" data-act="travel" data-k="${sel}">Go to ${esc(L.n)}</button>`:""}`:`<p class="mut" style="font-size:13px">Click a place to see it. Whoever's following you comes along.</p>`;
  openModal(`<button class="x" data-act="modalclose">×</button><h2>Map</h2><svg viewBox="-100 -75 200 150" style="width:100%;background:#2a3424;border-radius:8px;display:block">
     <polyline points="${river.join(" ")}" fill="none" stroke="#3a6a8a" stroke-width="4" opacity=".8"/>
     <line x1="-100" y1="8" x2="100" y2="8" stroke="#55534e" stroke-width="2"/><line x1="6" y1="-75" x2="6" y2="75" stroke="#55534e" stroke-width="1.4"/>
     <rect x="18" y="-62" width="46" height="34" fill="#3a3a36" opacity=".55" rx="2"/><text x="41" y="-24" text-anchor="middle" font-size="4" fill="#8a857a">MILLBROOK</text>
     <circle cx="56" cy="48" r="16" fill="#1e2e1c" opacity=".7"/>
     ${Object.entries(LOCS).map(([k,L])=>node(k,L)).join("")}</svg><div style="margin-top:10px">${info}</div>`,true)}
ACTS.mapsel=d=>{UI.mapSel=d.k;openMap()};ACTS.travel=d=>{closeModal();travelTo(d.k)};
function onTravel(hrs){openModal(`<h2>On the road</h2><p id="trv">Walking...</p><div class="meter"><i id="trvbar" style="width:0%"></i></div>`);UI.modal.travel=true}
function onScene(){if(W.ok)buildScene();closeAll();renderAll();if(S.flags.battle&&S.rival&&S.player.loc===S.rival.site){S.flags.battle=false;setTimeout(battleCard,500)}}
function onStranger(hh){toast(`${hh.length===1?"Someone is":"People are"} coming up the road.`)}
function onDawn(d){if(S.flags.ration&&d>S.flags.ration)S.flags.ration=0}
// ---------- looting ----------
function openLoot(c){const k=S.player.loc;if(!LOCS[k]||!c)return;const st=rollCont(k,c.id);UI.loot={cid:c.id,k};renderLoot()}
function closeLoot(){UI.loot=null;ACTS.closeside()}
function dest(){return S.player.loc===campK()?null:haul()}
function renderLoot(){if(!UI.loot)return;const st=contState(UI.loot.k,UI.loot.cid);const c=layout(UI.loot.k).conts.find(c=>c.id===UI.loot.cid);const d=dest();
  openSide("loot",`<h2>${esc(CONT[c.k].n)}</h2>${st.c.items.length?"":`<p class="mut">Empty.</p>`}${gridHtml(st.c,"cont")}
   <div class="btns">${st.c.items.length?`<button class="pri" data-act="takeall">Take everything that fits</button>`:""}</div>
   <h3>${d?"What you're carrying":"Camp stores"}</h3>${d?gridHtml(d,"haul"):`<p class="mut" style="font-size:13px">You're at camp: what you take goes straight into the stores.</p>`}<p class="mut" style="font-size:12px">Click a block to move it across. Drag to put it somewhere. ${d?"More people with you means more room.":""}</p>`);UI.side="loot"}
ACTS.takeall=()=>{const st=contState(UI.loot.k,UI.loot.cid);const d=dest();const guns=[];for(const o of [...st.c.items]){if(d)gMove(st.c,d,o);else{st.c.items.splice(st.c.items.indexOf(o),1);addLoot({[RES[o.k]?o.k:"i:"+o.k]:o.n});if(GUNS[o.k])guns.push(o.k)}}armUp(false,guns);renderLoot();renderHud();save()};
ACTS.gclick=d=>{if(UI.drag?.moved)return;const which=d.g;const u=+d.u;
  if(UI.loot&&(which==="cont"||which==="haul")){const st=contState(UI.loot.k,UI.loot.cid);const ds=dest();const from=which==="cont"?st.c:ds;const to=which==="cont"?ds:st.c;const o=from.items.find(o=>o.u===u);if(!o)return;
    if(!to){from.items.splice(from.items.indexOf(o),1);addLoot({[RES[o.k]?o.k:"i:"+o.k]:o.n})}else if(!gMove(from,to,o))toast("No room.");if(which==="cont")armUp(false,!to&&GUNS[o.k]?[o.k]:[]);renderLoot();renderHud();save();return}
  if(which==="camp"){const o=S.inv.items.find(o=>o.u===u);if(o)itemMenu(o)}};
// ---------- grids ----------
const CELL=31;
function gridHtml(c,which){const [gw,gh]=c.g;return`<div class="grid" data-grid="${which}" style="position:relative;width:${gw*CELL}px;max-width:100%;height:${gh*CELL}px;background:repeating-linear-gradient(0deg,var(--line) 0 1px,transparent 1px ${CELL}px),repeating-linear-gradient(90deg,var(--line) 0 1px,transparent 1px ${CELL}px);border:1px solid var(--line2);border-radius:4px;touch-action:none">
  ${c.items.map(o=>{const [w,h]=gsz(o);const kd=kindOf(o.k);const own=which==="camp"&&o.owner?P(o.owner):null;const by=which==="camp"&&o.by?P(o.by):null;
    return`<div data-act="gclick" data-g="${which}" data-u="${o.u}" data-drag="1" title="${esc(invNameOf(o.k))}${o.n>1?" ×"+o.n:""}${own?" · "+esc(own.name)+"'s":""}${by?" · "+esc(by.name)+" is using it":""}" style="position:absolute;left:${o.x*CELL+1}px;top:${o.y*CELL+1}px;width:${w*CELL-2}px;height:${h*CELL-2}px;background:${ICOL[kd]||ICOL.item};border:1px solid ${own?"var(--warn)":"rgba(255,255,255,.18)"};border-radius:3px;font-size:9.5px;line-height:1.1;padding:2px;overflow:hidden;cursor:grab;font-family:var(--f-mono);color:#f0ece4">
      ${esc(shortName(o.k)).slice(0,w*6+1)}${o.n>1?`<span style="position:absolute;right:2px;bottom:1px;font-weight:600">${o.n}</span>`:""}${own?`<span style="position:absolute;left:2px;bottom:1px">🔒</span>`:by?`<span style="position:absolute;left:2px;bottom:1px">✋</span>`:""}</div>`}).join("")}</div>`}
function gridOf(which){if(which==="camp")return S.inv;if(which==="haul")return haul();if(which==="cont"&&UI.loot)return contState(UI.loot.k,UI.loot.cid).c;return null}
function initDrag(){document.addEventListener("pointerdown",e=>{const el=e.target.closest("[data-drag]");if(!el)return;UI.drag={el,g:el.dataset.g,u:+el.dataset.u,x:e.clientX,y:e.clientY,moved:false,ox:el.offsetLeft,oy:el.offsetTop,rot:0};el.setPointerCapture?.(e.pointerId)});
  document.addEventListener("pointermove",e=>{const d=UI.drag;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.abs(dx)+Math.abs(dy)<5)return;d.moved=true;d.el.style.left=(d.ox+dx)+"px";d.el.style.top=(d.oy+dy)+"px";d.el.style.zIndex=5;d.el.style.opacity=.85});
  document.addEventListener("keydown",e=>{if(UI.drag&&UI.drag.moved&&e.key.toLowerCase()==="r"){UI.drag.rot^=1;const w=UI.drag.el.style.width;UI.drag.el.style.width=UI.drag.el.style.height;UI.drag.el.style.height=w}});
  document.addEventListener("pointerup",e=>{const d=UI.drag;if(!d)return;setTimeout(()=>{UI.drag=null},0);if(!d.moved)return;
    const from=gridOf(d.g);const o=from&&from.items.find(o=>o.u===d.u);const tgtEl=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.dataset&&x.dataset.grid);
    if(o&&tgtEl){const to=gridOf(tgtEl.dataset.grid);const r=tgtEl.getBoundingClientRect();const [w,h]=gsz(o);const rot=d.rot?(o.r^1):o.r;const cw=rot!==o.r?h:w;
      const x=Math.round((e.clientX-r.left)/CELL-cw/2),y=Math.round((e.clientY-r.top)/CELL-(rot!==o.r?w:h)/2);
      if(to&&from!==to&&(d.g==="camp"||tgtEl.dataset.grid==="camp"))toast("Use the loot screen to move things into or out of camp stores.");
      else if(to&&!gMove(from,to,o,x,y,rot))toast("It doesn't fit there.")}
    if(UI.side==="loot")renderLoot();else if(UI.side==="stores")openStores();save()})}
// ---------- stores and crafting ----------
function openStores(){if(!S)return;syncInv();const c=S.inv;const sl=(S.storeLog||[]).slice(-8).reverse();
  openSide("stores",`<h2>Stores</h2><div class="mut" style="font-size:12.5px">Everything the camp owns. Anyone can use it, but people leave alone what someone else needs to live (🔒). ✋ means someone's using it today. ${invFree()} empty blocks${bldDone("shed").length?"":"; a storehouse adds more"}.</div>
   ${S.player.gun?`<div style="font-size:13px;margin:6px 0">You carry the ${esc(ITEMS[S.player.gun])}, ${S.player.rounds||0} rounds.${S.player.loc===campK()?` <button data-act="gunstow">Leave it for the guards</button>`:""}</div>`:""}
   ${gridHtml(c,"camp")}
   <h3>Make something</h3><div class="mut" style="font-size:12.5px">Say what you do with what's here. ${aiReady()?"Claude judges whether it would really work.":"The built-in recipes decide."}</div>
   <div style="display:flex;gap:5px;margin-top:5px"><input id="craftin" placeholder="tie the rope into a fishing net" autocomplete="off"><button class="pri" data-act="craftgo">Try</button></div>
   ${S.crafted.length?`<h3>Things you've made</h3><div style="font-size:13px">${S.crafted.map(c=>`<div>· ${esc(c.n)} <span class="mut">(${esc(USES[c.use]||"")})</span></div>`).join("")}</div>`:""}
   ${sl.length?`<h3>Who took what</h3><div style="font-size:13px">${sl.map(l=>`<div class="${l.k==="bad"?"bad":""}">· ${esc(l.x)}</div>`).join("")}</div>`:""}`);
  const ci=$("craftin");if(ci)ci.addEventListener("keydown",e=>{if(e.key==="Enter")ACTS.craftgo()})}
ACTS.craftgo=()=>{const v=$("craftin")?.value.trim();if(!v)return;craft(v).then(()=>openStores())};
function itemMenu(o){const own=o.owner?P(o.owner):null;const r=document.querySelector(`[data-u="${o.u}"][data-g="camp"]`)?.getBoundingClientRect();
  showMenu(`<div class="h">${esc(invNameOf(o.k))}${o.n>1?" ×"+o.n:""}<small>${own?`Kept for ${esc(own.name)}.`:"Anyone can use it."}${CONDS_ITEM[o.k]?" Someone may need this to live.":""}</small></div>
    ${GUNS[o.k]&&S.player.gun!==o.k&&S.player.loc===campK()?`<button data-act="guncarry" data-u="${o.u}">Carry it yourself</button>`:""}<button data-act="reserve" data-u="${o.u}">Keep it for someone ▸</button>${own?`<button data-act="unreserve" data-u="${o.u}">Anyone can use it</button>`:""}<button data-act="toss" data-u="${o.u}">Throw it out</button>`,r?r.right:200,r?r.top:200)}
ACTS.reserve=d=>{const o=S.inv.items.find(o=>o.u===+d.u);const m=$("menu");showMenu(`<div class="h">Keep it for</div>${members().map(p=>`<button data-act="resv" data-u="${o.u}" data-id="${p.id}">${esc(p.name)}</button>`).join("")}`,parseFloat(m.style.left),parseFloat(m.style.top))};
ACTS.resv=d=>{const o=S.inv.items.find(o=>o.u===+d.u);for(const q of S.inv.items)if(q.k===o.k)q.owner=d.id;closeMenu();openStores();save()};
ACTS.unreserve=d=>{const o=S.inv.items.find(o=>o.u===+d.u);for(const q of S.inv.items)if(q.k===o.k)q.owner=null;closeMenu();openStores();save()};
ACTS.guncarry=d=>{const o=S.inv.items.find(o=>o.u===+d.u);closeMenu();if(!o||!GUNS[o.k])return;const pl=S.player;
  if(o.by){const p=P(o.by);if(p){p.gun=null;stores(`You took the ${ITEMS[o.k]} from ${p.name}.`)}o.by=null}
  if(pl.gun)giveItem(pl.gun,1);takeItem(o.k,1);pl.gun=o.k;const cap=GUNS[o.k].carry;if((pl.rounds||0)>cap){S.res.ammo+=pl.rounds-cap;pl.rounds=cap}loadUp();syncInv();
  log(`You take the ${ITEMS[o.k]}: ${pl.rounds} rounds.`);openStores();renderHud();save()};
ACTS.gunstow=()=>{const pl=S.player;if(!pl.gun||pl.loc!==campK())return;giveItem(pl.gun,1);S.res.ammo+=pl.rounds||0;log(`You leave the ${ITEMS[pl.gun]} in camp stores for whoever's on guard.`);
  pl.gun=null;pl.rounds=0;syncInv();openStores();renderHud();save()};
ACTS.toss=d=>{const o=S.inv.items.find(o=>o.u===+d.u);closeMenu();if(RES[o.k])S.res[o.k]-=o.n;else if(o.k.startsWith("c:"))S.crafted=S.crafted.filter(c=>"c:"+c.id!==o.k);else takeItem(o.k,o.n);syncInv();openStores();renderHud();save()};
// ---------- building ----------
function openBuild(){if(!S)return;if(S.player.loc==="road")return;
  openSide("build",`<h2>Build</h2><div class="mut" style="font-size:12.5px">Pick something, then click where it goes (R or right-click turns it). Costs come out of camp stores: ${Math.floor(S.res.wood)} wood, ${Math.floor(S.res.scrap)} scrap.</div>
   ${Object.entries(BUILDS).map(([k,B])=>`<div class="row" data-act="bpick" data-k="${k}" style="${canAfford(B.cost)?"":"opacity:.5"}"><div class="n">${B.n} <span class="mut mono">${costWords(B.cost)}</span></div><div class="s">${esc(B.d)}${B.beds?` Sleeps ${B.beds}.`:""}${B.job?` Work: ${JOBS[B.job].n.toLowerCase()}.`:""}</div></div>`).join("")}`)}
ACTS.bpick=d=>{const B=BUILDS[d.k];if(!canAfford(B.cost)){toast(`Not enough: needs ${costWords(B.cost)}.`);return}startPlace(d.k)};
function startPlace(k){if(!BUILDS[k])return;if(!canAfford(BUILDS[k].cost)){toast(`You need ${costWords(BUILDS[k].cost)} for a ${BUILDS[k].n.toLowerCase()}.`);return}ACTS.closeside();const pl=S.player;UI.place={type:k,x:Math.round(pl.x+2),z:Math.round(pl.z-2),rot:0};placeGhost();
  const p=$("place");p.style.display="block";p.innerHTML=`Placing a <b>${BUILDS[k].n.toLowerCase()}</b>. Click to set it down · R turns it · Esc cancels`}
function placeOk(){const P_=UI.place;if(!P_)return false;const B=BUILDS[P_.type];const [w,d]=P_.rot%2?[B.size[1],B.size[0]]:B.size;const x0=P_.x-w/2,x1=P_.x+w/2,z0=P_.z-d/2,z1=P_.z+d/2;
  if(Math.abs(P_.x)>SH-3-w/2||Math.abs(P_.z)>SH-3-d/2)return false;const k=S.player.loc;
  const ov=(a)=>x0<a[2]+.3&&x1>a[0]-.3&&z0<a[3]+.3&&z1>a[1]-.3;if(layout(k).blk.some(ov))return false;
  for(const b of S.blds)if(b.loc===k){const [bw,bd]=bSize(b);if(ov([b.x-bw/2,b.z-bd/2,b.x+bw/2,b.z+bd/2]))return false}
  for(const c of layout(k).conts)if(ov([c.x-1,c.z-1,c.x+1,c.z+1]))return false;return true}
function placeGhost(){if(!UI.place)return;ghost(UI.place.type,UI.place.x,UI.place.z,UI.place.rot,placeOk())}
function cancelPlace(){UI.place=null;ghost(null);$("place").style.display="none"}
function tryPlace(){const P_=UI.place;if(!placeOk()){toast("Can't put it there.");return}const B=BUILDS[P_.type];if(!canAfford(B.cost)){toast("Not enough materials.");cancelPlace();return}
  const opts=Object.entries(B.opts||{});UI.pending={...P_,opt:Object.fromEntries(opts.map(([k,v])=>[k,v[0]]))};cancelPlace();
  openModal(`<h2>${B.n}</h2><p class="mut">${esc(B.d)} Costs ${costWords(B.cost)}.</p>${opts.map(([k,v])=>`<div class="mono mut" style="margin-top:8px">${k.toUpperCase()}</div><div class="seg">${v.map(c=>`<button data-act="bopt" data-k="${k}" data-v="${esc(c)}" class="${UI.pending.opt[k]===c?"on":""}" style="${/^#/.test(c)?`background:${c};width:34px;height:26px`:""}">${/^#/.test(c)?"":esc(c)}</button>`).join("")}</div>`).join("")}
   <div class="mono mut" style="margin-top:8px">NAME</div><input id="bname" value="${esc(B.n)}" maxlength="30">
   <button class="opt pri" data-act="bself" style="margin-top:12px">Build it yourself<small>A quick hands-on build. Done today.</small></button>
   <button class="opt" data-act="bleave">Leave it for the builders<small>${members().some(p=>p.job==="build")?`${listAnd(members().filter(p=>p.job==="build").map(p=>p.name))} will get to it.`:"Nobody's on building yet. Anyone with free time may pitch in."}${S.player.loc!==campK()?" Builders only work at camp.":""}</small></button>
   <button class="opt" data-act="modalclose">Cancel</button>`,true)}
ACTS.bopt=d=>{UI.pending.opt[d.k]=d.v;document.querySelectorAll(`[data-act="bopt"][data-k="${d.k}"]`).forEach(b=>b.classList.toggle("on",b.dataset.v===d.v))};
function commitPending(){const P_=UI.pending;UI.pending=null;const B=BUILDS[P_.type];pay(B.cost);const name=($("bname")?.value||B.n).trim().slice(0,30)||B.n;const b=addBld(P_.type,P_.x,P_.z,{rot:P_.rot,opt:P_.opt,name});log(`You lay out a ${B.n.toLowerCase()}${name!==B.n?` and call it "${name}"`:""}.`);return b}
ACTS.bself=()=>{const b=commitPending();closeModal();approach(b,()=>openMinigame(b))};ACTS.bleave=()=>{commitPending();closeModal();renderAll()};
function renderAll(){renderHud();renderTicker();if(UI.side==="people")openPeople();else if(UI.side==="camp")openCamp();else if(UI.side==="stores")openStores();if(UI.talkTo)renderTalk()}
