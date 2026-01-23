const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tour = require('../models/Tour'); // Ajusta la ruta según tu estructura

// Configuración de Multer para manejo de imágenes en memoria
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPEG, PNG y WEBP.'));
    }
  }
});

// =============================================================================
// 1. CREAR UN NUEVO TOUR
// =============================================================================
router.post('/tours', upload.single('imagen'), async (req, res) => {
  try {
    const { titulo, descripcion, precio, duracion, fecha_disponible, max_personas, incluye } = req.body;

    // Validaciones básicas
    if (!titulo || !descripcion || !precio || !duracion || !fecha_disponible || !max_personas) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos obligatorios: titulo, descripcion, precio, duracion, fecha_disponible, max_personas'
      });
    }

    // Procesar el campo 'incluye' (puede venir como string JSON o array)
    let incluyeArray = [];
    if (incluye) {
      try {
        incluyeArray = typeof incluye === 'string' ? JSON.parse(incluye) : incluye;
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'El campo "incluye" debe ser un array válido'
        });
      }
    }

    // Procesar imagen
    let imagenBase64 = null;
    let imagenContentType = null;

    if (req.file) {
      imagenBase64 = req.file.buffer.toString('base64');
      imagenContentType = req.file.mimetype;
    }

    // Crear el tour
    const nuevoTour = new Tour({
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      precio: parseFloat(precio),
      duracion: duracion.trim(),
      fecha_disponible: new Date(fecha_disponible),
      max_personas: parseInt(max_personas),
      incluye: incluyeArray,
      is_active: true,
      imagenBase64,
      imagenContentType
    });

    await nuevoTour.save();

    res.status(201).json({
      success: true,
      message: 'Tour creado exitosamente',
      tour: nuevoTour
    });

  } catch (error) {
    console.error('Error al crear tour:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear el tour',
      details: error.message
    });
  }
});

// =============================================================================
// 2. OBTENER TODOS LOS TOURS ACTIVOS
// =============================================================================
router.get('/tours', async (req, res) => {
  try {
    const tours = await Tour.find({ is_active: true })
      .sort({ fecha_disponible: 1 }) // Ordenar por fecha más cercana
      .select('-__v'); // Excluir el campo __v de mongoose

    res.status(200).json({
      success: true,
      count: tours.length,
      tours: tours
    });

  } catch (error) {
    console.error('Error al obtener tours:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener los tours',
      details: error.message
    });
  }
});

// =============================================================================
// 3. OBTENER DETALLES DE UN TOUR ESPECÍFICO
// =============================================================================
router.get('/tours/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validar formato de ID de MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'ID de tour inválido'
      });
    }

    const tour = await Tour.findById(id).select('-__v');

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      tour: tour
    });

  } catch (error) {
    console.error('Error al obtener detalles del tour:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el tour',
      details: error.message
    });
  }
});

// =============================================================================
// 4. ACTUALIZAR UN TOUR (BONUS)
// =============================================================================
router.put('/tours/:id', upload.single('imagen'), async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, precio, duracion, fecha_disponible, max_personas, incluye, is_active } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'ID de tour inválido'
      });
    }

    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour no encontrado'
      });
    }

    // Actualizar campos si están presentes
    if (titulo) tour.titulo = titulo.trim();
    if (descripcion) tour.descripcion = descripcion.trim();
    if (precio) tour.precio = parseFloat(precio);
    if (duracion) tour.duracion = duracion.trim();
    if (fecha_disponible) tour.fecha_disponible = new Date(fecha_disponible);
    if (max_personas) tour.max_personas = parseInt(max_personas);
    if (is_active !== undefined) tour.is_active = is_active === 'true' || is_active === true;

    // Actualizar incluye
    if (incluye) {
      try {
        tour.incluye = typeof incluye === 'string' ? JSON.parse(incluye) : incluye;
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: 'El campo "incluye" debe ser un array válido'
        });
      }
    }

    // Actualizar imagen si se proporciona
    if (req.file) {
      tour.imagenBase64 = req.file.buffer.toString('base64');
      tour.imagenContentType = req.file.mimetype;
    }

    await tour.save();

    res.status(200).json({
      success: true,
      message: 'Tour actualizado exitosamente',
      tour: tour
    });

  } catch (error) {
    console.error('Error al actualizar tour:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el tour',
      details: error.message
    });
  }
});

// =============================================================================
// 5. DESACTIVAR UN TOUR (SOFT DELETE)
// =============================================================================
router.delete('/tours/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'ID de tour inválido'
      });
    }

    const tour = await Tour.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tour desactivado exitosamente',
      tour: tour
    });

  } catch (error) {
    console.error('Error al desactivar tour:', error);
    res.status(500).json({
      success: false,
      error: 'Error al desactivar el tour',
      details: error.message
    });
  }
});

module.exports = router;