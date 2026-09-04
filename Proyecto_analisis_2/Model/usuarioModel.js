const { db } = require('../Config/db.js');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function buscarParaLogin(idUsuario, password) {
  const sql = `
    SELECT u.IdUsuario, u.Nombre, u.Apellido, u.CorreoElectronico, u.IdStatusUsuario, 
           u.IntentosDeAcceso, u.RequiereCambiarPassword, u.UltimaFechaCambioPassword,
           u.FechaModificacion, u.IdRole, r.Nombre as NombreRole
    FROM USUARIO u
    INNER JOIN ROLE r ON u.IdRole = r.IdRole
    WHERE u.IdUsuario = ? AND u.Password = ?
  `;
  const [rows] = await db.query(sql, [idUsuario, password]);
  return rows[0];
}

async function obtenerPorId(idUsuario) {
  const sql = `
    SELECT u.IdUsuario, u.Password, u.Nombre, u.Apellido, u.CorreoElectronico, u.IdStatusUsuario, 
           u.IntentosDeAcceso, u.RequiereCambiarPassword, u.UltimaFechaCambioPassword,
           u.FechaModificacion, u.IdRole, r.Nombre as NombreRole, u.Pregunta, u.Respuesta
    FROM USUARIO u
    INNER JOIN ROLE r ON u.IdRole = r.IdRole
    WHERE u.IdUsuario = ?
  `;
  const [rows] = await db.query(sql, [idUsuario]);
  return rows[0];
}

async function registrarIntentoFallido(idUsuario, intentosActuales) {
  const nuevosIntentos = intentosActuales + 1;
  const sql = `UPDATE USUARIO SET IntentosDeAcceso = ? WHERE IdUsuario = ?`;
  await db.query(sql, [nuevosIntentos, idUsuario]);
  return nuevosIntentos;
}

async function bloquearUsuario(idUsuario, idStatusBloqueado) {
  const sql = `
    UPDATE USUARIO 
    SET IdStatusUsuario = ?, FechaModificacion = NOW() 
    WHERE IdUsuario = ?
  `;
  await db.query(sql, [idStatusBloqueado, idUsuario]);
}

// Agregar estas funciones al archivo usuarioModel.js existente

async function registrarLoginExitoso(idUsuario, idStatusActivo) {
  const sql = `
    UPDATE USUARIO 
    SET IntentosDeAcceso = 0, IdStatusUsuario = ?, UltimaFechaIngreso = NOW()
    WHERE IdUsuario = ?
  `;
  await db.query(sql, [idStatusActivo, idUsuario]);
}

async function registrarSesion(idUsuario, sesion) {
  const sesionHash = crypto.createHash('sha256').update(sesion).digest('hex');
  const sql = `
    UPDATE USUARIO
    SET SesionActual = ?, IntentosDeAcceso = 0, IdStatusUsuario = ?,
        UltimaFechaIngreso = NOW()
    WHERE IdUsuario = ?
  `;
  await db.query(sql, [sesionHash, 1, idUsuario]);
}

async function cerrarSesion(idUsuario) {
  const sql = `UPDATE USUARIO SET SesionActual = NULL WHERE IdUsuario = ?`;
  await db.query(sql, [idUsuario]);
}

async function actualizarPasswordMigrada(idUsuario, hashedPassword) {
  await db.query(
    'UPDATE USUARIO SET Password = ?, UltimaFechaCambioPassword = NOW() WHERE IdUsuario = ?',
    [hashedPassword, idUsuario]
  );
}

// Reemplaza tu resetearIntentosYEstado por registrarLoginExitoso en el controller.
// module.exports = { ..., registrarLoginExitoso, cerrarSesion };

async function crearUsuario(usuario) {
  const { 
    IdUsuario, Nombre, Apellido, FechaNacimiento, Password, 
    IdGenero, CorreoElectronico, TelefonoMovil, IdSucursal, 
    Pregunta, Respuesta, IdRole, RequiereCambiarPassword, Fotografia, UsuarioCreacion 
  } = usuario;
  
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(Password, salt);

  const sql = `
    INSERT INTO USUARIO (
      IdUsuario, Nombre, Apellido, FechaNacimiento, IdStatusUsuario, 
      Password, IdGenero, IntentosDeAcceso, CorreoElectronico, 
      RequiereCambiarPassword, TelefonoMovil, IdSucursal, 
      Pregunta, Respuesta, IdRole, FechaCreacion, 
      UsuarioCreacion, Fotografia, FechaModificacion, UsuarioModificacion
    )
    VALUES (
      ?, ?, ?, ?, 1, 
      ?, ?, 0, ?, 
      ?, ?, ?, 
      ?, ?, ?, NOW(), 
      ?, ?, NULL, NULL
    )
  `;
  
  const creador = UsuarioCreacion || IdUsuario;

  await db.query(sql, [
    IdUsuario, Nombre, Apellido, FechaNacimiento, 
    hashedPassword, IdGenero, CorreoElectronico,
    RequiereCambiarPassword ? 1 : 0, TelefonoMovil, IdSucursal,
    Pregunta, Respuesta, IdRole,
    creador,
    Fotografia ? Buffer.from(Fotografia, 'base64') : null
  ]);
}

async function actualizarContraseña(idUsuario, hashedPassword, clearRequiereCambiar = false) {
  const sql = `
    UPDATE USUARIO 
    SET Password = ?, UltimaFechaCambioPassword = NOW(), 
        RequiereCambiarPassword = ?, FechaModificacion = NOW() 
    WHERE IdUsuario = ?
  `;
  const requireChange = clearRequiereCambiar ? 0 : 1;
  await db.query(sql, [hashedPassword, requireChange, idUsuario]);
}

async function obtenerTodos() {
  const sql = `
    SELECT u.IdUsuario, u.Nombre, u.Apellido, u.CorreoElectronico, u.IdStatusUsuario, 
           u.IdGenero, u.TelefonoMovil, u.IdSucursal, u.IdRole, u.RequiereCambiarPassword, u.FechaCreacion, 
           r.Nombre as NombreRole, s.Nombre as NombreStatus
    FROM USUARIO u
    INNER JOIN ROLE r ON u.IdRole = r.IdRole
    INNER JOIN STATUS_USUARIO s ON u.IdStatusUsuario = s.IdStatusUsuario
    ORDER BY u.FechaCreacion DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

async function actualizar(idUsuario, usuario) {
  const { 
    Nombre, Apellido, CorreoElectronico, TelefonoMovil, IdGenero, 
    IdSucursal, IdRole, IdStatusUsuario, RequiereCambiarPassword, UsuarioModificacion 
  } = usuario;
  
  const sql = `
    UPDATE USUARIO 
    SET Nombre = ?, Apellido = ?, CorreoElectronico = ?, 
        TelefonoMovil = ?, IdGenero = ?, IdSucursal = ?, 
        IdRole = ?, IdStatusUsuario = ?, RequiereCambiarPassword = ?, FechaModificacion = NOW(), 
        UsuarioModificacion = ?
    WHERE IdUsuario = ?
  `;
  
  await db.query(sql, [
    Nombre, Apellido, CorreoElectronico, TelefonoMovil, IdGenero,
    IdSucursal, IdRole, IdStatusUsuario, RequiereCambiarPassword ? 1 : 0, UsuarioModificacion, idUsuario
  ]);
}

async function eliminar(idUsuario) {
  const sql = `DELETE FROM USUARIO WHERE IdUsuario = ?`;
  await db.query(sql, [idUsuario]);
}

module.exports = {
  buscarParaLogin,
  obtenerPorId,
  registrarIntentoFallido,
  bloquearUsuario,
  registrarLoginExitoso,
  registrarSesion,
  cerrarSesion,
  actualizarPasswordMigrada,
  crearUsuario,
  actualizarContraseña,
  obtenerTodos,
  actualizar,
  eliminar
};