// ================= building it yourself: a short, easy hands-on build =================
// Each structure is a few steps: drive stakes (click the marks), hold-and-release (raise a pole, hammer, pump), drag (pull a cover or plank into place).
const MG={b:null,i:0,done:[],hold:null,drag:null};
function openMinigame(b){if(!b||b.done)return;MG.b=b;MG.i=0;MG.done=[];MG.stakes=[];$("build").classList.add("open");UI.paused=true;renderMG()}
function closeMG(finished){$("build").classList.remove("open");UI.paused=false;const b=MG.b;MG.b=null;if(!finished&&b)log(`You leave the ${b.name.toLowerCase()} half-done. ${members().some(p=>p.job==="build")?"The builders will finish it.":"Someone may finish it, or you can come back."}`);renderAll()}
function mgFrame(){const b=MG.b;const B=BUILDS[b.type];const [w,d]=B.size;const s=Math.min(360/w,190/d,60);const W_=w*s,D=d*s;return{x0:300-W_/2,y0:175-D/2,W:W_,D,s}}
function stakeSpots(n,f){const {x0,y0,W:w,D:d}=f;if(n===4)return[[x0,y0],[x0+w,y0],[x0+w,y0+d],[x0,y0+d]];if(n===2)return[[x0,y0+d/2],[x0+w,y0+d/2]];if(n===3)return[[x0+w*.2,y0+d*.8],[x0+w*.5,y0+d*.2],[x0+w*.8,y0+d*.8]];
  if(n===6){const L=[];for(let i=0;i<6;i++){const a=i/6*Math.PI*2;L.push([300+Math.cos(a)*Math.min(w,d)*.45,175+Math.sin(a)*Math.min(w,d)*.45])}return L}
  const L=[];for(let i=0;i<n;i++)L.push([x0+w*(i+.5)/n,y0+d/2]);return L}
function renderMG(){const b=MG.b;if(!b)return;const B=BUILDS[b.type];const st=B.steps[MG.i];const f=mgFrame();const o=b.opt||{};const color=o.cover||o.walls||o.roof||o.color||"#8a6a48";
  const did=t=>MG.done.includes(t);const layers=[];
  // what's built so far, drawn from above
  layers.push(`<rect x="${f.x0}" y="${f.y0}" width="${f.W}" height="${f.D}" fill="none" stroke="#d8d0b8" stroke-dasharray="6 5" stroke-width="2" opacity=".55"/>`);
  for(let i=0;i<MG.i;i++){const s=B.steps[i];if(s.t==="stakes")for(const [x,y] of stakeSpots(s.n,f))layers.push(`<circle cx="${x}" cy="${y}" r="7" fill="#6a4a2a" stroke="#2a1a0a" stroke-width="2"/>`);
    if(s.t==="hold")layers.push(`<rect x="${f.x0+6}" y="${f.y0+f.D/2-4}" width="${f.W-12}" height="8" fill="#8a6a42" stroke="#3a2a1a"/>`);
    if(s.t==="drag")layers.push(`<rect x="${f.x0}" y="${f.y0}" width="${f.W}" height="${f.D}" fill="${color}" opacity="${.55+i*.1}" stroke="#2a2a2a" stroke-width="2"/>`)}
  let ctrl="";
  if(st.t==="stakes"){const spots=stakeSpots(st.n,f);for(let i=0;i<spots.length;i++){const [x,y]=spots[i];const hit=MG.stakes.includes(i);
      layers.push(hit?`<circle cx="${x}" cy="${y}" r="7" fill="#6a4a2a" stroke="#2a1a0a" stroke-width="2"/>`:`<g data-act="mgstake" data-i="${i}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="17" fill="rgba(232,160,80,.25)" stroke="#e8a050" stroke-width="2"><animate attributeName="r" values="14;19;14" dur="1.2s" repeatCount="indefinite"/></circle><text x="${x}" y="${y+4}" text-anchor="middle" font-size="12" fill="#fff" font-family="JetBrains Mono">✕</text></g>`)}}
  if(st.t==="hold"){const v=MG.hold?MG.hold.v:0;layers.push(`<rect x="540" y="40" width="30" height="270" fill="#1a1a1a" stroke="#888" rx="4"/><rect x="540" y="${40+270*(1-.82)}" width="30" height="${270*.2}" fill="rgba(156,194,122,.55)"/><rect x="543" y="${40+270*(1-v)}" width="24" height="${270*v}" fill="#e8a050" rx="3"/>`);
    ctrl=`<button class="pri" id="mghold" style="width:100%;padding:12px;margin-top:8px;touch-action:none">Hold, and let go in the green</button>`}
  if(st.t==="drag"){const p=MG.drag||{x:70,y:300};layers.push(`<rect x="${f.x0}" y="${f.y0}" width="${f.W}" height="${f.D}" fill="none" stroke="#9cc27a" stroke-width="3" stroke-dasharray="10 6"><animate attributeName="stroke-opacity" values=".4;1;.4" dur="1.4s" repeatCount="indefinite"/></rect>`);
    layers.push(`<g id="mgpiece" style="cursor:grab"><rect x="${p.x-f.W*.35}" y="${p.y-f.D*.25}" width="${f.W*.7}" height="${f.D*.5}" fill="${color}" stroke="#fff" stroke-width="2" rx="4" opacity=".92"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle" font-size="12" fill="#fff" font-family="JetBrains Mono">drag me</text></g>`)}
  $("bcard").innerHTML=`<button class="x" data-act="mgquit">×</button><h2>${esc(b.name)}</h2>
    <svg id="bsvg" viewBox="0 0 600 350">${layers.join("")}</svg>
    <div id="bstep">${esc(st.say)}</div><div id="bprog">Step ${MG.i+1} of ${B.steps.length}${MG.msg?` · ${esc(MG.msg)}`:""}</div>${ctrl}`;
  if(st.t==="hold")bindHold();if(st.t==="drag")bindDrag(f)}
ACTS.mgquit=()=>closeMG(false);
ACTS.mgstake=d=>{const i=+d.i;if(MG.stakes.includes(i))return;MG.stakes.push(i);MG.msg=pick(["Thunk.","Solid.","That'll hold.","Thwack."]);const st=BUILDS[MG.b.type].steps[MG.i];if(MG.stakes.length>=st.n)mgNext();else renderMG()};
function bindHold(){const btn=$("mghold");if(!btn)return;let raf=null;
  const down=e=>{e.preventDefault();MG.hold={v:0,t:performance.now()};const tick=()=>{if(!MG.hold)return;MG.hold.v=Math.min(1.05,(performance.now()-MG.hold.t)/1500);if(MG.hold.v>=1.05){MG.hold=null;MG.msg="Too far. It slipped. Try again.";renderMG();return}
      const bar=document.querySelector("#bsvg rect:last-of-type");if(bar){bar.setAttribute("y",40+270*(1-Math.min(1,MG.hold.v)));bar.setAttribute("height",270*Math.min(1,MG.hold.v))}raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)};
  const up=()=>{if(!MG.hold)return;const v=MG.hold.v;MG.hold=null;cancelAnimationFrame(raf);if(v>=.6&&v<=.84){MG.msg="Perfect.";mgNext()}else{MG.msg=v<.6?"Not far enough. Again.":"Too far. Again.";renderMG()}};
  btn.addEventListener("pointerdown",down);btn.addEventListener("pointerup",up);btn.addEventListener("pointerleave",up)}
function bindDrag(f){const svg=$("bsvg"),g=$("mgpiece");if(!svg||!g)return;const pt=e=>{const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*600,y:(e.clientY-r.top)/r.height*350}};let on=false;
  g.addEventListener("pointerdown",e=>{on=true;g.setPointerCapture?.(e.pointerId);e.preventDefault()});
  g.addEventListener("pointermove",e=>{if(!on)return;const p=pt(e);MG.drag=p;const r=g.querySelector("rect"),t=g.querySelector("text");r.setAttribute("x",p.x-f.W*.35);r.setAttribute("y",p.y-f.D*.25);t.setAttribute("x",p.x);t.setAttribute("y",p.y+4)});
  g.addEventListener("pointerup",e=>{if(!on)return;on=false;const p=pt(e);if(dist(p.x,p.y,300,175)<Math.max(50,Math.min(f.W,f.D)*.5)){MG.drag=null;MG.msg=pick(["It fits.","There.","Snug."]);mgNext()}else{MG.drag=p;MG.msg="Line it up with the green outline.";renderMG()}})}
function mgNext(){const b=MG.b;const B=BUILDS[b.type];MG.done.push(B.steps[MG.i].t);MG.i++;MG.stakes=[];MG.drag=null;if(MG.i<B.steps.length){renderMG();return}
  b.done=true;b.prog=B.hrs;S.bv++;const hrs=Math.min(4,Math.max(.5,B.hrs*.3));UI.paused=false;step(hrs*HOUR);drawBld(b);
  log(`You built the ${b.name.toLowerCase()} yourself.`,"good");for(const p of localPeople())if(p.status==="member"&&dist(p.x,p.z,b.x,b.z)<14){p.trust=Math.min(100,p.trust+1);mem(p,`I watched ${S.player.name} build the ${b.name.toLowerCase()} with ${S.player.sex==="F"?"her":"his"} own hands.`,1)}
  $("bcard").innerHTML=`<h2>${esc(b.name)}</h2><p>Done. It took you about ${hrs<1?"half an hour":Math.round(hrs)+" hour"+(Math.round(hrs)>1?"s":"")}.</p><button class="opt pri" data-act="mgok">Good</button>`;save()}
ACTS.mgok=()=>closeMG(true);
