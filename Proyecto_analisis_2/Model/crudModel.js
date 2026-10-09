const { db } = require('../Config/db.js');

function valorSql(valor) {
  return valor === undefined || valor === '' ? null : valor;
}

function crearCrudModel({ tabla, alias, claves, autoIncrement, camposCrear, camposActualizar, consulta, orden }) {
  const condicion = claves.map((clave) => `${alias}.${clave} = ?`).join(' AND ');
  const condicionTabla = claves.map((clave) => `${clave} = ?`).join(' AND ');

  async function obtenerTodos() {
    const [rows] = await db.query(`${consulta} ORDER BY ${orden}`);
    return rows;
  }

  async function obtenerPorClave(valoresClave) {
    const [rows] = await db.query(`${consulta} WHERE ${condicion}`, valoresClave);
    return rows[0];
  }

  async function crear(datos, usuario) {
    const columnas = [...camposCrear, 'FechaCreacion', 'UsuarioCreacion'];
    const marcas = [...camposCrear.map(() => '?'), 'NOW()', '?'];
    const valores = [...camposCrear.map((campo) => valorSql(datos[campo])), usuario];
    const [result] = await db.query(
      `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${marcas.join(', ')})`,
      valores
    );
    return autoIncrement ? result.insertId : null;
  }

  async function actualizar(valoresClave, datos, usuario) {
    const asignaciones = [...camposActualizar.map((campo) => `${campo} = ?`), 'FechaModificacion = NOW()', 'UsuarioModificacion = ?'];
    const valores = [...camposActualizar.map((campo) => valorSql(datos[campo])), usuario, ...valoresClave];
    const [result] = await db.query(
      `UPDATE ${tabla} SET ${asignaciones.join(', ')} WHERE ${condicionTabla}`,
      valores
    );
    return result.affectedRows;
  }

  async function eliminar(valoresClave) {
    const [result] = await db.query(`DELETE FROM ${tabla} WHERE ${condicionTabla}`, valoresClave);
    return result.affectedRows;
  }

  return { obtenerTodos, obtenerPorClave, crear, actualizar, eliminar };
}

module.exports = { crearCrudModel };
