const Producto = require('../models/producto.model');

class ProductoController {

    static async obtenerProductos(req, res) {
        try {
            const productos = await Producto.obtenerTodos();
            res.json(productos);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener productos", error: error.message });
        }
    }

    static async obtenerPorId(req, res) {
        try {
            const producto = await Producto.obtenerPorId(req.params.id);
            if (!producto) return res.status(404).json({ mensaje: "Producto no encontrado" });
            res.json(producto);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener producto", error: error.message });
        }
    }

    static async obtenerPorUsuario(req, res) {
        try {
            const productos = await Producto.obtenerPorUsuario(req.params.usuarioId);
            res.json(productos);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al obtener productos por usuario", error: error.message });
        }
    }

    static async crearProducto(req, res) {
        try {
            // Forzamos a que el Id_Usuario sea el del token para evitar suplantación de identidad
            req.body.Id_Usuario = req.usuario.id;
            const nuevoProducto = await Producto.insertarProducto(req.body);

            res.status(201).json({ mensaje: "Producto creado correctamente", data: nuevoProducto });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al crear producto", error: error.message });
        }
    }

    static async actualizarProducto(req, res) {
        try {
            const productoActual = await Producto.obtenerPorId(req.params.id);
            if (!productoActual) return res.status(404).json({ mensaje: "Producto no encontrado" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(productoActual.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo el vendedor original puede editar este producto." });
            }

            const actualizado = await Producto.actualizarProducto(req.params.id, req.body);
            res.json({ mensaje: "Producto actualizado", data: actualizado });
        } catch (error) {
            res.status(500).json({ mensaje: "Error al actualizar producto", error: error.message });
        }
    }

    static async eliminarProducto(req, res) {
        try {
            const productoActual = await Producto.obtenerPorId(req.params.id);
            if (!productoActual) return res.status(404).json({ mensaje: "Producto no encontrado" });

            // 🛡️ VALIDACIÓN DE PROPIETARIO
            if (req.usuario.rol !== 'admin' && String(productoActual.Id_Usuario) !== String(req.usuario.id)) {
                return res.status(403).json({ mensaje: "Acceso denegado. Solo el vendedor original puede eliminar este producto." });
            }

            const resultado = await Producto.eliminarProducto(req.params.id);
            res.json(resultado);
        } catch (error) {
            res.status(500).json({ mensaje: "Error al eliminar producto", error: error.message });
        }
    }
}

module.exports = ProductoController;