const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth.middleware');
const AuthController = require('../controllers/auth.controller');

router.post('/login', AuthController.login);
router.get('/perfil', verificarToken, AuthController.perfil);
router.post('/recuperar', AuthController.recuperarContrasena);
module.exports = router;