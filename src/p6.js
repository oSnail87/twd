
// ================= interface =================
function typing(){const a=document.activeElement;return!!a&&a!==document.body&&(a.tagName==="INPUT"||a.tagName==="TEXTAREA"||a.tagName==="SELECT")}
function toast(msg){let el=document.getElementById("toast");if(!el){el=document.createElement("div");el.id="toast";el.className="toast";el.setAttribute("role","status");document.body.appendChild(el)}el.textContent=msg;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{el.hidden=true},3800)}
function act(mins,opt){advance(mins,opt||{});if(S.player.alive!==false)afterJump(mins)}
function die(cause){const pl=S.player;if(pl.alive===false)return;pl.alive=false;pl.hp=0;
  const how=cause||(pl.bitten&&(S.t-pl.bitten)/60>30?"the bite":pl.water<=0?"thirst":pl.food<=0?"hunger":pl.warmth<=0?"the cold":pl.bleeding?"blood loss":pl.sick?"fever":"your wounds");pl.cause=how;
  for(const p of living())if(p.met&&feel(p)>30){p.mood-=feel(p)>60?25:8;mem(p,`${pl.name} is gone.`,-8,"you")}
  if(how==="the bite")spawnZed(pl.x,pl.z,{name:pl.name,pid:"you"});
  news(how==="the bite"?`${pl.name} turned.`:`${pl.name} died. ${how==="the dead"?"The dead got to them.":""}`,"big");journal(how==="the bite"?"The fever takes you, and then nothing does.":"Everything goes quiet.","bad");
  UI.modal={type:"dead"};save();render()}
function openTalk(pid){const p=P(pid);if(!p)return;UI.talkTo=pid;UI.tab="talk";render();const box=document.getElementById("talkbox");if(box&&matchMedia("(pointer:fine)").matches)box.focus({preventScroll:true});const t=document.getElementById("tabsec");if(t&&t.getBoundingClientRect().top>innerHeight-120)t.scrollIntoView({block:"nearest",behavior:"smooth"})}

// ---------- rendering ----------
function render(){if(UI.create||!S){renderCreate();return}
  const keep={};for(const el of $app.querySelectorAll("[data-keep]"))keep[el.dataset.keep]=el.scrollTop;const seen=UI.seenNews;
  $app.innerHTML=`<div class="wrap">${headerHtml()}<div class="grid"><aside class="panel loc" id="left">${leftHtml()}</aside><main class="centercol"><div class="viewslot" id="viewslot"></div><section class="panel" id="tabsec">${tabsHtml()}<div id="tabbody" style="display:flex;flex-direction:column;gap:12px">${tabBody()}</div></section></main>${newsHtml(seen)}</div></div>${modalHtml()}`;
  const vs=document.getElementById("viewslot");if(W3.wrap)vs.appendChild(W3.wrap);
  for(const el of $app.querySelectorAll("[data-keep]"))if(keep[el.dataset.keep]!=null)el.scrollTop=keep[el.dataset.keep];
  const c=document.getElementById("chat");if(c)c.scrollTop=c.scrollHeight;
  if(UI.tab==="map")drawBigMap();
  W3.dirty=false;W3.leftDirty=false;UI.seenNews=S.news.length?S.news[0].t:0;
  const mi=document.getElementById("minput");if(mi)mi.focus()}
const TABS=[["journal","Journal"],["talk","Talk"],["pack","Pack"],["craft","Make"],["group","Group"],["people","People"],["map","Map"]];
function numWord(n){return["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"][n]||String(n)}
function tabsHtml(){const p=UI.talkTo?P(UI.talkTo):null;const asks=S.people.filter(q=>q.alive&&q.met&&q.want).length;
  return `<div class="tabs" role="tablist">${TABS.map(([k,n])=>`<button class="tab${UI.tab===k?" on":""}" role="tab" aria-selected="${UI.tab===k}" data-act="tab" data-v="${k}">${n}${k==="talk"&&p&&p.alive?` · ${esc(p.met?p.name:"Stranger")}`:""}${k==="people"&&asks?` <span class="warn">${asks}</span>`:""}</button>`).join("")}</div>`}
function tabBody(){switch(UI.tab){case"talk":return talkTab();case"pack":return packTab();case"craft":return craftTab();case"group":return groupTab();case"people":return peopleTab();case"map":return mapTab();default:return journalTab()}}
function renderLeft(){const el=document.getElementById("left");if(el&&S&&!UI.create)el.innerHTML=leftHtml()}
function headerHtml(){return `<header class="top"><h1>Still Breathing</h1><div class="clock" id="clock">${clockHtml()}</div><div class="vitals" id="vitals">${vitalsHtml()}</div></header>`}
function wxWord(){return{clear:"Clear",overcast:"Overcast",rain:"Rain",snow:"Snow",fog:"Fog"}[wxName()]||"Clear"}
function clockHtml(){return `<span><b>${stamp(S.t)}</b></span><span>${wxWord()}, ${temp()}°C</span><span class="mute">${esc(PLACES[here()].n)}</span>${UI.paused?'<span class="warn">Paused</span>':UI.speed>1?`<span class="warn">${UI.speed}x speed</span>`:""}`}
function vitalsHtml(){const pl=S.player;const v=(n,val)=>`<div class="vital ${val<25?"low":val<50?"mid":""}"><div class="lbl">${n}</div><div class="bar"><i style="width:${Math.round(clamp(val,0,100))}%"></i></div></div>`;
  return v("Health",pl.hp)+v("Food",pl.food)+v("Water",pl.water)+v("Warmth",pl.warmth)+v("Energy",pl.energy)+`<div class="vital"><div class="lbl">Load</div><div class="mono ${weight()>maxW()?"neg":""}">${weight().toFixed(1)} / ${maxW().toFixed(0)} kg</div></div>${condsHtml()}`}
function condsHtml(){const pl=S.player;const c=[];if(pl.bleeding)c.push("Bleeding");if(pl.sick)c.push("Sick");if(pl.bitten)c.push("Bitten");if(pl.preg)c.push("Pregnant");if(weight()>maxW())c.push("Overloaded");return c.length?`<div class="row" style="gap:4px">${c.map(x=>`<span class="cond">${x}</span>`).join("")}</div>`:""}
function hud(){if(!S||UI.create)return;const c=document.getElementById("clock"),v=document.getElementById("vitals");if(c)c.innerHTML=clockHtml();if(v)v.innerHTML=vitalsHtml()}
function newsHtml(seen){return `<aside class="panel news" data-keep="news"><div class="lbl">Around Millbrook</div>${S.news.slice(0,80).map(n=>`<div class="entry ${n.k}${seen&&n.t>seen?" fresh":""}"><div class="mono">${stamp(n.t)}</div>${esc(n.x)}</div>`).join("")}</aside>`}

// ---------- left panel: where you are, what you can do ----------
function leftHtml(){const pl=S.player;const r=here();const P_=PLACES[r];const o=P_.site?ownerOf(r):null;const zc=S.zeds.filter(z=>Math.abs(z.x-pl.x)<16&&Math.abs(z.z-pl.z)<16&&dist(z.x,z.z,pl.x,pl.z)<16).length;
  return `<div><div class="lbl">${o?esc(o.name)+(o.id===pl.group?" · home":" · their camp"):"Where you are"}</div><h2>${esc(P_.n)}</h2><p class="desc" style="margin:4px 0 0">${esc(P_.d)}</p></div>
  ${zc?`<p class="warn mono" style="margin:0">${zc===1?"One of the dead is":zc+" of the dead are"} close by.</p>`:""}
  <div><div class="lbl">Do something</div><div class="btns">${actionsHere().map(a=>`<button class="btn${a.pri?" pri":""}" data-act="do" data-v="${a.id}"${a.dis?" disabled":""}>${esc(a.t)}<small>${esc(a.dis||a.s||"")}</small></button>`).join("")}</div></div>
  <div><div class="lbl">Here now</div>${hereNowHtml()}</div>`}
function nearRiver(){const z=S.player.z;return z>37.5&&z<56.5}
function sleepSafe(){const pl=S.player;if(atHome())return 2;if(pl.hutTile&&here()===pl.hutTile.site)return 2;const b=nearBuilding(pl.x,pl.z,3);if(b&&(b.type==="house"||(b.site&&!ownerOf(b.site)))&&!residentsHome(b).length)return 1;return 0}
function bestFood(){const inv=S.player.inv;return Object.keys(inv).filter(k=>ITEMS[k].eat).sort((a,b)=>(ITEMS[a].eat.sick?1:0)-(ITEMS[b].eat.sick?1:0)||ITEMS[b].eat.food-ITEMS[a].eat.food)[0]}
function bestDrink(){const inv=S.player.inv;return Object.keys(inv).filter(k=>ITEMS[k].drink&&k!=="whiskey").sort((a,b)=>(ITEMS[a].sick?1:0)-(ITEMS[b].sick?1:0))[0]}
function actionsHere(){const pl=S.player;const r=here();const A=[];const add=(id,t,s,dis,pri)=>A.push({id,t,s,dis,pri});const g=myGroup();
  const zn=zedNear(7)?"The dead are too close":null;const t=W3.promptT;const theirs=PLACES[r].site&&ownerOf(r)&&ownerOf(r).id!==pl.group;
  if(t&&t.k==="search")add("search",t.label,t.sub||(t.b.type==="car"?"8 minutes":t.b.type==="house"?"20 minutes":"30 minutes"),null,true);
  if(t&&t.k==="knock")add("knock",t.label,"See who's home",null,true);
  if(!W3.ok)add("travel","Walk somewhere","Opens the map");
  if(["woods","lodge","fields","farm","wilds","hills","church","mill","school"].includes(r)&&!theirs)add("forage","Forage","1 hour · berries, herbs",zn);
  if(["woods","lodge","mill","hills"].includes(r)&&!theirs)add("chop",hasTool("axe")?"Chop wood":"Gather deadfall",hasTool("axe")?"1.5 hours":"1 hour · an axe would help",zn);
  if(["woods","lodge","hills","fields"].includes(r))add("hunt","Hunt",weapon()?"3 hours":"You need a weapon",zn||(weapon()?null:"You need a weapon"));
  if(nearRiver()){add("fish","Fish","2 hours"+(invHas("rope")?"":" · rope helps"),zn);if(invHas("empty_bottle"))add("fill","Fill your bottles",`${pl.inv.empty_bottle} empty`);add("drinkriver","Drink from the river","It might make you sick")}
  if(["hills","quarry"].includes(r)&&!theirs)add("stone","Gather stone","1 hour",zn);
  const fireOn=pl.fire&&pl.fire.until>S.t;if(!inRiver(pl.x,pl.z)&&!fireOn&&!(atHome()&&siteHas(r,"firepit"))){const ok=invHas("lighter")&&invHas("wood",2);add("fire","Make a campfire",ok?"Lighter and 2 wood":"Needs a lighter and 2 wood",ok?null:"Needs a lighter and 2 wood")}
  if(atHome()){add("chores","Do chores","2 hours · people notice",zn);const s=S.sites[g.home];if(s.build.length)add("build","Help build",`2 hours · ${BLD[s.build[0].b].n.toLowerCase()}`,zn);if(g.stock.food>=1&&pl.food<80)add("campeat","Eat from the stores",`${Math.floor(g.stock.food)} food left`)}
  if(g&&g.leader==="you"&&!g.home&&PLACES[r].site&&!ownerOf(r))add("settle","Settle here",`Make this ${g.name}'s camp`,null,true);
  if(!g&&S.flags.alarm&&PLACES[r].site&&!ownerOf(r))add("settle","Start a camp here",S.people.some(isFollower)?"You and the people with you":"Claim it and see who comes",null,true);
  const food=bestFood(),drink=bestDrink();
  if(food&&pl.food<85)add("eat",`Eat: ${ITEMS[food].n.toLowerCase()}`,`Food +${ITEMS[food].eat.food}`);
  if(drink&&pl.water<90)add("drink",`Drink: ${ITEMS[drink].n.toLowerCase()}`,`Water +${ITEMS[drink].drink}`);
  if((pl.bleeding||pl.hp<75)&&invHas("bandage"))add("bandage","Bandage yourself",pl.bleeding?"Stops the bleeding":"Health +15");
  if(pl.sick&&invHas("antibiotics"))add("meds","Take antibiotics","Cures sickness");
  add("rest","Rest an hour","Get some energy back",zedNear(6)?"Not with the dead this close":null);
  const s=sleepSafe();add("sleep","Sleep",s===2?"Safe here":s===1?"Indoors, mostly safe":"Out in the open. Risky",zedNear(14)?"Not with the dead this close":null);
  if(nearPeople(10).filter(p=>p.age>=6).length>=2)add("listen","Listen in","Hear what people are saying");
  return A}
function hereNowHtml(){const ps=nearPeople(14);if(!ps.length)return`<p class="mute" style="margin:0">Nobody close by.</p>`;
  const orphans=ps.filter(p=>orphan(p)&&p.met).slice(0,2);
  return `<div class="chips">${ps.slice(0,14).map(p=>`<button class="chip" data-act="talkto" data-v="${p.id}"><span class="dot" style="background:${p.group&&G(p.group)?G(p.group).color:"var(--mute)"}"></span>${esc(p.met?p.name:"Stranger")}<span class="mute" style="font-size:12px">${esc(isFollower(p)?"with you":p.act)}</span></button>`).join("")}</div>${orphans.map(p=>`<button class="btn" data-act="adopt" data-v="${p.id}" style="margin-top:6px">Take in ${esc(p.name)}<small>${esc(p.name)} has nobody left</small></button>`).join("")}`}
function orphan(p){if(!p.alive||p.age>=16||p.age<2||S.player.kids.includes(p.id))return false;return!p.parents.some(id=>{const q=id==="you"?S.player:P(id);return q&&q.alive!==false})}

// ---------- doing things ----------
function doAction(id){const pl=S.player;if(pl.alive===false)return;
  switch(id){
    case"search":{const t=W3.promptT;if(t&&t.k==="search")searchSpot(t.b);return}
    case"knock":{const t=W3.promptT;if(t&&t.k==="knock")knock(t.b);return}
    case"forage":case"chop":case"hunt":case"fish":case"stone":gather(id);break;
    case"fill":{const n=pl.inv.empty_bottle||0;if(!n)return;invTake("empty_bottle",n);invAdd("river_water",n);act(5);journal(`You fill ${n} bottle${n>1?"s":""} with river water. Boil it before you trust it.`);break}
    case"drinkriver":act(5);pl.water=clamp(pl.water+30,0,100);if(rf()<.25){pl.sick=1;journal("You drink from the river. An hour later your stomach knots up. You're sick.","bad")}else journal("You kneel at the bank and drink. It tastes like mud and iron.");break;
    case"fire":if(!invHas("lighter")||!invHas("wood",2))return;invTake("wood",2);pl.fire={x:pl.x+Math.sin(W3.ang)*1.3,z:pl.z+Math.cos(W3.ang)*1.3,until:S.t+240};act(10);journal("You get a fire going. Warmth, light, and a way to cook. Also a way to be seen.");noise(pl.x,pl.z,12);break;
    case"chores":chores();break;
    case"build":helpBuild();break;
    case"campeat":{const g=myGroup();if(!g||g.stock.food<1)return;g.stock.food-=1;pl.food=clamp(pl.food+30,0,100);if(g.stock.water>=1){g.stock.water-=1;pl.water=clamp(pl.water+30,0,100)}act(15);journal("You eat with whoever's around the fire.");for(const p of shuffle(members(g.id).filter(p=>p.age>=12&&dist(p.x,p.z,pl.x,pl.z)<20)).slice(0,2))p.aff=clamp(p.aff+1,-100,100);break}
    case"settle":settle();break;
    case"eat":useItem(bestFood());return;
    case"drink":useItem(bestDrink());return;
    case"bandage":useItem("bandage");return;
    case"meds":useItem("antibiotics");return;
    case"rest":act(60,{sleep:true});journal("You sit and rest for an hour.");break;
    case"sleep":sleep();break;
    case"listen":listenIn();return;
    case"travel":UI.tab="map";break;
  }
  save();render()}
const VERB={forage:"You forage for an hour",chop:"You work the deadfall",hunt:"You hunt for three hours",fish:"You fish the slow water for two hours",stone:"You pry loose some stone"};
function gather(kind){const pl=S.player;const r=here();const sv=pl.sk.survive;const got={};const g=(id,n)=>{n=Math.round(n);if(n>0){invAdd(id,n);got[id]=(got[id]||0)+n}};let mins=60;
  if(kind==="forage"){if(!S.flags.winter)g("berries",rnd(0,2)+Math.floor(sv/3)+(r==="woods"||r==="fields"?1:0));if(rf()<.45+sv*.04)g("herbs",rnd(1,2));if((r==="woods"||r==="lodge")&&rf()<.5)g("wood",1);skillUp("survive",.08)}
  if(kind==="chop"){const ax=hasTool("axe");mins=ax?90:60;g("wood",ax?rnd(2,4)+Math.floor(pl.sk.build/4):rnd(0,2));if(ax)wearTool("axe",2);skillUp("build",.05)}
  if(kind==="hunt"){mins=180;const w=weapon();const it=w?ITEMS[w.id]:null;if(!it)return;const p=.22+sv*.06+(it.gun?.25:it.reach?.12:.05);if(it.gun&&invHas("ammo"))invTake("ammo");if(rf()<p){g("raw_meat",rnd(1,3));if(rf()<.4)g("cloth",1)}const br=wearWeapon(2);skillUp("survive",.15)}
  if(kind==="fish"){mins=120;const p=.3+sv*.05+(invHas("rope")?.15:0)+(weapon()&&ITEMS[weapon().id].reach?.1:0);let n=0;for(let i=0;i<3;i++)if(rf()<p)n++;g("raw_fish",n);skillUp("survive",.1)}
  if(kind==="stone"){g("stone",rnd(1,3)+(r==="quarry"?1:0));skillUp("build",.03)}
  act(mins,{work:true});if(pl.alive===false)return;
  const list=Object.entries(got).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:""));const txt=list.length?`${VERB[kind]}: ${list.join(", ")}.`:`${VERB[kind]}. Nothing to show for it.`;
  journal(txt,list.length?"good":"");toast(txt);if(weight()>maxW())setTimeout(()=>toast("You're carrying too much. You'll move slowly until you drop something."),1800)}
function wearTool(t,n){const g=S.player.gear.find(x=>ITEMS[x.id].tool===t);if(!g)return;g.dur-=n;if(g.dur<=0){unequip(g.u);S.player.gear=S.player.gear.filter(x=>x!==g);journal(`Your ${ITEMS[g.id].n.toLowerCase()} breaks.`,"bad")}}
function sleep(){const pl=S.player;if(zedNear(14)){toast("Not with the dead this close.");return}const safe=sleepSafe();const h=hourOf(S.t);
  let mins;if(h>=8&&h<19)mins=240;else{mins=((7-h+24)%24)*60-(S.t%60);if(mins<=0)mins+=DAY;mins=clamp(mins,120,600)}
  S.woke=null;advance(mins,{sleep:true,safe:safe>0});if(pl.alive===false)return;afterJump(mins);
  let visit=false;if(safe<2&&rf()<(safe===1?.12:.38)+Math.min(.3,zedsIn(here())/60)){visit=true;const n=rnd(1,safe===1?1:3);for(let i=0;i<n;i++){const a=rf()*6.28,d=rnd(6,10);const x=pl.x+Math.cos(a)*d,z=pl.z+Math.sin(a)*d;if(free(x,z,.4,true)){spawnZed(x,z);const zz=S.zeds[S.zeds.length-1];zz.st="hunt";zz.tx=pl.x;zz.tz=pl.z}}}
  const P2=pl.partner&&P(pl.partner);if(P2&&P2.alive&&dist(P2.x,P2.z,pl.x,pl.z)<10){P2.aff=clamp(P2.aff+2,-100,100);if(rf()<.25)mem(P2,`Fell asleep next to ${pl.name}. First good sleep in days.`,3)}
  const txt=visit?"Something wakes you: shuffling, close by. The dead found you in the dark.":S.woke?`You wake early. ${{thirst:"Your mouth is dry as sand.",hunger:"Your stomach won't let you sleep.",cold:"You're shaking with cold.",pain:"The pain wakes you."}[S.woke]}`:h>=8&&h<19?"You nap for a few hours.":safe===2?"You sleep. Actually sleep. For a few hours you forget.":safe===1?"You sleep behind a locked door, waking at every sound.":"You sleep badly in the open, one ear awake all night.";
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
  news(`${g.name} has settled at ${PLACES[k].n}.`,"big");journal(`You've claimed ${PLACES[k].n} for ${g.name}. Plan what gets built from the Group tab.`,"big");UI.tab="group";if(UI.afterSettle){UI.afterSettle=false;UI.modal={type:"name_group"}}}
function listenIn(){const ps=nearPeople(10).filter(p=>p.age>=6);if(ps.length<2)return;const a=pick(ps);const rest=ps.filter(q=>q!==a);const b=rest.find(q=>a.partner===q.id)||rest.sort((x,y)=>Math.abs(relGet(a,y))-Math.abs(relGet(a,x)))[0];
  const lines=overhear(a,b);advance(10);UI.modal={type:"result",title:"Overheard",text:lines.join("\n")};save();render()}
function adopt(pid){const p=P(pid);const pl=S.player;if(!p||!orphan(p))return;pl.kids.push(p.id);p.parents.push("you");p.fam.you="guardian";pl.fam[p.id]="kid";p.trust=clamp(p.trust+25,-100,100);p.aff=clamp(p.aff+30,-100,100);
  mem(p,`${pl.name} said I could stay with them. For good.`,10);if(pl.group){if(p.group!==pl.group)joinGroup(p,pl.group,true)}else{p.group=null;p.follow=true}
  news(`${pl.name} took in ${p.name}.`,"good",[p.id]);journal(`${p.name} is yours to look after now. ${p.age<10?"They hold your hand and don't let go.":"They pretend not to care. They care."}`,"big")}
function useItem(id){const it=ITEMS[id];const pl=S.player;if(!id||!it||!invHas(id))return;
  if(it.eat){invTake(id);pl.food=clamp(pl.food+it.eat.food,0,100);if(it.eat.water)pl.water=clamp(pl.water+it.eat.water,0,100);if(it.eat.sick&&rf()<it.eat.sick){pl.sick=1;journal("Your stomach turns. You shouldn't have eaten that raw.","bad")}else journal(`You eat the ${it.n.toLowerCase()}.`);advance(5)}
  else if(it.drink){invTake(id);pl.water=clamp(pl.water+it.drink,0,100);if(it.after)invAdd(it.after);if(id==="whiskey"){pl.warmth=clamp(pl.warmth+10,0,100);pl.energy=clamp(pl.energy-3,0,100);journal("The whiskey burns all the way down. For a while, things are softer.")}else if(it.sick&&rf()<it.sick){pl.sick=1;journal("You drink the river water. Hours later your gut cramps. You're sick.","bad")}else journal(`You drink the ${it.n.toLowerCase()}.`);advance(3)}
  else if(it.heal||it.stopBleed||it.cure){invTake(id);if(it.heal)pl.hp=clamp(pl.hp+it.heal+pl.sk.medic,0,100);if(it.stopBleed&&pl.bleeding){pl.bleeding=0;journal("You bind the wound tight. The bleeding stops.","good")}if(it.cure){if(pl.sick){pl.sick=0;journal("The antibiotics knock the fever down.","good")}else journal("You take the antibiotics. You weren't sick, so all it does is waste them.")}else if(!it.stopBleed)journal(`You use the ${it.n.toLowerCase()}.`);skillUp("medic",.05);advance(5)}
  else if(id==="cigarettes"){invTake(id);pl.energy=clamp(pl.energy+4,0,100);journal("You smoke one. Your hands stop shaking for a while.")}
  else if(id==="radio"){advance(10);journal(radioLine())}
  else if(id==="photo")journal(pick(["You look at the photo for a long time. Everyone in it is smiling. You can't remember what was funny.","The photo is creased from your pocket. You smooth it out and put it back.","You don't look at the photo. You just hold it."]));
  save();render()}
function radioLine(){const d=dayOf(S.t);if(d<=2)return"The emergency broadcast repeats: stay indoors, do not approach the sick.";if(d<=4)return"The radio talks about the evacuation center at Ashby. Then it cuts out.";
  return pick(["Static. Then, for a moment, a woman's voice reading numbers. Then static.","Static. You crank it until your arm aches. Nothing.","A man's voice, very calm: \"...if you can hear this, you are not alone...\" Then nothing.","Somebody playing a guitar, badly, for about a minute. Then it's gone."])}

// ---------- crafting and gear ----------
const SLOTNAME={head:"Head",body:"Shirt",outer:"Jacket",hands:"Hands",legs:"Legs",feet:"Feet",back:"Bag",weapon:"Weapon"};
function durPct(g){return clamp(g.dur/ITEMS[g.id].dur*100,0,100)}
function canCraft(r){for(const [k,v] of Object.entries(r.need))if(!invHas(k,v))return`Missing ${ITEMS[k].n.toLowerCase()}`;if(r.tool&&!hasTool(r.tool))return`Needs a ${r.tool}`;if(r.at==="fire"&&!nearFire())return"Needs a fire";return true}
function craft(id){const r=RECIPES.find(x=>x.id===id);if(!r||canCraft(r)!==true)return;for(const [k,v] of Object.entries(r.need))invTake(k,v);invAdd(r.id);act(r.h*60,{work:true});skillUp("craft",.1);journal(`You make: ${ITEMS[r.id].n.toLowerCase()}.`,"good");save();render()}
function repair(u){const pl=S.player;const g=pl.gear.find(x=>x.u===u);if(!g)return;const it=ITEMS[g.id];if(!it.fix||!Object.entries(it.fix).every(([k,v])=>invHas(k,v)))return;for(const [k,v] of Object.entries(it.fix))invTake(k,v);
  const ws=atHome()&&siteHas(myGroup().home,"workshop");g.dur=Math.min(it.dur,g.dur+it.dur*(ws?.7:.45)+pl.sk.craft*2);act(20,{work:true});skillUp("craft",.06);journal(`You patch up your ${it.n.toLowerCase()}.`)}
function equip(u){const g=S.player.gear.find(x=>x.u===u);if(g)S.player.eq[ITEMS[g.id].slot]=u}
function gearStats(g){const it=ITEMS[g.id];const s=[];if(it.dmg)s.push(`damage ${it.dmg}`);if(it.gun)s.push("loud");if(it.reach)s.push("long reach");if(it.warm)s.push(`warmth ${it.warm}`);if(it.armor)s.push(`armor ${it.armor}`);if(it.carry)s.push(`carries ${it.carry} kg`);return s.length?`<div class="mono mute">${s.join(" · ")}</div>`:""}
function repairBtn(g){const it=ITEMS[g.id];if(!it.fix||g.dur>=it.dur)return"";const ok=Object.entries(it.fix).every(([k,v])=>invHas(k,v));return `<button class="tag" data-act="repair" data-v="${g.u}"${ok?"":" disabled"} title="Needs ${esc(Object.entries(it.fix).map(([k,v])=>ITEMS[k].n.toLowerCase()+" ×"+v).join(", "))}">Fix</button>`}
function useBtn(k){const it=ITEMS[k];const l=it.eat?"Eat":it.drink?"Drink":it.heal||it.stopBleed||it.cure?"Use":k==="cigarettes"?"Smoke":k==="radio"?"Listen":k==="photo"?"Look":"";return l?`<button class="tag" data-act="use" data-v="${k}">${l}</button>`:""}
function packTab(){const pl=S.player;const eqU=new Set(Object.values(pl.eq));
  const slots=SLOTS.map(s=>{const g=gearEq(s);return `<div class="slot"><div class="lbl">${SLOTNAME[s]}</div>${g?`<div>${esc(ITEMS[g.id].n)}</div>${gearStats(g)}<div class="dur" title="Condition ${Math.round(durPct(g))}%"><i style="width:${durPct(g)}%;${durPct(g)<30?"background:var(--blood)":""}"></i></div><div class="row" style="margin-top:6px;gap:4px"><button class="tag" data-act="unequip" data-v="${g.u}">Take off</button>${repairBtn(g)}</div>`:'<div class="mute">Nothing</div>'}</div>`}).join("");
  const loose=pl.gear.filter(g=>!eqU.has(g.u));const inv=Object.entries(pl.inv).sort((a,b)=>ITEMS[a[0]].n.localeCompare(ITEMS[b[0]].n));
  return `<div class="row" style="justify-content:space-between"><div class="lbl">Wearing and holding</div><div class="mono ${weight()>maxW()?"neg":"mute"}">${weight().toFixed(1)} / ${maxW().toFixed(0)} kg · armor ${armor()} · warmth ${clothesWarm()}</div></div><div class="slotgrid">${slots}</div>
   ${loose.length?`<div class="lbl">Spare gear</div><div class="scroll"><table><tbody>${loose.map(g=>`<tr><td>${esc(ITEMS[g.id].n)} <span class="mono mute">${Math.round(durPct(g))}%</span></td><td class="mono mute">${SLOTNAME[ITEMS[g.id].slot]}</td><td style="text-align:right;white-space:nowrap"><button class="tag" data-act="equip" data-v="${g.u}">${ITEMS[g.id].slot==="weapon"?"Hold":"Wear"}</button> ${repairBtn(g)} <button class="tag" data-act="dropg" data-v="${g.u}">Drop</button></td></tr>`).join("")}</tbody></table></div>`:""}
   <div class="lbl">Supplies</div>${inv.length?`<div class="scroll"><table><tbody>${inv.map(([k,n])=>`<tr><td>${esc(ITEMS[k].n)}</td><td class="num">${n}</td><td class="num">${(ITEMS[k].w*n).toFixed(1)} kg</td><td style="text-align:right;white-space:nowrap">${useBtn(k)} <button class="tag" data-act="drop" data-v="${k}">Drop</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="mute">Your pockets are empty.</p>'}
   ${atHome()?`<p class="mono mute">You're at camp. You can put things in the stores from the Group tab.</p>`:""}`}
function craftTab(){const fire=nearFire();return `<p class="mute" style="margin:0">Making things takes time. Some recipes need a tool or a fire.${fire?' <span class="pos">There\'s a fire here.</span>':""}</p><div class="cards">${RECIPES.map(r=>{const it=ITEMS[r.id];const ok=canCraft(r);
  return `<div class="card"><b>${esc(it.n)}</b><div class="mono mute">${Object.entries(r.need).map(([k,v])=>`${esc(ITEMS[k].n)} ×${v}`).join(", ")}${r.tool?` · a ${r.tool}`:""}${r.at?" · a fire":""} · ${r.h<1?Math.round(r.h*60)+" min":r.h+" h"}</div>${gearStats({id:r.id})}<button class="btn" data-act="craft" data-v="${r.id}"${ok===true?"":" disabled"}>Make it<small>${ok===true?"Ready":esc(ok)}</small></button></div>`}).join("")}</div>`}

// ---------- talk ----------
const QUICK=["How are you holding up?","Who are you?","Tell me about your family.","What do you need?","Come with me.","Can I join your group?","Want to trade?","What do you think of me?","Heard any news?"];
function talkTab(){const p=UI.talkTo?P(UI.talkTo):null;
  if(!p||!p.alive){const near=nearPeople(12);return `<p class="mute" style="margin:0">Click someone in the world to walk over and talk, or pick someone close by.</p><div class="chips">${near.map(q=>`<button class="chip" data-act="talkto" data-v="${q.id}">${esc(q.met?q.name:"Stranger")}</button>`).join("")||'<span class="mute">Nobody is close enough to talk to.</span>'}</div>`}
  const d=dist(p.x,p.z,S.player.x,S.player.z);const far=d>6&&!p.follow;const g=p.group?G(p.group):null;
  return `<div class="talk"><div class="row" style="justify-content:space-between"><div><h3 style="font-size:20px">${esc(p.met?fullName(p):"A stranger")}</h3><div class="mono mute">${p.age} · ${esc(p.met?JOBS[p.job].n:p.look)}${g?" · "+esc(g.name):""}${p.met?" · "+tierWord(tier(p)):""}</div></div><div class="row" style="gap:6px"><button class="tag" data-act="trade" data-v="${p.id}">Trade</button>${p.met?`<button class="tag" data-act="person" data-v="${p.id}">About ${esc(p.name)}</button>`:""}<button class="tag" data-act="endtalk">Done</button></div></div>
  ${p.want&&p.met?`<div class="card"><div class="lbl">${esc(p.name)} asked you</div>${esc(wantSummary(p))}</div>`:""}
  <div class="chat" id="chat">${p.chat.slice(-40).map(m=>`<div class="msg ${m.w}">${esc(m.x)}</div>`).join("")||`<div class="msg sys">${p.met?`You know ${esc(p.name)}. Say something.`:"You haven't met. Say something."}</div>`}</div>
  ${far?`<p class="warn mono" style="margin:0">${esc(p.met?p.name:"They")} can't hear you from here. Walk closer.</p>`:""}
  <form class="row" data-form="talk"><input id="talkbox" autocomplete="off" placeholder="Say anything..." value="${esc(UI.draft)}" maxlength="300" aria-label="What you say"><button class="btn pri" type="submit" style="flex:0 0 auto">Say it</button></form>
  <div class="chips">${QUICK.map(q=>`<button class="chip" data-act="quick" data-v="${esc(q)}">${esc(q)}</button>`).join("")}</div></div>`}
function tierWord(t){return{hostile:"hates you",cold:"cold toward you",neutral:"doesn't know you well",friendly:"likes you",close:"close to you"}[t]||""}
function wantSummary(p){const w=p.want;if(!w)return"";if(w.type==="fetch")return `Bring ${w.qty>1?w.qty+" × ":""}${ITEMS[w.item].n.toLowerCase()}.`;if(w.type==="find")return `Find their ${p.fam[w.about]||"family"}, ${P(w.about)?.name||"someone"}, and tell them where ${p.name} is.`;if(w.type==="mercy")return `Put their ${p.fam[w.about]||"loved one"}, ${P(w.about)?.name||"someone"}, to rest.`;return w.text}

// ---------- trade ----------
function openTrade(pid){const p=P(pid);if(!p||!p.alive)return;if(dist(p.x,p.z,S.player.x,S.player.z)>6&&!p.follow){toast(`${p.met?p.name:"They"} can't trade from over there. Walk closer.`);return}UI.modal={type:"trade",pid,give:{},take:{}};render()}
function tradables(){const pl=S.player;const out={};for(const [k,n] of Object.entries(pl.inv))if(ITEMS[k].v>0)out[k]=n;const eq=new Set(Object.values(pl.eq));for(const g of pl.gear)if(!eq.has(g.u))out["@"+g.u]=1;return out}
function valOf(k,p,mine){if(k[0]==="@"){const g=S.player.gear.find(x=>x.u===k.slice(1));return g?ITEMS[g.id].v*(.35+.65*durPct(g)/100)*(p.want&&p.want.item===g.id?2:1):0}const it=ITEMS[k];if(!it)return 0;let v=it.v;if(p.want&&p.want.item===k)v*=mine?2:1.5;if(it.eat&&p.hunger<40)v*=mine?1.4:1.3;return v}
function tradeSums(){const m=UI.modal;const p=P(m.pid);let give=0,take=0;for(const [k,n] of Object.entries(m.give))give+=valOf(k,p,true)*n;for(const [k,n] of Object.entries(m.take))take+=valOf(k,p,false)*n;return{give,take}}
function tradeOk(){const {give,take}=tradeSums();const p=P(UI.modal.pid);const f=feel(p);const fair=f<-40?.7:f<0?.85:f<40?1:f<70?1.15:1.3;return take===0?give>0:give*fair>=take}
function gearLabel(k){const g=S.player.gear.find(x=>x.u===k.slice(1));return g?`${ITEMS[g.id].n} (${Math.round(durPct(g))}%)`:"?"}
function tradeHtml(){const m=UI.modal;const p=P(m.pid);const mine=tradables();const theirs=Object.entries(p.pack).filter(([k,n])=>n>0&&ITEMS[k]);const {give,take}=tradeSums();const ok=tradeOk();
  const row=(side,k,n,label,v)=>{const sel=m[side][k]||0;return `<tr><td>${esc(label)} <span class="mute mono">×${n}</span></td><td class="num" title="Value">${Math.round(v)}</td><td style="white-space:nowrap;text-align:right"><button class="tag" data-act="tq" data-v="${side}|${k}|-1"${sel?"":" disabled"} aria-label="Less">−</button> <span class="mono">${sel}</span> <button class="tag" data-act="tq" data-v="${side}|${k}|1"${sel<n?"":" disabled"} aria-label="More">+</button></td></tr>`};
  return `<h2>Trade with ${esc(p.met?p.name:"a stranger")}</h2><p class="mute">${p.met?esc(p.name)+" "+tierWord(tier(p))+".":""} ${p.want&&p.want.type==="fetch"?`They asked you for ${esc(ITEMS[p.want.item].n.toLowerCase())}.`:""} Friends give better deals.</p>
   <div class="fgrid"><div><div class="lbl">You give</div><div class="scroll"><table><tbody>${Object.entries(mine).map(([k,n])=>row("give",k,n,k[0]==="@"?gearLabel(k):ITEMS[k].n,valOf(k,p,true))).join("")||'<tr><td class="mute">Nothing to trade.</td></tr>'}</tbody></table></div></div>
   <div><div class="lbl">They give</div><div class="scroll"><table><tbody>${theirs.map(([k,n])=>row("take",k,n,ITEMS[k].n,valOf(k,p,false))).join("")||'<tr><td class="mute">Nothing to spare.</td></tr>'}</tbody></table></div></div></div>
   <p class="mono" style="margin:0">${give+take?`You give ${Math.round(give)} worth · you get ${Math.round(take)} worth · <span class="${ok?"pos":"neg"}">${take===0&&give>0?"a gift":ok?"they'd take this":"they want more"}</span>`:"Pick what to give and what you want back."}</p>
   <div class="row"><button class="btn pri" data-act="dotrade"${give+take>0?"":" disabled"}>${take===0?"Give it to them":"Offer the trade"}</button><button class="btn" data-act="closemodal">Never mind</button></div>`}
function doTrade(){const m=UI.modal;const p=P(m.pid);const pl=S.player;const {give,take}=tradeSums();
  if(!tradeOk()){p.chat.push({w:"them",x:styleSay(p,pick(["That's not a trade. That's robbery.","Add something and we'll talk.","No. Not for that."]))});toast(`${p.met?p.name:"They"} won't take that.`);render();return}
  const given={};for(const [k,n] of Object.entries(m.give)){if(k[0]==="@"){const g=pl.gear.find(x=>x.u===k.slice(1));if(g){unequip(g.u);pl.gear=pl.gear.filter(x=>x!==g);p.pack[g.id]=(p.pack[g.id]||0)+1;given[g.id]=(given[g.id]||0)+1}}else{invTake(k,n);p.pack[k]=(p.pack[k]||0)+n;given[k]=(given[k]||0)+n}}
  for(const [k,n] of Object.entries(m.take)){p.pack[k]=(p.pack[k]||0)-n;if(p.pack[k]<=0)delete p.pack[k];invAdd(k,n)}
  const names=Object.entries(given).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:"")).join(", ");
  const w=p.want;if(w&&w.type==="fetch"&&(given[w.item]||0)>=w.qty){p.trust=clamp(p.trust+w.reward.trust,-100,100);p.aff=clamp(p.aff+w.reward.aff,-100,100);p.want=null;mem(p,`${pl.name} brought me ${ITEMS[w.item].n.toLowerCase()} when I needed it.`,8);
    p.chat.push({w:"them",x:styleSay(p,pick(["You actually did it. Thank you. I mean it.","*stares at it* I didn't think you'd come back. Thank you.","I owe you one. A real one."]))});
    const g=p.group?G(p.group):null;if(w.item==="antibiotics"&&g&&g.fever){g.feverCured=true;news(`${pl.name} brought antibiotics to ${g.name}. The fever's breaking.`,"good")}}
  else if(take===0){p.trust=clamp(p.trust+Math.min(10,give/3),-100,100);p.aff=clamp(p.aff+Math.min(12,give/2.5),-100,100);mem(p,`${pl.name} gave me ${names} and asked for nothing.`,Math.min(6,Math.round(give/4)));p.chat.push({w:"them",x:styleSay(p,pick(["For me? ...Thank you.","You don't have to do that. ...Thank you.","*turns it over in their hands* I won't forget this."]))})}
  else{p.trust=clamp(p.trust+1,-100,100);p.chat.push({w:"them",x:styleSay(p,pick(["Pleasure doing business.","Deal.","Fair enough."]))})}
  p.chat.push({w:"sys",x:take===0?`You gave ${names}.`:`You traded ${names||"nothing"} for ${Object.entries(m.take).map(([k,n])=>ITEMS[k].n.toLowerCase()+(n>1?" ×"+n:"")).join(", ")}.`});
  p.met=true;advance(5);UI.modal=null;UI.talkTo=p.id;UI.tab="talk";save();render()}

// ---------- group ----------
function groupTab(){const pl=S.player;const g=myGroup();if(!g)return noGroupHtml();
  const lead=g.leader==="you";const L=lead?null:P(g.leader);const home=g.home;
  let h=`<div class="row" style="justify-content:space-between"><div><h3 style="font-size:22px">${esc(g.name)}</h3><div class="mono mute">${home?esc(PLACES[home].n):"No camp yet: your people travel with you"} · ${groupSize(g.id)===1?"1 person":groupSize(g.id)+" people"} · led by ${lead?"you":esc(L?fullName(L):"nobody")}</div></div>${lead?`<button class="tag" data-act="renamegroup">Rename</button>`:""}</div>`;
  if(lead&&!home)h+=`<p class="warn" style="margin:0">Find a free camp and choose "Settle here" when you're standing in it. Free right now: ${freeSites().map(k=>esc(PLACES[k].n)).join(", ")||"none. Every site is taken."}</p>`;
  h+=`<div><div class="lbl">Stores</div><div class="scroll"><table><tbody><tr>${STOCK_KEYS.map(k=>`<th>${k}</th>`).join("")}</tr><tr>${STOCK_KEYS.map(k=>`<td class="num">${Math.floor(g.stock[k])}</td>`).join("")}</tr></tbody></table></div>
    <div class="mono mute" style="margin-top:4px">Defense ${defense(g.id)} · ${g.pol.ration==="half"?"half rations":"full meals"}${g.fever&&!g.feverCured?' · <span class="neg">fever in camp</span>':""}${home&&!atHome()?" · go back to camp to use the stores":""}</div></div>`;
  if(atHome())h+=storeHtml(g);
  if(home)h+=siteHtml(g,lead);
  if(lead)h+=policyHtml(g);
  h+=membersHtml(g,lead)+relationsHtml(g);
  h+=`<div class="row"><button class="btn" data-act="leavegroup">Leave ${esc(g.name)}<small>Your family comes with you</small></button></div>`;
  return h}
function storeHtml(g){const pl=S.player;const dep=Object.entries(pl.inv).filter(([k])=>DEPOSIT[k]);
  return `<div class="card"><div class="lbl">Put in the stores</div>${dep.length?`<div class="chips">${dep.map(([k,n])=>`<button class="chip" data-act="deposit" data-v="${k}">${esc(ITEMS[k].n)} ×${n}</button>`).join("")}<button class="chip" data-act="depositall">All of it</button></div>`:'<span class="mute">Nothing you carry goes in the stores.</span>'}
  <div class="lbl" style="margin-top:8px">Take from the stores</div><div class="chips">${Object.entries(WITHDRAW).map(([k,[it,c]])=>`<button class="chip" data-act="withdraw" data-v="${k}"${g.stock[k]>=c?"":" disabled"}>${esc(ITEMS[it].n)} <span class="mute">(${c} ${k})</span></button>`).join("")}</div></div>`}
function siteHtml(g,lead){const k=g.home;const s=S.sites[k];const ss=PLACES[k].site;const sel=UI.buildSel;
  const grid=`<div class="lotgrid" style="grid-template-columns:repeat(${ss.gw},minmax(0,1fr))">${s.grid.map((c,i)=>{const b=s.build.find(x=>x.tile===i);const on=UI.tileSel===i?" sel":"";
    if(c)return `<button class="tile b${on}" data-act="tile" data-v="${i}" style="background:${BLD[c.b].c}" title="${esc(BLD[c.b].n)}" aria-label="${esc(BLD[c.b].n)}">${BLD[c.b].ab}</button>`;
    if(b)return `<button class="tile site${on}" data-act="tile" data-v="${i}" title="${esc(BLD[b.b].n)}, being built" aria-label="${esc(BLD[b.b].n)}, being built">${BLD[b.b].ab}<span class="pg" style="width:${Math.round(Math.min(1,b.prog/BLD[b.b].work)*100)}%"></span></button>`;
    return `<button class="tile${on}" data-act="tile" data-v="${i}" aria-label="Empty lot"></button>`}).join("")}</div>`;
  const opts=Object.entries(BLD).filter(([b,d])=>lead||d.own);
  const palette=`<div class="chips">${opts.map(([b,d])=>{const can=lead?canAfford(g,d.cost):Object.entries(d.cost).every(([kk,v])=>invHas(kk,v));return `<button class="chip" data-act="bsel" data-v="${b}" aria-pressed="${sel===b}" style="${sel===b?"border-color:var(--ember);color:var(--ember)":""}"><span class="dot" style="background:${d.c}"></span>${esc(d.n)} <span class="mute" style="font-size:12px">${Object.entries(d.cost).map(([kk,v])=>v+" "+kk).join(", ")}</span>${can?"":' <span class="neg" style="font-size:12px">short</span>'}</button>`}).join("")}</div>`;
  let info="";if(UI.tileSel!=null){const c=s.grid[UI.tileSel];const b=s.build.find(x=>x.tile===UI.tileSel);
    if(c)info=`<div class="card"><b>${esc(BLD[c.b].n)}</b><div class="mute">${esc(BLD[c.b].d)}${c.by==="you"?" You built this.":""}</div>${lead?`<button class="btn" data-act="demolish" data-v="${UI.tileSel}">Tear it down<small>Half the materials come back</small></button>`:""}</div>`;
    else if(b)info=`<div class="card"><b>${esc(BLD[b.b].n)}</b><div class="mute">${Math.round(Math.min(1,b.prog/BLD[b.b].work)*100)}% built. The builders work on it every day, and you can help.</div>${lead?`<button class="btn" data-act="cancelbuild" data-v="${UI.tileSel}">Call it off<small>The materials come back</small></button>`:""}</div>`}
  return `<div><div class="lbl">The camp at ${esc(PLACES[k].n)}</div>${grid}<div class="mono mute" style="margin:6px 0">Beds for ${siteHousing(k)} · ${groupSize(g.id)===1?"1 person":groupSize(g.id)+" people"}. ${lead?"Pick something to build, then click an empty lot.":"You can put up a shelter of your own with your own materials."}</div>${palette}${sel?`<p class="mono warn" style="margin:6px 0 0">${esc(BLD[sel].n)}: ${esc(BLD[sel].d)} Now click an empty lot.</p>`:""}${info}</div>`}
function policyHtml(g){const sel=(k,opts)=>`<select data-sel="pol" data-k="${k}">${opts.map(([v,n])=>`<option value="${v}"${(g.pol[k]||"")===v?" selected":""}>${n}</option>`).join("")}</select>`;
  return `<div class="card"><div class="lbl">Your orders</div><div class="fgrid"><label class="field"><span class="lbl">Meals</span>${sel("ration",[["normal","Full meals"],["half","Half rations"]])}</label><label class="field"><span class="lbl">Focus</span>${sel("focus",[["balanced","Balanced"],["food","Food first"],["build","Building first"]])}</label><label class="field"><span class="lbl">Toward other groups</span>${sel("stance",[["friendly","Friendly"],["neutral","Wary"],["hostile","Take what we need"]])}</label><label class="field"><span class="lbl">What gets built</span>${sel("auto",[["","I decide"],["1","They can decide too"]])}</label></div></div>`}
function membersHtml(g,lead){const pl=S.player;const ms=members(g.id).sort((a,b)=>(b.age>=16)-(a.age>=16)||a.name.localeCompare(b.name));
  return `<div><div class="lbl">People</div><div class="scroll"><table><thead><tr><th>Name</th><th>Job</th><th>Health</th><th>Mood</th><th>Doing</th>${lead?"<th></th>":""}</tr></thead><tbody>${ms.map(p=>`<tr class="click" data-act="person" data-v="${p.id}"><td>${esc(p.name)} <span class="mute mono">${p.age}</span>${p.id===g.leader?' <span class="tag">leader</span>':""}${pl.fam[p.id]?` <span class="tag">${esc(pl.fam[p.id])}</span>`:""}${p.partner==="you"?' <span class="tag">partner</span>':""}</td>
   <td>${lead&&p.age>=12?`<select data-sel="role" data-v="${p.id}" aria-label="Job for ${esc(p.name)}">${Object.entries(ROLES).filter(([r])=>r!=="kid"&&r!=="elder").map(([r,d])=>`<option value="${r}"${p.role===r?" selected":""}>${d.n}</option>`).join("")}</select>`:esc(ROLES[p.role]?.n||"")}</td>
   <td class="num ${p.health<45?"neg":""}">${Math.round(p.health)}</td><td class="num ${p.mood<30?"neg":""}">${Math.round(p.mood)}</td><td class="mute">${esc(isFollower(p)?"with you":p.act)}</td>${lead?`<td>${p.id!==g.leader?`<button class="tag" data-act="kick" data-v="${p.id}">Send away</button>`:""}</td>`:""}</tr>`).join("")}</tbody></table></div></div>`}
function relationsHtml(g){const os=Object.values(S.groups).filter(o=>o.id!==g.id&&!o.dead&&groupSize(o.id)>0);if(!os.length)return"";
  return `<div><div class="lbl">Other groups</div><div class="scroll"><table><tbody>${os.map(o=>{const r=g.rel[o.id]||0;return `<tr><td><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</td><td class="mute">${o.home?esc(PLACES[o.home].n):"on the move"}</td><td class="num">${groupSize(o.id)}</td><td class="${g.allied[o.id]||r>30?"pos":r<-20?"neg":"mute"}">${g.allied[o.id]?"allies":r>30?"friendly":r<-30?"enemies":r<-10?"tense":"neutral"}</td></tr>`}).join("")}</tbody></table></div><p class="mono mute" style="margin:4px 0 0">Leaders speak for their people. Find one and talk: alliances, demands, trades.</p></div>`}
function noGroupHtml(){const gs=Object.values(S.groups).filter(o=>!o.dead&&groupSize(o.id)>0);const fol=S.people.filter(isFollower);
  return `<p style="margin:0">You're on your own${fol.length?`, with ${fol.map(p=>esc(p.name)).join(", ")}`:""}. People are banding together.</p>
  <ul class="mute" style="margin:0;padding-left:18px"><li>To join a group, find its leader and ask, in your own words.</li><li>To start your own, ask people to come with you. Then settle at a free camp.</li></ul>
  ${gs.length?`<div class="cards">${gs.map(o=>{const L=o.leader==="you"?null:P(o.leader);return `<div class="card"><b><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</b><div class="mono mute">${o.home?esc(PLACES[o.home].n):"on the move"} · ${groupSize(o.id)} people</div><div>Led by ${L?esc(L.met?fullName(L):fullName(L)+" (you haven't met)"):"nobody"}</div>${L&&L.met?`<div class="mono ${feel(L)>20?"pos":feel(L)<-10?"neg":"mute"}">${tierWord(tier(L))}</div>`:""}</div>`}).join("")}</div>`:'<p class="mute" style="margin:0">No groups have formed yet.</p>'}`}
function deposit(k){const g=myGroup();if(!g||!atHome())return;const n=S.player.inv[k]||0;if(!n||!DEPOSIT[k])return;const [s,m]=DEPOSIT[k];g.stock[s]+=n*m;invTake(k,n);const val=n*ITEMS[k].v;
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

// ---------- people ----------
function peopleTab(){const f=UI.peopleFilter;
  return `<div class="row"><div class="chips">${[["known","People you know"],["group","Your group"],["family","Family"],["lost","Lost"]].map(([k,n])=>`<button class="chip" data-act="pfilter" data-v="${k}" aria-pressed="${f===k}" style="${f===k?"border-color:var(--ember);color:var(--ember)":""}">${n}</button>`).join("")}</div><input id="pq" placeholder="Search by name" value="${esc(UI.peopleQ)}" style="max-width:220px" aria-label="Search people"></div>
  <div id="plist">${peopleListHtml()}</div>${UI.peopleSel&&P(UI.peopleSel)?profileHtml(P(UI.peopleSel)):""}`}
function peopleListHtml(){const pl=S.player;const f=UI.peopleFilter;const q=UI.peopleQ.trim().toLowerCase();
  let ps=S.people.filter(p=>p.met||pl.fam[p.id]);
  if(f==="group")ps=pl.group?S.people.filter(p=>p.alive&&p.group===pl.group):[];
  if(f==="family")ps=S.people.filter(p=>pl.fam[p.id]||p.partner==="you");
  if(f==="known")ps=ps.filter(p=>p.alive);
  if(f==="lost")ps=ps.filter(p=>!p.alive);
  if(q)ps=ps.filter(p=>fullName(p).toLowerCase().includes(q));
  ps.sort((a,b)=>feel(b)-feel(a));
  if(!ps.length)return `<p class="mute" style="margin:0">${f==="group"&&!pl.group?"You're not in a group.":f==="lost"?"You haven't lost anyone you know. Yet.":"Nobody here yet. Go and meet people."}</p>`;
  return `<div class="scroll"><table><thead><tr><th>Name</th><th>Group</th><th>Feels</th><th>Where</th></tr></thead><tbody>${ps.slice(0,90).map(p=>`<tr class="click" data-act="person" data-v="${p.id}"><td>${esc(fullName(p))} <span class="mute mono">${p.age}</span>${pl.fam[p.id]?` <span class="tag">${esc(pl.fam[p.id])}</span>`:""}${p.partner==="you"?' <span class="tag">partner</span>':""}${p.want&&p.alive&&p.met?' <span class="tag warn">asked you</span>':""}</td><td class="mute">${p.group&&G(p.group)?esc(G(p.group).name):p.alive?"none":""}</td><td class="${p.alive?(feel(p)>20?"pos":feel(p)<-10?"neg":"mute"):"mute"}">${p.alive?tierWord(tier(p)):esc(p.status==="turned"?"turned":p.status==="left"?"left town":"dead")}</td><td class="mute">${p.alive?esc(isFollower(p)?"with you":PLACES[p.loc]?.n||""):""}</td></tr>`).join("")}</tbody></table></div>`}
function profileHtml(p){const pl=S.player;const g=p.group?G(p.group):null;const fam=famList(p).filter(([q])=>q.id!=="you");const mems=p.mem.filter(m=>m.a==="you").slice(-5).reverse();const open=feel(p)>25||p.fam.you;
  const meter=(n,v)=>`<div class="meter"><span style="width:62px">${n}</span><div class="track"><i style="left:${v<0?50+v/2:50}%;width:${Math.abs(v)/2}%;background:${v<0?"var(--blood)":"var(--lichen)"}"></i></div><span style="width:30px;text-align:right">${Math.round(v)}</span></div>`;
  return `<div class="card" style="margin-top:4px"><div class="row" style="justify-content:space-between"><div><h3 style="font-size:20px">${esc(fullName(p))}</h3><div class="mono mute">${p.age} · ${esc(JOBS[p.job].n)}${g?` · ${esc(g.name)}${p.role?" ("+esc(ROLES[p.role].n.toLowerCase())+")":""}`:""}${p.alive?"":" · "+esc(p.status==="turned"?"turned":p.status==="left"?"left town":"dead")}</div></div>${p.alive?`<div class="row" style="gap:6px"><button class="tag" data-act="talkto" data-v="${p.id}">Talk</button><button class="tag" data-act="trade" data-v="${p.id}">Trade</button></div>`:""}</div>
   <div class="mute">${esc(cap(p.look))}. ${esc(cap(traitWords(p.tr).join(", ")))}.${p.style!=="kid"&&STYLES[p.style]?" Talks "+esc(STYLES[p.style])+".":""}</div>
   ${p.alive?meter("Trust",p.trust)+meter("Warmth",p.aff):""}
   ${open||p.told.who?`<div><span class="lbl">From</span> ${esc(p.facts.from)}${open?` · <span class="lbl">Misses</span> ${esc(p.facts.likes)}`:""}</div>`:""}
   ${open?`<div><span class="lbl">Afraid of</span> ${esc(p.facts.fear)} · <span class="lbl">Hopes for</span> ${esc(p.facts.hope)}</div>`:""}
   ${p.told.secret?`<div><span class="lbl">Told you</span> "${esc(p.facts.secret)}"</div>`:""}
   ${p.partner?`<div><span class="lbl">With</span> ${p.partner==="you"?"you":esc(P(p.partner)?.name||"someone")}</div>`:""}
   ${fam.length?`<div><span class="lbl">Family</span> ${fam.map(([q,r])=>`${esc(r)} ${esc(q.name)}${q.alive?"":" ("+(q.status==="turned"?"turned":q.status==="left"?"gone":"dead")+")"}`).join(", ")}</div>`:""}
   ${p.want&&p.alive&&p.met?`<div class="warn"><span class="lbl">Asked you</span> ${esc(wantSummary(p))}</div>`:""}
   ${mems.length?`<div><div class="lbl">What they remember about you</div>${mems.map(m=>`<div class="entry ${m.v>0?"good":m.v<0?"bad":""}"><div class="mono">Day ${m.d}</div>${esc(m.x)}</div>`).join("")}</div>`:""}</div>`}

// ---------- journal and map ----------
function journalTab(){const tip=dayOf(S.t)===1&&hourOf(S.t)<12?`<div class="card"><b>Getting started</b><div class="mute" style="font-size:14px">Walk with WASD, the arrow keys, or by clicking the ground. Click a person to walk over and talk, and type anything you like. Press E to search or knock, Space to fight. One real second is one minute here, and time stops while you type or read. The ? button on the map explains the rest.</div></div>`:"";
  return `${tip}<div class="journal" data-keep="journal">${S.journal.map(j=>`<div class="entry ${j.k}"><div class="mono">${stamp(j.t)}</div>${esc(j.x)}</div>`).join("")}</div>`}
function mapTab(){const gs=Object.values(S.groups).filter(o=>!o.dead&&groupSize(o.id)>0);
  return `<p class="mono mute" style="margin:0">Click the map to walk there. Orange is you, green is people with you and your group, red is the dead nearby.</p><canvas id="bigmap" data-act="mapclick" role="img" aria-label="Map of Millbrook" style="width:100%;aspect-ratio:1.3;border:1px solid var(--line);border-radius:4px;cursor:crosshair;display:block"></canvas>
  <div class="cards">${gs.map(o=>`<div class="card"><b><span class="dot" style="background:${o.color}"></span> ${esc(o.name)}</b><div class="mono mute">${o.home?esc(PLACES[o.home].n):"on the move"} · ${groupSize(o.id)} people</div></div>`).join("")}${freeSites().length?`<div class="card"><b>Unclaimed camps</b><div class="mute">${freeSites().map(k=>esc(PLACES[k].n)).join(", ")}</div></div>`:""}</div>`}
function drawBigMap(){const c=document.getElementById("bigmap");if(!c)return;const r=c.getBoundingClientRect();if(r.width<10)return;const dpr=Math.min(2,devicePixelRatio||1);const w=Math.round(r.width*dpr),h=Math.round(r.width/1.3*dpr);if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;drawMap(c,{big:true,dpr})}
function mapClick(e,c){const r=c.getBoundingClientRect();const x=WB.x0+(e.clientX-r.left)/r.width*(WB.x1-WB.x0),z=WB.z0+(e.clientY-r.top)/r.height*(WB.z1-WB.z0);if(!W3.ok){travelTo(x,z);return}walkTo(x,z);toast(`Walking toward ${PLACES[regionAt(x,z)].n}.`);drawBigMap()}
function travelTo(x,z){const pl=S.player;let p={x,z};if(!free(x,z,.4,false))p=randIn(regionAt(x,z),2);const d=dist(pl.x,pl.z,p.x,p.z);act(Math.max(1,Math.round(d/3.4)));if(pl.alive===false)return;pl.x=p.x;pl.z=p.z;snapFollowers();journal(`You walk to ${PLACES[regionAt(p.x,p.z)].n}.`);save();render()}

// ---------- modals ----------
function modalHtml(){const m=UI.modal;if(!m)return"";const wrap=(inner,label)=>`<div class="modal-bg"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(label)}">${inner}</div></div>`;
  if(m.type==="event"){const ev=EVENTS[m.id];const text=typeof ev.text==="function"?ev.text(m.data):ev.text;
    if(ev.input)return wrap(`<h2>${esc(ev.title)}</h2><p>${esc(text)}</p><form class="row" data-form="${ev.input}"><input id="minput" maxlength="30" placeholder="A name" required aria-label="Name"><button class="btn pri" type="submit" style="flex:0 0 auto">That's the name</button></form>`,ev.title);
    return wrap(`<h2>${esc(ev.title)}</h2><p>${esc(text)}</p><div class="choices">${ev.choices.map((c,i)=>`<button class="btn" data-act="choose" data-v="${i}">${esc(c.t)}</button>`).join("")}</div>`,ev.title)}
  if(m.type==="result")return wrap(`<h2>${esc(m.title)}</h2><p>${esc(m.text)}</p><div class="row"><button class="btn pri" data-act="closemodal">Continue</button></div>`,m.title);
  if(m.type==="help")return wrap(helpHtml(),"How to play");
  if(m.type==="name_group")return wrap(`<h2>Name your people</h2><p>Every group out here goes by something. What do you call yours?</p><form class="row" data-form="groupname"><input id="minput" maxlength="32" placeholder="${esc(myGroup()?.name||"")}" required aria-label="Group name"><button class="btn pri" type="submit" style="flex:0 0 auto">That's us</button></form>`,"Name your group");
  if(m.type==="trade")return P(m.pid)?wrap(tradeHtml(),"Trade"):"";
  if(m.type==="confirmNew")return wrap(`<h2>Start over?</h2><p>This life ends here and someone new wakes up on day one. Your current game is erased.</p><div class="row"><button class="btn pri" data-act="newgame">Start a new life</button><button class="btn" data-act="closemodal">Keep playing</button></div>`,"Start over");
  if(m.type==="dead")return wrap(deadHtml(),"The end");
  return""}
function helpHtml(){return `<h2>How to play</h2><p>You're one person in a town where everyone has a life of their own. Survive, and decide who you want to be to them.</p>
<div class="scroll"><table><tbody>
<tr><td>Walk</td><td>WASD or the arrow keys, or click the ground. Hold Shift to run, which is loud. Click the Map tab to walk somewhere far.</td></tr>
<tr><td>Talk</td><td>Click a person to walk over, then type anything. They remember what you say and do, and they talk about you behind your back.</td></tr>
<tr><td>Search, knock</td><td>Walk up to a building or a car and press E, or tap the prompt.</td></tr>
<tr><td>Fight</td><td>Space, or click one of the dead. Weapons wear out and guns draw a crowd. Armor makes bites less likely. A bite can't be cured.</td></tr>
<tr><td>Time</td><td>One real second is one minute. Long actions skip ahead. Time stops while you type, read or trade. The speed buttons go up to 8x. P pauses.</td></tr>
<tr><td>Groups</td><td>Ask a leader to take you in, or ask people to come with you and settle a free camp. Lead well and people follow you. Lead badly and they'll replace you.</td></tr>
<tr><td>Zoom</td><td>Scroll, or use the − and + buttons.</td></tr>
</tbody></table></div><p class="mute" style="margin:0">The game saves itself in this browser.</p>
<div class="row"><button class="btn pri" data-act="closemodal">Back to it</button><button class="btn" data-act="confirmnew">Start over</button></div>`}
function deadHtml(){const pl=S.player;const days=dayOf(S.t);const met=S.people.filter(p=>p.met).length;const friends=S.people.filter(p=>p.met&&feel(p)>30);const mourn=friends.filter(p=>p.alive).sort((a,b)=>feel(b)-feel(a)).slice(0,6);const kids=pl.kids.map(id=>P(id)).filter(Boolean);const g=myGroup();const turned=pl.cause==="the bite";
  return `<h2>${turned?"You turned":"You didn't make it"}</h2><p>${esc(`Day ${days}. ${turned?"The bite took you, the way it takes everyone.":`It was ${pl.cause||"your wounds"}.`} You were ${pl.name}, ${pl.age}${pl.bg?", once a "+pl.bg.toLowerCase():""}.`)}</p>
  <p>${esc(`You met ${met===1?"one person":met+" people"}. ${friends.length?(friends.length===1?"One of them":cap(numWord(friends.length))+" of them")+" would have called you a friend.":"None of them knew you long enough to call you a friend."} ${S.stats.kills?(S.stats.kills===1?"One of the dead":cap(numWord(S.stats.kills))+" of the dead")+" fell to your hand.":"You never had to put one of the dead down."}${g?` You were one of ${g.name}.`:""}`)}</p>
  ${mourn.length?`<div><div class="lbl">Who will remember you</div><p>${esc(mourn.map(p=>`${p.name}${pl.fam[p.id]?" ("+pl.fam[p.id]+")":p.partner==="you"?" (your partner)":""}`).join(", "))}</p></div>`:""}
  ${kids.length?`<p>${esc(kids.map(k=>k.alive?`${k.name} is still out there.`:`${k.name} went before you.`).join(" "))}</p>`:""}
  <div class="row"><button class="btn pri" data-act="newgame">Start a new life</button></div>`}
function choose(i){const m=UI.modal;if(!m||m.type!=="event")return;const ev=EVENTS[m.id];const c=ev.choices[i];UI.inChoice=true;let txt="";try{txt=c.go(m.data)||""}catch(err){console.error(err);txt="It's over before you can make sense of it."}UI.inChoice=false;
  snapFollowers();snapCamera();journal(txt,"big");if(S.player.hp<=0){UI.modal=null;die();return}UI.modal={type:"result",title:ev.title,text:txt};save();render()}

// ---------- character creation ----------
function defaultChar(){return{first:"",last:"",pron:"they/them",age:28,sex:"F",build:"average",hair:"brown",skin:"#c99873",mark:"",bg:"Nurse",traits:[],household:"alone",story:""}}
const BGS={"Nurse":"Medicine","Mechanic":"Making and building","Sheriff's deputy":"Fighting, talking","Line cook":"Survival, talking, making","Teacher":"Talking","Farmhand":"Survival, building","Construction worker":"Building, fighting","College student":"Scavenging, talking","Between jobs":"Scavenging"};
const TRAITS={Charming:"People warm to you faster",Tough:"Better in a fight",Handy:"Better at making and fixing",Resourceful:"Find more when you search",Kind:"Better at patching people up",Outdoorsy:"Better at foraging, hunting and fishing"};
const HOUSEHOLDS={alone:"You live alone",sibling:"Your younger brother or sister",partner:"Your partner",child:"Your kid, 6 to 12",parent:"Your mom or dad",roommate:"A roommate you barely know"};
function renderCreate(){const c=UI.create||(UI.create=defaultChar());const on=(k,v)=>k==="traits"?c.traits.includes(v):c[k]===v;
  const pk=(k,v,label,sub)=>`<button class="pick${on(k,v)?" on":""}" data-act="cpick" data-v="${k}|${esc(v)}" aria-pressed="${on(k,v)}">${esc(label||v)}${sub?`<br><span class="mono mute" style="font-size:11px">${esc(sub)}</span>`:""}</button>`;
  $app.innerHTML=`<div class="create">
   <div><div class="lbl">An original survival story</div><h1>Still Breathing</h1></div>
   <p class="lede">It's an ordinary Tuesday morning in Millbrook. By tonight the dead will be walking. Everyone in this town has a name, a past, people they love and things they hide, and they'll make their own choices. So will you.</p>
   <div class="fgrid">
    <label class="field"><span class="lbl">First name</span><input data-c="first" value="${esc(c.first)}" maxlength="20" autocomplete="off"></label>
    <label class="field"><span class="lbl">Last name</span><input data-c="last" value="${esc(c.last)}" maxlength="20" autocomplete="off"></label>
    <label class="field"><span class="lbl">Age (16 to 60)</span><input data-c="age" type="number" min="16" max="60" value="${esc(c.age)}"></label>
    <div class="field"><span class="lbl">Pronouns</span><div class="pickset">${["she/her","he/him","they/them"].map(v=>pk("pron",v)).join("")}</div></div>
   </div>
   <div class="field"><span class="lbl">Body</span><div class="pickset">${pk("sex","F","Can carry a child")}${pk("sex","M","Can father a child")}</div><span class="mono mute">This only decides who you could have a child with.</span></div>
   <div class="fgrid">
    <div class="field"><span class="lbl">Build</span><div class="pickset">${["slight","average","strong","heavy"].map(v=>pk("build",v)).join("")}</div></div>
    <div class="field"><span class="lbl">Hair</span><div class="pickset">${["black","brown","blond","red","gray","shaved"].map(v=>pk("hair",v)).join("")}</div></div>
    <div class="field"><span class="lbl">Skin</span><div class="pickset">${SKINS.map(v=>`<button class="pick${c.skin===v?" on":""}" data-act="cpick" data-v="skin|${v}" aria-label="Skin tone ${SKINS.indexOf(v)+1}" aria-pressed="${c.skin===v}" style="width:34px;height:30px;background:${v}"></button>`).join("")}</div></div>
    <label class="field"><span class="lbl">Something people notice</span><input data-c="mark" value="${esc(c.mark)}" maxlength="60" placeholder="a scar through one eyebrow"></label>
   </div>
   <div class="field"><span class="lbl">Before all this</span><div class="pickset">${Object.entries(BGS).map(([k,s])=>pk("bg",k,k,s)).join("")}</div></div>
   <div class="field"><span class="lbl">Two things about you (${c.traits.length} of 2)</span><div class="pickset">${Object.entries(TRAITS).map(([k,s])=>pk("traits",k,k,s)).join("")}</div></div>
   <div class="field"><span class="lbl">At home with you this morning</span><div class="pickset">${Object.entries(HOUSEHOLDS).map(([k,s])=>pk("household",k,cap(k),s)).join("")}</div></div>
   <label class="field"><span class="lbl">Your story, if you want one</span><textarea data-c="story" rows="3" maxlength="400" placeholder="Who were you before? Who are you looking for?">${esc(c.story)}</textarea></label>
   ${UI.cerr?`<p class="neg mono" role="alert" style="margin:0">${esc(UI.cerr)}</p>`:""}
   <div class="row"><button class="btn pri" data-act="begin" style="min-width:200px">Wake up<small>Day 1, 7:00 in the morning</small></button>${S?'<button class="btn" data-act="cancelnew">Back to my game</button>':""}</div></div>`}
function begin(){const c=UI.create;const first=c.first.trim(),last=c.last.trim();if(!first){UI.cerr="Give yourself a name.";renderCreate();return}if(c.traits.length<2){UI.cerr="Pick two things about you.";renderCreate();return}UI.cerr="";
  const age=clamp(parseInt(c.age)||28,16,60);
  newWorld({name:(first+" "+last).trim(),pron:c.pron,sex:c.sex,age,look:`${c.build} build, ${c.hair==="shaved"?"a shaved head":c.hair+" hair"}`,mark:c.mark.trim(),bg:c.bg,traits:[...c.traits],story:c.story.trim(),household:c.household,hair:c.hair,skin:c.skin});
  if(c.story.trim())journal(`Before all this: ${c.story.trim()}`,"");
  UI.create=null;UI.tab="journal";UI.talkTo=null;UI.paused=false;UI.speed=1;UI.modal={type:"help"};w3reset();w3buttons();save();render()}

// ---------- wiring ----------
function onAct(a,v,el,e){const pl=S&&S.player;
  switch(a){
    case"cpick":{const [k,val]=v.split("|");const c=UI.create;if(k==="traits"){if(c.traits.includes(val))c.traits=c.traits.filter(x=>x!==val);else{c.traits.push(val);if(c.traits.length>2)c.traits.shift()}}else c[k]=val;renderCreate();return}
    case"begin":begin();return;
    case"cancelnew":UI.create=null;render();return;
  }
  if(!S)return;
  switch(a){
    case"tab":UI.tab=v;render();if(v==="talk"){const b=document.getElementById("talkbox");if(b&&matchMedia("(pointer:fine)").matches)b.focus({preventScroll:true})}return;
    case"do":doAction(v);return;
    case"talkto":{const p=P(v);if(!p||!p.alive)return;const d=dist(p.x,p.z,pl.x,pl.z);if(d<2.2||(isFollower(p)&&d<6)||!W3.ok)openTalk(v);else{W3.attackT=null;W3.talkOnArrive=v;W3.ptarget={x:p.x,z:p.z};toast(`Walking over to ${p.met?p.name:"them"}.`)}return}
    case"endtalk":UI.talkTo=null;render();return;
    case"quick":UI.draft=v;sendTalk();return;
    case"trade":openTrade(v);return;
    case"person":UI.peopleSel=v;UI.tab="people";render();return;
    case"pfilter":UI.peopleFilter=v;render();return;
    case"use":useItem(v);return;
    case"drop":if(invHas(v)){invTake(v,1);journal(`You leave the ${ITEMS[v].n.toLowerCase()} behind.`)}save();render();return;
    case"dropg":{const g=pl.gear.find(x=>x.u===v);if(g){unequip(g.u);pl.gear=pl.gear.filter(x=>x!==g);journal(`You leave the ${ITEMS[g.id].n.toLowerCase()} behind.`)}save();render();return}
    case"equip":equip(v);save();render();return;
    case"unequip":unequip(v);save();render();return;
    case"repair":repair(v);save();render();return;
    case"craft":craft(v);return;
    case"deposit":deposit(v);save();render();return;
    case"depositall":for(const k of Object.keys(pl.inv))if(DEPOSIT[k])deposit(k);save();render();return;
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
    case"tq":{const [side,k,d]=v.split("|");const m=UI.modal;if(!m||m.type!=="trade")return;const max=side==="give"?(tradables()[k]||0):(P(m.pid).pack[k]||0);m[side][k]=clamp((m[side][k]||0)+(+d),0,max);if(!m[side][k])delete m[side][k];render();return}
    case"dotrade":doTrade();return;
    case"confirmnew":UI.modal={type:"confirmNew"};render();return;
    case"newgame":wipeSave();S=null;UI.modal=null;UI.create=defaultChar();UI.tab="journal";UI.talkTo=null;UI.paused=false;render();return;
    case"mapclick":mapClick(e,el);return;
  }}
function onForm(f,form){const val=(form.querySelector("input")?.value||"").trim();
  if(f==="talk"){sendTalk();return}
  if(f==="childname"){const m=UI.modal;const c=m&&m.data?P(m.data.child):null;if(val&&c){c.name=val;journal(`You name ${c.sex==="F"?"her":"him"} ${val}.`,"big")}UI.modal=null;save();render();checkPending();return}
  if(f==="groupname"){const g=myGroup();if(val&&g){g.name=val;news(`${S.player.name}'s people call themselves ${val} now.`,"")}UI.modal=null;save();render();checkPending();return}}
$app.addEventListener("click",e=>{if(e.target.closest("select,input,textarea,option,label.field"))return;const el=e.target.closest("[data-act]");if(!el||el.disabled)return;onAct(el.dataset.act,el.dataset.v,el,e);if(e.detail>0&&el.tagName==="BUTTON"&&el.isConnected)el.blur()});
$app.addEventListener("submit",e=>{e.preventDefault();onForm(e.target.dataset.form,e.target)});
$app.addEventListener("input",e=>{const el=e.target;if(el.id==="talkbox")UI.draft=el.value;else if(el.dataset.c&&UI.create)UI.create[el.dataset.c]=el.value;else if(el.id==="pq"){UI.peopleQ=el.value;const L=document.getElementById("plist");if(L)L.innerHTML=peopleListHtml()}});
$app.addEventListener("change",e=>{const el=e.target;if(el.dataset.sel==="role"){setRole(el.dataset.v,el.value);el.blur()}else if(el.dataset.sel==="pol"){setPol(el.dataset.k,el.value)}});
function fixNext(){let m=0;const sc=s=>{const n=parseInt(String(s).replace(/^\D+/,""));if(n>m)m=n};for(const p of S.people)sc(p.id);for(const z of S.zeds)sc(z.id);for(const g of S.player.gear)sc(g.u);NEXT=m+1}
function boot(){initWorldView();const s=loadSave();if(s&&s.v===2&&s.player&&Array.isArray(s.people)){S=s;reindex();fixNext();UI.create=null;w3reset();if(S.player.alive===false)UI.modal={type:"dead"}}else{S=null;UI.create=defaultChar()}render();requestAnimationFrame(frame)}
document.addEventListener("visibilitychange",()=>{if(document.hidden&&S&&!UI.create)save()});addEventListener("pagehide",()=>{if(S&&!UI.create)save()});
// keep progress when a new version of the page arrives while it's open
let booted=false;const start=()=>{if(booted)return;booted=true;boot()};
try{window.claude?.hot?.snapshot?.(()=>{try{if(S&&!UI.create)save()}catch(e){}return {}})}catch(e){}
try{if(window.claude?.hot?.ready){window.claude.hot.ready(start);setTimeout(start,2500)}else start()}catch(e){start()}
</script>
