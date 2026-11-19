// The coma start in a real browser: the picker, the week going by, the note, the room, your things, the door and the one in the waiting room.
// node tests/coma_ui.js   (screenshots land in tests/shots/)
const open=require('./page.js');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const shot=(pg,n)=>pg.screenshot({path:path.join(OUT,n+'.png')});
(async()=>{const {b,pg,errs}=await open({viewport:{width:1280,height:800},dpr:+(process.env.DPR||1),oldSave:'{"v":3}'});
  console.log('old save notice:',await pg.evaluate(()=>!!UI.oldSave));
  await pg.fill('[data-c=first]','Dana');await pg.fill('[data-c=last]','Reyes');await pg.click('[data-v="traits|Tough"]');await pg.click('[data-v="traits|Kind"]');await pg.click('[data-v="household|partner"]');
  await pg.evaluate(()=>{document.querySelector('[data-v="start|coma"]').scrollIntoView({block:"center"})});await pg.waitForTimeout(200);await shot(pg,'30_create_coma');
  await pg.click('[data-act=begin]');await pg.waitForTimeout(1600);await shot(pg,'31_sleep');
  console.log('sleep screen:',await pg.evaluate(()=>UI.loading?`day ${UI.loading.day}, shown ${UI.loading.p.toFixed(2)}, sim ${UI.loading.sim.toFixed(2)}`:'gone'));
  if(await pg.evaluate(()=>!!UI.loading&&!UI.loading.finishing)){await pg.click('[data-act=sleepskip]',{timeout:20000,force:true}).catch(e=>console.log('skip click failed:',e.message.split('\n')[0]));console.log('skipped')}
  for(let i=0;i<100;i++){if(await pg.evaluate(()=>UI.modal&&UI.modal.type==="wake"))break;await pg.waitForTimeout(100)}
  await pg.waitForTimeout(600);await shot(pg,'33_wake');
  console.log('woke at',await pg.evaluate(()=>stamp(S.t)+", in "+BMAP.clinic.rooms[roomAt(S.player.x,S.player.z).ri].t));
  await pg.click('[data-act=wakeup]');await pg.waitForTimeout(300);console.log('then:',await pg.evaluate(()=>UI.modal&&UI.modal.type));
  await pg.click('[data-act=closemodal]');await pg.waitForTimeout(2500);await shot(pg,'34_room');
  // the 3D view is slow in a software renderer; freeze it so the clicks below land on time
  await pg.evaluate(()=>{W3._render=W3.ren.render;W3.ren.render=()=>{}});
  await pg.keyboard.press('h');await pg.waitForTimeout(400);await shot(pg,'35_body');await pg.keyboard.press('Escape');
  // your things
  await pg.evaluate(()=>{const pl=S.player;const p=S.piles.find(p=>p.n==="Your things");pl.x=p.x+.3;pl.z=p.z;openCont(p.id)});await pg.waitForTimeout(500);await shot(pg,'36_things');
  console.log('pile title:',await pg.evaluate(()=>document.querySelector('#panel .ohead b')?.textContent));
  await pg.evaluate(()=>{const p=S.piles.find(p=>p.n==="Your things");const pl=S.player;for(const g of [...p.c.items]){const it=ITEMS[g.id];if(it.slot&&!pl.eq[it.slot]&&it.slot!=="weapon"||g.id==="iv_pole"){cRemove(p.c,g);if(pl.eq[it.slot]&&g.id!=="iv_pole"){pStore(g)}else{if(it.slot==="body"&&pl.eq.body){pStore(pl.eq.body);}pl.eq[it.slot]=g}}}markUI()});
  console.log('wearing:',await pg.evaluate(()=>Object.entries(S.player.eq).filter(([k,v])=>v).map(([k,v])=>k+":"+v.id).join(", ")));
  await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
  // the door, then the one in the waiting room
  const door=await pg.evaluate(()=>{const b=BMAP.clinic;const ri=b.rooms.findIndex(r=>r.t==="patient");const D=b.doors.find(d=>!d.ext&&d.dw.r.includes(ri));const pl=S.player;const ins=D.dw.p[D.dw.r[0]===ri?0:1];pl.x=ins.x;pl.z=ins.z;useDoor(D);return{open:D.open,lock:doorLocked(D)}});
  console.log('door after E:',JSON.stringify(door));
  const z=await pg.evaluate(()=>{const z=S.zeds.find(z=>z.weak);return z?{hp:z.hp,d:dist(z.x,z.z,S.player.x,S.player.z).toFixed(1)}:null});console.log('the one in the waiting room:',JSON.stringify(z));
  // un-freeze for a last look
  await pg.evaluate(()=>{W3.ren.render=W3._render});await pg.waitForTimeout(2500);await shot(pg,'37_door');
  console.log('people screen:',await pg.evaluate(()=>{openPanel("people");return [...document.querySelectorAll('#plist tbody tr')].slice(0,4).map(r=>r.innerText.replace(/\s+/g," ")).join(" | ")}));await pg.waitForTimeout(300);await shot(pg,'38_people');
  console.log('journal news:',await pg.evaluate(()=>{openPanel("journal");return document.querySelectorAll('#panel .journal')[1]?.innerText.slice(0,120)}));
  console.log(errs.join('\n')||'NO ERRORS');await b.close();if(errs.length)process.exitCode=1})();
