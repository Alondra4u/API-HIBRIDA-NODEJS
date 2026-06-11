const Publicacion = require('../models/publicacion.model');

class MensajesController {

    // 1. CREAR MENSAJE
    static async crearMensaje(req, res) {
        try {
            const { idPublicacion } = req.params;
            const { Contenido } = req.body; // Solo recibimos el contenido
            const Id_Usuario_Token = req.usuario.id; // Tomamos el ID del token

            const publicacion = await Publicacion.findOne({ Id_Publicacion: idPublicacion });

            if (!publicacion) {
                return res.status(404).json({ exito: false, mensaje: "Publicación no encontrada" });
            }

            // Generador automático de ID para el mensaje
            let nuevoIdMensaje = 'MSG-001';
            if (publicacion.Mensaje.length > 0) {
                const ultimoMsg = publicacion.Mensaje[publicacion.Mensaje.length - 1];
                const numeroActual = parseInt(ultimoMsg.ID_Mensaje.split('-')[1]);
                nuevoIdMensaje = `MSG-${String(numeroActual + 1).padStart(3, '0')}`;
            }

            const nuevoMensaje = {
                ID_Mensaje: nuevoIdMensaje,
                Usuario: Id_Usuario_Token,
                Contenido,
                Detalle: [],
                fecha_E: new Date() // Agregamos fecha para ordenarlos
            };

            publicacion.Mensaje.push(nuevoMensaje);
            await publicacion.save();

            return res.json({ exito: true, mensaje: "Mensaje agregado", data: nuevoMensaje });

        } catch (error) {
            return res.status(500).json({ exito: false, error: error.message });
        }
    }
    // 🔥 2. RESPONDER MENSAJE (VA AQUÍ)
    static async responderMensaje(req, res) {
        try {
            const { idPublicacion, idMensaje } = req.params;
            const { ID_Mensaje_Detallado, Usuario, Comentario } = req.body;

            const publicacion = await Publicacion.findOne({ Id_Publicacion: idPublicacion });

            if (!publicacion) {
                return res.status(404).json({ exito: false, mensaje: "Publicación no encontrada" });
            }

            const mensaje = publicacion.Mensaje.find(m => m.ID_Mensaje === idMensaje);

            if (!mensaje) {
                return res.status(404).json({ exito: false, mensaje: "Mensaje no encontrado" });
            }

            const nuevoDetalle = {
                ID_Mensaje_Detallado,
                Usuario,
                Comentario
            };

            mensaje.Detalle.push(nuevoDetalle);

            await publicacion.save();

            return res.json({ exito: true, mensaje: "Respuesta agregada", data: nuevoDetalle });

        } catch (error) {
            return res.status(500).json({ exito: false, error: error.message });
        }
    }

    // 🔥 3. OBTENER MENSAJES (VA AQUÍ)
    static async obtenerMensajes(req, res) {
        try {
            const { idPublicacion } = req.params;

            const publicacion = await Publicacion.findOne(
                { Id_Publicacion: idPublicacion },
                { Mensaje: 1, _id: 0 }
            );

            if (!publicacion) {
                return res.status(404).json({ exito: false, mensaje: "No encontrada" });
            }

            return res.json({ exito: true, data: publicacion.Mensaje });

        } catch (error) {
            return res.status(500).json({ exito: false, error: error.message });
        }
    }
}

module.exports = MensajesController;