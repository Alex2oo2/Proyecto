const express = require('express');
const router = express.Router();
const usuarioController = require('../Controller/usuarioController.js');
const { autenticar, verificarPermisos } = require('../Middleware/autorizacion.js');

// Aplicar autenticación a todas las rutas en este router
router.use(autenticar);

router.get('/usuarios', verificarPermisos('Usuarios', 'Consultar'), usuarioController.obtenerTodos);
router.get('/usuarios/:id', verificarPermisos('Usuarios', 'Consultar'), usuarioController.obtenerPorId);
router.post('/usuarios', verificarPermisos('Usuarios', 'Alta'), usuarioController.crear);
router.put('/usuarios/:id', verificarPermisos('Usuarios', 'Cambio'), usuarioController.actualizar);
router.delete('/usuarios/:id', verificarPermisos('Usuarios', 'Baja'), usuarioController.eliminar);

module.exports = router;