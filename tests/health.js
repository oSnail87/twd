// The health screen in a real browser: wounds on the body, and the one-click care: wash, wrap, antibiotics.
// node tests/health.js   (screenshots land in tests/shots/)
const open=require('./page.js');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const shot=(pg,n)=>pg.screenshot({path:path.join(OUT,n+'.png')});
(async()=>{const {b,pg,errs}=await open({viewport:{width:1280,height:800},dpr:+(process.env.DPR||1)});
  let bad=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)bad++};
  await pg.fill('[data-c=first]','Dana');await pg.fill('[data-c=last]','Reyes');await pg.click('[data-v="traits|Tough"]');await pg.click('[data-v="traits|Handy"]');await pg.click('[data-v="start|home"]');
  await pg.click('[data-act=begin]');await pg.waitForTimeout(300);await pg.click('[data-act=closemodal]').catch(()=>{});await pg.waitForTimeout(800);
  // a bad day: hurt in five places, with a bag of supplies
  await pg.evaluate(()=>{const pl=S.player;pl.eq.back=mkInst("hiking_pack");S.zeds=[];
    for(const [id,n] of [["bandage",2],["cloth",3],["water_bottle",2],["whiskey",1],["painkillers",1],["antibiotics",1]])invAdd(id,n,true);
    addWound("deep","larm",{at:"forearm"});const s=addWound("scratch","rhand");s.inf=50;addWound("bruise","chest");addWound("fracture","rleg",{at:"shin"});addWound("cut","head",{at:"forehead"});
    pl.hp=71;advance(20);markUI()});
  await pg.waitForTimeout(500);await shot(pg,'20_hud_hurt');
  // the 3D view is slow in a software renderer; freeze it so the clicks below land on time
  await pg.evaluate(()=>{W3._render=W3.ren.render;W3.ren.render=()=>{}});
  await pg.keyboard.press('h');await pg.waitForTimeout(400);await shot(pg,'21_health');
  ok(await pg.locator('[data-act=htendall]').count()===1,'a wash-and-wrap-everything button is there');
  ok(await pg.evaluate(()=>!document.querySelector('#treatpad')),'no hands-on minigames anymore');
  // pick the arm on the figure
  const pt=await pg.evaluate(()=>{const svg=document.querySelector('.bsvg');const p=bpt("larm",.75,0);const m=svg.getScreenCTM();return{x:m.a*p.x+m.e,y:m.d*p.y+m.f}});
  await pg.mouse.click(pt.x,pt.y);await pg.waitForTimeout(300);await shot(pg,'22_arm');
  const btns=await pg.$$eval('.wcard .btn',bs=>bs.map(b=>b.textContent.trim()));console.log('    arm buttons: '+btns.join(' | '));
  ok(btns.length===2&&/^Wash it/.test(btns[0]+btns[1])||btns.some(t=>/^Wash it/.test(t))&&btns.some(t=>/^Wrap it/.test(t)),'the deep cut offers just Wash it and Wrap it');
  await pg.click('[data-act=hdo][data-v^="wrap|"]');await pg.waitForTimeout(300);
  await pg.click('[data-act=hdo][data-v^="wash|"]');await pg.waitForTimeout(300);await shot(pg,'23_arm_done');
  const arm=await pg.evaluate(()=>{const w=wounds().find(w=>w.k==="deep");return{wrapped:!!w.band,washed:washed(w),bleed:wBleed(w)}});
  ok(arm.wrapped&&arm.washed&&arm.bleed<.2,'two clicks: washed, wrapped, barely bleeding ('+arm.bleed.toFixed(2)+')');
  // everything else at once
  await pg.click('[data-act=hpart][data-v=""]').catch(()=>{});await pg.waitForTimeout(200);
  await pg.click('[data-act=htendall]');await pg.waitForTimeout(400);
  const msg=await pg.evaluate(()=>UI.hmsg&&UI.hmsg.x);console.log('    '+msg);
  ok(await pg.evaluate(()=>wounds().every(w=>!needsWrap(w))),'every open wound wrapped, and the broken leg bound');
  // the infected hand: antibiotics
  ok(await pg.locator('[data-act=hmed][data-v=abx]').count()===1,'antibiotics are offered for the infected hand');
  await pg.click('[data-act=hmed][data-v=abx]');await pg.waitForTimeout(300);
  ok(await pg.evaluate(()=>infMax()===0),'antibiotics cleared the infection');
  await shot(pg,'24_treated');
  const adv=await pg.evaluate(()=>document.querySelector('.hadvice')?.textContent||'');console.log('    advice: '+adv);ok(/eat and drink|fed and watered/i.test(adv),'the screen says food and water heal you');
  // whiskey from the bag goes to a wound that needs washing
  await pg.evaluate(()=>{closePanel();addWound("cut","lleg",{at:"knee"});invAdd("whiskey",1,true);markUI()});
  const before=await pg.evaluate(()=>usesLeft("whiskey"));await pg.evaluate(()=>{doCare("wash",woundFor("clean"),"whiskey")});await pg.waitForTimeout(300);
  ok(await pg.evaluate(b=>usesLeft("whiskey")===b-1&&washed(wounds().find(w=>w.at==="left knee")),before),'pouring whiskey on a wound washes it, one pour at a time');
  await pg.keyboard.press('Escape');await pg.waitForTimeout(200);
  console.log(errs.join('\n')||'NO ERRORS');console.log(bad?bad+' failed':'all passed');await b.close();if(errs.length||bad)process.exitCode=1})();
