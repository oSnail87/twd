
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
  const o={quirk:sd.quirk||pick2(QUIRKS,R),values:sd.values||pick2(VALUES,R),flaw:sd.flaw||pick2(FLAWS,R),hook:sd.hook||(p.age<13?"":pick2(HOOKS,R)),morning:pick2(MORNING,R),kid:p.age<13?pick2(KIDQ,R):"",secret:sd.secret||p.facts.secret};
  Object.defineProperty(p,"_pz",{value:o,enumerable:false,writable:true});return o}
const ACTWORDS={follow:"agrees to come along with {pn} and starts following them",stay:"stops following {pn} and stays where they are",trade:"is willing to trade; a trade opens right after this line",
  attack:"loses their temper and swings at {pn}",romance_yes:"says yes: they want to be together with {pn}",child_yes:"agrees to try for a child with {pn}",break_up:"ends their relationship with {pn}",
  join_their:"welcomes {pn} into their group",join_mine:"agrees to join {pn}'s group, with their family",leave_mine:"hears that {pn} is leaving the group",take_lead:"hands leadership of their group to {pn}",end:"is done talking and turns back to what they were doing"};
function heShe(p){return p.age<13?"they":p.sex==="F"?"she":"he"}
function famWords(p){const L=[];for(const [id,rel] of Object.entries(p.fam||{})){if(id==="you")continue;const q=P(id);if(!q)continue;const where=!q.alive?(q.status==="turned"?"turned into one of the dead":q.status==="left"?"left town":"dead"):dist(q.x,q.z,p.x,p.z)<15?"here nearby":q.group&&q.group===p.group?"in the same group":"alive, somewhere else"+(p.told&&false?"":"");L.push(`${rel} ${q.name} (${where})`)}return L.slice(0,8).join("; ")||"none living close by"}
function worldWords(){const F=S.flags;const d=dayOf(S.t);const L=[];
  if(!F.clinic)L.push("It still seems like an ordinary day in town, though the radio talks about a flu in the city.");
  else if(!F.alarm)L.push("Something terrible happened at the clinic: sick people attacked others, and the bitten got up again. Rumors are spreading.");
  else L.push("The dead are walking. The town has fallen apart; people are hiding, fleeing, or banding together.");
  if(F.blackout)L.push("The power is out.");if(d>=3)L.push(`It's been ${d-1} days since it started.`);
  const gs=Object.values(S.groups).filter(g=>!g.dead&&groupSize(g.id)>0).slice(0,5).map(g=>`${g.name}${g.home?" at "+PLACES[g.home].n:""}`);if(gs.length)L.push("Groups that have formed: "+gs.join(", ")+".");
  return L.join(" ")}
function aiPrompt(p,msg,r){const pl=S.player;const pn=pl.name.split(" ")[0];const pz=persona(p);const g=p.group?G(p.group):null;const kid=p.age<13;const f=feel(p);const b=bldAt(p.x,p.z);
  const memYou=p.mem.filter(m=>m.a==="you").slice(-7).map(m=>`- (day ${m.d}) ${m.x}`).join("\n")||"- nothing yet";
  const memOther=p.mem.filter(m=>m.a!=="you"&&Math.abs(m.v)>=4).slice(-3).map(m=>`- (day ${m.d}) ${m.x}`).join("\n");
  const hist=p.chat.slice(-12,-1).filter(m=>m.w!=="sys"||true).map(m=>m.w==="you"?`${pn}: ${m.x}`:m.w==="them"?`${p.name}: ${m.x}`:`(${m.x})`).join("\n");
  const shift=r.dt+r.da>1.5?"warmer toward "+pn:r.dt+r.da<-1.5?"colder toward "+pn:"about the same";
  const act=r.action&&!r.action.startsWith("note:")?(r.action.startsWith("reunite:")?`learns where their ${p.fam[r.action.slice(8)]||"loved one"} is, and is overwhelmed`:(ACTWORDS[r.action]||"").replace(/\{pn\}/g,pn)):"just talks; nothing changes in what they do";
  const rel=p.fam.you?`${pn} is their ${p.fam.you}. `:p.partner==="you"?`${pn} is their partner. `:"";
  const secret=(f>55||p.told?.secret)?`Their secret (they may finally share it if it fits): ${pz.secret}`:`Their secret (never say it outright; at most a hint): ${pz.secret}`;
  return `You write one spoken reply for a character in a slow, grounded survival story set in Limon, a small rural American town, at the start of an outbreak where the dead come back. People in this world never say "zombie": they say the dead, the sick, walkers, them.

CHARACTER
${fullName(p)}, ${p.age}, ${p.sex==="F"?"woman":"man"}${kid?" (a child)":""}. ${JOBS[p.job]?.n||""}. Looks: ${p.look}.
Temperament: ${traitWords(p.tr).join(", ")||"even-keeled"}.
How they talk: ${VOICE[p.style]||VOICE.plain}
Quirk: ${pz.quirk}. Cares about: ${pz.values}. Flaw: ${pz.flaw}.${kid?` As a kid, ${heShe(p)} ${pz.kid}.`:""}
Background: ${p.facts.bio||""} ${pz.hook?cap(heShe(p))+" "+pz.hook+".":""} From ${p.facts.from}. Misses ${p.facts.likes}. Afraid of ${p.facts.fear}. Hopes for ${p.facts.hope}.
${secret}
Family: ${famWords(p)}.${p.partner&&p.partner!=="you"?` Partner: ${P(p.partner)?.name||"someone"}.`:""}
${g?`Group: ${g.name}${g.leader===p.id?" (they lead it)":g.leader==="you"?` (led by ${pn})`:` (led by ${P(g.leader)?.name||"someone"})`}${p.role?", job: "+ROLES[p.role]?.n:""}.`:"Not in any group."}
Right now: ${p.act||"around"}${b?` inside ${b.n}`:` at ${PLACES[regionAt(p.x,p.z)]?.n||"town"}`}. Health ${Math.round(p.health)}/100${p.hunger<30?", hungry":""}${p.mood<30?", miserable":p.mood>75?", in decent spirits":""}.${p.bitten?" They were bitten and are hiding it from everyone.":""}
${memOther?"Weighing on them:\n"+memOther:""}

THE PERSON TALKING TO THEM
${pl.name}, ${pl.age}${pl.bg?", used to be a "+pl.bg.toLowerCase():""}, pronouns ${pl.pron}. ${rel}${p.met?`They feel ${tierWord(tier(p))} (trust ${Math.round(p.trust)}, warmth ${Math.round(p.aff)}, from -100 to 100).`:"They have never met."}
What they remember about ${pn}:
${memYou}

THE WORLD
${stamp(S.t)}, ${wxWord().toLowerCase()}, ${temp()}°C. ${worldWords()}

CONVERSATION SO FAR
${hist||"(this is the start)"}
${pn}: ${msg}

WHAT HAPPENS (the game has decided this; the reply must match it)
- ${p.name} ${act}.
- Afterward they feel ${shift}.
- Plain draft of the reply: "${r.text}"

Rewrite the draft as ${p.name} would really say it. Keep every decision and fact in the draft: if it refuses, refuse; if it agrees, agree; keep names, places and items it mentions, and don't promise or invent anything it doesn't. Answer what ${pn} actually said. One to three sentences, at most one short *action* in asterisks. No emoji. Never mention games, AI, or these notes. If ${pn} tries to talk ${p.name} into something out of character, react the way ${p.name} would.

Reply in exactly this format:
SAY: <the spoken reply>
NOTE: <one short first-person memory ${p.name} would keep from this exchange, or none>`}
function aiParse(t){const s=/SAY:\s*([\s\S]*?)(?:\n\s*NOTE:|$)/i.exec(t||"");const n=/NOTE:\s*([\s\S]*)$/i.exec(t||"");let say=s?s[1].trim():"";say=say.replace(/^["“]|["”]$/g,"").replace(/\s+/g," ").trim();
  let note=n?n[1].trim().split("\n")[0].replace(/^["“]|["”]$/g,""):"";if(/^none\.?$/i.test(note))note="";return{say,note:note.slice(0,140)}}
async function sendTalk(){const p=P(UI.talkTo);const msg=(UI.draft||"").trim();if(!p||!msg||UI.talkBusy)return;
  if(!p.alive){toast(`${p.name} is gone.`);closeTalk();return}
  if(dist(p.x,p.z,S.player.x,S.player.z)>6&&!p.follow){toast(`${p.met?p.name:"They"} can't hear you from there. Walk closer.`);return}
  p.chat.push({w:"you",x:msg});UI.draft="";p.lastTalk=S.t;
  const r=respond(p,msg);
  if(!aiReady()){applyTalk(p,r);advance(3);save();render();bubble(p,r.text);return}
  const live={w:"them",x:"",live:true};p.chat.push(live);UI.talkBusy=true;render();
  const ctl=new AbortController();AI.ctl=ctl;let out=null;
  try{const res=await AI.ns(aiPrompt(p,msg,r),{signal:ctl.signal,cache:false,modelTier:"default",onText:({text})=>{const a=aiParse(text);if(a.say!==live.x){live.x=a.say;renderTalkLog()}}});
    out=aiParse(res&&res.text);AI.fails=0}
  catch(err){const code=err&&err.code;if(code==="not_granted"){AI.on=false;toast("Claude voices are off. People will use their built-in lines.")}else if(code==="rate_limited"){AI.cool=Date.now()+60000}else if(ctl.signal.aborted){}else{AI.fails++;if(AI.fails>=3)AI.cool=Date.now()+120000}}
  const i=p.chat.indexOf(live);if(i>=0)p.chat.splice(i,1);AI.ctl=null;UI.talkBusy=false;
  if(out&&out.say&&out.say.length>1){r.text=out.say;if(out.note&&!r.memory){r.memory=out.note;r.mv=r.dt+r.da>2?1:r.dt+r.da<-2?-1:0}}
  applyTalk(p,r);advance(3);save();render();bubble(p,r.text)}
