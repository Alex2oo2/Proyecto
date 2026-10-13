const deleteMessages = {
  empresa: 'No se puede eliminar la empresa porque tiene sucursales asignadas.',
  sucursal: 'No se puede eliminar la sucursal porque tiene usuarios asignados.',
  genero: 'No se puede eliminar el género porque tiene usuarios asignados.',
  statusUsuario: 'No se puede eliminar el estado porque tiene usuarios asignados.',
  modulo: 'No se puede eliminar el módulo porque tiene menús asignados.',
  menu: 'No se puede eliminar el menú porque tiene opciones asignadas.',
  opcion: 'No se puede eliminar la opción porque está asignada a uno o más roles.',
  role: 'No se puede eliminar el rol porque tiene usuarios o permisos asignados.',
  estadoCivil: 'No se puede eliminar el estado civil porque tiene personas asignadas.',
  statusEmpleado: 'No se puede eliminar el status porque tiene empleados o flujos asignados.',
  flujoStatusEmpleado: 'No se puede eliminar el flujo porque está en uso.',
  tipoDocumento: 'No se puede eliminar el tipo de documento porque tiene documentos de personas asignados.',
  departamento: 'No se puede eliminar el departamento porque tiene puestos asignados.',
  puesto: 'No se puede eliminar el puesto porque tiene empleados o planillas asociadas.',
  persona: 'No se puede eliminar la persona porque tiene documentos o empleados asociados.',
  documentoPersona: 'No se puede eliminar el documento porque está en uso.',
  banco: 'No se puede eliminar el banco porque tiene cuentas bancarias asignadas.',
  empleado: 'No se puede eliminar el empleado porque tiene cuentas, inasistencias, planillas o liquidaciones asociadas.',
  cuentaBancariaEmpleado: 'No se puede eliminar la cuenta bancaria porque está en uso.',
  inasistencia: 'No se puede eliminar la inasistencia porque está en uso.'
};

const duplicateMessages = {
  documentoPersona: 'La persona ya tiene registrado un documento de ese tipo.',
  flujoStatusEmpleado: 'Ya existe un flujo entre esos dos status.'
};

function sendDatabaseError(res, error, entity, action = 'realizar la operación') {
  if (error?.errno === 1451 || error?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ mensaje: deleteMessages[entity] });
  }

  if (error?.errno === 1062 || error?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      mensaje: duplicateMessages[entity] || 'Ya existe un registro con los mismos datos.'
    });
  }

  if (error?.errno === 1452 || error?.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ mensaje: 'Alguno de los datos relacionados seleccionados no existe.' });
  }

  if (error?.errno === 1644 || error?.sqlState === '45000') {
    return res.status(409).json({ mensaje: error.sqlMessage || `No se pudo ${action}.` });
  }

  return res.status(500).json({ mensaje: `No se pudo ${action}.` });
}

module.exports = { sendDatabaseError };
