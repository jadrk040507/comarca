import {createHash} from 'node:crypto';
import {cp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import {calendar} from '../public/calendar.js';
const basePath=process.env.BASE_PATH||'/comarca/';if(!/^\/(?:[a-zA-Z0-9_-]+\/)*$/.test(basePath))throw Error('BASE_PATH inválido');
const oneSignalAppId=process.env.ONESIGNAL_APP_ID||'';if(oneSignalAppId&&!/^[a-f0-9-]{36}$/i.test(oneSignalAppId))throw Error('ONESIGNAL_APP_ID inválido');
const registrationApi=process.env.REGISTRATION_API||'',turnstileSiteKey=process.env.TURNSTILE_SITE_KEY||'';
if(registrationApi&&!/^https:\/\/[^\s]+\/solicitudes$/.test(registrationApi))throw Error('REGISTRATION_API inválido');
const data=JSON.parse(await readFile('public/data.json','utf8'));if(!Array.isArray(data.events)||!Array.isArray(data.resources))throw Error('Datos inválidos');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});await cp('public','dist',{recursive:true});
await writeFile('dist/config.json',JSON.stringify({basePath,oneSignalAppId,registrationApi,turnstileSiteKey,signupURL:basePath+'participar/#inscripcion'}));
await writeFile('dist/manifest.webmanifest',JSON.stringify({id:basePath,name:'La Comarca',short_name:'La Comarca',lang:'es-MX',start_url:basePath,scope:basePath,display:'standalone',background_color:'#ffffff',theme_color:'#133b58',icons:[{src:'./assets/icon-192.png',sizes:'192x192',type:'image/png'},{src:'./assets/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]}));
await writeFile('dist/agenda.ics',calendar(data.events));await writeFile('dist/.nojekyll','');console.log(`Web lista: ${data.events.length} actividades, ${data.resources.length} recursos.`);

const version=createHash('sha256').update(await readFile('public/app.js')).update(await readFile('public/styles.css')).update(await readFile('public/calendar.js')).update(await readFile('public/motion.js')).update(await readFile('public/registration.js')).digest('hex').slice(0,12);
let html=await readFile('dist/index.html','utf8');html=html.replace('./styles.css',`./styles.css?v=${version}`).replace('./app.js',`./app.js?v=${version}`);await writeFile('dist/index.html',html);
let app=await readFile('dist/app.js','utf8');app=app.replace("'./calendar.js'",`'./calendar.js?v=${version}'`);app=app.replace("'./motion.js'",`'./motion.js?v=${version}'`);app=app.replace("'./registration.js'",`'./registration.js?v=${version}'`);await writeFile('dist/app.js',app);

const {buildPages}=await import('./pages.mjs');
await buildPages(data,basePath,version);
await import('./check-site.mjs');
