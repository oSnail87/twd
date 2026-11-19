
// ================= the inventory screen: grids, dragging, searching furniture =================
// ---------- item pictures, drawn as small vector icons on a 10-units-per-cell grid ----------
const ICOL={food:"#c8a46a",drink:"#8ab0c8",med:"#e8e4dc",mat:"#9a8a6a",tool:"#8a8a84",misc:"#b8a888",weapon:"#9a9a94",cloth:"#7a7a74",bag:"#5a6a4a"};
function icoBody(it,W,H){const c=it.col||ICOL[it.cat]||"#999";const dk="#1a1814";const o=`stroke="${dk}" stroke-width=".7" stroke-linejoin="round"`;
  const R=(x,y,w,h,f,rx=0,x_="")=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" ${o} ${x_}/>`;
  const C=(x,y,r,f)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${o}/>`;const Pa=(d,f)=>`<path d="${d}" fill="${f}" ${o}/>`;const L=(d,w=1,col=dk)=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  const cx=W/2,cy=H/2;
  switch(it.ic){
    case"can":return R(cx-3,cy-3.6,6,7.2,"#b8bcc0",1)+R(cx-3,cy-1.8,6,3.6,c)+L(`M${cx-3} ${cy-2.6}h6M${cx-3} ${cy+2.6}h6`,.4,"#666");
    case"bag":return Pa(`M${cx-3.4} ${cy-3.4}l1 -.6h4.8l1 .6v7.2l-1 .5h-4.8l-1 -.5z`,c==="#c8a46a"?"#d8483a":c)+R(cx-2,cy-1.2,4,2.4,"#e8d070",.6);
    case"box":return R(cx-3.6,cy-8,7.2,16,c==="#c8a46a"?"#e0a030":c,.6)+R(cx-2.6,cy-5,5.2,4,"#f4ecd0",.4)+C(cx,cy+3,1.6,"#c84a3a");
    case"berries":return C(cx-1.6,cy+.6,1.8,"#6a2a6a")+C(cx+1.4,cy+1,1.8,"#7a3a8a")+C(cx,cy-1.4,1.8,"#5a2a5a")+L(`M${cx} ${cy-3}l1 -1.6`,.6,"#3a5a2a");
    case"meat":return Pa(`M${2} ${cy}c0-3 4-4 8-4h4c3 0 5 2 5 4s-2 4-5 4h-4c-4 0-8-1-8-4z`,c==="#c8a46a"?"#b8504a":c)+C(W-4,cy,1.3,"#f0e8e0");
    case"fish":return Pa(`M2.5 ${cy}c2-3 6-4 10-3l3-2v10l-3-2c-4 1-8 0-10-3z`,c==="#c8a46a"?"#8aa0a8":c)+C(5.5,cy-.6,.7,dk);
    case"ration":return R(cx-3.6,cy-2.6,7.2,5.2,"#7a6a42",.8)+L(`M${cx-3.6} ${cy}h7.2`,.5,"#4a3a22");
    case"bottle":{const f=it.id==="empty_bottle"?"rgba(180,200,210,.35)":c;return Pa(`M${cx-1} 1.5h2v2.4c1.6.8 2.4 2 2.4 3.6v10.4c0 .6-.4 1-1 1h-4.8c-.6 0-1-.4-1-1v-10.4c0-1.6.8-2.8 2.4-3.6z`,f)+R(cx-1.2,.8,2.4,1.4,"#2a5a8a",.3)}
    case"whiskey":return Pa(`M${cx-.9} 1.5h1.8v3.4c1.8.6 2.6 1.6 2.6 3v9.6c0 .6-.4 1-1 1h-5c-.6 0-1-.4-1-1v-9.6c0-1.4.8-2.4 2.6-3z`,"#8a5a22")+R(cx-2.2,9,4.4,4.4,"#e8dcc0",.3);
    case"bandage":return R(cx-3.6,cy-2,7.2,4,"#f4f0e8",1.6)+R(cx-1,cy-2,2,4,"#e0dcd0")+L(`M${cx-2.6} ${cy}h5.2`,.5,"#c8c0b0");
    case"pills":return R(cx-2.4,cy-3.4,4.8,6.8,c==="#e8e4dc"?"#e8a83a":c,1)+R(cx-2.6,cy-3.8,5.2,1.8,"#f4f0e8",.6)+R(cx-1.8,cy-.6,3.6,2.2,"#fff",.3);
    case"herbs":return L(`M${cx} ${cy+3.6}v-6M${cx} ${cy}l-2.6-2M${cx} ${cy-1.4}l2.4-2.2M${cx} ${cy+1.4}l2.4-1.4`,.7,"#4a6a2a")+C(cx-2.6,cy-2,1.2,"#6a9a3a")+C(cx+2.4,cy-3.6,1.2,"#6a9a3a")+C(cx+2.4,cy,1,"#7aaa4a");
    case"wood":return R(1.5,cy-2.8,W-3,5.6,"#8a6a42",2.6)+`<ellipse cx="${W-3.4}" cy="${cy}" rx="1.8" ry="2.6" fill="#c8a06a" ${o}/>`+L(`M4 ${cy-1}h${W-12}M6 ${cy+1.2}h${W-14}`,.5,"#5a4022");
    case"stone":return Pa(`M${cx-3.6} ${cy+1.6}l1-3.6 3-1.4 3 1.2 1 3-2 2.4h-4z`,"#8a8a84");
    case"nails":return R(cx-3.4,cy-2.4,6.8,4.8,"#c8a03a",.4)+L(`M${cx-1.6} ${cy-1.2}v2.4M${cx} ${cy-1.2}v2.4M${cx+1.6} ${cy-1.2}v2.4`,.6,"#5a5a5a");
    case"scrap":return Pa(`M2 ${cy+2.6}l3-5.4 6 1.4 4-2 3 4.2-2 3.2h-12z`,"#7a7e82")+L(`M6 ${cy}l3 2.4`,.5,"#4a4a4a");
    case"cloth":return Pa(`M${cx-3.6} ${cy-2.6}h7.2l-1 5.6h-5.2z`,"#c8bca0")+L(`M${cx-2.4} ${cy-1}h4.6`,.4,"#8a7a5a");
    case"rope":return `<ellipse cx="${cx}" cy="${cy-2}" rx="3.4" ry="3" fill="none" stroke="#b89a5a" stroke-width="1.8"/><ellipse cx="${cx}" cy="${cy+3}" rx="3" ry="2.6" fill="none" stroke="#a88a4a" stroke-width="1.8"/>`;
    case"tape":return `<circle cx="${cx}" cy="${cy}" r="3.6" fill="#a8acb0" ${o}/><circle cx="${cx}" cy="${cy}" r="1.6" fill="#2a2a2a"/>`;
    case"ammo":return R(cx-3.4,cy-2.6,6.8,5.2,"#6a5a3a",.4)+R(cx-2.4,cy-1.8,1.4,3,"#c8a03a",.6)+R(cx-.7,cy-1.8,1.4,3,"#c8a03a",.6)+R(cx+1,cy-1.8,1.4,3,"#c8a03a",.6);
    case"lighter":return R(cx-1.8,cy-2.4,3.6,6,"#c83a32",.6)+R(cx-1.8,cy-3.8,3.6,1.6,"#b8b8b8",.3);
    case"flashlight":return R(3,cy-1.6,W-9,3.2,"#3a3a3e",.8)+Pa(`M${W-6} ${cy-1.6}l3-1.4v6l-3-1.4z`,"#4a4a4e")+R(W-3.2,cy-3,1,6,"#f0e8a0",.3);
    case"cigs":return R(cx-2.6,cy-3.6,5.2,7.2,"#e8e4dc",.4)+R(cx-2.6,cy-3.6,5.2,2.4,"#c83a32",.4);
    case"photo":return R(cx-3.6,cy-2.8,7.2,5.6,"#f4f0e8",.3)+R(cx-3,cy-2.2,6,4.4,"#8a9aa8")+C(cx-1,cy,.9,"#e8c8a0")+C(cx+1.2,cy+.2,.9,"#e8c8a0");
    case"radio":return R(2.5,5,W-5,H-8,"#3a4a3a",1.4)+C(W/2-3,H/2+1.4,3.2,"#2a2a2a")+R(W/2+2,H/2-2,4,2,"#c8c0a0",.3)+L(`M5 5l-2-3.6`,.8,"#888");
    case"book":return R(3,2.5,W-6,H-5,c,.8)+R(W-5,2.5,1.6,H-5,"#f0e8d8")+L(`M6 ${H/2-2}h${W-13}M6 ${H/2+.6}h${W-15}`,.7,"rgba(255,255,255,.7)");
    case"knife":return R(1.5,cy-1.2,6.4,2.4,"#4a3a2a",.8)+Pa(`M7.9 ${cy-1.4}h9.4c1 0 1.8.6 1.8 1.4l-11.2 1.6z`,"#c8ccd0");
    case"bat":return Pa(`M2 ${cy-.9}h12c6 0 18-1.6 22-2.6 2-.4 2.2 6.4 0 6-4-1-16-2.6-22-2.6h-12z`,c==="#9a9a94"?"#c89a5a":c)+R(1.4,cy-1.4,2.2,2.8,"#3a3a3a",.6);
    case"nailbat":return Pa(`M2 ${cy-.9}h12c6 0 18-1.6 22-2.6 2-.4 2.2 6.4 0 6-4-1-16-2.6-22-2.6h-12z`,"#a87a4a")+L(`M28 ${cy-4}v-1.6M31 ${cy-4.2}v-1.6M34 ${cy-4.4}v-1.6M29 ${cy+4}v1.6M33 ${cy+4.2}v1.6`,.8,"#888");
    case"golf":return L(`M3 ${cy}H34`,1.6,"#b8bcc0")+Pa(`M34 ${cy-3}h3.6v5.4h-4.4z`,"#9aa0a4")+R(2,cy-1.4,8,2.8,"#2a2a2a",1);
    case"crowbar":return L(`M3 ${cy+2}l2-3.6H26`,2.2,"#8a2a22")+L(`M26 ${cy-1.6}c2 0 3 1 2.4 3`,2.2,"#8a2a22");
    case"axe":return R(2,cy-1,W-8,2,"#8a6a42",1)+Pa(`M${W-9} ${cy-7}h4c2 2 2.4 5 2.4 7s-.4 5-2.4 7h-4z`,"#a8acb0")+R(W-10,cy-7,2,14,"#c83a32",.4);
    case"hatchet":return R(2,cy-1,W-7,2,"#8a6a42",1)+Pa(`M${W-8} ${cy-4}h3c1.6 1.4 2 2.6 2 4s-.4 2.6-2 4h-3z`,"#8a8a84");
    case"machete":return R(1.6,cy-1.3,7,2.6,"#2a2a2a",1)+Pa(`M8.6 ${cy-1.6}H34c3 0 4.4 1.2 4.4 2.4l-29.8 1.2z`,"#c8ccd0");
    case"hammer":return R(2,cy-.9,W-7,1.8,"#6a4a2a",.8)+R(W-6,cy-3.4,3,6.8,"#8a8a8a",.5);
    case"pipe":return R(2,cy-1.6,W-4,3.2,"#7a7470",1.4)+R(2,cy-2.2,3,4.4,"#6a6460",.6)+R(W-5,cy-2.2,3,4.4,"#6a6460",.6);
    case"spear":return L(`M2 ${cy}H${W-9}`,1.6,"#8a6a42")+Pa(`M${W-9} ${cy-1.6}H${W-3}l1.6 1.6-1.6 1.6H${W-9}z`,"#c8ccd0")+L(`M${W-11} ${cy-1.4}v2.8`,1.2,"#8a8a8a");
    case"club":return Pa(`M2 ${cy-1}h10c5 0 12-1.6 15-2.6 1.6-.4 1.6 7.2 0 7.2-3-1-10-2.6-15-2.6h-10z`,"#7a5a32");
    case"pistol":return Pa(`M2 ${cy-3}h15v3.4h-8l-1 5.6h-3.4l1-5.6h-3.6z`,"#2a2c2e")+L(`M9 ${cy+.4}l1.4 1.4`,.6,"#888");
    case"shirt":case"hoodie":return Pa(`M${cx-3} 2.5l-4.5 2.5 1.8 4.4 2.2-1v10h9v-10l2.2 1 1.8-4.4-4.5-2.5c-.8 1.4-1.8 2-3 2s-2.2-.6-3-2z`,c)+(it.ic==="hoodie"?Pa(`M${cx-2.6} 2.7c.6 2 1.4 3 2.6 3s2-1 2.6-3`,"rgba(0,0,0,.25)"):"");
    case"pants":return Pa(`M${cx-4.6} 2.5h9.2l.8 15h-3.6l-2-9.6-2 9.6h-3.6z`,c)+L(`M${cx-4.4} 4.5h8.8`,.5,"rgba(0,0,0,.4)");
    case"shoes":return Pa(`M3 ${H-6}h6.4l1 -5h3l.6 5c3 .4 4 1.4 4 3v1H3z`,c);
    case"jacket":case"vest":return Pa(`M${cx-4} 3l-6 3 2.4 7 2.4-1.2V${H-3}h12.4V11.8l2.4 1.2 2.4-7-6-3c-1 1.6-2.6 2.6-4 2.6s-3-1-4-2.6z`,c)+L(`M${cx} 5.6V${H-3}`,.6,"rgba(0,0,0,.45)")+(it.ic==="vest"?R(cx-6,H/2,4,3,"rgba(0,0,0,.25)",.5)+R(cx+2,H/2,4,3,"rgba(0,0,0,.25)",.5):"");
    case"beanie":return Pa(`M${cx-3.6} ${cy+2}c0-4 1.6-5.4 3.6-5.4s3.6 1.4 3.6 5.4z`,c)+R(cx-3.8,cy+1.4,7.6,1.8,"rgba(0,0,0,.25)",.6);
    case"helmet":return Pa(`M4 ${H-6}c0-6 3-11 7-11s7 5 7 11z`,c)+R(5,H-9,10,2.6,"#5a7a9a",.8);
    case"gloves":return Pa(`M${cx-2.6} ${cy+3.6}v-4.6l-1-2.8 1-.4 1 1.6v-2.8h1v2.4-3h1v3-2.4h1v4l1.2-1 .8.6-2 3.6v2.2z`,c);
    case"backpack":return R(3,4,W-6,H-6,c,2.4)+R(5,H/2,W-10,H/2-4,"rgba(0,0,0,.18)",1.6)+L(`M${W/2-3} 4c0-2 1.4-2.6 3-2.6s3 .6 3 2.6`,1,dk);
    case"duffel":return R(2.5,6,W-5,H-9,c,4)+L(`M${W/2-5} 6c0-3 2-4 5-4s5 1 5 4`,1.2,dk)+L(`M5 ${H/2+1.6}H${W-5}`,.6,"rgba(255,255,255,.3)");
    case"belt":return R(1.6,cy-1.4,W-3.2,2.8,c,.6)+R(cx-2,cy-2.6,4,5.2,"rgba(0,0,0,.25)",.6)+R(2.6,cy-3.4,3.4,4,"#6a5a3a",.4)+R(W-6,cy-3.4,3.4,4,"#6a5a3a",.4);
    case"cards":return R(cx-3.6,cy-3.2,5,6.6,"#f4f0e8",.6,`transform="rotate(-12 ${cx} ${cy})"`)+R(cx-1.4,cy-3.2,5,6.6,"#f4f0e8",.6,`transform="rotate(10 ${cx} ${cy})"`)+C(cx+1.2,cy,1,"#c83a32");
    case"ivpole":return L(`M4 ${cy}H${W-7}`,1.4,"#b8bcc0")+L(`M${W-7} ${cy-3.6}v7.2`,1,"#9aa0a4")+R(W-6.4,cy-2,3.4,4,"rgba(200,224,236,.75)",.8)+C(3.2,cy-2.4,1.3,"#2a2a2a")+C(3.2,cy+2.4,1.3,"#2a2a2a");
    case"pbag":return Pa(`M${cx-6} 5l1-1.6h10l1 1.6v11.6c0 .8-.6 1.4-1.4 1.4H${cx-4.6}c-.8 0-1.4-.6-1.4-1.4z`,"#e8e8e0")+L(`M${cx-5} 5.6c2 1.4 8 1.4 10 0`,.6,"#8a8a80")+L(`M${cx-2.4} 10h4.8`,.6,"#3a4a8a");
    case"alcohol":return Pa(`M${cx-1.4} 2h2.8v2.6c1.4.6 2 1.6 2 2.8v10.2c0 .6-.4 1-1 1h-4.8c-.6 0-1-.4-1-1V7.4c0-1.2.6-2.2 2-2.8z`,"#dfe9ee")+R(cx-1.6,1,3.2,1.6,"#f4f4f0",.4)+R(cx-2.6,9,5.2,5,"#3a6a9a",.3)+L(`M${cx} 10v3M${cx-1.4} 11.5h2.8`,.7,"#fff");
    case"suture":return R(cx-3.6,cy-3,7.2,6,"#eef0ec",.8)+L(`M${cx-2} ${cy+1}a2 2 0 0 1 4 0`,.7,"#6a6e74")+L(`M${cx+2} ${cy+1}c1 1.4-.6 2-2 1.2`,.4,"#3a5a8a")+R(cx-3.6,cy-3,7.2,1.4,"#5a8aaa",.4);
    case"sewing":return R(cx-2.4,cy-3.2,4.8,6.4,"#c8a06a",.5)+R(cx-1.9,cy-2.2,3.8,4.4,"#c83a32",.3)+L(`M${cx+3} ${cy-3.6}l-1.6 7.2`,.6,"#b8bcc0");
    case"splint":return R(2,cy-3,W-4,2.2,"#c8a06a",.6)+R(2,cy+.8,W-4,2.2,"#c8a06a",.6)+R(8,cy-3.8,2.6,7.6,"#3a3530",.4)+R(W-10.6,cy-3.8,2.6,7.6,"#3a3530",.4);
    default:return R(2,2,W-4,H-4,c,1.4)}}
function itemSvg(id,r,px){const it=ITEMS[id];const [a,b]=it.sz;const W=a*10,H=b*10;const body=icoBody(it,W,H);
  if(!r)return `<svg class="ico" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet"${px?` width="${px}" height="${px}"`:""} aria-hidden="true">${body}</svg>`;
  return `<svg class="ico" viewBox="0 0 ${H} ${W}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g transform="translate(${H},0) rotate(90)">${body}</g></svg>`}
function itemIcon(id,px=28){return `<span class="iicon" style="width:${px}px;height:${px}px">${itemSvg(id,0,px)}</span>`}

// ---------- which grid is which ----------
const CELL=40;
function gridOf(ref){const pl=S.player;if(!ref)return null;if(ref.startsWith("eq:")){const g=pl.eq[ref.slice(3)];return g&&g.c?g.c:null}
  if(ref==="open"){if(!UI.open)return null;const o=openContObj(UI.open.cid);return o?o.c:null}
  if(ref==="ground"){const p=pileAt(pl.x,pl.z,false);return p&&roomKey(p.x,p.z)===roomKey(pl.x,pl.z)?p.c:null}return null}
function groundPile(make){const pl=S.player;let p=pileAt(pl.x,pl.z,false);if(p&&roomKey(p.x,p.z)!==roomKey(pl.x,pl.z))p=null;if(!p&&make){p={id:"pile"+(S.nextU++),x:pl.x,z:pl.z,c:{g:[6,6],items:[]},t:S.t};S.piles.push(p)}return p}
function findInst(u){const pl=S.player;for(const s of SLOTS){const g=pl.eq[s];if(g&&g.u===u)return{g,slot:s}}
  for(const {slot,c} of pConts())for(const o of c.items)if(o.u===u)return{g:o,c,ref:"eq:"+slot};
  for(const ref of ["open","ground"]){const c=gridOf(ref);if(c)for(const o of c.items)if(o.u===u)return{g:o,c,ref}}return null}
function mine(ref){return ref&&ref.startsWith("eq:")}
// is c inside g (so g can't go into it)?
function nestedIn(c,g){if(!g.c)return false;if(g.c===c)return true;for(const o of g.c.items)if(nestedIn(c,o))return true;return false}

// ---------- opening a container ----------
function openCont(cid){const o=openContObj(cid);if(!o)return;UI.open={cid,t:0};UI.panel="inv";if(UI.talkTo)closeTalk(true);
  if(o.pile)for(const g of o.c.items)g.k=1;else{const s=o.st;if(s.c.items.every(g=>g.k))s.seen=true}
  render()}
function closeOpen(){UI.open=null;render()}
function searchSpeed(){return 1+S.player.sk.scavenge*.08}
// things turn up one at a time while you look
function invTick(dt){if(!UI.open)return;const pl=S.player;const cid=UI.open.cid;
  if(cid.startsWith("pile")){const p=S.piles.find(q=>q.id===cid);if(!p||dist(p.x,p.z,pl.x,pl.z)>2.4){UI.open=null;markUI()}return}
  const c=CONTS[cid];if(!c){UI.open=null;return}if(contReach(c,pl.x,pl.z)>1.9||(c.f&&roomKey(pl.x,pl.z)!==c.b+"/"+c.room)){UI.open=null;markUI();return}
  const s=contState(cid);const next=s.c.items.find(g=>!g.k);if(!next){if(!s.seen){s.seen=true;markUI()}return}
  if(zedNear(2.6))return;
  UI.open.t+=dt*Math.min(4,UI.speed)*searchSpeed();const [w,h]=isz(next);const need=.45+.22*w*h;UI.open.need=need;UI.open.cur=next.u;
  if(UI.open.t>=need){UI.open.t=0;next.k=1;if(!UI.drag)renderPanel();else markUI();if(s.c.items.every(g=>g.k)){s.seen=true;skillUp("scavenge",.03)}}
  else if(!UI.drag){const el=document.querySelector(`.it.unk[data-u="${next.u}"] .prog`);if(el)el.style.width=Math.round(UI.open.t/need*100)+"%"}}

// ---------- drawing the screen ----------
function itemHtml(g,ref,hidden,extra=""){const it=ITEMS[g.id];const [w,h]=isz(g);const st=`left:${g.x*CELL}px;top:${g.y*CELL}px;width:${w*CELL}px;height:${h*CELL}px`;
  if(hidden)return `<div class="it unk" data-u="${g.u}" style="${st}"><span class="q">?</span>${UI.open&&UI.open.cur===g.u?'<span class="prog"></span>':""}</div>`;
  const d=it.dur?durPct(g):null;
  return `<div class="it c-${it.cat}" data-u="${g.u}" data-ref="${ref}" style="${st}" title="${esc(it.n)}${it.st>1?" ×"+g.n:""}${extra}">${itemSvg(g.id,g.r)}<span class="nm">${esc(it.sn||it.n)}</span>${it.st>1&&g.n>1?`<span class="n">${g.n}</span>`:""}${d!=null&&d<99?`<span class="du"><i style="width:${Math.round(d)}%;${d<30?"background:var(--blood)":""}"></i></span>`:""}${g.c&&g.c.items.length?`<span class="has">${g.c.items.length}</span>`:""}</div>`}
function gridHtml(c,ref,o={}){const [W,H]=c.g;return `<div class="grid" data-ref="${ref}" style="width:${W*CELL}px;height:${H*CELL}px;--cell:${CELL}px">${c.items.map(g=>itemHtml(g,ref,o.hide&&!g.k)).join("")}</div>`}
function slotHtml(s){const g=S.player.eq[s];const it=g?ITEMS[g.id]:null;const d=g&&it.dur?durPct(g):null;
  return `<div class="slot${g?" full":""}" data-slot="${s}"><span class="lbl">${SLOTNAME[s]}</span>${g?`<div class="it c-${it.cat}" data-u="${g.u}" data-slot="${s}" title="${esc(it.n)}${gearStats(g.id)?" · "+gearStats(g.id):""}">${itemSvg(g.id,0)}${d!=null&&d<99?`<span class="du"><i style="width:${Math.round(d)}%;${d<30?"background:var(--blood)":""}"></i></span>`:""}</div>`:""}</div>`}
function invPanelHtml(){const pl=S.player;const w=weight(),m=maxW();const C=pConts();
  let me=`<div class="invhead"><span class="mono ${w>m?"neg":"mute"}">${w.toFixed(1)} / ${m.toFixed(0)} kg</span><span class="mono mute">armor ${armor()} · warmth ${clothesWarm()}</span></div>
  <div class="slots">${["head","outer","body","hands","legs","feet","rig","back","weapon","side"].map(slotHtml).join("")}</div>`;
  me+=C.length?C.map(({slot,g,c})=>`<div class="cbox"><div class="lbl">${CONT_LABEL[slot]} <span class="mute">· ${esc(ITEMS[g.id].n)}</span></div>${gridHtml(c,"eq:"+slot)}</div>`).join(""):`<p class="mute">Nothing with pockets on. Wear something.</p>`;
  let them="";if(UI.open){const o=openContObj(UI.open.cid);if(o){const pile=!!o.pile;const s=o.st;const hidden=pile?0:o.c.items.filter(g=>!g.k).length;const T=CONTS[UI.open.cid];
    them+=`<div class="ohead"><div><b>${esc(contName(UI.open.cid))}</b><div class="mono mute">${hidden?`Searching... ${o.c.items.length-hidden} found so far`:o.c.items.length?`${o.c.items.length} thing${o.c.items.length>1?"s":""}`:"Empty"}${T&&T.b&&isShop(BMAP[T.b])&&!S.flags.clinic?" · not yours":""}</div></div><div class="row"><button class="tag" data-act="takeall"${o.c.items.some(g=>g.k||pile)?"":" disabled"}>Take all</button><button class="x" data-act="closeopen" aria-label="Close">×</button></div></div>${gridHtml(o.c,"open",{hide:!pile})}`}}
  const gp=groundPile(false);if(!(UI.open&&gp&&UI.open.cid===gp.id)){const c=gp?gp.c:{g:[6,2],items:[]};them+=`<div class="ohead"><div><b>At your feet</b><div class="mono mute">${c.items.length?"Drag things here to drop them":"Drag things here to drop them"}</div></div></div>${gridHtml(c,"ground")}`}
  return `<div class="inv"><div class="invcol">${me}</div><div class="invcol">${them}<p class="mono mute hint">Drag to move. R turns what you're dragging. Shift-click moves it across. Double-click uses or wears it. Right-click for more.</p></div></div><div id="ctx" hidden></div>`}
function invAfterRender(){}

// ---------- moving things ----------
function takeFrom(src){const g=src.g;if(src.slot){S.player.eq[src.slot]=null}else if(src.c)cRemove(src.c,g)}
function putBack(src){const g=src.g;if(src.slot)S.player.eq[src.slot]=g;else if(src.c){if(cFits(src.c,...isz(g),g.x,g.y,g))cPut(src.c,g,g.x,g.y,g.r);else{const p=cFind(src.c,g);if(p)cPut(src.c,g,p.x,p.y,p.r);else stash(g)}}}
// somewhere for a thing to go: your pockets, or the floor
function stash(g){if(pStore(g))return"you";dropInst(g);cleanPiles();return"ground"}
function slotFor(id,want){const it=ITEMS[id];if(!it.slot)return null;if(it.slot==="weapon"){if(want==="side")return it.side?"side":null;if(want==="weapon")return"weapon";return S.player.eq.weapon&&it.side&&!S.player.eq.side?"side":"weapon"}return want&&want!==it.slot?null:it.slot}
function equipInst(src,want){const g=src.g;const s=slotFor(g.id,want);if(!s){toast(`That doesn't go there.`);return false}const pl=S.player;const old=pl.eq[s];
  if(old===g)return true;takeFrom(src);pl.eq[s]=g;g.r=0;
  if(old){// the thing you had on goes where the new one came from, or into your pockets
    if(src.c&&cFits(src.c,...isz(old),g.x,g.y,null)){cPut(src.c,old,g.x,g.y,0)}else if(src.slot&&slotFor(old.id,src.slot)){pl.eq[src.slot]=old}else{const p=src.c?cFind(src.c,old):null;if(p)cPut(src.c,old,p.x,p.y,p.r);else if(stash(old)==="ground")toast(`No room for your ${ITEMS[old.id].n.toLowerCase()}. It's at your feet.`)}}
  return true}
function unequip(s){const pl=S.player;const g=pl.eq[s];if(!g)return;pl.eq[s]=null;if(pStore(g))return;dropInst(g);toast(`No room. Your ${ITEMS[g.id].n.toLowerCase()} is at your feet.`)}
function quickMove(src,ref){const g=src.g;if(!mine(ref)&&!src.slot){// into your things
    takeFrom(src);if(pStore(g)){g.k=1;witnessTake();return true}putBack(src);toast("No room in your pockets or bag.");return false}
  const target=UI.open?gridOf("open"):null;takeFrom(src);
  if(target){if(nestedIn(target,g)){putBack(src);return false}const p=cFind(target,g);if(p){cPut(target,g,p.x,p.y,p.r);g.k=1;return true}putBack(src);toast("It won't fit in there.");return false}
  dropInst(g);g.k=1;return true}
function witnessTake(){if(!UI.open)return;const c=CONTS[UI.open.cid];if(c)witnesses(c,false)}
function splitInst(src){const g=src.g;if(g.n<2)return;const k=Math.floor(g.n/2);const n=mkInst(g.id,k);n.k=1;const c=src.c||null;let p=c?cFind(c,n):null;if(p){g.n-=k;cPut(c,n,p.x,p.y,p.r)}else if(pStore(n)){g.n-=k}else toast("No room to split it.")}
function dropSrc(src){takeFrom(src);const g=src.g;dropInst(g);g.k=1;cleanPiles()}
// eating, drinking, patching up
function useItem(id){if(!id)return;for(const {c} of pConts())for(const g of c.items)if(g.id===id){useInst({g,c});return}toast("You don't have that.")}
function useInst(src){const g=src.g;const it=ITEMS[g.id];const pl=S.player;const id=g.id;
  const consume=()=>{g.n-=1;if(g.n<=0){if(src.c)cRemove(src.c,g);else if(src.slot)pl.eq[src.slot]=null}};
  const leave=(aid)=>{const e=mkInst(aid);e.k=1;if(src.c&&g.n<=0&&cFits(src.c,...isz(e),g.x,g.y,null)){cPut(src.c,e,g.x,g.y,g.r)}else if(stash(e)==="ground")toast(`You set the ${ITEMS[aid].n.toLowerCase()} down.`)};
  if(it.eat){consume();pl.food=clamp(pl.food+it.eat.food,0,100);if(it.eat.water)pl.water=clamp(pl.water+it.eat.water,0,100);if(it.eat.sick&&rf()<it.eat.sick){pl.sick=1;journal("Your stomach turns. You shouldn't have eaten that raw.","bad")}else journal(`You eat the ${it.n.toLowerCase()}.`);advance(5)}
  else if(it.drink){consume();pl.water=clamp(pl.water+it.drink,0,100);if(it.after)leave(it.after);if(id==="whiskey"){pl.warmth=clamp(pl.warmth+10,0,100);pl.energy=clamp(pl.energy-3,0,100);journal("The whiskey burns all the way down. For a while, things are softer.")}else if(it.sick&&rf()<it.sick){pl.sick=1;journal("You drink the river water. Hours later your gut cramps. You're sick.","bad")}else journal(`You drink the ${it.n.toLowerCase()}.`);advance(3)}
  else if(it.med){useMed(id);return}
  else if(id==="cigarettes"){consume();pl.energy=clamp(pl.energy+4,0,100);journal("You smoke one. Your hands stop shaking for a while.")}
  else if(id==="radio"){advance(10);journal(radioLine());toast(radioLine())}
  else if(id==="photo"){const t=pick(["You look at the photo for a long time. Everyone in it is smiling. You can't remember what was funny.","The photo is creased from your pocket. You smooth it out and put it back.","You don't look at the photo. You just hold it."]);journal(t);toast(t)}
  else if(it.read){pl.flags.read=pl.flags.read||{};if(pl.flags.read[id]){toast("You've already read this one cover to cover.");return}pl.flags.read[id]=1;act(90);for(let i=0;i<6;i++)skillUp(it.read,.12);journal(`You read ${it.n.toLowerCase()} by the light you've got. Some of it sticks.`,"good")}
  else if(it.slot){equipInst(src)}
  else{toast(it.d||`You turn the ${it.n.toLowerCase()} over in your hands.`);return}
  save();render()}
function canUse(id){const it=ITEMS[id];return!!(it.eat||it.drink||it.med||it.read||["cigarettes","radio","photo"].includes(id))}
function useWord(id){const it=ITEMS[id];return it.eat?"Eat":it.drink?"Drink":it.med?{dress:"Wrap a wound",pain:"Take two",abx:"Take a course",clean:"Wash a wound",stitch:"Stitch a cut",splint:"Bind a break"}[it.med]:it.read?"Read":id==="cigarettes"?"Smoke":id==="radio"?"Listen":id==="photo"?"Look at it":"Use"}
function repairInst(src){const g=src.g;const it=ITEMS[g.id];const pl=S.player;if(!it.fix||!Object.entries(it.fix).every(([k,v])=>invHas(k,v)))return;for(const [k,v] of Object.entries(it.fix))invTake(k,v);
  const ws=atHome()&&siteHas(myGroup().home,"workshop");g.dur=Math.min(it.dur,g.dur+it.dur*(ws?.7:.45)+pl.sk.craft*2);act(20,{work:true});skillUp("craft",.06);journal(`You patch up your ${it.n.toLowerCase()}.`);save();render()}
function takeAll(){const c=gridOf("open");if(!c)return;let n=0,left=0;for(const g of [...c.items]){if(!g.k&&!UI.open.cid.startsWith("pile"))continue;cRemove(c,g);if(pStore(g)){n++;g.k=1}else{c.items.push(g);left++}}
  if(n)witnessTake();if(left)toast(n?`You take what fits. ${left} thing${left>1?"s":""} won't.`:"No room for any of it.");cleanPiles();save();render()}

// ---------- dragging ----------
function srcOf(el){const u=el.dataset.u;const f=findInst(u);if(!f)return null;return f}
function cellAt(gridEl,x,y,w,h,gx,gy){const r=gridEl.getBoundingClientRect();return{x:Math.round((x-r.left)/CELL-gx-(w-1)/2*0),y:Math.round((y-r.top)/CELL-gy)}}
function dragStart(e,el){const src=srcOf(el);if(!src)return;const g=src.g;const r=el.getBoundingClientRect();const [w,h]=src.slot?ITEMS[g.id].sz:isz(g);
  const gx=src.slot?Math.min(w-1,Math.max(0,Math.floor((e.clientX-r.left)/r.width*w))):Math.floor((e.clientX-r.left)/CELL),gy=src.slot?Math.min(h-1,Math.max(0,Math.floor((e.clientY-r.top)/r.height*h))):Math.floor((e.clientY-r.top)/CELL);
  UI.press={src,el,x0:e.clientX,y0:e.clientY,gx:Math.max(0,gx),gy:Math.max(0,gy),r:src.slot?0:g.r}}
function dragMove(e){const P_=UI.press;if(!P_)return;if(!UI.drag){if(Math.hypot(e.clientX-P_.x0,e.clientY-P_.y0)<5)return;
    const gh=document.createElement("div");gh.className="it ghost c-"+ITEMS[P_.src.g.id].cat;document.body.appendChild(gh);UI.drag={...P_,gh};P_.el.classList.add("lift");closeMenu();drawGhost()}
  const D=UI.drag;D.cx=e.clientX;D.cy=e.clientY;placeGhost();targetAt(e.clientX,e.clientY)}
function drawGhost(){const D=UI.drag;const g=D.src.g;const s=ITEMS[g.id].sz;const w=D.r?s[1]:s[0],h=D.r?s[0]:s[1];D.gh.style.width=w*CELL+"px";D.gh.style.height=h*CELL+"px";D.gh.innerHTML=itemSvg(g.id,D.r)+(g.n>1?`<span class="n">${g.n}</span>`:"");D.w=w;D.h=h}
function placeGhost(){const D=UI.drag;if(!D||D.cx==null)return;D.gh.style.transform=`translate(${D.cx-D.gx*CELL-CELL/2}px,${D.cy-D.gy*CELL-CELL/2}px)`}
function clearMark(){document.querySelectorAll(".dropmark").forEach(x=>x.remove());document.querySelectorAll(".slot.ok,.slot.bad").forEach(x=>x.classList.remove("ok","bad"))}
function targetAt(x,y){const D=UI.drag;clearMark();D.tgt=null;const under=document.elementFromPoint(x,y);if(!under)return;
  const slotEl=under.closest(".slot");if(slotEl){const s=slotEl.dataset.slot;const ok=!!slotFor(D.src.g.id,s)&&!(D.src.g.c&&false);slotEl.classList.add(ok?"ok":"bad");D.tgt=ok?{slot:s}:null;return}
  const gridEl=under.closest(".grid");if(!gridEl)return;const ref=gridEl.dataset.ref;let c=gridOf(ref);const virtual=!c&&ref==="ground";if(!c&&!virtual)return;const C=c||{g:[6,2],items:[]};
  const r=gridEl.getBoundingClientRect();const cx=Math.floor((x-r.left)/CELL)-D.gx,cy=Math.floor((y-r.top)/CELL)-D.gy;const g=D.src.g;
  // dropping onto a stack of the same thing tops it up
  const onIt=under.closest(".it");if(onIt&&onIt.dataset.u!==g.u){const o=C.items.find(q=>q.u===onIt.dataset.u);if(o&&o.id===g.id&&ITEMS[g.id].st>1&&o.n<ITEMS[g.id].st&&(o.k||ref!=="open")){D.tgt={ref,stack:o};mark(gridEl,o.x,o.y,...isz(o),true);return}}
  const ok=cFits(C,D.w,D.h,cx,cy,g)&&!(c&&nestedIn(c,g));D.tgt=ok?{ref,x:cx,y:cy,r:D.r}:null;mark(gridEl,cx,cy,D.w,D.h,ok)}
function mark(gridEl,x,y,w,h,ok){const m=document.createElement("div");m.className="dropmark "+(ok?"ok":"bad");m.style.cssText=`left:${x*CELL}px;top:${y*CELL}px;width:${w*CELL}px;height:${h*CELL}px`;gridEl.appendChild(m)}
function dragEnd(e){const P_=UI.press;UI.press=null;const D=UI.drag;if(!D)return false;UI.drag=null;D.gh.remove();clearMark();D.el.classList.remove("lift");
  const t=D.tgt;const src=D.src;const g=src.g;
  if(t){if(t.slot){equipInst(src,t.slot)}
    else if(t.stack){const o=t.stack;const k=Math.min(ITEMS[g.id].st-o.n,g.n);o.n+=k;g.n-=k;if(g.n<=0)takeFrom(src)}
    else{let c=gridOf(t.ref);if(!c&&t.ref==="ground")c=groundPile(true).c;if(c){const from=src.ref;takeFrom(src);cPut(c,g,t.x,t.y,t.r);if(t.ref==="open"||t.ref==="ground")g.k=1;if(mine(t.ref)&&from&&!mine(from))witnessTake()}}
    cleanPiles();save()}
  render();return true}
function cancelDrag(){const D=UI.drag;UI.press=null;if(!D)return;UI.drag=null;D.gh.remove();clearMark();D.el.classList.remove("lift");render()}
function rotateDrag(){const D=UI.drag;if(!D)return false;const s=ITEMS[D.src.g.id].sz;if(s[0]===s[1])return true;D.r=D.r?0:1;const t=D.gx;D.gx=D.gy;D.gy=t;drawGhost();placeGhost();if(D.cx!=null)targetAt(D.cx,D.cy);return true}

// ---------- the right-click menu ----------
function closeMenu(){const m=document.getElementById("ctx");if(m){m.hidden=true;m.innerHTML=""}UI.menu=null}
function openMenu(e,el){const src=srcOf(el);if(!src)return;const g=src.g;const it=ITEMS[g.id];const ref=src.ref||(src.slot?"slot":"");UI.menu={u:g.u};const opts=[];
  if(canUse(g.id))opts.push(["use",useWord(g.id)]);
  if(g.id==="whiskey"&&woundFor("clean"))opts.push(["cleanwith","Pour it on a wound"]);
  if(it.slot&&!src.slot)opts.push(["wear",it.slot==="weapon"?"Hold it":it.slot==="back"||it.slot==="rig"?"Put it on":"Wear it"]);
  if(it.slot==="weapon"&&it.side&&src.slot!=="side"&&!src.slot)opts.push(["belt","Put it on your belt"]);
  if(src.slot)opts.push(["unequip",it.slot==="weapon"?"Put it away":"Take it off"]);
  if(!mine(ref)&&!src.slot)opts.push(["take","Take it"]);
  if(mine(ref)&&UI.open)opts.push(["give","Put it in the "+contName(UI.open.cid).toLowerCase()]);
  if(it.st>1&&g.n>1&&src.c)opts.push(["split","Split the stack"]);
  if(it.fix&&g.dur<it.dur){const ok=Object.entries(it.fix).every(([k,v])=>invHas(k,v));opts.push(["fix",`Fix it (${Object.entries(it.fix).map(([k,v])=>ITEMS[k].n.toLowerCase()+(v>1?" ×"+v:"")).join(", ")})`,!ok])}
  if(ref!=="ground")opts.push(["drop","Drop it"]);
  opts.push(["look","Look at it"]);
  const m=document.getElementById("ctx");if(!m)return;m.innerHTML=`<div class="mtitle">${esc(it.n)}${g.n>1?" ×"+g.n:""}</div>`+opts.map(([k,t,dis])=>`<button data-act="inv" data-v="${k}|${g.u}"${dis?" disabled":""}>${esc(t)}</button>`).join("");
  m.hidden=false;const W=innerWidth,H=innerHeight;m.style.left=Math.min(e.clientX,W-230)+"px";m.style.top=Math.min(e.clientY,H-m.offsetHeight-10)+"px"}
function onInvAct(a,v,el,e){if(a==="takeall"){takeAll();return true}if(a==="closeopen"){closeOpen();return true}if(a!=="inv")return false;
  const [k,u]=v.split("|");closeMenu();const src=findInst(u);if(!src)return true;const g=src.g;const it=ITEMS[g.id];
  switch(k){case"use":useInst(src);return true;case"cleanwith":{const w=woundFor("clean");if(w)doCare("wash",w,g.id);return true}case"wear":equipInst(src);break;case"belt":equipInst(src,"side");break;case"unequip":unequip(src.slot);break;
    case"take":quickMove(src,src.ref);break;case"give":quickMove(src,src.ref);break;case"split":splitInst(src);break;case"fix":repairInst(src);return true;
    case"drop":dropSrc(src);break;case"look":toast(`${it.n}. ${it.d||""} ${gearStats(g.id)?"("+gearStats(g.id)+")":""} ${it.uses?(it.uses-(g.used||0))+" of "+it.uses+" uses left.":""} ${it.w?it.w*g.n+" kg.":""}`.replace(/\s+/g," ").trim());return true}
  cleanPiles();save();render();return true}
// pointer wiring for the panel
document.addEventListener("pointerdown",e=>{if(!S||UI.create)return;const m=document.getElementById("ctx");if(m&&!m.hidden&&!e.target.closest("#ctx"))closeMenu();
  if(e.button!==0)return;const el=e.target.closest("#panel .it:not(.unk)");if(!el)return;e.preventDefault();
  if(e.shiftKey){const src=srcOf(el);if(src){quickMove(src,src.ref||(src.slot?"slot":""));cleanPiles();save();render()}return}
  dragStart(e,el)});
document.addEventListener("pointermove",e=>{if(UI.press)dragMove(e)});
document.addEventListener("pointerup",e=>{if(UI.press&&!UI.drag){UI.press=null;return}if(UI.drag)dragEnd(e)});
document.addEventListener("dblclick",e=>{if(!S)return;const el=e.target.closest("#panel .it:not(.unk)");if(!el)return;const src=srcOf(el);if(!src)return;const it=ITEMS[src.g.id];
  if(canUse(src.g.id))useInst(src);else if(it.slot&&!src.slot){equipInst(src);save();render()}else if(src.slot){unequip(src.slot);save();render()}else if(!mine(src.ref)){quickMove(src,src.ref);cleanPiles();save();render()}});
document.addEventListener("contextmenu",e=>{const el=e.target.closest("#panel .it:not(.unk)");if(!el)return;e.preventDefault();openMenu(e,el)});
addEventListener("keydown",e=>{if(e.key==="r"||e.key==="R"){if(UI.drag){e.preventDefault();e.stopImmediatePropagation();rotateDrag()}}},true);
