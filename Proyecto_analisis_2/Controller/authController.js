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

module.exports = { login, logout, register };