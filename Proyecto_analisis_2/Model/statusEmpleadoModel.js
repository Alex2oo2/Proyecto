const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'STATUS_EMPLEADO',
  alias: 'se',
  claves: ['IdStatusEmpleado'],
  autoIncrement: true,
  camposCrear: ['Nombre'],
  camposActualizar: ['Nombre'],
  consulta: 'SELECT se.* FROM STATUS_EMPLEADO se',
  orden: 'se.IdStatusEmpleado'
});
