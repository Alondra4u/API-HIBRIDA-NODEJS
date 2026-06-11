const express = require('express');
const router = express.Router();
const MensajesController = require('../controllers/mensajes.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/:idPublicacion', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), MensajesController.obtenerMensajes);
router.post('/:idPublicacion', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), MensajesController.crearMensaje);
router.post('/:idPublicacion/:idMensaje', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), MensajesController.responderMensaje);

module.exports = router;