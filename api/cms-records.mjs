import modules from './cms-modules.json' with {type:'json'};
import {can} from './cms-auth.mjs';
export {modules};
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export const permissionKeys=['agenda','materiales','catecismo','traslados','inscripciones'];
export const plain=a=>(a||[]).map(x=>x.plain_text??x.text?.content??'').join('');
export const sourceId=(key,env)=>key==='agenda'?env.NOTION_AGENDA_ID:modules[key]?.id;
export const modulePermission=key=>key==='agenda'?'agenda':modules[key]?.permission;
const norm=s=>s?.replaceAll('-','');
export const belongs=(page,id)=>!page.archived&&!page.in_trash&&norm(page.parent?.data_source_id)===norm(id);
export const enabled=(key,env)=>(env.CMS_CONNECTED_MODULES||'').split(',').includes(key);
export class RecordError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export async function notion(env,path,options={},fetcher=fetch){
 const r=await fetcher('https://api.notion.com/v1/'+path,{...options,headers:{Authorization:'Bearer '+env.NOTION_TOKEN,'Notion-Version':'2025-09-03','Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw new RecordError(r.status===403||r.status===404?'Esta base aún no está conectada o falta un permiso en Notion.':r.status===429?'Notion está recibiendo muchas solicitudes. Espera unos segundos y vuelve a intentar.':'No pudimos confirmar la operación con Notion. Revisa los registros antes de repetirla.',r.status===429?429:502);
 return r.json();
}
export function recordValues(page,definition){
 const values={};for(const f of definition.fields){const p=page.properties?.[f.name];let v=null;
  if(['title','text'].includes(f.type))v=plain(p?.[f.type==='text'?'rich_text':'title']);
  else if(f.type==='select')v=p?.select?.name??'';
  else if(f.type==='relation')v=(p?.relation||[]).map(r=>r.id);
  else if(f.type==='date')v=p?.date??null;
  else if(f.type==='file')v=(p?.files||[]).map(file=>({name:file.name,url:file.file?.url||file.external?.url})).filter(file=>safeURL(file.url));
  else v=p?.[f.type]??(f.type==='checkbox'?false:null);
  values[f.name]=v;
 }return {id:page.id,version:page.last_edited_time,values};
}
export function safeURL(v){try{const u=new URL(v);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export function propertiesFor(key,values,creating=false){
 const definition=modules[key];if(!definition||!values||typeof values!=='object'||Array.isArray(values)||Object.keys(values).length>30)throw new RecordError('Revisa los campos.');
 const properties={};for(const [name,v] of Object.entries(values)){
  const f=definition.fields.find(f=>f.name===name);if(!f||f.readOnly)throw new RecordError('No se puede modificar este campo: '+name);
  if(['title','text','email','phone_number','url'].includes(f.type)){
   if(typeof v!=='string'||v.length>(f.type==='text'?1800:254)||f.type==='title'&&!v.trim())throw new RecordError('Revisa '+f.label);
   if(f.type==='email'&&v&&!/^\S+@\S+\.\S+$/.test(v))throw new RecordError('Revisa el correo.');
   if(f.type==='url'&&v&&!safeURL(v))throw new RecordError('Usa un enlace http o https.');
   if(f.type==='title'||f.type==='text')properties[name]={[f.type==='text'?'rich_text':'title']:v?[{text:{content:v.trim()}}]:[]};else properties[name]={[f.type]:v||null};
  }else if(f.type==='select'){
   if(typeof v!=='string'||v&&!f.options.includes(v))throw new RecordError('Revisa '+f.label);properties[name]={select:v?{name:v}:null};
  }else if(f.type==='checkbox'){
   if(typeof v!=='boolean')throw new RecordError('Revisa '+f.label);properties[name]={checkbox:v};
  }else if(f.type==='number'){
   if(v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0||v>1000000))throw new RecordError('Revisa '+f.label);
   if(v!==null&&(name==='Calificación 0–10'&&v>10||['Edad','Capacidad','Orden'].includes(name)&&!Number.isInteger(v)||name==='Edad'&&v>120))throw new RecordError('Revisa '+f.label);
   properties[name]={number:v};
  }else if(f.type==='date'){
   if(v===null){properties[name]={date:null};continue;}
   const valid=s=>typeof s==='string'&&s.length<=35&&/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s.slice(0,10)).toISOString().slice(0,10)===s.slice(0,10);
   if(!valid(v?.start)||v.end&&(!valid(v.end)||v.end<v.start))throw new RecordError('Revisa la fecha.');properties[name]={date:{start:v.start,...(v.end?{end:v.end}:{})}};
  }else if(f.type==='relation'){
   if(!Array.isArray(v)||v.length>20||v.some(id=>typeof id!=='string'||!uuid.test(id))||new Set(v).size!==v.length)throw new RecordError('Revisa la relación '+f.label);properties[name]={relation:v.map(id=>({id}))};
  }
 }
 if(creating&&!definition.fields.filter(f=>f.type==='title').every(f=>properties[f.name]))throw new RecordError('Escribe un nombre para el registro.');
 return properties;
}
export async function records(request,env,user,key,id,input,fetcher=fetch){
 const definition=modules[key],write=request.method!=='GET';
 if(!definition||!can(user,definition.permission,write))throw new RecordError('Tu cuenta no tiene permiso para esta sección.',403);
 if(!enabled(key,env))throw new RecordError('Esta sección está pendiente de conectar.',503);
 if(id&&!uuid.test(id))throw new RecordError('Registro no válido.');
 if(request.method==='GET'){
  if(id){const page=await notion(env,'pages/'+id,{},fetcher);if(!belongs(page,definition.id))throw new RecordError('Registro no disponible.',404);return {record:recordValues(page,definition)};}
  const url=new URL(request.url),cursor=url.searchParams.get('cursor'),q=url.searchParams.get('q')||'';
  if(cursor&&!uuid.test(cursor)||q.length>150)throw new RecordError('Consulta no válida.');
  const title=definition.fields.find(f=>f.type==='title').name;
  const data=await notion(env,'data_sources/'+definition.id+'/query',{method:'POST',body:JSON.stringify({page_size:50,sorts:[{timestamp:'last_edited_time',direction:'descending'}],...(cursor?{start_cursor:cursor}:{}),...(q?{filter:{property:title,title:{contains:q}}}:{})})},fetcher);
  return {records:data.results.map(p=>recordValues(p,definition)),nextCursor:data.has_more?data.next_cursor:null};
 }
 if(!['POST','PATCH'].includes(request.method)||request.method==='PATCH'&&!id||request.method==='POST'&&id)throw new RecordError('Método no permitido.',405);
 if(env.CMS_AGENDA_EDIT_ENABLED!=='true'&&id)throw new RecordError('Falta habilitar la actualización en Notion.',503);
 const properties=propertiesFor(key,input?.values,!id);
 if(Object.values(properties).reduce((n,p)=>n+(p.relation?.length||0),0)>20)throw new RecordError('Vincula como máximo 20 registros por operación.');
 let current;if(id){current=await notion(env,'pages/'+id,{},fetcher);if(!belongs(current,definition.id))throw new RecordError('Registro no disponible.',404);if(!input.version||input.version!==current.last_edited_time)throw new RecordError('Este registro cambió. Actualiza la lista y vuelve a abrirlo.',409);}
 for(const f of definition.fields.filter(f=>f.type==='relation'&&properties[f.name])){
  if(!f.target||!can(user,modulePermission(f.target)))throw new RecordError('No tienes acceso a los registros relacionados de '+f.label,403);
  for(const {id:relatedId} of properties[f.name].relation){const related=await notion(env,'pages/'+relatedId,{},fetcher);if(!belongs(related,sourceId(f.target,env)))throw new RecordError('Uno de los registros relacionados no pertenece a '+f.label);}
 }
 const uniqueFields=key==='attendance'?['Alumno','Sesión']:key==='grades'?['Alumno','Actividad']:null;
 if(uniqueFields){
  const merged={...current?.properties,...properties};
  if(uniqueFields.some(f=>merged[f]?.relation?.length!==1))throw new RecordError('Selecciona exactamente un alumno y una sesión o actividad.');
  const existing=await notion(env,'data_sources/'+definition.id+'/query',{method:'POST',body:JSON.stringify({page_size:2,filter:{and:uniqueFields.map(f=>({property:f,relation:{contains:merged[f].relation[0].id}}))}})},fetcher);
  if(existing.results.some(p=>p.id!==id))throw new RecordError('Ya existe un registro para este alumno y esta sesión o actividad. Abre el existente.',409);
 }
 const saved=await notion(env,'pages'+(id?'/'+id:''),{method:id?'PATCH':'POST',body:JSON.stringify({...(id?{}:{parent:{type:'data_source_id',data_source_id:definition.id}}),properties})},fetcher);
 return {record:recordValues(saved,definition),message:'Guardado en '+definition.label+'.'};
}
