const usuarioModel = require('../Model/usuarioModel.js');
const bitacoraModel = require('../Model/bitacoraModel.js');
const empresaModel = require('../Model/empresaModel.js');
const { validatePasswordPolicy } = require('../utils/passwordValidator.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// IDs fijos según el seed de STATUS_USUARIO: 1=Activo, 2=Bloqueado, 3=Inactivo
const STATUS_ACTIVO = 1;
const STATUS_BLOQUEADO = 2;
const STATUS_INACTIVO = 3;

// IDs fijos según el seed de TIPO_ACCESO
const ACCESO_CONCEDIDO = 1;
const BLOQUEADO_PASSWORD_INCORRECTO = 2;
const BLOQUEADO_INTENTOS_EXCEDIDOS = 3;
const USUARIO_INACTIVO = 4;
const USUARIO_NO_EXISTE = 5;

async function login(req, res) {
  const { Username, Password } = req.body;
  const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const navegador = req.headers['user-agent'];

  if (!Username || !Password) {
    return res.status(400).json({ mensaje: 'Por favor ingresa usuario y contraseña' });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(Username);

    if (!usuario) {
      await bitacoraModel.registrarAcceso({
        IdUsuario: Username,
        IdTipoAcceso: USUARIO_NO_EXISTE,
        DireccionIp: ipOrigen,
        HttpUserAgent: navegador,
        Acceso: 'Intento de acceso con usuario inexistente'
      });
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    if (usuario.IdStatusUsuario === STATUS_BLOQUEADO) {
      await bitacoraModel.registrarAcceso({
        IdUsuario: usuario.IdUsuario,
        IdTipoAcceso: BLOQUEADO_INTENTOS_EXCEDIDOS,
        DireccionIp: ipOrigen,
        HttpUserAgent: navegador,
        Acceso: 'Intento de acceso con cuenta bloqueada'
      });
      return res.status(403).json({
        mensaje: 'Cuenta bloqueada por intentos fallidos. Contacta al Administrador para desbloquearla.'
      });
    }

    if (usuario.IdStatusUsuario === STATUS_INACTIVO) {
      await bitacoraModel.registrarAcceso({
        IdUsuario: usuario.IdUsuario,
        IdTipoAcceso: USUARIO_INACTIVO,
        DireccionIp: ipOrigen,
        HttpUserAgent: navegador,
        Acceso: 'Intento de acceso con cuenta inactiva'
      });
      return res.status(403).json({
        mensaje: 'Tu cuenta está inactiva. Contacta al Administrador.'
      });
    }

    // Trae la política de la empresa a la que pertenece el usuario (vía su sucursal)
    const politica = await empresaModel.obtenerPoliticasPasswordPorUsuario(usuario.IdUsuario);
    const maxIntentos = (politica && politica.PasswordIntentosAntesDeBloquear) || 3;

    let passwordValida = await bcrypt.compare(Password, usuario.Password);
    const passwordLegacyValida = /^[a-f0-9]{32}$/i.test(usuario.Password)
      && crypto.createHash('md5').update(Password).digest('hex') === usuario.Password;
    let passwordMigrada = false;
    if (!passwordValida && passwordLegacyValida) {
      passwordValida = true;
      passwordMigrada = true;
    }
    if (!passwordValida) {
      const intentos = await usuarioModel.registrarIntentoFallido(Username, usuario.IntentosDeAcceso || 0);

      if (intentos >= maxIntentos) {
        await usuarioModel.bloquearUsuario(Username, STATUS_BLOQUEADO);
        await bitacoraModel.registrarAcceso({
          IdUsuario: usuario.IdUsuario,
          IdTipoAcceso: BLOQUEADO_INTENTOS_EXCEDIDOS,
          DireccionIp: ipOrigen,
          HttpUserAgent: navegador,
          Acceso: `Cuenta bloqueada automáticamente tras alcanzar ${maxIntentos} intentos fallidos.`
        });
        return res.status(403).json({
          mensaje: `Has superado el límite de ${maxIntentos} intentos fallidos. Tu cuenta ha sido bloqueada.`
        });
      }

      await bitacoraModel.registrarAcceso({
        IdUsuario: usuario.IdUsuario,
        IdTipoAcceso: BLOQUEADO_PASSWORD_INCORRECTO,
        DireccionIp: ipOrigen,
        HttpUserAgent: navegador,
        Acceso: `Contraseña incorrecta. Intento ${intentos} de ${maxIntentos}.`
      });
      return res.status(401).json({
        mensaje: `Contraseña incorrecta. Te quedan ${maxIntentos - intentos} intento(s) antes de bloquearte.`
      });
    }

    const fechaCambio = usuario.UltimaFechaCambioPassword
      ? new Date(usuario.UltimaFechaCambioPassword)
      : null;
    const diasVigencia = Number(politica?.PasswordCantidadCaducidadDias || 0);
    const passwordCaducada = Boolean(
      fechaCambio && diasVigencia > 0 &&
      Date.now() - fechaCambio.getTime() >= diasVigencia * 24 * 60 * 60 * 1000
    );

    // Login correcto: genera token, actualiza último ingreso, resetea intentos
    const token = jwt.sign(
      { IdUsuario: usuario.IdUsuario, IdRole: usuario.IdRole, NombreRole: usuario.NombreRole },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await usuarioModel.registrarSesion(Username, token);
    if (passwordMigrada) {
      const hashedPassword = await bcrypt.hash(Password, 10);
      await usuarioModel.actualizarPasswordMigrada(Username, hashedPassword);
    }

    await bitacoraModel.registrarAcceso({
      IdUsuario: usuario.IdUsuario,
      IdTipoAcceso: ACCESO_CONCEDIDO,
      DireccionIp: ipOrigen,
      HttpUserAgent: navegador,
      Acceso: 'Inicio de sesión exitoso'
    });

    res.json({
      mensaje: '¡Inicio de sesión exitoso!',
      token,
      requiereCambiarPassword: usuario.RequiereCambiarPassword === 1 || passwordCaducada,
      usuario: {
        IdUsuario: usuario.IdUsuario,
        Nombre: usuario.Nombre,
        Apellido: usuario.Apellido,
        IdRole: usuario.IdRole,
        NombreRole: usuario.NombreRole,
        CorreoElectronico: usuario.CorreoElectronico
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function logout(req, res) {
  try {
    await usuarioModel.cerrarSesion(req.usuario.IdUsuario);
    res.json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Registración pública para usuarios nuevos
async function register(req, res) {
  const { 
    IdUsuario, Password, Nombre, Apellido, IdRole,
    FechaNacimiento, IdGenero, IdSucursal, CorreoElectronico, TelefonoMovil, 
    IdStatusUsuario, Pregunta, Respuesta
  } = req.body;

  // Validar campos obligatorios
  if (!IdUsuario || !Password || !Nombre || !Apellido || !IdRole || !FechaNacimiento || 
      !IdGenero || !IdSucursal || !Pregunta || !Respuesta) {
    return res.status(400).json({ 
      mensaje: 'Faltan campos obligatorios: IdUsuario, Password, Nombre, Apellido, IdRole, FechaNacimiento, IdGenero, IdSucursal, Pregunta, Respuesta' 
    });
  }

  try {
    // Verificar que el usuario no exista ya
    const usuarioExistente = await usuarioModel.obtenerPorId(IdUsuario);
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso. Elige otro.' });
    }

    // Obtener política de contraseña de la empresa (vía sucursal)
    const politica = await empresaModel.obtenerPoliticasPasswordPorUsuario(IdUsuario);
    if (!politica) {
      return res.status(400).json({ 
        mensaje: 'No se pudo obtener la política de contraseña para la sucursal especificada' 
      });
    }

    // Validar la contraseña contra la política de la empresa
    const validacionPassword = validatePasswordPolicy(Password, politica);
    if (!validacionPassword.isValid) {
      return res.status(400).json({ 
        mensaje: 'La contraseña no cumple con la política de seguridad de la empresa:',
        errores: validacionPassword.errors
      });
    }

    // Crear usuario con status activo por defecto si no se especifica
    const usuarioData = {
      IdUsuario,
      Password,
      Nombre,
      Apellido,
      IdRole,
      FechaNacimiento,
      IdGenero,
      IdSucursal,
      CorreoElectronico: CorreoElectronico || null,
      TelefonoMovil: TelefonoMovil || null,
      IdStatusUsuario: IdStatusUsuario || STATUS_ACTIVO,
      Pregunta,
      Respuesta,
      IntentosDeAcceso: 0,
      UsuarioCreacion: IdUsuario
    };

    await usuarioModel.crearUsuario(usuarioData);

    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    await bitacoraModel.registrarAcceso({
      IdUsuario,
      IdTipoAcceso: ACCESO_CONCEDIDO,
      DireccionIp: ipOrigen,
      HttpUserAgent: navegador,
      Acceso: 'Registro de nuevo usuario'
    });

    res.status(201).json({ 
      mensaje: `¡Usuario ${IdUsuario} registrado exitosamente! Ya puedes iniciar sesión.` 
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ 
      error: error.message || 'Error al registrar usuario' 
    });
  }
}

// Cambiar contraseña de usuario autenticado
async function cambiarContraseña(req, res) {
  const { IdUsuario, currentPassword, newPassword } = req.body;
  const usuarioTokenId = req.usuario?.IdUsuario; // Del token JWT

  // Verificar que el usuario en el token coincida con el que quiere cambiar contraseña
  if (usuarioTokenId !== IdUsuario) {
    return res.status(403).json({ 
      mensaje: 'No puedes cambiar la contraseña de otro usuario' 
    });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ 
      mensaje: 'Se requieren la contraseña actual y la nueva contraseña' 
    });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(IdUsuario);

    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // Verificar que la contraseña actual sea correcta
    const passwordValida = await bcrypt.compare(currentPassword, usuario.Password);
    if (!passwordValida) {
      return res.status(401).json({ 
        mensaje: 'Contraseña actual incorrecta' 
      });
    }

    // Obtener política de contraseña de la empresa
    const politica = await empresaModel.obtenerPoliticasPasswordPorUsuario(IdUsuario);
    if (!politica) {
      return res.status(400).json({ 
        mensaje: 'No se pudo obtener la política de contraseña' 
      });
    }

    // Validar la nueva contraseña contra la política de la empresa
    const validacionPassword = validatePasswordPolicy(newPassword, politica);
    if (!validacionPassword.isValid) {
      return res.status(400).json({ 
        mensaje: 'La nueva contraseña no cumple con la política de seguridad:',
        errores: validacionPassword.errors
      });
    }

    // Hash la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña (y marcar RequiereCambiarPassword como 0)
    await usuarioModel.actualizarContraseña(IdUsuario, hashedPassword, true);

    // Registrar en bitacora
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    await bitacoraModel.registrarAcceso({
      IdUsuario,
      IdTipoAcceso: ACCESO_CONCEDIDO,
      DireccionIp: ipOrigen,
      HttpUserAgent: navegador,
      Acceso: 'Cambio de contraseña exitoso'
    });

    res.json({ 
      mensaje: '¡Contraseña actualizada exitosamente!' 
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ 
      error: error.message || 'Error al cambiar contraseña' 
    });
  }
}

// Forgot password - Get security question
async function obtenerPreguntaSeguridad(req, res) {
  const { idUsuario } = req.params;

  try {
    const usuario = await usuarioModel.obtenerPorId(idUsuario);

    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    if (!usuario.Pregunta) {
      return res.status(400).json({ 
        mensaje: 'Este usuario no tiene una pregunta de seguridad configurada' 
      });
    }

    res.json({ 
      pregunta: usuario.Pregunta 
    });

  } catch (error) {
    console.error('Error al obtener pregunta de seguridad:', error);
    res.status(500).json({ 
      error: error.message || 'Error al obtener pregunta de seguridad' 
    });
  }
}

// Verify security answer
async function verificarRespuesta(req, res) {
  const { IdUsuario, Respuesta } = req.body;

  if (!IdUsuario || !Respuesta) {
    return res.status(400).json({ 
      mensaje: 'Usuario y respuesta son requeridos' 
    });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(IdUsuario);

    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // Verificar que la respuesta coincida (case-insensitive)
    if (usuario.Respuesta.toLowerCase() !== Respuesta.toLowerCase()) {
      return res.status(401).json({ 
        mensaje: 'Respuesta incorrecta' 
      });
    }

    res.json({ 
      mensaje: 'Respuesta verificada correctamente' 
    });

  } catch (error) {
    console.error('Error al verificar respuesta:', error);
    res.status(500).json({ 
      error: error.message || 'Error al verificar respuesta' 
    });
  }
}

// Reset password (public endpoint, no auth required)
async function resetearContraseña(req, res) {
  const { IdUsuario, newPassword } = req.body;

  if (!IdUsuario || !newPassword) {
    return res.status(400).json({ 
      mensaje: 'Usuario y nueva contraseña son requeridos' 
    });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(IdUsuario);

    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
      });
    }

    // Obtener política de contraseña de la empresa
    const politica = await empresaModel.obtenerPoliticasPasswordPorUsuario(IdUsuario);
    if (!politica) {
      return res.status(400).json({ 
        mensaje: 'No se pudo obtener la política de contraseña' 
      });
    }

    // Validar la nueva contraseña contra la política de la empresa
    const validacionPassword = validatePasswordPolicy(newPassword, politica);
    if (!validacionPassword.isValid) {
      return res.status(400).json({ 
        mensaje: 'La contraseña no cumple con la política de seguridad:',
        errores: validacionPassword.errors
      });
    }

    // Hash la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña
    await usuarioModel.actualizarContraseña(IdUsuario, hashedPassword);

    // Registrar en bitacora
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    await bitacoraModel.registrarAcceso({
      IdUsuario,
      IdTipoAcceso: ACCESO_CONCEDIDO,
      DireccionIp: ipOrigen,
      HttpUserAgent: navegador,
      Acceso: 'Reset de contraseña olvidada exitoso'
    });

    res.json({ 
      mensaje: '¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.' 
    });

  } catch (error) {
    console.error('Error al resetear contraseña:', error);
    res.status(500).json({ 
      error: error.message || 'Error al resetear contraseña' 
    });
  }
}

module.exports = { login, logout, register, cambiarContraseña, obtenerPreguntaSeguridad, verificarRespuesta, resetearContraseña };