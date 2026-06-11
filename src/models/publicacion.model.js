const mongoose = require('mongoose');
const { Schema } = mongoose;

const publicacionSchema = new Schema({
    Id_Publicacion: { type: String, required: true, unique: true },
    Id_Producto: { type: Number, required: true },
    Id_Usuario: { type: Number, required: true }, // Asegúrate de tener esto para saber quién la creó
    Titulo: { type: String, required: true },
    Contenido: { type: String, required: true },
    Imagen: { type: String, default: null },
    fecha_Post: { type: Date, default: Date.now },
    
    // 🔥 NUEVO: SISTEMA DE LIKES
    // Guarda un arreglo con los IDs de los usuarios que le dieron like
    Likes: [{ type: Number }], 

    Mensaje: [{
        _id: false,
        ID_Mensaje: { type: String, required: true },
        Usuario: { type: Number, required: true },
        Contenido: { type: String, required: true },
        fecha_E: { type: Date, default: Date.now },
        
        Detalle: [{
            _id: false,
            ID_Mensaje_Detallado: { type: String, required: true },
            Usuario: { type: Number, required: true },
            Comentario: { type: String, required: true },
            fecha: { type: Date, default: Date.now }
        }]
    }]
}, {
    collection: 'publicacion' 
});

module.exports = mongoose.model('Publicacion', publicacionSchema);