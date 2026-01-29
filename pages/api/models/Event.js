const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  titulo: { 
    type: String, 
    required: true, 
    trim: true 
  },
  descripcion: { 
    type: String, 
    trim: true 
  },
  // Cambiado de 'lugar' a 'ubicacion' para coincidir con tu index.js y el frontend
  ubicacion: { 
    type: String, 
    trim: true 
  },
  fecha: { 
    type: Date, 
    required: true 
  },
  is_active: { 
    type: Boolean, 
    default: true 
  },
  // Campo añadido para soportar la imagen
  imagen: {
    data: Buffer,
    contentType: String
  }
}, {
  timestamps: true
});

eventSchema.set('bufferCommands', false);

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);