// ================= the isometric scene =================
// What you see. The ground, roads and buildings are drawn once per place. Cars, trees, doors and windows are redrawn
// when they change (a car pushed, a tree felled, a window boarded up); people, the dead and animals move every frame.
// Buildings open up like a dollhouse, the way Project Zomboid does it: walk in (or press V) and the roof and the two
// near walls come away; walk behind one and it fades so you can still see yourself.
const T3=window.THREE;
const W={ok:false,loc:null,figs:{},blds:{},conts:{},fx:[],zoom:14,tgt:{x:0,z:0},free:false,ghost:null,bm:[],cars:[],trees:{},parts:[],flames:[],dv:null};
const BUB={};
function say(o,text,reply,think){if(!o||!text)return;const now=typeof performance!=="undefined"?performance.now():0;BUB[o.id]={x:String(text),until:now+clamp(2600+String(text).length*70,3800,11000),think:!!think};
  // what people say to you, or you to them, also goes in the log so it isn't lost when the bubble fades
  if(!think&&S&&(o.id==="you"||reply)&&o.loc===S.player.loc)log(`${o.id==="you"?"You":o.name}: "${String(text).slice(0,220)}"`,"talk")}
function sayLive(o,text){if(!o)return;BUB[o.id]={x:text||"...",until:performance.now()+9000,think:false}}
// ---------- materials and shapes ----------
const MATS={};
function mat(c){return MATS[c]||(MATS[c]=new T3.MeshLambertMaterial({color:c}))}
function bmat(c,op){const k="b"+c+(op==null?"":op);return MATS[k]||(MATS[k]=new T3.MeshBasicMaterial({color:c,transparent:op!=null,opacity:op==null?1:op,depthWrite:op==null}))}
function dmat(c){const k="d"+c;return MATS[k]||(MATS[k]=new T3.MeshLambertMaterial({color:c,side:T3.DoubleSide}))}
function shade(c,f){const o=new T3.Color(c);return"#"+new T3.Color(Math.min(1,o.r*f),Math.min(1,o.g*f),Math.min(1,o.b*f)).getHexString()}
const ease=x=>x*x*(3-2*x);
// shapes shared for the whole game: clearing a scene doesn't throw these away
const GEO={};function keep(k,f){if(!GEO[k]){GEO[k]=f();GEO[k].userData.keep=true}return GEO[k]}
function BG(w,h,d){return keep(`b${w.toFixed(3)},${h.toFixed(3)},${d.toFixed(3)}`,()=>new T3.BoxGeometry(w,h,d))}
function SG(r){return keep("s"+r.toFixed(3),()=>new T3.SphereGeometry(r,10,8))}
function CG(r,l){return keep(`c${r.toFixed(3)},${l.toFixed(3)}`,()=>new T3.CylinderGeometry(r,r,l,7))}
// ---------- textures, painted once on a canvas. Near-white, so they take the colour of whatever they're on ----------
const TEX={};
const rr=(a,b)=>a+Math.random()*(b-a),gry=v=>`rgb(${v|0},${v|0},${v|0})`;
function specks(g,s,n,cols,a,b){for(let i=0;i<n;i++){g.fillStyle=cols[(Math.random()*cols.length)|0];const r=rr(a,b);g.fillRect(Math.random()*s,Math.random()*s,r,r)}}
const TEXP={
  grass(g,s){g.fillStyle="#e2e2e2";g.fillRect(0,0,s,s);specks(g,s,2600,["#f6f6f6","#d2d2d2","#c4c4c4","#ececec","#d8e2c8","#e8e0c8"],1,3);g.lineWidth=1;
    for(let i=0;i<1100;i++){const x=Math.random()*s,y=Math.random()*s,a=rr(-.5,.5),l=rr(3,7);g.strokeStyle=Math.random()<.5?"rgba(255,255,255,.55)":"rgba(60,70,40,.18)";g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.sin(a)*l,y-Math.cos(a)*l);g.stroke()}},
  dirt(g,s){g.fillStyle="#dadada";g.fillRect(0,0,s,s);specks(g,s,3200,["#f2f2f2","#c6c6c6","#b4b4b4","#e6e6e6"],1,3);for(let i=0;i<70;i++){g.fillStyle=Math.random()<.5?"rgba(0,0,0,.12)":"rgba(255,255,255,.3)";g.beginPath();g.arc(Math.random()*s,Math.random()*s,rr(1.5,4),0,7);g.fill()}},
  soil(g,s){g.fillStyle="#d0d0d0";g.fillRect(0,0,s,s);specks(g,s,4000,["#e8e8e8","#b0b0b0","#9c9c9c"],1,3)},
  asphalt(g,s){g.fillStyle="#d4d4d4";g.fillRect(0,0,s,s);specks(g,s,6000,["#eaeaea","#bcbcbc","#ababab","#f6f6f6"],1,2);g.strokeStyle="rgba(0,0,0,.28)";g.lineWidth=1;
    for(let i=0;i<5;i++){let x=Math.random()*s,y=Math.random()*s;g.beginPath();g.moveTo(x,y);for(let j=0;j<8;j++){x+=rr(-14,14);y+=rr(-14,14);g.lineTo(x,y)}g.stroke()}},
  planks(g,s){const n=8,ph=s/n;for(let i=0;i<n;i++){g.fillStyle=gry(rr(205,245));g.fillRect(0,i*ph,s,ph);
      for(let j=0;j<6;j++){g.strokeStyle=`rgba(0,0,0,${rr(.03,.08)})`;g.beginPath();const y=i*ph+rr(3,ph-3);g.moveTo(0,y);for(let x=0;x<=s;x+=32)g.lineTo(x,y+rr(-1.2,1.2));g.stroke()}
      g.fillStyle="rgba(0,0,0,.32)";g.fillRect(0,i*ph,s,1.5);const jx=rr(0,s/2);g.fillRect(jx,i*ph,1.5,ph);g.fillRect(jx+s/2,i*ph,1.5,ph)}},
  tiles(g,s){g.fillStyle="#efefef";g.fillRect(0,0,s,s);for(let i=0;i<4;i++)for(let j=0;j<4;j++){g.fillStyle=gry(rr(226,248));g.fillRect(i*64+2,j*64+2,60,60)}specks(g,s,500,["rgba(0,0,0,.06)"],1,2)},
  siding(g,s){const n=8,bh=s/n;for(let i=0;i<n;i++){const gr=g.createLinearGradient(0,i*bh,0,(i+1)*bh);gr.addColorStop(0,"#fafafa");gr.addColorStop(1,"#cfcfcf");g.fillStyle=gr;g.fillRect(0,i*bh,s,bh);g.fillStyle="rgba(0,0,0,.35)";g.fillRect(0,(i+1)*bh-1.5,s,1.5)}
    specks(g,s,400,["rgba(0,0,0,.05)","rgba(255,255,255,.2)"],1,3)},
  boards(g,s){const n=8,bw=s/n;for(let i=0;i<n;i++){g.fillStyle=gry(rr(200,240));g.fillRect(i*bw,0,bw,s);g.fillStyle="rgba(0,0,0,.4)";g.fillRect(i*bw,0,2,s);for(let j=0;j<4;j++){g.fillStyle="rgba(0,0,0,.06)";g.fillRect(i*bw+rr(4,bw-4),0,1,s)}}specks(g,s,300,["rgba(0,0,0,.1)"],1,3)},
  brick(g,s){g.fillStyle="#cfcfcf";g.fillRect(0,0,s,s);const bw=32,bh=16;for(let j=0;j<s/bh;j++)for(let i=-1;i<s/bw+1;i++){const x=i*bw+(j%2?bw/2:0);g.fillStyle=gry(rr(185,240));g.fillRect(x+1.5,j*bh+1.5,bw-3,bh-3)}specks(g,s,600,["rgba(0,0,0,.08)"],1,2)},
  block(g,s){g.fillStyle="#d2d2d2";g.fillRect(0,0,s,s);const bw=64,bh=32;for(let j=0;j<s/bh;j++)for(let i=-1;i<s/bw+1;i++){const x=i*bw+(j%2?bw/2:0);g.fillStyle=gry(rr(225,248));g.fillRect(x+2,j*bh+2,bw-4,bh-4)}specks(g,s,900,["rgba(0,0,0,.05)"],1,2)},
  shingle(g,s){const rows=8,rh=s/rows,tw=24;for(let j=0;j<rows;j++){for(let i=-1;i<s/tw+1;i++){const x=i*tw+(j%2?tw/2:0);g.fillStyle=gry(rr(180,240));g.fillRect(x+1,j*rh,tw-2,rh)}g.fillStyle="rgba(0,0,0,.4)";g.fillRect(0,(j+1)*rh-2,s,2)}},
  metal(g,s){for(let i=0;i<s;i+=16){const gr=g.createLinearGradient(i,0,i+16,0);gr.addColorStop(0,"#f4f4f4");gr.addColorStop(.5,"#bdbdbd");gr.addColorStop(1,"#f4f4f4");g.fillStyle=gr;g.fillRect(i,0,16,s)}
    for(let i=0;i<40;i++){g.fillStyle=`rgba(140,70,30,${rr(.05,.18)})`;g.beginPath();g.arc(Math.random()*s,Math.random()*s,rr(2,9),0,7);g.fill()}},
  gravel(g,s){g.fillStyle="#cacaca";g.fillRect(0,0,s,s);specks(g,s,7000,["#e4e4e4","#b0b0b0","#9a9a9a","#f2f2f2"],1,3)},
  plaster(g,s){g.fillStyle="#f2f2f2";g.fillRect(0,0,s,s);specks(g,s,900,["rgba(0,0,0,.035)","rgba(255,255,255,.4)"],2,6)},
  char(g,s){g.fillStyle="#bdbdbd";g.fillRect(0,0,s,s);specks(g,s,2500,["#8a8a8a","#6a6a6a","#d0d0d0"],1,4);for(let i=0;i<30;i++){g.fillStyle="rgba(0,0,0,.25)";g.fillRect(Math.random()*s,0,rr(2,6),s)}},
  water(g,s){g.fillStyle="#d8e4ec";g.fillRect(0,0,s,s);g.strokeStyle="rgba(255,255,255,.55)";g.lineWidth=1.5;for(let i=0;i<70;i++){const x=Math.random()*s,y=Math.random()*s;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+8,y-3,x+16,y);g.stroke()}}};
function tex(n){if(TEX[n])return TEX[n];const c=document.createElement("canvas");c.width=c.height=256;TEXP[n](c.getContext("2d"),256);
  const t=new T3.CanvasTexture(c);t.wrapS=t.wrapT=T3.RepeatWrapping;t.anisotropy=W.r?Math.min(8,W.r.capabilities.getMaxAnisotropy()):1;return TEX[n]=t}
function tmat(c,t){const k=c+"|"+t;return MATS[k]||(MATS[k]=new T3.MeshLambertMaterial({color:c,map:tex(t)}))}
// a soft round blot: shadows under people, blood under the dead
function radTex(n,inner,outer,spots){if(TEX[n])return TEX[n];const c=document.createElement("canvas");c.width=c.height=128;const g=c.getContext("2d");const gr=g.createRadialGradient(64,64,4,64,64,62);gr.addColorStop(0,inner);gr.addColorStop(1,outer);g.fillStyle=gr;
  if(spots){for(let i=0;i<9;i++){g.beginPath();g.arc(64+rr(-26,26),64+rr(-26,26),rr(14,30),0,7);g.fill()}}else g.fillRect(0,0,128,128);return TEX[n]=new T3.CanvasTexture(c)}
function signTex(text,bg,fg){const key="sign:"+text;if(TEX[key])return TEX[key];const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle=bg;g.fillRect(0,0,512,128);g.strokeStyle="rgba(0,0,0,.35)";g.lineWidth=6;g.strokeRect(3,3,506,122);
  let fs=78;const font=()=>`bold ${fs}px Impact, "Arial Narrow", sans-serif`;g.font=font();while(g.measureText(text).width>470&&fs>30){fs-=4;g.font=font()}g.fillStyle=fg;g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,68);
  for(let i=0;i<300;i++){g.fillStyle=`rgba(0,0,0,${rr(.03,.12)})`;g.fillRect(Math.random()*512,Math.random()*128,rr(1,4),rr(1,4))}return TEX[key]=new T3.CanvasTexture(c)}
// scale a box's texture to its size, so a long wall gets more boards rather than wider ones (s: world units per tile)
function uvBox(geo,w,h,d,s){const uv=geo.attributes.uv;const D=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let i=0;i<4;i++){const j=f*4+i;uv.setXY(j,uv.getX(j)*D[f][0]/s,uv.getY(j)*D[f][1]/s)}uv.needsUpdate=true;return geo}
function tbox(w,h,d,m,x,y,z,s){const me=new T3.Mesh(uvBox(new T3.BoxGeometry(w,h,d),w,h,d,s||2),m);me.position.set(x||0,(y||0)+h/2,z||0);me.castShadow=true;me.receiveShadow=true;return me}
function box(w,h,d,c,x,y,z){const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),mat(c));m.position.set(x||0,(y||0)+h/2,z||0);m.castShadow=true;m.receiveShadow=true;return m}
function cyl(r1,r2,h,c,x,y,z,seg){const m=new T3.Mesh(new T3.CylinderGeometry(r1,r2,h,seg||8),mat(c));m.position.set(x||0,(y||0)+h/2,z||0);m.castShadow=true;m.receiveShadow=true;return m}
// faceted, low-poly look for leaves and stones
function lowpoly(geo){const g=geo.toNonIndexed();g.computeVertexNormals();return g}
// something lying flat on the ground: a road, a parking line, a field (rot turns it, s tiles its texture)
function flatM(w,d,m,x,z,y,s,rot){const g=new T3.PlaneGeometry(w,d);if(s){const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/s,uv.getY(i)*d/s)}const me=new T3.Mesh(g,m);me.rotation.x=-Math.PI/2;if(rot)me.rotation.z=rot;me.position.set(x,y||.02,z);me.receiveShadow=true;return me}
// a pitched roof over a w×d box, ridge running along x, eaves at height y. gc colours the gable ends; M picks materials.
function roof(w,d,h,c,y,gc,M){M=M||((cc,t)=>t?tmat(cc,t):mat(cc));const g=new T3.Group();const oh=.4,hd=d/2+oh,a=Math.atan2(h,d/2),L=hd/Math.cos(a)+.05,th=.14;
  for(const s of [1,-1]){const sl=tbox(w+.7,th,L,M(c,"shingle"),0,0,0,2);sl.position.set(0,y+h*(1-hd/d)+th/2/Math.cos(a),s*hd/2);sl.rotation.x=s*a;g.add(sl)}
  const sh=new T3.Shape();sh.moveTo(-d/2,0);sh.lineTo(0,h);sh.lineTo(d/2,0);sh.lineTo(-d/2,0);
  for(const s of [1,-1]){const ge=new T3.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:false});ge.rotateY(Math.PI/2);const m=new T3.Mesh(ge,M(gc||shade(c,.85),gc?"siding":null));m.position.set(s>0?w/2-.3:-w/2,y,0);m.castShadow=true;m.receiveShadow=true;g.add(m)}
  g.add(tbox(w+.75,.12,.34,M(shade(c,.75),null),0,y+h-.04,0));return g}
function flatRoof(w,d,c,wc,y,M){M=M||((cc,t)=>t?tmat(cc,t):mat(cc));const g=new T3.Group();g.add(tbox(w+.1,.25,d+.1,M(c,"gravel"),0,y,0,3));const pm=M(wc,"block");
  g.add(tbox(w+.3,.45,.22,pm,0,y,d/2+.04),tbox(w+.3,.45,.22,pm,0,y,-d/2-.04),tbox(.22,.45,d+.3,pm,w/2+.04,y,0),tbox(.22,.45,d+.3,pm,-w/2-.04,y,0));return g}
// ---------- the renderer and the camera ----------
function initWorld(cv){if(!T3){W.ok=false;return}try{
  W.r=new T3.WebGLRenderer({canvas:cv,antialias:true});W.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));W.r.shadowMap.enabled=true;W.r.shadowMap.type=T3.PCFSoftShadowMap;
  W.sc=new T3.Scene();W.cam=new T3.OrthographicCamera(-10,10,10,-10,1,600);W.bg=new T3.Color("#20262c");W.sc.background=W.bg;
  W.hemi=new T3.HemisphereLight(0xdfe8f0,0x5a5040,.7);W.sc.add(W.hemi);W.sun=new T3.DirectionalLight(0xfff0d8,.8);W.sun.castShadow=true;W.sun.shadow.mapSize.set(2048,2048);
  const sc=W.sun.shadow.camera;sc.left=-46;sc.right=46;sc.top=46;sc.bottom=-46;sc.near=1;sc.far=300;W.sun.shadow.bias=-.0008;W.sc.add(W.sun);W.sc.add(W.sun.target);
  // a few lights for fires and the stove, and the lantern you carry at night: made once, so nothing has to recompile
  W.pts=[];for(let i=0;i<3;i++){const p=new T3.PointLight(0xffa04a,0,14,2);W.sc.add(p);W.pts.push(p)}W.lamp=new T3.PointLight(0xffe2b0,0,12,2);W.sc.add(W.lamp);
  W.blobM=new T3.MeshBasicMaterial({map:radTex("shadow","rgba(0,0,0,.85)","rgba(0,0,0,0)"),transparent:true,depthWrite:false,opacity:.3});
  W.poolM=new T3.MeshLambertMaterial({map:radTex("blood","rgba(74,10,8,.95)","rgba(60,6,4,0)",true),transparent:true,depthWrite:false});
  W.root=new T3.Group();W.sc.add(W.root);W.dyn=new T3.Group();W.sc.add(W.dyn);W.ray=new T3.Raycaster();W.plane=new T3.Plane(new T3.Vector3(0,1,0),0);W.v3=new T3.Vector3();
  W.ok=true;resizeWorld()}catch(e){console.error(e);W.ok=false}}
function resizeWorld(){if(!W.ok)return;const w=innerWidth,h=innerHeight;W.r.setSize(w,h,false);W.aspect=w/h;camUpdate()}
function camUpdate(){const z=W.zoom,a=W.aspect||1;W.cam.left=-z*a;W.cam.right=z*a;W.cam.top=z;W.cam.bottom=-z;W.cam.updateProjectionMatrix();
  const t=W.tgt;const j=W.kick>0?(Math.random()-.5)*W.kick*2:0;W.cam.position.set(t.x+60+j,60,t.z+60-j);W.cam.lookAt(t.x+j,0,t.z-j);W.sun.position.set(t.x+30,60,t.z+18);W.sun.target.position.set(t.x,0,t.z)}
function clearGroup(g){while(g.children.length){const c=g.children.pop();c.traverse(o=>{if(o.geometry&&!(o.geometry.userData&&o.geometry.userData.keep))o.geometry.dispose()})}}
// ---------- building a place ----------
function buildScene(){if(!W.ok||!S)return;const k=S.player.loc==="road"?(S.flags.traveling?.from||"start"):S.player.loc;W.loc=k;
  clearGroup(W.root);clearGroup(W.dyn);Object.assign(W,{figs:{},blds:{},conts:{},fx:[],bm:[],cars:[],trees:{},parts:[],flames:[],xray:null,dv:null,ghost:null,cgh:null,perim:null,ring:null,mark:null,pushT:null,water:null});
  if(!LOCS[k])return;const L=LOCS[k];const lay=layout(k);const P=place(k);const burned=P.burned;const kind=L.kind;
  W.flats=new T3.Group();W.deco=new T3.Group();W.hs=new T3.Group();W.cg=new T3.Group();W.cs=new T3.Group();W.bs=new T3.Group();W.fu=new T3.Group();W.root.add(W.flats,W.deco,W.hs,W.cg,W.cs,W.bs,W.fu);
  W.ground=groundMesh(k,L,lay);W.root.add(W.ground);W.pick=[W.ground,W.hs,W.cg,W.cs,W.bs];
  const town=kind!=="farm"&&kind!=="mill"&&kind!=="scout";const fl=o=>{W.flats.add(o);return o},dc=o=>{W.deco.add(o);return o};
  const asph=tmat("#48484a","asphalt"),dirt=tmat("#8a7a5a","dirt"),walk=tmat("#8a8680","block");
  // the road in, and the paths to the doors
  if(kind==="road"){fl(flatM(2*SH+40,9,tmat("#3e3e40","asphalt"),0,6,.03,6));for(const z of [1.1,10.9])fl(flatM(2*SH+40,1.2,tmat("#7a7262","dirt"),0,z,.028,4));
    for(let x=-SH-18;x<SH+18;x+=5)fl(flatM(2.2,.22,mat("#d8c860"),x,6,.04));for(const z of [1.9,10.1])fl(flatM(2*SH+40,.14,mat("#d8d4c8"),0,z,.04))}
  else{const len=SH+8-2;fl(flatM(4,len,town?asph:dirt,0,2+len/2,.03,town?6:4));if(!town)fl(flatM(1.1,len,tmat("#6a7a46","grass"),0,2+len/2,.033,4));
    for(const r of lay.b){const x0=0,z0=2.5,x1=r.door.ox,z1=r.door.oz-.5;const l=dist(x0,z0,x1,z1);if(l>1)fl(flatM(1.7,l+1,town?walk:dirt,(x0+x1)/2,(z0+z1)/2,.031,3,Math.atan2(x1-x0,z1-z0)))}}
  if(lay.lot){fl(flatM(34,16,asph,0,13,.025,6));const lm=mat("#d8d4c8");for(let x=-15;x<=15;x+=3){fl(flatM(.12,4.4,lm,x,8.4,.035));fl(flatM(.12,4.4,lm,x,17.6,.035))}}
  if(lay.field){const lm=mat("#e8e8e0");fl(flatM(22,16,tmat("#5e8a3e","grass"),-12,14,.026,4));for(const [w,d,x,z] of [[.18,16,-12,14],[22,.18,-12,6.1],[22,.18,-12,21.9],[.18,16,-22.9,14],[.18,16,-1.1,14]])fl(flatM(w,d,lm,x,z,.034));
    const c=new T3.Mesh(new T3.RingGeometry(1.8,2,32),lm);c.rotation.x=-Math.PI/2;c.position.set(-12,.035,14);fl(c);
    for(const x of [-22.5,-1.5]){dc(box(.1,1.6,.1,"#e8e8e0",x,0,12.5));dc(box(.1,1.6,.1,"#e8e8e0",x,0,15.5));dc(box(.1,.1,3.1,"#e8e8e0",x,1.55,14))}}
  if(lay.fields){const R=srng(hashStr(k+":crops"));for(let i=0;i<8;i++)fl(flatM(18,1.1,i%2?tmat("#6a4a32","soil"):tmat("#5a6a34","grass"),-14,10+i*1.5,.03,3));
    const n=4*30;const im=new T3.InstancedMesh(keep("stalk",()=>lowpoly(new T3.ConeGeometry(.16,1,4))),mat("#ffffff"),n);const m4=new T3.Matrix4(),q=new T3.Quaternion(),e=new T3.Euler(),sc=new T3.Vector3(),ps=new T3.Vector3(),col=new T3.Color();let j=0;
    for(let i=0;i<8;i+=2)for(let x=-22.5;x<=-5.6&&j<n;x+=.6){const h=.7+R()*.6;ps.set(x+R()*.2,h/2,10+i*1.5+(R()-.5)*.3);e.set((R()-.5)*.2,R()*6,(R()-.5)*.2);q.setFromEuler(e);sc.set(1,h,1);m4.compose(ps,q,sc);im.setMatrixAt(j,m4);im.setColorAt(j,col.set(R()<.3?"#a89a48":"#5a7a32"));j++}
    im.count=j;im.castShadow=true;im.receiveShadow=true;dc(im)}
  if(lay.water){const wt=tex("water").clone();wt.needsUpdate=true;wt.repeat.set(14/6,(2*SH+30)/6);W.water=wt;fl(flatM(14,2*SH+30,new T3.MeshLambertMaterial({color:"#3a6a8a",map:wt,transparent:true,opacity:.92}),SH+3,0,.05));fl(flatM(2.4,2*SH+30,dirt,SH-4.5,0,.035,4));
    for(let z=-SH;z<SH;z+=1.7){const r=box(.06,.5+Math.random()*.6,.06,"#6a7a3a",SH-3.4+Math.random()*.8,0,z+Math.random());dc(r)}}
  if(lay.fence){const fm="#26282a";for(let x=-14;x<=14;x+=1){if(Math.abs(x)<2)continue;dc(box(.06,1.3,.06,fm,x,0,SH-14));const t=new T3.Mesh(keep("spear",()=>new T3.ConeGeometry(.06,.2,4)),mat(fm));t.position.set(x,1.4,SH-14);dc(t)}
    for(const s of [-1,1])for(const y of [.3,1.1])dc(box(12,.06,.06,fm,s*8,y,SH-14))}
  if(lay.canopy&&!burned){const g=new T3.Group();g.add(tbox(12,.2,7,mat("#e4e4dc"),0,4.3,0),box(12.1,.36,7.1,"#b8342a",0,4,0));for(const [x,z] of [[-5,-3],[5,-3],[-5,3],[5,3]])g.add(cyl(.18,.18,4,"#b8b8b0",x,0,z,10));
    for(const x of [-2.5,2.5]){g.add(box(1,.25,.7,"#8a8680",x,0,0),box(.75,1.45,.5,"#d8d8d0",x,.25,0),box(.77,.3,.52,"#b8342a",x,1.4,0),box(.5,.3,.03,"#2a3440",x,.95,.26));const h=box(.05,.05,.6,"#1a1a1a",x+.4,.7,.2);h.rotation.x=.5;g.add(h)}
    g.position.set(6,0,4);dc(g)}
  // buildings, what's in them, and the containers you search
  lay.b.forEach((r,bi)=>{const rec=houseModel(k,r,bi,burned);W.hs.add(rec.g);W.bm.push(rec)});
  if(!burned)for(const f of lay.furn)W.fu.add(furnModel(f));
  for(const c of lay.conts){if(c.vis==="car")continue;const g=contModel(c);W.cs.add(g);W.conts[c.id]=g}
  // cars stand wherever they were last pushed
  carsAt(k).forEach((c,i)=>{const m=carModel(lay.cars[i]||{});m.userData.car=i;m.position.set(c.x,0,c.z);m.rotation.y=c.rot;W.cg.add(m);W.cars[i]=m});
  const R=srng(hashStr(k+":trees"));lay.trees.forEach((t,i)=>{const T=treeModel(t,R);dc(T.g);if(choppable(t))W.trees[i]={i,t,g:T.g,pv:T.pv,state:"up",ft:0,log:null,stump:null,hit:0,n0:treeWood(t)}});
  propsFor(k,lay,L,town);
  for(const b of S.blds)if(b.loc===k)drawBld(b);
  W.tgt={x:S.player.x,z:S.player.z};W.free=false;camUpdate()}
// the ground: grass, worn to dirt by the doors and where the road comes in, darker past the edge of the place
function groundMesh(k,L,lay){const S2=2*SH+40,N=60;const G=new T3.PlaneGeometry(S2,S2,N,N);G.rotateX(-Math.PI/2);const uv=G.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*S2/5,uv.getY(i)*S2/5);
  const R=srng(hashStr(k+"g"));const base=new T3.Color(L.kind==="scout"?"#56743e":L.kind==="farm"?"#74843f":L.kind==="road"?"#6e7a48":"#6a7e46"),worn=new T3.Color("#857656"),c=new T3.Color();
  const spots=[...lay.b.map(r=>[r.door.ox,r.door.oz+.8,4.5]),[0,SH,5],[0,3,4]];if(S.camp&&S.camp.site===k)spots.push([0,4,10]);
  const col=[];const pos=G.attributes.position;
  for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);c.copy(base);const n=Math.sin(x*.21+1.3)*Math.cos(z*.17-.4)*.07+Math.sin(x*.05-z*.07)*.06+(R()-.5)*.05;c.offsetHSL(n*.12,0,n);
    let wv=0;for(const [sx,sz,r] of spots){const d=dist(x,z,sx,sz);if(d<r)wv=Math.max(wv,(1-d/r)*.6)}if(wv)c.lerp(worn,wv);if(Math.abs(x)>SH||Math.abs(z)>SH)c.multiplyScalar(.7);col.push(c.r,c.g,c.b)}
  G.setAttribute("color",new T3.Float32BufferAttribute(col,3));const m=new T3.Mesh(G,new T3.MeshLambertMaterial({vertexColors:true,map:tex("grass")}));m.receiveShadow=true;return m}
// ---------- buildings: walls you can see into, a roof that lifts off, and the door and windows as they stand ----------
const SIGNS={store:k=>({pharmacy:"PHARMACY",hardware:"HARDWARE"})[k]||"GROCERY",police:()=>"POLICE",school:()=>"MILLBROOK SCHOOL",motel:()=>"STARLITE MOTEL",gas:()=>"GAS · FOOD · ICE"};
function houseModel(k,r,bi,burned){const kind=LOCS[k].kind;const g=new T3.Group();g.position.set(r.x,0,r.z);
  const rec={bi,r,g,burned,x0:r.x-r.w/2,x1:r.x+r.w/2,z0:r.z-r.d/2,z1:r.z+r.d/2,fF:1,fB:1,cut:false,own:{F:{},B:{},S:{}},glass:null,chim:null,lived:false};
  // each building gets its own copies of its materials, so it can fade on its own
  rec.M=(c,t,grp)=>{const o=rec.own[grp||"F"];const key=c+"|"+(t||"");return o[key]||(o[key]=(t?tmat(c,t):mat(c)).clone())};
  const w=r.w,d=r.d,h=burned?r.h*.55:r.h,t=.3,dw=DOOR/2,dh=Math.min(2.3,h-.5);rec.h=h;
  const wc=burned?"#5a524c":r.c,ext=burned?"char":r.barn?"boards":kind==="church"||kind==="police"||kind==="school"?"brick":r.flat?"block":"siding";
  const inC=burned?"#4a4440":r.barn?"#9a7a58":r.flat?"#dcd8cc":"#d8ccb4";
  // a wall: the outside, the inside face (plaster) and the top you see when it's cut away
  const wm=(grp,inner)=>{const ex=rec.M(wc,ext,grp),ii=rec.M(inC,burned?"char":"plaster",grp),cap=rec.M(burned?"#2a2624":"#4a4440",null,grp);const m=[ex,ex,cap,ex,ex,ex];m[inner]=ii;return m};
  const back=new T3.Group(),full=new T3.Group(),stub=new T3.Group(),top=new T3.Group();stub.visible=false;for(const q of [back,full,stub,top])q.userData.house=bi;
  const fl=tbox(w-.1,.06,d-.1,tmat(burned?"#3a3430":r.floor,r.flat&&!r.barn?"tiles":"planks"),0,0,0,r.flat&&!r.barn?2:3);fl.castShadow=false;g.add(fl);
  back.add(tbox(w,h,t,wm("B",4),0,0,-d/2+t/2),tbox(t,h,d,wm("B",0),-w/2+t/2,0,0));
  const near=(H,grp,G)=>{const sw=w/2-dw;G.add(tbox(t,H,d,wm(grp,1),w/2-t/2,0,0),tbox(sw,H,t,wm(grp,5),-(w/2+dw)/2,0,d/2-t/2),tbox(sw,H,t,wm(grp,5),(w/2+dw)/2,0,d/2-t/2))};
  near(h,"F",full);full.add(tbox(2*dw,h-dh,t,wm("F",5),0,dh,d/2-t/2));near(.45,"S",stub);
  if(!burned){const MF=(c,tt)=>rec.M(c,tt,"F");const tm=MF("#e8e4da");
    // trim round the doorway and on the corners you can see
    full.add(tbox(.12,dh,.1,tm,-dw-.06,0,d/2+.02,1),tbox(.12,dh,.1,tm,dw+.06,0,d/2+.02,1),tbox(DOOR+.36,.12,.1,tm,0,dh,d/2+.02,1));
    if(!r.flat)full.add(tbox(.14,h,.14,tm,w/2-.03,0,d/2-.03,1),tbox(.14,h,.14,tm,-w/2+.03,0,d/2-.03,1),tbox(.14,h,.14,tm,w/2-.03,0,-d/2+.03,1));
    if(r.flat){top.add(flatRoof(w,d,r.roof,wc,h,MF));const R=srng(hashStr(k+bi+"ac"));for(let i=0;i<1+(w>10?1:0);i++)top.add(tbox(1.4,.8,1.1,MF("#9a9c9e","metal"),(R()-.5)*(w-3),h+.25,(R()-.5)*(d-3),1))}
    else{const rh=h*.55;top.add(roof(w,d,rh,r.roof,h,wc,(c,tt)=>MF(c,tt==="siding"?ext:tt)));
      if(!r.barn&&!r.steeple){top.add(tbox(.7,rh+1.1,.7,MF("#8a5444","brick"),-w/4,h,-d/5,1));rec.chim={x:r.x-w/4,z:r.z-d/5,y:h+rh+1.15}}}
    if(r.steeple){const zt=d/2-1.2;top.add(tbox(2.4,5.2,2.4,MF(wc,ext),0,h,zt));const sp=new T3.Mesh(new T3.ConeGeometry(1.85,4.2,4),MF(r.roof,"shingle"));sp.position.set(0,h+5.2+2.1,zt);sp.rotation.y=Math.PI/4;sp.castShadow=true;top.add(sp);
      top.add(tbox(1,1.3,.05,MF("#141416"),0,h+3.3,zt+1.21,1),tbox(.05,1.3,1,MF("#141416"),1.21,h+3.3,zt,1))}
    const sg=SIGNS[kind];if(sg){const txt=sg(k);const sw=Math.min(w*.7,7);const m=new T3.MeshLambertMaterial({map:signTex(txt,kind==="police"?"#1e2a4a":kind==="motel"?"#24485a":kind==="gas"?"#b8342a":"#2a3a2a","#f0ead8")});rec.own.F.sign=m;
      const pl=new T3.Mesh(new T3.PlaneGeometry(sw,.8),m);pl.position.set(0,r.flat?h+.62:Math.min(h-.3,dh+.75),d/2+(r.flat?.17:.05));full.add(pl)}
    g.add(tbox(DOOR+.5,.14,.6,tmat("#8a8680","block"),0,0,d/2+.3,2));full.add(tbox(.16,.2,.12,MF("#2a2a2a"),dw+.38,dh+.15,d/2+.06,1))}
  else{const R=srng(hashStr(k+bi+"burn"));for(let i=0;i<7;i++)g.add(box(.3,.4+R()*r.h*.8,.3,"#1e1a18",(R()-.5)*w*.8,0,(R()-.5)*d*.8));for(let i=0;i<10;i++){const b=box(.2+R()*1.6,.12,.2,"#2a2420",(R()-.5)*w,.05,(R()-.5)*d);b.rotation.y=R()*3;g.add(b)}
    W.fx.push({x:r.x,z:r.z,h,w:w*.6,s:.75,c:"#3a3634",op:.5})}
  g.add(back,full,stub,top);Object.assign(rec,{back,full,stub,top,H:h+(burned?0:r.flat?.5:h*.55+.2)});
  rec.dec={F:new T3.Group(),S:new T3.Group(),I:new T3.Group()};full.add(rec.dec.F);stub.add(rec.dec.S);g.add(rec.dec.I);rec.glass=rec.M("#28323c",null,"F");return rec}
// the door (shut, standing open, or broken in), anything barring it, the dresser, and every window: glass, broken, boarded
function houseDecor(k,rec){const D=rec.dec;clearGroup(D.F);clearGroup(D.S);clearGroup(D.I);if(rec.burned)return;const r=rec.r,bi=rec.bi;const st=bldState(k,bi);
  const w=r.w,d=r.d,h=rec.h,t=.3,dw=DOOR/2,dh=Math.min(2.3,h-.5),zf=d/2-t/2;const F=(c,tt)=>rec.M(c,tt,"F"),Sm=(c,tt)=>rec.M(c,tt,"S");const dc=r.barn?"#7a2e24":"#5e3e2a";
  if(st.door==="shut"){D.F.add(tbox(DOOR-.12,dh,.09,F(dc,"boards"),0,0,zf,1),tbox(.07,.07,.08,F("#c8b070"),dw-.35,1.05,zf+.08,1));D.S.add(tbox(DOOR-.12,.45,.09,Sm(dc,"boards"),0,0,zf,1));
    if(r.barn){const L=Math.hypot(DOOR-.2,dh-.1),a=Math.atan2(dh-.1,DOOR-.2);for(const s of [1,-1]){const x=tbox(L,.14,.05,F("#e8e0d0"),0,dh/2-.07,zf+.07,1);x.rotation.z=s*a;D.F.add(x)}}}
  else if(st.door==="open"){for(const [G,H,M] of [[D.F,dh,F],[D.S,.45,Sm]]){const p=tbox(DOOR-.12,H,.08,M(dc,"boards"),-dw+.1,0,d/2-t-(DOOR-.12)/2,1);p.rotation.y=Math.PI/2;G.add(p)}}
  else{const p=tbox(DOOR-.2,.08,dh*.85,mat(shade(dc,.8)),.3,0,d/2-t-dh*.45,1);p.rotation.y=.35;D.I.add(p);for(const [x,y,hh] of [[-dw+.08,0,dh*.6],[-dw+.1,dh*.62,.3],[dw-.1,0,dh*.35]])D.F.add(tbox(.08,hh,.08,F(dc),x,y,zf,1))}
  for(let i=0;i<st.bar;i++){const b=tbox(DOOR+.5,.16,.08,F("#7a5a36","planks"),0,.95+i*.6,d/2-t-.05,1);b.rotation.z=i?-.07:.05;D.F.add(b);for(const x of [-dw-.18,dw+.18])D.F.add(tbox(.12,.26,.1,F("#3a3a3c"),x,.9+i*.6,d/2-t-.06,1));
    D.S.add(tbox(DOOR+.5,.12,.08,Sm("#7a5a36","planks"),0,.2+i*.14,d/2-t-.05,1))}
  if(st.furn){const g=new T3.Group();g.add(box(1.5,1.15,.55,"#6a4630",0,0,0),box(1.56,.05,.6,"#7a5238",0,1.15,0));for(let i=0;i<3;i++)g.add(box(1.36,.02,.02,"#3a2618",0,.3+i*.32,-.29));g.position.set(0,0,d/2-t-.32);D.I.add(g)}
  r.wins.forEach((wn,i)=>{const ws=st.wins[i];if(!ws)return;const fr=wn.side==="front";const u0=fr?wn.x-r.x:wn.z-r.z;const y0=h*.45,wh=.85,ww=.95;
    // a piece of the window, given along the wall (u), up, and out from it (n)
    const pb=(du,hh,dn,m,u,y,n,rot)=>{const me=fr?tbox(du,hh,dn,m,u,y,d/2+n,1):tbox(dn,hh,du,m,w/2+n,y,u,1);if(rot){if(fr)me.rotation.z=rot;else me.rotation.x=rot}D.F.add(me);return me};
    const tm=F("#e4e0d4");pb(ww+.24,.08,.14,tm,u0,y0-.08,.03);pb(ww+.2,.08,.1,tm,u0,y0+wh,.02);pb(.07,wh,.1,tm,u0-ww/2-.035,y0,.02);pb(.07,wh,.1,tm,u0+ww/2+.035,y0,.02);
    if(ws.broken){pb(ww,wh,.04,F("#0c0d0e"),u0,y0,.005);pb(.3,.22,.03,rec.glass,u0-ww/2+.16,y0+wh-.22,.012,.5);pb(.22,.26,.03,rec.glass,u0+ww/2-.12,y0,.012,-.4)}
    else{pb(ww,wh,.04,rec.glass,u0,y0,.005);pb(.04,wh,.05,tm,u0,y0,.012);pb(ww,.04,.05,tm,u0,y0+wh/2-.02,.012)}
    const R=srng(hashStr(k+":"+bi+":"+i));for(let b=0;b<ws.board;b++)pb(ww+.42,.17,.06,F(b%2?"#8a6a44":"#7a5c3a","planks"),u0,y0+.1+b*.3,.07,(R()-.5)*.5)})}
function fadeMats(o,f){const tr=f<.995;for(const k in o){const m=o[k];if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true}m.opacity=f;m.depthWrite=f>.5}}
// does this building stand between the camera and someone? (the camera looks down along -1,-1,-1)
function behind(m,o){if(!o||o.loc!==W.loc)return false;const H=m.H-1;const lo=Math.max(0,m.x0-o.x,m.z0-o.z),hi=Math.min(H,m.x1-o.x,m.z1-o.z);return lo<hi}
function housesFrame(dt){const pl=S.player;const k=W.loc;const xr=W.xray??(k===campK());const home=k===campK()?homeBld():null;const sp=dt*7;
  for(const m of W.bm){const inside=pl.loc===k&&pl.x>m.x0&&pl.x<m.x1&&pl.z>m.z0&&pl.z<m.z1;const cut=!!(xr||inside);const hid=!cut&&behind(m,pl);
    const tf=cut?0:hid?.22:1,tb=hid?.22:1;const f1=m.fF+clamp(tf-m.fF,-sp,sp),b1=m.fB+clamp(tb-m.fB,-sp,sp);
    if(f1!==m.fF){m.fF=f1;fadeMats(m.own.F,f1)}if(b1!==m.fB){m.fB=b1;fadeMats(m.own.B,b1)}
    m.full.visible=m.top.visible=m.fF>.01;m.stub.visible=cut;m.cut=cut;
    m.lived=!!home&&(m.r===home||S.people.some(p=>p.loc===k&&p.status==="member"&&bldAt(k,p.x,p.z)===m.r))}}
// ---------- cars ----------
function carModel(c){const g=new T3.Group();const col=c.c||"#7a2a22",cop=!!c.cop;const u={wheels:[],lights:[]};g.userData=u;const add=m=>{g.add(m);return m};
  add(box(1.86,.48,4.1,col,0,.3,0));add(box(1.82,.16,1.15,col,0,.78,1.43));add(box(1.82,.16,.8,col,0,.78,-1.62));add(box(1.72,.56,2.05,"#1e262e",0,.78,-.18));add(box(1.74,.08,1.85,cop?"#e8e8e2":col,0,1.32,-.2));
  for(const x of [-.84,.84])for(const z of [.82,-1.18])add(box(.06,.56,.1,col,x,.78,z));
  for(const x of [-.94,.94])for(const z of [.75,-.45])add(box(.02,.4,.02,"#1a1a1c",x,.34,z));
  add(box(1.92,.2,.18,"#2a2a2c",0,.26,2.08));add(box(1.92,.2,.18,"#2a2a2c",0,.26,-2.08));
  for(const x of [-.6,.6]){const h=add(box(.36,.14,.05,"#e8e2c4",x,.58,2.06));h.userData={lit:"#fff6c8",off:"#e8e2c4"};u.lights.push(h);const t=add(box(.34,.14,.05,"#8a1e18",x,.58,-2.06));t.userData={lit:"#ff4a30",off:"#8a1e18"};u.lights.push(t)}
  for(const [x,z] of [[-.95,-1.3],[.95,-1.3],[-.95,1.3],[.95,1.3]]){const w=new T3.Group();w.position.set(x,.36,z);const t=new T3.Mesh(keep("tire",()=>new T3.CylinderGeometry(.36,.36,.26,12)),mat("#161618"));t.rotation.z=Math.PI/2;t.castShadow=true;
    const hc=new T3.Mesh(keep("hub",()=>new T3.CylinderGeometry(.2,.2,.27,6)),mat("#8a8c8e"));hc.rotation.z=Math.PI/2;w.add(t,hc);g.add(w);u.wheels.push(w)}
  if(cop){add(box(1.88,.36,1.7,"#141418",0,.36,-.3));add(box(1.2,.12,.32,"#222224",0,1.4,-.2));add(box(.5,.13,.28,"#d83a30",-.32,1.45,-.2));add(box(.5,.13,.28,"#3a62d8",.32,1.45,-.2))}
  return g}
function carsFrame(dt,now){const cs=carsAt(W.loc);for(let i=0;i<W.cars.length;i++){const m=W.cars[i],c=cs[i];if(!m||!c)continue;const dx=c.x-m.position.x,dz=c.z-m.position.z;const d=Math.hypot(dx,dz);
    if(d>0&&d<2){const f=Math.sin(c.rot)*dx+Math.cos(c.rot)*dz>0?1:-1;for(const w of m.userData.wheels)w.rotation.x+=f*d/.36}m.position.x=c.x;m.position.z=c.z;m.rotation.y=c.rot;
    // a car alarm going off flashes the lights
    const on=c.alarmT!=null&&S.t-c.alarmT<25&&Math.floor(now/300)%2===0;if(m.userData.on!==on){m.userData.on=on;for(const l of m.userData.lights)l.material=on?bmat(l.userData.lit):mat(l.userData.off)}}}
// ---------- trees: pines and broadleaf; the ones inside the place come down when you cut them ----------
function treeModel(t,R){const [x,z,s,pine]=t;const g=new T3.Group();g.position.set(x,0,z);const pv=new T3.Group();g.add(pv);
  if(pine){pv.add(cyl(.12*s,.19*s,1.2*s,"#4a3424",0,0,0,6));const cs=["#2b4829","#31522d","#284426","#36592f"];
    for(let i=0;i<3;i++){const r=(1.5-i*.36)*s,hh=(1.75-i*.22)*s;const m=new T3.Mesh(keep("pine",()=>lowpoly(new T3.ConeGeometry(1,1,8))),mat(cs[(i+((R()*4)|0))%4]));m.scale.set(r,hh,r);m.position.y=(.85+i*.78)*s+hh/2;m.rotation.y=R()*6;m.castShadow=true;m.receiveShadow=true;pv.add(m)}}
  else{pv.add(cyl(.13*s,.21*s,1.7*s,"#5a4434",0,0,0,6));const au=R()<.16;const cs=au?["#b8862a","#a8582a","#c89a3a","#9a6a2a"]:["#4a6a32","#567a3a","#3e5e2c","#5c7c38"];const n=3+((R()*2)|0);
    for(let i=0;i<n;i++){const r=(.7+R()*.35)*s;const m=new T3.Mesh(keep("leaves",()=>lowpoly(new T3.IcosahedronGeometry(1,0))),mat(cs[(R()*cs.length)|0]));m.scale.set(r,r*.85,r);const a=i/n*6.28+R();const o=i?.45*s:0;
      m.position.set(Math.cos(a)*o,(1.85+R()*.6+(i?0:.35))*s,Math.sin(a)*o);m.rotation.set(R()*3,R()*3,0);m.castShadow=true;m.receiveShadow=true;pv.add(m)}}
  return{g,pv}}
function stumpModel(s){const g=new T3.Group();g.add(cyl(.17*s,.22*s,.34,"#4a3424",0,0,0,7),cyl(.16*s,.16*s,.02,"#c8a878",0,.34,0,7));return g}
function logModel(s,len){const g=new T3.Group();const r=.17*s;const m=cyl(r,r*1.1,len,"#5a4432",0,0,0,7);m.rotation.x=Math.PI/2;m.position.set(0,r,.45+len/2);g.add(m);
  const e=cyl(r*.95,r*.95,.02,"#c8a878",0,0,0,7);e.rotation.x=Math.PI/2;e.position.set(0,r,.44);g.add(e);const b=box(.07,.07,.5,"#5a4432",0,0,0);b.position.set(r,r+.15,.45+len*.6);b.rotation.y=.7;g.add(b);return g}
function treeLog(T,ts){const s=T.t[2];if(!T.stump){T.stump=stumpModel(s);T.g.add(T.stump)}if(T.log){T.g.remove(T.log);clearGroup(T.log);T.log=null}
  if(ts.left>0){T.log=logModel(s,(1.2+1.4*s)*Math.max(.3,ts.left/T.n0));T.g.add(T.log)}}
// a tree that's been cut through falls over (the first time you see it); one already down is just a log and a stump
function treesSync(k,first){const P=place(k);for(const i in W.trees){const T=W.trees[i];const ts=P.trees&&P.trees[i];if(!ts||!ts.down)continue;
    if(T.state==="up"){T.g.rotation.y=ts.fall||0;if(first){T.state="down";T.pv.visible=false}else{T.state="fall";T.ft=0;T.pv.rotation.set(0,-(ts.fall||0),0)}}
    if(T.state!=="fall")treeLog(T,ts)}}
function treesFrame(dt,now){for(const i in W.trees){const T=W.trees[i];
    if(T.state==="fall"){T.ft+=dt;const p=Math.min(1,T.ft/1.5);T.pv.rotation.x=Math.PI/2*p*p;
      if(p>=1){T.state="down";T.pv.visible=false;const ts=place(W.loc).trees[i];treeLog(T,ts);const a=T.g.rotation.y,s=T.t[2];burst(T.g.position.x+Math.sin(a)*2.4*s,.3,T.g.position.z+Math.cos(a)*2.4*s,"#8a7a5a",14,2.6,2.4,1,.1);W.kick=Math.max(W.kick||0,.12)}}
    else if(T.state==="up"){const e=now-T.hit;T.pv.rotation.z=e<240?Math.sin(e/28)*.035*(1-e/240):0}}}
// ---------- the small stuff: bushes, rocks, grass, flowers, litter, poles. Only for looks: nothing here is in the way ----------
function propsFor(k,lay,L,town){const R=srng(hashStr(k+":props"));const gr=grid(k).a;const cars=carsAt(k);
  const ok=(x,z,r)=>{if(Math.abs(x)>SH+10||Math.abs(z)>SH+10)return false;for(const f of lay.foot)if(x>f[0]-r-1&&x<f[2]+r+1&&z>f[1]-r-1&&z<f[3]+r+3)return false;
    if(Math.abs(x)<3.2+r&&z>-1)return false;if(lay.lot&&Math.abs(x)<18+r&&z>4-r&&z<22+r)return false;if(lay.field&&x<r&&x>-24-r&&z>5-r&&z<23+r)return false;
    if(lay.fields&&x<-4+r&&x>-24-r&&z>9-r&&z<21.5+r)return false;if(lay.water&&x>SH-6-r)return false;if(L.kind==="road"&&z>-r&&z<12+r)return false;if(lay.canopy&&x>-r&&x<12+r&&z>-r&&z<8+r)return false;
    for(const c of cars)if(dist(c.x,c.z,x,z)<2.6+r)return false;if(Math.abs(x)<SH-.5&&Math.abs(z)<SH-.5&&gr[gc(z)*GN+gc(x)])return false;return true};
  const m4=new T3.Matrix4(),q=new T3.Quaternion(),e=new T3.Euler(),sc=new T3.Vector3(),ps=new T3.Vector3(),col=new T3.Color();
  const inst=(geo,n,put)=>{const im=new T3.InstancedMesh(geo,mat("#ffffff"),Math.max(1,n));let j=0;for(let i=0;i<n*5&&j<n;i++){const o=put(j);if(!o)continue;ps.set(o.x,o.y||0,o.z);e.set(o.rx||0,o.ry||0,o.rz||0);q.setFromEuler(e);sc.set(o.sx||1,o.sy||o.sx||1,o.sz||o.sx||1);m4.compose(ps,q,sc);im.setMatrixAt(j,m4);im.setColorAt(j,col.set(o.c));j++}
    im.count=j;im.castShadow=true;im.receiveShadow=true;W.deco.add(im);return im};
  const nb=Math.round(16+12*((SCENES[L.kind]||{}).tree||.5));const bush=[];for(let i=0;i<nb*8&&bush.length<nb;i++){const x=(R()*2-1)*(SH+6),z=(R()*2-1)*(SH+6);if(dist(x,z,0,4)<13||!ok(x,z,1.2))continue;bush.push([x,z,.5+R()*.5])}
  const bc=["#3e5e2c","#4a6a32","#567234","#5a6a30","#46602e"];
  inst(keep("leaves",()=>lowpoly(new T3.IcosahedronGeometry(1,0))),bush.length*3,j=>{const b=bush[(j/3)|0];if(!b)return null;const [x,z,s]=b;const o=j%3;const a=R()*6.28;const r=s*(o?.7:1);return{x:x+(o?Math.cos(a)*s*.7:0),y:r*.5,z:z+(o?Math.sin(a)*s*.7:0),sx:r,sy:r*.8,sz:r,ry:R()*3,c:bc[(R()*bc.length)|0]}});
  inst(keep("rock",()=>lowpoly(new T3.DodecahedronGeometry(1,0))),12,()=>{const x=(R()*2-1)*(SH+4),z=(R()*2-1)*(SH+4);if(!ok(x,z,.8))return null;const s=.25+R()*.5;return{x,y:s*.25,z,sx:s,sy:s*.6,sz:s*.85,ry:R()*3,rx:R()*.4,c:R()<.5?"#8a8680":"#77736c"}});
  const tc=["#5a7a3a","#6a8a40","#7a8a48","#4e6e32","#8a8a4a"];
  inst(keep("tuft",()=>lowpoly(new T3.ConeGeometry(.1,.42,3))),460,()=>{const x=(R()*2-1)*(SH+8),z=(R()*2-1)*(SH+8);if(!ok(x,z,0))return null;const s=.7+R()*.8;return{x,y:.2*s,z,sx:s,rz:(R()-.5)*.6,rx:(R()-.5)*.6,ry:R()*3,c:tc[(R()*tc.length)|0]}});
  inst(BG(.09,.09,.09),70,()=>{const x=(R()*2-1)*(SH+2),z=(R()*2-1)*(SH+2);if(!ok(x,z,0))return null;return{x,y:.12+R()*.08,z,c:["#e8e4d8","#e8d050","#b080c8","#e88a6a"][(R()*4)|0]}});
  // litter along the walls in town: barrels, tyres, boxes, bags
  if(town&&lay.b.length){for(let i=0,n=0;i<40&&n<9;i++){const r=lay.b[(R()*lay.b.length)|0];const sd=R();let x,z;if(sd<.4){x=r.x+(R()-.5)*(r.w-1);z=r.z-r.d/2-.75}else{x=r.x+(sd<.7?-1:1)*(r.w/2+.75);z=r.z+(R()-.5)*(r.d-1)}
      if(Math.abs(x)>SH-1||Math.abs(z)>SH-1||gr[gc(z)*GN+gc(x)])continue;n++;const t=R();let m;
      if(t<.3)m=cyl(.32,.32,.9,R()<.5?"#2a4a7a":"#8a3a22",x,0,z,10);else if(t<.5){m=new T3.Mesh(keep("tyre",()=>new T3.TorusGeometry(.32,.13,6,12)),mat("#1c1c1e"));m.rotation.x=Math.PI/2;m.position.set(x,.13,z)}
      else if(t<.78){m=box(.6,.45,.5,"#a88a5a",x,0,z);m.rotation.y=R()*3}else{m=new T3.Mesh(keep("bag",()=>lowpoly(new T3.IcosahedronGeometry(.32,0))),mat("#1e2420"));m.scale.set(1,.8,1.1);m.position.set(x,.25,z)}
      m.castShadow=true;W.deco.add(m)}}
  // the highway: telephone poles, and the jackknifed truck that started it all
  if(L.kind==="road"){for(let x=-SH-6;x<=SH+6;x+=14){W.deco.add(cyl(.12,.16,6.6,"#5a4a3a",x,0,13.4,6),box(.12,.12,1.8,"#5a4a3a",x,6.1,13.4))}for(const dz of [-.75,.75])W.deco.add(box(2*SH+14,.03,.03,"#1a1a1a",0,6.2,13.4+dz));
    const tr=new T3.Group();tr.add(tbox(2.5,2.6,11,tmat("#d4d2c8","metal"),0,1,0,3));for(const z of [-4.2,-3,3.6])for(const x of [-1.15,1.15]){const t=new T3.Mesh(keep("bigtire",()=>new T3.CylinderGeometry(.5,.5,.4,12)),mat("#161618"));t.rotation.z=Math.PI/2;t.position.set(x,.5,z);tr.add(t)}
    tr.position.set(SH+7,0,5);tr.rotation.y=.35;W.deco.add(tr);const cab=new T3.Group();cab.add(box(2.4,2.1,2.8,"#8a2a22",0,.6,0),box(2.2,.9,.06,"#1e262e",0,1.75,1.42),box(2.5,.3,.3,"#3a3a3c",0,.4,1.5));cab.position.set(SH+3.2,0,11.4);cab.rotation.y=-.75;W.deco.add(cab)}
  if(L.kind==="farm"){W.deco.add(box(.1,1.1,.1,"#5a4a3a",2.6,0,SH-3),box(.3,.25,.5,"#3a4a5a",2.6,1.1,SH-3))}}
// ---------- the things you build ----------
function bldModel(b){const g=new T3.Group();const o=b.opt||{};const t=b.type;
  if(t==="tent"){const cv=o.cover||"#5a6b3a";const s=new T3.Shape();s.moveTo(-1.4,0);s.lineTo(0,1.8);s.lineTo(1.4,0);s.lineTo(-1.4,0);const ge=new T3.ExtrudeGeometry(s,{depth:2.8,bevelEnabled:false});ge.translate(0,0,-1.4);const m=new T3.Mesh(ge,mat(cv));m.castShadow=true;m.receiveShadow=true;g.add(m);
    g.add(box(.08,2,.08,"#4a3a2a",0,0,1.45),box(.9,1.25,.03,shade(cv,.55),0,0,1.41));for(const z of [-1,1]){const r=box(.03,.03,1.5,"#c8c0a8",0,1.25,z*1.95);r.rotation.x=z*.85;g.add(r)}}
  else if(t==="cabin"){const wc=o.walls||"#8a6a48";g.add(tbox(5,2.6,4,tmat(wc,"boards"),0,0,0),roof(5,4,1.4,o.roof||"#5a3a2a",2.6,wc),box(.9,1.8,.06,"#4a3426",0,0,2.01),box(.8,.7,.06,"#2a3440",1.6,1.2,2.01),box(.8,.7,.06,"#2a3440",-1.6,1.2,2.01))}
  else if(t==="plot"){g.add(tbox(6,.14,4,tmat("#5a4028","soil"),0,0,0,3));const gr=Math.max(.05,b.grow||0);const ripe=b.grow>=1;
    for(let i=0;i<4;i++){g.add(box(5.6,.08,.32,"#4a3420",0,.14,-1.5+i));for(let x=-2.6;x<=2.61;x+=.65){const h=.12+gr*.75;const p=new T3.Mesh(keep("crop",()=>lowpoly(new T3.ConeGeometry(.16,1,5))),mat(ripe?"#b8a040":gr>.5?"#6a9a3a":"#5a8a3a"));p.scale.set(1,h,1);p.position.set(x,.2+h/2,-1.5+i);p.castShadow=true;g.add(p)}}}
  else if(t==="well"){for(const [x,z] of [[-.5,0],[.5,0]]){g.add(cyl(.42,.42,1.1,"#3a5a7a",x,0,z,12));for(const y of [.25,.8])g.add(cyl(.44,.44,.06,"#2a3a4a",x,y,z,12));g.add(cyl(.38,.38,.02,"#1a2a3a",x,1.1,z,12))}
    g.add(box(.1,1.9,.1,"#6a4a2a",-1,0,-.5),box(.1,1.9,.1,"#6a4a2a",1,0,-.5));const gt=box(2.2,.12,.25,"#8a8a88",0,1.75,-.5);gt.rotation.z=.08;g.add(gt)}
  else if(t==="fire"&&o.indoor){g.add(box(.9,.75,.7,"#2a2a2c",0,0,0),box(1,.06,.8,"#3a3a3c",0,.75,0),cyl(.09,.09,3.4,"#2a2a2c",0,.8,-.15,8));
    const f=box(.4,.22,.04,"#ff9a3a",0,.18,.36);f.material=bmat("#ff9a3a");f.userData.flame=true;g.add(f)}
  else if(t==="fire"){const sg=keep("stone",()=>lowpoly(new T3.DodecahedronGeometry(.22,0)));for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const s=new T3.Mesh(sg,mat(i%2?"#7a7a76":"#8a8682"));s.position.set(Math.cos(a)*.72,.12,Math.sin(a)*.72);s.rotation.set(i,i*2,0);s.castShadow=true;g.add(s)}
    for(let i=0;i<3;i++){const l=box(1.1,.14,.14,"#4a3020",0,.06,0);l.rotation.y=i*1.05;g.add(l)}g.add(cyl(.42,.42,.03,"#2a1a12",0,.02,0,10));
    const f=new T3.Mesh(keep("flame",()=>new T3.ConeGeometry(.32,.85,6)),bmat("#ff9a30"));f.position.y=.5;f.userData.flame=true;g.add(f);const f2=new T3.Mesh(keep("flame2",()=>new T3.ConeGeometry(.18,.55,5)),bmat("#ffd870"));f2.position.y=.42;f2.userData.flame=true;g.add(f2)}
  else if(t==="tower"){const wd="#7a5a3a";for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])g.add(box(.2,4,.2,"#6a4a2a",x,0,z));g.add(tbox(2.6,.2,2.6,tmat(wd,"planks"),0,4,0,1.5));for(const z of [1.3,-1.3])g.add(tbox(2.6,.8,.1,tmat(wd,"boards"),0,4.2,z,1.5));g.add(tbox(.1,.8,2.6,tmat(wd,"boards"),1.3,4.2,0,1.5));
    for(const x of [-1.2,1.2])for(const z of [-1.2,1.2])g.add(box(.08,1.4,.08,"#6a4a2a",x,4.2,z));g.add(roof(2.6,2.6,.8,"#5a4a3a",5.6));for(const x of [-.3,.3])g.add(box(.06,4.2,.06,wd,x,0,1.45));for(let y=.4;y<4.2;y+=.45)g.add(box(.6,.05,.05,wd,0,y,1.45));
    const br=box(2.4,.1,.1,"#5a3a22",0,1.6,-1);br.rotation.z=.9;g.add(br)}
  else if(t==="fence"){const R=srng(hashStr(String(b.id||"f")));for(let x=-3;x<=3.01;x+=1.2){g.add(box(.2,1.85,.2,"#6a4c30",x,0,0));const tip=new T3.Mesh(keep("tip",()=>new T3.ConeGeometry(.14,.3,4)),mat("#6a4c30"));tip.position.set(x,2,0);tip.rotation.y=Math.PI/4;tip.castShadow=true;g.add(tip)}
    for(const y of [.3,.85,1.4]){const p=tbox(6.3,.32,.08,tmat(R()<.5?"#8a6a48":"#7a5c3e","planks"),0,y,.14,1.5);p.rotation.z=(R()-.5)*.04;g.add(p)}
    if(R()<.6){const m=tbox(1.3,.9,.04,tmat("#8a8a86","metal"),(R()-.5)*3.5,.45,.2,1);m.rotation.z=(R()-.5)*.2;g.add(m)}const br=box(2.6,.1,.08,"#5a3e26",0,0,0);br.position.set(-1.5,.95,-.12);br.rotation.z=.55;g.add(br)}
  else if(t==="gate"){for(const x of [-1.45,1.45])g.add(box(.26,2.2,.26,"#5a4028",x,0,0),box(.34,.1,.34,"#4a3020",x,2.2,0));const gp=new T3.Group();
    for(const y of [.25,1.55])gp.add(tbox(2.6,.18,.08,tmat("#8a6a48","planks"),0,y,0,1.5));for(const x of [-1.2,-.4,.4,1.2])gp.add(tbox(.2,1.5,.06,tmat("#7a5c3e","planks"),x,.25,.07,1.5));
    const xb=tbox(2.9,.16,.06,tmat("#6a4c30","planks"),0,.88,-.07,1.5);xb.rotation.z=.48;gp.add(xb);for(const y of [.4,1.5])gp.add(box(.2,.08,.12,"#2a2a2c",-1.25,y,0));g.add(gp)}
  else if(t==="shed"){g.add(tbox(4,2.4,4,tmat("#8a7a62","boards"),0,0,0),tbox(4.4,.2,4.4,tmat(o.roof||"#7a7a78","metal"),0,2.4,0),box(1.4,1.9,.06,"#4a3426",0,0,2.01))}
  else if(t==="shop"){const wm=tmat("#7a6a52","boards");g.add(tbox(4,2.4,.2,wm,0,0,-1.9),tbox(.2,2.4,4,wm,-1.9,0,0),tbox(.2,2.4,4,wm,1.9,0,0),tbox(4.3,.2,4.3,tmat("#6a6a68","metal"),0,2.4,0),box(2.4,.9,.8,"#6a4a2a",0,0,-1));
    g.add(box(.5,.3,.3,"#5a5e62",-.5,.9,-1),box(.06,.5,.4,"#8a8c8e",.6,.9,-1),box(1.6,.8,.04,"#5a4a3a",0,1.3,-1.78))}
  else if(t==="clinic"){g.add(tbox(4,2.2,4,tmat("#e8e4d8","siding"),0,0,0),roof(4,4,1,"#d8d4c8",2.2,"#e8e4d8"),box(1,.25,.06,"#c03030",0,1.5,2.01),box(.25,1,.06,"#c03030",0,1.12,2.01))}
  else if(t==="coop"){g.add(tbox(3,1.2,2,tmat("#8a6a48","boards"),0,0,0),roof(3,2,.6,"#6a3a2a",1.2,"#8a6a48"));for(let i=0;i<3;i++)g.add(box(.25,.25,.35,"#e8e4dc",-1+i,0,1.5),box(.08,.08,.08,"#c83a2a",-1+i,.25,1.62))}
  else if(t==="bench"){g.add(box(2,.12,.5,"#8a6a48",0,.45,0),box(.12,.45,.4,"#6a4a2a",-.8,0,0),box(.12,.45,.4,"#6a4a2a",.8,0,0))}
  else if(t==="garden"){g.add(box(2,.2,2,"#5a4028",0,0,0));for(let i=0;i<9;i++)g.add(box(.18,.4,.18,i%3?"#4a7a3a":o.color||"#d85a7a",-.6+(i%3)*.6,.2,-.6+Math.floor(i/3)*.6))}
  return g}
function drawBld(b){if(!W.ok||!W.bs)return;if(W.blds[b.id]){W.bs.remove(W.blds[b.id]);clearGroup(W.blds[b.id]);W.flames=W.flames.filter(f=>f.id!==b.id);delete W.blds[b.id]}if(b.loc!==W.loc||b.gone)return;const g=bldModel(b);
  if(!b.done){const frac=b.prog/BUILDS[b.type].hrs;g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.2+frac*.6;o.material.depthWrite=false}});
    // stakes and string where it's going up, and whatever's been brought for it so far
    const [w,d]=BUILDS[b.type].size;for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])g.add(box(.1,.9,.1,"#c8a868",x*w/2,0,z*d/2));for(const z of [-1,1])g.add(box(w,.03,.03,"#e8e0c8",0,.8,z*d/2));for(const x of [-1,1])g.add(box(.03,.03,d,"#e8e0c8",x*w/2,.8,0));
    const got=b.got||{};const nw=Math.min(10,Math.round((got.wood||0)*2));for(let i=0;i<nw;i++){const p=box(1.4,.1,.22,i%2?"#9a7a52":"#8a6a44",w/2+.9,.1*Math.floor(i/2),d/2-.3+(i%2)*.26);g.add(p)}
    const ns=Math.min(6,got.scrap||0);for(let i=0;i<ns;i++)g.add(box(.3,.18,.3,"#7a7c7e",-w/2-.7+(i%2)*.35,.18*Math.floor(i/2),d/2-.2))}
  g.position.set(b.x,0,b.z);g.rotation.y=(b.rot||0)*Math.PI/2;g.userData.bld=b.id;W.bs.add(g);W.blds[b.id]=g;g.traverse(o=>{if(o.userData.flame)W.flames.push({m:o,id:b.id})})}
function onBld(b){drawBld(b)}
// ---------- what's inside a building ----------
function furnModel(f){const g=new T3.Group();
  if(f.t==="bed"){g.add(box(1,.3,1.9,"#5a4a3a",0,0,0),box(.94,.16,1.84,"#c8c0b0",0,.3,0),box(.7,.1,.4,"#e8e4dc",0,.46,-.65),box(.96,.06,1.1,"#5a6a8a",0,.47,.35),box(1.04,.75,.08,"#4a3a2a",0,0,-.95))}
  else if(f.t==="table"){g.add(box(1.6,.08,1,"#7a5a3a",0,.72,0));for(const [x,z] of [[-.7,-.4],[.7,-.4],[-.7,.4],[.7,.4]])g.add(box(.08,.72,.08,"#5a4028",x,0,z));for(const z of [-.85,.85])g.add(box(.45,.45,.4,"#6a4a30",0,0,z),box(.45,.5,.06,"#6a4a30",0,.45,z+(z>0?.17:-.17)));g.add(box(.2,.12,.2,"#d8d0c0",.3,.8,.1))}
  else if(f.t==="rug"){const m=new T3.Mesh(new T3.PlaneGeometry(f.w,f.d),mat("#7a3a32"));m.rotation.x=-Math.PI/2;m.position.y=.07;m.receiveShadow=true;g.add(m);const b=new T3.Mesh(new T3.PlaneGeometry(f.w-.3,f.d-.3),mat("#8a5a3a"));b.rotation.x=-Math.PI/2;b.position.y=.075;g.add(b)}
  else if(f.t==="pew"){g.add(box(f.w,.45,.5,"#5a3e2a",0,0,0),box(f.w,.6,.08,"#5a3e2a",0,.45,.22))}
  else if(f.t==="altar"){g.add(box(2,1,.8,"#e0d8c8",0,0,0),box(2.1,.06,.9,"#c8b890",0,1,0),box(.1,.5,.1,"#c8a848",-.6,1.06,0),box(.1,.5,.1,"#c8a848",.6,1.06,0))}
  else if(f.t==="shelf"){g.add(box(.1,1.7,f.len,"#55555a",0,0,0));for(let y=0;y<1.7;y+=.42)g.add(box(.64,.05,f.len,"#76767c",0,y,0));for(const z of [-f.len/2,f.len/2])g.add(box(.64,1.7,.06,"#55555a",0,0,z));
    for(const s of [-1,1])for(let y=.05;y<1.6;y+=.42)for(let z=-f.len/2+.25;z<f.len/2-.15;z+=.34)if(Math.random()<.5)g.add(box(.22,.14+Math.random()*.16,.24,pick(["#a8583a","#3a6a8a","#c8a848","#5a8a4a","#d8d0c0","#8a3a5a"]),s*.18,y,z))}
  else if(f.t==="counter"){g.add(box(2.5,1,.7,"#6a5040",0,0,0),box(2.6,.05,.8,"#a89a88",0,1,0),box(.5,.3,.4,"#3a3a3a",.6,1.05,0))}
  else if(f.t==="desk"){g.add(box(1.1,.06,.7,"#a08060",0,.65,0));for(const [x,z] of [[-.5,-.3],[.5,-.3],[-.5,.3],[.5,.3]])g.add(box(.05,.65,.05,"#4a4a4a",x,0,z));g.add(box(.4,.4,.4,"#4a5a6a",0,0,.55),box(.3,.04,.22,"#e8e4d8",-.2,.71,0))}
  else if(f.t==="hay"){g.add(tbox(1.2,.6,.8,tmat("#c8a858","dirt"),0,0,0,1))}
  else if(f.t==="wall"){g.add(tbox(.12,1.5,f.d,tmat(f.c||"#c8b898","plaster"),0,0,0))}
  else if(f.t==="stand"){g.add(box(.45,.55,.4,"#6a4a30",0,0,0),box(.12,.3,.12,"#d8c890",0,.55,0),box(.26,.16,.26,"#e8dcb0",0,.85,0))}
  g.position.set(f.x,0,f.z);return g}
// the cupboards, wardrobes and shelves you search, and the sheds out in the yard
function contModel(c){const g=new T3.Group();const K=c.k;
  if(c.vis==="shed"){g.add(tbox(3,2.2,3,tmat("#7a6a52","boards"),0,0,0),tbox(3.5,.16,3.5,tmat("#8a8a88","metal"),0,2.2,0),box(1,1.8,.06,"#4a3426",0,0,1.51),box(.08,.08,.06,"#c8c0a0",.35,.9,1.55))}
  else if(K==="kitchen"){g.add(box(1.5,.9,.7,"#8a7a62",0,0,0),box(1.56,.06,.76,"#c8c4b8",0,.9,0),box(.5,.04,.4,"#9aa0a4",-.3,.92,0),box(.02,.7,.02,"#4a3a2a",0,.1,.36),box(.04,.3,.04,"#9aa0a4",-.3,.94,-.25))}
  else if(K==="closet"||K==="barn"){g.add(box(1.3,1.9,.6,K==="barn"?"#7a5a3a":"#6a4a30",0,0,0),box(.02,1.7,.02,"#3a2a1a",0,.1,.31),box(.05,.12,.04,"#c8b070",-.1,.95,.32),box(.05,.12,.04,"#c8b070",.1,.95,.32))}
  else if(K==="gunsafe"||K==="armory"){g.add(box(1,1.8,.7,"#3a3e42",0,0,0),cyl(.08,.08,.04,"#a8a8a0",0,1.1,.36,10),box(.06,.3,.06,"#a8a8a0",.3,.85,.37));g.children[1].rotation.x=Math.PI/2}
  else{g.add(box(1.4,1.6,.55,"#5a5c60",0,0,0));for(let y=.05;y<1.6;y+=.5)g.add(box(1.36,.04,.52,"#7a7c80",0,y,0));for(let y=.1;y<1.5;y+=.5)for(let x=-.5;x<=.5;x+=.33)if(Math.random()<.6)g.add(box(.24,.2+Math.random()*.12,.3,pick(["#a8583a","#3a6a8a","#c8a848","#5a8a4a","#d8d0c0"]),x,y,0))}
  g.position.set(c.x,0,c.z);g.rotation.y=-(c.rot||0);g.userData.cont=c.id;return g}
// ---------- people and the dead ----------
// built from boxes around a hip: legs, and a body (torso, arms, head) that can bend on its own. Tools hide in the right hand.
function figModel(look,kind,gear,you,id){const g=new T3.Group();const s=kind==="kid"?.72:1;const dead_=kind==="walker";const R=srng(hashStr(String(id||"x")));
  const skin=look.skin,top=dead_?shade(look.top,.58):look.top,pants=dead_?shade(look.pants,.6):look.pants;
  const mk=(w,h,d,c,y,x,z,m)=>{const me=new T3.Mesh(BG(w*s,h*s,d*s),m||mat(c));me.position.set((x||0)*s,y*s,(z||0)*s);me.castShadow=true;return me};
  const hip=new T3.Group();hip.position.y=.9*s;g.add(hip);const legL=new T3.Group(),legR=new T3.Group();legL.position.x=-.12*s;legR.position.x=.12*s;
  for(const L of [legL,legR])L.add(mk(.19,.8,.21,pants,-.4),mk(.2,.11,.3,dead_?"#2e2a26":"#2a2420",-.84,0,.04));hip.add(legL,legR);
  const body=new T3.Group();hip.add(body);body.add(mk(.5,.62,.28,top,.33),mk(.52,.08,.3,"#2a2622",.04),mk(.13,.1,.13,skin,.68));
  const armL=new T3.Group(),armR=new T3.Group();armL.position.set(-.33*s,.6*s,0);armR.position.set(.33*s,.6*s,0);
  const bare=dead_&&R()<.5;armL.add(mk(.14,.6,.16,top,-.28),mk(.12,.13,.13,skin,-.64));armR.add(mk(.14,.6,.16,bare?shade(skin,.9):top,-.28),mk(.12,.13,.13,skin,-.64));body.add(armL,armR);
  const head=new T3.Group();head.position.y=.86*s;body.add(head);const hm=new T3.Mesh(SG(.165*s),mat(skin));hm.castShadow=true;head.add(hm);
  if(look.hair&&!dead_){const h=new T3.Mesh(keep("hair"+s,()=>new T3.SphereGeometry(.177*s,10,6,0,Math.PI*2,0,Math.PI*.55)),mat(look.hair));h.position.y=.02*s;head.add(h);if(look.long)head.add(mk(.3,.34,.08,look.hair,-.14,0,-.12))}
  if(look.hat){const h=new T3.Mesh(CG(.19*s,.1*s),mat(look.hat));h.position.y=.13*s;head.add(h)}
  let eyes=null;
  if(dead_){body.add(mk(.24,.2,.02,"",.42,.07,.145,mat("#4a1612")),mk(.14,.26,.02,"",.16,-.12,.145,mat("#3a120e")));head.add(mk(.12,.05,.03,"",-.07,0,.15,mat("#3a100c")));if(R()<.6)head.add(mk(.2,.05,.2,"",.13,.02,-.02,mat("#3a3632")));
    eyes=new T3.Group();for(const x of [-.06,.06])eyes.add(mk(.045,.03,.02,"",.03,x,.155,bmat("#e8f070")));eyes.visible=false;head.add(eyes)}
  if(you)body.add(mk(.36,.42,.16,"#4a4a3a",.34,0,-.22),mk(.3,.12,.12,"#3a3a2e",.6,0,-.21));
  // what they work with, held in the right hand, and what they carry in both arms
  const tools={};if(!dead_){const tg=()=>{const q=new T3.Group();q.position.y=-.66*s;q.visible=false;armR.add(q);return q};
    tools.axe=tg();tools.axe.add(mk(.05,.78,.05,"#7a5a36",-.32),mk(.05,.14,.24,"#8a9096",-.66,0,.06));
    tools.hammer=tg();tools.hammer.add(mk(.045,.36,.045,"#6a4a2a",-.16),mk(.07,.07,.2,"#5a5e62",-.32,0,.03));
    tools.shovel=tg();tools.shovel.add(mk(.05,1,.05,"#7a5a36",-.42),mk(.24,.3,.03,"#6a6e72",-.98));
    tools.bucket=tg();tools.bucket.add(mk(.24,.26,.24,"#7a8a96",-.2));
    const logs=new T3.Group();logs.position.set(0,.32*s,.36*s);logs.visible=false;body.add(logs);tools.logs=logs;for(let i=0;i<3;i++){const l=new T3.Mesh(CG(.09*s,.95*s),mat(i%2?"#6a4a32":"#5a4030"));l.rotation.z=Math.PI/2;l.position.set(0,(i===2?.15:0)*s,(i===1?.15:i===2?.07:0)*s);l.castShadow=true;logs.add(l)}
    const crate=new T3.Group();crate.position.set(0,.3*s,.36*s);crate.visible=false;body.add(crate);tools.crate=crate;crate.add(mk(.46,.3,.32,"#8a6a42",0))}
  let gunHand=null,gunBack=null;
  if(gear&&GUNS[gear]){const dark="#24272a",wood="#5a3e26";gunHand=new T3.Group();armR.add(gunHand);
    if(gear==="pistol"){gunHand.add(mk(.07,.22,.12,dark,0));gunHand.position.set(0,-.78*s,.02*s)}
    else{const long=()=>{const q=new T3.Group();q.add(mk(.06,.62,.07,dark,-.12),mk(.09,.3,.1,wood,.3));if(gear==="shotgun")q.add(mk(.08,.16,.09,wood,-.2));return q};
      gunHand.add(long());gunHand.position.set(0,-.98*s,.02*s);gunHand.visible=false;gunBack=long();gunBack.position.set(0,.36*s,-.19*s);gunBack.rotation.z=.7;body.add(gunBack)}}
  const sh=new T3.Mesh(keep("shadow",()=>new T3.PlaneGeometry(1.1,1.1)),W.blobM);sh.rotation.x=-Math.PI/2;sh.position.y=.025;sh.scale.setScalar(s);g.add(sh);
  g.userData={hip,body,head,legL,legR,armL,armR,gunHand,gunBack,gear:gear||"",ph:R()*6,seed:R()*6,tools,tool:null,eyes,kind,s,by:.9*s,blob:sh,spd:0};return g}
// four legs (or two), a body, a neck you can lower to graze
function animalModel(kind){const g=new T3.Group();const u={kind,legs:[],ph:rf()*6,seed:rf()*6,spd:0};g.userData=u;const mk=(w,h,d,c,x,y,z)=>{const m=new T3.Mesh(BG(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;return m};
  const B=new T3.Group();g.add(B);u.body=B;const leg=(x,y,z,w,l,c,hc)=>{const L=new T3.Group();L.position.set(x,y,z);B.add(L);L.add(mk(w,l,w,c,0,-l/2,0));if(hc)L.add(mk(w*1.1,.07,w*1.3,hc,0,-l,0));u.legs.push(L)};
  if(kind==="deer"){u.by=.92;u.lie=.24;u.stride=1.6;B.add(mk(.44,.44,1.1,"#8a6442",0,0,0),mk(.36,.14,.86,"#c8b090",0,-.2,0),mk(.12,.14,.08,"#f0ece4",0,.12,-.58));
    const nk=new T3.Group();nk.position.set(0,.12,.46);B.add(nk);nk.add(mk(.18,.6,.2,"#8a6442",0,.26,.06));u.neck=nk;u.nx=.45;const hd=new T3.Group();hd.position.set(0,.55,.1);nk.add(hd);u.head=hd;
    hd.add(mk(.2,.2,.34,"#7a5838",0,0,.1),mk(.1,.08,.08,"#2a2420",0,-.02,.29),mk(.05,.14,.1,"#7a5838",-.1,.14,-.02),mk(.05,.14,.1,"#7a5838",.1,.14,-.02));if(rf()<.5)for(const x of [-.07,.07])hd.add(mk(.03,.3,.03,"#d8c8a8",x,.25,0),mk(.03,.03,.16,"#d8c8a8",x*1.6,.36,.03));
    for(const [x,z] of [[-.15,.4],[.15,.4],[-.15,-.4],[.15,-.4]])leg(x,-.15,z,.09,.78,"#6a4a30","#2a2420")}
  else if(kind==="turkey"){u.by=.42;u.lie=.2;u.stride=.5;B.add(mk(.38,.36,.46,"#3a2c22",0,0,0),mk(.3,.2,.3,"#4a3a2a",0,.12,.1));const fan=new T3.Mesh(new T3.CircleGeometry(.44,10,0,Math.PI),dmat("#5a4030"));fan.position.set(0,.04,-.26);B.add(fan);
    const fb=new T3.Mesh(new T3.CircleGeometry(.3,10,0,Math.PI),dmat("#c8b8a0"));fb.position.set(0,.04,-.255);B.add(fb);const hd=new T3.Group();hd.position.set(0,.16,.22);B.add(hd);u.head=hd;
    hd.add(mk(.08,.3,.08,"#9a8a7a",0,.12,0),mk(.1,.1,.13,"#c8b8a8",0,.3,.04),mk(.04,.1,.03,"#c8302a",0,.22,.1));for(const x of [-.08,.08])leg(x,-.16,0,.04,.28,"#9a7a5a")}
  else{u.by=.17;u.lie=.1;u.stride=.6;B.add(mk(.2,.2,.32,"#8a7a62",0,0,0),mk(.08,.08,.06,"#ece8e0",0,.05,-.18));const hd=new T3.Group();hd.position.set(0,.1,.17);B.add(hd);u.head=hd;
    hd.add(mk(.15,.14,.16,"#8a7a62",0,0,.02),mk(.04,.22,.06,"#7a6a52",-.04,.16,-.03),mk(.04,.22,.06,"#7a6a52",.04,.16,-.03));for(const [x,z] of [[-.06,.1],[.06,.1],[-.07,-.1],[.07,-.1]])leg(x,-.06,z,.06,.12,"#7a6a52")}
  B.position.y=u.by;const sh=new T3.Mesh(keep("shadow",()=>new T3.PlaneGeometry(1.1,1.1)),W.blobM);sh.rotation.x=-Math.PI/2;sh.position.y=.025;sh.scale.setScalar(kind==="deer"?1.3:kind==="turkey"?.6:.4);g.add(sh);u.blob=sh;return g}
function setTool(u,k){if(u.tool===k)return;for(const n in u.tools)u.tools[n].visible=n===k;u.tool=k}
function syncFigs(dt,now){if(!W.ok||!S)return;const k=W.loc;const pl=S.player;const want=W._want||(W._want=new Set());want.clear();const dark=darkness();
  const ents=W._ents||(W._ents=[]);ents.length=0;if(pl.loc===k&&pl.ko<=0)ents.push(pl);
  for(const p of S.people)if(p.loc===k&&p.status!=="left"&&p.status!=="dead"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside))ents.push(p);
  for(const w of S.walkers)if(w.loc===k)ents.push(w);for(const a of S.animals||[])if(a.loc===k&&!a.gone)ents.push(a);
  W.blobM.opacity=.16+dark*.24;
  for(const o of ents){const animal=o.id[0]==="a"&&!!ANIMALS[o.k];const kind=animal?"animal":o.id==="you"?"adult":o.id[0]==="w"?"walker":o.kid?"kid":"adult";want.add(o.id);
    const gear=kind==="walker"||animal?"":(o.id==="you"?pl.gun:o.gun)||"";let f=W.figs[o.id];if(f&&f.userData.gear!==undefined&&!animal&&f.userData.gear!==gear){W.dyn.remove(f);f=null}
    if(!f){f=animal?animalModel(o.k):figModel(o.look,kind,gear,o.id==="you",o.id);f.position.set(o.x,0,o.z);f.rotation.y=o.dir||0;W.dyn.add(f);W.figs[o.id]=f}
    const u=f.userData;const px=f.position.x,pz=f.position.z;const a_=Math.min(1,dt*12);f.position.x+=(o.x-px)*a_;f.position.z+=(o.z-pz)*a_;
    // the walk cycle follows how far they actually moved, so it never runs faster than their feet
    const moved=Math.hypot(f.position.x-px,f.position.z-pz);u.spd=lerp(u.spd,dt>0?moved/dt:0,Math.min(1,dt*10));
    const dir=o.sleep&&o.inBed?0:o.dir??0;let dr=dir-f.rotation.y;while(dr>Math.PI)dr-=Math.PI*2;while(dr<-Math.PI)dr+=Math.PI*2;f.rotation.y+=dr*Math.min(1,dt*9);
    if(animal)poseAnimal(f,o,dt,now,moved);else poseFig(f,o,kind,dt,now,moved,dark)}
  for(const id in W.figs)if(!want.has(id)){W.dyn.remove(W.figs[id]);delete W.figs[id]}}
function poseFig(f,o,kind,dt,now,moved,dark){const u=f.userData;const s=u.s;const t=now/1000;
  u.hip.position.y=u.by;u.hip.rotation.x=0;u.body.rotation.set(0,0,0);u.head.rotation.set(0,0,0);u.legL.rotation.set(0,0,0);u.legR.rotation.set(0,0,0);u.armL.rotation.set(0,0,0);u.armR.rotation.set(0,0,0);f.position.y=0;f.rotation.z=0;
  let tool=null;
  if(o.dead){u.hip.rotation.x=Math.PI/2;u.hip.position.y=.17;u.armL.rotation.x=-2.6;u.armR.rotation.x=-2.9;u.armL.rotation.z=.3;u.head.rotation.y=.8;if(u.eyes)u.eyes.visible=false;u.blob.visible=false;setTool(u,null);bleed(f,o,now);return}
  u.blob.visible=true;u.blob.position.y=.025;
  if(o.sleep&&o.tx==null&&!o.inside){u.hip.rotation.x=-Math.PI/2;u.hip.position.y=o.inBed?.62:.2;setTool(u,null);if(u.gunHand)u.gunHand.visible=false;return}
  const walking=u.spd>.25;if(walking)u.ph+=Math.min(moved/(1.3*s)*Math.PI*2,dt*20);const amp=walking?Math.min(.7,.22+u.spd*.1):0;const sw=Math.sin(u.ph)*amp;
  u.legL.rotation.x=sw;u.legR.rotation.x=-sw;u.armL.rotation.x=-sw*.8;u.armR.rotation.x=sw*.8;if(walking)u.hip.position.y=u.by+Math.abs(Math.cos(u.ph))*.035*s;
  if(kind==="walker"){poseWalker(f,o,u,t,sw,walking,dark);u.blob.position.y=.025-f.position.y;return}
  // over a car or a wall section: a scramble
  if(o.climb===true&&walking){f.position.y=.45+Math.abs(Math.sin(u.ph*.5))*.25;u.armL.rotation.x=u.armR.rotation.x=-1.6;u.legL.rotation.x=-.9;u.legR.rotation.x=.4;u.body.rotation.x=.35}
  const an=o.grabbed?"grabbed":o.aim&&now-o.aim<700?"aim":o.anim;let gunUp=false;
  switch(an){
    case"chop":{tool="axe";const cyc=t*1.5+u.seed,c=cyc%1;const a=c<.62?-.6-2.1*ease(c/.62):c<.74?-2.7+2.1*((c-.62)/.12):-.6;u.armL.rotation.x=u.armR.rotation.x=a;u.armL.rotation.z=-.28;u.armR.rotation.z=.28;u.body.rotation.x=.08+(c>=.62&&c<.82?.25:0);
      if(c>=.72&&u.hit!==Math.floor(cyc)){u.hit=Math.floor(cyc);chips(f,o,now)}break}
    case"hammer":{tool="hammer";const c=Math.sin(t*9+u.seed);u.armR.rotation.x=-1.25-Math.max(0,c);u.armL.rotation.x=-.85;u.armL.rotation.z=-.2;u.body.rotation.x=.25;u.hip.position.y=u.by-.05*s;u.legL.rotation.x=-.3;u.legR.rotation.x=.22;break}
    case"dig":{tool="shovel";const c=Math.sin(t*3+u.seed);u.body.rotation.x=.3+c*.15;u.armR.rotation.x=-.75+c*.35;u.armL.rotation.x=-.95+c*.35;u.armL.rotation.z=-.3;break}
    case"carry":{const h=o.hold;tool=h?(h.k==="wood"?"logs":"crate"):"bucket";if(h){u.armL.rotation.x=u.armR.rotation.x=-1.15;u.armL.rotation.z=-.22;u.armR.rotation.z=.22}else{u.armR.rotation.x=.08;u.armR.rotation.z=.12}break}
    case"push":{u.body.rotation.x=.55;u.armL.rotation.x=u.armR.rotation.x=-1.35;u.hip.position.y=u.by-.06*s;if(S.push&&S.push.go){u.ph+=dt*6;const q=Math.sin(u.ph)*.45;u.legL.rotation.x=q-.3;u.legR.rotation.x=-q-.3}else{u.legL.rotation.x=-.35;u.legR.rotation.x=.3}break}
    case"guard":{u.head.rotation.y=Math.sin(t*.6+u.seed)*.75;if(u.gunHand){gunUp=true;u.armR.rotation.x=-.55;u.armL.rotation.x=-1.05;u.armL.rotation.z=-.55}else{u.armL.rotation.x=u.armR.rotation.x=-.35;u.armL.rotation.z=-.5;u.armR.rotation.z=.5}break}
    case"stir":{u.body.rotation.x=.2;u.armR.rotation.x=-.95+Math.sin(t*4)*.2;u.armR.rotation.z=Math.cos(t*4)*.25;u.armL.rotation.x=-.5;break}
    case"tend":{u.hip.position.y=u.by-.42*s;u.legL.rotation.x=-1.45;u.legR.rotation.x=.25;u.body.rotation.x=.35;u.armR.rotation.x=-.9+Math.sin(t*3)*.25;u.armL.rotation.x=-.7;break}
    case"aim":{gunUp=!!u.gunHand;u.armR.rotation.x=-1.5;u.armL.rotation.x=-1.35;u.armL.rotation.z=-.35;break}
    case"grabbed":{u.body.rotation.x=-.25+Math.sin(t*20)*.05;u.armL.rotation.x=u.armR.rotation.x=-1.45+Math.sin(t*17)*.2;f.rotation.z=Math.sin(t*13)*.06;break}
    default:if(o.busyTalk)u.armR.rotation.x=-.5+Math.sin(t*5)*.2}
  if(u.gunHand){u.gunHand.visible=gunUp||!u.gunBack;if(u.gunBack)u.gunBack.visible=!gunUp}
  setTool(u,tool);u.blob.position.y=.025-f.position.y}
// the dead: hunched, one leg dragging, reaching. Faster and lower when they've seen you; pounding on a door; eyes in the dark
function poseWalker(f,o,u,t,sw,walking,dark){const st=o.st||"idle";if(u.eyes)u.eyes.visible=dark>.35;
  u.legL.rotation.x=sw*1.1;u.legR.rotation.x=-sw*.45;u.body.rotation.x=.3;u.head.rotation.z=.32*Math.sin(u.seed*3);u.head.rotation.x=-.25;f.rotation.z=walking?Math.sin(u.ph*.5)*.1:Math.sin(t*.7+u.seed)*.04;
  const reach=st==="hunt"?-1.62:-1.32;u.armL.rotation.x=reach+Math.sin(t*1.7+u.seed)*.12;u.armR.rotation.x=reach-.12+Math.cos(t*1.5+u.seed)*.12;u.armL.rotation.z=-.08;u.armR.rotation.z=.1;
  if(st==="hunt"){u.body.rotation.x=.45;u.head.rotation.x=-.4}
  if(st==="bang"){const a=Math.sin(t*7),b=Math.sin(t*7+2.2);u.armL.rotation.x=-2.3+Math.max(0,a)*1.1;u.armR.rotation.x=-2.3+Math.max(0,b)*1.1;u.body.rotation.x=.2+Math.max(0,a)*.12}
  if(o.climb&&o.climb.until){const p=clamp(1-(o.climb.until-S.t)/2.5,0,1);f.position.y=Math.sin(p*Math.PI)*.75;u.body.rotation.x=.95;u.armL.rotation.x=u.armR.rotation.x=-2.4}
  if(o.stun&&S.t<o.stun){u.body.rotation.x=-.3;u.head.rotation.x=.4;u.armL.rotation.x=-.4+Math.sin(t*9)*.6;u.armR.rotation.x=-.2+Math.cos(t*8)*.6;u.armL.rotation.z=-.7;u.armR.rotation.z=.7}
  if(o.grab){u.body.rotation.x=.6;u.armL.rotation.x=u.armR.rotation.x=-1.75+Math.sin(t*15)*.12;u.armL.rotation.z=-.3;u.armR.rotation.z=.3;u.head.rotation.x=-.5;f.rotation.z=Math.sin(t*11)*.06}}
function poseAnimal(f,a,dt,now,moved){const u=f.userData;const t=now/1000;const B=u.body;B.position.y=u.by;B.rotation.set(0,0,0);if(u.neck)u.neck.rotation.x=u.nx;if(u.head){u.head.rotation.x=0}for(const L of u.legs)L.rotation.x=0;
  if(a.dead){B.rotation.z=1.45;B.position.y=u.lie;for(const L of u.legs)L.rotation.x=.3;u.blob.visible=false;bleed(f,a,now);return}u.blob.visible=true;
  const walking=u.spd>.15;if(walking)u.ph+=Math.min(moved/u.stride*Math.PI*2,dt*26);
  if(u.kind==="rabbit"){if(walking){B.position.y=u.by+Math.abs(Math.sin(u.ph*.5))*.2;B.rotation.x=-Math.cos(u.ph*.5)*.25}else if(a.graze)u.head.rotation.x=.3+Math.sin(t*6+u.seed)*.08;return}
  u.legs.forEach((L,i)=>{L.rotation.x=walking?Math.sin(u.ph+(i===0||i===3?0:Math.PI))*(a.flee?.75:.4):0});
  if(u.kind==="deer"){if(a.flee&&walking){B.rotation.x=Math.sin(u.ph)*.12;B.position.y=u.by+Math.abs(Math.sin(u.ph))*.12;u.neck.rotation.x=.15}else if(a.graze&&!walking)u.neck.rotation.x=2.1+Math.sin(t*2+u.seed)*.06}
  else{if(walking)B.rotation.z=Math.sin(u.ph)*.12;if(a.graze&&!walking)u.head.rotation.x=Math.max(0,Math.sin(t*3+u.seed))*.9}}
// ---------- blood, chips and dust ----------
function bleed(f,o,now){const u=f.userData;if(!u.pool){u.pool=new T3.Mesh(keep("pool",()=>new T3.PlaneGeometry(1.6,1.6)),W.poolM);u.pool.rotation.x=-Math.PI/2;u.pool.position.set(0,.03,u.kind?0:.45);f.add(u.pool);u.poolT=now;
    if(o.diedAt!=null&&S.t-o.diedAt<3)burst(f.position.x,.9,f.position.z,"#5a0e0a",10,1.6,2.2,.9,.07)}
  const p=Math.min(1,(now-u.poolT)/2500);u.pool.scale.setScalar(.25+.75*ease(p))}
function burst(x,y,z,c,n,sp,up,life,sz){if(!W.ok||W.parts.length>260)return;const ge=BG(1,1,1);for(let i=0;i<n;i++){const m=new T3.Mesh(ge,mat(c));const s=sz*(.6+Math.random()*.8);m.scale.setScalar(s);m.position.set(x,y,z);W.dyn.add(m);
    const a=Math.random()*6.28;W.parts.push({m,vx:Math.cos(a)*sp*(.3+Math.random()),vy:up*(.5+Math.random()),vz:Math.sin(a)*sp*(.3+Math.random()),life:life*(.7+Math.random()*.6),s})}}
function chips(f,o,now){const a=f.rotation.y;burst(f.position.x+Math.sin(a)*.9,.9,f.position.z+Math.cos(a)*.9,"#c8a878",3,1.6,1.8,.8,.06);const tr=o.order&&o.order.tree;if(tr!=null&&W.trees[tr])W.trees[tr].hit=now}
function partsFrame(dt){for(let i=W.parts.length-1;i>=0;i--){const p=W.parts[i];p.life-=dt;p.vy-=9*dt;const m=p.m;m.position.x+=p.vx*dt;m.position.y+=p.vy*dt;m.position.z+=p.vz*dt;
    if(m.position.y<.03){m.position.y=.03;p.vx*=.5;p.vz*=.5;p.vy=0}m.rotation.x+=dt*5;m.rotation.y+=dt*3;if(p.life<.3)m.scale.setScalar(p.s*Math.max(0,p.life/.3));if(p.life<=0){W.dyn.remove(m);W.parts.splice(i,1)}}}
// smoke: over burned buildings, from the chimney when the stove's lit, from a cookfire
function smokeFrame(dt){const src=W._smk||(W._smk=[]);src.length=0;for(const f of W.fx)src.push(f);
  const k=W.loc;const stove=S.blds.some(b=>b.loc===k&&b.done&&b.type==="fire"&&b.opt&&b.opt.indoor);for(const m of W.bm)if(m.chim&&stove&&m.lived)src.push({x:m.chim.x,z:m.chim.z,h:m.chim.y,w:.3,s:.32,c:"#9a9894",op:.35});
  for(const b of S.blds)if(b.loc===k&&b.done&&b.type==="fire"&&!(b.opt&&b.opt.indoor))src.push({x:b.x,z:b.z,h:1.1,w:.4,s:.28,c:"#8a8884",op:.3});
  W.smT=(W.smT||0)+dt;if(W.smT>.12&&src.length){W.smT=0;for(const f of src){if(Math.random()<.5)continue;const m=new T3.Mesh(keep("puff",()=>new T3.SphereGeometry(1,7,5)),new T3.MeshLambertMaterial({color:f.c,transparent:true,opacity:f.op,depthWrite:false}));
      m.scale.setScalar((f.s||.6)*(1+Math.random()*.6));m.position.set(f.x+(Math.random()-.5)*(f.w||3),f.h,f.z+(Math.random()-.5)*(f.w||3));m.userData.smk=f.op;W.dyn.add(m)}}
  for(const c of [...W.dyn.children])if(c.userData.smk){c.position.y+=dt*1.4;c.position.x-=dt*.3;c.scale.multiplyScalar(1+dt*.3);c.material.opacity-=dt*c.userData.smk*.16;if(c.material.opacity<=0){W.dyn.remove(c);c.material.dispose()}}}
function shotsFrame(dt){for(const c of [...W.dyn.children])if(c.userData.shot!=null){c.userData.shot-=dt;c.material.opacity=(c.userData.op??1)*Math.max(0,c.userData.shot/c.userData.life);if(c.userData.shot<=0){W.dyn.remove(c);c.geometry.dispose();c.material.dispose()}}}
// ---------- light ----------
function lightFor(t){const h=(t%DAY)/60;const day=clamp(Math.sin((h-5.2)/15*Math.PI)*1.6,0,1);const dusk=clamp(1-Math.abs(h-19.6)/1.5,0,1)+clamp(1-Math.abs(h-6)/1.4,0,1);
  W.hemi.intensity=.3+day*.46;W.sun.intensity=.22+day*.66;if(day>.04)W.sun.color.setHSL(.09,.6,.6+day*.3-dusk*.1);else W.sun.color.setHSL(.62,.4,.62);
  W.hemi.color.setHSL(.6-dusk*.5,.3+(1-day)*.15,.42+day*.4);W.hemi.groundColor.setHSL(.1,.2,.16+day*.16);W.bg.setHSL(.6-dusk*.5,.25+dusk*.2,.07+day*.2+dusk*.08)}
function lightsFrame(now){const dark=darkness();const k=W.loc;const pl=S.player;
  const fires=S.blds.filter(b=>b.loc===k&&b.done&&b.type==="fire").sort((a,b)=>dist(a.x,a.z,W.tgt.x,W.tgt.z)-dist(b.x,b.z,W.tgt.x,W.tgt.z));
  W.pts.forEach((p,i)=>{const b=fires[i];if(!b){p.intensity=0;return}p.position.set(b.x,b.opt&&b.opt.indoor?1.3:1.2,b.z);p.intensity=(.3+dark*1.4)*(.88+Math.sin(now/90+i*2)*.07+Math.sin(now/37+i)*.05)});
  W.lamp.intensity=pl.loc===k&&pl.ko<=0?dark*.95:0;W.lamp.position.set(pl.x,2.4,pl.z);
  // the windows of a house people live in glow at night
  for(const m of W.bm)if(m.glass){const l=m.lived?dark:0;if(m.gl!==l){m.gl=l;m.glass.emissive.setRGB(l*.95,l*.62,l*.25)}}}
function renderWorld(dt,now){if(!W.ok||!S)return;const want=S.player.loc==="road"?W.loc:S.player.loc;if(want!==W.loc||!W.root.children.length)buildScene();const k=W.loc;
  if(!LOCS[k]){W.r.render(W.sc,W.cam);return}
  const P=place(k);const key=(P.dv||0)+":"+S.bv;if(W.dv!==key){const first=W.dv==null;W.dv=key;for(const m of W.bm)houseDecor(k,m);treesSync(k,first)}
  housesFrame(dt);carsFrame(dt,now);treesFrame(dt,now);syncFigs(dt,now);partsFrame(dt);
  if(!W.free&&S.player.loc===W.loc){W.tgt.x+=(S.player.x-W.tgt.x)*Math.min(1,dt*3);W.tgt.z+=(S.player.z-W.tgt.z)*Math.min(1,dt*3)}camUpdate();lightFor(S.t);lightsFrame(now);
  for(const f of W.flames){const m=f.m;m.scale.y=.8+Math.sin(now/90+m.id)*.25;m.scale.x=m.scale.z=.9+Math.sin(now/130+m.id)*.1}
  smokeFrame(dt);shotsFrame(dt);if(W.kick>0)W.kick=Math.max(0,W.kick-dt*.9);markersFrame(dt,now);if(W.water)W.water.offset.y+=dt*.03;
  // the edges of the screen darken at night, and go red when one of them has you
  W.vt=(W.vt||0)+dt;if(W.vt>.25){W.vt=0;const v=document.getElementById("vig");if(v){const o=String(Math.min(1,.4+darkness()*.45+(UI.grab?.35:0)).toFixed(2));if(v.style.opacity!==o)v.style.opacity=o;v.classList.toggle("red",!!UI.grab)}}
  W.r.render(W.sc,W.cam)}
function shotFx(from,to,hit){if(!W.ok||!S||from.loc!==W.loc)return;const a0=Math.atan2(to.x-from.x,to.z-from.z);
  const a=new T3.Vector3(from.x+Math.sin(a0)*.8,1.42,from.z+Math.cos(a0)*.8),b=new T3.Vector3(to.x,hit?1.15:1.3,to.z);if(!hit){b.x+=rf()*1.8-.9;b.z+=rf()*1.8-.9}
  const add=(m,life)=>{m.userData.shot=life;m.userData.life=life;m.userData.op=m.material.opacity;W.dyn.add(m);return m};
  const len=a.distanceTo(b);const tr=add(new T3.Mesh(new T3.BoxGeometry(.07,.07,len),new T3.MeshBasicMaterial({color:"#ffe39a",transparent:true,opacity:1})),.16);tr.position.copy(a).lerp(b,.5);tr.lookAt(b);tr.userData.shot=tr.userData.life=.2;
  add(new T3.Mesh(new T3.SphereGeometry(.3,8,6),new T3.MeshBasicMaterial({color:"#ffd36e",transparent:true,opacity:1})),.13).position.copy(a);
  add(new T3.Mesh(new T3.SphereGeometry(.75,10,8),new T3.MeshBasicMaterial({color:"#ffb84a",transparent:true,opacity:.45})),.09).position.copy(a);
  if(hit){add(new T3.Mesh(new T3.SphereGeometry(.3,7,5),new T3.MeshBasicMaterial({color:"#4a3c30",transparent:true,opacity:.8})),.45).position.copy(b);burst(b.x,1.2,b.z,"#4a0c08",6,1.4,1.5,.7,.06)}
  W.kick=from.id==="you"?.14:.05}
// ---------- rings and lines on the ground ----------
function markersFrame(dt,now){const pl=S.player;const hv=UI.hover;let tg=null,col="#e8a050";
  if(hv&&typeof hv==="string"){if(hv.startsWith("a:")){tg=(S.animals||[]).find(a=>a.id===hv.slice(2));col="#e9e4da"}else if(hv.indexOf(":")<0)tg=hv==="you"?pl:S.people.find(p=>p.id===hv)}
  if(!W.ring){W.ring=new T3.Mesh(keep("ring",()=>new T3.RingGeometry(.55,.68,28)),bmat(col,.8));W.ring.rotation.x=-Math.PI/2;W.dyn.add(W.ring)}
  W.ring.visible=!!tg&&tg.loc===W.loc;if(W.ring.visible){const f=W.figs[tg.id];W.ring.position.set(f?f.position.x:tg.x,.06,f?f.position.z:tg.z);W.ring.material=bmat(col,.8);W.ring.scale.setScalar(1+Math.sin(now/180)*.06)}
  // where you're walking to
  if(!W.mark){W.mark=new T3.Mesh(keep("mark",()=>new T3.RingGeometry(.25,.36,20)),bmat("#e9e4da",.7));W.mark.rotation.x=-Math.PI/2;W.dyn.add(W.mark)}
  const go=pl.tx!=null&&pl.goal&&!pl.order&&!S.push&&pl.loc===W.loc;W.mark.visible=!!go;if(go){W.mark.position.set(pl.goal.x,.06,pl.goal.z);W.mark.scale.setScalar(1+((now/600)%1)*.6)}
  // where the car's going while you push it
  const P=S.push;if(P&&P.k===W.loc){if(!W.pushT){const g=new T3.Group();const m=bmat("#9cc27a",.75);for(const [w,d,x,z] of [[2.1,.1,0,2.15],[2.1,.1,0,-2.15],[.1,4.3,1.05,0],[.1,4.3,-1.05,0]]){const e=new T3.Mesh(BG(w,.04,d),m);e.position.set(x,.07,z);g.add(e)}W.dyn.add(g);W.pushT=g}
    W.pushT.visible=true;W.pushT.position.set(P.x1,0,P.z1);W.pushT.rotation.y=P.r1}else if(W.pushT)W.pushT.visible=false;
  // the way the dead would walk in (fades after a while)
  if(W.perim){const g=W.perim;g.userData.life-=dt;const l=g.userData.life;for(const o of g.children)if(o.userData.pulse)o.scale.setScalar(1+Math.sin(now/200)*.15);
    if(l<=0){W.dyn.remove(g);clearGroup(g);W.perim=null}else g.visible=l>2||Math.floor(l*4)%2===0}}
function perimLine(path,sealed){if(!W.ok)return;if(W.perim){W.dyn.remove(W.perim);clearGroup(W.perim);W.perim=null}const g=new T3.Group();g.userData.life=10;
  if(path&&path.length>1){const pts=[path[0]];for(let i=1;i<path.length-1;i++){const a=pts[pts.length-1],b=path[i],c=path[i+1];if(Math.abs((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]))>1e-6)pts.push(b)}pts.push(path[path.length-1]);
    const m=bmat("#ff5a3a",.85);for(let i=1;i<pts.length;i++){const [x0,z0]=pts[i-1],[x1,z1]=pts[i];const L=dist(x0,z0,x1,z1);if(L<.01)continue;const s=new T3.Mesh(new T3.BoxGeometry(.18,.05,L+.18),m);s.position.set((x0+x1)/2,.1,(z0+z1)/2);s.rotation.y=Math.atan2(x1-x0,z1-z0);g.add(s)}
    const [sx,sz]=pts[0];const ring=new T3.Mesh(new T3.RingGeometry(.8,1.15,24),bmat("#ff5a3a",.8));ring.rotation.x=-Math.PI/2;ring.position.set(sx,.1,sz);ring.userData.pulse=1;g.add(ring)}
  else if(sealed){const h=homeBld();if(h){const r=Math.max(h.w,h.d)/2+4;const ring=new T3.Mesh(new T3.RingGeometry(r,r+.3,48),bmat("#9cc27a",.8));ring.rotation.x=-Math.PI/2;ring.position.set(h.x,.1,h.z);g.add(ring)}}
  W.dyn.add(g);W.perim=g}
// a see-through car where you're about to push it, and a line from where it is now
function carGhost(x,z,rot,ok,c){if(!W.ok)return;if(x==null){if(W.cgh){W.dyn.remove(W.cgh);W.cgh=null}return}
  if(!W.cgh){const g=new T3.Group();const m=carModel({c:"#ffffff"});m.traverse(o=>{if(o.isMesh){o.castShadow=false}});g.add(m);const ln=new T3.Mesh(BG(.12,.04,1),bmat("#9cc27a",.6));g.add(ln);g.userData={car:m,ln,ok:null};W.dyn.add(g);W.cgh=g}
  const u=W.cgh.userData;if(u.ok!==ok){u.ok=ok;const mm=bmat(ok?"#9cc27a":"#e06a50",.42);u.car.traverse(o=>{if(o.isMesh)o.material=mm});u.ln.material=bmat(ok?"#9cc27a":"#e06a50",.6)}
  u.car.position.set(x,0,z);u.car.rotation.y=rot;if(c){const L=dist(c.x,c.z,x,z);u.ln.visible=L>.3;u.ln.scale.z=Math.max(.01,L);u.ln.position.set((c.x+x)/2,.08,(c.z+z)/2);u.ln.rotation.y=Math.atan2(x-c.x,z-c.z)}else u.ln.visible=false}
// ---------- screen and world ----------
function toScreen(x,y,z){W.v3.set(x,y,z).project(W.cam);return{x:(W.v3.x+1)/2*innerWidth,y:(1-W.v3.y)/2*innerHeight,vis:W.v3.z<1}}
function groundAt(cx,cy){const v=new T3.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);W.ray.setFromCamera(v,W.cam);const out=new T3.Vector3();return W.ray.ray.intersectPlane(W.plane,out)?{x:out.x,z:out.z}:null}
function shown(o){while(o){if(!o.visible)return false;o=o.parent}return true}
// what's under the mouse: someone, one of the dead, an animal, a car, a building, a container, or just ground
function pickAt(cx,cy){if(!W.ok||!S||!W.pick)return null;const k=W.loc;let best=null,bd=26;
  const test=(o,kind,y)=>{const s=toScreen(o.x,y==null?1.1:y,o.z);const d=Math.hypot(s.x-cx,s.y-cy);if(d<bd){bd=d;best={kind,o}}};
  for(const p of S.people)if(p.loc===k&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside))test(p,"person");
  for(const w of S.walkers)if(w.loc===k&&!w.dead)test(w,"walker");
  for(const a of S.animals||[])if(a.loc===k&&!a.gone&&ANIMALS[a.k])test(a,"animal",a.dead?.25:ANIMALS[a.k].size*.8);
  if(best)return best;
  const v=new T3.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);W.ray.setFromCamera(v,W.cam);const hits=W.ray.intersectObjects(W.pick,true);
  for(const h of hits){let o=h.object;if(o===W.ground)break;if(!shown(o))continue;const m=Array.isArray(o.material)?o.material[0]:o.material;if(m&&m.transparent&&m.opacity<.5)continue;
    while(o&&o!==W.root){const u=o.userData;if(u.bld){const b=S.blds.find(b=>b.id===u.bld);if(b)return{kind:"bld",o:b}}if(u.cont){const c=layout(k).conts.find(c=>c.id===u.cont);if(c)return{kind:"cont",o:c}}
      if(u.car!=null){const c=layout(k).conts.find(c=>c.car===u.car);if(c)return{kind:"car",o:c}}if(u.house!=null)return{kind:"house",o:{bi:u.house}};o=o.parent}}
  const g=groundAt(cx,cy);if(!g)return null;const cs=carsAt(k);for(let i=0;i<cs.length;i++)if(dist(cs[i].x,cs[i].z,g.x,g.z)<2.2){const c=layout(k).conts.find(c=>c.car===i);if(c)return{kind:"car",o:c}}return{kind:"ground",o:g}}
// a see-through outline of what you're about to build
function ghost(type,x,z,rot,ok){if(!W.ok)return;if(W.ghost){W.dyn.remove(W.ghost);W.ghost=null}if(!type)return;const g=bldModel({type,opt:{},grow:.3});
  g.traverse(o=>{if(o.isMesh){o.material=bmat(ok?"#9cc27a":"#e06a50",.45);o.castShadow=false}});g.position.set(x,0,z);g.rotation.y=rot*Math.PI/2;W.dyn.add(g);W.ghost=g}
