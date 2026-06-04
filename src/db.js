import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Devolver las columnas DATE (OID 1082) como texto 'YYYY-MM-DD' en vez de
// objetos Date, para evitar corrimientos de zona horaria y "Invalid date"
// en el frontend.
types.setTypeParser(1082, (v) => v);

const useSSL = String(process.env.PGSSL).toLowerCase() === 'true';

// Si hay DATABASE_URL la usamos; si no, caemos a las variables sueltas PG*.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'quiniela_mageova',
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    });

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de Postgres:', err);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
export default pool;
