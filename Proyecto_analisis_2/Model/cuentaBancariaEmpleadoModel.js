const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'CUENTA_BANCARIA_EMPLEADO',
  alias: 'c',
  claves: ['IdCuentaBancaria'],
  autoIncrement: true,
  camposCrear: ['IdEmpleado', 'IdBanco', 'NumeroDeCuenta', 'Activa'],
  camposActualizar: ['IdEmpleado', 'IdBanco', 'NumeroDeCuenta', 'Activa'],
  consulta: `
    SELECT c.*, CONCAT(p.Nombre, ' ', p.Apellido) AS NombreEmpleado, b.Nombre AS NombreBanco
    FROM CUENTA_BANCARIA_EMPLEADO c
    INNER JOIN EMPLEADO e ON c.IdEmpleado = e.IdEmpleado
    INNER JOIN PERSONA p ON e.IdPersona = p.IdPersona
    INNER JOIN BANCO b ON c.IdBanco = b.IdBanco
  `,
  orden: 'c.IdCuentaBancaria'
});
