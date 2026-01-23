// tours/index.js
const dbConnect = require('../db');
const Tour = require('../models/Tour');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6MB por ejemplo
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG, WEBP.'));
  }
});

// Helper para usar middlewares estilo express (multer) en entorno serverless
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
};

module.exports = async (req, res) => {
  // CORS simple
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();

    // ---------------------------
    // GET /api/tours  -> listar tours activos
    // ---------------------------
    if (req.method === 'GET') {
      try {
        const tours = await Tour.find({ is_active: true })
          .sort({ fecha_disponible: 1 })
          .select('-__v');

        return res.status(200).json({
          success: true,
          count: tours.length,
          tours
        });
      } catch (err) {
        console.error('Error al obtener tours:', err);
        return res.status(500).json({ success: false, error: 'Error al obtener tours', details: err.message });
      }
    }

    // ---------------------------
    // POST /api/tours -> crear tour (multipart/form-data con campo 'imagen')
    // ---------------------------
    if (req.method === 'POST') {
      // Ejecutar multer para parsear req.file / req.body
      await runMiddleware(req, res, upload.single('imagen'));

      const { titulo, descripcion, precio, duracion, fecha_disponible, max_personas, incluye } = req.body;
      const file = req.file;

      // Validaciones básicas
      if (!titulo || !descripcion || !precio || !duracion || !fecha_disponible || !max_personas) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos obligatorios: titulo, descripcion, precio, duracion, fecha_disponible, max_personas'
        });
      }

      // parsea 'incluye' si viene como string JSON
      let incluyeArray = [];
      if (incluye) {
        try {
          incluyeArray = typeof incluye === 'string' ? JSON.parse(incluye) : incluye;
        } catch (e) {
          return res.status(400).json({ success: false, error: 'El campo "incluye" debe ser un array válido' });
        }
      }

      // parseos seguros de número y fecha
      const precioNum = Number(precio);
      const maxPersonasNum = parseInt(max_personas, 10);
      const fechaDate = new Date(fecha_disponible);
      if (isNaN(precioNum) || isNaN(maxPersonasNum) || isNaN(fechaDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Formato inválido en precio, max_personas o fecha_disponible' });
      }

      // Preparar documento
      const tourData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        duracion: duracion.trim(),
        fecha_disponible: fechaDate,
        max_personas: maxPersonasNum,
        incluye: incluyeArray || [],
        is_active: true
      };

      if (file) {
        tourData.imagenBase64 = file.buffer.toString('base64');
        tourData.imagenContentType = file.mimetype;
        // Si tu esquema usa imagen: { data: Buffer, contentType }, podrías setear tourData.imagen = { data: file.buffer, contentType: file.mimetype }
      }

      try {
        const nuevo = new Tour(tourData);
        await nuevo.save();

        return res.status(201).json({ success: true, message: 'Tour creado exitosamente', tour: nuevo });
      } catch (err) {
        console.error('Error al guardar tour:', err);
        return res.status(500).json({ success: false, error: 'Error al crear tour', details: err.message });
      }
    }

    // Método no permitido
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en /api/tours:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
