const mongoose = require('mongoose');
require('dotenv').config();

async function connectMongo() {
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log('Conexion exitosa a MongoDB');
    } catch (error) {
        console.error('Error al conectar con MongoDB:');
        throw error;
    }
}

module.exports = connectMongo;

