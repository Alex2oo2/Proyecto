const moduloModel = require('../Model/moduloModel.js');
const menuModel = require('../Model/menuModel.js');
const opcionModel = require('../Model/opcionModel.js');
const roleModel = require('../Model/roleModel.js');
const roleOpcionModel = require('../Model/roleOpcionModel.js');

async function obtenerModulos(req, res) {
  try {
    const modulos = await moduloModel.obtenerTodos();
    res.json(modulos);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearModulo(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await moduloModel.crear(datos);
    res.status(201).json({ mensaje: 'Módulo creado', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarModulo(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await moduloModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Módulo actualizado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarModulo(req, res) {
  try {
    await moduloModel.eliminar(req.params.id);
    res.json({ mensaje: 'Módulo eliminado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerMenus(req, res) {
  try {
    const { idModulo } = req.query;
    const menus = idModulo 
      ? await menuModel.obtenerPorModulo(idModulo)
      : await menuModel.obtenerTodos();
    res.json(menus);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearMenu(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await menuModel.crear(datos);
    res.status(201).json({ mensaje: 'Menú creado', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarMenu(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await menuModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Menú actualizado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarMenu(req, res) {
  try {
    await menuModel.eliminar(req.params.id);
    res.json({ mensaje: 'Menú eliminado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerOpciones(req, res) {
  try {
    const { idMenu } = req.query;
    const opciones = idMenu 
      ? await opcionModel.obtenerPorMenu(idMenu)
      : await opcionModel.obtenerTodos();
    res.json(opciones);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearOpcion(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await opcionModel.crear(datos);
    res.status(201).json({ mensaje: 'Opción creada', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarOpcion(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await opcionModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Opción actualizada exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarOpcion(req, res) {
  try {
    await opcionModel.eliminar(req.params.id);
    res.json({ mensaje: 'Opción eliminada exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerRoles(req, res) {
  try {
    const roles = await roleModel.obtenerTodos();
    res.json(roles);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function crearRole(req, res) {
  try {
    const datos = { ...req.body, UsuarioCreacion: req.usuario.IdUsuario };
    const id = await roleModel.crear(datos);
    res.status(201).json({ mensaje: 'Rol creado', id });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function actualizarRole(req, res) {
  try {
    const datos = { ...req.body, UsuarioModificacion: req.usuario.IdUsuario };
    await roleModel.actualizar(req.params.id, datos);
    res.json({ mensaje: 'Rol actualizado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function eliminarRole(req, res) {
  try {
    await roleModel.eliminar(req.params.id);
    res.json({ mensaje: 'Rol eliminado exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function obtenerMatrizPermisos(req, res) {
  try {
    const { idRole, idModulo } = req.params;
    if (!idRole || !idModulo) {
      return res.status(400).json({ mensaje: 'IdRole e IdModulo son requeridos' });
    }
    const matriz = await roleOpcionModel.obtenerMatrizPermisos(idRole, idModulo);
    res.json(matriz);
  } catch (error) { res.status(500).json({ error: error.message }); }
}

async function guardarMatrizPermisos(req, res) {
  try {
    const permisos = req.body;
    const usuarioActual = req.usuario.IdUsuario; // Get current user from JWT token
    
    if (!Array.isArray(permisos)) {
      return res.status(400).json({ mensaje: 'Se espera un arreglo de permisos' });
    }

    for (const permiso of permisos) {
      // Add the current user to each permission record
      permiso.Usuario = usuarioActual;
      await roleOpcionModel.guardarPermiso(permiso);
    }
    
    res.json({ mensaje: 'Permisos guardados exitosamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

module.exports = {
  obtenerModulos, crearModulo, actualizarModulo, eliminarModulo,
  obtenerMenus, crearMenu, actualizarMenu, eliminarMenu,
  obtenerOpciones, crearOpcion, actualizarOpcion, eliminarOpcion,
  obtenerRoles, crearRole, actualizarRole, eliminarRole,
  obtenerMatrizPermisos, guardarMatrizPermisos
};