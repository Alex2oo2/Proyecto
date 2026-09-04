const deleteMessages = {
  empresa: 'No se puede eliminar la empresa porque tiene sucursales asignadas.',
  sucursal: 'No se puede eliminar la sucursal porque tiene usuarios asignados.',
  genero: 'No se puede eliminar el género porque tiene usuarios asignados.',
  statusUsuario: 'No se puede eliminar el estado porque tiene usuarios asignados.',
  modulo: 'No se puede eliminar el módulo porque tiene menús asignados.',
  menu: 'No se puede eliminar el menú porque tiene opciones asignadas.',
  opcion: 'No se puede eliminar la opción porque está asignada a uno o más roles.',
  role: 'No se puede eliminar el rol porque tiene usuarios o permisos asignados.'
};

function sendDatabaseError(res, error, entity, action = 'realizar la operación') {
  if (error?.errno === 1451 || error?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ mensaje: deleteMessages[entity] });
  }

  return res.status(500).json({ mensaje: `No se pudo ${action}.` });
}

module.exports = { sendDatabaseError };