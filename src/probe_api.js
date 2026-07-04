// =====================================================================
//  Sonda de diagnóstico de la fuente de datos. NO escribe en la BD.
//
//  Uso:  npm run probe   (o  node src/probe_api.js)
//
//  Verifica, según el SYNC_PROVIDER activo (openfootball por defecto):
//    - que la fuente responde y trae partidos del Mundial 2026,
//    - que los nombres de equipo casan con nuestro diccionario (teamNames),
//    - que las rondas (grupos/eliminatorias) se interpretan bien.
//  Imprime un resumen y la lista de nombres SIN casar (para añadir alias).
// =====================================================================
import dotenv from 'dotenv';
import { fetchNormalizedFixtures } from './sync.js';
import { apiNameToLocal } from './teamNames.js';

dotenv.config();

async function main() {
  const provider = (process.env.SYNC_PROVIDER || 'openfootball');
  console.log(`Proveedor: ${provider}\n`);

  const fixtures = await fetchNormalizedFixtures();
  const groups = fixtures.filter((f) => f.stage === 'group');
  const ko = fixtures.filter((f) => f.stage === 'ko');
  const played = fixtures.filter((f) => f.finished).length;

  console.log(`Partidos recibidos: ${fixtures.length}`);
  console.log(`  · fase de grupos:  ${groups.length}`);
  console.log(`  · eliminatorias:   ${ko.length}`);
  console.log(`  · ya jugados:      ${played}`);

  // Grupos detectados y rondas KO.
  const grupos = [...new Set(groups.map((f) => f.grupo))].sort();
  const koRounds = [...new Set(ko.map((f) => f.koRound))];
  console.log(`\nGrupos: ${grupos.join(', ')}`);
  console.log(`Rondas KO: ${koRounds.join(', ')}`);

  // Nombres sin casar con el diccionario.
  const names = new Set();
  for (const f of fixtures) { if (f.home) names.add(f.home); if (f.away) names.add(f.away); }
  const unmatched = [...names].filter((n) => !apiNameToLocal(n));
  console.log(`\nEquipos distintos: ${names.size}  |  sin casar: ${unmatched.length}`);
  if (unmatched.length) {
    console.log('⚠️  Añade estos nombres como alias en teamNames.js:');
    for (const n of unmatched) console.log('   -', JSON.stringify(n));
  } else {
    console.log('✓ Todos los equipos casan con el diccionario.');
  }

  // Ejemplo de partido jugado (para ver el marcador normalizado).
  const sample = fixtures.find((f) => f.finished) || fixtures[0];
  console.log('\nEjemplo normalizado:');
  console.log(JSON.stringify(sample, null, 2));
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
