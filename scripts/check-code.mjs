import {readdir} from 'node:fs/promises';
import {extname,join,relative} from 'node:path';
import {spawn} from 'node:child_process';

const roots=['api','scripts','public','tests'];
const ignored=new Set(['node_modules','.wrangler','dist']);
async function files(dir){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(ignored.has(entry.name))continue;
  const path=join(dir,entry.name);
  if(entry.isDirectory())out.push(...await files(path));
  else if(['.mjs','.js'].includes(extname(entry.name)))out.push(path);
 }
 return out;
}
const targets=(await Promise.all(roots.map(files))).flat();
const failures=[];
for(const path of targets)await new Promise(resolve=>{
 const child=spawn(process.execPath,['--check',path],{stdio:['ignore','ignore','pipe']});let error='';
 child.stderr.on('data',chunk=>error+=chunk);child.on('close',code=>{if(code)failures.push(`${relative('.',path)}\n${error.trim()}`);resolve();});
});
if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
else console.log(`Sintaxis verificada: ${targets.length} archivos JavaScript.`);
