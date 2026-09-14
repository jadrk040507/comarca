import {jwtVerify,createRemoteJWKSet} from 'jose';
import {teamHTML,teamJS} from './team-ui.mjs';
export async function identity(request,env,keyset){
 if(!env.TEAM_ACCESS_AUDIENCE||!env.TEAM_ADMIN_ACCOUNT||!env.TEAM_ACCESS_ISSUER)throw Error('configuration');
 const issuer=env.TEAM_ACCESS_ISSUER;
 if(!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))throw Error('configuration');
 keyset??=createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs'),{timeoutDuration:8000});
 const token=request.headers.get('Cf-Access-Jwt-Assertion');if(!token||token.length>20000)throw Error('session');
 const {payload}=await jwtVerify(token,keyset,{issuer,audience:env.TEAM_ACCESS_AUDIENCE,algorithms:['RS256'],requiredClaims:['exp','iat','sub','email']});
 if(typeof payload.email!=='string'||payload.email.toLowerCase()!==env.TEAM_ADMIN_ACCOUNT.toLowerCase())throw Error('permission');
 return {email:payload.email,role:'Administración'};
}
const types=['Círculo','Retiro mensual','Retiro semestral','Convivencia','Tertulia','Catecismo','Labor social','Salida','Fiesta y aniversario'];
export function activityPayload(v,id){
 if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Revisa los datos.');
 const str=(k,max)=>{if(typeof v[k]!=='string'||v[k].length>max)throw Error('Revisa '+k);return v[k].trim();};
 const title=str('title',150),location=str('location',250),summary=str('summary',1800),start=str('start',16),end=str('end',16);
 const validDate=s=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'-06:00'))&&new Date(s+':00Z').toISOString().slice(0,16)===s;
 if(!title||!validDate(start)||(end&&(!validDate(end)||end<=start))||!types.includes(v.type)||!['No repetir','Semanal','Anual'].includes(v.recurrence))throw Error('Revisa título, fechas, tipo y repetición.');
 return {parent:{type:'data_source_id',data_source_id:id},properties:{Name:{title:[{text:{content:title}}]},Tipo:{select:{name:v.type}},Fecha:{date:{start:start+':00-06:00',...(end?{end:end+':00-06:00'}:{})}},Lugar:{rich_text:location?[{text:{content:location}}]:[]},'Resumen público':{rich_text:summary?[{text:{content:summary}}]:[]},Estado:{select:{name:'Borrador'}},'Publicar en web':{checkbox:false},'Repetición web':{select:{name:v.recurrence}}}};
}
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src https://la-comarca.github.io; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
const reply=(body,status=200,type='application/json')=>new Response(type==='application/json'?JSON.stringify(body):body,{status,headers:{...headers,'Content-Type':type+';charset=utf-8'}});
export async function team(request,env,fetcher=fetch,authenticate=identity){
 let user;try{user=await authenticate(request,env);}catch{return reply({message:'Inicia sesión con una cuenta autorizada.'},403);}
 const url=new URL(request.url),path=url.pathname.replace(/\/$/,'');
 if(request.method==='GET'&&path==='/equipo')return reply(teamHTML,200,'text/html');
 if(request.method==='GET'&&path==='/equipo/app.js')return reply(teamJS,200,'text/javascript');
 if(request.method==='GET'&&path==='/equipo/api/me')return reply(user);
 if(path!=='/equipo/api/agenda')return reply({message:'Ruta no disponible.'},404);
 if(!env.NOTION_TOKEN||!env.NOTION_AGENDA_ID)return reply({message:'No se pudo conectar con la agenda.'},503);
 const notionHeaders={Authorization:`Bearer ${env.NOTION_TOKEN}`,'Notion-Version':'2025-09-03','Content-Type':'application/json'};
 try{
 if(request.method==='GET'){
  const cursor=url.searchParams.get('cursor');if(cursor&&(!/^[a-zA-Z0-9-]{1,100}$/.test(cursor)))return reply({message:'Página no válida.'},400);
  const r=await fetcher('https://api.notion.com/v1/data_sources/'+env.NOTION_AGENDA_ID+'/query',{method:'POST',headers:notionHeaders,body:JSON.stringify({page_size:100,sorts:[{property:'Fecha',direction:'ascending'}],...(cursor?{start_cursor:cursor}:{})}),signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error('notion');const d=await r.json();
  const plain=a=>(a||[]).map(x=>x.plain_text??x.text?.content??'').join('');
  return reply({events:d.results.map(p=>({id:p.id,title:plain(p.properties.Name?.title),start:p.properties.Fecha?.date?.start,location:plain(p.properties.Lugar?.rich_text),type:p.properties.Tipo?.select?.name,status:p.properties.Estado?.select?.name,published:p.properties['Publicar en web']?.checkbox===true,recurrence:p.properties['Repetición web']?.select?.name})),nextCursor:d.has_more?d.next_cursor:null});
 }
 if(request.method==='POST'){
  if(request.headers.get('Origin')!==url.origin||request.headers.get('X-Comarca-Request')!=='team'||!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({message:'Solicitud no permitida.'},403);
  if(!env.FORM_LIMIT||!(await env.FORM_LIMIT.limit({key:'team:'+user.email})).success)return reply({message:'Espera un minuto antes de guardar otra actividad.'},429);
  let payload;try{const reader=request.body?.getReader();if(!reader)throw Error();let length=0,parts=[];for(;;){const x=await reader.read();if(x.done)break;length+=x.value.length;if(length>12000){await reader.cancel();throw Error();}parts.push(x.value);}payload=activityPayload(JSON.parse(await new Blob(parts).text()),env.NOTION_AGENDA_ID);}catch{return reply({message:'Revisa los datos y las fechas de la actividad.'},400);}
  const r=await fetcher('https://api.notion.com/v1/pages',{method:'POST',headers:notionHeaders,body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('notion');const saved=await r.json();return reply({id:saved.id,message:'Actividad guardada como borrador en Notion.'},201);
 }
 return reply({message:'Método no permitido.'},405);
 }catch{return reply({message:request.method==='POST'?'No pudimos confirmar el guardado. Revisa la agenda antes de repetir el envío.':'No se pudo cargar la agenda. Inténtalo de nuevo.'},502);}
}
