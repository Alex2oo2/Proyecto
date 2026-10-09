const express = require('express');
const router = express.Router();
const { recursos } = require('../Controller/planillaCrudController.js');
const calculoPlanillaController = require('../Controller/calculoPlanillaController.js');
const reportePlanillaController = require('../Controller/reportePlanillaController.js');
const liquidacionController = require('../Controller/liquidacionController.js');
const { autenticar, verificarPermisos } = require('../Middleware/autorizacion.js');

router.use(autenticar);

router.post(
  '/empleados/descuentos',
  verificarPermisos('Empleados', 'Consultar'),
  calculoPlanillaController.calcularDescuentosEmpleado
);

recursos.forEach(({ ruta, opcion, claves, controller }) => {
  const base = `/${ruta}`;
  const parametros = claves.map((clave) => `/:${clave}`).join('');

  router.get(`${base}/catalogos`, verificarPermisos(opcion, 'Consultar'), controller.obtenerCatalogos);
  router.get(`${base}/pdf`, verificarPermisos(opcion, 'Imprimir'), controller.exportarPdf);
  router.get(`${base}/excel`, verificarPermisos(opcion, 'Exportar'), controller.exportarExcel);
  router.get(base, verificarPermisos(opcion, 'Consultar'), controller.listar);
  router.get(`${base}${parametros}`, verificarPermisos(opcion, 'Consultar'), controller.obtener);
  router.post(base, verificarPermisos(opcion, 'Alta'), controller.crear);
  router.put(`${base}${parametros}`, verificarPermisos(opcion, 'Cambio'), controller.actualizar);
  router.delete(`${base}${parametros}`, verificarPermisos(opcion, 'Baja'), controller.eliminar);
});

router.get('/calculo/periodos', verificarPermisos('Calcular Planilla', 'Consultar'), calculoPlanillaController.obtenerPeriodos);
router.post('/calculo', verificarPermisos('Calcular Planilla', 'Alta'), calculoPlanillaController.calcularPlanilla);

router.get('/reporte/periodos', verificarPermisos('Reporte de Planilla', 'Consultar'), reportePlanillaController.obtenerPeriodosCalculados);
router.get('/reporte/:anio/:mes/pdf', verificarPermisos('Reporte de Planilla', 'Imprimir'), reportePlanillaController.exportarReportePdf);
router.get('/reporte/:anio/:mes/excel', verificarPermisos('Reporte de Planilla', 'Exportar'), reportePlanillaController.exportarReporteExcel);
router.get('/reporte/:anio/:mes', verificarPermisos('Reporte de Planilla', 'Consultar'), reportePlanillaController.obtenerReporte);

router.get('/boletas/periodos', verificarPermisos('Boletas de Pago', 'Consultar'), reportePlanillaController.obtenerPeriodosCalculados);
router.get('/boletas/empleados/:anio/:mes', verificarPermisos('Boletas de Pago', 'Consultar'), reportePlanillaController.obtenerEmpleadosBoleta);
router.get('/boletas/:anio/:mes/:idEmpleado/pdf', verificarPermisos('Boletas de Pago', 'Imprimir'), reportePlanillaController.exportarBoletaPdf);
router.get('/boletas/:anio/:mes/:idEmpleado/excel', verificarPermisos('Boletas de Pago', 'Exportar'), reportePlanillaController.exportarBoletaExcel);
router.get('/boletas/:anio/:mes/:idEmpleado', verificarPermisos('Boletas de Pago', 'Consultar'), reportePlanillaController.obtenerBoleta);

const OPCION_LIQUIDACION = 'Liquidacion de Empleado';
router.get('/liquidaciones/catalogos', verificarPermisos(OPCION_LIQUIDACION, 'Consultar'), liquidacionController.obtenerCatalogos);
router.get('/liquidaciones/pdf', verificarPermisos(OPCION_LIQUIDACION, 'Imprimir'), liquidacionController.exportarListadoPdf);
router.get('/liquidaciones/excel', verificarPermisos(OPCION_LIQUIDACION, 'Exportar'), liquidacionController.exportarListadoExcel);
router.post('/liquidaciones/calcular', verificarPermisos(OPCION_LIQUIDACION, 'Consultar'), liquidacionController.calcular);
router.get('/liquidaciones', verificarPermisos(OPCION_LIQUIDACION, 'Consultar'), liquidacionController.listar);
router.get('/liquidaciones/:id/pdf', verificarPermisos(OPCION_LIQUIDACION, 'Imprimir'), liquidacionController.exportarDocumentoPdf);
router.get('/liquidaciones/:id/excel', verificarPermisos(OPCION_LIQUIDACION, 'Exportar'), liquidacionController.exportarDocumentoExcel);
router.get('/liquidaciones/:id', verificarPermisos(OPCION_LIQUIDACION, 'Consultar'), liquidacionController.obtener);
router.post('/liquidaciones', verificarPermisos(OPCION_LIQUIDACION, 'Alta'), liquidacionController.crear);
router.put('/liquidaciones/:id', verificarPermisos(OPCION_LIQUIDACION, 'Cambio'), liquidacionController.actualizar);

module.exports = router;
