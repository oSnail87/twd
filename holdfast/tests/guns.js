// Guns: find the pistol in the trooper's cruiser, shoot the dead by clicking and by typing, never the living,
// hand spare guns to guards, and swap guns in the stores. Screenshots go to $SHOTS.
const open=require("./page.js");
const OUT=process.env.SHOTS||"/tmp/claude-0/shots";
const fails=[];const check=(ok,what)=>{console.log((ok?"ok   ":"FAIL ")+what);if(!ok)fails.push(what)};
(async()=>{const {b,pg,errs}=await open();
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(400);await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(600);
  // the cruiser
  await pg.fill("#cmd","search the cruiser");await pg.press("#cmd","Enter");
  await pg.waitForFunction(()=>UI.loot&&UI.loot.cid&&layout("start").conts.find(c=>c.id===UI.loot.cid).k==="cruiser",null,{timeout:20000});
  await pg.screenshot({path:OUT+"/g01_cruiser.png"});
  await pg.click('[data-act="takeall"]');await pg.waitForTimeout(300);
  let st=await pg.evaluate(()=>({gun:S.player.gun,rounds:S.player.rounds,log:S.log.slice(-2).map(l=>l.x)}));
  check(st.gun==="pistol"&&st.rounds>0,`picked up the pistol: ${JSON.stringify(st)}`);
  await pg.keyboard.press("Escape");
  // click one of the dead to shoot it
  const before=st.rounds;
  const w=await pg.evaluate(()=>{const pl=S.player;S.walkers=S.walkers.filter(w=>w.loc!=="start");const w=spawnWalker("start",pl.x+6,pl.z-3);w.cool=999;return w.id});
  await pg.waitForTimeout(300);
  let shots=0;for(let i=0;i<8;i++){const pos=await pg.evaluate(id=>{const w=S.walkers.find(w=>w.id===id);if(!w||w.dead)return null;const f=W.figs[id];const s=toScreen(f.position.x,1.1,f.position.z);return s},w);if(!pos)break;
    await pg.mouse.click(pos.x,pos.y);shots++;await pg.waitForTimeout(60);if(i===0)await pg.screenshot({path:OUT+"/g02_shot.png"});await pg.waitForTimeout(500)}
  st=await pg.evaluate(id=>({dead:S.walkers.find(w=>w.id===id)?.dead,rounds:S.player.rounds,aim:!!S.player.aim}),w);
  check(st.dead===true,`the walker went down after ${shots} click(s)`);check(st.rounds<before,`rounds went from ${before} to ${st.rounds}`);
  await pg.waitForTimeout(700);await pg.screenshot({path:OUT+"/g03_down.png"});
  // typed
  const r1=await pg.evaluate(()=>{const pl=S.player;const w=spawnWalker("start",pl.x-5,pl.z+2);w.cool=999;return S.player.rounds});
  await pg.waitForTimeout(700);await pg.fill("#cmd","shoot the walker");await pg.press("#cmd","Enter");await pg.waitForTimeout(400);
  check(await pg.evaluate(r=>S.player.rounds<r,r1),"typing 'shoot the walker' fires");
  // never the living
  const nm=await pg.evaluate(()=>members().find(p=>!p.kid).name);const r2=await pg.evaluate(()=>S.player.rounds);
  await pg.waitForTimeout(1000);await pg.fill("#cmd",`shoot ${nm}`);await pg.press("#cmd","Enter");await pg.waitForTimeout(300);
  const toast=await pg.evaluate(()=>document.getElementById("toast").textContent);
  check(await pg.evaluate(r=>S.player.rounds===r,r2)&&/living/.test(toast),`'shoot ${nm}' is refused: "${toast}"`);
  await pg.fill("#cmd","sit by the fire at night");await pg.press("#cmd","Enter");await pg.waitForTimeout(400);
  check(await pg.evaluate(r=>S.player.rounds===r,r2),"'sit by the fire at night' doesn't fire");
  // a camp, a guard with a spare gun
  await pg.evaluate(()=>{arriveAt("farm",true);campHere();S.items.shotgun=1;S.res.ammo=30;syncInv();const g=members().find(p=>!p.kid);g.job="guard";useHour(7);renderAll()});
  await pg.waitForTimeout(800);
  st=await pg.evaluate(()=>{const g=members().find(p=>p.job==="guard");return{gun:g.gun,gear:W.figs[g.id]?.userData.gear,def:defense()}});
  check(st.gun==="shotgun"&&st.gear==="shotgun",`the guard took the spare shotgun and carries it: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{const g=members().find(p=>p.job==="guard");W.tgt.x=g.x;W.tgt.z=g.z;W.free=true});await pg.waitForTimeout(300);await pg.screenshot({path:OUT+"/g04_guard.png"});
  // the guard shoots one of the dead at the edge of camp
  const a0=await pg.evaluate(()=>S.res.ammo);
  // (everyone else, you included, well out of reach, so the guard is the one who fights)
  await pg.evaluate(()=>{const g=members().find(p=>p.job==="guard");g.x=8;g.z=8;g.tx=null;g.path=null;for(const q of [S.player,...S.people])if(q!==g){q.x=-24;q.z=-24;q.tx=null;q.path=null}
    const w=spawnWalker(campK(),g.x+1,g.z);for(let i=0;i<10&&!w.dead;i++){w.cool=0;clash(g,w)}});
  check(await pg.evaluate(a=>S.res.ammo<a,a0),"the guard used camp ammo in a fight");
  // the stores: leave your gun for the guards, then take the shotgun yourself
  await pg.evaluate(()=>{document.activeElement?.blur();S.player.x=2;S.player.z=6});await pg.keyboard.press("i");await pg.waitForTimeout(300);await pg.screenshot({path:OUT+"/g05_stores.png"});
  await pg.click('[data-act="gunstow"]');await pg.waitForTimeout(200);
  check(await pg.evaluate(()=>!S.player.gun&&S.items.pistol===1),"left the pistol in camp stores");
  await pg.evaluate(()=>{armUp(true)});check(await pg.evaluate(()=>!S.player.gun),"doesn't grab it straight back");
  const u=await pg.evaluate(()=>S.inv.items.find(o=>o.k==="shotgun").u);await pg.click(`[data-g="camp"][data-u="${u}"]`);await pg.waitForTimeout(200);
  await pg.click('[data-act="guncarry"]');await pg.waitForTimeout(200);
  st=await pg.evaluate(()=>({gun:S.player.gun,rounds:S.player.rounds,guard:members().find(p=>p.job==="guard").gun}));
  check(st.gun==="shotgun"&&st.rounds>0&&!st.guard,`took the shotgun from the guard: ${JSON.stringify(st)}`);
  await pg.keyboard.press("Escape");await pg.waitForTimeout(500);await pg.screenshot({path:OUT+"/g06_shotgun.png"});
  // the HUD
  const hud=await pg.evaluate(()=>document.getElementById("res").textContent);check(/Shotgun/.test(hud),`HUD shows the gun: ${hud.slice(-40)}`);
  // a shotgun blast into a group
  await pg.evaluate(()=>{const pl=S.player;for(let i=0;i<3;i++){const w=spawnWalker(campK(),pl.x+4+i*.4,pl.z+(i-1)*.6);w.cool=999}});await pg.waitForTimeout(400);
  await pg.evaluate(()=>shootNearest());await pg.waitForTimeout(100);await pg.screenshot({path:OUT+"/g07_blast.png"});
  console.log("ERRORS:",errs.length?errs.slice(0,10).join("\n"):"none");console.log(fails.length?`${fails.length} FAILED`:"GUNS_OK");await b.close();process.exit(fails.length||errs.length?1:0)})();
