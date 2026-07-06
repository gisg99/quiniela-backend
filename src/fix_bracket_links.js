// =====================================================================
//  Migración: corrige el ENLACE del bracket de eliminatorias para que
//  coincida con el árbol real del Mundial 2026.
//
//  El mapeo grupo->ranura de dieciseisavos (P1..P16) ya era correcto; lo
//  único mal era cómo se enlazaban las rondas (qué dieciseisavos alimentan
//  cada octavos, y qué cuartos alimentan cada semifinal). Eso hacía que, por
//  ejemplo, Francia y Marruecos cayeran en el mismo octavos cuando en la
//  realidad se cruzan en cuartos.
//
//  Esta migración:
//    1) Actualiza IN SITU la estructura (sin re-seed, sin tocar
//       participantes ni sus equipos).
//    2) Resincroniza desde la fuente para recolocar equipos + marcadores +
//       fechas ya en el árbol correcto.
//
//  Es idempotente: se puede correr las veces que quieras.
//
//  Uso:  node src/fix_bracket_links.js
// =====================================================================
import pool, { query } from './db.js';
import { syncScores } from './sync.js';

// Estructura corregida (solo enlaces O/C/S; P y grupos quedan igual).
//   sources: [ [slot1_src_match, slot2_src_match], ... ]  -> tipo 'winner'
const OCTAVOS_SRC = {
  O1: ['P3', 'P6'],
  O2: ['P1', 'P4'],
  O3: ['P2', 'P5'],
  // O4..O8 ya estaban correctos.
};
const SEMIS_SRC = {
  S1: ['C1', 'C3'],
  S2: ['C2', 'C4'],
};
// Puntero next (a dónde va el GANADOR). Solo los que cambian.
const NEXT = {
  P1: 'O2', P2: 'O3', P3: 'O1', P4: 'O2', P5: 'O3', P6: 'O1',
  C2: 'S2', C3: 'S1',
};

async function run() {
  try {
    // 1) Fuentes de octavos + semifinales (con su etiqueta "Ganador PX").
    for (const [id, [s1, s2]] of [...Object.entries(OCTAVOS_SRC), ...Object.entries(SEMIS_SRC)]) {
      await query(
        `UPDATE knockout_matches
            SET slot_1_src_match=$1, slot_1_src_type='winner', slot_1_label=$2,
                slot_2_src_match=$3, slot_2_src_type='winner', slot_2_label=$4
          WHERE id=$5`,
        [s1, `Ganador ${s1}`, s2, `Ganador ${s2}`, id]
      );
    }
    // 2) Punteros next.
    for (const [id, next] of Object.entries(NEXT)) {
      await query('UPDATE knockout_matches SET next_match_id=$1 WHERE id=$2', [next, id]);
    }
    console.log('✓ Estructura del bracket corregida.');

    // 3) Resincroniza: recoloca equipos + marcadores + fechas en el árbol ya bueno.
    const res = await syncScores();
    console.log('✓ Resincronización:', JSON.stringify(res));
    console.log('\n✅ Listo. El bracket ya coincide con el árbol real del Mundial.');
  } catch (err) {
    console.error('\n❌ Error en la migración:', err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
