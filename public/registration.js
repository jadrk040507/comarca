export async function initRegistration(config,events=[]){
 const form=document.querySelector('#native-registration');if(!form)return;
 if(!config.registrationApi||!config.turnstileSiteKey)return;
 const status=form.querySelector('[role=status]'),button=form.querySelector('[type=submit]');let widget=null,token='';
 status.textContent='Preparando la verificación…';
 const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;
 script.onload=()=>{widget=window.turnstile.render('#registration-challenge',{sitekey:config.turnstileSiteKey,action:'inscripcion',theme:'light',callback:value=>{token=value;button.disabled=false;status.textContent='';},'expired-callback':()=>{token='';button.disabled=true;},'error-callback':()=>{token='';button.disabled=true;status.textContent='No se pudo cargar la verificación. Recarga la página para intentarlo de nuevo.';}});};
 script.onerror=()=>{status.textContent='No se pudo cargar la verificación. Recarga la página para intentarlo de nuevo.';};document.head.append(script);
 const group=document.createElement('optgroup');group.label='Actividades de la agenda';for(const e of events.filter(e=>!['Cancelada','Realizada','Borrador'].includes(e.status)&&e.type!=='Fiesta y aniversario')){const option=new Option(e.title,'event:'+e.id);option.dataset.eventId=e.id;group.append(option);}if(group.children.length)form.elements.activity.prepend(group);
 const eventId=new URL(location.href).searchParams.get('evento');if(eventId&&[...form.elements.activity.options].some(o=>o.dataset.eventId===eventId))form.elements.activity.value='event:'+eventId;
 const requestActivity=new URL(location.href).searchParams.get('actividad');if(requestActivity&&[...form.elements.activity.options].some(o=>o.value===requestActivity))form.elements.activity.value=requestActivity;
 if(requestActivity==='Proponer una actividad'){try{const draft=sessionStorage.getItem('comarca-proposal');if(draft){form.elements.message.value=draft;sessionStorage.removeItem('comarca-proposal');}}catch{}}
 form.addEventListener('submit',async event=>{event.preventDefault();if(!form.reportValidity()||!token)return;const fields=new FormData(form);const input={name:fields.get('name'),email:fields.get('email'),activity:form.elements.activity.selectedOptions[0]?.dataset.eventId?form.elements.activity.selectedOptions[0].text:fields.get('activity'),eventId:form.elements.activity.selectedOptions[0]?.dataset.eventId||'',phone:fields.get('phone'),message:fields.get('message'),website:fields.get('website'),privacy:fields.has('privacy'),emailOptIn:fields.has('emailOptIn'),whatsappOptIn:fields.has('whatsappOptIn'),token};button.disabled=true;status.textContent='Enviando tu solicitud…';
 try{const response=await fetch(config.registrationApi,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(30000)});const result=await response.json();if(!response.ok||result.ok!==true)throw Error(result.message||'No pudimos confirmar el registro. Consulta al equipo antes de volver a enviarlo.');status.textContent=result.message;form.reset();form.querySelector('fieldset').disabled=true;status.focus();return;}
 catch(error){status.textContent=error.name==='TimeoutError'||error instanceof TypeError?'No pudimos confirmar el registro. Consulta al equipo antes de volver a enviarlo.':error.message;}
 token='';window.turnstile.reset(widget);
 });
}
