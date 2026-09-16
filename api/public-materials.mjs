import {modules,plain,safeURL,notion} from './cms-records.mjs';
export function publishedMaterial(page){
 const p=page.properties||{};if(page.archived||page.in_trash||p['Publicar en web']?.checkbox!==true||p.Vigencia?.select?.name!=='Vigente')return null;
 const url=p.Enlace?.url||p.Archivo?.files?.[0]?.file?.url||p.Archivo?.files?.[0]?.external?.url;
 if(!safeURL(url))return null;
 return {id:page.id.replaceAll('-',''),title:plain(p.Name?.title),category:p.Categoría?.select?.name||'Recurso',summary:plain(p['Resumen público']?.rich_text),url};
}
export async function readPublicMaterials(env,fetcher=fetch){
 const resources=[];let cursor;
 for(let i=0;i<10;i++){
  const result=await notion(env,'data_sources/'+modules.materials.id+'/query',{method:'POST',body:JSON.stringify({page_size:50,filter:{and:[{property:'Publicar en web',checkbox:{equals:true}},{property:'Vigencia',select:{equals:'Vigente'}}]},...(cursor?{start_cursor:cursor}:{})})},fetcher);
  for(const page of result.results){const resource=publishedMaterial(page);if(resource)resources.push(resource);}
  if(!result.has_more)return {resources,updatedAt:new Date().toISOString()};cursor=result.next_cursor;if(!cursor)break;
 }throw Error('Too many materials');
}
export async function publicMaterials(request,env,fetcher=fetch,cache){
 const headers={'Access-Control-Allow-Origin':'*','Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'};
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 if(!(env.CMS_CONNECTED_MODULES||'').split(',').includes('materials'))return Response.json({message:'Recursos pendientes de conexión.'},{status:503,headers:{...headers,'Cache-Control':'no-store'}});
 try{const key=new Request(new URL('/_cache/materials-v1',request.url));let hit=await cache?.match(key);if(!hit){hit=Response.json(await readPublicMaterials(env,fetcher),{headers});await cache?.put(key,hit.clone());}return request.method==='HEAD'?new Response(null,{headers:hit.headers}):hit;}catch{return Response.json({message:'No se pudieron actualizar los recursos.'},{status:503,headers:{...headers,'Cache-Control':'no-store'}});}
}
