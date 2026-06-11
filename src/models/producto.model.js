const { mysqlPool } = require('../config/mysql');

class Producto {
    // Obtener todos
    static async obtenerTodos() {
        const [rows] = await mysqlPool.query(
            `SELECT Id_Producto, Id_Usuario, nombre_Producto, Descripcion, Precio, Disponible, fecha_Publicacion 
             FROM Producto 
             ORDER BY Id_Producto ASC`
        );
        return rows;
    }

    // Obtener por ID
    static async obtenerPorId(id) {
        const [rows] = await mysqlPool.query(
            `SELECT * FROM Producto WHERE Id_Producto = ?`,
            [id]
        );
        return rows[0];
    }

    // Obtener por usuario
static async obtenerPorUsuario(usuarioId) {
    const [rows] = await mysqlPool.query(
        `SELECT * FROM Producto WHERE Id_Usuario = ?`,
        [usuarioId]
    );
    return rows;
}

    // Crear producto
    static async insertarProducto(data) {
        const {
            Id_Usuario,
            nombre_Producto,
            Descripcion,
            Precio,
            Disponible,
            fecha_Publicacion
        } = data;

        const [result] = await mysqlPool.query(
            `INSERT INTO Producto (
                Id_Usuario,
                nombre_Producto,
                Descripcion,
                Precio,
                Disponible,
                fecha_Publicacion
            ) VALUES (?, ?, ?, ?, ?, ?)`,
            [
                Id_Usuario,
                nombre_Producto,
                Descripcion,
                Precio,
                Disponible,
                fecha_Publicacion
            ]
        );

        return {
            Id_Producto: result.insertId,
            ...data
        };
    }

    // Actualizar producto
    static async actualizarProducto(id, data) {
        const {
            Id_Usuario,
            nombre_Producto,
            Descripcion,
            Precio,
            Disponible,
            fecha_Publicacion
        } = data;

        await mysqlPool.query(
            `UPDATE Producto SET
                Id_Usuario = ?,
                nombre_Producto = ?,
                Descripcion = ?,
                Precio = ?,
                Disponible = ?,
                fecha_Publicacion = ?
             WHERE Id_Producto = ?`,
            [
                Id_Usuario,
                nombre_Producto,
                Descripcion,
                Precio,
                Disponible,
                fecha_Publicacion,
                id
            ]
        );

        return { id, ...data };
    }

    // Eliminar producto
    static async eliminarProducto(id) {
        await mysqlPool.query(
            `DELETE FROM Producto WHERE Id_Producto = ?`,
            [id]
        );

        return { mensaje: "Producto eliminado" };
    }
}

module.exports = Producto;