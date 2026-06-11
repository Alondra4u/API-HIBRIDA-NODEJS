const express = require('express');
const router = express.Router();
const multer = require('multer');
const UsuarioController = require('../controllers/usuario.controller');
const { verificarToken, verificarRol } = require('../middlewares/auth.middleware');
const uploadMemoria = multer({ storage: multer.memoryStorage() });

router.get('/', verificarToken, verificarRol('admin'), UsuarioController.obtenerUsuarios);
router.get('/:id', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), UsuarioController.obtenerUsuarioPorId); // Buscar Usuario
router.get('/correo/:correo', verificarToken, verificarRol('admin'), UsuarioController.obtenerUsuarioPorCorreo); //Buscar Correo
router.post('/', UsuarioController.crearUsuario); // Crear Usuario
router.post('/login', UsuarioController.login); // Login*/
router.put('/:id', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), UsuarioController.actualizarUsuario); // Update
router.delete('/:id', verificarToken, verificarRol('admin'), UsuarioController.eliminarUsuario); // Borrar
router.post('/:id/foto', verificarToken, verificarRol('admin', 'Estudiante', 'Vendedor'), uploadMemoria.single('foto'), UsuarioController.subirFotoPerfil);

module.exports = router;