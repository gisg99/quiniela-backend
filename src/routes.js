// =====================================================================
//  Rutas de la API
// =====================================================================
import { Router } from 'express';
import { query } from './db.js';
import {
  getTeams, getGroupMatches, getKnockoutMatches, getPrizeTotal,
  buildGroupStandings, buildTeamScores, buildQuinielaStandings,
} from './scoring.js';
import { recomputeKnockoutSlots } from './propagate.js';

const router = Router();

// --- Middleware de admin (solo para escribir resultados) ---
function requireAdmin(req, res, next) {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return next(); // sin contraseña configurada => modo abierto
  const given = req.get('x-admin-password');
  if (given && given === pass) return next();
  return res.status(401).json({ error: 'No autorizado. Contraseña de admin incorrecta.' });
}

const asyncH = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({ error: err.message || 'Error interno' });
  });

// =====================================================================
//  Salud / config
// =====================================================================
router.get('/health', asyncH(async (req, res) => {
  await query('SELECT 1');
  res.json({ ok: true, admin_required: Boolean(process.env.ADMIN_PASSWORD) });
}));

router.post('/admin/login', (req, res) => {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) return res.json({ ok: true, open: true });
  const given = req.body?.password;
  if (given === pass) return res.json({ ok: true });
  return res.status(401).json({ ok: false, error: 'Contraseña incorrecta' });
});

// =====================================================================
//  Equipos
// =====================================================================
router.get('/teams', asyncH(async (req, res) => {
  const teams = await getTeams();
  const { rows: assigns } = await query('SELECT participant_id, team_id FROM participant_teams');
  const ownerByTeam = {};
  for (const a of assigns) ownerByTeam[a.team_id] = a.participant_id;
  res.json(teams.map((t) => ({ ...t, owner_id: ownerByTeam[t.id] || null })));
}));

// =====================================================================
//  Participantes
// =====================================================================
router.get('/participants', asyncH(async (req, res) => {
  const { rows: parts } = await query('SELECT * FROM participants ORDER BY name');
  const { rows: assigns } = await query(
    `SELECT pt.participant_id, pt.team_id, t.name, t.bombo, t.grupo
       FROM participant_teams pt JOIN teams t ON t.id = pt.team_id`
  );
  const byPart = {};
  for (const a of assigns) (byPart[a.participant_id] ??= []).push(a);
  res.json(parts.map((p) => ({
    ...p,
    teams: (byPart[p.id] || []).sort((x, y) => x.bombo - y.bombo),
  })));
}));

router.post('/participants', asyncH(async (req, res) => {
  const { name, color } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const { rows } = await query(
    'INSERT INTO participants (name, color) VALUES ($1, $2) RETURNING *',
    [name.trim(), color || '#3b82f6']
  );
  res.status(201).json(rows[0]);
}));

router.put('/participants/:id', asyncH(async (req, res) => {
  const { name, color } = req.body || {};
  const { rows } = await query(
    `UPDATE participants
        SET name = COALESCE($1, name), color = COALESCE($2, color)
      WHERE id = $3 RETURNING *`,
    [name ?? null, color ?? null, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Participante no encontrado' });
  res.json(rows[0]);
}));

router.delete('/participants/:id', asyncH(async (req, res) => {
  await query('DELETE FROM participants WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// Asignar los equipos de un participante. Espera { team_ids: [..] }.
// Valida: máx. 1 equipo por bombo y que no estén tomados por otro.
router.put('/participants/:id/teams', asyncH(async (req, res) => {
  const participantId = Number(req.params.id);
  const teamIds = Array.isArray(req.body?.team_ids) ? req.body.team_ids.map(Number) : [];

  const part = await query('SELECT id FROM participants WHERE id=$1', [participantId]);
  if (!part.rows.length) return res.status(404).json({ error: 'Participante no encontrado' });

  if (teamIds.length) {
    const { rows: teams } = await query(
      'SELECT id, bombo FROM teams WHERE id = ANY($1)', [teamIds]
    );
    if (teams.length !== teamIds.length) {
      return res.status(400).json({ error: 'Algún equipo no existe' });
    }
    const bombos = teams.map((t) => t.bombo);
    if (new Set(bombos).size !== bombos.length) {
      return res.status(400).json({ error: 'Solo se permite 1 equipo por bombo' });
    }
    if (bombos.length > 4) {
      return res.status(400).json({ error: 'Máximo 4 equipos por participante' });
    }
    // ¿Tomado por otro participante?
    const { rows: taken } = await query(
      `SELECT team_id FROM participant_teams
        WHERE team_id = ANY($1) AND participant_id <> $2`,
      [teamIds, participantId]
    );
    if (taken.length) {
      return res.status(409).json({
        error: 'Uno o más equipos ya están asignados a otro participante',
        team_ids: taken.map((t) => t.team_id),
      });
    }
  }

  await query('DELETE FROM participant_teams WHERE participant_id = $1', [participantId]);
  for (const tid of teamIds) {
    await query(
      'INSERT INTO participant_teams (participant_id, team_id) VALUES ($1,$2)',
      [participantId, tid]
    );
  }
  res.json({ ok: true, team_ids: teamIds });
}));

// =====================================================================
//  Grupos (tabla calculada)
// =====================================================================
router.get('/groups', asyncH(async (req, res) => {
  const [teams, groupMatches] = await Promise.all([getTeams(), getGroupMatches()]);
  const standings = buildGroupStandings(teams, groupMatches);
  const { rows: assigns } = await query('SELECT participant_id, team_id FROM participant_teams');
  const ownerByTeam = {};
  for (const a of assigns) ownerByTeam[a.team_id] = a.participant_id;

  const out = {};
  for (const [grupo, rows] of Object.entries(standings)) {
    out[grupo] = rows.map((r) => ({ ...r, owner_id: ownerByTeam[r.team_id] || null }));
  }
  res.json(out);
}));

// =====================================================================
//  Partidos de fase de grupos
// =====================================================================
router.get('/matches', asyncH(async (req, res) => {
  const { rows } = await query(`
    SELECT gm.*, t1.name AS team_1_name, t2.name AS team_2_name
      FROM group_matches gm
      JOIN teams t1 ON t1.id = gm.team_1_id
      JOIN teams t2 ON t2.id = gm.team_2_id
     ORDER BY gm.fecha, gm.hora, gm.id
  `);
  res.json(rows);
}));

router.put('/matches/:id', requireAdmin, asyncH(async (req, res) => {
  const { goles_1, goles_2, played } = req.body || {};
  const g1 = goles_1 === '' || goles_1 == null ? null : Number(goles_1);
  const g2 = goles_2 === '' || goles_2 == null ? null : Number(goles_2);
  const isPlayed = played != null ? Boolean(played) : (g1 != null && g2 != null);

  const { rows } = await query(
    `UPDATE group_matches SET goles_1=$1, goles_2=$2, played=$3 WHERE id=$4 RETURNING *`,
    [g1, g2, isPlayed, req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Partido no encontrado' });
  await recomputeKnockoutSlots(); // un grupo puede haberse completado
  res.json(rows[0]);
}));

// =====================================================================
//  Eliminatorias (bracket)
// =====================================================================
router.get('/knockout', asyncH(async (req, res) => {
  const matches = await getKnockoutMatches();
  const { rows: tnames } = await query('SELECT id, name FROM teams');
  const nameById = Object.fromEntries(tnames.map((t) => [t.id, t.name]));
  const { rows: assigns } = await query('SELECT participant_id, team_id FROM participant_teams');
  const ownerByTeam = {};
  for (const a of assigns) ownerByTeam[a.team_id] = a.participant_id;

  res.json(matches.map((m) => ({
    ...m,
    team_1_name: m.team_1_id ? nameById[m.team_1_id] : null,
    team_2_name: m.team_2_id ? nameById[m.team_2_id] : null,
    team_1_owner: m.team_1_id ? ownerByTeam[m.team_1_id] || null : null,
    team_2_owner: m.team_2_id ? ownerByTeam[m.team_2_id] || null : null,
  })));
}));

// Capturar resultado de eliminatoria. Permite además fijar manualmente
// los equipos de un cruce (p. ej. los mejores terceros): { team_1_id, team_2_id }.
router.put('/knockout/:id', requireAdmin, asyncH(async (req, res) => {
  const { goles_1, goles_2, pen_1, pen_2, played, team_1_id, team_2_id } = req.body || {};
  const num = (v) => (v === '' || v == null ? null : Number(v));
  const g1 = num(goles_1), g2 = num(goles_2);

  const fields = [];
  const vals = [];
  let i = 1;
  const set = (col, val) => { fields.push(`${col}=$${i++}`); vals.push(val); };

  if (team_1_id !== undefined) set('team_1_id', num(team_1_id));
  if (team_2_id !== undefined) set('team_2_id', num(team_2_id));
  if (goles_1 !== undefined) set('goles_1', g1);
  if (goles_2 !== undefined) set('goles_2', g2);
  if (pen_1 !== undefined) set('pen_1', num(pen_1));
  if (pen_2 !== undefined) set('pen_2', num(pen_2));
  if (played !== undefined) set('played', Boolean(played));
  else if (goles_1 !== undefined && goles_2 !== undefined) set('played', g1 != null && g2 != null);

  if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
  vals.push(req.params.id);

  const { rows } = await query(
    `UPDATE knockout_matches SET ${fields.join(', ')} WHERE id=$${i} RETURNING *`,
    vals
  );
  if (!rows.length) return res.status(404).json({ error: 'Partido no encontrado' });
  await recomputeKnockoutSlots(); // propaga ganadores/perdedores
  res.json(rows[0]);
}));

// Forzar re-cálculo del bracket (por si se quiere recalcular a mano)
router.post('/knockout/recompute', requireAdmin, asyncH(async (req, res) => {
  const n = await recomputeKnockoutSlots();
  res.json({ ok: true, updated: n });
}));

// =====================================================================
//  Clasificación de la quiniela + reparto
// =====================================================================
router.get('/standings', asyncH(async (req, res) => {
  res.json(await buildQuinielaStandings());
}));

// =====================================================================
//  Resumen para la pantalla de Inicio
// =====================================================================
router.get('/summary', asyncH(async (req, res) => {
  const [teams, groupMatches, knockoutMatches, standingsData] = await Promise.all([
    getTeams(), getGroupMatches(), getKnockoutMatches(), buildQuinielaStandings(),
  ]);
  const teamScores = buildTeamScores(teams, groupMatches, knockoutMatches);
  const nameById = Object.fromEntries(teams.map((t) => [t.id, t.name]));

  const { rows: assigns } = await query('SELECT participant_id, team_id FROM participant_teams');
  const ownerByTeam = {};
  for (const a of assigns) ownerByTeam[a.team_id] = a.participant_id;

  // Próximos partidos (grupos + eliminatorias) no jugados, por fecha/hora.
  const upcoming = [];
  for (const m of groupMatches) {
    if (m.played) continue;
    upcoming.push({
      kind: 'group', id: m.id, fase: `Grupo ${m.grupo}`, fecha: m.fecha, hora: m.hora,
      team_1: nameById[m.team_1_id], team_2: nameById[m.team_2_id],
      team_1_owner: ownerByTeam[m.team_1_id] || null,
      team_2_owner: ownerByTeam[m.team_2_id] || null,
    });
  }
  for (const m of knockoutMatches) {
    if (m.played) continue;
    upcoming.push({
      kind: 'knockout', id: m.id, fase: m.fase, fecha: m.fecha, hora: m.hora,
      team_1: m.team_1_id ? nameById[m.team_1_id] : m.slot_1_label,
      team_2: m.team_2_id ? nameById[m.team_2_id] : m.slot_2_label,
      team_1_owner: m.team_1_id ? ownerByTeam[m.team_1_id] || null : null,
      team_2_owner: m.team_2_id ? ownerByTeam[m.team_2_id] || null : null,
    });
  }
  upcoming.sort((a, b) => {
    const da = `${a.fecha}T${a.hora || '00:00'}`;
    const db = `${b.fecha}T${b.hora || '00:00'}`;
    return da < db ? -1 : da > db ? 1 : 0;
  });

  const playedGroup = groupMatches.filter((m) => m.played).length;
  const playedKo = knockoutMatches.filter((m) => m.played).length;

  res.json({
    next_matches: upcoming.slice(0, 4),
    standings: standingsData.standings,
    total_points: standingsData.total_points,
    prize_total: standingsData.prize_total,
    progress: {
      group_played: playedGroup, group_total: groupMatches.length,
      ko_played: playedKo, ko_total: knockoutMatches.length,
    },
    alive_by_participant: standingsData.standings.map((s) => ({
      id: s.id, name: s.name, color: s.color,
      alive: s.alive_teams, total: s.teams_count,
    })),
  });
}));

export default router;
