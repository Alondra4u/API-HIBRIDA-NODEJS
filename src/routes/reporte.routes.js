const express = require('express');
const router = express.Router();
const multer = require('multer');
const ReporteController = require('../controllers/reporte.controller');
const uploadMemoria = multer({ storage: multer.memoryStorage() });
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', verificarToken, verificarRol('admin'), ReporteController.obtenerReportes);
router.get('/estadisticas', verificarToken, verificarRol('admin'), ReporteController.obtenerEstadisticas);
router.get('/:id', verificarToken, verificarRol('admin'), ReporteController.obtenerReporte);
router.post('/', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), ReporteController.crearReporte);
router.post('/:id/imagen', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), uploadMemoria.single('foto'), ReporteController.subirImagenReporte);
router.put('/:id', verificarToken, verificarRol('admin'), ReporteController.actualizarReporte);
router.delete('/:id', verificarToken, verificarRol('admin'), ReporteController.eliminarReporte);
router.post('/filtrar', verificarToken, verificarRol('admin'), ReporteController.filtrar);


module.exports = router;