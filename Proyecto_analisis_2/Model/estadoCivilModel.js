const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'ESTADO_CIVIL',
  alias: 'ec',
  claves: ['IdEstadoCivil'],
  autoIncrement: true,
  camposCrear: ['Nombre'],
  camposActualizar: ['Nombre'],
  consulta: 'SELECT ec.* FROM ESTADO_CIVIL ec',
  orden: 'ec.IdEstadoCivil'
});
