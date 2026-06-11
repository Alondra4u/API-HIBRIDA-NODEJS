const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const axios = require('axios');
const Usuario = require('../models/usuario.model'); 


class AuthController {
    static async login(req, res) {
        try {
            const { Correo, Contrasena } = req.body;

            if(!Correo || !Contrasena){
                return res.status(400).json({
                    mensaje: 'Correo y Contraseña obligatorio'
                });
            }

     
            const usuario = await Usuario.buscarPorCorreo(Correo);
            
            if (!usuario) {
                return res.status(401).json({ mensaje: "Credenciales invalidas" });
            }

            const contrasenaValida = await bcrypt.compare(Contrasena, usuario.Contrasena);
            if (!contrasenaValida) {
                return res.status(401).json({ mensaje: "Credenciales Invalidas" });
            }

            // Si el usuario tiene una fecha de expiración registrada...
            if (usuario.expiracion_temp) {
                const ahora = new Date();
                const expiracion = new Date(usuario.expiracion_temp);
                
                // Comparamos si la hora actual ya superó la hora límite
                if (ahora > expiracion) {
                    return res.status(401).json({ mensaje: "Tu contraseña temporal ha expirado (15 min). Por favor, solicita una nueva." });
                }
            }

            const token = jwt.sign(
                { id: usuario.Id_Usuario, rol: usuario.Rol , correo: usuario.Correo, nombreUsuario: usuario.nombre_Usuario, nombreCompleto: usuario.nombre_Completo},
                process.env.JWT_SECRET,
                { expiresIn: '1h' }
            );

            res.json({
                mensaje: "Inicio de sesión exitoso",
                token: token,
                usuario: {
                    id: usuario.Id_Usuario,
                    nombreCompleto: usuario.nombre_Completo,
                    nombreUsuario: usuario.nombre_Usuario,
                    correo: usuario.Correo,
                    rol: usuario.Rol,
                    foto: usuario.Foto_Perfil

                }
            });

        } catch (error) {
            console.error("Error en login:", error);
            res.status(500).json({ mensaje: "Error interno del servidor" });
        }
    }

    static async perfil(req, res) {
        res.json({
            mensaje: 'Acceso Autorizado',
            usuario: req.usuario
        });
    }


    static async recuperarContrasena(req, res) {
        try {
            const { correo } = req.body;
            if (!correo) return res.status(400).json({ mensaje: "El correo es obligatorio" });

            const usuario = await Usuario.buscarPorCorreo(correo);
            if (!usuario) return res.status(404).json({ mensaje: "No existe ninguna cuenta registrada con ese correo." });

            const tempPassword = Math.random().toString(36).slice(-8);
            
            const salt = await bcrypt.genSalt(10);
            const hashedTempPassword = await bcrypt.hash(tempPassword, salt);
            await Usuario.actualizarContrasena(correo, hashedTempPassword);

            // ==========================================
            // EL PUENTE HACIA UBUNTU (MICROSERVICIO)
            // ==========================================
            // ATENCIÓN: Cambia esta URL por la misma de Ngrok que usas para las imágenes
            const URL_UBUNTU = 'https://vegetarian-suitable-sequences-semi.trycloudflare.com/api/correo';
            
            const respuestaUbuntu = await axios.post(URL_UBUNTU, {
                correo: correo,
                tempPassword: tempPassword,
                nombreUsuario: usuario.nombre_Usuario
            });

            if (respuestaUbuntu.data.exito) {
                res.json({ mensaje: "Contraseña temporal enviada con éxito. Revisa tu bandeja de entrada." });
            } else {
                throw new Error("Ubuntu no pudo enviar el correo");
            }

        } catch (error) {
            console.error("Error al recuperar:", error);
            // Manejo de error si Ngrok está apagado
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({ mensaje: "El servidor de correos (Ubuntu) está apagado en este momento." });
            }
            res.status(500).json({ mensaje: "Hubo un error al intentar enviar el correo." });
        }
    }
   
 }


module.exports = AuthController;