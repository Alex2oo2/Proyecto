const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'PUESTO',
  alias: 'p',
  claves: ['IdPuesto'],
  autoIncrement: true,
  camposCrear: ['Nombre', 'IdDepartamento'],
  camposActualizar: ['Nombre', 'IdDepartamento'],
  consulta: `
    SELECT p.*, d.Nombre AS NombreDepartamento
    FROM PUESTO p
    INNER JOIN DEPARTAMENTO d ON p.IdDepartamento = d.IdDepartamento
  `,
  orden: 'p.IdPuesto'
});
