// db.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGO_URI); // <-- removed useNewUrlParser/useUnifiedTopology
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

module.exports = dbConnect;