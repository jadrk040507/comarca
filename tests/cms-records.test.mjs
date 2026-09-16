import {test} from 'node:test';
import assert from 'node:assert/strict';
import {modules,propertiesFor,recordValues,records} from '../api/cms-records.mjs';
import {invitationInput} from '../api/cms.mjs';
const env={NOTION_TOKEN:'test',NOTION_AGENDA_ID:'11111111-1111-4111-8111-111111111111',CMS_CONNECTED_MODULES:Object.keys(modules).join(','),CMS_AGENDA_EDIT_ENABLED:'true'};
const admin={role:'admin',modules:[]},reader={role:'reader',modules:['materiales']};
const id='22222222-2222-4222-8222-222222222222';
test('grades preserve unevaluated values and reject invalid grades and arbitrary public fields',()=>{
 assert.deepEqual(propertiesFor('grades',{'Calificación 0–10':null}),{'Calificación 0–10':{number:null}});
 assert.equal(propertiesFor('grades',{'Calificación 0–10':0})['Calificación 0–10'].number,0);
 for(const value of [-1,11,'10',NaN])assert.throws(()=>propertiesFor('grades',{'Calificación 0–10':value}));
 assert.throws(()=>propertiesFor('students',{'Publicar en web':true}));
 assert.throws(()=>propertiesFor('transport',{Capacidad:2.5}));
 assert.throws(()=>propertiesFor('students',{'Fecha de ingreso':{start:'2026-02-30'}}));
});
test('module permissions and read-only accounts are enforced before any Notion request',async()=>{
 const fetcher=()=>{throw Error('Must not fetch');};
 await assert.rejects(records(new Request('https://example.com/cms/api/records/students'),env,reader,'students',null,null,fetcher),e=>e.status===403);
 await assert.rejects(records(new Request('https://example.com/cms/api/records/materials',{method:'POST'}),env,reader,'materials',null,{values:{Name:'x'}},fetcher),e=>e.status===403);
 assert.throws(()=>invitationInput({email:'x@example.com',role:'admin',modules:['catecismo']}));
 assert.throws(()=>invitationInput({email:'x@example.com',role:'editor',modules:['unknown']}));
 assert.deepEqual(invitationInput({email:'x@example.com',role:'editor',modules:['catecismo','materiales']}).modules,['catecismo','materiales']);
});
test('module output exports only its fields and filters unsafe file links',()=>{
 const row=recordValues({id,properties:{Name:{title:[{plain_text:'Recurso'}]},Archivo:{files:[{name:'bad',external:{url:'javascript:alert(1)'}},{name:'good',file:{url:'https://example.com/file.pdf'}}]},Secret:{rich_text:[{plain_text:'hidden'}]}}},modules.materials);
 assert.equal(row.values.Archivo.length,1);assert.equal(row.values.Secret,undefined);
});
test('cannot modify a page in another database or overwrite a changed record',async()=>{
 const req=new Request('https://example.com/cms/api/records/students/'+id,{method:'PATCH'});
 for(const [parent,version,status] of [['another-source','v1',404],[modules.students.id,'v2',409]]){
  let calls=0;await assert.rejects(records(req,env,admin,'students',id,{values:{Alumno:'Alumno'},version:'v1'},async()=>{calls++;return Response.json({parent:{data_source_id:parent},last_edited_time:version});}),e=>e.status===status);assert.equal(calls,1);
 }
});
test('relations must point at the expected source, and duplicate attendance is rejected',async()=>{
 const req=new Request('https://example.com/cms/api/records/attendance',{method:'POST'}),values={Registro:'Sesión · alumno',Alumno:[id],Sesión:[env.NOTION_AGENDA_ID],Asistencia:'Presente'};
 await assert.rejects(records(req,env,admin,'attendance',null,{values},async()=>Response.json({parent:{data_source_id:'wrong'}})),/no pertenece/);
 let i=0;const fetcher=async()=>{i++;if(i===1)return Response.json({parent:{data_source_id:modules.students.id}});if(i===2)return Response.json({parent:{data_source_id:env.NOTION_AGENDA_ID}});return Response.json({results:[{id:'existing'}]});};
 await assert.rejects(records(req,env,admin,'attendance',null,{values},fetcher),e=>e.status===409);assert.equal(i,3);
});
