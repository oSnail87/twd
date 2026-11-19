// Open the built game (dist/index.html) in headless Chromium, the way the Artifact wraps it.
// three.js is served from node_modules/three (npm i three@0.128.0) instead of the CDN; set THREE_JS to use another copy.
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const ROOT=path.join(__dirname,'..');
module.exports=async function open(o={}){
  const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  const ctx=await b.newContext({viewport:o.viewport||{width:1440,height:900},deviceScaleFactor:o.dpr||1});
  const pg=await ctx.newPage();const errs=[];
  pg.on('pageerror',e=>errs.push('pageerror: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n')));
  pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push('console: '+m.text())});
  const three=process.env.THREE_JS||path.join(ROOT,'node_modules/three/build/three.min.js');
  await pg.route('**/three.min.js',r=>r.fulfill({path:three,contentType:'application/javascript'}));
  await pg.route('**/fonts.googleapis.com/**',r=>r.abort());await pg.route('**/fonts.gstatic.com/**',r=>r.abort());
  if(o.save)await pg.addInitScript(s=>{localStorage.setItem('twd.save.v3',s)},o.save);
  const html=fs.readFileSync(path.join(ROOT,'dist/index.html'),'utf8');const out=path.join(ROOT,'tests/.page.html');
  fs.writeFileSync(out,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>');
  await pg.goto('file://'+out);await pg.waitForTimeout(o.wait||1500);
  return {b,pg,errs}};
