const usuarioModel = require('../Model/usuarioModel.js');
const bitacoraModel = require('../Model/bitacoraModel.js');
const empresaModel = require('../Model/empresaModel.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// IDs fijos según el seed de STATUS_USUARIO: 1=Activo, 2=Bloqueado, 3=Inactivo
const STATUS_ACTIVO = 1;
const STATUS_BLOQUEADO = 2;

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

    // Trae la política de la empresa a la que pertenece el usuario (vía su sucursal)
    const politica = await empresaModel.obtenerPoliticasPasswordPorUsuario(usuario.IdUsuario);
    const maxIntentos = (politica && politica.PasswordIntentosAntesDeBloquear) || 3;

    const passwordValida = await bcrypt.compare(Password, usuario.Password);
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

    // Login correcto: genera token, actualiza último ingreso, resetea intentos
    const token = jwt.sign(
      { IdUsuario: usuario.IdUsuario, IdRole: usuario.IdRole, NombreRole: usuario.NombreRole },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    await usuarioModel.registrarLoginExitoso(Username, STATUS_ACTIVO, token);

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
      usuario: {
        id: usuario.IdUsuario,
        nombre: `${usuario.Nombre} ${usuario.Apellido}`,
        correo: usuario.CorreoElectronico,
        rol: usuario.NombreRole
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
    FechaNacimiento, IdGenero, IdSucursal, CorreoElectronico, TelefonoMovil, IdStatusUsuario
  } = req.body;

  // Validar campos obligatorios
  if (!IdUsuario || !Password || !Nombre || !Apellido || !IdRole || !FechaNacimiento || !IdGenero || !IdSucursal) {
    return res.status(400).json({ 
      mensaje: 'Faltan campos obligatorios: IdUsuario, Password, Nombre, Apellido, IdRole, FechaNacimiento, IdGenero, IdSucursal' 
    });
  }

  try {
    // Verificar que el usuario no exista ya
    const usuarioExistente = await usuarioModel.obtenerPorId(IdUsuario);
    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'El nombre de usuario ya está en uso. Elige otro.' });
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
      IdStatusUsuario: IdStatusUsuario || STATUS_ACTIVO, // Status activo por defecto
      IntentosDeAcceso: 0
    };

    await usuarioModel.crearUsuario(usuarioData);

    // Registrar el acceso exitoso de registro
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    await bitacoraModel.registrarAcceso({
      IdUsuario,
      IdTipoAcceso: 6, // Tipo de acceso personalizado para registro (puede ajustarse según tabla)
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

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      mensaje: 'La nueva contraseña debe tener al menos 6 caracteres' 
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

    // Hash la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await usuarioModel.actualizarContraseña(IdUsuario, hashedPassword);

    // Registrar en bitacora
    const ipOrigen = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const navegador = req.headers['user-agent'];
    
    await bitacoraModel.registrarAcceso({
      IdUsuario,
      IdTipoAcceso: 7, // Tipo de acceso personalizado para cambio de contraseña
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

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      mensaje: 'La contraseña debe tener al menos 6 caracteres' 
    });
  }

  try {
    const usuario = await usuarioModel.obtenerPorId(IdUsuario);

    if (!usuario) {
      return res.status(404).json({ 
        mensaje: 'Usuario no encontrado' 
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
      IdTipoAcceso: 8, // Tipo de acceso para reset de contraseña olvidada
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