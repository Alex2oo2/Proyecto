// Config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync(path.join(__dirname, '..', 'ca.pem')),
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function conectarBD() {
  try {
    const connection = await db.getConnection();
    console.log("¡Conexión exitosa a la base de datos MySQL!");
    connection.release();
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
  }
}

module.exports = { db, conectarBD };