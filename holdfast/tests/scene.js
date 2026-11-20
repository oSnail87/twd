// Meeting someone is a scene of its own: strangers walking up to camp stop the clock, the bars come down and the camera
// closes in; you ask questions, check for bites, and decide. A bite kept hidden comes out later, with the fever.
// Screenshots go to $SHOTS.
const open=require("./page.js");
const OUT=process.env.SHOTS||"/tmp/claude-0/shots";
const fails=[];const check=(ok,what)=>{console.log((ok?"ok   ":"FAIL ")+what);if(!ok)fails.push(what)};
const type=async(pg,s)=>{await pg.fill("#cmd",s);await pg.press("#cmd","Enter");await pg.waitForTimeout(250)};
const sc=pg=>pg.evaluate(()=>UI.scene?{phase:UI.scene.phase,menu:!!UI.scene.menu,known:UI.scene.known,done:!!UI.scene.done,who:document.querySelector("#scene .who")?.textContent,line:document.querySelector("#scene .line")?.textContent,ch:[...document.querySelectorAll("#scene .ch button")].map(b=>b.textContent)}:null);
// click through lines until the choices come up (or the scene ends)
async function toMenu(pg){for(let i=0;i<40;i++){const s=await sc(pg);if(!s||s.menu)return s;await pg.keyboard.press("Space");await pg.waitForTimeout(140)}return sc(pg)}
async function pick(pg,re){const s=await sc(pg);const i=s.ch.findIndex(t=>re.test(t));if(i<0)return false;await pg.keyboard.press(String(i+1));await pg.waitForTimeout(150);return true}
(async()=>{const {b,pg,errs}=await open();
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(400);await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(300);
  // family words point the right way now: a parent's kid is "my son" or "my daughter"
  let st=await pg.evaluate(()=>{const hh=mkHousehold("parentkid","start",{x:0,z:0});const [a,k]=hh;S.people.push(...hh);const o={a:a.fam[k.id],k:k.fam[a.id],kids:kidsOf(a).length};S.people=S.people.filter(p=>!hh.includes(p));return o});
  check(/^(son|daughter)$/.test(st.a)&&/^(mother|father)$/.test(st.k)&&st.kids===1,`family words: parent says "my ${st.a}", kid says "my ${st.k}"`);
  await pg.evaluate(()=>{arriveAt("farm",true);S.walkers=S.walkers.filter(w=>w.loc!=="farm");renderAll()});await pg.waitForTimeout(300);
  await type(pg,"let's move in");await pg.evaluate(()=>{for(let i=0;i<20;i++)step(1);S.player.x=2;S.player.z=12;S.player.tx=null;S.player.path=null});

  // a family walks up the road while you're home; one of them is hiding a bite
  await pg.evaluate(()=>{const R=Math.random;let n=0;Math.random=()=>(n++<1?.99:R());S.nextStranger=0;strangersArrive();Math.random=R;
    const G=S.people.filter(p=>p.status==="stranger");const a=G.find(p=>!p.kid)||G[0];for(const p of G){p.bitten=false;p.hidBite=false}a.bitten=true;a.hidBite=true;a.biteWhere="left forearm";a.tr.temper=0;a.tr.kind=-.6;a.tr.faith=-.6;a.motive=a.motive==="freedom"?"safety":a.motive});
  await pg.waitForTimeout(900);
  st=await pg.evaluate(()=>({scene:!!UI.scene,how:UI.scene&&UI.scene.how,open:document.getElementById("scene")?.classList.contains("open"),hud:getComputedStyle(document.getElementById("bar")).display}));
  check(st.scene&&st.how==="arrive"&&st.open&&st.hud==="none",`strangers arriving start a scene: ${JSON.stringify(st)}`);
  const t0=await pg.evaluate(()=>S.t);await pg.waitForTimeout(1600);
  st=await pg.evaluate(t=>({still:S.t===t,zoom:+W.zoom.toFixed(1),phase:UI.scene&&UI.scene.phase}),t0);
  check(st.still&&st.zoom<10,`the clock stops and the camera closes in: ${JSON.stringify(st)}`);
  await pg.waitForTimeout(1800);await pg.screenshot({path:OUT+"/s01_arrival.png"});
  let s=await toMenu(pg);
  check(s&&s.menu&&s.ch.some(t=>/Who are you/.test(t))&&s.ch.some(t=>/Turn them away/.test(t)),`questions and decisions come up: ${s&&s.ch.join(" | ")}`);
  await pg.screenshot({path:OUT+"/s02_questions.png"});
  // who are you: they get their names
  await pick(pg,/Who are you/);s=await pg.evaluate(()=>{const sc=UI.scene;return sc.q.length+(sc.typ?1:0)});s=await toMenu(pg);
  check(await pg.evaluate(()=>S.people.filter(p=>p.status==="stranger").every(p=>p.met)),"asking who they are tells you their names");
  // the arm check finds the bite
  await pick(pg,/Show me your arms/);s=await toMenu(pg);
  if(s&&!s.known&&s.ch.some(t=>/Insist/.test(t))){await pick(pg,/Insist/);s=await toMenu(pg)}
  check(s&&s.known&&s.ch.some(t=>/anyway/.test(t)),`checking their arms finds the bite: ${s&&s.ch.join(" | ")}`);
  await pg.screenshot({path:OUT+"/s03_bite_found.png"});
  // let them in anyway: they join, and the bite is something you now have to decide about
  await pick(pg,/anyway/);for(let i=0;i<12;i++){if(!(await sc(pg)))break;await pg.keyboard.press("Space");await pg.waitForTimeout(160)}await pg.waitForTimeout(1200);
  st=await pg.evaluate(()=>({scene:!!UI.scene,members:S.people.filter(p=>p.status==="member").length,str:S.people.filter(p=>p.status==="stranger").length,modal:document.getElementById("mcard")?.textContent.slice(0,60),zoom:+W.zoom.toFixed(1),hud:getComputedStyle(document.getElementById("bar")).display}));
  check(!st.scene&&st.str===0&&/was bitten/.test(st.modal||"")&&st.hud!=="none",`they're in, and the bite comes up as a decision: ${JSON.stringify(st)}`);
  await pg.screenshot({path:OUT+"/s04_bitten_card.png"});
  await pg.evaluate(()=>{ACTS.cardopt({i:"1"})});await pg.waitForTimeout(300);await pg.evaluate(()=>{if(UI.modal)closeModal()});

  // a bite nobody checked for comes out at dawn, with the fever
  st=await pg.evaluate(()=>{const hh=mkHousehold("single",campK(),{x:0,z:10});const p=hh[0];p.status="stranger";S.people.push(p);p.bitten=true;p.hidBite=true;p.biteWhere="calf";admit(p);p.scened=true;S.cards=[];dawn();return{card:S.cards.some(c=>c.type==="bitten"&&c.who===p.id),log:S.log.slice(-3).map(l=>l.x).join(" | ")}});
  check(st.card&&/bite/.test(st.log),`a hidden bite comes out at dawn: ${st.log.slice(0,160)}`);
  await pg.evaluate(()=>{S.cards=[];if(UI.modal)closeModal()});await pg.waitForTimeout(300);

  // out at the church: someone hiding steps out when you get close; you send them on with food
  await pg.evaluate(()=>{arriveAt("church",true);S.people=S.people.filter(p=>!(p.status==="stranger"&&p.loc==="church"));S.walkers=S.walkers.filter(w=>w.loc!=="church");
    const hh=mkHousehold("single","church",{x:S.player.x+5,z:S.player.z-3});for(const q of hh){q.status="stranger";q.trust=15;q.waitTill=S.t+9999*HOUR;q.act="hiding";q.bitten=false;q.hidBite=false;S.people.push(q)}gAdd(S.haul,"food",4);renderAll()});
  await pg.waitForTimeout(1500);
  st=await pg.evaluate(()=>({scene:!!UI.scene,how:UI.scene&&UI.scene.how,dbg:UI.scene?null:{modal:UI.modal,grab:!!UI.grab,trav:S.flags.traveling,paused:UI.paused,q:UI.sceneQ,T:UI.sceneT,place:!!UI.place,pp:!!UI.pushPick,push:!!S.push,ko:S.player.ko,str:S.people.filter(p=>p.status==="stranger"&&p.loc==="church").map(p=>[p.scened,p.away,dist(p.x,p.z,S.player.x,S.player.z).toFixed(1)])}}));
  check(st.scene&&st.how==="found",`someone hiding gets a scene when you come close: ${JSON.stringify(st)}`);
  s=await toMenu(pg);await pick(pg,/What do you need/);s=await toMenu(pg);await pg.screenshot({path:OUT+"/s05_found.png"});
  const food0=await pg.evaluate(()=>S.res.food+gCount(S.haul,"food"));
  await pick(pg,/food/);for(let i=0;i<12;i++){if(!(await sc(pg)))break;await pg.keyboard.press("Space");await pg.waitForTimeout(160)}await pg.waitForTimeout(1200);
  st=await pg.evaluate(f=>({scene:!!UI.scene,left:S.people.filter(p=>p.loc==="church"&&p.status==="left").length,food:S.res.food+gCount(S.haul,"food"),f0:f}),food0);
  check(!st.scene&&st.left===1&&st.food===st.f0-2,`fed and sent on: ${JSON.stringify(st)}`);
  // and nobody gets the scene twice
  await pg.waitForTimeout(800);check(await pg.evaluate(()=>!UI.scene),"no second scene for the same people");

  check(!errs.length,"no page errors"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  await b.close();console.log(fails.length?`\n${fails.length} FAILED`:"\nall passed");process.exit(fails.length?1:0)})();
