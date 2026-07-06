// =====================================================================
//  Sincronización de resultados/cruces del Mundial 2026.
//
//  Resuelve dos problemas:
//    1) Los CRUCES / GRUPOS de la BD están mal  -> applyStructure()
//       reconstruye la composición de grupos y los partidos de fase de
//       grupos a partir de los datos reales de la fuente.
//    2) Meter RESULTADOS a mano es pesado       -> syncScores()
//       baja los marcadores (grupos + eliminatorias) y los escribe.
//
//  Diseño clave: NO tocamos la plantilla del bracket (ids P1..Final,
//  next_match_id, propagación). Eso es el formato fijo de FIFA. La fuente
//  solo aporta: qué equipo va en qué grupo, quién juega contra quién y
//  los marcadores. Los ids de equipo locales nunca se borran, así que las
//  asignaciones de participant_teams sobreviven.
//
//  FUENTE DE DATOS (configurable con SYNC_PROVIDER):
//    - 'openfootball' (por defecto): JSON público de openfootball, sin key.
//    - 'apifootball': API-Football (requiere plan de pago para season 2026).
//  Cada proveedor normaliza a un "fixture común" y el resto de la lógica
//  (emparejar y escribir) es agnóstica de la fuente.
//
//  El emparejamiento de nombres (español <-> inglés) vive en teamNames.js.
// =====================================================================
import { query, getClient } from './db.js';
import { apiNameToLocal } from './teamNames.js';
import { recomputeKnockoutSlots } from './propagate.js';

const PROVIDER = (process.env.SYNC_PROVIDER || 'openfootball').toLowerCase();

export function isConfigured() {
  if (PROVIDER === 'openfootball') return true;       // no requiere key
  if (PROVIDER === 'apifootball') return Boolean(process.env.APIFOOTBALL_KEY);
  return false;
}

// =====================================================================
//  Fixture "común" que producen los proveedores:
//    { stage:'group'|'ko', grupo, jornada, koRound,
//      home, away, homeGoals, awayGoals, homePen, awayPen,
//      finished, live, date, time }
// =====================================================================
async function fetchNormalizedFixtures() {
  if (PROVIDER === 'openfootball') return fetchOpenfootball();
  if (PROVIDER === 'apifootball') return fetchApiFootball();
  throw new Error(`SYNC_PROVIDER desconocido: "${PROVIDER}"`);
}

// Interpreta la etiqueta de ronda de eliminatoria -> 1..4 | 'F3' | 'Final'.
function parseKoRound(round) {
  const r = (round || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (r.includes('32')) return 1;                       // Round of 32
  if (r.includes('roundof16') || r === '16') return 2;  // Round of 16
  if (r.includes('quarter')) return 3;                  // Quarter-final(s)
  if (r.includes('semi')) return 4;                     // Semi-final(s)
  if (r.includes('3rd') || r.includes('third')) return 'F3';
  if (r.includes('final')) return 'Final';
  return null;
}

const byDateTime = (a, b) => {
  const ka = `${a.date || ''}T${a.time || ''}`;
  const kb = `${b.date || ''}T${b.time || ''}`;
  return ka < kb ? -1 : ka > kb ? 1 : 0;
};

// ---------------------------------------------------------------------
//  Proveedor: openfootball (https://github.com/openfootball/worldcup.json)
// ---------------------------------------------------------------------
const OF_URL = process.env.OPENFOOTBALL_URL
  || 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

async function fetchOpenfootball() {
  const res = await fetch(OF_URL);
  if (!res.ok) throw new Error(`openfootball HTTP ${res.status}`);
  const json = await res.json();
  const matches = Array.isArray(json.matches) ? json.matches : [];

  // El "round" de openfootball en grupos es por jornada de calendario, no
  // la 1/2/3 de cada grupo. Derivamos la jornada por grupo ordenando sus
  // 6 partidos por fecha (2 por jornada).
  const buckets = new Map();
  for (const m of matches) {
    if (!m.group) continue;
    const g = groupLetter(m.group);
    (buckets.get(g) ?? buckets.set(g, []).get(g)).push(m);
  }
  const jornadaOf = new Map();
  for (const [, ms] of buckets) {
    [...ms].map((m) => ({ m, date: m.date, time: ofTime(m.time) }))
      .sort(byDateTime)
      .forEach((x, i) => jornadaOf.set(x.m, Math.floor(i / 2) + 1));
  }

  const out = [];
  for (const m of matches) {
    const sc = ofScore(m);
    const time = ofTime(m.time);
    if (m.group) {
      out.push({
        stage: 'group', grupo: groupLetter(m.group), jornada: jornadaOf.get(m) || null,
        koRound: null, home: m.team1, away: m.team2, date: m.date, time, ...sc,
      });
    } else {
      const koRound = parseKoRound(m.round);
      if (koRound == null) continue;
      out.push({
        stage: 'ko', grupo: null, jornada: null, koRound,
        home: m.team1, away: m.team2, date: m.date, time, ...sc,
      });
    }
  }
  return out;
}

function groupLetter(g) {
  return String(g || '').replace(/group\s*/i, '').trim().toUpperCase();
}
function ofTime(t) {
  const m = /(\d{1,2}:\d{2})/.exec(t || '');
  return m ? m[1] : null;
}
// openfootball score: { ft:[a,b], ht:[..], et:[..], p:[..] }
function ofScore(m) {
  const s = m.score || {};
  const ft = Array.isArray(s.ft) && s.ft.length === 2 ? s.ft : null;
  const et = Array.isArray(s.et) && s.et.length === 2 ? s.et : null;
  const p = Array.isArray(s.p) && s.p.length === 2 ? s.p : null;
  const finished = ft != null && ft[0] != null && ft[1] != null;
  const base = et || ft;   // si hubo prórroga, el marcador que decide es ET
  return {
    finished, live: false,
    homeGoals: base ? Number(base[0]) : null,
    awayGoals: base ? Number(base[1]) : null,
    homePen: p ? Number(p[0]) : null,
    awayPen: p ? Number(p[1]) : null,
  };
}

// ---------------------------------------------------------------------
//  Proveedor: API-Football (solo con plan de pago para season 2026)
// ---------------------------------------------------------------------
const AF_BASE = process.env.APIFOOTBALL_BASE || 'https://v3.football.api-sports.io';
const AF_LEAGUE = Number(process.env.APIFOOTBALL_LEAGUE || 1);
const AF_SEASON = Number(process.env.APIFOOTBALL_SEASON || 2026);
const AF_FINISHED = new Set(['FT', 'AET', 'PEN']);
const AF_LIVE = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'INT', 'LIVE', 'SUSP']);

async function fetchApiFootball() {
  const key = process.env.APIFOOTBALL_KEY;
  if (!key) throw new Error('Falta APIFOOTBALL_KEY en el entorno (.env).');
  const url = new URL(AF_BASE + '/fixtures');
  url.searchParams.set('league', String(AF_LEAGUE));
  url.searchParams.set('season', String(AF_SEASON));
  const res = await fetch(url, { headers: { 'x-apisports-key': key } });
  if (!res.ok) throw new Error(`API-Football HTTP ${res.status}`);
  const json = await res.json();
  const errs = json?.errors;
  if (Array.isArray(errs) ? errs.length : errs && Object.keys(errs).length) {
    throw new Error('API-Football devolvió errores: ' + JSON.stringify(errs));
  }
  const out = [];
  for (const fx of json.response || []) {
    const round = fx?.league?.round || '';
    const g = /group\s*([a-l])/i.exec(round);
    const short = fx?.fixture?.status?.short;
    const finished = AF_FINISHED.has(short);
    const live = AF_LIVE.has(short);
    const date = (fx?.fixture?.date || '').slice(0, 10) || null;
    const time = (fx?.fixture?.date || '').slice(11, 16) || null;
    const common = {
      home: fx?.teams?.home?.name, away: fx?.teams?.away?.name,
      homeGoals: fx?.goals?.home == null ? null : Number(fx.goals.home),
      awayGoals: fx?.goals?.away == null ? null : Number(fx.goals.away),
      homePen: fx?.score?.penalty?.home == null ? null : Number(fx.score.penalty.home),
      awayPen: fx?.score?.penalty?.away == null ? null : Number(fx.score.penalty.away),
      finished, live, date, time,
    };
    if (g) {
      const j = /(\d+)\s*$/.exec(round);
      out.push({ stage: 'group', grupo: g[1].toUpperCase(), jornada: j ? Number(j[1]) : null, koRound: null, ...common });
    } else {
      const koRound = parseKoRound(round);
      if (koRound != null) out.push({ stage: 'ko', grupo: null, jornada: null, koRound, ...common });
    }
  }
  return out;
}

// =====================================================================
//  Resolución de equipos: nombre de la fuente -> fila local
// =====================================================================
async function loadTeamIndex() {
  const { rows } = await query('SELECT id, name, grupo, bombo, pos_sorteo FROM teams');
  return { rows, byLocalName: new Map(rows.map((t) => [t.name, t])) };
}
function makeResolver(byLocalName) {
  const unmatched = new Set();
  const resolve = (name) => {
    const local = apiNameToLocal(name);
    const row = local ? byLocalName.get(local) : null;
    if (!row) { if (name) unmatched.add(name); return null; }
    return row;
  };
  return { resolve, unmatched };
}
const pairKey = (a, b) => [a, b].sort((x, y) => x - y).join('-');

// Exportado para la sonda de diagnóstico (probe).
export { fetchNormalizedFixtures };

// =====================================================================
//  1) PREVIEW de estructura (solo lectura, no escribe nada)
// =====================================================================
export async function previewStructure() {
  const fixtures = await fetchNormalizedFixtures();
  if (!fixtures.length) {
    return { ok: false, reason: `La fuente (${PROVIDER}) no devolvió partidos.`, fixtures: 0 };
  }

  const { rows: teams, byLocalName } = await loadTeamIndex();
  const { resolve, unmatched } = makeResolver(byLocalName);
  const currentGrupo = new Map(teams.map((t) => [t.id, t.grupo]));

  const groupFx = fixtures.filter((f) => f.stage === 'group');
  const koFx = fixtures.filter((f) => f.stage === 'ko');

  const newGroupByTeam = new Map();
  const newPairs = [];
  for (const f of groupFx) {
    const h = resolve(f.home), a = resolve(f.away);
    if (h) newGroupByTeam.set(h.id, f.grupo);
    if (a) newGroupByTeam.set(a.id, f.grupo);
    newPairs.push({
      grupo: f.grupo, jornada: f.jornada,
      home: h ? h.name : `??(${f.home})`, away: a ? a.name : `??(${f.away})`,
    });
  }

  const groupChanges = [];
  for (const [id, grupo] of newGroupByTeam) {
    if (currentGrupo.get(id) !== grupo) {
      groupChanges.push({ team: teams.find((x) => x.id === id)?.name, from: currentGrupo.get(id), to: grupo });
    }
  }
  const mentioned = new Set(newGroupByTeam.keys());
  const localMissing = teams.filter((t) => !mentioned.has(t.id)).map((t) => t.name);

  return {
    ok: true, provider: PROVIDER,
    fixtures_total: fixtures.length, group_fixtures: groupFx.length, ko_fixtures: koFx.length,
    group_changes: groupChanges,
    unmatched_api_names: [...unmatched],
    local_teams_not_in_api: localMissing,
    new_pairings: newPairs,
  };
}

// =====================================================================
//  2) APPLY estructura: corrige grupos + reconstruye partidos de grupos
//     y a continuación baja los marcadores. Es la operación "fuerte".
// =====================================================================
export async function applyStructure() {
  const fixtures = await fetchNormalizedFixtures();
  const groupFx = fixtures.filter((f) => f.stage === 'group');
  if (!groupFx.length) {
    throw new Error(`La fuente (${PROVIDER}) no devolvió partidos de fase de grupos; no se modifica nada.`);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { rows: teams } = await client.query('SELECT id, name, grupo, bombo, pos_sorteo FROM teams');
    const byLocalName = new Map(teams.map((t) => [t.name, t]));
    const createdTeams = [];

    async function resolveOrCreate(name, grupo) {
      const local = apiNameToLocal(name);
      if (local && byLocalName.has(local)) return byLocalName.get(local);
      const { rows } = await client.query(
        `INSERT INTO teams (name, bombo, grupo, pos_sorteo) VALUES ($1, 4, $2, 4)
         RETURNING id, name, grupo, bombo, pos_sorteo`,
        [local || name, grupo]
      );
      byLocalName.set(rows[0].name, rows[0]);
      createdTeams.push(rows[0].name);
      return rows[0];
    }

    const ordered = [...groupFx].sort(byDateTime);
    const groupOf = new Map();
    const rebuilt = [];
    for (const f of ordered) {
      const h = await resolveOrCreate(f.home, f.grupo);
      const a = await resolveOrCreate(f.away, f.grupo);
      groupOf.set(h.id, f.grupo);
      groupOf.set(a.id, f.grupo);
      rebuilt.push({
        grupo: f.grupo, jornada: f.jornada,
        team_1_id: h.id, team_2_id: a.id,
        fecha: f.date || null, hora: f.time || null,
        goles_1: f.finished || f.live ? f.homeGoals : null,
        goles_2: f.finished || f.live ? f.awayGoals : null,
        played: f.finished,
      });
    }

    for (const [id, grupo] of groupOf) {
      await client.query('UPDATE teams SET grupo = $1 WHERE id = $2', [grupo, id]);
    }

    await client.query('TRUNCATE group_matches');
    let n = 0;
    for (const m of rebuilt) {
      n += 1;
      await client.query(
        `INSERT INTO group_matches (id, grupo, jornada, team_1_id, team_2_id, fecha, hora, goles_1, goles_2, played)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [`G${n}`, m.grupo, m.jornada, m.team_1_id, m.team_2_id, m.fecha, m.hora, m.goles_1, m.goles_2, m.played]
      );
    }

    await client.query('COMMIT');
    await recomputeKnockoutSlots();
    const ko = await syncKnockout(fixtures);

    return { ok: true, provider: PROVIDER, teams_regrouped: groupOf.size, group_matches_rebuilt: n, teams_created: createdTeams, ko_updated: ko.updated };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// =====================================================================
//  3) syncScores: solo marcadores (NO reestructura). Idempotente.
//     Es la operación para el cron y el botón "Actualizar marcadores".
// =====================================================================
export async function syncScores(fixturesArg) {
  const fixtures = fixturesArg || await fetchNormalizedFixtures();
  const { byLocalName } = await loadTeamIndex();
  const { resolve } = makeResolver(byLocalName);

  const { rows: gms } = await query('SELECT id, team_1_id, team_2_id FROM group_matches');
  const byPair = new Map(gms.map((m) => [pairKey(m.team_1_id, m.team_2_id), m]));

  let groupUpdated = 0;
  for (const f of fixtures) {
    if (f.stage !== 'group') continue;
    if (!f.finished && !f.live) continue;
    const h = resolve(f.home), a = resolve(f.away);
    if (!h || !a) continue;
    const m = byPair.get(pairKey(h.id, a.id));
    if (!m) continue;   // el par no existe localmente (estructura sin corregir)
    const g1 = m.team_1_id === h.id ? f.homeGoals : f.awayGoals;
    const g2 = m.team_1_id === h.id ? f.awayGoals : f.homeGoals;
    await query('UPDATE group_matches SET goles_1=$1, goles_2=$2, played=$3 WHERE id=$4', [g1, g2, f.finished, m.id]);
    groupUpdated += 1;
  }

  await recomputeKnockoutSlots();
  const ko = await syncKnockout(fixtures);
  return { ok: true, provider: PROVIDER, group_updated: groupUpdated, ko_updated: ko.updated };
}

// ---------------------------------------------------------------------
//  Eliminatorias: asigna equipos reales + marcador, ronda a ronda para
//  que la propagación de ganadores alimente la ronda siguiente.
// ---------------------------------------------------------------------
async function syncKnockout(fixtures) {
  const { byLocalName } = await loadTeamIndex();
  const { resolve } = makeResolver(byLocalName);

  const koByRound = new Map();
  for (const f of fixtures) {
    if (f.stage !== 'ko') continue;
    (koByRound.get(f.koRound) ?? koByRound.set(f.koRound, []).get(f.koRound)).push(f);
  }

  let updated = 0;
  for (const ronda of [1, 2, 3, 4, 'F3', 'Final']) {
    const fxs = koByRound.get(ronda);
    if (!fxs || !fxs.length) continue;

    const { rows: locals } = await query('SELECT * FROM knockout_matches');
    const inRound = locals.filter((m) =>
      ronda === 'F3' ? m.id === 'F3'
        : ronda === 'Final' ? m.id === 'Final'
          : m.ronda === ronda && m.id !== 'F3' && m.id !== 'Final');

    for (const f of fxs) {
      const h = resolve(f.home), a = resolve(f.away);
      if (!h || !a) continue;
      const ids = new Set([h.id, a.id]);
      // 1) Preferimos el slot con la pareja EXACTA (ambos equipos). Así un
      //    slot que solo comparte un equipo (por una predicción distinta a
      //    la realidad) no se lleva el marcador de otro cruce.
      let match = inRound.find((m) => ids.has(m.team_1_id) && ids.has(m.team_2_id));
      // 2) Si no, un slot que comparta al menos un equipo real.
      if (!match) match = inRound.find((m) => (m.team_1_id && ids.has(m.team_1_id)) || (m.team_2_id && ids.has(m.team_2_id)));
      // 3) Si no, un único slot vacío disponible en la ronda.
      if (!match) {
        const empties = inRound.filter((m) => !m.team_1_id && !m.team_2_id);
        if (empties.length === 1) match = empties[0];
      }
      if (!match) continue;

      await query(
        `UPDATE knockout_matches SET team_1_id=$1, team_2_id=$2, goles_1=$3, goles_2=$4, pen_1=$5, pen_2=$6, played=$7 WHERE id=$8`,
        [
          h.id, a.id,
          f.finished || f.live ? f.homeGoals : null,
          f.finished || f.live ? f.awayGoals : null,
          f.homePen, f.awayPen, f.finished, match.id,
        ]
      );
      match.team_1_id = h.id; match.team_2_id = a.id;   // no reusar en la misma ronda
      updated += 1;
    }
    await recomputeKnockoutSlots();
  }
  return { updated };
}
