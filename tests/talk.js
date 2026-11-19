// Talking to everyone in town with the built-in lines: nobody breaks, nobody sounds older or younger than they are,
// and the Claude prompt carries the age voice and leaves small talk free.
// node tests/talk.js
const fs=require('fs'),vm=require('vm'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(p=>p.endsWith('.js')&&p!=='90_boot.js');
const src=order.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump","bubble"])globalThis[f]=()=>{}');
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:24,look:"average build",mark:"",bg:"Nurse",traits:["Tough","Handy"],story:"I fixed fences.",household:"alone",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average",start:"coma",cause:"crash"});doorsIn();UI.modal=null`);
X('while(S.t<WAKE_AT-1e-6)advance(Math.min(60,WAKE_AT-S.t));comaWake();UI.modal=null');
const MSG=["I love you","hey","How are you holding up?","Who are you?","What did you do before all this?","Where are you from?","What do you miss most?","What's on your mind?","Sleep at all last night?","Tell me about your family.","What scares you most?","What are you hoping for?","What's your favorite food?","How'd you make it this far?","What did I miss?","Need anything?","What grade were you in?","What's your favorite animal?","Want to hear a joke?","Are you hungry?","Heard any news?","you look nice today","thanks","bye","asdf qwerty","what do you think of the dead?","I used to be a nurse"];
const res=JSON.parse(X(`(()=>{const out=[];for(const p of living()){p.x=S.player.x+1;p.z=S.player.z;for(const m of ${JSON.stringify(MSG)}){p.cv=null;const r=respond(p,m);out.push({n:p.name,a:p.age,st:p.style,m,t:r.text,mode:talkMode(r)})}}return JSON.stringify(out)})()`));
const empty=res.filter(r=>!r.t||r.t.length<2);ok(!empty.length,`everyone answers everything (${res.length} lines)`+(empty.length?': '+JSON.stringify(empty.slice(0,3)):''));
const pet=res.filter(r=>r.a<50&&/\b(hon|sweetheart|kiddo|sweetie|dear)\b/i.test(r.t));ok(!pet.length,'nobody under 50 uses pet names'+(pet.length?': '+pet.slice(0,4).map(r=>`${r.n} (${r.a}): ${r.t}`).join(' | '):''));
const grown=res.filter(r=>r.a<18&&/\b(at my age|my wife|my husband|for a living|my kids|back in '|retire|mortgage|Lord tests)\b/i.test(r.t));ok(!grown.length,'kids and teens never sound like grown-ups'+(grown.length?': '+grown.slice(0,4).map(r=>`${r.n} (${r.a}): ${r.t}`).join(' | '):''));
const love=res.filter(r=>r.a<18&&r.m==="I love you");ok(love.every(r=>/creepy|gross|adult|weird|messed up/i.test(r.t)),'a grown-up coming on to a kid or teen gets shut down: '+love.slice(0,2).map(r=>r.t).join(' | '));
const teenF=res.filter(r=>r.a>=13&&r.a<18&&r.m==="you look nice today");ok(teenF.every(r=>/weird|Okay|Why/i.test(r.t)),'a teen finds a compliment on their looks from an adult weird: '+teenF.slice(0,1).map(r=>r.t).join(''));
const modes={};for(const r of res)modes[r.mode]=(modes[r.mode]||0)+1;ok(modes.free>res.length*.4,'most small talk is left free for Claude: '+JSON.stringify(modes));
for(const a of [6,15,22,40,58,72]){const r=res.find(x=>Math.abs(x.a-a)<=3&&x.m==="How are you holding up?");if(r)console.log(`    ${r.n}, ${r.a} (${r.st}): "${r.t}"`)}
const pr=X(`(()=>{const p=living().find(p=>p.age>=13&&p.age<18);const r=respond(p,"hey what's up");return aiPrompt(p,"hey what's up",r)})()`);
ok(/a teenager/.test(pr)&&/NOTHING IS DECIDED/.test(pr)&&/FEEL:/.test(pr),'the Claude prompt has the teen voice and leaves small talk open');
const pr2=X(`(()=>{const p=living().find(p=>p.age>=25&&!p.group);const r=respond(p,"come with me");return [talkMode(r),aiPrompt(p,"come with me",r)]})()`);
ok(pr2[0]==="decided"&&/the reply must match it/.test(pr2[1]),'asking someone to come along is still decided by the game');
const P1=X('JSON.stringify(aiParse("SAY: Huh. A nurse? *leans in* Then you can look at my hand.\\nFEEL: 2\\nNOTE: Dana used to be a nurse.\\nEND: no"))');const pa=JSON.parse(P1);
ok(pa.say.startsWith("Huh. A nurse?")&&pa.feel===2&&pa.note==="Dana used to be a nurse."&&!pa.end,'reads what Claude wrote: '+P1);
console.log(fails?`${fails} failed`:'all passed');process.exitCode=fails?1:0;
