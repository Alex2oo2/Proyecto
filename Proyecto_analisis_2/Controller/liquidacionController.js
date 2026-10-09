const liquidacionModel = require('../Model/liquidacionModel.js');
const catalogoPlanillaModel = require('../Model/catalogoPlanillaModel.js');
const planillaModel = require('../Model/planillaModel.js');
const impuestos = require('../utils/impuestosGuatemala.js');
const { estaVacio } = require('./crudController.js');
const { sendDatabaseError } = require('../utils/databaseError.js');
const {
  formatearFecha,
  generarPdfTabla,
  generarPdfDocumento,
  generarExcelTabla,
  generarExcelDocumento
} = require('../utils/exportador.js');

const REQUERIDOS = {
  IdEmpleado: 'Empleado',
  IdPuesto: 'Puesto',
  FechaContratacion: 'Fecha de contratación',
  FechaEgreso: 'Fecha de egreso',
  FechaLiquidacion: 'Fecha de liquidación',
  MotivoEgreso: 'Motivo de egreso',
  IngresoSueldoBase: 'Sueldo base'
};

const CAMPOS_MONTO = [
  'IngresoSueldoBase', 'IngresoBonificacionDecreto', 'IngresoOtrosIngresos',
  'DescuentoIgss', 'DescuentoIsr', 'DescuentoInasistencias'
];

const COLUMNAS_LISTADO = [
  { campo: 'IdLiquidacion', titulo: 'No.', tipo: 'numero', ancho: 1 },
  { campo: 'NombreEmpleado', titulo: 'Empleado', ancho: 4 },
  { campo: 'NombrePuesto', titulo: 'Puesto', ancho: 4 },
  { campo: 'FechaContratacion', titulo: 'Contratación', tipo: 'fecha', ancho: 2.4 },
  { campo: 'FechaEgreso', titulo: 'Egreso', tipo: 'fecha', ancho: 2.4 },
  { campo: 'FechaLiquidacion', titulo: 'Liquidación', tipo: 'fecha', ancho: 2.4 },
  { campo: 'MotivoEgreso', titulo: 'Motivo', ancho: 3 },
  { campo: 'SalarioNeto', titulo: 'Salario neto', tipo: 'moneda', ancho: 2.8 },
  { campo: 'TotalIngresos', titulo: 'Total ingresos', tipo: 'moneda', ancho: 2.8 },
  { campo: 'TotalDescuentos', titulo: 'Total descuentos', tipo: 'moneda', ancho: 2.8 },
  { campo: 'TotalNeto', titulo: 'Total neto', tipo: 'moneda', ancho: 2.8 }
];

function prepararDatos(cuerpo) {
  const datos = {};
  Object.keys(cuerpo || {}).forEach((campo) => {
    const valor = cuerpo[campo];
    datos[campo] = typeof valor === 'string' ? valor.trim() : valor;
  });
  return datos;
}

function validarDatos(datos) {
  const faltantes = Object.keys(REQUERIDOS).filter((campo) => estaVacio(datos[campo]));
  if (faltantes.length) {
    return `Faltan campos obligatorios: ${faltantes.map((campo) => REQUERIDOS[campo]).join(', ')}.`;
  }

  const contratacion = impuestos.parsearFecha(datos.FechaContratacion);
  const egreso = impuestos.parsearFecha(datos.FechaEgreso);
  const liquidacion = impuestos.parsearFecha(datos.FechaLiquidacion);
  if (!contratacion || !egreso || !liquidacion) {
    return 'Las fechas de la liquidación no son válidas.';
  }
  if (egreso < contratacion) {
    return 'La fecha de egreso no puede ser anterior a la fecha de contratación.';
  }
  if (liquidacion < egreso) {
    return 'La fecha de liquidación no puede ser anterior a la fecha de egreso.';
  }
  if (!impuestos.obtenerMotivo(datos.MotivoEgreso)) {
    return 'El motivo de egreso seleccionado no es válido.';
  }

  if (estaVacio(datos.IngresoBonificacionDecreto)) datos.IngresoBonificacionDecreto = impuestos.BONIFICACION_INCENTIVO;
  if (estaVacio(datos.IngresoOtrosIngresos)) datos.IngresoOtrosIngresos = 0;
  if (estaVacio(datos.DescuentoInasistencias)) datos.DescuentoInasistencias = 0;

  if (Number(datos.IngresoSueldoBase) <= 0) {
    return 'El sueldo base debe ser un monto mayor a cero.';
  }

  const calculados = impuestos.calcularDescuentos(datos.IngresoSueldoBase, datos.IngresoOtrosIngresos);
  if (estaVacio(datos.DescuentoIgss)) datos.DescuentoIgss = calculados.DescuentoIgss;
  if (estaVacio(datos.DescuentoIsr)) datos.DescuentoIsr = calculados.DescuentoIsr;

  const invalido = CAMPOS_MONTO.some((campo) => !Number.isFinite(Number(datos[campo])) || Number(datos[campo]) < 0);
  if (invalido) {
    return 'Los montos de ingresos y descuentos deben ser valores numéricos mayores o iguales a cero.';
  }
  return null;
}

function armarRegistro(datos) {
  return {
    IdEmpleado: Number(datos.IdEmpleado),
    IdPuesto: Number(datos.IdPuesto),
    FechaContratacion: datos.FechaContratacion,
    FechaEgreso: datos.FechaEgreso,
    FechaLiquidacion: datos.FechaLiquidacion,
    MotivoEgreso: impuestos.obtenerMotivo(datos.MotivoEgreso).Nombre,
    ...impuestos.calcularLiquidacion(datos)
  };
}

async function listar(req, res) {
  try {
    res.json(await liquidacionModel.obtenerTodos());
  } catch (error) {
    sendDatabaseError(res, error, 'liquidacion', 'consultar las liquidaciones');
  }
}

async function obtener(req, res) {
  try {
    const liquidacion = await liquidacionModel.obtenerPorId(req.params.id);
    if (!liquidacion) return res.status(404).json({ mensaje: 'No se encontró la liquidación solicitada.' });
    res.json(liquidacion);
  } catch (error) {
    sendDatabaseError(res, error, 'liquidacion', 'consultar la liquidación');
  }
}

async function obtenerCatalogos(req, res) {
  try {
    const [empleados, catalogos] = await Promise.all([
      liquidacionModel.obtenerEmpleadosParaLiquidar(),
      catalogoPlanillaModel.obtener(['puestos'])
    ]);
    res.json({ empleados, puestos: catalogos.puestos, motivos: impuestos.MOTIVOS_EGRESO });
  } catch (error) {
    sendDatabaseError(res, error, 'liquidacion', 'consultar los catálogos');
  }
}

function calcular(req, res) {
  const datos = prepararDatos(req.body);
  const mensaje = validarDatos(datos);
  if (mensaje) return res.status(400).json({ mensaje });
  res.json(armarRegistro(datos));
}

async function crear(req, res) {
  try {
    const datos = prepararDatos(req.body);
    const mensaje = validarDatos(datos);
    if (mensaje) return res.status(400).json({ mensaje });

    const empleado = await liquidacionModel.obtenerEmpleado(datos.IdEmpleado);
    if (!empleado) return res.status(400).json({ mensaje: 'El empleado seleccionado no existe.' });

    const registro = armarRegistro(datos);
    const motivo = impuestos.obtenerMotivo(datos.MotivoEgreso);
    const resultado = await liquidacionModel.crear(registro, req.usuario.IdUsuario, motivo.StatusDestino);
    res.status(201).json({
      mensaje: 'Liquidación registrada exitosamente',
      id: resultado.id,
      statusActualizado: resultado.statusActualizado,
      liquidacion: registro
    });
  } catch (error) {
    sendDatabaseError(res, error, 'liquidacion', 'registrar la liquidación');
  }
}

async function actualizar(req, res) {
  try {
    const existente = await liquidacionModel.obtenerPorId(req.params.id);
    if (!existente) return res.status(404).json({ mensaje: 'No se encontró la liquidación solicitada.' });

    const datos = prepararDatos(req.body);
    const mensaje = validarDatos(datos);
    if (mensaje) return res.status(400).json({ mensaje });

    const registro = armarRegistro(datos);
    await liquidacionModel.actualizar(req.params.id, registro, req.usuario.IdUsuario);
    res.json({ mensaje: 'Liquidación actualizada exitosamente', liquidacion: registro });
  } catch (error) {
    sendDatabaseError(res, error, 'liquidacion', 'actualizar la liquidación');
  }
}

async function exportarListado(req, res, generador) {
  try {
    const [filas, empresa] = await Promise.all([liquidacionModel.obtenerTodos(), planillaModel.obtenerEmpresaPrincipal()]);
    await generador(res, {
      nombreArchivo: 'liquidaciones-empleados',
      empresa: empresa.Nombre,
      titulo: 'Liquidaciones de Empleados',
      columnas: COLUMNAS_LISTADO,
      filas,
      usuario: req.usuario.IdUsuario
    });
  } catch (error) {
    if (!res.headersSent) sendDatabaseError(res, error, 'liquidacion', 'generar el archivo');
  }
}

function secciones(liquidacion) {
  return [
    {
      titulo: 'Datos del empleado',
      columnas: 2,
      items: [
        { etiqueta: 'Empleado', valor: liquidacion.NombreEmpleado },
        { etiqueta: 'Puesto', valor: liquidacion.NombrePuesto },
        { etiqueta: 'Departamento', valor: liquidacion.NombreDepartamento },
        { etiqueta: 'Motivo de egreso', valor: liquidacion.MotivoEgreso },
        { etiqueta: 'Fecha de contratación', valor: liquidacion.FechaContratacion, tipo: 'fecha' },
        { etiqueta: 'Fecha de egreso', valor: liquidacion.FechaEgreso, tipo: 'fecha' },
        { etiqueta: 'Fecha de liquidación', valor: liquidacion.FechaLiquidacion, tipo: 'fecha' }
      ]
    },
    {
      titulo: 'Ingresos',
      items: [
        { etiqueta: 'Sueldo base', valor: liquidacion.IngresoSueldoBase, tipo: 'moneda' },
        { etiqueta: 'Bonificación Decreto 78-89', valor: liquidacion.IngresoBonificacionDecreto, tipo: 'moneda' },
        { etiqueta: 'Otros ingresos', valor: liquidacion.IngresoOtrosIngresos, tipo: 'moneda' },
        { etiqueta: 'Indemnización (Art. 82 Código de Trabajo)', valor: liquidacion.IngresoIndemnizacion, tipo: 'moneda' },
        { etiqueta: 'Aguinaldo proporcional (Decreto 76-78)', valor: liquidacion.IngresoAguinaldo, tipo: 'moneda' },
        { etiqueta: 'Bono 14 proporcional (Decreto 42-92)', valor: liquidacion.IngresoBono14, tipo: 'moneda' },
        { etiqueta: 'Vacaciones proporcionales', valor: liquidacion.IngresoVacaciones, tipo: 'moneda' },
        { etiqueta: 'Total de ingresos', valor: liquidacion.TotalIngresos, tipo: 'moneda', destacado: true }
      ]
    },
    {
      titulo: 'Descuentos',
      items: [
        { etiqueta: 'Cuota laboral IGSS (4.83%)', valor: liquidacion.DescuentoIgss, tipo: 'moneda' },
        { etiqueta: 'Impuesto Sobre la Renta (ISR)', valor: liquidacion.DescuentoIsr, tipo: 'moneda' },
        { etiqueta: 'Descuento por inasistencias', valor: liquidacion.DescuentoInasistencias, tipo: 'moneda' },
        { etiqueta: 'Total de descuentos', valor: liquidacion.TotalDescuentos, tipo: 'moneda', destacado: true }
      ]
    },
    {
      titulo: 'Resumen de la liquidación',
      items: [
        { etiqueta: 'Salario neto del último periodo', valor: liquidacion.SalarioNeto, tipo: 'moneda' },
        { etiqueta: 'Total neto de la liquidación', valor: liquidacion.TotalNeto, tipo: 'moneda', destacado: true }
      ]
    }
  ];
}

async function exportarDocumento(req, res, generador) {
  try {
    const [liquidacion, empresa] = await Promise.all([
      liquidacionModel.obtenerPorId(req.params.id),
      planillaModel.obtenerEmpresaPrincipal()
    ]);
    if (!liquidacion) return res.status(404).json({ mensaje: 'No se encontró la liquidación solicitada.' });
    await generador(res, {
      nombreArchivo: `liquidacion-${liquidacion.IdLiquidacion}`,
      empresa: empresa.Nombre,
      titulo: 'Liquidación de Empleado',
      subtitulo: `Liquidación No. ${liquidacion.IdLiquidacion} - Registrada el ${formatearFecha(liquidacion.FechaCreacion, true)}`,
      secciones: secciones(liquidacion),
      firmas: ['Recibí conforme (Empleado)', 'Autorizado por'],
      usuario: req.usuario.IdUsuario
    });
  } catch (error) {
    if (!res.headersSent) sendDatabaseError(res, error, 'liquidacion', 'generar el documento');
  }
}

const exportarListadoPdf = (req, res) => exportarListado(req, res, generarPdfTabla);
const exportarListadoExcel = (req, res) => exportarListado(req, res, generarExcelTabla);
const exportarDocumentoPdf = (req, res) => exportarDocumento(req, res, generarPdfDocumento);
const exportarDocumentoExcel = (req, res) => exportarDocumento(req, res, generarExcelDocumento);

module.exports = {
  listar,
  obtener,
  obtenerCatalogos,
  calcular,
  crear,
  actualizar,
  exportarListadoPdf,
  exportarListadoExcel,
  exportarDocumentoPdf,
  exportarDocumentoExcel
};
