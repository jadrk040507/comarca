import test from 'node:test';import assert from 'node:assert/strict';
import {selectEvents,publicAgenda,readPublicAgenda} from '../api/public-agenda.mjs';
import {subscriptionURL} from '../public/subscription.js';
const a='a'.repeat(32),b='b'.repeat(32),c='c'.repeat(32);
const events=[{id:a,title:'UP',type:'Círculo',start:'2026-09-09T15:00:00-06:00',recurrence:'Semanal'},{id:b,title:'Sábado',type:'Círculo',start:'2026-09-12T12:00:00-06:00'},{id:c,title:'Retiro',type:'Retiro mensual',start:'2026-10-01T19:45:00-06:00'}];
const data={events,updatedAt:'2026-09-13T12:00:00Z'};
const fetcher=async()=>Response.json(data);
test('el mismo enlace incorpora nuevos retiros pero solo el círculo elegido',()=>{
 const url=new URL(subscriptionURL({allTypes:false,types:['Círculo','Retiro mensual'],allCircles:false,circles:[a]}));
 assert.deepEqual(selectEvents(events,url.searchParams).map(e=>e.id),[a,c]);
 assert.equal(selectEvents([...events,{id:'d'.repeat(32),type:'Retiro mensual'}],url.searchParams).length,3);
});
test('todos incluye nuevas categorías y puede excluir todos los círculos',()=>{assert.equal(selectEvents([...events,{id:'d',type:'Nueva actividad'}],new URLSearchParams()).length,4);assert.deepEqual(selectEvents(events,new URLSearchParams('circles=selected')).map(e=>e.id),[c]);});
test('el calendario acepta suscriptores sin Origin, conserva UID y permite 304',async()=>{
 const req=new Request('https://example.com/calendario.ics?circles=selected');const r=await publicAgenda(req,{},fetcher);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/calendar/);assert.match(await r.text(),new RegExp(`UID:${c}@la-comarca`));
 const r2=await publicAgenda(new Request(req,{headers:{'If-None-Match':r.headers.get('etag')}}),{},fetcher);assert.equal(r2.status,304);
});
test('una caída no sustituye la agenda por un calendario vacío exitoso',async()=>{const r=await publicAgenda(new Request('https://example.com/calendario.ics'),{},async()=>new Response('down',{status:500}));assert.equal(r.status,503);});
test('filtros inválidos se rechazan antes de consultar la fuente',async()=>{const r=await publicAgenda(new Request('https://example.com/calendario.ics?circle=bad'),{},()=>{throw Error('No debería consultar');});assert.equal(r.status,400);});
test('el modo publicado selecciona campos y nunca reenvía notas privadas',async()=>{const r=await readPublicAgenda({},async()=>Response.json({...data,events:events.map(e=>({...e,privateNotes:'SECRET',students:['PRIVATE']}))}));assert.ok(!JSON.stringify(r).includes('SECRET'));assert.ok(!JSON.stringify(r).includes('PRIVATE'));});
test('Notion requiere publicación explícita, no exporta relaciones y conserva cancelaciones',async()=>{
 let body;const f=async(url,options)=>{body=JSON.parse(options.body);return Response.json({results:[{id:c,last_edited_time:data.updatedAt,properties:{Name:{title:[{plain_text:'Retiro'}]},Fecha:{date:{start:'2026-10-01'}},Estado:{select:{name:'Cancelada'}},'Publicar en web':{checkbox:true},'Resumen público':{rich_text:[{plain_text:'Cancelado'}]},Inscripciones:{relation:[{id:'PRIVATE'}]}}}],has_more:false});};
 const r=await readPublicAgenda({PUBLIC_AGENDA_SOURCE:'notion',NOTION_TOKEN:'fake',NOTION_AGENDA_ID:a},f);assert.equal(body.filter.and[0].property,'Publicar en web');assert.equal(r.events[0].status,'Cancelada');assert.ok(!JSON.stringify(r).includes('PRIVATE'));
});
