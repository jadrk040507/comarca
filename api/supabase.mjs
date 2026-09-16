/* Server-only Supabase boundary. Never expose the service role key to the browser. */
export function supabaseConfig(env){
 const url=typeof env.SUPABASE_URL==='string'?env.SUPABASE_URL.replace(/\/$/,''):'';
 if(!url||!/^https:\/\/[^/]+$/.test(url))throw Error('SUPABASE_URL is not configured');
 if(!env.SUPABASE_SERVICE_ROLE_KEY)throw Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
 return {url,key:env.SUPABASE_SERVICE_ROLE_KEY};
}

export async function supabaseRequest(env,path,{method='GET',body,signal}={}){
 const {url,key}=supabaseConfig(env);
 const response=await fetch(`${url}/${path.replace(/^\//,'')}`,{
  method,
  headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},
  body:body===undefined?undefined:JSON.stringify(body),signal
 });
 const text=await response.text();
 let data=null;try{data=text?JSON.parse(text):null;}catch{throw Error('Supabase returned invalid JSON');}
 if(!response.ok){const error=new Error('Supabase request failed');error.status=response.status;throw error;}
 return data;
}
