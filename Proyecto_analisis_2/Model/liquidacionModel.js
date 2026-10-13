const { db } = require('../Config/db.js');

const SELECT_LIQUIDACION = `
  SELECT l.IdLiquidacion, l.IdEmpleado,
    CONCAT(p.Nombre, ' ', p.Apellido) AS NombreEmpleado,
    DATE_FORMAT(l.FechaContratacion, '%Y-%m-%d') AS FechaContratacion,
    DATE_FORMAT(l.FechaEgreso, '%Y-%m-%d') AS FechaEgreso,
    DATE_FORMAT(l.FechaLiquidacion, '%Y-%m-%d') AS FechaLiquidacion,
    l.MotivoEgreso, l.IdPuesto, pu.Nombre AS NombrePuesto, dep.Nombre AS NombreDepartamento,
    l.IngresoSueldoBase, l.IngresoBonificacionDecreto, l.IngresoOtrosIngresos,
    l.DescuentoIgss, l.DescuentoIsr, l.DescuentoInasistencias, l.SalarioNeto,
    l.IngresoIndemnizacion, l.IngresoAguinaldo, l.IngresoBono14, l.IngresoVacaciones,
    l.TotalIngresos, l.TotalDescuentos, l.TotalNeto,
    l.FechaCreacion, l.UsuarioCreacion, l.FechaModificacion, l.UsuarioModificacion
  FROM LIQUIDACION l
  INNER JOIN EMPLEADO e ON l.IdEmpleado = e.IdEmpleado
  INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
  INNER JOIN PUESTO pu ON l.IdPuesto = pu.IdPuesto
  INNER JOIN DEPARTAMENTO dep ON pu.IdDepartamento = dep.IdDepartamento
`;

const COLUMNAS = [
  'IdEmpleado', 'FechaContratacion', 'FechaEgreso', 'FechaLiquidacion', 'MotivoEgreso', 'IdPuesto',
  'IngresoSueldoBase', 'IngresoBonificacionDecreto', 'IngresoOtrosIngresos',
  'DescuentoIgss', 'DescuentoIsr', 'DescuentoInasistencias', 'SalarioNeto',
  'IngresoIndemnizacion', 'IngresoAguinaldo', 'IngresoBono14', 'IngresoVacaciones',
  'TotalIngresos', 'TotalDescuentos', 'TotalNeto'
];

async function obtenerTodos() {
  const [rows] = await db.query(`${SELECT_LIQUIDACION} ORDER BY l.IdLiquidacion DESC`);
  return rows;
}

async function obtenerPorId(id) {
  const [rows] = await db.query(`${SELECT_LIQUIDACION} WHERE l.IdLiquidacion = ?`, [id]);
  return rows[0];
}

async function obtenerEmpleadosParaLiquidar() {
  const [rows] = await db.query(`
    SELECT e.IdEmpleado AS Id, CONCAT(p.Nombre, ' ', p.Apellido) AS Texto,
      e.IdPuesto, DATE_FORMAT(e.FechaContratacion, '%Y-%m-%d') AS FechaContratacion,
      e.IngresoSueldoBase, e.IngresoBonificacionDecreto, e.IngresoOtrosIngresos,
      e.DescuentoIgss, e.DescuentoIsr, e.DescuentoInasistencias,
      st.Nombre AS NombreStatus
    FROM EMPLEADO e
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
    INNER JOIN STATUS_EMPLEADO st ON e.IdStatusEmpleado = st.IdStatusEmpleado
    ORDER BY p.Nombre, p.Apellido
  `);
  return rows;
}

async function obtenerEmpleado(idEmpleado) {
  const [rows] = await db.query(
    'SELECT IdEmpleado, IdStatusEmpleado FROM EMPLEADO WHERE IdEmpleado = ?',
    [idEmpleado]
  );
  return rows[0];
}

async function crear(datos, usuario, nombreStatusDestino) {
  const conexion = await db.getConnection();
  try {
    await conexion.beginTransaction();
    const columnas = [...COLUMNAS, 'FechaCreacion', 'UsuarioCreacion'];
    const marcas = [...COLUMNAS.map(() => '?'), 'NOW()', '?'];
    const [resultado] = await conexion.query(
      `INSERT INTO LIQUIDACION (${columnas.join(', ')}) VALUES (${marcas.join(', ')})`,
      [...COLUMNAS.map((columna) => datos[columna]), usuario]
    );

    let statusActualizado = null;
    if (nombreStatusDestino) {
      const [destino] = await conexion.query(
        'SELECT IdStatusEmpleado FROM STATUS_EMPLEADO WHERE Nombre = ? LIMIT 1',
        [nombreStatusDestino]
      );
      const [actual] = await conexion.query(
        'SELECT IdStatusEmpleado FROM EMPLEADO WHERE IdEmpleado = ?',
        [datos.IdEmpleado]
      );
      if (destino.length && actual.length) {
        const [flujo] = await conexion.query(
          'SELECT 1 FROM FLUJO_STATUS_EMPLEADO WHERE IdStatusActual = ? AND IdStatusNuevo = ?',
          [actual[0].IdStatusEmpleado, destino[0].IdStatusEmpleado]
        );
        if (flujo.length) {
          await conexion.query(
            'UPDATE EMPLEADO SET IdStatusEmpleado = ?, FechaModificacion = NOW(), UsuarioModificacion = ? WHERE IdEmpleado = ?',
            [destino[0].IdStatusEmpleado, usuario, datos.IdEmpleado]
          );
          statusActualizado = nombreStatusDestino;
        }
      }
    }

    await conexion.commit();
    return { id: resultado.insertId, statusActualizado };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

async function actualizar(id, datos, usuario) {
  const asignaciones = [...COLUMNAS.map((columna) => `${columna} = ?`), 'FechaModificacion = NOW()', 'UsuarioModificacion = ?'];
  const [resultado] = await db.query(
    `UPDATE LIQUIDACION SET ${asignaciones.join(', ')} WHERE IdLiquidacion = ?`,
    [...COLUMNAS.map((columna) => datos[columna]), usuario, id]
  );
  return resultado.affectedRows;
}

module.exports = {
  obtenerTodos,
  obtenerPorId,
  obtenerEmpleadosParaLiquidar,
  obtenerEmpleado,
  crear,
  actualizar
};
