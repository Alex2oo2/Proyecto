const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'BANCO',
  alias: 'b',
  claves: ['IdBanco'],
  autoIncrement: true,
  camposCrear: ['Nombre'],
  camposActualizar: ['Nombre'],
  consulta: 'SELECT b.* FROM BANCO b',
  orden: 'b.IdBanco'
});
