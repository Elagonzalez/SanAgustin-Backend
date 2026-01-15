const dbConnect = require('../db');
const Mural = require('../models/Mural');
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
      const { limit, destacado } = req.query;
      let query = {};
      if (destacado === 'true') query.destacado = true;

      let muralsQuery = Mural.find(query).sort({ fecha: -1 }).lean();
      if (limit) muralsQuery = muralsQuery.limit(Math.max(1, parseInt(limit, 10) || 0));

      const murals = await muralsQuery.maxTimeMS(8000);
      return res.status(200).json({ success: true, murals });
    }

    if (req.method === 'POST') {
      await runMiddleware(req, res, upload.single('imagen'));

      const { titulo, descripcion, artista, ubicacion, destacado } = req.body || {};
      const file = req.file;

      if (!titulo || !descripcion || !file) {
        return res.status(400).json({ success: false, error: 'Campos obligatorios: titulo, descripcion, imagen' });
      }

      const muralDoc = new Mural({
        titulo,
        descripcion,
        artista: artista || '',
        ubicacion: ubicacion || '',
        imagen: {
          data: file.buffer,
          contentType: file.mimetype
        },
        destacado: destacado === 'true' || destacado === true
      });

      const saved = await muralDoc.save();
      return res.status(201).json({ success: true, mural: saved });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('API /api/murals error:', error);
    if (!res.writableEnded) {
      const isMongoError = /Mongo|ECONNREFUSED|connect timed out/i.test(error.message || '');
      return res.status(isMongoError ? 503 : 500).json({ success: false, error: error.message });
    }
  }
};
