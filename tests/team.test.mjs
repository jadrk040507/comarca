import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPair,SignJWT} from '../api/node_modules/jose/dist/webapi/index.js';
import {identity,team,activityPayload} from '../api/team.mjs';
const env={TEAM_ACCESS_ISSUER:'https://test-team.cloudflareaccess.com',TEAM_ACCESS_AUDIENCE:'test-aud',TEAM_ADMIN_ACCOUNT:'admin@example.com',NOTION_TOKEN:'test',NOTION_AGENDA_ID:'agenda',FORM_LIMIT:{limit:async()=>({success:true})}};
const {privateKey,publicKey}=await generateKeyPair('RS256');
const token=async (claims={},aud='test-aud',exp='1h')=>new SignJWT({email:'admin@example.com',...claims}).setProtectedHeader({alg:'RS256'}).setIssuer('https://test-team.cloudflareaccess.com').setAudience(aud).setSubject('user-id').setIssuedAt().setExpirationTime(exp).sign(privateKey);
const request=t=>new Request('https://example.com/equipo',{headers:{'Cf-Access-Jwt-Assertion':t}});
test('authenticated administrator only; expired, wrong audience, other email and forged tokens rejected',async()=>{
 assert.equal((await identity(request(await token()),env,publicKey)).role,'Administración');
 for(const t of [await token({},'other'),await token({email:'other@example.com'}),await token({},'test-aud','-1h'),'forged'])await assert.rejects(identity(request(t),env,publicKey));
 assert.equal((await team(new Request('https://example.com/equipo/api/agenda'),env)).status,403);
});
const v={title:'Prueba',type:'Catecismo',start:'2026-09-19T10:00',end:'2026-09-19T11:00',location:'Los Conejos',summary:'Preparación',recurrence:'Semanal'};
test('new activity remains private draft and keeps Mexico time',()=>{const p=activityPayload(v,'agenda');assert.equal(p.properties.Estado.select.name,'Borrador');assert.equal(p.properties['Publicar en web'].checkbox,false);assert.equal(p.properties.Fecha.date.start,'2026-09-19T10:00:00-06:00');assert.throws(()=>activityPayload({...v,start:'2026-02-30T10:00'},'agenda'));assert.throws(()=>activityPayload({...v,end:'2026-09-19T09:00'},'agenda'));});
test('cross-origin writes rejected; authorized same-origin write reaches only configured Notion source',async()=>{let calls=0;const fetcher=async(url,options)=>{calls++;assert.equal(url,'https://api.notion.com/v1/pages');assert.equal(JSON.parse(options.body).parent.data_source_id,'agenda');return Response.json({id:'new-id'});};const auth=async()=>({email:'admin@example.com'});const req=origin=>new Request('https://example.com/equipo/api/agenda',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','X-Comarca-Request':'team'},body:JSON.stringify(v)});assert.equal((await team(req('https://other.com'),env,fetcher,auth)).status,403);assert.equal(calls,0);assert.equal((await team(req('https://example.com'),env,fetcher,auth)).status,201);assert.equal(calls,1);});
test('private agenda does not expose unrelated Notion properties and is not cached',async()=>{const fetcher=async()=>Response.json({results:[{id:'1',properties:{Name:{title:[{plain_text:'Evento'}]},Inscripciones:{relation:[{id:'private'}]},Secret:{rich_text:[{plain_text:'hidden'}]}}}],has_more:false});const r=await team(new Request('https://example.com/equipo/api/agenda'),env,fetcher,async()=>({email:'admin@example.com'}));assert.equal(r.headers.get('Cache-Control'),'no-store');const text=await r.text();assert.doesNotMatch(text,/hidden|private/);assert.match(text,/Evento/);});
