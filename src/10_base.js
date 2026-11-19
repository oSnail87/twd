<script>
"use strict";
const $app=document.getElementById("app");
// ================= utilities =================
const rf=()=>Math.random();
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const esc=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const DAY=1440;
const dayOf=t=>Math.floor(t/DAY)+1;
const hourOf=t=>Math.floor((t%DAY)/60);
const fmtT=t=>{const h=hourOf(t),m=Math.floor(t%60);return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")};
const stamp=t=>"Day "+dayOf(t)+" · "+fmtT(t);
const dist=(a,b,c,d)=>Math.hypot(a-c,b-d);
const hashStr=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};
const srng=seed=>{let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}};
const pick2=(a,R)=>a[Math.floor(R()*a.length)];
const TOWN="Limon";

// ================= the map =================
const WB={x0:-130,x1:130,z0:-100,z1:100};
const PLACES={
  farm:{n:"Holloway Farm",r:[[-95,-30,-45,15]],site:{c:[-70,0],gw:10,gh:6},d:"Walt Holloway's family farm: a white farmhouse, a red barn, fenced pasture and a long view of the road. Defensible, if you have the people."},
  church:{n:"St. Brigid's Church",r:[[-30,58,10,94]],site:{c:[-10,82],gw:10,gh:4},d:"A stone church and parish hall south of the river, with a walled cemetery. Pastor Grace keeps the doors open to anyone."},
  quarry:{n:"Redstone Quarry",r:[[60,-96,122,-58]],site:{c:[86,-72],gw:10,gh:6},d:"A gravel pit carved into red rock, with one road in. Hard to reach, harder to attack."},
  school:{n:"Limon High",r:[[58,6,90,36]],site:{c:[74,28],gw:8,gh:3},d:"The high school: chain-link fence, a gym full of cots, a cafeteria that ran out of food fast."},
  town:{n:"Limon",r:[[0,-46,92,38]],d:"A town of two thousand people out where the plains meet the hills. Main Street, Birch Street, Elm Street. Shops, houses, a small hospital. Everything you need, and everyone who didn't make it."},
  road:{n:"Highway 9",r:[[23,-100,33,100]],d:"Two lanes of cracked asphalt running north and south. Abandoned cars with doors hanging open."},
  river:{n:"Cedar River",r:[[-130,42,130,52]],d:"Wide, slow, brown water. The highway bridge is the only dry crossing; there's a shallow ford to the west."},
  hills:{n:"Shale Hills",r:[[-130,52,-35,100],[10,52,130,100]],d:"Rocky slopes and scrub. Good stone, few people, long views."},
  woods:{n:"Cedar Woods",r:[[-130,-100,-5,-33],[-130,-33,-97,42],[92,-58,130,42]],d:"Dense cedar and oak. Deer, rabbits, berries, deadfall, and the sound of your own heart."},
  fields:{n:"The Fields",r:[[-45,-33,23,42],[-97,15,-45,42]],d:"Overgrown cornfields and pasture between the farm and the highway."},
  lodge:{n:"Hunting Cabin",r:[[-126,-72,-98,-38]],site:{c:[-112,-50],gw:8,gh:4},d:"A one-room cabin in a clearing deep in the cedar woods. Hard to find. Easy to hold."},
  mill:{n:"Cedar Mill",r:[[-44,22,-6,42]],site:{c:[-26,29],gw:8,gh:3},d:"The shell of an old sawmill on the north bank, with a caretaker's trailer. Water close by, timber all around."},
  wilds:{n:"Backcountry",r:[],d:"Scrub, fence lines and ditches."},
};
const PLACE_ORDER=["farm","church","quarry","school","lodge","mill","town","road","river","hills","woods","fields"];
function regionAt(x,z){for(const k of PLACE_ORDER){for(const r of PLACES[k].r)if(x>=r[0]&&x<=r[2]&&z>=r[1]&&z<=r[3])return k}return"wilds"}
function randIn(k,m=2){const P=PLACES[k];if(!P.r.length)return{x:rnd(-60,60),z:rnd(-60,60)};for(let i=0;i<40;i++){const r=pick(P.r);const x=r[0]+m+rf()*(r[2]-r[0]-2*m),z=r[1]+m+rf()*(r[3]-r[1]-2*m);if(regionAt(x,z)===k&&!solidAt(x,z,.8)&&free(x,z,.4))return{x,z}}const r=P.r[0];return{x:(r[0]+r[2])/2,z:(r[1]+r[3])/2}}
function inRiver(x,z){return z>=42&&z<=52}
function onBridge(x,z){return x>=23&&x<=33&&inRiver(x,z)}
function onFord(x,z){return x>=-62&&x<=-52&&inRiver(x,z)}

// buildings. face = the side the front door is on. Interiors are generated from the type (see the interiors part).
const BUILDINGS=[];
(function(){
  const add=(id,n,type,x,z,w,d,face,extra={})=>BUILDINGS.push({id,n,type,x,z,w,d,face,...extra});
  add("clinic",`${TOWN} Hospital`,"clinic",17,-13.5,10,9,"+z");
  add("pharmacy","Rx Pharmacy","pharmacy",39.5,-13,9,8,"+z");
  add("hardware","Ellis Hardware","hardware",51,-13.5,11,9,"+z");
  add("grocery","Food Mart","grocery",65,-14,14,10,"+z");
  add("library",`${TOWN} Library`,"library",81,-13.5,10,9,"+z");
  add("diner","Rosa's Diner","diner",39.5,3.5,9,7,"-z");
  add("sheriff","Sheriff's Office","sheriff",51,4,10,8,"-z");
  add("bar","The Low Water","bar",62,3.5,9,7,"-z");
  add("gas","Kwik Gas","gas",17,9,9,6,"-z");
  add("schoolbldg",`${TOWN} High School`,"school",74,14,26,10,"-z",{site:"school",house:30});
  add("farmhouse","Holloway farmhouse","farmhouse",-80,-21,12,9,"+z",{site:"farm",house:8});
  add("barn","The red barn","barn",-58,-22,14,10,"+z",{site:"farm",house:10});
  add("churchbldg","St. Brigid's","church",-12,66,11,14,"-z",{site:"church",house:12});
  add("hall","Parish hall","hall",4,66,9,9,"-z",{site:"church",house:8});
  add("qoffice","Quarry office","qoffice",106,-90,8,6,"+z",{site:"quarry",house:6});
  add("qsheds","Equipment sheds","qsheds",72,-90,13,6,"+z",{site:"quarry",house:8});
  let n=1;
  for(const x of [39,50,61,72,83])add("h"+n,`${n*4+10} Birch St`,"house",x,-37.5,9,7,"+z"),n++;
  for(const x of [39,50,61,72,83])add("h"+n,`${n*4+10} Birch St`,"house",x,-23.5,9,7,"-z"),n++;
  for(const x of [40,51])add("h"+n,`${n*4+10} Elm St`,"house",x,14.5,9,7,"+z"),n++;
  for(const x of [40,51])add("h"+n,`${n*4+10} Elm St`,"house",x,28.5,9,7,"-z"),n++;
  for(const z of [-38,-27,-16,9,20,31])add("h"+n,`${n*3+2} Mill Rd`,"house",4,z,7,9,"+x"),n++;
  for(const z of [-38,-27,20,31])add("h"+n,`${n*3+2} Mill Rd`,"house",16,z,7,9,"-x"),n++;
  add("trailer1","Caretaker's trailer","trailer",-40,37,8,4.6,"-z",{site:"mill",house:3,home:true});
  add("millruin","The old sawmill","mill",-26,38,12,6,"-z",{site:"mill",house:3});
  add("trailer2","The hunting cabin","cabin",-115,-60,7,6,"+z",{site:"lodge",house:4,home:true});
})();
const BMAP=Object.fromEntries(BUILDINGS.map(b=>[b.id,b]));
const HOUSES=BUILDINGS.filter(b=>b.type==="house");
// footprint test, used for placing scenery (not for walking: walls and doors handle that)
function solidAt(x,z,r=.4){for(const b of BUILDINGS)if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return b;return null}
const CARS=[];(function(){let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<16;i++){const z=-95+r()*190;if(z>38&&z<56)continue;if(z>-9&&z<1)continue;CARS.push({id:"car"+i,n:pick2(["Abandoned sedan","Pickup truck","Minivan","Station wagon","Delivery van","Hatchback"],r),type:"car",x:24.5+r()*7,z,rot:(r()-.5)*.8})}})();

// ================= items =================
// sz = cells it takes [w,h]; st = how many stack in one cell block; grid = the pockets or space it gives when worn
const ITEMS={
  canned_food:{n:"Canned beans",sn:"Beans",w:.5,v:8,eat:{food:30},sz:[1,1],ic:"can",cat:"food",d:"Cold beans straight from the can. Still the best thing you'll eat all day."},
  canned_fruit:{n:"Canned peaches",sn:"Peaches",w:.5,v:7,eat:{food:18,water:10},sz:[1,1],ic:"can",cat:"food",col:"#d98a3a",d:"Syrup and all."},
  snacks:{n:"Chips and candy",sn:"Snacks",w:.2,v:4,eat:{food:10},sz:[1,1],ic:"bag",cat:"food"},
  cereal:{n:"Box of cereal",sn:"Cereal",w:.4,v:5,eat:{food:20},sz:[1,2],ic:"box",cat:"food"},
  berries:{n:"Wild berries",sn:"Berries",w:.05,v:2,eat:{food:6,water:2},sz:[1,1],st:8,ic:"berries",cat:"food"},
  raw_meat:{n:"Raw venison",sn:"Venison",w:.6,v:5,eat:{food:12,sick:.3},cook:"cooked_meat",sz:[2,1],ic:"meat",cat:"food",d:"Cook it first unless you want to spend tomorrow sick."},
  cooked_meat:{n:"Cooked venison",sn:"Cooked",w:.5,v:8,eat:{food:32},sz:[2,1],ic:"meat",cat:"food",col:"#8a4a2a"},
  raw_fish:{n:"Raw fish",sn:"Fish",w:.3,v:3,eat:{food:8,sick:.25},sz:[2,1],ic:"fish",cat:"food"},
  cooked_fish:{n:"Grilled fish",sn:"Grilled",w:.3,v:6,eat:{food:22},sz:[2,1],ic:"fish",cat:"food",col:"#a8743a"},
  jerky:{n:"Camp ration",sn:"Ration",w:.2,v:6,eat:{food:22},sz:[1,1],st:3,ic:"ration",cat:"food"},
  water_bottle:{n:"Bottle of water",sn:"Water",w:1,v:6,drink:40,after:"empty_bottle",sz:[1,2],ic:"bottle",cat:"drink"},
  empty_bottle:{n:"Empty bottle",sn:"Empty",w:.1,v:1,sz:[1,2],ic:"bottle",cat:"drink",col:"#5a6670",d:"Fill it at the river. Boil it before you trust it."},
  river_water:{n:"Bottle of river water",sn:"River",w:1,v:2,drink:35,after:"empty_bottle",sick:.25,sz:[1,2],ic:"bottle",cat:"drink",col:"#7a8a5a"},
  boiled_water:{n:"Bottle of boiled water",sn:"Boiled",w:1,v:4,drink:35,after:"empty_bottle",sz:[1,2],ic:"bottle",cat:"drink",col:"#8ab0c0"},
  whiskey:{n:"Bottle of whiskey",sn:"Whiskey",w:1,v:12,mood:10,drink:5,uses:3,sz:[1,2],ic:"whiskey",cat:"drink",d:"Drink it, or pour it on a wound. It works on both, in different ways."},
  bandage:{n:"Bandage",sn:"Bandage",w:.1,v:6,med:"dress",sz:[1,1],st:3,ic:"bandage",cat:"med",d:"A clean roll of gauze. Wrap it snug over a wound to stop the bleeding and keep the dirt out."},
  dirty_bandage:{n:"Bloody bandage",sn:"Bloody",w:.1,v:0,sz:[1,1],st:3,ic:"bandage",cat:"med",col:"#a86a58",d:"Used. Boil it over a fire and it's clean enough to use again."},
  painkillers:{n:"Painkillers",sn:"Pills",w:.1,v:10,med:"pain",sz:[1,1],ic:"pills",cat:"med",d:"Two of these take the edge off for about six hours."},
  antibiotics:{n:"Antibiotics",sn:"Abx",w:.1,v:25,med:"abx",sz:[1,1],ic:"pills",cat:"med",col:"#c8d0e0",d:"One course knocks down a fever and fights an infected wound. Worth more than a gun to some people."},
  rubbing_alcohol:{n:"Rubbing alcohol",sn:"Alcohol",w:.3,v:8,uses:5,med:"clean",sz:[1,2],ic:"alcohol",cat:"med",d:"Stings like nothing else. Clean a wound with it so it doesn't turn."},
  suture_kit:{n:"Suture kit",sn:"Sutures",w:.1,v:16,uses:4,med:"stitch",sz:[1,1],ic:"suture",cat:"med",d:"Curved needles and surgical thread in sterile packets. Enough to close a few cuts."},
  sewing_kit:{n:"Needle and thread",sn:"Sewing",w:.05,v:4,uses:3,med:"stitch",sz:[1,1],ic:"sewing",cat:"misc",d:"A sewing needle and a spool of thread. It'll close a cut if it has to. Clean the wound first."},
  splint:{n:"Splint",sn:"Splint",w:.4,v:6,med:"splint",sz:[3,1],ic:"splint",cat:"med",d:"Two flat boards and some strapping. Holds a broken bone still while it knits."},
  herbs:{n:"Yarrow and plantain",sn:"Herbs",w:.05,v:3,sz:[1,1],st:8,ic:"herbs",cat:"med"},
  poultice:{n:"Herb poultice",sn:"Poultice",w:.1,v:6,med:"dress",sz:[1,1],st:3,ic:"bandage",cat:"med",col:"#7a9a5a",d:"Crushed yarrow and plantain in a cloth. Binds over a wound and draws the dirt out."},
  wood:{n:"Wood",sn:"Wood",w:1.5,v:1,sz:[3,1],st:4,ic:"wood",cat:"mat"},
  stone:{n:"Stone",sn:"Stone",w:2,v:1,sz:[1,1],st:3,ic:"stone",cat:"mat"},
  nails:{n:"Box of nails",sn:"Nails",w:.5,v:4,sz:[1,1],st:2,ic:"nails",cat:"mat"},
  scrap:{n:"Scrap metal",sn:"Scrap",w:1,v:3,sz:[2,1],st:2,ic:"scrap",cat:"mat"},
  cloth:{n:"Cloth",sn:"Cloth",w:.2,v:2,sz:[1,1],st:5,ic:"cloth",cat:"mat"},
  rope:{n:"Rope",sn:"Rope",w:.4,v:4,sz:[1,2],ic:"rope",cat:"mat"},
  duct_tape:{n:"Duct tape",sn:"Tape",w:.2,v:6,sz:[1,1],ic:"tape",cat:"mat"},
  ammo:{n:"Pistol rounds",sn:"Ammo",w:.02,v:3,sz:[1,1],st:30,ic:"ammo",cat:"tool"},
  lighter:{n:"Lighter",sn:"Lighter",w:.05,v:8,sz:[1,1],ic:"lighter",cat:"tool"},
  flashlight:{n:"Flashlight",sn:"Light",w:.3,v:10,sz:[2,1],ic:"flashlight",cat:"tool",d:"Lights the way at night. The dead see it too."},
  cigarettes:{n:"Pack of cigarettes",sn:"Smokes",w:.05,v:9,mood:6,sz:[1,1],st:2,ic:"cigs",cat:"misc"},
  cards:{n:"Deck of cards",sn:"Cards",w:.1,v:3,sz:[1,1],ic:"cards",cat:"misc",d:"Soft at the corners from years of use. Good for getting through a long night with someone."},
  photo:{n:"Family photo",sn:"Photo",w:0,v:0,sz:[1,1],ic:"photo",cat:"misc",d:"Everyone in it is smiling."},
  radio:{n:"Hand-crank radio",sn:"Radio",w:.6,v:18,sz:[2,2],ic:"radio",cat:"tool"},
  book_firstaid:{n:"First aid manual",sn:"1st Aid",w:.4,v:12,read:"medic",sz:[2,2],ic:"book",cat:"misc",col:"#a83a32"},
  book_wild:{n:"Field guide to wild plants",sn:"Wild",w:.4,v:12,read:"survive",sz:[2,2],ic:"book",cat:"misc",col:"#4a7a3a"},
  book_build:{n:"Carpentry for beginners",sn:"Carpntry",w:.5,v:12,read:"build",sz:[2,2],ic:"book",cat:"misc",col:"#a8743a"},
  book_mech:{n:"Small engine repair",sn:"Engines",w:.5,v:12,read:"craft",sz:[2,2],ic:"book",cat:"misc",col:"#3a5a8a"},
  // weapons
  kitchen_knife:{n:"Kitchen knife",sn:"Knife",w:.3,v:5,slot:"weapon",side:true,dmg:4,dur:35,tool:"knife",fix:{duct_tape:1},sz:[2,1],ic:"knife",cat:"weapon"},
  hunting_knife:{n:"Hunting knife",sn:"H.Knife",w:.4,v:14,slot:"weapon",side:true,dmg:6,dur:90,tool:"knife",fix:{duct_tape:1},sz:[2,1],ic:"knife",cat:"weapon",col:"#5a4a3a"},
  bat:{n:"Baseball bat",sn:"Bat",w:1,v:10,slot:"weapon",dmg:6,dur:50,fix:{duct_tape:1},sz:[4,1],ic:"bat",cat:"weapon"},
  nail_bat:{n:"Nail bat",sn:"N.Bat",w:1.2,v:14,slot:"weapon",dmg:9,dur:45,fix:{nails:1},sz:[4,1],ic:"nailbat",cat:"weapon"},
  golf_club:{n:"Golf club",sn:"Golf",w:.8,v:6,slot:"weapon",dmg:5,dur:30,fix:{duct_tape:1},sz:[4,1],ic:"golf",cat:"weapon"},
  crowbar:{n:"Crowbar",sn:"Crowbar",w:1.5,v:14,slot:"weapon",dmg:7,dur:140,tool:"pry",fix:{duct_tape:1},sz:[3,1],ic:"crowbar",cat:"weapon",d:"Opens locked cabinets and doors. Also heads."},
  axe:{n:"Fire axe",sn:"Axe",w:2,v:18,slot:"weapon",dmg:10,dur:80,tool:"axe",fix:{duct_tape:1,wood:1},sz:[4,2],ic:"axe",cat:"weapon"},
  hatchet:{n:"Makeshift hatchet",sn:"Hatchet",w:1.2,v:7,slot:"weapon",side:true,dmg:6,dur:35,tool:"axe",fix:{rope:1},sz:[3,1],ic:"hatchet",cat:"weapon"},
  machete:{n:"Machete",sn:"Machete",w:1,v:16,slot:"weapon",side:true,dmg:8,dur:100,tool:"knife",fix:{duct_tape:1},sz:[4,1],ic:"machete",cat:"weapon"},
  hammer:{n:"Claw hammer",sn:"Hammer",w:.8,v:8,slot:"weapon",side:true,dmg:4,dur:120,tool:"hammer",fix:{duct_tape:1},sz:[2,1],ic:"hammer",cat:"weapon"},
  iv_pole:{n:"IV stand",sn:"IV",w:2.2,v:1,slot:"weapon",dmg:3,dur:30,reach:2.2,sz:[5,1],ic:"ivpole",cat:"weapon",d:"Wheels, a hook and a long steel pole. Clumsy, but it keeps them at arm's length."},
  pipe:{n:"Lead pipe",sn:"Pipe",w:1.6,v:5,slot:"weapon",dmg:5,dur:150,fix:{duct_tape:1},sz:[4,1],ic:"pipe",cat:"weapon"},
  spear:{n:"Kitchen-knife spear",sn:"Spear",w:1.2,v:8,slot:"weapon",dmg:6,dur:30,reach:2.4,fix:{duct_tape:1},sz:[5,1],ic:"spear",cat:"weapon"},
  club:{n:"Wooden club",sn:"Club",w:1,v:2,slot:"weapon",dmg:3,dur:25,fix:{wood:1},sz:[3,1],ic:"club",cat:"weapon"},
  pistol:{n:"Service pistol",sn:"Pistol",w:1,v:40,slot:"weapon",side:true,dmg:20,dur:300,gun:true,fix:{scrap:1},sz:[2,1],ic:"pistol",cat:"weapon",d:"Loud. Every shot rings the dinner bell for a block."},
  // clothes
  gown:{n:"Hospital gown",sn:"Gown",w:.2,v:0,slot:"body",warm:0,dur:40,fix:{cloth:1},sz:[2,2],ic:"shirt",cat:"cloth",col:"#9ab8c8",d:"Thin cotton that ties at the back. It was all you had on when you woke up."},
  tshirt:{n:"T-shirt",sn:"Tee",w:.2,v:1,slot:"body",warm:1,dur:80,fix:{cloth:1},sz:[2,2],ic:"shirt",cat:"cloth",col:"#b8b4a8"},
  hoodie:{n:"Hoodie",sn:"Hoodie",w:.6,v:4,slot:"body",warm:3,dur:100,fix:{cloth:1},sz:[2,2],ic:"hoodie",cat:"cloth",col:"#6a6e74",grid:[2,1]},
  flannel:{n:"Flannel shirt",sn:"Flannel",w:.4,v:3,slot:"body",warm:2,dur:100,fix:{cloth:1},sz:[2,2],ic:"shirt",cat:"cloth",col:"#8a3a32",grid:[1,1]},
  jeans:{n:"Jeans",sn:"Jeans",w:.8,v:4,slot:"legs",warm:2,armor:1,dur:150,fix:{cloth:1},sz:[2,2],ic:"pants",cat:"cloth",col:"#3a4a6a",grid:[4,1]},
  work_pants:{n:"Canvas work pants",sn:"Cargo",w:.9,v:6,slot:"legs",warm:2,armor:2,dur:180,fix:{cloth:1},sz:[2,2],ic:"pants",cat:"cloth",col:"#8a7a5a",grid:[4,2],d:"Cargo pockets, double knees."},
  sneakers:{n:"Sneakers",sn:"Sneakers",w:.6,v:3,slot:"feet",warm:1,dur:120,fix:{duct_tape:1},sz:[2,2],ic:"shoes",cat:"cloth",col:"#d8d4c8"},
  boots:{n:"Work boots",sn:"Boots",w:1.2,v:10,slot:"feet",warm:2,armor:1,dur:250,fix:{duct_tape:1},sz:[2,2],ic:"shoes",cat:"cloth",col:"#5a3a22"},
  leather_jacket:{n:"Leather jacket",sn:"Leather",w:1.5,v:18,slot:"outer",warm:3,armor:3,dur:200,fix:{duct_tape:1},sz:[3,3],ic:"jacket",cat:"cloth",col:"#3a2a20",grid:[2,2]},
  winter_coat:{n:"Winter coat",sn:"Coat",w:1.6,v:16,slot:"outer",warm:6,armor:1,dur:150,fix:{cloth:2},sz:[3,3],ic:"jacket",cat:"cloth",col:"#2f3e58",grid:[3,2]},
  padded_jacket:{n:"Taped padded jacket",sn:"Padded",w:1.4,v:8,slot:"outer",warm:2,armor:2,dur:80,fix:{duct_tape:1},sz:[3,3],ic:"jacket",cat:"cloth",col:"#6a6a52",grid:[2,1]},
  riot_vest:{n:"Riot vest",sn:"Riot",w:3,v:30,slot:"outer",armor:6,dur:200,fix:{duct_tape:2},sz:[3,3],ic:"vest",cat:"cloth",col:"#262a2e",grid:[2,2],d:"Teeth don't get through this."},
  beanie:{n:"Beanie",sn:"Beanie",w:.1,v:2,slot:"head",warm:2,dur:100,fix:{cloth:1},sz:[1,1],ic:"beanie",cat:"cloth",col:"#7a3a3a"},
  helmet:{n:"Motorcycle helmet",sn:"Helmet",w:1.2,v:14,slot:"head",warm:1,armor:3,dur:200,fix:{duct_tape:1},sz:[2,2],ic:"helmet",cat:"cloth",col:"#2a2a2e"},
  gloves:{n:"Work gloves",sn:"Gloves",w:.2,v:4,slot:"hands",warm:1,armor:1,dur:100,fix:{cloth:1},sz:[1,1],ic:"gloves",cat:"cloth",col:"#a8844a"},
  // bags and rigs
  belongings:{n:"Patient belongings bag",sn:"Bag",w:.1,v:1,slot:"back",dur:40,fix:{cloth:1},sz:[2,2],ic:"pbag",cat:"bag",col:"#e4e4dc",grid:[3,3],d:"A white plastic bag with a drawstring. Someone wrote your name on it in marker."},
  backpack:{n:"School backpack",sn:"Pack",w:.6,v:10,slot:"back",dur:200,fix:{cloth:1},sz:[3,3],ic:"backpack",cat:"bag",col:"#3a5a8a",grid:[4,4]},
  hiking_pack:{n:"Hiking pack",sn:"Hiker",w:1.2,v:22,slot:"back",dur:300,fix:{cloth:1},sz:[4,4],ic:"backpack",cat:"bag",col:"#5a6a3a",grid:[5,6]},
  duffel:{n:"Duffel bag",sn:"Duffel",w:1,v:16,slot:"back",dur:200,fix:{cloth:1},sz:[4,3],ic:"duffel",cat:"bag",col:"#2a2a2a",grid:[6,4]},
  tool_belt:{n:"Tool belt",sn:"Belt",w:.5,v:10,slot:"rig",dur:200,fix:{cloth:1},sz:[2,2],ic:"belt",cat:"bag",col:"#8a6a3a",grid:[3,2]},
  fishing_vest:{n:"Fishing vest",sn:"F.Vest",w:.6,v:14,slot:"rig",dur:200,fix:{cloth:1},sz:[3,3],ic:"vest",cat:"bag",col:"#6a7a4a",grid:[4,3]},
};
for(const [k,it] of Object.entries(ITEMS)){it.id=k;if(!it.sz)it.sz=[1,1];if(!it.st)it.st=1}
const SLOTS=["head","outer","body","hands","legs","feet","rig","back","weapon","side"];
const SLOTNAME={head:"Head",outer:"Jacket",body:"Shirt",hands:"Hands",legs:"Pants",feet:"Feet",rig:"Rig",back:"Bag",weapon:"In hand",side:"Belt"};
const RECIPES=[
  {id:"bandage",need:{cloth:2},h:.25},{id:"rope",need:{cloth:3},h:.5},
  {id:"club",need:{wood:2},h:.5,tool:"knife"},
  {id:"spear",need:{wood:2,duct_tape:1,kitchen_knife:1},h:.75},
  {id:"nail_bat",need:{bat:1,nails:1},h:.5,tool:"hammer"},
  {id:"hatchet",need:{stone:1,wood:1,rope:1},h:1},
  {id:"padded_jacket",need:{cloth:4,duct_tape:2},h:1.5},
  {id:"poultice",need:{herbs:2,cloth:1},h:.25},
  {id:"splint",need:{wood:1,cloth:1},h:.25},{key:"boil_bandage",id:"bandage",need:{dirty_bandage:1},h:.25,at:"fire",verb:"Boil a bandage clean"},
  {id:"cooked_meat",need:{raw_meat:1},h:.5,at:"fire"},{id:"cooked_fish",need:{raw_fish:1},h:.5,at:"fire"},
  {id:"boiled_water",need:{river_water:1},h:.5,at:"fire"},
];
const BLD={
  tent:{n:"Tent",ab:"TN",c:"#8f8a6a",cost:{cloth:4,wood:3},work:8,house:3,d:"Sleeps 3."},
  cabin:{n:"Cabin",ab:"CB",c:"#a1804f",cost:{wood:30,nails:8},work:40,house:6,d:"Sleeps 6, stays warm."},
  hut:{n:"Your own shelter",ab:"YS",c:"#d6b77e",cost:{wood:10,cloth:4},work:12,house:2,own:true,d:"A door that closes. Sleep warmer and safer."},
  firepit:{n:"Fire pit",ab:"FP",c:"#e48a3f",cost:{stone:6,wood:2},work:4,d:"Cooking, boiling water, warmth."},
  storehouse:{n:"Storehouse",ab:"ST",c:"#a9c38d",cost:{wood:20,nails:6},work:24,d:"Halves food spoilage."},
  smokehouse:{n:"Smokehouse",ab:"SM",c:"#8fae76",cost:{wood:14,stone:6},work:20,d:"Food keeps much longer."},
  wall:{n:"Wall section",ab:"WL",c:"#7d6a52",cost:{wood:10,nails:3},work:10,def:4,d:"+4 defense."},
  tower:{n:"Watchtower",ab:"WT",c:"#6f8c9e",cost:{wood:16,nails:6},work:20,def:6,d:"+6 defense, early warning."},
  workshop:{n:"Workshop",ab:"WS",c:"#86aac4",cost:{wood:18,nails:10,scrap:6},work:28,d:"Crafters make tools; repairs are cheaper."},
  infirmary:{n:"Infirmary",ab:"IN",c:"#e9e4d7",cost:{wood:16,cloth:8},work:24,d:"The injured and sick heal faster."},
  garden:{n:"Garden plot",ab:"GD",c:"#6fae5e",cost:{wood:4,cloth:1},work:10,d:"Grows food until hard frost."},
  catcher:{n:"Rain catcher",ab:"RC",c:"#5e8fb0",cost:{wood:6,cloth:4},work:10,d:"Collects clean water."},
  well:{n:"Well",ab:"WE",c:"#4f7f9e",cost:{stone:16},work:24,d:"Clean water every day."},
  hall:{n:"Meeting hall",ab:"MH",c:"#d07a3a",cost:{stone:10,wood:12},work:20,d:"Lifts morale; disputes get talked out."},
  nursery:{n:"Nursery",ab:"NU",c:"#e0b0a0",cost:{wood:14,cloth:6},work:20,d:"Children are safer and happier."},
};
const STOCK_KEYS=["food","water","wood","stone","nails","scrap","cloth","meds","ammo"];
const DEPOSIT={canned_food:["food",4],canned_fruit:["food",3],snacks:["food",1],cereal:["food",3],berries:["food",.5],raw_meat:["food",3],cooked_meat:["food",4],raw_fish:["food",2],cooked_fish:["food",3],jerky:["food",3],
  water_bottle:["water",4],boiled_water:["water",3],river_water:["water",2],wood:["wood",1],stone:["stone",1],nails:["nails",1],scrap:["scrap",1],cloth:["cloth",1],rope:["cloth",2],bandage:["meds",.5],painkillers:["meds",1],antibiotics:["meds",3],rubbing_alcohol:["meds",1],suture_kit:["meds",2],splint:["meds",.5],poultice:["meds",.5],ammo:["ammo",1]};
const WITHDRAW={food:["jerky",3],water:["water_bottle",4],wood:["wood",1],stone:["stone",1],nails:["nails",1],scrap:["scrap",1],cloth:["cloth",1],meds:["bandage",1],ammo:["ammo",1]};

// ================= containers and what's in them =================
// every piece of furniture that opens has a container type. g = its grid. Loot is rolled the first time someone opens it.
const CONT={
  nightstand:{n:"Nightstand",g:[2,2]},dresser:{n:"Dresser",g:[4,3]},closet:{n:"Wardrobe",g:[6,5]},bookshelf:{n:"Bookshelf",g:[4,2]},
  cupboard:{n:"Kitchen cupboard",g:[4,3]},fridge:{n:"Fridge",g:[3,4]},medicine:{n:"Bathroom cabinet",g:[3,2]},desk:{n:"Desk drawers",g:[3,2]},
  workbench:{n:"Workbench",g:[5,3]},toolshelf:{n:"Tool shelf",g:[4,3]},
  sh_grocery:{n:"Grocery shelf",g:[6,3]},sh_pharmacy:{n:"Pharmacy shelf",g:[5,3]},sh_hardware:{n:"Hardware shelf",g:[6,3]},sh_gas:{n:"Store shelf",g:[5,3]},sh_storage:{n:"Storage shelf",g:[6,3]},
  register:{n:"Checkout counter",g:[3,2]},pharmacab:{n:"Pharmacy cabinet",g:[4,3],locked:true},medcab:{n:"Medical cabinet",g:[4,3]},
  dinercounter:{n:"Diner counter",g:[4,2]},dinerkitchen:{n:"Kitchen shelves",g:[5,3]},barshelf:{n:"Bar shelf",g:[5,2]},
  copdesk:{n:"Desk",g:[3,2]},locker:{n:"Locker",g:[3,4]},armory:{n:"Gun cabinet",g:[4,4],locked:true},
  schoollocker:{n:"School locker",g:[2,4]},gymbin:{n:"Equipment bin",g:[4,4]},vestry:{n:"Vestry cabinet",g:[4,3]},pantry:{n:"Pantry shelves",g:[5,3]},
  crate:{n:"Crate",g:[4,3]},cabinshelf:{n:"Cabin shelf",g:[4,3]},filing:{n:"Filing cabinet",g:[2,3]},car:{n:"Car",g:[6,4]},libshelf:{n:"Library shelf",g:[5,2]},
};
const BOOKS=["book_firstaid","book_wild","book_build","book_mech"];
const LOOT={
  nightstand:[["sewing_kit",.05],["cards",.08],["flashlight",.15],["painkillers",.15],["lighter",.1],["cigarettes",.12],["photo",.12],["whiskey",.04],["pistol",.02],["ammo",.05,2,6],["bandage",.08]],
  dresser:[["sewing_kit",.12],["tshirt",.35],["hoodie",.2],["flannel",.2],["jeans",.2],["work_pants",.06],["beanie",.15],["gloves",.12],["cloth",.35,1,3],["photo",.05]],
  closet:[["winter_coat",.15],["hoodie",.15],["leather_jacket",.05],["sneakers",.2],["boots",.1],["backpack",.14],["duffel",.05],["bat",.07],["golf_club",.06],["flashlight",.08]],
  bookshelf:[["book_firstaid",.07],["book_wild",.07],["book_build",.06],["book_mech",.05],["photo",.1],["radio",.03]],
  cupboard:[["canned_food",.5,1,2],["canned_fruit",.25],["cereal",.3],["snacks",.3],["kitchen_knife",.25],["empty_bottle",.2],["lighter",.12],["duct_tape",.08],["cloth",.1]],
  fridge:[["water_bottle",.45,1,2],["canned_fruit",.15],["snacks",.1],["whiskey",.05],["raw_meat",.15]],
  medicine:[["bandage",.4,1,2],["painkillers",.35],["rubbing_alcohol",.25],["antibiotics",.05],["cloth",.15]],
  desk:[["cards",.08],["duct_tape",.12],["flashlight",.08],["snacks",.12],["lighter",.08],["radio",.03],["book_firstaid",.02],["book_mech",.02]],
  workbench:[["hammer",.25],["nails",.35,1,2],["duct_tape",.25],["scrap",.3,1,2],["rope",.15],["crowbar",.08],["gloves",.12],["flashlight",.1],["tool_belt",.06],["axe",.04]],
  toolshelf:[["nails",.3],["duct_tape",.25],["rope",.2],["scrap",.3],["wood",.2,1,2],["hammer",.1],["hatchet",.03],["work_pants",.05],["gloves",.1],["fishing_vest",.03]],
  sh_grocery:[["canned_food",.7,1,3],["canned_fruit",.5,1,2],["snacks",.6,1,2],["cereal",.45],["water_bottle",.55,1,3],["jerky",.2]],
  sh_pharmacy:[["painkillers",.55,1,2],["bandage",.55,1,3],["rubbing_alcohol",.4],["suture_kit",.06],["splint",.06],["snacks",.25],["antibiotics",.08],["water_bottle",.2],["cigarettes",.15]],
  sh_hardware:[["nails",.6,1,2],["duct_tape",.5],["rope",.4],["hammer",.25],["crowbar",.18],["axe",.1],["machete",.08],["gloves",.3],["flashlight",.25],["work_pants",.15],["boots",.12],["tool_belt",.15],["scrap",.2]],
  sh_gas:[["snacks",.7,1,3],["water_bottle",.55,1,2],["cigarettes",.35],["lighter",.35],["duct_tape",.2],["jerky",.3],["canned_food",.2]],
  sh_storage:[["canned_food",.3,1,2],["water_bottle",.3],["cloth",.3,1,2],["scrap",.2],["nails",.15],["duct_tape",.1],["rope",.1],["empty_bottle",.2]],
  register:[["cigarettes",.4],["lighter",.3],["snacks",.3],["bat",.06]],
  pharmacab:[["antibiotics",.75,1,3],["painkillers",.5,1,2],["bandage",.4,1,2],["rubbing_alcohol",.3],["suture_kit",.2]],
  medcab:[["bandage",.6,1,3],["painkillers",.45],["antibiotics",.2],["rubbing_alcohol",.4],["suture_kit",.3],["splint",.25],["cloth",.3]],
  dinercounter:[["snacks",.3],["kitchen_knife",.3],["lighter",.25],["cigarettes",.15],["water_bottle",.2]],
  dinerkitchen:[["canned_food",.55,1,3],["kitchen_knife",.4],["water_bottle",.3],["cereal",.2],["raw_meat",.1],["lighter",.2],["empty_bottle",.2]],
  barshelf:[["cards",.3],["whiskey",.65,1,2],["cigarettes",.4],["snacks",.3],["lighter",.3]],
  copdesk:[["ammo",.2,2,8],["flashlight",.25],["bandage",.15],["snacks",.15],["duct_tape",.1]],
  locker:[["flashlight",.3],["boots",.15],["gloves",.15],["helmet",.08],["snacks",.2],["bandage",.15],["splint",.04],["hoodie",.12],["ammo",.1,2,6]],
  armory:[["pistol",.5],["ammo",.75,6,14],["riot_vest",.3],["helmet",.3],["flashlight",.3]],
  schoollocker:[["snacks",.35],["backpack",.2],["hoodie",.15],["cloth",.25],["bat",.05],["water_bottle",.15],["book_wild",.03]],
  gymbin:[["bat",.35],["cloth",.2],["water_bottle",.2],["sneakers",.15],["backpack",.1],["helmet",.05]],
  vestry:[["water_bottle",.35,1,2],["canned_food",.3],["cloth",.35,1,2],["bandage",.25],["sewing_kit",.15]],
  pantry:[["canned_food",.45,1,3],["water_bottle",.4,1,2],["cereal",.25],["snacks",.25],["canned_fruit",.2]],
  crate:[["wood",.35,1,3],["nails",.25],["rope",.25],["scrap",.3,1,2],["cloth",.2],["hammer",.08],["axe",.05],["gloves",.1]],
  cabinshelf:[["canned_food",.3],["water_bottle",.25],["rope",.3],["hatchet",.12],["hunting_knife",.1],["ammo",.08,2,6],["lighter",.25],["winter_coat",.08],["book_wild",.08],["fishing_vest",.06]],
  filing:[["snacks",.1],["duct_tape",.1],["cigarettes",.08],["ammo",.03,1,4]],
  car:[["water_bottle",.3],["snacks",.3],["cloth",.3],["scrap",.4,1,2],["duct_tape",.15],["flashlight",.1],["hiking_pack",.05],["ammo",.05,2,6],["cigarettes",.1],["golf_club",.03],["hunting_knife",.03]],
  libshelf:[["book_firstaid",.12],["book_wild",.12],["book_build",.1],["book_mech",.1],["snacks",.05]],
};

// ================= people data =================
// first names the way a small town on the Colorado plains has them: by the years people were born
const NOW_YEAR=2025;
const NAMES={
  F:[[0,["Linda","Barbara","Patricia","Carol","Sandra","Nancy","Sharon","Judy","Donna","Shirley","Joyce","Peggy","Darlene","Bonnie","Gloria","Marilyn","Betty","Doris","Phyllis","Connie","Loretta","Wanda","Arlene","Bev"]],
     [1960,["Debbie","Karen","Lisa","Susan","Kim","Tammy","Lori","Cindy","Teresa","Michelle","Julie","Denise","Tina","Pam","Laura","Sherry","Rhonda","Dawn","Robin","Terri","Vicki","Kathy","Jackie","Shelly"]],
     [1976,["Jennifer","Amy","Melissa","Heather","Angela","Nicole","Stephanie","Jessica","Amanda","Sarah","Rebecca","Crystal","Misty","April","Shannon","Erin","Kristen","Megan","Rachel","Leah","Christy","Tara","Jamie","Holly"]],
     [1991,["Ashley","Brittany","Kayla","Taylor","Hannah","Alyssa","Brianna","Emily","Morgan","Courtney","Sierra","Haley","Kelsey","Chelsea","Lauren","Samantha","Jordan","Mackenzie","Paige","Shelby","Destiny","Jenna","Abby","Mariah"]],
     [2006,["Madison","Emma","Olivia","Abigail","Chloe","Addison","Brooklyn","Peyton","Avery","Kaylee","Makayla","Natalie","Lily","Riley","Savannah","Kylie","Ava","Allison","Sydney","Aubrey","Jada","Kenzie"]],
     [2014,["Harper","Ella","Aria","Scarlett","Nora","Hazel","Paisley","Everly","Stella","Willow","Aurora","Piper","Kinsley","Ellie","Ivy","Lucy","Josie","Charlotte","Emmy","Rosie","Remi","Ruby"]]],
  M:[[0,["Gary","Dennis","Larry","Ronald","Donald","Jerry","Roger","Wayne","Dale","Gene","Harold","Ralph","Earl","Floyd","Lyle","Vernon","Glen","Leroy","Duane","Carl","Ken","Jim","Bill","Bob","Don","Frank"]],
     [1960,["Mike","Steve","Mark","Jeff","Tim","Scott","Greg","Kevin","Rick","Randy","Todd","Craig","Doug","Brian","Tony","Dave","Kurt","Rusty","Curtis","Troy","Darrell","Keith","Russ","Rod"]],
     [1976,["Jason","Chris","Matt","Josh","Ryan","Justin","Brandon","Travis","Jeremy","Nathan","Aaron","Adam","Shane","Cody","Dustin","Jared","Derek","Eric","Brad","Chad","Corey","Seth","Luke","Ben"]],
     [1991,["Tyler","Austin","Kyle","Dylan","Zach","Jacob","Trevor","Hunter","Connor","Garrett","Colton","Brett","Tanner","Wyatt","Caleb","Evan","Devin","Blake","Chase","Jake","Bryce","Kaden","Spencer","Mitch"]],
     [2006,["Ethan","Jayden","Aiden","Mason","Brayden","Gavin","Carter","Landon","Owen","Noah","Elijah","Hayden","Bentley","Jaxon","Isaac","Gabe","Levi","Ryder","Jace","Easton","Tucker","Bryson"]],
     [2014,["Liam","Grayson","Lincoln","Hudson","Brody","Asher","Colt","Beau","Maverick","Rhett","Waylon","Jase","Ryker","Theo","Archer","Max","Sawyer","Ezra","Bennett","Wes","Gus","Remy"]]]};
// Hispanic families have been on the plains for generations; their names follow the years too
const HNAMES={
  F:[[0,["Rosa","Dolores","Lupe","Yolanda","Irene","Josie","Lorraine","Patsy","Esther","Della","Viola","Ofelia"]],
     [1966,["Maria","Veronica","Monica","Yvonne","Lorena","Sylvia","Theresa","Anita","Bernadette","Diana"]],
     [1981,["Vanessa","Erica","Gabriela","Adriana","Elena","Angelica","Leticia","Marisa","Raquel","Celeste"]],
     [1996,["Daniela","Jasmine","Alexis","Andrea","Priscilla","Karina","Natalia","Selena","Bianca","Marissa"]],
     [2008,["Isabella","Sofia","Camila","Valeria","Ximena","Lucia","Mia","Gianna","Luna","Elena"]]],
  M:[[0,["Ruben","Gilbert","Ernie","Arturo","Manuel","Rudy","Eddie","Alfonso","Benny","Fidel","Orlando","Tony"]],
     [1966,["Carlos","Javier","Ramon","Ricardo","Gerald","Victor","Raymond","Joe","Larry","Frank"]],
     [1981,["Adrian","Marco","Luis","Mario","Daniel","Roberto","Andres","Jesse","Eric","Anthony"]],
     [1996,["Diego","Alejandro","Isaiah","Angel","Jonathan","Christian","Josue","Kevin","Brandon","Julian"]],
     [2008,["Mateo","Santiago","Gael","Elias","Nico","Leo","Adrian","Sebastian","Dominic","Josiah"]]]};
const SUR=["Miller","Johnson","Smith","Brown","Davis","Wilson","Anderson","Taylor","Moore","Jackson","Martin","Thompson","White","Harris","Clark","Lewis","Walker","Hall","Allen","Young","King","Wright","Scott","Green","Baker","Adams","Nelson","Hill","Campbell","Phillips","Turner","Parker","Collins","Stewart","Morris","Murphy","Cook","Rogers","Cooper","Peterson","Reed","Bailey","Bell","Kelly","Ward","Cox","Brooks","Gray","Hughes","Price","Sanders","Myers","Ross","Foster","Powell","Jenkins","Russell","Sullivan","Fisher","Coleman","Simmons","Patterson","Hayes","Wallace","Graham","Reynolds","Schmidt","Weber","Hoffman","Becker","Olson","Larson","Hansen","Jensen","Lund","Pruitt","Beasley","Mercer","Dobbs","Brennan","Kowalski","Washington","Freeman","Banks","Dawson","Boyd","Shaw","Whitaker"];
const HSUR=["Garcia","Martinez","Lopez","Sanchez","Romero","Trujillo","Vigil","Archuleta","Maestas","Gallegos","Montoya","Chavez","Valdez","Medina","Sandoval","Lucero","Gonzales","Herrera"];
// a first name that fits the year someone was born, and nobody else in town already has
function firstName(sex,age,hisp){const T=(hisp?HNAMES:NAMES)[sex==="F"?"F":"M"];const yr=NOW_YEAR-age;let i=0;for(let k=0;k<T.length;k++)if(yr>=T[k][0])i=k;
  if(rf()<.2)i=clamp(i+(rf()<.5?-1:1),0,T.length-1);
  const used=new Set(((typeof S!=="undefined"&&S&&S.people)||[]).map(q=>q.name));if(typeof S!=="undefined"&&S&&S.player)used.add(S.player.name.split(" ")[0]);
  const pool=T[i][1].filter(n=>!used.has(n));return pick(pool.length?pool:T[i][1])}
// what part of life someone is in
function ageBand(a){return a<6?"little":a<13?"kid":a<18?"teen":a<30?"young":a<50?"adult":a<65?"older":"elder"}
// lists below hold plain strings (grown-ups, 18 and up) or [text, youngest, oldest]
// a fourth entry says what life it needs: "kids" (has children), "single" (no partner now)
function fitsLife(x,p){const c=x[3];if(!c||!p)return true;if(c==="kids")return!!(p.kids&&p.kids.length);if(c==="single")return!p.partner;return true}
function lifeFill(t,sex){return t.replace("{spouse}",sex==="F"?"husband":"wife").replace("{Spouse}",sex==="F"?"He":"She").replace("{spouse2}",sex==="F"?"husband":"wife")}
function forAge(L,age,R,p){const ok=L.filter(x=>typeof x==="string"?age>=18:age>=x[1]&&age<=x[2]&&fitsLife(x,p));const c=ok.length?ok:L.filter(x=>typeof x==="string");const x=R?pick2(c,R):pick(c);return typeof x==="string"?x:x[0]}
const kidL=(...a)=>a.map(x=>[x,0,12]),teenL=(...a)=>a.map(x=>[x,13,17]),oldL=(...a)=>a.map(x=>[x,52,99]);
const HOMETOWN=[`right here in ${TOWN}`,`right here in ${TOWN}`,"Hugo","Ashby","Burlington","Kit Carson","the Springs","Denver","a farm outside Genoa","Kansas","a trailer park outside Limon","Pueblo","up north near Sterling"];
const FEARS=["the dark","getting bitten and not knowing it","being alone","fire","crowds",["forgetting my kids' faces",28,99,"kids"],"losing my mind out here","that we'll turn on each other before the dead get us","dying somewhere nobody finds me","the sound they make",
  ...kidL("the monsters","the dark","my mom not coming back","the noises at night","getting lost","the basement","being left behind"),
  ...teenL("freezing up when it counts","turning into one of them","everyone I know being dead already","getting left behind because I'm 'just a kid'","never getting to grow up","being the one who has to shoot somebody I know"),
  ...oldL("being a burden","outliving everybody","my heart giving out with no pills left","falling and not being able to get up","dying before I see my grandkids again")];
const HOPES=["a working radio","finding my sister","a hot shower",["a real orchard one day",28,99],"the army coming back","a cure",["my kid growing up safe",25,70,"kids"],"a quiet place by the water",["seeing my mom again",18,50],"a winter where nobody dies",
  ...kidL("finding my dog","going home","pancakes, real ones","seeing my friends from school again","a puppy","the monsters going away forever"),
  ["getting my license someday",13,15],...teenL("finding my best friend","a phone that works, just for one day","seeing the ocean","graduating. Seriously. I'd even go to school","a real shower and my own room again"),
  ...oldL("seeing my grandkids again","dying in my own bed, old","one more good harvest","a full church on Sunday again","the young ones making it")];
const SECRETS=["I left someone behind to save myself","I've been hoarding painkillers",["I was on parole when it started",21,70],"I don't believe we'll last the winter","I've killed a living person since this started",["I still talk to my {spouse} at night. Out loud. {Spouse}'s been dead six years",35,99,"single"],"I can't swim",["I used to drink. Bad. I'm scared I'll start again",24,90],"I stole from the hospital before it all went down",["I'm not who I said I was",25,80],
  ...kidL("I broke the window at school and never told","I'm scared all the time but I don't say it","I took candy from the store when nobody was looking","I saw one of them eat a dog and I didn't tell anybody","I still sleep with a nightlight. When there's power","I don't remember what my dad's voice sounds like anymore"),
  ...teenL("I snuck out the night it started. That's why I wasn't home when it happened","I took my dad's truck before I had a license, scratched it, and blamed somebody else","I've been stealing cigarettes","I hated my stepdad. When he didn't come back I was kind of relieved","I cry every night where nobody can hear","I failed algebra and hid the report card. Funny that it mattered"),
  ...oldL("my heart's a lot worse than I let on","I buried money in the backyard in '99 and never told anybody","I never forgave my brother, and now I can't","I've been giving my food to the kids and saying I already ate","I was going to sell the house and move to Arizona. I hadn't told a soul")];
const LIKES=["black coffee","old country songs","card games","fishing","drawing","fixing engines","reading anything I can find","bad jokes","the stars out here","baseball","football on Sunday","cooking for a crowd",
  ...kidL("dinosaurs","drawing","cartoons","building blocks","bugs","riding my bike","horses","video games","soccer","frogs"),
  ...teenL("music, loud","video games","skateboarding","volleyball","my sketchbook","basketball","horror movies","rodeo","my phone, honestly","driving around with the windows down"),
  ...oldL("crossword puzzles","old westerns","my garden","gospel music","a good card game","polka records","the morning coffee crowd at the diner")];
const STYLES={plain:"plainly",crude:"crude, and swears a lot",formal:"formally and carefully",nervous:"nervously, and trails off",warm:"warmly",dry:"dry, and keeps it short",preachy:"in scripture and old sayings",joker:"in jokes, to cope",folksy:"old-fashioned and folksy",
  sullen:"in shrugs and short answers",chatty:"a mile a minute",tough:"tougher than they feel",shy:"quietly, when at all"};
// which ways of talking fit which part of life
const STYLE_AGE={teen:{sullen:3,chatty:2,tough:2,shy:2,joker:1,nervous:1},young:{plain:3,crude:2,nervous:2,warm:2,dry:2,joker:2,formal:1,preachy:.5},
  adult:{plain:3,crude:2,formal:1.5,nervous:1.5,warm:2,dry:2,preachy:1,joker:1.5},older:{plain:2,crude:1,formal:1.5,warm:1.5,dry:2,preachy:1.2,joker:1,folksy:2.5},elder:{plain:1.5,formal:1.5,dry:1.5,preachy:1.5,warm:1,joker:.7,folksy:3.5,crude:.5}};
function styleFor(age){const b=ageBand(age);if(b==="little"||b==="kid")return"kid";const W=STYLE_AGE[b];let r=rf()*Object.values(W).reduce((a,c)=>a+c,0);for(const [k,w] of Object.entries(W)){r-=w;if(r<=0)return k}return"plain"}
// how each speaking style should sound, for the conversation writer
const VOICE={plain:"Plain-spoken and direct. Ordinary words, no flourishes, says what they mean.",
  crude:"Crude and blunt. Swears casually (damn, hell, shit), short punchy sentences, scoffs at softness, but has a code.",
  formal:"Formal and precise. Full sentences, few contractions, chooses words carefully, rarely jokes.",
  nervous:"Nervous. Hesitates, trails off with '...', second-guesses themself, apologizes too much, talks faster when scared.",
  warm:"Warm and kind. Notices how people are doing, asks real questions, worries out loud, soft but not a pushover. Doesn't use pet names.",
  folksy:"Old-fashioned and folksy, from another generation. Now and then calls younger people 'hon', 'sweetheart' or 'kiddo', has a saying for everything, remembers how things used to be.",
  dry:"Dry and laconic. Says as little as possible, deadpan humor, understatement, long pauses.",
  preachy:"Earnest and spiritual. Reaches for scripture and old sayings, believes them, and means them kindly.",
  joker:"Jokes to cope. Gallows humor and wisecracks, deflects pain with a punchline, turns serious only when it really matters.",
  sullen:"Guarded with adults. Short answers, shrugs, 'I guess', 'whatever', 'it's fine'. Opens up a little when treated like an equal instead of a little kid.",
  chatty:"Talks fast when nervous. Says 'like', 'literally' and 'honestly', jumps between topics, overshares, then gets embarrassed about it.",
  tough:"Acts tougher than they feel. Talks big, swears a little to sound older, hates being treated like a kid, and the fear shows through the cracks.",
  shy:"Shy. Quiet, few words, looks away, answers a question with a question, warms up slowly and is fiercely loyal once they do.",
  kid:"A child. Simple words, blunt honesty, sudden topic changes, scared but curious, says exactly what they think."};
// how someone's age shows in the way they talk, so nobody sounds older or younger than they are
function ageVoice(p){const a=p.age,n=p.name;const pet=p.style==="folksy"||p.seed==="june";
  if(a<6)return`${n} is ${a}, a little kid. Very short, simple sentences. Mixes up words, asks for Mommy or Daddy, doesn't understand death, gets distracted by small things. Never uses grown-up words, sarcasm, or pet names.`;
  if(a<13)return`${n} is ${a}, a kid, and talks exactly like a real ${a}-year-old: simple words, blunt questions, sudden topic changes, brags about small things, gets scared and pretends not to be. Says "Mom", "Dad", "grown-ups", "that's not fair". Never sounds like an adult, never gives advice, never calls anyone "hon" or "sweetheart".`;
  if(a<18)return`${n} is ${a}, a teenager, and talks like a real teenager from a small American town, not like an adult: casual, a bit awkward or guarded with grown-ups, some slang but not a parody of it, hates being talked down to, can be sarcastic, embarrassed or defensive, still a kid underneath. Never calls anyone "hon", "sweetheart" or "dear", and never lectures.`;
  if(a<30)return`${n} is ${a}, a young adult. Casual and direct, a little irreverent, talks like people in their twenties do. Might say "man" or "dude" to a friend. Never calls anyone "hon" or "sweetheart".`;
  if(a<50)return`${n} is ${a}, a grown adult with grown-up worries: work, money, family. Talks like a normal adult. Never calls anyone "hon" or "sweetheart".`;
  if(a<65)return`${n} is ${a}. Has seen a lot and talks with some weight; references from the eighties and nineties.${pet?` Now and then calls someone younger "hon", "sweetheart" or "kiddo".`:" Doesn't use pet names."}`;
  return`${n} is ${a}, one of the old-timers. Speaks from a long life, a little slower, remembers how things used to be in town decades ago.${pet?` Now and then calls younger people "hon", "sweetheart", "son" or "young lady".`:""}`}
const QUIRKS=[["starts with 'Look,' when they mean business",16,99],"calls people by their last name",["answers hard questions with a question",13,99],["uses farming and weather sayings",35,99],["talks about food when nervous",0,99],["counts things under their breath",0,99],
  ["adds 'I'm just saying' after anything blunt",13,99],["hums old songs while they think",30,99],["never says goodbye, just nods",16,99],["over-explains, then apologizes for over-explaining",16,99],["keeps bringing up their dog, who ran off on the first night",0,99],
  ["uses sports metaphors for everything",16,99],["speaks slowly and picks every word",25,99],["laughs at the wrong moments",13,99],["quotes their late mother",40,99],"uses big words slightly wrong",["gives people nicknames",13,99],"trails off mid-sentence when a memory hits",
  "asks people where they're from",["is blunt about money and debts, even now",25,99],["keeps asking if anyone's heard the radio",25,99],["makes lists out loud",16,99],["says 'honest to God' a lot",25,99],"rubs the back of their neck and says 'yeah, no'",
  ...kidL("collects rocks","loves dinosaurs and knows all their names","asks 'why' about everything","pretends to be a superhero","draws on everything","is scared of the dark","knows every kind of car and truck","tells long stories about their friends at school","won't go anywhere without a stuffed rabbit","wants to be a vet"),
  ...teenL("says 'literally' and 'honestly' a lot","shrugs before answering anything","gets defensive when adults talk down to them","still checks their dead phone out of habit","tries to sound older than they are","calls everything 'sketchy'","makes fun of adults' music","rolls their eyes, then helps anyway"),
  ...oldL("tells stories that start 'back in '82'","complains about their knees, then outworks everybody","remembers everyone's parents' names","calls the dead 'those poor souls'","won't let anyone waste a crumb of food","still winds their watch every morning")];
const VALUES=["family above everything","fairness","staying alive no matter what","their faith","loyalty to people who earn it","keeping kids safe","doing things the right way","freedom: nobody tells them what to do","being useful","honesty, even when it hurts","protecting the weak","getting even",
  ...kidL("their mom and dad","being brave like a superhero","their pets","being good so nothing bad happens","their best friend"),
  ...teenL("their friends","not being treated like a kid","fairness","their family, even if they'd never say so","proving themselves")];
const FLAWS=["stubborn as a post","jealous","can't admit when they're wrong",["drinks to forget",21,99],"hoards supplies","lies to avoid trouble","quick to blame others","panics under pressure","holds grudges","talks too much","reckless","suspicious of everyone","self-pitying","bossy",
  ...kidL("whines when they're tired","runs off without telling anyone","tells fibs to stay out of trouble","throws tantrums when they're scared","won't eat anything green"),
  ...teenL("reckless; thinks they can't die","moody","lies to adults by reflex","shows off when people are watching","shuts down instead of asking for help","does things without thinking")];
const HOOKS=[["was supposed to drive to the city for a job interview that week",22,45],["coached Little League for six years",30,65],["finished paying off the house last spring",40,75],["was saving up to open a bakery",22,55],["got divorced in the spring and still wears the ring",28,65,"single"],
  ["had moved to Limon two months before it started and barely knew anyone",19,70],["grew up in foster homes and never stayed anywhere long",18,45],["volunteered at the food pantry every Saturday",18,99],["has been sober for three years",25,70],["lost a brother in a wreck on Highway 24",18,99],
  ["won the county fair pie contest twice",30,99],["was two weeks from retiring",58,68],["has a daughter at college in the city who never answered the phone",42,62],["served overseas and doesn't talk about it",24,80],["had just bought a motorcycle, the first thing just for themself in years",30,65],
  ["owes money to the wrong people",20,60],["was going to propose that weekend",20,40,"single"],["raised goats until the drought",30,99],["writes country songs nobody has heard",18,60],["sings in the church choir",18,99],["ran the Friday night poker game",30,85],
  ["was the high school's star pitcher twenty years ago",35,45],["knows every back road in the county",25,99],["dropped out of community college in the spring",19,24],["was saving for a truck",18,26],["had just moved back in with their parents",20,28],
  ["worked nights at the gas station and slept all day",18,30],["was planning to leave this town for good in the fall",18,24],
  ...kidL("lost a tooth the day before it started","was going to have a birthday party with a bouncy castle","has a goldfish named Pickles at home","was going to be a pumpkin in the school play","just learned to ride a bike without training wheels"),
  ...teenL("made the volleyball team in the fall","had a crush on someone in homeroom and never said anything","was grounded the night it started","was raising a 4-H steer for the county fair"),["was supposed to take the driver's test that week",16,17],["worked part-time at the Dairy Barn on Main",15,17],
  ["buried their {spouse2} two winters ago",60,99,"single"],...oldL("has six grandkids scattered across three states","played the organ at church for thirty years","drove a school bus for twenty-two years and knows every kid in town by name"),["served in Vietnam and came home to a town that didn't want to hear about it",72,99]];
const MORNING=["was making pancakes","was running late for work","was arguing with the TV news","was fixing a leaky sink","was out for a jog",["was hungover",21,60],"was walking the dog","was on the phone with family in the city","was feeding the chickens","was opening up at work","was still asleep",["was driving the kids to school when the buses stopped",25,60,"kids"],
  ...kidL("was eating cereal in front of cartoons","was getting ready for school and couldn't find a shoe","was still asleep","was playing in the yard"),
  ...teenL("slept through three alarms","was at early practice","was on the school bus","was sneaking home from a friend's house"),
  ...oldL("was reading the paper","was at the diner with the coffee crowd","was watching the morning news")];
// what someone looks like, in words other parts of the game can read
function lookFor(sex,age){const F=sex==="F";
  const build=age<13?pick(["small for their age","skinny","tall for their age","round-cheeked","short"]):age<18?pick(["lanky","tall","short","skinny","athletic","stocky"]):pick(age>60?["tall","short","heavyset","wiry","stooped","slight","broad-shouldered"]:["tall","short","heavyset","wiry","broad-shouldered","slight","athletic"]);
  const feat=age<13?pick(["freckles","a missing front tooth","scabbed knees","a cowlick","red hair","blond hair","brown curls",...(F?["a ponytail","pigtails"]:["a buzz cut"])]):
    age<18?pick(["braces","freckles","black hair","red hair","blond hair","brown curls","acne",...(F?["a ponytail","dyed hair"]:["a buzz cut","a ball cap"])]):
    age<50?pick(["black hair","red hair","blond hair","brown curls","glasses","a sunburn","tattoos",...(F?["a ponytail","long hair"]:["a beard","a shaved head","a mustache"])]):
    pick(["gray hair","gray hair","glasses","a sunburn","reading glasses on a cord","weathered hands",...(F?["short gray curls"]:["a beard","a shaved head","a mustache"])]);
  return build+", "+feat}
const JOBS={
  nurse:{n:"Nurse",work:"clinic",sk:{medic:4}},doctor:{n:"Doctor",work:"clinic",sk:{medic:5}},pharmacist:{n:"Pharmacist",work:"pharmacy",sk:{medic:3}},
  clerk:{n:"Store clerk",work:"grocery",sk:{scavenge:2}},hardware:{n:"Hardware clerk",work:"hardware",sk:{craft:2,build:2}},cook:{n:"Line cook",work:"diner",sk:{survive:2}},
  waitress:{n:"Waiter",work:"diner",sk:{speak:2}},deputy:{n:"Sheriff's deputy",work:"sheriff",sk:{fight:3,speak:1}},bartender:{n:"Bartender",work:"bar",sk:{speak:3}},
  attendant:{n:"Gas station clerk",work:"gas",sk:{scavenge:2}},mechanic:{n:"Mechanic",work:"gas",sk:{craft:4}},teacher:{n:"Teacher",work:"schoolbldg",sk:{speak:3}},
  librarian:{n:"Librarian",work:"library",sk:{speak:2,medic:1}},farmhand:{n:"Farmhand",work:"farm",sk:{survive:3,build:1}},farmer:{n:"Farmer",work:"farm",sk:{survive:3,build:2}},
  pastor:{n:"Pastor",work:"church",sk:{speak:4,medic:1}},quarry:{n:"Quarry worker",work:"quarry",sk:{build:2,fight:2}},foreman:{n:"Quarry foreman",work:"quarry",sk:{build:3,fight:3}},
  trucker:{n:"Truck driver",work:"road",sk:{survive:1,fight:1}},electrician:{n:"Electrician",work:"home",sk:{craft:3}},retiree:{n:"Retiree",work:"home",sk:{}},
  unemployed:{n:"Between jobs",work:"home",sk:{scavenge:2}},student:{n:"Student",work:"schoolbldg",sk:{scavenge:1}},kid:{n:"Kid",work:"schoolbldg",sk:{}},vet:{n:"Veterinarian",work:"home",sk:{medic:3}},
  soldier:{n:"National Guard (on leave)",work:"home",sk:{fight:4}},hunter:{n:"Hunting guide",work:"woods",sk:{survive:4,fight:1}},
};
// group jobs after the outbreak
const ROLES={
  scavenger:{n:"Scavenger",act:"scavenging in town",loc:"town"},hunter:{n:"Hunter",act:"hunting",loc:"woods"},forager:{n:"Forager",act:"foraging",loc:"fields"},
  fisher:{n:"Fisher",act:"fishing",loc:"river"},farmer:{n:"Farmer",act:"working the garden",loc:"home"},woodcutter:{n:"Woodcutter",act:"cutting wood",loc:"woods"},
  builder:{n:"Builder",act:"building",loc:"home"},guard:{n:"Guard",act:"on watch",loc:"home"},medic:{n:"Medic",act:"tending the sick",loc:"home"},
  cook:{n:"Cook",act:"cooking",loc:"home"},crafter:{n:"Fixer",act:"fixing things",loc:"home"},kid:{n:"Kid",act:"playing",loc:"home"},elder:{n:"Elder",act:"keeping watch over the kids",loc:"home"},
};
const IPH={water_bottle:["a bottle of water","bottles of water"],canned_food:["a can of beans","cans of beans"],canned_fruit:["a can of peaches","cans of peaches"],duct_tape:["a roll of duct tape","rolls of duct tape"],cigarettes:["a pack of cigarettes","packs of cigarettes"],bat:["a baseball bat","baseball bats"],antibiotics:["some antibiotics","courses of antibiotics"],ammo:["some pistol rounds","pistol rounds"],snacks:["some chips and candy","bags of chips"],berries:["some berries","handfuls of berries"],herbs:["some yarrow and plantain","bunches of herbs"],nails:["a box of nails","boxes of nails"],cloth:["some cloth","pieces of cloth"],wood:["some wood","pieces of wood"],stone:["a stone","stones"],scrap:["some scrap metal","pieces of scrap"],painkillers:["some painkillers","bottles of painkillers"]};
function itemPhrase(k,n=1){const o=IPH[k];const nm=(ITEMS[k]?.n||k).toLowerCase();const NUM=["","one","two","three","four","five","six"];
  if(n>1)return `${NUM[n]||n} ${o?o[1]:/s$/.test(nm)?nm:nm+"s"}`;return o?o[0]:(/^[aeiou]/.test(nm)?"an ":"a ")+nm}
const SAYBIO={marisol:"I'm a nurse. I was on nights at the hospital, until there wasn't a hospital anymore.",walt:"This land's been in my family four generations. I've worked it forty years.",grace:"I've been the pastor at St. Brigid's for eleven years. A church should be a lifeboat. That's what I believe.",ray:"I'm the only deputy this town has left. The sheriff drove to the city and never came back.",cole:"I ran the crew up at the quarry. Half this town owes me money.",nadia:"I'm the town doctor. I treated the first patient at the hospital. I saw what it does."};
// hand-written people at the heart of the story
const SEEDP={
  walt:{quirk:"uses farming and weather sayings, and calls younger people 'kid'",values:"family, the land, doing things right",flaw:"stubborn; would rather die on the farm than leave it",hook:"His son Danny lives in the city and hasn't answered the phone since the first night.",secret:"He keeps one shotgun shell in his shirt pocket, for himself, if it comes to that."},
  june:{quirk:"calls everyone 'hon' and feeds people before they can say no",values:"family and kindness",flaw:"hides how scared she is until it spills over",hook:"She was putting up peach preserves this morning when the sirens started.",secret:"She has stopped taking her heart pills to save them for Eli's sake."},
  grace:{quirk:"answers fear with a verse and anger with patience",values:"faith, and an open door for anyone",flaw:"trusts too easily, even people who will use her",hook:"She was writing Sunday's sermon about strangers at the gate.",secret:"Since the first night she has been praying and hearing nothing back. She hasn't told a soul."},
  ray:{quirk:"talks like he's writing a report and calls people 'folks'",values:"order, the law, keeping people together",flaw:"needs to be in control and hates being questioned",hook:"The sheriff drove to the city on the first morning and never came back, so it's all on him now.",secret:"When the hospital went bad he ran, and a nurse he could have pulled out didn't make it."},
  cole:{quirk:"talks about everything as a debt that has to be paid",values:"strength, and loyalty to his crew",flaw:"a violent temper and a long memory",hook:"He ran the quarry crew for twelve years and half the town owes him money.",secret:"He owes forty thousand dollars to men in the city, and part of him is glad they're probably dead."},
  marisol:{quirk:"talks to people the way she talked to patients, steady and plain, and hums when she's nervous",values:"looking after people, even strangers, even now",flaw:"can't forgive herself for anyone she left behind",hook:"She was the night nurse on the ward where a patient lay in a coma for weeks. She talked to them every shift in case they could hear.",secret:"When the ward fell she locked that patient's door from outside and ran. She has told herself every night since that it was to protect them."},
  nadia:{quirk:"describes horrors in calm clinical terms, then goes quiet",values:"knowledge, and doing no harm",flaw:"cold and distant when people need warmth",hook:"She treated the first patient at the hospital and watched him die and get up again.",secret:"She signed that first patient's chart 'cardiac arrest' because she didn't know what else to write, and she still has the chart."},
};
