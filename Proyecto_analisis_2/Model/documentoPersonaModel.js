const { crearCrudModel } = require('./crudModel.js');

module.exports = crearCrudModel({
  tabla: 'DOCUMENTO_PERSONA',
  alias: 'dp',
  claves: ['IdTipoDocumento', 'IdPersona'],
  autoIncrement: false,
  camposCrear: ['IdTipoDocumento', 'IdPersona', 'NoDocumento'],
  camposActualizar: ['NoDocumento'],
  consulta: `
    SELECT dp.*, td.Nombre AS NombreTipoDocumento,
      CONCAT(p.Nombre, ' ', p.Apellido) AS NombrePersona
    FROM DOCUMENTO_PERSONA dp
    INNER JOIN TIPO_DOCUMENTO td ON dp.IdTipoDocumento = td.IdTipoDocumento
    INNER JOIN PERSONA p ON dp.IdPersona = p.IdPersona
  `,
  orden: 'dp.IdPersona, dp.IdTipoDocumento'
});
