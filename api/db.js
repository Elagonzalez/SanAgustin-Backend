// db.js
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;

  try {
    await mongoose.connect(MONGODB_URI); // <-- removed useNewUrlParser/useUnifiedTopology
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    throw error;
  }
}

module.exports = dbConnect;