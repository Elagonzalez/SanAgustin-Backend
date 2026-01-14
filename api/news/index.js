const dbConnect = require('../db');
const News = require('../models/News');

function isValidUrl(s) {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

module.exports = async (req, res) => {
  // CORS básico
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

      // Protegemos contra consultas que tarden demasiado
      const news = await newsQuery.maxTimeMS(8000);
      return res.status(200).json({ success: true, news });
    }

    if (req.method === 'POST') {
      // Asegúrate que el cliente envía JSON y Content-Type: application/json
      const { titulo, descripcion, contenido, imagenUrl, categoria, destacado } = req.body || {};

      // Validaciones básicas
      if (!titulo || !descripcion || !contenido || !imagenUrl) {
        return res.status(400).json({
          success: false,
          error: 'Campos obligatorios: titulo, descripcion, contenido, imagenUrl'
        });
      }

      if (!isValidUrl(imagenUrl)) {
        return res.status(400).json({ success: false, error: 'imagenUrl debe ser una URL válida' });
      }

      const newsDoc = new News({
        titulo,
        descripcion,
        contenido,
        imagenUrl,
        categoria: categoria || 'General',
        destacado: !!destacado
      });

      const saved = await newsDoc.save();
      return res.status(201).json({ success: true, news: saved });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('API /api/news error:', error);
    // Si es un error de conexión a MongoDB, devolver 503 para distinguir
    const isMongoError = /Mongo|ECONNREFUSED|connect timed out/i.test(error.message || '');
    return res.status(isMongoError ? 503 : 500).json({ success: false, error: error.message });
  }
};