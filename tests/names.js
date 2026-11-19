// Every part of the page shares one script, so two top-level functions with the same name silently replace each other.
// node tests/names.js   (exits 1 and lists them if any name is declared twice)
const fs=require('fs'),path=require('path');
const order=fs.readFileSync(path.join(__dirname,'../src/ORDER'),'utf8').trim().split(/\s+/).filter(f=>f.endsWith('.js'));
const seen={};let bad=0;
for(const f of order){const src=fs.readFileSync(path.join(__dirname,'../src',f),'utf8');
  for(const m of src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)){const n=m[1]||m[2];
    if(seen[n]&&seen[n]!==f||seen[n]===f&&m[0].startsWith('function')&&src.split(new RegExp('^function\\s+'+n.replace(/\$/g,'\\$')+'\\b','m')).length>2){console.log(`${n}: ${seen[n]} and ${f}`);bad++}
    seen[n]=seen[n]||f}}
if(bad)process.exitCode=1;else console.log('no duplicate names');
