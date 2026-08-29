// Routes/catalogoRoutes.js
const express = require('express');
const router = express.Router();
const catalogoController = require('../Controller/catalogoController.js');
const { autenticar, verificarPermisos } = require('../Middleware/autorizacion.js');

router.use(autenticar); // exige token válido para todo este router

router.get('/empresas', verificarPermisos('Empresas', 'Consultar'), catalogoController.obtenerEmpresas);
router.post('/empresas', verificarPermisos('Empresas', 'Alta'), catalogoController.crearEmpresa);
router.put('/empresas/:id', verificarPermisos('Empresas', 'Cambio'), catalogoController.actualizarEmpresa);
router.delete('/empresas/:id', verificarPermisos('Empresas', 'Baja'), catalogoController.eliminarEmpresa);

router.get('/sucursales', verificarPermisos('Sucursales', 'Consultar'), catalogoController.obtenerSucursales);
router.post('/sucursales', verificarPermisos('Sucursales', 'Alta'), catalogoController.crearSucursal);
router.put('/sucursales/:id', verificarPermisos('Sucursales', 'Cambio'), catalogoController.actualizarSucursal);
router.delete('/sucursales/:id', verificarPermisos('Sucursales', 'Baja'), catalogoController.eliminarSucursal);

// OJO: en la tabla OPCION el nombre es 'Generos', sin tilde
router.get('/generos', verificarPermisos('Generos', 'Consultar'), catalogoController.obtenerGeneros);
router.post('/generos', verificarPermisos('Generos', 'Alta'), catalogoController.crearGenero);
router.put('/generos/:id', verificarPermisos('Generos', 'Cambio'), catalogoController.actualizarGenero);
router.delete('/generos/:id', verificarPermisos('Generos', 'Baja'), catalogoController.eliminarGenero);

router.get('/status-usuarios', verificarPermisos('Estatus Usuario', 'Consultar'), catalogoController.obtenerStatusUsuarios);
router.post('/status-usuarios', verificarPermisos('Estatus Usuario', 'Alta'), catalogoController.crearStatusUsuario);
router.put('/status-usuarios/:id', verificarPermisos('Estatus Usuario', 'Cambio'), catalogoController.actualizarStatusUsuario);
router.delete('/status-usuarios/:id', verificarPermisos('Estatus Usuario', 'Baja'), catalogoController.eliminarStatusUsuario);

module.exports = router;