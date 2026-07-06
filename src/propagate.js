// =====================================================================
//  Resolución automática de los slots de eliminatorias.
//
//  - Slots "1° Grupo X" / "2° Grupo X": se rellenan con la tabla del
//    grupo cuando ese grupo ya jugó sus 6 partidos.
//  - Slots "Ganador PX" / "Perdedor SX": se rellenan con el resultado
//    del partido origen.
//  - Slots "3° Grupo A/B/C/D/F" (mejores terceros): se dejan para que
//    el admin los asigne manualmente (no son deterministas).
//
//  La función es idempotente: se puede llamar tras cada cambio.
// =====================================================================
import { query } from './db.js';
import {
  getTeams, getGroupMatches, getKnockoutMatches,
  buildGroupStandings, knockoutResult,
} from './scoring.js';

const GROUP_SLOT = /^([12])° Grupo ([A-L])$/;

export async function recomputeKnockoutSlots() {
  const [teams, groupMatches, knockoutMatches] = await Promise.all([
    getTeams(), getGroupMatches(), getKnockoutMatches(),
  ]);

  const standings = buildGroupStandings(teams, groupMatches);
  const playedByGroup = {};
  for (const m of groupMatches) {
    playedByGroup[m.grupo] ??= 0;
    if (m.played) playedByGroup[m.grupo]++;
  }
  const groupComplete = (g) => (playedByGroup[g] || 0) >= 6;

  const byId = {};
  for (const m of knockoutMatches) byId[m.id] = { ...m };

  const resolveGroupSlot = (label) => {
    const mt = GROUP_SLOT.exec(label);
    if (!mt) return null; // mejores terceros u otro -> manual
    const pos = Number(mt[1]);
    const grupo = mt[2];
    if (!groupComplete(grupo)) return null;
    const row = standings[grupo]?.find((r) => r.pos === pos);
    return row ? row.team_id : null;
  };

  // Procesamos en orden de ronda para que los ganadores ya estén resueltos
  // antes de alimentar la ronda siguiente.
  const ordered = Object.values(byId).sort((a, b) => a.ronda - b.ronda || a.orden - b.orden);
  const updates = [];

  for (const m of ordered) {
    // Un partido YA JUGADO tiene participantes que son un hecho: los fijó
    // syncKnockout desde el fixture real. La propagación no debe reasignar
    // sus equipos (si lo hace, los goles reales quedan pegados a la pareja
    // equivocada). El partido sí se sigue usando como fuente ('winner'/
    // 'loser') para alimentar la ronda siguiente más abajo.
    if (m.played) continue;
    for (const slot of [1, 2]) {
      const srcType = m[`slot_${slot}_src_type`];
      const srcMatch = m[`slot_${slot}_src_match`];
      const label = m[`slot_${slot}_label`];
      let resolved = null;

      if (srcType === 'group') {
        resolved = resolveGroupSlot(label);
        // Si es un slot de tercero (no resoluble), respetamos lo que ya haya.
        if (resolved == null) continue;
      } else if (srcType === 'winner' || srcType === 'loser') {
        const src = byId[srcMatch];
        const res = src ? knockoutResult(src) : null;
        if (!res) continue; // aún no hay resultado -> no tocar
        resolved = srcType === 'winner' ? res.winner : res.loser;
      } else {
        continue;
      }

      const col = slot === 1 ? 'team_1_id' : 'team_2_id';
      if (m[col] !== resolved) {
        m[col] = resolved;
        updates.push({ id: m.id, col, value: resolved });
      }
    }
  }

  for (const u of updates) {
    await query(`UPDATE knockout_matches SET ${u.col} = $1 WHERE id = $2`, [u.value, u.id]);
  }
  return updates.length;
}
