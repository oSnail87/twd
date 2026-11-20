"use strict";
// ================= helpers =================
const rf=Math.random;const ri=(a,b)=>a+Math.floor(rf()*(b-a+1));const pick=a=>a[Math.floor(rf()*a.length)];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;const dist=(ax,az,bx,bz)=>Math.hypot(ax-bx,az-bz);const lerp=(a,b,t)=>a+(b-a)*t;
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(rf()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cap1=s=>s?s[0].toUpperCase()+s.slice(1):s;
const listAnd=a=>a.length<2?(a[0]||""):a.slice(0,-1).join(", ")+" and "+a[a.length-1];
const HOUR=60,DAY=1440;
// how fast the clock runs at 1×: game minutes per real second. One second is a minute, so a minute of play is an hour in camp.
const CLOCK=1;
const dayOf=t=>Math.floor(t/DAY)+1;const hourOf=t=>Math.floor((t%DAY)/60);
function clockStr(t){const h=hourOf(t),m=Math.floor(t%60);const hh=h%12||12;return`${hh}:${String(m).padStart(2,"0")} ${h<12?"AM":"PM"}`}

// ================= people =================
const FNAME={F:["Ruth","Maria","Dana","Keisha","Tara","Lena","Joanne","Brooke","Alicia","Megan","Rosa","Carol","Hannah","Nina","Gail","Priya","Sheila","Amber","Lucy","Denise","Tess","Ivy","Wren","June"],
  M:["Jake","Marcus","Owen","Dale","Hector","Ray","Tom","Luis","Caleb","Andre","Gene","Wes","Darnell","Pete","Sam","Eli","Victor","Hank","Trevor","Felix","Gus","Nate","Abe","Cody"]};
const KNAME={F:["Lily","Ava","Mia","Rosie","Emma","Zoe","Kayla","Nora"],M:["Ben","Noah","Leo","Tyler","Max","Danny","Milo","Jonah"]};
const SURN=["Harlan","Okafor","Reyes","Pruitt","Whitlock","Castillo","Brennan","Yazzie","Kowalski","Dunn","Moreau","Tran","Abbott","Holm","Vance","Delgado","Fisher","Keane","Lund","Mercer","Odom","Sato","Booker","Quill"];
const JOBS_BEFORE={farmer:{n:"farmer",sk:{farm:3,build:1}},nurse:{n:"nurse",sk:{med:3,cook:1}},mechanic:{n:"mechanic",sk:{build:2,scav:2}},teacher:{n:"teacher",sk:{med:1,cook:1}},
  deputy:{n:"sheriff's deputy",sk:{fight:3,scav:1}},cook:{n:"line cook",sk:{cook:3,farm:1}},carpenter:{n:"carpenter",sk:{build:3}},trucker:{n:"trucker",sk:{scav:2,fight:1}},
  vet:{n:"veterinarian",sk:{med:2,farm:1}},soldier:{n:"army vet",sk:{fight:3,build:1}},clerk:{n:"store clerk",sk:{scav:2,cook:1}},rancher:{n:"rancher",sk:{farm:2,fight:1}},
  pastor:{n:"pastor",sk:{med:1}},student:{n:"college student",sk:{scav:1}},hunter:{n:"hunting guide",sk:{fight:2,scav:1,farm:1}},retiree:{n:"retired machinist",sk:{build:2}}};
const SKILLS={farm:"Farming",build:"Building",fight:"Fighting",scav:"Scavenging",med:"Medicine",cook:"Cooking"};
// personality axes run from -1 to 1
const TRAITS={brave:["brave","timid"],loyal:["loyal","independent"],kind:["kind","selfish"],diligent:["hardworking","lazy"],social:["chatty","quiet"],temper:["hotheaded","even-tempered"],faith:["devout","skeptical"]};
const MOTIVES={family:"keeping their family safe",safety:"staying alive, whatever it takes",belonging:"being part of something again",purpose:"being useful",revenge:"making the dead pay for what they took",faith:"doing right by God",freedom:"never being told what to do"};
const QUIRKS=["hums old country songs while they work","counts things when they're nervous","won't eat anything green","keeps a dead phone charged out of habit","tells terrible jokes on purpose","sleeps with their boots on","talks to the chickens","keeps a list of everyone they've lost","whittles when they can't sleep","has an opinion about every kind of knot","swears in Spanish when they hit their thumb","reads the same paperback over and over"];
const HOPES=["a hot shower","seeing the ocean someday","finding their brother in Denver","a real bed","the radio coming back on","a garden that's just for flowers","teaching kids again","a cold beer","one quiet night"];
const FEARS=["the dark","being alone","fire","being the one who turns","the kids getting hurt","running out of insulin","crowds","deep water"];
const LOOK={skin:["#f0d2b4","#e3bd98","#c99873","#a8744e","#8a5a3a","#5e3e2a"],hair:["#1d1a18","#4a3020","#c9a85a","#8a3a1f","#9a9a96"],
  top:["#56636c","#6c5a4a","#4f5b48","#7a6a58","#6e4f4f","#3f4a52","#8a6e52","#5a4f6a","#3d5a50","#7a3a32","#2f3e58","#a89a7a"],pants:["#3a4a6a","#2f3b52","#8a7a5a","#2a2a2e","#5a5e62","#4a4038"]};

// ================= the land: a world map of places, each its own scene =================
// mx/mz place it on the world map (in miles-ish units); each place loads as its own isometric scene when you go there.
// pop is how many people were there when it started: the dead there come from them.
// kind picks the scene's layout; beds/farm/water/def/wood/hide only matter if you make camp there; danger sets how many of the dead are around
const LOCS={
  start:{n:"Route 9 pileup",mx:0,mz:8,kind:"road",danger:1,pop:5,camp:false,d:"Where you started: a stalled line of cars on the highway."},
  farm:{n:"Harlan Farm",mx:-46,mz:-34,kind:"farm",pop:2,beds:4,farm:1.5,water:1.2,def:.8,wood:1,hide:1,danger:1,d:"A farmhouse, a barn and open fields. Good soil and a hand-pumped well, but you can see it for miles."},
  mill:{n:"Cutter's Mill",mx:-48,mz:27,kind:"mill",pop:1,beds:3,farm:1.1,water:1.6,def:1.1,wood:1.1,hide:1,danger:1,d:"An old stone mill on the river. Water all year and thick walls, a long walk from town."},
  church:{n:"St. Agnes Church",mx:22,mz:-16,kind:"church",pop:7,beds:6,farm:.7,water:.9,def:1.3,wood:.8,hide:.8,danger:2,d:"A brick church with a fenced yard on the edge of Millbrook. Close to the stores, and close to the dead."},
  scout:{n:"Pine Ridge Camp",mx:54,mz:46,kind:"scout",pop:2,beds:6,farm:.6,water:1.1,def:.9,wood:1.6,hide:1.4,danger:1,d:"A scout camp deep in the pines, with cabins by a lake. Hidden and quiet, but poor ground for crops."},
  motel:{n:"Starlite Motel",mx:-14,mz:16,kind:"motel",pop:7,beds:8,farm:.7,water:.8,def:.7,wood:.9,hide:.7,danger:2,d:"A row of rooms right off the highway. Plenty of beds, and easy to find for anyone."},
  grocery:{n:"Grocery",mx:38,mz:-48,kind:"store",pop:9,beds:2,farm:.3,water:.8,def:.9,wood:.6,hide:.6,danger:3,col:"#8a7a5a",d:"Millbrook's grocery. Picked over, but nobody got into the stockroom."},
  pharmacy:{n:"Pharmacy",mx:52,mz:-46,kind:"store",pop:6,beds:1,farm:.3,water:.7,def:.8,wood:.6,hide:.6,danger:3,col:"#6a7a8a",d:"The corner pharmacy. Medicine, if the dead haven't got it."},
  hardware:{n:"Hardware Store",mx:40,mz:-34,kind:"store",pop:5,beds:2,farm:.3,water:.7,def:1,wood:.8,hide:.6,danger:2,col:"#8a5a3a",d:"Tools, nails, rope, tarps. Everything you need to build."},
  police:{n:"Police Station",mx:58,mz:-33,kind:"police",pop:8,beds:3,farm:.3,water:.8,def:1.6,wood:.6,hide:.6,danger:4,d:"Brick walls and a locked armory, overrun the first night."},
  school:{n:"Millbrook School",mx:22,mz:-56,kind:"school",pop:14,beds:10,farm:.8,water:.9,def:1,wood:.7,hide:.7,danger:3,d:"A one-story school with a ball field and a cafeteria. It was an evacuation point. It didn't go well."},
  gas:{n:"Gas Station",mx:6,mz:4,kind:"gas",pop:4,beds:1,farm:.3,water:.6,def:.6,wood:.6,hide:.6,danger:1,d:"A gas station and mini-mart at the crossroads."}};
const SITES=LOCS;// older name used around the code for places you can live
const SH=30;// a scene runs from -SH to SH on both axes
// where things are stored in each kind of place, and what's likely inside: [key, chance, min, max]; i: marks a loose item
const CONT={car:{n:"Car",g:[4,2],loot:[["food",.3,1,2],["water",.3,1,2],["i:bulb",.15],["i:blanket",.15],["i:tape",.15],["i:battery",.1],["i:knife",.08],["i:pistol",.03],["ammo",.06,2,6]]},
  shelf:{n:"Shelves",g:[5,3],loot:[["food",.6,2,6],["water",.4,1,4],["i:tin",.3,1,3],["i:jar",.2,1,2],["i:alcohol",.15],["i:seeds",.15,1,3]]},
  stock:{n:"Stockroom",g:[6,4],loot:[["food",.9,4,10],["water",.7,3,8],["i:bucket",.3],["i:bleach",.3],["i:cloth",.3,1,3]]},
  meds:{n:"Pharmacy shelves",g:[5,3],loot:[["meds",.8,1,4],["i:insulin",.35,1,3],["i:epipen",.25,1,2],["i:inhaler",.3,1,2],["i:heartpills",.3,10,30],["i:alcohol",.2]]},
  tools:{n:"Tool aisle",g:[6,3],loot:[["scrap",.7,2,6],["i:nails",.6,1,2],["i:rope",.5,1,3],["i:tarp",.4,1,2],["i:hammer",.35],["i:saw",.3],["i:shovel",.3],["i:wire",.4,1,3],["i:tape",.4,1,2],["i:chain",.2],["i:seeds",.3,2,6]]},
  armory:{n:"Armory locker",g:[6,3],loot:[["ammo",.85,8,24],["i:pistol",.55],["i:shotgun",.45],["i:rifle",.2],["i:bat",.3],["i:knife",.4],["i:tape",.2]]},
  gunsafe:{n:"Gun cabinet",g:[5,2],loot:[["i:rifle",.6],["i:shotgun",.35],["ammo",.8,4,14]]},
  cruiser:{n:"Trooper's cruiser",g:[5,2],loot:[["i:pistol",1],["ammo",1,8,14],["i:bulb",.5],["water",.4,1,2]]},
  desk:{n:"Desks",g:[4,2],loot:[["food",.25,1,2],["i:bulb",.25],["i:tape",.25],["i:wire",.15],["meds",.15,1,1]]},
  kitchen:{n:"Kitchen",g:[5,3],loot:[["food",.7,2,6],["water",.5,1,4],["i:knife",.4],["i:jar",.3,1,3],["i:bucket",.2],["i:tin",.3,1,3]]},
  barn:{n:"Barn loft",g:[6,3],loot:[["wood",.7,2,6],["i:rope",.5,1,3],["i:seeds",.5,2,8],["i:shovel",.4],["i:chain",.3],["i:boards",.5,1,4],["i:tarp",.3]]},
  closet:{n:"Closets",g:[4,3],loot:[["i:blanket",.5],["i:cloth",.5,1,4],["meds",.2,1,1],["i:bulb",.2],["food",.2,1,2]]},
  pumps:{n:"Mini-mart",g:[5,3],loot:[["food",.6,1,4],["water",.6,1,4],["i:bottle",.4,1,4],["i:tape",.3],["i:line",.2],["i:fishhook",.2,2,6],["i:bulb",.25]]},
  shed:{n:"Shed",g:[4,3],loot:[["wood",.6,1,4],["scrap",.4,1,3],["i:rope",.3],["i:saw",.2],["i:line",.25],["i:fishhook",.2,2,8],["i:bow",.08]]}};
// what each kind of place holds: the main building's footprint and look, and the containers to search
const SCENES={road:{b:null,conts:["car","car","cruiser","car","car"]},
  farm:{b:{w:9,d:7,h:4,c:"#d8d0c0",roof:"#6a3a2a",at:[-6,-8]},b2:{w:8,d:10,h:5,c:"#8a3a2a",roof:"#4a4a48",at:[10,-8],barn:true,kit:["hay"],floor:"#6a5236"},kit:["table"],floor:"#8a6a48",fields:true,conts:["kitchen","closet","barn","shed","gunsafe"],tree:.5},
  mill:{b:{w:8,d:8,h:6,c:"#8a8478",roof:"#4a3a2a",at:[0,-9]},kit:["table"],floor:"#7a6a58",water:true,conts:["kitchen","shed","closet"],tree:.8},
  church:{b:{w:8,d:14,h:6,c:"#8a4a3a",roof:"#3a3a3c",at:[0,-8],steeple:true},kit:["pews"],floor:"#6a5a48",fence:true,conts:["kitchen","closet","desk"],tree:.4},
  scout:{b:{w:6,d:5,h:3.5,c:"#6a5038",roof:"#3a4a32",at:[-8,-8]},b2:{w:6,d:5,h:3.5,c:"#6a5038",roof:"#3a4a32",at:[8,-8]},kit:["table"],floor:"#8a6a48",water:true,conts:["kitchen","closet","shed"],tree:1.6},
  motel:{b:{w:22,d:6,h:3.5,c:"#c8b898",roof:"#5a5a5a",at:[0,-10]},kit:["rooms"],floor:"#6a5e58",lot:true,conts:["closet","closet","kitchen","car","car"],tree:.4},
  store:{b:{w:14,d:10,h:4.5,c:null,roof:"#4a4a4a",at:[0,-8],flat:true},kit:["aisles","counter"],floor:"#9a9a92",lot:true,conts:["shelf","shelf","stock","car"],tree:.25},
  police:{b:{w:12,d:10,h:4.5,c:"#7a6a5a",roof:"#3a3a3a",at:[0,-8],flat:true},kit:["desks"],floor:"#7a7a78",lot:true,conts:["armory","desk","desk","car","car"],tree:.25},
  school:{b:{w:20,d:10,h:4,c:"#a8886a",roof:"#4a4a4a",at:[0,-9],flat:true},kit:["desks"],floor:"#8a8070",field:true,conts:["kitchen","desk","desk","closet","stock"],tree:.4},
  gas:{b:{w:8,d:6,h:3.5,c:"#d8d8d0",roof:"#a83a2a",at:[-6,-8],flat:true},kit:["aisles"],floor:"#a0a098",canopy:true,lot:true,conts:["pumps","pumps","car","car","shed"],tree:.3}};
// the pharmacy and hardware store are stores with their own shelves
const SCENE_CONTS={pharmacy:["meds","meds","shelf","car"],hardware:["tools","tools","shelf","car"],grocery:["shelf","shelf","shelf","stock","car"]};
function placeAt(k){return LOCS[k]||null}
function placeName(k){return(LOCS[k]||{}).n||k}
// the river runs west to east across the south of the map
function riverZ(x){return 36+Math.sin(x/22)*6+x*.12}
function travelHours(a,b){const A=LOCS[a],B=LOCS[b];if(!A||!B)return 1;return Math.max(1,Math.round(dist(A.mx,A.mz,B.mx,B.mz)/16*2)/2)}

// ================= things you can build =================
// steps describe the hands-on build: stakes/posts (click the marks), hold (raise, hammer, pump), drag (pull a cover or plank into place)
const BUILDS={
  tent:{n:"Tent",solid:true,cost:{wood:1,scrap:1},hrs:3,beds:2,size:[3,3],d:"Sleeps two.",opts:{cover:["#5a6b3a","#8a4a32","#3a5a7a","#b89a5a","#6a6a6a"]},
    steps:[{t:"stakes",n:4,say:"Drive in the four corner stakes."},{t:"hold",say:"Raise the ridge pole. Hold, and let go in the green."},{t:"drag",say:"Pull the cover over the frame."}]},
  cabin:{n:"Cabin",solid:true,cost:{wood:8,scrap:2},hrs:14,beds:4,size:[5,4],d:"Sleeps four, keeps the cold and the dead out.",opts:{roof:["#5a3a2a","#7a7a78","#3a4a5a","#7a3a2a"],walls:["#8a6a48","#a08a6a","#6a5a48"]},
    steps:[{t:"stakes",n:4,say:"Set the four corner posts."},{t:"drag",say:"Lay the wall planks."},{t:"hold",say:"Hammer the frame together."},{t:"drag",say:"Slide the roof on."}]},
  plot:{n:"Farm plot",cost:{wood:2},hrs:4,size:[6,4],job:"farm",d:"Feeds people once it's growing, if someone works it. Two farmers per plot.",opts:{crop:["corn","beans","potatoes","squash"]},
    steps:[{t:"drag",say:"Drag the plow down the rows."},{t:"stakes",n:5,say:"Plant the seed hills."},{t:"hold",say:"Pump water for the first soak."}]},
  well:{n:"Rain barrels",solid:true,cost:{wood:3,scrap:2},hrs:5,size:[2,2],d:"Collects water on its own.",opts:{},
    steps:[{t:"stakes",n:3,say:"Set the barrel stands."},{t:"drag",say:"Run the gutter to the barrels."}]},
  fire:{n:"Cookfire",cost:{wood:2},hrs:2,size:[2,2],job:"cook",d:"Where a cook feeds everyone more for less. People gather here.",opts:{},
    steps:[{t:"stakes",n:6,say:"Ring the pit with stones."},{t:"hold",say:"Blow the kindling into a flame."}]},
  tower:{n:"Watchtower",cost:{wood:6,scrap:1},hrs:10,size:[3,3],job:"guard",d:"A guard up here sees them coming. Big boost to defense.",opts:{},
    steps:[{t:"stakes",n:4,say:"Plant the four legs."},{t:"hold",say:"Haul the platform up."},{t:"drag",say:"Lash the ladder on."}]},
  fence:{n:"Wall section",wall:true,cost:{wood:3},hrs:3,size:[6,1],d:"Posts and boards the dead can't get through. Your people can climb over, slowly. Line them up with cars and buildings to close off a yard.",opts:{},
    steps:[{t:"stakes",n:4,say:"Drive the posts."},{t:"drag",say:"Nail the boards across."}]},
  gate:{n:"Gate",gate:true,cost:{wood:3,scrap:1},hrs:3,size:[3,1],d:"A gap in the wall your people walk through and the dead don't.",opts:{},
    steps:[{t:"stakes",n:2,say:"Set the gateposts."},{t:"drag",say:"Hang the gate."}]},
  shed:{n:"Storehouse",solid:true,cost:{wood:6,scrap:2},hrs:8,size:[4,4],d:"Keeps food from spoiling and more supplies safe.",opts:{roof:["#7a7a78","#5a3a2a","#3a5a3a"]},
    steps:[{t:"stakes",n:4,say:"Set the corner posts."},{t:"drag",say:"Raise the walls."},{t:"drag",say:"Put the tin roof on."}]},
  shop:{n:"Workshop",solid:true,cost:{wood:6,scrap:4},hrs:10,size:[4,4],job:"build",d:"Builders work faster here and turn scrap into ammo.",opts:{},
    steps:[{t:"stakes",n:4,say:"Set the posts."},{t:"drag",say:"Drag the workbench in."},{t:"hold",say:"Hammer the frame."}]},
  clinic:{n:"Infirmary",solid:true,cost:{wood:6,scrap:3},hrs:10,size:[4,4],job:"medic",d:"A medic here heals people faster and stops sickness spreading.",opts:{},
    steps:[{t:"stakes",n:4,say:"Set the posts."},{t:"drag",say:"Stretch the canvas over."},{t:"stakes",n:2,say:"Set up two cots."}]},
  coop:{n:"Chicken coop",solid:true,cost:{wood:4,scrap:1},hrs:5,size:[3,2],job:"farm",d:"Eggs every morning, if a farmer looks after it.",opts:{},
    steps:[{t:"stakes",n:4,say:"Set the posts."},{t:"drag",say:"Stretch the wire."}]},
  bench:{n:"Bench",cost:{wood:1},hrs:1,size:[2,1],d:"Somewhere to sit and talk. People like it.",opts:{},steps:[{t:"stakes",n:2,say:"Set the legs."},{t:"drag",say:"Lay the seat plank."}]},
  garden:{n:"Flower bed",cost:{wood:1},hrs:1,size:[2,2],d:"Pointless and wonderful. Lifts spirits a little.",opts:{color:["#d85a7a","#e8c040","#8a6ad8","#e8e0d0"]},steps:[{t:"stakes",n:4,say:"Plant the bulbs."},{t:"hold",say:"Water them."}]}};
const BWORDS={tent:/tent/,cabin:/cabin|hut|shack|house|home/,plot:/farm|plot|field|crop|garden plot/,well:/well|barrel|water/,fire:/fire|kitchen|cook|pit/,tower:/tower|lookout|watch/,gate:/\bgate\b/,fence:/wall|fence|palisade/,shed:/store|shed|storage|pantry/,shop:/workshop|shop|bench ?work/,clinic:/infirm|clinic|hospital|medic/,coop:/coop|chicken|hen/,bench:/bench|seat/,garden:/flower/};

// ================= jobs =================
const JOBS={farm:{n:"Farming",sk:"farm",v:"farming",lead:"farms"},wood:{n:"Woodcutting",sk:"build",v:"cutting wood",lead:"wood"},water:{n:"Hauling water",sk:"farm",v:"hauling water",lead:"water"},
  build:{n:"Building",sk:"build",v:"building",lead:"building"},guard:{n:"Guard duty",sk:"fight",v:"on watch",lead:"defense"},scav:{n:"Scavenging",sk:"scav",v:"scavenging",lead:"supply runs"},
  cook:{n:"Cooking",sk:"cook",v:"cooking",lead:"kitchen"},medic:{n:"Medic",sk:"med",v:"tending the sick",lead:"health"},hunt:{n:"Hunting",sk:"scav",v:"hunting",lead:"hunting"}};
const JWORDS={farm:/farm|crop|field|plant|garden/,wood:/wood|chop|lumber|log|axe|tree/,water:/water|haul|river/,build:/build|construct|carpent/,guard:/guard|watch|defen|protect|patrol|lookout/,scav:/scav|loot|supply|forage|run/,cook:/cook|kitchen|meal/,medic:/medic|doctor|nurse|heal|sick|clinic|infirm/,hunt:/hunt|deer|game\b|bow/};
const RES={food:"Food",water:"Water",wood:"Wood",scrap:"Scrap",meds:"Medicine",ammo:"Ammo"};

// ================= loose items, for crafting =================
// what a crafted thing is good for decides what it does in camp; Claude (or the recipe list) picks one of these
const USES={fishing:"catches fish: a little food every day",trapping:"snares small game: a little food every day",water:"makes or holds water: a little water every day",
  weapon:"something to fight with: better odds against the dead",defense:"makes camp harder to get into",medical:"treats wounds and sickness",comfort:"makes camp a nicer place to be",
  tool:"makes work go faster",light:"light at night: fewer surprises",clothing:"keeps someone warm and covered",storage:"holds supplies",material:"raw material for building",trade:"worth something to someone",none:"nothing in particular"};
const ITEMS={insulin:"insulin pen",epipen:"EpiPen",inhaler:"inhaler",heartpills:"heart pills",rope:"rope",cloth:"cloth",nails:"box of nails",tarp:"tarp",pipe:"metal pipe",jar:"glass jar",tape:"duct tape",wire:"wire",knife:"kitchen knife",bottle:"plastic bottle",
  bucket:"bucket",hammer:"hammer",saw:"hand saw",tin:"tin can",fishhook:"fishing hooks",line:"fishing line",bleach:"bleach",alcohol:"bottle of vodka",battery:"car battery",bulb:"flashlight",
  seeds:"seed packets",blanket:"blanket",boards:"loose boards",chain:"chain",bike:"bicycle",shovel:"shovel",bat:"baseball bat",bow:"hunting bow",gunpowder:"gunpowder",sheet:"sheet metal",pistol:"pistol",shotgun:"pump shotgun",rifle:"hunting rifle"};
// what works without Claude: the words that must appear (any of each group), what it takes, and what it makes
const RECIPES=[
  {w:[/net/],need:{rope:2},make:"Fishing net",use:"fishing",v:2,say:"You knot the rope into a rough mesh, weight the corners with stones, and you've got a net."},
  {w:[/fish|rod|pole/],need:{line:1,fishhook:1},make:"Fishing pole",use:"fishing",v:1,say:"A straight branch, line and a hook. It'll catch something."},
  {w:[/trap|snare/],need:{wire:1},make:"Wire snares",use:"trapping",v:1,say:"You twist the wire into a few snares to set along the rabbit runs."},
  {w:[/spear/],need:{knife:1,tape:1},make:"Spear",use:"weapon",v:2,say:"You tape the knife to a broom handle. It's ugly, but it keeps them at arm's length."},
  {w:[/spike|bat|club/],need:{bat:1,nails:1},make:"Nail bat",use:"weapon",v:2,say:"You drive nails through the bat. Crude, and it works."},
  {w:[/bandage|dressing/],need:{cloth:2},make:"Bandages",use:"medical",v:1,say:"You tear the cloth into strips and boil them clean."},
  {w:[/disinfect|antiseptic|clean/],need:{alcohol:1},make:"Wound wash",use:"medical",v:1,say:"Vodka in a clean jar. It stings, and it keeps wounds from turning."},
  {w:[/filter|purif/],need:{bottle:1,cloth:1},make:"Water filter",use:"water",v:1,say:"Cloth, sand and charcoal layered in a cut bottle. River water comes out clear."},
  {w:[/rain|collect|catch/],need:{tarp:1},make:"Rain catcher",use:"water",v:2,say:"You string the tarp up so it funnels rain into a bucket."},
  {w:[/alarm|tripwire|can/],need:{tin:2,wire:1},make:"Can alarm",use:"defense",v:1,say:"Tin cans strung on wire around the edge of camp. Nothing gets close quietly."},
  {w:[/lamp|light|lantern/],need:{jar:1,cloth:1},make:"Oil lamp",use:"light",v:1,say:"A jar, a cloth wick and some cooking oil. A small, steady light."},
  {w:[/spike|stake|barricade/],need:{boards:2},make:"Spike barricade",use:"defense",v:2,say:"You sharpen the boards and set them angled out from camp."},
  {w:[/bed|cot|hammock/],need:{rope:1,blanket:1},make:"Hammock",use:"comfort",v:1,say:"A blanket slung between two trees. Someone's going to fight for it."},
  {w:[/coat|poncho|cloak|cloth/],need:{tarp:1},make:"Rain poncho",use:"clothing",v:1,say:"You cut a head hole in the tarp. Dry, if not stylish."}];
// things that just don't work that way, so the game can say why without Claude
const NOPE=[[/gun|rifle|pistol|firearm/,"A gun needs a machined barrel, a firing pin and primed cartridges. Metal and powder sitting together won't fire anything."],
  [/bomb|grenade|explosive/,"You don't know how to make that safely, and nobody here wants to find out the hard way."],
  [/car|truck|engine|generator|radio|phone/,"That takes parts and tools you don't have."],[/cure|vaccine|antidote/,"Nobody knows how to cure this. Not with what's in camp."]];

// how much room things take in camp storage: [width, height, how many fit in one block]
const ISZ={food:[1,1,6],water:[1,2,8],wood:[2,1,5],scrap:[1,1,6],meds:[1,1,4],ammo:[1,1,20],
  insulin:[1,1,6],epipen:[1,1,2],inhaler:[1,1,2],heartpills:[1,1,30],rope:[1,1,3],cloth:[1,1,5],nails:[1,1,1],tarp:[2,1,1],pipe:[1,3,1],jar:[1,1,3],tape:[1,1,3],wire:[1,1,3],knife:[1,2,1],bottle:[1,1,4],
  bucket:[2,2,1],hammer:[1,2,1],saw:[1,3,1],tin:[1,1,6],fishhook:[1,1,10],line:[1,1,3],bleach:[1,2,1],alcohol:[1,2,1],battery:[2,2,1],bulb:[1,1,2],seeds:[1,1,8],blanket:[2,2,1],
  boards:[3,1,4],chain:[1,1,1],bike:[3,2,1],shovel:[1,3,1],bat:[1,3,1],bow:[1,3,1],gunpowder:[1,1,1],sheet:[2,2,2],pistol:[2,1,1],shotgun:[4,1,1],rifle:[4,1,1]};
const ICOL={food:"#8a6a3a",water:"#3a6a8a",wood:"#6a4a2a",scrap:"#6a6a6a",meds:"#a83a3a",ammo:"#8a7a3a",personal:"#7a3a6a",item:"#4a5560",crafted:"#3d6a50"};
// what the tools and odds and ends are good for when someone picks them up
const ITEM_USE={hammer:"tool",saw:"tool",shovel:"tool",knife:"weapon",bat:"weapon",bow:"weapon",pipe:"weapon",blanket:"comfort",alcohol:"comfort",bulb:"light",bucket:"water",seeds:"tool",pistol:"weapon",shotgun:"weapon",rifle:"weapon"};
// guns: how far they reach, how often they hit up close, how far the bang carries, how long between shots (ms), how many rounds you keep on you
const GUNS={pistol:{n:"Pistol",range:13,hit:.72,noise:18,cool:450,carry:24},
  shotgun:{n:"Shotgun",range:8,hit:.92,spread:.5,noise:24,cool:950,carry:16},
  rifle:{n:"Hunting rifle",range:24,hit:.82,noise:30,cool:1300,carry:20}};
const GUN_RANK={shotgun:3,rifle:2,pistol:1};
// what some people had on them when it started
const CARRY_GUN={deputy:["pistol",.7],soldier:["rifle",.35],hunter:["rifle",.7],rancher:["shotgun",.45],farmer:["shotgun",.25]};
// people who need something to stay alive
const CONDS={diabetic:{n:"diabetic",item:"insulin",every:2,hurt:16,need:"insulin every couple of days"},
  allergy:{n:"allergic to bee stings",item:"epipen",emergency:true,need:"an EpiPen if a bee gets them"},
  asthma:{n:"asthmatic",item:"inhaler",every:5,hurt:7,need:"an inhaler when their chest gets tight"},
  heart:{n:"has a bad heart",item:"heartpills",every:1,hurt:5,need:"heart pills every day"}};
// what someone selfish tells themself when they take another person's medicine
const SELFISH_USE={epipen:"for the adrenaline, before a run",inhaler:"to breathe easier after hauling wood",heartpills:"to trade for cigarettes",insulin:"to trade to the Pruitts for whiskey"};
