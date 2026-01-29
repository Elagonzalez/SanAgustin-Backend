// pagos/index.js
const dbConnect = require('../db');
const Pago = require('../models/Payment');
const Reservation = require('../models/Reservation');
const Tour = require('../models/Tour');

module.exports = async (req, res) => {
  // CORS simple
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await dbConnect();
  } catch (error) {
    console.error('Error conectando a MongoDB:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error de conexión a la base de datos' 
    });
  }

  const { method } = req;

  switch (method) {
    case 'POST':
      return handleCreatePago(req, res);
    case 'GET':
      return handleGetPagos(req, res);
    case 'PUT':
      return handleUpdatePago(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ 
        success: false, 
        message: `Método ${method} no permitido` 
      });
  }
};

// Crear un nuevo pago
async function handleCreatePago(req, res) {
  try {
    const {
      tourId,
      userId,
      monto,
      metodo_pago,
      selectedDate,
      persons,
      comprobante,
      notas
    } = req.body;

    // Validaciones básicas
    if (!tourId || !userId || !monto || !metodo_pago || !selectedDate || !persons) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos obligatorios: tourId, userId, monto, metodo_pago, selectedDate, persons'
      });
    }

    // Verificar que el tour existe
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({
        success: false,
        message: 'Tour no encontrado'
      });
    }

    // Calcular el total esperado
    const totalEsperado = tour.precio * persons;
    
    // Validar que el monto coincida con el cálculo
    if (Math.abs(monto - totalEsperado) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `El monto no coincide con el cálculo esperado. Precio: $${tour.precio} × ${persons} personas = $${totalEsperado}`
      });
    }

    // Crear la reservación primero
    const reservation = new Reservation({
      tourId: tourId,
      userId: userId,
      date: new Date(selectedDate),
      persons: persons,
      total: totalEsperado,
      status: 'pendiente'
    });

    await reservation.save();

    // Crear el pago
    const pago = new Pago({
      tourId: tourId,
      reservationId: reservation._id,
      userId: userId,
      monto: totalEsperado,
      metodo_pago: metodo_pago,
      comprobante: comprobante,
      notas: notas,
      status: 'pendiente de verificación'
    });

    await pago.save();

    // Populate para devolver información completa
    await pago.populate('tourId', 'titulo precio');
    await pago.populate('reservationId');

    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente',
      data: {
        pago: pago,
        reservation: reservation
      }
    });

  } catch (error) {
    console.error('Error creating pago:', error);
    
    if (error.code === 11000) {
      // Error de duplicidad (referencia única)
      return res.status(400).json({
        success: false,
        message: 'La referencia de pago ya existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar el pago',
      error: error.message
    });
  }
}

// Obtener pagos (con filtros opcionales)
async function handleGetPagos(req, res) {
  try {
    const { 
      userId, 
      tourId, 
      status, 
      page = 1, 
      limit = 10,
      startDate,
      endDate 
    } = req.query;

    // Construir filtro
    const filtro = {};
    
    if (userId) filtro.userId = userId;
    if (tourId) filtro.tourId = tourId;
    if (status) filtro.status = status;
    
    // Filtro por rango de fechas
    if (startDate || endDate) {
      filtro.fecha_pago = {};
      if (startDate) filtro.fecha_pago.$gte = new Date(startDate);
      if (endDate) filtro.fecha_pago.$lte = new Date(endDate);
    }

    // Calcular skip para paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Ejecutar consulta con populate
    const pagos = await Pago.find(filtro)
      .populate('tourId', 'titulo precio')
      .populate('reservationId')
      .sort({ fecha_pago: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Contar total para paginación
    const total = await Pago.countDocuments(filtro);

    res.status(200).json({
      success: true,
      data: {
        pagos: pagos,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error getting pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los pagos',
      error: error.message
    });
  }
}

// Actualizar estado de un pago
async function handleUpdatePago(req, res) {
  try {
    const { id } = req.query;
    const { status, notas } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el ID del pago'
      });
    }

    if (!status || !['pendiente de verificación', 'verificado', 'rechazado'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status inválido. Debe ser: pendiente de verificación, verificado o rechazado'
      });
    }

    // Buscar y actualizar el pago
    const pago = await Pago.findById(id).populate('reservationId');
    
    if (!pago) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    // Actualizar el pago
    pago.status = status;
    if (notas) pago.notas = notas;
    await pago.save();

    // Actualizar el estado de la reservación correspondiente
    if (pago.reservationId) {
      const reservationStatus = status === 'verificado' ? 'confirmada' : 
                               status === 'rechazado' ? 'cancelada' : 'pendiente';
      
      await Reservation.findByIdAndUpdate(
        pago.reservationId._id,
        { status: reservationStatus }
      );
    }

    await pago.populate('tourId', 'titulo precio');
    await pago.populate('reservationId');

    res.status(200).json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: pago
    });

  } catch (error) {
    console.error('Error updating pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el pago',
      error: error.message
    });
  }
}
