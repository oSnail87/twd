
// ================= conversations: the game decides what happens, Claude writes how each person says it =================
const AI={ns:null,tried:false,on:true,busy:false,ctl:null,cool:0,fails:0};
function aiInit(){if(AI.tried)return;AI.tried=true;try{AI.on=localStorage.getItem("twd.ai")!=="0"}catch(e){}
  try{const c=window.claude;if(c&&typeof c.use==="function")Promise.resolve(c.use("sample")).then(ns=>{AI.ns=ns||null;if(S&&UI.talkTo)markUI();const n=document.getElementById("cai");if(n)n.textContent=aiHelpText()}).catch(()=>{AI.ns=null})}catch(e){AI.ns=null}}
function aiReady(){return!!(AI.ns&&AI.on&&Date.now()>AI.cool)}
function aiStateText(){if(UI.talkBusy)return"thinking...";if(!AI.ns)return"";if(!AI.on)return"Claude voices: off";if(Date.now()<AI.cool)return"Claude voices: resting";return"Claude voices: on"}
function aiHelpText(){return AI.ns?"When you talk to people, Claude writes their words in their own voice, using your Claude usage. The first time, you'll be asked to allow it. You can switch it off in the talk box.":""}
function talkAbort(){if(AI.ctl){try{AI.ctl.abort()}catch(e){}AI.ctl=null}}
// the small details that make each person themselves, fixed for life by who they are
function persona(p){if(p._pz)return p._pz;const R=srng(hashStr(p.id+"/voice"));const sd=p.seed&&SEEDP[p.seed]||{};
  const a=p.age;const o={quirk:sd.quirk||forAge(QUIRKS,a,R,p),values:sd.values||forAge(VALUES,a,R,p),flaw:sd.flaw||forAge(FLAWS,a,R,p),hook:sd.hook||(a<4?"":lifeFill(forAge(HOOKS,a,R,p),p.sex)),morning:forAge(MORNING,a,R,p),kid:"",secret:sd.secret||p.facts.secret};
  Object.defineProperty(p,"_pz",{value:o,enumerable:false,writable:true});return o}
const ACTWORDS={follow:"agrees to come along with {pn} and starts following them",stay:"stops following {pn} and stays where they are",trade:"is willing to trade; a trade opens right after this line",
  attack:"loses their temper and swings at {pn}",romance_yes:"says yes: they want to be together with {pn}",child_yes:"agrees to try for a child with {pn}",break_up:"ends their relationship with {pn}",
  join_their:"welcomes {pn} into their group",join_mine:"agrees to join {pn}'s group, with their family",leave_mine:"hears that {pn} is leaving the group",take_lead:"hands leadership of their group to {pn}","bond:hang":"is glad {pn} will sit with them for a while",end:"is done talking and turns back to what they were doing"};
function sentence(t){t=String(t||"").trim();return!t?"":/[.!?]$/.test(t)?t:t+"."}
function feelWords(t,pn){return{hostile:`hates ${pn}`,cold:`is cold toward ${pn}`,neutral:`doesn't know ${pn} well yet`,friendly:`likes ${pn}`,close:`is close to ${pn}`}[t]||`doesn't know ${pn} well yet`}
function heShe(p){return p.age<13?"they":p.sex==="F"?"she":"he"}
function famWords(p){const L=[];for(const [id,rel] of Object.entries(p.fam||{})){if(id==="you")continue;const q=P(id);if(!q)continue;const where=!q.alive?(q.status==="turned"?"turned into one of the dead":q.status==="left"?"left town":"dead"):dist(q.x,q.z,p.x,p.z)<15?"here nearby":q.group&&q.group===p.group?"in the same group":"alive, somewhere else"+(p.told&&false?"":"");L.push(`${rel} ${q.name} (${where})`)}return L.slice(0,8).join("; ")||"none living close by"}
function worldWords(){const F=S.flags;const d=dayOf(S.t);const L=[];
  if(!F.clinic)L.push("It still seems like an ordinary day in town, though the radio talks about a flu in the city.");
  else if(!F.alarm)L.push("Something terrible happened at the hospital: sick people attacked others, and the bitten got up again. Rumors are spreading.");
  else L.push("The dead are walking. The town has fallen apart; people are hiding, fleeing, or banding together.");
  if(F.blackout)L.push("The power is out.");if(d>=3)L.push(`It's been ${d-1} days since it started.`);
  const gs=Object.values(S.groups).filter(g=>!g.dead&&groupSize(g.id)>0).slice(0,5).map(g=>`${groupAt(g)}`);if(gs.length)L.push("Groups that have formed: "+gs.join(", ")+".");
  return L.join(" ")}
// "I" for a line about themselves: "knows every back road" becomes "I know every back road"
function firstPerson(h){h=String(h||"").trim();if(/^[A-Z]/.test(h))return h.replace(/\b(He|She)\b/g,"I").replace(/^(His|Her)\b/,"My").replace(/\b(on|owes) (him|her)\b/g,"$1 me");
  const V={has:"have",is:"am",knows:"know",writes:"write",sings:"sing",owes:"owe",runs:"run"};return"I "+h.replace(/^(\w+)/,w=>V[w]||w).replace(/\btheir\b/g,"my").replace(/\bthemself\b/g,"myself")}
function thirdPerson(p,h){h=String(h||"").trim();if(!h)return"";if(/^[A-Z]/.test(h))return sentence(h);const F=p.sex==="F";return sentence((F?"She ":"He ")+h.replace(/\btheir\b/g,F?"her":"his").replace(/\bthemself\b/g,F?"herself":"himself"))}
// what the game settled before Claude says a word: a decision, facts to pass on, or nothing but talk
const TALK_HARD=["bitten","insult","threat","demand","ask_join","join_me","follow_me","leave_group","stay","lead","alliance","romance","flirt","child","breakup","deliver","give_req","trade","secret","apology"];
const TALK_FACT=["who_lead","where","news","family","food","remember","help"];
function talkMode(r){const I=r.intents||[];if(r.action&&r.action!=="end"||r.answered||I.some(k=>TALK_HARD.includes(k)))return"decided";
  if(r.facts||I.some(k=>TALK_FACT.includes(k))||r.M&&(r.M.people.length||r.M.group||r.M.place))return"facts";return"free"}
// a couple of things on their mind right now, different every time, so they bring up their own life instead of waiting to be asked
function onMind(p){const pl=S.player,pn=pl.name.split(" ")[0],pz=persona(p);const L=[];const youMem=p.mem.filter(m=>m.a==="you").map(m=>m.x).join(" ");
  const grief=p.mem.filter(m=>m.v<=-8&&S.t-m.t<DAY*4&&m.a!=="you").slice(-1)[0];if(grief)L.push(`grieving: ${grief.x}`);
  if(p.hunger<35)L.push("hungry, and it's hard to think about anything else");if((p.thirst??80)<35)L.push("thirsty");if((p.rest??80)<30)L.push("worn out; hasn't really slept");if(p.health<50)L.push("hurt, and trying not to show how much");
  if(p.bitten)L.push("hiding a bite, and terrified");if(p.want&&!p.want.told)L.push(`needs help with something and might ask: "${p.want.text}"`);
  const n=S.news.filter(n=>S.t-n.t<DAY*2&&!/household|joined|is old enough|went up at/.test(n.x)).slice(-4);if(n.length)L.push(`something they heard lately: ${pick(n).x}`);
  if(pz.hook)L.push(`something from their own life they might mention: ${firstPerson(pz.hook)}`);
  L.push(pick([`what they miss: ${p.facts.likes}`,`what they hope for: ${p.facts.hope}`,`what they were doing the morning it started: ${firstPerson(pz.morning)}`]));
  const wx=wxWord().toLowerCase();if(rf()<.4)L.push(`the weather: ${wx}, ${temp()}°C`);if(p.act)L.push(`what they're doing right now: ${p.act}`);
  const ask=[];if(!/used to|before all this|worked|was a /i.test(youMem))ask.push(`what ${pn} did before all this`);if(!/from /i.test(youMem))ask.push(`where ${pn} is from`);
  if(S.flags.wake&&!/coma|hospital|woke/i.test(youMem))ask.push(`how ${pn} made it through the first week (they don't know ${pn} slept through it in a hospital bed)`);
  if(Object.keys(pl.fam||{}).length&&!/family|find/i.test(youMem))ask.push(`whether ${pn} has found their people`);if(ask.length&&p.age>=8)L.push(`curious about ${pick(ask)}`);
  return shuffle(L).slice(0,3).map(x=>x.replace(/[.\s]+$/,""))}
function relWords(p){const t=p.trust,a=p.aff;const tw=t>60?"trusts them completely":t>30?"trusts them":t>5?"is starting to trust them":t>-20?"isn't sure they can trust them":"doesn't trust them at all";
  const aw=a>60?"loves them":a>35?"really likes them":a>10?"likes them":a>-15?"has no strong feelings about them yet":a>-40?"doesn't much like them":"can't stand them";return`${tw}, and ${aw}`}
function aiPrompt(p,msg,r,mode){const pl=S.player;const pn=pl.name.split(" ")[0];const pz=persona(p);const g=p.group?G(p.group):null;const f=feel(p);const b=bldAt(p.x,p.z);mode=mode||talkMode(r);
  const memYou=p.mem.filter(m=>m.a==="you").slice(-10).map(m=>`- (day ${m.d}) ${m.x}`).join("\n")||"- nothing yet";
  const memOther=p.mem.filter(m=>m.a!=="you"&&Math.abs(m.v)>=4).slice(-3).map(m=>`- (day ${m.d}) ${m.x}`).join("\n");
  const hist=p.chat.slice(-15,-1).map(m=>m.w==="you"?`${pn}: ${m.x}`:m.w==="them"?`${p.name}: ${m.x}`:`(${m.x})`).join("\n");
  const said=p.chat.filter(m=>m.w==="them").slice(-6).map(m=>m.x);
  const act=r.action&&!r.action.startsWith("note:")?(r.action.startsWith("reunite:")?`learns where their ${p.fam[r.action.slice(8)]||"loved one"} is, and is overwhelmed`:(ACTWORDS[r.action]||"").replace(/\{pn\}/g,pn)):"";
  const shift=r.dt+r.da>1.5?"warmer toward "+pn:r.dt+r.da<-1.5?"colder toward "+pn:"";
  const rel=p.fam.you?`${pn} is their ${p.fam.you}. `:p.partner==="you"?`${pn} is their partner. `:"";
  const secret=(f>55||p.told?.secret)?`Their secret (they may finally share it, if the moment is right): ${pz.secret}`:`Their secret (never say it outright; at most a hint): ${pz.secret}`;
  const mind=onMind(p);
  const what=mode==="decided"?`WHAT HAPPENS (the game has decided this; the reply must match it)
${act?`- ${p.name} ${act}.\n`:""}${shift?`- They come away feeling ${shift}.\n`:""}- The gist of what they say: "${r.text}"
Keep every decision and fact in the gist: if it refuses, refuse; if it agrees, agree; keep names, places, numbers and items, and don't promise anything it doesn't. Say it the way ${p.name} would, in your own words, not the gist's.`
    :mode==="facts"?`WHAT ${p.name.toUpperCase()} KNOWS THAT ANSWERS THIS
"${r.text}"
Pass these facts on accurately, in ${p.name}'s own words. Don't change names, places, numbers or who is alive or dead, and don't add facts about other people that aren't here. They can add their own feelings about it, or ask something back.`
    :`NOTHING IS DECIDED. This is just talk.
Answer what ${pn} actually said, the way ${p.name} really would. If it's small talk, make small talk: react to it, share something small and specific from their own life, and often turn it around with a question of their own. If ${pn} tells them something about themself, react to it like a person would, and remember it. If ${pn} answers a question ${p.name} asked, respond to the answer.`;
  return `You are writing what one person says next in a conversation, in a slow, grounded survival story set in ${TOWN}, a small town on the plains of eastern Colorado, in the weeks after the dead started walking. People here never say "zombie": they say the dead, the sick, walkers, them, those things.

WHO THEY ARE
${fullName(p)}, ${p.age}, ${p.sex==="F"?(p.age<18?"girl":"woman"):(p.age<18?"boy":"man")}. ${p.age<18?(p.age<13?"A kid.":"In school, before."):`Before all this: ${JOBS[p.job]?.n||"between jobs"}.`} Looks: ${p.look}.
Their age, and how it sounds: ${ageVoice(p)}
How they talk: ${VOICE[p.style]||VOICE.plain}
Temperament: ${traitWords(p.tr).join(", ")||"even-keeled"}. Quirk: ${pz.quirk}. Cares about: ${pz.values}. Flaw: ${pz.flaw}.
Their life: ${[sentence(p.facts.bio),thirdPerson(p,pz.hook),`From ${p.facts.from}.`].filter(Boolean).join(" ")} In their own words, what they miss: "${p.facts.likes}"; what scares them: "${p.facts.fear}"; what they hope for: "${p.facts.hope}".
${secret}
Family: ${famWords(p)}.${p.partner&&p.partner!=="you"?` Partner: ${P(p.partner)?.name||"someone"}.`:""}
${g?`Group: ${g.name}${g.leader===p.id?" (they lead it)":g.leader==="you"?` (led by ${pn})`:` (led by ${P(g.leader)?.name||"someone"})`}${p.role?", their job there: "+ROLES[p.role]?.n:""}.`:"Not part of any group."}
Right now: ${p.act||"around"}${b?` inside ${b.n}`:` at ${PLACES[regionAt(p.x,p.z)]?.n||"town"}`}. Health ${Math.round(p.health)}/100${p.hunger<30?", hungry":""}${(p.thirst??80)<30?", thirsty":""}${(p.rest??80)<25?", exhausted":""}${(p.fear||0)>60?", frightened":""}${p.mood<30?", miserable":p.mood>75?", in decent spirits":""}.${p.bitten?" They were bitten and are hiding it from everyone.":""}
On their mind: ${mind.join("; ")}.
${memOther?"Weighing on them:\n"+memOther+"\n":""}
WHO THEY'RE TALKING TO
${pl.name}, ${pl.age}${pl.bg?", used to be a "+pl.bg.toLowerCase():""}, pronouns ${pl.pron}. ${rel}${p.met?`${p.name} ${relWords(p)}.`:`${p.name} has never met ${pn} before.`}
${S.flags.wake?`${pn} lay in a coma at ${TOWN} Hospital for weeks and woke up ${(()=>{const m=S.t-S.flags.wake;return m<180?"less than three hours ago":m<DAY?"earlier today":Math.floor(m/DAY)===1?"a day ago":Math.floor(m/DAY)+" days ago"})()}, on day 8. ${pn} slept through the whole first week and doesn't know who died, who left, or where anyone went, unless someone has told them.${dist(p.x,p.z,BMAP.clinic.x,BMAP.clinic.z)<20&&S.t-S.flags.wake<240?" They may still look like a hospital patient.":""}
`:""}What ${p.name} remembers about ${pn}:
${memYou}

THE WORLD
${stamp(S.t)}, ${wxWord().toLowerCase()}, ${temp()}°C. ${worldWords()}

THE CONVERSATION SO FAR
${hist||"(they're just starting to talk)"}
${pn}: ${msg}

${what}

HOW TO WRITE IT
- Make it sound like a real person talking out loud, not a character in a game: contractions, plain words, half-finished thoughts and small hesitations where they'd really happen. Match their age exactly; nobody should sound older or younger than they are.
- Fit the length to the moment: a few words for a quick hello or a yes, up to four sentences when they have something to say. No speeches.
- They have their own mood and their own life. They can be distracted, short, funny, suspicious or curious about ${pn}, and they can bring up something on their mind. Not everything is about the dead.
- They only know what someone in their place would know, and they can be wrong. If they don't know, they say so or guess.
- At most one short *action* in asterisks, and only when it adds something; usually none. Don't open with one every time.
- Don't reuse an opener, phrase or idea they've already said in this conversation${said.length?`. Their recent lines: ${said.map(x=>`"${x.slice(0,90)}"`).join(" ")}`:""}.
- No therapy talk, no stock lines like "we'll get through this together" unless that's truly them. No emoji. Never mention games, AI, or these notes. If ${pn} says something odd, react like a real person would. Romance stays tender and never sexual.

Reply in exactly this format:
SAY: <what ${p.name} says>
FEEL: <a number from -2 to 2: how this exchange changes how ${p.name} feels about ${pn}>
NOTE: <one short first-person memory ${p.name} would keep from this, especially anything ${pn} told them about themself; or none>
END: <yes if ${p.name} walks away from the conversation now, otherwise no>`}
function aiParse(t){t=t||"";const s=/SAY:\s*([\s\S]*?)(?:\n\s*(?:FEEL|NOTE|END):|$)/i.exec(t);let say=s?s[1].trim():"";say=say.replace(/^["“]|["”]$/g,"").replace(/\s+/g," ").trim();
  const n=/NOTE:\s*([^\n]*)/i.exec(t);let note=n?n[1].trim().replace(/^["“]|["”]$/g,""):"";if(/^none\.?$/i.test(note))note="";
  const fm=/FEEL:\s*([+-]?\d(?:\.\d+)?)/i.exec(t);const feelv=fm?clamp(parseFloat(fm[1]),-2,2):null;const end=/END:\s*yes/i.test(t);
  return{say,note:note.slice(0,160),feel:feelv,end}}
// how much small talk alone can move someone in a day, so people warm up over time and not in five minutes
function talkGain(p,v){const d=dayOf(S.t);if(!p.tg||p.tg.d!==d)p.tg={d,n:0};if(v<=0)return v;const left=Math.max(0,12-p.tg.n);const g=Math.min(v,left)+Math.max(0,v-left)*.25;p.tg.n+=g;return g}
async function sendTalk(){const p=P(UI.talkTo);const msg=(UI.draft||"").trim();if(!p||!msg||UI.talkBusy)return;
  if(!p.alive){toast(`${p.name} is gone.`);closeTalk();return}
  if(dist(p.x,p.z,S.player.x,S.player.z)>6&&!p.follow){toast(`${p.met?p.name:"They"} can't hear you from there. Walk closer.`);return}
  p.chat.push({w:"you",x:msg});UI.draft="";p.lastTalk=S.t;
  const r=respond(p,msg);const mode=talkMode(r);
  if(!aiReady()){r.da=talkGain(p,r.da);applyTalk(p,r);advance(3);save();render();if(UI.talkTo!==p.id)bubble(p,r.text);return}
  const prompt=aiPrompt(p,msg,r,mode);const live={w:"them",x:"",live:true};p.chat.push(live);UI.talkBusy=true;render();
  const ctl=new AbortController();AI.ctl=ctl;let out=null;
  try{const res=await AI.ns(prompt,{signal:ctl.signal,cache:false,modelTier:"default",onText:({text})=>{const a=aiParse(text);if(a.say!==live.x){live.x=a.say;renderTalkLog()}}});
    out=aiParse(res&&res.text);AI.fails=0}
  catch(err){const code=err&&err.code;if(code==="not_granted"){AI.on=false;toast("Claude voices are off. People will use their built-in lines.")}else if(code==="rate_limited"){AI.cool=Date.now()+60000}else if(ctl.signal.aborted){}else{AI.fails++;if(AI.fails>=3)AI.cool=Date.now()+120000}}
  const i=p.chat.indexOf(live);if(i>=0)p.chat.splice(i,1);AI.ctl=null;UI.talkBusy=false;
  if(out&&out.say&&out.say.length>1){r.text=out.say;
    // in plain talk, how it went is up to the person; when something was decided, their feelings only lean a little
    if(out.feel!==null){if(mode==="free"){r.da=r.da*.5+out.feel*1.5;r.dt=r.dt*.5+out.feel*.6}else{r.da+=out.feel*.7}}
    if(out.note&&!r.memory){r.memory=out.note;r.mv=out.feel!==null?Math.round(out.feel*2):r.dt+r.da>2?1:r.dt+r.da<-2?-1:0}
    if(out.end&&!r.action)r.action="end";
    if(mode==="free"&&r.ask&&p.cv)p.cv.q=null}
  r.da=talkGain(p,r.da);applyTalk(p,r);advance(3);save();render();if(UI.talkTo!==p.id)bubble(p,r.text)}
