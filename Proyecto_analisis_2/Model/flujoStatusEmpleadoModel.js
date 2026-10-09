const { db } = require('../Config/db.js');
const { crearCrudModel } = require('./crudModel.js');

const modelo = crearCrudModel({
  tabla: 'FLUJO_STATUS_EMPLEADO',
  alias: 'f',
  claves: ['IdStatusActual', 'IdStatusNuevo'],
  autoIncrement: false,
  camposCrear: ['IdStatusActual', 'IdStatusNuevo', 'NombreEvento'],
  camposActualizar: ['NombreEvento'],
  consulta: `
    SELECT f.*, sa.Nombre AS NombreStatusActual, sn.Nombre AS NombreStatusNuevo
    FROM FLUJO_STATUS_EMPLEADO f
    INNER JOIN STATUS_EMPLEADO sa ON f.IdStatusActual = sa.IdStatusEmpleado
    INNER JOIN STATUS_EMPLEADO sn ON f.IdStatusNuevo = sn.IdStatusEmpleado
  `,
  orden: 'f.IdStatusActual, f.IdStatusNuevo'
});

async function existeTransicion(idStatusActual, idStatusNuevo) {
  const [rows] = await db.query(
    'SELECT 1 FROM FLUJO_STATUS_EMPLEADO WHERE IdStatusActual = ? AND IdStatusNuevo = ?',
    [idStatusActual, idStatusNuevo]
  );
  return rows.length > 0;
}

module.exports = { ...modelo, existeTransicion };
