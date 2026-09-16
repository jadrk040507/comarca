import test from 'node:test';
import assert from 'node:assert/strict';
import {publishedMaterial,readPublicMaterials,publicMaterials} from '../api/public-materials.mjs';
const page={id:'11111111-1111-4111-8111-111111111111',properties:{Name:{title:[{plain_text:'Guía'}]},'Publicar en web':{checkbox:true},Vigencia:{select:{name:'Vigente'}},Enlace:{url:'https://example.com/guia.pdf'},'Resumen público':{rich_text:[{plain_text:'Guía de lectura'}]},Alumno:{relation:[{id:'private'}]},Secret:{rich_text:[{plain_text:'not public'}]}}};
test('public materials require explicit publication AND current status, exporting only public fields',()=>{
 const data=publishedMaterial(page);assert.equal(data.title,'Guía');assert.doesNotMatch(JSON.stringify(data),/private|not public|Alumno/);
 for(const changes of [{'Publicar en web':{checkbox:false}},{Vigencia:{select:{name:'Borrador'}}},{Vigencia:{select:{name:'Histórico'}}},{Enlace:{url:'javascript:alert(1)'}}])assert.equal(publishedMaterial({...page,properties:{...page.properties,...changes}}),null);
});
test('public query filters at source and disabled connection does not call Notion',async()=>{
 const data=await readPublicMaterials({NOTION_TOKEN:'test'},async(url,options)=>{const body=JSON.parse(options.body);assert.equal(body.filter.and[0].checkbox.equals,true);assert.equal(body.filter.and[1].select.equals,'Vigente');return Response.json({results:[page],has_more:false});});assert.equal(data.resources.length,1);
 assert.equal((await publicMaterials(new Request('https://example.com/public/materials'),{},()=>{throw Error('Must not fetch');})).status,503);
});
