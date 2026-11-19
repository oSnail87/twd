
// ================= playing: walking, doors, the dead, fighting, the camera, light and the loop =================
const SKY={clear:"#9fb4c4",overcast:"#8a949c",rain:"#6f7a84",snow:"#b8c0c8",fog:"#9aa098"};
const HOMES=["house","farmhouse","trailer","cabin"];
function isHome(b){return!!b&&HOMES.includes(b.type)}
function residentsHome(b){if(!b)return[];return S.people.filter(p=>p.alive&&p.home===b.id&&!p.group&&!isFollower(p)&&p.age>=2&&bldAt(p.x,p.z)===b)}
// can a line between two points be seen along: walls, rock and closed doors block it
function losClear(ax,az,bx,bz){const d=dist(ax,az,bx,bz);if(d<.4)return true;const n=Math.ceil(d/.33);const c=COL.c;
  for(let i=1;i<n;i++){const t=i/n;const x=ax+(bx-ax)*t,z=az+(bz-az)*t;const L=COL.m.get(ckey(Math.floor(x/c),Math.floor(z/c)));if(!L)continue;
    for(const q of L){if(x<q.x0||x>q.x1||z<q.z0||z>q.z1)continue;if(q.k==="wall"||q.k==="rock")return false;if(q.k==="door"&&!q.d.open&&!q.d.broken)return false}}return true}
function zedNear(r){const pl=S.player;for(const z of S.zeds){if(Math.abs(z.x-pl.x)>r||Math.abs(z.z-pl.z)>r)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d<r&&(d<r*.45||losClear(z.x,z.z,pl.x,pl.z)))return true}return false}
function nearPeople(r){const pl=S.player;const here=bldAt(pl.x,pl.z);
  return S.people.filter(p=>p.alive&&p.age>=2&&Math.abs(p.x-pl.x)<r&&Math.abs(p.z-pl.z)<r&&dist(p.x,p.z,pl.x,pl.z)<r&&(bldAt(p.x,p.z)===here||isFollower(p))).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z))}

// ---------- doors: open, shut, locked, boarded, broken ----------
function doorBld(D){return BMAP[D.b]}
function houseLocked(D){if(!D.ext||!S.flags.alarm)return false;const b=doorBld(D);if(!isHome(b)||b.id===S.player.home)return false;if((D.welcome||0)>S.t)return false;
  const g=S.player.group&&G(S.player.group);if(g&&b.site&&g.home===b.site)return false;return residentsHome(b).some(p=>p.age>=14)}
function doorLocked(D){if(D.broken)return false;if(D.bar>0)return"bar";if(D.lock)return"lock";if(houseLocked(D))return"home";return false}
function doorOpen(D){return D.open||D.broken}
function doorMaxHp(D){return 100+(D.bar||0)*150}
function playerSide(D){if(!D.ext)return"in";const d=D.dw;const a=d.p[d.inSide],o=d.p[d.outSide];const pl=S.player;return dist(pl.x,pl.z,a.x,a.z)<dist(pl.x,pl.z,o.x,o.z)?"in":"out"}
function doorBlocked(D){const bx=D.box;const hit=e=>e.x>bx.x0-.3&&e.x<bx.x1+.3&&e.z>bx.z0-.3&&e.z<bx.z1+.3;const pl=S.player;if(hit(pl))return true;for(const z of S.zeds)if(hit(z))return true;for(const p of S.people)if(p.alive&&hit(p))return true;return false}
// door state lives in S.doors so it survives a reload; only what differs from how the building was built is kept
function doorsIn(){for(const D of DOORS){if(D.lock0===undefined)D.lock0=D.lock;const s=S.doors[D.id];D.open=s?!!s.o:!D.ext&&!D.lock0;D.lock=s&&"l" in s?s.l:D.lock0;D.bar=s?s.b||0:0;D.hp=s?s.h??100:100;D.broken=!!(s&&s.x);D.welcome=s?s.w||0:0;D.refused=s?s.r||0:0;D.auto=false}}
function doorSave(D){const def=!D.ext&&!D.lock0;const s={};if(!!D.open!==def)s.o=D.open?1:0;if(D.lock!==D.lock0)s.l=D.lock;if(D.bar)s.b=D.bar;if(D.hp!==100)s.h=Math.round(D.hp);if(D.broken)s.x=1;if(D.welcome>S.t)s.w=D.welcome;if(D.refused&&S.t-D.refused<240)s.r=D.refused;
  if(Object.keys(s).length)S.doors[D.id]=s;else delete S.doors[D.id]}
function doorsOut(){for(const D of DOORS)doorSave(D)}
function lockedMsg(D){const k=doorLocked(D);return k==="bar"?(playerSide(D)==="in"?"The door's boarded up. Press E to take the boards down.":"Someone boarded this door from the inside."):k==="home"?"Locked. Someone's home. You could knock.":hasTool("pry")?"Locked. Your crowbar could open it.":"Locked. You could kick it in, but it'll be loud."}
function useDoor(D){const pl=S.player;if(!D||pl.alive===false)return;const lk=doorLocked(D);
  if(doorOpen(D)){if(D.broken){toast("The door's off its hinges. It won't close.");return}if(doorBlocked(D)){toast("Something's in the way.");return}D.open=false;D.auto=false;doorSave(D);return}
  if(!lk){D.open=true;D.auto=false;doorSave(D);return}
  if(lk==="bar"){if(playerSide(D)==="in")startTask(3.5,"Taking the boards down",()=>{D.bar=Math.max(0,D.bar-1);D.hp=Math.min(D.hp,doorMaxHp(D));if(rf()<.6)invAdd("wood",1,true);doorSave(D);noise(D.x,D.z,6);toast(D.bar?"One board down. More to go.":"The boards are off.")});
    else if(hasTool("pry"))startTask(6,"Prying the boards off",()=>{D.bar=Math.max(0,D.bar-1);D.hp=Math.min(D.hp,doorMaxHp(D));wearTool("pry",2);doorSave(D);noise(D.x,D.z,12);toast(D.bar?"A board comes loose. There are more.":"The last board comes away.")});
    else kickDoor(D);return}
  if(lk==="home"){if(D.refused&&S.t-D.refused<120)kickDoor(D);else knock(doorBld(D),D);return}
  if(lk==="lock"){if(hasTool("pry"))startTask(4,"Prying the lock",()=>{D.lock=null;wearTool("pry",2);doorSave(D);noise(D.x,D.z,10);skillUp("scavenge",.04);toast("The frame splinters and the lock gives.")});else kickDoor(D)}}
function kickDoor(D){const pl=S.player;if(W3.cd>0)return;W3.cd=.9;W3.swing=.2;pl.energy=Math.max(0,pl.energy-1.2);noise(D.x,D.z,15);
  D.hp-=14+pl.sk.fight*2+(weapon()?ITEMS[weapon().id].dmg:0);
  const b=doorBld(D);if(isHome(b)){for(const p of residentsHome(b)){p.trust=clamp(p.trust-6,-100,100);if(!p.kicked){p.kicked=S.t;mem(p,`${pl.name} tried to kick our door in.`,-12)}}}
  if(D.hp<=0){D.broken=true;D.open=true;D.bar=0;D.lock=null;doorSave(D);toast("The door bursts open.");journal(`You kicked in a door at ${b?b.n:"a building"}.`,"");return}
  doorSave(D);toast(D.hp<35?"The frame is cracking. One or two more.":"You kick the door. It holds.")}
function canBoard(){return hasTool("hammer")&&invHas("wood",2)&&invHas("nails",1)}
function boardDoor(D){if(!D||doorOpen(D)||D.bar>=3)return;if(!canBoard()){toast("You need a hammer, 2 wood and a box of nails to board up a door.");return}
  startTask(6,"Boarding up the door",()=>{if(!canBoard()||doorOpen(D))return;invTake("wood",2);invTake("nails",1);wearTool("hammer",2);D.bar=(D.bar||0)+1;D.hp=Math.min(doorMaxHp(D),D.hp+150);doorSave(D);noise(D.x,D.z,14);skillUp("build",.08);
    toast(D.bar>1?`You add another board. That's ${D.bar} now.`:"You nail boards across the door. It won't open now, from either side, until someone pries them off.");journal("You boarded up a door.","")})}
// knocking on a door where people are home
function knock(b,D){const pl=S.player;const res=residentsHome(b);if(!res.length){toast("Nobody answers.");return}
  const head=res.filter(p=>p.age>=16).sort((a,c)=>feel(c)-feel(a))[0]||res[0];
  const opens=!S.flags.clinic||(head.met&&feel(head)>-20)||rf()<.42+head.tr.kind*.35;noise(D.x,D.z,7);
  if(!opens){D.refused=S.t;doorSave(D);mem(head,`${pl.name} knocked on our door after it started. We didn't open.`,0);toast("Nobody answers. You hear someone inside, holding their breath.");return}
  D.welcome=S.t+180;D.open=true;doorSave(D);const ins=D.dw.p[D.dw.inSide];head.x=ins.x;head.z=ins.z;head.tx=head.x;head.tz=head.z;head.path=null;head.door=S.t+45;
  head.chat.push({w:"sys",x:`${head.met?head.name:"Someone"} opens the door${S.flags.alarm?" a crack":""}.`});
  head.chat.push({w:"them",x:styleSay(head,S.flags.clinic?pick(["Who's there? ...Oh. What do you want?","Are you alone? Are you bit?","Keep your voice down. They hear everything."]):pick(["Morning. Can I help you?","Oh, hi. Everything okay?","Yes?"]))});
  syncFigs();openTalk(head.id)}
// walking into somebody's home uninvited
function intrusion(b){const pl=S.player;if(!isHome(b)||b.id===pl.home)return;const res=residentsHome(b).filter(p=>p.act!=="asleep"&&p.age>=8);if(!res.length)return;
  const D=b.doors.find(d=>d.ext&&(d.welcome||0)>S.t);if(D)return;pl.flags.intr=pl.flags.intr||{};const k=b.id+":"+dayOf(S.t);if(pl.flags.intr[k])return;pl.flags.intr[k]=1;
  for(const p of res){const f=feel(p);const ok=f>35||p.fam.you;if(ok)continue;p.trust=clamp(p.trust-(S.flags.alarm?8:5),-100,100);p.aff=clamp(p.aff-4,-100,100);mem(p,`${pl.name} walked into our house without knocking.`,-4);
    bubble(p,styleSay(p,pick(S.flags.alarm?["Whoa, whoa. Who let you in?","Get out of my house.","Are you bit? Stay back."]:["Uh, hello? Can I help you?","This is my house.","Did you knock?"])))}}

// ---------- timed things you do with your hands ----------
function startTask(secs,label,done,o={}){if(W3.task)return;W3.task={t:0,n:secs,label,done,o};W3.ptarget=null;W3.path=null}
function cancelTask(why){if(!W3.task)return;W3.task=null;if(why)toast(why)}
function taskTick(dt){const T=W3.task;if(!T)return;T.t+=dt*Math.min(4,UI.speed);if(T.t>=T.n){W3.task=null;try{T.done()}catch(e){console.error(e)}save();markUI()}}

// ---------- noise draws the dead ----------
function noise(x,z,r){for(const zd of S.zeds){if(zd.st==="chase")continue;if(Math.abs(zd.x-x)>r||Math.abs(zd.z-z)>r)continue;const d=dist(zd.x,zd.z,x,z);if(d>r)continue;if(d>r*.5&&!losClear(zd.x,zd.z,x,z))continue;
  zd.st="hunt";zd.tx=x+(rf()-.5)*3;zd.tz=z+(rf()-.5)*3;const Z=zst(zd);Z.path=null}}

// ---------- walking along a path of waypoints ----------
// returns 2 when the path is done, 1 after a step, 0 when blocked
function walkAlong(e,path,st,s,who,r){while(st.pi<path.length){const w=path[st.pi];const dx=w.x-e.x,dz=w.z-e.z,l=Math.hypot(dx,dz);const last=st.pi===path.length-1;
    if(l<(last?.06:.22)){st.pi++;continue}const k=Math.min(l,s);return step(e,dx/l*k,dz/l*k,r,who)?1:0}return 2}
function cancelWalk(){W3.ptarget=null;W3.path=null;W3.talkOnArrive=null;W3.attackT=null;W3.useOnArrive=null}
function walkTo(x,z,keep){if(!keep){W3.talkOnArrive=null;W3.attackT=null;W3.useOnArrive=null}const pl=S.player;x=clamp(x,WB.x0+1,WB.x1-1);z=clamp(z,WB.z0+1,WB.z1-1);
  W3.ptarget={x,z};W3.path=navPath(pl.x,pl.z,x,z);W3.pst={pi:0};W3.repath=.6}

// ---------- townsfolk ----------
function moveNPCs(dt){const pl=S.player;const sp=1.45*Math.min(4,UI.speed);let idx=0;const now=performance.now();
  for(const p of S.people){if(!p.alive)continue;
    if(p.age<2){const m=P(p.parents[0])||P(p.parents[1]);if(m&&m.alive!==false&&m.x!=null){p.x=m.x;p.z=m.z;p.tx=m.x;p.tz=m.z}continue}
    if(W3.fset.has(p.id)){followerMove(p,idx++,dt);continue}
    if(UI.talkTo===p.id&&dist(p.x,p.z,pl.x,pl.z)<4)continue;
    const d=dist(p.x,p.z,p.tx,p.tz);if(d<.1){p.path=null;continue}
    const far=Math.abs(p.x-pl.x)>75||Math.abs(p.z-pl.z)>75;const s=sp*dt*(p.health<45?.6:1)*(far?3:1);
    if(far){p.path=null;const k=Math.min(d,s);p.x+=(p.tx-p.x)/d*k;p.z+=(p.tz-p.z)/d*k;continue}
    if(!p.path||p.ptx!==p.tx||p.ptz!==p.tz){p.path=navPath(p.x,p.z,p.tx,p.tz);p.pi=0;p.ptx=p.tx;p.ptz=p.tz}
    const r=walkAlong(p,p.path,p,s,"npc",.27);
    if(r===2){p.path=null;if(d>.3){p.x=p.tx;p.z=p.tz}}
    else if(r===0){p._st=(p._st||0)+dt;if(p._st>2.2){p._st=0;const w=p.path[p.pi];if(w&&free(w.x,w.z,.27,"npc")){p.x=w.x;p.z=w.z;p.pi++}else{p.x=p.tx;p.z=p.tz;p.path=null}}}
    else{p._st=0;const D=doorAt(p.x,p.z,.32);if(D&&!D.open)D.npcT=now+900}}}
function followerMove(p,idx,dt){const pl=S.player;const side=idx%2?1:-1,row=Math.floor(idx/2);const a=W3.ang+Math.PI+side*(.6+row*.25);const rr=1.35+row*.8;const plk=roomKey(pl.x,pl.z);
  let want={x:pl.x+Math.sin(a)*rr,z:pl.z+Math.cos(a)*rr},fight=null;
  if(p.age>=14&&p.tr.brave>.25&&p.health>30){let bd=6;for(const z of S.zeds){if(Math.abs(z.x-pl.x)>7||Math.abs(z.z-pl.z)>7)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d<bd&&dist(z.x,z.z,p.x,p.z)<10&&losClear(p.x,p.z,z.x,z.z)){bd=d;fight=z}}if(fight)want={x:fight.x,z:fight.z}}
  if(!fight&&(roomKey(want.x,want.z)!==plk||!free(want.x,want.z,.27,"npc")))want={x:pl.x,z:pl.z};
  const d=dist(p.x,p.z,want.x,want.z);
  if(d>40){snapOne(p,idx);return}
  if(d>(fight?1.1:want.x===pl.x&&want.z===pl.z?1.1:.3)){const spd=d>4?5.2:d>1.6?3.4:1.5;const s=Math.max(0,Math.min(d-(fight?1:0),spd*dt));
    let st=W3.fst.get(p.id);if(!st)W3.fst.set(p.id,st={path:null,pi:0,t:0});st.t-=dt;let r;
    if(roomKey(p.x,p.z)!==roomKey(want.x,want.z)||!losClear(p.x,p.z,want.x,want.z)){if(!st.path||st.t<=0){st.path=navPath(p.x,p.z,want.x,want.z);st.pi=0;st.t=.7}r=walkAlong(p,st.path,st,s,"npc",.27);if(r===2)st.path=null}
    else{st.path=null;const dx=want.x-p.x,dz=want.z-p.z,l=Math.hypot(dx,dz)||1;r=step(p,dx/l*s,dz/l*s,.27,"npc")?1:0}
    if(r===0){p._st=(p._st||0)+dt;if(p._st>1.6&&d>3){snapOne(p,idx);p._st=0}}else{p._st=0;const D=doorAt(p.x,p.z,.32);if(D&&!D.open)D.npcT=performance.now()+900}}
  p.tx=p.x;p.tz=p.z;p.path=null;p.loc=regionAt(p.x,p.z)}
function snapOne(p,i){const pl=S.player;const k=roomKey(pl.x,pl.z);for(let t=0;t<12;t++){const a=i*1.3+2.2+t*.9,r=1.2+(t>5?.6:0);const x=pl.x+Math.sin(a)*r,z=pl.z+Math.cos(a)*r;if(free(x,z,.27,"npc")&&roomKey(x,z)===k&&losClear(pl.x,pl.z,x,z)){p.x=x;p.z=z;p.tx=x;p.tz=z;return}}p.x=pl.x;p.z=pl.z;p.tx=p.x;p.tz=p.z}
function snapFollowers(){if(!S)return;const pl=S.player;let i=0;for(const p of S.people)if(isFollower(p)){if(dist(p.x,p.z,pl.x,pl.z)>5||roomKey(p.x,p.z)!==roomKey(pl.x,pl.z))snapOne(p,i);const st=W3.fst.get(p.id);if(st)st.path=null;i++}}
function snapCamera(){W3.camX=S.player.x;W3.camZ=S.player.z}

// ---------- you ----------
function playerMove(dt){const pl=S.player;const k=W3.keys;let mx=0,mz=0;
  if(k.w||k.arrowup){mx-=1;mz-=1}if(k.s||k.arrowdown){mx+=1;mz+=1}if(k.a||k.arrowleft){mx-=1;mz+=1}if(k.d||k.arrowright){mx+=1;mz-=1}
  if(mx||mz){cancelWalk();const l=Math.hypot(mx,mz);mx/=l;mz/=l}
  else{
    if(W3.attackT){const z=W3.zmap.get(W3.attackT);if(!z||!S.zeds.includes(z))W3.attackT=null;else{const d=dist(z.x,z.z,pl.x,pl.z);if(d<=reach()&&losClear(pl.x,pl.z,z.x,z.z)){W3.path=null;W3.ptarget=null;W3.ang=Math.atan2(z.x-pl.x,z.z-pl.z);swingAt(z)}else if((W3.repath-=dt)<=0){walkTo(z.x,z.z,true);W3.repath=.5}}}
    if(W3.talkOnArrive){const p=P(W3.talkOnArrive);if(!p||!p.alive)W3.talkOnArrive=null;else if(dist(p.x,p.z,pl.x,pl.z)<1.9&&losClear(p.x,p.z,pl.x,pl.z)){W3.talkOnArrive=null;W3.path=null;W3.ptarget=null;openTalk(p.id)}else if((W3.repath-=dt)<=0){walkTo(p.x,p.z,true);W3.repath=.6}}
    if(W3.useOnArrive&&useReached(W3.useOnArrive)){const u=W3.useOnArrive;W3.useOnArrive=null;W3.path=null;W3.ptarget=null;doUse(u)}
    if(W3.path){const st=W3.pst;while(st.pi<W3.path.length){const w=W3.path[st.pi];const dx=w.x-pl.x,dz=w.z-pl.z,l=Math.hypot(dx,dz);const last=st.pi===W3.path.length-1;if(l<(last?.12:.25)){st.pi++;continue}mx=dx/l;mz=dz/l;break}
      if(st.pi>=W3.path.length){W3.path=null;W3.ptarget=null;if(W3.useOnArrive){const u=W3.useOnArrive;W3.useOnArrive=null;if(useReached(u,1.5))doUse(u)}}}}
  W3.moving=false;if(!(mx||mz))return;if(W3.task)cancelTask();
  const enc=weight()>maxW();const run=W3.run&&pl.energy>8&&!enc;let spd=(run?5.4:3.2)*(enc?.6:1)*(pl.energy<10?.7:1)*(pl.hp<30?.75:1);if(onFord(pl.x,pl.z))spd*=.45;
  // a door in front of you opens if it can
  const D=doorAt(pl.x+mx*.5,pl.z+mz*.5,.28);if(D&&!doorOpen(D)){if(!doorLocked(D)){D.open=true;D.auto=true;W3.autoDoors.add(D);doorSave(D)}else{const t=performance.now();if(t-(W3.lockMsg||0)>2500){W3.lockMsg=t;toast(lockedMsg(D))}if(W3.path){W3.path=null;W3.ptarget=null}}}
  const s=spd*dt;const moved=step(pl,mx*s,mz*s,.3,"pl");
  if(!moved&&W3.path){W3.stuckT=(W3.stuckT||0)+dt;if(W3.stuckT>1.2){W3.path=null;W3.ptarget=null;W3.stuckT=0}}else W3.stuckT=0;
  W3.ang=Math.atan2(mx,mz);W3.moving=true;
  if(run){pl.energy=Math.max(0,pl.energy-dt*.12);W3.runN=(W3.runN||0)+dt;if(W3.runN>.6){W3.runN=0;noise(pl.x,pl.z,9)}}
  if(onFord(pl.x,pl.z))pl.warmth=Math.max(0,pl.warmth-dt*.3)}
// doors you pushed open by walking swing shut behind you
function autoDoors(){const pl=S.player;for(const D of W3.autoDoors){if(!D.open||!D.auto){W3.autoDoors.delete(D);continue}if(dist(D.x,D.z,pl.x,pl.z)>2.1&&!doorBlocked(D)){D.open=false;D.auto=false;doorSave(D);W3.autoDoors.delete(D)}}}
function useReached(u,extra=0){const pl=S.player;
  if(u.k==="cont"){const c=CONTS[u.id];if(!c)return true;return contReach(c,pl.x,pl.z)<.75+extra&&(!c.f||roomKey(pl.x,pl.z)===c.b+"/"+c.room||extra>0)}
  if(u.k==="door")return dist(u.D.x,u.D.z,pl.x,pl.z)<1.25+extra;
  if(u.k==="pile"){const p=S.piles.find(q=>q.id===u.id);return!p||dist(p.x,p.z,pl.x,pl.z)<1.2+extra}return true}
function doUse(u){if(u.k==="cont")tryOpenCont(u.id);else if(u.k==="door")useDoor(u.D);else if(u.k==="pile")openCont(u.id)}

// ---------- the dead ----------
// what each nearby walker is doing right now (kept out of the save)
function zst(z){let s=W3.zst.get(z.id);if(!s)W3.zst.set(z.id,s={tgt:null,lt:0,path:null,pi:0,pt:0,bang:0,cd:0});return s}
function hasLight(){return invHas("flashlight")}
function lightOn(){return W3.night&&W3.flOn&&hasLight()}
function moveZeds(dt){const pl=S.player;const wx=wxName();const sight=(W3.night?(lightOn()?7.5:5):11)*(wx==="fog"?.7:wx==="rain"?.85:1);
  const act=[];for(const z of S.zeds)if(Math.abs(z.x-pl.x)<55&&Math.abs(z.z-pl.z)<55)act.push(z);
  const tg=[pl,...W3.followers];const now=performance.now();
  for(const z of act){const Z=zst(z);if(z.stun>0){z.stun-=dt;continue}
    // look around a few times a second
    Z.lt-=dt;if(Z.lt<=0){Z.lt=.22+rf()*.18;let best=null,bd=1e9;const sr=z.st==="chase"?sight*1.6:sight;
      for(const t of tg){if(t.alive===false)continue;if(Math.abs(t.x-z.x)>sr||Math.abs(t.z-z.z)>sr)continue;const d=dist(z.x,z.z,t.x,t.z);if(d<sr&&d<bd&&losClear(z.x,z.z,t.x,t.z)){bd=d;best=t}}
      if(best){if(Z.tgt!==best)Z.path=null;Z.tgt=best;z.st="chase";z.tx=best.x;z.tz=best.z}
      else if(z.st==="chase"){z.st="hunt";Z.tgt=null;Z.path=null}}
    const T=z.st==="chase"?Z.tgt:null;if(T){z.tx=T.x;z.tz=T.z}
    let spd=z.st==="chase"?2.15:z.st==="hunt"?1.35:.45;
    if(z.st==="hunt"&&dist(z.x,z.z,z.tx,z.tz)<1){z.st="idle";Z.path=null}
    if(z.st==="idle"){z.wt=(z.wt||0)-dt;if(z.wt<=0){z.wt=3+rf()*8;Z.path=null;const b=bldAt(z.x,z.z);
      if(b&&rf()<.6){const r=roomAt(z.x,z.z);const sp=b.spots.filter(s=>s.room===r.ri);const s=sp.length?pick(sp):null;if(s){z.tx=s.x;z.tz=s.z}}
      else if(rf()<.55){z.tx=z.x+(rf()-.5)*10;z.tz=z.z+(rf()-.5)*10}else{z.tx=z.x;z.tz=z.z}}}
    // close enough to bite
    if(T){const d=dist(z.x,z.z,T.x,T.z);if(d<1.05){Z.cd-=dt;if(Z.cd<=0&&losClear(z.x,z.z,T.x,T.z)){Z.cd=1.35+rf()*.45;if(T===pl)zedHitsPlayer(z);else zedHitsNPC(z,T)}continue}}
    const dx=z.tx-z.x,dz=z.tz-z.z,l=Math.hypot(dx,dz);if(l<.15)continue;const s=Math.min(l,spd*dt);
    let r;const direct=!Z.path&&(roomKey(z.x,z.z)===roomKey(z.tx,z.tz)&&(z.st==="idle"||losClear(z.x,z.z,z.tx,z.tz)));
    if(direct){r=step(z,dx/l*s,dz/l*s,.3,"zed")?1:0;if(!r&&z.st!=="idle"){Z.path=navPath(z.x,z.z,z.tx,z.tz);Z.pi=0;Z.pt=1.2}}
    else{Z.pt-=dt;if(!Z.path||Z.pt<=0){Z.path=navPath(z.x,z.z,z.tx,z.tz);Z.pi=0;Z.pt=z.st==="chase"?.9:2.5}r=walkAlong(z,Z.path,Z,s,"zed",.3);if(r===2)Z.path=null}
    if(r===0){// a closed door in the way gets pounded on
      const ax=z.x+(Z.path&&Z.path[Z.pi]?Math.sign(Z.path[Z.pi].x-z.x)*.5:dx/l*.5),az=z.z+(Z.path&&Z.path[Z.pi]?Math.sign(Z.path[Z.pi].z-z.z)*.5:dz/l*.5);const D=doorAt(ax,az,.35);
      if(D&&!doorOpen(D)&&z.st!=="idle"){Z.bang-=dt;if(Z.bang<=0){Z.bang=1.1+rf()*.5;D.hp-=rnd(3,7);D.thump=now;noise(D.x,D.z,6);
        if(dist(D.x,D.z,pl.x,pl.z)<16&&now-(W3.bangMsg||0)>9000){W3.bangMsg=now;toast(D.hp<40?"The door is splintering. It won't hold much longer.":"Something is pounding on a door nearby.")}
        if(D.hp<=0){D.broken=true;D.open=true;D.bar=0;D.lock=null;doorSave(D);if(dist(D.x,D.z,pl.x,pl.z)<25){toast("A door gives way.");journal(`The dead broke down a door at ${doorBld(D)?.n||"a building"}.`,"bad")}}}}
      else if(z.st==="idle")z.wt=0;else{Z.stk=(Z.stk||0)+dt;if(Z.stk>3){Z.stk=0;Z.path=null;if(z.st==="hunt")z.st="idle"}}}
    else Z.stk=0;
    z.r=regionAt(z.x,z.z)}
  // the dead don't stack up on each other, or on you
  for(let i=0;i<act.length;i++)for(let j=i+1;j<act.length;j++){const a=act[i],b=act[j];const dx=b.x-a.x,dz=b.z-a.z;if(Math.abs(dx)>.6||Math.abs(dz)>.6)continue;const d=Math.hypot(dx,dz);if(d<.6&&d>.001){const q=(.6-d)/2/d;step(a,-dx*q,-dz*q,.3,"zed");step(b,dx*q,dz*q,.3,"zed")}}
  for(const z of act){const d=dist(z.x,z.z,pl.x,pl.z);if(d<.72&&d>.001){const q=(.72-d)/d;step(z,(z.x-pl.x)*q,(z.z-pl.z)*q,.3,"zed")}}}
function zedHitsPlayer(z){const pl=S.player;const ar=armor();if(rf()>.72-pl.sk.fight*.02-ar*.015)return;
  const dmg=Math.max(1,rnd(3,8)-ar*.4);pl.hp=Math.max(0,pl.hp-dmg);W3.hurt=.35;if(W3.task)cancelTask("You're hit. You drop what you were doing.");
  const slot=gearEq("outer")?"outer":gearEq("body")?"body":null;if(slot){const g=gearEq(slot);g.dur-=3;if(g.dur<=0){breakSlot(slot);journal(`Your ${ITEMS[g.id].n.toLowerCase()} is torn to rags.`,"bad")}}
  if(!pl.bitten&&rf()<.13*(1-ar/12)){pl.bitten=S.t;journal("Teeth, through your sleeve and into your arm. You've been bitten. You know what that means. You have a day, maybe two.","bad");toast("You've been bitten.")}
  else if(!pl.bleeding&&rf()<.22){pl.bleeding=1;toast("You're bleeding.")}
  if(pl.hp<=0)die("the dead")}
function zedHitsNPC(z,p){if(rf()>.55)return;p.health-=rnd(4,10);bubble(p,pick(["Get off me!","Help!","*screams*","No, no, no!"]),1.6);
  if(!p.bitten&&rf()<.12){p.bitten=S.t+rnd(6,30)*60;mem(p,"I got bit. I haven't told anyone.",-10,p.id);if(rf()<.5)toast(`${p.name} cries out. Did they get bitten?`)}
  if(p.health<=0){kill(p,"was killed by the dead");journal(`${p.name} died beside you.`,"bad");markUI()}}
function reach(){const w=weapon();return w?(ITEMS[w.id].gun?13:(ITEMS[w.id].reach||1.7)):1.3}
function attackNearest(){const pl=S.player;if(W3.task)return;let best=null,bs=1e9;const R=reach()+.4;
  for(const z of S.zeds){if(Math.abs(z.x-pl.x)>R||Math.abs(z.z-pl.z)>R)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d>R)continue;let da=Math.atan2(z.x-pl.x,z.z-pl.z)-W3.ang;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;
    const sc=d+Math.abs(da)*.8;if(sc<bs&&losClear(pl.x,pl.z,z.x,z.z)){bs=sc;best=z}}
  if(best){W3.ang=Math.atan2(best.x-pl.x,best.z-pl.z);swingAt(best)}else if(W3.cd<=0){W3.swing=.2;W3.cd=.5}}
function swingAt(z){const pl=S.player;if(W3.cd>0)return;const w=weapon();const it=w?ITEMS[w.id]:null;
  if(it&&it.gun){if(!invHas("ammo")){toast("Out of ammo. Switch weapons or run.");W3.cd=.6;return}invTake("ammo");noise(pl.x,pl.z,45);W3.cd=.9;W3.flash=.07}else W3.cd=.75+(it?it.w*.12:0);
  W3.swing=.2;pl.energy=Math.max(0,pl.energy-.35);
  const hitCh=it&&it.gun?.68+pl.sk.fight*.03:.84+pl.sk.fight*.015;
  if(rf()<hitCh){const dmg=(it?it.dmg:2)+pl.sk.fight*.6;z.hp-=dmg*(.8+rf()*.4);const kx=z.x-pl.x,kz=z.z-pl.z,l=Math.hypot(kx,kz)||1;step(z,kx/l*.6,kz/l*.6,.3,"zed");z.stun=.5;z.st="chase";zst(z).tgt=pl;
    const br=wearWeapon(1);if(br)toast(br.trim());if(z.hp<=0)killZed(z,true)}
  if(!(it&&it.gun))noise(pl.x,pl.z,7)}
function companions(dt){for(const p of W3.followers){if(p.age<14)continue;p._cd=(p._cd||0)-dt;if(p._cd>0)continue;let best=null,bd=1.6;
  for(const z of S.zeds){if(Math.abs(z.x-p.x)>bd||Math.abs(z.z-p.z)>bd)continue;const d=dist(z.x,z.z,p.x,p.z);if(d<bd&&losClear(p.x,p.z,z.x,z.z)){bd=d;best=z}}
  if(best){p._cd=1.3;if(rf()<.6+p.sk.fight*.05){best.hp-=3+p.sk.fight*.8;best.stun=.4;if(best.hp<=0){killZed(best,false);if(rf()<.3)mem(p,`${S.player.name} and I fought off the dead together.`,3)}}}}}
function killZed(z,byYou){S.zeds=S.zeds.filter(x=>x!==z);W3.zst.delete(z.id);if(byYou){S.stats.kills++;skillUp("fight",.06)}if(W3.attackT===z.id)W3.attackT=null;
  addCorpse(z,"zed");FIGMAP.delete(z.id);W3.zmap.delete(z.id);
  // what they had on them
  const q=z.pid&&z.pid!=="you"?P(z.pid):null;if(q&&q.pack&&!q.dropped){q.dropped=true;for(const [k,n] of Object.entries(q.pack))if(ITEMS[k]&&n>0)dropAt(k,n,z.x,z.z)}
  else if(rf()<.14)dropAt(pick(["cigarettes","lighter","snacks","bandage","painkillers","cloth","water_bottle"]),1,z.x,z.z);
  if(z.pid&&z.pid!=="you"){const pl=S.player;pl.flags.mercy=pl.flags.mercy||{};pl.flags.mercy[z.pid]=true;journal(`You put ${z.name} to rest.${q&&q.met?" You knew them. You make yourself look at their face.":""}`,"bad");
    for(const p of living())if(p.fam[z.pid]&&p.met&&dist(p.x,p.z,S.player.x,S.player.z)<20)mem(p,`${S.player.name} put my ${p.fam[z.pid]} down. I watched.`,-2,z.pid)}}
function dropAt(id,n,x,z){const it=ITEMS[id];while(n>0){const g=mkInst(id,Math.min(n,it.st));dropInst(g,x,z);n-=g.n}}
// the people who die near you leave what they carried
function dropDead(){const pl=S.player;for(const p of S.people){if(p.alive||p.dropped||!p.pack||p.status!=="dead")continue;if(Math.abs(p.x-pl.x)>60||Math.abs(p.z-pl.z)>60){p.dropped=true;continue}p.dropped=true;for(const [k,n] of Object.entries(p.pack))if(ITEMS[k]&&n>0)dropAt(k,n,p.x,p.z)}}

// ---------- what E would do right now ----------
function promptTargets(){const pl=S.player;const out=[];const myK=roomKey(pl.x,pl.z);const ang=W3.ang;
  const facing=(x,z)=>{let da=Math.atan2(x-pl.x,z-pl.z)-ang;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;return Math.abs(da)<1.1?-.35:0};
  for(const p of nearPeople(2.2)){if(p.age<4)continue;const d=dist(p.x,p.z,pl.x,pl.z);if(!losClear(p.x,p.z,pl.x,pl.z))continue;out.push({k:"talk",p,x:p.x,z:p.z,y:1.95,sc:d-.3+facing(p.x,p.z),label:`Talk to ${p.met?p.name:"the stranger"}`})}
  const b=bldAt(pl.x,pl.z);const near=[];if(b)near.push(b);for(const o of W3.bm.values()){const B=o.b;if(B!==b&&Math.abs(B.x-pl.x)<B.w/2+2&&Math.abs(B.z-pl.z)<B.d/2+2)near.push(B)}
  for(const B of near){for(const c of B.cs||[]){const d=contReach(c,pl.x,pl.z);if(d>.9)continue;if(myK!==B.id+"/"+c.room)continue;out.push({k:"cont",c,x:c.x,z:c.z,y:FURN[c.f.k].h+(c.f.y||0)+.35,sc:d+facing(c.x,c.z),label:contVerb(c)})}
    for(const D of B.doors){const d=dist(D.x,D.z,pl.x,pl.z);if(d>1.5)continue;out.push({k:"door",D,x:D.x,z:D.z,y:2.35,sc:d+.25+facing(D.x,D.z),label:doorVerb(D)})}}
  for(const c of CARS){if(Math.abs(c.x-pl.x)>3.5||Math.abs(c.z-pl.z)>3.5)continue;const C=CONTS[c.id];const d=contReach(C,pl.x,pl.z);if(d<.9)out.push({k:"cont",c:C,x:c.x,z:c.z,y:1.7,sc:d+facing(c.x,c.z),label:`Search the ${c.n.toLowerCase()}`})}
  for(const p of S.piles){if(!p.c.items.length)continue;const d=dist(p.x,p.z,pl.x,pl.z);if(d<1.4&&roomKey(p.x,p.z)===myK)out.push({k:"pile",id:p.id,x:p.x,z:p.z,y:.7,sc:d+.1+facing(p.x,p.z),label:`Look through what's on the ground`})}
  return out.sort((a,c)=>a.sc-c.sc)}
function contVerb(c){const C=CONT[c.k];const s=S.cont[c.id];const n=(C?C.n:c.n||"it").toLowerCase();if(s&&s.lock&&!s.pried)return hasTool("pry")?`Pry open the ${n}`:`The ${n} is locked`;
  const verb=["fridge","cupboard","closet","locker","schoollocker","medicine","pharmacab","medcab","armory","vestry","filing"].includes(c.k)?"Open":"Search";return `${verb} the ${n}${s&&s.rolled&&s.seen?" again":""}`}
function doorVerb(D){const lk=doorLocked(D);if(D.broken)return"A broken door";if(doorOpen(D))return"Close the door";if(!lk)return"Open the door";
  if(lk==="bar")return playerSide(D)==="in"?"Take the boards down":hasTool("pry")?"Pry the boards off":"Kick the door";if(lk==="home")return D.refused&&S.t-D.refused<120?"Kick the door in":"Knock";return hasTool("pry")?"Pry the lock":"Kick the door"}
function updPrompt(){const pl=S.player;let t=null;if(pl.alive!==false&&!W3.task&&!UI.modal)t=promptTargets()[0]||null;
  if(t&&t.k==="door"&&!doorOpen(t.D)&&!t.D.bar&&canBoard()&&t.D.ext)t.sub="B · board it up";
  W3.promptT=t;const el=W3.promptEl;if(!el)return;const key=t?t.k+(t.p?.id||t.c?.id||t.D?.id||t.id||"")+t.label+(t.sub||""):"";
  if(key!==W3.promptKey){W3.promptKey=key;if(t){el.hidden=false;el.innerHTML=`<b>E</b> ${esc(t.label)}${t.sub?` <span class="mute">· ${esc(t.sub)}</span>`:""}`}else el.hidden=true}
  if(t)place(el,t.x,t.y,t.z)}
function interact(){const t=W3.promptT;if(!t||UI.modal||S.player.alive===false)return;cancelWalk();
  if(t.k==="talk")openTalk(t.p.id);else if(t.k==="cont")tryOpenCont(t.c.id);else if(t.k==="door")useDoor(t.D);else if(t.k==="pile")openCont(t.id)}
// opening furniture: locks, people watching, the dead too close
function tryOpenCont(cid){const pl=S.player;const c=CONTS[cid];if(!c)return;
  if(zedNear(3.2)){toast("Not with the dead this close.");return}
  const s=contState(cid);const T=CONT[c.k]||{};
  if(s.lock&&!s.pried){if(!hasTool("pry")){toast(`The ${(T.n||"cabinet").toLowerCase()} is locked. A crowbar would open it.`);return}
    startTask(4,`Prying open the ${(T.n||"cabinet").toLowerCase()}`,()=>{s.pried=true;s.lock=false;wearTool("pry",2);noise(pl.x,pl.z,10);skillUp("scavenge",.04);witnesses(c,true);openCont(cid)});return}
  witnesses(c,false);openCont(cid)}
// people who see you going through things that aren't yours
function witnesses(c,loud){const pl=S.player;if(!c.b)return;const b=BMAP[c.b];if(!b||b.id===pl.home)return;const g=myGroup();if(g&&b.site&&g.home===b.site)return;
  const shop=isShop(b);if(shop&&S.flags.clinic&&!loud)return;
  const seen=S.people.filter(p=>p.alive&&p.age>=8&&!isFollower(p)&&p.act!=="asleep"&&bldAt(p.x,p.z)===b&&dist(p.x,p.z,pl.x,pl.z)<12&&losClear(p.x,p.z,pl.x,pl.z));
  if(!seen.length)return;const k=c.id+":"+dayOf(S.t);pl.flags.seen=pl.flags.seen||{};if(pl.flags.seen[k])return;pl.flags.seen[k]=1;
  for(const p of seen){const own=p.home===b.id||JOBS[p.job]?.work===b.id;const hit=own?10:4;if(feel(p)>45&&!own)continue;p.trust=clamp(p.trust-hit,-100,100);mem(p,own?`Caught ${pl.name} going through our things.`:`Saw ${pl.name} helping themselves at ${b.n}.`,own?-8:-3);
    if(own)bubble(p,styleSay(p,pick(shop?["Hey! You going to pay for that?","Put that back.","We're closed. Out."]:["What do you think you're doing?","That's ours.","Hey. Hands off."])))}}

// ---------- the mouse: what's under it ----------
const _box={};function box3(){return _box.b||(_box.b=new T3.Box3())}
function rayBox(ray,x0,y0,z0,x1,y1,z1,out){const B=box3();B.min.set(x0,y0,z0);B.max.set(x1,y1,z1);const p=ray.intersectBox(B,out);return p?p.distanceTo(ray.origin):null}
function shown(b){if(!b)return true;const o=W3.bm.get(b.id);return!o||o.cut>.5||W3.inB===b}
function pickAt(ev){const r=W3.wrap.getBoundingClientRect();const v=new T3.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);W3.rc.setFromCamera(v,W3.cam);const ray=W3.rc.ray;const tmp=W3.v3b||(W3.v3b=new T3.Vector3());
  let best=null,bd=1e9;const pl=S.player;const cx=W3.camX,cz=W3.camZ;const R=30/W3.zoom+8;
  const pf=pickFig(W3.rc,f=>shown(bldAt(f.x,f.z)));if(pf){best={fig:pf.f};bd=pf.d}
  for(const o of W3.bm.values()){const b=o.b;if(Math.abs(b.x-cx)>R||Math.abs(b.z-cz)>R||!shown(b))continue;
    for(const c of b.cs||[]){const w=c.f.w;const y0=.08+(c.f.y||0),h=FURN[c.f.k].h;const d=rayBox(ray,w.x0,y0,w.z0,w.x1,y0+h,w.z1,tmp);if(d!=null&&d<bd){bd=d;best={cont:c}}}
    for(const D of b.doors){const x=D.box;const pad=.08;const d=rayBox(ray,x.x0-pad,0,x.z0-pad,x.x1+pad,2.15,x.z1+pad,tmp);if(d!=null&&d<bd-.05){bd=d;best={door:D}}}}
  for(const c of CARS){if(Math.abs(c.x-cx)>R||Math.abs(c.z-cz)>R)continue;const ca=Math.abs(Math.cos(c.rot)),sa=Math.abs(Math.sin(c.rot));const hx=.95*ca+2.05*sa,hz=.95*sa+2.05*ca;const d=rayBox(ray,c.x-hx,0,c.z-hz,c.x+hx,1.45,c.z+hz,tmp);if(d!=null&&d<bd){bd=d;best={cont:CONTS[c.id]}}}
  for(const p of S.piles){if(!p.c.items.length||Math.abs(p.x-cx)>R||Math.abs(p.z-cz)>R)continue;const d=rayBox(ray,p.x-.45,0,p.z-.45,p.x+.45,.35,p.z+.45,tmp);if(d!=null&&d<bd){bd=d;best={pile:p}}}
  if(best)return best;
  const g=new T3.Vector3();if(!ray.intersectPlane(W3.plane,g))return null;const b=bldAt(g.x,g.z);if(b&&!shown(b))return{bld:b,x:g.x,z:g.z};return{ground:{x:g.x,z:g.z}}}
function hoverInfo(h){if(!h)return null;
  if(h.fig){const f=h.fig;if(f.kind==="zed"){const z=W3.zmap.get(f.id);const known=z&&z.pid&&(z.pid==="you"||P(z.pid)?.met);return{x:f.x,z:f.z,y:2.15*(f.lk?.s||1),html:`<b>${esc(known?z.name:"One of the dead")}</b><br><span>click to fight</span>`}}
    const p=P(f.id);if(!p)return null;return{x:f.x,z:f.z,y:2.15*(f.lk?.s||1),html:`<b>${esc(p.met?fullName(p):"A stranger")}</b> <span>${esc(p.met?p.act||"":p.look||"")}</span><br><span>click to talk</span>`}}
  if(h.cont){const c=h.cont;const s=S.cont[c.id];const T=CONT[c.k]||{n:c.n};const y=c.f?FURN[c.f.k].h+(c.f.y||0)+.3:1.7;return{x:c.x,z:c.z,y,html:`<b>${esc(c.car?c.n:T.n)}</b><br><span>${s&&s.rolled&&s.seen?(s.c.items.length?`${s.c.items.length} thing${s.c.items.length>1?"s":""} left`:"empty"):s&&s.lock&&!s.pried?"locked":"click to search"}</span>`}}
  if(h.door){const D=h.door;const lk=doorLocked(D);return{x:D.x,z:D.z,y:2.4,html:`<b>Door</b><br><span>${D.broken?"broken":doorOpen(D)?"open":lk==="bar"?"boarded up":lk?"locked":"closed"}</span>`}}
  if(h.pile)return{x:h.pile.x,z:h.pile.z,y:.8,html:`<b>On the ground</b><br><span>${h.pile.c.items.length} thing${h.pile.c.items.length>1?"s":""}</span>`};
  if(h.bld)return{x:h.bld.x,z:h.bld.z,y:h.bld.H+1.2,html:`<b>${esc(h.bld.n)}</b><br><span>click to walk to the door</span>`};return null}
function setHighlight(h){const m=W3.hl;if(!m)return;let bx=null;
  if(h&&h.cont){const c=h.cont;if(c.f){const w=c.f.w,y0=.08+(c.f.y||0);bx=[w.x0,y0,w.z0,w.x1,y0+FURN[c.f.k].h,w.z1]}else{const k=c.car;const ca=Math.abs(Math.cos(k.rot)),sa=Math.abs(Math.sin(k.rot));const hx=.95*ca+2.05*sa,hz=.95*sa+2.05*ca;bx=[k.x-hx,0,k.z-hz,k.x+hx,1.45,k.z+hz]}}
  else if(h&&h.door){const x=h.door.box;bx=[x.x0,0,x.z0,x.x1,2.15,x.z1]}else if(h&&h.pile){const p=h.pile;bx=[p.x-.4,0,p.z-.4,p.x+.4,.3,p.z+.4]}
  if(!bx){m.visible=false;return}m.visible=true;m.position.set((bx[0]+bx[3])/2,(bx[1]+bx[4])/2,(bx[2]+bx[5])/2);m.scale.set(Math.max(.05,bx[3]-bx[0])+.04,Math.max(.05,bx[4]-bx[1])+.04,Math.max(.05,bx[5]-bx[2])+.04)}
function onHover(ev){if(!W3.ok||!S||UI.create||ev.pointerType==="touch")return;if(ev.target!==W3.ren.domElement)return;const now=performance.now();if(now-(W3.hovT||0)<45)return;W3.hovT=now;
  const h=pickAt(ev);const info=hoverInfo(h);W3.ren.domElement.style.cursor=h&&!h.ground?"pointer":"crosshair";setHighlight(h);
  const key=h?(h.fig?"f"+h.fig.id:h.cont?"c"+h.cont.id:h.door?"d"+h.door.id:h.pile?"p"+h.pile.id:h.bld?"b"+h.bld.id:""):"";
  if(key!==W3.hoverKey){W3.hoverKey=key;W3.hover=info?{h,info}:null;if(info){W3.hoverEl.innerHTML=info.html;W3.hoverEl.hidden=false}else W3.hoverEl.hidden=true}else if(W3.hover&&info)W3.hover.info=info}
function onClick(ev){if(!W3.ok||!S||UI.create||UI.modal||S.player.alive===false)return;const h=pickAt(ev);if(!h)return;const pl=S.player;cancelWalk();if(W3.task)cancelTask();
  if(UI.talkTo&&!h.fig)closeTalk();
  if(h.fig){const f=h.fig;if(f.kind==="zed"){W3.attackT=f.id;W3.repath=0;return}const p=P(f.id);if(!p)return;const d=dist(p.x,p.z,pl.x,pl.z);
    if((d<2.3||(isFollower(p)&&d<6))&&losClear(p.x,p.z,pl.x,pl.z)){openTalk(p.id);return}W3.talkOnArrive=p.id;walkTo(p.x,p.z,true);return}
  if(h.cont){const c=h.cont;W3.useOnArrive={k:"cont",id:c.id};if(useReached(W3.useOnArrive)){W3.useOnArrive=null;tryOpenCont(c.id);return}walkTo(c.ux,c.uz,true);return}
  if(h.door){const D=h.door;W3.useOnArrive={k:"door",D};if(useReached(W3.useOnArrive)){W3.useOnArrive=null;useDoor(D);return}const d=D.dw;const a=d.p[0],b=d.p[1];const s=dist(pl.x,pl.z,a.x,a.z)<dist(pl.x,pl.z,b.x,b.z)?a:b;walkTo(s.x,s.z,true);return}
  if(h.pile){W3.useOnArrive={k:"pile",id:h.pile.id};if(useReached(W3.useOnArrive)){W3.useOnArrive=null;openCont(h.pile.id);return}walkTo(h.pile.x,h.pile.z,true);return}
  if(h.bld){const o=doorOut(h.bld);walkTo(o.x,o.z);return}
  if(h.ground)walkTo(h.ground.x,h.ground.z)}

// ---------- camera ----------
function camera(dt){const pl=S.player;if(Math.abs(W3.camX-pl.x)>30||Math.abs(W3.camZ-pl.z)>30)snapCamera();const k=1-Math.pow(.002,dt);W3.camX+=(pl.x-W3.camX)*k;W3.camZ+=(pl.z-W3.camZ)*k;
  const asp=W3.rw/Math.max(1,W3.rh);const vh=26/W3.zoom;const C=W3.cam;C.left=-vh*asp/2;C.right=vh*asp/2;C.top=vh/2;C.bottom=-vh/2;C.updateProjectionMatrix();
  // an open panel covers the right of the screen, so the view slides to keep you in the open part
  const pw=UI.panel&&W3.panelW&&W3.rw>760?W3.panelW:0;const want=pw/Math.max(1,W3.rw)*vh*asp/2;W3.shift=(W3.shift||0)+(want-(W3.shift||0))*(1-Math.pow(.004,dt));
  const lx=W3.camX+W3.shift*.7071,lz=W3.camZ-W3.shift*.7071;C.position.set(lx+30,34,lz+30);C.lookAt(lx,0,lz);
  // the sun's shadow box follows you, snapped to its own texels so edges don't crawl
  const L=W3.sun;const sz=L.shadow.camera.right-L.shadow.camera.left;const tx=sz/L.shadow.mapSize.x;const fx=Math.round(lx/tx)*tx,fz=Math.round(lz/tx)*tx;
  L.target.position.set(fx,0,fz);L.position.set(fx+W3.sunDir.x*60,W3.sunDir.y*60,fz+W3.sunDir.z*60);L.target.updateMatrixWorld()}

// ---------- light, weather ----------
function dayLight(h){return h<5||h>20.5?0:h<7?(h-5)/2:h>18.5?(20.5-h)/2:1}
function weatherFx(){const wx=wxName();if(W3.wx===wx)return;W3.wx=wx;if(W3.precip){W3.scene.remove(W3.precip.pts);W3.precip=null}
  if(wx==="rain"||wx==="snow"){const n=wx==="snow"?900:1400,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=(Math.random()*2-1)*36;pos[i*3+1]=Math.random()*26;pos[i*3+2]=(Math.random()*2-1)*36}
    const geo=new T3.BufferGeometry();geo.setAttribute("position",new T3.BufferAttribute(pos,3));const pts=new T3.Points(geo,new T3.PointsMaterial({color:wx==="snow"?"#f4f6f8":"#a9c3d6",size:wx==="snow"?3:2,sizeAttenuation:false,transparent:true,opacity:.7,depthWrite:false}));pts.frustumCulled=false;W3.scene.add(pts);W3.precip={pts,snow:wx==="snow"}}
  W3.scene.fog=wx==="fog"?new T3.Fog("#8a9188",48,110):null}
function lighting(){weatherFx();const h=hourOf(S.t)+(S.t%60)/60;const d=dayLight(h);const wx=wxName();const cl=wx==="clear"?1:wx==="snow"?.8:.62;
  // the sun comes up over the hills in the east and goes down behind the woods
  const az=clamp((h-5.5)/15,0,1)*Math.PI;W3.sunDir.set(Math.cos(az)*.85,.55+Math.sin(az)*.9,.42+(1-Math.sin(az))*.2).normalize();
  if(d<=0)W3.sunDir.set(-.35,1,.55).normalize();
  const warm=d>0&&d<1?1-d:0;W3.sun.color.copy(CC(d<=0?"#8aa0c8":"#fff1d6")).lerp(CC("#ffb070"),warm*.8);
  W3.sun.intensity=d<=0?.16:(.35+.95*d)*cl;W3.hemi.intensity=.18+.5*d*(wx==="clear"?1:.85);W3.hemi.color.copy(CC(d<=0?"#5a6a8a":"#dfe8f0"));
  const sky=CC(SKY[wx]||SKY.clear).clone(),night=CC("#05080d");W3.scene.background=night.clone().lerp(sky,d);if(W3.scene.fog)W3.scene.fog.color.copy(W3.scene.background);
  W3.night=d<.28;const pl=S.player;const fl=lightOn();W3.spot.intensity=fl?2.2:0;W3.plight.intensity=W3.night?(fl?.25:.55):0;W3.plight.distance=7;
  // a lamp in the room you're in, while the power lasts
  const r=roomAt(pl.x,pl.z);if(r&&W3.night&&!S.flags.blackout){const R=r.b.rooms[r.ri];const c=toWorld(r.b,(R.u0+R.u1)/2,(R.v0+R.v1)/2);W3.room.position.set(c.x,r.b.H-.5,c.z);W3.room.intensity=1.1;W3.room.distance=Math.max(R.u1-R.u0,R.v1-R.v0)*1.4+2}else W3.room.intensity=0;
  const fire=nearFireObj();if(fire){W3.fireLight.position.set(fire.x,1.2,fire.z);W3.fireLight.intensity=W3.night?1.6:.5}else W3.fireLight.intensity=0;
  windowLights()}
function nearFireObj(){const pl=S.player;if(pl.fire&&pl.fire.until>S.t&&dist(pl.fire.x,pl.fire.z,pl.x,pl.z)<25)return pl.fire;
  const v=W3.v3c||(W3.v3c=new T3.Vector3());for(const fl of W3.flames){fl.getWorldPosition(v);if(Math.abs(v.x-pl.x)<25&&Math.abs(v.z-pl.z)<25)return{x:v.x,z:v.z}}return null}
function animFx(dt,ts){for(const f of W3.flames)f.scale.y=f.userData.base*(1+Math.sin(ts/90+f.id)*.14+Math.random()*.1);
  if(W3.fireLight.intensity>0)W3.fireLight.intensity*=.94+Math.random()*.1;
  if(W3.precip){const a=W3.precip.pts.geometry.attributes.position;const v=W3.precip.snow?3:24;for(let i=0;i<a.count;i++){let y=a.getY(i)-v*dt;if(y<0)y+=26;a.setY(i,y)}a.needsUpdate=true;W3.precip.pts.position.set(W3.camX,0,W3.camZ)}
  if(W3.hurt>0){W3.hurt-=dt;W3.hurtEl.style.opacity=Math.max(0,W3.hurt*2.4).toFixed(2)}else if(W3.hurtEl.style.opacity!=="0")W3.hurtEl.style.opacity="0";
  if(W3.flash>0){W3.flash-=dt;W3.plight.intensity=3;W3.plight.distance=16}
  if(W3.areaT>0){W3.areaT-=dt;W3.areaEl.style.opacity=Math.min(1,W3.areaT).toFixed(2)}
  if(W3.water&&W3.water.material.map)W3.water.material.map.offset.x=(ts/60000)%1;
  if(W3.mark){W3.mark.visible=!!W3.ptarget;if(W3.ptarget){W3.mark.position.set(W3.ptarget.x,.07+(bldAt(W3.ptarget.x,W3.ptarget.z)?.08:0),W3.ptarget.z);W3.mark.scale.setScalar(1+Math.sin(ts/150)*.1)}}
  if(W3.swing>0)W3.swing-=dt;
  const pl=S.player;W3.plight.position.set(pl.x,2.2,pl.z);const s=W3.spot;s.position.set(pl.x+Math.sin(W3.ang)*.2,1.35,pl.z+Math.cos(W3.ang)*.2);s.target.position.set(pl.x+Math.sin(W3.ang)*6,0,pl.z+Math.cos(W3.ang)*6);s.target.updateMatrixWorld()}

// ---------- words on screen: names, speech, the prompt ----------
function mkLabel(text,cls){const d=document.createElement("div");d.className="w3label "+(cls||"");d.textContent=text;W3.lblBox.appendChild(d);return d}
function project(x,y,z){const v=W3.v3.set(x,y,z).project(W3.cam);return{x:(v.x+1)/2*W3.rw,y:(1-v.y)/2*W3.rh,on:v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1}}
function place(el,x,y,z){const s=project(x,y,z);if(!s.on){if(el.style.display!=="none")el.style.display="none";return s}if(el.style.display==="none")el.style.display="";el.style.transform=`translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`;return s}
// a line someone says out loud, shown over their head
function bubble(p,text,secs){if(!W3.ok||!p||!text)return;W3.bq.push({id:p.id,text,at:performance.now(),secs:secs||Math.min(6,2.2+text.length*.045)})}
function chatter(dt){W3.chatT=(W3.chatT??5)-dt;if(W3.chatT>0)return;W3.chatT=7+rf()*9;const pl=S.player;
  const near=S.people.filter(p=>p.alive&&p.age>=6&&!isFollower(p)&&p.act!=="asleep"&&UI.talkTo!==p.id&&Math.abs(p.x-pl.x)<15&&Math.abs(p.z-pl.z)<15);
  for(const a of shuffle(near)){const b=near.find(q=>q!==a&&dist(q.x,q.z,a.x,a.z)<3.4&&roomKey(q.x,q.z)===roomKey(a.x,a.z));if(!b)continue;let lines=[];try{lines=overhear(a,b)||[]}catch(e){}
    const now=performance.now();lines.slice(0,4).forEach((ln,i)=>{const m=/^([^:]{1,30}):\s*(.*)$/.exec(ln);const who=m&&m[1]===b.name?b:a;W3.bq.push({id:who.id,text:m?m[2]:ln,at:now+i*2900,secs:2.7})});return}}
function labels(){const pl=S.player;const now=performance.now();
  if(W3.hover){const i=W3.hover.info;place(W3.hoverEl,i.x,i.y,i.z)}
  for(const [id,f] of FIGMAP){if(f.kind!=="npc")continue;const p=P(id);if(!p)continue;let want=null;const vis=shown(bldAt(p.x,p.z));
    if(vis){if(W3.fset.has(id))want=["comp",p.name];else if(p.want&&p.met&&dist(p.x,p.z,pl.x,pl.z)<22)want=["want","!"]}
    if(want){if(!f.lbl)f.lbl=mkLabel("","");const cls="w3label "+want[0];if(f.lbl.className!==cls)f.lbl.className=cls;if(f.lbl.textContent!==want[1])f.lbl.textContent=want[1];place(f.lbl,f.x,1.95*(f.lk?.s||1)+.15,f.z)}else if(f.lbl){f.lbl.remove();f.lbl=null}}
  for(const [id,f] of FIGMAP){if(f.kind!=="zed"){continue}const z=W3.zmap.get(id);const known=z&&z.pid&&(z.pid==="you"||P(z.pid)?.met);if(known&&dist(z.x,z.z,pl.x,pl.z)<16&&shown(bldAt(z.x,z.z))){if(!f.lbl)f.lbl=mkLabel(z.name,"dead");place(f.lbl,f.x,2.05,f.z)}else if(f.lbl){f.lbl.remove();f.lbl=null}}
  // speech
  for(let i=W3.bq.length-1;i>=0;i--){const q=W3.bq[i];if(q.at>now)continue;W3.bq.splice(i,1);const old=W3.bubbles.get(q.id);if(old)old.el.remove();const el=mkLabel(q.text,"say");W3.bubbles.set(q.id,{el,until:now+q.secs*1000})}
  for(const [id,B] of W3.bubbles){const f=FIGMAP.get(id);if(!f||now>B.until||!shown(bldAt(f.x,f.z))){B.el.remove();W3.bubbles.delete(id);continue}place(B.el,f.x,2.05*(f.lk?.s||1)+.35,f.z)}
  // buildings you can see from the street
  for(const b of W3.nearB){let el=W3.blabels.get(b.id);if(!el){el=mkLabel(b.n,"bld");W3.blabels.set(b.id,el)}const o=W3.bm.get(b.id);if(o&&o.cut>.5){if(el.style.display!=="none")el.style.display="none"}else place(el,b.x,b.H+(isHome(b)?2.4:1.3),b.z)}
  for(const [id,el] of W3.blabels)if(!W3.nearB.some(b=>b.id===id)){el.remove();W3.blabels.delete(id)}
  // what you're busy doing
  if(W3.task){if(!W3.taskEl)W3.taskEl=mkLabel("","task");W3.taskEl.innerHTML=`${esc(W3.task.label)}<i style="width:${Math.round(W3.task.t/W3.task.n*100)}%"></i>`;place(W3.taskEl,pl.x,2.3,pl.z)}else if(W3.taskEl){W3.taskEl.remove();W3.taskEl=null}
  if(W3.promptT)place(W3.promptEl,W3.promptT.x,W3.promptT.y,W3.promptT.z)}

// ---------- the small map ----------
function drawMap(c,opt={}){const g=c.getContext("2d");const w=c.width,h=c.height;const mc=mapCanvas(opt.big?6:2);const pl=S.player;
  if(!opt.big){// a zoomed window around you
    const span=110;const sx=mc.width/(WB.x1-WB.x0);const x0=pl.x-span/2,z0=pl.z-span/2*h/w;g.fillStyle="#0b0f0c";g.fillRect(0,0,w,h);g.drawImage(mc,(x0-WB.x0)*sx,(z0-WB.z0)*sx,span*sx,span*h/w*sx,0,0,w,h);
    const k=w/span;const X=x=>(x-x0)*k,Z=z=>(z-z0)*k;for(const b of BUILDINGS){if(Math.abs(b.x-pl.x)>span||Math.abs(b.z-pl.z)>span)continue;g.fillStyle=b.id===pl.home?"rgba(228,138,63,.75)":"rgba(22,22,20,.85)";g.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),b.w*k,b.d*k)}
    g.fillStyle="#d4574a";for(const z of S.zeds)if(Math.abs(z.x-pl.x)<span/2&&Math.abs(z.z-pl.z)<span/2)g.fillRect(X(z.x)-1.5,Z(z.z)-1.5,3,3);
    g.fillStyle="#a9c38d";for(const p of W3.followers)g.fillRect(X(p.x)-2,Z(p.z)-2,4,4);
    if(W3.ptarget){g.strokeStyle="#e48a3f";g.beginPath();g.moveTo(X(pl.x),Z(pl.z));g.lineTo(X(W3.ptarget.x),Z(W3.ptarget.z));g.stroke()}
    g.fillStyle="#e48a3f";g.strokeStyle="#1a120a";g.beginPath();g.arc(X(pl.x),Z(pl.z),4,0,7);g.fill();g.stroke();return}
  g.drawImage(mc,0,0,mc.width,mc.height,0,0,w,h);const sx=w/(WB.x1-WB.x0),sz=h/(WB.z1-WB.z0);const X=x=>(x-WB.x0)*sx,Z=z=>(z-WB.z0)*sz;
  for(const b of BUILDINGS){g.fillStyle=b.id===pl.home?"rgba(228,138,63,.85)":"rgba(24,24,22,.8)";g.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),Math.max(1,b.w*sx),Math.max(1,b.d*sz))}
  for(const k of Object.keys(PLACES))if(PLACES[k].site){const s=S.sites[k];const o=ownerOf(k);s.grid.forEach((cc,i)=>{if(!cc)return;const p=tileXZ(k,i);g.fillStyle=BLD[cc.b].c;g.fillRect(X(p.x-1.3),Z(p.z-1.3),2.6*sx,2.6*sz)});
    if(o){const r=siteRect(k);g.strokeStyle=o.color;g.lineWidth=2;g.strokeRect(X(r[0]),Z(r[1]),(r[2]-r[0])*sx,(r[3]-r[1])*sz);g.fillStyle="#e9e4d7";g.font=`${Math.round(11*(opt.dpr||1))}px JetBrains Mono, monospace`;g.fillText(`${o.name} (${groupSize(o.id)})`,X(r[0]),Z(r[1])-4*(opt.dpr||1))}}
  g.font=`${Math.round(13*(opt.dpr||1))}px Saira Stencil One, sans-serif`;g.fillStyle="rgba(233,228,215,.75)";for(const k of ["town","woods","fields","hills","quarry","farm","church","school","lodge","mill","river"]){if(!PLACES[k])continue;const r=PLACES[k].r[0];const t=PLACES[k].n;g.fillText(t,X((r[0]+r[2])/2)-g.measureText(t).width/2,Z((r[1]+r[3])/2))}
  if(myGroup())for(const p of members(pl.group)){if(isFollower(p))continue;g.fillStyle="rgba(169,195,141,.9)";g.fillRect(X(p.x)-1.5,Z(p.z)-1.5,3,3)}
  g.fillStyle="#d4574a";for(const z of S.zeds)if(Math.abs(z.x-pl.x)<35&&Math.abs(z.z-pl.z)<35)g.fillRect(X(z.x)-1,Z(z.z)-1,2,2);
  g.fillStyle="#a9c38d";for(const p of W3.followers)g.fillRect(X(p.x)-1.5,Z(p.z)-1.5,3,3);
  if(W3.ptarget){g.strokeStyle="#e48a3f";g.lineWidth=1;g.beginPath();g.moveTo(X(pl.x),Z(pl.z));g.lineTo(X(W3.ptarget.x),Z(W3.ptarget.z));g.stroke()}
  g.fillStyle="#e48a3f";g.strokeStyle="#1a120a";g.lineWidth=1;g.beginPath();g.arc(X(pl.x),Z(pl.z),5,0,7);g.fill();g.stroke()}

// ---------- time jumps, the hour, the end ----------
function afterJump(m){const pl=S.player;if(m>=10){for(const z of S.zeds){if(Math.abs(z.x-pl.x)>32||Math.abs(z.z-pl.z)>32)continue;const d=dist(z.x,z.z,pl.x,pl.z);
      if(d<32&&d>4&&rf()<Math.min(.6,m/90)){const f=Math.min(.55,m/120);const ox=z.x,oz=z.z;z.x+=(pl.x-z.x)*f;z.z+=(pl.z-z.z)*f;if(!free(z.x,z.z,.3,"zed")||roomKey(z.x,z.z)!==roomKey(ox,oz)&&bldAt(z.x,z.z)){z.x=ox;z.z=oz}z.r=regionAt(z.x,z.z);W3.zst.delete(z.id)}}}
  if(m>=15)for(const p of S.people)if(p.alive&&!isFollower(p)&&p.age>=2){p.x=p.tx;p.z=p.tz;p.path=null}
  snapFollowers();cancelWalk()}
function act(mins,opt){advance(mins,opt||{});if(S.player.alive!==false)afterJump(mins)}
function worldHour(h){if(S.player.alive===false)return;
  for(const z of [...S.zeds]){if(PLACES[z.r]?.site&&ownerOf(z.r)&&dist(z.x,z.z,S.player.x,S.player.z)>22&&rf()<.6)S.zeds.splice(S.zeds.indexOf(z),1)}
  if(h===8||h===18)feedFollowers();
  if(S.player.fire&&S.player.fire.until<=S.t)S.player.fire=null;
  for(const p of S.piles)if(S.t-p.t>DAY*4&&dist(p.x,p.z,S.player.x,S.player.z)>30)p.c.items=[];cleanPiles();
  markUI()}
function feedFollowers(){const pl=S.player;for(const p of S.people){if(!isFollower(p)||p.group||p.age<2||p.hunger>65)continue;
  let f=Object.keys(p.pack||{}).find(k=>ITEMS[k]?.eat&&!ITEMS[k].eat.sick);if(f){p.pack[f]--;if(!p.pack[f])delete p.pack[f];p.hunger=clamp(p.hunger+ITEMS[f].eat.food*1.6,0,100);continue}
  const hb=BMAP[pl.home];if(hb&&dist(pl.x,pl.z,hb.x,hb.z)<16){if(pl.pantry==null)pl.pantry=rnd(6,12);if(pl.pantry>0){pl.pantry--;p.hunger=clamp(p.hunger+40,0,100);continue}}
  const inv=invMap();f=Object.keys(inv).filter(k=>ITEMS[k].eat&&!ITEMS[k].eat.sick).sort((a,b)=>ITEMS[a].eat.food-ITEMS[b].eat.food)[0];
  if(f){invTake(f);p.hunger=clamp(p.hunger+ITEMS[f].eat.food*1.6,0,100);journal(`${p.name} eats some of your ${ITEMS[f].n.toLowerCase()}.`,"")}else{p.mood-=4;if(rf()<.5)journal(`${p.name} hasn't eaten. They don't complain, which is worse.`,"bad")}}}
function die(cause){const pl=S.player;if(pl.alive===false)return;pl.alive=false;pl.hp=0;cancelWalk();cancelTask();
  const how=cause||(pl.bitten&&(S.t-pl.bitten)/60>30?"the bite":pl.water<=0?"thirst":pl.food<=0?"hunger":pl.warmth<=0?"the cold":pl.bleeding?"blood loss":pl.sick?"fever":"your wounds");pl.cause=how;
  for(const p of living())if(p.met&&feel(p)>30){p.mood-=feel(p)>60?25:8;mem(p,`${pl.name} is gone.`,-8,"you")}
  if(how==="the bite")spawnZed(pl.x,pl.z,{name:pl.name,pid:"you"});else addCorpse(pl,"you");
  news(how==="the bite"?`${pl.name} turned.`:`${pl.name} died. ${how==="the dead"?"The dead got to them.":""}`,"big");journal(how==="the bite"?"The fever takes you, and then nothing does.":"Everything goes quiet.","bad");
  UI.modal={type:"dead"};UI.talkTo=null;UI.panel=null;save();render()}
function nearCheck(){const pl=S.player;const r=here();const inB=bldAt(pl.x,pl.z);
  const label=inB?inB.n+(roomAt(pl.x,pl.z)?" · "+(ROOMNAME[inB.rooms[roomAt(pl.x,pl.z).ri].t]||""):""):PLACES[r].n;
  if(label!==W3.areaLbl){const first=W3.areaLbl==null;const wasIn=W3.lastB;W3.areaLbl=label;W3.lastB=inB;if(inB!==wasIn||first||r!==W3.region){W3.areaEl.textContent=inB?inB.n:PLACES[r].n;W3.areaT=first?2.5:2.2}
    if(inB&&inB!==wasIn)intrusion(inB);markHud()}
  if(r!==W3.region){const first=W3.region===null;W3.region=r;const o=PLACES[r].site?ownerOf(r):null;if(o&&!first&&o.id!==pl.group)toast(`This is ${o.name} territory. ${o.pol.stance==="hostile"?"They don't look friendly.":"People look up when you walk in."}`)}
  W3.nearB=BUILDINGS.filter(b=>Math.abs(b.x-W3.camX)<26&&Math.abs(b.z-W3.camZ)<26&&b!==inB).slice(0,14)}

// ---------- the loop ----------
function every(ts,k,ms,fn){if(ts-(W3.tk[k]||0)>=ms){W3.tk[k]=ts;fn()}}
function worldPaused(){const pl=S.player;return pl.alive===false||!!UI.modal||UI.paused||document.hidden||!!UI.talkTo||(UI.panel&&UI.panel!=="inv"&&UI.panel!=="craft")}
function frame(ts){requestAnimationFrame(frame);if(!S||UI.create||!W3.ok)return;
  const dt=Math.min(.1,(ts-(W3.last||ts))/1000);W3.last=ts;const pl=S.player;const paused=worldPaused();W3.pausedNow=paused;
  if(!paused){W3.acc+=dt*UI.speed;if(W3.acc>=1){const m=Math.floor(W3.acc);W3.acc-=m;const h0=Math.floor(S.t/60);advance(m);if(Math.floor(S.t/60)!==h0&&S.player.alive!==false)markUI()}
    if(S.player.alive!==false&&!UI.modal){playerMove(dt);moveNPCs(dt);moveZeds(dt);companions(dt);taskTick(dt);chatter(dt);if(typeof invTick==="function")invTick(dt)}
    if(W3.cd>0)W3.cd-=dt}
  every(ts,"sync",300,syncFigs);every(ts,"site",1500,()=>{syncSites();syncPiles();dropDead()});every(ts,"light",1000,lighting);every(ts,"fade",200,()=>{fadeTrees();updateCutaway();autoDoors()});
  every(ts,"prompt",120,updPrompt);every(ts,"mini",400,()=>{if(W3.mini)drawMap(W3.mini)});every(ts,"hud",500,()=>{if(typeof hud==="function")hud()});every(ts,"near",500,nearCheck);every(ts,"save",20000,()=>{if(!paused)save()});
  if(typeof uiTick==="function")uiTick(ts,dt);
  animCutaway(dt);animDoors(dt);drawFigs(dt,ts);animFx(dt,ts);camera(dt);W3.ren.render(W3.scene,W3.cam);labels()}

// ---------- setting up the view ----------
function initWorldView(host){if(W3.wrap)return true;W3.wrap=document.createElement("div");W3.wrap.className="w3";
  W3.wrap.innerHTML=`<div class="w3labels"></div><div class="w3hurt"></div><div class="w3area"></div><div class="w3prompt" hidden></div>`;host.appendChild(W3.wrap);
  W3.lblBox=W3.wrap.querySelector(".w3labels");W3.promptEl=W3.wrap.querySelector(".w3prompt");W3.hurtEl=W3.wrap.querySelector(".w3hurt");W3.areaEl=W3.wrap.querySelector(".w3area");
  W3.hoverEl=mkLabel("","hover");W3.hoverEl.hidden=true;W3.promptEl.classList.add("w3label");
  T3=window.THREE||null;if(!T3){W3.wrap.insertAdjacentHTML("beforeend",`<div class="w3fail">The 3D view couldn't load. Check your connection and reload the page.</div>`);return false}
  try{W3.ren=new T3.WebGLRenderer({antialias:true,powerPreference:"high-performance"})}catch(e){W3.ren=null}
  if(!W3.ren){W3.wrap.insertAdjacentHTML("beforeend",`<div class="w3fail">This device can't draw the 3D view.</div>`);return false}
  const R_=W3.ren;R_.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));R_.outputEncoding=T3.sRGBEncoding;R_.toneMapping=T3.ACESFilmicToneMapping;R_.toneMappingExposure=1.1;R_.shadowMap.enabled=true;R_.shadowMap.type=T3.PCFSoftShadowMap;
  W3.wrap.prepend(R_.domElement);
  W3.cam=new T3.OrthographicCamera(-10,10,10,-10,1,500);W3.rc=new T3.Raycaster();W3.plane=new T3.Plane(new T3.Vector3(0,1,0),0);W3.v3=new T3.Vector3();W3.sunDir=new T3.Vector3(.3,1,.4).normalize();
  const fit=()=>{const r=W3.wrap.getBoundingClientRect();if(r.width<2)return;W3.rw=r.width;W3.rh=r.height;R_.setSize(r.width,r.height,false)};new ResizeObserver(fit).observe(W3.wrap);fit();
  const sc=new T3.Scene();W3.scene=sc;
  W3.hemi=new T3.HemisphereLight("#dfe8f0","#3a3628",.5);sc.add(W3.hemi);
  const sun=new T3.DirectionalLight("#fff3dd",1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);const sc_=sun.shadow.camera;sc_.left=-34;sc_.right=34;sc_.top=34;sc_.bottom=-34;sc_.near=1;sc_.far=160;sun.shadow.bias=-.0006;sun.shadow.normalBias=.02;
  sc.add(sun);sc.add(sun.target);W3.sun=sun;
  W3.plight=new T3.PointLight("#ffe2b0",0,7,1.6);sc.add(W3.plight);
  const sp=new T3.SpotLight("#fff2d0",0,26,.62,.45,1.2);sp.castShadow=true;sp.shadow.mapSize.set(512,512);sp.shadow.bias=-.001;sc.add(sp);sc.add(sp.target);W3.spot=sp;
  W3.room=new T3.PointLight("#ffd9a0",0,8,1.4);sc.add(W3.room);
  W3.fireLight=new T3.PointLight("#ff9a4a",0,18,1.5);sc.add(W3.fireLight);
  makeTextures();makeMats();buildGround(sc);buildGrass(sc);buildTrees(sc);buildDecor(sc);
  const RB=srng(3);for(const b of BUILDINGS){const o=buildBuilding(b,RB);sc.add(o.g);o.g.updateMatrixWorld(true);W3.bm.set(b.id,o)}
  initFigs(sc);
  const ring=new T3.RingGeometry(.32,.46,24);W3.mark=new T3.Mesh(ring,new T3.MeshBasicMaterial({color:"#e48a3f",side:T3.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));W3.mark.rotation.x=-Math.PI/2;W3.mark.visible=false;W3.mark.renderOrder=2;sc.add(W3.mark);
  W3.hl=new T3.LineSegments(new T3.EdgesGeometry(new T3.BoxGeometry(1,1,1)),MAT.hl);W3.hl.visible=false;W3.hl.renderOrder=3;sc.add(W3.hl);
  const cv=R_.domElement;
  cv.addEventListener("pointerdown",e=>{W3.pd={x:e.clientX,y:e.clientY,b:e.button}});
  cv.addEventListener("pointerup",e=>{if(!W3.pd)return;const m=Math.hypot(e.clientX-W3.pd.x,e.clientY-W3.pd.y);const b=W3.pd.b;W3.pd=null;if(m<10&&b===0)onClick(e)});
  cv.addEventListener("pointermove",onHover);cv.addEventListener("pointerleave",()=>{W3.hoverKey="";W3.hover=null;W3.hoverEl.hidden=true;setHighlight(null)});
  cv.addEventListener("contextmenu",e=>e.preventDefault());
  cv.addEventListener("wheel",e=>{e.preventDefault();W3.zoom=clamp(W3.zoom*(e.deltaY>0?.9:1.1),.55,2.6)},{passive:false});
  W3.ok=true;return true}
// everything that depends on one particular world (a new game, or a loaded save)
function w3reset(){if(!W3.ok)return;doorsIn();FIGMAP.clear();FIG.corpses=[];W3.zst=new Map();W3.fst=new Map();W3.autoDoors=new Set();W3.bq=[];
  for(const B of W3.bubbles.values())B.el.remove();W3.bubbles=new Map();
  for(const k in W3.siteObj)W3.scene.remove(W3.siteObj[k]);W3.siteObj={};W3.siteKeys={};W3.siteFlames={};if(W3.campfire){W3.scene.remove(W3.campfire.g);W3.campfire=null}
  for(const o of W3.pileObjs.values())W3.scene.remove(o);W3.pileObjs.clear();
  for(const el of W3.blabels.values())el.remove();W3.blabels.clear();cancelWalk();W3.task=null;W3.region=null;W3.areaLbl=null;W3.promptKey="";W3.wx=null;W3.acc=0;
  for(const o of W3.bm.values()){o.cut=0;o.target=0;o.settled=false}
  snapCamera();syncSites();syncPiles();syncFigs();lighting();updateCutaway()}
Object.assign(W3,{zst:new Map(),fst:new Map(),autoDoors:new Set(),bq:[],bubbles:new Map(),flOn:true});

// ---------- keys ----------
addEventListener("keydown",e=>{if(!S||UI.create)return;if(typeof typing==="function"&&typing())return;const k=e.key.toLowerCase();
  if(UI.modal){if(k==="escape"&&typeof closeModal==="function")closeModal();return}
  if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){if(UI.talkTo)closeTalk();W3.keys[k]=true;if(k.startsWith("arrow"))e.preventDefault();return}
  if(k==="shift"){W3.run=true;return}
  if(k===" "){if(e.target.tagName==="BUTTON")return;e.preventDefault();if(S.player.alive!==false&&!UI.talkTo)attackNearest();return}
  if(k==="e"){if(!UI.talkTo)interact();return}
  if(k==="b"){const t=W3.promptT;if(t&&t.k==="door")boardDoor(t.D);return}
  if(k==="f"){if(!hasLight()){toast("You don't have a flashlight.");return}W3.flOn=!W3.flOn;lighting();toast(W3.flOn?"Flashlight on.":"Flashlight off.");return}
  if(k==="escape"){if(typeof onEscape==="function"&&onEscape())return;cancelWalk();cancelTask();return}
  if(k==="p"){UI.paused=!UI.paused;markHud();return}
  if(typeof onUiKey==="function")onUiKey(k,e)});
addEventListener("keyup",e=>{const k=e.key.toLowerCase();W3.keys[k]=false;if(k==="shift")W3.run=false});
addEventListener("blur",()=>{W3.keys={};W3.run=false});
