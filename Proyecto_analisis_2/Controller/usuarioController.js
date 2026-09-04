const usuarioModel = require('../Model/usuarioModel.js');
const bcrypt = require('bcrypt');
const empresaModel = require('../Model/empresaModel.js');
const sucursalModel = require('../Model/sucursalModel.js');
const { validatePasswordPolicy } = require('../utils/passwordValidator.js');

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

  const idSucursal = Number(IdSucursal);
  if (!Number.isInteger(idSucursal) || idSucursal <= 0) {
    return res.status(400).json({ mensaje: 'IdSucursal no es válido' });
  }

  try {
    const sucursal = await sucursalModel.obtenerPorId(idSucursal);
    if (!sucursal) {
      return res.status(400).json({ mensaje: `La sucursal ${idSucursal} no existe` });
    }

    const politica = await empresaModel.obtenerPoliticasPasswordPorSucursal(idSucursal);
    if (!politica) {
      return res.status(400).json({ mensaje: 'La sucursal no tiene una empresa válida asociada' });
    }
    const validacionPassword = validatePasswordPolicy(Password, politica);
    if (!validacionPassword.isValid) {
      return res.status(400).json({ mensaje: 'La contraseña no cumple la política de la empresa', errores: validacionPassword.errors });
    }

    const usuarioExistente = await usuarioModel.obtenerPorId(IdUsuario);
    
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso' });
    }

    const datosUsuario = {
      ...req.body,
      IdSucursal: idSucursal,
      UsuarioCreacion: req.usuario.IdUsuario
    };

    await usuarioModel.crearUsuario(datosUsuario);
    
    res.status(201).json({ mensaje: 'Usuario creado exitosamente' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;
  const { 
    Nombre, Apellido, CorreoElectronico, TelefonoMovil, IdGenero, 
    IdSucursal, IdRole, IdStatusUsuario, RequiereCambiarPassword 
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
      RequiereCambiarPassword,
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