const Publicacion = require('../models/publicacion.model');
const Usuario = require('../models/usuario.model'); 
const Producto = require('../models/producto.model');
const axios = require('axios'); 
const FormData = require('form-data'); 

class PublicacionController {

    // ==========================================
    // CREAR PUBLICACIÓN (Con ID Automático PUB-XXX)
    // ==========================================
    static async crearPublicacion(req, res) {
        try {
            const { Id_Producto, Titulo, Contenido, Imagen } = req.body;
            
            // 🛡️ Asignamos el autor desde el token para evitar suplantación
            const Id_Usuario = req.usuario.id;

            const productoExiste = await Producto.obtenerPorId(Id_Producto);
            if (!productoExiste) {
                return res.status(404).json({ exito: false, mensaje: "El producto no existe" });
            }

            // 🤖 GENERADOR AUTOMÁTICO DE ID (PUB-XXX)
            let nuevoIdPublicacion = 'PUB-001'; 
            
            // Buscamos la última publicación creada
            const ultimaPublicacion = await Publicacion.findOne().sort({ Id_Publicacion: -1 });

            if (ultimaPublicacion && ultimaPublicacion.Id_Publicacion) {
                const partesId = ultimaPublicacion.Id_Publicacion.split('-'); 
                const numeroActual = parseInt(partesId[1]); 

                if (!isNaN(numeroActual)) {
                    const siguienteNumero = numeroActual + 1; 
                    nuevoIdPublicacion = `PUB-${String(siguienteNumero).padStart(3, '0')}`;
                }
            }

            const nuevaPublicacion = new Publicacion({
                Id_Publicacion: nuevoIdPublicacion, 
                Id_Producto, 
                Id_Usuario, 
                Titulo, 
                Contenido, 
                Imagen: Imagen || null
            });

            const data = await nuevaPublicacion.save();
            return res.status(201).json({ exito: true, mensaje: "Publicación creada con éxito", Id_Publicacion: nuevoIdPublicacion, data });

        } catch (error) {
            return res.status(500).json({ exito: false, mensaje: "Error al crear la publicación", error: error.message });
        }
    }

    // ==========================================
    // ACTUALIZAR PUBLICACIÓN
    // ==========================================
    static async actualizarPublicacion(req, res) {
        try {
            const { id } = req.params;
            const { Titulo, Contenido, Imagen } = req.body;

            const publicacionActual = await Publicacion.findOne({ Id_Publicacion: id });
            if (!publicacionActual) return res.status(404).json({ exito: false, mensaje: "No encontrada" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(publicacionActual.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ exito: false, mensaje: "Acceso denegado. No eres el creador de esta publicación." });
            }

            const data = await Publicacion.findOneAndUpdate(
                { Id_Publicacion: id },
                { Titulo, Contenido, Imagen },
                { new: true }
            );

            return res.json({ exito: true, mensaje: "Actualizada", data });
        } catch (error) {
            return res.status(500).json({ exito: false, mensaje: "Error al actualizar", error: error.message });
        }
    }

    // ==========================================
    // ELIMINAR PUBLICACIÓN
    // ==========================================
    static async eliminarPublicacion(req, res) {
        try {
            const { id } = req.params;

            const publicacionActual = await Publicacion.findOne({ Id_Publicacion: id });
            if (!publicacionActual) return res.status(404).json({ exito: false, mensaje: "No encontrada" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(publicacionActual.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ exito: false, mensaje: "Acceso denegado. No eres el creador de esta publicación." });
            }

            await Publicacion.findOneAndDelete({ Id_Publicacion: id });
            return res.json({ exito: true, mensaje: "Eliminada" });
        } catch (error) {
            return res.status(500).json({ exito: false, mensaje: "Error al eliminar", error: error.message });
        }
    }

    // ==========================================
    // BUSCAR PUBLICACIONES
    // ==========================================
    static async buscarPublicaciones(req, res) {
        try {
            const dataInput = req.method === 'GET' ? req.query : req.body;
            const { texto, page = 1, limit = 10 } = dataInput;
            let filtro = {};

            if (texto) {
                filtro.$or = [
                    { Titulo: { $regex: texto, $options: 'i' } },
                    { Contenido: { $regex: texto, $options: 'i' } }
                ];
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);
            const publicaciones = await Publicacion.find(filtro).sort({ fecha_Post: -1 }).skip(skip).limit(parseInt(limit));
            const total = await Publicacion.countDocuments(filtro);

            // Cruce de datos con MySQL para Autores y Comentaristas
            const publicacionesConAutor = await Promise.all(publicaciones.map(async (pub) => {
                const pubObj = pub.toObject();
                
                // A. Buscar nombre del autor del Post
                try {
                    const autor = await Usuario.obtenerPorId(pubObj.Id_Usuario);
                    pubObj.nombre_usuario = autor ? autor.nombre_Usuario : "Usuario Desconocido";
                    pubObj.foto_usuario = autor ? autor.Foto_Perfil : null; 
                } catch (err) {
                    pubObj.nombre_usuario = "Usuario Desconocido";
                }

                // B. NUEVO: Buscar nombres de los autores de los comentarios
                if (pubObj.Mensaje && pubObj.Mensaje.length > 0) {
                    pubObj.Mensaje = await Promise.all(pubObj.Mensaje.map(async (msg) => {
                        try {
                            const userMsg = await Usuario.obtenerPorId(msg.Usuario);
                            // Le agregamos el nombre real al objeto del mensaje
                            msg.nombre_usuario = userMsg ? userMsg.nombre_Usuario : `Usuario ${msg.Usuario}`;
                            msg.foto_usuario = userMsg ? userMsg.Foto_Perfil : null;
                        } catch (e) {
                            msg.nombre_usuario = `Usuario ${msg.Usuario}`;
                        }
                        return msg;
                    }));
                }

                return pubObj;
            }));

            return res.json({ 
                exito: true, total, page: parseInt(page), 
                totalPages: Math.ceil(total / limit), 
                data: publicacionesConAutor 
            });
        } catch (error) {
            console.error("Error General en buscarPublicaciones:", error);
            return res.status(500).json({ exito: false, mensaje: error.message });
        }
    }

    // ==========================================
    // SUBIR IMAGEN A UBUNTU
    // ==========================================
    static async subirImagenPublicacion(req, res) {
        try {
            const idPublicacion = req.params.id;
            if (!req.file) return res.status(400).json({ exito: false, mensaje: "No se proporcionó ninguna imagen" });

            const publicacionExiste = await Publicacion.findOne({ Id_Publicacion: idPublicacion });
            if (!publicacionExiste) return res.status(404).json({ exito: false, mensaje: "Publicación no encontrada" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(publicacionExiste.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ exito: false, mensaje: "Acceso denegado. No eres el creador de esta publicación." });
            }

            const form = new FormData();
            form.append('tipo', 'publicacion');
            form.append('id_referencia', idPublicacion);
            form.append('foto', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

            const URL_STORAGE = 'https://vegetarian-suitable-sequences-semi.trycloudflare.com/api/subir';
            const respuestaUbuntu = await axios.post(URL_STORAGE, form, {
                headers: { ...form.getHeaders() },
                maxContentLength: Infinity, maxBodyLength: Infinity
            });

            if (respuestaUbuntu.data.exito) {
                const urlImagenFinal = respuestaUbuntu.data.url;
                await Publicacion.findOneAndUpdate({ Id_Publicacion: idPublicacion }, { Imagen: urlImagenFinal });
                return res.json({ exito: true, mensaje: "Imagen de publicación subida correctamente", url: urlImagenFinal });
            } else {
                throw new Error("Error en la respuesta del servidor de almacenamiento");
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({ exito: false, mensaje: "El servidor de almacenamiento no está disponible", error: error.message });
            }
            return res.status(500).json({ exito: false, mensaje: "Error interno al procesar la imagen", error: error.message });
        }
    }

    // ==========================================
    // NUEVO: SISTEMA DE LIKES (TOGGLE)
    // ==========================================
    static async darLike(req, res) {
        try {
            const { id } = req.params; 
            const idUsuario = Number(req.usuario.id); 

            const publicacion = await Publicacion.findOne({ Id_Publicacion: id });

            if (!publicacion) {
                return res.status(404).json({ exito: false, mensaje: "Publicación no encontrada" });
            }

            // 1. Buscamos la posición exacta de este usuario en el arreglo
            const indice = publicacion.Likes.findIndex(userId => Number(userId) === idUsuario);

            let mensajeRespuesta = "";

            if (indice !== -1) {
                // 2. Si el índice NO es -1, significa que SÍ lo encontró. Procedemos a borrarlo.
                // .splice() corta ese elemento exacto del arreglo
                publicacion.Likes.splice(indice, 1);
                mensajeRespuesta = "Like removido";
            } else {
                // 3. Si es -1, no lo encontró, así que lo agregamos
                publicacion.Likes.push(idUsuario);
                mensajeRespuesta = "Like agregado";
            }

            // LA MAGIA: Le gritamos a Mongoose que el arreglo cambió y DEBE guardarlo
            publicacion.markModified('Likes');
            
            await publicacion.save();

            return res.json({
                exito: true,
                mensaje: mensajeRespuesta,
                totalLikes: publicacion.Likes.length
            });

        } catch (error) {
            return res.status(500).json({ 
                exito: false, 
                mensaje: "Error al procesar el like", 
                error: error.message 
            });
        }
    }
}

module.exports = PublicacionController;