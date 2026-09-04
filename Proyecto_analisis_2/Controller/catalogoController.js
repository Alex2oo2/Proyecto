const empresaModel = require('../Model/empresaModel.js');
const sucursalModel = require('../Model/sucursalModel.js');
const generoModel = require('../Model/generoModel.js');
const statusUsuarioModel = require('../Model/statusUsuarioModel.js');
const { sendDatabaseError } = require('../utils/databaseError.js');

async function obtenerEmpresas(req, res) {
  try {
    const empresas = await empresaModel.obtenerTodos();
    res.json(empresas);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearEmpresa(req, res) {
  const camposRequeridos = [
    'Nombre', 'Direccion', 'Nit', 'PasswordCantidadMayusculas',
    'PasswordCantidadMinusculas', 'PasswordCantidadCaracteresEspeciales',
    'PasswordCantidadCaducidadDias', 'PasswordLargo',
    'PasswordIntentosAntesDeBloquear', 'PasswordCantidadNumeros',
    'PasswordCantidadPreguntasValidar'
  ];

  const faltaCampo = camposRequeridos.some((campo) => {
    const valor = req.body[campo];
    return valor === undefined || valor === null || valor === '';
  });

  if (faltaCampo) {
    return res.status(400).json({
      mensaje: 'Faltan campos obligatorios para crear la empresa'
    });
  }

  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await empresaModel.crear(datos);
    res.status(201).json({ mensaje: 'Empresa creada', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarEmpresa(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await empresaModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Empresa actualizada exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarEmpresa(req, res) {
  try {
    await empresaModel.eliminar(req.params.id);
    res.json({ mensaje: 'Empresa eliminada exitosamente' });
  } catch (error) { sendDatabaseError(res, error, 'empresa', 'eliminar la empresa'); }
}

async function obtenerSucursales(req, res) {
  try {
    const { idEmpresa } = req.query;
    const sucursales = idEmpresa 
      ? await sucursalModel.obtenerPorEmpresa(idEmpresa)
      : await sucursalModel.obtenerTodos();
    res.json(sucursales);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearSucursal(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await sucursalModel.crear(datos);
    res.status(201).json({ mensaje: 'Sucursal creada', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarSucursal(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await sucursalModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Sucursal actualizada exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarSucursal(req, res) {
  try {
    await sucursalModel.eliminar(req.params.id);
    res.json({ mensaje: 'Sucursal eliminada exitosamente' });
  } catch (error) { sendDatabaseError(res, error, 'sucursal', 'eliminar la sucursal'); }
}

async function crearGenero(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await generoModel.crear(datos);
    res.status(201).json({ mensaje: 'Género creado', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerGeneros(req, res) {
  try {
    const generos = await generoModel.obtenerTodos();
    res.json(generos);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarGenero(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await generoModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Género actualizado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarGenero(req, res) {
  try {
    await generoModel.eliminar(req.params.id);
    res.json({ mensaje: 'Género eliminado exitosamente' });
  } catch (error) { sendDatabaseError(res, error, 'genero', 'eliminar el género'); }
}

async function crearStatusUsuario(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await statusUsuarioModel.crear(datos);
    res.status(201).json({ mensaje: 'Status de usuario creado', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerStatusUsuarios(req, res) {
  try {
    const estatus = await statusUsuarioModel.obtenerTodos();
    res.json(estatus);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarStatusUsuario(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await statusUsuarioModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Status de usuario actualizado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarStatusUsuario(req, res) {
  try {
    await statusUsuarioModel.eliminar(req.params.id);
    res.json({ mensaje: 'Status de usuario eliminado exitosamente' });
  } catch (error) { sendDatabaseError(res, error, 'statusUsuario', 'eliminar el estado'); }
}

module.exports = {
  obtenerEmpresas, crearEmpresa, actualizarEmpresa, eliminarEmpresa,
  obtenerSucursales, crearSucursal, actualizarSucursal, eliminarSucursal,
  crearGenero, obtenerGeneros, actualizarGenero, eliminarGenero,
  crearStatusUsuario, obtenerStatusUsuarios, actualizarStatusUsuario, eliminarStatusUsuario
};