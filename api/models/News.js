const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  contenido: {
    type: String,
    required: true
  },
  imagenUrl: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  categoria: {
    type: String,
    default: 'General'
  },
  destacado: {
    type: Boolean,
    default: false
  }
}, {
  bufferCommands: false
});

module.exports = mongoose.models.News || mongoose.model('News', newsSchema);