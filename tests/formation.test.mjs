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
