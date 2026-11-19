// ================= the health screen: your body, every wound on it, and what to do about each =================
// H opens it. Click a part of the body to see what's wrong there. Looking after yourself is four things:
// wash a wound, wrap it, eat and drink so you heal, and take antibiotics if one turns.

// where each part sits on the drawing (viewBox 0 0 160 300). Parts are shapes, or thick lines for arms and legs.
// The figure faces you, so its right side is on your left.
const BGEO={
  rleg:{ln:[[66,168],[63,216],[62,262]],w:20},lleg:{ln:[[94,168],[97,216],[98,262]],w:20},
  rfoot:{ln:[[62,268],[57,284]],w:13},lfoot:{ln:[[98,268],[103,284]],w:13},
  belly:{sh:`<path d="M47 120h66l2 32q0 12-11 13H56q-11-1-11-13z"/>`,a:[80,121],b:[80,164],w:62},
  chest:{sh:`<path d="M54 60h52q12 2 13 14l-6 46H47l-6-46q1-12 13-14z"/>`,a:[80,61],b:[80,120],w:60},
  rarm:{ln:[[41,70],[31,116],[25,158]],w:14},larm:{ln:[[119,70],[129,116],[135,158]],w:14},
  rhand:{ln:[[24,163],[21,184]],w:12},lhand:{ln:[[136,163],[139,184]],w:12},
  neck:{sh:`<path d="M72 45h16l1.5 16h-19z"/>`,a:[80,46],b:[80,61],w:16},
  head:{sh:`<ellipse cx="80" cy="28" rx="16" ry="20"/>`,a:[80,9],b:[80,47],w:30}};
const SEVC=["#56604f","#a08f4e","#c97a3a","#cc4a3d"];
// a point on a part: u runs top to bottom (or along the limb), v from one side to the other
function bpt(p,u,v){const G=BGEO[p];const L=G.ln||[G.a,G.b];const seg=[];let tot=0;for(let i=1;i<L.length;i++){const l=Math.hypot(L[i][0]-L[i-1][0],L[i][1]-L[i-1][1]);seg.push(l);tot+=l}
  let d=clamp(u,0,1)*tot,i=0;while(i<seg.length-1&&d>seg[i]){d-=seg[i];i++}
  const A=L[i],B=L[i+1],t=seg[i]?d/seg[i]:0;const ang=Math.atan2(B[1]-A[1],B[0]-A[0]);const off=(v||0)*G.w*.4;
  return{x:A[0]+(B[0]-A[0])*t+Math.sin(ang)*off,y:A[1]+(B[1]-A[1])*t-Math.cos(ang)*off,ang:ang*180/Math.PI}}
function stitchTicks(x1,y1,x2,y2,n,len=2.6){let s="";for(let i=0;i<n;i++){const t=(i+.5)/n;const x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;const a=Math.atan2(y2-y1,x2-x1)+Math.PI/2;s+=`M${(x-Math.cos(a)*len).toFixed(1)} ${(y-Math.sin(a)*len).toFixed(1)}L${(x+Math.cos(a)*len).toFixed(1)} ${(y+Math.sin(a)*len).toFixed(1)}`}return `<path d="${s}" stroke="#1a1814" stroke-width=".8" stroke-linecap="round"/>`}
// a small mark for each wound on the figure
function markShape(w){switch(w.k){
  case"scratch":return `<path d="M-3.5 -4l1.6 8M-.5 -4.6l1.6 8M2.5 -4l1.6 8" stroke="#e0685a" stroke-width="1" stroke-linecap="round"/>`;
  case"cut":return `<path d="M-2 -5l4 10" stroke="#e85e4c" stroke-width="1.9" stroke-linecap="round"/>`+(w.st?stitchTicks(-2,-5,2,5,3):"");
  case"deep":return `<path d="M-2.6 -6.5l5.2 13" stroke="#6e1612" stroke-width="3.4" stroke-linecap="round"/><path d="M-2.6 -6.5l5.2 13" stroke="#ef6a56" stroke-width="1.1" stroke-linecap="round"/>`+(w.st?stitchTicks(-2.6,-6.5,2.6,6.5,4,3.2):"");
  case"bite":return `<path d="M-5 -1.4a5 3.6 0 0 0 10 0M-5 1.4a5 3.6 0 0 1 10 0" fill="none" stroke="#ef6a56" stroke-width="1.6" stroke-dasharray="1.5 1.1"/><circle r="1.8" fill="#6e1612"/>`;
  case"bruise":return `<ellipse rx="6.2" ry="4.6" fill="#7a5aa0" opacity=".62"/>`;
  case"fracture":return `<ellipse rx="9" ry="6" fill="#d08a3a" opacity=".35"/><path d="M-6.5 1l2.6-3 2.6 3 2.6-3 2.6 3 2.6-3" fill="none" stroke="#f6eed6" stroke-width="1.5" stroke-linejoin="round"/>`;
  case"incision":return `<path d="M-6 0h12" stroke="#d07a6a" stroke-width="1.3"/>`+stitchTicks(-6,0,6,0,4);
  default:return""}}
function wMark(w){const p=bpt(w.p,w.u,w.v);const G=BGEO[w.p];const hw=G.w/2;let m="";
  if(w.band){const d=w.band.d;const col=w.band.k==="poultice"?"#8fae6c":w.band.k==="rag"?(d>.7?"#9a6a54":"#c9b994"):d>.7?"#b46a5a":d>.4?"#dccb98":"#f1ece1";
    m+=`<rect x="-4.6" y="${(-hw-1.6).toFixed(1)}" width="9.2" height="${(G.w+3.2).toFixed(1)}" rx="2" fill="${col}" stroke="#0d0f0d" stroke-width=".8"/>`+(d>.4?`<ellipse rx="2.6" ry="${(2+d*3).toFixed(1)}" fill="#8a2a22" opacity="${((d-.3)*.9).toFixed(2)}"/>`:"")}
  else m+=markShape(w);
  if(w.spl)m+=w.splItem==="strap"?`<rect x="-11" y="${(-hw-2.4).toFixed(1)}" width="22" height="${(G.w+4.8).toFixed(1)}" rx="3" fill="#d8ccb2" stroke="#0d0f0d" stroke-width=".8" opacity=".92"/><path d="M-4 ${(-hw-2).toFixed(1)}v${(G.w+4).toFixed(1)}M4 ${(-hw-2).toFixed(1)}v${(G.w+4).toFixed(1)}" stroke="#b9ab8c" stroke-width="1"/>`:w.cast?`<rect x="-23" y="${(-hw-2.2).toFixed(1)}" width="46" height="${(G.w+4.4).toFixed(1)}" rx="${hw.toFixed(1)}" fill="#ebe7dd" stroke="#0d0f0d" stroke-width=".8" opacity=".95"/>`
    :`<rect x="-22" y="${(-hw-3.4).toFixed(1)}" width="44" height="2.8" rx="1" fill="#b0824e" stroke="#0d0f0d" stroke-width=".6"/><rect x="-22" y="${(hw+.6).toFixed(1)}" width="44" height="2.8" rx="1" fill="#b0824e" stroke="#0d0f0d" stroke-width=".6"/><path d="M-13 ${(-hw-3.6).toFixed(1)}v${(G.w+7.2).toFixed(1)}M12 ${(-hw-3.6).toFixed(1)}v${(G.w+7.2).toFixed(1)}" stroke="#3a3530" stroke-width="2.6"/>`;
  if(w.inf>=30)m=`<circle r="${w.inf>=55?10:7.5}" fill="none" stroke="#d6cc52" stroke-width="1.3" stroke-dasharray="2 1.5"/>`+m;
  return `<g transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.ang.toFixed(0)})">${m}</g>`}
function partLabel(p){const W=wounds().filter(w=>w.p===p);return cap(BODY[p].n)+": "+(W.length?W.map(w=>woundName(w).toLowerCase()).join(", "):"nothing wrong")}
function bodySvg(sel){const order=["rleg","lleg","rfoot","lfoot","belly","chest","rarm","larm","rhand","lhand","neck","head"];let parts="",marks="";
  for(const p of order){const G=BGEO[p];const sev=partSeverity(p);const f=SEVC[sev];const on=sel===p;
    let s;if(G.ln){const d="M"+G.ln.map(q=>q.join(" ")).join("L");s=`<path d="${d}" fill="none" stroke="${on?"#e48a3f":"#0b0d0b"}" stroke-width="${G.w+(on?5:2.6)}" stroke-linecap="round" stroke-linejoin="round"/><path class="bfill" d="${d}" fill="none" stroke="${f}" stroke-width="${G.w}" stroke-linecap="round" stroke-linejoin="round"/>`}
    else s=`<g class="bfill" fill="${f}" stroke="${on?"#e48a3f":"#0b0d0b"}" stroke-width="${on?2.4:1.4}">${G.sh}</g>`;
    parts+=`<g class="bpart${on?" on":""}" data-act="hpart" data-v="${p}" role="button" aria-label="${esc(partLabel(p))}"><title>${esc(partLabel(p))}</title>${s}</g>`}
  for(const w of wounds())marks+=wMark(w);
  return `<svg viewBox="0 0 160 300" class="bsvg" role="group" aria-label="Your body. Click a part to see what's wrong there."><text x="14" y="62" class="blr">R</text><text x="140" y="62" class="blr">L</text>${parts}<g pointer-events="none">${marks}</g></svg>`}

// ---------- the side: what's wrong, and what you can do about it ----------
function agoWord(m){m=Math.max(0,m);if(m<50)return"just now";const h=Math.round(m/60);if(h<24)return `${h} hour${h>1?"s":""} ago`;const d=Math.round(m/1440);return `${d} day${d>1?"s":""} ago`}
function supplyWord(list){const h=haveFor(list);return h.length?`With ${h[0][2]}`:""}
// what this wound needs first
function nextFix(w){if(needsWrap(w)&&wBleed(w)>.25)return"wrap";if(needsWash(w))return"wash";if(needsWrap(w))return"wrap";return""}
function woundActs(w,busy){const A=[];const nf=nextFix(w);const b=(k,t,sub,dis)=>`<button class="btn${!dis&&k===nf?" pri":""}" data-act="hdo" data-v="${k}|${w.id}"${dis?" disabled":""}>${esc(t)}<small>${esc(sub)}</small></button>`;
  if(needsWash(w)){const s=supplyWord(CLEANERS);A.push(b("wash","Wash it",busy||s||"Need water, alcohol or whiskey",busy||!s))}
  if(needsWrap(w)){const fr=w.k==="fracture";const s=supplyWord(fr?BINDS:DRESSINGS);A.push(b("wrap",fr?"Wrap it tight":"Wrap it",busy||s||(fr?"Need a splint, a bandage or cloth":"Need a bandage or a strip of cloth"),busy||!s))}
  return A}
function woundCard(w,showPart,busy){const A=woundActs(w,busy);
  return `<div class="wcard s${wSeverity(w)}"><div class="row" style="justify-content:space-between;gap:6px"><b>${esc(woundName(w))}${showPart?` <span class="mute">· ${esc(w.at)}</span>`:""}</b><span class="mono mute">${esc(showPart?agoWord(S.t-w.born):w.at)}</span></div>
   <ul class="wstat">${woundStatus(w).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${A.length?`<div class="row wacts">${A.join("")}</div>`:""}</div>`}
function suppliesHtml(){const L=[["bandage","Bandages"],["poultice","Poultices"],["cloth","Cloth"],["splint","Splints"],["rubbing_alcohol","Alcohol"],["whiskey","Whiskey"],["boiled_water","Boiled water"],["water_bottle","Water"],["antibiotics","Antibiotics"],["painkillers","Painkillers"]];
  const have=L.map(([id,n])=>{const it=ITEMS[id];const c=it.uses?usesLeft(id):invCount(id);return c?`<span class="sup">${itemIcon(id,18)}${esc(n)} <b class="mono">${c}${it.uses?" use"+(c>1?"s":""):""}</b></span>`:""}).filter(Boolean);
  return `<div><div class="lbl">What you have to work with</div><div class="sups">${have.length?have.join(""):'<span class="mute">Nothing. Pharmacies, bathroom cabinets and the hospital are where to look. Any clean water washes a wound, and a strip of cloth wraps one.</span>'}</div></div>`}
function medsHtml(busy){const B=body();const im=infMax();const pl=S.player;const L=[];
  const abx=B.abx>S.t;if(im>=10||pl.sick||abx)L.push(`<button class="btn${pl.sick||im>=40?" pri":""}" data-act="hmed" data-v="abx"${!invHas("antibiotics")||abx||busy?" disabled":""}>Take antibiotics<small>${abx?"A course is working":invHas("antibiotics")?(pl.sick?"Cures the fever and the infection":"Stops the infection"):"You don't have any"}</small></button>`);
  const pk=B.pk>S.t;if(wounds().length&&invHas("painkillers")&&!pk)L.push(`<button class="btn" data-act="hmed" data-v="pain"${busy?" disabled":""}>Take painkillers<small>Takes the edge off</small></button>`);
  return L.length?`<div class="row">${L.join("")}</div>`:""}
// the one line that tells you how to get better
function healAdvice(){const pl=S.player;const W=wounds();if(!W.length&&pl.hp>=95)return"";const ff=feedFactor();
  const L=[];if(W.some(needsWash)||W.some(needsWrap))L.push("Wash and wrap what's open.");if(W.some(w=>w.inf>=25)||pl.sick)L.push("Take antibiotics for anything that's turned.");
  L.push(ff<1?"Eat and drink: hungry, you barely heal at all.":ff<1.4?"Eat and drink well: being fed makes you heal much faster.":"You're fed and watered, so you're healing well.");L.push("Sleep heals fastest.");
  return `<p class="hadvice mono">${esc(L.join(" "))}</p>`}
function sideHtml(sel){const pl=S.player;const busy=zedNear(7)?"The dead are too close":"";const sum=bodySummary();
  const W=wounds().filter(w=>!sel||w.p===sel).sort((a,b)=>wSeverity(b)-wSeverity(a)||b.born-a.born);
  const msg=UI.hmsg&&S.t-UI.hmsg.t<30?`<p class="hmsg">${esc(UI.hmsg.x)}</p>`:"";
  const todo=wounds().some(w=>needsWash(w)&&haveFor(CLEANERS).length||needsWrap(w)&&haveFor(w.k==="fracture"?BINDS:DRESSINGS).length);
  return `${msg}<div class="row" style="justify-content:space-between"><div><span class="lbl">Health</span> <b class="mono ${pl.hp<30?"neg":pl.hp<60?"warn":"pos"}">${Math.round(pl.hp)}</b><span class="mono mute"> / 100</span></div>${sel?`<button class="tag" data-act="hpart" data-v="">Show everything</button>`:""}</div>
   ${sum.length?`<div class="hsum">${sum.map(c=>`<span class="k${c.k}">${esc(c.t)}</span>`).join("")}</div>`:'<p class="pos">You feel all right. For now.</p>'}
   ${healAdvice()}
   ${busy?`<p class="warn mono">The dead are too close to stop and tend wounds.</p>`:""}
   ${todo&&!sel?`<div class="row"><button class="btn pri" data-act="htendall"${busy?" disabled":""}>Wash and wrap everything<small>Uses what you have, best first</small></button></div>`:""}
   <div class="lbl">${sel?esc(cap(BODY[sel].n)):"Where you're hurt"}</div>
   ${W.length?W.map(w=>woundCard(w,!sel,busy)).join(""):`<p class="mute">${sel?`Nothing wrong with your ${esc(BODY[sel].n)}.`:"Not a scratch on you. Click a part of the body to look closer."}</p>`}
   ${medsHtml(busy)}${suppliesHtml()}`}
function healthHtml(){const sel=UI.hsel&&BODY[UI.hsel]?UI.hsel:null;
  return `<div class="hp-wrap"><div class="hp-body">${bodySvg(sel)}<div class="mono mute small">Colors: <span style="color:${SEVC[1]}">minor</span> · <span style="color:${SEVC[2]}">needs care</span> · <span style="color:${SEVC[3]}">serious</span></div></div><div class="hp-side">${sideHtml(sel)}</div></div>`}
function healthAfterRender(){}

// ---------- doing it: one click, a few minutes pass ----------
function doCare(k,w,item){if(!w||S.player.alive===false)return;if(zedNear(7)){toast("Not with the dead this close.");return}
  const where=w.at,name=woundName(w).toLowerCase();let it=null,mins=4,msg="";
  if(k==="wash"){it=washWound(w,item);if(!it){toast("You've nothing to wash it with. Even a bottle of water would do.");return}
    const harsh=it==="rubbing_alcohol"||it==="whiskey";msg=`You wash the ${name} on your ${where} with ${CLEANERS.find(x=>x[0]===it)[2]}. ${harsh?"It stings like fire, then settles.":"It's clean now."}`}
  if(k==="wrap"){const fr=w.k==="fracture";it=wrapWound(w,item);if(!it){toast(fr?"You need something to bind it with: a splint, a bandage, or cloth.":"You've nothing to wrap it with. A strip of cloth would do.");return}
    mins=fr?10:5;msg=fr?`You ${it==="splint"?"strap the splint along":"wrap your "+BODY[w.p].n+" tight with "+BINDS.find(x=>x[0]===it)[2]+", holding"} your ${fr&&it==="splint"?BODY[w.p].n:"the bone still"}. It holds.`
      :`You wrap ${DRESSINGS.find(x=>x[0]===it)[2]} around the ${name} on your ${where}.${w.bl>.03?" The bleeding slows to nothing.":""}`}
  if(k==="stitch"){it=stitchWound(w,item);if(!it){toast("Nothing here needs stitches.");return}mins=12;msg=`You sew the ${name} on your ${where} shut. Not pretty, but it's closed.`}
  journal(msg,"good");UI.hmsg={t:S.t+mins,x:msg};act(mins);save();render()}
function onHealthAct(a,v,el,e){if(!S)return false;
  switch(a){
    case"hpart":UI.hsel=v&&UI.hsel!==v?v:null;render();return true;
    case"hdo":{const [k,id]=v.split("|");doCare(k,woundById(+id));return true}
    case"htendall":{if(zedNear(7)){toast("Not with the dead this close.");return true}const r=tendAll();
      const list=r.did.length>1?r.did.slice(0,-1).join(", ")+(r.did.length>2?",":"")+" and "+r.did[r.did.length-1]:r.did[0];
      const msg=r.did.length?`You ${list}.${r.miss.length?` You ran out of what you'd need to ${r.miss.join(" or ")} the rest.`:""}`:`You don't have what you need to ${r.miss.join(" or ")||"do any more"}.`;
      journal(msg,r.did.length?"good":"");UI.hmsg={t:S.t+r.mins,x:msg};if(r.mins)act(r.mins);save();render();return true}
    case"hmed":{const ok=v==="pain"?takePainkillers():takeAntibiotics();if(ok){advance(2);UI.hmsg={t:S.t,x:S.journal[0].x}}save();render();return true}
  }
  return false}
// reaching for a medical supply in your bag goes to the wound it's for
function useMed(id){const it=ITEMS[id];
  if(it.med==="pain"){if(takePainkillers()){advance(2);save();render()}return}
  if(it.med==="abx"){if(takeAntibiotics()){advance(2);save();render()}return}
  const k={dress:"wrap",clean:"clean",stitch:"stitch",splint:"splint"}[it.med];const w=woundFor(k);
  if(!w){toast({wrap:"Nothing needs wrapping right now.",clean:"Nothing needs washing right now.",stitch:"Nothing needs stitches right now.",splint:"Nothing's broken. Keep it that way."}[k]);return}
  doCare(k==="clean"?"wash":k==="stitch"?"stitch":"wrap",w,id)}
