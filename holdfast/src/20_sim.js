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
  const cg=CARRY_GUN[job0];if(cg&&!kid&&rf()<cg[1]){p.carry=p.carry||{};p.carry[cg[0]]=1;p.carry.ammo=ri(4,12)}
  return p}
const REL={parentF:"mother",parentM:"father",kidF:"daughter",kidM:"son",spouseF:"wife",spouseM:"husband",sibF:"sister",sibM:"brother",gpF:"grandmother",gpM:"grandfather",gkF:"granddaughter",gkM:"grandson"};
// a is b's ab, b is a's ba: fam[id] says what that person is to you ("my son", "my wife")
function link(a,b,ab,ba){a.fam[b.id]=REL[ba+b.sex];b.fam[a.id]=REL[ab+a.sex]}
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
function layout(k){if(LAYOUT[k])return LAYOUT[k];const L=LOCS[k];const T=SCENES[L.kind];const R=srng(hashStr(k));const o={b:[],conts:[],trees:[],cars:[],blk:[],foot:[],furn:[],beds:[],stove:null};
  // every building has walls you can't walk through and a door in the front (toward the road), so you can go in and live there
  const addB=(b,tag)=>{if(!b)return;const r={x:b.at[0],z:b.at[1],w:b.w,d:b.d,h:b.h,c:b.c||L.col||"#8a8478",roof:b.roof,flat:!!b.flat,steeple:!!b.steeple,tag,barn:!!b.barn,
      kit:b.kit||T.kit||[],floor:b.floor||T.floor||"#7a6a58"};o.b.push(r);
    const x0=r.x-r.w/2,x1=r.x+r.w/2,z0=r.z-r.d/2,z1=r.z+r.d/2,t=.3,dw=DOOR/2;o.foot.push([x0,z0,x1,z1]);
    o.blk.push([x0,z0,x1,z0+t,0],[x0,z0,x0+t,z1,0],[x1-t,z0,x1,z1,0],[x0,z1-t,r.x-dw,z1,0],[r.x+dw,z1-t,x1,z1,0]);
    // the door, and the windows on the two walls you can see: where the dead try to get in, and what you board up
    r.door={x:r.x,z:z1,ox:r.x,oz:z1+1.1,ix:r.x,iz:z1-1.1};r.wins=[];
    for(let x=-r.w/2+1.4;x<r.w/2-1;x+=3)if(Math.abs(x)>dw+.6)r.wins.push({x:r.x+x,z:z1,side:"front",ox:r.x+x,oz:z1+1,ix:r.x+x,iz:z1-1});
    for(let z=-r.d/2+1.6;z<r.d/2-1;z+=3)r.wins.push({x:x1,z:r.z+z,side:"right",ox:x1+1,oz:r.z+z,ix:x1-1.1,iz:r.z+z})};
  addB(T.b,"main");addB(T.b2,"b2");
  // inside: the place's beds along the back wall, then whatever it has (a table, pews, shelves, desks, hay)
  const homes=o.b.filter(r=>!r.barn);const nb=L.camp===false?0:(L.beds||0);homes.forEach((r,i)=>fitOut(o,r,Math.floor(nb/homes.length)+(i<nb%homes.length?1:0),R));
  for(const r of o.b.filter(r=>r.barn))fitOut(o,r,0,R);
  const kinds=SCENE_CONTS[k]||T.conts;const main=o.b[0];let ci=0;
  for(const ck of kinds){let x,z,rot=0,bi=-1;
    let car=-1;
    // cars aren't fixed: you can put one in neutral and push it, so where it is lives in the place's state (carsAt)
    if(ck==="car"||ck==="cruiser"){x=(R()*2-1)*14;z=8+R()*10;if(k==="start"){x=-20+ci*9+R()*2;z=4+R()*6}const col=pick2(["#7a2a22","#2a3a5a","#c8c8c0","#3a3a3a","#5a6a4a","#8a7a5a"],R);car=o.cars.length;o.cars.push({x,z,rot:R()*.6-.3+(R()<.5?0:Math.PI),c:ck==="cruiser"?"#e4e4de":col,cop:ck==="cruiser",alarm:ck!=="cruiser"&&R()<.12})}
    else if(ck==="shed"){x=pick2([-18,18,-14,14],R);z=-2+R()*8;o.blk.push([x-1.6,z-1.6,x+1.6,z+1.6])}
    else if(main){// inside, along the right-hand wall, front to back
      const r=ck==="barn"&&o.b[1]?o.b[1]:main;bi=o.b.indexOf(r);const i=o.conts.filter(c=>c.bi===bi).length;x=r.x+r.w/2-.78;z=r.z+r.d/2-1.3-i*1.7;rot=Math.PI/2}
    else{x=R()*20-10;z=R()*10}
    o.conts.push({id:k+":"+ci,k:ck,x,z,rot,bi,car,vis:ck==="car"||ck==="cruiser"?"car":ck==="shed"?"shed":"door"});ci++}
  const nt=Math.round(30*(T.tree||.5));for(let i=0;i<nt;i++){let x,z,t=0;do{x=(R()*2-1)*(SH+4);z=(R()*2-1)*(SH+4);t++}while(t<20&&(Math.abs(x)<SH-6&&Math.abs(z)<SH-6||Math.abs(x)<4));o.trees.push([x,z,.8+R()*.7])}
  // a few trees inside the scene too, away from buildings and the road
  for(let i=0;i<Math.round(6*(T.tree||.5));i++){const x=(R()*2-1)*(SH-4),z=(R()*2-1)*(SH-4);if(Math.abs(x)<5)continue;if([...o.foot,...o.blk].some(b=>x>b[0]-3&&x<b[2]+3&&z>b[1]-3&&z<b[3]+3))continue;o.trees.push([x,z,.7+R()*.6])}
  o.pine=k==="scout"||k==="mill"?.8:k==="farm"?.35:.5;o.trees.forEach(t=>t.push(R()<o.pine?1:0));
  o.fields=!!T.fields;o.water=!!T.water;o.fence=!!T.fence;o.lot=!!T.lot;o.field=!!T.field;o.canopy=!!T.canopy;
  LAYOUT[k]=o;if(S&&S.places&&S.places[k]&&S.places[k].cars)syncCarConts(k);return o}
const DOOR=2.4;// how wide a doorway is
// furnish a building: beds along the back wall (leaving the right-hand wall for cupboards), then the rest
function fitOut(o,r,nb,R){const w=r.w,d=r.d,X=x=>r.x+x,Z=z=>r.z+z,F=o.furn;
  const rooms=r.kit.includes("rooms");const per=rooms?nb:Math.max(1,Math.floor((w-2.6)/1.35)+1);const rows=Math.ceil(nb/per);
  // a motel is a row of rooms: a bed each, a nightstand, and a wall between you and the next room
  if(rooms){const sp=(w-2)/nb;for(let i=0;i<nb;i++){const x=-w/2+.4+sp*(i+.5),z=-d/2+1.3;F.push({t:"bed",x:X(x),z:Z(z)});o.beds.push({x:X(x),z:Z(z)});F.push({t:"stand",x:X(x+.85),z:Z(-d/2+.5)});
      if(i){const wx=X(-w/2+.4+sp*i);F.push({t:"wall",x:wx,z:Z(-d/2+1.4),d:2.8,c:r.c});o.blk.push([wx-.06,Z(-d/2),wx+.06,Z(-d/2+2.8),0])}}}
  else for(let i=0;i<nb;i++){const row=Math.floor(i/per),n=Math.min(per,nb-row*per),j=i-row*per;const x=-.5+(j-(n-1)/2)*1.35,z=-d/2+1.3+row*2.3;F.push({t:"bed",x:X(x),z:Z(z)});o.beds.push({x:X(x),z:Z(z)})}
  const back=-d/2+.3+rows*2.3+(rows?0:.6),front=d/2-1.3,mid=(back+front)/2,open=front-back;
  for(const k of r.kit){
    if(k==="table"&&open>2.2){F.push({t:"rug",x:X(-w/4+.4),z:Z(mid),w:2.8,d:2.2});F.push({t:"table",x:X(-w/4+.4),z:Z(mid)});o.table=o.table||{x:X(-w/4+.4),z:Z(mid)}}
    if(k==="pews")for(let z=back+1.2;z<front-1.2;z+=1.6)for(const sx of [-1,1])F.push({t:"pew",x:X(sx*w/4),z:Z(z),w:w/2-2.4});
    if(k==="aisles"){const len=Math.max(1.5,open-2.4);for(let x=-w/2+2.6;x<w/2-2;x+=3.2){if(Math.abs(x)<DOOR/2+.4)continue;F.push({t:"shelf",x:X(x),z:Z(mid),len});o.blk.push([X(x)-.3,Z(mid)-len/2,X(x)+.3,Z(mid)+len/2,0])}}
    if(k==="counter"&&w>=12)F.push({t:"counter",x:X(-w/2+3),z:Z(front-.5)});
    if(k==="desks"){const cols=Math.max(1,Math.floor((w-3.4)/2.2));for(let z=back+1;z<front-.8;z+=1.8)for(let c=0;c<cols;c++){const x=(c-(cols-1)/2)*2.2;if(Math.abs(x)<.9&&z>front-2.5)continue;F.push({t:"desk",x:X(x),z:Z(z)})}}
    if(k==="altar")F.push({t:"altar",x:X(0),z:Z(-d/2+.7)});
    if(k==="hay")for(let i=0;i<5;i++)F.push({t:"hay",x:X(-w/2+1.4+R()*(w-3.6)),z:Z(-d/2+1.4+R()*(d-3.4))})}
  // the stove: in the front corner by the door, away from the beds
  if(!o.stove&&!r.barn)o.stove={x:X(-w/2+.95),z:Z(front-.3)};
  // somewhere to sit and somewhere to lie down for whoever doesn't get a bed
  if(!r.barn){r.floorSpots=[];for(let x=-w/2+1.2;x<w/2-1.6;x+=1.4)for(let z=back+.6;z<front;z+=1.6)r.floorSpots.push({x:X(x),z:Z(z)})}}
function pick2(a,R){return a[Math.floor(R()*a.length)]}
function contState(loc,cid){const pl=place(loc);let s=pl.conts[cid];if(!s){const ck=layout(loc).conts.find(c=>c.id===cid)?.k||"shelf";const T=CONT[ck];s=pl.conts[cid]={c:{g:[...T.g],items:[],u:1},rolled:false}}return s}
function rollCont(loc,cid){const s=contState(loc,cid);if(s.rolled)return s;s.rolled=true;const ck=layout(loc).conts.find(c=>c.id===cid)?.k||"shelf";const d=dayOf(S.t);
  const picked=Math.min(.6,(d-1)*.03);for(const [key,ch,mn=1,mx=1] of CONT[ck].loot){if(rf()<ch*(1-picked)){const k=key.replace(/^i:/,"");gAdd(s.c,k,ri(mn,mx))}}return s}

// ================= getting around a scene =================
// Two walk grids per place: one for the living and one for the dead. Everything in the way is [x0,z0,x1,z1,pad,kind]
// (or a turned box {car:[cx,cz,hw,hd,rot],pad,kind} for a car). kind 0 stops everyone; 2 the living can climb over
// (a wall section, a car) but the dead can't; 3 only stops the dead (a shut door, a gate). Grid cells hold 0 (open),
// 1 (solid) or 2 (climbable, slow).
const GRID={};const GN=2*(SH+6);const CLIMB=10;
function resetCaches(){for(const k in GRID)delete GRID[k];for(const k in LAYOUT)delete LAYOUT[k]}
function blockers(loc){const lay=layout(loc);const L=lay.blk.slice();if(!S||!LOCS[loc])return L;const P=place(loc);
  lay.trees.forEach((t,i)=>{if(choppable(t)&&!(P.trees&&P.trees[i]&&P.trees[i].down))L.push([t[0]-.4,t[1]-.4,t[0]+.4,t[1]+.4,.2,0])});
  for(const c of carsAt(loc))L.push({car:[c.x,c.z,1.0,2.1,c.rot],pad:.25,kind:2});
  lay.b.forEach((r,bi)=>{const st=bldState(loc,bi);if(st.door!=="open"&&st.door!=="broken")L.push([r.x-DOOR/2,r.z+r.d/2-.3,r.x+DOOR/2,r.z+r.d/2,0,3])});
  for(const b of S.blds)if(b.loc===loc&&b.done){const B=BUILDS[b.type];if(!B.solid&&!B.wall&&!B.gate)continue;const [w,d]=bSize(b);
    L.push([b.x-w/2,b.z-d/2,b.x+w/2,b.z+d/2,B.gate||B.wall?.1:.4,B.gate?3:B.wall?2:0])}
  return L}
function bSize(b){const s=BUILDS[b.type].size;return b.rot%2?[s[1],s[0]]:[s[0],s[1]]}
function grid(loc,dead){const key=dead?loc+"|d":loc;let g=GRID[key];if(g&&g.v===S.bv)return g;g={v:S.bv,a:new Uint8Array(GN*GN)};const a=g.a;
  const put=(i,j,v)=>{if(i<0||j<0||i>=GN||j>=GN)return;const n=j*GN+i;if(v===1||!a[n])a[n]=v};
  for(const e of blockers(loc)){const kind=e.car?e.kind:(e[5]||0);const v=dead||kind===0?1:kind===2?2:0;if(!v)continue;
    if(e.car){const [cx,cz,hw,hd,rot]=e.car;const co=Math.cos(rot),si=Math.sin(rot),r=Math.hypot(hw,hd)+e.pad+1;
      for(let i=gc(cx-r);i<=gc(cx+r);i++)for(let j=gc(cz-r);j<=gc(cz+r);j++){const dx=i-SH-6+.5-cx,dz=j-SH-6+.5-cz;const lx=dx*co-dz*si,lz=dx*si+dz*co;if(Math.abs(lx)<hw+e.pad+.3&&Math.abs(lz)<hd+e.pad+.3)put(i,j,v)}}
    else{const [x0,z0,x1,z1,pad=.4]=e;for(let i=Math.floor(x0+SH+6-pad);i<=Math.floor(x1+SH+6+pad-1e-6);i++)for(let j=Math.floor(z0+SH+6-pad);j<=Math.floor(z1+SH+6+pad-1e-6);j++)put(i,j,v)}}
  return GRID[key]=g}
const gc=v=>clamp(Math.floor(v+SH+6),0,GN-1);
const cellX=i=>i-SH-6+.5;
function blockedAt(loc,x,z,dead){return grid(loc,dead).a[gc(z)*GN+gc(x)]===1}
function clearLine(loc,x0,z0,x1,z1,dead){const g=grid(loc,dead).a;const n=Math.ceil(dist(x0,z0,x1,z1)/.4);for(let i=1;i<n;i++){const x=lerp(x0,x1,i/n),z=lerp(z0,z1,i/n);if(g[gc(z)*GN+gc(x)])return false}return true}
// the nearest open cell to a cell that's inside something
function freeNear(g,i0,j0,rad){for(let r=1;r<=(rad||4);r++){let best=-1,bd=1e9;for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){if(Math.max(Math.abs(di),Math.abs(dj))!==r)continue;const i=i0+di,j=j0+dj;if(i<0||j<0||i>=GN||j>=GN||g[j*GN+i]===1)continue;const d=di*di+dj*dj;if(d<bd){bd=d;best=j*GN+i}}if(best>=0)return best}return -1}
// A* over the grid with a binary heap. Comes back with the way there, or if there's no way, the way to the closest
// point you can reach (marked partial). Never through a wall.
const PF={g:new Float32Array(GN*GN),from:new Int32Array(GN*GN),shut:new Uint8Array(GN*GN),hk:new Float32Array(GN*GN*8),hv:new Int32Array(GN*GN*8),n:0};
function hpush(k,v){let i=PF.n++;const K=PF.hk,V=PF.hv;while(i>0){const p=(i-1)>>1;if(K[p]<=k)break;K[i]=K[p];V[i]=V[p];i=p}K[i]=k;V[i]=v}
function hpop(){const K=PF.hk,V=PF.hv;const top=V[0];const k=K[--PF.n],v=V[PF.n];let i=0;const n=PF.n;
  while(true){let c=2*i+1;if(c>=n)break;if(c+1<n&&K[c+1]<K[c])c++;if(K[c]>=k)break;K[i]=K[c];V[i]=V[c];i=c}if(n>0){K[i]=k;V[i]=v}return top}
function findPath(loc,x0,z0,x1,z1,dead){const g=grid(loc,dead).a;if(clearLine(loc,x0,z0,x1,z1,dead))return[[x1,z1]];
  let s=gc(z0)*GN+gc(x0);if(g[s]===1){const f=freeNear(g,gc(x0),gc(z0),3);if(f>=0)s=f}
  let t=gc(z1)*GN+gc(x1);const goalIn=g[t]===1;if(goalIn){const f=freeNear(g,gc(x1),gc(z1),5);if(f<0)return null;t=f}
  const H=PF.g.fill(1e9),from=PF.from.fill(-1),shut=PF.shut.fill(0);PF.n=0;const tx=t%GN,tz=(t/GN)|0;
  H[s]=0;hpush(0,s);let best=s,bh=1e9,n=0;
  while(PF.n&&n<GN*GN){const c=hpop();if(shut[c])continue;shut[c]=1;n++;if(c===t)break;const cx=c%GN,cz=(c/GN)|0;const hd=Math.hypot(cx-tx,cz-tz);if(hd<bh){bh=hd;best=c}
    for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dz)continue;const nx=cx+dx,nz=cz+dz;if(nx<0||nz<0||nx>=GN||nz>=GN)continue;const ni=nz*GN+nx;const v=g[ni];if(v===1||shut[ni])continue;
      if(dx&&dz&&(g[cz*GN+nx]===1||g[nz*GN+cx]===1))continue;const ng=H[c]+(dx&&dz?1.414:1)*(v===2?CLIMB:1);if(ng<H[ni]){H[ni]=ng;from[ni]=c;hpush(ng+Math.hypot(nx-tx,nz-tz),ni)}}}
  let end=t,partial=false;if(t!==s&&from[t]<0){end=best;partial=true}
  const pts=[];let c=end;while(c!==s&&c>=0){pts.push([cellX(c%GN),cellX((c/GN)|0)]);c=from[c]}pts.reverse();
  // smooth: skip any corner you can see past
  const out=[];let cx=x0,cz=z0,i=0;while(i<pts.length){let j=pts.length-1;while(j>i&&!clearLine(loc,cx,cz,pts[j][0],pts[j][1],dead))j--;out.push(pts[j]);cx=pts[j][0];cz=pts[j][1];i=j+1}
  if(!partial&&!goalIn)out.push([x1,z1]);out.partial=partial;return out}
// the dead (and wild animals) can't open doors or climb, so they walk the dead's grid
const isDeadThing=o=>typeof o.id==="string"&&(o.id[0]==="w"||o.id[0]==="a");
// walk somewhere by the grid; false if there's no way all the way there (you still get as close as you can)
function moveTo(o,x,z,cb){x=clamp(x,-SH+1,SH-1);z=clamp(z,-SH+1,SH-1);const p=LOCS[o.loc]?findPath(o.loc,o.x,o.z,x,z,isDeadThing(o)):[[x,z]];
  if(p&&!p.length&&!p.partial){o.tx=null;o.tz=null;o.path=null;o.onArrive=null;if(cb)cb();return true}
  if(!p||!p.length){o.tx=null;o.tz=null;o.path=null;o.onArrive=null;return false}
  o.path=p.slice();const f=o.path.shift();o.tx=f[0];o.tz=f[1];o.onArrive=p.partial?null:cb||null;o.goal={x,z};return !p.partial}

// ================= a new game =================
function newGame(pl){resetCaches();S={v:1,t:7*HOUR+40,nid:1,bv:1,camp:null,res:{food:10,water:10,wood:5,scrap:3,meds:1,ammo:4},items:{rope:2,cloth:2,tape:1,knife:1,bottle:2,tin:1},crafted:[],
    people:[],blds:[],walkers:[],animals:[],log:[],cards:[],rival:null,flags:{},stats:{deaths:0,joined:0},nextStranger:0,today:{},places:{},haul:{g:[6,3],items:[],u:1},storeLog:[],
    player:{id:"you",name:pl.name||"Alex",sex:pl.sex||"M",look:pl.look,loc:"start",x:2,z:12,tx:null,tz:null,path:null,hp:100,ko:0}};
  place("start").seen=true;topUpAnimals("start");
  // the people stuck at the pileup with you
  const h1=mkHousehold("parentkid","start",{x:-2,z:10});const h2=mkHousehold("single","start",{x:5,z:9});
  for(const p of [...h1,...h2]){p.status="member";p.trust=45+ri(0,15);p.mood=45;p.follow=true;S.people.push(p)}
  topUpWalkers("start");
  log(`Day 1. The pileup on Route 9 isn't moving, and the radio keeps saying stay indoors. ${listAnd(S.people.map(p=>p.name))} are stuck here with you.`);
  log("Open the map (M) and pick somewhere to make camp. Search the cars first, if you like. A state trooper's cruiser sits empty up the line.","hint");
  return S}

// ================= the camp =================
function campHere(){const k=S.player.loc;const L=LOCS[k];if(!L||L.camp===false)return false;if(S.rival&&S.rival.site===k&&!S.rival.gone)return false;
  S.camp={site:k,r:17,n:L.n,day:dayOf(S.t)};const lay=layout(k);const st=lay.stove;const hb=homeBld();if(hb){const ds=bldState(k,lay.b.indexOf(hb));if(ds.door==="open")ds.door="shut";for(const w of ds.wins)if(w.broken){w.broken=false;w.hp=15}S.bv++}
  // you move into the building: the stove inside does what a cookfire would
  if(st)addBld("fire",st.x,st.z,{done:true,name:"Woodstove",opt:{indoor:true}});else addBld("fire",3,4,{done:true,name:"Campfire"});
  const spots=lay.b.filter(r=>r.floorSpots).flatMap(r=>r.floorSpots);
  for(const p of S.people)if(p.status==="member"&&p.loc===k){p.follow=false;p.away=null;if(spots.length){const s=pick(spots);moveTo(p,s.x,s.z);p.act="moving in"}}
  log(`You make camp at ${L.n}.`,"big");
  if(st)log(`Everyone moves inside: ${lay.beds.length?`${lay.beds.length} bed${lay.beds.length>1?"s":""}, `:""}a woodstove and four walls between you and the dead. Press V to see inside from anywhere.`,"good");S.nextStranger=S.t+ri(16,26)*HOUR;unloadHaul();
  for(const p of members()){mem(p,`We made camp at ${L.n}.`,2);bringCarry(p)}
  syncInv();return true}
function bringCarry(p){if(!p.carry)return;for(const [k,n] of Object.entries(p.carry)){if(RES[k])S.res[k]=(S.res[k]||0)+n;else S.items[k]=(S.items[k]||0)+n;
    if(GUNS[k])log(`${p.name} puts ${pronoun(p,"p")} ${ITEMS[k]} in with the camp's things${p.carry.ammo?`, with ${p.carry.ammo} rounds`:""}.${S.player.gun?"":" You could carry it yourself (Stores, I)."}`)}p.carry=null}
function addBld(type,x,z,o){o=o||{};const B=BUILDS[type];const b={id:nid("b"),type,loc:o.loc||S.player.loc,x,z,rot:o.rot||0,done:!!o.done,prog:o.done?B.hrs:0,opt:o.opt||{},name:o.name||B.n,grow:0,hp:100};
  S.blds.push(b);S.bv++;if(typeof onBld==="function")onBld(b);return b}
function campBlds(){return S.camp?S.blds.filter(b=>b.loc===S.camp.site):[]}
function bldDone(type){return campBlds().filter(b=>b.done&&b.type===type)}
function bedsTotal(){if(!S.camp)return 0;return(SITES[S.camp.site].beds||0)+campBlds().filter(b=>b.done).reduce((a,b)=>a+(BUILDS[b.type].beds||0),0)}
function canAfford(cost){return Object.entries(cost).every(([k,v])=>(S.res[k]||0)>=v)}
function pay(cost){for(const [k,v] of Object.entries(cost))S.res[k]-=v;syncInv()}
function costWords(c){return Object.entries(c).map(([k,v])=>`${v} ${RES[k].toLowerCase()}`).join(", ")}
function defense(){if(!S.camp)return 0;const s=SITES[S.camp.site];const g=here().filter(p=>p.job==="guard"&&!p.kid);
  // a yard the dead can't walk into counts for a lot; so does a home with the door shut and the windows boarded
  const h=homeBld();let shut=0;if(h){const st=bldState(S.camp.site,layout(S.camp.site).b.indexOf(h));shut=(st.door==="shut"?1:0)+st.bar*.8+(st.furn?1:0)+st.wins.filter(w=>w.board>0).length/Math.max(1,st.wins.length)*1.5}
  return Math.round(s.def*3+g.reduce((a,p)=>a+1.5+p.sk.fight*.8,0)+bldDone("tower").length*2.5*(g.length?1:.4)+bldDone("fence").length*.6+(yardSealed()?6:0)+shut+useVal("defense")*1.2+(S.res.ammo>=1?Math.min(campGuns(),g.length)*1.5:0)+Math.min(2,S.res.ammo/8))}
function campGuns(){return Object.keys(GUNS).reduce((a,k)=>a+itemCount(k),0)}
function useVal(u){return S.crafted.filter(c=>c.use===u).reduce((a,c)=>a+(c.v||1),0)+(S.inv?S.inv.items.filter(o=>!o.k.startsWith("c:")&&ITEM_USE[o.k]===u).length*.5:0)}
function campPoint(ang,r){return{x:clamp(Math.cos(ang)*r,-SH+2,SH-2),z:clamp(4+Math.sin(ang)*r,-SH+2,SH-2)}}
function inCamp(x,z){return S.camp&&dist(x,z,0,4)<S.camp.r+3}
function campSize(){return members().length+1}

// ================= time =================
const MOVE=3.6/CLOCK;// units per game minute, walking: about 3.6 a second at 1×
function step(dt){if(!S)return;const t0=S.t;S.t+=dt;moveAll(dt);ordersTick(dt);deadTick(dt);wildTick(dt);pushTick(dt);
  if(Math.floor(S.t/HOUR)!==Math.floor(t0/HOUR))hourly()}
function mv(o,s){if(o.tx==null)return;const d=dist(o.x,o.z,o.tx,o.tz);if(d<=s){o.x=o.tx;o.z=o.tz;
    if(o.path&&o.path.length){const n=o.path.shift();o.tx=n[0];o.tz=n[1];return}o.tx=null;o.tz=null;o.path=null;if(o.onArrive){const f=o.onArrive;o.onArrive=null;f()}return}
  o.x+=(o.tx-o.x)/d*s;o.z+=(o.tz-o.z)/d*s;o.dir=Math.atan2(o.tx-o.x,o.tz-o.z)}
// how fast someone moves over this bit of ground: climbing over a car or a wall section is slow
function footSpeed(o){if(!LOCS[o.loc])return 1;const g=grid(o.loc).a[gc(o.z)*GN+gc(o.x)];o.climb=g===2;return g===2?.35:1}
function moveAll(dt){const sp=MOVE*dt;const pl=S.player;if(pl.ko<=0&&LOCS[pl.loc]&&!pl.grabbed)mv(pl,sp*1.15*footSpeed(pl)*(pl.pushing?0:1));
  const fol=withYou();
  for(const p of S.people){if(p.status==="dead"||p.status==="left"||p.grabbed)continue;
    if(p.follow&&p.loc===pl.loc&&LOCS[p.loc]&&pl.ko<=0&&!p.busy&&!p.pushing){const d=dist(p.x,p.z,pl.x,pl.z);if(d>3&&(p.tx==null||dist(p.tx,p.tz,pl.x,pl.z)>3)){const i=fol.indexOf(p);const a=(pl.dir||0)+Math.PI+(i-(fol.length-1)/2)*.55;moveTo(p,pl.x+Math.sin(a)*1.9,pl.z+Math.cos(a)*1.9)}}
    if(p.pushing)continue;const run=p.flee&&S.t<p.flee?1.25:1;mv(p,sp*(p.hp<40?.6:1)*(p.kid?.95:1)*run*footSpeed(p))}
  spreadOut(dt)}
// people don't stand inside each other: anyone closer than an arm's length gets nudged apart, never into a wall
function spreadOut(dt){const k=S.player.loc;if(!LOCS[k])return;const L=[];if(S.player.ko<=0)L.push(S.player);
  for(const p of S.people)if(p.loc===k&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out)&&!p.inBed&&!p.pushing&&!p.grabbed)L.push(p);
  if(L.length<2)return;const g=grid(k).a;const push=Math.min(1,dt*1.5);
  for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];let dx=b.x-a.x,dz=b.z-a.z;const d=Math.hypot(dx,dz);if(d>=.62)continue;
    if(d<1e-3){const r=(i*7+j*3)%6.28;dx=Math.cos(r);dz=Math.sin(r)}else{dx/=d;dz/=d}const m=(.62-d)*.5*push;
    // whoever is walking gives way; two people standing still both shuffle a little
    const wa=a.id==="you"||a.tx!=null&&b.tx==null?.15:1,wb=b.id==="you"||b.tx!=null&&a.tx==null?.15:1;
    const ax=a.x-dx*m*wa,az=a.z-dz*m*wa,bx=b.x+dx*m*wb,bz=b.z+dz*m*wb;
    if(!g[gc(az)*GN+gc(ax)]){a.x=ax;a.z=az}if(!g[gc(bz)*GN+gc(bx)]){b.x=bx;b.z=bz}}}
function nearestLiving(loc,x,z,r){let b=null,bd=r;const pl=S.player;if(pl.ko<=0&&pl.loc===loc&&!S.flags.traveling){const d=dist(x,z,pl.x,pl.z);if(d<bd){b=pl;bd=d}}
  for(const p of S.people){if(p.loc!==loc||p.status==="dead"||p.status==="left"||p.away&&p.away.out||p.sleep&&p.inside)continue;const d=dist(x,z,p.x,p.z);if(d<bd){b=p;bd=d}}return b}

// ================= the dead =================
function spawnWalker(loc,x,z){if(x==null){const E=SH-1;for(let i=0;i<12;i++){const e=rf()*4|0;const t=rf()*2-1;[x,z]=[[t*E,-E],[E,t*E],[t*E,E],[-E,t*E]][e];
      // they come in from the edges, but not right on top of someone
      if(!S||!LOCS[loc]||!liveHere(loc).some(o=>dist(o.x,o.z,x,z)<12))break}}
  const w={id:nid("w"),loc,x,z,tx:null,tz:null,path:null,cool:0,look:{skin:pick(["#8a9a7a","#9aa08a","#7a8a6a","#a0a890"]),top:pick(LOOK.top),pants:pick(LOOK.pants)}};S.walkers.push(w);return w}
function walkersAt(loc){return S.walkers.filter(w=>w.loc===loc&&!w.dead)}
// The dead at a place are the people who were there when it started (not all of them have turned on day one),
// plus whatever the living have drawn in since. Busy places fill up; places nobody goes stay quiet.
function placeDead(k){const P=place(k);if(P.dead==null)P.dead=LOCS[k]?.pop??3;return P.dead}
function turned(){return Math.min(1,.45+(dayOf(S.t)-1)*.3)}
// fewer than there were people: most of the dead wander off, so a place holds about half of who was there
function deadHere(k){const P=place(k);return Math.round(placeDead(k)*turned()*.55+(P.heat||0)/4)}
function dangerAt(k){return clamp(deadHere(k)/3.5,.3,5)}
// one of them goes down for good
function putDown(w){if(!w||w.dead)return;w.dead=true;w.diedAt=S.t;if(!LOCS[w.loc])return;const P=place(w.loc);if(w.orig)P.dead=Math.max(0,placeDead(w.loc)-1);else P.heat=Math.max(0,(P.heat||0)-2)}
// when you arrive somewhere, the dead that live there are waiting
function topUpWalkers(loc){if(loc===campK()||!LOCS[loc])return;const pl=place(loc);
  const burnt=pl.burned?.4:1;const want=Math.round(deadHere(loc)*burnt);const have=walkersAt(loc);let orig=Math.round(placeDead(loc)*turned()*.55*burnt)-have.filter(w=>w.orig).length;
  for(let i=have.length;i<want;i++){let x,z,t=0;do{x=(rf()*2-1)*(SH-4);z=(rf()*2-1)*(SH-6)-4;t++}while(t<20&&(blockedAt(loc,x,z)||dist(x,z,ENTRY.x,ENTRY.z)<14));const w=spawnWalker(loc,x,z);if(orig-->0)w.orig=true}}
function walkerHour(){S.walkers=S.walkers.filter(w=>!w.dead||S.t-w.diedAt<DAY/2);
  // places you're not at forget their dead until you come back
  S.walkers=S.walkers.filter(w=>w.loc===S.player.loc||w.loc===campK());
  // the living stir things up, and places nobody goes cool off
  for(const P of Object.values(S.places))P.heat=(P.heat||0)*.985;
  const here_k=S.player.loc;if(LOCS[here_k]&&here_k!==campK()&&!S.flags.traveling){const P=place(here_k);P.heat+=(1+withYou().length)*.12;
    if(rf()<P.heat/70&&walkersAt(here_k).length<9){const w=spawnWalker(here_k);w.alert={x:S.player.x+rf()*8-4,z:S.player.z+rf()*8-4}}}
  if(S.camp){const live=walkersAt(S.camp.site);const n=campSize();const s=SITES[S.camp.site];const P=place(S.camp.site);
    // a bigger camp makes more noise and draws more of them
    P.heat+=n*.02;const early=Math.min(1,dayOf(S.t)/4);const rate=(.008+P.heat/320)*early/(s.hide||1)*(yardSealed()?.5:1);if(live.length<1+n/4&&rf()<rate)spawnWalker(S.camp.site)}}
function fightOf(x){return x.id==="you"?2+Math.min(1,useVal("weapon")*.3):x.sk.fight+(x.tr.brave>.3?.5:0)+(x.gun&&x.loc===campK()&&S.res.ammo>=1?.6:0)}
// a shot fired in a scuffle: the flash, and the noise that brings more of them
function gunNoise(o,w){const G=GUNS[o.id==="you"?S.player.gun:o.gun];if(!G)return;o.aim=typeof performance!=="undefined"?performance.now():0;if(typeof shotFx==="function")shotFx(o,w,true);noiseAt(o.loc,o.x,o.z,G.noise)}
// a noise: the dead within earshot turn to look. Gunshots and alarms also stir up the whole area (heat); work noise barely does.
function noiseAt(loc,x,z,r,heat){if(LOCS[loc])place(loc).heat=(place(loc).heat||0)+r/16*(heat??1);for(const o of S.walkers){if(o.loc!==loc||o.dead||o.hunt||dist(o.x,o.z,x,z)>r)continue;o.alert={x:clamp(x+rf()*4-2,-SH+1,SH-1),z:clamp(z+rf()*4-2,-SH+1,SH-1)};o.rp=0}
  if(typeof spookAll==="function")spookAll(loc,x,z,r);
  // further off, more of them hear it and come to see
  if((heat??1)>=.5&&rf()<r/150&&walkersAt(loc).length<10){const n=spawnWalker(loc);n.alert={x:clamp(x+rf()*6-3,-SH+1,SH-1),z:clamp(z+rf()*6-3,-SH+1,SH-1)}}}
function knockOut(){const pl=S.player;pl.ko=1;pl.hp=35;log("Everything goes black.","bad");
  const saver=S.people.filter(p=>p.status==="member"&&p.loc===pl.loc&&!p.kid)[0]||here().filter(p=>!p.kid).sort((a,b)=>b.sk.fight-a.sk.fight)[0];
  setTimeout(()=>{if(!S)return;S.t+=3*HOUR;if(S.camp&&pl.loc!==S.camp.site)arriveAt(S.camp.site,true);pl.x=2;pl.z=6;pl.tx=null;pl.path=null;pl.ko=0;
    log(saver?`You wake up by the fire. ${saver.name} found you and got you home. "Don't do that again," ${pronoun(saver)} says.`:"You wake up hours later, somehow in one piece, and stagger home.","warn");
    if(saver){saver.trust=Math.min(100,saver.trust+3);mem(saver,`I got ${pl.name} home when they went down.`,3)}
    if(typeof onScene==="function")onScene()},50)}

// ================= the hour =================
function hourly(){const h=hourOf(S.t);if(typeof armUp==="function")armUp(true);
  if(!S.camp){for(const p of S.people)if(p.status==="member"&&!p.follow&&p.tx==null&&rf()<.4)moveTo(p,p.x+rf()*4-2,p.z+rf()*4-2);walkerHour();return}
  if(h===6)dawn();if(h===8){sendScavs();sendHunters()}
  for(const p of S.people){if(p.status==="member"&&atCamp(p))planHour(p,h);else if(p.status==="stranger"&&p.loc===campK())strangerHour(p);else if(p.status==="member"&&p.away&&p.away.out&&S.t>=p.away.back){if(p.away.kind==="hunt")hunterBack(p);else comeBack(p)}}
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
function planHour(p,h){if(p.follow||p.busy){p.sleep=false;return}const c=S.camp;
  // a job's work order ends with the working day; one you gave yourself holds until it's done (people still sleep, a watch doesn't)
  if(p.order&&p.order.job&&(h>=19||h<7))endOrder(p,true);
  const night=h>=22||h<6;if(p.order&&!(night&&p.order.k!=="guard")){p.sleep=false;p.inBed=false;p.inside=false;p.order.paused=false;p.act=orderAct(p);return}
  if(p.order)p.order.paused=true;
  // keep doing what you're doing for a while instead of changing your mind every hour
  if(!night&&p.planUntil&&S.t<p.planUntil&&!p.sleep&&p.hp>=35&&!(p.job&&h===7)){return}
  p.planUntil=0;p.sleep=false;p.inside=false;p.at=null;p.anim=null;
  if(p.bitten&&p.quarantine){p.act="locked away";return}
  if(h>=22||h<6){p.sleep=true;p.inBed=false;const lay=layout(c.site);const i=here().indexOf(p);const siteBeds=lay.beds.length;let spot=null,floor=false;
    if(i<siteBeds){spot=lay.beds[i];p.inBed=true}
    else{let j=i-siteBeds;for(const b of campBlds().filter(b=>b.done&&BUILDS[b.type].beds)){const cap=BUILDS[b.type].beds;if(j<cap){spot={x:b.x,z:b.z};p.inside=true;break}j-=cap}}
    if(!spot){const fl=lay.b.filter(r=>r.floorSpots).flatMap(r=>r.floorSpots);if(fl.length){spot=fl[(i-siteBeds)%fl.length];floor=true}else spot=campPoint(rf()*6.28,3)}
    moveTo(p,spot.x,spot.z,()=>{p.dir=0});p.act=p.inBed||p.inside?"asleep":floor?"asleep on the floor":"sleeping on the ground";return}
  if(p.hp<35){const m=bldDone("clinic")[0];const s=m?{x:m.x,z:m.z+2.4}:campPoint(.8,3);moveTo(p,s.x+rf(),s.z+rf());p.act="resting, hurt";return}
  if(p.job&&h>=7&&h<19&&willWork(p)&&p.job!=="scav"&&p.job!=="hunt"){if(jobOrder(p))return;const s=p.ws&&p.wsJob===p.job&&p.ws.d===dayOf(S.t)?p.ws:jobSpot(p);p.ws={...s,d:dayOf(S.t)};p.wsJob=p.job;moveTo(p,s.x,s.z,()=>{p.anim=JOB_ANIM[p.job]||null});p.at=s.b?s.b.id:"spot";p.act=s.txt||JOBS[p.job].v;return}
  freeTime(p,h)}
const JOB_ANIM={farm:"dig",water:"carry",guard:"guard",cook:"stir",medic:"tend",build:"hammer"};
// what someone does with their own time, by who they are
function freeTime(p,h){const T=p.tr;const opts=[];const fire=bldDone("fire")[0];const fam=famHere(p);const others=here().filter(q=>q!==p&&!q.sleep);
  if(fam.length)opts.push([1+T.kind+(p.motive==="family"?1.5:0),()=>{const q=pick(fam);moveTo(p,q.x+1,q.z+1);return q.kid?`watching over ${q.name}`:`keeping close to ${q.name}`}]);
  if(others.length)opts.push([1+T.social*1.5,()=>{const q=pick(others);moveTo(p,q.x+1.2,q.z+.6);if(rf()<.4)chatter(p,q);return`talking with ${q.name}`}]);
  const indoor=fire&&fire.opt&&fire.opt.indoor;
  if(fire)opts.push([.8-T.diligent*.6+(h>=18?1.2:0),()=>{if(indoor)moveTo(p,fire.x+1+rf()*1.6,fire.z-.4-rf()*1.6);else moveTo(p,fire.x+rf()*3-1.5,fire.z+rf()*3-1.5);return indoor?(h>=18?"warming up by the stove":"taking it easy inside"):h>=18?"sitting by the fire":"taking it easy"}]);
  // home life inside: the table, and somewhere quiet
  const lay=layout(S.camp.site);if(lay.table)opts.push([.6+(h>=17?.8:0),()=>{moveTo(p,lay.table.x+rf()*1.6-.8,lay.table.z+(rf()<.5?-.85:.85));return pick(["sitting at the table","playing cards at the table","mending clothes at the table","having coffee at the table"])}]);
  const home=lay.b.find(r=>r.floorSpots&&r.floorSpots.length);if(home)opts.push([.35+(T.social<0?.45:0)+(T.brave<0?.3:0),()=>{const s=pick(home.floorSpots);moveTo(p,s.x,s.z);return pick(["resting inside","reading by the window","keeping out of the wind","sitting quietly inside"])}]);
  const bench=bldDone("bench")[0]||bldDone("garden")[0];if(bench)opts.push([.5+T.social*.3,()=>{moveTo(p,bench.x+rf(),bench.z+1);return bench.type==="garden"?"looking at the flowers":"sitting on the bench"}]);
  const bp=campBlds().find(b=>!b.done);if(bp&&!p.kid&&p.hp>=50)opts.push([.6+T.diligent*1.4+T.kind*.4,()=>{giveOrder(p,{k:"build",bid:bp.id,self:true,until:S.t+2*HOUR},true);return`helping build the ${bp.name.toLowerCase()}`}]);
  const n=campSize();if(!p.kid||p.age>=10){if(S.res.water<n*2)opts.push([1.2+T.diligent+T.kind*.5,()=>{const s=jobSpot({...p,job:"water"});moveTo(p,s.x,s.z);p.at="water";return"fetching water, since we're low"}]);
    if(S.res.food<n*2&&!p.kid)opts.push([1+T.diligent+T.kind*.5,()=>{const s=campPoint(rf()*6.28,S.camp.r+2);moveTo(p,s.x,s.z);p.at="forage";return"foraging, since food's low"}])}
  if(T.faith>.3)opts.push([T.faith*1.2,()=>{const s=campPoint(-1.6,6);moveTo(p,s.x,s.z);return"praying quietly"}]);
  if(!p.kid&&!p.job)opts.push([.4+T.diligent*.8+(p.motive==="purpose"?1:0),()=>{const s=campPoint(rf()*6.28,S.camp.r+2);moveTo(p,s.x,s.z);p.at="forage";return"foraging nearby"}]);
  if(p.kid)opts.push([1.4,()=>{const s=campPoint(rf()*6.28,rf()*8);moveTo(p,s.x,s.z);return pick(["playing tag","drawing in the dirt","collecting rocks","climbing on things"])}]);
  opts.push([.5,()=>{const s=campPoint(rf()*6.28,rf()*S.camp.r);moveTo(p,s.x,s.z);return pick(["wandering around camp","mending clothes","staring at the road","sharpening a knife"])}]);
  p.planUntil=S.t+HOUR*(1+rf()*1.5);
  let tot=opts.reduce((a,o)=>a+Math.max(.05,o[0]),0),r=rf()*tot;for(const o of opts){r-=Math.max(.05,o[0]);if(r<=0){p.act=o[1]();return}}p.act=opts[opts.length-1][1]()}
const SMALL=["Think it'll rain?","You sleep at all?","I keep thinking about my old kitchen.","Did you hear that last night?","We need more salt.","My back is killing me.","Bet the city's worse.","You hungry? Me too.","Remember ice cream?","I miss music."];
function chatter(p,q){if(p.loc!==S.player.loc)return;say(p,pick(SMALL));setTimeout(()=>{if(S)say(q,pick(["Yeah.","Don't start.","Ha. Maybe.","Same.","Mm-hm.","Every night."]))},1600)}
function eff(p){return(.6+p.sk[JOBS[p.job]?.sk||"farm"]*.22+p.tr.diligent*.15)*(.65+p.mood/280)*(p.hp<50?.6:1)*(p.kid?.5:1)*(S.inv&&S.inv.items.some(o=>o.by===p.id)?1.15:1)}
function work(h){const s=SITES[S.camp.site];const day=h>=7&&h<19;S.res.water+=bldDone("well").length*.35*(rf()<.3?2:1)+Math.max(0,(s.water||1)-.7)*.1;
  for(const p of here()){if(!day||p.sleep||!p.at||p.order)continue;if(dist(p.x,p.z,p.tx??p.x,p.tz??p.z)>4)continue;
    if(p.at==="forage"){S.res.food+=.14;continue}if(p.at==="water"){S.res.water+=.45*SITES[S.camp.site].water;continue}const b=p.at==="spot"?null:S.blds.find(x=>x.id===p.at);const e=eff(p);
    if(b&&!b.done)continue;
    switch(p.job){case"farm":if(!b){S.res.food+=.1;break}if(b.type==="coop"){S.res.food+=.25*e;break}b.grow=Math.min(1,b.grow+1/40*e);S.res.food+=b.grow>=1?.42*e*s.farm:.04;break;
      case"water":S.res.water+=(b?.9:.6)*e*s.water;break;
      case"build":if(b&&b.type==="shop"&&S.res.scrap>=1&&rf()<.12*e){S.res.scrap--;S.res.ammo+=2}break;
      case"cook":S.today.cook=(S.today.cook||0)+e;break;
      case"medic":for(const q of here()){if(q.hp<100)q.hp=Math.min(100,q.hp+(bldDone("clinic").length?2.5:1.2)*e);if(q.sick&&S.res.meds>=1&&rf()<.05){S.res.meds--;q.sick=0;log(`${p.name} got ${q.name}'s fever down with the last of the antibiotics.`)}}break}}
  if(S.today.fed!==false&&S.today.watered!==false)for(const q of members())if(q.hp<100&&!q.sick&&!q.noMed)q.hp=Math.min(100,q.hp+.3);
  if(h===12){const f=useVal("fishing")+useVal("trapping");if(f)S.res.food+=f*1.5;const w=useVal("water");if(w)S.res.water+=w*1.2}}
function finishBld(b,by){b.done=true;b.prog=BUILDS[b.type].hrs;S.bv++;log(`${by?(by.id==="you"?"You":by.name)+" finished":"Finished"} the ${b.name.toLowerCase()}.`,"good");if(by&&by.id!=="you")mem(by,`I built the ${b.name.toLowerCase()}.`,2);if(typeof onBld==="function")onBld(b)}
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
  for(const p of members()){if(p.sick){p.sick--;p.hp-=8;if(p.hp<=0)die(p,"died of the fever");else if(!p.sick)log(`${p.name}'s fever broke.`,"good")}
    // a bite they kept quiet about comes out with the fever
    if(p.hidBite&&p.bitten&&p.status==="member"){p.hidBite=false;log(`${p.name} is burning up and won't let anyone near ${pronoun(p,"p")} arm. When someone finally looks, it's a bite. ${pronoun(p,"S")} had it when you let ${pronoun(p,"o")} in.`,"bad");queueCard("bitten",{who:p.id});continue}
    if(p.bitten&&!p.cured&&p.status==="member"){p.turn=(p.turn||0)+1;if(p.turn>=2)turnPerson(p)}}
  needsDawn();if(S.camp)topUpAnimals(S.camp.site);
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
  for(const p of hh){p.status="stranger";p.trust=ri(10,30);p.waitTill=S.t+30*HOUR;S.people.push(p);moveTo(p,wait.x+rf()*3-1.5,wait.z+rf()*2-1)}if(typeof maybeHiddenBite==="function")maybeHiddenBite(hh);
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
function comeBack(p){const k=p.away.to;const L=LOCS[k];const r=lootRoll(k,p.sk.scav);const armed=p.gun&&S.res.ammo>=1;const danger=(dangerAt(k)*.05-p.sk.scav*.025)*(armed?.65:1);const P=place(k);P.heat=(P.heat||0)+1.5;if(rf()<(armed?.6:.3))P.dead=Math.max(0,placeDead(k)-1);
  if(armed)S.res.ammo=Math.max(0,S.res.ammo-ri(1,4));
  p.away.out=false;p.x=ENTRY.x;p.z=ENTRY.z;
  if(rf()<danger*.18&&!p.kid){p.away=null;die(p,`never came back from the ${L.n}`);return}
  if(rf()<danger){p.hp-=ri(10,28);log(`${p.name} ran into trouble at the ${L.n} and came back limping.`,"warn")}
  addLoot(r);log(`${p.name} came back from the ${L.n} with ${lootWords(r)||"nothing worth carrying"}.`);
  if(rf()<.1){const hh=mkHousehold(null,campK(),{x:ENTRY.x+2,z:ENTRY.z});for(const q of hh){q.status="stranger";q.trust=35;q.waitTill=S.t+30*HOUR;S.people.push(q)}if(typeof maybeHiddenBite==="function")maybeHiddenBite(hh);log(`${p.name} brought someone back: ${listAnd(hh.map(q=>q.name))}, found hiding there.`,"big")}
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
