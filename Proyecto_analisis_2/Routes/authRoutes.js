const express = require('express');
const router = express.Router();
const authController = require('../Controller/authController.js');
const { autenticar } = require('../Middleware/autorizacion.js');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/change-password', autenticar, authController.cambiarContraseña);

module.exports = router;