const planillaModel = require('../Model/planillaModel.js');
const { sendDatabaseError } = require('../utils/databaseError.js');
const {
  formatearFecha,
  generarPdfTabla,
  generarPdfDocumento,
  generarExcelTabla,
  generarExcelDocumento
} = require('../utils/exportador.js');

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const COLUMNAS_REPORTE = [
  { campo: 'NombreEmpleado', titulo: 'Empleado', ancho: 5 },
  { campo: 'FechaContratacion', titulo: 'Contratación', tipo: 'fecha', ancho: 2.4 },
  { campo: 'NombrePuesto', titulo: 'Puesto', ancho: 4 },
  { campo: 'NombreStatus', titulo: 'Status', ancho: 2.4 },
  { campo: 'IngresoSueldoBase', titulo: 'Sueldo base', tipo: 'moneda', ancho: 3 },
  { campo: 'IngresoBonificacionDecreto', titulo: 'Bonif. Decreto', tipo: 'moneda', ancho: 2.8 },
  { campo: 'IngresoOtrosIngresos', titulo: 'Otros ingresos', tipo: 'moneda', ancho: 2.8 },
  { campo: 'DescuentoIgss', titulo: 'IGSS', tipo: 'moneda', ancho: 2.6 },
  { campo: 'DescuentoIsr', titulo: 'ISR', tipo: 'moneda', ancho: 2.6 },
  { campo: 'DescuentoInasistencias', titulo: 'Inasistencias', tipo: 'moneda', ancho: 2.8 },
  { campo: 'SalarioNeto', titulo: 'Salario neto', tipo: 'moneda', ancho: 3 }
];

function leerPeriodo(req) {
  const anio = Number(req.params.anio);
  const mes = Number(req.params.mes);
  if (!Number.isInteger(anio) || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
  return { anio, mes };
}

function descripcionPeriodo(anio, mes) {
  return `${MESES[mes - 1]} ${anio}`;
}

async function obtenerPeriodosCalculados(req, res) {
  try {
    res.json(await planillaModel.obtenerPeriodosCalculados());
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'consultar los periodos');
  }
}

async function cargarReporte(req, res) {
  const periodo = leerPeriodo(req);
  if (!periodo) {
    res.status(400).json({ mensaje: 'El periodo de planilla no es válido.' });
    return null;
  }
  const cabecera = await planillaModel.obtenerCabecera(periodo.anio, periodo.mes);
  if (!cabecera) {
    res.status(404).json({ mensaje: 'La planilla del periodo seleccionado todavía no ha sido calculada.' });
    return null;
  }
  const detalle = await planillaModel.obtenerDetalle(periodo.anio, periodo.mes);
  return { periodo, cabecera, detalle };
}

async function obtenerReporte(req, res) {
  try {
    const datos = await cargarReporte(req, res);
    if (datos) res.json({ Cabecera: datos.cabecera, Detalle: datos.detalle });
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'consultar el reporte');
  }
}

async function exportarReporte(req, res, generador) {
  try {
    const datos = await cargarReporte(req, res);
    if (!datos) return;
    const empresa = await planillaModel.obtenerEmpresaPrincipal();
    const { cabecera, periodo } = datos;
    await generador(res, {
      nombreArchivo: `planilla-${periodo.anio}-${String(periodo.mes).padStart(2, '0')}`,
      empresa: empresa.Nombre,
      titulo: `Planilla de ${descripcionPeriodo(periodo.anio, periodo.mes)}`,
      subtitulo: `Periodo del ${formatearFecha(cabecera.FechaInicio)} al ${formatearFecha(cabecera.FechaFin)} - Procesada el ${formatearFecha(cabecera.FechaHoraProcesada, true)}`,
      columnas: COLUMNAS_REPORTE,
      filas: datos.detalle,
      totales: {
        IngresoSueldoBase: datos.detalle.reduce((total, fila) => total + Number(fila.IngresoSueldoBase), 0),
        IngresoBonificacionDecreto: datos.detalle.reduce((total, fila) => total + Number(fila.IngresoBonificacionDecreto), 0),
        IngresoOtrosIngresos: datos.detalle.reduce((total, fila) => total + Number(fila.IngresoOtrosIngresos), 0),
        DescuentoIgss: datos.detalle.reduce((total, fila) => total + Number(fila.DescuentoIgss), 0),
        DescuentoIsr: datos.detalle.reduce((total, fila) => total + Number(fila.DescuentoIsr), 0),
        DescuentoInasistencias: datos.detalle.reduce((total, fila) => total + Number(fila.DescuentoInasistencias), 0),
        SalarioNeto: Number(cabecera.SalarioNeto)
      },
      resumen: [
        { etiqueta: 'Total de ingresos', valor: cabecera.TotalIngresos, tipo: 'moneda' },
        { etiqueta: 'Total de descuentos', valor: cabecera.TotalDescuentos, tipo: 'moneda' },
        { etiqueta: 'Salario neto', valor: cabecera.SalarioNeto, tipo: 'moneda' }
      ],
      usuario: req.usuario.IdUsuario
    });
  } catch (error) {
    if (!res.headersSent) sendDatabaseError(res, error, 'planilla', 'generar el reporte');
  }
}

const exportarReportePdf = (req, res) => exportarReporte(req, res, generarPdfTabla);
const exportarReporteExcel = (req, res) => exportarReporte(req, res, generarExcelTabla);

async function obtenerEmpleadosBoleta(req, res) {
  const periodo = leerPeriodo(req);
  if (!periodo) return res.status(400).json({ mensaje: 'El periodo de planilla no es válido.' });
  try {
    res.json(await planillaModel.obtenerEmpleadosDePlanilla(periodo.anio, periodo.mes));
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'consultar los empleados de la planilla');
  }
}

async function cargarBoleta(req, res) {
  const periodo = leerPeriodo(req);
  const idEmpleado = Number(req.params.idEmpleado);
  if (!periodo || !Number.isInteger(idEmpleado)) {
    res.status(400).json({ mensaje: 'El periodo o el empleado seleccionado no es válido.' });
    return null;
  }
  const [cabecera, detalle, empresa, adicionales] = await Promise.all([
    planillaModel.obtenerCabecera(periodo.anio, periodo.mes),
    planillaModel.obtenerDetalleEmpleado(periodo.anio, periodo.mes, idEmpleado),
    planillaModel.obtenerEmpresaPrincipal(),
    planillaModel.obtenerDatosEmpleadoBoleta(idEmpleado)
  ]);
  if (!cabecera || !detalle) {
    res.status(404).json({ mensaje: 'El empleado no forma parte de la planilla del periodo seleccionado.' });
    return null;
  }
  return {
    periodo,
    boleta: {
      Empresa: empresa,
      Periodo: {
        Anio: periodo.anio,
        Mes: periodo.mes,
        Descripcion: descripcionPeriodo(periodo.anio, periodo.mes),
        FechaInicio: cabecera.FechaInicio,
        FechaFin: cabecera.FechaFin,
        FechaHoraProcesada: cabecera.FechaHoraProcesada
      },
      Detalle: detalle,
      Documentos: adicionales.Documentos,
      CuentaBancaria: adicionales.CuentaBancaria
    }
  };
}

async function obtenerBoleta(req, res) {
  try {
    const datos = await cargarBoleta(req, res);
    if (datos) res.json(datos.boleta);
  } catch (error) {
    sendDatabaseError(res, error, 'planilla', 'consultar la boleta');
  }
}

function secciones(boleta) {
  const { Detalle: detalle, Periodo: periodo, Documentos: documentos, CuentaBancaria: cuenta } = boleta;
  const datosEmpleado = [
    { etiqueta: 'Empleado', valor: detalle.NombreEmpleado },
    { etiqueta: 'Código', valor: detalle.IdEmpleado },
    { etiqueta: 'Puesto', valor: detalle.NombrePuesto },
    { etiqueta: 'Departamento', valor: detalle.NombreDepartamento },
    { etiqueta: 'Fecha de contratación', valor: detalle.FechaContratacion, tipo: 'fecha' },
    { etiqueta: 'Status', valor: detalle.NombreStatus },
    { etiqueta: 'Periodo de pago', valor: periodo.Descripcion },
    { etiqueta: 'Del - Al', valor: `${formatearFecha(periodo.FechaInicio)} - ${formatearFecha(periodo.FechaFin)}` }
  ];
  documentos.forEach((documento) => {
    datosEmpleado.push({ etiqueta: documento.TipoDocumento, valor: documento.NoDocumento });
  });
  if (cuenta) {
    datosEmpleado.push({ etiqueta: 'Banco', valor: cuenta.NombreBanco });
    datosEmpleado.push({ etiqueta: 'Cuenta de depósito', valor: cuenta.NumeroDeCuenta });
  }

  return [
    { titulo: 'Datos del empleado', columnas: 2, items: datosEmpleado },
    {
      titulo: 'Ingresos',
      items: [
        { etiqueta: 'Sueldo base', valor: detalle.IngresoSueldoBase, tipo: 'moneda' },
        { etiqueta: 'Bonificación Decreto 78-89', valor: detalle.IngresoBonificacionDecreto, tipo: 'moneda' },
        { etiqueta: 'Otros ingresos', valor: detalle.IngresoOtrosIngresos, tipo: 'moneda' },
        { etiqueta: 'Total de ingresos', valor: detalle.TotalIngresos, tipo: 'moneda', destacado: true }
      ]
    },
    {
      titulo: 'Descuentos',
      items: [
        { etiqueta: 'Cuota laboral IGSS (4.83%)', valor: detalle.DescuentoIgss, tipo: 'moneda' },
        { etiqueta: 'Impuesto Sobre la Renta (ISR)', valor: detalle.DescuentoIsr, tipo: 'moneda' },
        { etiqueta: 'Descuento por inasistencias', valor: detalle.DescuentoInasistencias, tipo: 'moneda' },
        { etiqueta: 'Total de descuentos', valor: detalle.TotalDescuentos, tipo: 'moneda', destacado: true }
      ]
    },
    {
      titulo: 'Líquido a recibir',
      items: [{ etiqueta: 'Salario neto', valor: detalle.SalarioNeto, tipo: 'moneda', destacado: true }]
    }
  ];
}

async function exportarBoleta(req, res, generador) {
  try {
    const datos = await cargarBoleta(req, res);
    if (!datos) return;
    const { boleta, periodo } = datos;
    await generador(res, {
      nombreArchivo: `boleta-${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-${boleta.Detalle.IdEmpleado}`,
      empresa: boleta.Empresa.Nombre,
      titulo: 'Boleta de Pago',
      subtitulo: `${boleta.Empresa.Direccion || ''}${boleta.Empresa.Nit ? ` - NIT ${boleta.Empresa.Nit}` : ''}`,
      secciones: secciones(boleta),
      firmas: ['Recibí conforme (Empleado)', 'Autorizado por'],
      usuario: req.usuario.IdUsuario
    });
  } catch (error) {
    if (!res.headersSent) sendDatabaseError(res, error, 'planilla', 'generar la boleta');
  }
}

const exportarBoletaPdf = (req, res) => exportarBoleta(req, res, generarPdfDocumento);
const exportarBoletaExcel = (req, res) => exportarBoleta(req, res, generarExcelDocumento);

module.exports = {
  obtenerPeriodosCalculados,
  obtenerReporte,
  exportarReportePdf,
  exportarReporteExcel,
  obtenerEmpleadosBoleta,
  obtenerBoleta,
  exportarBoletaPdf,
  exportarBoletaExcel
};
