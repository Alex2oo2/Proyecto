// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { conectarBD } = require('./Config/db.js');

// Importar las rutas
const authRoutes = require('./Routes/authRoutes.js');
const usuarioRoutes = require('./Routes/usuarioRoutes.js');
const catalogoRoutes = require('./Routes/catalogoRoutes.js');
const seguridadRoutes = require('./Routes/seguridadRoutes.js');
const planillaRoutes = require('./Routes/planillaRoutes.js');

const app = express();

// CORS: en local permite todo; en producción solo tu frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // 'x-role-id' permite el paso del middleware de autorización desde el Front
  allowedHeaders: ['Content-Type', 'Authorization', 'x-role-id']
}));

app.use(express.json());

// Registro de Endpoints
app.use('/auth', authRoutes);
app.use('/usuario', usuarioRoutes);
app.use('/catalogos', catalogoRoutes);
app.use('/seguridad', seguridadRoutes);
app.use('/planilla', planillaRoutes);

// Iniciar servidor (UNA sola vez)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
  conectarBD();
});