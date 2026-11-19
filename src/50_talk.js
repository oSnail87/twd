
// ================= built-in dialogue engine =================
const INTENTS=[
  ["bitten",/\b(i('?m| am| was| got| been| have been) (bit|bitten)|(it|one|they|he|she|something|a zombie|a walker) bit me|got bitten)\b/],
  ["insult",/\b(idiot|stupid|moron|hate you|shut up|useless|coward|pathetic|loser|bitch|asshole|dumbass|dumb|freak|worthless)\b/],
  ["threat",/\b(kill you|hurt you|or else|make you pay|you'?ll regret|beat you|i'?ll shoot|watch your back)\b/],
  ["child",/\b(have a (baby|kid|child)|start a family|try for a (baby|kid)|our own (kid|baby)|make a baby)\b/],
  ["romance",/\b(love you|be together|go out with me|date me|kiss (me|you)|be with me|be mine|marry me|be my (girlfriend|boyfriend|partner))\b/],
  ["flirt",/\b(cute|beautiful|handsome|pretty|gorgeous|attractive|i like you|you look good|nice eyes|nice smile)\b/],
  ["breakup",/\b(break up|it'?s over between|we'?re done|i'?m leaving you|end this)\b/],
  ["ask_join",/\b(can i join|let me join|join your (group|people|camp)|take (me|us) in|room for (me|one more|us)|let (me|us) in|can (we|i) (come|stay) with you)\b/],
  ["join_me",/\b(join (me|us|my group|my people|my camp)|be part of my|be in my group|start a group|be my people)\b/],
  ["follow_me",/\b(come with (me|us)|follow me|stick with me|run with me|come along|let'?s go|walk with me|tag along|go with me|team up|stick together|work together)\b/],
  ["leave_group",/\b(i'?m leaving (the group|you all|this place)|leave the group|i quit|i'?m out\b|going my own way)\b/],
  ["stay",/\b(stay here|wait here|stop following|go home|go back( to camp)?|you can go|head back)\b/],
  ["lead",/\b(i should lead|let me lead|i want to lead|step down|i'?ll lead|make me (the )?leader|put me in charge|take over)\b/],
  ["who_lead",/\b(who'?s in charge|who leads|who runs|your leader|who'?s the boss)\b/],
  ["alliance",/\b(alliance|allies|ally|work together|pact|team up|join forces|help each other)\b/],
  ["demand",/\b(hand over|give us your|pay us|tribute|or we'?ll|we'?ll take)\b/],
  ["trade",/\b(trade|swap|barter|buy|sell|make a deal)\b/],
  ["help",/\b(can i help|need (anything|help)|what do you need|anything i can do|need something)\b/],
  ["deliver",/\b(brought|here'?s (your|the|some)|here you go|got (you|your)|i found (your|some|the)|for you|take this|i have your)\b/],
  ["give_req",/\b(can i have|could i have|give me|spare (some|a|any)|do you have (any|a|some))\b/],
  ["remember",/\b(remember|recall)\b/],
  ["secret",/\b(secret|tell me something real|confess|what are you hiding)\b/],
  ["fear",/\b(afraid|scared|fear|frighten|terrif)/],
  ["hope",/\b(hope|dream|want most|after all this|look forward)\b/],
  ["self_lost",/\b(i lost my|my \w+ (died|turned|is dead|didn'?t make it))\b/],
  ["self_job",/\b(i was a|i used to (be|work)|i worked (as|at))\b/],
  ["self_name",/\b(my name is|i'?m called|call me)\b/],
  ["before",/\b(before (all this|the outbreak|it happened|this)|what did you do|your job|for a living|used to do)\b/],
  ["from",/\b(where .*from|grow up|hometown|born)\b/],
  ["who",/\b(who are you|your name|what'?s your name|tell me about (you|yourself)|about yourself)\b/],
  ["family",/\b(family|kids|children|wife|husband|mom|dad|mother|father|brother|sister|son|daughter|parents|grandkid|grandson)\b/],
  ["how",/\b(how are you|how'?re you|you ok|you okay|are you alright|holding up|how do you feel|how'?s it going|doing ok|you good)\b/],
  ["where",/\b(where('?s| is| are| did)|have you seen|seen \w+|know where)\b/],
  ["outbreak",/\b(flu|virus|outbreak|the radio|on the radio|what'?s going on|what'?s happening|what is happening|what happened|sick people|epidemic|plague|disease|infection|the clinic)\b/],
  ["favorite",/\b(favou?rite|what do you (like|love|enjoy)|for fun|hobbies|hobby)\b/],
  ["sleep_q",/\b(sleep (ok|okay|well|alright|at all)|get (any )?sleep|sleep last night|slept|tired)\b/],
  ["kidding",/\b(just kidding|jk|i'?m joking|only joking|kidding)\b/],
  ["dead",/\b(dead ones|zombies?|walkers?|biters?|infected|the sick|bite|bitten|undead|corpses|them out there|the dead)\b/],
  ["food",/\b(food|hungry|eat|eaten|ate|meals?|starving|water|thirsty|supplies)\b/],
  ["plan",/\b(plan|what now|what do we do|what should we|winter|future|going to do)\b/],
  ["news",/\b(news|heard anything|what'?s new|gossip|rumou?r|anything happen)\b/],
  ["joke",/\b(joke|make me laugh|something funny)\b/],
  ["comfort",/\b(sorry (for|about) your|i'?m here for you|it'?ll be (ok|okay|alright)|not your fault|hang in there|you'?re not alone)\b/],
  ["apology",/\b(sorry|apologi[sz]e|my bad|forgive me)\b/],
  ["thanks",/\b(thank|thanks|appreciate)\b/],
  ["compliment",/\b(good job|well done|proud of you|you'?re (doing )?(great|amazing|brave|strong|smart|a good|so good|awesome|incredible)|doing (great|good|well|fine|a good job)|nice work|you did (good|great|well))\b/],
  ["opinion",/\b(what do you think|thoughts on|opinion|feel about|do you trust|do you like|think of)\b/],
  ["bye",/\b(bye|goodbye|see you|catch you later|good night|gotta go)\b/],
  ["greet",/\b(hi|hey|hello|yo|morning|evening|howdy|sup|hiya)\b/],
  ["yes",/^\s*(yes|yeah|yep|sure|ok|okay|of course|definitely|i did|i have|absolutely|uh huh|yup|alright)\b/],
  ["no",/^\s*(no|nope|nah|not really|never|i didn'?t|i haven'?t|no way)\b/],
];
const JOKES=["Why don't the dead eat clowns? Because they taste funny. ...I'll see myself out.","What do you call a zombie who tells jokes? Dead serious. Ha.","My therapist always said I needed to get out more. Well. Here I am.","Good news: no more taxes. Bad news: everything else.","I used to complain about my commute. Now my commute tries to eat me."];
function findMentions(msg,p){const out={people:[],place:null,group:null};const low=msg.toLowerCase();
  const pool=S.people.filter(q=>q!==p&&(q.met||p.rel[q.id]!==undefined||q.seed||p.fam[q.id]||(q.group&&q.group===p.group)));
  for(const q of pool){const n=q.name.toLowerCase();if(new RegExp("\\b"+n+"\\b").test(low)&&!out.people.includes(q))out.people.push(q)}
  for(const [k,v] of Object.entries(PLACES))if(low.includes(v.n.toLowerCase())||low.includes(k)&&k.length>4)out.place=k;
  if(/\bpharmacy\b/.test(low))out.place="town";if(/\bchurch\b/.test(low))out.place="church";if(/\bquarry\b/.test(low))out.place="quarry";if(/\bschool\b/.test(low))out.place="school";if(/\bfarm\b/.test(low))out.place="farm";
  for(const g of Object.values(S.groups))if(low.includes(g.name.toLowerCase()))out.group=g;
  if(/\b(me|myself)\b/.test(low)&&/think of|feel about|trust|like/.test(low))out.me=true;
  return out}
function tier(p){const f=feel(p);return f<-40?"hostile":f<-10?"cold":f<20?"neutral":f<50?"friendly":"close"}
function styleSay(p,t){if(!t)return t;const st=p.style;
  if(st==="formal")t=t.replace(/\bI'm\b/g,"I am").replace(/\bdon't\b/g,"do not").replace(/\bcan't\b/g,"cannot").replace(/\bit's\b/g,"it is").replace(/\byou're\b/g,"you are").replace(/\bwe're\b/g,"we are").replace(/\bthat's\b/g,"that is").replace(/\bwon't\b/g,"will not");
  const LCW=/^(The|It|It's|That|That's|This|There|We|We're|What|Why|How|Yeah|Yes|No|Not|Just|Every|Fine|Alive|Good|Okay|Sure|Probably|Maybe|Honestly|Well|Lead|Alright|Right|Getting|Same|Better|Tired|Hungry|Hurts|Find|Wait|Get|Come|Before|Ask|Nobody|Nothing|Don't|You|Your|Let's|Watch|Keep|Stay|See|Sorry|Thanks|Bad|Funny|Hm|Here|Take|Over|Wow|Like|Never|Some|Most|All|One|Two|Three|Plan|Work|Ha|Nice|Is|Are|Do|Does|Did|Have|Can|Could|Would|Should|Of|Too|So|And|But|Or|Me|My|Our)$/;
  const lc=x=>{const w=x.split(/[\s,.?!]/)[0];return LCW.test(w)?x[0].toLowerCase()+x.slice(1):x};
  if(st==="crude"&&rf()<.2&&t[0]!=="*"&&LCW.test(t.split(/[\s,.?!]/)[0]))t=pick(["Hell, ","Look, "])+lc(t);
  if(st==="nervous"&&rf()<.3&&t[0]!=="*"){const u=t.replace(/\. /," ... ");t=LCW.test(u.split(/[\s,.?!]/)[0])||/^I\b/.test(u)?"Uh, "+lc(u):"Uh... "+u}
  if(st==="warm"&&rf()<.25&&tier(p)!=="hostile"&&!t.includes(S.player.name.split(" ")[0]))t=t.replace(/\.$/,", hon.");
  if(st==="preachy"&&rf()<.15&&t.length>25&&!/\?$/.test(t))t+=" "+pick(["The Lord tests us.","We reap what we sow.","This too shall pass.","Love thy neighbor. Even now."]);
  if(st==="joker"&&rf()<.15&&t.length>30)t+=" "+pick(["Ha. Kidding. Mostly.","At least the commute's shorter now."]);
  if(st==="dry"&&t.split(". ").length>3)t=t.split(". ").slice(0,3).join(". ")+(t.endsWith(".")?"":".");
  return t}
function famList(p){return Object.entries(p.fam).map(([id,r])=>[id==="you"?S.player:P(id),r]).filter(([q])=>q)}
function jobPhrase(q){const k=q.job;const SP={pastor:"the pastor at St. Brigid's",doctor:"the town doctor",deputy:"a sheriff's deputy",foreman:"the foreman up at the quarry",farmer:q.seed==="walt"?"the farmer out at Holloway Farm":"a farmer",retiree:"retired",kid:"just a kid",unemployed:"between jobs"};if(SP[k])return SP[k];const n=(JOBS[k]?.n||"local").toLowerCase();return(/^[aeiou]/.test(n)?"an ":"a ")+n}
function whereIs(q){if(q.id==="you")return"right here";if(!q.alive)return null;return q.act==="with you"?`with ${S.player.name}`:`${q.act} at ${PLACES[q.loc]?.n||"somewhere"}`}
function groupOf(p){return p.group?G(p.group):null}
function respond(p,msg){const pl=S.player;const low=msg.toLowerCase().trim();const t=tier(p);const pn=pl.name.split(" ")[0];const kid=p.age<13;
  const R={text:"",dt:0,da:0,action:null,memory:"",ask:null};
  const intents=INTENTS.filter(([k,re])=>re.test(low)).map(([k])=>k);
  const M=findMentions(msg,p);
  const has=k=>intents.includes(k);
  const g=groupOf(p);const myG=myGroup();const sameGroup=g&&myG&&g.id===myG.id;const isLeader=g&&g.leader===p.id;
  const recentGrief=p.mem.filter(m=>m.v<=-8&&S.t-m.t<DAY*4&&m.a!=="you").slice(-1)[0];
  const out=[];const say=s=>out.push(s);
  if(p.act==="asleep"){p.act="awake";say(t==="hostile"||t==="cold"?"*jolts awake* What do you want? It's the middle of the night.":pick(["*blinks awake* ...Oh. It's you. Everything okay?","*sits up fast* What? What happened? ...Oh. It's you."]))}
  // first meeting
  if(!p.met){p.met=true;mem(p,`Met ${pl.name} at ${PLACES[here()].n}.`,0);
    if(kid)say(pick([`I'm ${p.name}. Are you a good guy or a bad guy?`,`Hi. I'm ${p.name}. Do you have any candy?`]));
    else if(t==="hostile"||(!S.flags.alarm&&false))say(`Back up. Who are you?`);
    else say(pick([`I'm ${p.name}. ${p.name==="Walt"?"This is my land.":""}`,`Name's ${p.name}${p.sur?" "+p.sur:""}.`,`${p.name}. ${S.flags.alarm?"You're not bit, are you?":"Nice to meet you."}`]).trim());
    if(S.flags.alarm&&!kid&&!has("greet")&&!intents.length){R.ask="bit";}
    if(has("greet")||!intents.length)return finish(p,R,out)}
  // pending question
  const q=p.cv?.q;if(q&&(has("yes")||has("no"))&&intents.length<=2){p.cv.q=null;const y=has("yes");
    const A={bit:y?["What?! Get away from me!",-20,-10]:["Good. Keep it that way.",3,0],okay:y?["Good. Stay that way.",2,1]:["Yeah. Me neither. We'll get through it.",2,4],town:y?["Find anything worth the risk?",1,0]:["Smart. It's a graveyard in there.",1,0],
      eat:y?["Good. Don't skip meals, it makes you stupid.",1,1]:["Here. *pushes something into your hands* Don't argue.",3,5],group:y?["Then you should talk to "+(g?(g.leader==="you"?"yourself, apparently":fullName(P(g.leader)||p)):"someone who's in charge")+".",1,0]:["Lone wolf, huh. Doesn't last long out here.",0,0],
      help:y?["Thank you. Really.",4,4]:["Right. Of course. Forget I asked.",-3,-3]}[q]||["Okay.",0,0];
    say(A[0]);R.dt+=A[1];R.da+=A[2];if(q==="eat"&&!y&&p.pack){const f=Object.keys(p.pack).find(k=>ITEMS[k].eat);if(f&&feel(p)>10){p.pack[f]--;if(!p.pack[f])delete p.pack[f];invAdd(f);R.action="note:"+`${p.name} gives you ${ITEMS[f].n.toLowerCase()}.`}}
    return finish(p,R,out)}
  // the player confesses a bite
  if(has("bitten")){R.memory=`${pn} told me they were bitten.`;R.mv=-2;
    if(kid){say("*eyes go wide* Are you gonna turn into a monster? ...Does it hurt?");return finish(p,R,out)}
    if(!pl.bitten){R.dt-=4;R.memory=`${pn} joked about being bitten.`;say(pick(["That's not funny. Don't joke about that.","*steps back* ...Show me. ...There's nothing there. Don't ever do that to me again."]));return finish(p,R,out)}
    const f=feel(p);pl.flags.toldBite=(pl.flags.toldBite||0)+1;
    if(f>45||p.partner==="you"||p.fam.you){R.da+=8;R.dt+=6;R.memory=`${pn} told me they were bitten. I'm staying with them.`;R.mv=8;say(pick(["*goes very still* No. No, no, no. ...How long ago? ...Okay. Then we have time. I'm not leaving you.","*grabs your hand and doesn't let go* Thank you for telling me. Whatever happens, you won't be alone for it."]))}
    else if(f>5){R.dt+=4;say(pick(["*quiet* I'm sorry. Really. You should tell the others. They'll want to say goodbye.","Damn. Thank you for being honest. Most people hide it."]))}
    else{R.dt-=2;say(pick(["Then get away from me. I mean it.","Why are you telling me? Go. Before it happens."]))}
    return finish(p,R,out)}
  // kids get simpler answers
  if(kid){
    if(has("insult")){R.da-=8;R.dt-=5;say("*starts crying* I'm telling!")}
    else if(has("how"))say(p.mood<35?"I miss my house. And my bed. Everyone's sad all the time.":"I'm okay. I found a frog today.");
    else if(has("family")){const f=famList(p);say(f.length?f.map(([q,r])=>`My ${r} is ${q.alive?(q.id==="you"?"you, silly":q.name):"gone"}.`).join(" "):"I don't know where my family is.")}
    else if(has("dead"))say("Mom says don't look at them. They used to be people.");
    else if(has("joke"))say("Knock knock. ...You're supposed to say who's there!");
    else if(has("romance")||has("flirt"))say(p.fam.you?"*hugs you* Love you too.":"*makes a face* Gross.");
    else if(has("join_me")||has("follow_me")){if(p.follow)say("I'm right here!");else if((p.fam.you||feel(p)>30)&&(!p.group||p.group===S.player.group)){R.action="follow";say("Okay! Can I hold your hand?")}else say("I'm not allowed to go anywhere without a grown-up I know.")}
    else if(has("thanks")||has("compliment")){R.da+=4;say("*grins*")}
    else if(has("who"))say(`I'm ${p.name}. I'm ${["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"][p.age]||p.age}${p.age<9?" and a half":""}.`);
    else if(has("self_lost")){R.da+=4;say("*hugs your arm* I'm sorry. I lost people too.")}
    else if(has("apology")){R.da+=3;say("*sniffs* Okay.")}
    else if(has("who_lead")){const L=g&&g.leader!=="you"?P(g.leader):null;say(L?`${L.name} is the boss.`:g?"You are, silly.":"Nobody. It's just us.")}
    else if(has("food"))say(p.hunger>50?"I had crackers. And some peaches.":"I'm really hungry. My tummy keeps making noises.");
    else if(has("fear"))say("The monsters. And the dark. And when grown-ups whisper.");
    else if(has("hope"))say(pick(["I want everything to go back to normal. And a dog.","I want to go back to school. Even math."]));
    else if(M.me||has("opinion")&&/\bme\b/.test(low))say(feel(p)>20?"You're nice. You talk to me like a real person.":"I don't really know you.");
    else if(has("outbreak"))say(S.flags.alarm?"Everybody got sick. It's not a regular sick.":"Is it a flu like the one I had? I had to stay home for a whole week.");
    else if(has("where")||M.people.length)say("I dunno. Ask a grown-up.");
    else if(has("secret"))say("*whispers* I'm scared of the basement. Don't tell.");
    else if(has("help"))say(pick(["Can you find me some crayons? Or a book with animals?","Can you find my stuffed rabbit? His name is Biscuit."]));
    else if(has("trade"))say("I have a rock. It's my best one. You can't have it.");
    else if(has("bye")){say("Bye!");R.action="end"}
    else if(has("greet"))say(pick(["Hi!","Hi. Are you nice?","*waves*"]));
    else if(has("yes")||has("no"))say("Okay.");
    else say(pick(["Do you wanna see my rock collection?","Are the monsters gonna come here?","I'm hungry.","When can we go home?","Did you know frogs can freeze and come back alive? Not like the monsters. Good alive."]));
    return finish(p,R,out)}
  if(has("kidding")&&!has("bitten")){const lastJoke=p.mem.filter(m=>m.a==="you").slice(-1)[0];say(lastJoke&&/joked about being bitten/.test(lastJoke.x)?pick(["Not funny. Not even a little.","*shoves your shoulder* Don't. Ever."]):pick(["Ha. Okay.","You're a strange one.","*half a smile*"]));return finish(p,R,out)}
  // hostility first
  if(has("insult")){R.dt-=5;R.da-=8;p.mood-=3;
    if(p.tr.temper>.7&&feel(p)<-25){R.action="attack";say("*shoves you hard* Say it again.")}
    else say(p.tr.temper>.6?pick(["You want to do this? Right now?","Watch your mouth.","Keep talking and see what happens."]):pick(["Wow. Okay.","I'll remember that.","*looks away* Right."]));R.memory=`${pn} insulted me.`;R.mv=-5;return finish(p,R,out)}
  if(has("threat")||has("demand")&&!(isLeader&&myG&&myG.leader==="you")){R.dt-=12;R.da-=6;if(p.tr.brave>.6){say(pick(["Try it.","You don't scare me. Go ahead.","I've put down worse than you this week."]))}else{say(pick(["Okay, okay. Easy.","Please. I don't want trouble.","*backs away* Whatever you say."]));R.dt-=5}R.memory=`${pn} threatened me.`;R.mv=-8;return finish(p,R,out)}
  // leader-to-leader diplomacy
  if(isLeader&&myG&&myG.leader==="you"&&g.id!==myG.id){const gr=g.rel[myG.id]||0;
    if(has("alliance")){if(gr+feel(p)>45&&p.tr.kind>.35){g.allied[myG.id]=myG.allied[g.id]=true;g.rel[myG.id]=myG.rel[g.id]=Math.max(gr,55);say(`Alright. ${g.name} and ${myG.name} look out for each other from here on. Don't make me regret it.`);news(`${g.name} and ${myG.name} have made a pact.`,"good");R.dt+=6;R.memory=`Made a pact between our people with ${pn}.`;R.mv=6}
      else say(pick([`An alliance? I barely know you. Bring us something real first, then we'll talk.`,`${g.name} doesn't need allies. We need food.`,`Maybe. Prove it. Trade with us. Help us. Then ask again.`]));return finish(p,R,out)}
    if(has("demand")){const theirDef=defense(g.id),mine=defense(myG.id);if(mine>theirDef*1.3&&p.tr.brave<.7){const amt=Math.round(Math.min(g.stock.food*.3,30));g.stock.food-=amt;myG.stock.food+=amt;g.rel[myG.id]=myG.rel[g.id]=gr-35;say(`*jaw tight* Take ${amt} food and get off my land.`);R.dt-=20;R.da-=20;R.memory=`${pn} shook us down.`;R.mv=-10;news(`${myG.name} forced ${g.name} to hand over food.`,"bad")}
      else{g.rel[myG.id]=myG.rel[g.id]=gr-25;say(`You walk in here and make demands? Get out before I change my mind about letting you leave.`);R.dt-=15;R.memory=`${pn} tried to shake us down.`;R.mv=-8}return finish(p,R,out)}}
  // group membership
  if(has("ask_join")){if(!g){say("Join me? I'm not a group. I'm barely a person right now.");return finish(p,R,out)}
    if(sameGroup){say("You're already one of us.");return finish(p,R,out)}
    if(!isLeader){const L=g.leader==="you"?null:P(g.leader);say(`Not my call. Talk to ${L?fullName(L):"whoever's in charge"}${g.home?` at ${PLACES[g.home].n}`:""}.`);return finish(p,R,out)}
    const n=groupSize(g.id);const skills=Object.values(pl.sk).reduce((a,b)=>a+b,0);const bring=pl.group?members(pl.group).length:S.people.filter(q=>q.alive&&q.follow&&!q.group).length;
    const score=feel(p)+skills*1.5+(g.stock.food>n*3?10:-10)-n*.6-bring*3+(p.tr.kind-.5)*30+(S.flags.alarm?0:-20);
    if(score>8){say(bring?`All of you? ...Fine. ${bring>3?"Everybody works. Nobody eats for free.":"Welcome."} We're at ${PLACES[g.home]?.n||"camp"}.`:pick([`Okay. You can stay. You work, you eat. You steal, you're gone.`,`We could use another pair of hands. Welcome to ${g.name}.`,`Alright. Don't make me regret this.`]));R.action="join_their";R.dt+=8;R.memory=`Took ${pn} into ${g.name}.`;R.mv=4}
    else say(pick([`We're stretched thin as it is. I can't take on another mouth.`,`I don't know you well enough. Maybe if you prove yourself.`,`No. Not right now. Come back when you've got something to offer.`]));return finish(p,R,out)}
  if(has("follow_me")&&!has("join_me")&&(sameGroup||!g||isLeader)){
    if(p.follow){say(pick(["I'm right here.","Where else would I be?","Right behind you."]));return finish(p,R,out)}
    if(isLeader&&!sameGroup){say(pick([`I've got people counting on me. I'm not leaving them to follow you around.`,`I lead ${g.name}. If anyone's following anyone, it's you following us.`]));R.ask="group";return finish(p,R,out)}
    if(isLeader&&sameGroup&&feel(p)<60){say(pick(["I've got a camp to run. Take someone else.","Can't. People need me here."]));return finish(p,R,out)}
    if(!S.flags.alarm&&!p.fam.you&&!sameGroup){say(pick(["Come with you where? It's a Tuesday.","I've got things to do today. Maybe later."]));return finish(p,R,out)}
    if(feel(p)>=10||p.fam.you||(!g&&feel(p)>=-5&&p.tr.social+p.tr.kind>1.1)||(!g&&p.hunger<35)){say(pick(["Lead the way.","Alright. Right behind you.","Sure. Let's go.",!g&&S.flags.alarm?"Better than sitting here waiting for them. Let's go.":"Okay."]));R.action="follow";R.memory=`Went along with ${pn}.`;R.mv=1}
    else say(pick(["I don't know you well enough to follow you anywhere.","I'm staying put.","Maybe. Ask me again when I know you better."]));
    return finish(p,R,out)}
  if(has("join_me")||has("follow_me")){
    if(sameGroup||(!g&&myG&&!myG.home&&p.group===myG?.id)){ // invite to follow
      if(p.follow){say("I'm right here.");return finish(p,R,out)}
      if(feel(p)>=10||p.fam.you){say(pick(["Lead the way.","Alright. Right behind you.","Sure. Let's go."]));R.action="follow"}else say("I've got work to do. Ask someone else.");return finish(p,R,out)}
    if(isLeader){say(pick([`I've got people counting on me. I'm not leaving them to follow you around.`,`Cute. I lead ${g.name}. If anyone's joining anyone, it's you joining us.`]));R.ask="group";return finish(p,R,out)}
    const loyalty=g?(()=>{const L=P(g.leader);return 20+(L?relGet(p,L)/2:0)+members(g.id).filter(q=>relGet(p,q)>40).length*6+(g.stock.food>groupSize(g.id)*2?10:-10)})():0;
    const famIn=myG?members(myG.id).filter(q=>p.fam[q.id]).length:0;
    const score=feel(p)+(p.fam.you?60:0)+famIn*30+(g?-loyalty:20)+(myG?.home?10:0)+(1-p.tr.ambit)*10+pl.sk.speak*3+(p.hunger<40?8:0)+(S.flags.alarm?0:-30);
    if(score>25){R.action="join_mine";say(pick([`...Yeah. Okay. I'm with you.`,`Better than being alone out here. I'm in.`,`You've been straight with me. I'll come.`,`If you've got a plan, I'll follow it.`]));R.dt+=6;R.memory=`Chose to go with ${pn}.`;R.mv=6}
    else if(!S.flags.alarm)say("Come with you where? It's a Tuesday.");
    else say(pick([`I don't know you well enough to bet my life on you.`,`I've got my people. ${g?`${g.name} is where I belong.`:"I'm staying put."}`,`Maybe. Ask me again when I know you better.`]));return finish(p,R,out)}
  if(has("stay")){if(p.follow){R.action="stay";say(pick(["Alright. I'll head back.","Fine. Be careful.","Okay. Don't get yourself killed."]))}else say("I wasn't going anywhere.");return finish(p,R,out)}
  if(has("leave_group")&&sameGroup){if(isLeader){say(`You're leaving? ${feel(p)>20?"I'm sorry to see you go. Door's open if you come back.":"Fine. Don't come crawling back."}`);R.action="leave_mine";R.da-=4;R.memory=`${pn} left ${g.name}.`;return finish(p,R,out)}say(`You should tell ${fullName(P(g.leader)||p)}. But... I'll miss you around here.`);return finish(p,R,out)}
  if(has("lead")&&sameGroup&&isLeader){const mine=playerInfluence(g.id),theirs=influence(p);
    if(mine>theirs-5&&p.tr.ambit<.65){say(`*long breath* Maybe you're right. People listen to you. ...Fine. It's yours. God help you.`);R.action="take_lead";R.memory=`Handed leadership of ${g.name} to ${pn}.`}
    else{say(pick([`You? You've been here five minutes.`,`Over my dead body. And around here that's not a figure of speech.`,`If people want you, they'll say so. Until then, I'm in charge.`]));R.dt-=6;R.da-=4;R.memory=`${pn} tried to take over.`;R.mv=-5}return finish(p,R,out)}
  if(has("who_lead")){if(!g)say("Nobody's in charge of me.");else if(isLeader)say(`I am. For better or worse.`);else{const L=g.leader==="you"?pl:P(g.leader);const f=L&&L.id!=="you"?relGet(p,L):p.trust;say(`${L?.id==="you"?"You are. Remember?":fullName(L)+"."} ${f>40?"Good leader. Fair.":f<-20?"For now.":"They're doing alright."}`)}return finish(p,R,out)}
  // romance & family
  const kin=p.fam.you&&!["partner","roommate"].includes(p.fam.you);
  if(kin&&(has("romance")||has("flirt")||has("child"))){if(has("romance")){R.da+=3;say(pick(["Love you too. Don't get weird about it.","*hugs you* I know. Me too.","I know. We're gonna be okay, right?"]))}else say(pick(["...Are you feeling alright?","Okay, weirdo.","*stares* No."]));return finish(p,R,out)}
  if(has("breakup")&&p.partner==="you"){R.action="break_up";R.da-=30;R.dt-=10;say(pick(["...Okay. If that's what you want.","*stares at you* After everything?","Fine. Fine. Go."]));R.memory=`${pn} ended things with me.`;R.mv=-12;return finish(p,R,out)}
  if(has("child")){if(p.partner!=="you")say("*laughs nervously* We're not... we're not there.");else if(p.aff>=65){R.action="child_yes";say("*takes your hand* Up here? Now? ...Yeah. I want that. Let's try.")}else say("Not yet. Not with everything like this. Ask me again.");return finish(p,R,out)}
  if(has("romance")){if(p.partner==="you")say(pick(["I know. Me too.","*smiles* You already have me."]));
    else if(p.aff>=55&&p.age>=18&&pl.age>=18&&!p.partner&&!pl.partner&&attraction(p,{id:"you"})>.2){R.action="romance_yes";R.da+=6;say(pick(["*quiet for a moment* I was hoping you'd say something. Yes.","I didn't think anyone would want anything good out here. ...Yeah. Me too.","*kisses you* Does that answer it?"]));R.memory=`${pn} and I are together now.`;R.mv=10}
    else{say(p.partner?`I'm with ${P(p.partner)?.name||"someone"}. You know that.`:pl.partner?"Aren't you with someone?":p.aff>=30?"I... like you. I do. I just need more time.":"I don't think of you that way. Sorry.");R.da+=p.aff>=30?1:-2}return finish(p,R,out)}
  if(has("flirt")){if(p.aff>=25&&attraction(p,{id:"you"})>.3&&p.age>=18){R.da+=4;say(pick(["*laughs* Stop it.","You're not so bad yourself.","*blushes* At the end of the world? Really?"]))}else{R.da-=1;say(pick(["...Thanks? I guess.","Weird time for that.","Okay."]))}return finish(p,R,out)}
  // requests and items
  if(has("deliver")||has("help")&&p.want){const w=p.want;
    if(w&&w.type==="fetch"&&invHas(w.item,w.qty)){invTake(w.item,w.qty);p.pack[w.item]=(p.pack[w.item]||0)+w.qty;R.dt+=w.reward.trust;R.da+=w.reward.aff;p.want=null;say(pick(["You actually did it. Thank you. I mean it.","*stares at it* I didn't think you'd come back. Thank you.","I owe you one. A real one."]));R.memory=`${pn} brought me ${ITEMS[w.item].n.toLowerCase()} when I needed it.`;R.mv=8;
      if(w.item==="antibiotics"&&g?.fever){g.feverCured=true;news(`${pl.name} brought antibiotics to ${g.name}. The fever's breaking.`,"good")}return finish(p,R,out)}
    if(w&&w.type==="mercy"&&pl.flags.mercy?.[w.about]){p.want=null;R.dt+=w.reward.trust;R.da+=w.reward.aff;say(`*very quiet* Thank you. I... thank you. I can stop looking for them now.`);R.memory=`${pn} put my ${p.fam[w.about]} to rest.`;R.mv=10;return finish(p,R,out)}
    if(w){if(!w.told){w.told=true;say(w.text);R.ask="help"}else say(w.type==="fetch"?`I asked for ${itemPhrase(w.item,w.qty)}. ${invHas(w.item)?"You've only got some of it.":"You don't have it yet."}`:w.text);return finish(p,R,out)}
    if(has("help")){say(pick(["I'm alright for now. Thanks for asking. People don't, anymore.","Just... watch my back out there.","Find food. Everyone needs food."]));R.da+=1;return finish(p,R,out)}
    say("For me? You can give me things with the Trade button. I'm not going to say no.");R.action="trade";return finish(p,R,out)}
  if(has("help")&&!p.want){say(pick(["Just keep breathing. That's the job now.","I'm okay. Thanks for asking. Not many people do."]));R.da+=2;return finish(p,R,out)}
  if(has("trade")){R.action="trade";say(t==="hostile"?"I'll trade. Doesn't mean I like you.":"Let's see what you've got.");return finish(p,R,out)}
  if(has("give_req")){const key=Object.keys(p.pack).find(k=>low.includes(ITEMS[k].n.toLowerCase().split(" ").slice(-1)[0])||low.includes(k.replace("_"," ")));
    if(key&&(feel(p)>25||p.fam.you)){p.pack[key]--;if(!p.pack[key])delete p.pack[key];invAdd(key);R.action="note:"+`${p.name} gives you ${ITEMS[key].n.toLowerCase()}.`;R.dt-=1;say(pick(["Here. Don't make a habit of it.","Take it. You'd do the same for me. Right?"]))}
    else if(key)say(`I need that ${ITEMS[key].n.toLowerCase()} myself. Want to trade for it?`);else say(Object.keys(p.pack).length?`I don't have that. I've got ${Object.keys(p.pack).slice(0,3).map(k=>itemPhrase(k)).join(", ").replace(/, ([^,]*)$/," and $1")}.`:"I've got nothing. Look at me.");return finish(p,R,out)}
  // about a person
  if(!M.people.length&&new RegExp("\\b"+p.name.toLowerCase()+"\\b").test(low)&&(has("where")||has("opinion")||/\bwho\b/.test(low))){say(pick(["*raises an eyebrow* I'm standing right here.","You're looking at "+(p.sex==="F"?"her":"him")+"."]));return finish(p,R,out)}
  if(M.people.length&&(has("where")||has("opinion")||has("find")||intents.length===0||has("dead")||has("question")||has("family")||has("news"))||M.people.length&&/saw|found|met|alive|is at|is with|turned|dead/.test(low)){const q=M.people[0];
    // delivering news for a "find" request
    if(p.want?.type==="find"&&p.want.about===q.id&&/alive|saw|found|met|is at|is with|okay|ok/.test(low)){if(q.met&&q.mem.some(m=>m.a==="you")){p.want=null;R.dt+=20;R.da+=20;say(`*grabs your arm* ${q.name}'s alive? Where? ...I have to go. Thank you. Thank you.`);R.memory=`${pn} told me ${q.name} is alive.`;R.mv=10;R.action="reunite:"+q.id}else{say(`Don't you lie to me about ${q.name}. Have you actually seen them?`);R.dt-=3}return finish(p,R,out)}
    if(!q.alive){const how=q.status==="turned"?"turned":q.status==="left"?"left town":"died";const fr=p.fam[q.id];say(fr?`My ${fr}... ${how}. *looks away* I don't want to talk about it.`:`${q.name}? ${how==="left town"?"Gone. Packed up and left.":cap(how)+"."} ${relGet(p,q)>30?"I miss them.":""}`);return finish(p,R,out)}
    const r=relGet(p,q);const fam=p.fam[q.id];const w=whereIs(q);const knowsWhere=q.group&&q.group===p.group||fam||r>30;
    let s="";
    const obj=q.sex==="F"?"her":"him",subj=q.sex==="F"?"She":"He";const qg=q.group&&G(q.group);const pubWhere=qg?`with ${qg.name}${qg.home?" at "+PLACES[qg.home].n:""}`:null;
    if(has("where")||/where/.test(low))s=knowsWhere?`Last I knew, ${q.name} was ${w}.`:pubWhere?`I heard ${q.name}'s ${pubWhere}.`:S.flags.alarm?`No idea where ${q.name} is. Haven't seen ${obj} since this started.`:`${q.name}? Probably ${(()=>{const w=JOBS[q.job]?.work;return w&&w!=="home"?"at "+(BMAP[w]?BMAP[w].n:PLACES[w]?PLACES[w].n:"work"):"at home"})()}, like any other day.`;
    else s=fam?`${q.name}'s my ${fam}. ${r>60?"Everything I do, I do for them.":r<0?"We don't get along. Never did.":"We're family. That's all there is to it."}`:r>50?`${q.name}? ${pick(["One of the good ones.","I'd trust them with my life. I have, actually.","My best friend in all this."])}`:r>15?`${q.name}'s alright.`:r<-40?`${q.name}? ${pick(["Don't get me started.","Keep them away from me.","I don't trust them as far as I can throw them."])}`:r<-10?`We're not friends.`:`${q.name}? ${subj}${q.age<13?"'s just a kid":"'s "+jobPhrase(q)}${pubWhere?`, ${pubWhere} now`:""}. I don't know ${obj} well.`;
    if(q.partner&&q.partner!==p.id&&rf()<.5&&r>-10)s+=` ${subj}'s with ${q.partner==="you"?"you":P(q.partner)?.name||"someone"}, I think.`;
    if(q.bitten&&p.mem.some(m=>m.a===q.id&&/bit/.test(m.x)))s+=` ...And between you and me, I think ${subj.toLowerCase()}'s hiding a bite.`;
    say(s);return finish(p,R,out)}
  if(M.me&&has("opinion")){const f=feel(p);say(f>50?"Honestly? You're one of the people keeping me going.":f>20?"I like you. You've been decent to me.":f>-10?"I don't know you well enough yet.":f>-40?"I'm still deciding about you.":"I don't trust you. You know why.");return finish(p,R,out)}
  if(M.group||has("opinion")&&M.place){const og=M.group||Object.values(S.groups).find(x=>x.home===M.place);if(og){const r=g?(g.id===og.id?100:g.rel[og.id]||0):0;
    say(g&&g.id===og.id?`${og.name} is home. ${og.stock.food<groupSize(og.id)*2?"We're hungry, though.":"We're getting by."}`:`${og.name}? ${r>40?"Good people. We trade with them.":r<-30?"Bastards. Stay away from them.":og.home==="quarry"?"Cole's people. Tough. Mean, some of them.":og.home==="church"?"Pastor Grace's flock. Kind, mostly. Soft, maybe.":og.home==="school"?"Ray's outfit. Lots of rules.":"Don't know much about them."} ${og.leader&&og.leader!=="you"?`${fullName(P(og.leader)||p)} runs it.`:og.leader==="you"?"You run it.":""}`);return finish(p,R,out)}}
  if(M.place&&!M.people.length){const k=M.place;const n=zedsIn(k);say(`${PLACES[k].n}? ${k==="town"?`${n>60?"Crawling with them. Pharmacy's on Main, hardware store next to it, if you're crazy enough.":"Quieter than it was. Still dangerous."}`:k==="woods"?"Deer, berries, deadfall. And it gets dark fast under the trees.":k==="river"?"Water's fine if you boil it. Don't drink it straight, you'll be sick for days.":PLACES[k].site&&S.flags.alarm?`${(()=>{const o=Object.values(S.groups).find(x=>x.home===k);return o?`That's ${o.name}'s place now.`:"Nobody's claimed it, last I heard."})()}`:PLACES[k].d}`);return finish(p,R,out)}
  // personal topics
  if(has("who")||has("before")||has("from")){const parts=[];if(has("who")||!p.told.who){parts.push(`I'm ${p.name}${p.sur?" "+p.sur:""}.`);p.told.who=true}
    if(has("before")||has("who"))parts.push(SAYBIO[p.seed]||`Before all this I was ${jobPhrase(p)}.`);
    if(has("from")||has("who")&&rf()<.5)parts.push(`I'm from ${p.facts.from}.`);if(t!=="hostile"&&t!=="cold"&&rf()<.4){parts.push(`I've always liked ${p.facts.likes}.`)}
    say(parts.join(" "));R.da+=1;R.ask=rf()<.4?"town":null;return finish(p,R,out)}
  if(has("self_lost")){const m=low.match(/my (\w+)/);R.da+=6;R.dt+=3;say(pick([`I'm so sorry. Everybody lost somebody, but that doesn't make yours smaller.`,`*puts a hand on your shoulder* I'm sorry. Really.`,`Damn. I'm sorry. What was their name?`]));R.memory=`${pn} told me they lost their ${m?m[1]:"family"}.`;R.mv=3;return finish(p,R,out)}
  if(has("family")){const f=famList(p).filter(([q])=>q.id!=="you");const kinYou=p.fam.you&&p.fam.you!=="roommate";if(!f.length){say(kinYou?pick(["It's you and me. That's the whole list now.","You're my family. You're who I've got."]):pick(["I don't have anyone. Not here, anyway.","My family's in the city. Or they were.","It's just me."]))}else say(f.slice(0,4).map(([q,r])=>q.alive?`My ${r} ${q.name}${q.group&&q.group===p.group?" is here with me":q.group?` is with ${G(q.group).name}`:" is out there somewhere"}.`:`My ${r} ${q.name} is ${q.status==="turned"?"gone. Turned":q.status==="left"?"gone. Left":"dead"}.`).join(" ")+(kinYou?" And you, obviously.":""));R.da+=1;return finish(p,R,out)}
  if(has("secret")){if(p.trust>=50&&!p.told.secret){p.told.secret=true;say(`*glances around* ...${p.facts.secret}. I've never told anyone that.`);R.dt+=4;R.memory=`I told ${pn} my secret.`;R.mv=6}else if(p.told.secret)say("I already told you more than I should have.");else say(pick(["Nice try.","Everybody's got secrets. Mine stay mine.","Ask me again when I trust you."]));return finish(p,R,out)}
  if(has("fear")){say(t==="hostile"?"Like I'd tell you.":`${p.facts.fear==="the dark"?"The dark. Stupid, right? At my age.":cap(p.facts.fear)+"."} ${p.tr.brave>.7?"Doesn't stop me.":"Most nights I don't sleep."}`);R.da+=2;return finish(p,R,out)}
  if(has("hope")){say(`${cap(p.facts.hope)}. ${pick(["Is that stupid?","Something to keep walking toward.","I think about it every night."])}`);R.da+=2;return finish(p,R,out)}
  if(has("self_job")){const m=low.match(/(?:i was a|i used to be a?|i worked as a?)\s+([a-z ]+)/);R.da+=2;say(`A ${m?m[1].trim():"that"}? ${pick(["Huh. Doesn't matter much now, does it.","That could be useful.","Feels like a different life."])}`);R.memory=m?`${pn} used to be a ${m[1].trim()}.`:"";return finish(p,R,out)}
  if(has("remember")){const ms=p.mem.filter(m=>m.a==="you").slice(-3);say(ms.length?"I remember. "+ms.map(m=>toYou(m.x)).join(" "):"We haven't really been through anything together. Not yet.");return finish(p,R,out)}
  if(has("how")){const parts=[];
    if(p.bitten&&p.trust>=45&&rf()<.7){say(`*pulls up a sleeve. The bite is black at the edges* ...Don't tell anyone. Please. I just need a little more time.`);R.memory=`I showed ${pn} my bite.`;R.mv=6;R.dt+=5;p.revealed=true;return finish(p,R,out)}
    if(recentGrief)parts.push(`Not good. ${recentGrief.x}`);else if(p.health<45)parts.push("Hurts to breathe. I'll live. Probably.");else if(p.hunger<30)parts.push("Hungry. Everyone's hungry.");else if(p.mood<30)parts.push(pick(["Honestly? Barely holding it together.","I keep waking up and remembering.","Tired. All the way down."]));else if(p.mood>70)parts.push(pick(["Better than I have any right to be.","Good, actually. We're still here.","Not bad. Got a few hours of sleep."]));else parts.push(pick(["Getting by.","Same as everyone. Scared, mostly.","Alive. That counts for something now."]));
    say(parts.join(" "));R.ask=rf()<.5?pick(["okay","eat"]):null;if(R.ask==="okay")out.push("You doing alright?");if(R.ask==="eat")out.push("You eaten today?");R.da+=1;return finish(p,R,out)}
  if(has("comfort")){if(recentGrief){R.da+=7;R.dt+=3;say(pick(["*nods, doesn't trust their voice* ...Thanks.","That helps. More than you know.","*leans into you for a second* Thank you."]));R.memory=`${pn} was kind to me when I was grieving.`;R.mv=6}else{R.da+=2;say("I'm okay. But thanks.")}return finish(p,R,out)}
  if(has("apology")){const bad=p.mem.filter(m=>m.a==="you"&&m.v<0).slice(-1)[0];if(bad){if(rf()<p.tr.kind+.2){R.dt+=4;R.da+=4;say("...Alright. Water under the bridge.");R.memory=`${pn} apologized. I forgave them.`;R.mv=3}else say(`Sorry doesn't fix it. ${toYou(bad.x)}`)}else say("For what?");return finish(p,R,out)}
  if(has("favorite")){const topic=/food|eat|meal|dish|snack/.test(low)?"food":/song|music|band|singer/.test(low)?"music":/movie|film|show|tv/.test(low)?"movie":/book|read/.test(low)?"book":/colou?r/.test(low)?"color":"thing";
    const FAV={food:["my mom's green chili","pancakes with too much syrup","gas station burritos, honestly","peach cobbler","a real cheeseburger","the pho at that place out on Route 9","fried catfish","cold pizza for breakfast"],music:["old country. Patsy Cline","anything loud enough to drive with the windows down","hymns, if you can believe it","blues. The sad kind","eighties stuff. Don't judge me"],movie:["anything with a heist in it","old westerns","cartoons, with the kids","romantic comedies. Don't tell anyone","nature documentaries"],book:["mysteries. I always guess wrong","the Bible, cover to cover, twice","car manuals. I'm serious","history. Wars, mostly","I never sat still long enough to read"],color:["green","blue. Like everybody","red","yellow, like old school buses","gray. Boring, I know"]};
    const L=FAV[topic];const v=L?L[hashStr(p.id+topic)%L.length]:p.facts.likes;
    say(topic==="food"?`${cap(v)}. ${pick(["What I wouldn't give for some right now.","God, I miss it.","Don't make me think about it."])}`:topic==="thing"?`${cap(p.facts.likes)}. Used to be, anyway.`:`${cap(v)}.`);R.da+=2;return finish(p,R,out)}
  if(has("outbreak")){const F=S.flags;const d=dayOf(S.t);
    say(!F.clinic?(p.tr.curious>.55?pick(["The flu thing? My cousin in the city says the hospitals are turning people away. That's not nothing.","Radio keeps saying 'unusual flu'. Unusual how? Nobody says."]):pick(["It's a flu. They'll have a shot for it by Christmas.","Every year it's something. We're fine out here."]))
      :!F.alarm?pick(["Did you hear about the clinic? Somebody said a patient bit a nurse. Bit her.","There were sirens at the clinic this morning. Nobody's saying why.","Something happened at the clinic. People are saying things I don't want to repeat."])
      :d<=2?(p.tr.brave>.6?pick(["Stay indoors, they said. Like a door's going to stop that.","It's not a flu. I saw a man get up after he was dead. I watched it."]):pick(["I keep thinking I'll wake up.","They said stay inside. So I'm staying inside."]))
      :pick(["It's not a flu. Whatever it is, it's everywhere. Nobody's coming.","Radio's been static for days. I think we're it, out here.","I stopped asking what it is. Doesn't matter. It's here."]));R.da+=1;return finish(p,R,out)}
  if(has("sleep_q")&&!has("how")){say(p.mood<35?pick(["Not really. Every noise is one of them.","I don't sleep. I lie there and listen."]):!S.flags.alarm?pick(["Fine. Why, do I look tired?","Like a rock. You?"]):pick(["A few hours. Better than nothing.","On and off. You?","Like the dead. ...Bad choice of words."]));R.da+=1;return finish(p,R,out)}
  if(has("dead")&&!S.flags.clinic){say(pick(["The dead? What are you talking about?","...Are you feeling okay?"]));return finish(p,R,out)}
  if(has("dead")){const lost=famList(p).find(([q])=>q.status==="turned");say(lost?`They took my ${lost[1]}. I still see ${lost[0].name}'s face on every one of them.`:p.tr.brave>.65?pick(["Aim for the head. Keep moving. Don't let them box you in.","They're slow. We're stupid. That's how people die.","I've put down eleven. I stopped counting after that."]):pick(["I can't look at them. They used to be our neighbors.","The noise. That noise they make. I hear it in my sleep.","Do you think they know? What they are?"]));return finish(p,R,out)}
  if(has("food")&&/\b(you|ya)\b/.test(low)&&/\b(eat|eaten|ate|hungry|starving|thirsty)\b/.test(low)){say(p.hunger>60?pick(["Yeah. I'm okay.","Had something this morning. I'm fine."]):p.hunger>30?pick(["A little. Not enough.","Some. I'm saving the rest."]):pick(["Not since yesterday.","*laughs without any humor* Eaten. That's a good one."]));if(p.hunger<30)R.ask="eat";return finish(p,R,out)}
  if(has("food")){const st=g?.stock;say(g?`We've got about ${Math.round(st.food)} food and ${Math.round(st.water)} water at ${g.name}, for ${groupSize(g.id)} people. ${st.food<groupSize(g.id)*2?"It's not enough.":"We're okay for now."}`:pick(["I've got a couple cans left. After that, who knows.","Everyone's raiding the grocery. Won't last."]));return finish(p,R,out)}
  if(has("plan")&&!S.flags.alarm){say(pick(["Plan? Get through the week. Same as always.","Work, dinner, bed. Why, what's yours?","Honestly? Coffee. Then we'll see."]));return finish(p,R,out)}
  if(has("plan")){say(isLeader?(g.pol.stance==="hostile"?"We take what we need. Nobody's handing it to us.":`Walls. Food. Water. In that order. ${dayOf(S.t)>12?"And get ready for winter.":""}`):g?`Ask ${g.leader==="you"?"yourself":fullName(P(g.leader)||p)}. I just do the work.`:pick(["Find people. Find walls. Find food.","Wait it out. The army'll come. Won't they?","Get out of town before it's too late."]));return finish(p,R,out)}
  if(has("news")){const ok=n=>!/household|joined|is old enough|went up at/.test(n.x);const recent=S.news.filter(n=>S.t-n.t<DAY*3&&ok(n));const known=recent.find(n=>(n.a||[]).some(id=>id!==p.id&&(p.rel[id]!==undefined||P(id)?.group===p.group)))||recent.find(n=>n.k==="big"||n.k==="bad")||recent[0];
    say(known?(/^Radio:/.test(known.x)?`The radio said ${known.x.replace(/^Radio:\s*/,"").replace(/^./,c=>c.toLowerCase())}`:/^Rumor:/.test(known.x)?`People are saying ${known.x.replace(/^Rumor:\s*/,"")}`:`Did you hear? ${known.x}`):"Nothing good. Nothing at all, really.");return finish(p,R,out)}
  if(has("joke")){say(p.tr.social>.4?pick(JOKES):"I don't do jokes.");R.da+=1;return finish(p,R,out)}
  if(has("thanks")){R.da+=1;say(pick(["Don't mention it.","Anytime.","You'd do the same."]));return finish(p,R,out)}
  if(has("compliment")){R.da+=3;R.dt+=1;say(pick(["*smiles a little* Thanks. Haven't heard that in a while.","Yeah? Thanks.","Don't get soft on me."]));return finish(p,R,out)}
  if(has("self_name")){say(`${pn}. I'll remember that.`);return finish(p,R,out)}
  if(has("bye")){say(pick(["Stay alive.","Watch yourself out there.","See you around. Hopefully.","Don't do anything stupid."]));R.action="end";return finish(p,R,out)}
  if(has("greet")||has("yes")||has("no")){const hh=hourOf(S.t);const tt=hh>=5&&hh<12?"Morning":hh>=18&&hh<23?"Evening":"Hey";
    const G1={hostile:["What.","Keep walking.","You've got a lot of nerve."],cold:[`${pn}.`,"Yeah?","Need something?"],neutral:[`${tt}.`,`Hey, ${pn}.`,"Hey."],friendly:[`Hey, ${pn}! Good to see you in one piece.`,"There you are.",`${tt}, ${pn}.`],close:[`${pn}! *hugs you* Don't scare me like that again.`,"Hey, you.","There's my favorite person."]}[t];
    say(pick(G1));if(p.want&&feel(p)>-10&&rf()<.8){out.push(`Listen... ${p.want.text}`);p.want.told=true;R.ask="help"}else if(t!=="hostile"&&rf()<.35){R.ask=pick(["okay","town"]);out.push(R.ask==="okay"?"You doing alright?":"You been into town?")}return finish(p,R,out)}
  // fallback
  if(p.want&&rf()<.5){say(`I don't know about that. But listen... ${p.want.text}`);p.want.told=true;R.ask="help";return finish(p,R,out)}
  say(pick([`I'm not sure what you mean.`,`Hm. ${p.tr.curious>.6?"Tell me more.":"If you say so."}`,`I don't know anything about that.`,`*shrugs*`,`${p.tr.social>.6?"Funny you'd ask me that.":"..."} Ask me something I can actually answer.`]));
  return finish(p,R,out)}
function toYou(x){const pn=S.player.name.split(" ")[0];return x.replace(new RegExp("\\b"+pn+"'s\\b","g"),"your").replace(new RegExp("\\b"+pn+"\\b","g"),"you").replace(/^you\b/,"You").replace(/\bthey were\b/g,"you were").replace(/\bthey are\b/g,"you are")}
function finish(p,R,out){R.text=out.map(s=>styleSay(p,s)).join(" ");if(R.ask&&!p.cv)p.cv={};if(R.ask)p.cv.q=R.ask;return R}

// ================= talking: apply =================
function applyTalk(p,r){const pl=S.player;p.chat.push({w:"them",x:r.text});if(p.chat.length>60)p.chat.splice(0,p.chat.length-60);
  p.trust=clamp(p.trust+r.dt*(1+pl.sk.speak*.03),-100,100);p.aff=clamp(p.aff+r.da,-100,100);if(r.memory)mem(p,r.memory,r.mv||0);skillUp("speak",.02);
  const note=x=>p.chat.push({w:"sys",x});const a=r.action||"";
  if(a.startsWith("note:"))note(a.slice(5));
  if(a==="follow"){p.follow=true;note(`${p.name} is following you.`)}
  if(a==="stay"){p.follow=false;note(`${p.name} stops following you.`)}
  if(a==="trade")setTimeout(()=>openTrade(p.id),30);
  if(a==="attack"){const me=pl.sk.fight*8+(weapon()?ITEMS[weapon().id].dmg*3:0)+rnd(0,50),them=p.sk.fight*10+rnd(0,50);if(me>=them){p.health-=rnd(8,20);note(`${p.name} swings at you. You put them on the ground.`)}else{pl.hp-=rnd(6,16);note(`${p.name} swings at you and lands it.`)}for(const q of living())if(dist(q.x,q.z,pl.x,pl.z)<10&&q!==p)q.trust-=2}
  if(a==="romance_yes"){p.partner="you";pl.partner=p.id;note(`You and ${p.name} are together now.`);news(`${pl.name} and ${fullName(p)} are together.`,"good",[p.id])}
  if(a==="child_yes"){if((pl.sex==="F"&&p.sex==="M")||(pl.sex==="M"&&p.sex==="F")){pl.trying=true;note(`You and ${p.name} are trying for a child.`)}else note(`You talk about raising a child together. If a child ever loses their parents, you could take them in.`)}
  if(a==="break_up"){pl.partner=null;p.partner=null;pl.trying=false;note(`You and ${p.name} are no longer together.`);news(`${pl.name} and ${p.name} split up.`,"",[p.id])}
  if(a==="join_their"){const g=G(p.group);const old=pl.group;if(old&&G(old)?.leader==="you"){for(const q of members(old))joinGroup(q,g.id,true);G(old).dead=true;news(`${G(old).name} has merged into ${g.name}.`,"big")}
    pl.group=g.id;for(const q of S.people.filter(q=>q.alive&&q.follow&&!q.group))joinGroup(q,g.id,true);for(const q of members(g.id))if(q.met)q.trust+=3;note(`You're part of ${g.name} now.`);journal(`You joined ${g.name}${g.home?" at "+PLACES[g.home].n:""}.`,"big");news(`${pl.name} joined ${g.name}.`,"")}
  if(a==="join_mine"){let g=myGroup();if(!g){g=newGroup(`${pl.name.split(" ")[0]}'s people`,"you",null);pl.group=g.id;for(const q of S.people.filter(q=>q.alive&&q.follow&&!q.group&&q.id!==p.id))joinGroup(q,g.id,true);UI.afterTalkModal={type:"name_group"};news(`${pl.name} has started a group of their own.`,"big")}
    const fam=S.people.filter(q=>q.alive&&q.hh===p.hh&&q!==p&&q.hh&&q.hh!=="you"&&(q.group===p.group));joinGroup(p,g.id,true);if(!g.home)p.follow=true;for(const q of fam){joinGroup(q,g.id,true);if(!g.home)q.follow=true}
    note(`${p.name}${fam.length?` and ${fam.length} family member${fam.length>1?"s":""}`:""} joined ${g.name}.`);journal(`${p.name} joined your group${fam.length?", with family":""}.`,"good");if(g.home)for(const q of [p,...fam])placeTo(q,randIn(g.home,3))}
  if(a==="leave_mine"){const old=myGroup();pl.group=null;for(const q of S.people.filter(q=>q.alive&&q.fam.you&&q.group===old.id)){q.group=null;q.follow=true}note(`You left ${old.name}.`);journal(`You walked away from ${old.name}.`,"big")}
  if(a==="take_lead"){const g=G(p.group);g.leader="you";news(`${p.name} handed leadership of ${g.name} to ${pl.name}.`,"big");note(`You lead ${g.name} now.`)}
  if(a.startsWith("reunite:")){const q=P(a.slice(8));if(q&&q.alive){const tg=q.group||p.group;if(tg&&q.group!==p.group){const mover=q.group?p:q;joinGroup(mover,tg,true);if(G(tg).home)placeTo(mover,randIn(G(tg).home,3));news(`${fullName(p)} and ${q.name} found each other again, thanks to ${pl.name}.`,"good",[p.id,q.id])}relAdd(p,q,15)}}
  if(a==="end")note(`${p.name} turns back to what ${p.age<13?"they were":p.sex==="F"?"she was":"he was"} doing.`);
  if(UI.afterTalkModal&&!UI.modal){UI.modal=UI.afterTalkModal;UI.afterTalkModal=null}}

// ================= overheard conversations =================
function overhear(a,b){const r=relGet(a,b);const L=[];const s=(p,t)=>L.push(`${p.name}: ${styleSay(p,t)}`);
  const shared=a.mem.filter(m=>m.v<=-8&&m.a!=="you"&&b.mem.some(n=>n.a===m.a)).slice(-1)[0];
  if(a.age<13&&b.age<13){s(a,"Do you think the monsters can swim?");s(b,"No. They'd sink. They're too heavy with dead.");s(a,"That's not how it works.");s(b,"You don't know how it works.");return L}
  if(a.partner===b.id){s(a,pick(["You sleep at all?","Come here. You're freezing.","I keep thinking about the house."]));s(b,pick(["A little. You?","I'm fine. Stop worrying.","We'll get a house again. A better one."]));s(a,"Promise me we stay together. Whatever happens.");s(b,"*takes their hand* Whatever happens.");return L}
  if(shared){const who=P(shared.a);s(a,`I keep thinking about ${who?who.name:"them"}.`);s(b,"Me too. Every time I close my eyes.");s(a,pick(["They didn't deserve that.","It should've been me.","Do you think they knew it was us at the end?"]));s(b,"*long silence* ...Get some sleep. I'll take your watch.");return L}
  if(r<-30){s(a,pick([`You took the last of the coffee again.`,`You were supposed to be on watch.`,`I saw you skimming from the store.`]));s(b,pick(["Prove it.","So report me.","Mind your own business for once."]));s(a,"One of these days, somebody's going to get hurt because of you.");s(b,"Is that a threat?");return L}
  const g=a.group?G(a.group):null;const L2=g&&g.leader!==a.id&&g.leader!=="you"?P(g.leader):null;
  const topics=[()=>{s(a,`What did you do, before?`);s(b,`${JOBS[b.job].n}. ${b.facts.bio?"":"Feels like a hundred years ago."}`);s(a,`I was a ${JOBS[a.job].n.toLowerCase()}. I hated it. I'd kill to go back.`);s(b,"*laughs* Wouldn't we all.")},
    ()=>{s(a,`What do you miss most?`);s(b,cap(b.facts.likes)+".");s(a,`For me it's ${a.facts.likes}.`);s(b,"Maybe we find some on the next run.")},
    ()=>{const n=S.news.find(n=>S.t-n.t<DAY*2);s(a,`Did you hear? ${n?n.x:"The radio's dead."}`);s(b,pick(["God help us.","Figures.","Doesn't surprise me.","I heard something different."]));s(a,"You think we're next?");s(b,pick(["Not if I can help it.","Everybody's next, eventually.","Don't say that."]))},
    ()=>{if(L2){const f=relGet(a,L2);s(a,`What do you make of ${L2.name}?`);s(b,relGet(b,L2)>20?"They're keeping us alive. That's enough for me.":"They're in over their head.");s(a,f>20?"I trust them.":"I'm not sure I do.")}else{s(a,"Who do you think's really in charge around here?");s(b,"Whoever has the food.")}},
    ()=>{s(a,`You ever think about ${S.player.name}?`);const f=feel(b);s(b,f>30?`I like them. They've got a good head.`:f<-20?`I don't trust them.`:`Don't know them well.`);s(a,feel(a)>30?"Same. I'd follow them.":"We'll see.")},
    ()=>{s(a,`What scares you most? Really.`);s(b,cap(b.facts.fear)+".");s(a,`Me, it's ${a.facts.fear}.`);s(b,"...We should stop talking about this.")}];
  pick(topics)();return L}

// ================= events (cards) =================
function queueEvent(id,loc,until,data={}){if(S.pending.some(e=>e.id===id))return;S.pending.push({id,loc,until,data})}
function checkPending(){if(!S)return;for(const e of [...S.pending]){if(S.t>e.until){S.pending=S.pending.filter(x=>x!==e);const ev=EVENTS[e.id];if(ev.auto){const txt=ev.auto(e.data);if(txt)news(txt,"big")}}}
  if(!UI.modal&&!UI.inChoice){const r=here();const e=S.pending.find(e=>e.loc==="any"||e.loc===r);if(e&&e.until>=S.t&&(e.at||0)<=S.t){S.pending=S.pending.filter(x=>x!==e);UI.modal={type:"event",id:e.id,data:e.data};render()}}}
function speakCheck(d){return S.player.sk.speak*12+rnd(0,60)>=d}
function fightCheck(d){return S.player.sk.fight*8+(weapon()?ITEMS[weapon().id].dmg*3:0)+armor()*2+rnd(0,60)>=d}
const EVENTS={
  morning:{title:"Sirens",text:()=>`It starts with sirens, then a lot of them. Your phone has no signal. Down the street, people are running, and one man is walking very slowly after them. His shirt is soaked dark down the front.\n\nWhatever happened at the clinic, it's coming this way.`,
    choices:[{t:"Go home, lock the doors and wait",go:()=>{S.player.flags.lockedIn=true;const hb=BMAP[S.player.home];const q=insidePos(hb);S.player.x=q.x;S.player.z=q.z;for(const d of hb.doors){d.open=false;d.bar=1}snapFollowers();return"You run home and drag the couch across the door. For a long time, nothing happens. Then something bangs against the back fence and doesn't stop."}},
      {t:"Run to the Food Mart before everyone else does",go:()=>{invAdd("canned_food",2);invAdd("water_bottle",2);S.player.hp-=rnd(0,10);const b=BMAP.grocery;const q=insidePos(b);S.player.x=q.x;S.player.z=q.z;snapFollowers();return"Main Street is chaos. Someone's smashed the Food Mart doors. You grab what you can carry and get out. A woman is screaming in the parking lot and you don't look back."}},
      {t:"Stay out and see what's happening",go:()=>"You stay where you are and watch. People run past. Somebody is crying somewhere you can't see. The man with the dark shirt turns his head toward you, slowly, like he heard his name."},
      {t:"Go knock on your neighbors' doors",go:()=>{const ns=living().filter(p=>p.home&&BMAP[p.home]&&dist(BMAP[p.home].x,BMAP[p.home].z,S.player.x,S.player.z)<25&&p.age>=16).slice(0,4);for(const p of ns){p.met=true;p.trust+=12;p.aff+=6;mem(p,`${S.player.name} came to check on us the morning it started.`,5)}return`You check on the houses around yours. ${ns.map(p=>p.name).join(", ")||"Nobody answers"}${ns.length?" open the door, scared and grateful.":"."} At least now you know who's around.`}}]},
  lead_offer:{title:"They're Asking for You",text:d=>`A few people find you after supper. "We've been talking. People listen to you. People trust you. ${fullName(P(G(d.gid).leader)||S.player)} has had their turn. Will you lead ${G(d.gid).name}?"`,
    choices:[{t:"Yes. I'll lead",go:d=>{const g=G(d.gid);const old=P(g.leader);g.leader="you";if(old){old.trust-=20;mem(old,`${S.player.name} took ${g.name} from me.`,-10)}news(`${S.player.name} now leads ${g.name}.`,"big");return"It's not a ceremony. It's just everyone looking at you a little differently. The group's orders and building plans are yours now (Group tab)."}},
      {t:"Not yet",go:()=>{S.flags.declinedLead=true;return"They're disappointed, but some of them respect you more for it."}}]},
  raid:{title:"Raid",text:d=>`Shouting at the edge of camp. Flashlights, engines, a gunshot. ${G(d.att).name} has come for your supplies.`,
    choices:[{t:"Fight them off",go:d=>{const def=defense(S.player.group)+(fightCheck(60)?10:0);S.player.hp-=Math.max(2,rnd(5,25)-armor()*2);skillUp("fight",.4);for(const q of members(S.player.group))q.trust+=3;return resolveRaid(G(d.att),myGroup(),d.pow,def,true)+wearWeapon(3)}},
      {t:"Hide the food and let them take what's left",go:d=>{const g=myGroup();const keep=g.stock.food*.6;const r=resolveRaid(G(d.att),g,d.pow,0,false);g.stock.food+=keep*.8;return r+" You'd hidden most of the food, though."}},
      {t:"Walk out and talk",go:d=>{if(speakCheck(70)){G(d.att).rel[S.player.group]=-10;return`You walk out with your hands up and talk until your throat hurts. They take ten cans and leave. Nobody dies tonight.`}return resolveRaid(G(d.att),myGroup(),d.pow,defense(S.player.group)-5,false)}}],
    auto:d=>resolveRaid(G(d.att),myGroup(),d.pow,defense(S.player.group),false)},
  herd:{title:"The Herd",text:()=>`The ground shakes before you see them. Hundreds of the dead, spilling off the highway and across the fields. They're coming past the camp.`,
    choices:[{t:"Hold the walls",go:d=>{const def=defense(S.player.group)+(fightCheck(55)?8:0);S.player.hp-=rnd(5,20);if(def>=d.pow)return"You hold. All night, the walls shake, and all night you hold. By dawn the herd has moved south."+wearWeapon(5);const v=shuffle(members(S.player.group)).slice(0,rnd(1,3));for(const p of v)kill(p,"was pulled over the wall by the herd");return`The wall gives at the north end. ${v.map(p=>p.name).join(" and ")} didn't make it.`+wearWeapon(5)}},
      {t:"Everyone goes silent and dark",go:d=>{if(rf()<.6+S.player.sk.speak*.03)return"Nobody breathes. Not a light, not a word, for six hours. The herd passes. You'll never forget the smell.";const v=pick(members(S.player.group));if(v)kill(v,"panicked and ran when the herd passed");return`Someone panics. ${v?v.name+" runs, and the herd follows them.":"The herd turns."} It's over fast.`}}],
    auto:d=>{if(defense(S.player.group)>=d.pow)return"The herd passed your camp. The walls held.";const v=shuffle(members(S.player.group)).slice(0,rnd(1,3));for(const p of v)kill(p,"was killed when the herd hit camp");return"The herd hit your camp while you were away."}},
  name_child:{title:"A Name",text:d=>`The baby is small and loud and completely real. ${P(d.child).sex==="F"?"A girl":"A boy"}. They need a name.`,input:"childname"},
};
