
// ================= the world: isometric free-roam view =================
const W3={ok:false,wrap:null,lblBox:null,ren:null,scene:null,cam:null,rc:null,plane:null,v3:null,zoom:1,keys:{},run:false,
  ptarget:null,talkOnArrive:null,attackT:null,figs:new Map(),zfigs:new Map(),zmap:new Map(),corpses:[],pick:new Set(),hover:null,
  last:0,acc:0,tk:{},nearKey:"",region:null,siteKeys:{},siteObj:{},siteFlames:{},blabels:new Map(),walled:new Set(),nearB:[],
  cd:0,swing:0,ang:0,moving:false,player:null,followers:[],fset:new Set(),camX:0,camZ:0,campfire:null,hurt:0,rw:1,rh:1,
  dirty:false,leftDirty:false,promptT:null,promptKey:"",trees:null,bmeshes:[],flames:[],precip:null,wx:null,night:false,mark:null};
let T3=null,GEO=null;const MATS={};
const hashStr=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const srng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const pick2=(a,R)=>a[Math.floor(R()*a.length)];
function mat(c){if(!MATS[c])MATS[c]=new T3.MeshLambertMaterial({color:c});return MATS[c]}
function mesh(g,c,x,y,z,sx,sy,sz){const m=new T3.Mesh(g,typeof c==="string"?mat(c):c);m.position.set(x,y,z);m.scale.set(sx,sy??sx,sz??sx);return m}
function initGeo(){T3=window.THREE;GEO={body:new T3.CylinderGeometry(.26,.32,.95,8),head:new T3.SphereGeometry(.24,10,8),cap:new T3.SphereGeometry(.255,10,6,0,Math.PI*2,0,Math.PI/2),
  band:new T3.CylinderGeometry(.295,.3,.1,10),cone:new T3.ConeGeometry(1,1,7),cone4:new T3.ConeGeometry(1,1,4),cyl:new T3.CylinderGeometry(1,1,1,8),box:new T3.BoxGeometry(1,1,1),
  sph:new T3.SphereGeometry(1,8,6),rock:new T3.DodecahedronGeometry(1,0),ring:new T3.RingGeometry(.42,.56,24),stick:new T3.BoxGeometry(.07,.07,.85)}}

// ---- map layout that isn't in the sim: roads, trails, quarry walls ----
const GCOL={wilds:"#2f3627",fields:"#4a4a2d",woods:"#202c1c",hills:"#46443b",river:"#2a4a5f",town:"#323b2e",road:"#38393b",farm:"#4d5032",church:"#33442f",quarry:"#683f2e",school:"#35432e",lodge:"#2d3b25",mill:"#433e30"};
const ROADS=[[23,-100,33,100,"hwy"],[8,-7.5,92,-1.5,"st"],[33,-32.5,92,-28.5,"st"],[33,19.5,62,23.5,"st"],[8.5,-46,11.5,38,"st"],[-55,-6,8.5,-3,"dirt"],[33,-76.5,71,-73.5,"dirt"],[-20,55.5,23,58.5,"dirt"],[-27.5,-3,-24.5,25,"dirt"]];
const TRAILS=[[[-85,-6],[-97,-30],[-108,-43]],[[-60,8],[-57,42]],[[-57,52],[-56,76]],[[33,-60],[58,-74]]];
const QWALLS=[[60,-96,122,-94],[60,-60,122,-58],[120,-96,122,-58],[60,-96,62,-78],[60,-72,62,-58]];
const SKY={clear:"#8fb0c4",overcast:"#7c8790",rain:"#5f6b74",snow:"#aab4bb",fog:"#8a9188"};
function siteRect(k){const s=PLACES[k].site;const hw=s.gw*1.5,hd=s.gh*1.5;return[s.c[0]-hw,s.c[1]-hd,s.c[0]+hw,s.c[1]+hd]}
function tileXZ(k,i){const s=PLACES[k].site;const x=i%s.gw,y=Math.floor(i/s.gw);return{x:s.c[0]+(x-(s.gw-1)/2)*3,z:s.c[1]+(y-(s.gh-1)/2)*3}}
function inQuarry(x,z){return x>60&&x<122&&z>-96&&z<-58}
function isFollower(p){return p.alive&&p.follow&&(!p.group||p.group===S.player.group)}
function inside(p){if(p.group||p.follow||!p.home||(p.door||0)>S.t)return false;if(!/asleep|at home|holed up/.test(p.act||""))return false;return dist(p.x,p.z,p.tx,p.tz)<1.5}
function residentsHome(b){return S.people.filter(p=>p.alive&&p.home===b.id&&inside(p))}
function zedNear(r){const pl=S.player;return S.zeds.some(z=>Math.abs(z.x-pl.x)<r&&Math.abs(z.z-pl.z)<r&&dist(z.x,z.z,pl.x,pl.z)<r)}
function nearPeople(r){const pl=S.player;return S.people.filter(p=>p.alive&&p.age>=2&&!inside(p)&&dist(p.x,p.z,pl.x,pl.z)<r).sort((a,b)=>dist(a.x,a.z,pl.x,pl.z)-dist(b.x,b.z,pl.x,pl.z))}

// collision: buildings, the river (except the bridge and the ford), quarry walls, cars; the dead can't enter walled camps
function free(x,z,r=.32,zed=false){if(x<WB.x0+.5||x>WB.x1-.5||z<WB.z0+.5||z>WB.z1-.5)return false;
  if(z>42-r&&z<52+r&&!(x>23+r&&x<33-r)&&!(x>-62+r&&x<-52-r))return false;
  if(solidAt(x,z,r))return false;
  for(const q of QWALLS)if(x>q[0]-r&&x<q[2]+r&&z>q[1]-r&&z<q[3]+r)return false;
  if(Math.abs(x-28)<6)for(const c of CARS)if(Math.abs(x-c.x)<.95+r&&Math.abs(z-c.z)<2.05+r)return false;
  if(zed&&W3.walled.size&&W3.walled.has(regionAt(x,z)))return false;
  return true}
function step(e,dx,dz,r,zed){if(!free(e.x,e.z,r,zed)){e.x+=dx;e.z+=dz;return true}const nx=e.x+dx,nz=e.z+dz;
  if(free(nx,nz,r,zed)){e.x=nx;e.z=nz;return true}if(Math.abs(dx)>1e-4&&free(nx,e.z,r,zed)){e.x=nx;return true}if(Math.abs(dz)>1e-4&&free(e.x,nz,r,zed)){e.z=nz;return true}return false}
// next waypoint when a straight line won't do: through the quarry gate, over the bridge or the ford
function waypoint(x,z,tx,tz){const qa=inQuarry(x,z),qb=inQuarry(tx,tz);
  if(qa!==qb){if(dist(x,z,61,-75)>1.6)return{x:61,z:-75};return{x:qa?56:66,z:-75}}
  const n1=z<47,n2=tz<47;if(n1!==n2){const bx=28,fx=-57;const cx=Math.abs(x-bx)+Math.abs(tx-bx)<=Math.abs(x-fx)+Math.abs(tx-fx)?bx:fx;
    const inBand=z>=40&&z<=54&&Math.abs(x-cx)<4;if(inBand||dist(x,z,cx,n1?39:55)<1.2)return{x:cx,z:n1?55.5:38.5};return{x:cx,z:n1?39:55}}
  return null}

// ---- the 2D map (ground texture, minimap and Map tab) ----
function mapCanvas(){if(W3.mapC)return W3.mapC;const M=4,W=(WB.x1-WB.x0)*M,H=(WB.z1-WB.z0)*M;const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const X=x=>(x-WB.x0)*M,Z=z=>(z-WB.z0)*M;const rect=(r,col)=>{g.fillStyle=col;g.fillRect(X(r[0]),Z(r[1]),(r[2]-r[0])*M,(r[3]-r[1])*M)};
  g.fillStyle=GCOL.wilds;g.fillRect(0,0,W,H);
  for(const k of [...PLACE_ORDER].reverse())for(const r of PLACES[k].r)rect(r,GCOL[k]);
  const R=srng(11);
  g.strokeStyle="rgba(0,0,0,.14)";g.lineWidth=2;for(const r of PLACES.fields.r)for(let z=r[1]+1;z<r[3];z+=2.2){g.beginPath();g.moveTo(X(r[0]),Z(z));g.lineTo(X(r[2]),Z(z));g.stroke()}
  for(let i=0;i<24000;i++){const x=R()*W,y=R()*H,v=R();g.fillStyle=v<.55?"rgba(0,0,0,.11)":"rgba(240,235,200,.05)";const s=1+R()*3;g.fillRect(x,y,s,s)}
  rect([WB.x0,41.2,WB.x1,42.2],"#3c3a2c");rect([WB.x0,51.8,WB.x1,52.8],"#3c3a2c");rect([-62,42,-52,52],"#3f6375");
  for(let i=0;i<600;i++){g.fillStyle="rgba(170,200,215,.09)";g.fillRect(R()*W,Z(42.3+R()*9.4),6+R()*16,1.5)}
  for(const k of Object.keys(PLACES))if(PLACES[k].site){const r=siteRect(k);rect([r[0]-1,r[1]-1,r[2]+1,r[3]+1],"#3e3626")}
  for(const id of ["clinic","grocery","gas","schoolbldg","sheriff","library"]){const b=BMAP[id];rect([b.x-b.w/2-2,b.z-b.d/2-2,b.x+b.w/2+2,b.z+b.d/2+2],"#3d3e3e")}
  for(const r of ROADS)rect(r,r[4]==="dirt"?"#5a4d3a":r[4]==="hwy"?"#303133":"#3f4041");
  g.strokeStyle="#5a4d3a";g.lineWidth=2.6*M;g.lineCap="round";g.lineJoin="round";for(const t of TRAILS){g.beginPath();t.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke()}
  g.fillStyle="#b59a3a";for(let z=WB.z0;z<WB.z1;z+=6)if(!(z>39&&z<54))g.fillRect(X(27.85),Z(z),.3*M,3*M);
  rect([22.5,41,33.5,53],"#55544f");
  W3.mapC=c;return c}

// ---- static scenery ----
const BCOL={house:["#8a7f6e","#6e7f86","#9a8a6a","#7d6b5c","#a39782","#5f6e5a","#8c6f5a","#6d6a7a"],roof:["#4a3a32","#3a3f45","#5a3a2a","#2f3a33","#55493e"],
  clinic:"#c9c6bb",pharmacy:"#a9bfbb",hardware:"#8a6a4a",grocery:"#a8a090",diner:"#b85a4a",sheriff:"#6a7a8a",bar:"#5a4a3a",gas:"#c8b04a",library:"#8a7a6a",school:"#9a6a52",
  farmhouse:"#d8d4c8",barn:"#8a3a2a",church:"#8a8a84",hall:"#9a8a72",qoffice:"#7a7064",qsheds:"#6a6e72",mill:"#5a4632"};
function streetFace(b){if(b.type==="house"&&b.x>0&&b.x<20)return b.x<10?"+x":"-x";let best="+z",bd=13;if(b.x>30)for(const sz of [-30.5,-4.5,21.5]){const d=Math.abs(b.z-sz);if(d<bd){bd=d;best=sz>b.z?"+z":"-z"}}return best}
function doorPos(b){const f=streetFace(b);return{x:b.x+(f==="+x"?b.w/2+1.2:f==="-x"?-b.w/2-1.2:0),z:b.z+(f==="+z"?b.d/2+1.2:f==="-z"?-b.d/2-1.2:0)}}
function buildingMesh(b,R){const g=new T3.Group();g.position.set(b.x,0,b.z);const ty=b.type;
  const h=ty==="house"?2.8+R()*.8:ty==="school"?4.2:ty==="church"?5.2:ty==="barn"?4.6:ty==="qsheds"?3.2:ty==="mill"?3.4:3.6;
  const wm=new T3.MeshLambertMaterial({color:ty==="house"?pick2(BCOL.house,R):BCOL[ty]||"#888",transparent:true,opacity:1});
  const rm=new T3.MeshLambertMaterial({color:ty==="house"?pick2(BCOL.roof,R):ty==="barn"?"#5a2a20":ty==="church"?"#4a4d52":ty==="mill"?"#3a3026":"#3b3c3a",transparent:true,opacity:1});
  const walls=mesh(GEO.box,wm,0,h/2,0,b.w,h,b.d);walls.userData.bld=b;g.add(walls);
  if(["house","farmhouse","barn","church","hall","mill","qoffice"].includes(ty)){const rh=ty==="church"?3.4:ty==="barn"?2.8:1.6;const roof=new T3.Mesh(GEO.cone4,rm);roof.rotation.y=Math.PI/4;roof.scale.set(b.w*.74,rh,b.d*.74);roof.position.y=h+rh/2;g.add(roof)}
  else g.add(mesh(GEO.box,rm,0,h+.12,0,b.w+.2,.24,b.d+.2));
  const f=streetFace(b);const dx=f==="+x"?b.w/2:f==="-x"?-b.w/2:0,dz=f==="+z"?b.d/2:f==="-z"?-b.d/2:0;const xs=f[1]==="x";
  g.add(mesh(GEO.box,"#2a211b",dx*1.01,.9,dz*1.01,xs?.12:1.1,1.8,xs?1.1:.12));
  if(!["house","farmhouse","barn","mill","qoffice","qsheds","hall"].includes(ty))g.add(mesh(GEO.box,ty==="clinic"?"#c4483c":ty==="sheriff"?"#c9a227":ty==="church"?"#d8d4c8":"#e48a3f",dx*1.02,h-.55,dz*1.02,xs?.1:Math.min(b.w*.6,6),.55,xs?Math.min(b.d*.6,6):.1));
  if(ty==="church"){g.add(mesh(GEO.box,"#8a8a84",0,h+3,-b.d/2+1.5,2,6,2));const sp=mesh(GEO.cone4,"#4a4d52",0,h+7.3,-b.d/2+1.5,1.5,2.6,1.5);sp.rotation.y=Math.PI/4;g.add(sp)}
  if(ty==="gas"){g.add(mesh(GEO.box,"#d8d4c8",0,3.3,b.d/2+3.2,b.w,.3,4.5));for(const x of [-2.5,2.5]){g.add(mesh(GEO.box,"#888",x,1.6,b.d/2+3.2,.25,3.2,.25));g.add(mesh(GEO.box,"#c4483c",x,.6,b.d/2+3.2,.6,1.2,.4))}}
  if(ty==="school"){g.add(mesh(GEO.cyl,"#999",b.w/2+2,3,b.d/2+2,.06,6,.06));g.add(mesh(GEO.box,"#3a5a8a",b.w/2+2.6,5.5,b.d/2+2,1.1,.7,.05))}
  if(ty==="barn"){g.add(mesh(GEO.box,"#e8e2d0",0,1.6,b.d/2+.02,3.2,3.2,.08))}
  if(ty==="mill"){g.add(mesh(GEO.cyl,"#4a3a2a",b.w/2+1.2,1.4,0,1.3,.35,1.3));g.children[g.children.length-1].rotation.z=Math.PI/2}
  W3.bmeshes.push({b,g,wm,rm,f:1});W3.pick.add(walls);return g}
function carMesh(c,R){const g=new T3.Group();g.position.set(c.x,0,c.z);g.rotation.y=c.rot;const col=pick2(["#6b2d2a","#2f4a5e","#7a7a74","#3b4a3a","#8a7a52","#2a2a2e","#5a4a6a"],R);
  const body=mesh(GEO.box,col,0,.55,0,1.8,.75,4);body.userData.bld=c;g.add(body);g.add(mesh(GEO.box,"#1f262b",0,1.15,-.25,1.6,.5,2));
  for(const [x,z] of [[-.9,1.2],[.9,1.2],[-.9,-1.3],[.9,-1.3]]){const w=mesh(GEO.cyl,"#151515",x,.32,z,.32,.22,.32);w.rotation.z=Math.PI/2;g.add(w)}
  if(R()<.5){const d=mesh(GEO.box,col,1.05,.6,.4,.06,.6,1.1);d.rotation.y=.9;g.add(d)}
  W3.pick.add(body);return g}
function fence(sc,pts,col,h=1){for(let i=1;i<pts.length;i++){const [x0,z0]=pts[i-1],[x1,z1]=pts[i];const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(x1-x0,z1-z0);
  for(const y of [h*.45,h*.85]){const m=mesh(GEO.box,col,(x0+x1)/2,y,(z0+z1)/2,.08,.08,L);m.rotation.y=a;sc.add(m)}
  for(let t=0;t<=L;t+=3){const x=x0+(x1-x0)*t/L,z=z0+(z1-z0)*t/L;sc.add(mesh(GEO.box,col,x,h/2,z,.12,h,.12))}}}
function decor(sc){const R=srng(5);const add=(...a)=>{const m=mesh(...a);sc.add(m);return m};
  add(GEO.box,"#5c5b56",28,.22,47,11,.44,12.6);for(const x of [22.7,33.3])add(GEO.box,"#7a7870",x,.8,47,.3,.7,12.6);
  for(let i=0;i<16;i++)add(GEO.rock,"#77746c",-57+(R()-.5)*7,.1,42.4+i*.6,.32+R()*.2,.22,.32+R()*.2);
  fence(sc,[[-93,-28],[-47,-28],[-47,-7]],"#6e5a40");fence(sc,[[-47,-2],[-47,13],[-93,13],[-93,-28]],"#6e5a40");
  for(let i=0;i<7;i++){const m=add(GEO.cyl,"#b39a52",-90+R()*14,.55,8+R()*4,.55,1.1,.55);m.rotation.z=Math.PI/2;m.rotation.y=R()*3}
  for(let i=0;i<3;i++)for(let j=0;j<8;j++)add(GEO.box,"#8a8a84",6.5+i*1.4,.4,74+j*2.2,.5,.8,.18);
  fence(sc,[[5.6,73],[9.9,73],[9.9,91.5],[5.6,91.5],[5.6,73]],"#4a4a48");
  for(const q of QWALLS){const along=q[2]-q[0]>q[3]-q[1];const len=along?q[2]-q[0]:q[3]-q[1];for(let t=0;t<len;t+=2.2){const x=along?q[0]+t+1.1:(q[0]+q[2])/2,z=along?(q[1]+q[3])/2:q[1]+t+1.1;const m=add(GEO.rock,R()<.5?"#7a4632":"#8a5a42",x,1.2+R()*1.2,z,1.6+R()*.6,2+R()*1.8,1.6+R()*.6);m.rotation.y=R()*6}}
  for(let i=0;i<6;i++)add(GEO.cone,"#8a6a58",76+R()*40,1,-91+R()*10,2+R()*1.5,2+R()*1.2,2+R()*1.5);
  fence(sc,[[60.5,22],[87.5,22],[87.5,34],[60.5,34],[60.5,22]],"#8a8e90",1.6);
  for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(GEO.cyl,"#6a6e72",-3+a*1.6,4,-42+c*1.6,.12,8,.12);add(GEO.cyl,"#9aa0a4",-3,9.4,-42,2.6,2.8,2.6);add(GEO.cone,"#6a6e72",-3,11.4,-42,2.8,1.2,2.8);
  for(let i=0;i<9;i++){const m=add(GEO.cyl,"#6b4f33",-12,.35+Math.floor(i/3)*.6,34.5+(i%3)*.65,.32,4,.32);m.rotation.z=Math.PI/2}
  for(let i=0;i<6;i++){const m=add(GEO.cyl,"#6b4f33",-120,.3+Math.floor(i/3)*.55,-65.5+(i%3)*.6,.28,3,.28);m.rotation.z=Math.PI/2}
  for(let x=14;x<92;x+=12){if(Math.abs(x-28)<6)continue;add(GEO.cyl,"#4a4c4e",x,2.2,-8.2,.07,4.4,.07);add(GEO.box,"#4a4c4e",x,4.4,-7.7,.15,.12,1)}
  const rocks=[];for(let i=0;i<700;i++){const x=WB.x0+R()*(WB.x1-WB.x0),z=WB.z0+R()*(WB.z1-WB.z0);const k=regionAt(x,z);if(!((k==="hills"&&R()<.9)||(k==="wilds"&&R()<.2)||(k==="woods"&&R()<.06)))continue;if(solidAt(x,z,1)||inRiver(x,z))continue;rocks.push([x,z,.4+R()*1.3,R()*6])}
  const im=new T3.InstancedMesh(GEO.rock,mat("#6e6b63"),rocks.length);const m4=new T3.Matrix4(),q=new T3.Quaternion(),e=new T3.Euler(),v=new T3.Vector3(),sv=new T3.Vector3();
  rocks.forEach((r,i)=>{e.set(0,r[3],0);q.setFromEuler(e);v.set(r[0],r[2]*.3,r[1]);sv.set(r[2],r[2]*.7,r[2]*1.1);m4.compose(v,q,sv);im.setMatrixAt(i,m4)});im.instanceMatrix.needsUpdate=true;sc.add(im)}
function buildTrees(sc){const R=srng(77);const pts=[];const dens={woods:.09,lodge:.03,hills:.016,fields:.006,wilds:.03,farm:.004,church:.012,town:.004,school:.003,quarry:0,mill:.012,road:0,river:0};
  const clear=(x,z)=>{if(z>40.5&&z<53.5)return false;for(const r of ROADS)if(x>r[0]-1.3&&x<r[2]+1.3&&z>r[1]-1.3&&z<r[3]+1.3)return false;if(solidAt(x,z,1.8))return false;
    for(const k of Object.keys(PLACES))if(PLACES[k].site){const r=siteRect(k);if(x>r[0]-3&&x<r[2]+3&&z>r[1]-3&&z<r[3]+3)return false}for(const q of QWALLS)if(x>q[0]-2&&x<q[2]+2&&z>q[1]-2&&z<q[3]+2)return false;return true};
  const N=Math.round((WB.x1-WB.x0)*(WB.z1-WB.z0)*.09);
  for(let i=0;i<N;i++){const x=WB.x0+R()*(WB.x1-WB.x0),z=WB.z0+R()*(WB.z1-WB.z0);const k=regionAt(x,z);if(R()>(dens[k]??.02)/.09)continue;if(!clear(x,z))continue;pts.push([x,z,.75+R()*.75,R()<(k==="woods"||k==="lodge"?.6:.35)])}
  for(let i=0;i<800;i++){const side=R()*4|0,o=1+R()*18;let x,z;if(side===0){x=WB.x0-o;z=WB.z0-18+R()*236}else if(side===1){x=WB.x1+o;z=WB.z0-18+R()*236}else if(side===2){z=WB.z0-o;x=WB.x0+R()*260}else{z=WB.z1+o;x=WB.x0+R()*260}pts.push([x,z,1+R()*.8,R()<.6])}
  const nP=pts.filter(p=>p[3]).length,nB=pts.length-nP;
  const trunk=new T3.InstancedMesh(GEO.cyl,mat("#4a3626"),pts.length),pine=new T3.InstancedMesh(GEO.cone,new T3.MeshLambertMaterial({color:"#ffffff"}),Math.max(1,nP)),leaf=new T3.InstancedMesh(GEO.sph,new T3.MeshLambertMaterial({color:"#ffffff"}),Math.max(1,nB));
  const m4=new T3.Matrix4(),col=new T3.Color();let ip=0,ib=0;const data=[];
  pts.forEach((p,i)=>{const [x,z,s,isP]=p;m4.makeScale(.17*s,1.3*s,.17*s);m4.setPosition(x,.65*s,z);trunk.setMatrixAt(i,m4);
    if(isP){col.set(R()<.5?"#24402a":"#2d4f2f");col.offsetHSL(0,0,(R()-.5)*.06);pine.setColorAt(ip,col);const d={x,z,s,m:pine,i:ip,p:true};setTree(d,1,m4);data.push(d);ip++}
    else{col.set(R()<.5?"#2a4422":"#33502a");col.offsetHSL((R()-.5)*.02,0,(R()-.5)*.06);leaf.setColorAt(ib,col);const d={x,z,s,m:leaf,i:ib,p:false};setTree(d,1,m4);data.push(d);ib++}});
  for(const m of [trunk,pine,leaf]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;sc.add(m)}
  const B={};for(const d of data){const k=Math.floor(d.x/10)+","+Math.floor(d.z/10);(B[k]=B[k]||[]).push(d)}W3.trees={B,faded:new Set(),m4}}
function setTree(d,f,m4){m4=m4||W3.trees.m4;const s=d.s;if(d.p){const hh=3.4*s*f;m4.makeScale(1.05*s*f,hh,1.05*s*f);m4.setPosition(d.x,1.1*s+hh/2,d.z)}else{m4.makeScale(1.4*s*f,1.15*s*f,1.4*s*f);m4.setPosition(d.x,2.2*s,d.z)}d.m.setMatrixAt(d.i,m4)}
function fadeTrees(){const T=W3.trees;if(!T)return;const pl=S.player;const want=new Set();const cx=Math.floor(pl.x/10),cz=Math.floor(pl.z/10);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=T.B[(cx+i)+","+(cz+j)];if(!L)continue;for(const d of L){const dx=d.x-pl.x,dz=d.z-pl.z;if(dx+dz>-1.5&&dx+dz<9&&Math.abs(dx-dz)<4.5)want.add(d)}}
  const touched=new Set();for(const d of T.faded)if(!want.has(d)){setTree(d,1);T.faded.delete(d);touched.add(d.m)}
  for(const d of want)if(!T.faded.has(d)){setTree(d,.2);T.faded.add(d);touched.add(d.m)}
  for(const m of touched)m.instanceMatrix.needsUpdate=true}
function fadeBuildings(){const pl=S.player;for(const o of W3.bmeshes){const b=o.b;const dx=b.x-pl.x,dz=b.z-pl.z;const s=dx+dz,p=Math.abs(dx-dz);const rad=(b.w+b.d)/2;
  const f=(s>-rad*.4&&s<rad+10&&p<rad*1.1+1.5&&dist(b.x,b.z,pl.x,pl.z)<rad+9)?.28:1;if(o.f!==f){o.f=f;o.wm.opacity=f;o.rm.opacity=f;o.wm.depthWrite=f===1;o.rm.depthWrite=f===1}}}

// ---- camps: what's built on each lot ----
function structure(b,k,i,prog,flames){const p=tileXZ(k,i);const g=new T3.Group();g.position.set(p.x,0,p.z);const add=(...a)=>{const m=mesh(...a);g.add(m);return m};const ss=PLACES[k].site;const tx=i%ss.gw;
  if(prog!=null){const h=.25+1.6*prog;add(GEO.box,"#6b5638",0,h/2,0,2.3,h,2.3);for(const [a,c] of [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]])add(GEO.box,"#8a7048",a,1.1,c,.12,2.2,.12);add(GEO.box,"#e48a3f",0,h+.04,0,2.4,.08,2.4);return g}
  const flame=(y,s)=>{const f=new T3.Mesh(GEO.cone,new T3.MeshBasicMaterial({color:"#ff9a3c"}));f.position.set(0,y,0);f.scale.set(s*.43,s,s*.43);f.userData.base=s;g.add(f);flames.push(f)};
  switch(b){
    case"tent":{const m=add(GEO.cone4,"#8f8a6a",0,.85,0,1.5,1.7,1.1);m.rotation.y=Math.PI/4;add(GEO.box,"#3a3424",0,.4,1.02,.5,.8,.06);break}
    case"cabin":{add(GEO.box,"#8a6c44",0,.9,0,2.7,1.8,2.4);const r=add(GEO.cone4,"#5e4630",0,2.35,0,2.1,1.1,1.9);r.rotation.y=Math.PI/4;add(GEO.box,"#3a2c1c",0,.6,1.21,.5,1.2,.06);break}
    case"hut":add(GEO.cyl,"#a28456",0,.6,0,.95,1.2,.95);add(GEO.cone,"#7a5f3a",0,1.65,0,1.25,.9,1.25);break;
    case"firepit":for(let a=0;a<8;a++)add(GEO.rock,"#6c6a64",Math.cos(a/8*6.28)*.7,.12,Math.sin(a/8*6.28)*.7,.2);flame(.4,.75);break;
    case"storehouse":add(GEO.box,"#7f6a48",0,.85,0,2.6,1.7,2.2);add(GEO.box,"#5d4c33",0,1.8,0,2.8,.25,2.4);break;
    case"smokehouse":add(GEO.box,"#6f5d44",0,.75,0,2,1.5,2);add(GEO.box,"#555",.6,1.8,.6,.35,1.1,.35);break;
    case"wall":{const vert=tx===0||tx===ss.gw-1;for(let q=-2;q<=2;q++)add(GEO.cyl,"#6e5a40",vert?0:q*.62,1,vert?q*.62:0,.2,2+((q*7+i)%3)*.12,.2);add(GEO.box,"#5b4a34",0,1.4,0,vert?.12:3,.12,vert?3:.12);break}
    case"tower":{for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(GEO.cyl,"#5e4b35",a*.75,1.8,c*.75,.12,3.6,.12);add(GEO.box,"#6f5a40",0,3.6,0,2,.2,2);const r=add(GEO.cone4,"#5a4630",0,4.4,0,1.6,1,1.6);r.rotation.y=Math.PI/4;break}
    case"workshop":add(GEO.box,"#5c7387",0,.85,0,2.6,1.7,2.2);add(GEO.box,"#3e4d59",0,1.8,0,2.8,.25,2.4);add(GEO.box,"#888",1,.35,1.3,.5,.7,.5);break;
    case"infirmary":add(GEO.box,"#d8d3c3",0,.85,0,2.6,1.7,2.2);add(GEO.box,"#c4483c",0,1.8,0,.8,.22,.22);add(GEO.box,"#c4483c",0,1.8,0,.22,.22,.8);break;
    case"garden":add(GEO.box,"#4a3a26",0,.08,0,2.8,.16,2.8);for(let q=-1;q<=1;q++)add(GEO.box,S.flags.winter?"#6b5a3a":"#5f9a4c",q*.9,.28,0,.45,.3,2.5);break;
    case"catcher":{for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])add(GEO.cyl,"#5e4b35",a*.9,.9,c*.9,.07,1.8,.07);const t=add(GEO.box,"#5e8fb0",0,1.7,0,2,.05,2);t.rotation.x=.15;add(GEO.cyl,"#3d5a6e",0,.4,0,.5,.8,.5);break}
    case"well":add(GEO.cyl,"#76736b",0,.45,0,.8,.9,.8);add(GEO.cyl,"#2c4d63",0,.91,0,.62,.02,.62);add(GEO.box,"#5b4a34",0,1.7,0,1.7,.12,.12);for(const a of [-.8,.8])add(GEO.cyl,"#5b4a34",a,1.2,0,.06,1.2,.06);break;
    case"hall":{add(GEO.box,"#a5743f",0,1,0,2.8,2,2.6);const r=add(GEO.cone4,"#6e4a2a",0,2.6,0,2.2,1.2,2.1);r.rotation.y=Math.PI/4;break}
    case"nursery":{add(GEO.box,"#c9a093",0,.8,0,2.5,1.6,2.2);const r=add(GEO.cone4,"#a87b6e",0,2.05,0,1.9,.9,1.7);r.rotation.y=Math.PI/4;break}
  }
  return g}
function siteKey(k){const s=S.sites[k];const o=ownerOf(k);return s.grid.map(c=>c?c.b:"").join(",")+"|"+s.build.map(b=>b.b+b.tile+":"+Math.floor(Math.min(1,b.prog/BLD[b.b].work)*6)).join(",")+"|"+(o?o.color+o.id:"")+"|"+(S.flags.winter?1:0)}
function buildSite(k){if(W3.siteObj[k])W3.scene.remove(W3.siteObj[k]);const g=new T3.Group();const s=S.sites[k];const flames=[];
  s.grid.forEach((c,i)=>{if(c)g.add(structure(c.b,k,i,null,flames))});s.build.forEach(b=>g.add(structure(b.b,k,b.tile,Math.min(1,b.prog/BLD[b.b].work),flames)));
  const o=ownerOf(k);if(o){const r=siteRect(k);const x=r[2]+1.2,z=r[1]-.5;g.add(mesh(GEO.cyl,"#6a6560",x,2.6,z,.06,5.2,.06));const fl=mesh(GEO.box,o.color,x+.7,4.7,z,1.3,.8,.05);fl.userData.flag=true;g.add(fl)}
  W3.scene.add(g);W3.siteObj[k]=g;W3.siteFlames[k]=flames}
function syncSites(){W3.walled.clear();for(const k of Object.keys(PLACES)){if(!PLACES[k].site)continue;const o=ownerOf(k);if(o&&siteCount(k,"wall")+(k==="quarry"?3:0)+(k==="school"?2:0)>=1)W3.walled.add(k);
    const key=siteKey(k);if(W3.siteKeys[k]!==key){W3.siteKeys[k]=key;buildSite(k)}}
  const pl=S.player;const on=pl.fire&&pl.fire.until>S.t;
  if(on&&(!W3.campfire||W3.campfire.x!==pl.fire.x)){if(W3.campfire)W3.scene.remove(W3.campfire.g);const g=new T3.Group();g.position.set(pl.fire.x,0,pl.fire.z);for(let a=0;a<7;a++)g.add(mesh(GEO.rock,"#6c6a64",Math.cos(a/7*6.28)*.55,.1,Math.sin(a/7*6.28)*.55,.17));
    const f=new T3.Mesh(GEO.cone,new T3.MeshBasicMaterial({color:"#ff9a3c"}));f.position.y=.35;f.scale.set(.28,.65,.28);f.userData.base=.65;g.add(f);W3.scene.add(g);W3.campfire={g,flame:f,x:pl.fire.x}}
  else if(!on&&W3.campfire){W3.scene.remove(W3.campfire.g);W3.campfire=null}
  W3.flames=[...Object.values(W3.siteFlames).flat(),...(W3.campfire?[W3.campfire.flame]:[])]}

// ---- figures ----
const SKINS=["#e8c3a0","#c99873","#a8744e","#7a4f33","#f0d2b4","#5e3b26","#d9a982"];
const CLOTH=["#56636c","#6c5a4a","#4f5b48","#7a6a58","#4a5560","#6e4f4f","#5d6e78","#7d7466","#3f4a52","#8a6e52","#5a4f6a","#3d5a50"];
const HAIRC={black:"#1d1a18",brown:"#4a3020",blond:"#c9a85a",red:"#8a3a1f",gray:"#9a9a96"};
const GEARCOL={leather_jacket:"#5a3a26",winter_coat:"#2f3e58",padded_jacket:"#6a6a52",riot_vest:"#262a2e",hoodie:"#6a6e74",flannel:"#8a3a32",tshirt:"#b8b4a8"};
function playerColor(){const g=gearEq("outer")||gearEq("body");return g&&GEARCOL[g.id]||"#e48a3f"}
function hairOf(p){if(p.id==="you")return p.hair==="shaved"?null:HAIRC[p.hair]||HAIRC.brown;const l=p.look||"";if(/shaved/.test(l))return null;if(/gray/.test(l)||p.age>66)return HAIRC.gray;if(/black/.test(l))return HAIRC.black;if(/red hair/.test(l))return HAIRC.red;if(/blond/.test(l))return HAIRC.blond;return[HAIRC.brown,HAIRC.black,HAIRC.brown,HAIRC.blond][hashStr(p.id)%4]}
function makeFig(kind,o){const g=new T3.Group();const age=o.age??30;const s=kind==="zed"?1:age<6?.52:age<13?.72:age<16?.9:1;const h=hashStr(o.id);
  let body,skin;const src=kind==="zed"&&o.pid&&o.pid!=="you"?P(o.pid):null;
  if(kind==="zed"){body=src?CLOTH[hashStr(src.id)%CLOTH.length]:["#4a4f44","#3e463c","#55504a","#4b4440","#3f4448"][h%5];skin="#8f9c80"}
  else if(kind==="you"){body=playerColor();skin=S.player.skin||SKINS[1]}else{body=CLOTH[h%CLOTH.length];skin=SKINS[(h>>3)%SKINS.length]}
  const b=mesh(GEO.body,body,0,.48*s,0,s,s,s),hd=mesh(GEO.head,skin,0,1.18*s,0,s,s,s);g.add(b,hd);const f={g,b,h:hd,s,kind,id:o.id,phase:rf()*6,band:null,gc:null,lbl:null};
  const hc=kind==="zed"?(src?hairOf(src):o.pid==="you"?hairOf(S.player):"#3a342c"):hairOf(o);if(hc){f.hair=mesh(GEO.cap,hc,0,1.2*s,-.02*s,s,s,s);g.add(f.hair)}
  if(kind==="zed"){b.rotation.x=.16;hd.position.z=.1;for(const sx of [-.17,.17])g.add(mesh(GEO.box,skin,sx,.86,.32,.09,.09,.55))}
  if(kind==="you"){const ring=new T3.Mesh(GEO.ring,new T3.MeshBasicMaterial({color:"#e48a3f",side:T3.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;g.add(ring);f.stick=mesh(GEO.stick,"#6b5638",.3,.72,.28,1,1,1);f.stick.visible=false;g.add(f.stick)}
  else{b.userData.fig=f;hd.userData.fig=f;W3.pick.add(b);W3.pick.add(hd)}
  return f}
function dropFig(f){W3.scene.remove(f.g);W3.pick.delete(f.b);W3.pick.delete(f.h);if(f.lbl){f.lbl.remove();f.lbl=null}}
function wantFig(p){return p.alive&&p.age>=2&&!inside(p)&&Math.abs(p.x-S.player.x)<58&&Math.abs(p.z-S.player.z)<58}
function syncFigs(){const pl=S.player;W3.zmap=new Map(S.zeds.map(z=>[z.id,z]));
  for(const [id,f] of W3.figs){const p=P(id);if(!p||!wantFig(p)){if(p&&!p.alive&&p.status==="dead"&&dist(p.x,p.z,pl.x,pl.z)<40){f.g.rotation.z=Math.PI/2;f.g.position.y=.3*f.s;W3.pick.delete(f.b);W3.pick.delete(f.h);if(f.lbl){f.lbl.remove();f.lbl=null}W3.corpses.push({f,t:60})}else dropFig(f);W3.figs.delete(id)}}
  for(const p of S.people)if(!W3.figs.has(p.id)&&wantFig(p)){const f=makeFig("npc",p);f.g.position.set(p.x,0,p.z);W3.scene.add(f.g);W3.figs.set(p.id,f)}
  for(const [id,f] of W3.zfigs){const z=W3.zmap.get(id);if(!z||Math.abs(z.x-pl.x)>54||Math.abs(z.z-pl.z)>54){dropFig(f);W3.zfigs.delete(id)}}
  for(const z of S.zeds)if(!W3.zfigs.has(z.id)&&Math.abs(z.x-pl.x)<50&&Math.abs(z.z-pl.z)<50){const f=makeFig("zed",z);f.g.position.set(z.x,0,z.z);W3.scene.add(f.g);W3.zfigs.set(z.id,f)}
  W3.followers=S.people.filter(isFollower);W3.fset=new Set(W3.followers.map(p=>p.id));
  // player look follows gear
  const P0=W3.player;if(P0){P0.b.material=mat(playerColor());const w=weapon();P0.stick.visible=!!w;if(w){const it=ITEMS[w.id];P0.stick.material=mat(it.gun?"#2a2a2a":/axe|hatchet|machete|knife|crowbar|pipe|hammer/.test(w.id)?"#8a8a86":"#7a5a3a");P0.stick.scale.set(1,1,it.gun?.5:it.reach?2.4:1)}}
  // buildings worth labelling
  W3.nearB=BUILDINGS.map(b=>[b,Math.hypot(Math.max(0,Math.abs(pl.x-b.x)-b.w/2),Math.max(0,Math.abs(pl.z-b.z)-b.d/2))]).filter(x=>x[1]<12).sort((a,b)=>a[1]-b[1]).slice(0,5).map(x=>x[0]);
  // fire light at the nearest flame
  let best=null,bd=30;for(const f of W3.flames){f.getWorldPosition(W3.v3);const d=dist(W3.v3.x,W3.v3.z,pl.x,pl.z);if(d<bd){bd=d;best={x:W3.v3.x,z:W3.v3.z}}}
  if(best){W3.fireLight.position.set(best.x,2.2,best.z);W3.fireLight.intensity=W3.night?1.7:.3}else W3.fireLight.intensity=0}

// ---- movement ----
function moveNPCs(dt){const pl=S.player;const sp=1.45*Math.min(4,UI.speed);let idx=0;
  for(const p of S.people){if(!p.alive)continue;
    if(p.age<2){const m=P(p.parents[0])||P(p.parents[1]);if(m&&m.alive!==false&&m.x!=null){p.x=m.x;p.z=m.z;p.tx=m.x;p.tz=m.z}continue}
    if(W3.fset.has(p.id)){followerMove(p,idx++,dt);continue}
    const d=dist(p.x,p.z,p.tx,p.tz);if(d<.15)continue;
    const far=Math.abs(p.x-pl.x)>100||Math.abs(p.z-pl.z)>100;
    const wp=waypoint(p.x,p.z,p.tx,p.tz)||{x:p.tx,z:p.tz};const dx=wp.x-p.x,dz=wp.z-p.z,l=Math.hypot(dx,dz)||1;const s=Math.min(l,sp*dt*(p.health<45?.6:1)*(far?3:1));
    if(!step(p,dx/l*s,dz/l*s,.3,false)){p._st=(p._st||0)+dt;if(p._st>2.5){if(free(wp.x,wp.z,.3,false)){p.x=wp.x;p.z=wp.z}else{p.x=p.tx;p.z=p.tz}p._st=0}}else p._st=0}}
function followerMove(p,idx,dt){const pl=S.player;const side=idx%2?1:-1,row=Math.floor(idx/2);const a=W3.ang+Math.PI+side*(.6+row*.25);const rr=1.5+row*.9;
  let want={x:pl.x+Math.sin(a)*rr,z:pl.z+Math.cos(a)*rr},fight=null;
  if(p.age>=14&&p.tr.brave>.25&&p.health>30){let bd=6;for(const z of S.zeds){if(Math.abs(z.x-pl.x)>7||Math.abs(z.z-pl.z)>7)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d<bd&&dist(z.x,z.z,p.x,p.z)<10){bd=d;fight=z}}if(fight)want={x:fight.x,z:fight.z}}
  const d=dist(p.x,p.z,want.x,want.z);
  if(d>40){p.x=want.x;p.z=want.z}
  else if(d>(fight?1.1:.3)){const spd=d>4?5.4:d>1.6?3.5:1.5;const wp=waypoint(p.x,p.z,want.x,want.z)||want;const dx=wp.x-p.x,dz=wp.z-p.z,l=Math.hypot(dx,dz)||1;const s=Math.min(l-(fight&&wp===want?1:0),spd*dt);
    if(s>0&&!step(p,dx/l*s,dz/l*s,.3,false)){p._st=(p._st||0)+dt;if(p._st>1.5&&d>3&&free(want.x,want.z,.3,false)){p.x=want.x;p.z=want.z;p._st=0}}else p._st=0}
  p.tx=p.x;p.tz=p.z;p.loc=regionAt(p.x,p.z)}
function playerMove(dt,ts){const pl=S.player;const k=W3.keys;let mx=0,mz=0;
  if(k.w||k.arrowup){mx-=1;mz-=1}if(k.s||k.arrowdown){mx+=1;mz+=1}if(k.a||k.arrowleft){mx-=1;mz+=1}if(k.d||k.arrowright){mx+=1;mz-=1}
  if(mx||mz){W3.ptarget=null;W3.talkOnArrive=null;W3.attackT=null;const l=Math.hypot(mx,mz);mx/=l;mz/=l}
  else{
    if(W3.attackT){const z=W3.zmap.get(W3.attackT);if(!z||!S.zeds.includes(z))W3.attackT=null;else{const d=dist(z.x,z.z,pl.x,pl.z);if(d<=reach()){W3.ptarget=null;W3.ang=Math.atan2(z.x-pl.x,z.z-pl.z);swingAt(z)}else W3.ptarget={x:z.x,z:z.z}}}
    if(W3.talkOnArrive){const p=P(W3.talkOnArrive);if(!p||!p.alive)W3.talkOnArrive=null;else if(dist(p.x,p.z,pl.x,pl.z)<1.9){W3.talkOnArrive=null;W3.ptarget=null;openTalk(p.id)}else W3.ptarget={x:p.x,z:p.z}}
    if(W3.ptarget){const wp=waypoint(pl.x,pl.z,W3.ptarget.x,W3.ptarget.z)||W3.ptarget;const dx=wp.x-pl.x,dz=wp.z-pl.z,l=Math.hypot(dx,dz);if(l<.2&&wp===W3.ptarget)W3.ptarget=null;else if(l>.01){mx=dx/l;mz=dz/l}}}
  W3.moving=false;if(!(mx||mz))return;
  const enc=weight()>maxW();const run=W3.run&&pl.energy>8&&!enc;let spd=(run?5.6:3.4)*(enc?.6:1)*(pl.energy<10?.7:1)*(pl.hp<30?.75:1);if(onFord(pl.x,pl.z))spd*=.45;
  const s=spd*dt;if(!step(pl,mx*s,mz*s,.32,false)&&W3.ptarget){W3.stuckT=(W3.stuckT||0)+dt;if(W3.stuckT>1.2){W3.ptarget=null;W3.stuckT=0}}else W3.stuckT=0;
  W3.ang=Math.atan2(mx,mz);W3.moving=true;
  if(run){pl.energy=Math.max(0,pl.energy-dt*.12);W3.runN=(W3.runN||0)+dt;if(W3.runN>.6){W3.runN=0;noise(pl.x,pl.z,9)}}
  if(onFord(pl.x,pl.z))pl.warmth=Math.max(0,pl.warmth-dt*.3)}

// ---- the dead ----
function noise(x,z,r){for(const zd of S.zeds){if(zd.st==="chase")continue;if(Math.abs(zd.x-x)<r&&Math.abs(zd.z-z)<r&&dist(zd.x,zd.z,x,z)<r){zd.st="hunt";zd.tx=x+(rf()-.5)*4;zd.tz=z+(rf()-.5)*4}}}
function moveZeds(dt){const pl=S.player;const fl=invHas("flashlight");const wx=wxName();const sight=(W3.night?(fl?7.5:5.5):11)*(wx==="fog"?.7:wx==="rain"?.85:1);
  const act=[];for(const z of S.zeds)if(Math.abs(z.x-pl.x)<55&&Math.abs(z.z-pl.z)<55)act.push(z);
  const tg=[pl,...W3.followers];
  for(const z of act){if(z.stun>0){z.stun-=dt;continue}
    let best=null,bd=1e9;const sr=z.st==="chase"?sight*1.7:sight;for(const t of tg){if(t.alive===false)continue;const d=dist(z.x,z.z,t.x,t.z);if(d<sr&&d<bd){bd=d;best=t}}
    let spd=.5;
    if(best){z.st="chase";z.tx=best.x;z.tz=best.z;spd=2.25}
    else if(z.st==="chase"){z.st="hunt";spd=1.5}
    else if(z.st==="hunt"){spd=1.5;if(dist(z.x,z.z,z.tx,z.tz)<1)z.st="idle"}
    else{z.wt=(z.wt||0)-dt;if(z.wt<=0){z.wt=3+rf()*7;if(rf()<.55){z.tx=z.x+(rf()-.5)*10;z.tz=z.z+(rf()-.5)*10}else{z.tx=z.x;z.tz=z.z}}}
    if(best&&bd<1.05){z.cd=(z.cd||0)-dt;if(z.cd<=0){z.cd=1.4+rf()*.4;if(best===pl)zedHitsPlayer(z);else zedHitsNPC(z,best)}continue}
    const dx=z.tx-z.x,dz=z.tz-z.z,l=Math.hypot(dx,dz);if(l>.15){const s=Math.min(l,spd*dt);if(!step(z,dx/l*s,dz/l*s,.32,true)&&z.st==="idle")z.wt=0}
    z.r=regionAt(z.x,z.z)}
  for(let i=0;i<act.length;i++)for(let j=i+1;j<act.length;j++){const a=act[i],b=act[j];const dx=b.x-a.x,dz=b.z-a.z;if(Math.abs(dx)>.6||Math.abs(dz)>.6)continue;const d=Math.hypot(dx,dz);if(d<.6&&d>.001){const q=(.6-d)/2/d;a.x-=dx*q;a.z-=dz*q;b.x+=dx*q;b.z+=dz*q}}
  for(const z of act){const d=dist(z.x,z.z,pl.x,pl.z);if(d<.75&&d>.001){const q=(.75-d)/d;z.x+=(z.x-pl.x)*q;z.z+=(z.z-pl.z)*q}}}
function zedHitsPlayer(z){const pl=S.player;const ar=armor();if(rf()>.72-pl.sk.fight*.02-ar*.015)return;
  const dmg=Math.max(1,rnd(3,8)-ar*.4);pl.hp=Math.max(0,pl.hp-dmg);W3.hurt=.35;
  const g=gearEq("outer")||gearEq("body");if(g){g.dur-=3;if(g.dur<=0){unequip(g.u);pl.gear=pl.gear.filter(x=>x!==g);journal(`Your ${ITEMS[g.id].n.toLowerCase()} is torn to rags.`,"bad")}}
  if(!pl.bitten&&rf()<.13*(1-ar/12)){pl.bitten=S.t;journal("Teeth, through your sleeve and into your arm. You've been bitten. You know what that means. You have a day, maybe two.","bad");toast("You've been bitten.")}
  else if(!pl.bleeding&&rf()<.22){pl.bleeding=1;toast("You're bleeding.")}
  if(pl.hp<=0)die("the dead")}
function zedHitsNPC(z,p){if(rf()>.55)return;p.health-=rnd(4,10);
  if(!p.bitten&&rf()<.12){p.bitten=S.t+rnd(6,30)*60;mem(p,"I got bit. I haven't told anyone.",-10,p.id);if(rf()<.5)toast(`${p.name} cries out. Did they get bitten?`)}
  if(p.health<=0){kill(p,"was killed by the dead");journal(`${p.name} died beside you.`,"bad");W3.leftDirty=true}}
function reach(){const w=weapon();return w?(ITEMS[w.id].gun?13:(ITEMS[w.id].reach||1.7)):1.3}
function attackNearest(){const pl=S.player;let best=null,bd=reach()+.4;for(const z of S.zeds){if(Math.abs(z.x-pl.x)>bd||Math.abs(z.z-pl.z)>bd)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d<bd){bd=d;best=z}}
  if(best){W3.ang=Math.atan2(best.x-pl.x,best.z-pl.z);swingAt(best)}else if(W3.cd<=0){W3.swing=.2;W3.cd=.5}}
function swingAt(z){const pl=S.player;if(W3.cd>0)return;const w=weapon();const it=w?ITEMS[w.id]:null;
  if(it&&it.gun){if(!invHas("ammo")){toast("Out of ammo. Switch weapons or run.");W3.cd=.6;return}invTake("ammo");noise(pl.x,pl.z,45);W3.cd=.9;W3.flash=.07}else W3.cd=.75+(it?it.w*.12:0);
  W3.swing=.2;pl.energy=Math.max(0,pl.energy-.35);
  const hitCh=it&&it.gun?.68+pl.sk.fight*.03:.84+pl.sk.fight*.015;
  if(rf()<hitCh){const dmg=(it?it.dmg:2)+pl.sk.fight*.6;z.hp-=dmg*(.8+rf()*.4);const kx=z.x-pl.x,kz=z.z-pl.z,l=Math.hypot(kx,kz)||1;step(z,kx/l*.6,kz/l*.6,.32,true);z.stun=.5;z.st="chase";
    const br=wearWeapon(1);if(br)toast(br.trim());if(z.hp<=0)killZed(z,true)}
  if(!(it&&it.gun))noise(pl.x,pl.z,7)}
function companions(dt){for(const p of W3.followers){if(p.age<14)continue;p._cd=(p._cd||0)-dt;if(p._cd>0)continue;let best=null,bd=1.6;
  for(const z of S.zeds){if(Math.abs(z.x-p.x)>bd||Math.abs(z.z-p.z)>bd)continue;const d=dist(z.x,z.z,p.x,p.z);if(d<bd){bd=d;best=z}}
  if(best){p._cd=1.3;if(rf()<.6+p.sk.fight*.05){best.hp-=3+p.sk.fight*.8;best.stun=.4;if(best.hp<=0){killZed(best,false);if(rf()<.3)mem(p,`${S.player.name} and I fought off the dead together.`,3)}}}}}
function killZed(z,byYou){S.zeds=S.zeds.filter(x=>x!==z);if(byYou){S.stats.kills++;skillUp("fight",.06)}if(W3.attackT===z.id)W3.attackT=null;
  const f=W3.zfigs.get(z.id);if(f){W3.zfigs.delete(z.id);W3.pick.delete(f.b);W3.pick.delete(f.h);if(f.lbl){f.lbl.remove();f.lbl=null}f.g.rotation.z=Math.PI/2;f.g.position.y=.3;W3.corpses.push({f,t:40})}
  if(z.pid&&z.pid!=="you"){const pl=S.player;pl.flags.mercy=pl.flags.mercy||{};pl.flags.mercy[z.pid]=true;const q=P(z.pid);journal(`You put ${z.name} to rest.${q&&q.met?" You knew them. You make yourself look at their face.":""}`,"bad");
    for(const p of living())if(p.fam[z.pid]&&p.met&&dist(p.x,p.z,S.player.x,S.player.z)<20)mem(p,`${S.player.name} put my ${p.fam[z.pid]} down. I watched.`,-2,z.pid)}}

// ---- interacting with places ----
const LOOT_EXTRA={farmhouse:"house",barn:[["rope",.4],["wood",.5,1,3],["nails",.3],["cloth",.3],["hammer",.15],["axe",.08],["work_pants",.12],["gloves",.2]],
  church:[["cloth",.4,1,2],["water_bottle",.35,1,2],["canned_food",.3],["bandage",.25]],hall:[["canned_food",.4,1,2],["water_bottle",.4,1,2],["cloth",.3],["snacks",.3]],
  qoffice:[["snacks",.4],["water_bottle",.4],["flashlight",.25],["duct_tape",.3],["helmet",.15]],qsheds:[["scrap",.6,1,3],["nails",.4,1,2],["crowbar",.2],["pipe",.25],["duct_tape",.3],["boots",.15],["gloves",.3]]};
function lootFor(type){const L=LOOT[type]||LOOT_EXTRA[type];return typeof L==="string"?LOOT[L]:L||[]}
function updPrompt(){const pl=S.player;let t=null;
  if(pl.alive!==false){let bp=null,bd=1.9;for(const [id,f] of W3.figs){const p=P(id);if(!p||W3.fset.has(id))continue;const d=dist(p.x,p.z,pl.x,pl.z);if(d<bd){bd=d;bp=p}}
    const b=nearBuilding(pl.x,pl.z,2.3);let car=null;for(const c of CARS)if(Math.abs(c.x-pl.x)<3.2&&Math.abs(c.z-pl.z)<3.2){car=c;break}
    if(bp)t={k:"talk",p:bp,label:`Talk to ${bp.met?bp.name:"the stranger"}`};
    else if(b){const o=b.site?ownerOf(b.site):null;if(o)t={k:"none",label:o.id===pl.group?`${b.n}: your people live here`:`${b.n}: ${o.name} lives here`};
      else{const res=b.type==="house"?residentsHome(b):[];if(res.length)t={k:"knock",b,label:`Knock at ${b.n}`};else{const s=S.cont[b.id]?.s||0;t={k:"search",b,label:`Search ${b.n}`,sub:s>=3?"picked over":s?"searched before":""}}}}
    else if(car){const s=S.cont[car.id]?.s||0;t={k:"search",b:car,label:`Search the ${car.n.toLowerCase()}`,sub:s>=2?"picked over":""}}}
  const key=t?t.k+(t.b?.id||t.p?.id||"")+t.label+(t.sub||""):"";
  if(key!==W3.promptKey){W3.promptKey=key;W3.promptT=t;const el=W3.promptEl;if(t){el.hidden=false;el.textContent=t.k==="none"?t.label:`E · ${t.label}${t.sub?" ("+t.sub+")":""}`;el.classList.toggle("passive",t.k==="none")}else el.hidden=true;W3.leftDirty=true}}
function interact(){const t=W3.promptT;if(!t||UI.modal||S.player.alive===false)return;if(t.k==="talk")openTalk(t.p.id);else if(t.k==="knock")knock(t.b);else if(t.k==="search")searchSpot(t.b)}
function knock(b){const pl=S.player;const res=residentsHome(b);if(!res.length){toast("Nobody answers.");return}
  const head=res.filter(p=>p.age>=16).sort((a,c)=>feel(c)-feel(a))[0]||res[0];
  const opens=!S.flags.clinic||(head.met&&feel(head)>-20)||rf()<.45+head.tr.kind*.35;advance(2);
  if(!opens){mem(head,`${pl.name} knocked on our door after it started. We didn't open.`,0);toast("Nobody answers. You hear someone inside, holding their breath.");W3.leftDirty=true;return}
  const ex=clamp(pl.x,b.x-b.w/2-.9,b.x+b.w/2+.9),ez=clamp(pl.z,b.z-b.d/2-.9,b.z+b.d/2+.9);
  res.forEach((p,i)=>{p.door=S.t+45;p.x=ex+(i%2?.7:-.7)*Math.ceil(i/2);p.z=ez+(i?.5:0);p.tx=p.x;p.tz=p.z});
  head.chat.push({w:"sys",x:`${head.name} opens the door${S.flags.alarm?" a crack":""}.`});
  head.chat.push({w:"them",x:styleSay(head,S.flags.clinic?pick(["Who's there? ...Oh. What do you want?","Are you alone? Are you bit?","Keep your voice down. They hear everything."]):pick(["Morning. Can I help you?","Oh, hi. Everything okay?","Yes?"]))});
  syncFigs();openTalk(head.id)}
function searchSpot(b){const pl=S.player;const isCar=b.type==="car";
  if(!S.flags.clinic&&b.id!==pl.home){toast("It's still an ordinary morning. People would notice you going through their things.");return}
  if(zedNear(5)){toast("Not with the dead this close.");return}
  if(b.type==="house"&&residentsHome(b).length){toast("Someone's inside. Knock first.");return}
  const c=S.cont[b.id]||(S.cont[b.id]={s:0});const day=dayOf(S.t);
  const mult=Math.max(.06,1-c.s*(isCar?.5:.38))*Math.max(.3,1-(day-1)*.035)*(1+pl.sk.scavenge*.05);
  const locked=(b.type==="sheriff"||b.type==="pharmacy")&&!hasTool("pry");const found={};
  for(const [id,ch,mn=1,mx=1] of lootFor(b.type)){if(!ITEMS[id])continue;let p=ch*mult;if(locked&&["pistol","ammo","riot_vest","antibiotics","helmet"].includes(id))p*=.3;if(rf()<p){const n=rnd(mn,mx);invAdd(id,n);found[id]=(found[id]||0)+n}}
  c.s++;const mins=isCar?8:b.type==="house"?20:30;advance(mins,{work:true});afterJump(mins);skillUp("scavenge",.05);noise(pl.x,pl.z,6);
  const list=Object.entries(found).map(([k,n])=>ITEMS[k].n+(n>1?" ×"+n:""));
  const txt=list.length?`You search ${isCar?"the "+b.n.toLowerCase():b.n}. You find: ${list.join(", ")}.`:c.s>2?`${isCar?"The "+b.n.toLowerCase():b.n} has been picked clean.`:`You search ${isCar?"the "+b.n.toLowerCase():b.n} and come up empty.`;
  journal(txt+(locked&&c.s===1?" The back room is locked. A crowbar would get you in.":""),list.length?"good":"");toast(txt);if(weight()>maxW())toast("You're carrying too much. You'll move slowly until you drop something.");W3.promptKey="";save();render()}
function afterJump(m){const pl=S.player;if(m>=10){for(const z of S.zeds){if(Math.abs(z.x-pl.x)>32||Math.abs(z.z-pl.z)>32)continue;const d=dist(z.x,z.z,pl.x,pl.z);if(d<32&&d>4&&rf()<Math.min(.6,m/90)){const f=Math.min(.55,m/120);const ox=z.x,oz=z.z;z.x+=(pl.x-z.x)*f;z.z+=(pl.z-z.z)*f;if(!free(z.x,z.z,.3,true)){z.x=ox;z.z=oz}z.r=regionAt(z.x,z.z)}}}
  if(m>=15)for(const p of S.people)if(p.alive&&!isFollower(p)&&p.age>=2){p.x=p.tx;p.z=p.tz}
  snapFollowers()}
function snapFollowers(){const pl=S.player;let i=0;for(const p of S.people)if(isFollower(p)){if(dist(p.x,p.z,pl.x,pl.z)>6||m0()){const a=i*1.3+2.2;p.x=pl.x+Math.sin(a)*1.6;p.z=pl.z+Math.cos(a)*1.6;if(!free(p.x,p.z,.3,false)){p.x=pl.x;p.z=pl.z}p.tx=p.x;p.tz=p.z}i++}
  function m0(){return false}}
function snapCamera(){W3.camX=S.player.x;W3.camZ=S.player.z}

// ---- lighting, weather, effects ----
function weatherFx(){const wx=wxName();if(W3.wx===wx)return;W3.wx=wx;if(W3.precip){W3.scene.remove(W3.precip.pts);W3.precip=null}
  if(wx==="rain"||wx==="snow"){const n=wx==="snow"?700:1000,pos=new Float32Array(n*3);for(let i=0;i<n;i++){pos[i*3]=(Math.random()*2-1)*34;pos[i*3+1]=Math.random()*26;pos[i*3+2]=(Math.random()*2-1)*34}
    const geo=new T3.BufferGeometry();geo.setAttribute("position",new T3.BufferAttribute(pos,3));const pts=new T3.Points(geo,new T3.PointsMaterial({color:wx==="snow"?"#f4f6f8":"#a9c3d6",size:wx==="snow"?3:2,sizeAttenuation:false,transparent:true,opacity:.75}));W3.scene.add(pts);W3.precip={pts,snow:wx==="snow"}}
  W3.scene.fog=wx==="fog"?new T3.Fog("#8a9188",44,100):null}
function lighting(){weatherFx();const h=hourOf(S.t)+(S.t%60)/60;const d=h<5||h>20.5?0:h<7?(h-5)/2:h>18.5?(20.5-h)/2:1;const wx=wxName();
  W3.sun.intensity=.14+.78*d*(wx==="clear"?1:.7);W3.hemi.intensity=.26+.42*d;const sky=new T3.Color(SKY[wx]||SKY.clear),night=new T3.Color("#0a0f17");W3.scene.background=night.lerp(sky,d);
  if(W3.scene.fog)W3.scene.fog.color.copy(W3.scene.background);W3.night=d<.25;const fl=invHas("flashlight");W3.plight.intensity=W3.night?(fl?1.6:.6):0;W3.plight.distance=fl?22:9}
function animFx(dt,ts){for(const f of W3.flames)f.scale.y=f.userData.base*(1+Math.sin(ts/90+f.id)*.14+Math.random()*.1);
  if(W3.precip){const a=W3.precip.pts.geometry.attributes.position;const v=W3.precip.snow?3:24;for(let i=0;i<a.count;i++){let y=a.getY(i)-v*dt;if(y<0)y+=26;a.setY(i,y)}a.needsUpdate=true;W3.precip.pts.position.set(S.player.x,0,S.player.z)}
  if(W3.hurt>0){W3.hurt-=dt;W3.hurtEl.style.opacity=Math.max(0,W3.hurt*2.4).toFixed(2)}else if(W3.hurtEl.style.opacity!=="0")W3.hurtEl.style.opacity="0";
  if(W3.flash>0){W3.flash-=dt;W3.plight.intensity=3;W3.plight.distance=16}
  if(W3.areaT>0){W3.areaT-=dt;W3.areaEl.style.opacity=Math.min(1,W3.areaT).toFixed(2)}
  if(W3.mark){W3.mark.visible=!!W3.ptarget;if(W3.ptarget){W3.mark.position.set(W3.ptarget.x,.05,W3.ptarget.z);W3.mark.scale.setScalar(1+Math.sin(ts/150)*.1)}}
  W3.corpses=W3.corpses.filter(c=>{c.t-=dt;if(c.t<=0){dropFig(c.f);return false}return true})}
function drawFigs(dt,ts){const pl=S.player;const P0=W3.player;
  P0.g.position.set(pl.x,onFord(pl.x,pl.z)?-.25:0,pl.z);P0.g.rotation.y=W3.ang;P0.b.position.y=.48+(W3.moving?Math.abs(Math.sin(ts/100))*.06:0);P0.g.visible=pl.alive!==false;
  if(W3.swing>0){W3.swing-=dt;P0.stick.rotation.x=-1.3*Math.sin(Math.max(0,W3.swing)/.2*Math.PI);P0.b.rotation.x=.15*Math.sin(Math.max(0,W3.swing)/.2*Math.PI)}else{P0.stick.rotation.x=0;P0.b.rotation.x=0}
  W3.plight.position.set(pl.x,3,pl.z);
  for(const [id,f] of W3.figs){const p=P(id);if(!p)continue;const g=f.g.position;const dx=p.x-g.x,dz=p.z-g.z;const mv=Math.hypot(dx,dz);if(mv>.002)f.g.rotation.y=Math.atan2(dx,dz);g.x=p.x;g.z=p.z;
    const lying=(p.act==="asleep"||p.act==="resting, injured")&&p.group&&dist(p.x,p.z,p.tx,p.tz)<.4;f.g.rotation.z=lying?Math.PI/2:0;g.y=lying?.3*f.s:(onFord(p.x,p.z)?-.25:0);
    f.b.position.y=.48*f.s+(mv>.002&&!lying?Math.abs(Math.sin(ts/140+f.phase))*.05:0);
    const gc=p.group&&G(p.group)?G(p.group).color:null;if(gc!==f.gc){f.gc=gc;if(gc){if(!f.band){f.band=mesh(GEO.band,gc,0,.72*f.s,0,f.s,f.s,f.s);f.g.add(f.band)}f.band.material=mat(gc);f.band.visible=true}else if(f.band)f.band.visible=false}}
  for(const [id,f] of W3.zfigs){const z=W3.zmap.get(id);if(!z)continue;const g=f.g.position;const dx=z.x-g.x,dz=z.z-g.z;const mv=Math.hypot(dx,dz);if(mv>.002)f.g.rotation.y=Math.atan2(dx,dz);g.x=z.x;g.z=z.z;
    f.b.position.y=.48+(mv>.002?Math.abs(Math.sin(ts/260+f.phase))*.04:0);f.g.rotation.z=Math.sin(ts/700+f.phase)*.07}}
function camera(dt){const pl=S.player;if(Math.abs(W3.camX-pl.x)>30||Math.abs(W3.camZ-pl.z)>30)snapCamera();const k=1-Math.pow(.002,dt);W3.camX+=(pl.x-W3.camX)*k;W3.camZ+=(pl.z-W3.camZ)*k;
  const asp=W3.rw/Math.max(1,W3.rh);const vh=24/W3.zoom;W3.cam.left=-vh*asp/2;W3.cam.right=vh*asp/2;W3.cam.top=vh/2;W3.cam.bottom=-vh/2;W3.cam.updateProjectionMatrix();
  W3.cam.position.set(W3.camX+30,34,W3.camZ+30);W3.cam.lookAt(W3.camX,0,W3.camZ)}

// ---- labels, minimap, hover, clicks ----
function mkLabel(text,cls){const d=document.createElement("div");d.className="w3label "+(cls||"");d.textContent=text;W3.lblBox.appendChild(d);return d}
function project(x,y,z){const v=W3.v3.set(x,y,z).project(W3.cam);return{x:(v.x+1)/2*W3.rw,y:(1-v.y)/2*W3.rh,on:v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1}}
function place(el,x,y,z){const s=project(x,y,z);if(!s.on){if(el.style.display!=="none")el.style.display="none";return}if(el.style.display==="none")el.style.display="";el.style.transform=`translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) translate(-50%,-100%)`}
function labels(){const pl=S.player;
  if(W3.hover){const f=W3.hover;const o=f.kind==="zed"?W3.zmap.get(f.id):P(f.id);const shown=f.kind==="zed"?W3.zfigs.get(f.id)===f:W3.figs.get(f.id)===f;if(!o||!shown){W3.hover=null;W3.hoverEl.hidden=true}else place(W3.hoverEl,o.x,2*f.s+.25,o.z)}
  for(const [id,f] of W3.figs){const p=P(id);let want=null;if(W3.fset.has(id))want=["comp",p.name];else if(p.want&&p.met&&dist(p.x,p.z,pl.x,pl.z)<22)want=["want","!"];
    if(want){if(!f.lbl)f.lbl=mkLabel("","");const cls="w3label "+want[0];if(f.lbl.className!==cls)f.lbl.className=cls;if(f.lbl.textContent!==want[1])f.lbl.textContent=want[1];place(f.lbl,p.x,1.72*f.s+.2,p.z)}else if(f.lbl){f.lbl.remove();f.lbl=null}}
  for(const [id,f] of W3.zfigs){const z=W3.zmap.get(id);const known=z&&z.pid&&(z.pid==="you"||P(z.pid)?.met);if(known&&dist(z.x,z.z,pl.x,pl.z)<16){if(!f.lbl)f.lbl=mkLabel(z.name,"dead");place(f.lbl,z.x,1.95,z.z)}else if(f.lbl){f.lbl.remove();f.lbl=null}}
  for(const b of W3.nearB){let el=W3.blabels.get(b.id);if(!el){el=mkLabel(b.n,"bld");W3.blabels.set(b.id,el)}place(el,b.x,b.type==="house"?5:b.type==="church"?9:5.4,b.z)}
  for(const [id,el] of W3.blabels)if(!W3.nearB.some(b=>b.id===id)){el.remove();W3.blabels.delete(id)}}
function drawMap(c,opt={}){const g=c.getContext("2d");const w=c.width,h=c.height;const mc=mapCanvas();g.drawImage(mc,0,0,mc.width,mc.height,0,0,w,h);const sx=w/(WB.x1-WB.x0),sz=h/(WB.z1-WB.z0);const X=x=>(x-WB.x0)*sx,Z=z=>(z-WB.z0)*sz;const pl=S.player;
  for(const b of BUILDINGS){const s=S.cont[b.id]?.s||0;g.fillStyle=opt.big&&s>=3?"rgba(70,60,50,.85)":"rgba(24,24,22,.8)";g.fillRect(X(b.x-b.w/2),Z(b.z-b.d/2),Math.max(1,b.w*sx),Math.max(1,b.d*sz))}
  for(const k of Object.keys(PLACES))if(PLACES[k].site){const s=S.sites[k];const o=ownerOf(k);if(opt.big)s.grid.forEach((cc,i)=>{if(!cc)return;const p=tileXZ(k,i);g.fillStyle=BLD[cc.b].c;g.fillRect(X(p.x-1.3),Z(p.z-1.3),2.6*sx,2.6*sz)});
    if(o){const r=siteRect(k);g.strokeStyle=o.color;g.lineWidth=opt.big?2:1;g.strokeRect(X(r[0]),Z(r[1]),(r[2]-r[0])*sx,(r[3]-r[1])*sz);if(opt.big){g.fillStyle="#e9e4d7";g.font=`${Math.round(11*(opt.dpr||1))}px JetBrains Mono, monospace`;g.fillText(`${o.name} (${groupSize(o.id)})`,X(r[0]),Z(r[1])-4*(opt.dpr||1))}}}
  if(opt.big){g.font=`${Math.round(13*(opt.dpr||1))}px Saira Stencil One, sans-serif`;g.fillStyle="rgba(233,228,215,.7)";for(const k of ["town","woods","fields","hills","quarry","farm","church","school","lodge","mill","river"]){const r=PLACES[k].r[0];const t=PLACES[k].n;g.fillText(t,X((r[0]+r[2])/2)-g.measureText(t).width/2,Z((r[1]+r[3])/2))}
    if(myGroup())for(const p of members(pl.group)){if(isFollower(p))continue;g.fillStyle="rgba(169,195,141,.9)";g.fillRect(X(p.x)-1.5,Z(p.z)-1.5,3,3)}}
  g.fillStyle="#d4574a";for(const z of S.zeds)if(Math.abs(z.x-pl.x)<35&&Math.abs(z.z-pl.z)<35)g.fillRect(X(z.x)-1,Z(z.z)-1,2,2);
  g.fillStyle="#a9c38d";for(const p of S.people)if(isFollower(p))g.fillRect(X(p.x)-1.5,Z(p.z)-1.5,3,3);
  if(W3.ptarget){g.strokeStyle="#e48a3f";g.lineWidth=1;g.beginPath();g.moveTo(X(pl.x),Z(pl.z));g.lineTo(X(W3.ptarget.x),Z(W3.ptarget.z));g.stroke()}
  g.fillStyle="#e48a3f";g.strokeStyle="#1a120a";g.lineWidth=1;g.beginPath();g.arc(X(pl.x),Z(pl.z),opt.big?5:3.2,0,7);g.fill();g.stroke()}
function pickAt(ev){const r=W3.wrap.getBoundingClientRect();const v=new T3.Vector2((ev.clientX-r.left)/r.width*2-1,-(ev.clientY-r.top)/r.height*2+1);W3.rc.setFromCamera(v,W3.cam);
  const hits=W3.rc.intersectObjects([...W3.pick],false);if(hits.length){const o=hits[0].object;if(o.userData.fig)return{fig:o.userData.fig};if(o.userData.bld)return{bld:o.userData.bld}}
  const p=new T3.Vector3();return W3.rc.ray.intersectPlane(W3.plane,p)?{ground:{x:p.x,z:p.z}}:null}
function onHover(ev){if(!W3.ok||!S||UI.create||ev.pointerType==="touch")return;if(ev.target.closest&&ev.target.closest("button,.w3prompt"))return;const h=pickAt(ev);const f=h&&h.fig;W3.wrap.style.cursor=h&&(h.fig||h.bld)?"pointer":"crosshair";
  if(f!==W3.hover){W3.hover=f||null;const el=W3.hoverEl;if(f){if(f.kind==="zed"){const z=W3.zmap.get(f.id);const known=z&&z.pid&&(z.pid==="you"||P(z.pid)?.met);el.innerHTML=`<b>${esc(known?z.name:"One of the dead")}</b><br><span>click to fight</span>`}
      else{const p=P(f.id);el.innerHTML=`<b>${esc(p.met?fullName(p):"A stranger")}</b> <span>${esc(p.met?p.act:p.look)}</span><br><span>click to talk</span>`}el.hidden=false}else el.hidden=true}}
function onClick(ev){if(!W3.ok||!S||UI.create||UI.modal||S.player.alive===false)return;const h=pickAt(ev);if(!h)return;const pl=S.player;W3.attackT=null;W3.talkOnArrive=null;
  if(h.fig){if(h.fig.kind==="zed"){W3.attackT=h.fig.id;return}const p=P(h.fig.id);if(!p)return;const d=dist(p.x,p.z,pl.x,pl.z);if(d<2.2||(W3.fset.has(p.id)&&d<6)){W3.ptarget=null;openTalk(p.id);return}W3.talkOnArrive=p.id;W3.ptarget={x:p.x,z:p.z};return}
  if(h.bld){const b=h.bld;if(b.type==="car"){W3.ptarget={x:b.x+(pl.x<b.x?-1.9:1.9),z:b.z}}else W3.ptarget={x:clamp(pl.x,b.x-b.w/2-1.1,b.x+b.w/2+1.1),z:clamp(pl.z,b.z-b.d/2-1.1,b.z+b.d/2+1.1)};return}
  if(h.ground)W3.ptarget={x:clamp(h.ground.x,WB.x0+1,WB.x1-1),z:clamp(h.ground.z,WB.z0+1,WB.z1-1)}}
function walkTo(x,z){W3.attackT=null;W3.talkOnArrive=null;W3.ptarget={x:clamp(x,WB.x0+1,WB.x1-1),z:clamp(z,WB.z0+1,WB.z1-1)}}

// ---- setup and the loop ----
function every(ts,k,ms,fn){if(ts-(W3.tk[k]||0)>=ms){W3.tk[k]=ts;fn()}}
function w3buttons(){if(!W3.btnBox)return;W3.btnBox.innerHTML=`<button data-w="pause" class="${UI.paused?"on":""}" aria-pressed="${UI.paused}">${UI.paused?"Paused":"Pause"}</button>${[1,2,4,8].map(s=>`<button data-w="${s}" class="${UI.speed===s&&!UI.paused?"on":""}" aria-label="Speed ${s}x">${s}x</button>`).join("")}<button data-w="zout" aria-label="Zoom out">−</button><button data-w="zin" aria-label="Zoom in">+</button><button data-w="help" aria-label="How to play">?</button>`}
function initWorldView(){if(W3.wrap)return;W3.wrap=document.createElement("div");W3.wrap.className="w3";
  W3.wrap.innerHTML=`<div class="w3labels"></div><div class="w3hurt"></div><div class="w3area"></div><canvas class="mini" width="156" height="120" aria-hidden="true"></canvas><div class="w3prompt" role="button" tabindex="0" hidden></div><div class="w3hint mono">WASD or click to walk · Shift to run · E search or knock · Space fight · click people to talk · scroll to zoom</div><div class="w3btns"></div>`;
  W3.lblBox=W3.wrap.querySelector(".w3labels");W3.mini=W3.wrap.querySelector(".mini");W3.promptEl=W3.wrap.querySelector(".w3prompt");W3.hurtEl=W3.wrap.querySelector(".w3hurt");W3.areaEl=W3.wrap.querySelector(".w3area");W3.btnBox=W3.wrap.querySelector(".w3btns");
  W3.hoverEl=mkLabel("","hover");W3.hoverEl.hidden=true;
  W3.promptEl.addEventListener("click",e=>{e.stopPropagation();interact()});W3.promptEl.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();interact()}});
  W3.btnBox.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;e.stopPropagation();const v=b.dataset.w;
    if(v==="pause")UI.paused=!UI.paused;else if(v==="zin")W3.zoom=clamp(W3.zoom*1.2,.5,2.6);else if(v==="zout")W3.zoom=clamp(W3.zoom/1.2,.5,2.6);else if(v==="help"){UI.modal={type:"help"};render()}else{UI.speed=+v;UI.paused=false}
    w3buttons();hud();if(e.detail>0)b.blur()});
  w3buttons();
  if(!window.THREE){W3.wrap.insertAdjacentHTML("beforeend",`<div class="w3fail mono">The 3D view couldn't load here. You can still play: use the Map tab to travel.</div>`);return}
  initGeo();try{W3.ren=new T3.WebGLRenderer({antialias:true,powerPreference:"high-performance"})}catch(e){W3.ren=null}
  if(!W3.ren){W3.wrap.insertAdjacentHTML("beforeend",`<div class="w3fail mono">This device can't draw the 3D view. You can still play: use the Map tab to travel.</div>`);return}
  W3.ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));W3.wrap.prepend(W3.ren.domElement);
  W3.cam=new T3.OrthographicCamera(-10,10,10,-10,1,400);W3.rc=new T3.Raycaster();W3.plane=new T3.Plane(new T3.Vector3(0,1,0),0);W3.v3=new T3.Vector3();
  new ResizeObserver(()=>{const r=W3.wrap.getBoundingClientRect();if(r.width<2)return;W3.rw=r.width;W3.rh=r.height;W3.ren.setSize(r.width,r.height,false)}).observe(W3.wrap);
  const sc=new T3.Scene();W3.scene=sc;W3.hemi=new T3.HemisphereLight("#dfe8f0","#2a2a20",.45);sc.add(W3.hemi);W3.sun=new T3.DirectionalLight("#fff3dd",.7);W3.sun.position.set(-30,60,10);sc.add(W3.sun);
  W3.plight=new T3.PointLight("#ffe2b0",0,10,1.6);sc.add(W3.plight);W3.fireLight=new T3.PointLight("#ff9a4a",0,22,1.5);sc.add(W3.fireLight);
  const tex=new T3.CanvasTexture(mapCanvas());tex.minFilter=T3.LinearFilter;tex.generateMipmaps=false;
  const gr=new T3.Mesh(new T3.PlaneGeometry(WB.x1-WB.x0,WB.z1-WB.z0),new T3.MeshLambertMaterial({map:tex}));gr.rotation.x=-Math.PI/2;gr.position.set((WB.x0+WB.x1)/2,0,(WB.z0+WB.z1)/2);sc.add(gr);
  sc.add(mesh(GEO.box,"#18210f",0,-.08,0,800,.1,800));
  const R=srng(3);for(const b of BUILDINGS)sc.add(buildingMesh(b,R));for(const c of CARS)sc.add(carMesh(c,R));buildTrees(sc);decor(sc);
  W3.mark=new T3.Mesh(GEO.ring,new T3.MeshBasicMaterial({color:"#e48a3f",side:T3.DoubleSide,transparent:true,opacity:.7}));W3.mark.rotation.x=-Math.PI/2;W3.mark.visible=false;sc.add(W3.mark);
  W3.wrap.addEventListener("pointerdown",e=>{W3.pd={x:e.clientX,y:e.clientY}});
  W3.wrap.addEventListener("pointerup",e=>{if(!W3.pd)return;const m=Math.hypot(e.clientX-W3.pd.x,e.clientY-W3.pd.y);W3.pd=null;if(m<10&&!(e.target.closest&&e.target.closest("button,.w3prompt")))onClick(e)});
  W3.wrap.addEventListener("pointermove",onHover);
  W3.wrap.addEventListener("wheel",e=>{e.preventDefault();W3.zoom=clamp(W3.zoom*(e.deltaY>0?.9:1.1),.5,2.6)},{passive:false});
  W3.ok=true}
// reset everything that depends on a particular world (new game or loaded save)
function w3reset(){if(!W3.ok)return;for(const f of W3.figs.values())dropFig(f);for(const f of W3.zfigs.values())dropFig(f);for(const c of W3.corpses)dropFig(c.f);W3.figs.clear();W3.zfigs.clear();W3.corpses=[];
  for(const k in W3.siteObj)W3.scene.remove(W3.siteObj[k]);W3.siteObj={};W3.siteKeys={};W3.siteFlames={};if(W3.campfire){W3.scene.remove(W3.campfire.g);W3.campfire=null}
  if(W3.player)W3.scene.remove(W3.player.g);W3.player=makeFig("you",S.player);W3.scene.add(W3.player.g);
  for(const el of W3.blabels.values())el.remove();W3.blabels.clear();W3.ptarget=null;W3.attackT=null;W3.talkOnArrive=null;W3.region=null;W3.promptKey="";W3.wx=null;W3.acc=0;
  snapCamera();syncSites();syncFigs();lighting()}
function worldHour(h){if(S.player.alive===false)return;
  for(const z of [...S.zeds]){if(PLACES[z.r]?.site&&ownerOf(z.r)&&dist(z.x,z.z,S.player.x,S.player.z)>22&&rf()<.6)S.zeds.splice(S.zeds.indexOf(z),1)}
  if(h===8||h===18)feedFollowers();
  if(S.player.fire&&S.player.fire.until<=S.t)S.player.fire=null}
function hourTick(){if(typing()||UI.pdown)W3.dirty=true;else render()}
function feedFollowers(){const pl=S.player;for(const p of S.people){if(!isFollower(p)||p.group||p.age<2||p.hunger>65)continue;
  let f=Object.keys(p.pack).find(k=>ITEMS[k]?.eat&&!ITEMS[k].eat.sick);if(f){p.pack[f]--;if(!p.pack[f])delete p.pack[f];p.hunger=clamp(p.hunger+ITEMS[f].eat.food*1.6,0,100);continue}
  const hb=BMAP[pl.home];if(hb&&dist(pl.x,pl.z,hb.x,hb.z)<16){if(pl.pantry==null)pl.pantry=rnd(6,12);if(pl.pantry>0){pl.pantry--;p.hunger=clamp(p.hunger+40,0,100);continue}}
  f=Object.keys(pl.inv).filter(k=>ITEMS[k].eat&&!ITEMS[k].eat.sick).sort((a,b)=>ITEMS[a].eat.food-ITEMS[b].eat.food)[0];
  if(f){invTake(f);p.hunger=clamp(p.hunger+ITEMS[f].eat.food*1.6,0,100);journal(`${p.name} eats some of your ${ITEMS[f].n.toLowerCase()}.`,"")}else{p.mood-=4;if(rf()<.5)journal(`${p.name} hasn't eaten. They don't complain, which is worse.`,"bad")}}}
function nearCheck(){const pl=S.player;const r=here();
  if(r!==W3.region){const first=W3.region===null;W3.region=r;W3.areaEl.textContent=PLACES[r].n;W3.areaT=first?2.5:3;W3.leftDirty=true;const o=PLACES[r].site?ownerOf(r):null;if(o&&!first&&o.id!==pl.group)toast(`This is ${o.name} territory. ${o.pol.stance==="hostile"?"They don't look friendly.":"People look up when you walk in."}`)}
  const near=nearPeople(14).map(p=>p.id).join(",");if(near!==W3.nearKey){W3.nearKey=near;W3.leftDirty=true}
  if(W3.dirty&&!typing()&&!UI.pdown){render();return}
  if(W3.leftDirty&&!UI.pdown){W3.leftDirty=false;renderLeft()}}
function frame(ts){requestAnimationFrame(frame);if(!S||UI.create)return;
  const dt=Math.min(.1,(ts-(W3.last||ts))/1000);W3.last=ts;const pl=S.player;const live=pl.alive!==false;
  const paused=!live||!!UI.modal||UI.paused||document.hidden||typing();
  if(!paused){W3.acc+=dt*UI.speed;if(W3.acc>=1){const m=Math.floor(W3.acc);W3.acc-=m;const h0=Math.floor(S.t/60);advance(m);if(Math.floor(S.t/60)!==h0&&S.player.alive!==false)hourTick()}
    if(S.player.alive!==false&&!UI.modal&&W3.ok){playerMove(dt,ts);moveNPCs(dt);moveZeds(dt);companions(dt)}
    if(W3.cd>0)W3.cd-=dt}
  if(!W3.ok){every(ts,"hud",500,hud);every(ts,"near",900,()=>{if(W3.dirty&&!typing())render()});return}
  if(!W3.wrap.isConnected||!W3.player)return;
  every(ts,"sync",300,syncFigs);every(ts,"site",1500,syncSites);every(ts,"light",1000,lighting);every(ts,"fade",200,()=>{fadeTrees();fadeBuildings()});
  every(ts,"prompt",200,updPrompt);every(ts,"mini",400,()=>drawMap(W3.mini));every(ts,"hud",500,hud);every(ts,"near",700,nearCheck);every(ts,"save",20000,()=>{if(!paused)save()});every(ts,"bigmap",1000,()=>{if(UI.tab==="map"&&!UI.modal)drawBigMap()});
  drawFigs(dt,ts);animFx(dt,ts);camera(dt);W3.ren.render(W3.scene,W3.cam);labels()}
addEventListener("keydown",e=>{if(!S||UI.create||typing())return;const k=e.key.toLowerCase();
  if(UI.modal){if(k==="escape"&&["result","help","trade"].includes(UI.modal.type)){UI.modal=null;render();checkPending()}return}
  if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright"].includes(k)){W3.keys[k]=true;if(k.startsWith("arrow"))e.preventDefault()}
  else if(k==="shift")W3.run=true;
  else if(k===" "){if(e.target.tagName==="BUTTON")return;e.preventDefault();if(S.player.alive!==false)attackNearest()}
  else if(k==="e"){interact()}
  else if(k==="escape"){W3.ptarget=null;W3.attackT=null;W3.talkOnArrive=null}
  else if(k==="p"){UI.paused=!UI.paused;w3buttons();hud()}});
addEventListener("keyup",e=>{const k=e.key.toLowerCase();W3.keys[k]=false;if(k==="shift")W3.run=false});
addEventListener("blur",()=>{W3.keys={};W3.run=false});
document.addEventListener("pointerdown",()=>{UI.pdown=true},true);document.addEventListener("pointerup",()=>{UI.pdown=false},true);document.addEventListener("pointercancel",()=>{UI.pdown=false},true);
