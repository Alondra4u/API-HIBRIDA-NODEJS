const { mysqlPool } = require('../config/mysql');

class Reporte {

    static async obtenerTodos() {
        // Ahora traemos también las referencias y la respuesta del admin
        const [rows] = await mysqlPool.query('SELECT * FROM Reporte ORDER BY id_Reporte DESC');
        return rows;
    }

    static async obtenerPorId(id) {
        const [rows] = await mysqlPool.query(
            'SELECT * FROM Reporte WHERE id_Reporte = ?',
            [id]
        );
        return rows[0];
    }

    static async crear(data) {
        // Agregamos Tipo_Referencia e Id_Referencia
        const { Id_Usuario, motivo, estado, Imagen, Tipo_Referencia, Id_Referencia } = data;
        
        const [result] = await mysqlPool.query(
            'INSERT INTO Reporte (Id_Usuario, motivo, estado, Imagen, Tipo_Referencia, Id_Referencia) VALUES (?,?,?,?,?,?)',
            [Id_Usuario, motivo, estado, Imagen, Tipo_Referencia, Id_Referencia]
        );
        
        const [rows] = await mysqlPool.query(
            'SELECT * FROM Reporte WHERE id_Reporte = ?',
            [result.insertId]
        );
        return rows[0];
    }

    static async actualizar(id, data) {
        // Agregamos Respuesta_Admin para que el administrador pueda contestar
        const { motivo, estado, Imagen, Respuesta_Admin } = data;
        const [result] = await mysqlPool.query(
            'UPDATE Reporte SET motivo = ?, estado = ?, Imagen = ?, Respuesta_Admin = ? WHERE id_Reporte = ?',
            [motivo, estado, Imagen, Respuesta_Admin || null, id]
        );
        return result.affectedRows > 0;
    }

    static async actualizarImagen(id, urlImagen) {
        const [result] = await mysqlPool.query(
            'UPDATE Reporte SET Imagen = ? WHERE id_Reporte = ?',
            [urlImagen, id]
        );
        return result.affectedRows > 0;
    }

    static async eliminar(id) {
        const [result] = await mysqlPool.query('DELETE FROM Reporte WHERE id_Reporte = ?', [id]);
        return result.affectedRows > 0;
    }

    static async filtrar(filtros){
        let query = "SELECT * FROM Reporte WHERE 1=1";
        let params = [];

        if (filtros.estado){
            query += " AND estado = ?";
            params.push(filtros.estado);
        }

        if (filtros.fecha_inicio && filtros.fecha_fin){
            query += " AND fecha_Reporte BETWEEN ? AND ?";
            params.push(filtros.fecha_inicio, filtros.fecha_fin);
        }

        if (filtros.Id_Usuario){
            query += " AND Id_Usuario = ?";
            params.push(filtros.Id_Usuario);
        }

        // NUEVO: Para que el admin pueda filtrar "Solo reportes de productos" o "Solo de publicaciones"
        if (filtros.Tipo_Referencia){
            query += " AND Tipo_Referencia = ?";
            params.push(filtros.Tipo_Referencia);
        }

        const [rows] = await mysqlPool.query(query, params);
        return rows;
    }

    static async estadisticas(){
        const [total] = await mysqlPool.query("SELECT COUNT(*) as total FROM Reporte");
        const [pendientes] = await mysqlPool.query("SELECT COUNT(*) as pendientes FROM Reporte WHERE estado = 'Pendiente'");
        const [resueltos] = await mysqlPool.query("SELECT COUNT(*) as resueltos FROM Reporte WHERE estado = 'Resuelto'");
        
        return {
            total: total[0].total,
            pendientes: pendientes[0].pendientes,
            resueltos: resueltos[0].resueltos
        };
    }
}

module.exports = Reporte;