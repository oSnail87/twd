// ================= what people decide when you ask something of them =================
// Every ask is weighed against who they are: trust in you, their nature, their motive and their family.
// The reasons come back with the answer, so you can see why someone said no.
function noise(p,k){const R=srng(hashStr(p.id+k+dayOf(S.t)));return R()*2-1}
function danger(k){const L=LOCS[k];if(!L)return 1;let d=L.danger||1;if(S.rival&&!S.rival.gone&&S.rival.site===k)d+=3;return d}
function weigh(p,kind,ctx){ctx=ctx||{};const R=[];const add=(v,t)=>{if(Math.abs(v)>=.15)R.push({v:Math.round(v*10)/10,t})};const T=p.tr;
  const kids=kidsOf(p).filter(q=>q.status==="member");const fam=famOf(p).filter(q=>q.status==="member"||q.status===p.status);const kid=kids[0]||fam[0];
  const trust=(p.trust-45)/25;
  if(kind==="join"){add(1.6,"Wants somewhere safe");if(fam.length)add(.6,`Needs a roof for ${listAnd(fam.slice(0,2).map(q=>q.name))}`);add(trust*.6,trust>0?"Likes the look of you":"Doesn't know you");
    if(p.motive==="freedom")add(-1,"Doesn't like being told what to do");if(T.social<-.5)add(-.5,"Doesn't trust crowds");}
  else if(kind==="job"){const j=JOBS[ctx.job];const sk=p.sk[j.sk];
    if(p.kid&&!["farm","water","cook"].includes(ctx.job))return{yes:false,reasons:[{v:-9,t:`${p.name} is ${p.age}. That's not a job for a kid`}],score:-9};
    add(trust,trust>0?"Trusts you":"Doesn't trust you yet");add(sk*.45,sk>=2?`Good at ${j.n.toLowerCase()}`:sk>=1?`Knows a little about ${j.n.toLowerCase()}`:"");if(sk===0)add(-.25,`Has never done ${j.n.toLowerCase()}`);
    if(["farm","water","wood","cook"].includes(ctx.job))add(.45+(S.res.food<campSize()*2&&ctx.job==="farm"?.4:0),"Someone has to do it");
    add(T.diligent*.7,T.diligent>0?"Hardworking":"Lazy");add(T.loyal*.5,T.loyal>0?"Loyal":"");
    if(ctx.job==="guard"||ctx.job==="scav"){add(T.brave*.9,T.brave>0?"Not afraid of the dead":"Scared of the dead");if(kids.length&&ctx.job==="scav")add(-.6-T.kind*.3,`Doesn't want to be away from ${kids[0].name}`);if(p.motive==="safety")add(-.6,"Wants to stay alive above all");if(p.motive==="revenge")add(.9,"Wants to fight back")}
    if(p.motive==="purpose")add(.8,"Wants to be useful");if(p.motive==="freedom")add(-.7,"Doesn't like being told what to do");if(p.mood<30)add(-.6,"Miserable right now");if(p.hp<45)add(-.8,"Still hurt")}
  else if(kind==="lead"){add(trust*.8,trust>0?"Trusts you":"Doesn't trust you yet");add(T.social*.5,T.social>0?"Gets along with people":"Not a people person");add(T.diligent*.5,"");add(p.sk[JOBS[ctx.job].sk]*.3,"Knows the work");if(p.motive==="purpose"||p.motive==="belonging")add(.7,"Would be proud to");if(p.motive==="freedom")add(.4,"Likes running their own thing")}
  else if(kind==="come"||kind==="war"){const d=kind==="war"?3:danger(ctx.to);const R_=S.rival;
    if(p.kid)return{yes:false,reasons:[{v:-9,t:`${p.name} is a kid, and stays in camp`}],score:-9};
    add(kind==="war"?(p.trust-40)/20:trust*1.1,p.trust>45?"Trusts you":"Doesn't trust you");add(T.loyal*.6,T.loyal>0?"Loyal to the group":"Looks out for themself");
    add(T.brave*(kind==="war"?.8:.4+d*.15),T.brave>0?"Brave":"Scared");
    if(kind==="war")add(-.7,"People are going to die");else if(d>=3)add(-(d-2)*.35,`The ${LOCS[ctx.to]?.n||"place"} is dangerous`);
    if(kid&&kind==="war"){if(p.motive==="family")add(1.1+T.brave*.3,`Wants the world safer for ${kid.name}`);add(-(.8+Math.max(0,T.kind)*.8+(kid.kid?.6:0)),`Wants to stay home, keep ${kid.name} safe and near`)}
    else if(kid&&kid.loc===campK()&&kind==="come")add(-.4-(kid.kid?.4:0),`Doesn't like leaving ${kid.name}`);
    if(kind==="war"){if(p.motive==="revenge")add(1.2,"Wants someone to pay");if(p.motive==="safety")add(R_&&R_.angry>0?.5:-.6,R_&&R_.angry>0?"They'll keep coming unless someone stops them":"Wants to stay alive, not win");
      if(T.kind>.4)add(-.5,"Hates the thought of hurting people");if(T.temper>.4)add(.6,"Itching for a fight");if(p.motive==="faith")add(-.3,"Thou shalt not kill");
      if(R_&&R_.hurt?.includes(p.id))add(1,"The Pruitts hurt them");if(R_&&(R_.angry>0||R_.demanded))add(.5,"Sick of being pushed around")}
    if(ctx.to&&/pharm/.test(ctx.to)&&(p.cond||fam.some(q=>q.cond)))add(.8,"Needs medicine from there");
    if(p.hp<45)add(-1,"Still hurt");if(p.mood<25)add(-.5,"Worn down")}
  else if(kind==="stay"||kind==="free")add(2,"Fine by them");
  else if(kind==="leave"){add(-1.5,"Doesn't want to go");add(trust*.3,"")}
  const asked=(p.asked[kind+(ctx.job||ctx.to||"")]||0);if(asked)add(-.5*asked,"You already asked");
  const n=noise(p,kind+(ctx.job||ctx.to||""))*.5;const score=R.reduce((a,r)=>a+r.v,0)+n;
  p.asked[kind+(ctx.job||ctx.to||"")]=asked+1;
  return{yes:score>0,score,reasons:R.filter(r=>r.t).sort((a,b)=>Math.abs(b.v)-Math.abs(a.v))}}
function reasonsHtml(r){return`<ul class="why">${r.reasons.slice(0,5).map(x=>`<li class="${x.v>0?"p":"m"}">${x.v>0?"+":"−"} ${esc(x.t)}</li>`).join("")}</ul>`}
// their answer, in their own words when Claude isn't writing them
function answerLine(p,kind,r,ctx){const top=r.reasons[0]?.t||"";const k=kidsOf(p)[0];
  if(r.yes){if(kind==="war")return pick([k?`For ${k.name}. So they don't have to grow up like this. I'm in.`:"Alright. Let's end it.","I'll be there. Don't make me regret it.","Yeah. Someone has to."]);
    if(kind==="come")return pick(["Alright, I'm with you.","Lead the way.","Fine. Let's be quick about it.","Okay. Stay close."]);
    if(kind==="job")return pick([`I can do ${JOBS[ctx.job].n.toLowerCase()}.`,"Sure. I'll handle it.","Okay. Leave it to me.",p.sk[JOBS[ctx.job].sk]>=2?"Finally, something I'm good at.":"I'll figure it out."]);
    if(kind==="lead")return pick(["Me? Alright. I'll keep it running.","I won't let you down.","Okay. Nobody's going to bother you about it."]);
    if(kind==="join")return pick(["Thank you. God, thank you.","We won't be any trouble. I promise.","You won't regret it."]);
    return"Okay."}
  if(/kid|stays in camp/.test(top))return pick(["They said no grown-up stuff.","I'm not allowed."]);
  if(/stay home|leaving|away from/.test(top)&&k)return kind==="war"?`I can't. If something happens to me, who's going to look after ${k.name}? I'm sorry.`:`I'm not leaving ${k.name}. Ask someone else.`;
  if(/trust/i.test(top))return pick(["I barely know you.","Why would I do that for you?","Ask me again when I know you better."]);
  if(/dangerous|die|Scared|alive/i.test(top))return pick(["No. Not there. I'm sorry.","You go get yourself killed if you want.","I can't. I just can't."]);
  if(/hurt/i.test(top))return"Look at me. I can barely stand.";if(/Lazy|Miserable/.test(top))return pick(["Not today.","Find someone else.","I'm done in."]);
  if(/told what to do/.test(top))return"I don't take orders. Not anymore.";if(/hurting people|kill/.test(top))return"I'm not killing people. The dead, fine. Not people.";
  if(/already asked/.test(top))return"I heard you the first time.";return pick(["No.","I don't think so.","Not this time."])}

// ================= small talk, by the rules =================
// "hums old country songs while they work" becomes "I hum old country songs while I work."
function firstQuirk(q){const V={hums:"hum",counts:"count",keeps:"keep",tells:"tell",sleeps:"sleep",talks:"talk",whittles:"whittle",has:"have",swears:"swear",reads:"read"};
  return"I "+q.replace(/^(\S+)/,w=>V[w]||w).replace(/\btheir\b/g,"my").replace(/\bthey're\b/g,"I'm").replace(/\bthey\b/g,"I")+"."}
function intentOf(t){t=t.toLowerCase();const I=[];const h=re=>re.test(t);
  if(h(/\b(hi|hey|hello|howdy|morning|evening|yo)\b/))I.push("greet");if(h(/how are you|you ok|you okay|how you doing|how're you|you alright/))I.push("how");
  if(h(/who are you|your name|about yourself|tell me about you|where.*from/))I.push("who");if(h(/what do you (want|need)|what would help|anything you need/))I.push("need");
  if(h(/family|kid|son|daughter|wife|husband|brother|sister/))I.push("family");if(h(/thank/))I.push("thanks");if(h(/joke|funny|laugh/))I.push("joke");
  if(h(/idiot|stupid|shut up|useless|hate you|screw you|fuck/))I.push("insult");if(h(/beautiful|handsome|pretty|cute|date|kiss|like you/))I.push("flirt");
  if(h(/before|used to|job|work/))I.push("before");if(h(/sorry|apolog/))I.push("sorry");if(h(/scared|afraid|fear/))I.push("fear");if(h(/hope|dream|miss/))I.push("hope");
  if(h(/good job|well done|proud|great work|nice work/))I.push("praise");return I}
function chatReply(p,text){const I=intentOf(text);const pn=S.player.name;const T=p.tr;const warm=p.trust>55;let dt=0,line;
  const st=p.mood>60?"good":p.mood>35?"tired":"bad";
  if(I.includes("insult")){dt=-6;line=T.temper>.3?pick(["Say that again. I dare you.","Watch your mouth."]):pick(["Wow. Okay.","...Right."])}
  else if(I.includes("flirt")){if(p.kid||S.player.age<18){line="Ew. No.";dt=-1}else if(p.trust>60&&p.partner==null){line=pick(["You're sweet. Ask me again when we're not covered in dirt.","Stop it. ...Don't stop it."]);dt=2}else{line=pick(["Let's just get through today.","Not the time."]);dt=-.5}}
  else if(I.includes("how"))line=st==="good"?pick(["Better than I've been in a while, honestly.","Not bad. The fire helps."]):st==="tired"?pick(["Tired. Everyone's tired.","Getting by."]):pick(["Honestly? Not great.","Bad. I keep thinking about before."]);
  else if(I.includes("who"))line=`${p.name} ${p.sur}. I was ${p.job0?"a "+JOBS_BEFORE[p.job0].n:"in school"} before all this.${warm?" "+firstQuirk(p.quirk):""}`;
  else if(I.includes("need"))line=p.cond&&itemCount(CONDS[p.cond].item)<2?`${CONDS[p.cond].item==="insulin"?"Insulin":ITEMS[CONDS[p.cond].item]}. I'm ${CONDS[p.cond].n}. Please don't let anyone touch mine.`:{family:`Just keep my family safe.`,safety:"Walls. Higher walls.",belonging:"Honestly? Just to be part of this.",purpose:"Give me something to do. Sitting still is killing me.",revenge:"Point me at the dead.",faith:"A quiet place to pray.",freedom:"Room to breathe."}[p.motive];
  else if(I.includes("family")){const f=famOf(p);line=f.length?`${f.map(q=>`My ${p.fam[q.id]}, ${q.name}`).join(". ")}. ${f.some(q=>q.status==="dead")?"":"They're everything."}`:pick(["Nobody left. Not that I know of.","I had a sister in Denver. I don't know."])}
  else if(I.includes("thanks")||I.includes("praise")){dt=2;line=pick(["Don't mention it.","Somebody had to.","...Thanks. That means something."])}
  else if(I.includes("joke"))line=T.social>0?pick(["What's a zombie's favorite bean? Human bean. ...I'll see myself out.","Knock knock. ...Actually don't answer that anymore."]):"I'm not really a joke person.";
  else if(I.includes("before"))line=p.job0?`I was a ${JOBS_BEFORE[p.job0].n}. Feels like a hundred years ago.`:"School. Homework. It seems so stupid now.";
  else if(I.includes("sorry")){dt=1.5;line=pick(["It's fine.","Okay. Thanks for saying it."])}
  else if(I.includes("fear"))line=`${cap1(p.fear)}. Always has been. Now it's worse.`;
  else if(I.includes("hope"))line=`${cap1(p.hope)}. That's what I think about.`;
  else if(I.includes("greet")){dt=.6;line=warm?pick([`Hey, ${pn}.`,"There you are.","Hey yourself."]):pick(["Hey.","Hi.","Mm. Hello."])}
  else line=pick(["Huh.","Yeah, maybe.","I don't know what to tell you.","If you say so.","Mm."]);
  return{line,dt}}
