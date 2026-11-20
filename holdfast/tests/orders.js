// Typed orders: people do what you tell them, by name, everyone, or someone. Fortifying chains the door work and the
// windows, building a fence they cut the wood for, cars get pushed, animals hunted, and "stop" means stop.
// Screenshots go to $SHOTS.
const open=require("./page.js");
const OUT=process.env.SHOTS||"/tmp/claude-0/shots";
const fails=[];const check=(ok,what)=>{console.log((ok?"ok   ":"FAIL ")+what);if(!ok)fails.push(what)};
const type=async(pg,s)=>{await pg.fill("#cmd",s);await pg.press("#cmd","Enter");await pg.waitForTimeout(250)};
const run=(pg,mins)=>pg.evaluate(m=>{for(let i=0;i<m;i++){step(1);S.walkers=S.walkers.filter(w=>w.loc!=="farm")}},mins);
(async()=>{const {b,pg,errs}=await open();
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(400);await pg.click('[data-act="modalclose"]');await pg.waitForTimeout(300);
  // on the highway: "B, help me push that car" brings up the car to place, with B ready to push
  const ppl0=await pg.evaluate(()=>members().filter(p=>!p.kid).map(p=>({id:p.id,name:p.name})));const H=ppl0[0];
  await pg.evaluate(()=>{UI.paused=true;S.walkers=S.walkers.filter(w=>w.loc!==S.player.loc);const c=carsAt(S.player.loc)[0];S.player.x=c.x+3;S.player.z=c.z+1});
  await type(pg,`${H.name}, help me push that car`);
  let st=await pg.evaluate(id=>({cars:carsAt(S.player.loc).length,pick:!!UI.pushPick,k:P(id).order&&P(id).order.k}),H.id);
  check(st.pick&&st.k==="push",`"help me push that car" picks a car to push, with ${H.name} ready: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{const P_=UI.pushPick;const c=carsAt(S.player.loc)[P_.ci];for(const [dx,dz] of [[0,4],[0,-4],[4,0],[-4,0],[3,3],[-3,3]]){P_.x=c.x+dx;P_.z=c.z+dz;pushGhost();if(P_.ok)break}tryPushPick()});
  st=await pg.evaluate(()=>({push:!!S.push,who:pushers().map(p=>p.name)}));
  check(st.push&&st.who.length>=2,`the push starts with help: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{for(let i=0;i<40&&S.push;i++)step(1)});
  check(await pg.evaluate(()=>!S.push),"and the car rolls to where it was put");
  await pg.evaluate(()=>{for(const p of members())p.follow=true});
  // camp at the farm, in daylight, with nothing dead about
  await pg.evaluate(()=>{UI.paused=true;arriveAt("farm",true);S.walkers=S.walkers.filter(w=>w.loc!=="farm");renderAll()});await pg.waitForTimeout(300);
  await type(pg,"let's move in");await run(pg,30);
  const ppl=await pg.evaluate(()=>members().map(p=>({id:p.id,name:p.name,kid:!!p.kid})));
  const A=ppl.find(p=>!p.kid),B=ppl.filter(p=>!p.kid)[1]||A;console.log("people:",ppl.map(p=>p.name+(p.kid?" (kid)":"")).join(", "));
  await pg.evaluate(()=>{for(const p of members()){p.hp=100;p.trust=70;p.mood=60}});

  // "A, cut some wood": a one-off order, and the wood ends up in the stores
  await pg.evaluate(()=>{S.res.wood=0;syncInv()});await type(pg,`${A.name}, cut some wood`);
  st=await pg.evaluate(id=>({k:P(id).order&&P(id).order.k,job:P(id).job}),A.id);
  check(st.k==="chop",`"${A.name}, cut some wood" is an order to cut wood: ${JSON.stringify(st)}`);
  await run(pg,240);st=await pg.evaluate(id=>({wood:S.res.wood,k:P(id).order&&P(id).order.k,act:P(id).act}),A.id);
  check(st.wood>=2,`the wood gets cut and stacked: ${JSON.stringify(st)}`);

  // "stop": named, it ends their order; on its own, it ends yours
  await type(pg,`${A.name}, cut some wood`);await type(pg,`${A.name}, stop`);
  check(await pg.evaluate(id=>!P(id).order,A.id),`"${A.name}, stop" ends the order`);
  await type(pg,"I'll cut some wood");check(await pg.evaluate(()=>S.player.order&&S.player.order.k==="chop"),"'I'll cut some wood' sets you to it");
  await type(pg,"stop");check(await pg.evaluate(()=>!S.player.order),"'stop' stops you");

  // "everyone fortify the house": the door, the dresser, the windows, shared out, and it all gets done
  await pg.evaluate(()=>{S.res.wood=40;syncInv();const k=campK();const bi=homeIdx(k);const s=bldState(k,bi);s.door="open";s.bar=0;s.furn=false;for(const w of s.wins){w.board=0;w.broken=false}S.bv++});
  await type(pg,"everyone fortify the house");
  st=await pg.evaluate(()=>members().filter(p=>!p.kid).map(p=>p.order&&p.order.k));
  check(st.length&&st.every(k=>["door","bar","furn","board","fixwin","fixdoor"].includes(k))&&new Set(st).size===Math.min(st.length,4),`everyone gets a share of the work: ${st.join(", ")}`);
  await run(pg,360);
  st=await pg.evaluate(()=>{const k=campK();const s=bldState(k,homeIdx(k));return{door:s.door,bar:s.bar,furn:s.furn,boards:s.wins.map(w=>w.board),busy:members().filter(p=>p.order).map(p=>p.name+":"+p.order.k)}});
  check(st.door==="shut"&&st.bar>=1&&st.furn&&st.boards.every(n=>n>=1),`the house is shut, barred, blocked and boarded: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{UI.paused=false;renderAll()});await pg.waitForTimeout(700);await pg.screenshot({path:OUT+"/o01_fortified.png"});await pg.evaluate(()=>{UI.paused=true});

  // "tell B to board up the windows": an order, not something to say out loud
  await type(pg,`tell ${B.name} to board up the windows`);
  st=await pg.evaluate(id=>({k:P(id).order&&P(id).order.k,lvl:P(id).order&&P(id).order.lvl}),B.id);
  check(st.k==="board"&&st.lvl===2,`"tell ${B.name} to board up the windows" gives the order: ${JSON.stringify(st)}`);
  await type(pg,`${B.name}, stop`);

  // "A, build a fence": you lay it out, and A is the one the build asks about
  await type(pg,`${A.name}, build a fence`);
  st=await pg.evaluate(()=>({place:UI.place&&UI.place.type,assign:UI.assign}));
  check(st.place==="fence"&&st.assign===A.id,`"${A.name}, build a fence" lays one out for ${A.name}: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{cancelPlace();UI.assign=null});
  // with a fence laid out and no wood at all, "everyone build the fence" means they cut the wood for it and finish it
  const bid=await pg.evaluate(()=>{S.res.wood=0;S.res.scrap=20;syncInv();const b=addBld("fence",8,14,{});b.need={...BUILDS.fence.cost};b.got={};return b.id});
  await type(pg,"everyone build the fence");
  st=await pg.evaluate(id=>members().filter(p=>!p.kid).map(p=>p.order&&p.order.k==="build"&&p.order.bid===id),bid);
  check(st.length&&st.every(Boolean),`everyone is on the fence: ${st.join(", ")}`);
  await run(pg,60);
  st=await pg.evaluate(()=>members().filter(p=>p.order).map(p=>p.act));
  check(st.some(a=>/wood|tree|deadfall/.test(a)),`with no wood, they go and cut some: ${st.join("; ")}`);
  await pg.evaluate(()=>{UI.paused=false;renderAll()});await pg.waitForTimeout(700);await pg.screenshot({path:OUT+"/o02_cutting_for_fence.png"});await pg.evaluate(()=>{UI.paused=true});
  for(let i=0;i<8;i++){await run(pg,120);if(await pg.evaluate(id=>S.blds.find(b=>b.id===id).done,bid))break}
  st=await pg.evaluate(id=>{const b=S.blds.find(b=>b.id===id);return{done:b.done,prog:+(b.prog/BUILDS.fence.hrs).toFixed(2),got:b.got,busy:members().filter(p=>p.order).map(p=>p.act)}},bid);
  check(st.done,`the fence gets built: ${JSON.stringify(st)}`);

  // no cars here: it says so
  await type(pg,"push that car");check(await pg.evaluate(()=>!UI.pushPick&&(layout("farm").cars.length===0)),"no cars at the farm: nothing to push");

  // hunting: "shoot the deer" goes after the nearest deer with the bow
  await pg.evaluate(()=>{giveItem("bow",1);S.animals=S.animals.filter(a=>a.loc!=="farm");spawnAnimal("farm","deer");const a=S.animals.find(a=>a.loc==="farm");a.x=S.player.x+6;a.z=S.player.z;a.tx=null;a.path=null;a.flee=null});
  await type(pg,"shoot the deer");await run(pg,3);
  st=await pg.evaluate(()=>{const a=S.animals.find(a=>a.loc==="farm"&&a.k==="deer");return{dead:a.dead,flee:!!a.flee,log:S.log.slice(-2).map(l=>l.x).join(" | ")}});
  check(st.dead||/arrow|Missed|Damn|off/.test(st.log)||st.flee,`"shoot the deer" takes a shot with the bow: ${JSON.stringify(st)}`);
  await pg.evaluate(()=>{const a=S.animals.find(a=>a.loc==="farm"&&a.k==="deer");a.dead=true;a.flee=null});
  await type(pg,`${A.name}, butcher the deer`);
  check(await pg.evaluate(id=>P(id).order&&P(id).order.k==="butcher",A.id),`"${A.name}, butcher the deer" sends ${A.name} to do it`);

  // what Claude reads as an order goes through the same way
  await pg.evaluate(async id=>{await runAction({do:"order",who:[P(id).name],task:"chop",n:3})},B.id);
  check(await pg.evaluate(id=>P(id).order&&P(id).order.k==="chop"&&P(id).order.n===3,B.id),"an order from Claude's reading works the same");
  // and none of it turned into chatter or jobs
  st=await pg.evaluate(()=>members().map(p=>p.job||"-"));console.log("jobs:",st.join(", "));

  check(!errs.length,"no page errors"+(errs.length?": "+errs.slice(0,3).join(" / "):""));
  await b.close();console.log(fails.length?`\n${fails.length} FAILED`:"\nall passed");process.exit(fails.length?1:0)})();
