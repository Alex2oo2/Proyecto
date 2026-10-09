const { crearCrudModel } = require('./crudModel.js');

const campos = [
  'IdPersona', 'IdSucursal', 'FechaContratacion', 'IdPuesto', 'IdStatusEmpleado',
  'IngresoSueldoBase', 'IngresoBonificacionDecreto', 'IngresoOtrosIngresos',
  'DescuentoIgss', 'DescuentoIsr', 'DescuentoInasistencias'
];

module.exports = crearCrudModel({
  tabla: 'EMPLEADO',
  alias: 'e',
  claves: ['IdEmpleado'],
  autoIncrement: true,
  camposCrear: campos,
  camposActualizar: campos,
  consulta: `
    SELECT e.*, DATE_FORMAT(e.FechaContratacion, '%Y-%m-%d') AS FechaContratacion,
      CONCAT(p.Nombre, ' ', p.Apellido) AS NombrePersona,
      s.Nombre AS NombreSucursal, pu.Nombre AS NombrePuesto,
      st.Nombre AS NombreStatus
    FROM EMPLEADO e
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
    INNER JOIN SUCURSAL s ON e.IdSucursal = s.IdSucursal
    INNER JOIN PUESTO pu ON e.IdPuesto = pu.IdPuesto
    INNER JOIN STATUS_EMPLEADO st ON e.IdStatusEmpleado = st.IdStatusEmpleado
  `,
  orden: 'e.IdEmpleado'
});
