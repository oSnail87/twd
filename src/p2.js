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

// ================= the map =================
const WB={x0:-130,x1:130,z0:-100,z1:100};
const PLACES={
  farm:{n:"Holloway Farm",r:[[-95,-30,-45,15]],site:{c:[-70,0],gw:10,gh:6},d:"Walt Holloway's family farm: a white farmhouse, a red barn, fenced pasture and a long view of the road. Defensible, if you have the people."},
  church:{n:"St. Brigid's Church",r:[[-30,58,10,94]],site:{c:[-10,82],gw:10,gh:4},d:"A stone church and parish hall south of the river, with a walled cemetery. Pastor Grace keeps the doors open to anyone."},
  quarry:{n:"Redstone Quarry",r:[[60,-96,122,-58]],site:{c:[86,-72],gw:10,gh:6},d:"A gravel pit carved into red rock, with one road in. Hard to reach, harder to attack."},
  school:{n:"Millbrook High",r:[[58,6,90,36]],site:{c:[74,28],gw:8,gh:3},d:"The high school: chain-link fence, a gym full of cots, a cafeteria that ran out of food fast."},
  town:{n:"Millbrook",r:[[0,-46,92,38]],d:"A town of two thousand people. Main Street, Birch Street, Elm Street. Shops, houses, a clinic. Everything you need, and everyone who didn't make it."},
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
function randIn(k,m=2){const P=PLACES[k];if(!P.r.length)return{x:rnd(-60,60),z:rnd(-60,60)};for(let i=0;i<30;i++){const r=pick(P.r);const x=r[0]+m+rf()*(r[2]-r[0]-2*m),z=r[1]+m+rf()*(r[3]-r[1]-2*m);if(regionAt(x,z)===k&&!solidAt(x,z,.6))return{x,z}}const r=P.r[0];return{x:(r[0]+r[2])/2,z:(r[1]+r[3])/2}}
function inRiver(x,z){return z>=42&&z<=52}
function onBridge(x,z){return x>=23&&x<=33&&inRiver(x,z)}
function onFord(x,z){return x>=-62&&x<=-52&&inRiver(x,z)}

// buildings: [id,name,type,x,z,w,d]
const BUILDINGS=[];
(function(){
  const add=(id,n,type,x,z,w,d,extra={})=>BUILDINGS.push({id,n,type,x,z,w,d,...extra});
  add("clinic","Millbrook Clinic","clinic",17,-14,10,8);
  add("pharmacy","Rx Pharmacy","pharmacy",40,-14,8,7);
  add("hardware","Ellis Hardware","hardware",52,-14,10,8);
  add("grocery","Food Mart","grocery",66,-14,12,9);
  add("diner","Rosa's Diner","diner",40,4,8,6);
  add("sheriff","Sheriff's Office","sheriff",52,4,9,7);
  add("bar","The Low Water","bar",64,4,8,6);
  add("gas","Kwik Gas","gas",40,-44,9,6);
  add("library","Millbrook Library","library",80,-14,8,8);
  add("schoolbldg","Millbrook High School","school",74,14,24,9,{site:"school",house:30});
  add("farmhouse","Holloway farmhouse","farmhouse",-80,-21,10,8,{site:"farm",house:8});
  add("barn","The red barn","barn",-58,-22,12,9,{site:"farm",house:10});
  add("churchbldg","St. Brigid's","church",-12,66,10,12,{site:"church",house:12});
  add("hall","Parish hall","hall",4,66,8,8,{site:"church",house:8});
  add("qoffice","Quarry office","qoffice",106,-90,8,6,{site:"quarry",house:6});
  add("qsheds","Equipment sheds","qsheds",72,-90,12,5,{site:"quarry",house:8});
  const streets={"-36":"Birch St","-25":"Birch St","16":"Elm St","27":"Elm St"};
  let n=1;
  for(const z of [-36,-25])for(const x of [42,54,66,78,88])add("h"+n,`${n*4+10} ${streets[z]}`,"house",x,z,7,6),n++;
  for(const z of [16,27])for(const x of [40,50])add("h"+n,`${n*4+10} ${streets[z]}`,"house",x,z,7,6),n++;
  for(const z of [-40,-22,6,17,28])for(const x of [5,15])add("h"+n,`${n*3+2} Mill Rd`,"house",x,z,6,6),n++;
  add("trailer1","Caretaker's trailer","house",-40,37,6,4,{site:"mill",house:3});add("millruin","The old sawmill","mill",-26,38,10,5,{site:"mill",house:3});
  add("trailer2","The hunting cabin","house",-115,-60,6,5,{site:"lodge",house:4});
})();
const BMAP=Object.fromEntries(BUILDINGS.map(b=>[b.id,b]));
const HOUSES=BUILDINGS.filter(b=>b.type==="house");
function solidAt(x,z,r=.4){for(const b of BUILDINGS)if(Math.abs(x-b.x)<b.w/2+r&&Math.abs(z-b.z)<b.d/2+r)return b;return null}
function nearBuilding(x,z,r=2.2){let best=null,bd=1e9;for(const b of BUILDINGS){const dx=Math.max(0,Math.abs(x-b.x)-b.w/2),dz=Math.max(0,Math.abs(z-b.z)-b.d/2);const d=Math.hypot(dx,dz);if(d<r&&d<bd){bd=d;best=b}}return best}
const CARS=[];(function(){let s=7;const r=()=>{s=(s*16807)%2147483647;return s/2147483647};for(let i=0;i<16;i++){const z=-95+r()*190;if(inRiver(0,z))continue;CARS.push({id:"car"+i,n:pick(["Abandoned sedan","Pickup truck","Minivan","Station wagon","Delivery van","Hatchback"]),type:"car",x:24.5+r()*7,z,rot:(r()-.5)*.8})}})();

// ================= items =================
const ITEMS={
  canned_food:{n:"Canned beans",w:.5,v:8,eat:{food:30}},canned_fruit:{n:"Canned peaches",w:.5,v:7,eat:{food:18,water:10}},
  snacks:{n:"Chips and candy",w:.2,v:4,eat:{food:10}},cereal:{n:"Box of cereal",w:.4,v:5,eat:{food:20}},
  berries:{n:"Wild berries",w:.1,v:2,eat:{food:6,water:2}},raw_meat:{n:"Raw venison",w:.6,v:5,eat:{food:12,sick:.3},cook:"cooked_meat"},
  cooked_meat:{n:"Cooked venison",w:.5,v:8,eat:{food:32}},raw_fish:{n:"Raw fish",w:.3,v:3,eat:{food:8,sick:.25}},cooked_fish:{n:"Grilled fish",w:.3,v:6,eat:{food:22}},
  jerky:{n:"Camp ration",w:.3,v:6,eat:{food:22}},
  water_bottle:{n:"Bottle of water",w:1,v:6,drink:40,after:"empty_bottle"},empty_bottle:{n:"Empty bottle",w:.1,v:1},
  river_water:{n:"Bottle of river water",w:1,v:2,drink:35,after:"empty_bottle",sick:.25},boiled_water:{n:"Bottle of boiled water",w:1,v:4,drink:35,after:"empty_bottle"},
  bandage:{n:"Bandage",w:.1,v:6,heal:15,stopBleed:true},painkillers:{n:"Painkillers",w:.1,v:10,heal:8},antibiotics:{n:"Antibiotics",w:.1,v:25,cure:true},
  herbs:{n:"Yarrow and plantain",w:.1,v:3},poultice:{n:"Herb poultice",w:.1,v:6,heal:12},
  wood:{n:"Wood",w:1.5,v:1},stone:{n:"Stone",w:2,v:1},nails:{n:"Box of nails",w:.5,v:4},scrap:{n:"Scrap metal",w:1,v:3},cloth:{n:"Cloth",w:.2,v:2},
  rope:{n:"Rope",w:.4,v:4},duct_tape:{n:"Duct tape",w:.2,v:6},ammo:{n:"Pistol rounds",w:.02,v:3},
  lighter:{n:"Lighter",w:.05,v:8},flashlight:{n:"Flashlight",w:.3,v:10},cigarettes:{n:"Pack of cigarettes",w:.05,v:9,mood:6},whiskey:{n:"Bottle of whiskey",w:1,v:12,mood:10,drink:5},
  photo:{n:"Family photo",w:0,v:0},radio:{n:"Hand-crank radio",w:.6,v:18},
  // gear
  kitchen_knife:{n:"Kitchen knife",w:.3,v:5,slot:"weapon",dmg:4,dur:35,tool:"knife",fix:{duct_tape:1}},
  hunting_knife:{n:"Hunting knife",w:.4,v:14,slot:"weapon",dmg:6,dur:90,tool:"knife",fix:{duct_tape:1}},
  bat:{n:"Baseball bat",w:1,v:10,slot:"weapon",dmg:6,dur:50,fix:{duct_tape:1}},
  nail_bat:{n:"Nail bat",w:1.2,v:14,slot:"weapon",dmg:9,dur:45,fix:{nails:1}},
  golf_club:{n:"Golf club",w:.8,v:6,slot:"weapon",dmg:5,dur:30,fix:{duct_tape:1}},
  crowbar:{n:"Crowbar",w:1.5,v:14,slot:"weapon",dmg:7,dur:140,tool:"pry",fix:{duct_tape:1}},
  axe:{n:"Fire axe",w:2,v:18,slot:"weapon",dmg:10,dur:80,tool:"axe",fix:{duct_tape:1,wood:1}},
  hatchet:{n:"Makeshift hatchet",w:1.2,v:7,slot:"weapon",dmg:6,dur:35,tool:"axe",fix:{rope:1}},
  machete:{n:"Machete",w:1,v:16,slot:"weapon",dmg:8,dur:100,tool:"knife",fix:{duct_tape:1}},
  hammer:{n:"Claw hammer",w:.8,v:8,slot:"weapon",dmg:4,dur:120,tool:"hammer",fix:{duct_tape:1}},
  pipe:{n:"Lead pipe",w:1.6,v:5,slot:"weapon",dmg:5,dur:150,fix:{duct_tape:1}},
  spear:{n:"Kitchen-knife spear",w:1.2,v:8,slot:"weapon",dmg:6,dur:30,reach:2.4,fix:{duct_tape:1}},
  club:{n:"Wooden club",w:1,v:2,slot:"weapon",dmg:3,dur:25,fix:{wood:1}},
  pistol:{n:"Service pistol",w:1,v:40,slot:"weapon",dmg:20,dur:300,gun:true,fix:{scrap:1}},
  tshirt:{n:"T-shirt",w:.2,v:1,slot:"body",warm:1,dur:80,fix:{cloth:1}},
  hoodie:{n:"Hoodie",w:.6,v:4,slot:"body",warm:3,dur:100,fix:{cloth:1}},
  flannel:{n:"Flannel shirt",w:.4,v:3,slot:"body",warm:2,dur:100,fix:{cloth:1}},
  jeans:{n:"Jeans",w:.8,v:4,slot:"legs",warm:2,armor:1,dur:150,fix:{cloth:1}},
  work_pants:{n:"Canvas work pants",w:.9,v:6,slot:"legs",warm:2,armor:2,dur:180,fix:{cloth:1}},
  sneakers:{n:"Sneakers",w:.6,v:3,slot:"feet",warm:1,dur:120,fix:{duct_tape:1}},
  boots:{n:"Work boots",w:1.2,v:10,slot:"feet",warm:2,armor:1,dur:250,fix:{duct_tape:1}},
  leather_jacket:{n:"Leather jacket",w:1.5,v:18,slot:"outer",warm:3,armor:3,dur:200,fix:{duct_tape:1}},
  winter_coat:{n:"Winter coat",w:1.6,v:16,slot:"outer",warm:6,armor:1,dur:150,fix:{cloth:2}},
  padded_jacket:{n:"Taped padded jacket",w:1.4,v:8,slot:"outer",warm:2,armor:2,dur:80,fix:{duct_tape:1}},
  riot_vest:{n:"Riot vest",w:3,v:30,slot:"outer",armor:6,dur:200,fix:{duct_tape:2}},
  beanie:{n:"Beanie",w:.1,v:2,slot:"head",warm:2,dur:100,fix:{cloth:1}},
  helmet:{n:"Motorcycle helmet",w:1.2,v:14,slot:"head",warm:1,armor:3,dur:200,fix:{duct_tape:1}},
  gloves:{n:"Work gloves",w:.2,v:4,slot:"hands",warm:1,armor:1,dur:100,fix:{cloth:1}},
  backpack:{n:"School backpack",w:.6,v:10,slot:"back",carry:10,dur:200,fix:{cloth:1}},
  hiking_pack:{n:"Hiking pack",w:1.2,v:22,slot:"back",carry:18,dur:300,fix:{cloth:1}},
};
const SLOTS=["head","body","outer","hands","legs","feet","back","weapon"];
const RECIPES=[
  {id:"bandage",need:{cloth:2},h:.25},{id:"rope",need:{cloth:3},h:.5},
  {id:"club",need:{wood:2},h:.5,tool:"knife"},
  {id:"spear",need:{wood:2,duct_tape:1,kitchen_knife:1},h:.75},
  {id:"nail_bat",need:{bat:1,nails:1},h:.5,tool:"hammer"},
  {id:"hatchet",need:{stone:1,wood:1,rope:1},h:1},
  {id:"padded_jacket",need:{cloth:4,duct_tape:2},h:1.5},
  {id:"poultice",need:{herbs:2,cloth:1},h:.25},
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
const DEPOSIT={canned_food:["food",4],canned_fruit:["food",3],snacks:["food",1],cereal:["food",3],berries:["food",1],raw_meat:["food",3],cooked_meat:["food",4],raw_fish:["food",2],cooked_fish:["food",3],jerky:["food",3],
  water_bottle:["water",4],boiled_water:["water",3],river_water:["water",2],wood:["wood",1],stone:["stone",1],nails:["nails",1],scrap:["scrap",1],cloth:["cloth",1],rope:["cloth",2],bandage:["meds",.5],painkillers:["meds",1],antibiotics:["meds",3],ammo:["ammo",1]};
const WITHDRAW={food:["jerky",3],water:["water_bottle",4],wood:["wood",1],stone:["stone",1],nails:["nails",1],scrap:["scrap",1],cloth:["cloth",1],meds:["bandage",1],ammo:["ammo",1]};
const LOOT={
  house:[["canned_food",.45,1,2],["canned_fruit",.3],["snacks",.4],["cereal",.25],["water_bottle",.5,1,3],["bandage",.25],["painkillers",.15],["kitchen_knife",.3],["hoodie",.15],["flannel",.15],["jeans",.12],["beanie",.12],["winter_coat",.06],["sneakers",.1],["cloth",.4,1,3],["lighter",.15],["flashlight",.1],["cigarettes",.12],["whiskey",.08],["golf_club",.05],["bat",.06],["backpack",.07],["hammer",.06],["duct_tape",.1],["pistol",.015],["ammo",.04,2,8]],
  clinic:[["bandage",.7,1,3],["painkillers",.5,1,2],["antibiotics",.35],["cloth",.4,1,3]],
  pharmacy:[["painkillers",.7,1,3],["antibiotics",.5,1,2],["bandage",.6,1,3],["snacks",.3]],
  hardware:[["nails",.8,1,3],["duct_tape",.6,1,2],["hammer",.4],["crowbar",.3],["axe",.2],["work_gloves",0],["gloves",.4],["rope",.5,1,2],["machete",.12],["flashlight",.3],["work_pants",.25],["boots",.2]],
  grocery:[["canned_food",.8,2,4],["canned_fruit",.6,1,3],["snacks",.7,1,3],["cereal",.5,1,2],["water_bottle",.7,2,4]],
  diner:[["canned_food",.5,1,2],["kitchen_knife",.6],["snacks",.4],["water_bottle",.4,1,2],["lighter",.3]],
  sheriff:[["pistol",.25],["ammo",.6,4,12],["riot_vest",.2],["helmet",.15],["flashlight",.5],["bandage",.3]],
  bar:[["whiskey",.7,1,2],["cigarettes",.5,1,2],["snacks",.4],["bat",.15],["lighter",.4]],
  gas:[["snacks",.8,1,3],["water_bottle",.6,1,3],["cigarettes",.4],["lighter",.4],["duct_tape",.3],["scrap",.4,1,2]],
  library:[["cloth",.3],["snacks",.2],["backpack",.2],["radio",.08]],
  school:[["snacks",.5],["backpack",.4],["cloth",.4,1,2],["bandage",.3],["bat",.25]],
  mill:[["wood",.7,2,4],["nails",.4,1,2],["scrap",.4,1,2],["rope",.25],["hatchet",.06]],
  car:[["water_bottle",.3],["snacks",.3],["cloth",.3],["scrap",.5,1,2],["duct_tape",.15],["flashlight",.1],["hiking_pack",.04],["ammo",.05,2,6],["cigarettes",.1]],
};

// ================= people data =================
const FIRST_F=["Anya","Bea","Calla","Dana","Esme","Faye","Greer","Hana","Ines","June","Kenna","Lila","Maren","Nadia","Opal","Pia","Quinn","Rhea","Sadie","Tamsin","Uma","Vera","Wren","Yara","Zoe","Mika","Noor","Imani","Selah","Rosa","Thea","Ada","Leni","Priya","Marisol","Keiko","Ife","Jolie","Nell","Ruth","Darlene","Bonnie","Carmen","Gloria","Hattie","Luz","Tess","Cora","Mae","Lorna"];
const FIRST_M=["Arlo","Bram","Cal","Dev","Emil","Finn","Gage","Hollis","Ivan","Jem","Kofi","Lenny","Mateo","Nico","Owen","Pax","Rafe","Silas","Teo","Vic","Wade","Yusuf","Zeke","Remy","Idris","Joss","Milo","Otto","Sami","Tariq","Benji","Dmitri","Ezra","Hugo","Kai","Luka","Rowan","Abe","Bud","Clint","Earl","Floyd","Gus","Hank","Lyle","Marty","Ned","Royce","Tom","Wes"];
const SUR=["Abara","Bellweather","Castell","Dunmore","Eskew","Faraday","Greaves","Halvorsen","Ibarra","Juarez","Kowal","Lindqvist","Marsh","Nakamura","Okafor","Pryce","Quill","Rask","Solberg","Tran","Underhill","Vance","Whitlow","Yilmaz","Zeller","Achebe","Brennan","Corso","Delacroix","Engel","Foss","Gallo","Hartigan","Iwu","Jansen","Kade","Lowe","Moreau","Novak","Ortega","Pruitt","Rourke","Beasley","Mercer","Dobbs","Varga"];
const HOMETOWN=["right here in Millbrook","Cedar Fork","Ashby","Dunmore Falls","the city","Brookside","Pell's Crossing","a trailer park outside Ashby","up north","down south"];
const FEARS=["the dark","getting bitten and not knowing it","being alone","fire","crowds","forgetting my kids' faces","losing my mind out here","that we'll turn on each other before the dead get us","dying somewhere nobody finds me","the sound they make"];
const HOPES=["a working radio","finding my sister","a hot shower","a real orchard one day","the army coming back","a cure","my kid growing up safe","a quiet place by the water","seeing my mom again","a winter where nobody dies"];
const SECRETS=["I left someone behind to save myself","I've been hoarding painkillers","I was on parole when it started","I don't believe we'll last the winter","I've killed a living person since this started","I still talk to my dead wife at night","I can't swim","I used to drink. Bad. I'm scared I'll start again","I stole from the clinic before it all went down","I'm not who I said I was"];
const LIKES=["black coffee","old country songs","card games","fishing","drawing","fixing engines","reading anything I can find","bad jokes","the stars out here","baseball"];
const STYLES={plain:"plain-spoken",crude:"crude and swears",formal:"formal and careful",nervous:"nervous, trails off",warm:"warm, calls people hon",dry:"dry and short",preachy:"quotes scripture and sayings",joker:"jokes to cope"};
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
const SAYBIO={walt:"This land's been in my family four generations. I've worked it forty years.",grace:"I've been the pastor at St. Brigid's for eleven years. A church should be a lifeboat. That's what I believe.",ray:"I'm the only deputy this town has left. The sheriff drove to the city and never came back.",cole:"I ran the crew up at the quarry. Half this town owes me money.",nadia:"I'm the town doctor. I treated the first patient at the clinic. I saw what it does."};
