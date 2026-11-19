// The health screen in a real browser: wounds on the body, then each hands-on fix done with the mouse.
// node tests/health.js   (screenshots land in tests/shots/)
const open=require('./page.js');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const shot=(pg,n)=>pg.screenshot({path:path.join(OUT,n+'.png')});
(async()=>{const {b,pg,errs}=await open({viewport:{width:1280,height:800},dpr:+(process.env.DPR||1)});
  await pg.fill('[data-c=first]','Dana');await pg.fill('[data-c=last]','Reyes');await pg.click('[data-v="traits|Tough"]');await pg.click('[data-v="traits|Handy"]');await pg.click('[data-v="start|home"]');
  await pg.click('[data-act=begin]');await pg.waitForTimeout(300);await pg.click('[data-act=closemodal]').catch(()=>{});await pg.waitForTimeout(800);
  // a bad day: hurt in four places, with a bag of supplies
  await pg.evaluate(()=>{const pl=S.player;pl.eq.back=mkInst("hiking_pack");S.zeds=[];
    for(const [id,n] of [["bandage",2],["cloth",3],["rubbing_alcohol",1],["whiskey",1],["suture_kit",1],["splint",1],["painkillers",2],["antibiotics",1]])invAdd(id,n,true);
    addWound("deep","larm",{at:"forearm"});const s=addWound("scratch","rhand");s.dirt=.7;s.inf=34;addWound("bruise","chest");addWound("fracture","rleg",{at:"shin"});addWound("cut","head",{at:"forehead"});
    pl.hp=71;advance(20);markUI()});
  await pg.waitForTimeout(500);await shot(pg,'20_hud_hurt');console.log('hud shot');
  // the 3D view is slow in a software renderer; freeze it so the clicks below land on time
  await pg.evaluate(()=>{W3.ren.render=()=>{}});
  await pg.keyboard.press('h');await pg.waitForTimeout(400);await shot(pg,'21_health');
  // pick the arm on the figure
  const pt=await pg.evaluate(()=>{const svg=document.querySelector('.bsvg');const p=bpt("larm",.75,0);const m=svg.getScreenCTM();return{x:m.a*p.x+m.e,y:m.d*p.y+m.f}});
  await pg.mouse.click(pt.x,pt.y);await pg.waitForTimeout(300);await shot(pg,'22_arm');
  // clean it first: wipe across every speck of dirt
  await pg.click('[data-act=htreat][data-v^="clean|"]');await pg.waitForTimeout(300);await shot(pg,'23_clean');
  const specks=await pg.evaluate(()=>{const svg=document.getElementById('treatpad');const m=svg.getScreenCTM();return UI.treat.specks.map(s=>({x:m.a*s.x+m.e,y:m.d*s.y+m.f}))});
  await pg.mouse.move(specks[0].x,specks[0].y);await pg.mouse.down();
  for(let k=0;k<6;k++)for(const s of specks){await pg.mouse.move(s.x+4,s.y,{steps:2});await pg.mouse.move(s.x-4,s.y+2,{steps:2})}
  await pg.mouse.up();await pg.waitForTimeout(600);
  console.log('after cleaning:',await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="deep");return `dirt ${w.dirt.toFixed(2)} cleaned ${w.cl.toFixed(2)} alcohol uses ${usesLeft("rubbing_alcohol")}`}));
  // stitch it: click each mark as it comes up
  await pg.click('[data-act=htreat][data-v^="stitch|"]');await pg.waitForTimeout(300);
  for(let i=0;i<8;i++){const t=await pg.evaluate(()=>{const T=UI.treat;if(!T||T.k!=="stitch"||T.i>=T.pts.length)return null;const svg=document.getElementById('treatpad');const m=svg.getScreenCTM();const p=T.pts[T.i];return{x:m.a*(p.x+(T.wx||0))+m.e,y:m.d*(p.y+(T.wy||0))+m.f}});
    if(!t)break;await pg.mouse.click(t.x,t.y);await pg.waitForTimeout(120);if(i===2)await shot(pg,'24_stitch')}
  await pg.waitForTimeout(600);
  console.log('after stitching:',await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="deep");return `stitched ${w.st.toFixed(2)} bleed ${wBleed(w).toFixed(2)}`}));
  // wrap it: hold, let go in the green, four times
  await pg.click('[data-act=htreat][data-v^="wrap|"]');await pg.waitForTimeout(300);
  const pad=await pg.$('#treatpad');const bb=await pad.boundingBox();
  for(let i=0;i<4;i++){await pg.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await pg.mouse.down();
    for(let k=0;k<80;k++){const v=await pg.evaluate(()=>UI.treat?UI.treat.v:-1);const z=await pg.evaluate(()=>UI.treat?[UI.treat.z0,UI.treat.z1]:[0,0]);if(v<0||v>(z[0]+z[1])/2)break;await pg.waitForTimeout(16)}
    if(i===2)await shot(pg,'25_wrap');await pg.mouse.up();await pg.waitForTimeout(150)}
  await pg.waitForTimeout(700);await shot(pg,'26_wrapped');
  console.log('after wrapping:',await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="deep");return w.band?`bandage q ${w.band.q.toFixed(2)} bleed ${wBleed(w).toFixed(2)}`:"no bandage"}));
  // the leg: drag the splint up onto the outline, then two straps
  await pg.click('[data-act=hpart][data-v=""]').catch(()=>{});await pg.waitForTimeout(200);
  await pg.click('[data-act=htreat][data-v^="splint|"]');await pg.waitForTimeout(300);await shot(pg,'27_splint');
  const sp=await pg.evaluate(()=>{const svg=document.getElementById('treatpad');const m=svg.getScreenCTM();const T=UI.treat;const C=closeShape(woundById(T.wid).p);return{fx:m.a*T.sx+m.e,fy:m.d*T.sy+m.f,tx:m.a*180+m.e,ty:m.d*(C.top-9)+m.f}});
  await pg.mouse.move(sp.fx,sp.fy);await pg.mouse.down();await pg.mouse.move(sp.tx+3,sp.ty+2,{steps:12});await pg.mouse.up();await pg.waitForTimeout(300);
  const bb2=await (await pg.$('#treatpad')).boundingBox();
  for(let i=0;i<2;i++){await pg.mouse.move(bb2.x+bb2.width/2,bb2.y+bb2.height/2);await pg.mouse.down();
    for(let k=0;k<80;k++){const v=await pg.evaluate(()=>UI.treat?UI.treat.v:-1);if(v<0||v>.68)break;await pg.waitForTimeout(16)}await pg.mouse.up();await pg.waitForTimeout(150)}
  await pg.waitForTimeout(700);
  console.log('after splinting:',await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="fracture");return `splint ${w.spl.toFixed(2)} speed ${bodySpeed().toFixed(2)}`}));
  // the forehead with a rag, by keyboard: hold Space
  await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="cut");openTreat("wrap",w.id,"cloth")});await pg.waitForTimeout(300);
  for(let i=0;i<3;i++){await pg.keyboard.down(' ');for(let k=0;k<80;k++){const v=await pg.evaluate(()=>UI.treat?UI.treat.v:-1);if(v<0||v>.7)break;await pg.waitForTimeout(16)}await pg.keyboard.up(' ');await pg.waitForTimeout(150)}
  await pg.waitForTimeout(700);
  console.log('after the rag:',await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="cut");return w.band?`${w.band.k} q ${w.band.q.toFixed(2)}`:"no rag"}));
  await pg.click('[data-act=hmed][data-v=pain]').catch(()=>{});await pg.waitForTimeout(300);
  await shot(pg,'28_treated');
  // whiskey from the bag goes to the dirty hand
  await pg.evaluate(()=>{closePanel();const g=allCarried().find(x=>x.g.id==="whiskey");openTreat("clean",woundFor("clean").id,"whiskey")});await pg.waitForTimeout(300);await shot(pg,'29_whiskey');
  await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
  console.log('panel after Esc:',await pg.evaluate(()=>UI.panel+" treat "+!!UI.treat));
  console.log(errs.join('\n')||'NO ERRORS');await b.close();if(errs.length)process.exitCode=1})();
