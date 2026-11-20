// ================= Claude: voices, reading what you type, judging what you make =================
// The game's rules decide what happens. Claude writes how people say it, works out what free text means,
// and judges whether something you try to make would really work. Everything has a built-in fallback.
const AI={ns:null,tried:false,on:true,cool:0,fails:0,busy:0};
function aiInit(){if(AI.tried)return;AI.tried=true;try{AI.on=localStorage.getItem("holdfast.ai")!=="0"}catch(e){}
  try{const c=window.claude;if(c&&typeof c.use==="function")Promise.resolve(c.use("sample")).then(ns=>{AI.ns=ns||null;if(typeof renderHud==="function")renderHud()}).catch(()=>{AI.ns=null})}catch(e){AI.ns=null}}
function aiReady(){return!!(AI.ns&&AI.on&&Date.now()>AI.cool)}
async function aiCall(prompt,opts){if(!aiReady())return null;AI.busy++;if(typeof renderHint==="function")renderHint();
  try{const r=await AI.ns(prompt,{cache:false,modelTier:"default",...(opts||{})});AI.fails=0;return r&&r.text||""}
  catch(err){const code=err&&err.code;if(code==="not_granted"){AI.on=false;toast("Claude is off for this game. The built-in rules take over.")}else if(code==="rate_limited")AI.cool=Date.now()+60000;else{AI.fails++;if(AI.fails>=3)AI.cool=Date.now()+120000}return null}
  finally{AI.busy--;if(typeof renderHint==="function")renderHint()}}
function aiJson(t){if(!t)return null;const a=t.indexOf("{"),b=t.lastIndexOf("}");if(a<0||b<a)return null;try{return JSON.parse(t.slice(a,b+1))}catch(e){return null}}
const WORLD_BRIEF=`A grounded survival story in rural eastern Colorado, near the small town of Millbrook, in the first weeks after the dead started walking. People never say "zombie": they say the dead, walkers, the sick, them.`;
function personBrief(p){const pn=S.player.name;const fam=famOf(p).map(q=>`${p.fam[q.id]} ${q.name}${q.status==="dead"?" (dead)":""}`).join(", ")||"none here";
  return`${p.name} ${p.sur}, ${p.age}, ${p.sex==="F"?(p.kid?"girl":"woman"):(p.kid?"boy":"man")}. ${p.kid?"A kid.":`Before all this: ${JOBS_BEFORE[p.job0]?.n||"between jobs"}.`}
Nature: ${traitWords(p).join(", ")||"even-keeled"}. What drives them: ${MOTIVES[p.motive]}. Quirk: ${p.quirk}. Hopes for: ${p.hope}. Afraid of: ${p.fear}.${p.cond?` Health: ${CONDS[p.cond].n}; needs ${CONDS[p.cond].need}.`:""}
Family: ${fam}. Status: ${p.status==="member"?"lives in "+pn+"'s camp"+(p.job?", works at "+JOBS[p.job].n.toLowerCase():"")+(p.leads?", in charge of "+JOBS[p.leads].lead:""):p.status==="stranger"?"a stranger hoping to be let into camp":p.status==="rival"?"one of the Pruitt crew, a rival group":"passing through"}.
Right now: ${p.act||"standing around"}. Mood: ${p.mood>65?"good":p.mood>40?"tired but okay":p.mood>20?"low":"miserable"}. Health: ${p.hp>70?"fine":p.hp>40?"hurt":"badly hurt"}${p.sick?", feverish":""}.
How they feel about ${pn}: ${p.trust>70?"trusts them completely":p.trust>50?"trusts them":p.trust>30?"isn't sure about them yet":"doesn't trust them"}.
What they remember: ${p.mem.slice(-6).map(m=>m.x).join(" ")||"nothing much yet"}`}
// someone answers what you said; if the game already decided an outcome, the words have to match it
async function aiTalk(p,msg,gist,decided,onText){const pn=S.player.name;
  const hist=p.chat.slice(-10).map(m=>m.w==="you"?`${pn}: ${m.x}`:`${p.name}: ${m.x}`).join("\n");
  const prompt=`${WORLD_BRIEF}

You write what one person says next, out loud, in their own voice.

WHO THEY ARE
${personBrief(p)}

THE CONVERSATION SO FAR
${hist||"(they're just starting to talk)"}
${pn}: ${msg}

${decided?`THE GAME HAS DECIDED THIS. The reply must match it: "${gist}"
Keep the decision and any names. Say it the way ${p.name} would, in your own words.`:`Nothing is decided. Answer what ${pn} actually said, the way ${p.name} really would: react, share something small and specific from their life, sometimes ask something back.`}

HOW TO WRITE IT
- Sound like a real person: contractions, plain words. Match their age exactly. One to three sentences; a few words is fine for a quick hello.
- They have their own mood and life, and only know what they'd know. No therapy talk, no speeches, no emoji, and never mention games or AI.
- Romance stays PG-13: warm and tender, never sexual.

Reply in exactly this format:
SAY: <what ${p.name} says>
FEEL: <-2 to 2: how this changes how ${p.name} feels about ${pn}>
NOTE: <a short first-person memory ${p.name} keeps from this, or none>`;
  const t=await aiCall(prompt,{onText:onText?({text})=>{const m=/SAY:\s*([\s\S]*?)(?:\n\s*(?:FEEL|NOTE):|$)/i.exec(text);if(m)onText(m[1].trim())}:undefined});if(!t)return null;
  const s=/SAY:\s*([\s\S]*?)(?:\n\s*(?:FEEL|NOTE):|$)/i.exec(t);const say=s?s[1].trim().replace(/^["“]|["”]$/g,""):"";const f=/FEEL:\s*([+-]?\d(?:\.\d+)?)/i.exec(t);const n=/NOTE:\s*([^\n]*)/i.exec(t);
  return say?{say,feel:f?clamp(parseFloat(f[1]),-2,2):0,note:n&&!/^none/i.test(n[1].trim())?n[1].trim().slice(0,160):""}:null}
// what's around you, for Claude to read free text against
function sceneBrief(){const pl=S.player;const L=LOCS[pl.loc];const ppl=S.people.filter(p=>p.loc===pl.loc&&!(p.away&&p.away.out)&&p.status!=="dead"&&p.status!=="left");
  return`Where: ${L.n}${pl.loc===campK()?" (your camp)":""}. Day ${dayOf(S.t)}, ${clockStr(S.t)}.
People here: ${ppl.map(p=>`${p.name} (${p.status==="member"?(p.follow?"following you":p.act||"camp member"):p.status}${p.kid?", kid":""})`).join("; ")||"nobody"}.
Things to search here: ${layout(pl.loc).conts.map(c=>CONT[c.k].n).join(", ")||"none"}.
The dead in sight: ${walkersAt(pl.loc).length}. You carry: ${pl.gun?`a ${ITEMS[pl.gun]}, ${pl.rounds||0} rounds`:"no gun"}.
Camp: ${S.camp?`${S.camp.n}, ${members().length} people. Stores: ${Object.entries(S.res).map(([k,v])=>`${RES[k].toLowerCase()} ${Math.floor(v)}`).join(", ")}. Items: ${craftList().join(", ")||"none"}.`:"no camp yet"}
Places on the map: ${Object.entries(LOCS).map(([k,l])=>`${k}=${l.n}`).join(", ")}.`}
const ACT_SCHEMA=`Actions (use only these; names must be people or keys listed above):
{"do":"say","to":"<person name, or empty for whoever is nearest>","text":"<what you say>"}
{"do":"walk","to":"<person name, or a thing to search>"}
{"do":"travel","to":"<place key>"}
{"do":"camp"}  (make camp right here)
{"do":"build","what":"<one of: ${Object.keys(BUILDS).join(", ")}>"}
{"do":"job","who":"<name>","job":"<one of: ${Object.keys(JOBS).join(", ")}, or none>"}
{"do":"lead","who":"<name>","job":"<job key>"}  (put them in charge of it)
{"do":"invite","who":"<name>"}   {"do":"turnaway","who":"<name>"}
{"do":"follow","who":["<names>"]}  (ask them to come with you)   {"do":"stay","who":["<names>"]}
{"do":"search","what":"<thing to search, or all>"}
{"do":"burn"}  (set this place on fire)
{"do":"craft","text":"<what you try to make and how>"}
{"do":"wait","hours":<1-12>}
{"do":"war"}  (rally people to fight the Pruitt crew)
{"do":"shoot"}  (fire at the nearest of the dead, if you carry a gun; guns are never used on living people)
{"do":"act","text":"<anything else: what you do, written as 'You ...'>","hours":<0-4>,"mood":<-4 to 4, how it lifts or drags the whole camp>,"trust":{"<name>":<-10 to 10>},"res":{"<food|water|wood|scrap|meds|ammo>":<-3 to 3>}}`;
async function aiInterpret(text){const prompt=`${WORLD_BRIEF}
You are the game master. The player typed what their character does. Turn it into game actions. Be generous: if it's possible for a person in this situation, let it happen with an "act" action and honest, small effects. If it's impossible or nonsensical, use "act" with no effects and say why in "say".

${sceneBrief()}

${ACT_SCHEMA}

The player typed: "${text.slice(0,300)}"

Reply with only JSON: {"actions":[...],"say":"<one or two sentences in second person describing what happens, or empty>"}`;
  return aiJson(await aiCall(prompt))}
async function aiCraft(text){const pl=S.player;const ppl=here();const skill=k=>Math.max(0,...ppl.map(p=>p.sk[k]));
  const prompt=`${WORLD_BRIEF}
You judge crafting realistically. The player tries to make something from what the camp has. Decide if it would really work.
- It works only if the materials and a basic know-how are enough in real life. Tying rope into a fishing net works. Metal and gunpowder do not make a gun: guns need machined parts and primed cartridges. Never allow firearms, explosives or anything that needs electricity, electronics or factory parts.
- It may only use what is listed, in sensible amounts. Basic resources (wood, scrap, cloth) count as listed. Small free things anyone can find (sticks, stones, mud, grass, string from clothes) don't need listing.
- Medicine someone needs to stay alive (marked) should only be used if the player clearly says so.

Camp items: ${craftList().join(", ")||"none"}.
Basic resources: ${Object.entries(S.res).map(([k,v])=>`${k} ${Math.floor(v)}`).join(", ")}.
Best skills in camp: building ${skill("build")}/3, medicine ${skill("med")}/3, farming ${skill("farm")}/3.

The player tries: "${text.slice(0,300)}"

Reply with only JSON:
{"ok":true|false,"reason":"<if not ok: one sentence on why it wouldn't work>","uses":{"<item key or resource key>":<count>},"makes":{"name":"<short name>","use":"<one of: ${Object.keys(USES).join(", ")}>","v":<1-3 how useful>,"size":[<w 1-3>,<h 1-3>]},"hours":<0.5-4>,"say":"<one or two sentences, second person, what you do and how it turns out>"}
Item keys: ${Object.keys(S.items).filter(k=>S.items[k]>0).join(", ")||"none"}. Resource keys: ${Object.keys(RES).join(", ")}.`;
  const r=aiJson(await aiCall(prompt));if(!r)return null;
  if(r.ok){for(const [k,n] of Object.entries(r.uses||{})){const have=RES[k]?S.res[k]:itemCount(k);if(!(n>0)||have<n)return{ok:false,reason:`You'd need ${n} ${(RES[k]||ITEMS[k]||k).toLowerCase()}, and the camp has ${Math.floor(have||0)}.`}}
    if(!r.makes||!r.makes.name)return{ok:false,reason:"It doesn't come together."}}
  return r}
