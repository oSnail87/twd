// Runs the game's rules with no screen: a new game, a camp, two weeks of days, and checks nothing breaks.
const fs=require("fs"),vm=require("vm");
const src=["10_data.js","20_sim.js","22_ground.js","25_orders.js","27_dead.js","28_wild.js","30_inv.js","35_mind.js","40_ai.js","45_act.js"].map(f=>fs.readFileSync(__dirname+"/../src/"+f,"utf8")).join("\n");
const ctx={console,Math,JSON,Date,setTimeout:(f)=>f(),clearTimeout(){},localStorage:{getItem(){return null},setItem(){},removeItem(){}},window:{},performance:{now:()=>Date.now()}};
vm.createContext(ctx);vm.runInContext(src+`
var UI={},closeLoot=()=>{},toast=()=>{},say=()=>{},sayLive=()=>{},renderAll=()=>{},renderTalk=()=>{},whyPanel=()=>{},openLoot=()=>{},openMap=()=>{},openBuild=()=>{},openHelp=()=>{},openTalk=()=>{},startPlace=()=>{},warCard=(o)=>{globalThis.WAR=o};
var LOGS=[];var onLog=(x,k)=>LOGS.push(x);
globalThis.run=function(){
  newGame({name:"Tess",sex:"F",look:{}});syncInv();
  const startPeople=members().length;
  // walk to the farm with everyone following
  travelTo("farm");let n=0;while(S.flags.traveling&&n++<100)travelTick();
  if(S.player.loc!=="farm")throw new Error("didn't arrive: "+S.player.loc);
  if(withYou().length!==startPeople)throw new Error("party didn't come: "+withYou().length);
  if(!campHere())throw new Error("couldn't make camp");
  // jobs
  const L=members().filter(p=>!p.kid);for(const p of L){const r=weigh(p,"job",{job:"farm"});applyOrder(p,"job",{job:"farm"})}
  addBld("plot",-8,10,{done:true});addBld("tent",8,10,{done:true});addBld("well",10,4,{done:true});
  const deaths0=S.stats.deaths;let cards=0;
  for(let h=0;h<24*14;h++){for(let m=0;m<12;m++)step(5);
    while(S.cards.length){cards++;S.cards.shift()}
    // let strangers in as they come
    for(const p of S.people.filter(p=>p.status==="stranger"&&p.loc===campK()))admit(p);}
  return{deathlog:LOGS.filter(x=>/ died| turned|starved|killed|never came|pulled down|is dead|didn.t make|came back\. Someone/.test(x)).slice(0,14),day:dayOf(S.t),members:members().length,dead:S.stats.deaths,cards,res:S.res,inv:S.inv.items.length,logs:LOGS.length,rival:!!S.rival,
    path:findPath("farm",0,20,-6,-14).length,war:(rally(),(globalThis.WAR||[]).map(o=>o.p.name+":"+o.r.yes))}};`,ctx);
const r=ctx.run();console.log(JSON.stringify(r,null,1));
if(r.day<14)throw new Error("time didn't pass");console.log("SIM_OK");
