
// ================= the screen: one view of the world, with everything else laid over it =================
function typing(){const a=document.activeElement;return!!a&&a!==document.body&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.tagName==="SELECT")}
function toast(msg){let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)}el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3800)}
function markUI(){UI.dirty=true}
function markHud(){UI.hudDirty=true}
const $=id=>document.getElementById(id);
function layout(){if($("game"))return;$app.innerHTML=`<div id="game">
  <div id="world"></div>
  <div id="hudtl" class="hud"></div>
  <div id="hudtr" class="hud"><canvas id="mini" width="200" height="150" aria-label="Map of the area around you" role="img"></canvas><div id="ctrls"></div></div>
  <div id="log" class="hud" aria-live="polite"></div>
  <div id="vitals" class="hud"></div>
  <div id="bar" class="hud"></div>
  <aside id="panel" hidden></aside>
  <section id="talk" hidden aria-label="Conversation"></section>
  <div id="modal"></div>
</div><div id="create" hidden></div>`;
  const root=$("game");root.addEventListener("click",onClickUI);root.addEventListener("submit",e=>{e.preventDefault();onForm(e.target.dataset.form,e.target)});
  root.addEventListener("input",onInputUI);root.addEventListener("change",onChangeUI);
  $("create").addEventListener("click",onClickUI);$("create").addEventListener("input",onInputUI);}
function render(){if(UI.create||!S){if(typeof renderCreate==="function")renderCreate();return}
  $("create").hidden=true;$("game").classList.remove("creating");$("game").classList.toggle("dead",S.player.alive===false);
  hud();renderBar();renderLog();if(!UI.drag)renderPanel();renderTalk();renderModal();UI.dirty=false}
function hud(){if(!S||UI.create)return;const tl=$("hudtl"),v=$("vitals"),c=$("ctrls");if(tl)tl.innerHTML=clockHtml();if(v)v.innerHTML=vitalsHtml();if(c)c.innerHTML=ctrlsHtml();UI.hudDirty=false}

// ---------- the corners: time, place, how you're doing ----------
function wxWord(){return{clear:"Clear",overcast:"Overcast",rain:"Rain",snow:"Snow",fog:"Fog"}[wxName()]||"Clear"}
function clockHtml(){const pl=S.player;const inB=bldAt(pl.x,pl.z);const r=roomAt(pl.x,pl.z);const zc=S.zeds.filter(z=>Math.abs(z.x-pl.x)<14&&Math.abs(z.z-pl.z)<14&&dist(z.x,z.z,pl.x,pl.z)<14).length;
  return `<div class="clk"><b>${esc(stamp(S.t))}</b> <span class="mute">${wxWord()}, ${temp()}°C</span></div>
  <div class="where">${esc(inB?inB.n:PLACES[here()].n)}${r?`<span class="mute"> · ${esc(ROOMNAME[inB.rooms[r.ri].t]||"")}</span>`:""}</div>
  ${zc?`<div class="warn mono">${zc===1?"One of the dead is":zc+" of the dead are"} close.</div>`:""}${UI.paused?'<div class="warn mono">Paused</div>':W3.pausedNow&&UI.talkTo?'<div class="mute mono">Time stops while you talk</div>':""}`}
function vitalsHtml(){const pl=S.player;const v=(n,val,k)=>`<div class="vital ${val<25?"low":val<50?"mid":""}" title="${n} ${Math.round(val)}"><span class="lbl">${n}</span><div class="bar"><i style="width:${Math.round(clamp(val,0,100))}%"></i></div></div>`;
  const w=weight(),m=maxW();
  return `<button class="vbtn" data-act="panel" data-v="health" title="Your body (H)" aria-label="Your body: health ${Math.round(pl.hp)}">${v("Health",pl.hp)}</button>`+v("Food",pl.food)+v("Water",pl.water)+v("Warmth",pl.warmth)+v("Energy",pl.energy)+
  `<div class="load mono ${w>m?"neg":"mute"}">${w.toFixed(1)} / ${m.toFixed(0)} kg${lightOn()?" · light on":""}</div>${condsHtml()}`}
function condsHtml(){const pl=S.player;const c=[];const b=bleedTotal();if(b>.03)c.push(b>.6?"Bleeding badly":"Bleeding");if(pl.bitten)c.push("Bitten");
  const im=infMax();if(pl.sick)c.push(im>=40?"Infected":"Sick");else if(im>=30)c.push("Wound turning");
  for(const w of wounds())if(w.k==="fracture"&&!c.includes(woundName(w)))c.push(woundName(w));
  const pn=painNow();if(pn>60)c.push("Agony");else if(pn>30)c.push("In pain");
  if(pl.preg)c.push("Pregnant");if(weight()>maxW())c.push("Overloaded");
  return c.length?`<div class="conds">${c.map(x=>`<button class="cond" data-act="panel" data-v="health" title="See where you're hurt (H)">${esc(x)}</button>`).join("")}</div>`:""}
function ctrlsHtml(){return `<button data-act="speed" data-v="pause" class="${UI.paused?"on":""}" aria-pressed="${UI.paused}" title="Pause (P)">${UI.paused?"▶":"❚❚"}</button>${[1,2,4,8].map(s=>`<button data-act="speed" data-v="${s}" class="${UI.speed===s&&!UI.paused?"on":""}" aria-label="Speed ${s}x">${s}x</button>`).join("")}<button data-act="zoom" data-v="out" aria-label="Zoom out">−</button><button data-act="zoom" data-v="in" aria-label="Zoom in">+</button><button data-act="help" aria-label="How to play">?</button>`}
function renderLog(){const el=$("log");if(!el)return;const now=S.t;const L=S.journal.slice(0,4).filter(j=>now-j.t<180);el.innerHTML=L.reverse().map(j=>`<div class="entry ${j.k}">${esc(j.x)}</div>`).join("")}

// ---------- the bar along the bottom: what you can do here, and your panels ----------
const PANELS=[["inv","Inventory","Tab"],["health","Health","H"],["craft","Make","C"],["group","Group","G"],["people","People","N"],["journal","Journal","J"],["map","Map","M"]];
function renderBar(){const el=$("bar");if(!el)return;if(S.player.alive===false){el.innerHTML="";return}const A=actionsHere();const asks=S.people.filter(q=>q.alive&&q.met&&q.want).length;
  el.innerHTML=`<div class="acts">${A.map(a=>`<button class="act${a.pri?" pri":""}" data-act="do" data-v="${a.id}"${a.dis?" disabled":""} title="${esc(a.dis||a.s||"")}">${esc(a.t)}<small>${esc(a.dis||a.s||"")}</small></button>`).join("")}</div>
  <div class="tabs">${PANELS.map(([k,n,key])=>`<button class="tab${UI.panel===k?" on":""}" data-act="panel" data-v="${k}" aria-pressed="${UI.panel===k}">${n}${k==="people"&&asks?` <span class="warn">${asks}</span>`:""}<small>${key}</small></button>`).join("")}</div>`}
function nearRiver(){const z=S.player.z;return z>37.5&&z<56.5&&!bldAt(S.player.x,S.player.z)}
function sleepSafe(){const pl=S.player;if(atHome())return 2;if(pl.hutTile&&here()===pl.hutTile.site)return 2;const b=bldAt(pl.x,pl.z);if(!b)return 0;
  const shut=b.exits.every(d=>!d.door||(!doorOpen(d.door)));const boarded=b.exits.some(d=>d.door&&d.door.bar>0);if(b.id===pl.home)return shut?2:1;if(residentsHome(b).length&&!(b.doors.some(d=>(d.welcome||0)>S.t)))return 0;return shut?(boarded?2:1):1}
function bestFood(){const inv=invMap();return Object.keys(inv).filter(k=>ITEMS[k].eat).sort((a,b)=>(ITEMS[a].eat.sick?1:0)-(ITEMS[b].eat.sick?1:0)||ITEMS[b].eat.food-ITEMS[a].eat.food)[0]}
function bestDrink(){const inv=invMap();return Object.keys(inv).filter(k=>ITEMS[k].drink&&k!=="whiskey").sort((a,b)=>(ITEMS[a].sick?1:0)-(ITEMS[b].sick?1:0))[0]}
function actionsHere(){const pl=S.player;const r=here();const A=[];const add=(id,t,s,dis,pri)=>A.push({id,t,s,dis,pri});const g=myGroup();const inB=bldAt(pl.x,pl.z);
  const zn=zedNear(7)?"The dead are too close":null;const theirs=PLACES[r].site&&ownerOf(r)&&ownerOf(r).id!==pl.group;
  if(!inB){if(["woods","lodge","fields","farm","wilds","hills","church","mill","school"].includes(r)&&!theirs)add("forage","Forage","1 hour",zn);
    if(["woods","lodge","mill","hills"].includes(r)&&!theirs)add("chop",hasTool("axe")?"Chop wood":"Gather deadfall",hasTool("axe")?"1.5 hours":"1 hour",zn);
    if(["woods","lodge","hills","fields"].includes(r))add("hunt","Hunt",weapon()?"3 hours":"Needs a weapon",zn||(weapon()?null:"You need a weapon"));
    if(nearRiver()){add("fish","Fish","2 hours"+(invHas("rope")?"":" · rope helps"),zn);if(invHas("empty_bottle"))add("fill","Fill bottles",`${invCount("empty_bottle")} empty`);add("drinkriver","Drink from the river","Might make you sick")}
    if(["hills","quarry"].includes(r)&&!theirs)add("stone","Gather stone","1 hour",zn);
    const fireOn=pl.fire&&pl.fire.until>S.t;if(!inRiver(pl.x,pl.z)&&!fireOn&&!(atHome()&&siteHas(r,"firepit"))){const ok=invHas("lighter")&&invHas("wood",2);add("fire","Make a fire",ok?"Lighter, 2 wood":"Needs a lighter and 2 wood",ok?null:"Needs a lighter and 2 wood")}}
  if(atHome()){add("chores","Do chores","2 hours",zn);const s=S.sites[g.home];if(s.build.length)add("build","Help build",`2 hours · ${BLD[s.build[0].b].n.toLowerCase()}`,zn);if(g.stock.food>=1&&pl.food<80)add("campeat","Eat from the stores",`${Math.floor(g.stock.food)} food left`)}
  if(g&&g.leader==="you"&&!g.home&&PLACES[r].site&&!ownerOf(r))add("settle","Settle here",`Make this ${g.name}'s camp`,null,true);
  if(!g&&S.flags.alarm&&PLACES[r].site&&!ownerOf(r))add("settle","Start a camp here",S.people.some(isFollower)?"You and the people with you":"Claim it",null,true);
  const food=bestFood(),drink=bestDrink();
  if(food&&pl.food<85)add("eat",`Eat ${(ITEMS[food].sn||ITEMS[food].n).toLowerCase()}`,`Food +${ITEMS[food].eat.food}`);
  if(drink&&pl.water<90)add("drink",`Drink ${(ITEMS[drink].sn||ITEMS[drink].n).toLowerCase()}`,`Water +${ITEMS[drink].drink}`);
  {const w=worstBleeder();if(w&&haveFor(DRESSINGS).length)add("bandage","Bandage",`Your ${w.at}`,zn,true);
   else if(wounds().some(w=>!w.band&&!WOUND[w.k].closed&&w.k!=="scratch"||w.band&&w.band.d>.7||w.k==="fracture"&&!w.spl))add("treat","Tend your wounds","Health screen")}
  if((pl.sick||infMax()>=30)&&invHas("antibiotics"))add("meds","Antibiotics",pl.sick?"Fights the fever":"Fights the infection");
  add("rest","Rest","1 hour",zedNear(6)?"Not with the dead this close":null);
  const s=sleepSafe();add("sleep","Sleep",s===2?"Safe here":s===1?"Mostly safe":"Risky out here",zedNear(14)?"Not with the dead this close":null);
  if(nearPeople(10).filter(p=>p.age>=6&&!isFollower(p)).length>=2)add("listen","Listen in","Hear what they say");
  return A}

// ---------- doing things ----------
function doAction(id){const pl=S.player;if(pl.alive===false)return;
  switch(id){
    case"forage":case"chop":case"hunt":case"fish":case"stone":gather(id);break;
    case"fill":{const n=invCount("empty_bottle");if(!n)return;invTake("empty_bottle",n);invAdd("river_water",n);act(5);journal(`You fill ${n} bottle${n>1?"s":""} with river water. Boil it before you trust it.`);break}
    case"drinkriver":act(5);pl.water=clamp(pl.water+30,0,100);if(rf()<.25){pl.sick=1;journal("You drink from the river. An hour later your stomach knots up. You're sick.","bad")}else journal("You kneel at the bank and drink. It tastes like mud and iron.");break;
    case"fire":if(!invHas("lighter")||!invHas("wood",2))return;invTake("wood",2);pl.fire={x:pl.x+Math.sin(W3.ang)*1.3,z:pl.z+Math.cos(W3.ang)*1.3,until:S.t+240};act(10);journal("You get a fire going. Warmth, light, and a way to cook. Also a way to be seen.");noise(pl.x,pl.z,12);break;
    case"chores":chores();break;
    case"build":helpBuild();break;
    case"campeat":{const g=myGroup();if(!g||g.stock.food<1)return;g.stock.food-=1;pl.food=clamp(pl.food+30,0,100);if(g.stock.water>=1){g.stock.water-=1;pl.water=clamp(pl.water+30,0,100)}act(15);journal("You eat with whoever's around the fire.");for(const p of shuffle(members(g.id).filter(p=>p.age>=12&&dist(p.x,p.z,pl.x,pl.z)<20)).slice(0,2))p.aff=clamp(p.aff+1,-100,100);break}
    case"settle":settle();break;
    case"eat":useItem(bestFood());return;
    case"drink":useItem(bestDrink());return;
    case"bandage":{const w=worstBleeder();if(w)openTreat("wrap",w.id);else openPanel("health");return}
    case"treat":openPanel("health");return;
    case"meds":takeAntibiotics();advance(2);break;
    case"rest":act(60,{sleep:true});journal("You sit and rest for an hour.");break;
    case"sleep":sleep();break;
    case"listen":listenIn();return;
  }
  save();render()}
const VERB={forage:"You forage for an hour",chop:"You work the deadfall",hunt:"You hunt for three hours",fish:"You fish the slow water for two hours",stone:"You pry loose some stone"};
function gather(kind){const pl=S.player;const r=here();const sv=pl.sk.survive;const got={};const g=(id,n)=>{n=Math.round(n);if(n>0){invAdd(id,n);got[id]=(got[id]||0)+n}};let mins=60;
  if(kind==="forage"){if(!S.flags.winter)g("berries",rnd(0,2)+Math.floor(sv/3)+(r==="woods"||r==="fields"?1:0));if(rf()<.45+sv*.04)g("herbs",rnd(1,2));if((r==="woods"||r==="lodge")&&rf()<.5)g("wood",1);skillUp("survive",.08)}
  if(kind==="chop"){const ax=hasTool("axe");mins=ax?90:60;g("wood",ax?rnd(2,4)+Math.floor(pl.sk.build/4):rnd(0,2));if(ax)wearTool("axe",2);skillUp("build",.05)}
  if(kind==="hunt"){mins=180;const w=weapon();const it=w?ITEMS[w.id]:null;if(!it)return;const p=.22+sv*.06+(it.gun?.25:it.reach?.12:.05);if(it.gun&&invHas("ammo"))invTake("ammo");if(rf()<p){g("raw_meat",rnd(1,3));if(rf()<.4)g("cloth",1)}wearWeapon(2);skillUp("survive",.15)}
  if(kind==="fish"){mins=120;const p=.3+sv*.05+(invHas("rope")?.15:0)+(weapon()&&ITEMS[weapon().id].reach?.1:0);let n=0;for(let i=0;i<3;i++)if(rf()<p)n++;g("raw_fish",n);skillUp("survive",.1)}
  if(kind==="stone"){g("stone",rnd(1,3)+(r==="quarry"?1:0));skillUp("build",.03)}
  act(mins,{work:true});if(pl.alive===false)return;
  const list=Object.entries(got).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:""));const txt=list.length?`${VERB[kind]}: ${list.join(", ")}.`:`${VERB[kind]}. Nothing to show for it.`;
  journal(txt,list.length?"good":"");toast(txt);if(weight()>maxW())setTimeout(()=>toast("You're carrying too much. You'll move slowly until you drop something."),1800)}
function sleep(){const pl=S.player;if(zedNear(14)){toast("Not with the dead this close.");return}const safe=sleepSafe();const h=hourOf(S.t);
  let mins;if(h>=8&&h<19)mins=240;else{mins=((7-h+24)%24)*60-(S.t%60);if(mins<=0)mins+=DAY;mins=clamp(mins,120,600)}
  S.woke=null;advance(mins,{sleep:true,safe:safe>0});if(pl.alive===false)return;afterJump(mins);
  let visit=false;if(safe<2&&rf()<(safe===1?.1:.38)+Math.min(.3,zedsIn(here())/60)){visit=true;const n=rnd(1,safe===1?1:3);for(let i=0;i<n;i++){const a=rf()*6.28,d=rnd(6,10);const x=pl.x+Math.cos(a)*d,z=pl.z+Math.sin(a)*d;if(free(x,z,.4,"zed")){spawnZed(x,z);const zz=S.zeds[S.zeds.length-1];zz.st="hunt";zz.tx=pl.x;zz.tz=pl.z}}}
  const P2=pl.partner&&P(pl.partner);if(P2&&P2.alive&&dist(P2.x,P2.z,pl.x,pl.z)<10){P2.aff=clamp(P2.aff+2,-100,100);if(rf()<.25)mem(P2,`Fell asleep next to ${pl.name}. First good sleep in days.`,3)}
  const txt=visit?"Something wakes you: shuffling, close by. The dead found you in the dark.":S.woke?`You wake early. ${{thirst:"Your mouth is dry as sand.",hunger:"Your stomach won't let you sleep.",cold:"You're shaking with cold.",pain:"The pain wakes you.",blood:"You wake up sticky and light-headed. You're still bleeding."}[S.woke]}`:h>=8&&h<19?"You nap for a few hours.":safe===2?"You sleep. Actually sleep. For a few hours you forget.":safe===1?"You sleep behind a shut door, waking at every sound.":"You sleep badly in the open, one ear awake all night.";
  journal(txt,visit?"bad":"");if(visit)toast("The dead found you while you slept.")}
function chores(){const g=myGroup();const pl=S.player;act(120,{work:true});g.stock.food+=.8;g.stock.wood+=.6;g.stock.water+=.5;const ms=shuffle(members(g.id).filter(p=>p.age>=12)).slice(0,3);
  for(const p of ms){p.trust=clamp(p.trust+2,-100,100);p.aff=clamp(p.aff+1,-100,100);p.met=true;if(rf()<.4)mem(p,`${pl.name} pitched in with the work today.`,2)}skillUp("survive",.05);
  journal(`You haul water and split wood${ms.length?" with "+ms.map(p=>p.name).join(", "):""}. Nobody says much, but they notice.`,"good")}
function helpBuild(){const g=myGroup();const s=S.sites[g.home];const site=s.build.find(x=>x.by==="you")||s.build[0];if(!site)return;act(120,{work:true});site.prog+=3+S.player.sk.build*.8;skillUp("build",.12);
  const name=BLD[site.b].n.toLowerCase();if(site.prog>=BLD[site.b].work)finishSite(g.home,site);else journal(`You work on the ${name}. It's ${Math.round(site.prog/BLD[site.b].work*100)}% done.`);
  for(const p of members(g.id).filter(p=>p.role==="builder"))p.trust=clamp(p.trust+2,-100,100)}
function settle(){let g=myGroup();const k=here();if(ownerOf(k))return;const pl=S.player;
  if(!g){g=newGroup(`${pl.name.split(" ")[0]}'s people`,"you",null);pl.group=g.id;for(const q of S.people.filter(isFollower))joinGroup(q,g.id,true);news(`${pl.name} has started a group of their own.`,"big");UI.afterSettle=true}
  if(g.leader!=="you")return;g.home=k;for(const p of members(g.id)){p.follow=false;placeTo(p,randIn(k,3))}assignRoles(g);
  news(`${g.name} has settled at ${PLACES[k].n}.`,"big");journal(`You've claimed ${PLACES[k].n} for ${g.name}. Plan what gets built from the Group panel.`,"big");UI.panel="group";if(UI.afterSettle){UI.afterSettle=false;UI.modal={type:"name_group"}}}
function listenIn(){const ps=nearPeople(10).filter(p=>p.age>=6&&!isFollower(p));if(ps.length<2)return;const a=pick(ps);const rest=ps.filter(q=>q!==a);const b=rest.find(q=>a.partner===q.id)||rest.sort((x,y)=>Math.abs(relGet(a,y))-Math.abs(relGet(a,x)))[0];
  const lines=overhear(a,b);advance(10);UI.modal={type:"result",title:"Overheard",text:lines.join("\n")};save();render()}
function orphan(p){if(!p.alive||p.age>=16||p.age<2||S.player.kids.includes(p.id))return false;return!p.parents.some(id=>{const q=id==="you"?S.player:P(id);return q&&q.alive!==false})}
function adopt(pid){const p=P(pid);const pl=S.player;if(!p||!orphan(p))return;pl.kids.push(p.id);p.parents.push("you");p.fam.you="guardian";pl.fam[p.id]="kid";p.trust=clamp(p.trust+25,-100,100);p.aff=clamp(p.aff+30,-100,100);
  mem(p,`${pl.name} said I could stay with them. For good.`,10);if(pl.group){if(p.group!==pl.group)joinGroup(p,pl.group,true)}else{p.group=null;p.follow=true}
  news(`${pl.name} took in ${p.name}.`,"good",[p.id]);journal(`${p.name} is yours to look after now. ${p.age<10?"They hold your hand and don't let go.":"They pretend not to care. They care."}`,"big")}
function radioLine(){const d=dayOf(S.t);if(d<=2)return"The emergency broadcast repeats: stay indoors, do not approach the sick.";if(d<=4)return"The radio talks about the evacuation center at Ashby. Then it cuts out.";
  return pick(["Static. Then, for a moment, a woman's voice reading numbers. Then static.","Static. You crank it until your arm aches. Nothing.","A man's voice, very calm: \"...if you can hear this, you are not alone...\" Then nothing.","Somebody playing a guitar, badly, for about a minute. Then it's gone."])}

// ---------- the side panel ----------
function openPanel(k){if(UI.panel===k&&k!=="inv"){UI.panel=null}else{UI.panel=k}if(UI.panel!=="health")UI.treat=null;if(k!=="inv")UI.open=null;if(UI.talkTo&&UI.panel)closeTalk(true);render();if(UI.panel==="map")drawBigMap()}
function closePanel(){if(!UI.panel)return false;UI.panel=null;UI.open=null;UI.treat=null;render();return true}
function renderPanel(){const el=$("panel");if(!el)return;if(!UI.panel||S.player.alive===false){el.hidden=true;el.innerHTML="";return}
  const keep={};for(const x of el.querySelectorAll("[data-keep]"))keep[x.dataset.keep]=x.scrollTop;
  const name={inv:"Inventory",health:"Your body",craft:"Make things",group:"Group",people:"People",journal:"Journal",map:"Map"}[UI.panel];
  const body=UI.panel==="inv"?(typeof invPanelHtml==="function"?invPanelHtml():""):UI.panel==="health"?(typeof healthHtml==="function"?healthHtml():""):UI.panel==="craft"?craftHtml():UI.panel==="group"?groupHtml():UI.panel==="people"?peopleHtml():UI.panel==="journal"?journalHtml():mapHtml();
  el.hidden=false;el.className="panel p-"+UI.panel;W3.panelW=0;el.innerHTML=`<header><h2>${name}</h2><button class="x" data-act="closepanel" aria-label="Close">×</button></header><div class="pbody" data-keep="pbody">${body}</div>`;
  for(const x of el.querySelectorAll("[data-keep]"))if(keep[x.dataset.keep]!=null)x.scrollTop=keep[x.dataset.keep];
  W3.panelW=el.offsetWidth+14;if(UI.panel==="map")drawBigMap();if(UI.panel==="inv"&&typeof invAfterRender==="function")invAfterRender();if(UI.panel==="health"&&typeof healthAfterRender==="function")healthAfterRender()}

// making things
function canCraft(r){for(const [k,v] of Object.entries(r.need))if(!invHas(k,v))return`Missing ${ITEMS[k].n.toLowerCase()}`;if(r.tool&&!hasTool(r.tool))return`Needs a ${r.tool}`;if(r.at==="fire"&&!nearFire())return"Needs a fire";return true}
function craft(id){const r=RECIPES.find(x=>(x.key||x.id)===id);if(!r||canCraft(r)!==true)return;for(const [k,v] of Object.entries(r.need))invTake(k,v);act(r.h*60,{work:true});invAdd(r.id);skillUp("craft",.1);journal(r.key==="boil_bandage"?"You boil the bandage in a can over the fire and hang it to dry. Clean enough.":`You make: ${ITEMS[r.id].n.toLowerCase()}.`,"good");save();render()}
function gearStats(id){const it=ITEMS[id];const s=[];if(it.dmg)s.push(`damage ${it.dmg}`);if(it.gun)s.push("loud");if(it.reach)s.push("long reach");if(it.warm)s.push(`warmth ${it.warm}`);if(it.armor)s.push(`armor ${it.armor}`);if(it.grid)s.push(`holds ${it.grid[0]}×${it.grid[1]}`);return s.join(" · ")}
function craftHtml(){const fire=nearFire();return `<p class="mute">Making things takes time. Some recipes need a tool or a fire.${fire?' <span class="pos">There\'s a fire here.</span>':""}</p><div class="cards">${RECIPES.map(r=>{const it=ITEMS[r.id];const ok=canCraft(r);
  return `<div class="card"><div class="row">${typeof itemIcon==="function"?itemIcon(r.id,32):""}<b>${esc(r.verb||it.n)}</b></div><div class="mono mute">${Object.entries(r.need).map(([k,v])=>`${esc(ITEMS[k].n)} ×${v}`).join(", ")}${r.tool?` · a ${r.tool}`:""}${r.at?" · a fire":""} · ${r.h<1?Math.round(r.h*60)+" min":r.h+" h"}</div>${gearStats(r.id)?`<div class="mono mute">${gearStats(r.id)}</div>`:""}<button class="btn${ok===true?" pri":""}" data-act="craft" data-v="${r.key||r.id}"${ok===true?"":" disabled"}>Make it<small>${ok===true?"Ready":esc(ok)}</small></button></div>`}).join("")}</div>`}

// journal and the map
function journalHtml(){const F=S.flags;const tip=(F.wake?S.t-F.wake<300:dayOf(S.t)===1&&hourOf(S.t)<12)?`<div class="card"><b>Getting started</b><div class="mute">Walk with WASD or by clicking the ground. Click a person to talk. Press E to open doors and search furniture, Space to fight. Tab opens your inventory. One real second is one minute here, and time stops while you talk.</div></div>`:"";
  return `${tip}<div class="lbl">What's happened to you</div><div class="journal">${S.journal.map(j=>`<div class="entry ${j.k}"><div class="mono">${stamp(j.t)}</div>${esc(j.x)}</div>`).join("")}</div>
  <div class="lbl" style="margin-top:14px">Around Limon</div><div class="journal">${(()=>{const L=S.news.filter(n=>!F.wake||n.t>=F.wake).slice(0,60);return L.length?L.map(n=>`<div class="entry ${n.k}"><div class="mono">${stamp(n.t)}</div>${esc(n.x)}</div>`).join(""):`<div class="entry mute">You slept through the first week. Whatever happened in Limon, you'll have to hear it from someone.</div>`})()}</div>`}
function mapHtml(){const gs=Object.values(S.groups).filter(o=>!o.dead&&groupSize(o.id)>0);
  return `<p class="mono mute">Click the map to walk there. Orange is you and your house, green is people with you, red is the dead nearby.</p><canvas id="bigmap" data-act="mapclick" role="img" aria-label="Map of Limon"></canvas>
  <div class="cards">${gs.map(o=>`<div class="card"><b><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</b><div class="mono mute">${o.home?esc(PLACES[o.home].n):"on the move"} · ${groupSize(o.id)} people</div></div>`).join("")}${freeSites().length?`<div class="card"><b>Unclaimed camps</b><div class="mute">${freeSites().map(k=>esc(PLACES[k].n)).join(", ")}</div></div>`:""}</div>`}
function drawBigMap(){const c=$("bigmap");if(!c)return;const r=c.getBoundingClientRect();if(r.width<10)return;const dpr=Math.min(2,devicePixelRatio||1);const w=Math.round(r.width*dpr),h=Math.round(r.width/((WB.x1-WB.x0)/(WB.z1-WB.z0))*dpr);if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;c.style.height=(h/dpr)+"px";drawMap(c,{big:true,dpr})}
function mapClick(e,c){const r=c.getBoundingClientRect();const x=WB.x0+(e.clientX-r.left)/r.width*(WB.x1-WB.x0),z=WB.z0+(e.clientY-r.top)/r.height*(WB.z1-WB.z0);walkTo(x,z);UI.panel=null;toast(`Walking toward ${PLACES[regionAt(x,z)].n}. WASD to stop.`);render()}

// people
function tierWord(t){return{hostile:"hates you",cold:"cold toward you",neutral:"doesn't know you well",friendly:"likes you",close:"close to you"}[t]||""}
function wantSummary(p){const w=p.want;if(!w)return"";if(w.type==="fetch")return `Bring ${w.qty>1?w.qty+" × ":""}${ITEMS[w.item].n.toLowerCase()}.`;if(w.type==="find")return `Find their ${p.fam[w.about]||"family"}, ${P(w.about)?.name||"someone"}, and tell them where ${p.name} is.`;if(w.type==="mercy")return `Put their ${p.fam[w.about]||"loved one"}, ${P(w.about)?.name||"someone"}, to rest.`;return w.text}
function peopleHtml(){const f=UI.peopleFilter;
  return `<div class="row"><div class="chips">${[["known","Known"],["group","Group"],["family","Family"],["lost","Lost"]].map(([k,n])=>`<button class="chip${f===k?" on":""}" data-act="pfilter" data-v="${k}" aria-pressed="${f===k}">${n}</button>`).join("")}</div><input id="pq" placeholder="Search by name" value="${esc(UI.peopleQ)}" aria-label="Search people"></div>
  ${UI.peopleSel&&P(UI.peopleSel)?profileHtml(P(UI.peopleSel)):""}<div id="plist">${peopleListHtml()}</div>`}
function peopleListHtml(){const pl=S.player;const f=UI.peopleFilter;const q=UI.peopleQ.trim().toLowerCase();
  let ps=S.people.filter(p=>p.met||pl.fam[p.id]);
  if(f==="group")ps=pl.group?S.people.filter(p=>p.alive&&p.group===pl.group):[];
  if(f==="family")ps=S.people.filter(p=>pl.fam[p.id]||p.partner==="you");
  const alive=p=>p.alive||!pKnown(p);
  if(f==="known")ps=ps.filter(alive);
  if(f==="lost")ps=ps.filter(p=>!alive(p));
  if(q)ps=ps.filter(p=>fullName(p).toLowerCase().includes(q));
  ps.sort((a,b)=>feel(b)-feel(a));
  if(!ps.length)return `<p class="mute">${f==="group"&&!pl.group?"You're not in a group.":f==="lost"?"You haven't lost anyone you know. Yet.":"Nobody here yet. Go and meet people."}</p>`;
  return `<table><thead><tr><th>Name</th><th>Feels</th><th>Where</th></tr></thead><tbody>${ps.slice(0,90).map(p=>`<tr class="click" data-act="person" data-v="${p.id}"><td>${esc(fullName(p))} <span class="mute mono">${p.age}</span>${pl.fam[p.id]?` <span class="tag">${esc(pl.fam[p.id])}</span>`:""}${p.partner==="you"&&pl.fam[p.id]!=="partner"?' <span class="tag">partner</span>':""}${p.want&&p.alive&&p.met?' <span class="tag warn">asked you</span>':""}<div class="mute small">${pKnown(p)&&p.group&&G(p.group)?esc(G(p.group).name):""}</div></td><td class="${alive(p)?(feel(p)>20?"pos":feel(p)<-10?"neg":"mute"):"mute"}">${alive(p)?tierWord(tier(p)):esc(p.status==="turned"?"turned":p.status==="left"?"left town":"dead")}</td><td class="mute">${!pKnown(p)?"not seen since you woke":p.alive?esc(isFollower(p)?"with you":whereShort(p)):""}</td></tr>`).join("")}</tbody></table>`}
function whereShort(p){const b=bldAt(p.x,p.z);return b?b.n:PLACES[regionAt(p.x,p.z)]?.n||""}
function profileHtml(p){const pl=S.player;const kn=pKnown(p);const g=kn&&p.group?G(p.group):null;const fam=famList(p).filter(([q])=>q.id!=="you");const mems=p.mem.filter(m=>m.a==="you"&&(kn||m.d<=1)).slice(-5).reverse();const open=feel(p)>25||p.fam.you;
  const sees=p.alive&&kn&&(isFollower(p)||(p.pseen||-1e9)>=S.t-10);const needs=[(p.hunger??80)<30&&"hungry",(p.thirst??80)<30&&"thirsty",(p.rest??80)<25&&"worn out",(p.fear||0)>60&&"scared",(p.health??100)<50&&"hurt"].filter(Boolean);
  const meter=(n,v)=>`<div class="meter"><span>${n}</span><div class="track"><i style="left:${v<0?50+v/2:50}%;width:${Math.abs(v)/2}%;background:${v<0?"var(--blood)":"var(--lichen)"}"></i></div><span>${Math.round(v)}</span></div>`;
  return `<div class="card profile"><div class="row" style="justify-content:space-between"><div><h3>${esc(fullName(p))}</h3><div class="mono mute">${p.age} · ${esc(JOBS[p.job]?.n||"")}${g?` · ${esc(g.name)}${p.role?" ("+esc(ROLES[p.role].n.toLowerCase())+")":""}`:""}${!kn?" · not seen since you woke":p.alive?"":" · "+esc(p.status==="turned"?"turned":p.status==="left"?"left town":"dead")}</div></div><button class="x" data-act="person" data-v="" aria-label="Close profile">×</button></div>
   <div class="mute">${esc(cap(p.look||""))}. ${esc(cap(traitWords(p.tr).join(", ")))}.${p.style!=="kid"&&STYLES[p.style]?" Talks "+esc(STYLES[p.style])+".":""}</div>
   ${p.alive||!kn?meter("Trust",p.trust)+meter("Warmth",p.aff):""}
   ${open||p.told?.who?`<div><span class="lbl">From</span> ${esc(p.facts.from)}${open?` · <span class="lbl">Misses</span> ${esc(p.facts.likes)}`:""}</div>`:""}
   ${open?`<div><span class="lbl">Afraid of</span> ${esc(p.facts.fear)} · <span class="lbl">Hopes for</span> ${esc(p.facts.hope)}</div>`:""}
   ${p.told?.secret?`<div><span class="lbl">Told you</span> "${esc(p.facts.secret)}"</div>`:""}
   ${sees?`<div><span class="lbl">Right now</span> ${esc(cap(p.act||"around"))}${needs.length?` · <span class="warn">${esc(needs.join(", "))}</span>`:""}</div>`:""}
   ${p.partner?`<div><span class="lbl">With</span> ${p.partner==="you"?"you":esc(P(p.partner)?.name||"someone")}</div>`:""}
   ${fam.length?`<div><span class="lbl">Family</span> ${fam.map(([q,r])=>`${esc(r)} ${esc(q.name)}${q.alive?"":" ("+(q.status==="turned"?"turned":q.status==="left"?"gone":"dead")+")"}`).join(", ")}</div>`:""}
   ${p.want&&p.alive&&p.met?`<div class="warn"><span class="lbl">Asked you</span> ${esc(wantSummary(p))}</div>`:""}
   ${mems.length?`<div><div class="lbl">What they remember about you</div>${mems.map(m=>`<div class="entry ${m.v>0?"good":m.v<0?"bad":""}"><div class="mono">Day ${m.d}</div>${esc(m.x)}</div>`).join("")}</div>`:""}
   ${p.alive&&orphan(p)&&p.met?`<button class="btn" data-act="adopt" data-v="${p.id}">Take in ${esc(p.name)}<small>${esc(p.name)} has nobody left</small></button>`:""}
   ${p.alive&&kn&&!isFollower(p)?`<button class="btn" data-act="walkto" data-v="${p.id}">Go to ${esc(p.met?p.name:"them")}<small>${esc(whereShort(p))}</small></button>`:""}</div>`}

// your group
function groupHtml(){const pl=S.player;const g=myGroup();if(!g)return noGroupHtml();
  const lead=g.leader==="you";const L=lead?null:P(g.leader);const home=g.home;
  let h=`<div class="row" style="justify-content:space-between"><div><h3>${esc(g.name)}</h3><div class="mono mute">${home?esc(PLACES[home].n):"No camp yet: your people travel with you"} · ${groupSize(g.id)===1?"1 person":groupSize(g.id)+" people"} · led by ${lead?"you":esc(L?fullName(L):"nobody")}</div></div>${lead?`<button class="tag" data-act="renamegroup">Rename</button>`:""}</div>`;
  if(lead&&!home)h+=`<p class="warn">Find a free camp and choose "Settle here" when you're standing in it. Free right now: ${freeSites().map(k=>esc(PLACES[k].n)).join(", ")||"none. Every site is taken."}</p>`;
  h+=`<div><div class="lbl">Stores</div><table><tbody><tr>${STOCK_KEYS.map(k=>`<th>${k}</th>`).join("")}</tr><tr>${STOCK_KEYS.map(k=>`<td class="num">${Math.floor(g.stock[k])}</td>`).join("")}</tr></tbody></table>
    <div class="mono mute">Defense ${defense(g.id)} · ${g.pol.ration==="half"?"half rations":"full meals"}${g.fever&&!g.feverCured?' · <span class="neg">fever in camp</span>':""}${home&&!atHome()?" · go back to camp to use the stores":""}</div></div>`;
  if(atHome())h+=storeHtml(g);if(home)h+=siteHtml(g,lead);if(lead)h+=policyHtml(g);
  h+=membersHtml(g,lead)+relationsHtml(g);
  h+=`<button class="btn" data-act="leavegroup">Leave ${esc(g.name)}<small>Your family comes with you</small></button>`;return h}
function storeHtml(g){const inv=invMap();const dep=Object.entries(inv).filter(([k])=>DEPOSIT[k]);
  return `<div class="card"><div class="lbl">Put in the stores</div>${dep.length?`<div class="chips">${dep.map(([k,n])=>`<button class="chip" data-act="deposit" data-v="${k}">${esc(ITEMS[k].n)} ×${n}</button>`).join("")}<button class="chip" data-act="depositall">All of it</button></div>`:'<span class="mute">Nothing you carry goes in the stores.</span>'}
  <div class="lbl">Take from the stores</div><div class="chips">${Object.entries(WITHDRAW).map(([k,[it,c]])=>`<button class="chip" data-act="withdraw" data-v="${k}"${g.stock[k]>=c?"":" disabled"}>${esc(ITEMS[it].n)} <span class="mute">(${c} ${k})</span></button>`).join("")}</div></div>`}
function siteHtml(g,lead){const k=g.home;const s=S.sites[k];const ss=PLACES[k].site;const sel=UI.buildSel;
  const grid=`<div class="lotgrid" style="grid-template-columns:repeat(${ss.gw},minmax(0,1fr))">${s.grid.map((c,i)=>{const b=s.build.find(x=>x.tile===i);const on=UI.tileSel===i?" sel":"";
    if(c)return `<button class="tile b${on}" data-act="tile" data-v="${i}" style="background:${BLD[c.b].c}" title="${esc(BLD[c.b].n)}" aria-label="${esc(BLD[c.b].n)}">${BLD[c.b].ab}</button>`;
    if(b)return `<button class="tile site${on}" data-act="tile" data-v="${i}" title="${esc(BLD[b.b].n)}, being built" aria-label="${esc(BLD[b.b].n)}, being built">${BLD[b.b].ab}<span class="pg" style="width:${Math.round(Math.min(1,b.prog/BLD[b.b].work)*100)}%"></span></button>`;
    return `<button class="tile${on}" data-act="tile" data-v="${i}" aria-label="Empty lot"></button>`}).join("")}</div>`;
  const opts=Object.entries(BLD).filter(([b,d])=>lead||d.own);
  const palette=`<div class="chips">${opts.map(([b,d])=>{const can=lead?canAfford(g,d.cost):Object.entries(d.cost).every(([kk,v])=>invHas(kk,v));return `<button class="chip${sel===b?" on":""}" data-act="bsel" data-v="${b}" aria-pressed="${sel===b}"><span class="dot" style="background:${d.c}"></span>${esc(d.n)} <span class="mute small">${Object.entries(d.cost).map(([kk,v])=>v+" "+kk).join(", ")}</span>${can?"":' <span class="neg small">short</span>'}</button>`}).join("")}</div>`;
  let info="";if(UI.tileSel!=null){const c=s.grid[UI.tileSel];const b=s.build.find(x=>x.tile===UI.tileSel);
    if(c)info=`<div class="card"><b>${esc(BLD[c.b].n)}</b><div class="mute">${esc(BLD[c.b].d)}${c.by==="you"?" You built this.":""}</div>${lead?`<button class="btn" data-act="demolish" data-v="${UI.tileSel}">Tear it down<small>Half the materials come back</small></button>`:""}</div>`;
    else if(b)info=`<div class="card"><b>${esc(BLD[b.b].n)}</b><div class="mute">${Math.round(Math.min(1,b.prog/BLD[b.b].work)*100)}% built. The builders work on it every day, and you can help.</div>${lead?`<button class="btn" data-act="cancelbuild" data-v="${UI.tileSel}">Call it off<small>The materials come back</small></button>`:""}</div>`}
  return `<div><div class="lbl">The camp at ${esc(PLACES[k].n)}</div>${grid}<div class="mono mute">Beds for ${siteHousing(k)} · ${groupSize(g.id)===1?"1 person":groupSize(g.id)+" people"}. ${lead?"Pick something to build, then click an empty lot.":"You can put up a shelter of your own with your own materials."}</div>${palette}${sel?`<p class="mono warn">${esc(BLD[sel].n)}: ${esc(BLD[sel].d)} Now click an empty lot.</p>`:""}${info}</div>`}
function policyHtml(g){const sel=(k,opts)=>`<select data-sel="pol" data-k="${k}">${opts.map(([v,n])=>`<option value="${v}"${(g.pol[k]||"")===v?" selected":""}>${n}</option>`).join("")}</select>`;
  return `<div class="card"><div class="lbl">Your orders</div><div class="fgrid"><label class="field"><span class="lbl">Meals</span>${sel("ration",[["normal","Full meals"],["half","Half rations"]])}</label><label class="field"><span class="lbl">Focus</span>${sel("focus",[["balanced","Balanced"],["food","Food first"],["build","Building first"]])}</label><label class="field"><span class="lbl">Toward other groups</span>${sel("stance",[["friendly","Friendly"],["neutral","Wary"],["hostile","Take what we need"]])}</label><label class="field"><span class="lbl">What gets built</span>${sel("auto",[["","I decide"],["1","They can decide too"]])}</label></div></div>`}
function membersHtml(g,lead){const pl=S.player;const ms=members(g.id).sort((a,b)=>(b.age>=16)-(a.age>=16)||a.name.localeCompare(b.name));
  return `<div><div class="lbl">People</div><table><thead><tr><th>Name</th><th>Job</th><th>Health</th><th>Mood</th>${lead?"<th></th>":""}</tr></thead><tbody>${ms.map(p=>`<tr><td class="click" data-act="person" data-v="${p.id}">${esc(p.name)} <span class="mute mono">${p.age}</span>${p.id===g.leader?' <span class="tag">leader</span>':""}${pl.fam[p.id]?` <span class="tag">${esc(pl.fam[p.id])}</span>`:""}<div class="mute small">${esc(isFollower(p)?"with you":p.act||"")}</div></td>
   <td>${lead&&p.age>=12?`<select data-sel="role" data-v="${p.id}" aria-label="Job for ${esc(p.name)}">${Object.entries(ROLES).filter(([r])=>r!=="kid"&&r!=="elder").map(([r,d])=>`<option value="${r}"${p.role===r?" selected":""}>${d.n}</option>`).join("")}</select>`:esc(ROLES[p.role]?.n||"")}</td>
   <td class="num ${p.health<45?"neg":""}">${Math.round(p.health)}</td><td class="num ${p.mood<30?"neg":""}">${Math.round(p.mood)}</td>${lead?`<td>${p.id!==g.leader?`<button class="tag" data-act="kick" data-v="${p.id}">Send away</button>`:""}</td>`:""}</tr>`).join("")}</tbody></table></div>`}
function relationsHtml(g){const os=Object.values(S.groups).filter(o=>o.id!==g.id&&!o.dead&&groupSize(o.id)>0);if(!os.length)return"";
  return `<div><div class="lbl">Other groups</div><table><tbody>${os.map(o=>{const r=g.rel[o.id]||0;return `<tr><td><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</td><td class="mute">${o.home?esc(PLACES[o.home].n):"on the move"}</td><td class="num">${groupSize(o.id)}</td><td class="${g.allied[o.id]||r>30?"pos":r<-20?"neg":"mute"}">${g.allied[o.id]?"allies":r>30?"friendly":r<-30?"enemies":r<-10?"tense":"neutral"}</td></tr>`}).join("")}</tbody></table><p class="mono mute">Leaders speak for their people. Find one and talk: alliances, demands, trades.</p></div>`}
function noGroupHtml(){const gs=Object.values(S.groups).filter(o=>!o.dead&&groupSize(o.id)>0);const fol=S.people.filter(isFollower);
  return `<p>You're on your own${fol.length?`, with ${fol.map(p=>esc(p.name)).join(", ")}`:""}. People are banding together.</p>
  <ul class="mute"><li>To join a group, find its leader and ask, in your own words.</li><li>To start your own, ask people to come with you. Then settle at a free camp.</li></ul>
  ${gs.length?`<div class="cards">${gs.map(o=>{const L=o.leader==="you"?null:P(o.leader);return `<div class="card"><b><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</b><div class="mono mute">${o.home?esc(PLACES[o.home].n):"on the move"} · ${groupSize(o.id)} people</div><div>Led by ${L?esc(L.met?fullName(L):fullName(L)+" (you haven't met)"):"nobody"}</div>${L&&L.met?`<div class="mono ${feel(L)>20?"pos":feel(L)<-10?"neg":"mute"}">${tierWord(tier(L))}</div>`:""}</div>`}).join("")}</div>`:'<p class="mute">No groups have formed yet.</p>'}`}
function deposit(k){const g=myGroup();if(!g||!atHome())return;const n=invCount(k);if(!n||!DEPOSIT[k])return;const [s,m]=DEPOSIT[k];g.stock[s]+=n*m;invTake(k,n);const val=n*ITEMS[k].v;
  for(const p of shuffle(members(g.id).filter(p=>p.age>=12&&dist(p.x,p.z,S.player.x,S.player.z)<25)).slice(0,3)){p.trust=clamp(p.trust+Math.min(3,val/15),-100,100);if(val>=20&&rf()<.5)mem(p,`${S.player.name} brought supplies back for everyone.`,3)}
  journal(`You put ${ITEMS[k].n.toLowerCase()}${n>1?" ×"+n:""} in the stores.`)}
function withdraw(k){const g=myGroup();if(!g||!atHome())return;const [it,c]=WITHDRAW[k];if(g.stock[k]<c)return;g.stock[k]-=c;invAdd(it,1);
  if(g.leader!=="you"&&(k==="food"||k==="meds")&&g.stock[k]<groupSize(g.id)*1.5)for(const p of shuffle(members(g.id).filter(p=>p.age>=12)).slice(0,2)){p.trust=clamp(p.trust-3,-100,100);mem(p,`${S.player.name} took from the stores when we were short.`,-3)}}
function tileClick(i){const g=myGroup();if(!g||!g.home)return;const s=S.sites[g.home];const sel=UI.buildSel;const empty=!s.grid[i]&&!s.build.some(x=>x.tile===i);
  if(sel&&empty){const d=BLD[sel];const lead=g.leader==="you";
    if(lead){if(!canAfford(g,d.cost)){toast(`Not enough in the stores for a ${d.n.toLowerCase()}.`);return}startSite(g,sel,i,"you");assignRoles(g);journal(`You mark out a lot for a ${d.n.toLowerCase()}. ${members(g.id).some(p=>p.role==="builder")?"The builders will get to it.":"Someone needs to build it. You could help."}`)}
    else{if(!d.own)return;if(!Object.entries(d.cost).every(([kk,v])=>invHas(kk,v))){toast("You don't have the materials.");return}for(const [kk,v] of Object.entries(d.cost))invTake(kk,v);s.build.push({b:sel,tile:i,prog:0,by:"you"});journal("You start on a shelter of your own. The builders say they'll help when they can.")}
    UI.buildSel=null;UI.tileSel=null;save();render();return}
  UI.tileSel=UI.tileSel===i?null:i;render()}
function demolish(i){const g=myGroup();if(!g||g.leader!=="you")return;const s=S.sites[g.home];const c=s.grid[i];if(!c)return;for(const [k,v] of Object.entries(BLD[c.b].cost))g.stock[k]+=Math.floor(v/2);s.grid[i]=null;if(S.player.hutTile&&S.player.hutTile.site===g.home&&S.player.hutTile.tile===i)S.player.hutTile=null;UI.tileSel=null;journal(`You have the ${BLD[c.b].n.toLowerCase()} torn down.`)}
function cancelBuild(i){const g=myGroup();if(!g||g.leader!=="you")return;const s=S.sites[g.home];const b=s.build.find(x=>x.tile===i);if(!b)return;for(const [k,v] of Object.entries(BLD[b.b].cost))g.stock[k]+=v;s.build=s.build.filter(x=>x!==b);UI.tileSel=null}
function kick(pid){const p=P(pid);const g=myGroup();if(!p||!g||g.leader!=="you")return;const fam=members(g.id).filter(q=>q.hh===p.hh&&q.hh&&q!==p&&q.hh!=="you");
  for(const q of [p,...fam]){q.group=null;q.role=null;q.follow=false;placeTo(q,randIn("town",3));q.trust=clamp(q.trust-30,-100,100);q.aff=clamp(q.aff-20,-100,100);mem(q,`${S.player.name} threw me out of ${g.name}.`,-12)}
  for(const q of members(g.id))if(relGet(q,p)>40){q.trust=clamp(q.trust-6,-100,100);mem(q,`${S.player.name} threw ${p.name} out.`,-4,p.id)}
  news(`${S.player.name} threw ${fullName(p)}${fam.length?" and their family":""} out of ${g.name}.`,"bad",[p.id]);journal(`You sent ${p.name} away.`,"bad")}
function leaveGroup(){const g=myGroup();if(!g)return;const pl=S.player;const wasLead=g.leader==="you";pl.group=null;
  for(const q of S.people.filter(q=>q.alive&&q.fam.you&&q.group===g.id)){q.group=null;q.role=null;q.follow=true}
  for(const q of members(g.id)){q.trust=clamp(q.trust-4,-100,100);mem(q,`${pl.name} left ${g.name}.`,-3)}
  if(wasLead){if(members(g.id).some(p=>p.age>=16))newLeader(g.id);else g.leader=null}
  journal(`You walked away from ${g.name}.`,"big");news(`${pl.name} left ${g.name}.`,"")}
function setRole(pid,r){const p=P(pid);if(!p||!ROLES[r])return;p.role=r;p.roleSet=true;save()}
function setPol(k,v){const g=myGroup();if(!g||g.leader!=="you")return;const old=g.pol[k];g.pol[k]=v;
  if(k==="ration"&&v==="half"&&old!=="half"){for(const p of members(g.id)){p.mood-=3;p.trust=clamp(p.trust-1,-100,100)}news(`${g.name} is on half rations.`,"")}
  if(k==="stance"&&v==="hostile"&&old!=="hostile"){for(const p of members(g.id))if(p.tr.kind>.65){p.trust=clamp(p.trust-5,-100,100);mem(p,`${S.player.name} wants us to take what we need from other people. I didn't sign up for that.`,-5)}for(const o of Object.values(S.groups))if(o.id!==g.id){o.rel[g.id]=(o.rel[g.id]||0)-5;g.rel[o.id]=(g.rel[o.id]||0)-5}}
  if(k==="stance"&&v==="friendly"&&old!=="friendly")for(const p of members(g.id))if(p.tr.kind>.6)p.trust=clamp(p.trust+2,-100,100);
  save();render()}

// ---------- talking: a box that opens beside the person you clicked ----------
const QUICK=["How are you holding up?","Who are you?","What do you need?","Come with me.","Can I join your group?","Heard any news?"];
// small talk to get them going; it changes as the day goes on, and it's only a start: type anything
const SMALLTALK=["What did you do before all this?","Where are you from?","What do you miss most?","What's on your mind?","Sleep at all last night?","Tell me about your family.","What scares you most?","What are you hoping for?","What's your favorite food?","How'd you make it this far?"];
const KIDTALK=["Are you okay?","Where's your family?","What's your favorite animal?","Want to hear a joke?","Are you hungry?","What's your name?"];
const TEENTALK=["You doing okay?","What grade were you in?","What do you miss most?","What music do you like?","How'd you make it this far?","Where's your family?"];
function talkChips(p){const q=p.cv&&p.cv.q;if(q==="come")return["Yes. Stay close.","No. Not now.",...QUICK.slice(0,3)];if(q==="hang")return["Yes, I'll sit with you.","No, not now.",...QUICK.slice(0,3)];
  const out=[];if(q)out.push("Yes.","No.");const R=srng(hashStr(p.id+"/"+Math.floor(S.t/30)));
  out.push(!p.met?"Hi. Who are you?":p.age<13?"Hey, buddy. You okay?":"How are you holding up?");
  if(S.flags.wake&&S.t-S.flags.wake<DAY*2)out.push("What did I miss?");
  const pool=(p.age<13?KIDTALK:p.age<18?TEENTALK:SMALLTALK).filter(x=>!out.includes(x));for(let i=0;i<2&&pool.length;i++)out.push(pool.splice(Math.floor(R()*pool.length),1)[0]);
  if(p.met&&p.age>=13)out.push(p.want?"What do you need?":"Need anything?");
  if(p.follow)out.push("Wait here.");else if(p.age>=8&&p.met)out.push("Come with me.");
  const g=p.group&&G(p.group);if(g&&g.leader===p.id&&S.player.group!==g.id&&p.met)out.push("Can I join your group?");
  if(!(S.flags.wake&&S.t-S.flags.wake<DAY*2))out.push("Heard any news?");
  return out.slice(0,8)}
function openTalk(pid){const p=P(pid);if(!p||!p.alive)return;if(UI.panel&&UI.panel!=="inv")UI.panel=null;UI.talkTo=pid;UI.talkFresh=true;p.lastTalk=S.t;cancelWalk();
  const pl=S.player;W3.ang=Math.atan2(p.x-pl.x,p.z-pl.z);render();const box=$("talkbox");if(box&&matchMedia("(pointer:fine)").matches)box.focus({preventScroll:true})}
function closeTalk(quiet){if(!UI.talkTo)return false;if(typeof talkAbort==="function")talkAbort();UI.talkTo=null;UI.draft="";if(!quiet)render();else{const el=$("talk");if(el){el.hidden=true;el.innerHTML=""}}return true}
function talkHead(p){const g=p.group?G(p.group):null;return `<div class="who"><b>${esc(p.met?fullName(p):"A stranger")}</b><span class="mono mute">${p.age} · ${esc(p.met?JOBS[p.job]?.n||"":p.look||"")}${g?" · "+esc(g.name):""}${p.met?" · "+esc(relLabel(p)):""}${isFollower(p)?" · with you":""}</span></div>`}
function chatHtml(p){const L=p.chat.slice(-30);if(!L.length)return `<div class="msg sys">${p.met?`You know ${esc(p.name)}. Say something.`:"You haven't met. Say something."}</div>`;
  return L.map(m=>`<div class="msg ${m.w}${m.live?" live":""}">${esc(m.x)}${m.live&&!m.x?'<span class="dots"><i></i><i></i><i></i></span>':""}</div>`).join("")}
function renderTalk(){const el=$("talk");if(!el)return;const p=UI.talkTo?P(UI.talkTo):null;if(!p||!p.alive||S.player.alive===false||UI.modal&&UI.modal.type!=="trade"){if(UI.talkTo&&(!p||!p.alive))UI.talkTo=null;el.hidden=true;el.innerHTML="";return}
  const box=$("talkbox");const had=box&&document.activeElement===box;const sel=had?[box.selectionStart,box.selectionEnd]:null;
  const d=dist(p.x,p.z,S.player.x,S.player.z);const far=d>6&&!p.follow;const busy=!!UI.talkBusy;
  el.hidden=false;el.innerHTML=`<header>${talkHead(p)}<button class="x" data-act="endtalk" aria-label="Stop talking (Esc)">×</button></header>
  ${p.want&&p.met?`<div class="want"><span class="lbl">${esc(p.name)} asked you</span> ${esc(wantSummary(p))}</div>`:""}
  <div class="chat" id="chat">${chatHtml(p)}</div>
  ${far?`<p class="warn mono">${esc(p.met?p.name:"They")} can't hear you from here. Walk closer.</p>`:""}
  <form class="say" data-form="talk"><input id="talkbox" autocomplete="off" placeholder="${busy?"They're answering...":"Say anything..."}" value="${esc(UI.draft)}" maxlength="300" aria-label="What you say"${busy?" disabled":""}><button class="btn pri" type="submit"${busy?" disabled":""}>Say</button></form>
  ${bondRow(p)}<div class="chips">${talkChips(p).map(q=>`<button class="chip" data-act="quick" data-v="${esc(q)}"${busy?" disabled":""}>${esc(q)}</button>`).join("")}</div>
  <footer><button class="tag" data-act="trade" data-v="${p.id}">Trade</button>${p.met?`<button class="tag" data-act="person" data-v="${p.id}">About ${esc(p.name)}</button>`:""}${typeof AI!=="undefined"&&AI.ns?`<button class="tag" id="aistate" data-act="aitoggle" title="${AI.on?"Switch to built-in lines (no Claude usage)":"Let Claude write what people say"}">${esc(aiStateText())}</button>`:""}</footer>`;
  const c=$("chat");if(c)c.scrollTop=c.scrollHeight;positionTalk(true);
  const nb=$("talkbox");if(nb&&(had||UI.talkFresh)&&!busy){nb.focus({preventScroll:true});if(sel)try{nb.setSelectionRange(sel[0],sel[1])}catch(e){}}UI.talkFresh=false}
function renderTalkLog(){const p=UI.talkTo?P(UI.talkTo):null;const c=$("chat");if(!p||!c)return;const stick=c.scrollTop+c.clientHeight>=c.scrollHeight-30;c.innerHTML=chatHtml(p);if(stick)c.scrollTop=c.scrollHeight}
function positionTalk(force){const el=$("talk");const p=UI.talkTo?P(UI.talkTo):null;if(!el||el.hidden||!p||!W3.ok)return;const f=FIGMAP.get(p.id);const s=project(f?f.x:p.x,1.6*(f&&f.lk?f.lk.s:1),f?f.z:p.z);
  const W=innerWidth,H=innerHeight;const w=el.offsetWidth,h=el.offsetHeight;let x=s.x+34,y=s.y-h*.45;if(x+w>W-12)x=s.x-w-34;x=clamp(x,12,Math.max(12,W-w-12));y=clamp(y,64,Math.max(64,H-h-96));
  const k=Math.round(x)+","+Math.round(y);if(force||k!==UI.talkPos){UI.talkPos=k;el.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`}}

// ---------- trading ----------
function openTrade(pid){const p=P(pid);if(!p||!p.alive)return;if(dist(p.x,p.z,S.player.x,S.player.z)>6&&!p.follow){toast(`${p.met?p.name:"They"} can't trade from over there. Walk closer.`);return}UI.modal={type:"trade",pid,give:{},take:{}};render()}
function tradables(){const out={};const inv=invMap();for(const [k,n] of Object.entries(inv))if(ITEMS[k].v>0)out[k]=n;return out}
function valOf(k,p,mine){const it=ITEMS[k];if(!it)return 0;let v=it.v;if(p.want&&p.want.item===k)v*=mine?2:1.5;if(it.eat&&p.hunger<40)v*=mine?1.4:1.3;return v}
function tradeSums(){const m=UI.modal;const p=P(m.pid);let give=0,take=0;for(const [k,n] of Object.entries(m.give))give+=valOf(k,p,true)*n;for(const [k,n] of Object.entries(m.take))take+=valOf(k,p,false)*n;return{give,take}}
function tradeOk(){const {give,take}=tradeSums();const p=P(UI.modal.pid);const f=feel(p);const fair=f<-40?.7:f<0?.85:f<40?1:f<70?1.15:1.3;return take===0?give>0:give*fair>=take}
function tradeHtml(){const m=UI.modal;const p=P(m.pid);const mine=tradables();const theirs=Object.entries(p.pack||{}).filter(([k,n])=>n>0&&ITEMS[k]);const {give,take}=tradeSums();const ok=tradeOk();
  const row=(side,k,n,v)=>{const sel=m[side][k]||0;return `<tr><td>${typeof itemIcon==="function"?itemIcon(k,22):""} ${esc(ITEMS[k].n)} <span class="mute mono">×${n}</span></td><td class="num" title="Value">${Math.round(v)}</td><td class="qty"><button class="tag" data-act="tq" data-v="${side}|${k}|-1"${sel?"":" disabled"} aria-label="Less">−</button> <span class="mono">${sel}</span> <button class="tag" data-act="tq" data-v="${side}|${k}|1"${sel<n?"":" disabled"} aria-label="More">+</button></td></tr>`};
  return `<h2>Trade with ${esc(p.met?p.name:"a stranger")}</h2><p class="mute">${p.met?esc(p.name)+" "+tierWord(tier(p))+".":""} ${p.want&&p.want.type==="fetch"?`They asked you for ${esc(ITEMS[p.want.item].n.toLowerCase())}.`:""} Friends give better deals. What you get goes into your bags, or at your feet if there's no room.</p>
   <div class="fgrid"><div><div class="lbl">You give</div><div class="tscroll"><table><tbody>${Object.entries(mine).map(([k,n])=>row("give",k,n,valOf(k,p,true))).join("")||'<tr><td class="mute">Nothing to trade.</td></tr>'}</tbody></table></div></div>
   <div><div class="lbl">They give</div><div class="tscroll"><table><tbody>${theirs.map(([k,n])=>row("take",k,n,valOf(k,p,false))).join("")||'<tr><td class="mute">Nothing to spare.</td></tr>'}</tbody></table></div></div></div>
   <p class="mono">${give+take?`You give ${Math.round(give)} worth · you get ${Math.round(take)} worth · <span class="${ok?"pos":"neg"}">${take===0&&give>0?"a gift":ok?"they'd take this":"they want more"}</span>`:"Pick what to give and what you want back."}</p>
   <div class="row"><button class="btn pri" data-act="dotrade"${give+take>0?"":" disabled"}>${take===0?"Give it to them":"Offer the trade"}</button><button class="btn" data-act="closemodal">Never mind</button></div>`}
function doTrade(){const m=UI.modal;const p=P(m.pid);const pl=S.player;const {give,take}=tradeSums();
  if(!tradeOk()){p.chat.push({w:"them",x:styleSay(p,pick(["That's not a trade. That's robbery.","Add something and we'll talk.","No. Not for that."]))});toast(`${p.met?p.name:"They"} won't take that.`);render();return}
  const given={};for(const [k,n] of Object.entries(m.give)){const have=invCount(k);const q=Math.min(n,have);if(q<=0)continue;invTake(k,q);p.pack[k]=(p.pack[k]||0)+q;given[k]=(given[k]||0)+q}
  for(const [k,n] of Object.entries(m.take)){p.pack[k]=(p.pack[k]||0)-n;if(p.pack[k]<=0)delete p.pack[k];invAdd(k,n)}
  const names=Object.entries(given).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:"")).join(", ");
  const w=p.want;if(w&&w.type==="fetch"&&(given[w.item]||0)>=w.qty){p.trust=clamp(p.trust+w.reward.trust,-100,100);p.aff=clamp(p.aff+w.reward.aff,-100,100);p.want=null;mem(p,`${pl.name} brought me ${ITEMS[w.item].n.toLowerCase()} when I needed it.`,8);
    p.chat.push({w:"them",x:styleSay(p,pick(["You actually did it. Thank you. I mean it.","*stares at it* I didn't think you'd come back. Thank you.","I owe you one. A real one."]))});
    const g=p.group?G(p.group):null;if(w.item==="antibiotics"&&g&&g.fever){g.feverCured=true;news(`${pl.name} brought antibiotics to ${g.name}. The fever's breaking.`,"good")}}
  else if(take===0){p.trust=clamp(p.trust+Math.min(10,give/3),-100,100);p.aff=clamp(p.aff+Math.min(12,give/2.5),-100,100);mem(p,`${pl.name} gave me ${names} and asked for nothing.`,Math.min(6,Math.round(give/4)));p.chat.push({w:"them",x:styleSay(p,pick(["For me? ...Thank you.","You don't have to do that. ...Thank you.","*turns it over in their hands* I won't forget this."]))})}
  else{p.trust=clamp(p.trust+1,-100,100);p.chat.push({w:"them",x:styleSay(p,pick(["Pleasure doing business.","Deal.","Fair enough."]))})}
  p.chat.push({w:"sys",x:take===0?`You gave ${names}.`:`You traded ${names||"nothing"} for ${Object.entries(m.take).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:"")).join(", ")}.`});
  p.met=true;advance(5);UI.modal=null;UI.talkTo=p.id;save();render()}

// ---------- things that stop the world: events, results, help, death ----------
function renderModal(){const el=$("modal");if(!el)return;const h=modalHtml();el.innerHTML=h;el.hidden=!h;const f=el.querySelector("#minput");if(f)f.focus()}
function closeModal(){const m=UI.modal;if(!m)return false;if(m.type==="event"||m.type==="dead"||m.type==="name_group"&&false)return false;UI.modal=null;render();checkPending();return true}
function modalHtml(){const m=UI.modal;if(!m)return"";const wrap=(inner,label,cls="")=>`<div class="modal-bg"><div class="modal ${cls}" role="dialog" aria-modal="true" aria-label="${esc(label)}">${inner}</div></div>`;
  if(m.type==="event"){const ev=EVENTS[m.id];const text=typeof ev.text==="function"?ev.text(m.data):ev.text;
    if(ev.input)return wrap(`<h2>${esc(ev.title)}</h2><p>${esc(text)}</p><form class="row" data-form="${ev.input}"><input id="minput" maxlength="30" placeholder="A name" required aria-label="Name"><button class="btn pri" type="submit">That's the name</button></form>`,ev.title);
    return wrap(`<h2>${esc(ev.title)}</h2><p>${esc(text)}</p><div class="choices">${ev.choices.map((c,i)=>`<button class="btn" data-act="choose" data-v="${i}">${esc(c.t)}</button>`).join("")}</div>`,ev.title)}
  if(m.type==="wake")return wrap(wakeHtml(),"Awake","wide waking");
  if(m.type==="result")return wrap(`<h2>${esc(m.title)}</h2>${m.note?`<div class="hnote">${String(m.text).split(/\n\n+/).map(x=>`<p>${esc(x).replace(/\n/g,"<br>")}</p>`).join("")}</div>`:`<p>${esc(m.text)}</p>`}<div class="row"><button class="btn pri" data-act="closemodal">Continue</button></div>`,m.title);
  if(m.type==="help")return wrap(helpHtml(),"How to play","wide");
  if(m.type==="name_group")return wrap(`<h2>Name your people</h2><p>Every group out here goes by something. What do you call yours?</p><form class="row" data-form="groupname"><input id="minput" maxlength="32" placeholder="${esc(myGroup()?.name||"")}" required aria-label="Group name"><button class="btn pri" type="submit">That's us</button></form>`,"Name your group");
  if(m.type==="trade")return P(m.pid)?wrap(tradeHtml(),"Trade","wide"):"";
  if(m.type==="confirmNew")return wrap(`<h2>Start over?</h2><p>This life ends here and someone new wakes up in Limon. Your current game is erased.</p><div class="row"><button class="btn pri" data-act="newgame">Start a new life</button><button class="btn" data-act="closemodal">Keep playing</button></div>`,"Start over");
  if(m.type==="dead")return wrap(deadHtml(),"The end");
  return""}
function helpHtml(){return `<h2>How to play</h2><p>You're one person in a small town where everyone has a life of their own. ${S&&S.flags.wake?"A week ago the dead started walking, and you slept through it. Everyone else has had seven days to choose sides.":"Today the dead start walking."} Survive, and decide who you want to be to the people around you.</p>
<table><tbody>
<tr><td>Walk</td><td>WASD or the arrow keys, or click the ground. Hold Shift to run, which is loud. Walking into a door opens it.</td></tr>
<tr><td>Talk</td><td>Click a person. A box opens beside them: type anything. Time stops while you talk. They remember what you say and do.</td></tr>
<tr><td>Doors</td><td>E opens and closes doors. Locked ones can be knocked on, pried with a crowbar or kicked in. B boards a door up if you have a hammer, wood and nails. The dead can't open doors, but they can break them down.</td></tr>
<tr><td>Search</td><td>Click furniture, or stand next to it and press E. Things turn up as you look. Drag them into your pockets, bag or rig. R turns an item while you drag it.</td></tr>
<tr><td>Inventory</td><td>Tab. Your clothes have pockets and your bag holds the most. Double-click to eat, drink, use or wear. Right-click for more.</td></tr>
<tr><td>Fight</td><td>Space, or click one of the dead. Weapons wear out and guns draw a crowd. A bite can't be cured.</td></tr>
<tr><td>Wounds</td><td>H shows your body: every cut, bite, bruise and break, where it is and what it needs. Pick a wound to clean it, wrap a bandage on by hand, stitch it or splint it. Change dressings before they go bad, or the wound turns.</td></tr>
<tr><td>Light</td><td>F switches your flashlight on and off at night. The dead see it too.</td></tr>
<tr><td>Panels</td><td>H your body, C make things, G your group, N people you know, J journal, M map, P pause, Esc closes things.</td></tr>
<tr><td>Time</td><td>One real second is one minute. Long actions skip ahead. The speed buttons go up to 8x.</td></tr>
</tbody></table><p class="mute">The game saves itself in this browser.${typeof aiHelpText==="function"?" "+esc(aiHelpText()):""}</p>
<div class="row"><button class="btn pri" data-act="closemodal">Back to it</button><button class="btn" data-act="confirmnew">Start over</button></div>`}
function numWord(n){return["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"][n]||String(n)}
function deadHtml(){const pl=S.player;const days=dayOf(S.t);const met=S.people.filter(p=>p.met).length;const friends=S.people.filter(p=>p.met&&feel(p)>30);const mourn=friends.filter(p=>p.alive).sort((a,b)=>feel(b)-feel(a)).slice(0,6);const kids=pl.kids.map(id=>P(id)).filter(Boolean);const g=myGroup();const turned=pl.cause==="the bite";
  return `<h2>${turned?"You turned":"You didn't make it"}</h2><p>${esc(`Day ${days}. ${turned?"The bite took you, the way it takes everyone.":`It was ${pl.cause||"your wounds"}.`} You were ${pl.name}, ${pl.age}${pl.bg?", once a "+pl.bg.toLowerCase():""}.`)}</p>
  <p>${esc(`You met ${met===1?"one person":met+" people"}. ${friends.length?(friends.length===1?"One of them":cap(numWord(friends.length))+" of them")+" would have called you a friend.":"None of them knew you long enough to call you a friend."} ${S.stats.kills?(S.stats.kills===1?"One of the dead":cap(numWord(S.stats.kills))+" of the dead")+" fell to your hand.":"You never had to put one of the dead down."}${g?` You were one of ${g.name}.`:""}`)}</p>
  ${mourn.length?`<div><div class="lbl">Who will remember you</div><p>${esc(mourn.map(p=>`${p.name}${pl.fam[p.id]?" ("+pl.fam[p.id]+")":p.partner==="you"?" (your partner)":""}`).join(", "))}</p></div>`:""}
  ${kids.length?`<p>${esc(kids.map(k=>k.alive?`${k.name} is still out there.`:`${k.name} went before you.`).join(" "))}</p>`:""}
  <div class="row"><button class="btn pri" data-act="newgame">Start a new life</button></div>`}
function choose(i){const m=UI.modal;if(!m||m.type!=="event")return;const ev=EVENTS[m.id];const c=ev.choices[i];UI.inChoice=true;let txt="";try{txt=c.go(m.data)||""}catch(err){console.error(err);txt="It's over before you can make sense of it."}UI.inChoice=false;
  snapFollowers();snapCamera();journal(txt,"big");if(S.player.hp<=0){UI.modal=null;die();return}UI.modal={type:"result",title:ev.title,text:txt};save();render()}

// ---------- wiring ----------
function onClickUI(e){if(e.target.closest("select,input,textarea,option,label.field"))return;const el=e.target.closest("[data-act]");if(!el||el.disabled)return;onAct(el.dataset.act,el.dataset.v,el,e);if(e.detail>0&&el.tagName==="BUTTON"&&el.isConnected)el.blur()}
function onInputUI(e){const el=e.target;if(el.id==="talkbox")UI.draft=el.value;else if(el.dataset.c&&UI.create)UI.create[el.dataset.c]=el.value;else if(el.id==="pq"){UI.peopleQ=el.value;const L=$("plist");if(L)L.innerHTML=peopleListHtml()}}
function onChangeUI(e){const el=e.target;if(el.dataset.sel==="role"){setRole(el.dataset.v,el.value);el.blur()}else if(el.dataset.sel==="pol"){setPol(el.dataset.k,el.value)}}
function onAct(a,v,el,e){const pl=S&&S.player;
  if(typeof onCreateAct==="function"&&onCreateAct(a,v,el,e))return;
  if(!S)return;
  if(typeof onInvAct==="function"&&onInvAct(a,v,el,e))return;
  if(typeof onBondAct==="function"&&onBondAct(a,v,el,e))return;
  if(typeof onHealthAct==="function"&&onHealthAct(a,v,el,e))return;
  switch(a){
    case"speed":if(v==="pause")UI.paused=!UI.paused;else{UI.speed=+v;UI.paused=false}hud();return;
    case"zoom":W3.zoom=clamp(W3.zoom*(v==="in"?1.2:1/1.2),.55,2.6);return;
    case"help":UI.modal={type:"help"};render();return;
    case"panel":openPanel(v);return;
    case"closepanel":closePanel();return;
    case"do":doAction(v);return;
    case"walkto":{const p=P(v);if(!p||!p.alive)return;UI.panel=null;W3.talkOnArrive=p.id;walkTo(p.x,p.z,true);toast(`Walking over to ${p.met?p.name:"them"}.`);render();return}
    case"endtalk":closeTalk();return;
    case"quick":UI.draft=v;sendTalk();return;
    case"trade":openTrade(v);return;
    case"person":UI.peopleSel=v||null;if(v){UI.panel="people";if(UI.talkTo)closeTalk(true)}render();return;
    case"pfilter":UI.peopleFilter=v;render();return;
    case"craft":craft(v);return;
    case"deposit":deposit(v);save();render();return;
    case"depositall":for(const k of Object.keys(invMap()))if(DEPOSIT[k])deposit(k);save();render();return;
    case"withdraw":withdraw(v);save();render();return;
    case"bsel":UI.buildSel=UI.buildSel===v?null:v;UI.tileSel=null;render();return;
    case"tile":tileClick(+v);return;
    case"demolish":demolish(+v);save();render();return;
    case"cancelbuild":cancelBuild(+v);save();render();return;
    case"kick":kick(v);save();render();return;
    case"leavegroup":leaveGroup();save();render();return;
    case"renamegroup":UI.modal={type:"name_group"};render();return;
    case"adopt":adopt(v);save();render();return;
    case"choose":choose(+v);return;
    case"closemodal":UI.modal=null;render();checkPending();return;
    case"wakeup":UI.modal=UI.modal&&UI.modal.then==="help"?{type:"help"}:null;render();return;
    case"aitoggle":AI.on=!AI.on;try{localStorage.setItem("twd.ai",AI.on?"1":"0")}catch(err){}toast(AI.on?"Claude writes what people say again.":"People use their built-in lines now, with no Claude usage.");renderTalk();return;
    case"tq":{const [side,k,d]=v.split("|");const m=UI.modal;if(!m||m.type!=="trade")return;const max=side==="give"?(tradables()[k]||0):(P(m.pid).pack[k]||0);m[side][k]=clamp((m[side][k]||0)+(+d),0,max);if(!m[side][k])delete m[side][k];render();return}
    case"dotrade":doTrade();return;
    case"confirmnew":UI.modal={type:"confirmNew"};render();return;
    case"newgame":wipeSave();S=null;UI.modal=null;UI.panel=null;UI.talkTo=null;UI.open=null;UI.create=defaultChar();UI.paused=false;render();return;
    case"mapclick":mapClick(e,el);return;
  }}
function onForm(f,form){const val=(form.querySelector("input")?.value||"").trim();
  if(f==="talk"){sendTalk();return}
  if(typeof onCreateForm==="function"&&onCreateForm(f,form))return;
  if(f==="childname"){const m=UI.modal;const c=m&&m.data?P(m.data.child):null;if(val&&c){c.name=val;journal(`You name ${c.sex==="F"?"her":"him"} ${val}.`,"big")}UI.modal=null;save();render();checkPending();return}
  if(f==="groupname"){const g=myGroup();if(val&&g){g.name=val;news(`${S.player.name}'s people call themselves ${val} now.`,"")}UI.modal=null;save();render();checkPending();return}}
function onUiKey(k,e){const map={tab:"inv",i:"inv",h:"health",c:"craft",g:"group",n:"people",j:"journal",m:"map"};const pk=map[k];if(!pk)return;if(k==="tab")e.preventDefault();if(S.player.alive===false)return;if(UI.talkTo)closeTalk(true);
  if(pk==="inv"&&UI.panel==="inv"){closePanel();return}openPanel(pk)}
function onEscape(){if(UI.drag&&typeof cancelDrag==="function"){cancelDrag();return true}if(UI.treat){UI.treat=null;render();return true}if(UI.menu&&typeof closeMenu==="function"){closeMenu();return true}if(UI.talkTo){closeTalk();return true}if(UI.panel){closePanel();return true}return false}
document.addEventListener("pointerdown",()=>{UI.pdown=true},true);document.addEventListener("pointerup",()=>{UI.pdown=false},true);document.addEventListener("pointercancel",()=>{UI.pdown=false},true);
function uiTick(ts,dt){if(UI.talkTo)positionTalk(false);
  if(UI.hudDirty)hud();
  if(ts-(UI.lastR||0)>350){UI.lastR=ts;if(UI.dirty&&!UI.pdown&&!UI.drag&&!typing())render();else if(UI.dirty&&typing()&&UI.talkTo){renderBar();renderLog()}}
  if(ts-(UI.lastBar||0)>1000){UI.lastBar=ts;if(!UI.pdown&&!UI.drag){renderBar();renderLog()}}
  if(UI.panel==="map"&&ts-(UI.lastMap||0)>1000){UI.lastMap=ts;drawBigMap()}}
