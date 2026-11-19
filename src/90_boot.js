
// ================= who you are: the person you wake up as =================
function defaultChar(){return{first:"",last:"",pron:"they/them",age:28,sex:"F",build:"average",hairStyle:"hLong",hair:"brown",beard:false,skin:"#c99873",mark:"",bg:"Nurse",traits:[],household:"alone",story:"",start:"coma",cause:"crash"}}
const BGS={"Nurse":"Medicine","Mechanic":"Making and building","Sheriff's deputy":"Fighting, talking","Line cook":"Survival, talking, making","Teacher":"Talking","Farmhand":"Survival, building","Construction worker":"Building, fighting","College student":"Scavenging, talking","Between jobs":"Scavenging"};
const TRAITS={Charming:"People warm to you faster",Tough:"Better in a fight",Handy:"Better at making and fixing",Resourceful:"Find more when you search",Kind:"Better at patching people up",Outdoorsy:"Better at foraging, hunting and fishing"};
const HOUSEHOLDS={alone:"You live alone",sibling:"Your younger brother or sister",partner:"Your partner",child:"Your kid, 6 to 12",parent:"Your mom or dad",roommate:"A roommate you barely know"};
const BUILDS={average:"Average",slim:"Slim",heavy:"Heavy",tall:"Tall",short:"Short"};
const BUILDW={average:"average build",slim:"slim",heavy:"heavyset",tall:"tall",short:"short"};
const HAIRSTYLES={hShort:"Short",hBuzz:"Buzzed",hLong:"Long",hPony:"Ponytail",hBun:"Bun",none:"Shaved"};
const HAIRW={hShort:"short",hBuzz:"buzzed",hLong:"long",hPony:"tied-back",hBun:"pinned-up"};
const HAIRCOLS=["black","brown","blond","red","gray"];

// a small front view of you that changes as you choose
function dollSvg(c){const F=c.sex==="F";const sk=c.skin||SKINS[3];const hc=HAIRC[c.hair]||HAIRC.brown;const age=parseInt(c.age)||28;
  const top=ITEMS[age>40?"flannel":"hoodie"]?.col||"#6a6e74",pants=ITEMS.jeans?.col||"#3a4a6a",shoes=ITEMS.sneakers?.col||"#d8d4c8";
  const wx=c.build==="heavy"?1.14:c.build==="slim"?.9:1;const s=(F?.95:1)*(c.build==="tall"?1.05:c.build==="short"?.94:1);
  const ol=`stroke="rgba(0,0,0,.38)" stroke-width="1.2" stroke-linejoin="round"`;
  const sh=F?[41,79]:[37,83],wa=F?[47,73]:[45,75],hp=F?[42,78]:[45,75];
  const torso=F?`M${sh[0]},63 Q${sh[0]},58 ${sh[0]+5},58 L${sh[1]-5},58 Q${sh[1]},58 ${sh[1]},63 Q${wa[1]+2},86 ${wa[1]},96 Q${hp[1]},104 ${hp[1]},110 L${hp[0]},110 Q${hp[0]},104 ${wa[0]},96 Q${wa[0]-2},86 ${sh[0]},63 Z`
    :`M${sh[0]},63 Q${sh[0]},58 ${sh[0]+5},58 L${sh[1]-5},58 Q${sh[1]},58 ${sh[1]},63 L${wa[1]},108 L${wa[0]},108 Z`;
  const arm=(x0,dir)=>`<path d="M${x0},${F?62:61} q${dir*-7},3 ${dir*-8},14 l${dir*-1},34 l${dir*8},0 l${dir*1.5},-33 Z" fill="${top}" ${ol}/><circle cx="${x0-dir*5}" cy="${F?114:113}" r="4.6" fill="${sk}" ${ol}/>`;
  const legs=`<path d="M${hp[0]},108 L${hp[1]},108 L${hp[1]-1},196 L${61.5},196 L60,124 L58.5,196 L${hp[0]+1},196 Z" fill="${pants}" ${ol}/>`;
  const feet=`<path d="M${hp[0]-1},196 h${58.5-hp[0]+1} v5 q0,2 -2,2 h${-(58.5-hp[0]-1)} q-3,0 -3,-3 Z" fill="${shoes}" ${ol}/><path d="M61.5,196 h${hp[1]-61.5+1} v4 q0,3 -3,3 h${-(hp[1]-61.5-2)} q-2,0 -2,-2 Z" fill="${shoes}" ${ol}/>`;
  const st=c.hairStyle||"none";
  const cap=st==="hBuzz"?`<path d="M47.6,32 Q47,18.5 60,18.5 Q73,18.5 72.4,32 Q67,25.5 60,25.5 Q53,25.5 47.6,32 Z" fill="${hc}" opacity=".85"/>`
    :`<path d="M46.5,35 Q45,16 60,16 Q75,16 73.5,35 Q71,25 63,23.5 Q55,26 49,27 Q47.5,30 46.5,35 Z" fill="${hc}" ${ol}/>`;
  const back=st==="hLong"?`<path d="M45.5,30 Q44,64 47,74 L73,74 Q76,64 74.5,30 Z" fill="${hc}" ${ol}/>`:st==="hPony"?`<path d="M71,30 q11,4 9,24 q-1,8 -5,10 q1,-14 -6,-26 Z" fill="${hc}" ${ol}/>`:"";
  const bun=st==="hBun"?`<circle cx="60" cy="14.5" r="6.5" fill="${hc}" ${ol}/>`:"";
  const hair=st==="none"?"":back+"";const front=st==="none"?"":cap+bun;
  const beard=!F&&c.beard?`<path d="M48.6,37 Q49,52.5 60,52.5 Q71,52.5 71.4,37 Q68,45 60,44.5 Q52,45 48.6,37 Z" fill="${hc}" ${ol}/>`:"";
  const bust=F?`<path d="M48,76 q6,5.5 11,1 M61,77 q5,4.5 11,-1" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.3" stroke-linecap="round"/>`:"";
  return `<svg viewBox="0 0 120 210" role="img" aria-label="How you look"><defs><linearGradient id="dsh" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs>
  <ellipse cx="60" cy="204" rx="${26*wx}" ry="4" fill="rgba(0,0,0,.35)"/>
  <g transform="translate(60 204) scale(${s.toFixed(3)}) translate(-60 -204)">
   ${hair}
   <g transform="translate(60 0) scale(${wx} 1) translate(-60 0)">${legs}${feet}${arm(sh[0]+2,1)}${arm(sh[1]-2,-1)}<path d="${torso}" fill="${top}" ${ol}/><path d="${torso}" fill="url(#dsh)"/>${bust}</g>
   <rect x="55.5" y="45" width="9" height="15" rx="3" fill="${sk}" ${ol}/>
   <ellipse cx="60" cy="34" rx="12.8" ry="15" fill="${sk}" ${ol}/>
   <ellipse cx="55.2" cy="35" rx="1.3" ry="1.5" fill="#1d1a18"/><ellipse cx="64.8" cy="35" rx="1.3" ry="1.5" fill="#1d1a18"/>
   ${beard}${front}
  </g></svg>`}

function renderCreate(){const root=$("create");if(!root)return;const c=UI.create||(UI.create=defaultChar());const g=$("game");if(g)g.classList.add("creating");root.hidden=false;
  if(UI.loading){const L=UI.loading;root.innerHTML=`<div class="cpanel cload" role="status" aria-live="polite"><div><div class="lbl">While you were asleep</div><h1>TWD</h1><div class="town">Limon · the first week</div></div>
    <p class="lede" id="cload-line">${esc(SLEEP_DAYS[L.day-1])}</p><div class="cbar" aria-hidden="true"><i id="cload-bar" style="width:${Math.round(L.p*100)}%"></i></div><div class="row"><span class="mono mute" id="cload-day">Day ${L.day} of 7</span><button class="btn" data-act="sleepskip">Skip ahead</button></div></div>`;startTitle();return}
  const coma=c.start==="coma";
  const on=(k,v)=>k==="traits"?c.traits.includes(v):String(c[k])===String(v);
  const pk=(k,v,label,sub)=>`<button class="pick${on(k,v)?" on":""}" data-act="cpick" data-v="${k}|${esc(v)}" aria-pressed="${on(k,v)}">${esc(label||v)}${sub?`<br><span class="mono mute" style="font-size:10.5px">${esc(sub)}</span>`:""}</button>`;
  const sw=(k,v,col,label)=>`<button class="pick sw${on(k,v)?" on":""}" data-act="cpick" data-v="${k}|${esc(v)}" aria-label="${esc(label)}" aria-pressed="${on(k,v)}" title="${esc(label)}" style="background:${col}"></button>`;
  const ae=document.activeElement;const fk=ae&&root.contains(ae)?(ae.dataset.c?{c:ae.dataset.c}:ae.dataset.act?{a:ae.dataset.act,v:ae.dataset.v||""}:null):null;
  const old=root.querySelector(".cpanel");const sc=old?old.scrollTop:0;
  root.innerHTML=`<div class="cpanel">
   <div><div class="lbl">An original survival story</div><h1>TWD</h1><div class="town">Limon · ${coma?"day eight":"day one"}</div></div>
   ${UI.oldSave?`<p class="mono mute" role="note">This version rebuilt the town, so your last game can't carry over. It's a fresh start.</p>`:""}
   <p class="lede">${coma?"Three weeks ago something put you in a bed at Limon Hospital, and you haven't woken up since. While you slept, the dead started walking. You open your eyes a week into it. Everyone in this town has a name, a past, people they love and things they hide, and they've been making their own choices without you.":"It's an ordinary Tuesday morning in Limon. By tonight the dead will be walking. Everyone in this town has a name, a past, people they love and things they hide, and they'll make their own choices. So will you."}</p>
   <div class="ctop"><div class="csec" style="border:0;padding:0">
     <div class="fgrid">
      <label class="field"><span class="lbl">First name</span><input data-c="first" value="${esc(c.first)}" maxlength="20" autocomplete="off"></label>
      <label class="field"><span class="lbl">Last name</span><input data-c="last" value="${esc(c.last)}" maxlength="20" autocomplete="off"></label>
     </div>
     <div class="fgrid">
      <label class="field"><span class="lbl">Age (16 to 60)</span><input data-c="age" type="number" min="16" max="60" value="${esc(c.age)}"></label>
      <div class="field"><span class="lbl">Pronouns</span><div class="pickset">${["she/her","he/him","they/them"].map(v=>pk("pron",v)).join("")}</div></div>
     </div>
     <div class="field"><span class="lbl">Body</span><div class="pickset">${pk("sex","F","Female","Can carry a child")}${pk("sex","M","Male","Can father a child")}</div><span class="mono mute">Your body shape, and who you could have a child with. Pronouns are separate.</span></div>
    </div>
    <div class="doll">${dollSvg(c)}<div class="mono mute">${esc(c.first.trim()||"You")}</div></div></div>
   <div class="csec"><div class="lbl" style="color:var(--ember)">How you look</div>
    <div class="field"><span class="lbl">Build</span><div class="pickset">${Object.entries(BUILDS).map(([k,n])=>pk("build",k,n)).join("")}</div></div>
    <div class="field"><span class="lbl">Hair</span><div class="pickset">${Object.entries(HAIRSTYLES).map(([k,n])=>pk("hairStyle",k,n)).join("")}</div></div>
    <div class="fgrid">
     ${c.hairStyle!=="none"||c.sex==="M"&&c.beard?`<div class="field"><span class="lbl">Hair color</span><div class="pickset">${HAIRCOLS.map(k=>sw("hair",k,HAIRC[k],cap(k)+" hair")).join("")}</div></div>`:""}
     <div class="field"><span class="lbl">Skin</span><div class="pickset">${SKINS.map((v,i)=>sw("skin",v,v,"Skin tone "+(i+1))).join("")}</div></div>
     ${c.sex==="M"?`<div class="field"><span class="lbl">Beard</span><div class="pickset">${pk("beard",false,"None")}${pk("beard",true,"Beard")}</div></div>`:""}
    </div>
    <label class="field"><span class="lbl">Something people notice</span><input data-c="mark" value="${esc(c.mark)}" maxlength="60" placeholder="a scar through one eyebrow"></label>
   </div>
   <div class="csec"><div class="lbl" style="color:var(--ember)">Who you were</div>
    <div class="field"><span class="lbl">Before all this</span><div class="pickset">${Object.entries(BGS).map(([k,s])=>pk("bg",k,k,s)).join("")}</div></div>
    <div class="field"><span class="lbl">Two things about you (${c.traits.length} of 2)</span><div class="pickset">${Object.entries(TRAITS).map(([k,s])=>pk("traits",k,k,s)).join("")}</div></div>
   </div>
   <div class="csec"><div class="lbl" style="color:var(--ember)">How it starts</div>
    <div class="field"><span class="lbl">Where you open your eyes</span><div class="pickset">${pk("start","coma","In a hospital bed","Out of a coma, a week after it began")}${pk("start","home","At home","Day one, the morning it all starts")}</div></div>
    ${coma?`<div class="field"><span class="lbl">What put you there</span><div class="pickset">${Object.entries(COMA_CAUSES).map(([k,C])=>pk("cause",k,C.n,C.sub)).join("")}</div></div>`:""}
    <div class="field"><span class="lbl">${coma?"Who you live with":"At home with you"}</span><div class="pickset">${Object.entries(HOUSEHOLDS).map(([k,s])=>pk("household",k,cap(k),s)).join("")}</div></div>
    <label class="field"><span class="lbl">Your story, if you want one</span><textarea data-c="story" rows="3" maxlength="400" placeholder="Who were you before? Who are you looking for?">${esc(c.story)}</textarea></label>
   </div>
   ${UI.cerr?`<p class="neg mono" role="alert">${esc(UI.cerr)}</p>`:""}
   <div class="cgo"><button class="btn pri" data-act="begin">Wake up<small>${coma?"Day 8, early morning":"Day 1, 7:00 in the morning"}</small></button>${S?'<button class="btn" data-act="cancelnew">Back to my game</button>':""}</div>
   <p class="mono mute cnote" id="cai">${esc(typeof aiHelpText==="function"?aiHelpText():"")}</p>
  </div>`;
  const np=root.querySelector(".cpanel");if(np)np.scrollTop=sc;
  if(fk){const el=fk.c?root.querySelector(`[data-c="${fk.c}"]`):[...root.querySelectorAll("[data-act]")].find(x=>x.dataset.act===fk.a&&(x.dataset.v||"")===fk.v);if(el)el.focus({preventScroll:true})}
  startTitle()}

function onCreateAct(a,v,el,e){
  if(a==="cpick"){const c=UI.create;if(!c)return true;const i=v.indexOf("|");const k=v.slice(0,i),val=v.slice(i+1);
    if(k==="traits"){if(c.traits.includes(val))c.traits=c.traits.filter(x=>x!==val);else{c.traits.push(val);if(c.traits.length>2)c.traits.shift()}}
    else if(k==="beard")c.beard=val==="true";
    else if(k==="sex"){const was=c.sex;c.sex=val;if(c.hairStyle===(was==="F"?"hLong":"hShort"))c.hairStyle=val==="F"?"hLong":"hShort";if(val==="F")c.beard=false}
    else c[k]=val;
    UI.cerr="";renderCreate();return true}
  if(a==="begin"){begin();return true}
  if(a==="sleepskip"){if(UI.loading)UI.loading.skip=true;return true}
  if(a==="cancelnew"){if(S){UI.create=null;render()}return true}
  return false}

function begin(){const c=UI.create;if(!c||UI.loading)return;const first=c.first.trim(),last=c.last.trim();
  if(!first){UI.cerr="Give yourself a name.";renderCreate();return}
  if(c.traits.length<2){UI.cerr="Pick two things about you.";renderCreate();return}
  UI.cerr="";const age=clamp(parseInt(c.age)||28,16,60);
  const hairLook=c.hairStyle==="none"?"a shaved head":`${HAIRW[c.hairStyle]||"short"} ${c.hair} hair`;
  const look=`${BUILDW[c.build]||"average build"}, ${hairLook}${c.sex==="M"&&c.beard?", a beard":""}`;
  const coma=c.start==="coma";
  newWorld({name:(first+" "+last).trim(),pron:c.pron,sex:c.sex,age,look,mark:c.mark.trim(),bg:c.bg,traits:[...c.traits],story:c.story.trim(),household:c.household,hair:c.hair,skin:c.skin,hairStyle:c.hairStyle,beard:c.beard,build:c.build,start:c.start,cause:c.cause});
  if(c.story.trim())journal(`Before all this: ${c.story.trim()}`,"");
  UI.panel=null;UI.open=null;UI.talkTo=null;UI.draft="";UI.paused=false;UI.speed=1;UI.peopleSel=null;UI.oldSave=false;UI.modal=null;
  if(!coma){UI.modal={type:"help"};enterWorld();return}
  // the first week happens while you sleep; show it passing, then wake
  UI.loading={p:0,day:1,sim:0,done:false,skip:false,t0:performance.now()};renderCreate();
  sleepThrough(p=>{if(UI.loading)UI.loading.sim=p},()=>{if(UI.loading)UI.loading.done=true});setTimeout(sleepTick,80)}
// the week runs as fast as the page can; the lines about it go by slowly enough to read, unless you skip
const SLEEP_PER=1400;
function sleepTick(){const L=UI.loading;if(!L)return;const shown=L.skip?L.sim:Math.min(L.sim,(performance.now()-L.t0)/(SLEEP_PER*7));
  L.p=shown;const d=clamp(Math.floor(shown*7)+1,1,7);const bar=$("cload-bar");if(bar)bar.style.width=Math.round(shown*100)+"%";
  if(d!==L.day){L.day=d;const el=$("cload-line"),n=$("cload-day");if(el)el.textContent=SLEEP_DAYS[d-1];if(n)n.textContent=`Day ${d} of 7`}
  if(L.done&&(L.skip||shown>=1)){L.finishing=true;setTimeout(()=>{if(UI.loading!==L)return;comaWake();UI.loading=null;enterWorld()},L.skip?0:700);return}
  setTimeout(sleepTick,60)}
function enterWorld(){UI.create=null;w3reset();save();render()}

// ================= the town at dawn, behind the first screen =================
const TITLE={on:false,t0:0};
function startTitle(){if(TITLE.on||!W3.ok)return;TITLE.on=true;TITLE.t0=performance.now();titleLight();requestAnimationFrame(titleLoop)}
function titleLight(){const h=7.5;const d=dayLight(h);const az=clamp((h-5.5)/15,0,1)*Math.PI;W3.sunDir.set(Math.cos(az)*.85,.55+Math.sin(az)*.9,.42+(1-Math.sin(az))*.2).normalize();
  W3.sun.color.copy(CC("#fff1d6")).lerp(CC("#ffb070"),(1-d)*.8);W3.sun.intensity=.35+.95*d;W3.hemi.intensity=.18+.5*d;W3.hemi.color.copy(CC("#dfe8f0"));
  W3.scene.background=CC("#05080d").clone().lerp(CC(SKY.clear),d);W3.scene.fog=null;if(W3.precip){W3.scene.remove(W3.precip.pts);W3.precip=null}W3.wx=null;
  for(const L of [W3.spot,W3.plight,W3.room,W3.fireLight])if(L)L.intensity=0;
  for(const k in FIG.P)FIG.P[k].count=0;for(const o of W3.bm.values()){o.cut=0;o.target=0;o.settled=false}animCutaway(1)}
function titleLoop(ts){if(!UI.create||!W3.ok){TITLE.on=false;return}requestAnimationFrame(titleLoop);if(document.hidden)return;
  const t=(ts-TITLE.t0)/1000;const a=1.1+t*.016;const cx=46+Math.cos(a)*20,cz=-4+Math.sin(a)*16;
  const panel=document.querySelector("#create .cpanel");const pw=panel&&W3.rw>900?panel.getBoundingClientRect().right:0;
  const asp=W3.rw/Math.max(1,W3.rh);const vh=38;const vw=vh*asp;const off=pw/Math.max(1,W3.rw)*vw/2;
  const tx=cx-off*.7071,tz=cz+off*.7071;const C=W3.cam;C.left=-vw/2;C.right=vw/2;C.top=vh/2;C.bottom=-vh/2;C.updateProjectionMatrix();C.position.set(tx+30,34,tz+30);C.lookAt(tx,0,tz);
  const L=W3.sun;const sz=L.shadow.camera.right-L.shadow.camera.left;const tex=sz/L.shadow.mapSize.x;const fx=Math.round(tx/tex)*tex,fz=Math.round(tz/tex)*tex;
  L.target.position.set(fx,0,fz);L.position.set(fx+W3.sunDir.x*60,W3.sunDir.y*60,fz+W3.sunDir.z*60);L.target.updateMatrixWorld();
  W3.ren.render(W3.scene,W3.cam)}

// ================= starting up =================
function fixNext(){let m=0;const sc=s=>{const n=parseInt(String(s).replace(/^\D+/,""));if(n>m)m=n};for(const p of S.people)sc(p.id);for(const z of S.zeds)sc(z.id);NEXT=m+1}
function boot(){buildInteriors();buildCollision();layout();initWorldView($("world"));W3.mini=$("mini");aiInit();
  const s=loadSave();
  if(s&&s.v===4&&s.player&&Array.isArray(s.people)&&!s.player.coma){S=s;reindex();fixNext();UI.create=null;w3reset();if(S.player.alive===false)UI.modal={type:"dead"}}
  else{S=null;UI.create=defaultChar();try{UI.oldSave=!s&&!!localStorage.getItem(OLD_SAVE_KEY)}catch(e){UI.oldSave=false}}
  render();requestAnimationFrame(frame)}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&S&&!UI.create)save()});addEventListener("pagehide",()=>{if(S&&!UI.create)save()});
// keep progress when a new version of the page arrives while it's open
let booted=false;const start=()=>{if(booted)return;booted=true;boot()};
try{window.claude?.hot?.snapshot?.(()=>{try{if(S&&!UI.create)save()}catch(e){}return {}})}catch(e){}
try{if(window.claude?.hot?.ready){window.claude.hot.ready(start);setTimeout(start,2500)}else start()}catch(e){start()}
</script>
