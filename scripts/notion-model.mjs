// Only these explicit public fields may leave Notion. Never serialize entire pages.
export const text=p=>(p?.title||p?.rich_text||[]).map(t=>t.plain_text??t.text?.content??'').join('');
export function publicURL(s){try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)return null;if(['app.notion.com','www.notion.so','notion.so'].includes(u.hostname))return null;return u.href;}catch{return null;}}
const date=p=>p?.date?.start||null;
export function eventFromPage(page){const p=page.properties||{};if(page.archived||page.in_trash||p['Publicar en web']?.checkbox!==true)return null;
const start=date(p.Fecha),end=p.Fecha?.date?.end||null;if(!start||!Number.isFinite(Date.parse(start))||(end&&!Number.isFinite(Date.parse(end))))throw Error('Una actividad pública no tiene una fecha válida.');
const title=text(p.Name);if(!title)throw Error('Una actividad pública no tiene título.');
const summary=text(p['Resumen público']);if(!summary)throw Error('Una actividad pública necesita Resumen público.');
return {id:page.id.replaceAll('-',''),title,type:p.Tipo?.select?.name||'Actividad',start,end,location:text(p.Lugar)||'Sede por confirmar',status:p.Estado?.select?.name||p.Estado?.status?.name||'',summary,recurrence:p['Repetición web']?.select?.name||'No repetir',repeatUntil:date(p['Repetir hasta']),image:null};}
export function resourceFromPage(page){const p=page.properties||{};if(page.archived||page.in_trash||p['Publicar en web']?.checkbox!==true)return null;const title=text(p.Name),url=publicURL(p.Enlace?.url),summary=text(p['Resumen público']);if(!title||!url||!summary)throw Error('Un material público necesita título, enlace HTTPS público y resumen.');return {id:page.id.replaceAll('-',''),title,category:title.includes('Youth')?'Youth · Formación':'Lectura y formación',summary,url};}
