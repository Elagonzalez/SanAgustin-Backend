const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  tourId: String,
  userId: String,
  date: Date,
  persons: Number,
  total: Number,
  status: { type: String, default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
}, {
  bufferCommands: false
});

module.exports = mongoose.models.Reservation || mongoose.model('Reservation', reservationSchema);