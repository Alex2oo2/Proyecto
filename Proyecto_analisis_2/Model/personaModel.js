const { crearCrudModel } = require('./crudModel.js');

const campos = [
  'Nombre', 'Apellido', 'FechaNacimiento', 'IdGenero', 'Direccion',
  'Telefono', 'CorreoElectronico', 'IdEstadoCivil'
];

module.exports = crearCrudModel({
  tabla: 'PERSONA',
  alias: 'p',
  claves: ['IdPersona'],
  autoIncrement: true,
  camposCrear: campos,
  camposActualizar: campos,
  consulta: `
    SELECT p.*, DATE_FORMAT(p.FechaNacimiento, '%Y-%m-%d') AS FechaNacimiento,
      CONCAT(p.Nombre, ' ', p.Apellido) AS NombreCompleto,
      g.Nombre AS NombreGenero, ec.Nombre AS NombreEstadoCivil
    FROM PERSONA p
    INNER JOIN GENERO g ON p.IdGenero = g.IdGenero
    INNER JOIN ESTADO_CIVIL ec ON p.IdEstadoCivil = ec.IdEstadoCivil
  `,
  orden: 'p.IdPersona'
});
