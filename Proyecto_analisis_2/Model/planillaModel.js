const { db } = require('../Config/db.js');

const SELECT_DETALLE = `
  SELECT d.IdPlanillaDetalle, d.Anio, d.Mes, d.IdEmpleado,
    CONCAT(p.Nombre, ' ', p.Apellido) AS NombreEmpleado,
    DATE_FORMAT(d.FechaContratacion, '%Y-%m-%d') AS FechaContratacion,
    pu.Nombre AS NombrePuesto, dep.Nombre AS NombreDepartamento,
    st.Nombre AS NombreStatus,
    d.IngresoSueldoBase, d.IngresoBonificacionDecreto, d.IngresoOtrosIngresos,
    d.DescuentoIgss, d.DescuentoIsr, d.DescuentoInasistencias,
    (d.IngresoSueldoBase + d.IngresoBonificacionDecreto + d.IngresoOtrosIngresos) AS TotalIngresos,
    (d.DescuentoIgss + d.DescuentoIsr + d.DescuentoInasistencias) AS TotalDescuentos,
    d.SalarioNeto
  FROM PLANILLA_DETALLE d
  INNER JOIN EMPLEADO e ON d.IdEmpleado = e.IdEmpleado
  INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
  INNER JOIN PUESTO pu ON d.IdPuesto = pu.IdPuesto
  INNER JOIN DEPARTAMENTO dep ON pu.IdDepartamento = dep.IdDepartamento
  INNER JOIN STATUS_EMPLEADO st ON d.IdStatusEmpleado = st.IdStatusEmpleado
`;

async function obtenerPeriodos() {
  const sql = `
    SELECT p.Anio, p.Mes,
      DATE_FORMAT(p.FechaInicio, '%Y-%m-%d') AS FechaInicio,
      DATE_FORMAT(p.FechaFin, '%Y-%m-%d') AS FechaFin,
      c.TotalIngresos, c.TotalDescuentos, c.SalarioNeto,
      c.FechaHoraProcesada,
      IF(c.Anio IS NULL, 0, 1) AS Calculada
    FROM PERIODO_PLANILLA p
    LEFT JOIN PLANILLA_CABECERA c ON c.Anio = p.Anio AND c.Mes = p.Mes
    ORDER BY p.Anio DESC, p.Mes DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

async function obtenerPeriodosCalculados() {
  const periodos = await obtenerPeriodos();
  return periodos.filter((periodo) => periodo.Calculada === 1);
}

async function calcular(anio, mes, usuario, reprocesar) {
  const [resultados] = await db.query('CALL SP_CALCULAR_PLANILLA(?, ?, ?, ?)', [anio, mes, usuario, reprocesar ? 1 : 0]);
  return resultados[0][0];
}

async function obtenerCabecera(anio, mes) {
  const sql = `
    SELECT c.Anio, c.Mes, c.TotalIngresos, c.TotalDescuentos, c.SalarioNeto, c.FechaHoraProcesada,
      DATE_FORMAT(p.FechaInicio, '%Y-%m-%d') AS FechaInicio,
      DATE_FORMAT(p.FechaFin, '%Y-%m-%d') AS FechaFin,
      (SELECT COUNT(*) FROM PLANILLA_DETALLE d WHERE d.Anio = c.Anio AND d.Mes = c.Mes) AS TotalEmpleados
    FROM PLANILLA_CABECERA c
    INNER JOIN PERIODO_PLANILLA p ON c.Anio = p.Anio AND c.Mes = p.Mes
    WHERE c.Anio = ? AND c.Mes = ?
  `;
  const [rows] = await db.query(sql, [anio, mes]);
  return rows[0];
}

async function obtenerDetalle(anio, mes) {
  const [rows] = await db.query(
    `${SELECT_DETALLE} WHERE d.Anio = ? AND d.Mes = ? ORDER BY p.Apellido, p.Nombre`,
    [anio, mes]
  );
  return rows;
}

async function obtenerDetalleEmpleado(anio, mes, idEmpleado) {
  const [rows] = await db.query(
    `${SELECT_DETALLE} WHERE d.Anio = ? AND d.Mes = ? AND d.IdEmpleado = ?`,
    [anio, mes, idEmpleado]
  );
  return rows[0];
}

async function obtenerEmpleadosDePlanilla(anio, mes) {
  const [rows] = await db.query(
    `
    SELECT d.IdEmpleado AS Id, CONCAT(p.Nombre, ' ', p.Apellido) AS Texto
    FROM PLANILLA_DETALLE d
    INNER JOIN EMPLEADO e ON d.IdEmpleado = e.IdEmpleado
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
    WHERE d.Anio = ? AND d.Mes = ?
    ORDER BY p.Nombre, p.Apellido
    `,
    [anio, mes]
  );
  return rows;
}

async function obtenerDatosEmpleadoBoleta(idEmpleado) {
  const [documentos] = await db.query(
    `
    SELECT td.Nombre AS TipoDocumento, dp.NoDocumento
    FROM EMPLEADO e
    INNER JOIN DOCUMENTO_PERSONA dp ON dp.IdPersona = e.IdPersona
    INNER JOIN TIPO_DOCUMENTO td ON dp.IdTipoDocumento = td.IdTipoDocumento
    WHERE e.IdEmpleado = ?
    ORDER BY td.IdTipoDocumento
    `,
    [idEmpleado]
  );
  const [cuentas] = await db.query(
    `
    SELECT b.Nombre AS NombreBanco, c.NumeroDeCuenta
    FROM CUENTA_BANCARIA_EMPLEADO c
    INNER JOIN BANCO b ON c.IdBanco = b.IdBanco
    WHERE c.IdEmpleado = ? AND c.Activa = '1'
    ORDER BY c.IdCuentaBancaria
    LIMIT 1
    `,
    [idEmpleado]
  );
  return { Documentos: documentos, CuentaBancaria: cuentas[0] || null };
}

async function obtenerEmpresaPrincipal() {
  const [rows] = await db.query('SELECT Nombre, Direccion, Nit FROM EMPRESA ORDER BY IdEmpresa LIMIT 1');
  return rows[0] || { Nombre: '', Direccion: '', Nit: '' };
}

module.exports = {
  obtenerPeriodos,
  obtenerPeriodosCalculados,
  calcular,
  obtenerCabecera,
  obtenerDetalle,
  obtenerDetalleEmpleado,
  obtenerEmpleadosDePlanilla,
  obtenerDatosEmpleadoBoleta,
  obtenerEmpresaPrincipal
};
