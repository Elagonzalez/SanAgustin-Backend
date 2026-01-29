const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  referencia: {
    type: String,
    required: [true, 'La referencia es obligatoria'],
    unique: true,
    trim: true,
    maxlength: [50, 'La referencia no puede exceder los 50 caracteres']
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'El ID del tour es obligatorio']
  },
  reservationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    required: [true, 'El ID de la reservación es obligatorio']
  },
  userId: {
    type: String,
    required: [true, 'El ID del usuario es obligatorio']
  },
  monto: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [0, 'El monto no puede ser negativo']
  },
  fecha_pago: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pendiente de verificación', 'verificado', 'rechazado'],
    default: 'pendiente de verificación'
  },
  metodo_pago: {
    type: String,
    enum: ['transferencia', 'tarjeta', 'efectivo', 'otro'],
    required: [true, 'El método de pago es obligatorio']
  },
  comprobante: {
    type: String, // URL o base64 del comprobante
    required: false
  },
  notas: {
    type: String,
    maxlength: [500, 'Las notas no pueden exceder los 500 caracteres']
  }
}, {
  timestamps: true // Agrega createdAt y updatedAt automáticamente
});

// Índices para mejorar las consultas
pagoSchema.index({ referencia: 1 });
pagoSchema.index({ userId: 1 });
pagoSchema.index({ tourId: 1 });
pagoSchema.index({ status: 1 });
pagoSchema.index({ fecha_pago: 1 });

// Método estático para generar referencia única
pagoSchema.statics.generarReferencia = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `PAY-${timestamp}-${random}`.toUpperCase();
};

// Pre-save para asegurar que la referencia sea única
pagoSchema.pre('save', async function(next) {
  if (!this.referencia) {
    let referenciaUnica = false;
    let intentos = 0;
    const maxIntentos = 10;
    
    while (!referenciaUnica && intentos < maxIntentos) {
      const nuevaReferencia = this.constructor.generarReferencia();
      const existe = await this.constructor.findOne({ referencia: nuevaReferencia });
      
      if (!existe) {
        this.referencia = nuevaReferencia;
        referenciaUnica = true;
      }
      intentos++;
    }
    
    if (!referenciaUnica) {
      return next(new Error('No se pudo generar una referencia única después de varios intentos'));
    }
  }
  next();
});

const Pago = mongoose.models.Pago || mongoose.model('Pago', pagoSchema);

module.exports = Pago;
