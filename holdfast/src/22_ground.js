// ================= the ground: cars you can push, trees you can fell, doors and windows =================
// Where a car sits, which trees are down and how each door and window is holding up all change as you play,
// so they live in the place's state (S.places[k]), on top of the layout that never changes.
function carsAt(k){const P=place(k);if(!P.cars){P.cars=layout(k).cars.map(c=>({x:c.x,z:c.z,rot:c.rot}));syncCarConts(k)}return P.cars}
// a car's trunk and glovebox go where the car goes
function syncCarConts(k){const cs=S.places[k]&&S.places[k].cars;if(!cs)return;for(const c of layout(k).conts)if(c.car>=0&&cs[c.car]){c.x=cs[c.car].x;c.z=cs[c.car].z}}
function carOf(k,c){return c&&c.car>=0?carsAt(k)[c.car]:null}
// trees inside the scene can be cut down; the ones out past the edge are scenery
function choppable(t){return Math.abs(t[0])<SH-1.5&&Math.abs(t[1])<SH-1.5}
function treeState(k,i){const P=place(k);P.trees=P.trees||{};return P.trees[i]||(P.trees[i]={cut:0,down:false,left:0})}
function treeWood(t){return 2+Math.round(t[2]*2)}
function treesStanding(k){const P=place(k);return layout(k).trees.map((t,i)=>({t,i})).filter(o=>choppable(o.t)&&!(P.trees&&P.trees[o.i]&&P.trees[o.i].down))}
// how each building is holding up: the door (open, shut or broken; barred, furniture pushed against it) and its windows
function bldState(k,bi){const P=place(k);P.bst=P.bst||{};let s=P.bst[bi];if(s)return s;const r=layout(k).b[bi];
  const R=srng(hashStr(k+":door"+bi));s=P.bst[bi]={door:k!==campK()&&R()<.25?"open":"shut",bar:0,furn:false,dhp:100,wins:(r.wins||[]).map(()=>({board:0,broken:R()<.15,hp:40}))};return s}
// how much it takes to break the door in: the door itself, every bar across it, and anything heavy pushed against it
function doorMax(s){return 100+s.bar*70+(s.furn?120:0)}
function winMax(w){return 40+w.board*55}
function bldIndex(k,r){return layout(k).b.indexOf(r)}
function homeBld(){if(!S.camp)return null;const L=layout(S.camp.site).b;return L.find(r=>!r.barn)||L[0]||null}
// The yard: can the dead walk from the edge of the scene to your front door? A breadth-first walk over the dead's grid
// from every open edge cell. Comes back sealed, or with the way they'd come in.
function perimeter(k){k=k||campK();if(!k||!LOCS[k])return null;const g=grid(k,true).a;const home=k===campK()?homeBld():layout(k).b[0];
  const gx=home?home.door.ox:0,gz=home?home.door.oz+.6:4;let goal=gc(gz)*GN+gc(gx);if(g[goal]===1){const f=freeNear(g,gc(gx),gc(gz),3);if(f<0)return{sealed:true,path:[]};goal=f}
  const from=new Int32Array(GN*GN).fill(-2);const q=new Int32Array(GN*GN);let h=0,t=0;const lo=gc(-SH+1),hi=gc(SH-1);
  for(let i=lo;i<=hi;i++)for(const j of [lo,hi]){for(const [a,b] of [[i,j],[j,i]]){const n=b*GN+a;if(!g[n]&&from[n]===-2){from[n]=-1;q[t++]=n}}}
  while(h<t){const c=q[h++];if(c===goal)break;const cx=c%GN,cz=(c/GN)|0;for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<lo||nz<lo||nx>hi||nz>hi)continue;const n=nz*GN+nx;if(g[n]||from[n]!==-2)continue;from[n]=c;q[t++]=n}}
  if(from[goal]===-2)return{sealed:true,path:[],goal:{x:gx,z:gz}};
  const path=[];let c=goal;while(c>=0){path.push([cellX(c%GN),cellX((c/GN)|0)]);c=from[c]}return{sealed:false,path:path.reverse(),goal:{x:gx,z:gz}}}
// a sealed yard makes the camp much harder to get into; worked out once a game hour, since it doesn't change often
function yardSealed(){if(!S.camp)return false;const c=S.flags.yard;if(c&&c.bv===S.bv&&S.t-c.t<HOUR)return c.sealed;const r=perimeter();const sealed=!!(r&&r.sealed);S.flags.yard={bv:S.bv,t:S.t,sealed};return sealed}
// ---------- pushing a car in neutral ----------
// S.push = {k, car, x0,z0,r0, x1,z1,r1, prog, len, mask}: the car rolls toward where you want it, as fast as the
// people behind it can push. One person barely moves it; three or four get it rolling.
function carMask(k,ci){const a=new Uint8Array(GN*GN);const put=(i,j)=>{if(i>=0&&j>=0&&i<GN&&j<GN)a[j*GN+i]=1};let n=0;
  for(const e of blockers(k)){const kind=e.car?e.kind:(e[5]||0);if(kind===3)continue;if(e.car){if(n++===ci)continue;const [cx,cz,hw,hd,rot]=e.car;const co=Math.cos(rot),si=Math.sin(rot),r=Math.hypot(hw,hd)+1;
      for(let i=gc(cx-r);i<=gc(cx+r);i++)for(let j=gc(cz-r);j<=gc(cz+r);j++){const dx=cellX(i)-cx,dz=cellX(j)-cz;if(Math.abs(dx*co-dz*si)<hw+.05&&Math.abs(dx*si+dz*co)<hd+.05)put(i,j)}}
    else{const [x0,z0,x1,z1]=e;for(let i=gc(x0);i<=gc(x1-1e-6);i++)for(let j=gc(z0);j<=gc(z1-1e-6);j++)put(i,j)}}
  return a}
// does a car fit here? (its footprint against everything else; the edge of the scene counts too)
function carFits(mask,x,z,rot){if(Math.abs(x)>SH-2.5||Math.abs(z)>SH-2.5)return false;const co=Math.cos(rot),si=Math.sin(rot);
  for(let lx=-.85;lx<=.851;lx+=.85)for(let lz=-1.95;lz<=1.951;lz+=.65){const wx=x+lx*co+lz*si,wz=z-lx*si+lz*co;if(mask[gc(wz)*GN+gc(wx)])return false}return true}
function angLerp(a,b,t){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return a+d*t}
// can it roll from where it is to there? Checked along the way, not just at the end
function pushCheck(k,ci,x1,z1,r1){const c=carsAt(k)[ci];const mask=carMask(k,ci);const len=dist(c.x,c.z,x1,z1);const n=Math.max(2,Math.ceil(len/.4));
  for(let i=1;i<=n;i++){const t=i/n;if(!carFits(mask,lerp(c.x,x1,t),lerp(c.z,z1,t),angLerp(c.rot,r1,t)))return{ok:false,at:t};}return{ok:true,mask,len}}
function startPush(ci,x1,z1,r1){const k=S.player.loc;const c=carsAt(k)[ci];if(!c)return false;const chk=pushCheck(k,ci,x1,z1,r1);if(!chk.ok)return false;
  S.push={k,car:ci,x0:c.x,z0:c.z,r0:c.rot,x1,z1,r1,prog:0,len:Math.max(.5,chk.len),go:false,t0:S.t};PMASK=chk.mask;
  for(const p of withYou())if(!p.kid)p.helpPush=true;
  // some cars still have an alarm wired up, and it goes off the moment you lean on it
  const L=layout(k).cars[ci];if(L&&L.alarm&&!c.alarmed){c.alarmed=true;c.alarmT=S.t;if(rf()<.6){noiseAt(k,c.x,c.z,34);log("The moment you lean on it, the car alarm goes off. It whoops across the whole place. Every one of the dead for a mile heard that.","bad");if(typeof sfx==="function")sfx("alarm",c.x,c.z)}}
  return true}
function pushers(){const P=S.push;if(!P)return[];return[S.player,...S.people.filter(p=>p.loc===P.k&&p.status==="member"&&!p.kid&&!p.sleep&&!p.grabbed&&(p.helpPush||p.order&&p.order.k==="push")&&!(p.away&&p.away.out))]}
// where each pusher stands: behind the car, spread across it
function pushSpot(P,i,n){const c=carsAt(P.k)[P.car];const dir=Math.atan2(P.x1-P.x0,P.z1-P.z0);const rel=dir-c.rot;const ext=Math.abs(Math.cos(rel))*2.1+Math.abs(Math.sin(rel))*1+.55;
  const side=(i-(n-1)/2)*.75;return{x:c.x-Math.sin(dir)*ext+Math.cos(dir)*side,z:c.z-Math.cos(dir)*ext-Math.sin(dir)*side,dir}}
let PMASK=null;// what the car can't roll through, worked out when the push starts (not saved)
function pushTick(dt){const P=S.push;if(!P)return;const pl=S.player;const cs=carsAt(P.k);const c=cs[P.car];if(!PMASK)PMASK=carMask(P.k,P.car);
  if(!c||pl.loc!==P.k||pl.ko>0||S.flags.traveling||pl.grabbed){endPush(false);return}
  const L=pushers();const n=L.length;let ready=0;
  L.forEach((p,i)=>{const s=pushSpot(P,i,n);if(dist(p.x,p.z,s.x,s.z)<.7){ready++;p.pushing=true;p.tx=null;p.path=null;p.dir=s.dir;p.anim="push";if(p.id!=="you")p.act="pushing a car"}
    else{p.pushing=false;if(p.tx==null||!p.goal||dist(p.goal.x,p.goal.z,s.x,s.z)>.6)moveTo(p,s.x,s.z)}});
  if(!pl.pushing){if(S.t-P.t0>20&&!P.go)endPush(false,"You couldn't get behind it.");return}
  P.go=true;const sp=MOVE*.15*(1+.7*(ready-1));const t=Math.min(1,P.prog+sp*dt/P.len);
  const x=lerp(P.x0,P.x1,t),z=lerp(P.z0,P.z1,t),r=angLerp(P.r0,P.r1,t);
  if(!carFits(PMASK,x,z,r)){endPush(true,"It won't go any further. Something's in the way.");return}
  const dx=x-c.x,dz=z-c.z;c.x=x;c.z=z;c.rot=r;P.prog=t;for(const p of L)if(p.pushing){p.x+=dx;p.z+=dz}
  P.sq=(P.sq||0)+dt;if(P.sq>3){P.sq=0;noiseAt(P.k,c.x,c.z,6);if(typeof sfx==="function")sfx("roll",c.x,c.z)}
  syncCarConts(P.k);if(t>=1)endPush(true)}
function endPush(moved,msg){const P=S.push;if(!P)return;S.push=null;PMASK=null;for(const p of [S.player,...S.people]){p.pushing=false;if(p.anim==="push")p.anim=null;p.helpPush=false;if(p.order&&p.order.k==="push")p.order=null}
  S.bv++;bumpDecor(P.k);syncCarConts(P.k);if(msg)log(msg,"warn");
  if(moved){const c=carsAt(P.k)[P.car];log(`You roll the car into place.${P.k===campK()?"":""}`);if(P.k===campK()&&typeof showPerimeter==="function")setTimeout(()=>showPerimeter(true),300)}}
