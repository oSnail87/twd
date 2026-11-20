// Plays with a stand-in for Claude: free text, crafting judgments and voices go through the Claude path and come back into the game.
const open=require("./page.js");
(async()=>{const {b,pg,errs}=await open({init:true});
  await pg.evaluate(()=>{AI.tried=false;const fake=async(prompt)=>{const P=String(prompt);
      if(/judge crafting/.test(P))return{text:/gun/.test(P.split("The player tries:")[1])?'{"ok":false,"reason":"A gun needs a machined barrel and primed cartridges; metal and powder just sit there."}':'{"ok":true,"uses":{"rope":1},"makes":{"name":"Rope ladder","use":"tool","v":1,"size":[1,2]},"hours":1,"say":"You knot the rope into a short ladder."}'};
      if(/game master/.test(P))return{text:'{"actions":[{"do":"act","text":"You spend the afternoon teaching the kids to whittle.","hours":2,"mood":2}],"say":""}'};
      return{text:"SAY: Hey. Didn't see you there.\nFEEL: 1\nNOTE: They said hi to me."}};
    window.claude={use:async()=>fake};aiInit()});
  await pg.waitForTimeout(300);
  await pg.fill("#crname","Tess");await pg.click('[data-act="start"]');await pg.waitForTimeout(300);await pg.click('[data-act="modalclose"]');
  const r=await pg.evaluate(async()=>{const out={ready:aiReady()};await doCommand("I say hi to everyone");await new Promise(r=>setTimeout(r,2500));
    await doCommand("I teach the kids to whittle");await craft("put this piece of metal with gunpowder to make a gun");await craft("make a rope ladder");
    out.log=S.log.slice(-8).map(l=>l.x);out.crafted=S.crafted.map(c=>c.n);return out});
  console.log(JSON.stringify(r,null,1));console.log("ERRORS:",errs.join("\n")||"none");await b.close()})();
