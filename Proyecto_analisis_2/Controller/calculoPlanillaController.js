const planillaModel = require('../Model/planillaModel.js');
const roleOpcionModel = require('../Model/roleOpcionModel.js');
const impuestos = require('../utils/impuestosGuatemala.js');
const { sendDatabaseError } = require('../utils/databaseError.js');

async function obtenerPeriodos(req, res) {
  try {
    res.json(await planillaModel.obtenerPeriodos());
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'consultar los periodos');
  }
}

async function calcularPlanilla(req, res) {
  const anio = Number(req.body.Anio);
  const mes = Number(req.body.Mes);
  const reprocesar = req.body.Reprocesar === true || req.body.Reprocesar === 1 || req.body.Reprocesar === '1';

  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return res.status(400).json({ mensaje: 'Debe seleccionar un periodo de planilla válido.' });
  }

  try {
    if (reprocesar) {
      const puedeCambiar = await roleOpcionModel.verificarPermiso(req.usuario.IdRole, 'Calcular Planilla', 'Cambio');
      if (puedeCambiar !== 1) {
        return res.status(403).json({ mensaje: 'Acceso denegado: tu rol no tiene permiso para recalcular una planilla.' });
      }
    }
    const resultado = await planillaModel.calcular(anio, mes, req.usuario.IdUsuario, reprocesar);
    res.status(reprocesar ? 200 : 201).json({
      mensaje: reprocesar ? 'Planilla recalculada exitosamente' : 'Planilla calculada exitosamente',
      resultado
    });
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'calcular la planilla');
  }
}

function calcularDescuentosEmpleado(req, res) {
  const sueldoBase = impuestos.numero(req.body.IngresoSueldoBase);
  const otrosIngresos = impuestos.numero(req.body.IngresoOtrosIngresos);
  if (sueldoBase < 0 || otrosIngresos < 0) {
    return res.status(400).json({ mensaje: 'Los ingresos deben ser mayores o iguales a cero.' });
  }
  res.json({
    ...impuestos.calcularDescuentos(sueldoBase, otrosIngresos),
    IngresoBonificacionDecreto: impuestos.BONIFICACION_INCENTIVO
  });
}

module.exports = { obtenerPeriodos, calcularPlanilla, calcularDescuentosEmpleado };
