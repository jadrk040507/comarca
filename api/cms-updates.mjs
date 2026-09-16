import {can} from './cms-auth.mjs';
import {permissionKeys,modulePermission} from './cms-records.mjs';
export async function recordUpdate(env,user,module,id,action,metadata={}){
 // A saved Notion record must not be reported as failed if the activity log is unavailable.
 try{await env.CMS_DB.prepare('INSERT INTO cms_updates(id,permission,module,record_id,action,actor,created,metadata) VALUES(?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),modulePermission(module),module,id,action,user.id||user.email||'system',Date.now(),JSON.stringify(metadata)).run();}catch{console.warn('cms_update_log_unavailable');}
}
export async function recentUpdates(env,user){
 const permissions=permissionKeys.filter(p=>can(user,p));if(!permissions.length)return [];
 const {results}=await env.CMS_DB.prepare('SELECT module, record_id, action, actor, created, metadata FROM cms_updates WHERE permission IN ('+permissions.map(()=>'?').join(',')+') ORDER BY created DESC LIMIT 50').bind(...permissions).all();return results.map(row=>({...row,metadata:JSON.parse(row.metadata||'{}')}));
}
