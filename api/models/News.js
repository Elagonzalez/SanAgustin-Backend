// models/News.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  contenido: { type: String, required: true, trim: true },
  imagen: { 
    data: Buffer, 
    contentType: String, 
    required: true 
  },
  fecha: { type: Date, default: Date.now },
  categoria: { type: String, default: 'General', trim: true },
  destacado: { type: Boolean, default: false }
}, {
  timestamps: true
});

newsSchema.set('bufferCommands', false);

module.exports = mongoose.models.News || mongoose.model('News', newsSchema);