const { db } = require('../Config/db.js');

async function obtenerTodos() {
  const [rows] = await db.query('SELECT * FROM EMPRESA');
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await db.query('SELECT * FROM EMPRESA WHERE IdEmpresa = ?', [id]);
  return rows[0];
}

async function obtenerPoliticasPassword(idEmpresa) {
  const sql = `
    SELECT 
      PasswordCantidadMayusculas, 
      PasswordCantidadMinusculas, 
      PasswordCantidadCaracteresEspeciales, 
      PasswordCantidadCaducidadDias, 
      PasswordLargo, 
      PasswordIntentosAntesDeBloquear, 
      PasswordCantidadNumeros, 
      PasswordCantidadPreguntasValidar 
    FROM EMPRESA 
    WHERE IdEmpresa = ?
  `;
  const [rows] = await db.query(sql, [idEmpresa]);
  return rows[0];
}

async function crear(datos) {
  const { 
    Nombre, Direccion, Nit, PasswordCantidadMayusculas, 
    PasswordCantidadMinusculas, PasswordCantidadCaracteresEspeciales, 
    PasswordCantidadCaducidadDias, PasswordLargo, PasswordIntentosAntesDeBloquear, 
    PasswordCantidadNumeros, PasswordCantidadPreguntasValidar, UsuarioCreacion 
  } = datos;

  const sql = `
    INSERT INTO EMPRESA (
      Nombre, Direccion, Nit, PasswordCantidadMayusculas, 
      PasswordCantidadMinusculas, PasswordCantidadCaracteresEspeciales, 
      PasswordCantidadCaducidadDias, PasswordLargo, PasswordIntentosAntesDeBloquear, 
      PasswordCantidadNumeros, PasswordCantidadPreguntasValidar, 
      FechaCreacion, UsuarioCreacion
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  `;
  
  const [result] = await db.query(sql, [
    Nombre, Direccion, Nit, PasswordCantidadMayusculas, 
    PasswordCantidadMinusculas, PasswordCantidadCaracteresEspeciales, 
    PasswordCantidadCaducidadDias, PasswordLargo, PasswordIntentosAntesDeBloquear, 
    PasswordCantidadNumeros, PasswordCantidadPreguntasValidar, UsuarioCreacion
  ]);
  return result.insertId;
}

async function actualizar(id, datos) {
  const { 
    Nombre, Direccion, Nit, PasswordCantidadMayusculas, 
    PasswordCantidadMinusculas, PasswordCantidadCaracteresEspeciales, 
    PasswordCantidadCaducidadDias, PasswordLargo, PasswordIntentosAntesDeBloquear, 
    PasswordCantidadNumeros, PasswordCantidadPreguntasValidar, UsuarioModificacion 
  } = datos;

  const sql = `
    UPDATE EMPRESA SET 
      Nombre = ?, Direccion = ?, Nit = ?, 
      PasswordCantidadMayusculas = ?, PasswordCantidadMinusculas = ?, 
      PasswordCantidadCaracteresEspeciales = ?, PasswordCantidadCaducidadDias = ?, 
      PasswordLargo = ?, PasswordIntentosAntesDeBloquear = ?, 
      PasswordCantidadNumeros = ?, PasswordCantidadPreguntasValidar = ?, 
      FechaModificacion = NOW(), UsuarioModificacion = ? 
    WHERE IdEmpresa = ?
  `;
  
  await db.query(sql, [
    Nombre, Direccion, Nit, PasswordCantidadMayusculas, 
    PasswordCantidadMinusculas, PasswordCantidadCaracteresEspeciales, 
    PasswordCantidadCaducidadDias, PasswordLargo, PasswordIntentosAntesDeBloquear, 
    PasswordCantidadNumeros, PasswordCantidadPreguntasValidar, UsuarioModificacion, id
  ]);
}

async function eliminar(id) {
  await db.query('DELETE FROM EMPRESA WHERE IdEmpresa = ?', [id]);
}

// Agregar esta función al archivo empresaModel.js existente

async function obtenerPoliticasPasswordPorUsuario(idUsuario) {
  const sql = `
    SELECT 
      e.PasswordCantidadMayusculas, 
      e.PasswordCantidadMinusculas, 
      e.PasswordCantidadCaracteresEspeciales, 
      e.PasswordCantidadCaducidadDias, 
      e.PasswordLargo, 
      e.PasswordIntentosAntesDeBloquear, 
      e.PasswordCantidadNumeros, 
      e.PasswordCantidadPreguntasValidar 
    FROM EMPRESA e
    INNER JOIN SUCURSAL s ON s.IdEmpresa = e.IdEmpresa
    INNER JOIN USUARIO u ON u.IdSucursal = s.IdSucursal
    WHERE u.IdUsuario = ?
  `;
  const [rows] = await db.query(sql, [idUsuario]);
  return rows[0];
}

// Y agregarla al module.exports:
// module.exports = { ..., obtenerPoliticasPasswordPorUsuario };

module.exports = { 
  obtenerTodos, 
  obtenerPorId, 
  obtenerPoliticasPassword, 
  crear, 
  actualizar, 
  eliminar 
};