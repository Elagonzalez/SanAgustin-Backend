require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB conectado'))
  .catch(err => console.error('Mongo error:', err));

// Modelo
const reservationSchema = new mongoose.Schema({
  tourId: String,
  userId: String,
  date: Date,
  persons: Number,
  total: Number,
  status: { type: String, default: 'pendiente' },
  createdAt: { type: Date, default: Date.now }
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Crear reserva
app.post('/api/reservations', async (req, res) => {
  const { tourId, userId, date, persons, totalPrice, paymentMethodId } = req.body;

  try {
    if (!totalPrice) {
      return res.status(400).json({ success: false, error: "Falta el campo 'totalPrice'" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100),
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
    });

    const reservation = new Reservation({
      tourId,
      userId,
      date,
      persons,
      totalPrice,
      status: 'confirmada'
    });

    await reservation.save();

    res.json({ success: true, reservationId: reservation._id });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Obtener reservas
app.get('/api/reservations/:userId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.userId });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔥 PUERTO CORRECTO PARA RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));