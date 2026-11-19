// ================= you and the people around you: pull, company, closeness =================
// How much a word from you moves someone depends on how scared they are, how alone, how hungry, what they think of you,
// what you can offer, and who else they'd be leaving. In the first days of the outbreak most people will walk with anyone.

// ---------- will they come with you ----------
function pull(p,msg){const pl=S.player;const F=S.flags;const g=p.group?G(p.group):null;msg=msg||"";
  let s=feel(p)*.6+pl.sk.speak*3;
  if(!F.clinic)s-=45;else if(!F.alarm)s-=18+(p.seen&&S.t-p.seen<120?-14:0);
  else s+=Math.min(30,(p.fear||0)*.35)+(dayOf(S.t)<=3?8:2);
  if(p.seen&&S.t-p.seen<90)s+=10;
  const mates=S.people.filter(q=>q!==p&&q.alive&&q.home===p.home&&!q.group&&q.age>=16&&dist(q.x,q.z,p.x,p.z)<12);if(!mates.length)s+=10;
  const b=bldAt(p.x,p.z);if(!b||b.id!==p.home)s+=6;
  if(typeof weapon==="function"&&weapon())s+=6;
  const fol=(W3.followers||[]).length;s+=fol<=4?fol*3:12-(fol-4)*3; // safety in numbers, until it's a crowd
  const myG=myGroup();if(myG&&myG.home)s+=8;
  s+=(1-p.tr.ambit)*12+p.tr.social*6-(p.tr.brave>.75?6:0);
  if(p.hunger<35||(p.thirst??85)<35)s+=8;if(p.health<50)s+=6;
  if(g)s-=28+(g.leader!=="you"&&P(g.leader)?Math.max(0,relGet(p,P(g.leader)))/3:0)+members(g.id).filter(q=>relGet(p,q)>40).length*3;
  if(p.cv&&p.cv.q==="come")s+=30; // they asked you first
  // the reason you give, if it's one they need
  if(/\b(safe|safer|protect|look after|keep you)\b/.test(msg))s+=5+(p.fear||0)*.08;
  if(/\b(food|eat|water|supplies)\b/.test(msg)&&(p.hunger<55||(p.thirst??85)<55))s+=9;
  if(/\b(together|alone|by yourself|on your own|out here)\b/.test(msg))s+=mates.length?3:8;
  if(/\b(please|trust me|i promise|i swear)\b/.test(msg))s+=3;
  if(/\b(camp|group|people|church|school|farm)\b/.test(msg)&&myG&&myG.home)s+=5;
  return s}
// what they say when you ask them to come with you
function comeWith(p,msg,g,same){const F=S.flags;const kid=p.age<13;const fm=F.alarm?famMissing(p,{alarm:true,d:dayOf(S.t)}):null;const fq=fm&&fm.q!==S.player?fm.q:null;
  if(p.fam.you&&p.fam.you!=="roommate"||same&&feel(p)>=-10)return{ok:true,line:pick(["Lead the way.","Right behind you.","Okay. Let's go."])};
  if(!F.clinic)return{ok:false,line:pick(["Come with you where? It's a Tuesday.","I've got things to do today. Maybe later."])};
  const pv=pull(p,msg);const helpFind=/\b(find|look for|search for|help you)\b/.test(msg);
  if(fq&&!helpFind&&pv<60){const rel=p.fam[fq.id]||"family";return{ok:false,line:pick([`Not until I find my ${rel}. ${fq.name} is out there somewhere.`,`I can't. My ${rel} ${fq.name}... I have to find them first.`,`Not without ${fq.name}. If you'd help me look, maybe.`])}}
  if(pv>=24){const withFam=S.people.some(q=>q!==p&&q.alive&&!q.group&&!q.follow&&q.hh&&q.hh===p.hh&&dist(q.x,q.z,p.x,p.z)<15);
    const line=kid?pick(["*takes your hand* Okay.","Okay. Can we find my mom after?","Are you a good guy? ...Okay. I'll come."])
      :fq&&helpFind?pick([`You'd help me find ${fq.name}? ...Okay. Okay. Let's go.`,`Then let's go. ${fq.name} first, if we can.`])
      :withFam?pick(["We'll come. All of us.","Only if my family comes too. ...Okay. Let's go."])
      :(p.fear||0)>60?pick(["Oh, thank God. Yes. Don't leave me behind.","I've been hiding in here for hours. Yes. Let's go.","Yes. Please. I can't do this by myself anymore."])
      :p.hunger<40||(p.thirst??85)<40?pick(["If you know where there's food, I'm with you.","I haven't had water since yesterday. I'll follow you anywhere that has some."])
      :!F.alarm?pick(["After what happened at the hospital? ...Yeah. I'll come.","Okay. Something's very wrong today. Let's stick together."])
      :pick(["Better than waiting for them to find me. Let's go.","Alright. I'm with you.","Lead the way.","Yeah. Two of us is better than one."]);
    return{ok:true,line}}
  if(g)return{ok:false,line:pick([`I've got people at ${PLACES[g.home]?.n||"camp"}. I can't just leave them.`,`${g.name} took me in. I'm not walking out on them.`])};
  if(!F.alarm)return{ok:false,line:pick(["Because of the hospital? I'm sure the police have it handled.","I think I'll wait until we know more."])};
  if(feel(p)<-20)return{ok:false,line:pick(["With you? No.","I'd rather take my chances with them."])};
  if(p.tr.ambit>.7||p.tr.brave>.8)return{ok:false,line:pick(["I'm better off on my own.","I've got a plan of my own, thanks.","You go. I'll be fine."])};
  return{ok:false,line:pick(["I don't know you. Why would I follow you anywhere?","How do I know you won't get me killed?","Give me one good reason."])}}
// when someone agrees, the people who live with them come too
function bringAlong(p,note){const fam=S.people.filter(q=>q!==p&&q.alive&&!q.follow&&!q.group&&q.age>=2&&q.hh&&q.hh===p.hh&&q.home===p.home&&dist(q.x,q.z,p.x,p.z)<15);
  for(const q of fam){q.follow=true;q.plan=null;q.met=true;mem(q,`Went with ${S.player.name} because ${p.name} did.`,1)}
  if(fam.length&&note)note(`${fam.map(q=>q.name).join(" and ")} ${fam.length>1?"come":"comes"} too.`);if(fam.length)snapFollowers()}
// frightened people near you ask to come along
function askAlong(){const pl=S.player;if(!S.flags.alarm||pl.alive===false||pl.coma||UI.talkTo||UI.modal)return;
  for(const p of W3.npcNear||[]){if(!p.alive||p.follow||p.group||p.age<6||p.act==="asleep"||p.lie||p.askT&&S.t-p.askT<300)continue;
    if(Math.abs(p.x-pl.x)>4.5||Math.abs(p.z-pl.z)>4.5||dist(p.x,p.z,pl.x,pl.z)>4||!losClear(p.x,p.z,pl.x,pl.z))continue;
    if((p.fear||0)<45&&!(p.seen&&S.t-p.seen<60))continue;if(p._r&&p._r.mode)continue;if(pull(p,"")<34)continue;
    p.askT=S.t;p.met=true;if(!p.cv)p.cv={};p.cv.q="come";
    bubble(p,styleSay(p,pick(p.age<13?["Are you a grown-up? Can I come with you?","Can you help me? I can't find my mom."]:["Wait! Can I come with you?","Hey. Hey! Are you going somewhere safe? Take me with you.","Please don't leave me here. Can I come?"])),3.6);
    toast(`${p.name} wants to come with you. Talk to them.`);return}}

// ---------- spending time together ----------
const BOND_ACTS=[
  {k:"hang",n:"Spend time",mins:45},{k:"meal",n:"Share a meal",mins:30},{k:"drink",n:"Share a drink",mins:40},{k:"cards",n:"Play cards",mins:60},
  {k:"comfort",n:"Comfort",mins:20},{k:"flirt",n:"Flirt",mins:10},{k:"date",n:"Ask them out",mins:90},{k:"together",n:"Ask to be together",mins:5},{k:"night",n:"Spend the night",mins:0}];
function adultsBoth(p){return S.player.age>=18&&p.age>=18}
function canRomance(p){const pl=S.player;return adultsBoth(p)&&!p.fam.you&&(!p.partner||p.partner==="you")&&(!pl.partner||pl.partner===p.id)}
function recentLoss(p){return p.mem.some(m=>m.v<=-8&&S.t-m.t<DAY*3&&m.a!=="you")}
function mealItem(){const inv=invMap();return Object.keys(inv).filter(k=>ITEMS[k].eat&&!ITEMS[k].eat.sick).sort((a,b)=>ITEMS[b].eat.food-ITEMS[a].eat.food)[0]||null}
function bondOk(p,k){const pl=S.player;if(p.age<4)return false;
  switch(k){case"hang":return true;case"meal":return!!mealItem();case"drink":return adultsBoth(p)&&(invHas("whiskey")||packHas(p,"whiskey"));
    case"cards":return p.age>=7&&(invHas("cards")||packHas(p,"cards"));case"comfort":return p.mood<45||recentLoss(p);
    case"flirt":return canRomance(p)&&p.partner!=="you";case"date":return canRomance(p)&&(p.rom||0)>=30&&p.partner!=="you";case"together":return canRomance(p)&&(p.rom||0)>=55&&p.partner!=="you";
    case"night":return p.partner==="you"&&adultsBoth(p)&&(hourOf(S.t)>=20||hourOf(S.t)<4)}return false}
// how close you are, in a word
function relLabel(p){const f=feel(p);if(p.partner==="you")return"Your partner";if(p.fam.you&&p.fam.you!=="roommate")return"Family";
  if((p.rom||0)>=55)return"More than friends";if((p.rom||0)>=30)return"Something there";if(f>=55)return"Close friend";if(f>=25)return"Friend";if(f<=-45)return"Enemy";if(f<=-15)return"Doesn't like you";return p.met?"Acquaintance":"Stranger"}
function bondRow(p){if(!S.flags||UI.talkBusy)return"";const L=BOND_ACTS.filter(a=>bondOk(p,a.k));if(!L.length)return"";
  return `<div class="bondrow" role="group" aria-label="Spend time with ${esc(p.name)}">${L.map(a=>`<button class="tag bond" data-act="bond" data-v="${a.k}">${esc(a.n)}</button>`).join("")}</div>`}
function onBondAct(a,v){if(a!=="bond")return false;const p=P(UI.talkTo);if(p&&p.alive)doBond(p,v);return true}
function gain(p,k,base){const log=p.bondLog||(p.bondLog={});const rep=log[k]&&S.t-log[k]<DAY*.5?.35:1;log[k]=S.t;return(base+p.tr.social*3+(feel(p)>0?1.5:0)+rf()*3)*rep}
// something true about them that you didn't know yet
function opensUp(p){const pz=persona(p);const t=p.told||(p.told={});const opts=[];
  if(!t.from)opts.push(["from",p.facts.from.startsWith("right here")?`I've lived in ${TOWN} my whole life. Never even wanted to leave. Funny, now.`:`I grew up in ${p.facts.from}. Moved here for ${pick(["work","a girl","a guy","the quiet","cheap rent","my mother"])}.`]);
  if(!t.likes)opts.push(["likes",`You know what I miss? ${cap(p.facts.likes)}. Isn't that stupid?`]);
  if(!t.hope)opts.push(["hope",`If we make it through this, I want ${p.facts.hope}.`]);
  if(!t.fear)opts.push(["fear",`I'm scared of ${p.facts.fear}. More than them, some days.`]);
  if(pz.hook&&!t.hook)opts.push(["hook",cap(pz.hook.replace(/^(was|has|had|is|lost|won|writes|sings|runs|knows|grew|got|moved|bought|owes|finished|served|raised|volunteers|coached)\b/,m=>"I "+({was:"was",has:"have",had:"had",is:"am"}[m]||m)))+"."]);
  if(!t.secret&&feel(p)>=45)opts.push(["secret",`I've never told anyone this. ${pz.secret}.`]);
  if(!opts.length)return null;const o=opts[opts.length>1&&feel(p)>=45&&opts.some(x=>x[0]==="secret")?opts.length-1:Math.floor(rf()*opts.length)];t[o[0]]=true;return o[1]}
function doBond(p,k){const pl=S.player;if(!bondOk(p,k))return;if(zedNear(9)){toast("Not with the dead this close.");return}
  if(dist(p.x,p.z,pl.x,pl.z)>4){toast(`Get closer to ${p.name} first.`);return}
  const A=BOND_ACTS.find(a=>a.k===k);const say=t=>p.chat.push({w:"them",x:styleSay(p,t)}),sys=t=>p.chat.push({w:"sys",x:t});const nm=p.name;const kid=p.age<13;const they=heShe(p);
  const b=bldAt(pl.x,pl.z);const where=b?(isHome(b)?"at the kitchen table":b.n.startsWith("St.")?"in a back pew":"in a quiet corner"):pick(["on the curb","with your backs against a wall","in the long grass"]);
  let dA=0,dT=0,line=null,scene="",memo=null,mv=0;
  switch(k){
    case"hang":{dA=gain(p,k,3);dT=dA*.6;p.soc=clamp((p.soc??60)+30,0,100);p.mood=clamp(p.mood+4,0,100);
      scene=kid?pick([`You sit ${where} with ${nm} and make up a story together. ${cap(they)} insists the dragon wins.`,`${nm} shows you every rock in ${hisHer(p)} pocket and explains each one.`])
        :pick([`You sit ${where} with ${nm} for a while. Neither of you says much at first.`,`You and ${nm} talk ${where} until the light changes.`,`You keep watch with ${nm} for an hour, trading stories in low voices.`]);
      line=kid?pick(["This is the most fun I've had since everything.","Can we do this again tomorrow?"]):opensUp(p)||pick(["It's good to just talk to someone. Like a person.","Thanks for this. I needed it more than I knew."]);
      if(dA>4)memo=[`Spent an hour just talking with ${pl.name}. It helped.`,3];break}
    case"meal":{const it=mealItem();if(!it)return;invTake(it);const f=ITEMS[it].eat.food;pl.food=clamp(pl.food+f*.5,0,100);const hungry=p.hunger<50;p.hunger=clamp(p.hunger+f*.9,0,100);
      dA=gain(p,k,4)+(hungry?4:0);dT=dA*.7+(hungry?4:0);scene=`You split your ${ITEMS[it].n.toLowerCase()} with ${nm} ${where}.`;
      line=hungry?pick(["I haven't eaten since yesterday. Thank you. I mean it.","*eats too fast, then laughs at themself* Sorry. Thank you."]):pick(["Food tastes better with company. Even this.","My mother would say grace. ...I'll say it for her."]);
      memo=[hungry?`${pl.name} shared their food with me when I was starving.`:`Shared a meal with ${pl.name}.`,hungry?6:2];break}
    case"drink":{if(invHas("whiskey"))invTake("whiskey");else packTake(p,"whiskey");pl.flags.drunk=S.t;p.mood=clamp(p.mood+10,0,100);dA=gain(p,k,4);dT=dA*.5;
      scene=`You pass a bottle back and forth with ${nm} ${where}.`;
      if(p.tr.temper>.7&&rf()<.15){dA=-6;dT=-3;line=pick(["Don't tell me how to feel. You don't know me.","*slams the bottle down* Forget it. Forget all of it."]);memo=[`Got into it with ${pl.name} over a bottle.`,-3]}
      else{line=feel(p)>=40&&!p.told?.secret?opensUp(p)||"Here's to whoever's still out there.":pick(["Here's to whoever's still out there.","*coughs* God, that's awful. Give it here."]);memo=[`Shared a bottle with ${pl.name}.`,3]}break}
    case"cards":{const win=rf()<.45+p.tr.curious*.2;dA=gain(p,k,4)+(kid?3:0);dT=dA*.5;p.mood=clamp(p.mood+8,0,100);p.soc=clamp((p.soc??60)+25,0,100);
      scene=`You deal a few hands with ${nm} ${where}. ${win?`${cap(they)} wins more than ${they} loses and won't stop grinning.`:`You win most of them. ${cap(they)} wants a rematch.`}`;
      line=win?pick(["Pay up. ...I'll take it in canned peaches.","I told you. Nobody beats me at this."]):pick(["Again. You cheated. Again.","Best of seven. Sit down."]);memo=[`Played cards with ${pl.name}. Felt normal for an hour.`,3];break}
    case"comfort":{const loss=p.mem.filter(m=>m.v<=-8&&m.a!=="you").slice(-1)[0];dA=gain(p,k,6);dT=dA*.8;p.mood=clamp(p.mood+14,0,100);
      scene=loss?`You sit with ${nm} while ${they} talks about ${loss.a&&P(loss.a)?P(loss.a).name:"what happened"}. Mostly you just listen.`:`You sit close to ${nm} and let ${hisHer(p)} shoulders come down.`;
      line=pick(["*wipes their face* Thank you for not saying it'll be okay.","I didn't think I could say any of that out loud.","Stay a little longer?"]);memo=[`${pl.name} sat with me when I couldn't hold it together.`,7];break}
    case"flirt":{const at=attraction(p,{id:"you"});const ch=at<.25?0:.2+at*.45+p.aff/220+(p.rom||0)/220+(p.mood>50?.05:0);
      if(rf()<ch){p.rom=clamp((p.rom||0)+8+rf()*6,0,100);dA=3;scene=`You catch ${nm}'s eye and hold it a beat too long.`;line=pick(["*laughs* Stop it.","You're not so bad yourself.","At the end of the world? Really? ...Keep going."]);memo=[`${pl.name} flirted with me. I didn't hate it.`,2]}
      else{p.rom=Math.max(0,(p.rom||0)-2);dA=-.5;scene=`You try a line on ${nm}.`;line=at<.25?pick(["I don't see you like that. Sorry.","Let's just keep it friends, okay?"]):pick(["...Weird time for that.","Ask me again when nothing's trying to eat us."])}break}
    case"date":{dA=gain(p,k,5);p.rom=clamp((p.rom||0)+12+rf()*6,0,100);p.dates=(p.dates||0)+1;p.mood=clamp(p.mood+10,0,100);
      scene=pick([`You climb onto a roof with ${nm} and watch the town go dark street by street. For a while nobody says anything, and it's enough.`,`You light the last candle you have and split a can of peaches with ${nm} like it's a restaurant. ${cap(they)} insists on a toast.`,`You walk with ${nm} along the river as the sun goes down, close enough that your hands keep touching. Neither of you moves away.`,`You find an old record player that still cranks by hand, and ${nm} teaches you a dance badly. You both pretend not to hear the dead outside.`]);
      line=pick(["I forgot what this felt like.","Thank you. For tonight. For making it feel like something.","Same time tomorrow? If there is one."]);memo=[`${pl.name} took me out. A real night, in the middle of all this.`,7];break}
    case"together":{if((p.rom||0)>=60&&p.aff>=40&&(p.dates||0)>=1){p.partner="you";pl.partner=p.id;p.rom=Math.max(p.rom,70);dA=8;scene=`You ask ${nm} if this is something real.`;line=pick(["*quiet for a moment* I was hoping you'd ask. Yes.","I didn't think anyone would want anything good out here. ...Yes.","Yes. Obviously yes."]);
        memo=[`${pl.name} and I are together now.`,10];news(`${pl.name} and ${fullName(p)} are together.`,"good",[p.id]);sys(`You and ${nm} are together now.`)}
      else{scene=`You ask ${nm} if this is something real.`;line=p.aff>=30?"I... want to. I just need more time. Ask me again.":"I like you. I don't think I'm there.";dA=-.5}break}
    case"night":{scene=`You stay with ${nm} tonight. The door is shut, the dead are a long way off, and for once nobody is keeping watch but the two of you.`;
      p.chat.push({w:"sys",x:scene});p.chat.push({w:"sys",x:"The rest of the night is yours."});p.aff=clamp(p.aff+6,-100,100);p.rom=clamp((p.rom||0)+4,0,100);mem(p,`Spent the night with ${pl.name}.`,6);
      const h=hourOf(S.t);const mins=clamp(((7-h+24)%24)*60-(S.t%60),60,660);p.bond={until:S.t+mins+5};p.tx=p.x;p.tz=p.z;
      advance(mins,{sleep:true,safe:true});if(pl.alive===false)return;afterJump(mins);pl.energy=Math.max(pl.energy,85);pl.flags.lastNight=S.t;
      p.chat.push({w:"sys",x:`You wake up next to ${nm} as the window goes gray.`});say(pick(["Morning. ...Don't get up yet.","Hi. *smiles into the pillow*","I slept. I actually slept."]));
      journal(`You spent the night with ${nm}.`,"good");save();render();return}}
  p.bond={until:S.t+A.mins+5};p.tx=p.x;p.tz=p.z;p.met=true;
  if(scene)sys(scene);if(line)say(line);
  p.aff=clamp(p.aff+dA,-100,100);p.trust=clamp(p.trust+dT,-100,100);if(memo)mem(p,memo[0],memo[1]);p.lastTalk=S.t;
  advance(A.mins);if(pl.alive===false)return;afterJump(A.mins);skillUp("speak",.03);save();render()}

// someone you're close to asks you to sit with them
function inviteCheck(){const pl=S.player;if(!S.flags||pl.alive===false||pl.coma||UI.talkTo||UI.modal)return;const h=hourOf(S.t);if(h<17&&h>2)return;
  for(const p of W3.npcNear||[]){if(!p.alive||p.age<8||p.act==="asleep"||p.inviteT&&S.t-p.inviteT<DAY*.6)continue;if(feel(p)<35&&p.partner!=="you")continue;
    if(dist(p.x,p.z,pl.x,pl.z)>3.5||!losClear(p.x,p.z,pl.x,pl.z)||zedNear(12))continue;p.inviteT=S.t;if(!p.cv)p.cv={};p.cv.q="hang";
    bubble(p,styleSay(p,p.partner==="you"?pick(["Come sit with me. Just for a bit.","Hey you. Stay with me tonight?"]):pick(["Hey. Sit with me a while?","You got a minute? I could use the company.",invHas("cards")||packHas(p,"cards")?"Want to play a few hands?":"Sit down. You look like you need it."])),3.4);return}}
