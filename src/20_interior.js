
// ================= interiors: rooms, walls, doors, furniture, collision, paths =================
// Every building is laid out in a local frame: u runs across the front, v runs from the back (-D/2) to the front (+D/2).
const WALL_H={house:2.7,farmhouse:2.8,trailer:2.3,cabin:2.4,barn:4.4,church:5,school:3.4,qsheds:3.2,mill:1.6,hall:3.2,gas:3,diner:3,bar:3,pharmacy:3.1,hardware:3.3,grocery:3.5,library:3.4,clinic:3.1,sheriff:3.1,qoffice:2.7};
const ROOMNAME={living:"Living room",kitchen:"Kitchen",bed:"Bedroom",kid:"Kid's room",bath:"Bathroom",office:"Study",util:"Laundry room",livkit:"Living room",bedbath:"Bedroom",cabin:"Cabin",
  shop:"Store",back:"Back room",cafe:"Dining room",dkitchen:"Kitchen",bar:"Bar",lobby:"Front desk",exam:"Exam room",store:"Storage",cell:"Holding cell",armory:"Armory",lockers:"Locker room",
  hallway:"Hallway",class:"Classroom",cafeteria:"Cafeteria",gym:"Gym",nave:"Church",vestry:"Vestry",hallroom:"Hall",barn:"Barn",shed:"Equipment shed",ruin:"Old mill",reading:"Reading room",waiting:"Waiting room",rx:"Pharmacy counter",qoff:"Office",rest:"Restroom"};
const FLOORS={living:"wood",kitchen:"tile",bed:"carpet",kid:"carpet",bath:"tile",office:"carpet",util:"concrete",livkit:"wood",bedbath:"carpet",cabin:"wood",
  shop:"tile",back:"concrete",cafe:"tile",dkitchen:"tile",bar:"wood",lobby:"tile",exam:"tile",store:"concrete",cell:"concrete",armory:"concrete",lockers:"concrete",
  hallway:"tile",class:"tile",cafeteria:"tile",gym:"wood",nave:"wood",vestry:"wood",hallroom:"wood",barn:"dirt",shed:"concrete",ruin:"dirt",reading:"carpet",waiting:"tile",rx:"tile",qoff:"carpet",rest:"tile"};
// furniture: w along the wall, d out from it, h tall. c = container type. at: "c" center of room, "m" mounted on a wall. nb = doesn't block walking
const FURN={
  bed:{w:1.5,d:2.05,h:.6,bed:1},bed1:{w:1,d:2,h:.55,bed:1},nightstand:{w:.5,d:.42,h:.58,c:"nightstand"},dresser:{w:1.15,d:.5,h:.95,c:"dresser"},
  closet:{w:1.2,d:.62,h:2.05,c:"closet"},bookshelf:{w:1,d:.34,h:1.85,c:"bookshelf"},couch:{w:2.1,d:.9,h:.82},armchair:{w:.9,d:.85,h:.88},tv:{w:1.3,d:.45,h:.55},
  ctable:{w:1.1,d:.6,h:.42,at:"c"},rug:{w:2.2,d:1.6,h:.015,at:"c",nb:1},counter:{w:2.2,d:.62,h:.92,c:"cupboard"},fridge:{w:.8,d:.72,h:1.85,c:"fridge"},stove:{w:.76,d:.64,h:.92},
  ktable:{w:1.2,d:.8,h:.76,at:"c",chairs:2},tub:{w:1.65,d:.75,h:.56},toilet:{w:.45,d:.68,h:.45},sink:{w:.6,d:.46,h:.86},medicine:{w:.6,d:.16,h:.65,c:"medicine",at:"m",y:1.25,nb:1},
  desk:{w:1.25,d:.62,h:.76,c:"desk"},workbench:{w:1.7,d:.72,h:.92,c:"workbench"},toolshelf:{w:1.1,d:.45,h:1.85,c:"toolshelf"},washer:{w:.65,d:.65,h:.9},
  cabinshelf:{w:1.2,d:.45,h:1.6,c:"cabinshelf"},crate:{w:.9,d:.9,h:.75,c:"crate"},hay:{w:1.3,d:.75,h:.62},woodstove:{w:.7,d:.7,h:.9},
  gondola:{w:2.4,d:.9,h:1.5,c:"sh_grocery"},wallshelf:{w:2,d:.45,h:1.85,c:"sh_storage"},cooler:{w:1.6,d:.72,h:2,c:"fridge"},regcounter:{w:1.8,d:.7,h:1,c:"register"},
  rxcab:{w:1.6,d:.5,h:1.9,c:"pharmacab"},medcab:{w:1.2,d:.45,h:1.85,c:"medcab"},dcounter:{w:3.2,d:.7,h:1.05,c:"dinercounter"},dkshelf:{w:1.8,d:.5,h:1.8,c:"dinerkitchen"},
  barc:{w:3.6,d:.7,h:1.08,c:"barshelf"},booth:{w:1.6,d:1.1,h:.9},copdesk:{w:1.4,d:.7,h:.78,c:"copdesk"},filing:{w:.5,d:.6,h:1.3,c:"filing"},locker:{w:.9,d:.5,h:1.9,c:"locker"},
  armory:{w:1.4,d:.5,h:1.9,c:"armory"},bars:{w:2.4,d:.1,h:2.4},slocker:{w:1.6,d:.4,h:1.9,c:"schoollocker"},sdesk:{w:.7,d:.5,h:.72,at:"c"},gymbin:{w:1,d:.7,h:.8,c:"gymbin"},
  bench:{w:2.2,d:.45,h:.45},ltable:{w:2.4,d:.9,h:.76,at:"c",chairs:4},pantry:{w:1.8,d:.5,h:1.85,c:"pantry"},pew:{w:3.2,d:.6,h:.9},altar:{w:1.6,d:.8,h:1},
  vestry:{w:1.4,d:.55,h:1.9,c:"vestry"},libshelf:{w:2.2,d:.5,h:1.9,c:"libshelf"},chair:{w:.5,d:.5,h:.9,nb:1},stool:{w:.4,d:.4,h:.75,nb:1},lamp:{w:.4,d:.4,h:1.5,nb:1},
};
// what goes in each kind of room, most important first
const ROOMF={living:["couch","tv","bookshelf","armchair","ctable","rug","lamp"],kitchen:["counter","fridge","stove","ktable"],bed:["bed","closet","nightstand","dresser"],
  kid:["bed1","dresser","closet","nightstand","bookshelf"],bath:["tub","toilet","sink","medicine"],office:["desk","bookshelf","chair","closet"],util:["workbench","toolshelf","washer"],
  livkit:["couch","counter","fridge","stove","tv","ktable"],bedbath:["bed","closet","nightstand","toilet","sink","medicine"],cabin:["bed1","cabinshelf","cabinshelf","woodstove","ktable","crate"],
  back:["wallshelf","wallshelf","crate"],store:["wallshelf","wallshelf","crate","crate"],dkitchen:["dkshelf","fridge","stove","stove","counter"],
  exam:["bed1","medcab","sink","chair"],lockers:["locker","locker","locker","bench"],armory:["armory","armory"],cell:["bars","bed1"],qoff:["desk","filing","filing","locker","chair"],
  vestry:["vestry","closet","desk"],rx:["rxcab","rxcab","desk"],rest:["toilet","sink","medicine"]};

function bFrame(b){const r=b.face==="+z"?0:b.face==="+x"?Math.PI/2:b.face==="-z"?Math.PI:-Math.PI/2;const ns=b.face==="+z"||b.face==="-z";
  return{r,W:ns?b.w:b.d,D:ns?b.d:b.w,c:Math.round(Math.cos(r)),s:Math.round(Math.sin(r))}}
function toWorld(b,u,v){const f=b.fr;return{x:b.x+u*f.c+v*f.s,z:b.z-u*f.s+v*f.c}}
function toLocal(b,x,z){const f=b.fr;const dx=x-b.x,dz=z-b.z;return{u:dx*f.c-dz*f.s,v:dx*f.s+dz*f.c}}
function rectWorld(b,u0,v0,u1,v1){const a=toWorld(b,u0,v0),c=toWorld(b,u1,v1);return{x0:Math.min(a.x,c.x),z0:Math.min(a.z,c.z),x1:Math.max(a.x,c.x),z1:Math.max(a.z,c.z)}}
const snap=v=>Math.round(v*2)/2;

// ---------- layouts ----------
function mkRoom(t,u0,v0,u1,v1){return{t,u0,v0,u1,v1,fl:FLOORS[t]||"wood",f:[]}}
// doorway: o "v" = wall at v=c running along u (gap centered at u=a); o "u" = wall at u=c running along v (gap at v=a)
function mkDw(o,c,a,w,o2={}){return{o,c,a,w,...o2}}
function rowSplit(u0,u1,parts){const out=[];let u=u0;const tot=parts.reduce((s,p)=>s+p[1],0);const k=(u1-u0)/tot;
  parts.forEach((p,i)=>{const nu=i===parts.length-1?u1:snap(u+p[1]*k);out.push([p[0],u,nu]);u=nu});return out}
function layHome(b,R){const {W,D}=b.fr;const rooms=[],dws=[];
  if(b.type==="cabin"){rooms.push(mkRoom("cabin",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,-.8,1,{ext:1,door:1}));return{rooms,dws}}
  if(b.type==="trailer"){const s=snap(W*.2);rooms.push(mkRoom("livkit",-W/2,-D/2,s,D/2),mkRoom("bedbath",s,-D/2,W/2,D/2));
    dws.push(mkDw("v",D/2,-W/2+1.6,.95,{ext:1,door:1}),mkDw("u",s,0,.85));return{rooms,dws}}
  const big=W>=11;const fd=snap(D*(big?.5:.54)+R()*.5);const vs=D/2-fd;
  const lw=snap(W*(.52+R()*.1));const lu1=-W/2+lw;
  rooms.push(mkRoom("living",-W/2,vs,lu1,D/2),mkRoom("kitchen",lu1,vs,W/2,D/2));
  const back=big?[["bed",4],["bath",2],["kid",3],[R()<.5?"office":"util",3]]:R()<.75?[["bed",3.7],["bath",2],[R()<.6?"kid":"bed",3.3]]:[["bed",4.2],["bath",2],["office",2.8]];
  if(R()<.5&&!big)back.reverse();
  const cols=rowSplit(-W/2,W/2,back);for(const [t,u0,u1] of cols)rooms.push(mkRoom(t,u0,-D/2,u1,vs));
  dws.push(mkDw("v",D/2,clamp(snap(-W/2+lw*(.3+R()*.4)),-W/2+.9,lu1-.9),1,{ext:1,door:1}));
  dws.push(mkDw("u",lu1,(vs+D/2)/2,1.4));
  dws.push(mkDw("u",W/2,(vs+D/2)/2+.2,.9,{ext:1,door:1}));// side door out of the kitchen
  const front=[[0,-W/2,lu1],[1,lu1,W/2]];
  cols.forEach(([t,u0,u1],i)=>{let best=null,bo=0;for(const [fi,a,c] of front){const o=Math.min(u1,c)-Math.max(u0,a);if(o>bo){bo=o;best=[fi,Math.max(u0,a),Math.min(u1,c)]}}
    if(bo>=1.3){const lo=best[1]+.65,hi=best[2]-.65;dws.push(mkDw("v",vs,snap((lo+hi)/2+(R()-.5)*Math.max(0,hi-lo)*.6),.9))}
    else dws.push(mkDw("u",i>0?u0:u1,(-D/2+vs)/2,.85))});
  // a mirrored copy keeps every street from looking the same
  if(R()<.5)mirror(rooms,dws);
  return{rooms,dws}}
function mirror(rooms,dws){for(const r of rooms){const a=-r.u1,c=-r.u0;r.u0=a;r.u1=c}for(const d of dws){if(d.o==="u")d.c=-d.c;else d.a=-d.a}}
function layStore(b,R){const {W,D}=b.fr;const ty=b.type;const rooms=[],dws=[];
  const two=(t1,t2,bd,lock)=>{const vs=-D/2+bd;rooms.push(mkRoom(t1,-W/2,vs,W/2,D/2),mkRoom(t2,-W/2,-D/2,W/2,vs));dws.push(mkDw("v",D/2,0,1.5,{ext:1,door:1}),mkDw("v",vs,snap(W/2-1.4),.95,lock?{door:1,lock:"pry"}:{}));return vs};
  if(ty==="pharmacy"){two("shop","rx",2.8,true)}
  else if(ty==="hardware"){two("shop","back",3)}
  else if(ty==="grocery"){two("shop","store",3)}
  else if(ty==="library"){two("reading","office",2.6)}
  else if(ty==="diner"){two("cafe","dkitchen",2.6)}
  else if(ty==="bar"){two("bar","store",2.4)}
  else if(ty==="gas"){const vs=-D/2+2.2;rooms.push(mkRoom("shop",-W/2,vs,W/2,D/2),mkRoom("store",-W/2,-D/2,2,vs),mkRoom("rest",2,-D/2,W/2,vs));dws.push(mkDw("v",D/2,-1,1.5,{ext:1,door:1}),mkDw("v",vs,-1.5,.95),mkDw("v",vs,3.2,.85))}
  else if(ty==="clinic"){const vs=0;rooms.push(mkRoom("waiting",-W/2,vs,W/2,D/2));const cols=rowSplit(-W/2,W/2,[["exam",3.4],["exam",3.3],["store",3.3]]);for(const [t,u0,u1] of cols){rooms.push(mkRoom(t,u0,-D/2,u1,vs));dws.push(mkDw("v",vs,snap((u0+u1)/2),.95))}dws.push(mkDw("v",D/2,0,1.5,{ext:1,door:1}))}
  else if(ty==="sheriff"){const vs=.5;rooms.push(mkRoom("lobby",-W/2,vs,W/2,D/2));const cols=rowSplit(-W/2,W/2,[["qoff",3],["lockers",2.5],["armory",1.9],["cell",2.6]]);
    for(const [t,u0,u1] of cols){rooms.push(mkRoom(t,u0,-D/2,u1,vs));dws.push(mkDw("v",vs,snap((u0+u1)/2),.9,t==="armory"?{door:1,lock:"pry"}:t==="cell"?{door:1}:{}))}dws.push(mkDw("v",D/2,0,1.4,{ext:1,door:1}))}
  else if(ty==="school"){const vs=D/2-2.6;rooms.push(mkRoom("hallway",-W/2,vs,W/2,D/2));const cols=rowSplit(-W/2,W/2,[["class",6.5],["class",6.5],["cafeteria",6.5],["gym",6.5]]);
    for(const [t,u0,u1] of cols){rooms.push(mkRoom(t,u0,-D/2,u1,vs));dws.push(mkDw("v",vs,snap(u0+1.4),1.1))}dws.push(mkDw("v",D/2,-6.5,1.6,{ext:1,door:1}),mkDw("v",D/2,6.5,1.6,{ext:1,door:1}))}
  else if(ty==="church"){const vs=-D/2+3.4;rooms.push(mkRoom("nave",-W/2,vs,W/2,D/2),mkRoom("vestry",-W/2,-D/2,0,vs),mkRoom("store",0,-D/2,W/2,vs));dws.push(mkDw("v",D/2,0,1.8,{ext:1,door:1}),mkDw("v",vs,-W/2+1.3,.9),mkDw("v",vs,W/2-1.3,.9))}
  else if(ty==="hall"){const vs=-D/2+3;rooms.push(mkRoom("hallroom",-W/2,vs,W/2,D/2),mkRoom("dkitchen",-W/2,-D/2,W/2,vs));dws.push(mkDw("v",D/2,0,1.5,{ext:1,door:1}),mkDw("v",vs,1.5,1.1))}
  else if(ty==="barn"){rooms.push(mkRoom("barn",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,0,2.8,{ext:1,door:1}))}
  else if(ty==="qsheds"){rooms.push(mkRoom("shed",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,-2,2.6,{ext:1,door:1}))}
  else if(ty==="mill"){rooms.push(mkRoom("ruin",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,1,2.2,{ext:1}),mkDw("u",-W/2,0,1.8,{ext:1}))}
  else if(ty==="qoffice"){rooms.push(mkRoom("qoff",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,1,1,{ext:1,door:1}))}
  else{rooms.push(mkRoom("store",-W/2,-D/2,W/2,D/2));dws.push(mkDw("v",D/2,0,1.2,{ext:1,door:1}))}
  return{rooms,dws}}

// ---------- furniture placement ----------
function roomInner(r){return{u0:r.u0+.2,v0:r.v0+.2,u1:r.u1-.2,v1:r.v1-.2}}
function keepOuts(b,r){const K=[];for(const d of b.dws){const on=d.o==="v"?(Math.abs(d.c-r.v0)<.01||Math.abs(d.c-r.v1)<.01)&&d.a>r.u0-.01&&d.a<r.u1+.01:(Math.abs(d.c-r.u0)<.01||Math.abs(d.c-r.u1)<.01)&&d.a>r.v0-.01&&d.a<r.v1+.01;if(!on)continue;
  const h=d.w/2+.2;if(d.o==="v"){const lo=Math.abs(d.c-r.v0)<.01;K.push({u0:d.a-h,u1:d.a+h,v0:lo?d.c:d.c-1.1,v1:lo?d.c+1.1:d.c})}else{const lo=Math.abs(d.c-r.u0)<.01;K.push({v0:d.a-h,v1:d.a+h,u0:lo?d.c:d.c-1.1,u1:lo?d.c+1.1:d.c})}}return K}
const ovl=(a,b,m=0)=>a.u0<b.u1+m&&a.u1>b.u0-m&&a.v0<b.v1+m&&a.v1>b.v0-m;
function fits(r,K,fp,k){const F=FURN[k];const I=roomInner(r);const mount=F.at==="m";if(fp.u0<I.u0-.001||fp.u1>I.u1+.001||fp.v0<I.v0-.001||fp.v1>I.v1+.001)return false;
  if(k==="rug")return true;if(!mount)for(const q of K)if(ovl(fp,q))return false;
  for(const f of r.f){if(mount!==!!f.mount||f.k==="rug")continue;if(ovl(fp,f,.06))return false}return true}
function addF(r,k,fp,rot,o={}){const F=FURN[k];const it={k,u0:fp.u0,v0:fp.v0,u1:fp.u1,v1:fp.v1,rot,h:F.h,y:F.y||0,c:o.c||F.c||null,nb:!!F.nb,mount:F.at==="m",bed:!!F.bed};r.f.push(it);return it}
function wallSpot(r,K,k,R,sides,o={}){const F=FURN[k];const I=roomInner(r);const mount=F.at==="m";
  for(let tries=0;tries<40;tries++){const side=sides?sides[tries%sides.length]:Math.floor(R()*4);let fp,rot;
    if(side===0||side===2){const span=I.u1-I.u0-F.w;if(span<0)continue;const p=I.u0+F.w/2+R()*span;fp={u0:p-F.w/2,u1:p+F.w/2,v0:side===0?I.v0:I.v1-F.d,v1:side===0?I.v0+F.d:I.v1};rot=side===0?0:Math.PI}
    else{const span=I.v1-I.v0-F.w;if(span<0)continue;const p=I.v0+F.w/2+R()*span;fp={v0:p-F.w/2,v1:p+F.w/2,u0:side===1?I.u0:I.u1-F.d,u1:side===1?I.u0+F.d:I.u1};rot=side===1?Math.PI/2:-Math.PI/2}
    if(mount){// medicine cabinets go above a sink if there is one
      const s=r.f.find(f=>f.k==="sink");if(s&&tries<4){const w=F.w,d=F.d;const cu=(s.u0+s.u1)/2,cv=(s.v0+s.v1)/2;const rr=s.rot;
        if(Math.abs(rr)<.1)fp={u0:cu-w/2,u1:cu+w/2,v0:s.v0,v1:s.v0+d};else if(Math.abs(rr-Math.PI)<.1)fp={u0:cu-w/2,u1:cu+w/2,v0:s.v1-d,v1:s.v1};else if(rr>0)fp={v0:cv-w/2,v1:cv+w/2,u0:s.u0,u1:s.u0+d};else fp={v0:cv-w/2,v1:cv+w/2,u0:s.u1-d,u1:s.u1};rot=rr}}
    if(fits(r,K,fp,k))return addF(r,k,fp,rot,o)}
  return null}
function centerSpot(r,K,k,R,o={}){const F=FURN[k];const I=roomInner(r);
  for(let tries=0;tries<24;tries++){const rotd=R()<.5&&tries>8;const w=rotd?F.d:F.w,d=rotd?F.w:F.d;const cu=(I.u0+I.u1)/2+(R()-.5)*Math.max(0,(I.u1-I.u0)-w-1.6)*.7,cv=(I.v0+I.v1)/2+(R()-.5)*Math.max(0,(I.v1-I.v0)-d-1.6)*.7;
    const fp={u0:cu-w/2,u1:cu+w/2,v0:cv-d/2,v1:cv+d/2};if(fits(r,K,fp,k)){const it=addF(r,k,fp,rotd?Math.PI/2:0,o);
      if(F.chairs){const n=F.chairs;const sp=[[0,-(d/2+.32)],[0,d/2+.32],[-(w/2+.32),0],[w/2+.32,0]];for(let i=0;i<Math.min(4,n);i++){const [du,dv]=sp[i];const c={u0:cu+du-.22,u1:cu+du+.22,v0:cv+dv-.22,v1:cv+dv+.22};const ang=Math.atan2(-du,-dv);r.f.push({k:"chair",u0:c.u0,v0:c.v0,u1:c.u1,v1:c.v1,rot:ang,h:.9,y:0,c:null,nb:true})}}
      return it}}
  return null}
function furnish(b,R){for(const r of b.rooms){const K=keepOuts(b,r);const I=roomInner(r);const ty=b.type;
    // stores lay out their aisles by hand
    if(r.t==="shop"||r.t==="reading"){const sh=ty==="pharmacy"?"sh_pharmacy":ty==="hardware"?"sh_hardware":ty==="gas"?"sh_gas":ty==="library"?"libshelf":"sh_grocery";const unitK=ty==="library"?"libshelf":"gondola";
      {const F=FURN.regcounter;const side=R()<.5?1:3;const v1=I.v1-1.3,v0=v1-F.w;const fp=side===1?{u0:I.u0,u1:I.u0+F.d,v0,v1}:{u0:I.u1-F.d,u1:I.u1,v0,v1};if(fits(r,K,fp,"regcounter"))addF(r,"regcounter",fp,side===1?Math.PI/2:-Math.PI/2);else wallSpot(r,K,"regcounter",R,[1,3])}
      if(ty==="grocery"||ty==="gas")wallSpot(r,K,"cooler",R,[0,1,3]);
      const uw=FURN[unitK].w,dd=FURN[unitK].d;const vTop=I.v1-1.9;for(let v=I.v0+1.05;v+dd<=vTop;v+=dd+1.2){let u=I.u0+1.1;while(u+uw<=I.u1-1.1+.001){const fp={u0:u,u1:u+uw,v0:v,v1:v+dd};if(fits(r,K,fp,unitK))addF(r,unitK,fp,0,{c:sh});u+=uw}}
      if(ty!=="library"){wallSpot(r,K,"wallshelf",R,[0],{c:sh});wallSpot(r,K,"wallshelf",R,[0],{c:sh});wallSpot(r,K,"wallshelf",R,[1,3],{c:sh})}else wallSpot(r,K,"ltable",R,[0]);continue}
    if(r.t==="cafe"){wallSpot(r,K,"dcounter",R,[0]);for(let i=0;i<3;i++)wallSpot(r,K,"booth",R,[2,1,3]);for(let i=0;i<4;i++)wallSpot(r,K,"stool",R,[0]);continue}
    if(r.t==="bar"){wallSpot(r,K,"barc",R,[1,3,0]);centerSpot(r,K,"ktable",R);wallSpot(r,K,"booth",R,[2]);continue}
    if(r.t==="waiting"){wallSpot(r,K,"desk",R,[0]);for(let i=0;i<5;i++)wallSpot(r,K,"chair",R,[1,3,2]);continue}
    if(r.t==="lobby"){wallSpot(r,K,"copdesk",R,[0]);wallSpot(r,K,"copdesk",R,[0,1,3]);wallSpot(r,K,"filing",R);for(let i=0;i<3;i++)wallSpot(r,K,"chair",R,[2]);continue}
    if(r.t==="hallway"){for(let i=0;i<7;i++)wallSpot(r,K,"slocker",R,[0,2]);continue}
    if(r.t==="class"){wallSpot(r,K,"desk",R,[0]);wallSpot(r,K,"bookshelf",R,[1,3]);for(let a=0;a<3;a++)for(let c=0;c<3;c++){const cu=I.u0+1.4+a*((I.u1-I.u0-2.8)/2),cv=I.v0+2.2+c*1.3;const fp={u0:cu-.35,u1:cu+.35,v0:cv-.25,v1:cv+.25};if(fits(r,K,fp,"sdesk"))addF(r,"sdesk",fp,0)}continue}
    if(r.t==="cafeteria"){wallSpot(r,K,"pantry",R,[0]);wallSpot(r,K,"pantry",R,[0,1,3]);wallSpot(r,K,"fridge",R,[1,3]);centerSpot(r,K,"ltable",R);centerSpot(r,K,"ltable",R);continue}
    if(r.t==="gym"){wallSpot(r,K,"gymbin",R);wallSpot(r,K,"gymbin",R);wallSpot(r,K,"bench",R,[1,3]);wallSpot(r,K,"bench",R,[1,3]);continue}
    if(r.t==="nave"){wallSpot(r,K,"altar",R,[0]);for(let v=I.v0+2.6;v<I.v1-1.6;v+=1.3)for(const side of [-1,1]){const u0=side<0?I.u0+.4:(I.u0+I.u1)/2+.6,u1=side<0?(I.u0+I.u1)/2-.6:I.u1-.4;const fp={u0,u1,v0:v,v1:v+.6};if(u1-u0>1.2&&fits(r,K,fp,"pew"))addF(r,"pew",fp,0)}continue}
    if(r.t==="hallroom"){centerSpot(r,K,"ltable",R);centerSpot(r,K,"ltable",R);wallSpot(r,K,"bench",R);continue}
    if(r.t==="barn"){for(let i=0;i<5;i++)wallSpot(r,K,"hay",R);wallSpot(r,K,"crate",R);wallSpot(r,K,"crate",R);wallSpot(r,K,"workbench",R,[0]);wallSpot(r,K,"toolshelf",R);continue}
    if(r.t==="shed"){wallSpot(r,K,"workbench",R,[0]);wallSpot(r,K,"toolshelf",R);wallSpot(r,K,"toolshelf",R);wallSpot(r,K,"locker",R);for(let i=0;i<3;i++)wallSpot(r,K,"crate",R);continue}
    if(r.t==="ruin"){for(let i=0;i<3;i++)wallSpot(r,K,"crate",R);wallSpot(r,K,"toolshelf",R);wallSpot(r,K,"workbench",R);continue}
    if(r.t==="store"&&ty==="church"){wallSpot(r,K,"pantry",R,[0]);wallSpot(r,K,"crate",R);continue}
    if(r.t==="office"&&ty==="library"){wallSpot(r,K,"desk",R,[0]);wallSpot(r,K,"filing",R);wallSpot(r,K,"bookshelf",R);continue}
    const list=ROOMF[r.t]||[];
    for(const k of list){const F=FURN[k];if(F.at==="c")centerSpot(r,K,k,R);else wallSpot(r,K,k,R,k==="bed"||k==="bed1"?[0,1,3]:null)}}}

// ---------- building it all ----------
const DOORS=[];const CONTS={};// container id -> {id,k,b,f,x,z,ux,uz,room}
function wallsOf(b){const {W,D}=b.fr;const lines=new Map();
  const add=(o,c,a0,a1)=>{const k=o+(Math.round(c*100));let L=lines.get(k);if(!L)lines.set(k,L={o,c,iv:[]});L.iv.push([a0,a1])};
  for(const r of b.rooms){add("v",r.v0,r.u0,r.u1);add("v",r.v1,r.u0,r.u1);add("u",r.u0,r.v0,r.v1);add("u",r.u1,r.v0,r.v1)}
  const out=[];
  for(const L of lines.values()){L.iv.sort((a,c)=>a[0]-c[0]);const m=[];for(const iv of L.iv){const l=m[m.length-1];if(l&&iv[0]<=l[1]+.01)l[1]=Math.max(l[1],iv[1]);else m.push([...iv])}
    const ext=L.o==="v"?Math.abs(Math.abs(L.c)-D/2)<.01:Math.abs(Math.abs(L.c)-W/2)<.01;
    let segs=m;for(const d of b.dws){if(d.o!==L.o||Math.abs(d.c-L.c)>.01)continue;const g0=d.a-d.w/2,g1=d.a+d.w/2;const ns=[];for(const [a,c] of segs){if(g1<=a||g0>=c){ns.push([a,c]);continue}if(g0>a)ns.push([a,g0]);if(g1<c)ns.push([g1,c])}segs=ns}
    for(const [a0,a1] of segs)if(a1-a0>.02)out.push({o:L.o,c:L.c,a0,a1,ext,out:ext?Math.sign(L.c):0})}
  return out}
function wallBox(b,w){const t=w.ext?.2:.14;let u0,u1,v0,v1;
  if(w.o==="v"){u0=w.a0;u1=w.a1;if(w.ext){v0=w.out>0?w.c-t:w.c;v1=w.out>0?w.c:w.c+t}else{v0=w.c-t/2;v1=w.c+t/2}}
  else{v0=w.a0;v1=w.a1;if(w.ext){u0=w.out>0?w.c-t:w.c;u1=w.out>0?w.c:w.c+t}else{u0=w.c-t/2;u1=w.c+t/2}}
  return{u0,u1,v0,v1}}
function dwSides(b,d){// points just either side of a doorway, in world coords; [lowSide, highSide]
  const o=.6;if(d.o==="v")return[toWorld(b,d.a,d.c-o),toWorld(b,d.a,d.c+o)];return[toWorld(b,d.c-o,d.a),toWorld(b,d.c+o,d.a)]}
function roomIdxAtLocal(b,u,v){for(let i=0;i<b.rooms.length;i++){const r=b.rooms[i];if(u>=r.u0-.001&&u<=r.u1+.001&&v>=r.v0-.001&&v<=r.v1+.001)return i}return-1}
function buildInteriors(){const R=srng(4242);let dn=0;
  for(const b of BUILDINGS){b.fr=bFrame(b);b.H=WALL_H[b.type]||3;const L=["house","farmhouse","trailer","cabin"].includes(b.type)?layHome(b,R):layStore(b,R);b.rooms=L.rooms;b.dws=L.dws;
    furnish(b,R);b.walls=wallsOf(b);b.doors=[];b.cs=[];b.beds=[];b.spots=[];
    // doorways: which rooms they join, the points either side, door leaves
    for(const d of b.dws){const [lo,hi]=dwSides(b,d);d.p=[lo,hi];const ll=toLocal(b,lo.x,lo.z),hl=toLocal(b,hi.x,hi.z);d.r=[roomIdxAtLocal(b,ll.u,ll.v),roomIdxAtLocal(b,hl.u,hl.v)];
      if(d.ext){d.outSide=d.r[0]<0?0:1;d.inSide=1-d.outSide}
      if(d.door){const g=d.o==="v"?rectWorld(b,d.a-d.w/2,d.c-.1,d.a+d.w/2,d.c+.1):rectWorld(b,d.c-.1,d.a-d.w/2,d.c+.1,d.a+d.w/2);const c=d.o==="v"?toWorld(b,d.a,d.c):toWorld(b,d.c,d.a);
        const door={id:"d"+(dn++),b:b.id,dw:d,x:c.x,z:c.z,box:g,w:d.w,open:false,lock:d.lock||null,hp:100,broken:false,bar:0,ext:!!d.ext,ax:(g.x1-g.x0)>(g.z1-g.z0)?"x":"z"};d.door=door;b.doors.push(door);DOORS.push(door)}}
    b.exits=b.dws.filter(d=>d.ext);
    // furniture: containers, beds, collision
    let ci=0;b.rooms.forEach((r,ri)=>{for(const f of r.f){const w=rectWorld(b,f.u0,f.v0,f.u1,f.v1);f.w=w;f.wrot=f.rot+b.fr.r;
      const cu=(f.u0+f.u1)/2,cv=(f.v0+f.v1)/2;const fu=Math.sin(f.rot),fv=Math.cos(f.rot);const dep=(Math.abs(fu)>.5?(f.u1-f.u0):(f.v1-f.v0))/2;
      if(f.c){const id=b.id+":"+(ci++);const use=toWorld(b,cu+fu*(dep+.45),cv+fv*(dep+.45));const ctr=toWorld(b,cu,cv);f.id=id;
        CONTS[id]={id,k:f.c,b:b.id,f,x:ctr.x,z:ctr.z,ux:use.x,uz:use.z,room:ri,n:CONT[f.c]?.n||"Shelf"};b.cs.push(CONTS[id])}
      if(f.bed){const c=toWorld(b,cu,cv);b.beds.push({x:c.x,z:c.z,rot:f.wrot,room:ri})}}});
    // spots where people can stand around
    for(let i=0;i<80&&b.spots.length<14;i++){const ri=Math.floor(R()*b.rooms.length);const r=b.rooms[ri];const I=roomInner(r);const u=I.u0+.3+R()*Math.max(0,I.u1-I.u0-.6),v=I.v0+.3+R()*Math.max(0,I.v1-I.v0-.6);
      if(r.f.some(f=>!f.nb&&u>f.u0-.35&&u<f.u1+.35&&v>f.v0-.35&&v<f.v1+.35))continue;const p=toWorld(b,u,v);b.spots.push({x:p.x,z:p.z,room:ri})}
    if(!b.spots.length){const p=toWorld(b,0,0);b.spots.push({x:p.x,z:p.z,room:0})}}
  for(const c of CARS){const id=c.id;CONTS[id]={id,k:"car",b:null,car:c,x:c.x,z:c.z,ux:c.x+(c.x<28?-1.6:1.6),uz:c.z,n:c.n}}}

// ---------- collision: a spatial hash of boxes ----------
const COL={c:4,m:new Map()};
const ckey=(i,j)=>(i+200)*1000+(j+200);
function colAdd(bx){const c=COL.c;for(let i=Math.floor(bx.x0/c);i<=Math.floor(bx.x1/c);i++)for(let j=Math.floor(bx.z0/c);j<=Math.floor(bx.z1/c);j++){const k=ckey(i,j);let L=COL.m.get(k);if(!L)COL.m.set(k,L=[]);L.push(bx)}}
const BGRID=new Map();
function buildCollision(){COL.m.clear();BGRID.clear();
  for(const b of BUILDINGS){for(const w of b.walls){const r=wallBox(b,w);colAdd({...rectWorld(b,r.u0,r.v0,r.u1,r.v1),k:"wall",b:b.id})}
    for(const r of b.rooms)for(const f of r.f)if(!f.nb&&!f.mount)colAdd({...f.w,k:"furn",b:b.id});
    for(const d of b.doors)colAdd({...d.box,k:"door",d});
    const x0=b.x-b.w/2,x1=b.x+b.w/2,z0=b.z-b.d/2,z1=b.z+b.d/2;for(let i=Math.floor(x0/10);i<=Math.floor(x1/10);i++)for(let j=Math.floor(z0/10);j<=Math.floor(z1/10);j++){const k=ckey(i,j);let L=BGRID.get(k);if(!L)BGRID.set(k,L=[]);L.push(b)}}
  for(const c of CARS){const ca=Math.abs(Math.cos(c.rot)),sa=Math.abs(Math.sin(c.rot));const hx=.95*ca+2.05*sa,hz=.95*sa+2.05*ca;colAdd({x0:c.x-hx,x1:c.x+hx,z0:c.z-hz,z1:c.z+hz,k:"car"})}
  for(const q of QWALLS)colAdd({x0:q[0],z0:q[1],x1:q[2],z1:q[3],k:"rock"});
  for(const c of Object.values(CONTS)){if(!c.f)continue;const b=BMAP[c.b];const f=c.f;const cu=(f.u0+f.u1)/2,cv=(f.v0+f.v1)/2;const fu=Math.sin(f.rot),fv=Math.cos(f.rot);
    const hw=(Math.abs(fu)>.5?(f.v1-f.v0):(f.u1-f.u0))/2,hd=(Math.abs(fu)>.5?(f.u1-f.u0):(f.v1-f.v0))/2;const su=fv,sv=-fu;
    const cand=[[0,hd+.45],[hw*.6,hd+.45],[-hw*.6,hd+.45],[0,hd+.8],[hw+.45,0],[-hw-.45,0],[hw*.6,hd+.8],[-hw*.6,hd+.8]];
    cand.push([0,hd+1.1],[hw+.45,hd*.5],[-hw-.45,hd*.5],[hw*.8,hd+1.1],[-hw*.8,hd+1.1]);
    for(const [s_,f_] of cand){const p=toWorld(b,cu+su*s_+fu*f_,cv+sv*s_+fv*f_);if(free(p.x,p.z,.3,"pl")&&roomAt(p.x,p.z)?.ri===c.room){c.ux=p.x;c.uz=p.z;c.ok=true;break}}
    if(!c.ok){let best=null,bd=1e9;for(const sp of b.spots){if(sp.room!==c.room)continue;const d=dist(sp.x,sp.z,c.x,c.z);if(d<bd){bd=d;best=sp}}if(best){c.ux=best.x;c.uz=best.z}}}}
// how far the player is from a piece of furniture's footprint
function contReach(c,x,z){if(!c.f){const car=c.car;return Math.max(0,dist(x,z,car.x,car.z)-2)}const w=c.f.w;const dx=Math.max(0,w.x0-x,x-w.x1),dz=Math.max(0,w.z0-z,z-w.z1);return Math.hypot(dx,dz)}
const QWALLS=[[60,-96,122,-94],[60,-60,122,-58],[120,-96,122,-58],[60,-96,62,-78],[60,-72,62,-58]];
function bldAt(x,z){const L=BGRID.get(ckey(Math.floor(x/10),Math.floor(z/10)));if(!L)return null;for(const b of L)if(Math.abs(x-b.x)<b.w/2&&Math.abs(z-b.z)<b.d/2)return b;return null}
function roomAt(x,z){const b=bldAt(x,z);if(!b)return null;const l=toLocal(b,x,z);const ri=roomIdxAtLocal(b,l.u,l.v);return{b,ri:ri<0?0:ri}}
function roomKey(x,z){const r=roomAt(x,z);return r?r.b.id+"/"+r.ri:"out"}
let WALLED=new Set();// camps the dead can't walk into
// who: "pl" player, "npc" townsfolk (walk through unlocked doors), "zed" the dead, "far" (ignore furniture)
function free(x,z,r=.3,who="pl"){if(x<WB.x0+.5||x>WB.x1-.5||z<WB.z0+.5||z>WB.z1-.5)return false;
  if(z>42-r&&z<52+r&&!(x>23+r&&x<33-r)&&!(x>-62+r&&x<-52-r))return false;
  const c=COL.c;const i0=Math.floor((x-r)/c),i1=Math.floor((x+r)/c),j0=Math.floor((z-r)/c),j1=Math.floor((z+r)/c);
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const L=COL.m.get(ckey(i,j));if(!L)continue;for(const bx of L){if(x+r<=bx.x0||x-r>=bx.x1||z+r<=bx.z0||z-r>=bx.z1)continue;
    if(bx.k==="door"){const d=bx.d;if(d.open||d.broken)continue;if(who==="npc"&&!d.lock&&!d.bar)continue;if(who==="far")continue;return false}
    if(bx.k==="furn"&&who==="far")continue;return false}}
  if(who==="zed"&&WALLED.size&&WALLED.has(regionAt(x,z)))return false;
  return true}
// the closed door blocking a spot, if any
function doorAt(x,z,r=.45){const c=COL.c;for(let i=Math.floor((x-r)/c);i<=Math.floor((x+r)/c);i++)for(let j=Math.floor((z-r)/c);j<=Math.floor((z+r)/c);j++){const L=COL.m.get(ckey(i,j));if(!L)continue;
  for(const bx of L)if(bx.k==="door"&&!(x+r<=bx.x0||x-r>=bx.x1||z+r<=bx.z0||z-r>=bx.z1))return bx.d}return null}
function step(e,dx,dz,r,who){if(!free(e.x,e.z,r,who)){e.x+=dx;e.z+=dz;return true}const nx=e.x+dx,nz=e.z+dz;
  if(free(nx,nz,r,who)){e.x=nx;e.z=nz;return true}if(Math.abs(dx)>1e-4&&free(nx,e.z,r,who)){e.x=nx;return true}if(Math.abs(dz)>1e-4&&free(e.x,nz,r,who)){e.z=nz;return true}return false}

// ---------- paths: through doorways, around buildings, over the river ----------
function inQuarry(x,z){return x>60&&x<122&&z>-96&&z<-58}
function roomRoute(b,from,to){if(from===to)return[];const prev=new Map([[from,null]]);const q=[from];
  while(q.length){const r=q.shift();if(r===to)break;for(const d of b.dws){if(d.ext||d.r[0]<0||d.r[1]<0)continue;const i=d.r.indexOf(r);if(i<0)continue;const n=d.r[1-i];if(prev.has(n))continue;prev.set(n,{r,d,i});q.push(n)}}
  if(!prev.has(to))return[];const pts=[];let cur=to;while(prev.get(cur)){const {r,d,i}=prev.get(cur);pts.unshift(d.p[1-i]);pts.unshift(d.p[i]);cur=r}return pts}
function exitRoute(b,ri,tx,tz){let best=null,bl=1e9;for(const d of b.exits){const inner=roomRoute(b,ri,d.r[d.inSide]);const o=d.p[d.outSide];let L=dist(o.x,o.z,tx,tz);let px=null;for(const p of inner){if(px)L+=dist(px.x,px.z,p.x,p.z);px=p}
  if(d.door&&d.door.lock&&!d.door.broken)L+=60;if(L<bl){bl=L;best={pts:[...inner,d.p[d.inSide],o],d}}}return best}
function segHitsRect(ax,az,bx,bz,r){// Liang-Barsky
  let t0=0,t1=1;const dx=bx-ax,dz=bz-az;const p=[-dx,dx,-dz,dz],q=[ax-r.x0,r.x1-ax,az-r.z0,r.z1-az];
  for(let i=0;i<4;i++){if(Math.abs(p[i])<1e-9){if(q[i]<0)return false}else{const t=q[i]/p[i];if(p[i]<0){if(t>t1)return false;if(t>t0)t0=t}else{if(t<t0)return false;if(t<t1)t1=t}}}return t0<t1}
function blockersOn(a,b,skip){const out=[];const x0=Math.min(a.x,b.x)-8,x1=Math.max(a.x,b.x)+8,z0=Math.min(a.z,b.z)-8,z1=Math.max(a.z,b.z)+8;
  for(const B of BUILDINGS){if(B===skip)continue;if(B.x+B.w/2<x0||B.x-B.w/2>x1||B.z+B.d/2<z0||B.z-B.d/2>z1)continue;const r={x0:B.x-B.w/2-.45,x1:B.x+B.w/2+.45,z0:B.z-B.d/2-.45,z1:B.z+B.d/2+.45};if(segHitsRect(a.x,a.z,b.x,b.z,r))out.push([B,r,dist(a.x,a.z,B.x,B.z)])}
  return out.sort((p,q)=>p[2]-q[2])}
function detour(a,b,depth=0){if(depth>4)return[b];const hit=blockersOn(a,b);if(!hit.length)return[b];const [B,r0]=hit[0];const m=.8;const r={x0:r0.x0-m+.45,x1:r0.x1+m-.45,z0:r0.z0-m+.45,z1:r0.z1+m-.45};
  const C=[{x:r.x0,z:r.z0},{x:r.x1,z:r.z0},{x:r.x1,z:r.z1},{x:r.x0,z:r.z1}];const inner={x0:r0.x0,x1:r0.x1,z0:r0.z0,z1:r0.z1};let best=null,bl=1e9;
  for(let i=0;i<4;i++){const c=C[i];if(!segHitsRect(a.x,a.z,c.x,c.z,inner)&&!segHitsRect(c.x,c.z,b.x,b.z,inner)){const L=dist(a.x,a.z,c.x,c.z)+dist(c.x,c.z,b.x,b.z);if(L<bl){bl=L;best=[c]}}
    for(const j of [(i+1)%4,(i+3)%4]){const d=C[j];if(!segHitsRect(a.x,a.z,c.x,c.z,inner)&&!segHitsRect(d.x,d.z,b.x,b.z,inner)){const L=dist(a.x,a.z,c.x,c.z)+dist(c.x,c.z,d.x,d.z)+dist(d.x,d.z,b.x,b.z);if(L<bl){bl=L;best=[c,d]}}}}
  if(!best)return[b];const out=[];let p=a;for(const c of best){out.push(...detour(p,c,depth+1));p=c}out.push(...detour(p,b,depth+1));return out}
function outdoorRoute(a,b){const legs=[];let cur=a;
  const qa=inQuarry(a.x,a.z),qb=inQuarry(b.x,b.z);if(qa!==qb){const g1={x:qa?66:56,z:-75},g2={x:qa?56:66,z:-75};legs.push(g1,g2)}
  const n1=a.z<47,n2=b.z<47;if(n1!==n2){const bx=28,fx=-57;const cx=Math.abs(a.x-bx)+Math.abs(b.x-bx)<=Math.abs(a.x-fx)+Math.abs(b.x-fx)?bx:fx;legs.push({x:cx,z:n1?39:55},{x:cx,z:n1?55:39})}
  const pts=[];for(const l of [...legs,b]){pts.push(...detour(cur,l));cur=l}return pts}
function navPath(x0,z0,x1,z1){const A=roomAt(x0,z0),B=roomAt(x1,z1);const end={x:x1,z:z1};
  if(A&&B&&A.b===B.b)return[...roomRoute(A.b,A.ri,B.ri),end];
  const pts=[];let s={x:x0,z:z0};
  if(A){const ex=exitRoute(A.b,A.ri,x1,z1);if(ex){pts.push(...ex.pts);s=ex.pts[ex.pts.length-1]}}
  if(B){let best=null,bl=1e9;for(const d of B.b.exits){const o=d.p[d.outSide];const inner=roomRoute(B.b,d.r[d.inSide],B.ri);let L=dist(s.x,s.z,o.x,o.z);if(d.door&&d.door.lock&&!d.door.broken)L+=60;if(L<bl){bl=L;best={o,i:d.p[d.inSide],inner}}}
    if(best){pts.push(...outdoorRoute(s,best.o),best.i,...best.inner,end);return pts}}
  pts.push(...outdoorRoute(s,end));return pts}
// a random free spot inside a building (or a room of it)
function insidePos(b,room){const L=room==null?b.spots:b.spots.filter(s=>s.room===room);const s=pick(L.length?L:b.spots);return{x:s.x+(rf()-.5)*.3,z:s.z+(rf()-.5)*.3}}
function bedPos(b,i=0){return b.beds.length?b.beds[i%b.beds.length]:null}
function nearBuilding(x,z,r=2.2){let best=null,bd=1e9;for(const b of BUILDINGS){const dx=Math.max(0,Math.abs(x-b.x)-b.w/2),dz=Math.max(0,Math.abs(z-b.z)-b.d/2);const d=Math.hypot(dx,dz);if(d<r&&d<bd){bd=d;best=b}}return best}
function frontDoor(b){return b.exits[0]}
function doorOut(b){const d=frontDoor(b);return d?d.p[d.outSide]:{x:b.x,z:b.z+b.d/2+1}}
