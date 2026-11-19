// ================= the health screen: your body, every wound on it, and your own hands doing the work =================
// H opens it. Click a part of the body to see what's wrong there. Every fix is done by hand:
// wipe a wound clean, wrap a bandage (hold to pull it around, let go when it's snug), put stitches in one at a time,
// line a splint up along the bone and strap it down. The world waits while you work, then the time it took passes.

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
function tbtn(k,w,t,sub,dis){return `<button class="btn${!dis&&k===nextFix(w)?" pri":""}" data-act="htreat" data-v="${k}|${w.id}"${dis?" disabled":""}>${esc(t)}<small>${esc(sub)}</small></button>`}
// what this wound needs first
function nextFix(w){const K=WOUND[w.k];if(w.k==="fracture")return w.spl?"":"splint";if(K.closed)return"";const b=wBleed(w);
  if(b>.25&&!w.band)return"wrap";if(w.band&&w.band.d>.7)return"wrap";if(needsClean(w)&&(w.dirt>.15||w.inf>12))return"clean";if(w.k==="deep"&&!w.st)return"stitch";if(!w.band&&w.k!=="scratch"&&!(w.st&&w.heal>=80))return"wrap";return""}
function woundActs(w,busy){const K=WOUND[w.k];const A=[];
  if(needsClean(w)){const s=supplyWord(CLEANERS);A.push(tbtn("clean",w,"Clean it",busy||s||"Need alcohol, whiskey or clean water",busy||!s))}
  if(!K.closed){const s=supplyWord(DRESSINGS);A.push(tbtn("wrap",w,w.band?"Change the dressing":"Bandage it",busy||s||"Need a bandage or a strip of cloth",busy||!s))}
  if(canStitch(w)){const s=supplyWord(NEEDLES);A.push(tbtn("stitch",w,"Stitch it",busy||s||"Need a suture kit or needle and thread",busy||!s))}
  if(w.k==="fracture"&&!w.spl){const s=supplyWord(SPLINTS);A.push(tbtn("splint",w,"Splint it",busy||s||"Need a splint, or wood and cloth",busy||!s))}
  if(w.band)A.push(`<button class="btn" data-act="hundress" data-v="${w.id}"${busy?" disabled":""}>Take the dressing off<small>${w.band.k==="bandage"?"Keep it to boil clean":"Throw it away"}</small></button>`);
  return A}
function woundCard(w,showPart,busy){const A=woundActs(w,busy);
  return `<div class="wcard s${wSeverity(w)}"><div class="row" style="justify-content:space-between;gap:6px"><b>${esc(woundName(w))}${showPart?` <span class="mute">· ${esc(w.at)}</span>`:""}</b><span class="mono mute">${esc(showPart?agoWord(S.t-w.born):w.at+" · "+agoWord(S.t-w.born))}</span></div>
   <ul class="wstat">${woundStatus(w).map(x=>`<li>${esc(x)}</li>`).join("")}</ul>${A.length?`<div class="row wacts">${A.join("")}</div>`:""}</div>`}
function suppliesHtml(){const L=[["bandage","Bandages"],["poultice","Poultices"],["cloth","Cloth"],["rubbing_alcohol","Alcohol"],["whiskey","Whiskey"],["boiled_water","Boiled water"],["suture_kit","Sutures"],["sewing_kit","Needle"],["splint","Splints"],["painkillers","Painkillers"],["antibiotics","Antibiotics"],["dirty_bandage","Bloody bandages"]];
  const have=L.map(([id,n])=>{const it=ITEMS[id];const c=it.uses?usesLeft(id):invCount(id);return c?`<span class="sup">${itemIcon(id,18)}${esc(n)} <b class="mono">${c}${it.uses?" use"+(c>1?"s":""):""}</b></span>`:""}).filter(Boolean);
  return `<div><div class="lbl">What you have to work with</div><div class="sups">${have.length?have.join(""):'<span class="mute">Nothing. Pharmacies, bathroom cabinets and the hospital are where to look. Cloth works as a rag in a pinch.</span>'}</div></div>`}
function medsHtml(busy){const B=body();const pn=painNow();const im=infMax();const pl=S.player;const L=[];
  const pk=B.pk>S.t;if(pn>8||pk)L.push(`<button class="btn" data-act="hmed" data-v="pain"${!invHas("painkillers")||pk||busy?" disabled":""}>Take painkillers<small>${pk?`Working. Wears off in ${Math.max(1,Math.round((B.pk-S.t)/60))} h`:invHas("painkillers")?`Pain ${Math.round(pn)} of 100. Takes the edge off for 6 h`:"You don't have any"}</small></button>`);
  const abx=B.abx>S.t;if(im>=12||pl.sick||abx)L.push(`<button class="btn" data-act="hmed" data-v="abx"${!invHas("antibiotics")||abx||busy?" disabled":""}>Take antibiotics<small>${abx?"A course is working":invHas("antibiotics")?(pl.sick?"Fights the fever and the infection":"Stops a wound from turning"):"You don't have any"}</small></button>`);
  return L.length?`<div class="row">${L.join("")}</div>`:""}
function sideHtml(sel){const pl=S.player;const busy=zedNear(7)?"The dead are too close":"";const sum=bodySummary();
  const W=wounds().filter(w=>!sel||w.p===sel).sort((a,b)=>wSeverity(b)-wSeverity(a)||b.born-a.born);
  const msg=UI.hmsg&&S.t-UI.hmsg.t<30?`<p class="hmsg">${esc(UI.hmsg.x)}</p>`:"";
  return `${msg}<div class="row" style="justify-content:space-between"><div><span class="lbl">Health</span> <b class="mono ${pl.hp<30?"neg":pl.hp<60?"warn":"pos"}">${Math.round(pl.hp)}</b><span class="mono mute"> / 100</span></div>${sel?`<button class="tag" data-act="hpart" data-v="">Show everything</button>`:""}</div>
   ${sum.length?`<div class="hsum">${sum.map(c=>`<span class="k${c.k}">${esc(c.t)}</span>`).join("")}</div>`:'<p class="pos">You feel all right. For now.</p>'}
   ${busy?`<p class="warn mono">The dead are too close to stop and tend wounds.</p>`:""}
   <div class="lbl">${sel?esc(cap(BODY[sel].n)):"Where you're hurt"}</div>
   ${W.length?W.map(w=>woundCard(w,!sel,busy)).join(""):`<p class="mute">${sel?`Nothing wrong with your ${esc(BODY[sel].n)}.`:"Not a scratch on you. Click a part of the body to look closer."}</p>`}
   ${medsHtml(busy)}${suppliesHtml()}`}
function healthHtml(){if(UI.treat&&!woundById(UI.treat.wid))UI.treat=null;const sel=UI.hsel&&BODY[UI.hsel]?UI.hsel:null;
  return `<div class="hp-wrap"><div class="hp-body">${bodySvg(UI.treat?woundById(UI.treat.wid).p:sel)}<div class="mono mute small">Colors: <span style="color:${SEVC[1]}">minor</span> · <span style="color:${SEVC[2]}">needs care</span> · <span style="color:${SEVC[3]}">serious</span></div></div><div class="hp-side">${UI.treat?treatHtml():sideHtml(sel)}</div></div>`}

// ---------- hands-on: the close-up and what your hands do ----------
const TREAT_NAME={clean:"Cleaning",wrap:"Dressing",stitch:"Stitching",splint:"Splinting"};
const TREAT_LIST={clean:CLEANERS,wrap:DRESSINGS,stitch:NEEDLES,splint:SPLINTS};
function openTreat(k,wid,item){const w=woundById(wid);if(!w||S.player.alive===false)return;if(zedNear(7)){toast("Not with the dead this close.");return}
  const have=haveFor(TREAT_LIST[k]);if(!have.length){toast({clean:"You've nothing to clean it with.",wrap:"You've nothing to dress it with. A strip of cloth would do.",stitch:"You need a needle and thread.",splint:"You need a splint, or some wood and cloth."}[k]);return}
  if(UI.talkTo)closeTalk(true);UI.open=null;UI.panel="health";UI.hsel=w.p;
  UI.treat={k,wid,item:item&&have.some(x=>x[0]===item)?item:have[0][0]};initTreat(UI.treat,w);render()}
function initTreat(T,w){const pl=S.player;const sk=pl.sk.medic;T.msg="";T.done=0;
  if(T.k==="wrap"||T.k==="splint"){T.need=T.k==="splint"?2:T.item==="cloth"?3:4;T.wraps=[];T.v=0;T.holding=false;T.z0=clamp(.6-sk*.014,.42,.6);T.z1=clamp(.8+sk*.012,.8,.92);T.rate=clamp(.95-sk*.025+(painNow()>50?.12:0),.62,1.1)}
  if(T.k==="splint"){T.phase="place";T.sx=180+(rf()<.5?-1:1)*(30+rf()*26);T.sy=14+rf()*8;T.q1=0}
  if(T.k==="clean"){const n=Math.round(5+w.dirt*6+(w.inf>20?3:0));T.specks=[];for(let i=0;i<n;i++){const a=rf()*6.283,r=16+rf()*38;T.specks.push({x:180+Math.cos(a)*r*1.6,y:100+Math.sin(a)*r*.62,r:2.2+rf()*2.8,a:1})}}
  if(T.k==="stitch"){const n=w.k==="deep"?6:4;T.pts=[];for(let i=0;i<n;i++){const t=(i+.5)/n;const x=132+t*96,y=78+t*44,s=i%2?1:-1;T.pts.push({x:x+s*9,y:y-s*7,mx:x-s*9,my:y+s*7})}T.i=0;T.acc=[];T.miss=0;
    T.amp=clamp(1.2+painNow()*.05+(pl.energy<30?2:0)-sk*.22,.4,5.5)}}
function limbKind(p){return BODY[p].limb||(p==="neck"?"neck":p==="head"?"head":"torso")}
// the close-up: a part of you, big, with the wound in the middle
function closeShape(p){const k=limbKind(p);const H={arm:80,leg:100,hand:88,foot:74,neck:80}[k];
  if(H)return{d:`<rect x="6" y="${100-H/2}" width="348" height="${H}" rx="${H/2}"/>`,top:100-H/2,bot:100+H/2};
  if(k==="head")return{d:`<ellipse cx="180" cy="104" rx="130" ry="92"/>`,top:30,bot:170};
  return{d:`<rect x="20" y="8" width="320" height="184" rx="34"/>`,top:40,bot:160}}
function closeWound(w,T){const k=w.k;const st=w.st&&!(T&&T.k==="stitch");let s="";
  if(k==="scratch")s=`<path d="M150 74l22 52M166 70l22 52M182 72l20 48" stroke="#b8392c" stroke-width="3" stroke-linecap="round"/><path d="M150 74l22 52M166 70l22 52M182 72l20 48" stroke="#ef7a66" stroke-width="1" stroke-linecap="round"/>`;
  if(k==="cut"||k==="deep"||k==="incision"){const deep=k==="deep";s=k==="incision"?`<path d="M120 100h120" stroke="#b05a4a" stroke-width="4" stroke-linecap="round"/>`
    :`<path d="M134 74Q180 96 226 126Q178 ${deep?112:104} 134 74z" fill="#5a0e0a" stroke="#8a1e16" stroke-width="${deep?3:1.5}"/><path d="M140 79Q180 98 220 121" stroke="#e05a48" stroke-width="${deep?3:1.6}" fill="none"/>${deep?`<ellipse cx="190" cy="128" rx="3" ry="6" fill="#7a140e"/><ellipse cx="206" cy="136" rx="2.4" ry="5" fill="#7a140e"/>`:""}`;
    if(st)s+=k==="incision"?stitchTicks(124,100,236,100,8,7).replace('stroke-width=".8"','stroke-width="2"'):stitchTicks(138,77,222,124,k==="deep"?6:4,10).replace('stroke-width=".8"','stroke-width="2.2"')}
  if(k==="bite")s=`<g fill="#7a140e" stroke="#c8402e" stroke-width="1.5">${[0,1,2,3,4,5,6].map(i=>{const a=Math.PI*(.15+i*.7/6);return `<ellipse cx="${(180-Math.cos(a)*44).toFixed(0)}" cy="${(88-Math.sin(a)*14).toFixed(0)}" rx="5" ry="7"/><ellipse cx="${(180-Math.cos(a)*40).toFixed(0)}" cy="${(114+Math.sin(a)*12).toFixed(0)}" rx="5" ry="7"/>`}).join("")}</g><ellipse cx="180" cy="101" rx="26" ry="8" fill="#5a0e0a" opacity=".55"/>`;
  if(k==="bruise")s=`<ellipse cx="180" cy="100" rx="52" ry="30" fill="url(#tbruise)"/>`;
  if(k==="fracture")s=`<ellipse cx="180" cy="100" rx="70" ry="32" fill="url(#tbruise)" opacity=".8"/><path d="M150 100l9-8 9 8 9-8 9 8 9-8 9 8" fill="none" stroke="#f6eed6" stroke-width="3" stroke-linejoin="round" opacity=".7"/>`;
  if(w.inf>=30)s=`<ellipse cx="180" cy="100" rx="${w.inf>=55?76:60}" ry="${w.inf>=55?40:30}" fill="url(#tinf)"/>`+s;
  if(w.dirt>.15&&!(T&&T.k==="clean"))s+=`<g fill="#4a3a26" opacity="${Math.min(.85,w.dirt).toFixed(2)}"><circle cx="152" cy="92" r="3"/><circle cx="214" cy="112" r="2.4"/><circle cx="198" cy="84" r="2"/><circle cx="166" cy="118" r="2.6"/></g>`;
  return s}
function wrapBand(i,need,top,bot,res,cur){const x=180+(i-(need-1)/2)*26;const l=res==="loose";const col=res==="tight"?"#f2dfd8":"#f4f0e6";const y0=top-3+(l?4:0),y1=bot+3-(l?2:0);
  return `<path d="M${x-15} ${y0}L${x+11} ${y0}L${x+17} ${y1}L${x-9} ${y1}Z" fill="${col}" stroke="#a8a090" stroke-width="1" opacity="${l?.86:.97}"${cur?` id="tstrip"`:""}/><path d="M${x-10} ${y0+6}L${x+14} ${y1-6}M${x-4} ${y0+4}L${x+16} ${y1-14}" stroke="#d8d0be" stroke-width=".8"/>`}
function treatPad(w,T){const C=closeShape(w.p);const pl=S.player;let over="";
  if(T.k==="clean")over=T.specks.map((s,i)=>`<circle id="sp${i}" cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" fill="#4a3a26" opacity="${Math.max(0,s.a).toFixed(2)}"/>`).join("");
  if(T.k==="stitch"){const n=T.pts.length;for(let i=0;i<T.i;i++){const p=T.pts[i];over+=`<path d="M${p.x} ${p.y}L${p.mx} ${p.my}" stroke="#1a1814" stroke-width="2.4" stroke-linecap="round"/><circle cx="${p.x}" cy="${p.y}" r="1.8" fill="#1a1814"/><circle cx="${p.mx}" cy="${p.my}" r="1.8" fill="#1a1814"/>`}
    for(let i=T.i+1;i<n;i++)over+=`<circle cx="${T.pts[i].x}" cy="${T.pts[i].y}" r="3" fill="none" stroke="#e4d8b8" stroke-width="1" stroke-dasharray="2 2" opacity=".55"/>`;
    if(T.i<n){const p=T.pts[T.i];over+=`<g id="tdot" transform="translate(${p.x} ${p.y})"><circle r="7.5" fill="none" stroke="#e48a3f" stroke-width="2"/><circle r="2.2" fill="#e48a3f"/></g>`}}
  if(T.k==="wrap"||T.k==="splint"&&T.phase==="wrap"){for(let i=0;i<T.wraps.length;i++)over+=wrapBand(i,T.need,C.top,C.bot,T.wraps[i]);
    if(T.wraps.length<T.need){const x=180+(T.wraps.length-(T.need-1)/2)*26;over+=`<g id="troll" transform="translate(${x} ${C.top-16})"><circle r="11" fill="#f4f0e6" stroke="#8a8270" stroke-width="1.4"/><circle r="4" fill="#cfc6b0"/></g>`}}
  if(T.k==="splint"){const ty=C.top-9;over=(T.phase==="place"?`<rect x="56" y="${ty-7}" width="248" height="14" rx="4" fill="none" stroke="#e48a3f" stroke-width="1.5" stroke-dasharray="6 4"/>`:"")+`<rect id="tsplint" x="${(T.sx-124).toFixed(1)}" y="${(T.sy-7).toFixed(1)}" width="248" height="14" rx="4" fill="#b0824e" stroke="#3a2a18" stroke-width="1.5" style="cursor:${T.phase==="place"?"grab":"default"}"/><rect x="${(T.sx-124).toFixed(1)}" y="${(T.sy+C.bot-C.top+11).toFixed(1)}" width="248" height="14" rx="4" fill="#b0824e" stroke="#3a2a18" stroke-width="1.5" opacity="${T.phase==="place"?0:1}"/>`+over}
  const old=w.band&&T.k==="wrap"?"":w.band&&(T.k==="splint")?wrapBand(0,1,C.top,C.bot,"snug"):"";
  return `<svg id="treatpad" viewBox="0 0 360 200" class="tpad ${T.k}${T.k==="splint"?" "+T.phase:""}" role="img" aria-label="${esc(TREAT_NAME[T.k]+" your "+w.at)}">
   <defs><linearGradient id="tshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".32"/></linearGradient>
    <radialGradient id="tbruise"><stop offset="0" stop-color="#5a3a7a" stop-opacity=".75"/><stop offset=".6" stop-color="#7a4a6a" stop-opacity=".45"/><stop offset="1" stop-color="#8a6a4a" stop-opacity="0"/></radialGradient>
    <radialGradient id="tinf"><stop offset="0" stop-color="#d84a3a" stop-opacity=".6"/><stop offset=".7" stop-color="#d0a03a" stop-opacity=".3"/><stop offset="1" stop-color="#d0a03a" stop-opacity="0"/></radialGradient></defs>
   <g fill="${esc(pl.skin||"#c99873")}">${C.d}</g><g fill="url(#tshade)">${C.d}</g>${closeWound(w,T)}${old}${over}</svg>`}
function treatHelp(T){const pl=S.player;
  if(T.k==="clean")return"Drag across the wound to wipe away the dirt. Get all of it.";
  if(T.k==="stitch")return T.i<T.pts.length?`Click the orange mark to push the needle through. Stitch ${T.i+1} of ${T.pts.length}.${T.amp>2.5?" Your hands won't keep still.":""}`:"";
  if(T.k==="splint"&&T.phase==="place")return"Drag the board up onto the outline, along the bone.";
  return `Hold the mouse button (or Space) to pull the ${T.k==="splint"?"strap":T.item==="cloth"?"cloth":"bandage"} around. Let go when the needle is in the green. ${T.k==="splint"?"Strap":"Wrap"} ${Math.min(T.wraps.length+1,T.need)} of ${T.need}.`}
function treatHtml(){const T=UI.treat;const w=woundById(T.wid);const list=TREAT_LIST[T.k];const have=haveFor(list);const started=T.done||T.wraps&&T.wraps.length||T.i||T.k==="splint"&&T.phase!=="place"||T.k==="clean"&&T.specks.some(s=>s.a<1);
  const meter=(T.k==="wrap"||T.k==="splint"&&T.phase==="wrap")?`<div class="tmeter" aria-hidden="true"><span class="zone" style="left:${(T.z0/1.2*100).toFixed(1)}%;width:${((T.z1-T.z0)/1.2*100).toFixed(1)}%"></span><span class="over" style="left:${(1/1.2*100).toFixed(1)}%"></span><i id="tneedle" style="left:${(Math.min(T.v,1.2)/1.2*100).toFixed(1)}%"></i></div><div class="tdots">${Array.from({length:T.need},(_,i)=>`<span class="${T.wraps[i]||""}"></span>`).join("")}<span class="mono mute">${esc(T.msg||"")}</span></div>`:T.msg?`<p class="mono warn">${esc(T.msg)}</p>`:"";
  return `<div class="treat"><div class="row" style="justify-content:space-between"><h3>${esc(TREAT_NAME[T.k])} your ${esc(w.at)}</h3><button class="x" data-act="hcancel" aria-label="Stop (Esc)">×</button></div>
   <div class="mute small">${esc(woundName(w))}. ${esc(woundStatus(w).slice(0,2).join(". "))}.${w.band&&T.k!=="splint"?" You unwrap the old dressing first.":""}</div>
   ${have.length>1?`<div class="chips">${have.map(([id,q,n])=>`<button class="chip${T.item===id?" on":""}" data-act="hitem" data-v="${id}"${started?" disabled":""} aria-pressed="${T.item===id}">${id==="boards"?"":itemIcon(id,16)}${esc(cap(n.replace(/^(a|an|the) /,"")))}${ITEMS[id]&&ITEMS[id].uses?` <span class="mono mute">${usesLeft(id)}</span>`:""}</button>`).join("")}</div>`:""}
   ${treatPad(w,T)}${meter}<p class="tinst">${esc(treatHelp(T))}</p>
   <div class="row"><button class="btn" data-act="hquick">Just do it<small>An average job, no fuss</small></button>${T.k==="clean"?`<button class="btn" data-act="hcleandone">That'll do<small>Stop here</small></button>`:""}<button class="btn" data-act="hcancel">Stop<small>Nothing gets used up</small></button></div></div>`}

// ---------- the doing ----------
function svgPt(svg,e){const m=svg.getScreenCTM();if(!m)return{x:0,y:0};const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const r=pt.matrixTransform(m.inverse());return{x:r.x,y:r.y}}
function wrapping(T){return T&&(T.k==="wrap"||T.k==="splint"&&T.phase==="wrap")}
function wrapHold(on){const T=UI.treat;if(!wrapping(T)||T.wraps.length>=T.need)return;
  if(on){if(T.holding)return;T.holding=true;T.v=0;T.msg="";healthLoop();return}
  if(!T.holding)return;T.holding=false;const v=T.v;const r=v>1?"tight":v>=T.z0&&v<=T.z1?"snug":v>T.z1?"tight":"loose";
  T.wraps.push(r);T.v=0;T.msg={snug:"Snug.",loose:"Too loose. It'll slip.",tight:"Too tight. Your fingers tingle."}[r];if(r==="tight")body().ache=Math.min(80,(body().ache||0)+3);
  if(T.wraps.length>=T.need){const q=T.wraps.reduce((a,x)=>a+(x==="snug"?1:x==="tight"?.72:.42),0)/T.need;setTimeout(()=>{if(UI.treat===T)finishTreat(T.k==="splint"?(q+T.q1)/2:q)},380)}
  render()}
function healthLoop(){if(UI.hloop)return;UI.hloop=true;let last=performance.now();
  const tick=now=>{const T=UI.treat;if(!T||UI.panel!=="health"||!S||S.player.alive===false){UI.hloop=false;return}const dt=Math.min(.05,(now-last)/1000);last=now;
    if(T.holding){T.v+=T.rate*dt;if(T.v>1.15){T.v=1.2;wrapHold(false)}const n=$("tneedle");if(n)n.style.left=(Math.min(T.v,1.2)/1.2*100).toFixed(1)+"%";
      const ro=$("troll");if(ro){const pad=$("treatpad");const C=closeShape(woundById(T.wid).p);const x=180+(T.wraps.length-(T.need-1)/2)*26;ro.setAttribute("transform",`translate(${(x+Math.sin(T.v*5)*4).toFixed(1)} ${(C.top-16+(C.bot-C.top+32)*Math.min(1,T.v/1.05)).toFixed(1)})`)}}
    if(T.k==="stitch"&&T.i<T.pts.length){const p=T.pts[T.i];const t=now/1000;T.wx=Math.sin(t*2.3)*T.amp+Math.sin(t*5.1)*T.amp*.35;T.wy=Math.cos(t*1.7)*T.amp*.8;const d=$("tdot");if(d)d.setAttribute("transform",`translate(${(p.x+T.wx).toFixed(1)} ${(p.y+T.wy).toFixed(1)})`)}
    requestAnimationFrame(tick)};
  requestAnimationFrame(tick)}
function healthAfterRender(){if(UI.treat)healthLoop()}
function padDown(e){const T=UI.treat;const pad=e.target.closest("#treatpad");if(!T||!pad)return;e.preventDefault();const p=svgPt(pad,e);
  if(wrapping(T)){wrapHold(true);return}
  if(T.k==="clean"){T.scrub=true;T.lx=p.x;T.ly=p.y;scrubAt(p);return}
  if(T.k==="stitch"){stitchAt(p);return}
  if(T.k==="splint"&&T.phase==="place"&&e.target.id==="tsplint"){T.drag={dx:p.x-T.sx,dy:p.y-T.sy,x0:T.sx,y0:T.sy}}}
function padMove(e){const T=UI.treat;if(!T)return;const pad=$("treatpad");if(!pad)return;
  if(T.k==="clean"&&T.scrub){const p=svgPt(pad,e);if(Math.hypot(p.x-T.lx,p.y-T.ly)>2.5){T.lx=p.x;T.ly=p.y;scrubAt(p)}}
  if(T.k==="splint"&&T.drag){const p=svgPt(pad,e);T.sx=clamp(p.x-T.drag.dx,40,320);T.sy=clamp(p.y-T.drag.dy,8,192);const s=$("tsplint");if(s){s.setAttribute("x",(T.sx-124).toFixed(1));s.setAttribute("y",(T.sy-7).toFixed(1))}}}
function padUp(e){const T=UI.treat;if(!T)return;if(wrapping(T)&&T.holding){wrapHold(false);return}
  if(T.k==="clean")T.scrub=false;
  if(T.k==="splint"&&T.drag){const moved=Math.hypot(T.sx-T.drag.x0,T.sy-T.drag.y0)>4;T.drag=null;if(!moved){T.msg="Drag it into place along the outline.";render();return}const C=closeShape(woundById(T.wid).p);const ty=C.top-9;const d=Math.hypot(T.sx-180,T.sy-ty);
    if(d<64){T.q1=clamp(1-d/50,.35,1);T.sx=180;T.sy=ty;T.phase="wrap";T.msg=T.q1>.8?"Lined up straight.":"Close enough. A little crooked.";render()}else{T.msg="Line it up with the outline, along the bone.";render()}}}
function scrubAt(p){const T=UI.treat;let left=0;for(let i=0;i<T.specks.length;i++){const s=T.specks[i];if(s.a>0&&Math.hypot(s.x-p.x,s.y-p.y)<s.r+13){s.a-=.22;const el=$("sp"+i);if(el)el.setAttribute("opacity",Math.max(0,s.a).toFixed(2))}if(s.a>0)left++}
  if(!left&&!T.done){T.done=1;setTimeout(()=>{if(UI.treat===T)finishTreat(1)},250)}}
function stitchAt(p){const T=UI.treat;if(T.i>=T.pts.length)return;const t=T.pts[T.i];const d=Math.hypot(p.x-(t.x+(T.wx||0)),p.y-(t.y+(T.wy||0)));
  if(d>16){T.miss++;T.msg="The needle slips. Try again.";body().ache=Math.min(80,(body().ache||0)+2);render();return}
  T.acc.push(clamp(1-d/12,0,1));T.i++;T.msg=d<5?"Clean through.":d<10?"A little off.":"Ragged, but it holds.";
  if(T.i>=T.pts.length){const q=clamp(T.acc.reduce((a,b)=>a+b,0)/T.acc.length-T.miss*.04,.15,1);T.done=1;render();setTimeout(()=>{if(UI.treat===T)finishTreat(q)},350);return}
  render()}
document.addEventListener("pointerdown",e=>{if(UI.treat&&e.button===0)padDown(e)});
document.addEventListener("pointermove",e=>{if(UI.treat)padMove(e)});
document.addEventListener("pointerup",e=>{if(UI.treat)padUp(e)});
document.addEventListener("pointercancel",e=>{if(UI.treat)padUp(e)});
addEventListener("keydown",e=>{const T=UI.treat;if(!T||!S||UI.panel!=="health"||UI.modal||typing())return;if(e.key===" "||e.key==="Enter"){if(!wrapping(T))return;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)wrapHold(true)}},true);
addEventListener("keyup",e=>{const T=UI.treat;if(!T||!(e.key===" "||e.key==="Enter"))return;if(T.holding){e.preventDefault();e.stopImmediatePropagation();wrapHold(false)}},true);

// the work is done: change the body, let the time pass, say what happened
function finishTreat(q){const T=UI.treat;if(!T)return;UI.treat=null;const w=woundById(T.wid);if(!w||S.player.alive===false){render();return}
  const where=w.at,name=woundName(w).toLowerCase();let mins=4,msg="";
  if(T.k==="clean"){if(w.band)undress(w);cleanWound(w,T.item,q);mins=4;const harsh=T.item==="rubbing_alcohol"||T.item==="whiskey";
    msg=q>.85?`You clean the ${name} on your ${where}. ${harsh?"It stings like fire, then settles.":"It's as clean as water gets it."}`:`You clean the ${name} on your ${where} as best you can. Some of the dirt is still in it.`}
  if(T.k==="wrap"){const had=!!w.band;dressWound(w,T.item,q);mins=T.item==="cloth"?3:4;const b=wBleed(w);
    msg=`You ${had?"change the dressing on":T.item==="cloth"?"tie a strip of cloth around":T.item==="poultice"?"bind a poultice over":"wrap a bandage around"} your ${where}${q>.8?". It's snug":q<.5?". It's loose, but it'll do":""}.${b>.25?" Blood is still coming through.":w.bl>.03?" The bleeding slows to nothing.":""}`}
  if(T.k==="stitch"){if(w.band)undress(w);stitchWound(w,T.item,q);mins=6+T.pts.length*2;
    msg=`You put ${numWord(T.pts.length)} stitches in your ${where}. ${q>.75?"Neat work.":q>.5?"Not pretty, but it's closed.":"It's ugly and it hurts, but it's closed."} Dress it to keep it clean.`}
  if(T.k==="splint"){splintWound(w,T.item,q);mins=10;msg=`You strap ${T.item==="splint"?"the splint":"a board"} along your ${BODY[w.p].n}. ${q>.7?"The bone holds still.":"It's not perfect, but it holds."}`}
  journal(msg,"good");UI.hmsg={t:S.t+mins,x:msg};act(mins);save();render()}
function onHealthAct(a,v,el,e){if(!S)return false;
  switch(a){
    case"hpart":UI.treat=null;UI.hsel=v&&UI.hsel!==v?v:null;render();return true;
    case"htreat":{const [k,id]=v.split("|");openTreat(k,+id);return true}
    case"hitem":{const T=UI.treat;if(T){const w=woundById(T.wid);T.item=v;initTreat(T,w)}render();return true}
    case"hcancel":UI.treat=null;render();return true;
    case"hquick":{const T=UI.treat;if(!T)return true;finishTreat(clamp(.58+S.player.sk.medic*.025,.58,.85)*(T.k==="splint"?.95:1));return true}
    case"hcleandone":{const T=UI.treat;if(!T)return true;const f=T.specks.reduce((a,s)=>a+(1-Math.max(0,s.a)),0)/T.specks.length;finishTreat(Math.max(.15,f));return true}
    case"hundress":{const w=woundById(+v);if(!w||!w.band)return true;const k=w.band.k;undress(w);advance(1);const t=`You unwrap the ${k==="rag"?"rag":k==="poultice"?"poultice":"bandage"} from your ${w.at}.`;journal(t);UI.hmsg={t:S.t,x:t};save();render();return true}
    case"hmed":{const ok=v==="pain"?takePainkillers():takeAntibiotics();if(ok){advance(2);UI.hmsg={t:S.t,x:S.journal[0].x}}save();render();return true}
  }
  return false}
// reaching for a medical supply in your bag goes to the wound it's for
function useMed(id){const it=ITEMS[id];
  if(it.med==="pain"){if(takePainkillers()){advance(2);save();render()}return}
  if(it.med==="abx"){if(takeAntibiotics()){advance(2);save();render()}return}
  const k={dress:"wrap",clean:"clean",stitch:"stitch",splint:"splint"}[it.med];const w=woundFor(k);
  if(!w){toast({wrap:"Nothing needs a dressing right now.",clean:"Nothing needs cleaning right now.",stitch:"Nothing needs stitches right now.",splint:"Nothing's broken. Keep it that way."}[k]);return}
  openTreat(k,w.id,id)}
