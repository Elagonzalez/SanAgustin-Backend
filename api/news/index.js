const dbConnect = require('../db');
const News = require('../models/news');

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
      const { destacado, categoria, limit } = req.query;
      let query = {};
      
      if (destacado === 'true') {
        query.destacado = true;
      }
      
      if (categoria) {
        query.categoria = categoria;
      }
      
      let newsQuery = News.find(query).sort({ fecha: -1 }).lean();
      
      if (limit) {
        newsQuery = newsQuery.limit(parseInt(limit));
      }
      
      const news = await newsQuery.maxTimeMS(8000);
      return res.status(200).json({ success: true, news });
    }

    if (req.method === 'POST') {
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
      return res.status(201).json({ success: true, news });
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};