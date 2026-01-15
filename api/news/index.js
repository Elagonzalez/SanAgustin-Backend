const dbConnect = require('../db');
const News = require('../models/News');
const multer = require('multer');

// Configuración de multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Función auxiliar para convertir multer a una Promesa
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    // --- MANEJO DE GET ---
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

    // --- MANEJO DE POST ---
    if (req.method === 'POST') {
      // ESPERAMOS a que multer procese la imagen
      await runMiddleware(req, res, upload.single('imagen'));

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
        // Corrección: req.body en multipart envía strings, "true" !== true
        destacado: destacado === 'true' || destacado === true 
      });

      const saved = await newsDoc.save();
      return res.status(201).json({ success: true, news: saved });
    }

    // Si no es GET ni POST
    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('API /api/news error:', error);
    // Evitamos enviar respuesta si ya se envió una (por si acaso)
    if (!res.writableEnded) {
      const isMongoError = /Mongo|ECONNREFUSED|connect timed out/i.test(error.message || '');
      return res.status(isMongoError ? 503 : 500).json({ success: false, error: error.message });
    }
  }
};