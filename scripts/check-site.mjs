import {readdir,readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve('dist'),base=process.env.BASE_PATH||'/comarca/';
async function walk(dir){const out=[];for(const e of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${e.name}`;if(e.isDirectory())out.push(...await walk(p));else if(e.name.endsWith('.html'))out.push(p);}return out;}
const files=await walk(root);let checked=0;
for(const file of files){const html=await readFile(file,'utf8');if((html.match(/<h1\b/g)||[]).length!==1)throw Error(`Se requiere un título principal: ${file}`);const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);if(new Set(ids).size!==ids.length)throw Error(`IDs repetidos: ${file}`);
for(const [,attr,url] of html.matchAll(/\b(href|src)="([^"]*)"/g)){if(!url||url==='#'||/^(https?:|data:|mailto:)/.test(url))continue;if(url.startsWith('#')){if(!ids.includes(url.slice(1)))throw Error(`Ancla rota: ${file} ${url}`);continue;}if(!url.startsWith(base))throw Error(`Ruta fuera del sitio: ${file} ${url}`);const rel=url.slice(base.length).split(/[?#]/)[0];const dest=resolve(root,rel);if(!dest.startsWith(root))throw Error('Ruta inválida');try{const st=await stat(dest);if(st.isDirectory())await stat(`${dest}/index.html`);}catch{throw Error(`Enlace roto: ${file} ${attr}=${url}`);}checked++;}}
console.log(`Verificadas ${files.length} páginas HTML y ${checked} enlaces/archivos internos.`);
