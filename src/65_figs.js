
// ================= people and the dead: instanced, jointed figures =================
// Every body part is one InstancedMesh shared by everyone on screen, so seventy people cost the same few draw calls as one.
const FIG={cap:240,P:{},list:[],idx:{},corpses:[]};
const SKINS=["#f0d2b4","#e8c3a0","#d9a982","#c99873","#a8744e","#8a5a3a","#6a4430","#4e3324"];
const HAIRC={black:"#1d1a18",brown:"#4a3020",blond:"#c9a85a",red:"#8a3a1f",gray:"#9a9a96",white:"#d8d6d0"};
const TOPS=["#56636c","#6c5a4a","#4f5b48","#7a6a58","#4a5560","#6e4f4f","#5d6e78","#7d7466","#3f4a52","#8a6e52","#5a4f6a","#3d5a50","#a8a49a","#7a3a32","#2f3e58","#c8c0b0"];
const PANTS=["#3a4a6a","#2f3b52","#8a7a5a","#2a2a2e","#5a5e62","#4a4038","#6a6a5a"];
const SHOES=["#3a2a1e","#1a1a1a","#d8d4c8","#5a3a22","#4a4a4a"];
function figGeo(){const G={};
  const taper=(wb,wt,h,db,dt)=>{const g=new T3.BoxGeometry(1,1,1);g.translate(0,.5,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);const w=y>.5?wt:wb,d=y>.5?dt:db;p.setX(i,p.getX(i)*w);p.setZ(i,p.getZ(i)*d);p.setY(i,y*h)}g.computeVertexNormals();return g};
  const tr=(g,x,y,z)=>{g.translate(x,y,z);return g};const rx=(g,a)=>{g.rotateX(a);return g};
  G.torsoM=taper(.3,.44,.52,.2,.23);G.torsoF=mergeGeos([taper(.3,.35,.5,.19,.2),tr(new T3.SphereGeometry(.075,8,6),-.075,.36,.07),tr(new T3.SphereGeometry(.075,8,6),.075,.36,.07)]);
  G.hipsM=tr(new T3.BoxGeometry(.31,.2,.2),0,0,0);G.hipsF=tr(new T3.BoxGeometry(.35,.21,.21),0,0,0);
  G.leg=tr(new T3.CylinderGeometry(.075,.058,.84,7),0,-.42,0);G.foot=tr(new T3.BoxGeometry(.11,.08,.25),0,-.86,.045);
  G.arm=tr(new T3.CylinderGeometry(.055,.045,.58,7),0,-.29,0);G.hand=tr(new T3.SphereGeometry(.052,7,5),0,-.62,0);
  G.head=new T3.SphereGeometry(.118,12,9);G.head.scale(1,1.1,1.05);
  const cap=()=>tr(new T3.SphereGeometry(.13,12,7,0,Math.PI*2,0,Math.PI*.56),0,.012,-.012);
  G.hShort=cap();G.hBuzz=tr(new T3.SphereGeometry(.123,12,7,0,Math.PI*2,0,Math.PI*.46),0,.006,-.006);
  G.hLong=mergeGeos([cap(),tr(new T3.BoxGeometry(.25,.36,.07),0,-.12,-.095),tr(new T3.BoxGeometry(.07,.26,.1),-.115,-.07,-.03),tr(new T3.BoxGeometry(.07,.26,.1),.115,-.07,-.03)]);
  G.hPony=mergeGeos([cap(),tr(rx(new T3.CylinderGeometry(.04,.025,.26,6),.5),0,-.07,-.17)]);
  G.hBun=mergeGeos([cap(),tr(new T3.SphereGeometry(.068,8,6),0,.07,-.13)]);
  G.beard=tr(new T3.BoxGeometry(.18,.12,.09),0,-.085,.075);
  G.hat=mergeGeos([tr(new T3.CylinderGeometry(.165,.165,.02,14),0,.05,.03),tr(new T3.SphereGeometry(.13,12,6,0,Math.PI*2,0,Math.PI/2),0,.05,0)]);
  G.helmet=tr(new T3.SphereGeometry(.152,12,8,0,Math.PI*2,0,Math.PI*.62),0,.0,0);
  G.pack=tr(new T3.BoxGeometry(.3,.36,.15),0,.26,-.18);G.band=tr(new T3.CylinderGeometry(.062,.062,.08,8),0,-.1,0);
  G.pool=new T3.CircleGeometry(1,14);G.pool.rotateX(-Math.PI/2);
  return G}
function initFigs(sc){const G=figGeo();for(const [k,g] of Object.entries(G)){const mat=new T3.MeshLambertMaterial({color:0xffffff});if(k==="pool"){mat.transparent=true;mat.opacity=.85;mat.depthWrite=false}
    const m=new T3.InstancedMesh(g,mat,k==="leg"||k==="foot"||k==="arm"||k==="hand"?FIG.cap*2:FIG.cap);m.instanceMatrix.setUsage(T3.DynamicDrawUsage);m.frustumCulled=false;m.castShadow=k!=="pool";m.receiveShadow=k!=="pool";
    m.setColorAt(0,new T3.Color());m.count=0;/* the color buffer is sized from count, so it has to exist before count drops to zero */m.userData.part=k;sc.add(m);FIG.P[k]=m;FIG.idx[k]=[]}}
// what a person looks like, decided once from who they are
function lookOf(p){if(p.id==="you")return playerLook();const R=srng(hashStr(p.id));const l=(p.look||"").toLowerCase();const F=p.sex==="F";const age=p.age??30;
  const kid=age<13;let hairC=/gray/.test(l)||age>62?(age>74?HAIRC.white:HAIRC.gray):/black hair/.test(l)?HAIRC.black:/red hair/.test(l)?HAIRC.red:/blond/.test(l)?HAIRC.blond:pick2([HAIRC.brown,HAIRC.black,HAIRC.brown,HAIRC.blond],R);
  let hair=F?pick2(["hLong","hPony","hBun","hLong","hShort"],R):pick2(["hShort","hShort","hBuzz","hShort",age>50?null:"hShort"],R);if(/shaved/.test(l))hair=null;if(/ponytail/.test(l))hair="hPony";if(/curls/.test(l)&&!F)hair="hShort";
  const beard=!F&&!kid&&age>17&&(/beard/.test(l)||R()<.18);
  const J=p.job;let top=pick2(TOPS,R),pants=pick2(PANTS,R),shoes=pick2(SHOES,R),hat=null,hatC=null;
  if(J==="deputy"){top="#b8a47a";pants="#4a4636";hat="hat";hatC="#5a4a32"}else if(J==="nurse"||J==="doctor"){top=J==="nurse"?"#7aa8b8":"#d8dcd8";pants=J==="nurse"?"#7aa8b8":"#3a4048"}else if(J==="farmer"||J==="farmhand"){top=pick2(["#8a3a32","#6a7a8a","#7a5a3a"],R);pants="#3a4a6a";if(R()<.6){hat="hat";hatC=pick2(["#c8b890","#3a5a3a","#8a3a32"],R)}}
  else if(J==="quarry"||J==="foreman"){top="#c8a03a";pants="#4a4038";hat=R()<.4?"helmet":null;hatC="#e8c83a"}else if(J==="cook"||J==="waitress"){top="#e8e4dc"}else if(J==="pastor"){top="#2a2a2e";pants="#2a2a2e"}else if(J==="soldier"){top="#5a6040";pants="#5a6040"}else if(J==="hunter"){top="#6a5a3a";hat="hat";hatC="#c8681a"}
  if(kid){top=pick2(["#c83a32","#3a6ac8","#e8c83a","#3a9a5a","#c85a9a","#e88a3a"],R);shoes=pick2(["#d8d4c8","#c83a32","#3a6ac8"],R)}
  const sleeve=R()<.3&&!kid?pick2(["#3a3a3e","#5a3a26","#2f3e58","#6a6a52"],R):top;
  const build=/heavyset/.test(l)?[1.16,1]:/wiry|slight/.test(l)?[.88,1]:/broad/.test(l)?[1.1,1.02]:/athletic/.test(l)?[1.02,1.02]:[1,1];
  const tall=/tall/.test(l)?1.06:/short/.test(l)?.94:/stooped/.test(l)?.96:1;
  const s=(age<4?.5:age<8?.62:age<13?.74:age<16?.9:1)*(F?.95:1)*tall;
  return{F,skin:SKINS[(hashStr(p.id)>>>3)%SKINS.length],hair,hairC,beard,top,sleeve,pants,shoes,hat,hatC,s,wx:build[0],stoop:/stooped/.test(l)||age>72?.18:0}}
function playerLook(){const pl=S.player;const F=pl.sex==="F";const col=s=>{const g=gearEq(s);return g?ITEMS[g.id].col||"#7a7a74":null};const head=gearEq("head");
  const top=col("outer")||col("body")||pl.skin;return{F,skin:pl.skin||SKINS[3],hair:head||pl.hairStyle==="none"?null:pl.hairStyle||(F?"hLong":"hShort"),hairC:HAIRC[pl.hair]||HAIRC.brown,beard:!F&&pl.beard,
    top,sleeve:col("outer")||col("body")||pl.skin,pants:col("legs")||"#c8c0b0",shoes:col("feet")||pl.skin,hat:head?(head.id==="helmet"?"helmet":"hBuzz"):null,hatC:head?ITEMS[head.id].col:null,pack:col("back")||col("rig"),
    s:(pl.age<16?.92:1)*(F?.95:1)*(pl.build==="tall"?1.05:pl.build==="short"?.94:1),wx:pl.build==="heavy"?1.14:pl.build==="slim"?.9:1,stoop:0}}
function zedLook(z){const src=z.pid&&z.pid!=="you"?P(z.pid):null;const base=z.pid==="you"?playerLook():src?lookOf(src):lookOf({id:z.id,sex:hashStr(z.id)%2?"F":"M",age:20+hashStr(z.id)%55,job:pick2(["clerk","nurse","farmer","cook","unemployed","quarry","teacher","trucker"],srng(hashStr(z.id)))});
  const dk=c=>{const k=CC(c).clone().multiplyScalar(.62);k.r=Math.min(1,k.r*1.12);return k};const sk=srng(hashStr(z.id))()<.5?"#8f9c80":"#8a9078";
  return{...base,skin:sk,top:dk(base.top),sleeve:dk(base.sleeve),pants:dk(base.pants),hat:base.hat==="hat"&&!z.pid?null:base.hat,pack:null}}
// ---------- the list of bodies to draw ----------
function figFor(kind,src){return{kind,id:src.id,src,lk:null,phase:rf()*6,ang:0,x:src.x,z:src.z,walk:0,moving:0,lie:0,swing:0,lastLook:-1}}
const FIGMAP=new Map();
function syncFigs(){const pl=S.player;const keep=new Set();W3.zmap=new Map(S.zeds.map(z=>[z.id,z]));
  for(const p of S.people){if(!p.alive||p.age<2)continue;const near=Math.abs(p.x-pl.x)<62&&Math.abs(p.z-pl.z)<62;if(!near)continue;keep.add(p.id);if(!FIGMAP.has(p.id))FIGMAP.set(p.id,figFor("npc",p))}
  for(const z of S.zeds){if(Math.abs(z.x-pl.x)>56||Math.abs(z.z-pl.z)>56)continue;keep.add(z.id);if(!FIGMAP.has(z.id))FIGMAP.set(z.id,figFor("zed",z))}
  keep.add("you");if(!FIGMAP.has("you"))FIGMAP.set("you",figFor("you",pl));FIGMAP.get("you").src=pl;
  for(const [id,f] of FIGMAP)if(!keep.has(id)){if(f.lbl){f.lbl.remove();f.lbl=null}const o=f.kind==="zed"?null:P(id);if(f.kind==="npc"&&o&&!o.alive&&o.status==="dead"&&dist(f.x,f.z,pl.x,pl.z)<45)FIG.corpses.push({f:{...f,lie:1,dead:true},t:150});FIGMAP.delete(id)}
  W3.followers=S.people.filter(isFollower);W3.fset=new Set(W3.followers.map(p=>p.id))}
function isFollower(p){return p.alive&&p.follow&&(!p.group||p.group===S.player.group)}
// ---------- per-frame posing ----------
const _M={};function fm(){return _M.a||(_M.a=[0,1,2,3,4,5,6,7,8].map(()=>new T3.Matrix4()))}
let _E,_Q,_V,_S,_T;
function jm(out,parent,x,y,z,ax,ay,az,sx=1,sy=1,sz=1){_E.set(ax,ay,az);_Q.setFromEuler(_E);_V.set(x,y,z);_S.set(sx,sy,sz);_T.compose(_V,_Q,_S);out.multiplyMatrices(parent,_T);return out}
function drawFigs(dt,ts){if(!_E){_E=new T3.Euler();_Q=new T3.Quaternion();_V=new T3.Vector3();_S=new T3.Vector3();_T=new T3.Matrix4()}
  const FP=FIG.P;const n={};for(const k in FP)n[k]=0;for(const k in FIG.idx)FIG.idx[k].length=0;const col=new T3.Color();
  const put=(k,m,c,f)=>{const mesh=FP[k];const i=n[k]++;if(i>=mesh.instanceMatrix.count)return;mesh.setMatrixAt(i,m);col.copy(typeof c==="string"?CC(c):c);mesh.setColorAt(i,col);FIG.idx[k][i]=f};
  const [root,torso,hips,lL,lR,aL,aR,head,tmp]=fm();const I=new T3.Matrix4();
  const pl=S.player;
  const all=[...FIGMAP.values(),...FIG.corpses.map(c=>c.f)];
  for(const f of all){const o=f.kind==="zed"?W3.zmap.get(f.id)||f.src:f.kind==="you"?pl:P(f.id)||f.src;if(!o)continue;if(f.kind==="you"&&pl.alive===false)continue;
    if(!f.dead){const dx=o.x-f.x,dz=o.z-f.z;const mv=Math.hypot(dx,dz);f.moving=mv/Math.max(dt,1e-3);if(mv>.002){const a=Math.atan2(dx,dz);let d=a-f.ang;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;f.ang+=d*Math.min(1,dt*12)}f.x=o.x;f.z=o.z}
    if(f.kind==="you")f.ang=W3.ang;
    if(!f.lk||(f.kind==="you"&&ts-f.lastLook>500)){f.lk=f.kind==="zed"?zedLook(o):lookOf(o);f.lastLook=ts}
    const L=f.lk;const zed=f.kind==="zed";const lie=f.dead?1:f.kind==="npc"&&o.lie&&/asleep|resting/.test(o.act||"")&&dist(o.x,o.z,o.tx,o.tz)<.4?1:0;if(lie&&!f.dead&&o.lieRot!=null)f.ang=o.lieRot;
    const spd=Math.min(6,f.moving);f.phase+=dt*(zed?2.4:spd>3.5?11:7.5)*(spd>.15?1:0);const amp=spd>.15?(zed?.32:spd>3.5?.75:.5):0;f.walk+=(amp-f.walk)*Math.min(1,dt*8);
    const sw=Math.sin(f.phase)*f.walk;const s=L.s;const wx=L.wx;
    const ford=onFord(f.x,f.z)?-.3:0;const y=lie?.14*s:ford+(spd>.15&&!zed?Math.abs(Math.cos(f.phase))*.04*s:0);
    _E.set(0,f.ang,0);_Q.setFromEuler(_E);_V.set(f.x,y+.08*(bldAt(f.x,f.z)?1:0),f.z);_S.set(s*wx,s,s*wx);root.compose(_V,_Q,_S);
    if(lie){jm(root,root,0,0,0,-Math.PI/2,0,0);jm(root,root,0,-.9,0,0,0,0)}
    const lean=zed?.28+Math.sin(ts/600+f.phase)*.05:L.stoop+(f.kind==="you"&&W3.swing>0?.15*Math.sin(W3.swing/.2*Math.PI):0);
    jm(hips,root,0,.9,0,0,0,0);jm(torso,root,0,.92,0,lean,0,zed?Math.sin(ts/700+f.phase)*.06:0);
    const legSw=lie?0:sw;jm(lL,root,-.09,.92,0,legSw,0,0);jm(lR,root,.09,.92,0,-legSw,0,0);
    const shw=L.F?.19:.235;let aLx=-sw*.8,aRx=sw*.8;if(zed){aLx=-1.35+Math.sin(ts/500+f.phase)*.12;aRx=-1.3+Math.cos(ts/520+f.phase)*.12}
    if(f.kind==="you"&&W3.swing>0)aRx=-2.2*Math.sin(Math.max(0,W3.swing)/.2*Math.PI);if(lie){aLx=0;aRx=0}
    jm(aL,torso,-shw,.47,0,aLx,0,.1);jm(aR,torso,shw,.47,0,aRx,0,-.1);jm(head,torso,0,.66,0,zed?.3:0,0,zed?.15:0);
    put(L.F?"torsoF":"torsoM",torso,L.top,f);put(L.F?"hipsF":"hipsM",hips,L.pants,f);put("leg",lL,L.pants,f);put("leg",lR,L.pants,f);put("foot",lL,L.shoes,f);put("foot",lR,L.shoes,f);
    put("arm",aL,L.sleeve,f);put("arm",aR,L.sleeve,f);put("hand",aL,L.skin,f);put("hand",aR,L.skin,f);put("head",head,L.skin,f);
    if(L.hair&&!(L.hat==="helmet"))put(L.hair,head,L.hairC,f);if(L.beard)put("beard",head,L.hairC,f);if(L.hat)put(L.hat==="hBuzz"?"hBuzz":L.hat,head,L.hatC||"#3a3a3a",f);
    if(L.pack||(f.kind==="npc"&&o.group&&["scavenger","hunter","forager"].includes(o.role)))put("pack",torso,L.pack||"#4a5a3a",f);
    if(f.kind==="npc"&&o.group&&G(o.group)&&!lie)put("band",aL,G(o.group).color,f);
    if(f.dead){tmp.makeScale(.9*s,1,.7*s);tmp.setPosition(f.x,.025,f.z);put("pool",tmp,"#4a0e0a",f)}}
  for(const k in FP){const m=FP[k];m.count=Math.min(n[k],m.instanceMatrix.count);m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true}
  FIG.corpses=FIG.corpses.filter(c=>{c.t-=dt;return c.t>0})}
function addCorpse(src,kind){const f=figFor(kind,src);f.lk=kind==="zed"?zedLook(src):lookOf(src);f.dead=true;f.lie=1;f.x=src.x;f.z=src.z;const old=FIGMAP.get(src.id);if(old)f.ang=old.ang;FIG.corpses.push({f,t:kind==="zed"?70:150})}
// which figure is under the mouse
function pickFig(rc,ok){const ms=["torsoM","torsoF","head","hipsM","hipsF","leg","arm"].map(k=>FIG.P[k]).filter(Boolean);const hits=rc.intersectObjects(ms,false);
  for(const h of hits){const f=FIG.idx[h.object.userData.part]?.[h.instanceId];if(f&&!f.dead&&f.kind!=="you"&&(!ok||ok(f)))return{f,d:h.distance}}return null}
