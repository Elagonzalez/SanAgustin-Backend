require('dotenv').config();
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY ? 'Cargada' : 'No encontrada');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Clave secreta de Stripe


const app = express();
app.use(cors());
app.use(express.json());

// Conectar a MongoDB (usa tu URI de MongoDB Atlas o local)
mongoose.connect(process.env.MONGO_URI, {});

// Modelo de Reserva
const reservationSchema = new mongoose.Schema({
  tourId: String,
  userId: String, // Asume que tienes userId de autenticación
  date: Date,
  persons: Number,
  total: Number,
  status: { type: String, default: 'pendiente' }, // pendiente, confirmada, cancelada
  createdAt: { type: Date, default: Date.now }
});
const Reservation = mongoose.model('Reservation', reservationSchema);

// Endpoint para crear reserva y procesar pago
app.post('/api/reservations', async (req, res) => {
  const { tourId, userId, date, persons, total, paymentMethodId } = req.body;

  try {
    // Crear intención de pago en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Stripe usa centavos
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true },
    });

    // Si pago exitoso, guardar reserva
    const reservation = new Reservation({ tourId, userId, date, persons, total, status: 'confirmada' });
    await reservation.save();

    res.status(200).json({ success: true, reservationId: reservation._id });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Endpoint para obtener reservas de un usuario
app.get('/api/reservations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const reservations = await Reservation.find({ userId }).populate('tourId'); // Asume que tienes un modelo Tour si quieres detalles
    res.status(200).json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));