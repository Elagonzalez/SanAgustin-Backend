const dbConnect = require('../db');
const Mural = require('../models/Mural');
const multer = require('multer');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Inicializar Firebase Admin (si aún no está hecho)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      "type": "service_account",
      "project_id": process.env.FIREBASE_PROJECT_ID,
      "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
      "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      "client_email": process.env.FIREBASE_CLIENT_EMAIL,
      "client_id": process.env.FIREBASE_CLIENT_ID,
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": process.env.FIREBASE_CLIENT_CERT_URL
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const bucket = admin.storage().bucket();

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
      const murals = await Mural.find({}).sort({ fecha: -1 }).lean();
      
      // Transformar para incluir URL de imagen
      const muralsWithUrls = murals.map(mural => ({
        ...mural,
        imagenUrl: mural.imagenUrl || null
      }));
      
      return res.status(200).json({ success: true, murals: muralsWithUrls });
    }

    if (req.method === 'POST') {
      await runMiddleware(req, res, upload.single('imagen'));

      const { titulo, descripcion, artista, ubicacion, destacado } = req.body || {};
      const file = req.file;

      if (!titulo || !descripcion || !file) {
        return res.status(400).json({ success: false, error: 'Campos obligatorios: titulo, descripcion, imagen' });
      }

      // Subir imagen a Firebase Storage
      const fileName = `murals/${uuidv4()}-${file.originalname}`;
      const fileUpload = bucket.file(fileName);

      await fileUpload.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
        },
      });

      // Hacer el archivo público y obtener URL
      await fileUpload.makePublic();
      const imagenUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      // Guardar en MongoDB con la URL
      const muralDoc = new Mural({
        titulo,
        descripcion,
        artista: artista || '',
        ubicacion: ubicacion || '',
        imagenUrl: imagenUrl, // Guardar URL en lugar de buffer
        destacado: destacado === 'true' || destacado === true
      });

      const saved = await muralDoc.save();
      return res.status(201).json({ success: true, mural: saved });
    }

    return res.status(405).json({ success: false, error: 'Método no permitido' });

  } catch (error) {
    console.error('API /api/murals error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};