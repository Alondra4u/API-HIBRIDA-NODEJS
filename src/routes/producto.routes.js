const express = require('express');
const router = express.Router();
const ProductoController = require('../controllers/producto.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');

router.get('/', ProductoController.obtenerProductos);
router.get('/:id', ProductoController.obtenerPorId);
router.get('/usuario/:usuarioId', ProductoController.obtenerPorUsuario);
router.post('/', verificarToken, verificarRol('admin', 'Vendedor'), ProductoController.crearProducto);
router.put('/:id', verificarToken, verificarRol('admin', 'Vendedor'), ProductoController.actualizarProducto);
router.delete('/:id', verificarToken, verificarRol('admin', 'Vendedor'), ProductoController.eliminarProducto);

module.exports = router;