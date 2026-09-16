import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {cms} from '../api/cms.mjs';
import {createAuth,can} from '../api/cms-auth.mjs';
import {modules} from '../api/cms-records.mjs';
const origin='https://example.com';
const db=new DatabaseSync(':memory:');
for(const f of ['0001_auth.sql','0002_permissions.sql','0003_updates.sql','0004_audit_metadata.sql'])db.exec(readFileSync(new URL('../api/migrations/'+f,import.meta.url),'utf8'));
const env={CMS_ORIGIN:origin,CMS_AUTH_SECRET:'local-integration-tests-only-never-deploy-this-secret',CMS_DB:db,TEAM_ADMIN_ACCOUNT:'admin@example.com',FORM_LIMIT:{limit:async()=>({success:true})}};
const auth=createAuth(env);
const req=(path,body,extra={})=>new Request(origin+path,{method:body?'POST':'GET',headers:{Origin:origin,'X-Comarca-Request':'cms','Content-Type':'application/json',...extra},...(body?{body:JSON.stringify(body)}:{})});
test('native login: closed signup, no anonymous data, valid password session and logout',async()=>{
 assert.equal((await cms(req('/cms/auth/sign-up/email',{email:'attacker@example.com'}),env,fetch,{auth})).status,404);
 assert.equal((await cms(req('/cms/api/agenda'),env,fetch,{auth})).status,401);
 const activated=await cms(req('/equipo/activar',{password:'A-local-test-password-2026'}),env,fetch,{auth,bootstrapIdentity:async()=>({email:env.TEAM_ADMIN_ACCOUNT})});assert.equal(activated.status,201);
 const login=await cms(req('/cms/auth/sign-in/email',{email:env.TEAM_ADMIN_ACCOUNT,password:'A-local-test-password-2026'}),env,fetch,{auth});assert.equal(login.status,200,await login.clone().text());
 const cookie=login.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');assert.match(cookie,/session_token/);assert.match(login.headers.get('set-cookie'),/HttpOnly/i);assert.match(login.headers.get('set-cookie'),/Secure/i);
 const me=await cms(req('/cms/api/me',null,{Cookie:cookie}),env,fetch,{auth});assert.equal(me.status,200);assert.equal((await me.json()).role,'admin');
 assert.equal((await cms(req('/cms/auth/sign-out',{}, {Cookie:cookie}),env,fetch,{auth})).status,200);
 assert.equal((await cms(req('/cms/api/me',null,{Cookie:cookie}),env,fetch,{auth})).status,401);
});
test('cross-origin auth and unsigned admin activation fail closed',async()=>{
 assert.equal((await cms(req('/cms/auth/sign-in/email',{}, {Origin:'https://evil.example'}),env,fetch,{auth})).status,403);
 assert.equal((await cms(req('/equipo/activar',{password:'another-password'}),env,fetch,{auth})).status,403);
});
test('permissions enforced server-side, including reader writes and invitations',async()=>{
 const user={role:'reader',modules:['agenda'],email:'reader@example.com'};
 assert.equal(can(user,'agenda'),true);assert.equal(can(user,'agenda',true),false);assert.equal(can(user,'students'),false);
 for(const path of ['/cms/api/agenda','/cms/api/invitations','/cms/api/users'])assert.equal((await cms(req(path,{}),env,fetch,{auth,authenticate:async()=>user})).status,403);
 assert.equal((await cms(req('/cms/api/agenda'),env,fetch,{auth,authenticate:async()=>({...user,modules:[]})})).status,403);
});
test('panel updates retain actor and operation metadata without exposing unrelated records',async()=>{
 const user={id:'editor-id',email:'editor@example.com',role:'editor',modules:['agenda']};
 const fetcher=async()=>Response.json({results:[],has_more:false});
 const r=await cms(req('/cms/api/records/materials',{values:{Name:'Guía'} }),env,fetcher,{auth,authenticate:async()=>user});
 assert.equal(r.status,403);
});
test('activity details expose authorized related records without leaking properties',async()=>{
 const activity='33333333-3333-4333-8333-333333333333',related='44444444-4444-4444-8444-444444444444';
 const cmsEnv={...env,NOTION_TOKEN:'local-test',NOTION_AGENDA_ID:'55555555-5555-4555-8555-555555555555',CMS_CONNECTED_MODULES:'materials,registrations'};
 const user={role:'admin',modules:[],email:'admin@example.com'};let queries=[];
 const fetcher=async(url,options={})=>{
  if(url.endsWith('/pages/'+activity))return Response.json({id:activity,parent:{data_source_id:cmsEnv.NOTION_AGENDA_ID},archived:false,in_trash:false});
  queries.push(JSON.parse(options.body));
  if(url.endsWith('/data_sources/'+modules.materials.id+'/query'))return Response.json({results:[{id:related,last_edited_time:'v1',properties:{Name:{title:[{plain_text:'Guía de bienvenida'}]},Secret:{rich_text:[{plain_text:'no exportar'}]}}}]});
  return Response.json({results:[],has_more:false});
 };
 const r=await cms(req('/cms/api/related/agenda/'+activity),cmsEnv,fetcher,{auth,authenticate:async()=>user});
 assert.equal(r.status,200,await r.clone().text());const body=await r.json();assert.deepEqual(body.related[0],{key:'materials',label:'Materiales y archivo',records:[{id:related,label:'Guía de bienvenida',version:'v1'}]});assert.deepEqual(queries[0].filter,{property:'Agenda',relation:{contains:activity}});
});
test('CMS agenda forwards writes with session and rejects edits outside its source or stale revisions',async()=>{
 const id='11111111-1111-4111-8111-111111111111',data={title:'Una actividad',type:'Tertulia',start:'2026-10-01T19:00',end:'',location:'La Comarca',summary:'Encuentro',recurrence:'No repetir',status:'Confirmada',published:true,version:'revision-1'};
 const cmsEnv={...env,CMS_AGENDA_EDIT_ENABLED:'true',NOTION_TOKEN:'local-test',NOTION_AGENDA_ID:'22222222-2222-4222-8222-222222222222'};let writes=0;
 const fetcher=async(url,opts)=>{if(opts.method==='PATCH'){writes++;const body=JSON.parse(opts.body);assert.equal(body.parent,undefined);assert.equal(body.properties['Publicar en web'].checkbox,true);return Response.json({id});}return Response.json({parent:{data_source_id:cmsEnv.NOTION_AGENDA_ID},last_edited_time:'revision-1'});};
 const edit=body=>new Request(origin+'/cms/api/agenda/'+id,{method:'PATCH',headers:{Origin:origin,'Content-Type':'application/json','X-Comarca-Request':'cms'},body:JSON.stringify(body)});
 const deps={auth,authenticate:async()=>({email:env.TEAM_ADMIN_ACCOUNT,role:'admin',modules:['agenda']})};
 const r=await cms(edit(data),cmsEnv,fetcher,deps);assert.equal(r.status,200,await r.clone().text());assert.equal(writes,1);
 assert.equal((await cms(edit({...data,version:'stale'}),cmsEnv,fetcher,deps)).status,409);assert.equal(writes,1);
 assert.equal((await cms(edit(data),cmsEnv,async()=>Response.json({parent:{data_source_id:'another-source'},last_edited_time:'revision-1'}),deps)).status,404);
});
