const catalogoPlanillaModel = require('../Model/catalogoPlanillaModel.js');
const planillaModel = require('../Model/planillaModel.js');
const { sendDatabaseError } = require('../utils/databaseError.js');
const { generarPdfTabla, generarExcelTabla } = require('../utils/exportador.js');

function estaVacio(valor) {
  return valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');
}

function limpiarDatos(cuerpo) {
  const datos = {};
  Object.keys(cuerpo || {}).forEach((campo) => {
    const valor = cuerpo[campo];
    datos[campo] = typeof valor === 'string' ? valor.trim() : valor;
  });
  return datos;
}

function crearCrudController({
  model,
  entidad,
  nombre,
  genero = 'm',
  claves,
  requeridos,
  catalogos = [],
  exportacion,
  hooks = {}
}) {
  const articulo = genero === 'f' ? 'a' : 'o';
  const titulo = nombre.charAt(0).toUpperCase() + nombre.slice(1);
  const valoresClave = (req) => claves.map((clave) => req.params[clave]);

  function responderError(res, error) {
    res.status(error.status || 400).json({ mensaje: error.mensaje });
  }

  async function listar(req, res) {
    try {
      res.json(await model.obtenerTodos());
    } catch (error) {
      sendDatabaseError(res, error, entidad, `consultar ${nombre}`);
    }
  }

  async function obtener(req, res) {
    try {
      const registro = await model.obtenerPorClave(valoresClave(req));
      if (!registro) return res.status(404).json({ mensaje: 'No se encontró el registro solicitado.' });
      res.json(registro);
    } catch (error) {
      sendDatabaseError(res, error, entidad, `consultar ${nombre}`);
    }
  }

  async function crear(req, res) {
    try {
      const datos = limpiarDatos(req.body);
      const faltantes = Object.keys(requeridos).filter((campo) => estaVacio(datos[campo]));
      if (faltantes.length) {
        return res.status(400).json({
          mensaje: `Faltan campos obligatorios: ${faltantes.map((campo) => requeridos[campo]).join(', ')}.`
        });
      }
      if (hooks.antesDeCrear) {
        const error = await hooks.antesDeCrear(datos, req);
        if (error) return responderError(res, error);
      }
      const id = await model.crear(datos, req.usuario.IdUsuario);
      res.status(201).json(id === null ? { mensaje: `${titulo} cread${articulo} exitosamente` } : { mensaje: `${titulo} cread${articulo} exitosamente`, id });
    } catch (error) {
      sendDatabaseError(res, error, entidad, `crear ${nombre}`);
    }
  }

  async function actualizar(req, res) {
    try {
      const claveActual = valoresClave(req);
      const existente = await model.obtenerPorClave(claveActual);
      if (!existente) return res.status(404).json({ mensaje: 'No se encontró el registro solicitado.' });

      const datos = limpiarDatos(req.body);
      const faltantes = Object.keys(requeridos).filter(
        (campo) => !claves.includes(campo) && estaVacio(datos[campo])
      );
      if (faltantes.length) {
        return res.status(400).json({
          mensaje: `Faltan campos obligatorios: ${faltantes.map((campo) => requeridos[campo]).join(', ')}.`
        });
      }
      if (hooks.antesDeActualizar) {
        const error = await hooks.antesDeActualizar(datos, req, existente);
        if (error) return responderError(res, error);
      }
      await model.actualizar(claveActual, datos, req.usuario.IdUsuario);
      res.json({ mensaje: `${titulo} actualizad${articulo} exitosamente` });
    } catch (error) {
      sendDatabaseError(res, error, entidad, `actualizar ${nombre}`);
    }
  }

  async function eliminar(req, res) {
    try {
      const existente = await model.obtenerPorClave(valoresClave(req));
      if (!existente) return res.status(404).json({ mensaje: 'No se encontró el registro solicitado.' });
      if (hooks.antesDeEliminar) {
        const error = await hooks.antesDeEliminar(existente, req);
        if (error) return responderError(res, error);
      }
      await model.eliminar(valoresClave(req));
      res.json({ mensaje: `${titulo} eliminad${articulo} exitosamente` });
    } catch (error) {
      sendDatabaseError(res, error, entidad, `eliminar ${nombre}`);
    }
  }

  async function obtenerCatalogos(req, res) {
    try {
      res.json(await catalogoPlanillaModel.obtener(catalogos));
    } catch (error) {
      sendDatabaseError(res, error, entidad, 'consultar los catálogos');
    }
  }

  async function exportar(req, res, generador) {
    try {
      const [filas, empresa] = await Promise.all([model.obtenerTodos(), planillaModel.obtenerEmpresaPrincipal()]);
      await generador(res, {
        nombreArchivo: exportacion.archivo,
        empresa: empresa.Nombre,
        titulo: exportacion.titulo,
        columnas: exportacion.columnas,
        filas,
        usuario: req.usuario.IdUsuario
      });
    } catch (error) {
      if (!res.headersSent) sendDatabaseError(res, error, entidad, 'generar el archivo');
    }
  }

  const exportarPdf = (req, res) => exportar(req, res, generarPdfTabla);
  const exportarExcel = (req, res) => exportar(req, res, generarExcelTabla);

  return { listar, obtener, crear, actualizar, eliminar, obtenerCatalogos, exportarPdf, exportarExcel };
}

module.exports = { crearCrudController, estaVacio };
