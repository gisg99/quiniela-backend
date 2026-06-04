// =====================================================================
//  Seed: crea el schema e inserta equipos, partidos de grupos y bracket.
//
//  Uso:
//    npm run seed     -> crea tablas si no existen y carga los datos
//                        (equipos/partidos) sin tocar participantes.
//    npm run reset    -> BORRA todo (incluye participantes) y recarga.
// =====================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pool, { getClient } from './db.js';
import { TEAMS, GROUP_MATCHES, KNOCKOUT_MATCHES } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESET = process.argv.includes('--reset');

// DD/MM/YYYY -> YYYY-MM-DD (formato DATE de Postgres)
function toISO(ddmmyyyy) {
  const [d, m, y] = ddmmyyyy.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

async function run() {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1) Schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);

    if (RESET) {
      console.log('⚠️  RESET: borrando todas las tablas de datos...');
      await client.query(`
        TRUNCATE participant_teams, participants,
                 group_matches, knockout_matches, teams, settings
        RESTART IDENTITY CASCADE;
      `);
    } else {
      // Recarga limpia de catálogo (equipos/partidos), conservando participantes.
      await client.query('TRUNCATE group_matches, knockout_matches CASCADE;');
      // Solo borramos equipos si no hay asignaciones para no romper FKs.
      const { rows } = await client.query('SELECT COUNT(*)::int AS c FROM participant_teams;');
      if (rows[0].c === 0) {
        await client.query('TRUNCATE teams RESTART IDENTITY CASCADE;');
      }
    }

    // 2) Equipos (upsert por nombre)
    const teamId = {};
    for (const t of TEAMS) {
      const { rows } = await client.query(
        `INSERT INTO teams (name, bombo, grupo, pos_sorteo)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (name) DO UPDATE
           SET bombo = EXCLUDED.bombo,
               grupo = EXCLUDED.grupo,
               pos_sorteo = EXCLUDED.pos_sorteo
         RETURNING id;`,
        [t.name, t.bombo, t.grupo, t.pos]
      );
      teamId[t.name] = rows[0].id;
    }
    console.log(`✓ ${TEAMS.length} equipos cargados`);

    // 3) Partidos de fase de grupos
    for (const [id, grupo, jornada, e1, e2, fecha, hora] of GROUP_MATCHES) {
      await client.query(
        `INSERT INTO group_matches (id, grupo, jornada, team_1_id, team_2_id, fecha, hora)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, grupo, jornada, teamId[e1], teamId[e2], toISO(fecha), hora]
      );
    }
    console.log(`✓ ${GROUP_MATCHES.length} partidos de fase de grupos cargados`);

    // 4) Eliminatorias
    for (const m of KNOCKOUT_MATCHES) {
      await client.query(
        `INSERT INTO knockout_matches
          (id, fase, ronda, orden,
           slot_1_label, slot_2_label,
           slot_1_src_match, slot_1_src_type,
           slot_2_src_match, slot_2_src_type,
           fecha, hora, next_match_id, next_loser_match_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
        [
          m.id, m.fase, m.ronda, m.orden,
          m.s1.label, m.s2.label,
          m.s1.src.match, m.s1.src.type,
          m.s2.src.match, m.s2.src.type,
          toISO(m.fecha), m.hora, m.next || null, m.nextLoser || null,
        ]
      );
    }
    console.log(`✓ ${KNOCKOUT_MATCHES.length} partidos de eliminatorias cargados`);

    // 5) Settings por defecto
    await client.query(
      `INSERT INTO settings (key, value) VALUES ('prize_total', $1)
       ON CONFLICT (key) DO NOTHING`,
      [process.env.PRIZE_TOTAL || '6000']
    );

    await client.query('COMMIT');
    console.log('\n✅ Seed completado correctamente.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error en el seed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
