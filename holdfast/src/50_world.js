// ================= the isometric scene =================
const T3=window.THREE;
const W={ok:false,loc:null,figs:{},blds:{},conts:{},fx:[],zoom:14,tgt:{x:0,z:0},free:false,ghost:null};
const BUB={};
function say(o,text,reply,think){if(!o||!text)return;const now=typeof performance!=="undefined"?performance.now():0;BUB[o.id]={x:String(text),until:now+clamp(2600+String(text).length*70,3800,11000),think:!!think};
  // what people say to you, or you to them, also goes in the log so it isn't lost when the bubble fades
  if(!think&&S&&(o.id==="you"||reply)&&o.loc===S.player.loc)log(`${o.id==="you"?"You":o.name}: "${String(text).slice(0,220)}"`,"talk")}
function sayLive(o,text){if(!o)return;BUB[o.id]={x:text||"...",until:performance.now()+9000,think:false}}
const M=c=>new T3.MeshLambertMaterial({color:c});
const MATS={};function mat(c){return MATS[c]||(MATS[c]=M(c))}
function box(w,h,d,c,x,y,z){const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),mat(c));m.position.set(x||0,(y||0)+h/2,z||0);m.castShadow=true;m.receiveShadow=true;return m}
function cyl(r1,r2,h,c,x,y,z,seg){const m=new T3.Mesh(new T3.CylinderGeometry(r1,r2,h,seg||8),mat(c));m.position.set(x||0,(y||0)+h/2,z||0);m.castShadow=true;m.receiveShadow=true;return m}
// a pitched roof over a w×d box, ridge running along x
function roof(w,d,h,c,y){const s=new T3.Shape();s.moveTo(-d/2-.3,0);s.lineTo(0,h);s.lineTo(d/2+.3,0);s.lineTo(-d/2-.3,0);const g=new T3.ExtrudeGeometry(s,{depth:w+.5,bevelEnabled:false});g.translate(0,0,-(w+.5)/2);g.rotateY(Math.PI/2);
  const m=new T3.Mesh(g,mat(c));m.position.y=y;m.castShadow=true;m.receiveShadow=true;return m}
function initWorld(cv){if(!T3){W.ok=false;return}try{
  W.r=new T3.WebGLRenderer({canvas:cv,antialias:true});W.r.setPixelRatio(Math.min(2,window.devicePixelRatio||1));W.r.shadowMap.enabled=true;W.r.shadowMap.type=T3.PCFSoftShadowMap;
  W.sc=new T3.Scene();W.cam=new T3.OrthographicCamera(-10,10,10,-10,1,600);
  W.hemi=new T3.HemisphereLight(0xdfe8f0,0x5a5040,.7);W.sc.add(W.hemi);W.sun=new T3.DirectionalLight(0xfff0d8,.8);W.sun.castShadow=true;W.sun.shadow.mapSize.set(2048,2048);
  const sc=W.sun.shadow.camera;sc.left=-46;sc.right=46;sc.top=46;sc.bottom=-46;sc.near=1;sc.far=300;W.sun.shadow.bias=-.0008;W.sc.add(W.sun);W.sc.add(W.sun.target);
  W.root=new T3.Group();W.sc.add(W.root);W.dyn=new T3.Group();W.sc.add(W.dyn);W.ray=new T3.Raycaster();W.plane=new T3.Plane(new T3.Vector3(0,1,0),0);W.v3=new T3.Vector3();
  W.ok=true;resizeWorld()}catch(e){console.error(e);W.ok=false}}
function resizeWorld(){if(!W.ok)return;const w=innerWidth,h=innerHeight;W.r.setSize(w,h,false);W.aspect=w/h;camUpdate()}
function camUpdate(){const z=W.zoom,a=W.aspect||1;W.cam.left=-z*a;W.cam.right=z*a;W.cam.top=z;W.cam.bottom=-z;W.cam.updateProjectionMatrix();
  const t=W.tgt;const j=W.kick>0?(Math.random()-.5)*W.kick*2:0;W.cam.position.set(t.x+60+j,60,t.z+60-j);W.cam.lookAt(t.x+j,0,t.z-j);W.sun.position.set(t.x+30,60,t.z+18);W.sun.target.position.set(t.x,0,t.z)}
function clearGroup(g){while(g.children.length){const c=g.children.pop();c.traverse(o=>{if(o.geometry)o.geometry.dispose()})}}
// ---------- building a place ----------
function buildScene(){if(!W.ok||!S)return;const k=S.player.loc==="road"?(S.flags.traveling?.from||"start"):S.player.loc;W.loc=k;clearGroup(W.root);clearGroup(W.dyn);W.figs={};W.blds={};W.conts={};W.fx=[];
  const L=LOCS[k];const lay=layout(k);const burned=place(k).burned;const R=srng(hashStr(k+"g"));
  // the ground, tinted a little differently in every place
  const G=new T3.PlaneGeometry(2*SH+40,2*SH+40,40,40);G.rotateX(-Math.PI/2);const col=[];const base=new T3.Color(L.kind==="scout"?"#4e6a3a":L.kind==="farm"?"#6a7a40":"#647a44");
  for(let i=0;i<G.attributes.position.count;i++){const x=G.attributes.position.getX(i),z=G.attributes.position.getZ(i);const n=Math.sin(x*.21+R()*.3)*Math.cos(z*.17)*.06+R()*.05;const c=base.clone().offsetHSL(0,0,n-.02);if(Math.abs(x)>SH||Math.abs(z)>SH)c.multiplyScalar(.75);col.push(c.r,c.g,c.b)}
  G.setAttribute("color",new T3.Float32BufferAttribute(col,3));const gm=new T3.Mesh(G,new T3.MeshLambertMaterial({vertexColors:true}));gm.receiveShadow=true;W.root.add(gm);W.ground=gm;
  const flat=(w,d,c,x,z,y)=>{const m=new T3.Mesh(new T3.PlaneGeometry(w,d),mat(c));m.rotation.x=-Math.PI/2;m.position.set(x,y||.02,z);m.receiveShadow=true;W.root.add(m);return m};
  // the road in, and where it goes
  if(k==="start"){flat(2*SH+40,9,"#3a3a3c",0,6,.03);for(let x=-SH-18;x<SH+18;x+=5)flat(2.2,.25,"#d8c860",x,6,.04)}
  else{flat(4,SH+4,L.kind==="scout"||L.kind==="farm"||L.kind==="mill"?"#8a7a5a":"#4a4a4c",0,SH/2+4,.03)}
  if(lay.lot)flat(34,16,"#4a4a4c",0,13,.025);if(lay.field){flat(22,16,"#5e8a3e",-12,14,.025);flat(.3,16,"#e8e8e0",-12,14,.03)}
  if(lay.fields)for(let i=0;i<8;i++)flat(18,1.1,i%2?"#7a5a3a":"#6a8a3a",-14,10+i*1.5,.03);
  if(lay.water){const w=flat(14,2*SH+30,"#3a6a8a",SH+3,0,.05);w.material=new T3.MeshLambertMaterial({color:"#3a6a8a",transparent:true,opacity:.92});flat(2,2*SH+30,"#8a7a5a",SH-4.5,0,.035)}
  if(lay.fence)for(let x=-14;x<=14;x+=2){W.root.add(box(.15,1.1,.15,"#2a2a2a",x,0,SH-14));if(Math.abs(x)>2)W.root.add(box(2,.08,.08,"#2a2a2a",x+1,.9,SH-14))}
  for(const b of lay.b){const g=new T3.Group();const wc=burned?"#2e2a28":b.c;g.add(box(b.w,b.h,b.d,wc,0,0,0));
    if(!burned){if(b.flat)g.add(box(b.w+.4,.3,b.d+.4,b.roof,0,b.h,0));else g.add(roof(b.w,b.d,b.h*.55,b.roof,b.h));
      // windows and a door on the front
      for(let x=-b.w/2+1.5;x<b.w/2-1;x+=3)g.add(box(.9,.8,.06,"#2a3440",x,b.h*.45,b.d/2+.01));g.add(box(1.1,2,.08,"#4a3426",0,0,b.d/2+.02));
      if(b.steeple){g.add(box(2.4,b.h+5,2.4,b.c,0,0,b.d/2-1.2));const sp=new T3.Mesh(new T3.ConeGeometry(1.8,4,4),mat(b.roof));sp.position.set(0,b.h+7,b.d/2-1.2);sp.rotation.y=Math.PI/4;sp.castShadow=true;g.add(sp)}}
    else{for(let i=0;i<5;i++)g.add(box(.3,R()*b.h,.3,"#1e1a18",(R()-.5)*b.w,0,(R()-.5)*b.d));W.fx.push({smoke:true,x:b.x,z:b.z,h:b.h})}
    g.position.set(b.x,0,b.z);W.root.add(g)}
  if(lay.canopy&&!burned){const g=new T3.Group();g.add(box(12,.4,7,"#d8d8d0",0,4,0));for(const [x,z] of [[-5,-3],[5,-3],[-5,3],[5,3]])g.add(box(.3,4,.3,"#a8a8a0",x,0,z));for(const x of [-2.5,2.5])g.add(box(.8,1.4,.5,"#a83a2a",x,0,0));g.position.set(6,0,4);W.root.add(g)}
  for(const c of lay.cars){const g=new T3.Group();g.add(box(1.9,.8,4,c.c,0,.3,0));g.add(box(1.7,.6,2.2,"#2a3440",0,1.1,-.2));for(const [x,z] of [[-.95,-1.3],[.95,-1.3],[-.95,1.3],[.95,1.3]]){const w=cyl(.36,.36,.25,"#1a1a1a",0,0,0,10);w.rotation.z=Math.PI/2;w.position.set(x,.36,z);g.add(w)}if(c.cop){g.add(box(1.92,.05,1.2,"#1e1e22",0,1.1,1.3));g.add(box(1.92,.05,1,"#1e1e22",0,1.1,-1.5));g.add(box(.55,.16,.26,"#d83a30",-.3,1.7,-.2));g.add(box(.55,.16,.26,"#3a62d8",.3,1.7,-.2))}g.position.set(c.x,0,c.z);g.rotation.y=c.rot;W.root.add(g)}
  for(const c of lay.conts){if(c.vis==="car")continue;let g;if(c.vis==="shed"){g=new T3.Group();g.add(box(3,2.2,3,"#7a6a52",0,0,0));g.add(box(3.4,.2,3.4,"#5a5a58",0,2.2,0));g.add(box(1,1.8,.06,"#4a3426",0,0,1.51))}
    else{g=new T3.Group();g.add(box(1.4,1,.9,"#8a6a42",0,0,0));g.add(box(1.5,.08,1,"#6a4a2a",0,1,0))}g.position.set(c.x,0,c.z);g.userData.cont=c.id;W.root.add(g);W.conts[c.id]=g}
  const tg=new T3.Group();for(const [x,z,s] of lay.trees){const tr=cyl(.18*s,.24*s,1.4*s,"#5a4030",x,0,z,6);tg.add(tr);const c=new T3.Mesh(new T3.ConeGeometry(1.3*s,3.2*s,7),mat(L.kind==="scout"?"#2e4a2a":"#3a5a30"));c.position.set(x,1.2*s+1.6*s,z);c.castShadow=true;tg.add(c)}W.root.add(tg);
  for(const b of S.blds)if(b.loc===k)drawBld(b);
  W.tgt={x:S.player.x,z:S.player.z};W.free=false;camUpdate()}
// ---------- the things you build ----------
function bldModel(b){const g=new T3.Group();const o=b.opt||{};const t=b.type;
  if(t==="tent"){const s=new T3.Shape();s.moveTo(-1.4,0);s.lineTo(0,1.8);s.lineTo(1.4,0);s.lineTo(-1.4,0);const ge=new T3.ExtrudeGeometry(s,{depth:2.8,bevelEnabled:false});ge.translate(0,0,-1.4);const m=new T3.Mesh(ge,mat(o.cover||"#5a6b3a"));m.castShadow=true;g.add(m);g.add(box(.08,2,.08,"#4a3a2a",0,0,1.45))}
  else if(t==="cabin"){g.add(box(5,2.6,4,o.walls||"#8a6a48",0,0,0));g.add(roof(5,4,1.4,o.roof||"#5a3a2a",2.6));g.add(box(.9,1.8,.06,"#4a3426",0,0,2.01));g.add(box(.8,.7,.06,"#2a3440",1.6,1.2,2.01))}
  else if(t==="plot"){g.add(box(6,.15,4,"#5a4028",0,0,0));const gr=Math.max(.05,b.grow||0);for(let i=0;i<4;i++){const r=box(5.6,.1+gr*.8,.4,b.grow>=1?"#7a9a3a":"#5a8a3a",0,.15,-1.5+i);r.scale.y=1;g.add(r)}}
  else if(t==="well"){for(const [x,z] of [[-.5,0],[.5,0]])g.add(cyl(.45,.45,1.1,"#3a5a7a",x,0,z,10));g.add(box(2,.08,.3,"#6a4a2a",0,1.3,0))}
  else if(t==="fire"){for(let i=0;i<8;i++){const a=i/8*Math.PI*2;g.add(box(.35,.25,.35,"#7a7a78",Math.cos(a)*.7,0,Math.sin(a)*.7))}const f=new T3.Mesh(new T3.ConeGeometry(.35,.9,6),new T3.MeshBasicMaterial({color:"#ffb040"}));f.position.y=.5;f.userData.flame=true;g.add(f);for(let i=0;i<3;i++)g.add(box(1.2,.15,.15,"#4a3020",0,.05,0)).rotation.y=i;}
  else if(t==="tower"){for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]])g.add(box(.2,4,.2,"#6a4a2a",x,0,z));g.add(box(2.6,.2,2.6,"#7a5a3a",0,4,0));g.add(box(2.6,.8,.1,"#7a5a3a",0,4.2,1.3));g.add(box(2.6,.8,.1,"#7a5a3a",0,4.2,-1.3));g.add(roof(2.6,2.6,.8,"#5a4a3a",5.2))}
  else if(t==="fence"){for(let x=-3;x<=3;x+=1.5){const p=box(.18,1.6,.18,"#7a5a3a",x,0,0);g.add(p)}g.add(box(6.2,.15,.1,"#8a6a48",0,.6,0));g.add(box(6.2,.15,.1,"#8a6a48",0,1.2,0))}
  else if(t==="shed"){g.add(box(4,2.4,4,"#8a7a62",0,0,0));g.add(box(4.4,.2,4.4,o.roof||"#7a7a78",0,2.4,0));g.add(box(1.4,1.9,.06,"#4a3426",0,0,2.01))}
  else if(t==="shop"){g.add(box(4,2.4,.2,"#7a6a52",0,0,-1.9));g.add(box(.2,2.4,4,"#7a6a52",-1.9,0,0));g.add(box(.2,2.4,4,"#7a6a52",1.9,0,0));g.add(box(4.3,.2,4.3,"#6a6a68",0,2.4,0));g.add(box(2.4,.9,.8,"#6a4a2a",0,0,-1))}
  else if(t==="clinic"){g.add(box(4,2.2,4,"#e8e4d8",0,0,0));g.add(roof(4,4,1,"#d8d4c8",2.2));g.add(box(1,.25,.06,"#c03030",0,1.5,2.01));g.add(box(.25,1,.06,"#c03030",0,1.12,2.01))}
  else if(t==="coop"){g.add(box(3,1.2,2,"#8a6a48",0,0,0));g.add(roof(3,2,.6,"#6a3a2a",1.2));for(let i=0;i<3;i++)g.add(box(.25,.25,.35,"#e8e4dc",-1+i,.0,1.5))}
  else if(t==="bench"){g.add(box(2,.12,.5,"#8a6a48",0,.45,0));g.add(box(.12,.45,.4,"#6a4a2a",-.8,0,0));g.add(box(.12,.45,.4,"#6a4a2a",.8,0,0))}
  else if(t==="garden"){g.add(box(2,.2,2,"#5a4028",0,0,0));for(let i=0;i<9;i++)g.add(box(.18,.4,.18,i%3?"#4a7a3a":o.color||"#d85a7a",-.6+(i%3)*.6,.2,-.6+Math.floor(i/3)*.6))}
  return g}
function drawBld(b){if(!W.ok)return;if(W.blds[b.id]){W.root.remove(W.blds[b.id]);delete W.blds[b.id]}if(b.loc!==W.loc||b.gone)return;const g=bldModel(b);
  if(!b.done){const frac=b.prog/BUILDS[b.type].hrs;g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;o.material.opacity=.25+frac*.55}});
    for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const [w,d]=bSize(b);g.add(box(.1,2.5,.1,"#c8a868",x*w/2,0,z*d/2))}}
  g.position.set(b.x,0,b.z);g.rotation.y=(b.rot||0)*Math.PI/2;g.userData.bld=b.id;W.root.add(g);W.blds[b.id]=g}
function onBld(b){drawBld(b)}
// ---------- people ----------
function figModel(look,kind,gear){const g=new T3.Group();const s=kind==="kid"?.72:1;const skin=look.skin;const top=look.top,pants=look.pants;
  const hip=new T3.Group();hip.position.y=.9*s;g.add(hip);
  const mk=(w,h,d,c,y)=>{const m=new T3.Mesh(new T3.BoxGeometry(w,h,d),mat(c));m.position.y=y;m.castShadow=true;return m};
  const legL=new T3.Group(),legR=new T3.Group();legL.position.set(-.12*s,0,0);legR.position.set(.12*s,0,0);legL.add(mk(.18*s,.88*s,.2*s,pants,-.44*s));legR.add(mk(.18*s,.88*s,.2*s,pants,-.44*s));hip.add(legL,legR);
  const torso=mk(.48*s,.62*s,.28*s,top,.33*s);hip.add(torso);
  const armL=new T3.Group(),armR=new T3.Group();armL.position.set(-.31*s,.6*s,0);armR.position.set(.31*s,.6*s,0);armL.add(mk(.13*s,.62*s,.15*s,top,-.29*s));armR.add(mk(.13*s,.62*s,.15*s,top,-.29*s));
  armL.add(mk(.11*s,.12*s,.12*s,skin,-.64*s));armR.add(mk(.11*s,.12*s,.12*s,skin,-.64*s));hip.add(armL,armR);
  const head=new T3.Mesh(new T3.SphereGeometry(.16*s,10,8),mat(skin));head.position.y=.84*s;head.castShadow=true;hip.add(head);
  if(look.hair&&kind!=="walker"){const h=new T3.Mesh(new T3.SphereGeometry(.172*s,10,6,0,Math.PI*2,0,Math.PI*.55),mat(look.hair));h.position.y=.86*s;hip.add(h);if(look.long){const l=mk(.3*s,.34*s,.08*s,look.hair,.7*s);l.position.z=-.12*s;hip.add(l)}}
  if(look.hat){const h=cyl(.19*s,.19*s,.1*s,look.hat,0,.94*s,0,10);h.position.y=.98*s;hip.add(h)}
  let gunHand=null,gunBack=null;
  if(gear&&GUNS[gear]){const dark="#24272a",wood="#5a3e26";gunHand=new T3.Group();armR.add(gunHand);
    if(gear==="pistol"){gunHand.add(mk(.07*s,.22*s,.12*s,dark,0));gunHand.position.set(0,-.78*s,.02*s)}
    else{const long=()=>{const q=new T3.Group();q.add(mk(.06*s,.62*s,.07*s,dark,-.12*s));q.add(mk(.09*s,.3*s,.1*s,wood,.3*s));if(gear==="shotgun")q.add(mk(.08*s,.16*s,.09*s,wood,-.2*s));return q};
      gunHand.add(long());gunHand.position.set(0,-.98*s,.02*s);gunHand.visible=false;
      gunBack=long();gunBack.position.set(0,.36*s,-.19*s);gunBack.rotation.z=.7;hip.add(gunBack)}}
  g.userData={hip,legL,legR,armL,armR,gunHand,gunBack,gear:gear||"",ph:rf()*6};return g}
function syncFigs(dt,now){if(!W.ok||!S)return;const k=W.loc;const pl=S.player;const want=new Set();
  const ents=[];if(pl.loc===k&&pl.ko<=0)ents.push([pl,pl.look,"you"]);
  const gearOf=(o,kind)=>kind==="walker"?"":(o.id==="you"?pl.gun:o.gun)||"";
  for(const p of S.people)if(p.loc===k&&p.status!=="left"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside)&&(p.status!=="dead"||now&&false))ents.push([p,p.look,p.kid?"kid":"adult"]);
  for(const w of S.walkers)if(w.loc===k)ents.push([w,w.look,"walker"]);
  for(const [o,look,kind] of ents){want.add(o.id);let f=W.figs[o.id];const gear=gearOf(o,kind);if(f&&f.userData.gear!==gear){W.dyn.remove(f);f=null}
    if(!f){f=figModel(look,kind,gear);f.position.set(o.x,0,o.z);W.dyn.add(f);W.figs[o.id]=f}
    const u=f.userData;const moving=o.tx!=null;f.position.x+=(o.x-f.position.x)*Math.min(1,dt*12);f.position.z+=(o.z-f.position.z)*Math.min(1,dt*12);
    const dir=o.dir??0;let dr=dir-f.rotation.y;while(dr>Math.PI)dr-=Math.PI*2;while(dr<-Math.PI)dr+=Math.PI*2;f.rotation.y+=dr*Math.min(1,dt*8);
    if(o.dead){f.rotation.z=0;u.hip.rotation.x=-Math.PI/2;u.hip.position.y=.18;u.armL.rotation.x=u.armR.rotation.x=0;continue}
    if(o.sleep&&!o.inside){u.hip.rotation.x=-Math.PI/2;u.hip.position.y=.2;continue}else{u.hip.rotation.x=0;u.hip.position.y=kind==="kid"?.65:.9}
    u.ph+=dt*(moving?(kind==="walker"?5:9)*(S.speed||1)**.3:1.5);const sw=moving?Math.sin(u.ph)*.6:0;u.legL.rotation.x=sw;u.legR.rotation.x=-sw;
    if(kind==="walker"){u.armL.rotation.x=-1.3+Math.sin(u.ph*.5)*.15;u.armR.rotation.x=-1.4+Math.cos(u.ph*.5)*.15;f.rotation.z=Math.sin(u.ph*.5)*.08}else{u.armL.rotation.x=-sw*.8;u.armR.rotation.x=sw*.8}
    // raising a gun to fire
    const aiming=o.aim&&now-o.aim<700;if(u.gunHand&&u.gunBack){u.gunHand.visible=aiming;u.gunBack.visible=!aiming}
    if(aiming){u.armR.rotation.x=-1.5;if(u.gunBack)u.armL.rotation.x=-1.3;continue}
    if(o.busyTalk)u.armR.rotation.x=-.5+Math.sin(now/200)*.2;
    if(o.working){u.armR.rotation.x=-1+Math.sin(now/180)*.6}}
  for(const id in W.figs)if(!want.has(id)){W.dyn.remove(W.figs[id]);delete W.figs[id]}}
function lightFor(t){const h=(t%DAY)/60;const day=clamp(Math.sin((h-5.2)/15*Math.PI)*1.6,0,1);const dusk=clamp(1-Math.abs(h-20)/1.4,0,1)+clamp(1-Math.abs(h-5.6)/1.4,0,1);
  W.hemi.intensity=.42+day*.4;W.sun.intensity=.18+day*.7;W.sun.color.setHSL(.09,.6,.6+day*.3-dusk*.1);W.hemi.color.setHSL(.6-dusk*.5,.3,.45+day*.35);
  W.sc.background=new T3.Color().setHSL(.6-dusk*.48,.25+dusk*.2,.1+day*.18+dusk*.08)}
function renderWorld(dt,now){if(!W.ok||!S)return;const want=S.player.loc==="road"?W.loc:S.player.loc;if(want!==W.loc)buildScene();
  syncFigs(dt,now);if(!W.free&&S.player.loc===W.loc){W.tgt.x+=(S.player.x-W.tgt.x)*Math.min(1,dt*3);W.tgt.z+=(S.player.z-W.tgt.z)*Math.min(1,dt*3)}camUpdate();lightFor(S.t);
  W.root.traverse(o=>{if(o.userData&&o.userData.flame){o.scale.y=.8+Math.sin(now/90+o.id)*.25;o.scale.x=o.scale.z=.9+Math.sin(now/130)*.1}});
  // smoke over burned places
  if(W.fx.length&&rf()<.3){for(const f of W.fx){const p=new T3.Mesh(new T3.SphereGeometry(.6+rf()*.5,6,5),new T3.MeshBasicMaterial({color:"#3a3634",transparent:true,opacity:.5}));p.position.set(f.x+rf()*4-2,f.h,f.z+rf()*4-2);p.userData.smk=1;W.dyn.add(p)}}
  for(const c of [...W.dyn.children])if(c.userData.shot!=null){c.userData.shot-=dt;c.material.opacity=(c.userData.op??1)*Math.max(0,c.userData.shot/c.userData.life);if(c.userData.shot<=0){W.dyn.remove(c);c.geometry.dispose();c.material.dispose()}}
  if(W.kick>0)W.kick=Math.max(0,W.kick-dt*.9);
  for(const c of [...W.dyn.children])if(c.userData.smk){c.position.y+=dt*1.6;c.scale.multiplyScalar(1+dt*.25);c.material.opacity-=dt*.07;if(c.material.opacity<=0){W.dyn.remove(c);c.geometry.dispose()}}
  W.r.render(W.sc,W.cam)}
function shotFx(from,to,hit){if(!W.ok||!S||from.loc!==W.loc)return;const a0=Math.atan2(to.x-from.x,to.z-from.z);
  const a=new T3.Vector3(from.x+Math.sin(a0)*.8,1.42,from.z+Math.cos(a0)*.8),b=new T3.Vector3(to.x,hit?1.15:1.3,to.z);if(!hit){b.x+=rf()*1.8-.9;b.z+=rf()*1.8-.9}
  const add=(m,life)=>{m.userData.shot=life;m.userData.life=life;m.userData.op=m.material.opacity;W.dyn.add(m);return m};
  const len=a.distanceTo(b);const tr=add(new T3.Mesh(new T3.BoxGeometry(.07,.07,len),new T3.MeshBasicMaterial({color:"#ffe39a",transparent:true,opacity:1})),.16);tr.position.copy(a).lerp(b,.5);tr.lookAt(b);tr.userData.shot=tr.userData.life=.2;
  add(new T3.Mesh(new T3.SphereGeometry(.3,8,6),new T3.MeshBasicMaterial({color:"#ffd36e",transparent:true,opacity:1})),.13).position.copy(a);
  add(new T3.Mesh(new T3.SphereGeometry(.75,10,8),new T3.MeshBasicMaterial({color:"#ffb84a",transparent:true,opacity:.45})),.09).position.copy(a);
  if(hit)add(new T3.Mesh(new T3.SphereGeometry(.3,7,5),new T3.MeshBasicMaterial({color:"#4a3c30",transparent:true,opacity:.8})),.45).position.copy(b);
  W.kick=from.id==="you"?.14:.05}
// ---------- screen and world ----------
function toScreen(x,y,z){W.v3.set(x,y,z).project(W.cam);return{x:(W.v3.x+1)/2*innerWidth,y:(1-W.v3.y)/2*innerHeight,vis:W.v3.z<1}}
function groundAt(cx,cy){const v=new T3.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);W.ray.setFromCamera(v,W.cam);const out=new T3.Vector3();return W.ray.ray.intersectPlane(W.plane,out)?{x:out.x,z:out.z}:null}
function pickAt(cx,cy){if(!W.ok||!S)return null;const k=W.loc;let best=null,bd=26;
  const test=(o,kind)=>{const s=toScreen(o.x,1.1,o.z);const d=Math.hypot(s.x-cx,s.y-cy);if(d<bd){bd=d;best={kind,o}}};
  for(const p of S.people)if(p.loc===k&&p.status!=="dead"&&p.status!=="left"&&!(p.away&&p.away.out)&&!(p.sleep&&p.inside))test(p,"person");
  for(const w of S.walkers)if(w.loc===k&&!w.dead)test(w,"walker");if(best)return best;
  const v=new T3.Vector2(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);W.ray.setFromCamera(v,W.cam);const hits=W.ray.intersectObjects(W.root.children,true);
  for(const h of hits){let o=h.object;while(o&&o!==W.root){if(o.userData.bld)return{kind:"bld",o:S.blds.find(b=>b.id===o.userData.bld)};if(o.userData.cont){const c=layout(k).conts.find(c=>c.id===o.userData.cont);return{kind:"cont",o:c}}o=o.parent}if(h.object===W.ground)break}
  // cars are containers too
  const g=groundAt(cx,cy);if(g){const c=layout(k).conts.find(c=>c.vis==="car"&&dist(c.x,c.z,g.x,g.z)<2.4);if(c)return{kind:"cont",o:c};return{kind:"ground",o:g}}return null}
// a see-through outline of what you're about to build
function ghost(type,x,z,rot,ok){if(!W.ok)return;if(W.ghost){W.dyn.remove(W.ghost);W.ghost=null}if(!type)return;const g=bldModel({type,opt:{},grow:.3});
  g.traverse(o=>{if(o.isMesh){o.material=new T3.MeshBasicMaterial({color:ok?"#9cc27a":"#e06a50",transparent:true,opacity:.45})}});g.position.set(x,0,z);g.rotation.y=rot*Math.PI/2;W.dyn.add(g);W.ghost=g}
