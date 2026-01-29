const mongoose = require('mongoose');

const muralSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  artista: { type: String, trim: true },
  ubicacion: { type: String, trim: true },
  imagen: {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true }
  },
  fecha: { type: Date, default: Date.now },
  destacado: { type: Boolean, default: false }
}, {
  timestamps: true
});

muralSchema.set('bufferCommands', false);

module.exports = mongoose.models.Mural || mongoose.model('Mural', muralSchema);
