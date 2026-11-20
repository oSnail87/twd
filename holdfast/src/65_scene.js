// ================= meeting someone =================
// Survivors walking up to camp, or someone you find hiding, get a scene of their own: the clock stops, the bars come
// down, the camera closes in, and you talk it through before you decide. Some of them are hiding a bite. There are
// tells, if you're watching: a sleeve pulled down, a rag on an arm, an answer that comes too fast.
const BITE_SPOT=["left forearm","right forearm","wrist","calf","shoulder","hand"];
function maybeHiddenBite(hh){if(!hh.length||rf()>=.12)return;const L=hh.filter(p=>!p.kid);const b=L.length?pick(L):hh[0];b.bitten=true;b.hidBite=true;b.biteWhere=pick(BITE_SPOT)}
// a group that came together: whoever you met and their family who are still strangers
function sceneGroup(p){return[p,...famOf(p).filter(q=>q.status==="stranger"&&q.loc===p.loc)]}
function sceneEl(){let e=$("scene");if(!e){e=document.createElement("div");e.id="scene";
    e.innerHTML=`<div class="lb top"></div><div class="lb bot"></div><div class="cap"><div class="who"></div><div class="line"></div><div class="ch"></div><div class="hint"></div></div>`;
    $("app").appendChild(e);e.querySelector(".cap").addEventListener("click",ev=>{if(!ev.target.closest("button"))sceneNext()})}return e}
// someone's here: start the scene now if nothing's in the way, or as soon as it isn't
function meet(G,how,now){G=G.filter(p=>p&&p.status==="stranger");if(!G.length||!S)return;
  if(!now||UI.scene||UI.grab||UI.modal||S.flags.traveling||$("title")?.style.display!=="none"){UI.sceneQ={ids:G.map(p=>p.id),how};UI.sceneT=0;return}
  startScene(G,how)}
function startScene(G,how){const pl=S.player;closeAll();if(UI.place)cancelPlace();if(UI.pushPick)cancelPushPick();if(pl.order){pl.order.queue=null;endOrder(pl,true)}if(S.push)endPush(false);
  pl.tx=null;pl.tz=null;pl.path=null;pl.onArrive=null;
  const L=G.find(p=>!p.kid)||G[0];G=[L,...G.filter(p=>p!==L)];
  // where everyone stands: them a little apart, you a couple of paces off, facing them
  const g=how==="arrive"&&L.tx!=null&&L.goal?L.goal:null;const gd=g?dist(L.x,L.z,g.x,g.z):0;const home=g&&gd>.5?{x:L.x+(g.x-L.x)/gd*Math.min(gd,3.5),z:L.z+(g.z-L.z)/gd*Math.min(gd,3.5)}:{x:L.x,z:L.z};let a=Math.atan2(pl.x-home.x,pl.z-home.z);if(!isFinite(a))a=0;
  const me={x:home.x+Math.sin(a)*2.6,z:home.z+Math.cos(a)*2.6};const marks=G.map((p,i)=>i===0?home:{x:home.x+Math.sin(a+Math.PI+(i%2?1:-1)*(.9+.25*Math.floor(i/2)))*1.25,z:home.z+Math.cos(a+Math.PI+(i%2?1:-1)*(.9+.25*Math.floor(i/2)))*1.25});
  const walk=clearLine(pl.loc,pl.x,pl.z,me.x,me.z)&&dist(pl.x,pl.z,me.x,me.z)<14;if(!walk){pl.x=me.x;pl.z=me.z}
  for(const p of G){p.tx=null;p.tz=null;p.path=null;p.onArrive=null}
  UI.scene={ids:G.map(p=>p.id),how,q:[],typ:null,asked:{},t:0,phase:"in",z0:W.zoom,free0:W.free,
    moves:[{o:pl,x:me.x,z:me.z},...G.map((p,i)=>({o:p,x:marks[i].x,z:marks[i].z}))],look:{x:(home.x+me.x)/2,z:(home.z+me.z)/2},
    bite:G.find(p=>p.hidBite)?.id||null,known:false,sus:false,checked:false,trust:0,fed:false};
  W.free=true;$("app").classList.add("scening");const e=sceneEl();e.classList.add("open");requestAnimationFrame(()=>e.classList.add("in"));
  sceneShow(null,"",[]);for(const l of sceneOpening(G,how))UI.scene.q.push(l);
  if(typeof sfx==="function")sfx("creak",home.x,home.z)}
const SC_G=()=>UI.scene?UI.scene.ids.map(P).filter(Boolean):[];
// ---------- what they look like, and what they say ----------
function looksLike(p){const r=Math.round(p.age/5)*5;if(p.kid)return`${p.sex==="F"?"a girl":"a boy"} of maybe ${p.age}`;if(p.age>58)return p.sex==="F"?"an older woman":"an older man";if(p.age<24)return p.sex==="F"?"a young woman":"a young man";return`${p.sex==="F"?"a woman":"a man"} of about ${r}`}
const WORN={farmer:"in work boots and a seed-company cap",nurse:"in hospital scrubs under a parka",mechanic:"got old grease ground into both hands",teacher:"carrying a backpack full of paperbacks",deputy:"in what's left of a deputy's uniform",
  cook:"in a diner apron that was white once",carpenter:"got a hammer hung through a belt loop",trucker:"in a quilted trucker's jacket",vet:"carrying a vet's bag over one shoulder",soldier:"in an Army jacket, and moves like someone trained to",
  clerk:"still wearing a Food King name tag",rancher:"in a sheepskin coat and a beat-up hat",pastor:"wearing a clerical collar under the coat",student:"in a college hoodie three days past clean",hunter:"in hunting camo, with a knife on the belt",retiree:"in a cardigan and good walking shoes"};
const TELLS=[(p,q)=>`${p.name} keeps ${q} left sleeve pulled down over ${q} hand.`,(p)=>`${p.name} is sweating, and it isn't warm out.`,(p)=>`There's a dirty rag knotted around ${p.name}'s arm.`,(p)=>`${p.name} flinches when anyone gets close.`,(p,q)=>`${p.name} won't take ${q} jacket off, even by the fire.`];
function sceneOpening(G,how){const L=G[0];const rest=G.slice(1);const out=[];const at=S.player.loc===campK();
  const who=cap1(looksLike(L))+(rest.length?` and ${listAnd(rest.map(looksLike))}`:"");
  out.push({n:how==="found"?`${cap1(looksLike(L))} steps out from where ${pronoun(L)}'s been hiding${rest.length?`, then ${listAnd(rest.map(looksLike))}`:""}. Hands where you can see them.`
    :how==="home"?`${who}. ${G.length>1?"They've":pronoun(L,"S")+"'s"} been waiting at the edge of camp for you.`:`${who}, coming up the road on foot. They stop when they see you.`});
  const worn=L.job0&&WORN[L.job0];const cond=L.cond==="diabetic"||L.cond==="heart"?` ${pronoun(L,"S")} looks gray, and ${pronoun(L)} moves slowly.`:"";
  out.push({n:`${worn?`${cap1(pronoun(L))}'s ${worn}.`:`${cap1(pronoun(L))}'s carrying everything ${pronoun(L)} owns.`}${cond}`.replace(/^(\w)/,c=>c.toUpperCase())});
  // a tell, if someone's bitten; sometimes the same look on someone who isn't
  const b=G.find(p=>p.hidBite);const fake=!b&&rf()<.18?pick(G.filter(p=>!p.kid))||null:null;const t=b||fake;if(t)out.push({n:pick(TELLS)(t,pronoun(t,"p"))});
  out.push({w:L.id,x:openingLine(L,G)});
  // someone of yours has an opinion, in camp
  if(at){const mine=members().filter(q=>q.loc===campK()&&!q.kid&&!(q.away&&q.away.out)&&!q.sleep);const n=campSize();
    const hard=mine.filter(q=>q.tr.kind<-.15||S.res.food<n*2).sort((a,b)=>a.tr.kind-b.tr.kind)[0];const soft=mine.filter(q=>q.tr.kind>.3).sort((a,b)=>b.tr.kind-a.tr.kind)[0];
    const kid=G.find(p=>p.kid);const q=(S.res.food<n*2||rf()<.5)&&hard?hard:soft||hard;
    if(q)out.push({w:q.id,x:q===hard&&(S.res.food<n*2||q.tr.kind<-.15)?pick([S.res.food<n*2?"We can barely feed who we've got.":"We don't know these people.","Careful. Check them for bites first.",`That's ${G.length} more mouths${S.res.food<n*3?", and the food's already short":""}.`])
      :pick([kid?`They've got a kid with them. Come on.`:"Look at them. They're dead on their feet.","We were them, not long ago.","More hands. We need more hands."])})}
  return out}
function openingLine(L,G){const kid=G.find(p=>p.kid&&p!==L);const T=L.tr;
  if(L.kid)return pick(["...Are you the ones with the fire?","Please don't shoot.","I'm not bitten. I'm not."]);
  if(kid&&L.motive==="family")return pick([`Please. We're not looking for trouble. ${kid.name} hasn't eaten since yesterday.`,`I'm not asking for me. I'm asking for ${kid.name}.`]);
  if(T.temper>.45)return pick(["I saw your smoke. Anyone with smoke has food. So. Here we are.","Easy. I'm not here to start anything."]);
  return({safety:"We saw the walls. Or what you've got of them. We need walls.",belonging:"Hi. Sorry. It's been a while since I talked to anyone who talked back.",purpose:"I can work. Whatever you need done, I'll do it.",
    revenge:"You've killed some of them. Good. I want in on that.",faith:"God's kept us alive this long. I'm hoping He walked us here for a reason.",freedom:"Just passing through, maybe. Depends what kind of place this is.",
    family:"Please. We just need somewhere to sleep that isn't a car."})[L.motive]||"Please. We just need somewhere safe."}
const JOB_SAY={farmer:"I farm. Farmed. Corn and beans, out past Millbrook.",nurse:"I'm a nurse. ER, at County General.",mechanic:"I fix cars. Had my own shop on Route 9.",teacher:"I taught fourth grade.",
  deputy:"Sheriff's deputy. For whatever that's worth now.",cook:"I worked the line at a diner off the interstate.",carpenter:"Carpenter. Framing, mostly. Houses.",trucker:"I drove a truck. Long haul.",
  vet:"I'm a vet. Cows, dogs, whatever came through the door.",soldier:"I was in the Army. Two tours.",clerk:"I ran a register at the Food King in town.",rancher:"I ran cattle, west of here.",
  pastor:"I'm a pastor. Small church, up the valley.",student:"I was at State. Sophomore. Undeclared.",hunter:"I guided hunting trips. Deer, mostly.",retiree:"Retired. Machinist, thirty-one years."};
const CAN_SAY={med:"I can stitch a cut and set a bone, and I know what's in most pill bottles.",build:"I can build. Give me wood and nails and I'll give you walls.",fight:"I can handle myself. I've put down more of them than I can count.",
  farm:"I can grow food. Anything, given a season.",scav:"I can find things. I know where people hide what matters.",cook:"I can cook. I can make a can of beans and a rabbit feed six."};
const NEED_SAY={safety:"Walls. People awake at night. I can't sleep out in the open anymore.",belonging:"Honestly? People. I've been alone so long I've started talking to myself.",purpose:"Something to do. Put me to work, or I'll go crazy.",
  revenge:"A place to come back to, between going out there and killing as many of them as I can.",faith:"A place to rest. That's all. A place to rest.",freedom:"Food. A night's sleep. I don't do well with rules, I'll tell you that now.",family:"Somewhere safe. A roof and a door that locks."};
function topSkill(p){let b=null,v=0;for(const [k,n] of Object.entries(p.sk))if(n>v){v=n;b=k}return b}
// the questions, and their answers
const SC_Q=[
  {k:"who",t:"Who are you?",f:G=>{const L=G[0];for(const p of G)p.met=true;const o=[{w:L.id,x:L.kid?`I'm ${L.name}.`:`${L.name} ${L.sur}. ${JOB_SAY[L.job0]||"I didn't do anything worth telling."}`}];
    for(const q of G.slice(1)){const rel=L.fam[q.id];o.push(q.kid?{w:L.id,x:`And this is ${q.name}. ${pronoun(q,"S")}'s ${q.age}.`}:{w:q.id,x:`${q.name}.${rel?` ${pronoun(L,"p")==="her"?"Her":"His"} ${rel}.`:""} ${q.job0?JOB_SAY[q.job0].split(".")[0]+".":""}`.replace(/\s+/g," ").trim()})}return o}},
  {k:"bite",t:"Has anyone been bitten? Any of you?",f:G=>{const L=G[0];const sc=UI.scene;const b=G.find(p=>p.id===sc.bite);
    if(b&&sc.known)return[{w:b.id,x:"You've seen it. Yes."}];
    if(!b)return[{w:L.id,x:L.tr.temper>.4?"No. And I don't love the question.":pick(["No. God, no.","No. We've been careful.","No. Nobody. We know what it means."])}];
    const honest=rf()<.25+Math.max(0,b.tr.kind)*.35+Math.max(0,b.tr.faith||0)*.3;
    if(honest){sc.known=true;return[{n:"Nobody says anything for a second."},{w:b.id,x:`...I was. My ${b.biteWhere}. ${pick(["Yesterday","Two days ago","This morning"])}. I don't feel sick. I don't.`},...(G.length>1?[{w:(G.find(q=>q!==b&&!q.kid)||L).id,x:"Please. It might not take. Sometimes it doesn't take."}]:[])]}
    sc.sus=true;return[{w:b.id,x:"No."},{n:pick([`It comes out a little too fast.`,`Nobody looks at ${b.name} when ${pronoun(b)} says it.`,`${b.name} doesn't look at you when ${pronoun(b)} says it.`])}]}},
  {k:"can",t:"What can you do?",f:G=>{const L=G[0];const o=[];const s=topSkill(L);
    o.push({w:L.id,x:L.kid?"I can carry water. And I'm quiet. I'm really quiet.":(s?CAN_SAY[s]:"Honestly? Not much. But I'll learn, and I'll work.")});
    const gun=Object.keys(L.carry||{}).find(k=>GUNS[k]);const med=L.cond&&CONDS[L.cond].item;if(gun)o.push({w:L.id,x:`And I've got a ${ITEMS[gun]}, with ${L.carry.ammo||"a few"} rounds.`});
    for(const q of G.slice(1).filter(q=>!q.kid)){const t=topSkill(q);if(t)o.push({w:q.id,x:CAN_SAY[t].split(",")[0].replace(/\.$/,"")+"."})}
    if(med&&L.carry&&L.carry[med])o.push({n:`${L.name} has ${ITEMS[med]?.toLowerCase()||med} in a coat pocket, and keeps a hand on it.`});return o}},
  {k:"with",t:"Who else is with you?",f:G=>{const L=G[0];if(G.length===1)return[{w:L.id,x:pick(["Just me. There were others. There aren't now.","Just me.","Nobody. Not anymore."])}];
    const kid=G.find(p=>p.kid);return[{w:L.id,x:`Just us. ${listAnd(G.slice(1).map(q=>`${q.name}, my ${L.fam[q.id]||"friend"}`))}.${kid?` ${kid.name}'s ${kid.age}.`:""}`},{w:L.id,x:pick(["There were more of us when we started.","Nobody's following us, if that's what you're asking."])}]}},
  {k:"need",t:"What do you need?",f:G=>{const L=G[0];const kid=G.find(p=>p.kid&&p!==L);const o=[];UI.scene.trust+=3;
    if(L.cond){const C=CONDS[L.cond];o.push({w:L.id,x:`I'm ${C.n}. I need ${C.need}.${L.carry&&L.carry[C.item]?` I've got ${L.carry[C.item]} left.`:" I'm out."}`})}
    o.push({w:L.id,x:kid&&L.motive==="family"?`Somewhere safe for ${kid.name}. That's all. A roof and a door that locks.`:NEED_SAY[L.motive]||"Somewhere safe."});return o}},
  {k:"check",t:"Show me your arms. All of you.",f:G=>{const L=G[0];const sc=UI.scene;const b=G.find(p=>p.id===sc.bite);sc.checked=true;sc.trust-=4;
    if(b){const refuse=!sc.known&&(b.tr.temper>.35||b.motive==="freedom");if(refuse&&!sc.pushed){sc.pushed=true;sc.sus=true;return[{w:b.id,x:"No. I'm not stripping for you."},{n:`${b.name} folds ${pronoun(b,"p")} arms. That tells you something on its own.`}]}
      sc.known=true;b.hidBite=false;b.shown=true;const fam=G.find(q=>q!==b&&!q.kid&&b.fam[q.id]);
      return[{n:`Under ${b.name}'s sleeve: a bite on the ${b.biteWhere}, ringed purple, a day or two old.`},{w:b.id,x:pick(["I was going to tell you.","Please. I'm not sick. Look at me, I'm not sick.","...Yeah."])},...(fam?[{w:fam.id,x:`Please. It doesn't always take. Please.`}]:[])]}
    for(const q of members().filter(q=>q.loc===S.player.loc))q.mood=clamp(q.mood+1,0,100);
    return[{w:L.id,x:L.tr.temper>.3?"Fine. Look. Happy?":"Okay. Here. Look."},{n:"Clean. Not a mark on any of them."}]}},
];
SC_Q.find(q=>q.k==="check").again=true;
// what you can decide
function sceneDecisions(G){const sc=UI.scene;const L=G[0];const b=G.find(p=>p.id===sc.bite);const known=sc.known&&b;const camp=!!S.camp;const there=S.player.loc!==campK()&&camp;const D=[];
  D.push({t:known?"Let them in anyway":camp?"Let them in":"Bring them with you",d:known?`${b.name} is bitten. You'll have to decide what to do about that, soon.`:there?"They come with you, and home to camp.":camp?`${G.length>1?"They join":`${L.name} joins`} the camp.`:"They come along with the group.",f:()=>sceneLetIn(G)});
  if(known&&G.length>1)D.push({t:`Take the others. Not ${b.name}.`,d:`${b.name}'s family won't forgive you easily.`,f:()=>sceneSplit(G,b)});
  const food=there?gCount(S.haul,"food"):S.res.food;D.push({t:"Give them some food and send them on",d:food>=2?"Two days of food, and a kind word. Nothing else.":there?"You're not carrying any food to spare.":"There isn't food to spare.",off:food<2,f:()=>sceneFeed(G)});
  if(camp&&!there)D.push({t:"Tell them to wait outside for now",d:"They'll wait a day at the edge of camp. Decide later.",f:()=>sceneWait(G)});
  D.push({t:"Turn them away",d:there?"Leave them be.":"Send them back down the road.",f:()=>sceneAway(G)});return D}
function sceneLetIn(G){const sc=UI.scene;const L=G[0];const b=G.find(p=>p.id===sc.bite);
  // someone you found hiding might still say no
  if(sc.how==="found"){const r=weigh(L,"join");if(!r.yes&&sc.trust<4){for(const q of G){q.status="left";q.scened=true}return[{w:L.id,x:"...No. Thank you. We do better on our own."},{n:"They slip off the way they came."}]}}
  const g=admit(L);for(const q of g){q.scened=true;q.trust=clamp(q.trust+sc.trust,0,100);mem(q,`${S.player.name} let us in${sc.checked?", after checking us for bites":""}.`,sc.checked?3:5)}
  if(!S.camp)for(const q of g)q.follow=true;else if(S.player.loc!==campK()){const k=S.player.loc;for(const q of g){q.loc=k;q.follow=true;q.away=null}}
  if(b){if(sc.known){b.hidBite=false;queueCard("bitten",{who:b.id})}}
  return[{w:L.id,x:pick(["Thank you. You won't regret it.","Thank you. Really.","...Okay. Okay. Thank you."])}]}
function sceneSplit(G,b){const sc=UI.scene;const others=G.filter(q=>q!==b);b.status="left";b.scened=true;const g=admit(others[0]);for(const q of g){q.scened=true;q.trust=clamp(q.trust-15,0,100);q.mood=clamp(q.mood-25,0,100);if(q.fam[b.id])mem(q,`${S.player.name} wouldn't let ${b.name} in. ${b.name} was bitten.`,-8)}
  moveTo(b,ENTRY.x,ENTRY.z+4);log(`${b.name} walks back down the road alone.`,"bad");
  return[{w:b.id,x:pick(["It's okay. It's okay. Go on.","Look after them. Please."])},{n:`${listAnd(g.map(q=>q.name))} watch${g.length>1?"":"es"} ${pronoun(b,"o")} go until there's nothing left to watch.`}]}
function sceneFeed(G){const L=G[0];if(!S.camp||S.player.loc===campK())S.res.food=Math.max(0,S.res.food-2);else{let n=2;for(const o of [...S.haul.items]){if(o.k!=="food"||n<=0)continue;const d=Math.min(o.n,n);o.n-=d;n-=d;if(o.n<=0)S.haul.items.splice(S.haul.items.indexOf(o),1)}}
  for(const q of G){q.scened=true}turnAway(L);for(const q of members())if(q.tr.kind>.2)q.mood=clamp(q.mood+3,0,100);syncInv();
  const tips=Object.keys(LOCS).filter(k=>k!=="start"&&k!==campK()&&!place(k).seen&&LOCS[k].kind!=="road");const tip=tips.length&&rf()<.6?pick(tips):null;
  const o=[{w:L.id,x:pick(["Thank you. That's more than most would do.","God bless you. I mean it.","...Thank you."])}];
  if(tip){place(tip).tip=true;o.push({w:L.id,x:`One thing. ${LOCS[tip].n}: we went past it. Nobody's been through it yet.`});log(`${L.name} told you nobody's been through ${LOCS[tip].n} yet.`,"hint")}return o}
function sceneWait(G){const L=G[0];for(const q of G){q.scened=true;q.waitTill=S.t+24*HOUR;q.act="waiting at the edge of camp"}log(`${listAnd(G.map(q=>q.name))} wait${G.length>1?"":"s"} at the edge of camp. Click them when you've decided.`);
  return[{w:L.id,x:pick(["Okay. We'll be right here.","We'll wait. Thank you for not saying no.","Fine. We've waited longer for less."])}]}
function sceneAway(G){const L=G[0];for(const q of G)q.scened=true;turnAway(L);const T=L.tr;
  return[{w:L.id,x:T.temper>.35?"You'll remember this. I will.":T.kind>.3?"...I understand. Good luck to you.":pick(["Right.","Fine. Hope it's worth it.","Come on. Let's go."])},{n:"They go back the way they came."}]}
// ---------- running it ----------
function sceneShow(who,text,choices){const e=sceneEl();const p=who==="n"||!who?null:P(who);const w=e.querySelector(".who"),l=e.querySelector(".line");
  w.textContent=p?(p.id==="you"?"You":p.met||p.status==="member"?p.name:"Stranger"):"";w.className="who"+(p?"":" nar");l.className="line"+(p?"":" nar");l.textContent=text;
  e.querySelector(".ch").innerHTML=choices.map((c,i)=>c.sep?`<div class="sep">${esc(c.sep)}</div>`:`<button data-act="scpick" data-i="${c.i}"${c.off?" disabled":""}><span class="k">${c.n}</span>${esc(c.t)}${c.d?`<small>${esc(c.d)}</small>`:""}</button>`).join("");
  e.querySelector(".hint").textContent=choices.length?"":"Click or press Space"}
function sceneLine(l){const sc=UI.scene;sc.typ={w:l.n!=null?"n":l.w,x:l.n!=null?l.n:l.x,shown:0};const o=sc.typ.w!=="n"?P(sc.typ.w):null;if(o)say(o,sc.typ.x,o.id!=="you");sceneShow(sc.typ.w,"",[])}
function sceneNext(){const sc=UI.scene;if(!sc||sc.phase==="out")return;if(sc.phase==="in"){sc.t=99;return}
  if(sc.typ&&sc.typ.shown<sc.typ.x.length){sc.typ.shown=sc.typ.x.length;sceneShow(sc.typ.w,sc.typ.x,[]);return}
  if(sc.q.length){sceneLine(sc.q.shift());return}
  if(sc.done){sceneEnd();return}if(!sc.menu)sceneMenu()}
function sceneMenu(){const sc=UI.scene;const G=SC_G();if(!G.length){sceneEnd();return}sc.menu=[];let n=1;const ch=[];
  for(const Q of SC_Q){if(sc.asked[Q.k]&&!(Q.again&&sc.pushed&&!sc.known&&sc.asked[Q.k]===1))continue;if(Q.k==="bite"&&sc.known)continue;sc.menu.push({q:Q});ch.push({i:sc.menu.length-1,n:n++,t:Q.k==="check"&&sc.asked.check?"Insist. Sleeves up, now.":Q.t})}
  ch.push({sep:"Decide"});for(const D of sceneDecisions(G)){sc.menu.push({d:D});ch.push({i:sc.menu.length-1,n:n++,t:D.t,d:D.d,off:D.off})}
  sceneShow(null,sc.known?`${G.find(p=>p.id===sc.bite)?.name||"One of them"} is bitten.`:sc.sus?"Something's off. You can't say what.":"What do you ask?",ch)}
ACTS.scpick=d=>scenePick(+d.i);
function scenePick(i){const sc=UI.scene;if(!sc||!sc.menu)return;const m=sc.menu[i];if(!m||m.d&&m.d.off)return;sc.menu=null;const G=SC_G();
  if(m.q){sc.asked[m.q.k]=(sc.asked[m.q.k]||0)+1;sc.q.push({w:"you",x:m.q.k==="check"&&sc.asked.check>1?"Sleeves up. Now. Or you walk.":m.q.t},...m.q.f(G))}
  else{sc.q.push({w:"you",x:m.d.t.replace(/^Let them in( anyway)?$/,"Come on in.").replace(/^Bring them with you$/,"Come with us.").replace(/^Give them.*$/,"Here. Take this, and keep moving.").replace(/^Tell them to wait.*$/,"Wait here. I'll decide.").replace(/^Turn them away$/,"Keep moving. There's nothing for you here.").replace(/^Take the others\..*$/,"The rest of you can come in.")});
    sc.q.push(...m.d.f(G));sc.done=true;save()}
  sceneNext()}
function sceneEnd(){const sc=UI.scene;if(!sc)return;sc.phase="out";sc.t=0;const e=sceneEl();e.classList.remove("in");sceneShow(null,"",[])}
function sceneKey(e){const k=e.key;if(k===" "||k==="Enter"){sceneNext();e.preventDefault();return}if(/^[1-9]$/.test(k)&&UI.scene.menu){const n=+k;const e2=sceneEl().querySelectorAll(".ch button")[n-1];if(e2)scenePick(+e2.dataset.i)}}
function sceneFrame(dt,now){const sc=UI.scene;
  if(!sc){if(S&&!UI.modal&&!UI.grab&&!S.flags.traveling&&$("title")?.style.display==="none"&&(!UI.paused||UI.sceneQ)){UI.sceneT=(UI.sceneT||0)-dt;if(UI.sceneT<=0){UI.sceneT=.5;sceneLook()}}return}
  sc.t+=dt;const pl=S.player;
  // the camera closes in on the two of you
  const f=Math.min(1,dt*2.2);if(sc.phase!=="out"){const o=W.zoom*.42;W.tgt.x+=(sc.look.x+o-W.tgt.x)*f;W.tgt.z+=(sc.look.z+o-W.tgt.z)*f;W.zoom+=(7.2-W.zoom)*f}else{W.zoom+=(sc.z0-W.zoom)*f}
  if(sc.phase==="in"){let left=0;for(const m of sc.moves){const o=m.o;const d=dist(o.x,o.z,m.x,m.z);if(d<.05)continue;const s=Math.min(d,dt*2.6);o.x+=(m.x-o.x)/d*s;o.z+=(m.z-o.z)/d*s;o.dir=Math.atan2(m.x-o.x,m.z-o.z);left++}
    if(!left||sc.t>3.2){for(const m of sc.moves){m.o.x=m.x;m.o.z=m.z}const G=SC_G();const L=G[0];if(L){pl.dir=Math.atan2(L.x-pl.x,L.z-pl.z);for(const p of G)p.dir=Math.atan2(pl.x-p.x,pl.z-p.z)}sc.phase="talk";sceneNext()}return}
  if(sc.phase==="talk"&&sc.typ&&sc.typ.shown<sc.typ.x.length){sc.typ.shown=Math.min(sc.typ.x.length,sc.typ.shown+dt*52);sceneShow(sc.typ.w,sc.typ.x.slice(0,Math.floor(sc.typ.shown)),[])}
  if(sc.phase==="out"&&sc.t>.7){UI.scene=null;W.free=false;W.zoom=sc.z0;$("app").classList.remove("scening");sceneEl().classList.remove("open");renderAll();save();setTimeout(nextCard,300)}}
// anyone here you haven't met yet, close enough to see you (or waiting at camp when you get home)
function sceneLook(){if(UI.sceneQ){const Q=UI.sceneQ;UI.sceneQ=null;const G=Q.ids.map(P).filter(p=>p&&p.status==="stranger"&&p.loc===S.player.loc&&!p.scened);if(G.length){startScene(G,Q.how);return}}
  if(UI.place||UI.pushPick||S.push||S.player.ko>0)return;const pl=S.player;
  for(const p of S.people){if(p.status!=="stranger"||p.scened||p.loc!==pl.loc||p.away)continue;const camp=p.loc===campK();const d=dist(p.x,p.z,pl.x,pl.z);
    if(d<(camp?16:8)&&clearLine(pl.loc,pl.x,pl.z,p.x,p.z,true)){startScene(sceneGroup(p),camp?"home":"found");return}}}
