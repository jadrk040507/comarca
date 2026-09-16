import {can} from './cms-auth.mjs';
import {modules,enabled,belongs,notion,recordValues,RecordError} from './cms-records.mjs';
const maxSize=5*1024*1024;
export function fileType(bytes){
 const prefix=new TextDecoder().decode(bytes.slice(0,8));
 if(prefix.startsWith('%PDF-'))return 'application/pdf';
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if([137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))return 'image/png';
 if(prefix.startsWith('RIFF')&&new TextDecoder().decode(bytes.slice(8,12))==='WEBP')return 'image/webp';
 throw new RecordError('Selecciona un PDF o una imagen JPG, PNG o WebP.');
}
export async function uploadFile(request,env,user,key,id,fetcher=fetch){
 const definition=modules[key],field=definition?.fields.find(f=>f.type==='file');
 if(!field||!can(user,definition.permission,true))throw new RecordError('Tu cuenta no puede subir archivos en esta sección.',403);
 if(!enabled(key,env)||env.CMS_AGENDA_EDIT_ENABLED!=='true')throw new RecordError('La subida requiere la conexión de edición habilitada.',503);
 let length=0;const parts=[],reader=request.body?.getReader();if(!reader)throw new RecordError('Selecciona un archivo.');
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>maxSize+65536){await reader.cancel();throw new RecordError('El archivo debe pesar como máximo 5 MB.',413);}parts.push(value);}
 let form;try{form=await new Response(new Blob(parts),{headers:{'Content-Type':request.headers.get('Content-Type')}}).formData();}catch{throw new RecordError('No pudimos leer el archivo.');}
 const file=form.get('file'),version=form.get('version');if(!(file instanceof File)||file.size===0||file.size>maxSize)throw new RecordError('Selecciona un archivo de hasta 5 MB.');
 const contentType=fileType(new Uint8Array(await file.slice(0,16).arrayBuffer()));
 const name=file.name.replace(/[\u0000-\u001f/\\]/g,'_').slice(0,150)||'archivo';
 const check=page=>{if(!belongs(page,definition.id))throw new RecordError('Registro no disponible.',404);if(page.last_edited_time!==version)throw new RecordError('El registro cambió. Vuelve a abrirlo antes de subir el archivo.',409);if(page.properties?.[field.name]?.files?.length)throw new RecordError('Este registro ya tiene un archivo. Crea otro material para conservar ambas versiones.',409);};
 check(await notion(env,'pages/'+id,{},fetcher));
 const upload=await notion(env,'file_uploads',{method:'POST',body:JSON.stringify({mode:'single_part',filename:name,content_type:contentType})},fetcher);
 const data=new FormData();data.set('file',new File([file],name,{type:contentType}));
 const sent=await fetcher('https://api.notion.com/v1/file_uploads/'+encodeURIComponent(upload.id)+'/send',{method:'POST',headers:{Authorization:'Bearer '+env.NOTION_TOKEN,'Notion-Version':'2025-09-03'},body:data,signal:AbortSignal.timeout(30000)});
 if(!sent.ok||(await sent.json()).status!=='uploaded')throw new RecordError('No se pudo subir el archivo. Inténtalo nuevamente.',502);
 check(await notion(env,'pages/'+id,{},fetcher));
 const saved=await notion(env,'pages/'+id,{method:'PATCH',body:JSON.stringify({properties:{[field.name]:{files:[{name,type:'file_upload',file_upload:{id:upload.id}}]}}})},fetcher);
 return {record:recordValues(saved,definition),message:'Archivo guardado en Notion.'};
}
