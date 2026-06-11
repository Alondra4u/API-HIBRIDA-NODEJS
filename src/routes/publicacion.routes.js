const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const controller = require('../controllers/publicacion.controller');
const uploadMemoria = multer({ storage: multer.memoryStorage() });


router.post('/', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.crearPublicacion);
router.get('/buscar', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.buscarPublicaciones);
router.post('/buscar', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.buscarPublicaciones);
router.post('/:id/imagen', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), uploadMemoria.single('foto'), controller.subirImagenPublicacion);
router.put('/:id', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.actualizarPublicacion);
router.delete('/:id', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.eliminarPublicacion);
router.post('/:id/like', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), controller.darLike);

module.exports = router;