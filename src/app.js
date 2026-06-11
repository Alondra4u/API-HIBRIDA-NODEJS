const express = require('express');
const cors = require('cors');
const usuarioRoutes = require('./routes/usuario.routes');
const authRoutes = require('./routes/auth.routes');
const productoRoutes = require('./routes/producto.routes');
const reporteRoutes = require('./routes/reporte.routes');
const mensajesRoutes = require('./routes/mensajes.routes');
const publicacionRoutes = require('./routes/publicacion.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        mensaje: 'API de Brooki hibrida funcionando correctamente'
    });
});

app.use('/api/usuario', usuarioRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/mensajes', mensajesRoutes);
app.use('/api/reporte', reporteRoutes);
app.use('/api/publicacion', publicacionRoutes);

module.exports = app;