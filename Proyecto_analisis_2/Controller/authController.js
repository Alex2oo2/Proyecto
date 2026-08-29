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

module.exports = { login, logout };