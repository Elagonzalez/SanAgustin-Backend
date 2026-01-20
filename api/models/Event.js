const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  lugar: { type: String, trim: true },
  fecha: { type: Date, required: true },
  is_active: { type: Boolean, default: true }
}, {
  timestamps: true
});

eventSchema.set('bufferCommands', false);

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
