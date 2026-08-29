const usuarioModel = require('../Model/usuarioModel.js');
const bcrypt = require('bcrypt');

async function obtenerTodos(req, res) {
  try {
    const usuarios = await usuarioModel.obtenerTodos();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensaje: 'IdUsuario es requerido' });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(id);
    
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // No enviar password/respuesta en la respuesta
    const { Password, Respuesta, ...usuarioSeguro } = usuario;
    res.json(usuarioSeguro);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function crear(req, res) {
  const { 
    IdUsuario, Password, Nombre, Apellido, IdRole,
    FechaNacimiento, IdGenero, IdSucursal 
  } = req.body;

  if (!IdUsuario || !Password || !Nombre || !Apellido || !IdRole || !FechaNacimiento || !IdGenero || !IdSucursal) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios para crear el usuario' });
  }

  try {
    const usuarioExistente = await usuarioModel.obtenerPorId(IdUsuario);
    
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso' });
    }

    await usuarioModel.crearUsuario(req.body);
    
    res.status(201).json({ mensaje: 'Usuario creado exitosamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;
  const { 
    Nombre, Apellido, CorreoElectronico, TelefonoMovil, IdGenero, 
    IdSucursal, IdRole, IdStatusUsuario 
  } = req.body;

  if (!id) {
    return res.status(400).json({ mensaje: 'IdUsuario es requerido' });
  }

  if (!Nombre || !Apellido || !IdRole || !IdStatusUsuario) {
    return res.status(400).json({ 
      mensaje: 'Faltan campos obligatorios: Nombre, Apellido, IdRole, IdStatusUsuario' 
    });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(id);
    
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const datosActualizar = {
      Nombre,
      Apellido,
      CorreoElectronico: CorreoElectronico || usuario.CorreoElectronico,
      TelefonoMovil: TelefonoMovil || usuario.TelefonoMovil,
      IdGenero: IdGenero || usuario.IdGenero,
      IdSucursal: IdSucursal || usuario.IdSucursal,
      IdRole,
      IdStatusUsuario,
      UsuarioModificacion: req.usuario?.IdUsuario || 'system'
    };

    await usuarioModel.actualizar(id, datosActualizar);
    
    res.json({ mensaje: 'Usuario actualizado exitosamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function eliminar(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ mensaje: 'IdUsuario es requerido' });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(id);
    
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    await usuarioModel.eliminar(id);
    
    res.json({ mensaje: 'Usuario eliminado exitosamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };