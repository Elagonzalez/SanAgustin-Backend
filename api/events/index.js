const dbConnect = require('../db');
const Event = require('../models/Event');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage });

const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const now = new Date();
      await Event.updateMany(
        { fecha: { $lt: now }, is_active: true },
        { $set: { is_active: false } }
      );

      const events = await Event.find({ is_active: true })
        .sort({ fecha: 1 })
        .lean();

      // Opcional: si quieres enviar imagen como base64 (igual que murals)
      const serialized = events.map(e => {
        let imagenBase64 = null;
        let imagenContentType = null;
        if (e.imagen && e.imagen.data) {
          imagenBase64 = Buffer.from(e.imagen.data).toString('base64');
          imagenContentType = e.imagen.contentType;
        }
        return {
          ...e,
          imagenBase64,
          imagenContentType,
          imagen: undefined,
        };
      });

      return res.status(200).json({ success: true, events: serialized });
    }

    if (req.method === 'POST') {
      // ← Aquí está el cambio importante
      await runMiddleware(req, res, upload.single('imagen'));

      const { titulo, descripcion, ubicacion, fecha_evento } = req.body;
      const file = req.file;

      if (!titulo || !fecha_evento) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: titulo y fecha_evento'
        });
      }

      const fechaDate = new Date(fecha_evento);
      if (isNaN(fechaDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Formato de fecha inválido'
        });
      }

      const now = new Date();
      const isActive = fechaDate > now;

      const eventData = {
        titulo: titulo.trim(),
        descripcion: (descripcion || '').trim(),
        ubicacion: (ubicacion || '').trim(),
        fecha: fechaDate,
        is_active: isActive,
      };

      if (file) {
        eventData.imagen = {
          data: file.buffer,
          contentType: file.mimetype,
        };
      }

      const event = new Event(eventData);
      await event.save();

      return res.status(201).json({ success: true, event });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('Error en /api/events:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};