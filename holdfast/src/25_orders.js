// ================= orders: tell someone to do something and they see it through =================
// p.order is what they're doing for you. Every tick it walks them through it with their own hands: go there, get what
// it needs (from the stores, or cut it if there's none), do the work, and say so when it's done.
//   build {bid}  chop {n}  guard {x,z}  inside {bi}  board {bi}  bar {bi}  furn {bi}  unfurn {bi}  fixdoor {bi}
//   fixwin {bi}  door {bi,to}
// p.hold is what they're carrying, p.anim what their hands are doing, p.act the line under their name.
// The player can be given the same orders (you board up the windows yourself), and they run the same way.
const FELL=26,BUCK=14,DEADFALL=30;// minutes of work, at an ordinary pace: felling a tree, cutting a log, finding deadfall
const HEAVY={build:1,chop:1,board:1,bar:1,furn:1,fixdoor:1,fixwin:1,guard:1,push:1,fort:1};
function workEff(p,sk){if(p.id==="you")return 1.15*(useVal("tool")>0?1.15:1);return(.6+(p.sk[sk]||0)*.22+p.tr.diligent*.15)*(.65+p.mood/280)*(p.hp<50?.6:1)*(p.kid?.5:1)*(useVal("tool")>0?1.15:1)}
function orderAct(p){const o=p.order;if(!o)return p.act;return o.txt||({build:"building",chop:"cutting wood",guard:"standing watch",inside:"staying inside",board:"boarding up the windows",bar:"barring the door",furn:"blocking the door",unfurn:"clearing the door",fixdoor:"fixing the door",fixwin:"fixing a window",door:"seeing to the door"})[o.k]||"busy"}
function setTxt(p,t){if(p.order)p.order.txt=t;p.act=t}
// ---------- giving and ending orders ----------
function giveOrder(p,o,quiet){if(p.order)releaseOrder(p);p.order={...o,t0:S.t};if(p.id!=="you"){p.follow=false;p.at=null;p.planUntil=0;p.sleep=false;p.inBed=false}
  p.tx=null;p.tz=null;p.path=null;p.onArrive=null;p.anim=null;p.act=orderAct(p);if(!quiet&&p.id!=="you")log(`${p.name} is ${orderAct(p)}${orderWhat(o)}.`);return p.order}
function orderWhat(o){const b=o.bid&&S.blds.find(x=>x.id===o.bid);if(b)return` (the ${b.name.toLowerCase()})`;if(o.bi!=null&&LOCS[S.player.loc]){const r=layout(S.player.loc).b[o.bi];if(r&&r.barn)return" (the barn)"}return""}
function releaseOrder(p){const o=p.order;if(!o)return;if(o.tree!=null){const ts=treeState(p.loc,o.tree);if(ts.by===p.id)ts.by=null}
  // anything they were carrying goes back in the stores
  if(p.hold){if(p.loc===campK()||!S.camp)S.res[p.hold.k]=(S.res[p.hold.k]||0)+p.hold.n;else if(p.id==="you")gAdd(S.haul,p.hold.k,p.hold.n);p.hold=null}}
function endOrder(p,quiet,line){const nx=p.order&&p.order.queue;releaseOrder(p);p.order=null;p.anim=null;if(line)say(p,line);
  // more to do in the same job ("fortify the house": the door, then the windows)
  if(nx&&nx.length&&p.status!=="dead"){giveOrder(p,{...nx[0],queue:nx.slice(1)},true);return}
  if(p.id!=="you"&&S.camp&&atCamp(p)&&!quiet)planHour(p,hourOf(S.t));else if(p.id!=="you"&&S.camp&&atCamp(p)){p.planUntil=0}}
// will they? Almost always: you're the one in charge. Not a kid on heavy work, not someone who can barely stand.
function willDo(p,k){if(p.id==="you")return{yes:true};
  if(p.status!=="member")return{yes:false,line:"I don't even live here."};
  if(p.kid&&HEAVY[k])return{yes:false,line:pick([`I can't, I'm only ${p.age}.`,"It's too heavy for me.","I'm not big enough for that."]),why:`${p.name} is ${p.age}`};
  if(p.hp<35)return{yes:false,line:"I can barely stand. Give me a day.",why:`${p.name} is badly hurt`};
  if(p.bitten&&p.quarantine)return{yes:false,line:"...",why:`${p.name} is locked away`};
  if(p.trust<12&&rf()<.5)return{yes:false,line:pick(["Do it yourself.","Why should I?","Ask someone else."]),why:`${p.name} doesn't trust you`};
  const T=p.tr;return{yes:true,line:T.temper>.4&&rf()<.5?pick(["Fine. Fine.","Yeah, yeah.","Alright, I heard you."]):T.diligent>.3?pick(["On it.","I'll get it done.","Consider it done."]):T.diligent<-.3?pick(["...Yeah, okay.","Now? Alright.","If I have to."]):pick(["Sure thing.","Okay.","Got it.","I'm on it."])}}
// you tell someone to do something; they answer, and if it's yes they get going
function orderPerson(p,o){if(!p)return false;const r=willDo(p,o.k);if(!r.yes){say(p,r.line,true);if(r.why)log(`${p.name} won't: ${r.why}.`,"warn");return false}
  if(p.follow)p.follow=false;giveOrder(p,o);say(p,r.line,true);p.lastTalk=S.t;return true}
// a job turns into the same kind of order during the working day: woodcutters cut, builders build
function jobOrder(p){if(p.order)return true;if(p.kid)return false;
  if(p.job==="wood"){giveOrder(p,{k:"chop",job:true},true);return true}
  if(p.job==="build"){const bp=campBlds().filter(b=>!b.done).sort((a,b)=>builders(a).length-builders(b).length||dist(a.x,a.z,p.x,p.z)-dist(b.x,b.z,p.x,p.z))[0];if(bp){giveOrder(p,{k:"build",bid:bp.id,job:true},true);return true}}
  return false}
function builders(b){return[S.player,...S.people].filter(p=>p.order&&p.order.k==="build"&&p.order.bid===b.id)}
// ---------- every tick ----------
function ordersTick(dt){for(const p of [S.player,...S.people]){const o=p.order;if(!o)continue;
    if(p.id!=="you"&&(p.status!=="member"||p.follow||p.away&&p.away.out)){if(p.status!=="member"||p.follow){p.order=null;p.anim=null}continue}
    if(!LOCS[p.loc]||o.paused||p.sleep||p.grabbed||p.ko>0||p.pushing||p.flee&&S.t<p.flee)continue;
    if(p.id!=="you"&&o.k!=="guard"&&dangerNear(p)){p.anim=null;if(p.tx!=null&&!bldAt(p.loc,p.x,p.z)){}continue}
    if(o.until&&S.t>o.until){endOrder(p,true);continue}
    const f=ORDERS[o.k];if(!f){p.order=null;continue}f(p,o,dt)}}
// one of the dead close by and coming for them, or just close and awake: work stops until it's dealt with
function dangerNear(p){for(const w of S.walkers){if(w.dead||w.loc!==p.loc)continue;const d=dist(w.x,w.z,p.x,p.z);if(d<5||w.hunt===p.id&&d<11){p.act="keeping clear of one of the dead";return true}}return false}
// walk to a spot: 1 when you're standing there, 0 on the way, -1 if you can't get there
function go(p,x,z,r){r=r||.6;const o=p.order;const d=dist(p.x,p.z,x,z);const same=o.dest&&Math.abs(o.dest.x-x)<.3&&Math.abs(o.dest.z-z)<.3;
  if(d<=r||same&&p.tx==null&&o.reach){if(p.tx!=null&&same){p.tx=null;p.tz=null;p.path=null}return 1}
  if(same&&p.tx!=null)return 0;if(same){o.miss=(o.miss||0)+1;if(o.miss>2)return -1}else o.miss=0;
  o.dest={x,z};o.reach=moveTo(p,x,z);if(p.anim!=="carry")p.anim=null;return 0}
function faceTo(p,x,z){p.dir=Math.atan2(x-p.x,z-p.z)}
function sfxAt(kind,o){if(typeof sfx==="function"&&o.loc===S.player.loc)sfx(kind,o.x,o.z)}
// where the camp keeps things: the storehouse if there is one, otherwise the cupboard inside the house
function storeSpot(p){const sh=campBlds().find(b=>b.done&&b.type==="shed");if(sh)return{x:sh.x,z:sh.z+bSize(sh)[1]/2+.9,n:"the storehouse"};
  const h=homeBld();if(h&&S.camp){const k=S.camp.site;const bi=layout(k).b.indexOf(h);const c=layout(k).conts.find(c=>c.bi===bi);if(c)return{x:c.x-1.1,z:c.z,n:"the cupboard"}}
  const f=bldDone("fire")[0];if(f)return{x:f.x+1.3,z:f.z+1.3,n:"the fire"};return{...campPoint(0,2),n:"camp"}}
// materials: the camp's stores at camp (or before there's a camp, what the group has); away from camp, what you're carrying
function matHave(p,k){if(!S.camp||p.loc===campK())return Math.floor((S.res[k]||0)+1e-6);return gCount(S.haul,k)}
function matTake(p,k,n){n=Math.min(n,matHave(p,k));if(n<=0)return 0;if(!S.camp||p.loc===campK()){S.res[k]-=n;if(typeof syncInv==="function")syncInv();return n}
  let left=n;for(const o of [...S.haul.items]){if(o.k!==k||left<=0)continue;const d=Math.min(o.n,left);o.n-=d;left-=d;if(o.n<=0)S.haul.items.splice(S.haul.items.indexOf(o),1)}return n-left}
// ---------- cutting wood ----------
function treeFor(p,o){const k=p.loc;const L=treesStanding(k).filter(({i})=>{const ts=treeState(k,i);return!ts.by||ts.by===p.id});
  // logs already on the ground come first, then the nearest standing tree
  const P=place(k);const logs=Object.entries(P.trees||{}).filter(([i,ts])=>ts.down&&ts.left>0&&(!ts.by||ts.by===p.id)).map(([i])=>+i);
  const near=(a)=>a.sort((x,y)=>dist(layout(k).trees[x][0],layout(k).trees[x][1],p.x,p.z)-dist(layout(k).trees[y][0],layout(k).trees[y][1],p.x,p.z))[0];
  if(logs.length)return near(logs);return L.length?near(L.map(o=>o.i)):null}
function treeSpot(k,t,p){const a0=Math.atan2(p.x-t[0],p.z-t[1]);const g=grid(k).a;for(let i=0;i<8;i++){const a=a0+(i%2?1:-1)*Math.ceil(i/2)*.7;const x=t[0]+Math.sin(a)*1.15,z=t[1]+Math.cos(a)*1.15;if(!g[gc(z)*GN+gc(x)])return{x,z}}return{x:t[0]+1.1,z:t[1]}}
// one step of cutting: true once they're holding as much wood as they'll carry (or the tree's gone and they have some)
function chopStep(p,o,dt,carry){const k=p.loc;
  if(o.tree!=null){const ts=treeState(k,o.tree);if(ts.down&&ts.left<=0){ts.by=null;o.tree=null}}
  if(o.tree==null&&!o.df){o.tree=treeFor(p,o);o.spot=null;if(o.tree!=null)treeState(k,o.tree).by=p.id;
    else{const a=rf()*6.28;o.df=S.camp&&k===campK()?campPoint(a,S.camp.r+6):{x:clamp(Math.cos(a)*(SH-4),-SH+3,SH-3),z:clamp(Math.sin(a)*(SH-4),-SH+3,SH-3)}}}
  if(o.df){const at=go(p,o.df.x,o.df.z,1.2);if(at===0){setTxt(p,"looking for deadfall");return false}
    p.anim="dig";setTxt(p,"gathering deadfall");o.cut=(o.cut||0)+dt*workEff(p,"build")/DEADFALL;if(o.cut>=1){o.cut=0;p.hold={k:"wood",n:(p.hold?.n||0)+1};o.df=null;return p.hold.n>=carry}return false}
  const t=layout(k).trees[o.tree];const ts=treeState(k,o.tree);if(!o.spot)o.spot=treeSpot(k,t,p);
  const at=go(p,o.spot.x,o.spot.z,.5);if(at===0){p.anim=p.hold?"carry":null;setTxt(p,ts.down?"going to cut up a fallen tree":"going to cut down a tree");return false}
  if(at<0){ts.by=null;o.tree=null;o.spot=null;return false}
  faceTo(p,t[0],t[1]);p.anim="chop";
  if(!ts.down){setTxt(p,"chopping down a tree");ts.cut+=dt*workEff(p,"build")/(FELL*t[2]);o.thock=(o.thock||0)+dt;if(o.thock>1.2){o.thock=0;sfxAt("chop",p)}
    o.loud=(o.loud||0)+dt;if(o.loud>6){o.loud=0;noiseAt(k,p.x,p.z,9,.05)}
    if(ts.cut>=1){ts.down=true;ts.left=treeWood(t);ts.fall=Math.atan2(t[0]-p.x,t[1]-p.z);S.bv++;bumpDecor(k);say(p,pick(["Timber!","Down she goes.","Watch out!"]));sfxAt("fall",p)}return false}
  setTxt(p,"cutting up a fallen tree");o.cut=(o.cut||0)+dt*workEff(p,"build")/BUCK;o.thock=(o.thock||0)+dt;if(o.thock>1.5){o.thock=0;sfxAt("chop",p)}
  if(o.cut>=1){o.cut=0;ts.left--;p.hold={k:"wood",n:(p.hold?.n||0)+1};bumpDecor(k);if(ts.left<=0){ts.by=null;o.tree=null;o.spot=null}return p.hold.n>=carry||o.tree==null}
  return false}
// cut wood and bring it to the stores, until there's enough (or, for the woodcutters, until the day's done)
function orderChop(p,o,dt){
  if(p.hold&&S.camp&&p.loc!==campK()&&(o.haul||o.tree==null&&!o.df&&p.hold.n>0)){const n=p.hold.n;const left=gAdd(S.haul,"wood",n);p.hold=null;p.anim=null;o.haul=false;o.got=(o.got||0)+n-left;if(typeof syncInv==="function")syncInv();
    if(left>0||o.n&&o.got>=o.n){endOrder(p,false,left>0?"Can't carry any more.":pick(["That's plenty.","Got the wood."]));log(`${p.id==="you"?"You":p.name} cut ${o.got} wood${left>0?". The packs are full":" to carry home"}.`);}return}
  if(p.hold&&(o.haul||o.tree==null&&!o.df&&p.hold.n>0)){o.haul=true;const s=storeSpot(p);const at=go(p,s.x,s.z,.8);p.anim="carry";setTxt(p,`carrying wood to ${s.n}`);if(at===0)return;
    S.res.wood=(S.res.wood||0)+p.hold.n;o.got=(o.got||0)+p.hold.n;if(typeof syncInv==="function")syncInv();p.hold=null;p.anim=null;o.haul=false;sfxAt("drop",p);
    if(o.n&&o.got>=o.n){endOrder(p,false,pick(["That's the wood in.","Wood's stacked.","There's your wood."]));log(`${p.id==="you"?"You":p.name} brought in ${o.got} wood.`);return}return}
  if(chopStep(p,o,dt,2))o.haul=true}
// ---------- building ----------
function bNeed(b){return b.need||{}}
function bGot(b,k){return(b.got&&b.got[k])||0}
function bSupplied(b){const N=bNeed(b);let f=1;for(const k in N)f=Math.min(f,bGot(b,k)/N[k]);return f}
// how much of something is still needed once you count what everyone working on it is already carrying or fetching
function bShort(b,k){let n=(bNeed(b)[k]||0)-bGot(b,k);for(const q of builders(b)){if(q.hold&&q.hold.k===k)n-=q.hold.n;if(q.order.claim&&q.order.claim.k===k)n-=q.order.claim.n}return n}
// where to stand to work on it: around the edge, a different spot for each builder
function siteSpot(b,p){const [w,d]=bSize(b);const L=[];for(let x=-w/2+.7;x<=w/2-.6;x+=1.4){L.push([b.x+x,b.z+d/2+.75],[b.x+x,b.z-d/2-.75])}for(let z=-d/2+.7;z<=d/2-.6;z+=1.4){L.push([b.x+w/2+.75,b.z+z],[b.x-w/2-.75,b.z+z])}
  if(!L.length)L.push([b.x,b.z+d/2+.75]);const g=grid(b.loc).a;const ok=L.filter(([x,z])=>Math.abs(x)<SH-1&&Math.abs(z)<SH-1&&!g[gc(z)*GN+gc(x)]);const opts=ok.length?ok:L;
  const B=builders(b).sort((a,c)=>a.id<c.id?-1:1);const i=Math.max(0,B.indexOf(p));opts.sort((a,c)=>dist(a[0],a[1],0,4)-dist(c[0],c[1],0,4));const s=opts[(i*3)%opts.length];return{x:s[0],z:s[1]}}
function orderBuild(p,o,dt){const b=S.blds.find(x=>x.id===o.bid);const who=p.id==="you"?"You":p.name;
  if(!b||b.gone||b.loc!==p.loc){endOrder(p,true);return}
  if(b.done){endOrder(p,false,pick(["It's done.",`The ${b.name.toLowerCase()}'s finished.`,"That's that."]));return}
  const nm=b.name.toLowerCase();
  // carrying something for it: bring it to the site
  if(p.hold){const s=siteSpot(b,p);const at=go(p,s.x,s.z,.6);p.anim="carry";setTxt(p,`carrying ${p.hold.k} to the ${nm}`);if(at===0)return;
    b.got=b.got||{};b.got[p.hold.k]=(b.got[p.hold.k]||0)+p.hold.n;p.hold=null;p.anim=null;o.claim=null;o.chop=null;sfxAt("drop",p);if(typeof onBld==="function")onBld(b);return}
  // fetching from the stores
  if(o.fetch){const s=storeSpot(p);const at=go(p,s.x,s.z,.8);setTxt(p,`getting ${o.fetch} from ${s.n}`);if(at===0)return;
    const n=matTake(p,o.fetch,Math.min(3,Math.max(1,Math.ceil((bNeed(b)[o.fetch]||0)-bGot(b,o.fetch)))));if(n>0)p.hold={k:o.fetch,n};o.fetch=null;o.claim=null;return}
  // cutting wood for it
  if(o.chop){if(chopStep(p,o,dt,Math.min(2,Math.max(1,o.claim?o.claim.n:2)))){o.chop=null}return}
  const hrs=BUILDS[b.type].hrs;
  if(b.prog<hrs*bSupplied(b)-1e-6){const s=siteSpot(b,p);const at=go(p,s.x,s.z,.6);if(at===0){setTxt(p,`heading to the ${nm}`);return}
    faceTo(p,b.x,b.z);p.anim="hammer";const pct=Math.round(b.prog/hrs*100);setTxt(p,`building the ${nm} (${pct}%)`);
    b.prog=Math.min(hrs*bSupplied(b),b.prog+dt/HOUR*workEff(p,"build")*(bldDone("shop").length?1.25:1));o.bang=(o.bang||0)+dt;if(o.bang>1.4){o.bang=0;sfxAt("hammer",p)}
    o.loud=(o.loud||0)+dt;if(o.loud>8){o.loud=0;noiseAt(p.loc,p.x,p.z,10,.05)}
    if(Math.floor(b.prog/hrs*10)!==Math.floor((b.prog-dt/HOUR)/hrs*10)&&typeof onBld==="function")onBld(b);
    if(b.prog>=hrs-1e-6){finishBld(b,p);for(const q of builders(b))endOrder(q,q!==p,q===p?pick(["Done!",`There. The ${nm}'s up.`,"Finished."]):null)}return}
  // not enough here to keep going: go and get what's missing
  const N=bNeed(b);for(const k in N){const short=bShort(b,k);if(short<=0)continue;const n=Math.min(k==="wood"?2:3,Math.ceil(short));
    if(matHave(p,k)>=1){if(p.id==="you"){const got=matTake(p,k,Math.ceil(short));b.got=b.got||{};b.got[k]=bGot(b,k)+got;if(typeof onBld==="function")onBld(b);return}o.fetch=k;o.claim={k,n};return}
    if(k==="wood"){o.chop=true;o.claim={k,n};o.tree=null;o.df=null;setTxt(p,"going to cut wood for the "+nm);return}
    // nothing to be done about it: say so, once, and stop
    if(!o.told){o.told=true;const line=`We're out of ${RES[k].toLowerCase()}. I can't finish the ${nm} without ${short>1?`${Math.ceil(short)} more`:"one more"}.`;say(p,line,true);log(`${who} stopped work on the ${nm}: it needs ${Math.ceil(short)} more ${RES[k].toLowerCase()}, and there's none in the stores.`,"warn")}
    endOrder(p,true);return}
  // others are already bringing what's missing: wait for it at the site
  const s=siteSpot(b,p);if(go(p,s.x,s.z,.6)===1){p.anim=null;setTxt(p,`waiting on materials for the ${nm}`)}}
// ---------- standing watch ----------
function orderGuard(p,o,dt){if(p.hunt&&S.walkers.some(w=>w.id===p.hunt&&!w.dead))return;const at=go(p,o.x,o.z,.7);if(at===0){setTxt(p,"heading to the watch post");return}p.anim="guard";setTxt(p,"standing watch");if(o.face!=null)p.dir=o.face}
// ---------- staying inside ----------
function bldOf(p,o){return LOCS[p.loc]?layout(p.loc).b[o.bi]||null:null}
function orderInside(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}if(!o.spot){const fs=(r.floorSpots||[]).filter(s=>!blockedAt(p.loc,s.x,s.z));o.spot=fs.length?fs[Math.floor(rf()*fs.length)]:{x:r.x,z:r.z}}
  const at=go(p,o.spot.x,o.spot.z,.6);if(at===0){setTxt(p,"heading inside");return}p.anim=null;setTxt(p,"staying inside");if(rf()<dt/40)o.spot=null}
// ---------- doors and windows ----------
// work at a spot for a while, with something in hand: true when it's done
function handWork(p,o,dt,x,z,mins,anim,txt,fx){const at=go(p,x,z,.6);if(at===0){setTxt(p,txt.replace(/^(\w+)ing/,"going to $1"));p.anim=p.hold?"carry":null;return false}if(at<0){o.fail=true;return false}
  faceTo(p,o.fx??x,o.fz??z);p.anim=anim;setTxt(p,txt);o.w=(o.w||0)+dt*workEff(p,"build")/mins;o.bang=(o.bang||0)+dt;if(fx&&o.bang>1.4){o.bang=0;sfxAt(fx,p)}if(o.w>=1){o.w=0;return true}return false}
// get the wood for a job: the player grabs it, anyone else fetches it from the stores first
function needWood(p,o,n){if(p.hold&&p.hold.k==="wood"&&p.hold.n>=n)return true;
  if(p.id==="you"){if(matHave(p,"wood")<n){o.queue=null;if(!o.told){o.told=true;toast(`You need ${n} wood for that${S.camp&&p.loc!==campK()?", and you're not carrying any":""}.`)}endOrder(p,true);return false}matTake(p,"wood",n);p.hold={k:"wood",n};return true}
  if(matHave(p,"wood")<n){o.queue=null;if(!o.told){o.told=true;say(p,"There's no wood. Someone has to cut some first.",true);log(`${p.name} can't: there's no wood in the stores.`,"warn")}endOrder(p,true);return false}
  const s=storeSpot(p);const at=go(p,s.x,s.z,.8);setTxt(p,`getting wood from ${s.n}`);if(at===0)return false;matTake(p,"wood",n);p.hold={k:"wood",n};return false}
function orderBoard(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const k=p.loc;const st=bldState(k,o.bi);const lvl=o.lvl||1;
  const mine=o.wi!=null&&st.wins[o.wi]&&st.wins[o.wi].board<lvl?o.wi:-1;const taken=new Set([S.player,...S.people].filter(q=>q!==p&&q.loc===k&&q.order&&q.order.k==="board"&&q.order.bi===o.bi&&q.order.wi!=null).map(q=>q.order.wi));
  const open=i=>st.wins[i].board<lvl&&!(o.skip&&o.skip.includes(i));let wi=mine>=0?mine:st.wins.findIndex((w,i)=>open(i)&&!taken.has(i));if(wi<0&&st.wins.some((w,i)=>open(i))){o.wi=null;endOrder(p,true,p.id==="you"?null:"They've got the rest.");return}o.wi=wi>=0?wi:null;if(wi<0){endOrder(p,false,p.id==="you"?null:pick(["Windows are boarded.","That's the windows done.","Boarded up tight."]));log(`${p.id==="you"?"You":p.name} boarded up the windows${r.barn?" of the barn":""}.`,"good");return}
  if(!needWood(p,o,1))return;const w=r.wins[wi];const inside=!!bldAt(k,p.x,p.z)||true;const x=inside?w.ix:w.ox,z=inside?w.iz:w.oz;o.fx=w.x;o.fz=w.z;
  if(handWork(p,o,dt,x,z,10,"hammer","boarding up a window","hammer")){st.wins[wi].board++;st.wins[wi].hp=winMax(st.wins[wi]);p.hold=null;S.bv++;bumpDecor(k);noiseAt(k,p.x,p.z,8,.05)}
  if(o.fail){o.skip=(o.skip||[]).concat(wi);o.fail=false;o.dest=null}}
function orderBar(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);if(st.bar>=2){endOrder(p,true,p.id==="you"?null:"It's barred as tight as it'll go.");return}
  if(st.door==="broken"){if(p.id==="you")toast("The door's broken. Fix it first.");endOrder(p,true);return}
  if(!needWood(p,o,2))return;o.fx=r.door.x;o.fz=r.door.z;
  if(handWork(p,o,dt,r.door.ix,r.door.iz,16,"hammer","barring the door","hammer")){st.bar++;st.door="shut";st.dhp=Math.min(doorMax(st),st.dhp+70);p.hold=null;S.bv++;bumpDecor(p.loc);noiseAt(p.loc,p.x,p.z,8,.05);
    log(`${p.id==="you"?"You nail":p.name+" nails"} ${st.bar>1?"another plank":"planks"} across the door${r.barn?" of the barn":""}.`,"good");endOrder(p,true,p.id==="you"?null:"That'll hold them.")}}
function orderFurn(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);if(st.furn){endOrder(p,true);return}o.fx=r.door.x;o.fz=r.door.z;
  if(handWork(p,o,dt,r.door.ix,r.door.iz-.6,5,"push","pushing the dresser against the door","scrape")){st.furn=true;st.door="shut";st.dhp=Math.min(doorMax(st),st.dhp+120);S.bv++;bumpDecor(p.loc);
    log(`${p.id==="you"?"You shove":p.name+" shoves"} the heaviest thing in the room up against the door.`,"good");endOrder(p,true)}}
function orderUnfurn(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);if(!st.furn){endOrder(p,true);return}o.fx=r.door.x;o.fz=r.door.z;
  if(handWork(p,o,dt,r.door.ix,r.door.iz-.6,4,"push","dragging the dresser back from the door","scrape")){st.furn=false;st.dhp=Math.min(st.dhp,doorMax(st));S.bv++;bumpDecor(p.loc);log(`${p.id==="you"?"You drag":p.name+" drags"} the dresser back from the door.`);endOrder(p,true)}}
function orderFixDoor(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);if(st.door!=="broken"&&st.dhp>=doorMax(st)){endOrder(p,true);return}
  if(!needWood(p,o,2))return;o.fx=r.door.x;o.fz=r.door.z;
  if(handWork(p,o,dt,r.door.ix,r.door.iz,20,"hammer","fixing the door","hammer")){st.door="shut";st.dhp=doorMax(st);p.hold=null;S.bv++;bumpDecor(p.loc);log(`${p.id==="you"?"You get":p.name+" gets"} the door back on its hinges.`,"good");endOrder(p,true,p.id==="you"?null:"Door's fixed.")}}
function orderFixWin(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);const wi=st.wins.findIndex(w=>w.broken||w.hp<winMax(w)*.5);
  if(wi<0){endOrder(p,true,p.id==="you"?null:"Windows are sound.");return}if(!needWood(p,o,1))return;const w=r.wins[wi];o.fx=w.x;o.fz=w.z;
  if(handWork(p,o,dt,w.ix,w.iz,10,"hammer","patching a broken window","hammer")){st.wins[wi].broken=false;st.wins[wi].board=Math.max(1,st.wins[wi].board);st.wins[wi].hp=winMax(st.wins[wi]);p.hold=null;S.bv++;bumpDecor(p.loc)}}
function orderDoor(p,o,dt){const r=bldOf(p,o);if(!r){endOrder(p,true);return}const st=bldState(p.loc,o.bi);const inside=!!bldAt(p.loc,p.x,p.z);const x=inside?r.door.ix:r.door.ox,z=inside?r.door.iz:r.door.oz;
  const at=go(p,x,z,.7);if(at===0)return;if(st.door==="broken"){if(p.id==="you")toast("The door's broken. It won't shut until it's fixed.");endOrder(p,true);return}
  st.door=o.to;if(o.to==="open"){st.bar=0;st.furn=false}S.bv++;bumpDecor(p.loc);sfxAt(o.to==="open"?"creak":"thud",p);log(`${p.id==="you"?"You":p.name} ${o.to==="open"?"prop":"shut"}${p.id==="you"?"":"s"} the door${o.to==="open"?" open":""}.`);endOrder(p,true)}
// waiting to help push a car: stand by until the push starts (the push itself moves them), then done when it is
function orderPushHelp(p,o,dt){if(S.push){o.seen=true;return}if(o.seen||S.t-o.t0>25){endOrder(p,true);return}setTxt(p,"waiting to push a car")}
const ORDERS={push:orderPushHelp,build:orderBuild,chop:orderChop,guard:orderGuard,inside:orderInside,board:orderBoard,bar:orderBar,furn:orderFurn,unfurn:orderUnfurn,fixdoor:orderFixDoor,fixwin:orderFixWin,door:orderDoor};
// something about a place's doors, windows, trees or cars changed: the scene redraws those bits
function bumpDecor(k){const P=place(k);P.dv=(P.dv||0)+1}
// ---------- the player's own hands ----------
// you do it yourself: the same orders, run on you. Clicking somewhere else stops it.
function doMyself(o){const pl=S.player;giveOrder(pl,o,true);pl.act=orderAct(pl)}
