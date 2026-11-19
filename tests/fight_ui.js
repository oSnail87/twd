// Fights in a real browser: one of the dead walks up, the fight screen with its dice, keys and buttons, then a fight with a person who gives up.
// node tests/fight_ui.js   (screenshots land in tests/shots/)
const open=require('./page.js');const fs=require('fs');const path=require('path');
const OUT=path.join(__dirname,'shots');fs.mkdirSync(OUT,{recursive:true});
const shot=(pg,n)=>pg.screenshot({path:path.join(OUT,n+'.png')});
(async()=>{const {b,pg,errs}=await open({viewport:{width:1280,height:800},dpr:+(process.env.DPR||1)});
  let bad=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)bad++};
  await pg.fill('[data-c=first]','Dana');await pg.fill('[data-c=last]','Reyes');await pg.click('[data-v="traits|Tough"]');await pg.click('[data-v="traits|Handy"]');await pg.click('[data-v="start|home"]');
  await pg.click('[data-act=begin]');await pg.waitForTimeout(300);await pg.click('[data-act=closemodal]').catch(()=>{});await pg.waitForTimeout(800);
  // out on the street in daylight, a bat in hand, and one of the dead coming
  await pg.evaluate(()=>{const pl=S.player;const bd=BMAP[pl.home];const d=bd.exits[0];const p=d.p[d.outSide];pl.x=p.x;pl.z=p.z;
    for(let i=0;i<40;i++){const a=i*.7,r=2+i*.15;const x=p.x+Math.sin(a)*r,z=p.z+Math.cos(a)*r;if(!bldAt(x,z)&&free(x,z,.4,"pl")){pl.x=x;pl.z=z;break}}
    S.flags.clinic=S.flags.alarm=true;S.t=24*60+13*60;S.zeds=[];pl.eq.weapon=mkInst("bat");pl.hp=100;
    let s=null;for(let i=0;i<40&&!s;i++){const a=i*.8,x=pl.x+Math.sin(a)*3,z=pl.z+Math.cos(a)*3;if(!bldAt(x,z)&&free(x,z,.35,"zed")&&losClear(pl.x,pl.z,x,z))s={x,z}}
    const z=spawnZed(s.x,s.z);z.st="chase";snapCamera();lighting();syncFigs();zst(z).tgt=pl});
  for(let i=0;i<60;i++){if(await pg.evaluate(()=>!!UI.fight))break;await pg.waitForTimeout(100)}
  ok(await pg.evaluate(()=>!!UI.fight&&worldPaused()),'one of the dead walks up and the fight screen opens on its own');
  await pg.waitForTimeout(400);await shot(pg,'40_fight_open');
  const first=await pg.evaluate(()=>({btns:[...document.querySelectorAll('#fight [data-act=fact]')].map(b=>b.innerText.replace(/\s+/g,' ').trim()),log:document.querySelector('#flog').innerText}));
  console.log('  buttons:',first.btns.join(' | '));console.log('  log:',first.log.replace(/\n/g,' / '));
  ok(first.btns.length===4&&/to hit/.test(first.btns[0]),'four moves against the dead, each with its odds');
  // the 3D view is slow in a software renderer; freeze it so the clicks below land on time
  await pg.evaluate(()=>{W3._render=W3.ren.render;W3.ren.render=()=>{}});
  await pg.click('#fight [data-v=attack]');await pg.waitForTimeout(150);
  await pg.keyboard.press('2');await pg.waitForTimeout(150);
  const mid=await pg.evaluate(()=>({rounds:UI.fight&&(UI.fight.over?-1:UI.fight.round),rows:document.querySelectorAll('#flog .fl').length,dice:document.querySelectorAll('#flog .die').length}));
  ok(mid.rows>=3&&mid.dice>=4,`a click and a key each play a round, with the dice in the log (${mid.rows} lines, ${mid.dice} dice)`);
  for(let i=0;i<30;i++){const st=await pg.evaluate(()=>UI.fight&&!UI.fight.over);if(!st)break;await pg.evaluate(()=>{S.player.hp=Math.max(S.player.hp,60)});await pg.keyboard.press('1');await pg.waitForTimeout(80)}
  await pg.evaluate(()=>{W3.ren.render=W3._render});await pg.waitForTimeout(500);await shot(pg,'41_fight_over');
  const over=await pg.evaluate(()=>({over:UI.fight&&UI.fight.over,sum:document.querySelector('#fight .fsum')?.innerText}));
  ok(over.over==="won",`it ends with a summary: "${over.sum}"`);
  await pg.keyboard.press('Enter');await pg.waitForTimeout(200);
  ok(await pg.evaluate(()=>!UI.fight&&!worldPaused()&&document.getElementById('fight').hidden),'Enter closes it and time runs again');

  // a person: the Attack button in the talk window needs two clicks
  await pg.evaluate(()=>{W3.ren.render=()=>{}});
  const who=await pg.evaluate(()=>{const pl=S.player;S.zeds=[];const p=living().find(q=>q.age>=25&&q.age<60&&!q.fam.you);
    let s=null;for(let i=0;i<40&&!s;i++){const a=i*.8,x=pl.x+Math.sin(a)*1.2,z=pl.z+Math.cos(a)*1.2;if(!bldAt(x,z)&&free(x,z,.3,"npc"))s={x,z}}p.x=s.x;p.z=s.z;p.tx=s.x;p.tz=s.z;p.met=true;p.health=100;p.tr.temper=.4;p.tr.brave=.5;
    pl.eq.weapon=null;pl.sk.fight=5;syncFigs();openTalk(p.id);return p.name});
  await pg.waitForTimeout(200);
  const kid=await pg.evaluate(()=>{const k=living().find(q=>q.age<13&&q.age>5);return k?(openTalk(k.id),!document.querySelector('#talk [data-act=fattackp]')):true});
  ok(kid,'no Attack button when talking to a child');
  await pg.evaluate(n=>{openTalk(living().find(q=>q.name===n&&q.met).id)},who);await pg.waitForTimeout(150);
  await pg.click('#talk [data-act=fattackp]');await pg.waitForTimeout(100);
  const armed=await pg.evaluate(()=>({txt:document.querySelector('#talk [data-act=fattackp]')?.innerText,f:!!UI.fight}));
  ok(armed.txt==="Really attack?"&&!armed.f,'the first click asks "Really attack?"');
  await pg.click('#talk [data-act=fattackp]');await pg.waitForTimeout(150);
  ok(await pg.evaluate(()=>!!UI.fight&&!UI.talkTo),`the second click starts the fight with ${who}`);
  const pb=await pg.evaluate(()=>[...document.querySelectorAll('#fight [data-act=fact]')].map(b=>b.innerText.replace(/\s+/g,' ').trim()));
  ok(pb.some(t=>/Talk them down/.test(t)),'against a person you can also try to talk them down: '+pb.join(' | '));
  await pg.evaluate(()=>{W3.ren.render=W3._render});await pg.waitForTimeout(400);await shot(pg,'42_fight_person');await pg.evaluate(()=>{W3.ren.render=()=>{}});
  for(let i=0;i<40;i++){const st=await pg.evaluate(()=>UI.fight&&!UI.fight.over&&!UI.fight.ask);if(!st)break;await pg.evaluate(()=>{S.player.hp=100});await pg.keyboard.press('1');await pg.waitForTimeout(60)}
  const ask=await pg.evaluate(()=>({ask:!!(UI.fight&&UI.fight.ask),btns:[...document.querySelectorAll('#fight [data-act=fdecide]')].map(b=>b.innerText.replace(/\s+/g,' ').trim()+(b.disabled?' (off)':''))}));
  ok(ask.ask&&ask.btns.length===3,'when they give up, you choose: '+ask.btns.join(' | '));
  await pg.evaluate(()=>{W3.ren.render=W3._render});await pg.waitForTimeout(400);await shot(pg,'43_fight_giveup');
  await pg.click('#fight [data-v=spare]');await pg.waitForTimeout(200);
  const fin=await pg.evaluate(n=>({over:UI.fight&&UI.fight.over,sum:UI.fight&&UI.fight.sum,mem:living().find(q=>q.name===n&&q.met)?.mem.slice(-1)[0]?.x}),who);
  ok(fin.over==="won",`"${fin.sum}" / ${who} remembers: "${fin.mem}"`);
  await pg.waitForTimeout(300);await shot(pg,'44_fight_spared');await pg.keyboard.press('Escape');await pg.waitForTimeout(150);
  ok(await pg.evaluate(()=>!UI.fight),'Escape closes the finished fight too');
  console.log(errs.join('\n')||'NO ERRORS');if(errs.length)bad++;await b.close();console.log(bad?bad+' FAILED':'all passed');process.exitCode=bad?1:0})();
