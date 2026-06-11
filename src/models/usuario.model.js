const { mysqlPool } = require('../config/mysql');

class Usuario {
    static async obtenerTodos() {
        const [rows] = await mysqlPool.query('SELECT Id_Usuario, nombre_Usuario, nombre_Completo, Correo, Rol, fecha_Registro, Foto_Perfil FROM Usuario ORDER BY Id_Usuario ASC');
        return rows;
    }

    static async obtenerPorId(id) {
        const [rows] = await mysqlPool.query('SELECT Id_Usuario, nombre_Usuario, nombre_Completo, Correo, Rol, fecha_Registro, Foto_Perfil FROM Usuario WHERE Id_Usuario = ?', [id]);
        return rows[0];
    }

    static async buscarPorCorreo(correo) {
        const [rows] = await mysqlPool.query('SELECT * FROM Usuario WHERE Correo = ?', [correo]);
        return rows[0];
    }

    static async crear(data) {
        const { nombre_Usuario, nombre_Completo, Correo, Contrasena, Rol } = data;

        const [result] = await mysqlPool.query(
            'INSERT INTO Usuario(nombre_Usuario, nombre_Completo, Correo, Contrasena, Rol) VALUES (?, ?, ?, ?, ?)', 
            [nombre_Usuario, nombre_Completo, Correo, Contrasena, Rol]
        );

        return { Id_Usuario: result.insertId, nombre_Usuario, Correo, Rol };
    }

   static async actualizar(id, data) {
        const { nombre_Usuario, nombre_Completo, Rol, Contrasena } = data;
        
        if (Contrasena) {
            // NUEVO: Al poner una contraseña propia, anulamos la expiración temporal (expiracion_temp = NULL)
            await mysqlPool.query(
                'UPDATE Usuario SET nombre_Usuario = ?, nombre_Completo = ?, Rol = ?, Contrasena = ?, expiracion_temp = NULL WHERE Id_Usuario = ?',
                [nombre_Usuario, nombre_Completo, Rol, Contrasena, id]
            );
        } else {
            await mysqlPool.query(
                'UPDATE Usuario SET nombre_Usuario = ?, nombre_Completo = ?, Rol = ? WHERE Id_Usuario = ?',
                [nombre_Usuario, nombre_Completo, Rol, id]
            );
        }
        return { id, ...data };
    }

    static async actualizarFoto(id, urlFoto) {
        await mysqlPool.query(
            'UPDATE Usuario SET Foto_Perfil = ? WHERE Id_Usuario = ?',
            [urlFoto, id]
        );
        return { Id_Usuario: id, Foto_Perfil: urlFoto };
    }

    static async eliminar(id) {
        await mysqlPool.query('DELETE FROM Usuario WHERE Id_Usuario = ?', [id]);
        return { mensaje: "Usuario eliminado" };
    }

    static async actualizarContrasena(correo, nuevaContrasenaEncriptada) {
        const [result] = await mysqlPool.query(
            'UPDATE Usuario SET Contrasena = ?, expiracion_temp = DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE Correo = ?',
            [nuevaContrasenaEncriptada, correo]
        );
        return result.affectedRows > 0;
    }
}


module.exports = Usuario;