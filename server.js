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

// Modelo de Reserva
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

// 🔥 NUEVO: Modelo de Noticia
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
});

const News = mongoose.model('News', newsSchema);

// 🔥 NUEVO: Crear noticia (para pruebas o admin)
app.post('/api/news', async (req, res) => {
  try {
    const { titulo, descripcion, contenido, imagenUrl, categoria, destacado } = req.body;
    
    const news = new News({
      titulo,
      descripcion,
      contenido,
      imagenUrl,
      categoria,
      destacado
    });

    await news.save();
    res.status(201).json({ success: true, news });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// 🔥 NUEVO: Obtener todas las noticias
app.get('/api/news', async (req, res) => {
  try {
    const { destacado, categoria, limit } = req.query;
    let query = {};
    
    if (destacado === 'true') {
      query.destacado = true;
    }
    
    if (categoria) {
      query.categoria = categoria;
    }
    
    let newsQuery = News.find(query).sort({ fecha: -1 });
    
    if (limit) {
      newsQuery = newsQuery.limit(parseInt(limit));
    }
    
    const news = await newsQuery;
    res.json({ success: true, news });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 🔥 NUEVO: Obtener noticia por ID
app.get('/api/news/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
    }
    res.json({ success: true, news });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rutas existentes para reservas...
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
      return_url: 'https://tu-dominio.com/payment-complete'
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

app.get('/api/reservations/:userId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.params.userId });
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));