export const TZ='America/Mexico_City';
export const parseDate=s=>new Date(s.length===10?s+'T12:00:00-06:00':s);
export const localDay=s=>new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s));
export function occurrence(e,now=new Date()){
 e={...e};let s=parseDate(e.start),end=e.end?parseDate(e.end):null;
 if(e.recurrence==='Semanal'){const n=Math.max(0,Math.ceil((now-s)/604800000));s=new Date(+s+n*604800000);if(end)end=new Date(+end+n*604800000);}
 if(e.recurrence==='Anual')while(s<now){s.setUTCFullYear(s.getUTCFullYear()+1);if(end)end.setUTCFullYear(end.getUTCFullYear()+1);}
 if(e.repeatUntil&&localDay(s)>e.repeatUntil.slice(0,10))return null;
 if(['Semanal','Anual'].includes(e.recurrence)){e.start=e.start.length===10?localDay(s):s.toISOString();if(end)e.end=e.end.length===10?localDay(end):end.toISOString();}
 const until=end||s;if(!e.end||e.end.length===10?localDay(until)<localDay(now):until<now)return null;return e;
}
const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const stamp=s=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
const fold=line=>{let out='',part='';for(const c of line){if(new TextEncoder().encode(part+c).length>74){out+=part+'\r\n ';part='';}part+=c;}return out+part;};
export function calendar(events,now=new Date()){
 const a=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//La Comarca//Agenda//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:La Comarca'];
 for(const e of events){a.push('BEGIN:VEVENT',`UID:${e.id}@la-comarca`,`DTSTAMP:${stamp(now)}`,`SUMMARY:${esc(e.title)}`);
 if(e.start.length===10){a.push('DTSTART;VALUE=DATE:'+e.start.replaceAll('-',''));const end=parseDate(e.end||e.start);end.setUTCDate(end.getUTCDate()+1);a.push('DTEND;VALUE=DATE:'+localDay(end).replaceAll('-',''));}else{a.push('DTSTART:'+stamp(e.start));if(e.end)a.push('DTEND:'+stamp(e.end));}
 if(['Semanal','Anual'].includes(e.recurrence))a.push('RRULE:FREQ='+(e.recurrence==='Semanal'?'WEEKLY':'YEARLY')+(e.repeatUntil?';UNTIL='+stamp(e.repeatUntil.slice(0,10)+'T23:59:59-06:00'):''));
 a.push('LOCATION:'+esc(e.location),'DESCRIPTION:'+esc(e.summary),'STATUS:'+(e.status==='Cancelada'?'CANCELLED':e.status==='Tentativa'?'TENTATIVE':'CONFIRMED'),'END:VEVENT');}
 return [...a,'END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
}
