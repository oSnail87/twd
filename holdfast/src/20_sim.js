// ================= the world state =================
const SAVE_KEY="holdfast.save.v1";const OLD_KEYS=["twd.save.v4","twd.save.v3"];
let S=null;
function save(){if(!S)return;try{localStorage.setItem(SAVE_KEY,JSON.stringify(S))}catch(e){}}
function loadSave(){try{const r=localStorage.getItem(SAVE_KEY);if(!r)return null;const s=JSON.parse(r);return s&&s.v===1?s:null}catch(e){return null}}
function wipeSave(){try{localStorage.removeItem(SAVE_KEY)}catch(e){}}
function hadOldSave(){try{return OLD_KEYS.some(k=>localStorage.getItem(k))}catch(e){return false}}
const P=id=>id==="you"?S.player:S.people.find(p=>p.id===id);
const nid=pre=>pre+(S.nid++);
const members=()=>S.people.filter(p=>p.status==="member");
const campK=()=>S.camp?S.camp.site:null;
// at camp right now, not off on a run or travelling with you
const atCamp=p=>p.loc===campK()&&!p.away;
const here=()=>members().filter(atCamp);
const withYou=()=>S.people.filter(p=>p.status==="member"&&p.loc===S.player.loc&&p.follow);
function log(x,kind){S.log.push({t:S.t,x,k:kind||""});if(S.log.length>250)S.log.shift();if(typeof onLog==="function")onLog(x,kind)}
function mem(p,x,v){p.mem.push({d:dayOf(S.t),x,v:v||0});if(p.mem.length>24)p.mem.shift()}
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function srng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// ================= people =================
function rollTraits(){const o={};for(const k in TRAITS)o[k]=Math.round((rf()*2-1)*100)/100;return o}
function mkPerson(o){o=o||{};const sex=o.sex||(rf()<.5?"F":"M");const age=o.age??ri(19,66);const kid=age<15;
  const job0=o.job0||(kid?null:pick(Object.keys(JOBS_BEFORE)));const sk={farm:0,build:0,fight:0,scav:0,med:0,cook:0};
  if(job0)for(const [k,v] of Object.entries(JOBS_BEFORE[job0].sk))sk[k]=v;if(!kid){const extra=pick(Object.keys(sk));sk[extra]=Math.min(3,sk[extra]+1)}
  let nm0=o.name;if(!nm0){const used=new Set([S.player?.name,...S.people.filter(q=>q.status!=="dead").map(q=>q.name)]);for(let i=0;i<12&&(!nm0||used.has(nm0));i++)nm0=pick((kid?KNAME:FNAME)[sex])}
  const p={id:nid("p"),name:nm0,sur:o.sur||pick(SURN),sex,age,kid,job0,sk,tr:o.tr||rollTraits(),
    motive:o.motive||(kid?pick(["family","belonging"]):pick(Object.keys(MOTIVES))),quirk:pick(QUIRKS),hope:pick(HOPES),fear:pick(FEARS),
    cond:rf()<(kid?.08:.14)?pick(Object.keys(CONDS)):null,
    look:{skin:pick(LOOK.skin),hair:age>60?"#b8b6b0":pick(LOOK.hair),top:pick(LOOK.top),pants:pick(LOOK.pants),long:sex==="F"&&rf()<.7,hat:rf()<.15?pick(["#8a3a32","#2f3e58","#c8b890"]):null},
    fam:{},status:o.status||"stranger",loc:o.loc||"start",x:o.x??0,z:o.z??0,tx:null,tz:null,path:null,act:"",job:null,leads:null,hp:100,sick:0,mood:55,trust:o.trust??30,follow:false,away:null,mem:[],chat:[],asked:{},bitten:false,lastTalk:0};
  if(kid){p.tr.diligent=Math.min(p.tr.diligent,.3);p.tr.temper=Math.min(p.tr.temper,.4)}
  if(p.motive==="family")p.tr.kind=Math.max(p.tr.kind,.2);
  // they bring a few doses of whatever keeps them alive
  if(p.cond){const it=CONDS[p.cond].item;p.carry={[it]:it==="heartpills"?20:it==="epipen"?1:ri(2,4)}}
  return p}
const REL={parentF:"mother",parentM:"father",kidF:"daughter",kidM:"son",spouseF:"wife",spouseM:"husband",sibF:"sister",sibM:"brother",gpF:"grandmother",gpM:"grandfather",gkF:"granddaughter",gkM:"grandson"};
function link(a,b,ab,ba){a.fam[b.id]=REL[ab+b.sex];b.fam[a.id]=REL[ba+a.sex]}
// a household that turns up together
function mkHousehold(kind,loc,at){const L=[];const sur=pick(SURN);const pos=()=>({loc,x:at.x+rf()*3-1.5,z:at.z+rf()*3-1.5});
  kind=kind||pick(["single","single","parentkid","couple","siblings","gp","couplekid","single"]);
  if(kind==="single")L.push(mkPerson({sur,...pos()}));
  if(kind==="parentkid"||kind==="couplekid"){const a=mkPerson({sur,age:ri(28,46),motive:"family",...pos()});const k=mkPerson({sur,age:ri(6,14),...pos()});link(a,k,"parent","kid");L.push(a,k);
    if(kind==="couplekid"){const b=mkPerson({sur,age:clamp(a.age+ri(-4,4),24,50),sex:a.sex==="F"?"M":"F",...pos()});link(a,b,"spouse","spouse");link(b,k,"parent","kid");L.push(b)}}
  if(kind==="couple"){const a=mkPerson({sur,age:ri(22,60),...pos()});const b=mkPerson({sur,age:clamp(a.age+ri(-5,5),20,70),sex:a.sex==="F"?"M":"F",...pos()});link(a,b,"spouse","spouse");L.push(a,b)}
  if(kind==="siblings"){const a=mkPerson({sur,age:ri(17,34),...pos()});const b=mkPerson({sur,age:clamp(a.age+ri(-6,6),15,40),...pos()});link(a,b,"sib","sib");L.push(a,b)}
  if(kind==="gp"){const a=mkPerson({sur,age:ri(60,74),motive:"family",...pos()});const k=mkPerson({sur,age:ri(9,16),...pos()});link(a,k,"gp","gk");L.push(a,k)}
  return L}
function famOf(p){return Object.keys(p.fam).map(P).filter(q=>q&&q.status!=="dead")}
function famHere(p){return famOf(p).filter(q=>q.status===p.status&&q.loc===p.loc&&!q.away)}
function kidsOf(p){return famOf(p).filter(q=>q.kid&&/daughter|son|grand/.test(p.fam[q.id]))}
function traitWords(p){const L=[];for(const [k,[hi,lo]] of Object.entries(TRAITS)){const v=p.tr[k];if(v>.4)L.push(hi);else if(v<-.4)L.push(lo)}return L}
function bestSkill(p){let b=null;for(const k in p.sk)if(p.sk[k]>=2&&(!b||p.sk[k]>p.sk[b]))b=k;return b}
function pronoun(p,c){const F=p.sex==="F";return({s:F?"she":"he",o:F?"her":"him",p:F?"her":"his",S:F?"She":"He"})[c||"s"]}

// ================= places and what's in them =================
const ENTRY={x:0,z:SH-2};
function place(k){S.places[k]=S.places[k]||{seen:false,conts:{},burned:false,cleared:0};return S.places[k]}
// the layout of a place never changes: the same seed draws the same scene every time
const LAYOUT={};
function layout(k){if(LAYOUT[k])return LAYOUT[k];const L=LOCS[k];const T=SCENES[L.kind];const R=srng(hashStr(k));const o={b:[],conts:[],trees:[],cars:[],blk:[]};
  const addB=(b,tag)=>{if(!b)return;const r={x:b.at[0],z:b.at[1],w:b.w,d:b.d,h:b.h,c:b.c||L.col||"#8a8478",roof:b.roof,flat:!!b.flat,steeple:!!b.steeple,tag};o.b.push(r);o.blk.push([r.x-r.w/2,r.z-r.d/2,r.x+r.w/2,r.z+r.d/2])};
  addB(T.b,"main");addB(T.b2,"b2");
  const kinds=SCENE_CONTS[k]||T.conts;const main=o.b[0];let ci=0;
  for(const ck of kinds){let x,z;
    if(ck==="car"){x=(R()*2-1)*14;z=8+R()*10;if(k==="start"){x=-20+ci*9+R()*2;z=4+R()*6}o.cars.push({x,z,rot:R()*.6-.3+(R()<.5?0:Math.PI),c:pick2(["#7a2a22","#2a3a5a","#c8c8c0","#3a3a3a","#5a6a4a","#8a7a5a"],R)});o.blk.push([x-1.2,z-2.2,x+1.2,z+2.2])}
    else if(ck==="barn"&&o.b[1]){x=o.b[1].x;z=o.b[1].z+o.b[1].d/2+.9}
    else if(ck==="shed"){x=pick2([-18,18,-14,14],R);z=-2+R()*8;o.blk.push([x-1.6,z-1.6,x+1.6,z+1.6])}
    else if(main){const slots=Math.max(1,kinds.filter(c=>c!=="car"&&c!=="barn"&&c!=="shed").length);const i=o.conts.filter(c=>c.vis==="door").length;x=main.x-main.w/2+(i+.5)*main.w/slots;z=main.z+main.d/2+.9}
    else{x=R()*20-10;z=R()*10}
    o.conts.push({id:k+":"+ci,k:ck,x,z,vis:ck==="car"?"car":ck==="shed"?"shed":ck==="barn"?"door":"door"});ci++}
  const nt=Math.round(30*(T.tree||.5));for(let i=0;i<nt;i++){let x,z,t=0;do{x=(R()*2-1)*(SH+4);z=(R()*2-1)*(SH+4);t++}while(t<20&&(Math.abs(x)<SH-6&&Math.abs(z)<SH-6||Math.abs(x)<4));o.trees.push([x,z,.8+R()*.7])}
  // a few trees inside the scene too, away from buildings and the road
  for(let i=0;i<Math.round(6*(T.tree||.5));i++){const x=(R()*2-1)*(SH-4),z=(R()*2-1)*(SH-4);if(Math.abs(x)<5)continue;if(o.blk.some(b=>x>b[0]-3&&x<b[2]+3&&z>b[1]-3&&z<b[3]+3))continue;o.trees.push([x,z,.7+R()*.6]);o.blk.push([x-.5,z-.5,x+.5,z+.5])}
  o.fields=!!T.fields;o.water=!!T.water;o.fence=!!T.fence;o.lot=!!T.lot;o.field=!!T.field;o.canopy=!!T.canopy;
  return LAYOUT[k]=o}
function pick2(a,R){return a[Math.floor(R()*a.length)]}
function contState(loc,cid){const pl=place(loc);let s=pl.conts[cid];if(!s){const ck=layout(loc).conts.find(c=>c.id===cid)?.k||"shelf";const T=CONT[ck];s=pl.conts[cid]={c:{g:[...T.g],items:[],u:1},rolled:false}}return s}
function rollCont(loc,cid){const s=contState(loc,cid);if(s.rolled)return s;s.rolled=true;const ck=layout(loc).conts.find(c=>c.id===cid)?.k||"shelf";const d=dayOf(S.t);
  const picked=Math.min(.6,(d-1)*.03);for(const [key,ch,mn=1,mx=1] of CONT[ck].loot){if(rf()<ch*(1-picked)){const k=key.replace(/^i:/,"");gAdd(s.c,k,ri(mn,mx))}}return s}

// ================= getting around a scene =================
// a coarse walk grid per place, so people go around buildings instead of through them
const GRID={};const GN=2*(SH+6);
function blockers(loc){const L=layout(loc).blk.slice();for(const b of S.blds)if(b.loc===loc&&b.done&&BUILDS[b.type].solid){const [w,d]=bSize(b);L.push([b.x-w/2,b.z-d/2,b.x+w/2,b.z+d/2])}return L}
function bSize(b){const s=BUILDS[b.type].size;return b.rot%2?[s[1],s[0]]:[s[0],s[1]]}
function grid(loc){let g=GRID[loc];if(g&&g.v===S.bv)return g;g={v:S.bv,a:new Uint8Array(GN*GN)};for(const [x0,z0,x1,z1] of blockers(loc)){for(let i=Math.floor(x0+SH+6-.4);i<=Math.floor(x1+SH+6+.4);i++)for(let j=Math.floor(z0+SH+6-.4);j<=Math.floor(z1+SH+6+.4);j++)if(i>=0&&j>=0&&i<GN&&j<GN)g.a[j*GN+i]=1}return GRID[loc]=g}
const gc=v=>clamp(Math.floor(v+SH+6),0,GN-1);
function blockedAt(loc,x,z){return grid(loc).a[gc(z)*GN+gc(x)]===1}
function clearLine(loc,x0,z0,x1,z1){const g=grid(loc);const n=Math.ceil(dist(x0,z0,x1,z1)/.45);for(let i=1;i<n;i++){const x=lerp(x0,x1,i/n),z=lerp(z0,z1,i/n);if(g.a[gc(z)*GN+gc(x)])return false}return true}
function findPath(loc,x0,z0,x1,z1){if(clearLine(loc,x0,z0,x1,z1))return[[x1,z1]];const g=grid(loc).a;const s=gc(z0)*GN+gc(x0);let t=gc(z1)*GN+gc(x1);
  if(g[t]){// the goal is inside something: stop at its edge
    let best=null,bd=1e9;for(let dj=-4;dj<=4;dj++)for(let di=-4;di<=4;di++){const i=gc(x1)+di,j=gc(z1)+dj;if(i<0||j<0||i>=GN||j>=GN||g[j*GN+i])continue;const d=di*di+dj*dj;if(d<bd){bd=d;best=j*GN+i}}if(best==null)return[[x1,z1]];t=best}
  const H=new Float32Array(GN*GN).fill(1e9),from=new Int32Array(GN*GN).fill(-1);const open=[[0,s]];H[s]=0;const tx=t%GN,tz=Math.floor(t/GN);let n=0;
  while(open.length&&n<6000){n++;let bi=0;for(let i=1;i<open.length;i++)if(open[i][0]<open[bi][0])bi=i;const [,c]=open.splice(bi,1)[0];if(c===t)break;const cx=c%GN,cz=Math.floor(c/GN);
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=GN||nz>=GN)continue;const ni=nz*GN+nx;if(g[ni]&&ni!==t)continue;if(dx&&dz&&(g[cz*GN+nx]||g[nz*GN+cx]))continue;
      const ng=H[c]+(dx&&dz?1.414:1);if(ng<H[ni]){H[ni]=ng;from[ni]=c;open.push([ng+Math.hypot(nx-tx,nz-tz),ni])}}}
  if(from[t]<0)return[[x1,z1]];const pts=[];let c=t;while(c!==s&&c>=0){pts.push([c%GN-SH-6+.5,Math.floor(c/GN)-SH-6+.5]);c=from[c]}pts.reverse();
  // smooth: skip any corner you can see past
  const out=[];let cx=x0,cz=z0,i=0;while(i<pts.length){let j=pts.length-1;while(j>i&&!clearLine(loc,cx,cz,pts[j][0],pts[j][1]))j--;out.push(pts[j]);cx=pts[j][0];cz=pts[j][1];i=j+1}
  if(!g[gc(z1)*GN+gc(x1)])out.push([x1,z1]);return out}
function moveTo(o,x,z,cb){x=clamp(x,-SH+1,SH-1);z=clamp(z,-SH+1,SH-1);o.path=LOCS[o.loc]?findPath(o.loc,o.x,o.z,x,z):[[x,z]];const f=o.path.shift();o.tx=f[0];o.tz=f[1];o.onArrive=cb||null}

// ================= a new game =================
function newGame(pl){S={v:1,t:7*HOUR+40,nid:1,bv:1,camp:null,res:{food:10,water:10,wood:5,scrap:3,meds:1,ammo:4},items:{rope:2,cloth:2,tape:1,knife:1,bottle:2,tin:1},crafted:[],
    people:[],blds:[],walkers:[],log:[],cards:[],rival:null,flags:{},stats:{deaths:0,joined:0},nextStranger:0,today:{},places:{},haul:{g:[6,3],items:[],u:1},storeLog:[],
    player:{id:"you",name:pl.name||"Alex",sex:pl.sex||"M",look:pl.look,loc:"start",x:2,z:12,tx:null,tz:null,path:null,hp:100,ko:0}};
  place("start").seen=true;
  // the people stuck at the pileup with you
  const h1=mkHousehold("parentkid","start",{x:-2,z:10});const h2=mkHousehold("single","start",{x:5,z:9});
  for(const p of [...h1,...h2]){p.status="member";p.trust=45+ri(0,15);p.mood=45;p.follow=true;S.people.push(p)}
  topUpWalkers("start");
  log(`Day 1. The pileup on Route 9 isn't moving, and the radio keeps saying stay indoors. ${listAnd(S.people.map(p=>p.name))} are stuck here with you.`);
  log("Open the map (M) and pick somewhere to make camp. Search the cars first, if you like.","hint");
  return S}

// ================= the camp =================
function campHere(){const k=S.player.loc;const L=LOCS[k];if(!L||L.camp===false)return false;if(S.rival&&S.rival.site===k&&!S.rival.gone)return false;
  S.camp={site:k,r:17,n:L.n,day:dayOf(S.t)};const f=addBld("fire",3,4,{done:true,name:"Campfire"});
  for(const p of S.people)if(p.status==="member"&&p.loc===k){p.follow=false;p.away=null}
  log(`You make camp at ${L.n}.`,"big");S.nextStranger=S.t+ri(16,26)*HOUR;unloadHaul();
  for(const p of members()){mem(p,`We made camp at ${L.n}.`,2);bringCarry(p)}
  syncInv();return true}
function bringCarry(p){if(!p.carry)return;for(const [k,n] of Object.entries(p.carry))S.items[k]=(S.items[k]||0)+n;p.carry=null}
function addBld(type,x,z,o){o=o||{};const B=BUILDS[type];const b={id:nid("b"),type,loc:o.loc||S.player.loc,x,z,rot:o.rot||0,done:!!o.done,prog:o.done?B.hrs:0,opt:o.opt||{},name:o.name||B.n,grow:0,hp:100};
  S.blds.push(b);S.bv++;if(typeof onBld==="function")onBld(b);return b}
function campBlds(){return S.camp?S.blds.filter(b=>b.loc===S.camp.site):[]}
function bldDone(type){return campBlds().filter(b=>b.done&&b.type===type)}
function bedsTotal(){if(!S.camp)return 0;return(SITES[S.camp.site].beds||0)+campBlds().filter(b=>b.done).reduce((a,b)=>a+(BUILDS[b.type].beds||0),0)}
function canAfford(cost){return Object.entries(cost).every(([k,v])=>(S.res[k]||0)>=v)}
function pay(cost){for(const [k,v] of Object.entries(cost))S.res[k]-=v;syncInv()}
function costWords(c){return Object.entries(c).map(([k,v])=>`${v} ${RES[k].toLowerCase()}`).join(", ")}
function defense(){if(!S.camp)return 0;const s=SITES[S.camp.site];const g=here().filter(p=>p.job==="guard"&&!p.kid);
  return Math.round(s.def*3+g.reduce((a,p)=>a+1.5+p.sk.fight*.8,0)+bldDone("tower").length*2.5*(g.length?1:.4)+bldDone("fence").length*1+useVal("defense")*1.2+Math.min(3,S.res.ammo/5))}
function useVal(u){return S.crafted.filter(c=>c.use===u).reduce((a,c)=>a+(c.v||1),0)+(S.inv?S.inv.items.filter(o=>!o.k.startsWith("c:")&&ITEM_USE[o.k]===u).length*.5:0)}
function campPoint(ang,r){return{x:clamp(Math.cos(ang)*r,-SH+2,SH-2),z:clamp(4+Math.sin(ang)*r,-SH+2,SH-2)}}
function inCamp(x,z){return S.camp&&dist(x,z,0,4)<S.camp.r+3}
function campSize(){return members().length+1}

// ================= time =================
const MOVE=.36;// units per game minute, walking
function step(dt){if(!S)return;const t0=S.t;S.t+=dt;moveAll(dt);
  if(Math.floor(S.t/HOUR)!==Math.floor(t0/HOUR))hourly()}
function mv(o,s){if(o.tx==null)return;const d=dist(o.x,o.z,o.tx,o.tz);if(d<=s){o.x=o.tx;o.z=o.tz;
    if(o.path&&o.path.length){const n=o.path.shift();o.tx=n[0];o.tz=n[1];return}o.tx=null;o.tz=null;o.path=null;if(o.onArrive){const f=o.onArrive;o.onArrive=null;f()}return}
  o.x+=(o.tx-o.x)/d*s;o.z+=(o.tz-o.z)/d*s;o.dir=Math.atan2(o.tx-o.x,o.tz-o.z)}
function moveAll(dt){const sp=MOVE*dt;const pl=S.player;if(pl.ko<=0&&LOCS[pl.loc])mv(pl,sp*1.15);
  const fol=withYou();
  for(const p of S.people){if(p.status==="dead"||p.status==="left")continue;
    if(p.follow&&p.loc===pl.loc&&LOCS[p.loc]&&pl.ko<=0&&!p.busy){const d=dist(p.x,p.z,pl.x,pl.z);if(d>3&&(p.tx==null||dist(p.tx,p.tz,pl.x,pl.z)>3)){const i=fol.indexOf(p);const a=(pl.dir||0)+Math.PI+(i-(fol.length-1)/2)*.55;moveTo(p,pl.x+Math.sin(a)*1.9,pl.z+Math.cos(a)*1.9)}}
    mv(p,sp*(p.hp<40?.6:1)*(p.kid?.95:1))}
  for(const w of S.walkers){if(w.dead)continue;mv(w,sp*.3);
    if(w.cool)w.cool=Math.max(0,w.cool-dt);
    const tgt=nearestLiving(w.loc,w.x,w.z,9);if(tgt&&!w.cool){if(!w.tx||dist(w.tx,w.tz,tgt.x,tgt.z)>1.5){w.path=null;w.tx=tgt.x;w.tz=tgt.z}if(dist(w.x,w.z,tgt.x,tgt.z)<1.1)clash(tgt,w)}}
  // guards step out to meet anything that comes close to camp
  if(S.camp)for(const g of here()){if(g.job!=="guard"||g.sleep&&rf()<.9||g.busy)continue;const w=S.walkers.find(w=>!w.dead&&w.loc===S.camp.site&&dist(w.x,w.z,0,4)<S.camp.r+9&&dist(w.x,w.z,g.x,g.z)<20);
    if(w&&(g.tx==null||g.hunt!==w.id)){g.hunt=w.id;g.tx=w.x;g.tz=w.z;g.path=null;g.act="going after one of the dead"}}}
function nearestLiving(loc,x,z,r){let b=null,bd=r;const pl=S.player;if(pl.ko<=0&&pl.loc===loc&&!S.flags.traveling){const d=dist(x,z,pl.x,pl.z);if(d<bd){b=pl;bd=d}}
  for(const p of S.people){if(p.loc!==loc||p.status==="dead"||p.status==="left"||p.away&&p.away.out||p.sleep&&p.inside)continue;const d=dist(x,z,p.x,p.z);if(d<bd){b=p;bd=d}}return b}

// ================= the dead =================
function spawnWalker(loc,x,z){if(x==null){const e=rf()*4|0;const t=rf()*2-1;const E=SH-1;[x,z]=[[t*E,-E],[E,t*E],[t*E,E],[-E,t*E]][e]}
  const w={id:nid("w"),loc,x,z,tx:null,tz:null,path:null,cool:0,look:{skin:pick(["#8a9a7a","#9aa08a","#7a8a6a","#a0a890"]),top:pick(LOOK.top),pants:pick(LOOK.pants)}};S.walkers.push(w);return w}
function walkersAt(loc){return S.walkers.filter(w=>w.loc===loc&&!w.dead)}
// when you arrive somewhere, the dead that live there are waiting
function topUpWalkers(loc){if(loc===campK())return;const L=LOCS[loc];const pl=place(loc);const d=dayOf(S.t);
  const want=Math.round((L.danger||1)*(1.6+d*.18)*(pl.burned?.4:1)*(S.t-pl.cleared<DAY*2?.3:1));const have=walkersAt(loc).length;
  for(let i=have;i<want;i++){let x,z,t=0;do{x=(rf()*2-1)*(SH-4);z=(rf()*2-1)*(SH-6)-4;t++}while(t<20&&(blockedAt(loc,x,z)||dist(x,z,ENTRY.x,ENTRY.z)<14));spawnWalker(loc,x,z)}}
function walkerHour(){S.walkers=S.walkers.filter(w=>!w.dead||S.t-w.diedAt<DAY/2);
  // places you're not at forget their dead until you come back
  S.walkers=S.walkers.filter(w=>w.loc===S.player.loc||w.loc===campK());
  if(S.camp){const live=walkersAt(S.camp.site);const n=campSize();const s=SITES[S.camp.site];const d=dayOf(S.t);
    // a bigger camp makes more noise and draws more of them
    const rate=(.1+d*.012+n*.012)/(s.hide||1);if(live.length<4+n/2&&rf()<rate)spawnWalker(S.camp.site)}
  for(const w of S.walkers){if(w.dead||w.tx!=null||rf()>.5)continue;let tx=w.x+rf()*12-6,tz=w.z+rf()*12-6;
    if(w.loc===campK()&&rf()<.25){tx=lerp(tx,0,.4);tz=lerp(tz,4,.4)}moveTo(w,tx,tz)}}
// someone meets one of the dead: a quick, narrated scuffle
function clash(v,w){if(w.dead||w.cool)return;w.cool=20;const pl=S.player;
  const helpers=[v,...S.people.filter(q=>q!==v&&q.loc===v.loc&&q.status!=="dead"&&q.status!=="left"&&!q.kid&&!q.sleep&&dist(q.x,q.z,v.x,v.z)<7&&(q.job==="guard"||q.tr.brave>0||q.follow))];
  if(v!==pl&&pl.ko<=0&&pl.loc===v.loc&&dist(pl.x,pl.z,v.x,v.z)<7)helpers.push(pl);
  const fighter=helpers.reduce((a,b)=>fightOf(b)>fightOf(a)?b:a,v);
  let chance=.6+fightOf(fighter)*.1+(helpers.length-1)*.1;if(useVal("weapon")>0)chance+=.06;
  if(fighter!==pl&&fighter.job==="guard"&&S.res.ammo>0&&rf()<.4){S.res.ammo--;chance+=.2}
  const nm=x=>x===pl?"You":x.name;if(fighter.hunt)fighter.hunt=null;
  if(rf()<chance){w.dead=true;w.diedAt=S.t;say(fighter,pick(["Got it.","Stay down.","That's one.","Clear!","Go back to sleep."]));
    if(rf()<.3||fighter===pl)log(`${nm(fighter)} put down one of the dead${v.loc===campK()&&inCamp(w.x,w.z)?" at the edge of camp":""}.`);if(fighter!==pl)fighter.sk.fight=Math.min(3,fighter.sk.fight+.04);return}
  // it went badly: someone gets hurt, and the thing is shoved back
  const dmg=ri(8,20);v.hp=Math.max(0,v.hp-dmg);w.x+=rf()*4-2;w.z+=rf()*4-2;w.cool=40;
  if(v===pl){if(pl.hp<=0)knockOut();else log(`One of them gets a hand on you. You tear free, bruised and shaking.`,"warn");return}
  say(v,pick(["Get it off me!","Help!","Back! Back!"]));
  if(v.hp<=0){die(v,v.kid?"was pulled down by the dead":"was pulled down by the dead before anyone could reach "+pronoun(v,"o"));return}
  log(`${v.name} got hurt fighting off one of the dead.`,"warn");
  if(v.hp<50&&rf()<(v.kid?.04:.12)&&!v.bitten&&v.status==="member"){v.bitten=true;queueCard("bitten",{who:v.id})}}
function fightOf(x){return x.id==="you"?2+Math.min(1,useVal("weapon")*.3):x.sk.fight+(x.tr.brave>.3?.5:0)}
function knockOut(){const pl=S.player;pl.ko=1;pl.hp=35;log("Everything goes black.","bad");
  const saver=S.people.filter(p=>p.status==="member"&&p.loc===pl.loc&&!p.kid)[0]||here().filter(p=>!p.kid).sort((a,b)=>b.sk.fight-a.sk.fight)[0];
  setTimeout(()=>{if(!S)return;S.t+=3*HOUR;if(S.camp&&pl.loc!==S.camp.site)arriveAt(S.camp.site,true);pl.x=2;pl.z=6;pl.tx=null;pl.path=null;pl.ko=0;
    log(saver?`You wake up by the fire. ${saver.name} found you and got you home. "Don't do that again," ${pronoun(saver)} says.`:"You wake up hours later, somehow in one piece, and stagger home.","warn");
    if(saver){saver.trust=Math.min(100,saver.trust+3);mem(saver,`I got ${pl.name} home when they went down.`,3)}
    if(typeof onScene==="function")onScene()},50)}

// ================= the hour =================
function hourly(){const h=hourOf(S.t);
  if(!S.camp){for(const p of S.people)if(p.status==="member"&&!p.follow&&p.tx==null&&rf()<.4)moveTo(p,p.x+rf()*4-2,p.z+rf()*4-2);walkerHour();return}
  if(h===6)dawn();if(h===8)sendScavs();
  for(const p of S.people){if(p.status==="member"&&atCamp(p))planHour(p,h);else if(p.status==="stranger"&&p.loc===campK())strangerHour(p);else if(p.status==="member"&&p.away&&p.away.out&&S.t>=p.away.back)comeBack(p)}
  work(h);if(h===20)supper();if(h===14||h===6)rollEvents();if(h===15)stingCheck();
  useHour(h);walkerHour();moodHour(h);strangersArrive();rivalHour(h);syncInv();
  const pl=S.player;pl.hp=Math.min(100,pl.hp+(pl.loc===campK()?3:1));
  if(h%2===0)save()}
function jobSpot(p){const c=S.camp;const j=p.job;const B=t=>bldDone(t);
  const near=(L)=>L.length?L.reduce((a,b)=>dist(b.x,b.z,p.x,p.z)<dist(a.x,a.z,p.x,p.z)?b:a):null;
  if(j==="farm"){const plots=[...B("plot"),...B("coop")];const free=plots.find(b=>p.wp===b.id)||plots.find(b=>here().filter(q=>q.job==="farm"&&q.wp===b.id).length<(b.type==="coop"?1:2));
    if(free){p.wp=free.id;return{x:free.x+rf()*3-1.5,z:free.z+rf()*2-1,b:free}}return{...campPoint(1.2+rf(),c.r+3),txt:"foraging"}}
  if(j==="wood"){const t=layout(c.site).trees.filter(t=>Math.abs(t[0])<SH-2&&Math.abs(t[1])<SH-2);const tt=t.length?pick(t):null;return tt?{x:tt[0]+1,z:tt[1]+1,txt:"chopping wood"}:{...campPoint(-2.2+rf()*.5,c.r+7),txt:"chopping deadfall"}}
  if(j==="water"){const w=near(B("well"));if(w)return{x:w.x+1,z:w.z+1,b:w};return layout(c.site).water?{x:SH-7,z:rf()*16-8,txt:"hauling water from the water"}:{...campPoint(2.5,c.r),txt:"hauling water"}}
  if(j==="build"){const bp=campBlds().filter(b=>!b.done).sort((a,b)=>dist(a.x,a.z,0,4)-dist(b.x,b.z,0,4))[0];if(bp)return{x:bp.x+rf()*2-1,z:bp.z+bSize(bp)[1]/2+.8,b:bp};const s=near(B("shop"));return s?{x:s.x,z:s.z+2.6,b:s,txt:"making ammo at the workshop"}:{...campPoint(0,4),txt:"fixing things around camp"}}
  if(j==="guard"){const t=near(B("tower"));const taken=t&&here().some(q=>q!==p&&q.job==="guard"&&q.wp===t.id);if(t&&!taken){p.wp=t.id;return{x:t.x,z:t.z,b:t,txt:"on watch in the tower"}}
    return{...campPoint(rf()*6.28,c.r+1),txt:"walking the edge of camp"}}
  if(j==="cook"){const f=near(B("fire"));return f?{x:f.x+1.2,z:f.z,b:f}:{...campPoint(0,2)}}
  if(j==="medic"){const m=near(B("clinic"));return m?{x:m.x,z:m.z+2.6,b:m}:{...campPoint(.5,3)}}
  return{...campPoint(rf()*6.28,5)}}
function willWork(p){if(p.strike&&S.t<p.strike)return false;return p.mood>18||p.tr.diligent>.3}
function planHour(p,h){if(p.follow||p.busy){p.sleep=false;return}const c=S.camp;p.sleep=false;p.inside=false;p.at=null;
  if(p.bitten&&p.quarantine){p.act="locked away";return}
  if(h>=22||h<6){p.sleep=true;const beds=bedsTotal();const i=here().indexOf(p);p.inside=i<beds;const siteBeds=SITES[c.site].beds||0;
    const bb=campBlds().filter(b=>b.done&&BUILDS[b.type].beds);const main=layout(c.site).b[0];let spot;
    if(p.inside&&i<siteBeds&&main)spot={x:main.x+rf()*2-1,z:main.z+main.d/2+.6};else if(p.inside&&bb.length)spot={x:bb[(i-siteBeds)%bb.length].x,z:bb[(i-siteBeds)%bb.length].z};else spot=campPoint(rf()*6.28,3);
    moveTo(p,spot.x,spot.z);p.act=p.inside?"asleep":"sleeping on the ground";return}
  if(p.hp<35){const m=bldDone("clinic")[0];const s=m?{x:m.x,z:m.z+2.4}:campPoint(.8,3);moveTo(p,s.x+rf(),s.z+rf());p.act="resting, hurt";return}
  if(p.job&&h>=7&&h<19&&willWork(p)&&p.job!=="scav"){const s=jobSpot(p);moveTo(p,s.x,s.z);p.at=s.b?s.b.id:"spot";p.act=s.txt||(s.b&&!s.b.done?`building the ${s.b.name.toLowerCase()}`:JOBS[p.job].v);return}
  freeTime(p,h)}
// what someone does with their own time, by who they are
function freeTime(p,h){const T=p.tr;const opts=[];const fire=bldDone("fire")[0];const fam=famHere(p);const others=here().filter(q=>q!==p&&!q.sleep);
  if(fam.length)opts.push([1+T.kind+(p.motive==="family"?1.5:0),()=>{const q=pick(fam);moveTo(p,q.x+1,q.z+1);return q.kid?`watching over ${q.name}`:`keeping close to ${q.name}`}]);
  if(others.length)opts.push([1+T.social*1.5,()=>{const q=pick(others);moveTo(p,q.x+1.2,q.z+.6);if(rf()<.4)chatter(p,q);return`talking with ${q.name}`}]);
  if(fire)opts.push([.8-T.diligent*.6+(h>=18?1.2:0),()=>{moveTo(p,fire.x+rf()*3-1.5,fire.z+rf()*3-1.5);return h>=18?"sitting by the fire":"taking it easy"}]);
  const bench=bldDone("bench")[0]||bldDone("garden")[0];if(bench)opts.push([.5+T.social*.3,()=>{moveTo(p,bench.x+rf(),bench.z+1);return bench.type==="garden"?"looking at the flowers":"sitting on the bench"}]);
  const bp=campBlds().find(b=>!b.done);if(bp&&!p.kid)opts.push([.6+T.diligent*1.4+T.kind*.4,()=>{moveTo(p,bp.x+1,bp.z+bSize(bp)[1]/2+.8);p.at=bp.id;return`helping build the ${bp.name.toLowerCase()}`}]);
  const n=campSize();if(!p.kid||p.age>=10){if(S.res.water<n*2)opts.push([1.2+T.diligent+T.kind*.5,()=>{const s=jobSpot({...p,job:"water"});moveTo(p,s.x,s.z);p.at="water";return"fetching water, since we're low"}]);
    if(S.res.food<n*2&&!p.kid)opts.push([1+T.diligent+T.kind*.5,()=>{const s=campPoint(rf()*6.28,S.camp.r+2);moveTo(p,s.x,s.z);p.at="forage";return"foraging, since food's low"}])}
  if(T.faith>.3)opts.push([T.faith*1.2,()=>{const s=campPoint(-1.6,6);moveTo(p,s.x,s.z);return"praying quietly"}]);
  if(!p.kid&&!p.job)opts.push([.4+T.diligent*.8+(p.motive==="purpose"?1:0),()=>{const s=campPoint(rf()*6.28,S.camp.r+2);moveTo(p,s.x,s.z);p.at="forage";return"foraging nearby"}]);
  if(p.kid)opts.push([1.4,()=>{const s=campPoint(rf()*6.28,rf()*8);moveTo(p,s.x,s.z);return pick(["playing tag","drawing in the dirt","collecting rocks","climbing on things"])}]);
  opts.push([.5,()=>{const s=campPoint(rf()*6.28,rf()*S.camp.r);moveTo(p,s.x,s.z);return pick(["wandering around camp","mending clothes","staring at the road","sharpening a knife"])}]);
  let tot=opts.reduce((a,o)=>a+Math.max(.05,o[0]),0),r=rf()*tot;for(const o of opts){r-=Math.max(.05,o[0]);if(r<=0){p.act=o[1]();return}}p.act=opts[opts.length-1][1]()}
const SMALL=["Think it'll rain?","You sleep at all?","I keep thinking about my old kitchen.","Did you hear that last night?","We need more salt.","My back is killing me.","Bet the city's worse.","You hungry? Me too.","Remember ice cream?","I miss music."];
function chatter(p,q){if(p.loc!==S.player.loc)return;say(p,pick(SMALL));setTimeout(()=>{if(S)say(q,pick(["Yeah.","Don't start.","Ha. Maybe.","Same.","Mm-hm.","Every night."]))},1600)}
function eff(p){return(.6+p.sk[JOBS[p.job]?.sk||"farm"]*.22+p.tr.diligent*.15)*(.65+p.mood/280)*(p.hp<50?.6:1)*(p.kid?.5:1)*(S.inv&&S.inv.items.some(o=>o.by===p.id)?1.15:1)}
function work(h){const s=SITES[S.camp.site];const day=h>=7&&h<19;S.res.water+=bldDone("well").length*.35*(rf()<.3?2:1)+Math.max(0,(s.water||1)-.7)*.1;
  for(const p of here()){if(!day||p.sleep||!p.at)continue;if(dist(p.x,p.z,p.tx??p.x,p.tz??p.z)>4)continue;
    if(p.at==="forage"){S.res.food+=.14;continue}if(p.at==="water"){S.res.water+=.45*SITES[S.camp.site].water;continue}const b=p.at==="spot"?null:S.blds.find(x=>x.id===p.at);const e=eff(p);
    if(b&&!b.done){b.prog+=e*(bldDone("shop").length?1.25:1);if(b.prog>=BUILDS[b.type].hrs)finishBld(b,p);continue}
    switch(p.job){case"farm":if(!b){S.res.food+=.1;break}if(b.type==="coop"){S.res.food+=.25*e;break}b.grow=Math.min(1,b.grow+1/40*e);S.res.food+=b.grow>=1?.42*e*s.farm:.04;break;
      case"wood":S.res.wood+=.32*e*s.wood;break;case"water":S.res.water+=(b?.9:.6)*e*s.water;break;
      case"build":if(b&&b.type==="shop"&&S.res.scrap>=1&&rf()<.12*e){S.res.scrap--;S.res.ammo+=2}break;
      case"cook":S.today.cook=(S.today.cook||0)+e;break;
      case"medic":for(const q of here()){if(q.hp<100)q.hp=Math.min(100,q.hp+(bldDone("clinic").length?2.5:1.2)*e);if(q.sick&&S.res.meds>=1&&rf()<.05){S.res.meds--;q.sick=0;log(`${p.name} got ${q.name}'s fever down with the last of the antibiotics.`)}}break}}
  if(S.today.fed!==false&&S.today.watered!==false)for(const q of members())if(q.hp<100&&!q.sick&&!q.noMed)q.hp=Math.min(100,q.hp+.3);
  if(h===12){const f=useVal("fishing")+useVal("trapping");if(f)S.res.food+=f*1.5;const w=useVal("water");if(w)S.res.water+=w*1.2}}
function finishBld(b,by){b.done=true;b.prog=BUILDS[b.type].hrs;S.bv++;log(`${by?by.name+" finished":"Finished"} the ${b.name.toLowerCase()}.`,"good");if(by)mem(by,`I built the ${b.name.toLowerCase()}.`,2);if(typeof onBld==="function")onBld(b)}
function supper(){const L=members().filter(p=>p.loc===campK()||!p.away);const n=L.length+(S.player.loc===campK()?1:0);const cook=(S.today.cook||0)>2?(bldDone("fire").length?.28:.15):0;
  const ration=S.flags.ration&&dayOf(S.t)<=S.flags.ration?.7:1;const needF=n*(1-cook)*ration,needW=n;
  const fF=needF?Math.min(1,S.res.food/needF):1,fW=needW?Math.min(1,S.res.water/needW):1;S.today.fed=fF>=.99;S.today.watered=fW>=.99;
  S.res.food=Math.max(0,S.res.food-needF);S.res.water=Math.max(0,S.res.water-needW);
  if(!bldDone("shed").length&&S.res.food>25)S.res.food-=(S.res.food-25)*.08;
  if(ration<1)for(const p of members())p.mood-=2;
  const short=Math.max(1-fF,(1-fW)*1.4);
  if(short>.01){S.flags.hungry=(S.flags.hungry||0)+1;const H=S.flags.hungry;for(const p of members()){p.mood-=3+short*7;p.hp-=short*(H>4?10:5);if(p.hp<=0)die(p,fW<fF?"died of thirst":"starved")}
    log(`Supper ${fF<1?(fF<.5?"is barely anything":"is short"):"goes fine, but the water ran out"}. People go to bed ${fF<1?"hungry":"thirsty"}.`,"bad")}
  else{S.flags.hungry=0;if(cook>0&&rf()<.4){const c=here().find(p=>p.job==="cook");if(c)log(`${c.name} makes supper stretch further than it should.`)}}}
function dawn(){S.today={};const d=dayOf(S.t);
  for(const p of members()){if(p.sick){p.sick--;p.hp-=8;if(p.hp<=0)die(p,"died of the fever");else if(!p.sick)log(`${p.name}'s fever broke.`,"good")}if(p.bitten&&!p.cured&&p.status==="member"){p.turn=(p.turn||0)+1;if(p.turn>=2)turnPerson(p)}}
  needsDawn();
  for(const p of members())if(p.mood<22&&p.tr.loyal<.2&&!p.wantsLeave&&rf()<.35){p.wantsLeave=true;queueCard("leave",{who:p.id})}
  // a bigger camp can't hear from you as often: people you've not spoken to in days drift
  const n=campSize();if(n>8)for(const p of members())if(S.t-(p.lastTalk||0)>DAY*4&&!p.leads)p.trust=Math.max(0,p.trust-(n-8)*.12);
  if(typeof onDawn==="function")onDawn(d)}
function turnPerson(p){const loc=p.loc;p.status="dead";S.stats.deaths++;const w=spawnWalker(loc,p.x,p.z);w.name=p.name;w.dead=true;w.diedAt=S.t;
  log(`${p.name} died in the night and came back. Someone had to put ${pronoun(p,"o")} down.`,"bad");
  for(const q of members()){q.mood-=q.fam[p.id]?30:10;mem(q,`${p.name} turned.`,-8)}}
function die(p,how){if(p.status==="dead")return;p.status="dead";p.deadAt=S.t;S.stats.deaths++;p.follow=false;log(`${p.name} ${how||"is dead"}.`,"bad");
  for(const q of members()){q.mood-=q.fam[p.id]?35:Math.max(4,10-campSize()*.2);mem(q,`${p.name} ${how||"died"}.`,-9)}
  for(const o of S.inv?.items||[])if(o.owner===p.id)o.owner=null;if(p.leads){p.leads=null}}
function moodHour(h){const n=campSize();const beds=bedsTotal();const def=defense();const pretty=Math.min(6,(bldDone("garden").length+bldDone("bench").length)*1.5+useVal("comfort")*1.5);
  for(const p of members()){let t=52+(beds>=n?6:-10-(n-beds)*.6)+(S.today.fed===false?-15:3)+(famHere(p).length?5:0)+(p.trust-50)*.18+(def>=n*.6?4:-6)+pretty-(p.hp<50?10:0)-(p.sick?8:0)-(p.noMed?12:0);
    if(p.job){const sk=p.sk[JOBS[p.job].sk];t+=sk>=2?5:p.tr.diligent<-.3?-6:0;if(p.motive==="purpose")t+=6}else if(p.motive==="purpose")t-=4;
    if(p.motive==="belonging")t+=Math.min(8,n);if(p.motive==="safety")t+=def>=n?6:-6;if(p.motive==="family")t+=famHere(p).length?5:-5;
    if(p.motive==="freedom"&&p.job&&!p.chose)t-=5;if(p.tr.social<-.4&&n>12)t-=(n-12)*.5;
    const recent=S.people.filter(q=>q.status==="dead"&&S.t-(q.deadAt||0)<DAY*3).length;t-=recent*4;
    p.mood=clamp(p.mood+(t-p.mood)*.05,0,100)}}

// ================= newcomers =================
function strangersArrive(){if(!S.camp||S.t<S.nextStranger)return;S.nextStranger=S.t+ri(26,46)*HOUR;
  const hh=mkHousehold(null,S.camp.site,{x:ENTRY.x,z:ENTRY.z});const wait=campPoint(1.57,S.camp.r+4);
  for(const p of hh){p.status="stranger";p.trust=ri(10,30);p.waitTill=S.t+30*HOUR;S.people.push(p);moveTo(p,wait.x+rf()*3-1.5,wait.z+rf()*2-1)}
  const lead=hh[0];const words=hh.length===1?`${lead.sex==="F"?"A woman":"A man"} on foot`:hh.some(p=>p.kid)?`${hh.length} people, one of them a kid,`:`${hh.length} people`;
  log(`${words} ${hh.length===1?"is":"are"} coming up the road toward camp.`,"big");if(typeof onStranger==="function")onStranger(hh)}
function strangerHour(p){if(S.t>p.waitTill){
    // if you're away, whoever's minding the gate decides
    const gate=lead("guard")||here().filter(q=>!q.kid).sort((a,b)=>b.trust-a.trust)[0];
    if(S.player.loc!==campK()&&gate){if(gate.tr.kind>-.1){admit(p,gate);return}log(`${gate.name} sent ${p.name} away while you were gone.`)}
    p.status="left";log(`${p.name} gave up waiting and moved on.`);moveTo(p,ENTRY.x,ENTRY.z+4);return}
  if(p.tx==null&&rf()<.3)moveTo(p,p.x+rf()*2-1,p.z+rf()*2-1);p.act="waiting at the edge of camp"}
function admit(p,by){const group=[p,...famOf(p).filter(q=>q.status==="stranger")];for(const q of group){q.status="member";q.loc=campK()||q.loc;q.trust=Math.max(q.trust,40);q.mood=55;S.stats.joined++;mem(q,`${by?by.name:S.player.name} let us into camp.`,5);if(S.camp)bringCarry(q)}
  log(`${listAnd(group.map(q=>q.name))} ${group.length>1?"join":"joins"} the camp${by?`. ${by.name} let ${group.length>1?"them":pronoun(p,"o")} in while you were away`:""}.`,"good");syncInv();return group}
function turnAway(p){const group=[p,...famOf(p).filter(q=>q.status==="stranger")];for(const q of group){q.status="left";moveTo(q,ENTRY.x,ENTRY.z+4)}log(`You send ${listAnd(group.map(q=>q.name))} on ${group.length>1?"their":pronoun(p,"p")} way.`)}

// ================= scavenging runs your people make on their own =================
function sendScavs(){const sc=here().filter(p=>p.job==="scav"&&willWork(p)&&p.hp>45);if(!sc.length)return;
  const spots=Object.keys(LOCS).filter(k=>k!==campK()&&k!=="start"&&!(S.rival&&S.rival.site===k&&!S.rival.gone)&&!place(k).burned);
  const k=S.flags.scavTo&&spots.includes(S.flags.scavTo)?S.flags.scavTo:pick(spots);
  for(const p of sc){p.away={kind:"scav",to:k,back:S.t+(travelHours(campK(),k)*2+3)*HOUR,out:false};p.act=`heading out to the ${LOCS[k].n}`;moveTo(p,ENTRY.x+rf()*2,ENTRY.z,()=>{p.away.out=true})}}
function comeBack(p){const k=p.away.to;const L=LOCS[k];const r=lootRoll(k,p.sk.scav);const danger=(L.danger||1)*.05-p.sk.scav*.025+(dayOf(S.t)*.003);
  p.away.out=false;p.x=ENTRY.x;p.z=ENTRY.z;
  if(rf()<danger*.18&&!p.kid){p.away=null;die(p,`never came back from the ${L.n}`);return}
  if(rf()<danger){p.hp-=ri(10,28);log(`${p.name} ran into trouble at the ${L.n} and came back limping.`,"warn")}
  addLoot(r);log(`${p.name} came back from the ${L.n} with ${lootWords(r)||"nothing worth carrying"}.`);
  if(rf()<.1){const hh=mkHousehold(null,campK(),{x:ENTRY.x+2,z:ENTRY.z});for(const q of hh){q.status="stranger";q.trust=35;q.waitTill=S.t+30*HOUR;S.people.push(q)}log(`${p.name} brought someone back: ${listAnd(hh.map(q=>q.name))}, found hiding there.`,"big")}
  p.away=null;moveTo(p,rf()*6-3,6+rf()*4)}
function lootRoll(k,sk){const r={};const kinds=SCENE_CONTS[k]||SCENES[LOCS[k].kind].conts;for(let i=0;i<2;i++){const ck=pick(kinds);for(const [key,ch,mn=1,mx=1] of CONT[ck].loot)if(rf()<ch*(.7+sk*.12)){r[key]=(r[key]||0)+ri(mn,mx)}}return r}
function addLoot(r){for(const [k,v] of Object.entries(r)){if(k.startsWith("i:"))S.items[k.slice(2)]=(S.items[k.slice(2)]||0)+v;else S.res[k]=(S.res[k]||0)+v}syncInv()}
function lootWords(r){return listAnd(Object.entries(r).map(([k,v])=>k.startsWith("i:")?(v>1?v+" × ":"a ")+ITEMS[k.slice(2)]:`${v} ${RES[k].toLowerCase()}`))}

// ================= the other group =================
function rivalHour(h){const d=dayOf(S.t);if(!S.rival&&d>=4&&h===10){const opts=Object.keys(LOCS).filter(k=>LOCS[k].camp!==false&&k!==S.camp.site&&!place(k).burned);const k=pick(opts.filter(k=>LOCS[k].kind!=="store")||opts);
    const L=[];for(let i=0;i<ri(4,6);i++){const p=mkPerson({sur:"Pruitt",status:"rival",loc:k,x:rf()*10-5,z:rf()*6,trust:5,age:ri(19,55)});p.sk.fight=Math.max(p.sk.fight,ri(1,3));L.push(p);S.people.push(p)}
    L[0].name="Boyd";L[0].sex="M";L[0].tr.temper=.8;L[0].tr.kind=-.6;
    S.rival={site:k,n:"the Pruitt crew",lead:L[0].id,angry:0,demandDay:d+ri(2,3),gone:false};log(`Smoke over ${LOCS[k].n}. Somebody else has dug in there.`,"big")}
  const R=S.rival;if(!R||R.gone)return;
  for(const p of S.people)if(p.status==="rival"&&p.tx==null&&rf()<.3)moveTo(p,rf()*14-7,rf()*10-2);
  if(d>=R.demandDay&&h===11&&!R.demanded){R.demanded=true;queueCard("demand",{})}
  if(R.raidAt&&S.t>=R.raidAt){R.raidAt=null;raid()}}
function raid(){const R=S.rival;const def=defense();const str=rivalStr();
  if(def>=str*1.2){log(`The Pruitt crew hit camp in the dark, but ${def>str*2?"your people were ready and they ran":"after a short, ugly fight they pulled back"}.`,"good");const p=S.people.find(p=>p.status==="rival");if(p&&rf()<.5)die(p,"was killed in the raid on your camp");return}
  const take={food:Math.floor(S.res.food*.4),wood:Math.floor(S.res.wood*.3),ammo:Math.floor(S.res.ammo*.5)};for(const k in take)S.res[k]-=take[k];
  const hurt=pick(here().filter(p=>!p.kid));if(hurt){hurt.hp-=ri(15,35);if(hurt.hp<=0)die(hurt,"was killed in the raid")}
  log(`The Pruitt crew raided camp in the night and took ${lootWords(take)||"what they could carry"}.${hurt&&hurt.status!=="dead"?` ${hurt.name} got hurt trying to stop them.`:""}`,"bad");
  R.demanded=false;R.demandDay=dayOf(S.t)+3;syncInv()}
function rivalStr(){const R=S.rival;return R&&!R.gone?S.people.filter(p=>p.status==="rival").reduce((a,p)=>a+1.5+p.sk.fight*.8,0)*(R.weak?.7:1):0}

// ================= catastrophes, and the ones your people handle themselves =================
function queueCard(type,data){if(S.cards.some(c=>c.type===type&&(!data.who||c.who===data.who)))return;S.cards.push({type,...data,t:S.t});if(typeof onCard==="function")onCard()}
// who's in charge of something: the person you put in charge, or failing that whoever's best at it
function lead(job){const L=here().filter(p=>p.job===job&&willWork(p));const boss=L.find(p=>p.leads===job);if(boss)return boss;return L.length?L.reduce((a,b)=>b.sk[JOBS[job].sk]>a.sk[JOBS[job].sk]?b:a):null}
function handles(job){const l=lead(job);if(!l)return null;const k=JOBS[job].sk;return rf()<.3+l.sk[k]*.15+(l.leads===job?.15:0)+(l.trust-50)*.002?l:null}
function rollEvents(){const d=dayOf(S.t);const n=campSize();if(d<2)return;
  // more people, more that can go wrong: a camp of three is quiet, a camp of thirty never is
  const rolls=n>15?2:1;for(let r=0;r<rolls;r++)if(rf()<clamp(.2+n*.025,.2,.85))oneEvent(d,n)}
function oneEvent(d,n){const E=[];const grown=campBlds().filter(b=>b.type==="plot"&&b.done&&b.grow>.4);
  if(grown.length)E.push(["blight",1]);if(n>=3)E.push(["sick",.5+n*.03]);if(d>=3)E.push(["horde",.5+d*.04]);
  if(n>=4&&members().some(p=>p.tr.temper>.3&&!p.kid))E.push(["quarrel",.4+n*.04]);if(campBlds().some(b=>b.done&&["shed","cabin","shop","clinic"].includes(b.type)))E.push(["fire",.25]);
  if(S.res.food<n*1.5&&(!S.flags.shortWarn||dayOf(S.t)-S.flags.shortWarn>3))E.push(["short",2]);if(n>=8)E.push(["council",.3+n*.02]);
  let tot=E.reduce((a,e)=>a+e[1],0),r=rf()*tot,ev=null;for(const e of E){r-=e[1];if(r<=0){ev=e[0];break}}if(!ev)return;
  // delegation: whoever runs that part of camp gets the first shot at it
  if(ev==="blight"){const f=handles("farm");if(f){for(const b of grown)b.grow*=.85;log(`${f.name} spotted blight on the crops and pulled the sick rows before it spread. Nothing for you to do.`,"good");mem(f,"I caught the blight early.",3);return}queueCard("blight",{})}
  if(ev==="sick"){const v=pick(members().filter(p=>!p.sick&&p.loc===campK()));if(!v)return;const m=handles("medic");if(m&&S.res.meds>0){S.res.meds--;v.sick=1;log(`${v.name} came down with a fever. ${m.name} isolated ${pronoun(v,"o")} and it didn't spread.`,"good");return}queueCard("sick",{who:v.id})}
  if(ev==="horde"){const size=Math.round(4+d*.9+n*.25+rf()*4);const def=defense();const g=handles("guard");if(def>=size||g&&def>=size*.7){log(`A herd of the dead drifted past in the night. ${g?g.name+" kept everyone quiet":"Your people kept quiet"} and the guards put down the stragglers.`,"good");return}queueCard("horde",{size})}
  if(ev==="quarrel"){const hot=members().filter(p=>p.tr.temper>.3&&!p.kid&&p.loc===campK());const a=pick(hot);if(!a)return;const b=pick(members().filter(q=>q!==a&&!q.kid&&!q.fam[a.id]&&q.loc===campK()));if(!b)return;
    const peace=here().find(p=>p!==a&&p!==b&&(p.leads||p.tr.kind>.4&&p.tr.social>.3));if(peace&&rf()<.5){log(`${a.name} and ${b.name} nearly came to blows over the chores. ${peace.name} talked them down.`);return}queueCard("quarrel",{a:a.id,b:b.id})}
  if(ev==="fire"){const c=handles("cook")||handles("guard");if(c){log(`A spark from the cookfire caught some canvas. ${c.name} had it out in a minute.`);return}queueCard("fire",{})}
  if(ev==="short"){S.flags.shortWarn=dayOf(S.t);queueCard("short",{})}
  if(ev==="council"){const p=pick(members().filter(p=>!p.kid&&p.loc===campK()));if(p)queueCard("council",{who:p.id,ask:pick(["ration","rules","guard","newcomers"])})}}
