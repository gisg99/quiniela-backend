// =====================================================================
//  Motor de cálculo: tabla de grupos, puntos de quiniela y reparto.
//
//  Modelo de puntos (NO acumulativo): cada equipo otorga los puntos
//  del hito MÁS lejano que alcanzó.
//    - Avanza de fase de grupos (llega a Dieciseisavos): 1
//    - Octavos:  3   - Cuartos: 5   - Semifinal: 10
//    - Final:   15   - Campeón: 20
//    - Ganador del 3er puesto: +2 (bonus sobre sus 10 de semifinal => 12)
// =====================================================================
import { query } from './db.js';

export const STAGE_LABEL = {
  none: 'Eliminado en grupos',
  r32: 'Dieciseisavos',
  oct: 'Octavos',
  cua: 'Cuartos',
  sem: 'Semifinal',
  fin: 'Subcampeón (Final)',
  champ: 'Campeón',
};

const STAGE_POINTS = { none: 0, r32: 1, oct: 3, cua: 5, sem: 10, fin: 15, champ: 20 };
const THIRD_PLACE_BONUS = 2;

// ---------------------------------------------------------------------
//  Acceso a datos
// ---------------------------------------------------------------------
export async function getTeams() {
  const { rows } = await query('SELECT * FROM teams ORDER BY grupo, pos_sorteo');
  return rows;
}
export async function getGroupMatches() {
  const { rows } = await query('SELECT * FROM group_matches ORDER BY jornada, id');
  return rows;
}
export async function getKnockoutMatches() {
  const { rows } = await query('SELECT * FROM knockout_matches ORDER BY ronda, orden');
  return rows;
}
export async function getPrizeTotal() {
  const { rows } = await query(`SELECT value FROM settings WHERE key='prize_total'`);
  return rows.length ? Number(rows[0].value) : Number(process.env.PRIZE_TOTAL || 6000);
}

// ---------------------------------------------------------------------
//  Tabla de cada grupo
// ---------------------------------------------------------------------
export function buildGroupStandings(teams, groupMatches) {
  const byGroup = {};
  for (const t of teams) {
    (byGroup[t.grupo] ??= {}).teams ??= {};
    byGroup[t.grupo].teams[t.id] = {
      team_id: t.id, name: t.name, bombo: t.bombo, grupo: t.grupo,
      pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0,
    };
  }

  for (const m of groupMatches) {
    if (!m.played || m.goles_1 == null || m.goles_2 == null) continue;
    const g = byGroup[m.grupo];
    if (!g) continue;
    const a = g.teams[m.team_1_id];
    const b = g.teams[m.team_2_id];
    if (!a || !b) continue;
    a.pj++; b.pj++;
    a.gf += m.goles_1; a.gc += m.goles_2;
    b.gf += m.goles_2; b.gc += m.goles_1;
    if (m.goles_1 > m.goles_2) { a.pg++; a.pts += 3; b.pp++; }
    else if (m.goles_1 < m.goles_2) { b.pg++; b.pts += 3; a.pp++; }
    else { a.pe++; b.pe++; a.pts++; b.pts++; }
  }

  const result = {};
  for (const grupo of Object.keys(byGroup).sort()) {
    const rows = Object.values(byGroup[grupo].teams).map((r) => ({ ...r, dg: r.gf - r.gc }));
    rows.sort((x, y) =>
      y.pts - x.pts || y.dg - x.dg || y.gf - x.gf || x.name.localeCompare(y.name)
    );
    rows.forEach((r, i) => { r.pos = i + 1; });
    result[grupo] = rows;
  }
  return result;
}

// ---------------------------------------------------------------------
//  Ganador / perdedor de un partido de eliminatoria
// ---------------------------------------------------------------------
export function knockoutResult(m) {
  if (!m.played || m.team_1_id == null || m.team_2_id == null) return null;
  if (m.goles_1 == null || m.goles_2 == null) return null;
  let winner, loser;
  if (m.goles_1 > m.goles_2) { winner = m.team_1_id; loser = m.team_2_id; }
  else if (m.goles_1 < m.goles_2) { winner = m.team_2_id; loser = m.team_1_id; }
  else {
    // Empate -> se decide por penales
    if (m.pen_1 == null || m.pen_2 == null || m.pen_1 === m.pen_2) return null;
    if (m.pen_1 > m.pen_2) { winner = m.team_1_id; loser = m.team_2_id; }
    else { winner = m.team_2_id; loser = m.team_1_id; }
  }
  return { winner, loser };
}

// ---------------------------------------------------------------------
//  Puntos por equipo (hito más lejano) + estado (vivo / eliminado)
// ---------------------------------------------------------------------
export function buildTeamScores(teams, groupMatches, knockoutMatches) {
  const stageFlags = {}; // teamId -> {r32, oct, cua, sem, fin, champ, third}
  const ensure = (id) => (stageFlags[id] ??= {});
  const slotSet = new Set();
  const eliminated = new Set();

  for (const m of knockoutMatches) {
    for (const id of [m.team_1_id, m.team_2_id]) {
      if (id == null) continue;
      slotSet.add(id);
      const f = ensure(id);
      if (m.ronda === 1) f.r32 = true;
      else if (m.ronda === 2) f.oct = true;
      else if (m.ronda === 3) f.cua = true;
      else if (m.ronda === 4) f.sem = true;
      if (m.id === 'Final') f.fin = true; // estar en la final = subcampeón mínimo
    }
    const res = knockoutResult(m);
    if (res) {
      eliminated.add(res.loser);
      if (m.id === 'Final') ensure(res.winner).champ = true;
      if (m.id === 'F3') ensure(res.winner).third = true;
    }
  }

  // Eliminados en fase de grupos: grupo completo (6 partidos jugados) y
  // el equipo no quedó en ningún slot de eliminatorias.
  const playedByGroup = {};
  for (const m of groupMatches) {
    playedByGroup[m.grupo] ??= 0;
    if (m.played) playedByGroup[m.grupo]++;
  }
  for (const t of teams) {
    if ((playedByGroup[t.grupo] || 0) >= 6 && !slotSet.has(t.id)) {
      eliminated.add(t.id);
    }
  }

  const scores = {};
  for (const t of teams) {
    const f = stageFlags[t.id] || {};
    let stage = 'none';
    if (f.champ) stage = 'champ';
    else if (f.fin) stage = 'fin';
    else if (f.sem) stage = 'sem';
    else if (f.cua) stage = 'cua';
    else if (f.oct) stage = 'oct';
    else if (f.r32) stage = 'r32';
    const bonus = f.third ? THIRD_PLACE_BONUS : 0;
    scores[t.id] = {
      team_id: t.id,
      name: t.name,
      bombo: t.bombo,
      grupo: t.grupo,
      stage,
      stage_label: STAGE_LABEL[stage] + (f.third ? ' + 3er puesto' : ''),
      base_points: STAGE_POINTS[stage],
      bonus,
      points: STAGE_POINTS[stage] + bonus,
      eliminated: eliminated.has(t.id),
      alive: !eliminated.has(t.id),
    };
  }
  return scores;
}

// ---------------------------------------------------------------------
//  Clasificación de la quiniela (participantes) + reparto del premio
// ---------------------------------------------------------------------
export async function buildQuinielaStandings() {
  const [teams, groupMatches, knockoutMatches, prize] = await Promise.all([
    getTeams(), getGroupMatches(), getKnockoutMatches(), getPrizeTotal(),
  ]);
  const teamScores = buildTeamScores(teams, groupMatches, knockoutMatches);

  const { rows: parts } = await query('SELECT * FROM participants ORDER BY name');
  const { rows: assigns } = await query(
    `SELECT pt.participant_id, pt.team_id FROM participant_teams pt`
  );
  const teamsByPart = {};
  for (const a of assigns) (teamsByPart[a.participant_id] ??= []).push(a.team_id);

  let totalPoints = 0;
  const standings = parts.map((p) => {
    const teamIds = teamsByPart[p.id] || [];
    const teamsDetail = teamIds
      .map((id) => teamScores[id])
      .filter(Boolean)
      .sort((a, b) => a.bombo - b.bombo);
    const points = teamsDetail.reduce((s, t) => s + t.points, 0);
    const alive = teamsDetail.filter((t) => t.alive).length;
    totalPoints += points;
    return {
      id: p.id, name: p.name, color: p.color,
      points, alive_teams: alive, teams_count: teamsDetail.length,
      teams: teamsDetail,
    };
  });

  for (const s of standings) {
    s.share = totalPoints > 0 ? s.points / totalPoints : 0;
    s.money = Math.round(s.share * prize * 100) / 100;
  }
  standings.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  standings.forEach((s, i) => { s.rank = i + 1; });

  return { standings, total_points: totalPoints, prize_total: prize };
}
