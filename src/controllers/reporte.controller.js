const Reporte = require('../models/reporte.model');
const axios = require('axios');
const FormData = require('form-data');

class ReporteController {

    static async obtenerReportes(req, res) {
        try {
            const reportes = await Reporte.obtenerTodos();
            res.json(reportes);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener reportes", error: error.message });
        }
    }

    static async obtenerReporte(req, res) {
        try {
            const { id } = req.params;
            const reporte = await Reporte.obtenerPorId(id);
            if (!reporte) return res.status(404).json({ mensaje: "Reporte no encontrado" });
            res.json(reporte);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener reporte", error: error.message });
        }
    }

    static async crearReporte(req, res) {
        try {
            const { motivo, Tipo_Referencia, Id_Referencia } = req.body;

            // 🛡️ VALIDACIÓN: No permitimos crear reportes fantasma
            if (!Tipo_Referencia || !Id_Referencia) {
                return res.status(400).json({ 
                    mensaje: "Faltan datos obligatorios: Debes especificar el 'Tipo_Referencia' (ej: Producto, Publicacion) y el 'Id_Referencia'." 
                });
            }

            // Asignamos el creador directamente del token
            req.body.Id_Usuario = req.usuario.id;
            
            // Si no mandan estado, por defecto es Pendiente
            req.body.estado = req.body.estado || 'Pendiente';

            const nuevoReporte = await Reporte.crear(req.body);
            
            res.status(201).json({ 
                mensaje: "Reporte creado correctamente", 
                data: nuevoReporte 
            });
        } catch (error) {
            res.status(500).json({ 
                mensaje: "Error al crear el reporte", 
                error: error.message 
            });
        }
    }

    static async actualizarReporte(req, res) {
        try {
            const { id } = req.params;

            // 1. Buscamos el reporte original en la base de datos para no perder información
            const reporteOriginal = await Reporte.obtenerPorId(id);
            if (!reporteOriginal) return res.status(404).json({ mensaje: "Reporte no encontrado" });

            // 2. Mezclamos: Si el frontend manda un dato nuevo lo usamos, si no, conservamos el viejo
            const datosParaActualizar = {
                motivo: req.body.motivo !== undefined ? req.body.motivo : reporteOriginal.motivo,
                estado: req.body.estado !== undefined ? req.body.estado : reporteOriginal.estado,
                Imagen: req.body.Imagen !== undefined ? req.body.Imagen : reporteOriginal.Imagen,
                Respuesta_Admin: req.body.Respuesta_Admin !== undefined ? req.body.Respuesta_Admin : reporteOriginal.Respuesta_Admin
            };

            // 3. Ahora sí, mandamos el paquete completo y seguro a MySQL
            const actualizado = await Reporte.actualizar(id, datosParaActualizar);
            if (!actualizado) return res.status(400).json({ mensaje: "No se pudo actualizar el reporte" });
            
            const reporteActualizado = await Reporte.obtenerPorId(id);
            res.json({ mensaje: "Reporte actualizado correctamente", data: reporteActualizado });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar reporte", error: error.message });
        }
    }

    static async eliminarReporte(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await Reporte.eliminar(id);
            if (!eliminado) return res.status(404).json({ mensaje: "Reporte no encontrado" });
            res.json({ mensaje: "Reporte eliminado correctamente" });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar reporte", error: error.message });
        }
    }

    static async subirImagenReporte(req, res) {
        try {
            const idReporte = req.params.id;
            if (!req.file) return res.status(400).json({ mensaje: "No se proporcionó ninguna imagen" });

            const reporteExiste = await Reporte.obtenerPorId(idReporte);
            if (!reporteExiste) return res.status(404).json({ mensaje: "Reporte no encontrado" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(reporteExiste.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo el creador del reporte puede subir evidencia." });
            }

            const form = new FormData();
            form.append('tipo', 'reporte');
            form.append('id_referencia', idReporte);
            form.append('foto', req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

            const URL_STORAGE = 'https://vegetarian-suitable-sequences-semi.trycloudflare.com/api/subir';
            const respuestaUbuntu = await axios.post(URL_STORAGE, form, {
                headers: { ...form.getHeaders() },
                maxContentLength: Infinity, maxBodyLength: Infinity
            });

            if (respuestaUbuntu.data.exito) {
                const urlImagenFinal = respuestaUbuntu.data.url;
                await Reporte.actualizarImagen(idReporte, urlImagenFinal);
                return res.json({ mensaje: "Evidencia de reporte almacenada correctamente", url: urlImagenFinal });
            } else {
                throw new Error("El servidor remoto rechazó la carga de la imagen");
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                return res.status(503).json({ mensaje: "El servidor de almacenamiento en casa no está disponible.", error: error.message });
            }
            res.status(500).json({ mensaje: "Error crítico al procesar la imagen del reporte", error: error.message });
        }
    }

    static async obtenerEstadisticas(req, res){
        try{
            const stats = await Reporte.estadisticas();
            res.json(stats);
        } catch(error){
            res.status(500).json({ mensaje: "error al obtener estadísticas", error: error.message });
        }
    }

    static async filtrar(req, res){
        try{
            const resultados = await Reporte.filtrar(req.body);
            res.json(resultados);
        } catch(error){
            res.status(500).json({ mensaje: "error al filtrar reportes", error: error.message });
        }
    }
}

module.exports = ReporteController;