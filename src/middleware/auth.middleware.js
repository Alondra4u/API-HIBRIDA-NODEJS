const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    try{
        const authHeader = req.header('Authorization');

        if (!authHeader){
            return res.status(401).json({
                mensaje: 'Token no propocionado'
            });
        }

        if (!authHeader.startsWith('Bearer ')){
            return res.status(401).json({
                mensaje: 'Formato de token invalido'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    }
    catch(error) {
        return res.status(401).json({
            mensaje: 'Token invalido o expirado',
            error: error.message
        });
    }
}

function verificarRol(...rolesPermitidos){
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({
                mensaje: 'Usuario no autenticado'
            });
        }
        
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(401).json({
                mensaje: 'No tienes permiso para acceder'
            });
        }

        next();
    };
}

module.exports = {
    verificarToken,
    verificarRol
}