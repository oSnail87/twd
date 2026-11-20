// ================= the dead =================
// They shamble when nothing's going on, turn toward a noise, and come for you when they see you: by day across a lot,
// at night only up close. Walls and shut doors block their sight, but they smell you through a wall if they're close.
// They can't climb (a wall section or a line of cars stops them), but they will beat on a door or a window until it
// gives. When one gets its hands on someone it's a real fight: rare, frightening, and it can go very wrong.
function darkness(){const h=(S.t%DAY)/60;return h>=20.5||h<5.5?1:h>=19?(h-19)/1.5:h<7?1-(h-5.5)/1.5:0}
function liveHere(k){const L=[];const pl=S.player;if(pl.loc===k&&pl.ko<=0&&!S.flags.traveling)L.push(pl);
  for(const p of S.people)if(p.loc===k&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside))L.push(p);return L}
function liveById(id){return id==="you"?S.player:S.people.find(p=>p.id===id)}
function goneFrom(o,k){return!o||o.loc!==k||o.status==="dead"||o.status==="left"||o.ko>0||o.away&&o.away.out||o.id==="you"&&S.flags.traveling}
function deadTick(dt){if(!S.walkers.length)return;const dark=darkness();
  for(const w of S.walkers){if(w.dead||!LOCS[w.loc])continue;if(w.grab)continue;if(w.cool)w.cool=Math.max(0,w.cool-dt);
    if(w.climb){if(S.t>=w.climb.until){w.x=w.climb.to.x;w.z=w.climb.to.z;w.climb=null;w.rp=0}continue}
    w.sn=(w.sn||0)-dt;if(w.sn<=0){w.sn=.6+rf()*.5;sense(w,dark)}
    const t=w.hunt&&liveById(w.hunt);let sp=.12;
    if(t&&!goneFrom(t,w.loc)){const d=dist(w.x,w.z,t.x,t.z);sp=d<2.2?.62:.36;w.st="hunt";
      if(d<.95&&!w.cool&&!(w.stun&&S.t<w.stun)){grab(t,w);continue}
      if(w.bang&&banging(w,dt))continue;
      w.rp=(w.rp||0)-dt;if(w.rp<=0||w.tx==null&&d>1){w.rp=.7+rf()*.5;const ok=moveTo(w,t.x,t.z);if(!ok&&!breakIn(w,t))w.rp=2.5;else if(ok)w.bang=null}}
    else{if(w.hunt){w.alert=t&&t.loc===w.loc?{x:t.x,z:t.z}:null;w.hunt=null;w.bang=null}
      if(w.alert){sp=.3;w.st="alert";if(!w.goal||dist(w.goal.x,w.goal.z,w.alert.x,w.alert.z)>1||w.tx==null&&dist(w.x,w.z,w.alert.x,w.alert.z)>1.5){if(w.tx==null&&w.goal&&dist(w.goal.x,w.goal.z,w.alert.x,w.alert.z)<=1)w.alert=null;else moveTo(w,w.alert.x,w.alert.z)}
        if(w.alert&&dist(w.x,w.z,w.alert.x,w.alert.z)<1.4)w.alert=null}
      else{w.st="idle";if(w.tx==null&&rf()<dt*.03){let tx=w.x+rf()*10-5,tz=w.z+rf()*10-5;if(w.loc===campK()&&rf()<.15){tx=lerp(tx,0,.3);tz=lerp(tz,4,.3)}moveTo(w,tx,tz)}}}
    if(w.stun&&S.t<w.stun)continue;
    // a lurching, uneven walk
    const lurch=.7+.4*Math.sin(S.t*2.6+(w.seed||(w.seed=rf()*9)));mv(w,MOVE*dt*sp*lurch*(w.limp||1))}
  guardsTick(dt);fleeTick(dt);heartbeat()}
// what one of them notices
function sense(w,dark){const k=w.loc;const R=lerp(8.5,4.5,dark);let best=null,bd=1e9;
  for(const o of liveHere(k)){const d=dist(w.x,w.z,o.x,o.z);if(d>R)continue;
    // close enough to hear you moving about through a wall (not asleep); otherwise it has to see you
    if((d>1.5||o.sleep||o.tx==null&&!o.anim)&&!clearLine(k,w.x,w.z,o.x,o.z,true))continue;if(d<bd){bd=d;best=o}}
  if(best){if(w.hunt!==best.id){w.hunt=best.id;w.rp=0;spotted(w,best)}w.seen=S.t;return}
  if(w.hunt){const t=liveById(w.hunt);if(goneFrom(t,k)||S.t-(w.seen||0)>12||dist(w.x,w.z,t.x,t.z)>R*2){w.alert=t&&!goneFrom(t,k)?{x:t.x,z:t.z}:null;w.hunt=null;w.bang=null}}}
function spotted(w,o){if(typeof sfx==="function"&&w.loc===S.player.loc&&rf()<.7)sfx("moan",w.x,w.z);
  if(o.id==="you"&&S.t-(S.flags.seenT||0)>30){S.flags.seenT=S.t;if(typeof toast==="function")toast("One of the dead has seen you.")}
  else if(o.id!=="you"&&o.status==="member"&&o.loc===S.player.loc&&S.t-(o.yell||0)>20&&!o.sleep){o.yell=S.t;say(o,pick(["One of them's here!","Walker!","They're coming!","Oh no. No no no."]))}}
// the one they want is behind a door or a wall: beat on the door, or a window, until something gives
function breakIn(w,t){const k=w.loc;const tb=bldAt(k,t.x,t.z),wb=bldAt(k,w.x,w.z);let r=null,side="out";
  if(tb&&tb!==wb){r=tb;side="out"}else if(wb&&wb!==tb){r=wb;side="in"}if(!r)return false;
  const bi=layout(k).b.indexOf(r);const st=bldState(k,bi);const opts=[];
  if(st.door!=="open"&&st.door!=="broken")opts.push({what:"door",x:side==="out"?r.door.ox:r.door.ix,z:side==="out"?r.door.oz:r.door.iz,hp:st.dhp});
  if(side==="out")r.wins.forEach((wn,i)=>{const ws=st.wins[i];opts.push({what:i,x:wn.ox,z:wn.oz,hp:ws.broken&&!ws.board?0:ws.hp})});
  if(!opts.length)return false;opts.sort((a,b)=>dist(w.x,w.z,a.x,a.z)+a.hp*.06-dist(w.x,w.z,b.x,b.z)-b.hp*.06);const o=opts[0];
  w.bang={bi,what:o.what,x:o.x,z:o.z,side};moveTo(w,o.x,o.z);return true}
function banging(w,dt){const b=w.bang;const k=w.loc;const r=layout(k).b[b.bi];if(!r){w.bang=null;return false}const st=bldState(k,b.bi);
  if(dist(w.x,w.z,b.x,b.z)>1.1){if(w.tx==null)moveTo(w,b.x,b.z);return false}
  w.tx=null;w.tz=null;w.path=null;w.st="bang";w.dir=b.what==="door"?(b.side==="out"?Math.PI:0):(r.wins[b.what].side==="front"?Math.PI:-Math.PI/2);
  w.bt=(w.bt||0)+dt;if(w.bt>1.3){w.bt=0;if(typeof sfx==="function"&&k===S.player.loc)sfx(b.what==="door"?"bang":"glass",b.x,b.z);if(rf()<.25)noiseAt(k,b.x,b.z,8)}
  // the first time it starts, everyone inside knows
  const key=k+":"+b.bi;S.flags.bangAt=S.flags.bangAt||{};w.bangT=(w.bangT||0)+dt;if(w.bangT>3&&S.t-(S.flags.bangAt[key]||-999)>120){S.flags.bangAt[key]=S.t;const nm=r.barn?"the barn":k===campK()?"the house":LOCS[k].n;
    log(b.what==="door"?`Something is beating on the door of ${nm}.`:`Something is clawing at a window of ${nm}.`,"warn");if(k===S.player.loc&&typeof toast==="function")toast(b.what==="door"?"Something's beating on the door!":"Something's at the window!");
    for(const p of S.people)if(p.loc===k&&p.sleep&&bldAt(k,p.x,p.z)===r&&rf()<.7){p.sleep=false;p.inBed=false;p.act="awake, listening to the banging"}}
  S.flags.bangSince=S.flags.bangSince||{};const bs=S.flags.bangSince;if(!bs[key]||S.t-bs[key].last>10)bs[key]={t0:S.t,last:S.t};else bs[key].last=S.t;
  if(S.t-bs[key].t0>15&&b.side==="out")heroGoesOut(k,r,w);
  if(b.what==="door"){if(st.door==="open"||st.door==="broken"){w.bang=null;w.rp=0;return false}st.dhp-=dt*1.5;
    if(st.dhp<=0){st.door="broken";st.bar=0;st.furn=false;st.dhp=0;S.bv++;bumpDecor(k);w.bang=null;w.rp=0;
      log(`The door of ${r.barn?"the barn":k===campK()?"the house":LOCS[k].n} gives way. The dead are getting in.`,"bad");if(k===S.player.loc&&typeof toast==="function")toast("The door gave way!");if(typeof sfx==="function"&&k===S.player.loc)sfx("crash",b.x,b.z)}}
  else{const ws=st.wins[b.what];const wn=r.wins[b.what];
    if(ws.broken&&!ws.board){w.climb={until:S.t+2.5,to:{x:wn.ix,z:wn.iz}};w.bang=null;w.st="climb";return true}
    ws.hp-=dt*1;if(ws.hp<=0){if(ws.board>0){ws.board--;ws.hp=winMax(ws)}else{ws.broken=true;ws.hp=0;log(`Glass breaks at ${r.barn?"the barn":k===campK()?"the house":LOCS[k].n}. One of them is coming in through a window.`,"bad");if(k===S.player.loc&&typeof toast==="function")toast("A window just broke!");if(typeof sfx==="function"&&k===S.player.loc)sfx("glass",b.x,b.z)}bumpDecor(k)}}
  return true}
// nobody's on guard and it won't stop: the bravest of the grown-ups inside picks something up and goes out to end it
function heroGoesOut(k,r,w){if(S.people.some(p=>p.loc===k&&p.order&&p.order.k==="guard"))return;
  const inside=S.people.filter(p=>p.loc===k&&p.status==="member"&&!p.kid&&p.hp>=40&&!p.grabbed&&bldAt(k,p.x,p.z)===r);if(!inside.length)return;
  const h=inside.sort((a,b)=>fightOf(b)+b.tr.brave-fightOf(a)-a.tr.brave)[0];if(h.tr.brave<-.5&&fightOf(h)<1.5)return;
  h.sleep=false;h.inBed=false;giveOrder(h,{k:"guard",x:r.door.ox,z:r.door.oz+.5,hero:true,until:S.t+40},true);
  log(`${h.name} ${h.gun&&S.res.ammo>=1?"takes the "+ITEMS[h.gun]:pick(["grabs a fire poker","picks up an axe handle","grabs a kitchen knife"])} and goes out to deal with it.`,"big");say(h,pick(["I'll handle it.","Stay inside.","Lock it behind me."]))}
// ---------- when one gets hold of someone ----------
function grab(v,w,mine){if(w.dead||v.grabbed)return;w.cool=3;
  if(v.id==="you"){if(typeof startStruggle==="function"&&!S.flags.noUi)return startStruggle(w,mine);return autoStruggle(w)}
  npcFight(v,w)}
// the old name: someone and one of the dead come together
function clash(v,w){return grab(v,w,v.id==="you")}
// how a fight goes for one of your people (it happens fast, and you hear about it)
function npcFight(v,w){if(w.dead)return;const k=v.loc;const pl=S.player;const where=k===S.player.loc?"":` at ${LOCS[k]?.n||"camp"}`;
  const helpers=S.people.filter(q=>q!==v&&q.loc===k&&q.status==="member"&&!q.kid&&!q.sleep&&!q.grabbed&&dist(q.x,q.z,v.x,v.z)<6&&(q.job==="guard"||q.order&&q.order.k==="guard"||q.tr.brave>-.2||q.follow));
  if(pl.loc===k&&pl.ko<=0&&!pl.grabbed&&dist(pl.x,pl.z,v.x,v.z)<4.5)helpers.push(pl);
  const armed=v.gun&&k===campK()&&S.res.ammo>=1;const weapon=useVal("weapon")>0;
  const meant=v.job==="guard"||v.order&&v.order.k==="guard";
  let p=.3+fightOf(v)*.09+helpers.length*.14+(weapon?.08:0)+(armed?.38:0)+(meant?.12:0)-(v.hp<50?.12:0)-(v.sleep?.25:0)-(v.kid?.15:0);
  if(armed){S.res.ammo--;gunNoise(v,w)}
  v.sleep=false;v.inBed=false;w.cool=4;if(typeof sfx==="function"&&k===S.player.loc)sfx("struggle",v.x,v.z);
  if(rf()<p){const by=helpers.length&&rf()<.45?pick(helpers):v;putDown(w);
    log(`${v.name} ${pick(["wrestled one of the dead to the ground","fought one of the dead off","threw one of the dead off"])}${by!==v?`, and ${by===pl?"you":by.name} finished it`:" and finished it"}${where}.`,"big");
    say(v,pick(["Got it!","It's down. It's down.","Oh God. Oh God.","Stay down!"]));v.mood=Math.max(0,v.mood-3);mem(v,"I fought one of the dead hand to hand.",-1);v.sk.fight=Math.min(3,v.sk.fight+.08);
    if(k!==S.player.loc&&typeof toast==="function")toast(`${v.name} had to fight one of the dead${where}.`);return}
  // it went badly
  const dmg=ri(10,22);v.hp=Math.max(0,v.hp-dmg);const a=Math.atan2(w.x-v.x,w.z-v.z);w.x+=Math.sin(a)*1.6;w.z+=Math.cos(a)*1.6;w.stun=S.t+4;w.cool=8;w.down=S.t+4;
  if(v.hp<=0){die(v,v.kid?"was pulled down by the dead":"was pulled down by the dead before anyone could reach "+pronoun(v,"o"));if(typeof toast==="function")toast(`${v.name} is dead.`);return}
  const r=rf();if(v.status==="member"&&!v.bitten&&r<(v.kid?.06:.15)){v.bitten=true;v.hp=Math.max(1,v.hp-10);queueCard("bitten",{who:v.id});log(`${v.name} tore free of one of the dead, but not before it bit ${pronoun(v,"o")}.`,"bad");say(v,"It got me. It got my arm.")}
  else{log(`${v.name} fought one of the dead off${where}, hurt and shaking. It's still on its feet.`,"warn");say(v,pick(["Get it off me!","Help!","Back! Get back!"]))}
  fleeFrom(v,w,10);if(typeof toast==="function"&&k===S.player.loc)toast(`${v.name} is fighting one of the dead!`)}
// no screen to fight on (or you're not looking): your fight resolves like anyone's, but you never get bitten
function autoStruggle(w){const pl=S.player;let p=.45+useVal("weapon")*.12+(pl.gun&&(pl.rounds||0)>0?.35:0);if(pl.gun&&(pl.rounds||0)>0){pl.rounds--;gunNoise(pl,w)}
  if(rf()<p){putDown(w);log("One of them grabs you. You fight it off and put it down.","warn");return}
  pl.hp=Math.max(0,pl.hp-ri(15,30));const a=Math.atan2(w.x-pl.x,w.z-pl.z);w.x+=Math.sin(a)*1.6;w.z+=Math.cos(a)*1.6;w.stun=S.t+3;if(pl.hp<=0)knockOut();else log("One of them gets its hands on you. You tear free, hurt.","warn")}
// ---------- your people when the dead come ----------
// guards go after them: a gun from range if there's ammo, otherwise up close
function guardsTick(dt){campResponse(dt);for(const g of S.people){if(g.status!=="member"||g.kid||g.sleep||g.grabbed||g.away&&g.away.out||!LOCS[g.loc])continue;
    const o=g.order&&g.order.k==="guard"?g.order:null;const guard=o||g.job==="guard"&&g.loc===campK()&&!g.order;if(!guard)continue;
    let L=walkersAt(g.loc).filter(w=>dist(w.x,w.z,g.x,g.z)<(o&&o.hero?24:14)&&!w.climb);if(o&&o.target){const t=L.find(w=>w.id===o.target);if(t)L=[t]}
    if(!L.length){g.hunt=null;if(o&&o.hero)endOrder(g,false,pick(["It's done.","All clear.","Got it. We're okay."]));continue}
    const w=L.sort((a,b)=>dist(a.x,a.z,g.x,g.z)-dist(b.x,b.z,g.x,g.z))[0];const d=dist(w.x,w.z,g.x,g.z);const G=g.gun&&GUNS[g.gun];
    if(G&&S.res.ammo>=1&&d<=G.range*.85&&clearLine(g.loc,g.x,g.z,w.x,w.z,true)){g.hunt=w.id;g.tx=null;g.path=null;g.dir=Math.atan2(w.x-g.x,w.z-g.z);g.anim="aim";g.cd=(g.cd||0)-dt;if(g.cd<=0){g.cd=1.4;S.res.ammo--;
        const hit=rf()<clamp(G.hit*(1-.45*(d/G.range)**2)+g.sk.fight*.04,.2,.95);gunNoise(g,w);if(typeof shotFx==="function")shotFx(g,w,hit);if(hit){putDown(w);if(rf()<.6||o&&o.hero)log(`${g.name} shot one of the dead${g.loc===campK()&&inCamp(w.x,w.z)?" at the edge of camp":""}.`)}}continue}
    if(d<(o&&o.hero?24:9)){g.act="going after one of the dead";g.anim=null;if(d<1.1){npcFight(g,w);continue}if(g.tx==null||g.hunt!==w.id||rf()<dt*.5){g.hunt=w.id;moveTo(g,w.x,w.z)}}}}
// one of the dead gets close to camp: someone goes out to put it down before it reaches anyone. A guard if there is one,
// otherwise the best fighter awake, with a second at their back.
function campResponse(dt){const k=campK();if(!k)return;S.flags.respT=(S.flags.respT||0)-dt;if(S.flags.respT>0)return;S.flags.respT=1;
  for(const w of walkersAt(k)){if(w.claim&&S.t<w.claim||w.climb)continue;const near=dist(w.x,w.z,0,4)<S.camp.r+4||w.hunt&&liveById(w.hunt)?.loc===k;if(!near)continue;
    if(S.people.some(g=>g.loc===k&&g.order&&g.order.k==="guard"&&g.order.target===w.id))continue;
    const pool=S.people.filter(p=>p.status==="member"&&p.loc===k&&!p.away&&!p.kid&&!p.sleep&&!p.follow&&!p.grabbed&&p.hp>=50&&!(p.order&&p.order.k==="guard"));
    const score=p=>fightOf(p)+p.tr.brave+(p.job==="guard"?3:0)+(p.gun&&S.res.ammo>=1?2:0);const ok=pool.filter(p=>p.job==="guard"||p.tr.brave>-.35).sort((a,b)=>score(b)-score(a));if(!ok.length)continue;
    // behind your wall where nobody can get at it (and it can't get at you): leave it be
    const path=findPath(k,ok[0].x,ok[0].z,w.x,w.z);if(!path||path.partial){w.claim=S.t+60;continue}
    w.claim=S.t+120;const two=ok.slice(0,G_(ok[0])?1:2);
    for(const g of two)giveOrder(g,{k:"guard",x:w.x,z:w.z,hero:true,target:w.id,until:S.t+40},true);
    const a=two[0],b=two[1];log(`${a.name}${b?` and ${b.name}`:""} ${a.gun&&S.res.ammo>=1?`take${b?"":"s"} the ${ITEMS[a.gun]} and go${b?"":"es"}`:`grab${b?"":"s"} ${b?"what they can":"something heavy"} and go${b?"":"es"}`} out to deal with one of the dead.`,"warn");say(a,pick(["I see one. I'll handle it.","Stay here. I've got it.","One of them, coming up. I'm on it."]))}}
const G_=p=>!!(p.gun&&S.res.ammo>=1);
// everyone else gets away from them: inside behind a door if they can, otherwise wherever's furthest from it
function fleeFrom(p,w,mins){p.flee=S.t+(mins||6);const k=p.loc;const h=k===campK()?homeBld():bldAt(k,p.x,p.z);
  if(h&&!bldAt(k,w.x,w.z)&&bldState(k,layout(k).b.indexOf(h)).door!=="broken"&&dist(p.x,p.z,h.door.ox,h.door.oz)<dist(w.x,w.z,h.door.ox,h.door.oz)+2){const fs=h.floorSpots&&h.floorSpots.length?pick(h.floorSpots):{x:h.x,z:h.z};moveTo(p,fs.x,fs.z);p.act="running inside";return}
  let best=null,bs=-1e9;const a0=Math.atan2(p.x-w.x,p.z-w.z);
  for(let i=0;i<8;i++){const a=a0+(i%2?1:-1)*Math.ceil(i/2)*.75;const x=clamp(p.x+Math.sin(a)*9,-SH+2,SH-2),z=clamp(p.z+Math.cos(a)*9,-SH+2,SH-2);const path=findPath(k,p.x,p.z,x,z);if(!path||!path.length)continue;
    const end=path[path.length-1];const sc=dist(end[0],end[1],w.x,w.z)-(path.partial?4:0);if(sc>bs){bs=sc;best=end}}
  if(best)moveTo(p,best[0],best[1]);p.act="running from one of the dead"}
function fleeTick(dt){for(const w of S.walkers){if(w.dead||!w.hunt||w.hunt==="you")continue;const p=liveById(w.hunt);if(!p||p.status==="dead"||p.grabbed||p.follow||p.sleep)continue;
    const guard=p.job==="guard"&&p.loc===campK()||p.order&&p.order.k==="guard";if(guard)continue;const d=dist(w.x,w.z,p.x,p.z);if(d>9||p.flee&&S.t<p.flee)continue;
    // already behind a shut door from it: stay put
    const pb=bldAt(p.loc,p.x,p.z);if(pb&&pb!==bldAt(w.loc,w.x,w.z)){const st=bldState(p.loc,layout(p.loc).b.indexOf(pb));if(st.door==="shut")continue}
    fleeFrom(p,w,6)}}
// your heart, when one of them is coming for you
function heartbeat(){if(typeof sfx!=="function")return;const pl=S.player;const near=S.walkers.some(w=>!w.dead&&w.hunt==="you"&&w.loc===pl.loc&&dist(w.x,w.z,pl.x,pl.z)<8);S.flags.heart=near}
