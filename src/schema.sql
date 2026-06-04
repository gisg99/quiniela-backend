-- =====================================================================
--  Schema de la quiniela del Mundial 2026 (quiniela-mageova)
-- =====================================================================

-- Equipos (48). El bombo y el grupo vienen de los CSV.
CREATE TABLE IF NOT EXISTS teams (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  bombo       INTEGER NOT NULL CHECK (bombo BETWEEN 1 AND 4),
  grupo       TEXT NOT NULL,           -- 'A' .. 'L'
  pos_sorteo  INTEGER NOT NULL         -- 1..4 posición dentro del grupo en el sorteo
);

-- Participantes (las 12 personas). Se crean desde la app (Ajustes).
CREATE TABLE IF NOT EXISTS participants (
  id     SERIAL PRIMARY KEY,
  name   TEXT NOT NULL,
  color  TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Asignación de equipos a participantes (1 por bombo => 4 por persona).
-- Un equipo pertenece a un solo participante (UNIQUE en team_id).
CREATE TABLE IF NOT EXISTS participant_teams (
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  team_id        INTEGER NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  PRIMARY KEY (participant_id, team_id)
);

-- Partidos de fase de grupos (72).
CREATE TABLE IF NOT EXISTS group_matches (
  id         TEXT PRIMARY KEY,          -- 'G1' .. 'G72'
  grupo      TEXT NOT NULL,
  jornada    INTEGER NOT NULL,          -- 1..3
  team_1_id  INTEGER NOT NULL REFERENCES teams(id),
  team_2_id  INTEGER NOT NULL REFERENCES teams(id),
  fecha      DATE,
  hora       TEXT,
  goles_1    INTEGER,
  goles_2    INTEGER,
  played     BOOLEAN NOT NULL DEFAULT FALSE
);

-- Partidos de eliminatorias (33: P1-16, O1-8, C1-4, S1-2, F3, Final).
-- slot_*_label guarda el texto original ("2° Grupo A", "Ganador P1", ...).
-- slot_*_src_match / slot_*_src_type permiten auto-propagar ganadores/perdedores.
CREATE TABLE IF NOT EXISTS knockout_matches (
  id              TEXT PRIMARY KEY,     -- 'P1'.. 'Final'
  fase            TEXT NOT NULL,
  ronda           INTEGER NOT NULL,     -- 1=16avos 2=8vos 3=4tos 4=semis 5=final/3er
  orden           INTEGER NOT NULL,     -- orden para mostrar
  slot_1_label    TEXT NOT NULL,
  slot_2_label    TEXT NOT NULL,
  slot_1_src_match TEXT,                -- match origen del slot (si aplica)
  slot_1_src_type  TEXT,                -- 'winner' | 'loser' | 'group'
  slot_2_src_match TEXT,
  slot_2_src_type  TEXT,
  team_1_id       INTEGER REFERENCES teams(id),
  team_2_id       INTEGER REFERENCES teams(id),
  fecha           DATE,
  hora            TEXT,
  goles_1         INTEGER,
  goles_2         INTEGER,
  pen_1           INTEGER,              -- penales (solo si hay empate)
  pen_2           INTEGER,
  played          BOOLEAN NOT NULL DEFAULT FALSE,
  next_match_id   TEXT,                 -- a dónde va el GANADOR
  next_loser_match_id TEXT             -- a dónde va el PERDEDOR (semis -> 3er puesto)
);

-- Tabla simple de configuración (clave/valor).
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);
