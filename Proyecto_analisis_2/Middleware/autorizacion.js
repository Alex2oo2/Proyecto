const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const roleOpcionModel = require('../Model/roleOpcionModel.js');
const { db } = require('../Config/db.js');

const JWT_SECRET = process.env.JWT_SECRET;

// Verifica el token y adjunta la info del usuario/rol a la petición
function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ mensaje: 'No autorizado: token no proporcionado.' });
  }

  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).json({ mensaje: 'Token inválido o expirado.' });
    }
    try {
      const [rows] = await db.query(
        'SELECT SesionActual FROM USUARIO WHERE IdUsuario = ?',
        [payload.IdUsuario]
      );
      const sesionHash = crypto.createHash('sha256').update(token).digest('hex');
      if (!rows[0] || rows[0].SesionActual !== sesionHash) {
        return res.status(401).json({ mensaje: 'Sesión cerrada o reemplazada.' });
      }
      req.usuario = payload; // { IdUsuario, IdRole, NombreRole }
      next();
    } catch (error) {
      console.error('Error al validar la sesión:', error);
      res.status(500).json({ mensaje: 'Error interno al validar la sesión.' });
    }
  });
}

// Verifica que el rol del token tenga el permiso solicitado sobre una opción
function verificarPermisos(nombreOpcion, tipoPermiso) {
  return async (req, res, next) => {
    try {
      if (!req.usuario || !req.usuario.IdRole) {
        return res.status(401).json({ mensaje: 'No autorizado: sesión no válida.' });
      }

      const idRole = req.usuario.IdRole;
      const tienePermiso = await roleOpcionModel.verificarPermiso(idRole, nombreOpcion, tipoPermiso);

      if (tienePermiso === 1) {
        next();
      } else {
        return res.status(403).json({
          mensaje: `Acceso denegado: tu rol no tiene permiso para ${tipoPermiso} en la opción ${nombreOpcion}.`
        });
      }
    } catch (error) {
      console.error("Error en el middleware de autorización:", error);
      res.status(500).json({ error: 'Error interno al verificar permisos.' });
    }
  };
}

module.exports = { autenticar, verificarPermisos };