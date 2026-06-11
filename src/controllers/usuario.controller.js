const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const axios = require('axios'); 
const FormData = require('form-data');

class UsuarioController {
    static async obtenerUsuarios(req, res) {
        try {
            const usuarios = await Usuario.obtenerTodos();
            res.json(usuarios);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener Usuarios", error: error.message });
        }
    }

    static async crearUsuario(req, res) {
        try {
            const { nombre_Usuario, nombre_Completo, Correo, Contrasena, Rol } = req.body;
            const salt = await bcrypt.genSalt(10);
            const contrasenaEncriptada = await bcrypt.hash(Contrasena, salt);
            const nuevoUsuarioData = {
                nombre_Usuario,
                nombre_Completo,
                Correo,
                Contrasena: contrasenaEncriptada,
                Rol
            };
            const nuevoUsuario = await Usuario.crear(nuevoUsuarioData);
            
            res.status(201).json({ mensaje: "Usuario creado correctamente", data: nuevoUsuario });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al crear Usuario", error: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { Correo, Contrasena } = req.body;
            const usuario = await Usuario.buscarPorCorreo(Correo);
            
            if (!usuario) return res.status(404).json({ mensaje: "Usuario no encontrado" });

            if (usuario.Contrasena !== Contrasena) {
                return res.status(401).json({ mensaje: "Contraseña incorrecta" });
            }

            res.json({ 
                mensaje: "Login exitoso", 
                usuario: { id: usuario.Id_Usuario, nombre: usuario.nombre_Usuario, rol: usuario.Rol } 
            });
        } catch (error) {
            res.status(500).json({ mensaje: "Error en el login", error: error.message });
        }
    }

    static async actualizarUsuario(req, res) {
        try {
            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== String(req.params.id)) {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo puedes modificar tu propio perfil." });
            }

            // NUEVO: Si el usuario quiere cambiar su contraseña, la encriptamos
            if (req.body.Contrasena) {
                const salt = await bcrypt.genSalt(10);
                req.body.Contrasena = await bcrypt.hash(req.body.Contrasena, salt);
            }

            const actualizado = await Usuario.actualizar(req.params.id, req.body);
            res.json({ mensaje: "Usuario actualizado", data: actualizado });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar", error: error.message });
        }
    }

    static async eliminarUsuario(req, res) {
        try {
            // (La ruta ya está protegida solo para 'admin', pero la validación extra es buena práctica)
            await Usuario.eliminar(req.params.id);
            res.json({ mensaje: "Usuario eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar", error: error.message });
        }
    }

    static async obtenerUsuarioPorCorreo(req, res) {
        try {
            const correo = req.params.correo;
            const usuario = await Usuario.buscarPorCorreo(correo);
            
            if (!usuario) {
                return res.status(404).json({ mensaje: "No se encontró ningún usuario con ese correo" });
            }
            res.json(usuario);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al buscar usuario por correo", error: error.message });
        }
    }

    static async obtenerUsuarioPorId(req, res) {
        try {
            const usuario = await Usuario.obtenerPorId(req.params.id);
            if (!usuario) {
                return res.status(404).json({ mensaje: "Usuario no encontrado" });
            }
            res.json(usuario);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener usuario", error: error.message });
        }
    }

    static async subirFotoPerfil(req, res) {
        try {
            const idUsuario = req.params.id;

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(req.usuario.id) !== String(idUsuario)) {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo puedes cambiar tu propia foto de perfil." });
            }

            if (!req.file) {
                return res.status(400).json({ mensaje: "No se proporcionó ninguna imagen" });
            }

            const usuarioExiste = await Usuario.obtenerPorId(idUsuario);
            if (!usuarioExiste) {
                return res.status(404).json({ mensaje: "Usuario no encontrado" });
            }

            const form = new FormData();
            form.append('tipo', 'usuario'); 
            form.append('foto', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype,
            });

            const URL_NGROK_UBUNTU = 'https://vegetarian-suitable-sequences-semi.trycloudflare.com/api/subir';

            const respuestaUbuntu = await axios.post(URL_NGROK_UBUNTU, form, {
                headers: { ...form.getHeaders() },
                maxContentLength: Infinity,
                maxBodyLength: Infinity
            });

            if (respuestaUbuntu.data.exito) {
                const urlImagenFinal = respuestaUbuntu.data.url;
                await Usuario.actualizarFoto(idUsuario, urlImagenFinal);
                return res.json({ mensaje: "Foto de perfil actualizada correctamente", url: urlImagenFinal });
            } else {
                throw new Error("El servidor de almacenamiento no devolvió una respuesta exitosa");
            }

        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({ mensaje: "No se pudo conectar con el servidor de Ubuntu.", error: error.message });
            }
            res.status(500).json({ mensaje: "Error interno al procesar la imagen de perfil", error: error.message });
        }
    }
}

module.exports = UsuarioController;