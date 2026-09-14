import {createAuth,cmsIdentity,can,digest} from './cms-auth.mjs';
import {identity,team} from './team.mjs';
import {cmsHTML,cmsJS} from './cms-ui.mjs';

const security={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; img-src 'self' https://la-comarca.github.io; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
const reply=(data,status=200,type='application/json')=>new Response(type==='application/json'?JSON.stringify(data):data,{status,headers:{...security,'Content-Type':type+';charset=utf-8'}});
export async function jsonBody(request){let parts=[],length=0;const reader=request.body?.getReader();if(!reader)throw Error('body');for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>12000){await reader.cancel();throw Error('body');}parts.push(value);}return JSON.parse(await new Blob(parts).text());}
export const sameOrigin=request=>request.headers.get('Origin')===new URL(request.url).origin&&request.headers.get('X-Comarca-Request')==='cms'&&request.headers.get('Content-Type')?.startsWith('application/json');
export function invitationInput(v){if(typeof v.email!=='string'||v.email.length>254||!/^\S+@\S+\.\S+$/.test(v.email)||!['reader','editor'].includes(v.role)||!Array.isArray(v.modules)||v.modules.length!==1||v.modules[0]!=='agenda')throw Error('invite');return {email:v.email.trim().toLowerCase(),role:v.role,modules:v.modules};}

export async function cms(request,env,fetcher=fetch,dependencies={}) {
 const path=new URL(request.url).pathname.replace(/\/$/,''),method=request.method;
 if(method==='GET'&&(path==='/cms'||path==='/equipo/activar'))return reply(cmsHTML,200,'text/html');
 if(method==='GET'&&path==='/cms/app.js')return reply(cmsJS,200,'text/javascript');
 if(!env.CMS_DB||!env.CMS_AUTH_SECRET)return reply({message:'El acceso propio está terminando de configurarse.'},503);
 try {
  const auth=dependencies.auth||createAuth(env);
  if(path.startsWith('/cms/auth/')){
   // Public signup and account-changing endpoints are deliberately not mounted.
   const allowed={'/cms/auth/sign-in/email':'POST','/cms/auth/sign-out':'POST','/cms/auth/get-session':'GET','/cms/auth/change-password':'POST'};
   if(allowed[path]!==method)return reply({message:'Ruta no disponible.'},404);
   if(method==='POST'&&!sameOrigin(request))return reply({message:'Solicitud no permitida.'},403);
   if(method==='POST'){
    if(!env.FORM_LIMIT||!(await env.FORM_LIMIT.limit({key:'cms-auth:'+request.headers.get('CF-Connecting-IP')})).success)return reply({message:'Espera un minuto antes de intentarlo de nuevo.'},429);
    const body=await jsonBody(request);request=new Request(request.url,{method,headers:request.headers,body:JSON.stringify(body)});
   }
   const response=await auth.handler(request),headers=new Headers(response.headers);for(const [key,value] of Object.entries(security))headers.set(key,value);
   return new Response(response.body,{status:response.status,headers});
  }
  if(method==='POST'&&!sameOrigin(request))return reply({message:'Solicitud no permitida.'},403);
  if(method==='POST'&&(!env.FORM_LIMIT||!(await env.FORM_LIMIT.limit({key:'cms-write:'+request.headers.get('CF-Connecting-IP')})).success))return reply({message:'Espera un minuto antes de guardar otra vez.'},429);
  if(path==='/equipo/activar'&&method==='POST'){
   let admin;try{admin=await (dependencies.bootstrapIdentity||identity)(request,env);}catch{return reply({message:'Verifica tu cuenta de administrador para activar el acceso.'},403);}
   const v=await jsonBody(request);
   await auth.api.signUpEmail({body:{email:admin.email,name:'Administrador',password:v.password}});
   return reply({message:'Cuenta creada. Ya puedes entrar con tu correo y contraseña en el nuevo panel.'},201);
  }
  if(path==='/cms/api/accept-invitation'&&method==='POST'){
   const v=await jsonBody(request);if(typeof v.token!=='string'||!/^[a-f0-9]{64}$/.test(v.token)||typeof v.name!=='string'||!v.name.trim()||v.name.length>100)return reply({message:'Invitación no válida.'},400);
   const invite=await env.CMS_DB.prepare('UPDATE cms_invitations SET used = 1 WHERE hash = ? AND used = 0 AND expires > ? RETURNING email, role, modules').bind(await digest(v.token),Date.now()).first();
   if(!invite)return reply({message:'La invitación venció o ya fue utilizada. Pide una nueva al administrador.'},400);
   await auth.api.signUpEmail({body:{email:invite.email,name:v.name.trim(),password:v.password}});
   await env.CMS_DB.prepare('INSERT INTO cms_grants(email,role,modules,active) VALUES(?,?,?,1) ON CONFLICT(email) DO UPDATE SET role=excluded.role, modules=excluded.modules, active=1').bind(invite.email,invite.role,invite.modules).run();
   return reply({message:'Cuenta activada. Entra con tu correo y contraseña.'},201);
  }
  let user;try{user=await (dependencies.authenticate||cmsIdentity)(request,env,auth);}catch{return reply({message:'Inicia sesión con una cuenta autorizada.'},401);}
  if(path==='/cms/api/me'&&method==='GET')return reply({name:user.name,email:user.email,role:user.role,modules:user.modules,canUpdate:env.CMS_AGENDA_EDIT_ENABLED==='true'});
  if(path==='/cms/api/invitations'&&method==='POST'){
   if(user.role!=='admin')return reply({message:'Solo administración puede invitar.'},403);
   let v;try{v=invitationInput(await jsonBody(request));}catch{return reply({message:'Revisa el correo y los permisos.'},400);}
   if(v.email===env.TEAM_ADMIN_ACCOUNT?.toLowerCase())return reply({message:'La cuenta administradora ya está reservada.'},400);
   const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
   await env.CMS_DB.batch([
    env.CMS_DB.prepare('UPDATE cms_invitations SET used=1 WHERE email=?').bind(v.email),
    env.CMS_DB.prepare('INSERT INTO cms_invitations(hash,email,role,modules,expires,used) VALUES(?,?,?,?,?,0)').bind(await digest(token),v.email,v.role,JSON.stringify(v.modules),Date.now()+48*60*60*1000)
   ]);
   return reply({url:new URL('/cms/#invitacion='+token,request.url).href,message:'Enlace privado válido durante 48 horas. Compártelo únicamente con la persona invitada.'},201);
  }
  if(path==='/cms/api/users'&&method==='GET'){
   if(user.role!=='admin')return reply({message:'Acceso restringido.'},403);
   const {results}=await env.CMS_DB.prepare('SELECT email, role, modules, active FROM cms_grants ORDER BY email LIMIT 100').all();return reply({users:results});
  }
  if(path==='/cms/api/users'&&method==='POST'){
   if(user.role!=='admin')return reply({message:'Acceso restringido.'},403);
   const v=await jsonBody(request);if(typeof v.email!=='string'||v.email===env.TEAM_ADMIN_ACCOUNT?.toLowerCase())return reply({message:'Cuenta no válida.'},400);
   await env.CMS_DB.batch([env.CMS_DB.prepare('UPDATE cms_grants SET active=0 WHERE email=?').bind(v.email.toLowerCase()),env.CMS_DB.prepare('UPDATE cms_invitations SET used=1 WHERE email=?').bind(v.email.toLowerCase())]);
   return reply({message:'Acceso revocado.'});
  }
  if(path==='/cms/api/agenda'||/^\/cms\/api\/agenda\/[a-f0-9-]{36}$/.test(path)){
   if(method==='PATCH'&&env.CMS_AGENDA_EDIT_ENABLED!=='true')return reply({message:'Falta habilitar la actualización de Agenda en Notion. Puedes crear borradores mientras tanto.'},503);
   if(!can(user,'agenda',method!=='GET'))return reply({message:'Tu cuenta no puede realizar esta acción.'},403);
   const url=new URL(request.url);url.pathname=url.pathname.replace('/cms/api','/equipo/api');
   const headers=new Headers(request.headers);headers.set('X-Comarca-Request','team');
   return team(new Request(url,new Request(request,{headers})),env,fetcher,async()=>user);
  }
  return reply({message:'Ruta no disponible.'},404);
 }catch{return reply({message:'No se pudo completar la operación. Si intentabas crear una cuenta, comprueba tu invitación o pide ayuda al administrador.'},400);}
}
