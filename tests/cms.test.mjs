import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {cms} from '../api/cms.mjs';
import {createAuth,can} from '../api/cms-auth.mjs';
const origin='https://example.com';
const db=new DatabaseSync(':memory:');
for(const f of ['0001_auth.sql','0002_permissions.sql'])db.exec(readFileSync(new URL('../api/migrations/'+f,import.meta.url),'utf8'));
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
