# Quiniela Mageova · Backend

API en **Node.js + Express + PostgreSQL** para la quiniela del Mundial 2026.

## Puesta en marcha

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Crea la base de datos en Postgres (una vez):
   ```sql
   CREATE DATABASE quiniela_mageova;
   ```

3. Copia `.env.example` a `.env` y rellena tu conexión:
   ```bash
   cp .env.example .env
   ```
   Puedes usar `DATABASE_URL` **o** las variables `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE`.

4. Crea las tablas y carga equipos/partidos/bracket:
   ```bash
   npm run seed
   ```
   - `npm run seed`  → crea tablas (si no existen) y recarga el catálogo del torneo
     **sin borrar** participantes.
   - `npm run reset` → **borra todo** (incluye participantes) y recarga desde cero.

5. Arranca el servidor:
   ```bash
   npm run dev     # con recarga automática
   # o
   npm start
   ```
   Por defecto escucha en `http://localhost:4000`.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión completa (opcional). |
| `PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE` | Conexión por partes (si no usas `DATABASE_URL`). |
| `PGSSL` | `true` si tu Postgres remoto requiere SSL. |
| `PORT` | Puerto del API (4000 por defecto). |
| `ADMIN_PASSWORD` | Contraseña para capturar resultados. Si está vacía, modo abierto. |
| `PRIZE_TOTAL` | Premio total a repartir (6000 por defecto). |

## Modelo de puntos (no acumulativo)

Cada equipo otorga **solo los puntos del hito más lejano** que alcanza:

| Hito | Puntos |
|---|---|
| Avanza de fase de grupos (Dieciseisavos) | 1 |
| Octavos | 3 |
| Cuartos | 5 |
| Semifinal | 10 |
| Final (subcampeón) | 15 |
| Campeón | 20 |
| Ganador del 3er puesto | **+2** sobre sus 10 de semifinal (= 12) |

El premio se reparte proporcional a los puntos de cada participante.

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Estado + si requiere admin. |
| GET | `/api/summary` | Datos de la pantalla de Inicio. |
| GET | `/api/teams` | 48 equipos con bombo/grupo/dueño. |
| GET | `/api/groups` | Tablas calculadas de los 12 grupos. |
| GET | `/api/matches` | Partidos de fase de grupos. |
| GET | `/api/knockout` | Bracket de eliminatorias. |
| GET | `/api/standings` | Clasificación de la quiniela + reparto. |
| GET/POST | `/api/participants` | Listar / crear participantes. |
| PUT/DELETE | `/api/participants/:id` | Editar (nombre/color) / borrar. |
| PUT | `/api/participants/:id/teams` | Asignar sus equipos (1 por bombo). |
| PUT | `/api/matches/:id` 🔒 | Capturar marcador de grupos. |
| PUT | `/api/knockout/:id` 🔒 | Capturar marcador / fijar terceros. |

🔒 = requiere cabecera `x-admin-password` si `ADMIN_PASSWORD` está configurada.

## Notas del bracket

- Los cruces de eliminatorias se **auto-rellenan**: los `1°/2°` de grupo se toman
  de la tabla cuando el grupo termina sus 6 partidos, y los `Ganador/Perdedor` se
  propagan al capturar resultados.
- Los **mejores terceros** (`3° Grupo A/B/C/D/F`) no son deterministas, así que se
  asignan a mano desde la pantalla **Admin → Eliminatorias** (selector de equipo).
- Empates en eliminatoria: captura también los **penales** para definir al ganador.
