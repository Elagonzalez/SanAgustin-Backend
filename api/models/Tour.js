const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder los 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [0, 'El precio no puede ser negativo']
  },
  duracion: {
    type: String,
    required: [true, 'La duración es obligatoria'],
    trim: true
    // Ejemplo: "3 días", "5 horas", "2 días 1 noche"
  },
  fecha_disponible: {
    type: Date,
    required: [true, 'La fecha disponible es obligatoria']
  },
  max_personas: {
    type: Number,
    required: [true, 'El máximo de personas es obligatorio'],
    min: [1, 'Debe permitir al menos 1 persona']
  },
  incluye: {
    type: [String],
    default: []
    // Array de strings: ["Transporte", "Comida", "Guía turístico", "Entrada a museos"]
  },
  is_active: {
    type: Boolean,
    default: true
  },
  imagenBase64: {
    type: String,
    required: false
  },
  imagenContentType: {
    type: String,
    required: false
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejorar las consultas
tourSchema.index({ is_active: 1, fecha_disponible: 1 });
tourSchema.index({ precio: 1 });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;