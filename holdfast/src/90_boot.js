// ================= starting up =================
const CREATE={name:"",sex:"F",skin:LOOK.skin[1],hair:LOOK.hair[1],top:LOOK.top[10],pants:LOOK.pants[0]};
function titleScreen(){const s=loadSave();const t=$("title");t.style.display="flex";
  const sw=(k,L)=>`<div class="seg">${L.map(c=>`<button data-act="cr" data-k="${k}" data-v="${c}" class="${CREATE[k]===c?"on":""}" style="background:${c};width:30px;height:26px;padding:0"></button>`).join("")}</div>`;
  t.innerHTML=`<div class="card"><h1>Holdfast</h1><div class="sub">The first morning of the end of the world. Find a place, take people in, and hold it.</div>
   ${s?`<button class="opt pri" data-act="continue">Continue<small>Day ${dayOf(s.t)}${s.camp?` at ${esc(s.camp.n)}, ${s.people.filter(p=>p.status==="member").length+1} people`:", no camp yet"}</small></button><div class="mono mut" style="margin:12px 0 4px">OR START OVER</div>`:""}
   <label>Your name</label><input id="crname" maxlength="20" placeholder="Alex" value="${esc(CREATE.name)}">
   <label>You are</label><div class="seg"><button data-act="cr" data-k="sex" data-v="F" class="${CREATE.sex==="F"?"on":""}">A woman</button><button data-act="cr" data-k="sex" data-v="M" class="${CREATE.sex==="M"?"on":""}">A man</button></div>
   <label>Skin</label>${sw("skin",LOOK.skin)}<label>Hair</label>${sw("hair",LOOK.hair)}<label>Jacket</label>${sw("top",LOOK.top.slice(0,8))}
   <button class="opt pri" data-act="start" style="margin-top:16px">${s?"Start a new game":"Start"}<small>${s?"Your current camp will be gone.":"Day one, on the highway outside Millbrook."}</small></button>
   ${hadOldSave()?`<p class="mut" style="font-size:12px">This is a new game, separate from TWD. Saves from that game don't carry over.</p>`:""}</div>`}
ACTS.cr=d=>{CREATE.name=$("crname")?.value||CREATE.name;CREATE[d.k]=d.v;titleScreen()};
ACTS.continue=()=>{S=loadSave();if(!S)return;$("title").style.display="none";begin()};
ACTS.start=()=>{const name=($("crname")?.value||"").trim()||(CREATE.sex==="F"?"Sam":"Alex");if(loadSave()&&!UI.sure){UI.sure=true;toast("Your saved camp will be lost. Click Start again to confirm.");return}
  wipeSave();newGame({name,sex:CREATE.sex,look:{skin:CREATE.skin,hair:CREATE.hair,top:CREATE.top,pants:CREATE.pants,long:CREATE.sex==="F"}});$("title").style.display="none";begin();
  openModal(`<h2>Day one</h2><p>The highway has been stopped for an hour. Then the screaming started up the line, and the people who got out of their cars didn't all get back in.</p>
   <p>${esc(listAnd(S.people.map(p=>p.name)))} ended up with you, behind a jackknifed truck. Nobody's coming. You'll have to find somewhere to hold.</p>
   <p class="mut">Click the ground to walk. Click a car to search it. Click people to talk or give orders. Or just type what you do. Open the map with M when you're ready to go.</p>
   <button class="opt pri" data-act="modalclose">Begin</button>`,true)};
function begin(){syncInv();if(W.ok)buildScene();renderAll();save();setTimeout(nextCard,600)}
let last=0,hudT=0,trvT=0;
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;
  try{if(S){if(S.flags.traveling){trvT+=dt;if(trvT>.28){trvT=0;const T=S.flags.traveling;const done=travelTick();const bar=$("trvbar");if(bar&&T)bar.style.width=clamp((S.t-T.start)/(T.hrs*HOUR)*100,0,100)+"%";const tx=$("trv");if(tx&&T)tx.textContent=`Walking to ${LOCS[T.to].n}. ${clockStr(S.t)}.`;
        if(done){$("modal").classList.remove("open");UI.modal=null;setTimeout(nextCard,400)}}}
    else if(!UI.paused&&!UI.modal&&!$("build").classList.contains("open")&&$("title").style.display==="none"){let mins=dt*CLOCK*UI.speed;while(mins>0){const d=Math.min(mins,5);step(d);mins-=d}}
    if(W.ok)renderWorld(dt,now);renderLabels(now);hudT+=dt;if(hudT>.3){hudT=0;renderHud();if(UI.side==="people"&&!document.activeElement?.closest?.("#side"))openPeople()}}}catch(err){console.error(err)}
  requestAnimationFrame(frame)}
function boot(){aiInit();initWorld($("gl"));initInput();initDrag();titleScreen();requestAnimationFrame(t=>{last=t;frame(t)})}
// when a new version is published while you're playing, save first so the reload picks up where you were
try{window.claude?.hot?.snapshot?.(()=>{try{if(S)save()}catch(e){}return{}})}catch(e){}
let booted=false;const start=()=>{if(booted)return;booted=true;boot()};
try{if(window.claude?.hot?.ready){window.claude.hot.ready(start);setTimeout(start,2500)}else start()}catch(e){start()}
</script>
