// db.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI no está definida en las variables de entorno');
}

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000
};

// Evita que mongoose bufferice comandos indefinidamente
mongoose.set('bufferCommands', false);

// Reusar la conexión en entornos serverless (Vercel, Netlify)
let cached = global._mongo;
if (!cached) cached = global._mongo = { conn: null, promise: null };

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI, mongooseOptions)
      .then((mongooseInstance) => {
        cached.conn = mongooseInstance;
        console.log('MongoDB conectado');
        return cached.conn;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('Error conectando a MongoDB:', err);
        throw err;
      });
  }
  return cached.promise;
}

module.exports = dbConnect;