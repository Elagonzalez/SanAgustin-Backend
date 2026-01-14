const dbConnect = require('../db');
const News = require('../models/News');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    const { id } = req.query;
    const news = await News.findById(id).lean();
    
    if (!news) {
      return res.status(404).json({ success: false, error: 'Noticia no encontrada' });
    }
    
    return res.status(200).json({ success: true, news });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};