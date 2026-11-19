
// ================= the world view: renderer, textures, buildings, terrain =================
const W3={ok:false,wrap:null,ren:null,scene:null,cam:null,rc:null,zoom:1.25,keys:{},run:false,path:null,ptarget:null,talkOnArrive:null,attackT:null,useOnArrive:null,
  bm:new Map(),cutSet:new Set(),hover:null,hoverC:null,last:0,acc:0,tk:{},camX:0,camZ:0,hurt:0,rw:1,rh:1,dirty:false,night:false,flash:0,cd:0,swing:0,ang:0,moving:false,
  followers:[],fset:new Set(),zmap:new Map(),siteKeys:{},siteObj:{},siteFlames:{},flames:[],campfire:null,trees:null,precip:null,wx:null,v3:null,promptT:null,promptKey:"",region:null,
  pileObjs:new Map(),blabels:new Map(),nearB:[],lights:0,inB:null};
let T3=null;const MAT={},TEX={};
const C3=h=>new T3.Color(h).convertSRGBToLinear();
const _cc=new Map();function CC(h){let c=_cc.get(h);if(!c){c=C3(h);_cc.set(h,c)}return c}

// ---------- textures, drawn once on canvases ----------
function cnv(w,h,fn){const c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);return c}
function mkTex(c,rep=true){const t=new T3.CanvasTexture(c);t.encoding=T3.sRGBEncoding;if(rep)t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=Math.min(8,W3.ren.capabilities.getMaxAnisotropy());return t}
function speck(g,w,h,n,a,R){for(let i=0;i<n;i++){const v=R();g.fillStyle=v<.5?`rgba(0,0,0,${(a*R()).toFixed(3)})`:`rgba(255,255,255,${(a*R()).toFixed(3)})`;const s=1+R()*2;g.fillRect(R()*w,R()*h,s,s)}}
function makeTextures(){const R=srng(9);
  TEX.plaster=mkTex(cnv(64,64,(g,w,h)=>{g.fillStyle="#ebe9e3";g.fillRect(0,0,w,h);speck(g,w,h,600,.05,R)}));
  TEX.siding=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#e6e4de";g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){const gr=g.createLinearGradient(0,y,0,y+16);gr.addColorStop(0,"rgba(0,0,0,.28)");gr.addColorStop(.12,"rgba(255,255,255,.1)");gr.addColorStop(1,"rgba(0,0,0,.05)");g.fillStyle=gr;g.fillRect(0,y,w,16)}speck(g,w,h,700,.05,R)}));
  TEX.brick=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#c8c4bc";g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){const off=(y/16)%2?16:0;for(let x=-32;x<w;x+=32){const v=150+R()*60|0;g.fillStyle=`rgb(${v},${v*.92|0},${v*.86|0})`;g.fillRect(x+off+1,y+1,30,14)}}speck(g,w,h,900,.07,R)}));
  TEX.wood=mkTex(cnv(256,256,(g,w,h)=>{for(let y=0;y<h;y+=32){let x=-R()*200;while(x<w){const L=120+R()*160;const v=170+R()*50|0;g.fillStyle=`rgb(${v},${v*.9|0},${v*.8|0})`;g.fillRect(x,y,L,32);g.fillStyle="rgba(0,0,0,.35)";g.fillRect(x,y,2,32);x+=L}
    g.fillStyle="rgba(0,0,0,.4)";g.fillRect(0,y,w,1.5)}for(let i=0;i<260;i++){g.strokeStyle=`rgba(60,40,20,${.06+R()*.08})`;g.beginPath();const y=R()*h;g.moveTo(0,y);g.bezierCurveTo(w/3,y+R()*6-3,w*2/3,y+R()*6-3,w,y);g.stroke()}}));
  TEX.tile=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#9a9890";g.fillRect(0,0,w,h);for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=215+R()*25|0;g.fillStyle=`rgb(${v},${v},${v-6})`;g.fillRect(x*32+1.5,y*32+1.5,29,29)}speck(g,w,h,400,.05,R)}));
  TEX.carpet=mkTex(cnv(64,64,(g,w,h)=>{g.fillStyle="#d8d8d8";g.fillRect(0,0,w,h);speck(g,w,h,1600,.12,R)}));
  TEX.concrete=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#cfcdc6";g.fillRect(0,0,w,h);speck(g,w,h,2400,.08,R);g.strokeStyle="rgba(0,0,0,.18)";for(let i=0;i<3;i++){g.beginPath();let x=R()*w,y=R()*h;g.moveTo(x,y);for(let j=0;j<6;j++){x+=R()*20-10;y+=R()*20-10;g.lineTo(x,y)}g.stroke()}}));
  TEX.dirt=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#b8a888";g.fillRect(0,0,w,h);speck(g,w,h,3000,.14,R);for(let i=0;i<40;i++){g.fillStyle="rgba(220,200,120,.25)";g.fillRect(R()*w,R()*h,8+R()*14,1)}}));
  TEX.roof=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#9a9a9a";g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){const off=(y/16)%2?10:0;for(let x=-20;x<w;x+=20){const v=120+R()*70|0;g.fillStyle=`rgb(${v},${v},${v})`;g.fillRect(x+off+1,y,18,15)}g.fillStyle="rgba(0,0,0,.45)";g.fillRect(0,y+14,w,2)}}));
  TEX.furn=mkTex(cnv(64,64,(g,w,h)=>{g.fillStyle="#f0f0f0";g.fillRect(0,0,w,h);speck(g,w,h,300,.06,R)}));
  TEX.water=mkTex(cnv(128,128,(g,w,h)=>{g.fillStyle="#808a90";g.fillRect(0,0,w,h);for(let i=0;i<220;i++){g.strokeStyle=`rgba(255,255,255,${.05+R()*.12})`;g.beginPath();const x=R()*w,y=R()*h;g.moveTo(x,y);g.quadraticCurveTo(x+6,y-2,x+12+R()*10,y);g.stroke()}}));}
function makeMats(){const L=o=>new T3.MeshLambertMaterial(o);
  for(const k of ["plaster","siding","brick","wood","tile","carpet","concrete","dirt","roof","furn"])MAT[k]=L({map:TEX[k],vertexColors:true});
  MAT.plain=L({vertexColors:true});MAT.glass=L({color:CC("#1d2731"),emissive:CC("#06080a")});MAT.glassLit=L({color:CC("#4a3c22"),emissive:CC("#ffb050"),emissiveIntensity:.9});
  MAT.metal=new T3.MeshPhongMaterial({vertexColors:true,shininess:60,specular:CC("#555555")});
  MAT.hl=new T3.LineBasicMaterial({color:CC("#e48a3f"),transparent:true,opacity:.95,depthTest:false});}

// ---------- geometry builder: boxes and quads merged per material ----------
class GB{constructor(){this.m={};this.t={c:1,s:0,x:0,y:0,z:0}}
  at(x,z,rot=0,y=0){this.t={c:Math.cos(rot),s:Math.sin(rot),x,y,z};return this}
  A(k){return this.m[k]||(this.m[k]={p:[],n:[],u:[],c:[],i:[],v:0})}
  tp(p){const t=this.t;return[t.x+p[0]*t.c+p[2]*t.s,t.y+p[1],t.z-p[0]*t.s+p[2]*t.c]}
  quad(k,P,N,col,UV,sh){const a=this.A(k);const W=P.map(p=>this.tp(p));const t=this.t;const n=[N[0]*t.c+N[2]*t.s,N[1],-N[0]*t.s+N[2]*t.c];
    const e1=[W[1][0]-W[0][0],W[1][1]-W[0][1],W[1][2]-W[0][2]],e2=[W[2][0]-W[0][0],W[2][1]-W[0][1],W[2][2]-W[0][2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];
    const flip=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0;
    for(let i=0;i<4;i++){a.p.push(...W[i]);a.n.push(...n);a.u.push(UV[i][0],UV[i][1]);const f=sh?sh[i]:1;a.c.push(col.r*f,col.g*f,col.b*f)}
    const v=a.v;if(flip)a.i.push(v,v+2,v+1,v,v+3,v+2);else a.i.push(v,v+1,v+2,v,v+2,v+3);a.v+=4}
  tri(k,P,N,col,UV){const a=this.A(k);const W=P.map(p=>this.tp(p));const t=this.t;const n=[N[0]*t.c+N[2]*t.s,N[1],-N[0]*t.s+N[2]*t.c];
    const e1=[W[1][0]-W[0][0],W[1][1]-W[0][1],W[1][2]-W[0][2]],e2=[W[2][0]-W[0][0],W[2][1]-W[0][1],W[2][2]-W[0][2]];const cr=[e1[1]*e2[2]-e1[2]*e2[1],e1[2]*e2[0]-e1[0]*e2[2],e1[0]*e2[1]-e1[1]*e2[0]];const flip=cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]<0;
    for(let i=0;i<3;i++){a.p.push(...W[i]);a.n.push(...n);a.u.push(UV[i][0],UV[i][1]);a.c.push(col.r,col.g,col.b)}const v=a.v;if(flip)a.i.push(v,v+2,v+1);else a.i.push(v,v+1,v+2);a.v+=3}
  // a box. o.ts texture scale, o.top top color, o.kt top material, o.ao darken low corners, o.sides {px,nx,pz,nz:[mat,col]} per-face overrides, o.no {px..} skip faces
  box(k,x0,y0,z0,x1,y1,z1,col,o={}){const s=o.ts||1;const ao=o.ao===false?null:[o.ao||.74,o.ao||.74,1,1];const no=o.no||{};const sd=o.sides||{};
    const F=(key,P,N,UV)=>{if(no[key])return;const ov=sd[key];this.quad(ov?ov[0]:k,P,N,ov?ov[1]:col,UV,ao)};
    F("px",[[x1,y0,z0],[x1,y0,z1],[x1,y1,z1],[x1,y1,z0]],[1,0,0],[[z0/s,y0/s],[z1/s,y0/s],[z1/s,y1/s],[z0/s,y1/s]]);
    F("nx",[[x0,y0,z1],[x0,y0,z0],[x0,y1,z0],[x0,y1,z1]],[-1,0,0],[[z1/s,y0/s],[z0/s,y0/s],[z0/s,y1/s],[z1/s,y1/s]]);
    F("pz",[[x1,y0,z1],[x0,y0,z1],[x0,y1,z1],[x1,y1,z1]],[0,0,1],[[x1/s,y0/s],[x0/s,y0/s],[x0/s,y1/s],[x1/s,y1/s]]);
    F("nz",[[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0]],[0,0,-1],[[x0/s,y0/s],[x1/s,y0/s],[x1/s,y1/s],[x0/s,y1/s]]);
    if(!no.py)this.quad(o.kt||k,[[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0]],[0,1,0],o.top||col,[[x0/s,z1/s],[x1/s,z1/s],[x1/s,z0/s],[x0/s,z0/s]]);
    if(o.bottom)this.quad(k,[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1]],[0,-1,0],col,[[0,0],[1,0],[1,1],[0,1]])}
  // centered box helper: center x,z, base y, size w,h,d
  cb(k,x,y,z,w,h,d,col,o){this.box(k,x-w/2,y,z-d/2,x+w/2,y+h,z+d/2,col,o)}
  meshes(mats,opt={}){const out=[];for(const [k,a] of Object.entries(this.m)){if(!a.v)continue;const g=new T3.BufferGeometry();g.setAttribute("position",new T3.Float32BufferAttribute(a.p,3));g.setAttribute("normal",new T3.Float32BufferAttribute(a.n,3));
    g.setAttribute("uv",new T3.Float32BufferAttribute(a.u,2));g.setAttribute("color",new T3.Float32BufferAttribute(a.c,3));g.setIndex(a.i);g.computeBoundingSphere();const m=new T3.Mesh(g,(mats&&mats[k])||MAT[k]||MAT.plain);
    m.castShadow=opt.cast!==false;m.receiveShadow=opt.recv!==false;m.userData.mk=k;out.push(m)}return out}}

// ---------- furniture models, built facing +z in a w x d footprint ----------
const FC={wood:["#6a4a32","#8a6a4a","#5a3e2a","#a07a52","#4a3626"],paint:["#d8d4c8","#b8c0c4","#8a9aa0","#c8b8a0","#e0dcd0"],fabric:["#7a8a9a","#8a6a5a","#5a6a5a","#9a8a6a","#6a5a7a","#a05a4a","#4a5a6a"],sheet:["#8a9ab0","#b08a8a","#9ab08a","#c8c0a8","#7a8aa0","#d8d0c0"],book:["#a83a32","#3a5a8a","#4a7a3a","#c8a03a","#6a3a6a","#2a2a2a","#d8d0b0","#3a7a7a"]};
function fbox(g,x0,y0,z0,x1,y1,z1,c,o){g.box("furn",x0,y0,z0,x1,y1,z1,typeof c==="string"?CC(c):c,o)}
const FB={
  bed(g,w,d,h,R){const fr=pick2(FC.wood,R),sh=pick2(FC.sheet,R);fbox(g,-w/2,0,-d/2,w/2,.28,d/2,fr);fbox(g,-w/2,0,-d/2,w/2,.95,-d/2+.07,fr);fbox(g,-w/2+.04,.28,-d/2+.08,w/2-.04,.48,d/2-.03,"#e8e4dc");
    fbox(g,-w/2+.02,.48,-d/2+.55,w/2-.02,.55,d/2-.01,sh,{ao:.9});const pw=w>1.2?2:1;for(let i=0;i<pw;i++){const x=pw===1?0:(i?w/4:-w/4);fbox(g,x-.26,.48,-d/2+.12,x+.26,.6,-d/2+.45,"#f2f0ea",{ao:.9})}},
  bed1(g,w,d,h,R){FB.bed(g,w,d,h,R)},
  nightstand(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);fbox(g,-w/2+.04,h*.45,d/2,w/2-.04,h*.5,d/2+.01,"#2a2018");fbox(g,-.08,h,-.08,.08,h+.04,.08,"#c8b890");fbox(g,-.02,h+.04,-.02,.02,h+.3,.02,"#888");fbox(g,-.12,h+.26,-.12,.12,h+.42,.12,"#e8dcc0")},
  dresser(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);for(let i=1;i<4;i++)fbox(g,-w/2+.04,h*i/4-.015,d/2,w/2-.04,h*i/4+.015,d/2+.01,"#2a2018")},
  closet(g,w,d,h,R){const c=pick2(R()<.5?FC.wood:FC.paint,R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);fbox(g,-.015,.05,d/2,.015,h-.05,d/2+.01,"#2a2018");fbox(g,-.09,h*.5,d/2,-.05,h*.5+.15,d/2+.03,"#c8c0a0");fbox(g,.05,h*.5,d/2,.09,h*.5+.15,d/2+.03,"#c8c0a0")},
  bookshelf(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-w/2,0,-d/2,-w/2+.04,h,d/2,c);fbox(g,w/2-.04,0,-d/2,w/2,h,d/2,c);fbox(g,-w/2,0,-d/2,w/2,h,-d/2+.03,c);fbox(g,-w/2,h-.04,-d/2,w/2,h,d/2,c);
    for(let s=0;s<4;s++){const y=.04+s*(h-.08)/4;fbox(g,-w/2,y,-d/2,w/2,y+.03,d/2,c);let x=-w/2+.06;while(x<w/2-.12){const bw=.03+R()*.05,bh=.18+R()*.14;if(R()<.85)fbox(g,x,y+.03,-d/2+.05,x+bw,y+.03+bh,d/2-.04,pick2(FC.book,R),{ao:.85});x+=bw+.005}}},
  couch(g,w,d,h,R){const c=pick2(FC.fabric,R);fbox(g,-w/2,0,-d/2,w/2,.42,d/2,c);fbox(g,-w/2,.42,-d/2,w/2,h,-d/2+.22,c);fbox(g,-w/2,.42,-d/2,-w/2+.18,.62,d/2,c);fbox(g,w/2-.18,.42,-d/2,w/2,.62,d/2,c);
    const cc=CC(c).clone().multiplyScalar(1.12);for(const s of [-1,1])fbox(g,s<0?-w/2+.2:.01,.42,-d/2+.22,s<0?-.01:w/2-.2,.5,d/2-.02,cc,{ao:.9})},
  armchair(g,w,d,h,R){const c=pick2(FC.fabric,R);fbox(g,-w/2,0,-d/2,w/2,.42,d/2,c);fbox(g,-w/2,.42,-d/2,w/2,h,-d/2+.2,c);fbox(g,-w/2,.42,-d/2,-w/2+.16,.62,d/2,c);fbox(g,w/2-.16,.42,-d/2,w/2,.62,d/2,c)},
  tv(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,.5,d/2,pick2(FC.wood,R));fbox(g,-w*.4,.5,-.06,w*.4,.5+w*.45,.0,"#111214");fbox(g,-.1,.5,-.12,.1,.53,.05,"#222")},
  ctable(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-w/2,h-.05,-d/2,w/2,h,d/2,c);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])fbox(g,a*(w/2-.06)-.025,0,b*(d/2-.06)-.025,a*(w/2-.06)+.025,h-.05,b*(d/2-.06)+.025,c);if(R()<.6)fbox(g,-.15,h,-.1,.12,h+.03,.12,pick2(FC.book,R))},
  rug(g,w,d,h,R){const c=pick2(["#8a4a3a","#4a5a7a","#7a6a4a","#5a6a4a","#7a4a5a"],R);fbox(g,-w/2,0,-d/2,w/2,.012,d/2,c,{ao:false});fbox(g,-w/2+.12,.012,-d/2+.12,w/2-.12,.016,d/2-.12,CC(c).clone().multiplyScalar(1.3),{ao:false})},
  counter(g,w,d,h,R){const c=pick2(FC.paint.concat(FC.wood),R);fbox(g,-w/2,0,-d/2,w/2,h-.04,d/2-.02,c);fbox(g,-w/2,h-.04,-d/2,w/2,h,d/2+.02,pick2(["#d8d4cc","#3a3a3a","#b8a890","#e8e8e0"],R));
    for(let x=-w/2+.05;x<w/2-.3;x+=.55)fbox(g,x,.1,d/2-.02,x+.5,h-.12,d/2,CC(c).clone().multiplyScalar(.9));fbox(g,-.25,h-.035,-.2,.25,h+.002,.18,"#8a9094");
    fbox(g,-w/2,1.45,-d/2,w/2,2.1,-d/2+.34,c)},
  fridge(g,w,d,h,R){const c=pick2(["#e8e8e4","#d0d0cc","#c8ccd0"],R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);fbox(g,-w/2+.02,h*.62,d/2,w/2-.02,h*.62+.015,d/2+.01,"#888");fbox(g,w/2-.1,h*.3,d/2,w/2-.06,h*.55,d/2+.04,"#aaa");fbox(g,w/2-.1,h*.66,d/2,w/2-.06,h*.85,d/2+.04,"#aaa")},
  stove(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#d8d8d4",{top:CC("#1a1a1a")});for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])fbox(g,a*.17-.08,h,b*.15-.08,a*.17+.08,h+.015,b*.15+.08,"#3a3a3a");fbox(g,-w/2+.06,.15,d/2,w/2-.06,h-.2,d/2+.01,"#2a2a2a");fbox(g,-w/2,h,-d/2,w/2,h+.2,-d/2+.06,"#c8c8c4")},
  ktable(g,w,d,h,R){FB.ctable(g,w,d,h,R)},ltable(g,w,d,h,R){FB.ctable(g,w,d,h,R)},
  chair(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-.21,.42,-.21,.21,.46,.21,c);fbox(g,-.21,.46,-.21,.21,.9,-.17,c);for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])fbox(g,a*.18-.02,0,b*.18-.02,a*.18+.02,.42,b*.18+.02,c)},
  stool(g,w,d,h,R){fbox(g,-.03,0,-.03,.03,h-.05,.03,"#888");fbox(g,-.17,h-.06,-.17,.17,h,.17,"#a83a32")},
  tub(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#f0f0ec",{top:CC("#c8d4d8")});fbox(g,-w/2,h,-d/2,w/2,h+.04,-d/2+.06,"#f0f0ec");fbox(g,-w/2,h,d/2-.06,w/2,h+.04,d/2,"#f0f0ec")},
  toilet(g,w,d,h,R){fbox(g,-.18,0,-.05,.18,h,d/2,"#f2f2ee");fbox(g,-w/2,0,-d/2,w/2,.8,-d/2+.2,"#f2f2ee")},
  sink(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h-.06,d/2,pick2(FC.paint,R));fbox(g,-w/2,h-.06,-d/2,w/2,h,d/2,"#f0f0ec",{top:CC("#b8c4c8")});fbox(g,-.02,h,-d/2+.02,.02,h+.2,-d/2+.08,"#aaa")},
  medicine(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#e8e8e4");fbox(g,-w/2+.04,.05,d/2,w/2-.04,h-.05,d/2+.01,"#9ab4c0")},
  desk(g,w,d,h,R){const c=pick2(FC.wood,R);fbox(g,-w/2,h-.05,-d/2,w/2,h,d/2,c);fbox(g,w/2-.42,0,-d/2+.02,w/2-.02,h-.05,d/2-.02,c);for(let i=1;i<3;i++)fbox(g,w/2-.4,h*i/3-.01,d/2-.02,w/2-.04,h*i/3+.01,d/2-.01,"#2a2018");fbox(g,-w/2+.02,0,-d/2+.02,-w/2+.07,h-.05,d/2-.02,c);if(R()<.5)fbox(g,-w/4,h,-d/2+.08,w/8,h+.3,-d/2+.12,"#1a1a1c")},
  workbench(g,w,d,h,R){fbox(g,-w/2,h-.07,-d/2,w/2,h,d/2,"#8a6a42");for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])fbox(g,a*(w/2-.06)-.04,0,b*(d/2-.06)-.04,a*(w/2-.06)+.04,h-.07,b*(d/2-.06)+.04,"#5a4430");fbox(g,-w/2,.15,-d/2+.05,w/2,.18,d/2-.05,"#6a5038");
    fbox(g,-w/2,h,-d/2,w/2,h+.9,-d/2+.03,"#a8946a");for(let i=0;i<5;i++)fbox(g,-w/2+.2+i*.3,h+.3+R()*.3,-d/2+.03,-w/2+.25+i*.3,h+.6+R()*.2,-d/2+.06,pick2(["#888","#a33","#335","#aa6"],R));fbox(g,-.2,h,0,.15,h+.1,.2,"#3a5a8a")},
  toolshelf(g,w,d,h,R){for(const a of [-1,1])fbox(g,a*w/2-.02,0,-d/2,a*w/2+.02,h,d/2,"#5a5e62");for(let s=0;s<4;s++){const y=.1+s*(h-.1)/4;fbox(g,-w/2,y,-d/2,w/2,y+.03,d/2,"#6a6e72");let x=-w/2+.05;while(x<w/2-.2){const bw=.15+R()*.2;if(R()<.7)fbox(g,x,y+.03,-d/2+.04,x+bw,y+.03+.12+R()*.15,d/2-.04,pick2(["#8a6a42","#3a5a8a","#a83a32","#c8a03a","#4a4a4a"],R));x+=bw+.03}}},
  washer(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#e8e8e4");fbox(g,-.18,.2,d/2,.18,.56,d/2+.01,"#3a4048")},
  cabinshelf(g,w,d,h,R){const c="#6a4a32";for(const a of [-1,1])fbox(g,a*w/2-.03,0,-d/2,a*w/2+.03,h,d/2,c);for(let s=0;s<4;s++){const y=.05+s*(h-.05)/4;fbox(g,-w/2,y,-d/2,w/2,y+.04,d/2,c);for(let i=0;i<4;i++)if(R()<.6)fbox(g,-w/2+.1+i*.27,y+.04,-.08,-w/2+.2+i*.27,y+.2,.08,pick2(["#c8a050","#8a9a6a","#6a4a2a","#a83a32"],R))}},
  crate(g,w,d,h,R){const c=pick2(["#8a6a42","#9a7a4a","#7a5a3a"],R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);const dk=CC(c).clone().multiplyScalar(.7);for(const y of [h*.33,h*.66])fbox(g,-w/2-.005,y,-d/2-.005,w/2+.005,y+.04,d/2+.005,dk,{ao:false})},
  hay(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#c8a850");fbox(g,-w/2-.005,0,-.05,w/2+.005,h+.005,.05,"#8a6a3a",{ao:false})},
  woodstove(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h*.8,d/2,"#2a2a2a");fbox(g,-.08,h*.8,-.15,.08,2.3,.0,"#333");fbox(g,-w/2+.1,.15,d/2,w/2-.1,h*.6,d/2+.01,"#4a2a1a")},
  gondola(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,.12,d/2,"#d8d8d4");fbox(g,-w/2,0,-.03,w/2,h,.03,"#e0e0dc");for(let s=0;s<4;s++){const y=.12+s*.34;for(const side of [-1,1]){fbox(g,-w/2,y,side<0?-d/2:.03,w/2,y+.025,side<0?-.03:d/2,"#d0d0cc");let x=-w/2+.03;while(x<w/2-.1){const bw=.08+R()*.14,bh=.12+R()*.16;if(R()<.82)fbox(g,x,y+.025,side<0?-d/2+.04:.06,x+bw,y+.025+bh,side<0?-.06:d/2-.04,pick2(["#c83a32","#e8c84a","#3a7a3a","#3a5aa8","#e8e0d0","#8a4a2a","#e88a3a","#6a3a8a"],R),{ao:.9});x+=bw+.01}}}},
  wallshelf(g,w,d,h,R){for(const a of [-1,1])fbox(g,a*w/2-.025,0,-d/2,a*w/2+.025,h,d/2,"#6a6e72");for(let s=0;s<4;s++){const y=.08+s*(h-.1)/4;fbox(g,-w/2,y,-d/2,w/2,y+.03,d/2,"#7a7e82");let x=-w/2+.05;while(x<w/2-.15){const bw=.2+R()*.3,bh=.15+R()*.2;if(R()<.75)fbox(g,x,y+.03,-d/2+.04,x+bw,y+.03+bh,d/2-.04,pick2(["#a8865a","#8a6a42","#c8b090","#5a6a7a","#d8d0c0"],R));x+=bw+.04}}},
  cooler(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#d8d8d8");fbox(g,-w/2+.05,.2,d/2,w/2-.05,h-.15,d/2+.01,"#a8c4d0");for(let s=0;s<4;s++)for(let i=0;i<6;i++)if(R()<.7)fbox(g,-w/2+.1+i*.24,.25+s*.42,d/2-.25,-w/2+.2+i*.24,.48+s*.42,d/2-.05,pick2(["#c83a32","#3a5aa8","#e8e0d0","#3a7a3a"],R))},
  regcounter(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#7a6a5a",{top:CC("#d8d4cc")});fbox(g,-.2,h,-.15,.2,h+.18,.15,"#2a2a2e");fbox(g,-.15,h+.18,-.05,.15,h+.32,.0,"#3a3a3e")},
  rxcab(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#e8e8e4");for(let i=0;i<3;i++)fbox(g,-w/2+.05,.2+i*.55,d/2,w/2-.05,.65+i*.55,d/2+.01,"#c8d4dc");fbox(g,w/2-.15,h*.5,d/2,w/2-.08,h*.5+.06,d/2+.03,"#c8a03a")},
  medcab(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#f0f0ec");fbox(g,-w/2+.05,h*.45,d/2,w/2-.05,h-.06,d/2+.01,"#b8ccd4");fbox(g,-.02,.1,d/2,.02,h*.4,d/2+.01,"#999")},
  dcounter(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h-.05,d/2,"#a83a32");fbox(g,-w/2,h-.05,-d/2,w/2,h,d/2+.06,"#c8c8c4");fbox(g,-w/2,.05,d/2,w/2,.12,d/2+.01,"#c8c8c4")},
  dkshelf(g,w,d,h,R){FB.wallshelf(g,w,d,h,R)},pantry(g,w,d,h,R){FB.wallshelf(g,w,d,h,R)},
  barc(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h-.05,d/2,"#3a2a1e");fbox(g,-w/2,h-.05,-d/2,w/2,h,d/2+.05,"#5a3a26");for(let i=0;i<9;i++)if(R()<.7)fbox(g,-w/2+.2+i*.38,h,-d/2+.1,-w/2+.27+i*.38,h+.28,-d/2+.17,pick2(["#3a5a2a","#6a3a1a","#c8c0a0","#2a3a5a"],R))},
  booth(g,w,d,h,R){const c="#a83a32";fbox(g,-w/2,0,-d/2,w/2,.45,-d/2+.42,c);fbox(g,-w/2,.45,-d/2,w/2,h+.2,-d/2+.12,c);fbox(g,-w/2,0,d/2-.42,w/2,.45,d/2,c);fbox(g,-w/2+.1,.72,-.22,w/2-.1,.76,.22,"#d8d4cc");fbox(g,-.04,0,-.04,.04,.72,.04,"#888")},
  copdesk(g,w,d,h,R){FB.desk(g,w,d,h,R);fbox(g,-.3,h,-d/2+.06,.2,h+.36,-d/2+.1,"#1a1a1c")},
  filing(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#8a9094");for(let i=1;i<4;i++)fbox(g,-w/2+.03,h*i/4-.01,d/2,w/2-.03,h*i/4+.01,d/2+.01,"#5a6064")},
  locker(g,w,d,h,R){const c=pick2(["#5a6a7a","#6a7a6a","#7a6a5a"],R);fbox(g,-w/2,0,-d/2,w/2,h,d/2,c);fbox(g,-.01,.05,d/2,.01,h-.05,d/2+.01,"#2a2a2a");for(let i=0;i<4;i++)fbox(g,-w/2+.05,h-.3+i*.05,d/2,-.06,h-.28+i*.05,d/2+.01,"#2a2a2a")},
  slocker(g,w,d,h,R){const c=pick2(["#3a5a8a","#8a3a32","#4a6a4a"],R);for(let i=0;i<3;i++){const x=-w/2+i*w/3;fbox(g,x+.01,0,-d/2,x+w/3-.01,h,d/2,c);fbox(g,x+.05,h-.3,d/2,x+w/3-.05,h-.15,d/2+.01,"#2a2a2a")}},
  armory(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#2a2e32");fbox(g,-.01,.05,d/2,.01,h-.05,d/2+.01,"#111");fbox(g,.05,h*.5,d/2,.12,h*.5+.1,d/2+.03,"#c8a03a")},
  bars(g,w,d,h,R){for(let x=-w/2;x<=w/2;x+=.14)fbox(g,x-.015,0,-.02,x+.015,h,.02,"#4a4e52",{ao:false});fbox(g,-w/2,h-.06,-.03,w/2,h,.03,"#4a4e52")},
  sdesk(g,w,d,h,R){fbox(g,-w/2,h-.04,-d/2,w/2,h,d/2,"#c8b48a");fbox(g,-w/2+.04,0,-.03,-w/2+.08,h-.04,.03,"#666");fbox(g,w/2-.08,0,-.03,w/2-.04,h-.04,.03,"#666");fbox(g,-.18,.42,d/2+.1,.18,.46,d/2+.42,"#3a5a8a");fbox(g,-.18,.46,d/2+.38,.18,.8,d/2+.42,"#3a5a8a")},
  gymbin(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#3a3a3e",{top:CC("#222")});for(let i=0;i<5;i++)fbox(g,-w/2+.12+R()*(w-.4),h-.1,-d/2+.12+R()*(d-.4),-w/2+.34+R()*(w-.4),h+.12,-d/2+.34+R()*(d-.4),pick2(["#e87a2a","#e8e0d0","#a83a32"],R))},
  bench(g,w,d,h,R){fbox(g,-w/2,h-.06,-d/2,w/2,h,d/2,"#8a6a42");for(const a of [-1,1])fbox(g,a*(w/2-.15)-.04,0,-d/2+.05,a*(w/2-.15)+.04,h-.06,d/2-.05,"#5a4430")},
  pew(g,w,d,h,R){const c="#6a4a2a";fbox(g,-w/2,.4,-d/2,w/2,.46,d/2,c);fbox(g,-w/2,.46,-d/2,w/2,h,-d/2+.08,c);for(const a of [-1,1])fbox(g,a*w/2-.04,0,-d/2,a*w/2+.04,.75,d/2,c)},
  altar(g,w,d,h,R){fbox(g,-w/2,0,-d/2,w/2,h,d/2,"#8a7a62");fbox(g,-w/2-.05,h-.1,-d/2-.05,w/2+.05,h+.01,d/2+.05,"#f0ece0");for(const a of [-1,1])fbox(g,a*.5-.03,h,-.03,a*.5+.03,h+.3,.03,"#f0e8d0");fbox(g,-.03,h,-.03,.03,h+.5,.03,"#c8a03a");fbox(g,-.18,h+.38,-.03,.18,h+.43,.03,"#c8a03a")},
  vestry(g,w,d,h,R){FB.closet(g,w,d,h,R)},libshelf(g,w,d,h,R){FB.bookshelf(g,w,d,h,R)},
  lamp(g,w,d,h,R){fbox(g,-.12,0,-.12,.12,.04,.12,"#3a3a3a");fbox(g,-.02,.04,-.02,.02,h-.25,.02,"#3a3a3a");fbox(g,-.18,h-.3,-.18,.18,h,.18,"#e8dcc0")},
};

// ---------- buildings ----------
const BPAL={house:["#c9c2b0","#9fb0b8","#c8b48a","#a88e7a","#d8d0c0","#8fa08a","#b89a82","#9a98a8","#e0dcd0","#b4a4a0"],roof:["#4a3a32","#3a3f45","#5a3a2a","#2f3a33","#55493e","#6a4a3a","#3a3a3a"],
  clinic:"#d8d4c8",pharmacy:"#b8ccc8",hardware:"#a0785a",grocery:"#c8bca8",diner:"#c8c0b0",sheriff:"#a8b0b8",bar:"#7a5a46",gas:"#d8d0b0",library:"#b09a82",school:"#b07a5a",
  farmhouse:"#e8e4d8",barn:"#9a3a2a",church:"#a8a49c",hall:"#b8a88a",qoffice:"#9a9084",qsheds:"#7a8084",mill:"#6a5642",trailer:"#d0ccb8",cabin:"#7a5a3a"};
const BRICK=new Set(["pharmacy","hardware","grocery","library","school","sheriff","bar","church","clinic"]);
const ROOMWALL={living:["#d8cfc0","#c8d0c8","#e0d8c0","#d0c8d8"],kitchen:["#e8e2c8","#dce8e0","#f0e8d8"],bed:["#c8d0d8","#d8c8c8","#c8d8c8","#d8d0b8"],kid:["#d8e0b8","#e0c8d8","#b8d0e0"],bath:["#d0e0e0","#e8e8e0","#d8e8d8"],
  office:["#d0c8b8","#c8c8c0"],util:["#c8c8c0"],hallway:["#d8d4c0"],class:["#e0d8b8","#d8e0d8"],gym:["#d8d0c0"],nave:["#e8e0d0"],barn:["#8a6a4a"],shed:["#9a9a96"],ruin:["#6a5a48"],cabin:["#9a7a52"]};
const FLOORCOL={wood:["#a87850","#8a6040","#b88a5a","#7a5638"],tile:["#e0ddd4","#d0d8d8","#e8e0d0"],carpet:["#7a6a8a","#6a7a6a","#8a6a5a","#6a7a8a","#9a8a6a"],concrete:["#9a9890"],dirt:["#8a7a5a"]};
function signText(b){return{clinic:"LIMON CLINIC",pharmacy:"Rx PHARMACY",hardware:"ELLIS HARDWARE",grocery:"FOOD MART",library:"LIMON LIBRARY",diner:"ROSA'S DINER",sheriff:"SHERIFF",bar:"THE LOW WATER",gas:"KWIK GAS",school:"LIMON HIGH SCHOOL",church:"ST. BRIGID'S"}[b.type]}
function signMesh(text,w,col){const c=cnv(512,96,(g,W,H)=>{g.fillStyle=col;g.fillRect(0,0,W,H);g.strokeStyle="rgba(255,255,255,.6)";g.lineWidth=4;g.strokeRect(6,6,W-12,H-12);g.fillStyle="#f4efe2";g.font="bold 52px Saira Stencil One, Impact, sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(text,W/2,H/2+3,W-30)});
  const m=new T3.Mesh(new T3.PlaneGeometry(w,w*96/512),new T3.MeshLambertMaterial({map:mkTex(c,false)}));return m}
function buildBuilding(b,R){const H=b.H;const {W,D}=b.fr;const ty=b.type;const home=["house","farmhouse","trailer","cabin"].includes(ty);
  const extCol=CC(ty==="house"?pick2(BPAL.house,R):BPAL[ty]||"#999");const extK=BRICK.has(ty)?"brick":"siding";
  const roomCol=b.rooms.map(r=>CC(pick2(ROOMWALL[r.t]||["#e0ddd4","#d8d8d0"],R)));
  const gF=new GB(),gW=new GB(),gWin=new GB(),gR=new GB(),gFu=new GB();
  // floors and a foundation lip
  gF.box("concrete",-W/2-.15,0,-D/2-.15,W/2+.15,.06,D/2+.15,CC("#8a8884"),{ts:2});
  b.rooms.forEach((r,i)=>{const fc=CC(pick2(FLOORCOL[r.fl]||FLOORCOL.wood,R));gF.box(r.fl,r.u0,.06,r.v0,r.u1,.08,r.v1,fc,{ts:r.fl==="wood"?2:r.fl==="tile"?1.2:2,ao:false})});
  // walls: outside faces get siding or brick, inside faces get the room's paint
  const sideCol=(w,sign)=>{const off=.3*sign;let u,v;if(w.o==="v"){u=(w.a0+w.a1)/2;v=w.c+off}else{u=w.c+off;v=(w.a0+w.a1)/2}const ri=roomIdxAtLocal(b,u,v);return ri<0?null:roomCol[ri]};
  for(const w of b.walls){const r=wallBox(b,w);const lo=sideCol(w,-1),hi=sideCol(w,1);const ext=[extK,extCol],inLo=["plaster",lo||roomCol[0]],inHi=["plaster",hi||roomCol[0]];
    const S_=w.o==="v"?{nz:lo?inLo:ext,pz:hi?inHi:ext,px:["plaster",CC("#d8d4cc")],nx:["plaster",CC("#d8d4cc")]}:{nx:lo?inLo:ext,px:hi?inHi:ext,pz:["plaster",CC("#d8d4cc")],nz:["plaster",CC("#d8d4cc")]};
    gW.box("plaster",r.u0,.06,r.v0,r.u1,H,r.v1,CC("#d8d4cc"),{sides:S_,ts:1.6,top:CC("#3a3634"),ao:.8});
    // windows along outside walls
    if(w.ext&&ty!=="mill"&&ty!=="barn"){const len=w.a1-w.a0;const shopFront=!home&&w.o==="v"&&w.out>0&&!["school","church","sheriff","qsheds","hall"].includes(ty);const ww=shopFront?1.6:.9,y0=shopFront?.35:1,y1=shopFront?2.3:Math.min(2.05,H-.45);const gap=shopFront?2.1:2.6;
      const n=Math.floor((len-.8)/gap);for(let i=0;i<n;i++){const a=w.a0+(len-(n-1)*gap)/2+i*gap;if(a-ww/2<w.a0+.3||a+ww/2>w.a1-.3)continue;const o=w.out;
        for(const side of [1,-1]){const off=side>0?.012:-(.2+.012);const sgn=o*side;const fc=CC(side>0?"#e8e4dc":"#d8d4cc");
          if(w.o==="v"){const v=w.c+(side>0?o*.012:-o*.212);const N=[0,0,sgn];gWin.quad("frame",[[a-ww/2-.06,y0-.06,v],[a+ww/2+.06,y0-.06,v],[a+ww/2+.06,y1+.06,v],[a-ww/2-.06,y1+.06,v]],N,fc,[[0,0],[1,0],[1,1],[0,1]]);
            const v2=v+sgn*.004;gWin.quad("glass",[[a-ww/2,y0,v2],[a+ww/2,y0,v2],[a+ww/2,y1,v2],[a-ww/2,y1,v2]],N,CC("#ffffff"),[[0,0],[1,0],[1,1],[0,1]]);gWin.quad("frame",[[a-.02,y0,v2+sgn*.002],[a+.02,y0,v2+sgn*.002],[a+.02,y1,v2+sgn*.002],[a-.02,y1,v2+sgn*.002]],N,fc,[[0,0],[1,0],[1,1],[0,1]])}
          else{const u=w.c+(side>0?o*.012:-o*.212);const N=[sgn,0,0];gWin.quad("frame",[[u,y0-.06,a-ww/2-.06],[u,y0-.06,a+ww/2+.06],[u,y1+.06,a+ww/2+.06],[u,y1+.06,a-ww/2-.06]],N,fc,[[0,0],[1,0],[1,1],[0,1]]);
            const u2=u+sgn*.004;gWin.quad("glass",[[u2,y0,a-ww/2],[u2,y0,a+ww/2],[u2,y1,a+ww/2],[u2,y1,a-ww/2]],N,CC("#ffffff"),[[0,0],[1,0],[1,1],[0,1]]);gWin.quad("frame",[[u2+sgn*.002,y0,a-.02],[u2+sgn*.002,y0,a+.02],[u2+sgn*.002,y1,a+.02],[u2+sgn*.002,y1,a-.02]],N,fc,[[0,0],[1,0],[1,1],[0,1]])}}}}}
  // roof
  const rc=CC(ty==="barn"?"#5a2a20":ty==="church"?"#4a4d52":home?pick2(BPAL.roof,R):"#4a4a48");const oh=.35;
  if(ty==="mill"){}
  else if(home||["barn","church","hall","qoffice"].includes(ty)){const alongU=W>=D;const L=alongU?W:D,S2=alongU?D:W;const rh=Math.max(1.1,S2*(ty==="church"?.45:ty==="barn"?.38:.3));
    const P=(l,s,y)=>alongU?[l,y,s]:[s,y,l];const hl=L/2+oh,hs=S2/2+oh;
    for(const sg of [-1,1]){const N=alongU?[0,hs,sg*rh]:[sg*rh,hs,0];const nl=Math.hypot(...N);const nn=N.map(x=>x/nl);
      gR.quad("roof",[P(-hl,sg*hs,H),P(hl,sg*hs,H),P(hl,0,H+rh*(hs/(S2/2))),P(-hl,0,H+rh*(hs/(S2/2)))],nn,rc,[[-hl/1.5,0],[hl/1.5,0],[hl/1.5,hs/1.5],[-hl/1.5,hs/1.5]]);
      gR.quad("roof",[P(-hl,sg*hs,H-.08),P(hl,sg*hs,H-.08),P(hl,0,H+rh*(hs/(S2/2))-.08),P(-hl,0,H+rh*(hs/(S2/2))-.08)],nn.map(x=>-x),CC("#5a5048"),[[0,0],[1,0],[1,1],[0,1]]);
      gR.tri(extK,[P(sg*L/2,-S2/2,H),P(sg*L/2,S2/2,H),P(sg*L/2,0,H+rh)],alongU?[sg,0,0]:[0,0,sg],extCol,[[0,0],[S2/1.6,0],[S2/3.2,rh/1.6]])}
    if(ty==="church"){gR.box(extK,-1.1,0,-D/2+.2,1.1,H+5.2,-D/2+2.4,extCol,{ts:1.6});const sp=H+5.2;gR.tri("roof",[[-1.2,sp,-D/2+.1],[1.2,sp,-D/2+.1],[0,sp+3,-D/2+1.3]],[0,.4,-1],rc,[[0,0],[1,0],[.5,1]]);gR.tri("roof",[[1.2,sp,-D/2+2.5],[-1.2,sp,-D/2+2.5],[0,sp+3,-D/2+1.3]],[0,.4,1],rc,[[0,0],[1,0],[.5,1]]);
      gR.tri("roof",[[-1.2,sp,-D/2+2.5],[-1.2,sp,-D/2+.1],[0,sp+3,-D/2+1.3]],[-1,.4,0],rc,[[0,0],[1,0],[.5,1]]);gR.tri("roof",[[1.2,sp,-D/2+.1],[1.2,sp,-D/2+2.5],[0,sp+3,-D/2+1.3]],[1,.4,0],rc,[[0,0],[1,0],[.5,1]]);gR.cb("furn",0,sp+3,-D/2+1.3,.08,1.2,.08,CC("#d8d4c8"));gR.cb("furn",0,sp+3.7,-D/2+1.3,.6,.08,.08,CC("#d8d4c8"))}}
  else{gR.box("concrete",-W/2-.1,H,-D/2-.1,W/2+.1,H+.18,D/2+.1,CC("#6a6864"),{ts:2});for(const [a,c,e,f] of [[-W/2-.1,-D/2-.1,W/2+.1,-D/2+.1],[-W/2-.1,D/2-.1,W/2+.1,D/2+.1],[-W/2-.1,-D/2-.1,-W/2+.1,D/2+.1],[W/2-.1,-D/2-.1,W/2+.1,D/2+.1]])gR.box(extK,a,H,c,e,H+.55,f,extCol,{ts:1.6});
    if(ty==="gas"){}}
  // furniture
  for(const r of b.rooms)for(const f of r.f){const F=FURN[f.k];const fn=FB[f.k];if(!fn)continue;const cu=(f.u0+f.u1)/2,cv=(f.v0+f.v1)/2;const q=Math.abs(Math.sin(f.rot))>.5;const w=q?f.v1-f.v0:f.u1-f.u0,d=q?f.u1-f.u0:f.v1-f.v0;
    gFu.at(cu,cv,f.rot,.08+(f.y||0));fn(gFu,f.k==="chair"||f.k==="stool"?F.w:w,f.k==="chair"||f.k==="stool"?F.d:d,F.h,R)}
  // porch steps and awnings
  for(const d of b.exits){if(!d.door&&ty!=="mill")continue;if(d.o==="v"){const s=Math.sign(d.c);gF.box("concrete",d.a-d.w/2-.3,0,s>0?d.c:d.c-1,d.a+d.w/2+.3,.1,s>0?d.c+1:d.c,CC("#9a9890"),{ts:2})}else{const s=Math.sign(d.c);gF.box("concrete",s>0?d.c:d.c-1,0,d.a-d.w/2-.3,s>0?d.c+1:d.c,.1,d.a+d.w/2+.3,CC("#9a9890"),{ts:2})}}
  if(!home&&!["barn","mill","qsheds","qoffice","church","hall"].includes(ty)){const fd=b.exits[0];if(fd&&fd.o==="v")gW.box("furn",-W/2,H*.78,D/2,W/2,H*.78+.12,D/2+1.1,CC(ty==="clinic"?"#c4483c":ty==="sheriff"?"#3a4a6a":ty==="diner"?"#c4483c":ty==="gas"?"#c8a83a":"#3a5a4a"),{ao:false})}
  if(ty==="gas"){gF.box("furn",-W/2-.5,3.3,D/2+1.2,W/2+.5,3.6,D/2+6,CC("#e8e4dc"),{ao:false});for(const x of [-2.4,2.4]){gF.box("furn",x-.15,0,D/2+3.4,x+.15,3.3,D/2+3.7,CC("#888"));gF.box("furn",x-.35,0,D/2+3.2,x+.35,1.3,D/2+3.9,CC("#c4483c"))}}
  if(ty==="school"){gF.box("furn",W/2+1.8,0,D/2+1.8,W/2+1.9,7,D/2+1.9,CC("#999"));gF.box("furn",W/2+1.9,5.6,D/2+1.85,W/2+3,6.3,D/2+1.88,CC("#3a5a8a"))}
  if(ty==="barn")gW.box("furn",-1.4,.06,D/2+.01,1.4,3.2,D/2+.05,CC("#e8e2d0"),{no:{py:1}});
  // assemble
  const g=new T3.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.fr.r;
  const walls=new T3.Group();for(const m of gW.meshes())walls.add(m);
  const wm={glass:MAT.glass,frame:MAT.plain};const win=new T3.Group();for(const m of gWin.meshes(wm,{cast:false}))win.add(m);walls.add(win);
  const roofMat=MAT.roof.clone();const roofMs=gR.meshes({roof:roofMat});const roof=new T3.Group();for(const m of roofMs)roof.add(m);const extMats=[];for(const m of roofMs)if(m.userData.mk!=="roof"){m.material=m.material.clone();extMats.push(m.material)}
  for(const m of gF.meshes(null,{cast:false}))g.add(m);const furn=new T3.Group();for(const m of gFu.meshes())furn.add(m);g.add(furn);g.add(walls);g.add(roof);
  // doors
  const doors=[];for(const d of b.dws){if(!d.door)continue;const D_=d.door;const piv=new T3.Group();const hw=d.w;const leaf=new T3.Mesh(new T3.BoxGeometry(hw-.04,Math.min(2.1,H-.1),.06),new T3.MeshLambertMaterial({color:CC(d.ext?pick2(["#5a3a26","#6a2a22","#2a3a4a","#e8e4d8","#3a4a3a"],R):"#8a7a62")}));
    leaf.castShadow=true;leaf.position.set((hw-.04)/2,Math.min(2.1,H-.1)/2+.06,0);piv.add(leaf);
    if(d.o==="v")piv.position.set(d.a-d.w/2+.02,0,d.c-Math.sign(d.c||1)*.1*(d.ext?1:0));else{piv.position.set(d.c-Math.sign(d.c||1)*.1*(d.ext?1:0),0,d.a+d.w/2-.02);piv.rotation.y=Math.PI/2}
    piv.userData.base=piv.rotation.y;piv.userData.sign=d.ext?(d.o==="v"?-Math.sign(d.c):Math.sign(d.c)):1;walls.add(piv);doors.push({D:D_,piv,a:D_.open?1:0});leaf.userData.door=D_}
  let sign=null;const st=signText(b);if(st&&b.exits[0]){const d=b.exits[0];sign=signMesh(st,Math.min(W*.7,ty==="school"?9:5),ty==="clinic"?"#a8322a":ty==="sheriff"?"#2a3a5a":ty==="church"?"#4a4a48":"#2a3a32");
    if(d.o==="v"){sign.position.set(ty==="school"?0:d.a,H-.42,d.c+Math.sign(d.c)*.04);if(d.c<0)sign.rotation.y=Math.PI}walls.add(sign)}
  return{b,g,walls,win,roof,roofMat,extMats,furn,doors,cut:0,lit:false}}

// ---------- the ground ----------
const GCOL={wilds:"#3f4a2c",fields:"#5c5a30",woods:"#26341f",hills:"#575447",river:"#2a4656",town:"#465538",road:"#38393b",farm:"#59613a",church:"#41553a",quarry:"#7c4c36",school:"#4a6036",lodge:"#33452a",mill:"#4f4a38"};
const ROADS=[[23,-100,33,100,"hwy"],[8,-7.5,92,-1.5,"st"],[33,-32.5,92,-28.5,"st"],[33,19.5,62,23.5,"st"],[8.5,-46,11.5,38,"st"],[-55,-6,8.5,-3,"dirt"],[33,-76.5,71,-73.5,"dirt"],[-20,55.5,23,58.5,"dirt"],[-27.5,-3,-24.5,25,"dirt"]];
const TRAILS=[[[-85,-6],[-97,-30],[-108,-43]],[[-60,8],[-57,42]],[[-57,52],[-56,76]],[[33,-60],[58,-74]]];
function siteRect(k){const s=PLACES[k].site;const hw=s.gw*1.5,hd=s.gh*1.5;return[s.c[0]-hw,s.c[1]-hd,s.c[0]+hw,s.c[1]+hd]}
function tileXZ(k,i){const s=PLACES[k].site;const x=i%s.gw,y=Math.floor(i/s.gw);return{x:s.c[0]+(x-(s.gw-1)/2)*3,z:s.c[1]+(y-(s.gh-1)/2)*3}}
function mapCanvas(M=6){const key="mapC"+M;if(W3[key])return W3[key];const W=(WB.x1-WB.x0)*M,H=(WB.z1-WB.z0)*M;const c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d");
  const X=x=>(x-WB.x0)*M,Z=z=>(z-WB.z0)*M;const rect=(r,col)=>{g.fillStyle=col;g.fillRect(X(r[0]),Z(r[1]),(r[2]-r[0])*M,(r[3]-r[1])*M)};
  g.fillStyle=GCOL.wilds;g.fillRect(0,0,W,H);for(const k of [...PLACE_ORDER].reverse())for(const r of PLACES[k].r)rect(r,GCOL[k]);
  const R=srng(11);
  // grass and soil variation
  for(let i=0;i<(M>3?60000:20000);i++){const x=R()*W,y=R()*H,v=R();g.fillStyle=v<.45?"rgba(0,0,0,.10)":v<.8?"rgba(120,150,60,.07)":"rgba(240,230,180,.06)";const s=1+R()*2.5;g.fillRect(x,y,s,s)}
  for(let i=0;i<500;i++){const x=R()*W,y=R()*H;const gr=g.createRadialGradient(x,y,0,x,y,10+R()*40);gr.addColorStop(0,R()<.5?"rgba(0,0,0,.10)":"rgba(160,170,90,.08)");gr.addColorStop(1,"rgba(0,0,0,0)");g.fillStyle=gr;g.fillRect(x-60,y-60,120,120)}
  g.strokeStyle="rgba(0,0,0,.18)";g.lineWidth=Math.max(1,M*.35);for(const r of PLACES.fields.r)for(let z=r[1]+1;z<r[3];z+=1.6){g.beginPath();g.moveTo(X(r[0]),Z(z));g.lineTo(X(r[2]),Z(z));g.stroke()}
  rect([WB.x0,41.2,WB.x1,42.4],"#4a4430");rect([WB.x0,51.6,WB.x1,52.8],"#4a4430");rect([-62,42,-52,52],"#4f6a72");
  for(const k of Object.keys(PLACES))if(PLACES[k].site){const r=siteRect(k);rect([r[0]-1,r[1]-1,r[2]+1,r[3]+1],"#4e4632");for(let i=0;i<300;i++){g.fillStyle="rgba(0,0,0,.08)";g.fillRect(X(r[0]+R()*(r[2]-r[0])),Z(r[1]+R()*(r[3]-r[1])),2,2)}}
  // lots, driveways and lawns
  for(const b of BUILDINGS){const pad=b.type==="house"?0:1.6;if(isShop(b)&&!["barn","mill","qsheds","qoffice"].includes(b.type))rect([b.x-b.w/2-pad,b.z-b.d/2-pad,b.x+b.w/2+pad,b.z+b.d/2+pad],"#45464a");
    if(b.type==="house"){const o=doorOut(b);const f=b.face;const L=6;const r=f==="+z"?[o.x-1.1,o.z-.6,o.x+1.1,o.z+L]:f==="-z"?[o.x-1.1,o.z-L,o.x+1.1,o.z+.6]:f==="+x"?[o.x-.6,o.z-1.1,o.x+L,o.z+1.1]:[o.x-L,o.z-1.1,o.x+.6,o.z+1.1];rect(r,"#8a8880")}}
  for(const r of ROADS){const col=r[4]==="dirt"?"#5e503c":r[4]==="hwy"?"#2f3032":"#3a3b3e";if(r[4]==="st"){const hz=(r[2]-r[0])>(r[3]-r[1]);rect(hz?[r[0],r[1]-1.4,r[2],r[3]+1.4]:[r[0]-1.4,r[1],r[2]+1.4,r[3]],"#8c8a84");rect(hz?[r[0],r[1]-.15,r[2],r[3]+.15]:[r[0]-.15,r[1],r[2]+.15,r[3]],"#6a6a66")}rect(r,col)}
  for(let i=0;i<9000;i++){const r=ROADS[i%ROADS.length];g.fillStyle=R()<.5?"rgba(0,0,0,.14)":"rgba(255,255,255,.05)";g.fillRect(X(r[0]+R()*(r[2]-r[0])),Z(r[1]+R()*(r[3]-r[1])),1.5,1.5)}
  g.strokeStyle="#5e503c";g.lineWidth=2.6*M;g.lineCap="round";g.lineJoin="round";for(const t of TRAILS){g.beginPath();t.forEach((p,i)=>i?g.lineTo(X(p[0]),Z(p[1])):g.moveTo(X(p[0]),Z(p[1])));g.stroke()}
  g.fillStyle="#c8a83a";for(let z=WB.z0;z<WB.z1;z+=6)if(!(z>39&&z<54))g.fillRect(X(27.88),Z(z),.24*M,3*M);g.fillStyle="rgba(230,230,220,.7)";for(const x of [23.4,32.4])g.fillRect(X(x),0,.15*M,H);
  g.fillStyle="rgba(230,230,220,.55)";for(let x=10;x<92;x+=4)g.fillRect(X(x),Z(-4.55),2*M,.12*M);
  rect([22.5,41,33.5,53],"#55544f");
  W3[key]=c;return c}
function buildGround(sc){const tex=mkTex(mapCanvas(6),false);tex.minFilter=T3.LinearMipmapLinearFilter;tex.generateMipmaps=true;
  const gr=new T3.Mesh(new T3.PlaneGeometry(WB.x1-WB.x0,WB.z1-WB.z0),new T3.MeshLambertMaterial({map:tex}));gr.rotation.x=-Math.PI/2;gr.position.set((WB.x0+WB.x1)/2,0,(WB.z0+WB.z1)/2);gr.receiveShadow=true;sc.add(gr);
  const far=new T3.Mesh(new T3.PlaneGeometry(900,900),new T3.MeshLambertMaterial({color:CC("#2a3320")}));far.rotation.x=-Math.PI/2;far.position.y=-.05;sc.add(far);
  const wt=TEX.water;wt.repeat.set(26,1);const water=new T3.Mesh(new T3.PlaneGeometry(WB.x1-WB.x0+40,10),new T3.MeshPhongMaterial({color:CC("#3a5866"),map:wt,shininess:90,specular:CC("#8899aa"),transparent:true,opacity:.92}));
  water.rotation.x=-Math.PI/2;water.position.set(0,.03,47);water.receiveShadow=true;sc.add(water);W3.water=water}
// grass tufts and bushes for some depth
function buildGrass(sc){const R=srng(31);const pts=[];const ok={wilds:.6,fields:.5,hills:.35,farm:.35,town:.12,church:.3,school:.2,lodge:.4,mill:.3,woods:.25};
  for(let i=0;i<26000&&pts.length<7000;i++){const x=WB.x0+R()*(WB.x1-WB.x0),z=WB.z0+R()*(WB.z1-WB.z0);const k=regionAt(x,z);if(R()>(ok[k]||0))continue;if(inRiver(x,z)||solidAt(x,z,1))continue;
    if(ROADS.some(r=>x>r[0]-1.6&&x<r[2]+1.6&&z>r[1]-1.6&&z<r[3]+1.6))continue;let bad=false;for(const s of Object.keys(PLACES))if(PLACES[s].site){const r=siteRect(s);if(x>r[0]-1&&x<r[2]+1&&z>r[1]-1&&z<r[3]+1){bad=true;break}}if(bad)continue;pts.push([x,z,.25+R()*.45,R()])}
  const geo=new T3.ConeGeometry(.35,1,5);geo.translate(0,.5,0);const im=new T3.InstancedMesh(geo,new T3.MeshLambertMaterial({color:0xffffff}),pts.length);const m4=new T3.Matrix4(),col=new T3.Color();
  pts.forEach((p,i)=>{m4.makeScale(p[2]*1.4,p[2],p[2]*1.4);m4.setPosition(p[0],0,p[1]);im.setMatrixAt(i,m4);col.copy(CC(p[3]<.5?"#4a5a2e":p[3]<.8?"#5a6a32":"#6a6a3a"));im.setColorAt(i,col)});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.receiveShadow=true;sc.add(im)}

// ---------- trees ----------
function buildTrees(sc){const R=srng(77);const pts=[];const dens={woods:.09,lodge:.03,hills:.016,fields:.006,wilds:.03,farm:.004,church:.012,town:.005,school:.003,quarry:0,mill:.012,road:0,river:0};
  const clear=(x,z)=>{if(z>40.5&&z<53.5)return false;for(const r of ROADS)if(x>r[0]-1.6&&x<r[2]+1.6&&z>r[1]-1.6&&z<r[3]+1.6)return false;if(solidAt(x,z,2.4))return false;
    for(const k of Object.keys(PLACES))if(PLACES[k].site){const r=siteRect(k);if(x>r[0]-3&&x<r[2]+3&&z>r[1]-3&&z<r[3]+3)return false}for(const q of QWALLS)if(x>q[0]-2&&x<q[2]+2&&z>q[1]-2&&z<q[3]+2)return false;return true};
  const N=Math.round((WB.x1-WB.x0)*(WB.z1-WB.z0)*.09);
  for(let i=0;i<N;i++){const x=WB.x0+R()*(WB.x1-WB.x0),z=WB.z0+R()*(WB.z1-WB.z0);const k=regionAt(x,z);if(R()>(dens[k]??.02)/.09)continue;if(!clear(x,z))continue;pts.push([x,z,.75+R()*.75,R()<(k==="woods"||k==="lodge"?.6:.35)])}
  for(let i=0;i<900;i++){const side=R()*4|0,o=1+R()*22;let x,z;if(side===0){x=WB.x0-o;z=WB.z0-22+R()*244}else if(side===1){x=WB.x1+o;z=WB.z0-22+R()*244}else if(side===2){z=WB.z0-o;x=WB.x0+R()*260}else{z=WB.z1+o;x=WB.x0+R()*260}pts.push([x,z,1+R()*.8,R()<.6])}
  const nP=pts.filter(p=>p[3]).length,nB=pts.length-nP;
  const tg=new T3.CylinderGeometry(.5,.7,1,6);tg.translate(0,.5,0);
  const pg=(()=>{const a=new T3.ConeGeometry(1,1.1,7);a.translate(0,.55,0);const b=new T3.ConeGeometry(.8,1,7);b.translate(0,1.05,0);const c=new T3.ConeGeometry(.55,.85,7);c.translate(0,1.5,0);return mergeGeos([a,b,c])})();
  const lg=new T3.IcosahedronGeometry(1,1);
  const trunk=new T3.InstancedMesh(tg,new T3.MeshLambertMaterial({color:CC("#4a3626")}),pts.length),pine=new T3.InstancedMesh(pg,new T3.MeshLambertMaterial({color:0xffffff,flatShading:true}),Math.max(1,nP)),leaf=new T3.InstancedMesh(lg,new T3.MeshLambertMaterial({color:0xffffff,flatShading:true}),Math.max(1,nB));
  const m4=new T3.Matrix4(),col=new T3.Color();let ip=0,ib=0;const data=[];
  pts.forEach((p,i)=>{const [x,z,s,isP]=p;m4.makeScale(.2*s,(isP?1.2:2)*s,.2*s);m4.setPosition(x,0,z);trunk.setMatrixAt(i,m4);
    if(isP){col.copy(CC(R()<.5?"#23402a":"#2d4d2f"));col.offsetHSL(0,0,(R()-.5)*.03);pine.setColorAt(ip,col);const d={x,z,s,m:pine,i:ip,p:true,ti:i};setTree(d,1,m4);data.push(d);ip++}
    else{col.copy(CC(R()<.5?"#2e4a24":"#3a5a2c"));col.offsetHSL((R()-.5)*.03,0,(R()-.5)*.04);leaf.setColorAt(ib,col);const d={x,z,s,m:leaf,i:ib,p:false,ti:i};setTree(d,1,m4);data.push(d);ib++}});
  for(const m of [trunk,pine,leaf]){m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;sc.add(m)}
  const B={};for(const d of data){const k=Math.floor(d.x/10)+","+Math.floor(d.z/10);(B[k]=B[k]||[]).push(d)}W3.trees={B,faded:new Set(),m4,trunk}}
function mergeGeos(list){const P=[],N=[],I=[];let off=0;for(let g of list){if(g.index)g=g.toNonIndexed();const p=g.attributes.position.array,n=g.attributes.normal.array;for(let i=0;i<p.length;i++){P.push(p[i]);N.push(n[i])}for(let i=0;i<p.length/3;i++)I.push(off+i);off+=p.length/3}
  const g=new T3.BufferGeometry();g.setAttribute("position",new T3.Float32BufferAttribute(P,3));g.setAttribute("normal",new T3.Float32BufferAttribute(N,3));g.setIndex(I);g.computeBoundingSphere();return g}
function setTree(d,f,m4){m4=m4||W3.trees.m4;const s=d.s;if(d.p){m4.makeScale(1.25*s*f,3.6*s*f,1.25*s*f);m4.setPosition(d.x,1.0*s,d.z)}else{m4.makeScale(1.6*s*f,1.3*s*f,1.6*s*f);m4.setPosition(d.x,2.4*s,d.z)}d.m.setMatrixAt(d.i,m4)}
function fadeTrees(){const T=W3.trees;if(!T)return;const pl=S.player;const want=new Set();const cx=Math.floor(pl.x/10),cz=Math.floor(pl.z/10);
  for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const L=T.B[(cx+i)+","+(cz+j)];if(!L)continue;for(const d of L){const dx=d.x-pl.x,dz=d.z-pl.z;if(dx+dz>-1.5&&dx+dz<10&&Math.abs(dx-dz)<4.5)want.add(d)}}
  const touched=new Set();for(const d of T.faded)if(!want.has(d)){setTree(d,1);T.faded.delete(d);touched.add(d.m)}
  for(const d of want)if(!T.faded.has(d)){setTree(d,.15);T.faded.add(d);touched.add(d.m)}
  for(const m of touched)m.instanceMatrix.needsUpdate=true}

// ---------- props: bridge, fences, poles, cars ----------
function propBox(gb,x,y,z,w,h,d,c,rot=0,mk="furn"){gb.at(x,z,rot,y);gb.box(mk,-w/2,0,-d/2,w/2,h,d/2,CC(c))}
function fenceLine(gb,pts,col,h=1){for(let i=1;i<pts.length;i++){const [x0,z0]=pts[i-1],[x1,z1]=pts[i];const L=Math.hypot(x1-x0,z1-z0),a=Math.atan2(x1-x0,z1-z0);
  for(const y of [h*.45,h*.85])propBox(gb,(x0+x1)/2,y,(z0+z1)/2,.07,.08,L,col,a);for(let t=0;t<=L;t+=2.5){const x=x0+(x1-x0)*t/L,z=z0+(z1-z0)*t/L;propBox(gb,x,0,z,.11,h,.11,col,a)}}}
function buildDecor(sc){const R=srng(5);const gb=new GB();
  propBox(gb,28,0,47,11,.44,12.6,"#5c5b56");for(const x of [22.7,33.3])propBox(gb,x,.44,47,.3,.7,12.6,"#7a7870");
  fenceLine(gb,[[-93,-28],[-47,-28],[-47,-7]],"#6e5a40");fenceLine(gb,[[-47,-2],[-47,13],[-93,13],[-93,-28]],"#6e5a40");
  for(let i=0;i<7;i++){gb.at(-90+R()*14,8+R()*4,R()*3,0);gb.box("furn",-.55,0,-.6,.55,1.1,.6,CC("#b39a52"))}
  for(let i=0;i<3;i++)for(let j=0;j<8;j++){propBox(gb,6.5+i*1.4,0,74+j*2.2,.5,.8,.16,"#8a8a84");}
  fenceLine(gb,[[5.6,73],[9.9,73],[9.9,91.5],[5.6,91.5],[5.6,73]],"#4a4a48");
  fenceLine(gb,[[60.5,22],[87.5,22],[87.5,34],[60.5,34],[60.5,22]],"#8a8e90",1.6);
  for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])propBox(gb,-3+a*1.6,0,-42+c*1.6,.2,8,.2,"#6a6e72");gb.at(-3,-42,0,8);gb.box("metal",-2.6,0,-2.6,2.6,2.8,2.6,CC("#9aa0a4"));
  for(let i=0;i<9;i++){gb.at(-12,34.5+(i%3)*.65,Math.PI/2,.35+Math.floor(i/3)*.6);gb.box("furn",-2,-.3,-.3,2,.3,.3,CC("#6b4f33"))}
  for(let x=14;x<92;x+=12){if(Math.abs(x-28)<6)continue;propBox(gb,x,0,-8.2,.12,4.4,.12,"#4a4c4e");propBox(gb,x,4.3,-7.7,.15,.12,1,"#4a4c4e")}
  // power poles along Mill Road and the highway
  for(let z=-90;z<95;z+=18){if(z>36&&z<56)continue;propBox(gb,21.6,0,z,.22,7,.22,"#5a4632");propBox(gb,21.6,6.4,z,.12,.12,1.6,"#5a4632",Math.PI/2)}
  // mailboxes
  for(const b of HOUSES){const o=doorOut(b);const f=b.face;const L=5.2;const p=f==="+z"?{x:o.x+1.6,z:o.z+L}:f==="-z"?{x:o.x-1.6,z:o.z-L}:f==="+x"?{x:o.x+L,z:o.z+1.6}:{x:o.x-L,z:o.z-1.6};propBox(gb,p.x,0,p.z,.08,1,.08,"#4a4a48");propBox(gb,p.x,1,p.z,.22,.2,.4,pick2(["#3a4a6a","#2a2a2a","#8a3a32"],R))}
  // quarry rock walls
  for(const q of QWALLS){const along=q[2]-q[0]>q[3]-q[1];const len=along?q[2]-q[0]:q[3]-q[1];for(let t=0;t<len;t+=2.2){const x=along?q[0]+t+1.1:(q[0]+q[2])/2,z=along?(q[1]+q[3])/2:q[1]+t+1.1;gb.at(x,z,R()*6,0);const s=1.4+R()*.8;gb.box("concrete",-s/2,0,-s/2,s/2,2+R()*1.8,s/2,CC(R()<.5?"#7a4632":"#8a5a42"),{ts:2})}}
  // cars
  for(const c of CARS){const col=pick2(["#6b2d2a","#2f4a5e","#7a7a74","#3b4a3a","#8a7a52","#2a2a2e","#5a4a6a","#a8a8a0"],R);gb.at(c.x,c.z,c.rot,0);
    gb.box("metal",-.9,.3,-2,.9,.9,2,CC(col));gb.box("metal",-.82,.9,-1.05,.82,1.42,.8,CC(col));gb.box("furn",-.84,.95,-1.0,.84,1.37,.75,CC("#1c252c"),{no:{py:1}});
    for(const [x,z] of [[-.86,1.25],[.86,1.25],[-.86,-1.3],[.86,-1.3]])gb.box("furn",x-.12,0,z-.33,x+.12,.62,z+.33,CC("#151515"));gb.box("furn",-.7,.55,1.99,-.4,.7,2.02,CC("#e8e0c0"));gb.box("furn",.4,.55,1.99,.7,.7,2.02,CC("#e8e0c0"));gb.box("furn",-.7,.55,-2.02,-.4,.7,-1.99,CC("#a8322a"));gb.box("furn",.4,.55,-2.02,.7,.7,-1.99,CC("#a8322a"))}
  for(const m of gb.meshes())sc.add(m)}

// ---------- camps: what's built on each lot (as in v2, with nicer materials) ----------
function structure(b,k,i,prog,flames){const p=tileXZ(k,i);const gb=new GB();const g=new T3.Group();g.position.set(p.x,0,p.z);const ss=PLACES[k].site;const tx=i%ss.gw;
  const B_=(x,y,z,w,h,d,c,rot=0)=>{gb.at(x,z,rot,y);gb.box("furn",-w/2,0,-d/2,w/2,h,d/2,CC(c))};
  const tent=(x,z,w,h,d,c)=>{gb.at(x,z,0,0);const P=(a,b,c_)=>[a,b,c_];gb.quad("furn",[P(-w/2,0,-d/2),P(-w/2,0,d/2),P(0,h,d/2),P(0,h,-d/2)],[-h,w/2,0],CC(c),[[0,0],[1,0],[1,1],[0,1]]);gb.quad("furn",[P(w/2,0,d/2),P(w/2,0,-d/2),P(0,h,-d/2),P(0,h,d/2)],[h,w/2,0],CC(c),[[0,0],[1,0],[1,1],[0,1]]);gb.tri("furn",[P(-w/2,0,-d/2),P(w/2,0,-d/2),P(0,h,-d/2)],[0,0,-1],CC(c),[[0,0],[1,0],[.5,1]]);gb.tri("furn",[P(w/2,0,d/2),P(-w/2,0,d/2),P(0,h,d/2)],[0,0,1],CC("#3a3424"),[[0,0],[1,0],[.5,1]])};
  if(prog!=null){const h=.25+1.6*prog;B_(0,0,0,2.3,h,2.3,"#6b5638");for(const [a,c] of [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]])B_(a,0,c,.12,2.2,.12,"#8a7048");B_(0,h,0,2.4,.06,2.4,"#e48a3f")}
  else{const flame=(y,s)=>{const f=new T3.Mesh(new T3.ConeGeometry(1,1,7),new T3.MeshBasicMaterial({color:"#ff9a3c"}));f.position.set(0,y,0);f.scale.set(s*.43,s,s*.43);f.userData.base=s;g.add(f);flames.push(f)};
  switch(b){
    case"tent":tent(0,0,1.9,1.5,2.2,"#8f8a6a");break;
    case"cabin":B_(0,0,0,2.7,1.8,2.4,"#8a6c44");tent(0,0,3,1.1,2.6,"#5e4630");gb.at(0,0,0,1.8);break;
    case"hut":B_(0,0,0,1.8,1.2,1.8,"#a28456");break;
    case"firepit":for(let a=0;a<8;a++)B_(Math.cos(a/8*6.28)*.7,0,Math.sin(a/8*6.28)*.7,.3,.22,.3,"#6c6a64",a);flame(.3,.75);break;
    case"storehouse":B_(0,0,0,2.6,1.7,2.2,"#7f6a48");B_(0,1.7,0,2.8,.25,2.4,"#5d4c33");break;
    case"smokehouse":B_(0,0,0,2,1.5,2,"#6f5d44");B_(.6,1.5,.6,.35,1.1,.35,"#555");break;
    case"wall":{const vert=tx===0||tx===ss.gw-1;for(let q=-2;q<=2;q++)B_(vert?0:q*.62,0,vert?q*.62:0,.36,2+((q*7+i)%3)*.12,.36,"#6e5a40");B_(0,1.4,0,vert?.12:3,.12,vert?3:.12,"#5b4a34");break}
    case"tower":for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])B_(a*.75,0,c*.75,.22,3.6,.22,"#5e4b35");B_(0,3.6,0,2,.2,2,"#6f5a40");tent(0,0,0,0,0,"#5a4630");break;
    case"workshop":B_(0,0,0,2.6,1.7,2.2,"#5c7387");B_(0,1.7,0,2.8,.25,2.4,"#3e4d59");break;
    case"infirmary":B_(0,0,0,2.6,1.7,2.2,"#d8d3c3");B_(0,1.7,0,.8,.22,.22,"#c4483c");B_(0,1.7,0,.22,.22,.8,"#c4483c");break;
    case"garden":B_(0,0,0,2.8,.16,2.8,"#4a3a26");for(let q=-1;q<=1;q++)B_(q*.9,.16,0,.45,.3,2.5,S.flags.winter?"#6b5a3a":"#5f9a4c");break;
    case"catcher":for(const [a,c] of [[-1,-1],[1,-1],[-1,1],[1,1]])B_(a*.9,0,c*.9,.1,1.8,.1,"#5e4b35");B_(0,1.7,0,2,.05,2,"#5e8fb0");B_(0,0,0,1,.8,1,"#3d5a6e");break;
    case"well":B_(0,0,0,1.6,.9,1.6,"#76736b");B_(0,1.6,0,1.7,.12,.12,"#5b4a34");for(const a of [-.8,.8])B_(a,0,0,.1,1.7,.1,"#5b4a34");break;
    case"hall":B_(0,0,0,2.8,2,2.6,"#a5743f");tent(0,0,3.1,1.2,2.9,"#6e4a2a");break;
    case"nursery":B_(0,0,0,2.5,1.6,2.2,"#c9a093");break;
  }}
  if(b==="tent"||b==="hall"||b==="cabin"){}for(const m of gb.meshes())g.add(m);if(b==="hall"||b==="cabin"){for(const m of g.children)if(m.isMesh&&!flames.includes(m)){}}
  return g}
function siteKey(k){const s=S.sites[k];const o=ownerOf(k);return s.grid.map(c=>c?c.b:"").join(",")+"|"+s.build.map(b=>b.b+b.tile+":"+Math.floor(Math.min(1,b.prog/BLD[b.b].work)*6)).join(",")+"|"+(o?o.color+o.id:"")+"|"+(S.flags.winter?1:0)}
function buildSite(k){if(W3.siteObj[k])W3.scene.remove(W3.siteObj[k]);const g=new T3.Group();const s=S.sites[k];const flames=[];
  s.grid.forEach((c,i)=>{if(c)g.add(structure(c.b,k,i,null,flames))});s.build.forEach(b=>g.add(structure(b.b,k,b.tile,Math.min(1,b.prog/BLD[b.b].work),flames)));
  const o=ownerOf(k);if(o){const r=siteRect(k);const x=r[2]+1.2,z=r[1]-.5;const pole=new T3.Mesh(new T3.CylinderGeometry(.06,.06,5.2,6),new T3.MeshLambertMaterial({color:CC("#6a6560")}));pole.position.set(x,2.6,z);g.add(pole);
    const fl=new T3.Mesh(new T3.BoxGeometry(1.3,.8,.05),new T3.MeshLambertMaterial({color:CC(o.color)}));fl.position.set(x+.7,4.7,z);fl.userData.flag=true;g.add(fl)}
  g.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}});W3.scene.add(g);W3.siteObj[k]=g;W3.siteFlames[k]=flames}
function syncSites(){WALLED.clear();for(const k of Object.keys(PLACES)){if(!PLACES[k].site)continue;const o=ownerOf(k);if(o&&siteCount(k,"wall")+(k==="quarry"?3:0)+(k==="school"?2:0)>=1)WALLED.add(k);
    const key=siteKey(k);if(W3.siteKeys[k]!==key){W3.siteKeys[k]=key;buildSite(k)}}
  const pl=S.player;const on=pl.fire&&pl.fire.until>S.t;
  if(on&&(!W3.campfire||W3.campfire.x!==pl.fire.x)){if(W3.campfire)W3.scene.remove(W3.campfire.g);const g=new T3.Group();g.position.set(pl.fire.x,0,pl.fire.z);for(let a=0;a<7;a++){const r=new T3.Mesh(new T3.DodecahedronGeometry(.17,0),new T3.MeshLambertMaterial({color:CC("#6c6a64")}));r.position.set(Math.cos(a/7*6.28)*.55,.1,Math.sin(a/7*6.28)*.55);g.add(r)}
    const f=new T3.Mesh(new T3.ConeGeometry(1,1,7),new T3.MeshBasicMaterial({color:"#ff9a3c"}));f.position.y=.35;f.scale.set(.28,.65,.28);f.userData.base=.65;g.add(f);W3.scene.add(g);W3.campfire={g,flame:f,x:pl.fire.x}}
  else if(!on&&W3.campfire){W3.scene.remove(W3.campfire.g);W3.campfire=null}
  W3.flames=[...Object.values(W3.siteFlames).flat(),...(W3.campfire?[W3.campfire.flame]:[])]}

// ---------- piles of dropped things ----------
function syncPiles(){const want=new Set(S.piles.filter(p=>p.c.items.length).map(p=>p.id));
  for(const [id,o] of W3.pileObjs)if(!want.has(id)){W3.scene.remove(o);W3.pileObjs.delete(id)}
  for(const p of S.piles){if(!want.has(p.id)||W3.pileObjs.has(p.id))continue;const g=new T3.Group();const R=srng(hashStr(p.id));const n=Math.min(5,p.c.items.length);
    for(let i=0;i<n;i++){const it=ITEMS[p.c.items[i].id];const m=new T3.Mesh(new T3.BoxGeometry(.18+it.sz[0]*.08,.08+R()*.08,.14+it.sz[1]*.06),new T3.MeshLambertMaterial({color:CC(it.col||pick2(["#8a6a42","#5a6a7a","#a83a32","#c8b890"],R))}));m.position.set((R()-.5)*.5,.05+i*.03,(R()-.5)*.5);m.rotation.y=R()*3;m.castShadow=true;g.add(m)}
    g.position.set(p.x,.06,p.z);W3.scene.add(g);W3.pileObjs.set(p.id,g)}}

// ---------- cutaway: see inside the building you're in, and through ones in the way ----------
function updateCutaway(){const pl=S.player;const inB=bldAt(pl.x,pl.z);W3.inB=inB;const want=new Set();if(inB)want.add(inB.id);
  for(const o of W3.bm.values()){const b=o.b;if(Math.abs(b.x-pl.x)>24||Math.abs(b.z-pl.z)>24)continue;const dx=b.x-pl.x,dz=b.z-pl.z;const s=dx+dz,p=Math.abs(dx-dz);const rad=(b.w+b.d)/2;
    if(s>-rad*.3&&s<rad+8&&p<rad*1.05+1.2)want.add(b.id)}
  for(const o of W3.bm.values()){const c=want.has(o.b.id)?1:0;o.target=c}}
function animCutaway(dt){for(const o of W3.bm.values()){const t=o.target||0;if(o.cut===t&&o.settled)continue;o.cut+=(t-o.cut)*Math.min(1,dt*9);if(Math.abs(o.cut-t)<.01){o.cut=t;o.settled=true}else o.settled=false;
  const sy=1-o.cut*.86;o.walls.scale.y=sy;o.win.visible=o.cut<.5;const hide=o.cut>.5;if(o.roof.visible===hide)o.roof.visible=!hide}}
function animDoors(dt){const pl=S.player;for(const o of W3.bm.values()){if(Math.abs(o.b.x-pl.x)>40||Math.abs(o.b.z-pl.z)>40)continue;for(const d of o.doors){const D=d.D;let want=D.open||D.broken?1:0;
  if(!want&&!D.lock&&!D.bar&&(D.npcT||0)>performance.now())want=1;d.a+=(want-d.a)*Math.min(1,dt*7);d.piv.rotation.y=d.piv.userData.base+d.piv.userData.sign*d.a*1.75*(D.broken?.8:1)}}}
function windowLights(){const night=W3.night;const powered=!S.flags.blackout;for(const o of W3.bm.values()){const b=o.b;let lit=false;if(night){const res=S.people.some(p=>p.alive&&p.home===b.id&&!p.group&&bldAt(p.x,p.z)===b);lit=res&&(powered||hashStr(b.id+dayOf(S.t))%3===0)}
  if(lit!==o.lit){o.lit=lit;for(const m of o.win.children)if(m.userData.mk==="glass")m.material=lit?MAT.glassLit:MAT.glass}}}
