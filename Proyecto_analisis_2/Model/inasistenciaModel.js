const { db } = require('../Config/db.js');
const { crearCrudModel } = require('./crudModel.js');

const modelo = crearCrudModel({
  tabla: 'INASISTENCIA',
  alias: 'i',
  claves: ['IdInasistencia'],
  autoIncrement: true,
  camposCrear: ['IdEmpleado', 'FechaInicial', 'FechaFinal', 'MotivoInasistencia'],
  camposActualizar: ['IdEmpleado', 'FechaInicial', 'FechaFinal', 'MotivoInasistencia'],
  consulta: `
    SELECT i.*, DATE_FORMAT(i.FechaInicial, '%Y-%m-%d') AS FechaInicial,
      DATE_FORMAT(i.FechaFinal, '%Y-%m-%d') AS FechaFinal,
      DATE_FORMAT(i.FechaProcesado, '%Y-%m-%d %H:%i:%s') AS FechaProcesado,
      CONCAT(p.Nombre, ' ', p.Apellido) AS NombreEmpleado
    FROM INASISTENCIA i
    INNER JOIN EMPLEADO e ON i.IdEmpleado = e.IdEmpleado
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
  `,
  orden: 'i.FechaInicial DESC, i.IdInasistencia DESC'
});

async function estaProcesada(idInasistencia) {
  const [rows] = await db.query('SELECT FechaProcesado FROM INASISTENCIA WHERE IdInasistencia = ?', [idInasistencia]);
  return rows.length > 0 && rows[0].FechaProcesado !== null;
}

module.exports = { ...modelo, estaProcesada };
