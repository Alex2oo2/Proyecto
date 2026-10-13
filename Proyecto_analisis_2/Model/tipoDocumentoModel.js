const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'TIPO_DOCUMENTO',
  alias: 'td',
  claves: ['IdTipoDocumento'],
  autoIncrement: true,
  camposCrear: ['Nombre'],
  camposActualizar: ['Nombre'],
  consulta: 'SELECT td.* FROM TIPO_DOCUMENTO td',
  orden: 'td.IdTipoDocumento'
});
