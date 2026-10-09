const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'DEPARTAMENTO',
  alias: 'd',
  claves: ['IdDepartamento'],
  autoIncrement: true,
  camposCrear: ['Nombre', 'IdEmpresa'],
  camposActualizar: ['Nombre', 'IdEmpresa'],
  consulta: `
    SELECT d.*, e.Nombre AS NombreEmpresa
    FROM DEPARTAMENTO d
    LEFT JOIN EMPRESA e ON d.IdEmpresa = e.IdEmpresa
  `,
  orden: 'd.IdDepartamento'
});
