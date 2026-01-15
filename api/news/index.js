const dbConnect = require('../db');
const News = require('../models/News');
const multer = require('multer');

// Configuración de multer (almacena en memoria)
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    if (req.method === 'GET') {
      const { destacado, categoria, limit } = req.query;
      let query = {};

      if (destacado === 'true') query.destacado = true;
      if (categoria) query.categoria = categoria;

      let newsQuery = News.find(query).sort({ fecha: -1 }).lean();
      if (limit) newsQuery = newsQuery.limit(Math.max(1, parseInt(limit, 10) || 0));

      const news = await newsQuery.maxTimeMS(8000);
      return res.status(200).json({ success: true, news });
    }

    if (req.method === 'POST') {
      // Usamos multer para procesar la imagen
      upload.single('imagen')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ success: false, error: 'Error subiendo la imagen' });
        }

        const { titulo, descripcion, contenido, categoria, destacado } = req.body || {};
        const file = req.file;

        if (!titulo || !descripcion || !contenido || !file) {
          return res.status(400).json({
            success: false,
            error: 'Campos obligatorios: titulo, descripcion, contenido, imagen'
          });
        }

        const newsDoc = new News({
          titulo,
          descripcion,
          contenido,
          imagen: {
            data: file.buffer,
            contentType: file.mimetype
          },
          categoria: categoria || 'General',
          destacado: !!destacado
        });

        const saved = await newsDoc.save();
        return res.status(201).json({ success: true, news: saved });
      });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('API /api/news error:', error);
    const isMongoError = /Mongo|ECONNREFUSED|connect timed out/i.test(error.message || '');
    return res.status(isMongoError ? 503 : 500).json({ success: false, error: error.message });
  }
};