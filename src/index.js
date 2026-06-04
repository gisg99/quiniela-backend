// =====================================================================
//  Punto de entrada del backend de la quiniela
// =====================================================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ name: 'quiniela-mageova API', status: 'ok' });
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`🏆 Backend de la quiniela escuchando en http://localhost:${PORT}`);
  console.log(`   Admin ${process.env.ADMIN_PASSWORD ? 'CON' : 'SIN'} contraseña`);
});
