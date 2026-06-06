-- =====================================================================
--  Migración: soporte multi-quiniela
--  Ejecutar UNA SOLA VEZ en la base de datos existente (Render u otra).
--
--  Qué hace:
--    1. Agrega quiniela_id = 1 a todos los participants actuales.
--    2. Agrega quiniela_id = 1 a todas las asignaciones actuales.
--    3. Cambia el UNIQUE(team_id) por UNIQUE(team_id, quiniela_id)
--       para que cada quiniela pueda asignar los mismos equipos.
-- =====================================================================

BEGIN;

-- 1. Columna quiniela_id en participants
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS quiniela_id INTEGER NOT NULL DEFAULT 1;

-- 2. Columna quiniela_id en participant_teams
ALTER TABLE participant_teams
  ADD COLUMN IF NOT EXISTS quiniela_id INTEGER NOT NULL DEFAULT 1;

-- 3. Eliminar el UNIQUE(team_id) original y reemplazarlo
--    por UNIQUE(team_id, quiniela_id)
ALTER TABLE participant_teams
  DROP CONSTRAINT IF EXISTS participant_teams_team_id_key;

ALTER TABLE participant_teams
  ADD CONSTRAINT participant_teams_team_quiniela_key
  UNIQUE (team_id, quiniela_id);

COMMIT;
