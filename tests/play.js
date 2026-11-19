// Play the first minutes headlessly and save screenshots: creation, home, searching, inventory, talking, panels, night, the dead.
// node tests/play.js   (screenshots land in tests/shots/)
const open=require('./page.js');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const shot=(pg,n)=>pg.screenshot({path:path.join(OUT,n+'.png')});
(async()=>{const {b,pg,errs}=await open({viewport:{width:1280,height:760}});
  await shot(pg,'01_create');
  await pg.fill('[data-c=first]','Dana');await pg.fill('[data-c=last]','Reyes');
  await pg.click('[data-v="traits|Tough"]');await pg.click('[data-v="traits|Handy"]');await pg.click('[data-v="household|sibling"]');
  await pg.click('[data-act=begin]');await pg.waitForTimeout(300);await shot(pg,'02_help');
  await pg.click('[data-act=closemodal]');await pg.waitForTimeout(1200);await shot(pg,'03_home');
  // search the wardrobe
  await pg.evaluate(()=>{const pl=S.player;const c=Object.values(CONTS).find(c=>c.b===pl.home&&c.k==="closet");pl.x=c.ux;pl.z=c.uz;tryOpenCont(c.id);UI.open.t=0});
  await pg.evaluate(()=>{for(let i=0;i<60;i++)invTick(.1)});await pg.waitForTimeout(400);await shot(pg,'04_search');
  const it=await pg.$('#panel .grid[data-ref=open] .it:not(.unk)');
  if(it){const bb=await it.boundingBox();const tg=await pg.$('#panel .grid[data-ref^="eq:"]');const tb=await tg.boundingBox();
    await pg.mouse.move(bb.x+10,bb.y+10);await pg.mouse.down();await pg.mouse.move(bb.x+40,bb.y+30,{steps:3});await pg.mouse.move(tb.x+12,tb.y+12,{steps:6});await shot(pg,'05_drag');await pg.mouse.up();await pg.waitForTimeout(200);
    // shift-click moves it across to wherever it fits on you (or wears it)
    const left=await pg.$('#panel .grid[data-ref=open] .it:not(.unk)');if(left){const lb=await left.boundingBox();await pg.keyboard.down('Shift');await pg.mouse.click(lb.x+10,lb.y+10);await pg.keyboard.up('Shift');await pg.waitForTimeout(300)}
    console.log('carried:',await pg.evaluate(()=>allCarried().map(x=>x.g.id).join(', ')))}
  await shot(pg,'06_inventory');await pg.keyboard.press('Escape');
  // talk to whoever is nearest
  await pg.evaluate(()=>{const pl=S.player;const p=S.people.filter(p=>p.alive).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z))[0];openTalk(p.id)});
  await pg.fill('#talkbox','Did you hear the radio this morning?');await pg.press('#talkbox','Enter');await pg.waitForTimeout(500);await shot(pg,'07_talk');
  await pg.click('[data-act=endtalk]');
  for(const k of ['people','journal','map','craft','group']){await pg.evaluate(k=>openPanel(k),k);await pg.waitForTimeout(300);await shot(pg,'08_'+k)}
  await pg.evaluate(()=>closePanel());
  await pg.evaluate(()=>{S.wx={};S.t=23*60;invAdd("flashlight",1,true);lighting();markUI()});await pg.waitForTimeout(600);await shot(pg,'09_night');
  // the dead on the street
  await pg.evaluate(()=>{const pl=S.player;const bd=BMAP[pl.home];const d=bd.exits[0];const p=d.p[d.outSide];pl.x=p.x;pl.z=p.z+2;S.flags.clinic=S.flags.alarm=true;S.t=24*60+15*60;for(let i=0;i<5;i++)spawnZed(pl.x+6+i*1.5,pl.z-4+i);snapCamera();lighting();syncFigs()});
  await pg.waitForTimeout(1500);await shot(pg,'10_dead');
  console.log(errs.join('\n')||'NO ERRORS');await b.close();if(errs.length)process.exitCode=1})();
