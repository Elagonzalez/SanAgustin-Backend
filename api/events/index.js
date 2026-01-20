const dbConnect = require('../db');
const Event = require('../models/Event');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      // Primero: marcar como inactivos los eventos cuya fecha ya pasó
      const now = new Date();
      await Event.updateMany({ fecha: { $lt: now }, is_active: true }, { $set: { is_active: false } });

      // Luego obtener solo los eventos activos
      const events = await Event.find({ is_active: true }).sort({ fecha: 1 }).lean();
      return res.status(200).json({ success: true, events });
    }

    if (req.method === 'POST') {
      const { titulo, descripcion, lugar, fecha } = req.body;

      if (!titulo || !fecha) {
        return res.status(400).json({ success: false, error: 'Faltan campos requeridos: titulo o fecha' });
      }

      const fechaDate = new Date(fecha);
      const now = new Date();
      const isActive = fechaDate > now;

      const event = new Event({
        titulo,
        descripcion,
        lugar,
        fecha: fechaDate,
        is_active: isActive
      });

      await event.save();
      return res.status(201).json({ success: true, event });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en /api/events:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
