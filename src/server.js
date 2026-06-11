require('dotenv').config();
const app = require('./app');
const connectMongo = require('./config/mongo');
const { connectMySQL } = require('./config/mysql');
const PORT = process.env.PORT || 3000;
async function iniciarServidor() {
    try{
        await connectMongo();
        await connectMySQL();
        app.listen(PORT, () => {
            console.log("Servidor ejecutandose en puerto " + PORT);
        });
    } catch(error) {
        console.log("Error al iniciar servidor");
        console.log(error);
    }
}

iniciarServidor();