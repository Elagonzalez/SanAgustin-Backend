const dbConnect = require('./db');
const Reservation = require('./models/Reservation');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const { userId, tourId, limit } = req.query;
      let query = {};

      if (userId) query.userId = userId;
      if (tourId) query.tourId = tourId;

      let reservationsQuery = Reservation.find(query).sort({ createdAt: -1 }).lean();

      if (limit) reservationsQuery = reservationsQuery.limit(parseInt(limit));

      const reservations = await reservationsQuery.maxTimeMS(8000);
      return res.status(200).json({ success: true, reservations });
    }

    if (req.method === 'POST') {
      const { tourId, userId, date, persons, total, status } = req.body;

      const reservation = new Reservation({
        tourId,
        userId,
        date,
        persons,
        total,
        status
      });

      await reservation.save();
      return res.status(201).json({ success: true, reservation });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
