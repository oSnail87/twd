
// ================= the block inventory =================
// An item instance: {u, id, n (stack), dur, r (rotated), x, y, c (its own grid, for bags and clothes with pockets)}
function mkInst(id,n=1){const it=ITEMS[id];const g={u:"i"+(S.nextU++),id,n:Math.max(1,Math.min(n,it.st||1)),dur:it.dur||0,r:0,x:0,y:0};if(it.grid)g.c={g:[...it.grid],items:[]};return g}
function isz(g){const s=ITEMS[g.id].sz;return g.r?[s[1],s[0]]:[s[0],s[1]]}
function cFits(c,w,h,x,y,skip){if(x<0||y<0||x+w>c.g[0]||y+h>c.g[1])return false;for(const o of c.items){if(o===skip)continue;const [ow,oh]=isz(o);if(x<o.x+ow&&x+w>o.x&&y<o.y+oh&&y+h>o.y)return false}return true}
function cFind(c,g,skip){const s=ITEMS[g.id].sz;const opts=s[0]===s[1]?[0]:[0,1];for(const r of opts){const w=r?s[1]:s[0],h=r?s[0]:s[1];for(let y=0;y+h<=c.g[1];y++)for(let x=0;x+w<=c.g[0];x++)if(cFits(c,w,h,x,y,skip))return{x,y,r}}return null}
function cPut(c,g,x,y,r){g.x=x;g.y=y;g.r=r;if(!c.items.includes(g))c.items.push(g)}
function cRemove(c,g){const i=c.items.indexOf(g);if(i>=0)c.items.splice(i,1)}
function cCount(c,id){let n=0;for(const o of c.items)if(o.id===id)n+=o.n;return n}
// stack into what's there, then place new blocks. Returns how many didn't fit.
function cAdd(c,id,n,scatter){const it=ITEMS[id];if(!it)return 0;
  if(it.st>1)for(const o of c.items){if(o.id!==id||n<=0)continue;const room=it.st-o.n;if(room>0){const k=Math.min(room,n);o.n+=k;n-=k}}
  while(n>0){const g=mkInst(id,Math.min(n,it.st));let p=null;
    if(scatter){const s=it.sz;for(let t=0;t<14&&!p;t++){const r=s[0]!==s[1]&&rf()<.35?1:0;const w=r?s[1]:s[0],h=r?s[0]:s[1];const x=rnd(0,c.g[0]-w),y=rnd(0,c.g[1]-h);if(x>=0&&y>=0&&cFits(c,w,h,x,y))p={x,y,r}}}
    if(!p)p=cFind(c,g);if(!p)break;cPut(c,g,p.x,p.y,p.r);n-=g.n}
  return n}
function cFree(c){let used=0;for(const o of c.items){const [w,h]=isz(o);used+=w*h}return c.g[0]*c.g[1]-used}

// ---------- what you carry ----------
const CONT_ORDER=["legs","rig","body","outer","back"];
const CONT_LABEL={legs:"Pockets",rig:"Rig",body:"Shirt pocket",outer:"Jacket pockets",back:"Bag"};
function pConts(){const pl=S.player;const out=[];for(const s of CONT_ORDER){const g=pl.eq[s];if(g&&g.c)out.push({slot:s,g,c:g.c})}return out}
function gearEq(s){return S.player.eq[s]||null}
function weapon(){return S.player.eq.weapon||null}
// counts of loose things you carry, by kind (what the old code called the inventory)
function invMap(){const m={};for(const {c} of pConts())for(const o of c.items)m[o.id]=(m[o.id]||0)+o.n;return m}
function invCount(id){let n=0;for(const {c} of pConts())n+=cCount(c,id);for(const s of SLOTS){const g=S.player.eq[s];if(g&&g.id===id)n++}return n}
function invHas(id,n=1){return invCount(id)>=n}
function invAdd(id,n=1,quiet){if(!ITEMS[id])return 0;if(n<0){invTake(id,-n);return 0}if(n===0)return 0;
  for(const {c} of pConts()){n=cAdd(c,id,n);if(n<=0)return 0}
  dropToGround(id,n);if(!quiet&&typeof toast==="function")toast(`No room for ${itemPhrase(id,n)}. You set ${n>1?"them":"it"} down at your feet.`);return n}
function invTake(id,n=1){const L=pConts();for(let i=L.length-1;i>=0;i--){const c=L[i].c;for(const o of [...c.items]){if(n<=0)return;if(o.id!==id)continue;const k=Math.min(o.n,n);o.n-=k;n-=k;if(o.n<=0){cRemove(c,o);if(o.c)spill(o)}}}
  const pl=S.player;for(const s of ["side","weapon",...SLOTS]){if(n<=0)return;const g=pl.eq[s];if(g&&g.id===id){pl.eq[s]=null;n--;if(g.c)spill(g)}}}
// put an instance somewhere in your containers; false if there's no room
function pStore(g,skipC){if(ITEMS[g.id].st>1)for(const {c} of pConts()){if(c===skipC)continue;for(const o of c.items){if(o.id===g.id&&o!==g&&o.n<ITEMS[g.id].st){const k=Math.min(ITEMS[g.id].st-o.n,g.n);o.n+=k;g.n-=k;if(g.n<=0)return true}}}
  for(const {c,g:holder} of pConts()){if(c===skipC||holder===g)continue;const p=cFind(c,g);if(p){cPut(c,g,p.x,p.y,p.r);return true}}return false}
// a bag or jacket left your body: its contents go into your other pockets, or on the ground
function spill(g){if(!g.c||!g.c.items.length)return;const left=[];for(const o of [...g.c.items]){cRemove(g.c,o);if(!pStore(o,g.c))left.push(o)}for(const o of left)dropInst(o)}
function equipNew(id){const g=mkInst(id);const it=ITEMS[id];const slot=it.slot==="weapon"&&S.player.eq.weapon&&it.side?"side":it.slot;S.player.eq[slot]=g;return g}
function instW(g){let w=ITEMS[g.id].w*g.n;if(g.c)for(const o of g.c.items)w+=instW(o);return w}
function weight(){const pl=S.player;let w=0;for(const s of SLOTS){const g=pl.eq[s];if(g)w+=instW(g)-ITEMS[g.id].w*.5}return w}
function maxW(){const pl=S.player;return 16+pl.sk.fight*.4+pl.sk.build*.25}
function clothesWarm(){let w=0;for(const s of ["head","body","outer","hands","legs","feet"]){const g=gearEq(s);if(g)w+=ITEMS[g.id].warm||0}return w}
function armor(){let a=0;for(const s of SLOTS){const g=gearEq(s);if(g)a+=ITEMS[g.id].armor||0}return a}
function breakSlot(s){const pl=S.player;const g=pl.eq[s];pl.eq[s]=null;if(g&&g.c)spill(g);return g}
function wearWeapon(n){const w=weapon();if(!w)return"";w.dur-=n;if(w.dur<=0){breakSlot("weapon");const pl=S.player;if(pl.eq.side){pl.eq.weapon=pl.eq.side;pl.eq.side=null}
  const t=` Your ${ITEMS[w.id].n.toLowerCase()} breaks.`;journal(t.trim(),"bad");return t}return""}
function wearClothes(h){for(const s of ["head","body","outer","hands","legs","feet","back","rig"]){const g=gearEq(s);if(!g||!g.dur)continue;g.dur-=h*.12;if(g.dur<=0){breakSlot(s);journal(`Your ${ITEMS[g.id].n.toLowerCase()} falls apart.`,"bad")}}}
function allCarried(){const out=[];const pl=S.player;for(const s of SLOTS)if(pl.eq[s])out.push({g:pl.eq[s],slot:s});for(const {c} of pConts())for(const o of c.items)out.push({g:o,c});return out}
function hasTool(t){return allCarried().some(x=>ITEMS[x.g.id].tool===t)}
function wearTool(t,n){const x=allCarried().find(x=>ITEMS[x.g.id].tool===t);if(!x)return;const g=x.g;g.dur-=n;if(g.dur<=0){if(x.slot)breakSlot(x.slot);else cRemove(x.c,g);journal(`Your ${ITEMS[g.id].n.toLowerCase()} breaks.`,"bad")}}
function skillUp(k,a=.12){S.player.sk[k]=Math.min(10,+(S.player.sk[k]+a).toFixed(2))}
function durPct(g){const it=ITEMS[g.id];return it.dur?clamp(g.dur/it.dur*100,0,100):100}

// ---------- the ground ----------
function pileAt(x,z,make){let best=null,bd=1.4;for(const p of S.piles){const d=dist(p.x,p.z,x,z);if(d<bd){bd=d;best=p}}
  if(!best&&make){best={id:"pile"+(S.nextU++),x,z,c:{g:[6,6],items:[]},t:S.t};S.piles.push(best)}return best}
function dropInst(g,x,z){const pl=S.player;const p=pileAt(x??pl.x,z??pl.z,true);let pos=cFind(p.c,g);while(!pos&&p.c.g[1]<60){p.c.g[1]+=2;pos=cFind(p.c,g)}if(pos)cPut(p.c,g,pos.x,pos.y,pos.r);p.t=S.t;return p}
function dropToGround(id,n){const it=ITEMS[id];while(n>0){const g=mkInst(id,Math.min(n,it.st));dropInst(g);n-=g.n}}
function cleanPiles(){S.piles=S.piles.filter(p=>p.c.items.length)}

// ---------- furniture, cars and what's inside ----------
function contState(cid){let s=S.cont[cid];if(!s){const C=CONTS[cid];const T=CONT[C.k]||{g:[4,3]};s=S.cont[cid]={c:{g:[...T.g],items:[]},rolled:false,rev:0,lock:!!T.locked}}return s}
function isShop(b){return b&&!["house","farmhouse","trailer","cabin"].includes(b.type)}
function rollLoot(cid){const s=contState(cid);if(s.rolled)return s;s.rolled=true;const C=CONTS[cid];const pl=S.player;const day=dayOf(S.t);const b=C.b?BMAP[C.b]:null;
  const shop=isShop(b)||!b;const picked=C.b===pl.home?0:Math.min(.85,(day-1)*(shop?.07:.035)+(S.flags.clinic&&shop?.06:0));
  const mult=(1-picked)*(1+pl.sk.scavenge*.05);
  for(const [id,ch,mn=1,mx=1] of (LOOT[C.k]||[])){if(!ITEMS[id])continue;if(rf()<ch*mult)cAdd(s.c,id,rnd(mn,mx),true)}
  if(C.b===pl.home&&!pl.flags.homeSeeded)seedHome(b);
  s.c.items.sort((a,b)=>a.y-b.y||a.x-b.x);return s}
// your own house has a few things you'd know were there
function seedHome(b){const pl=S.player;pl.flags.homeSeeded=true;const add=(k,list)=>{const c=Object.values(CONTS).find(c=>c.b===b.id&&c.k===k);if(!c)return;const s=contState(c.id);if(!s.rolled){s.rolled=true;for(const [id,ch,mn=1,mx=1] of (LOOT[k]||[]))if(rf()<ch)cAdd(s.c,id,rnd(mn,mx),true)}for(const [id,n] of list)cAdd(s.c,id,n);s.c.items.sort((a,c)=>a.y-c.y||a.x-c.x)};
  add("closet",[["backpack",1],["tshirt",1]]);add("cupboard",[["canned_food",2],["kitchen_knife",1],["water_bottle",1]]);add("fridge",[["water_bottle",2]]);add("nightstand",[["flashlight",1]]);add("medicine",[["bandage",2]])}
function contName(cid){if(cid.startsWith("pile"))return"On the ground";const C=CONTS[cid];return C?C.n:"Container"}
function openContObj(cid){if(cid.startsWith("pile")){const p=S.piles.find(p=>p.id===cid);return p?{c:p.c,rev:1e9,pile:p}:null}const s=rollLoot(cid);return{c:s.c,rev:s.rev,st:s}}
