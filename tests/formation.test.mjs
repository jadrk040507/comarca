import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesCatalog} from '../public/formation.js';
import {questions,library} from '../scripts/formation.mjs';
test('buscar sin acentos, con varias palabras y filtro de tema',()=>{
 assert(matchesCatalog('San Josemaría · Oración','Opus Dei',' josemaria oracion ',''));
 assert(!matchesCatalog('San Josemaría · Oración','Opus Dei','josemaria','Biblia'));
 assert(!matchesCatalog('Vida de Cristo','Espiritualidad','cristo lewis',''));
 assert(matchesCatalog('Vida de Cristo','Espiritualidad','','Espiritualidad'));
});
test('preguntas enlazables y recursos con fuentes HTTPS',()=>{
 assert.equal(new Set(questions.map(q=>q[0])).size,questions.length);
 for(const q of questions) assert.match(q[4],/^https:\/\//);
 for(const r of library) assert.match(r[5],/^https:\/\//);
});

const {prayers,prayerbook}=await import('../scripts/prayerbook.mjs');
test('el devocionario conserva anclas únicas y versiones completas en ambos idiomas',()=>{
 assert.equal(new Set(prayers.map(p=>p.id)).size,prayers.length);
 for(const p of prayers){assert.ok(p.es.trim().length>20);assert.ok(p.la.trim().length>20);}
 for(const id of ['padrenuestro','avemaria','gloria','angelus','salve-regina','adoro-te-devote','lauda-sion','laudate-dominum','evangelio','tantum-ergo'])assert.ok(prayers.some(p=>p.id===id));
 const html=prayerbook('/comarca/');assert.ok(html.includes('/comarca/guias/retiro/'));assert.equal((html.match(/lang="la"/g)||[]).length,prayers.length);
 assert.ok(matchesCatalog('Regina cæli','Con María','regina caeli',''));
});
