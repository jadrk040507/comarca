import {calendar} from '../public/calendar.js';
import {eventFromPage} from '../scripts/notion-model.mjs';
export const calendarTypes=['Círculo','Retiro mensual','Retiro semestral','Convivencia','Tertulia','Catecismo','Labor social','Salida','Fiesta y aniversario'];
export function selectEvents(events,params){
 const allowed=new Set(['type','circle','circles']);for(const key of params.keys())if(!allowed.has(key))throw Error('Filtro no válido');
 const types=params.getAll('type'),circles=params.getAll('circle');
 if(types.length>30||circles.length>100||types.some(x=>x.length>80)||circles.some(x=>!/^[a-f0-9]{32}$/.test(x))||!['all','selected',null].includes(params.get('circles')))throw Error('Filtro no válido');
 return events.filter(e=>(types.length===0||types.includes(e.type))&&(e.type!=='Círculo'||params.get('circles')!=='selected'||circles.includes(e.id)));
}
async function jsonBounded(response){
 if(!response.ok)throw Error('Fuente no disponible');let n=0,parts=[];for await(const part of response.body){n+=part.byteLength;if(n>4*1024*1024)throw Error('Respuesta demasiado grande');parts.push(part);}const out=new Uint8Array(n);let i=0;for(const p of parts){out.set(p,i);i+=p.byteLength;}return JSON.parse(new TextDecoder().decode(out));
}
export async function readPublicAgenda(env,fetcher=fetch){
 if(env.PUBLIC_AGENDA_SOURCE!=='notion'){
  const data=await jsonBounded(await fetcher('https://la-comarca.github.io/data.json',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(15000)}));
  if(!Array.isArray(data.events)||data.events.length>2000||!Number.isFinite(Date.parse(data.updatedAt)))throw Error('Agenda inválida');
  const events=data.events.map(e=>{
   if(!/^[a-f0-9]{32}$/.test(e.id)||typeof e.title!=='string'||!Number.isFinite(Date.parse(e.start)))throw Error('Actividad inválida');
   return Object.fromEntries(['id','title','type','start','end','location','status','summary','recurrence','repeatUntil','image'].map(k=>[k,e[k]??null]));
  });
  return {events,updatedAt:data.updatedAt,source:'published'};
 }

 if(!env.NOTION_TOKEN||!env.NOTION_AGENDA_ID)throw Error('Agenda no conectada');
 const events=[];let cursor,updatedAt='2000-01-01T00:00:00.000Z';
 for(let page=0;page<20;page++){
  const result=await jsonBounded(await fetcher(`https://api.notion.com/v1/data_sources/${env.NOTION_AGENDA_ID}/query`,{method:'POST',headers:{Authorization:`Bearer ${env.NOTION_TOKEN}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'},body:JSON.stringify({page_size:100,filter:{and:[{property:'Publicar en web',checkbox:{equals:true}},{property:'Estado',select:{does_not_equal:'Borrador'}}]},...(cursor?{start_cursor:cursor}:{})}),signal:AbortSignal.timeout(15000)}));
  if(!Array.isArray(result.results))throw Error('Agenda incompleta');
  for(const p of result.results){const event=eventFromPage(p);if(event){event.image=event.id==='3d579aad5d8380d3a081fa12c961d5d6'?'https://la-comarca.github.io/assets/retiro-octubre.webp':null;events.push(event);if(p.last_edited_time>updatedAt)updatedAt=p.last_edited_time;}}
  if(!result.has_more)return {events,updatedAt,source:'notion'};
  cursor=result.next_cursor;if(!cursor)throw Error('Agenda incompleta');
 }
 throw Error('Agenda demasiado grande');
}
export async function publicAgenda(request,env,fetcher=fetch,load=()=>readPublicAgenda(env,fetcher)){
 const u=new URL(request.url),headers={'Access-Control-Allow-Origin':'*','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'};
 if(!['GET','HEAD'].includes(request.method))return new Response('Método no disponible',{status:405,headers:{Allow:'GET, HEAD'}});
 try{
  if(u.search.length>10000)throw Error('Filtro no válido');selectEvents([],u.searchParams);
 }catch{return new Response('Filtro no válido',{status:400});}
 try{
  const data=await load(),events=selectEvents(data.events,u.searchParams);
  const body=u.pathname==='/calendario.ics'?calendar(events,new Date(data.updatedAt)):JSON.stringify({...data,events});
  headers['Content-Type']=u.pathname==='/calendario.ics'?'text/calendar; charset=utf-8':'application/json; charset=utf-8';
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));headers.ETag='"'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')+'"';
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:body,{headers});
 }catch{return new Response('La agenda no está disponible temporalmente. Conserva tu suscripción e inténtalo más tarde.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*'}});}
}

export async function cachedAgenda(request,env){
 const key=new Request(new URL('/_cache/public-agenda-v1-'+(env.PUBLIC_AGENDA_SOURCE||'published'),request.url));
 const cache=caches.default;const hit=await cache.match(key);if(hit)return jsonBounded(hit);
 const data=await readPublicAgenda(env);await cache.put(key,Response.json(data,{headers:{'Cache-Control':'public, max-age=300'}}));return data;
}
