// ================= camp stores: one shared block grid =================
// The grid is what everyone in camp shares. Counts live in S.res (food, water, wood...), S.items (loose things) and S.crafted;
// syncInv() keeps a block for every stack, keeps blocks where the player put them, and caps what doesn't fit.
// grid model adapted from the old game's block inventory
function iSize(k){if(k.startsWith("c:")){const c=S.crafted.find(c=>c.id===k.slice(2));return c?[c.size[0],c.size[1],1]:[1,1,1]}return ISZ[k]||[1,1,1]}
function gsz(o){const s=iSize(o.k);return o.r?[s[1],s[0]]:[s[0],s[1]]}
function cFits(c,w,h,x,y,skip){if(x<0||y<0||x+w>c.g[0]||y+h>c.g[1])return false;for(const o of c.items){if(o===skip)continue;const [ow,oh]=gsz(o);if(x<o.x+ow&&x+w>o.x&&y<o.y+oh&&y+h>o.y)return false}return true}
function cFind(c,k,skip){const s=iSize(k);const opts=s[0]===s[1]?[0]:[0,1];for(const r of opts){const w=r?s[1]:s[0],h=r?s[0]:s[1];for(let y=0;y+h<=c.g[1];y++)for(let x=0;x+w<=c.g[0];x++)if(cFits(c,w,h,x,y,skip))return{x,y,r}}return null}
function invGrid(){const rows=6+bldDone("shed").length*4;if(!S.inv)S.inv={g:[10,rows],items:[],u:1};S.inv.g[1]=rows;return S.inv}
// put n of something into a grid: top up stacks first, then new blocks. Returns how many didn't fit.
function gAdd(c,k,n){const st=iSize(k)[2];for(const o of c.items){if(o.k!==k||n<=0)continue;const room=st-o.n;if(room>0){const d=Math.min(room,n);o.n+=d;n-=d}}
  while(n>0){const p=cFind(c,k);if(!p)break;c.items.push({u:c.u=(c.u||1)+1,k,n:Math.min(st,n),x:p.x,y:p.y,r:p.r});n-=Math.min(st,n)}return n}
function gCount(c,k){return c.items.filter(o=>o.k===k).reduce((a,o)=>a+o.n,0)}
// move one block from one grid to another, at a spot or wherever it fits; stacks merge
function gMove(from,to,o,x,y,r){if(x!=null){const [w,h]=r?[iSize(o.k)[1],iSize(o.k)[0]]:[iSize(o.k)[0],iSize(o.k)[1]];
    const tgt=to.items.find(q=>q!==o&&q.k===o.k&&x>=q.x&&y>=q.y&&x<q.x+gsz(q)[0]&&y<q.y+gsz(q)[1]);
    if(tgt){const room=iSize(o.k)[2]-tgt.n;const d=Math.min(room,o.n);if(d<=0)return false;tgt.n+=d;o.n-=d;if(o.n<=0)from.items.splice(from.items.indexOf(o),1);return true}
    if(!cFits(to,w,h,x,y,from===to?o:null))return false;if(from!==to){from.items.splice(from.items.indexOf(o),1);to.items.push(o)}o.x=x;o.y=y;o.r=r?1:0;return true}
  if(from===to)return false;const left=gAdd(to,o.k,o.n);if(left===o.n)return false;o.n=left;if(o.n<=0)from.items.splice(from.items.indexOf(o),1);return true}
// what you and whoever's with you can carry home
function haulRows(){return 3+withYou().filter(p=>!p.kid).length*3+withYou().filter(p=>p.kid).length}
function haul(){const h=S.haul;const rows=Math.max(haulRows(),...h.items.map(o=>o.y+gsz(o)[1]));h.g[1]=rows;return h}
function unloadHaul(){const h=S.haul;if(!h.items.length)return;const got={};for(const o of h.items){const key=RES[o.k]?o.k:"i:"+o.k;got[key]=(got[key]||0)+o.n}h.items=[];addLoot(got);log(`You unload what you carried: ${lootWords(got)}.`,"good")}
function kindOf(k){return k.startsWith("c:")?"crafted":RES[k]?(k==="meds"?"meds":k):CONDS_ITEM[k]?"personal":"item"}
const CONDS_ITEM={};for(const c of Object.values(CONDS))CONDS_ITEM[c.item]=true;
function shortName(k){if(k.startsWith("c:"))return invNameOf(k);return RES[k]==="Medicine"?"Meds":RES[k]||({epipen:"EpiPen",heartpills:"Heart pills",insulin:"Insulin",fishhook:"Hooks",alcohol:"Vodka",bulb:"Flashlight",battery:"Battery",boards:"Boards",line:"Fish line"})[k]||cap1(k)}
function invNameOf(k,n){if(k.startsWith("c:")){const c=S.crafted.find(c=>c.id===k.slice(2));return c?c.n:"something"}return RES[k]||ITEMS[k]||k}
// make the blocks match the counts
function syncInv(){const c=invGrid();const full=[];
  // a block that no longer fits after a storehouse burned goes back to the pile and is re-placed
  for(const o of [...c.items]){const [w,h]=gsz(o);if(o.y+h>c.g[1]){c.items.splice(c.items.indexOf(o),1);o.lost=true}}
  const want=[];for(const cr of S.crafted)want.push(["c:"+cr.id,1,cr.owner]);
  for(const [k,n] of Object.entries(S.items))if(n>0)want.push([k,n]);
  for(const k of Object.keys(RES))want.push([k,Math.floor(S.res[k]+1e-6)]);
  const seen=new Set();
  for(const [k,n] of want){seen.add(k);const st=iSize(k)[2];let have=c.items.filter(o=>o.k===k);let tot=have.reduce((a,o)=>a+o.n,0);
    if(tot>n){let cut=tot-n;for(const o of [...have].reverse()){if(cut<=0)break;const d=Math.min(o.n,cut);o.n-=d;cut-=d;if(o.n<=0)c.items.splice(c.items.indexOf(o),1)}}
    else if(tot<n){let add=n-tot;for(const o of have){const room=st-o.n;if(room>0&&add>0){const d=Math.min(room,add);o.n+=d;add-=d}}
      while(add>0){const p=cFind(c,k);if(!p)break;const o={u:c.u++,k,n:Math.min(st,add),x:p.x,y:p.y,r:p.r};c.items.push(o);add-=o.n}
      if(add>0){full.push(k);if(RES[k])S.res[k]-=add;else if(k.startsWith("c:")){}else S.items[k]=Math.max(0,(S.items[k]||0)-add)}}}
  c.items=c.items.filter(o=>seen.has(o.k));
  // personal medicine stays marked as whose it is
  for(const o of c.items){if(CONDS_ITEM[o.k]&&!o.owner){const who=members().find(p=>p.cond&&CONDS[p.cond].item===o.k);if(who)o.owner=who.id}if(o.owner&&!(P(o.owner)?.status==="member"))o.owner=null}
  if(full.length&&S.t-(S.flags.fullMsg||-1e9)>DAY/2){S.flags.fullMsg=S.t;log(`Camp storage is full. ${listAnd([...new Set(full)].map(k=>invNameOf(k).toLowerCase()))} had nowhere to go${bldDone("shed").length?"":". A storehouse would help"}.`,"warn")}
  return c}
function invFree(){const c=invGrid();let used=0;for(const o of c.items){const [w,h]=gsz(o);used+=w*h}return c.g[0]*c.g[1]-used}
function itemCount(k){return S.items[k]||0}
function takeItem(k,n){S.items[k]=Math.max(0,(S.items[k]||0)-n);if(!S.items[k])delete S.items[k]}
function giveItem(k,n){S.items[k]=(S.items[k]||0)+n}
// who something belongs to, if anyone: a reservation the player made, or medicine someone needs to live
function ownerOf(k){const o=(S.inv?.items||[]).find(o=>o.k===k&&o.owner);if(o)return P(o.owner);if(CONDS_ITEM[k])return members().find(p=>p.cond&&CONDS[p.cond].item===k)||null;return null}
function protectedFor(k,p){const o=ownerOf(k);return o&&o!==p?o:null}
function stores(x,kind){S.storeLog=S.storeLog||[];S.storeLog.push({t:S.t,x,k:kind||""});if(S.storeLog.length>40)S.storeLog.shift()}

// ================= people help themselves =================
function useHour(h){if(!S.camp)return;const ppl=here();
  // tools and weapons get picked up by whoever's job uses them, and put back at night
  if(h===7){for(const o of S.inv?.items||[])o.by=null;
    const want={tool:["build","farm","wood"],weapon:["guard","scav"],light:["guard"],water:["water"]};
    for(const o of S.inv?.items||[]){const u=o.k.startsWith("c:")?S.crafted.find(c=>"c:"+c.id===o.k)?.use:ITEM_USE[o.k];if(!u||!want[u])continue;
      const p=ppl.find(p=>want[u].includes(p.job)&&!S.inv.items.some(q=>q.by===p.id)&&(!o.owner||o.owner===p.id||p.tr.kind<-.35));if(p){o.by=p.id;if(rf()<.3)stores(`${p.name} took the ${invNameOf(o.k).toLowerCase()} for ${JOBS[p.job].v}.`)}}}
  if(h===22)for(const o of S.inv?.items||[])o.by=null;
  for(const p of ppl){if(p.sleep||p.kid&&rf()<.5)continue;const T=p.tr;
    // a rough day: a drink, if there's one
    if(p.mood<30&&itemCount("alcohol")>0&&rf()<.06*(1-T.faith*.5)&&!protectedFor("alcohol",p)){takeItem("alcohol",1);p.mood+=12;stores(`${p.name} drank the ${ITEMS.alcohol}.`);if(rf()<.5)log(`${p.name} finished off a bottle of vodka by the fire.`)}
    // hurt with nobody tending them: they patch themselves up with what's there
    if(p.hp<45&&!lead("medic")&&S.res.meds>=1&&rf()<.15){const last=S.res.meds<2&&members().some(q=>q!==p&&q.sick);if(!last||T.kind<-.35){S.res.meds--;p.hp+=15;stores(`${p.name} used some medicine on ${pronoun(p,"p")} own wounds.`)}}
    // someone selfish helps themself to what another person needs to live
    if(T.kind<-.35&&rf()<.02*(-T.kind)*(p.mood<40||p.hp<60||S.rival?1.6:1)){
      const tgt=Object.keys(SELFISH_USE).find(k=>itemCount(k)>0&&protectedFor(k,p)&&(k!=="insulin"||S.rival&&!S.rival.gone));
      if(tgt){const owner=protectedFor(tgt,p);takeItem(tgt,1);S.flags.missing=S.flags.missing||{};S.flags.missing[tgt]={by:p.id,from:owner.id,t:S.t};stores(`Someone took ${owner.name}'s ${ITEMS[tgt]}.`,"bad");
        mem(p,`I took ${owner.name}'s ${ITEMS[tgt]} ${SELFISH_USE[tgt]}. Nobody needs to know.`,-1);
        const saw=ppl.find(q=>q!==p&&!q.sleep&&dist(q.x,q.z,p.x,p.z)<8&&rf()<.45);
        if(saw){S.flags.missing[tgt].seen=saw.id;log(`${saw.name} saw ${p.name} pocket ${owner.name}'s ${ITEMS[tgt]}.`,"bad");queueCard("theft",{who:p.id,owner:owner.id,item:tgt,saw:saw.id})}}}}}
// medicine people need to stay alive, every morning
function needsDawn(){for(const p of members()){if(!p.cond)continue;const C=CONDS[p.cond];if(C.emergency)continue;p.medDays=(p.medDays||0)+1;if(p.medDays<C.every)continue;
    if(itemCount(C.item)>0){takeItem(C.item,1);p.medDays=0;p.noMed=0;continue}
    p.noMed=(p.noMed||0)+1;p.hp-=C.hurt;p.mood-=6;const miss=S.flags.missing?.[C.item];
    if(p.noMed===1||p.hp<40)queueCard("nomed",{who:p.id,item:C.item,thief:miss&&miss.from===p.id?miss.by:null});if(p.hp<=0)die(p,`died without ${pronoun(p,"p")} ${ITEMS[C.item]}`)}}
// a bee sting, for someone who can't survive one without help
function stingCheck(){const al=here().filter(p=>p.cond==="allergy");if(!al.length||rf()>.05)return;const p=pick(al);
  if(itemCount("epipen")>0){takeItem("epipen",1);log(`A bee got ${p.name}. ${pronoun(p)==="she"?"She":"He"} jammed the EpiPen in ${pronoun(p,"p")} thigh and was fine an hour later.`,"warn");stores(`${p.name} used an EpiPen after a bee sting.`);return}
  const miss=S.flags.missing?.epipen;queueCard("sting",{who:p.id,thief:miss&&miss.from===p.id?miss.by:null})}

// ================= crafting, in your own words =================
function craftList(){return Object.entries(S.items).filter(([k,n])=>n>0).map(([k,n])=>`${ITEMS[k]} ×${n}${ownerOf(k)?` (${ownerOf(k).name}'s, needed to stay alive)`:""}`)}
function recipeCraft(text){const t=text.toLowerCase();
  for(const [re,why] of NOPE)if(re.test(t))return{ok:false,reason:why};
  for(const r of RECIPES){if(!r.w.every(re=>re.test(t)))continue;const miss=Object.entries(r.need).filter(([k,n])=>itemCount(k)<n);
    if(miss.length)return{ok:false,reason:`You'd need ${listAnd(miss.map(([k,n])=>`${n} × ${ITEMS[k]}`))}, and the camp doesn't have enough.`};
    return{ok:true,uses:r.need,makes:{name:r.make,use:r.use,v:r.v,size:[1,r.v>1?2:1]},hours:1,say:r.say}}
  return{ok:false,reason:"You turn it over in your hands, but you can't work out how to make that from what's here.",hint:true}}
function applyCraft(res){if(!res||!res.ok)return null;const harm=[];
  for(const [k,n] of Object.entries(res.uses||{})){if(RES[k])S.res[k]=Math.max(0,S.res[k]-n);else{const o=protectedFor(k,null);if(o)harm.push(o);takeItem(k,n)}}
  const m=res.makes;const id=String(S.nid++);S.crafted.push({id,n:String(m.name).slice(0,40),use:USES[m.use]?m.use:"none",v:clamp(Math.round(m.v||1),1,3),size:[clamp(m.size?.[0]||1,1,3),clamp(m.size?.[1]||1,1,3)],d:S.t});
  for(const o of harm){o.trust-=15;o.mood-=10;mem(o,`${S.player.name} used my medicine to make something.`,-6)}
  syncInv();step(Math.min(4,res.hours||1)*HOUR);stores(`You made ${m.name.toLowerCase()}.`);return{harm}}
function craftedIn(useKey){return S.crafted.filter(c=>c.use===useKey)}
