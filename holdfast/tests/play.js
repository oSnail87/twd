// Plays the built page in headless Chromium: start, talk, search, travel, make camp, build a tent by hand, craft, and let days pass.
const open=require("./page.js");
const OUT=process.env.SHOTS||"/tmp/claude-0/shots";
(async()=>{const {b,pg,errs}=await open();
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(500);await pg.screenshot({path:OUT+"/01_intro.png"});
  await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(800);
  await pg.fill("#cmd","I say hi");await pg.press("#cmd","Enter");await pg.waitForTimeout(2500);await pg.screenshot({path:OUT+"/02_hi.png"});
  await pg.fill("#cmd","search the car");await pg.press("#cmd","Enter");await pg.waitForFunction(()=>UI.side==="loot",null,{timeout:20000}).catch(()=>{});await pg.waitForTimeout(300);await pg.screenshot({path:OUT+"/03_loot.png"});
  const take=await pg.$('[data-act="takeall"]');if(take)await take.click();await pg.waitForTimeout(300);
  await pg.keyboard.press("Escape");await pg.keyboard.press("m");await pg.waitForTimeout(400);await pg.click('[data-act="mapsel"][data-k="farm"]');await pg.waitForTimeout(300);await pg.screenshot({path:OUT+"/04_map.png"});
  await pg.click('[data-act="travel"]');await pg.waitForTimeout(500);console.log(await pg.evaluate(()=>JSON.stringify({loc:S.player.loc,tr:S.flags.traveling,modal:UI.modal,log:S.log.slice(-3).map(l=>l.x)})),errs);await pg.waitForFunction(()=>S.player.loc==="farm",null,{timeout:30000});await pg.waitForTimeout(1500);await pg.screenshot({path:OUT+"/05_farm.png"});
  await pg.click('[data-tool="makecamp"]');await pg.waitForTimeout(600);
  await pg.evaluate(()=>{S.res.wood+=20;S.res.scrap+=6;syncInv();renderAll()});
  await pg.fill("#cmd","build a tent");await pg.press("#cmd","Enter");await pg.waitForTimeout(400);
  const spot=await pg.evaluate(()=>{const s=toScreen(6,0,10);return s});await pg.mouse.move(spot.x,spot.y);await pg.waitForTimeout(200);await pg.screenshot({path:OUT+"/06_place.png"});
  await pg.mouse.click(spot.x,spot.y);await pg.waitForTimeout(400);await pg.screenshot({path:OUT+"/07_tentopts.png"});
  await pg.click('[data-act="bopt"][data-k="cover"]:nth-child(3)');await pg.click('[data-act="bself"]');await pg.waitForSelector("#build.open",{timeout:15000});await pg.waitForTimeout(300);
  for(let i=0;i<4;i++){const s=await pg.$('[data-act="mgstake"]');if(s)await s.click({force:true});await pg.waitForTimeout(120)}
  await pg.screenshot({path:OUT+"/08_mg_hold.png"});
  const hb=await pg.$("#mghold");const box=await hb.boundingBox();await pg.mouse.move(box.x+20,box.y+10);await pg.mouse.down();await pg.waitForTimeout(1080);await pg.mouse.up();await pg.waitForTimeout(300);
  let txt=await pg.textContent("#bstep");console.log("after hold:",txt);
  if(/Raise/.test(txt)){await pg.mouse.move(box.x+20,box.y+10);await pg.mouse.down();await pg.waitForTimeout(1100);await pg.mouse.up();await pg.waitForTimeout(300)}
  const pc=await pg.$("#mgpiece rect");if(pc){const r=await pc.boundingBox();const sv=await (await pg.$("#bsvg")).boundingBox();await pg.mouse.move(r.x+r.width/2,r.y+r.height/2);await pg.mouse.down();await pg.mouse.move(sv.x+sv.width/2,sv.y+sv.height/2,{steps:8});await pg.mouse.up();await pg.waitForTimeout(400)}
  await pg.screenshot({path:OUT+"/09_mg_done.png"});const ok=await pg.$('[data-act="mgok"]');if(ok)await ok.click();await pg.waitForTimeout(800);
  // a person's menu
  const who=await pg.evaluate(()=>{const p=members().find(p=>!p.kid);const f=W.figs[p.id];const s=toScreen(f.position.x,1.1,f.position.z);return{x:s.x,y:s.y,name:p.name}});
  await pg.mouse.click(who.x,who.y);await pg.waitForTimeout(400);await pg.screenshot({path:OUT+"/10_menu.png"});
  const jb=await pg.$('[data-act="jobs"]');if(jb){await jb.click();await pg.waitForTimeout(200);await pg.click('[data-act="job"][data-job="farm"]');await pg.waitForTimeout(3000)}
  await pg.screenshot({path:OUT+"/11_job.png"});
  await pg.keyboard.press("Escape");await pg.keyboard.press("i");await pg.waitForTimeout(300);await pg.fill("#craftin","tie the rope into a fishing net");await pg.click('[data-act="craftgo"]');await pg.waitForTimeout(600);await pg.screenshot({path:OUT+"/12_stores.png"});
  await pg.keyboard.press("Escape");
  // let time run
  await pg.click('[data-sp="60"]');for(let i=0;i<40;i++){await pg.waitForTimeout(500);if(await pg.$("#modal.open"))break}await pg.screenshot({path:OUT+"/13_later.png"});
  const card=await pg.$('#modal.open [data-act="cardopt"]');if(card){await card.click();await pg.waitForTimeout(400);await pg.screenshot({path:OUT+"/14_card.png"})}
  await pg.evaluate(()=>{S.t=S.t-(S.t%DAY)+DAY+22*60;});await pg.waitForTimeout(1500);await pg.screenshot({path:OUT+"/15_night.png"});
  const st=await pg.evaluate(()=>({day:dayOf(S.t),loc:S.player.loc,camp:!!S.camp,members:members().length,blds:S.blds.map(b=>b.type+(b.done?"":"*")),crafted:S.crafted.map(c=>c.n),log:S.log.slice(-8).map(l=>l.x)}));
  console.log(JSON.stringify(st,null,1));console.log("ERRORS:",errs.length?errs.slice(0,10).join("\n"):"none");await b.close()})();
