// Living inside: the clock runs a minute a second, busy places hold more of the dead than quiet ones, "move in" puts
// everyone inside the farmhouse with a woodstove (no campfire), people sleep in the beds, walls only let you in at
// the door, and nothing burns unless you say so plainly and say yes. Screenshots go to $SHOTS.
const open=require("./page.js");
const OUT=process.env.SHOTS||"/tmp/claude-0/shots";
const fails=[];const check=(ok,what)=>{console.log((ok?"ok   ":"FAIL ")+what);if(!ok)fails.push(what)};
const type=async(pg,s)=>{await pg.fill("#cmd",s);await pg.press("#cmd","Enter");await pg.waitForTimeout(250)};
(async()=>{const {b,pg,errs}=await open();
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(400);await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(400);
  // the clock: one real second is one game minute at 1×
  const c=await pg.evaluate(async()=>{UI.speed=1;UI.paused=false;const t0=S.t,r0=performance.now();await new Promise(r=>setTimeout(r,3000));return{dm:S.t-t0,ds:(performance.now()-r0)/1000,clock:CLOCK}});
  check(c.clock===1&&c.dm>c.ds*.4&&c.dm<c.ds*1.25,`a second is a minute: ${c.dm.toFixed(2)} game minutes in ${c.ds.toFixed(2)}s`);
  // the dead: busy places are full, quiet ones aren't, and activity draws more
  let st=await pg.evaluate(()=>{const o={};for(const k of ["school","grocery","police","church","farm","mill"])o[k]=deadHere(k);return o});
  check(st.school>st.farm+3&&st.grocery>st.mill+2,`busy places hold more of the dead: ${JSON.stringify(st)}`);
  st=await pg.evaluate(()=>{const a=deadHere("mill");for(let i=0;i<12;i++)noiseAt("mill",0,0,24);const b=deadHere("mill");return{a,b}});
  check(st.b>st.a,`noise at the mill draws more: ${st.a} then ${st.b}`);
  // to the farm; clear the dead out so nothing interrupts
  await pg.evaluate(()=>{arriveAt("farm",true);S.walkers=S.walkers.filter(w=>w.loc!=="farm");renderAll()});await pg.waitForTimeout(500);
  // typing "make a fire" before there's a camp doesn't build or burn anything
  st=await pg.evaluate(()=>({b:S.blds.length,burned:!!place("farm").burned}));await type(pg,"make a fire");
  check(await pg.evaluate(o=>S.blds.length===o.b&&!place("farm").burned&&!UI.place,st),"'make a fire' doesn't build a campfire or burn the place");
  // "let's move in": camp here, with a woodstove inside and no campfire outside
  await type(pg,"let's move in");
  st=await pg.evaluate(()=>{const f=S.blds.filter(b=>b.type==="fire");const lay=layout("farm");return{camp:S.camp&&S.camp.site,fires:f.map(b=>({n:b.name,indoor:!!b.opt.indoor,inside:!!bldAt("farm",b.x,b.z)})),beds:lay.beds.length}});
  check(st.camp==="farm"&&st.fires.length===1&&st.fires[0].indoor&&st.fires[0].inside&&st.fires[0].n==="Woodstove",`'move in' makes camp inside with a woodstove: ${JSON.stringify(st)}`);
  // everyone walks in through the door
  await pg.evaluate(()=>{for(let i=0;i<40;i++)step(.5)});
  st=await pg.evaluate(()=>{const m=members().filter(p=>p.loc==="farm");return{n:m.length,inside:m.filter(p=>bldAt("farm",p.x,p.z)).length,acts:m.map(p=>p.act)}});
  check(st.n>0&&st.inside===st.n,`everyone is inside: ${st.inside} of ${st.n} (${st.acts.join(", ")})`);
  // walls: from outside the back wall, the way in goes around to the door
  st=await pg.evaluate(()=>{const r=layout("farm").b[0];const p=findPath("farm",r.x,r.z-r.d/2-2,r.x,r.z);const door=p.some(([x,z])=>Math.abs(z-(r.z+r.d/2))<1.6&&Math.abs(x-r.x)<1.6);
    return{door,len:p.length,blockedWall:blockedAt("farm",r.x-r.w/2,r.z),openDoor:!blockedAt("farm",r.x,r.z+r.d/2-.1)}});
  check(st.door&&st.blockedWall&&st.openDoor,`walls are solid and the way in is the door: ${JSON.stringify(st)}`);
  // "go inside" from the yard
  await pg.evaluate(()=>{S.player.x=12;S.player.z=20;S.player.tx=null;S.player.path=null});await type(pg,"go inside");
  await pg.evaluate(()=>{for(let i=0;i<40;i++)step(.5)});
  check(await pg.evaluate(()=>!!bldAt("farm",S.player.x,S.player.z)),"'go inside' walks you in through the door");
  await pg.screenshot({path:OUT+"/h01_inside_day.png"});
  // lighting the stove warms people up and builds nothing
  st=await pg.evaluate(()=>({b:S.blds.length,mood:members().reduce((a,p)=>a+p.mood,0)}));await type(pg,"light the stove");await pg.evaluate(()=>{for(let i=0;i<30;i++)step(.5)});
  st=await pg.evaluate(o=>({same:S.blds.length===o.b,warmer:members().reduce((a,p)=>a+p.mood,0)>=o.mood,log:S.log.slice(-3).map(l=>l.x).join(" | "),place:!!UI.place}),st);
  check(st.same&&!st.place&&/woodstove/i.test(st.log),`'light the stove' is just warmth: ${st.log}`);
  // "make the house our home" doesn't start building a cabin
  await type(pg,"make the house our home");
  check(await pg.evaluate(()=>!UI.place),"'make the house our home' doesn't start a build");
  // night: people sleep in the beds
  await pg.evaluate(()=>{const d=Math.floor(S.t/DAY);S.t=d*DAY+21*HOUR+50;step(10);for(let i=0;i<60;i++)step(1);renderAll()});
  st=await pg.evaluate(()=>{const m=members().filter(p=>p.loc==="farm");return{n:m.length,sleep:m.filter(p=>p.sleep).length,bed:m.filter(p=>p.inBed).length,beds:layout("farm").beds.length,inside:m.filter(p=>bldAt("farm",p.x,p.z)).length}});
  check(st.sleep===st.n&&st.bed===Math.min(st.n,st.beds)&&st.inside===st.n,`asleep in the beds at night: ${JSON.stringify(st)}`);
  await pg.waitForTimeout(600);await pg.screenshot({path:OUT+"/h02_night_beds.png"});
  // V: roofs back on, then off
  await pg.evaluate(()=>{document.activeElement?.blur()});await pg.keyboard.press("v");await pg.waitForTimeout(400);
  check(await pg.evaluate(()=>W.xray===false&&W.bm.some(m=>m.top.visible)),"V puts the roofs back on");await pg.screenshot({path:OUT+"/h03_roofs_on.png"});
  await pg.keyboard.press("v");await pg.waitForTimeout(300);check(await pg.evaluate(()=>W.xray===true&&W.bm.every(m=>!m.top.visible)),"V takes them off again");
  // somewhere else: "burn it down" asks first, and "never mind" means nothing burns
  await pg.evaluate(()=>{const d=Math.floor(S.t/DAY);S.t=(d+1)*DAY+9*HOUR;arriveAt("grocery",true);S.walkers=S.walkers.filter(w=>w.loc!=="grocery");renderAll()});await pg.waitForTimeout(400);
  await type(pg,"burn some wood");check(await pg.evaluate(()=>!place("grocery").burned&&!UI.modal),"'burn some wood' doesn't touch the building");
  await type(pg,"burn it down");
  st=await pg.evaluate(()=>({modal:!!UI.modal,txt:document.getElementById("modal")?.textContent||"",burned:!!place("grocery").burned}));
  check(st.modal&&/Burn it down/.test(st.txt)&&!st.burned,`'burn it down' asks first: ${st.txt.slice(0,60)}`);
  await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(200);check(await pg.evaluate(()=>!place("grocery").burned),"saying no leaves it standing");
  // the bodies of the dead can be burned without burning the place
  await pg.evaluate(()=>{const w=spawnWalker("grocery",3,14);putDown(w);const w2=spawnWalker("grocery",4,15);putDown(w2)});
  await type(pg,"burn the bodies");
  check(await pg.evaluate(()=>!place("grocery").burned&&!S.walkers.some(w=>w.loc==="grocery"&&w.dead)),"'burn the bodies' burns the bodies, not the store");
  // inside the store: aisles, a counter, cupboards
  await pg.evaluate(()=>{const r=layout("grocery").b[0];S.player.x=r.x;S.player.z=r.z+r.d/2-1.5;S.player.tx=null;S.player.path=null;W.tgt.x=r.x;W.tgt.z=r.z;W.free=true});await pg.waitForTimeout(700);
  await pg.screenshot({path:OUT+"/h04_store.png"});
  for(const [k,n] of [["church","h05_church"],["school","h06_school"],["motel","h07_motel"]]){
    await pg.evaluate(k=>{arriveAt(k,true);S.walkers=S.walkers.filter(w=>w.loc!==k);const r=layout(k).b[0];S.player.x=r.x;S.player.z=r.z+r.d/2-1.5;S.player.tx=null;S.player.path=null;renderAll();W.tgt.x=r.x;W.tgt.z=r.z;W.free=true},k);
    await pg.waitForTimeout(800);await pg.screenshot({path:OUT+`/${n}.png`})}
  // a crowd at the school, a handful at the farm
  st=await pg.evaluate(()=>{topUpWalkers("school");const s=walkersAt("school").length;S.walkers=S.walkers.filter(w=>w.loc!=="mill");topUpWalkers("mill");return{school:s,mill:walkersAt("mill").length}});
  check(st.school>st.mill,`more of the dead at the school than the mill: ${JSON.stringify(st)}`);
  console.log("ERRORS:",errs.length?errs.slice(0,10).join("\n"):"none");console.log(fails.length?`${fails.length} FAILED`:"HOME_OK");await b.close();process.exit(fails.length||errs.length?1:0)})();
