// The coma start with no screen: the week you sleep through, the room you wake in, and what's waiting at home.
// node tests/coma.js [household] [cause]
const fs=require('fs'),vm=require('vm'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(p=>p.endsWith('.js')&&p!=='90_boot.js');
const src=order.map(p=>fs.readFileSync(path.join(__dirname,'../src',p),'utf8')).join('\n').replace(/^<script>/m,'');
const ctx={console,Math,JSON,Date,setTimeout,clearTimeout,document:{getElementById:()=>null,addEventListener(){},createElement:()=>({})},window:{},localStorage:{getItem:()=>null,setItem(){},removeItem(){}},addEventListener(){},matchMedia:()=>({matches:false}),performance:{now:()=>Date.now()}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(src+'\n;globalThis.__x=(e)=>eval(e);',ctx);const X=ctx.__x;
X('for(const f of ["render","renderTalk","renderTalkLog","hud","toast","markUI","markHud","renderBar","renderLog","renderPanel","renderModal","drawBigMap","addCorpse","syncSites","syncPiles","afterJump"])globalThis[f]=()=>{}');
let fails=0;const ok=(c,m)=>{console.log((c?'  ok   ':'  FAIL ')+m);if(!c)fails++};
const hh=process.argv[2]||"partner",cause=process.argv[3]||"crash";
X(`buildInteriors();buildCollision();newWorld({name:"Dana Reyes",pron:"she/her",sex:"F",age:30,look:"average build",mark:"",bg:"Nurse",traits:["Tough","Handy"],story:"I fixed fences.",household:"${hh}",hair:"brown",skin:"#c99873",hairStyle:"hLong",beard:false,build:"average",start:"coma",cause:"${cause}"});journal("Before all this: I fixed fences.","");doorsIn();UI.modal=null`);
console.log(`coma start, living with: ${hh}, cause: ${cause}`);
ok(X('S.player.coma===true'),'you start in a coma');ok(X('bldAt(S.player.x,S.player.z)===BMAP.clinic'),'in the hospital');ok(X('S.journal.length')===1,'no day-one journal yet');
// the week, in the same hour steps the page uses
const t0=Date.now();let hours=0;
try{while(X('S.t<WAKE_AT-1e-6')){X('advance(Math.min(60,WAKE_AT-S.t))');hours++}}catch(e){console.log('CRASH at',X('stamp(S.t)'),e.stack.split('\n').slice(0,6).join('\n'));process.exit(1)}
const secs=(Date.now()-t0)/1000;console.log(`  slept ${hours} hours of town in ${secs.toFixed(1)}s`);
ok(X('stamp(S.t)').startsWith('Day 8'),'it is day 8: '+X('stamp(S.t)'));ok(X('S.player.hp')===100&&X('S.player.food')===75,'nothing drained you while you slept');
console.log(X(`(()=>{const st={};for(const p of S.people)if(!p.alive)st[p.status]=(st[p.status]||0)+1;return "  town: alive "+living().length+" "+JSON.stringify(st)+", dead walking "+S.zeds.length+", groups "+Object.values(S.groups).filter(g=>!g.dead&&groupSize(g.id)>0).map(g=>g.name+"("+groupSize(g.id)+")").join(" ")})()`));
X('comaWake()');
ok(!X('S.player.coma')&&X('S.flags.wake')===X('S.t'),'awake, and the time is marked');
ok(X('roomAt(S.player.x,S.player.z)?.b===BMAP.clinic&&BMAP.clinic.rooms[roomAt(S.player.x,S.player.z).ri].t==="patient"'),'standing in the patient room');
ok(X('free(S.player.x,S.player.z,.3,"pl")'),'not stuck in the bed or a wall');
ok(X('(()=>{const b=BMAP.clinic;const ri=b.rooms.findIndex(r=>r.t==="patient");const D=b.doors.find(d=>!d.ext&&d.dw.r.includes(ri));return D&&!D.open&&!doorLocked(D)})()'),'the door is shut and opens from your side');
const zs=X('S.zeds.filter(z=>dist(z.x,z.z,BMAP.clinic.x,BMAP.clinic.z)<16).map(z=>({hp:z.hp,weak:!!z.weak,room:BMAP.clinic.rooms[roomAt(z.x,z.z)?.ri]?.t}))');
ok(zs.length===1&&zs[0].weak&&zs[0].room==="waiting",'one weak one in the waiting room: '+JSON.stringify(zs));
X('globalThis.TWB=JSON.stringify(body())');let bites=0;for(let i=0;i<300;i++){X('S.player.bitten=null');const r=X('zedWound(S.zeds.find(z=>z.weak)).bite');if(r)bites++}X('S.player.body=JSON.parse(TWB)');ok(bites===0,'it can scratch but not bite');
const pile=X('S.piles.find(p=>p.n==="Your things")');ok(!!pile,'your things are by the bed');
ok(pile&&X(`S.piles.find(p=>p.n==="Your things").c.items.map(g=>g.id).sort().join(",")`).includes('belongings'),'the bag is there: '+X(`S.piles.find(p=>p.n==="Your things").c.items.map(g=>g.id+(g.c?"["+g.c.items.map(o=>o.id+"x"+o.n).join(" ")+"]":"")).join(", ")`));
ok(X('contName(S.piles.find(p=>p.n==="Your things").id)')==="Your things",'the pile goes by its name');
console.log('  '+X('wounds().map(w=>woundName(w)+" @"+w.at+": "+woundStatus(w).join("; ")).join("\\n  ")'));
ok(X('wounds().length')>=1&&X('bleedTotal()')===0,'old injuries, none bleeding');ok(X('S.player.hp')===58&&X('S.player.water')===22,'weak and thirsty');
ok(X('S.journal.length')===2&&X('S.journal[1].x').startsWith('Before all this'),'journal: the wake entry plus your story');console.log('  '+X('S.journal[0].x'));
ok(X('UI.modal&&UI.modal.type')==="wake",'the wake scene opens');
ok(X('wakeHtml()').includes('MARISOL'),'Marisol left the note');
const fam=X('Object.keys(S.player.fam).map(id=>{const q=P(id);return q.name+" "+(q.alive?(q.group?"in "+G(q.group).name:"alive"):q.status)+(q.carer?" (with "+P(q.carer).name+")":"")}).join(", ")');
console.log('  household: '+(fam||'nobody'));
const note=X('S.flags.homeNote');console.log(note?'  note from '+note.who+': '+note.text.replace(/\n+/g,' / '):'  no note at home');
if(hh!=="alone")ok(X('Object.keys(S.player.fam).every(id=>!pKnown(P(id)))'),'you don\'t know yet where your people are');
ok(X('S.people.filter(p=>p.met).every(p=>!pKnown(p)||isFollower(p))'),'nobody you knew is "seen" yet');
// the next couple of days run as usual
try{for(let m=0;m<36*60;m++){X('{const pl=S.player;pl.hp=Math.max(pl.hp,60);pl.food=Math.max(pl.food,60);pl.water=Math.max(pl.water,60);pl.bitten=null;advance(1);if(UI.modal){if(UI.modal.type==="event")choose(0);UI.modal=null}}');if(m%2===0)X('moveNPCs(1/3);moveZeds(1/3);companions(1/3)')}}
catch(e){console.log('CRASH after waking at',X('stamp(S.t)'),e.stack.split('\n').slice(0,6).join('\n'));process.exit(1)}
ok(true,'ran on to '+X('stamp(S.t)')+' without trouble');
const save=X('JSON.stringify(S)');ok(JSON.parse(save).v===4,'saves as version 4 ('+Math.round(save.length/1024)+' KB)');
console.log(fails?`${fails} failed`:'all passed');process.exitCode=fails?1:0;
