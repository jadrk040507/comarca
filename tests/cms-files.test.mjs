import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fileType,uploadFile} from '../api/cms-files.mjs';
import {modules} from '../api/cms-records.mjs';
const id='22222222-2222-4222-8222-222222222222';
const env={NOTION_TOKEN:'test',CMS_CONNECTED_MODULES:'materials',CMS_AGENDA_EDIT_ENABLED:'true'};
function request(){const body=new FormData();body.set('version','v1');body.set('file',new File(['%PDF-1.7\nfixture'],'test.pdf',{type:'application/pdf'}));return new Request('https://example.com/cms/api/files/materials/'+id,{method:'POST',body});}
test('uploads inspect bytes instead of trusting file extensions',()=>{
 assert.equal(fileType(new TextEncoder().encode('%PDF-1.7')),'application/pdf');
 assert.throws(()=>fileType(new TextEncoder().encode('<svg>')));
 assert.throws(()=>fileType(new TextEncoder().encode('<html>')));
});
test('upload checks editing permission before reading or sending a file',async()=>{
 await assert.rejects(uploadFile(request(),env,{role:'reader',modules:['materiales']},'materials',id,()=>{throw Error('must not fetch');}),e=>e.status===403);
});
test('upload preserves existing attachments and refuses changed records',async()=>{
 for(const page of [{last_edited_time:'v2',properties:{}},{last_edited_time:'v1',properties:{Archivo:{files:[{name:'existing.pdf'}]}}}]){
  let calls=0;await assert.rejects(uploadFile(request(),env,{role:'admin'},'materials',id,async()=>{calls++;return Response.json({...page,parent:{data_source_id:modules.materials.id}});}),e=>e.status===409);assert.equal(calls,1);
 }
});
test('file attaches only after upload succeeds and ownership is checked again',async()=>{
 let calls=0;const page={id,last_edited_time:'v1',parent:{data_source_id:modules.materials.id},properties:{Archivo:{files:[]}}};
 const result=await uploadFile(request(),env,{role:'admin'},'materials',id,async(url,opts)=>{
  calls++;if(calls===1||calls===4)return Response.json(page);
  if(calls===2){assert.ok(url.endsWith('/file_uploads'));return Response.json({id:'upload-id'});}
  if(calls===3){assert.ok(opts.body instanceof FormData);assert.equal(opts.headers['Content-Type'],undefined);return Response.json({status:'uploaded'});}
  assert.equal(opts.method,'PATCH');assert.equal(JSON.parse(opts.body).properties.Archivo.files[0].file_upload.id,'upload-id');return Response.json(page);
 });assert.equal(calls,5);assert.equal(result.record.id,id);
});
