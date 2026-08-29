// Routes/seguridadRoutes.js
const express = require('express');
const router = express.Router();
const seguridadController = require('../Controller/seguridadController.js');
const { autenticar, verificarPermisos } = require('../Middleware/autorizacion.js');

router.use(autenticar);

// OJO: en la tabla OPCION los nombres son 'Modulos' y 'Menus', sin tilde
router.get('/modulos', verificarPermisos('Modulos', 'Consultar'), seguridadController.obtenerModulos);
router.post('/modulos', verificarPermisos('Modulos', 'Alta'), seguridadController.crearModulo);
router.put('/modulos/:id', verificarPermisos('Modulos', 'Cambio'), seguridadController.actualizarModulo);
router.delete('/modulos/:id', verificarPermisos('Modulos', 'Baja'), seguridadController.eliminarModulo);

router.get('/menus', verificarPermisos('Menus', 'Consultar'), seguridadController.obtenerMenus);
router.post('/menus', verificarPermisos('Menus', 'Alta'), seguridadController.crearMenu);
router.put('/menus/:id', verificarPermisos('Menus', 'Cambio'), seguridadController.actualizarMenu);
router.delete('/menus/:id', verificarPermisos('Menus', 'Baja'), seguridadController.eliminarMenu);

router.get('/opciones', verificarPermisos('Opciones', 'Consultar'), seguridadController.obtenerOpciones);
router.post('/opciones', verificarPermisos('Opciones', 'Alta'), seguridadController.crearOpcion);
router.put('/opciones/:id', verificarPermisos('Opciones', 'Cambio'), seguridadController.actualizarOpcion);
router.delete('/opciones/:id', verificarPermisos('Opciones', 'Baja'), seguridadController.eliminarOpcion);

router.get('/roles', verificarPermisos('Roles', 'Consultar'), seguridadController.obtenerRoles);
router.post('/roles', verificarPermisos('Roles', 'Alta'), seguridadController.crearRole);
router.put('/roles/:id', verificarPermisos('Roles', 'Cambio'), seguridadController.actualizarRole);
router.delete('/roles/:id', verificarPermisos('Roles', 'Baja'), seguridadController.eliminarRole);

router.get('/permisos/:idRole/:idModulo', verificarPermisos('Asignar Opciones a un Role', 'Consultar'), seguridadController.obtenerMatrizPermisos);
router.post('/permisos', verificarPermisos('Asignar Opciones a un Role', 'Cambio'), seguridadController.guardarMatrizPermisos);

module.exports = router;