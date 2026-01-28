# API de Pagos

## Endpoints

### POST /api/pagos
Registra un nuevo pago con estado "pendiente de verificación" y crea automáticamente una reservación.

**Body:**
```json
{
  "tourId": "string (ObjectId)",
  "userId": "string",
  "monto": "number",
  "metodo_pago": "transferencia|tarjeta|efectivo|otro",
  "selectedDate": "string (ISO date)",
  "persons": "number",
  "comprobante": "string (optional)",
  "notas": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago registrado exitosamente",
  "data": {
    "pago": {
      "_id": "string",
      "referencia": "string (único)",
      "tourId": {
        "_id": "string",
        "titulo": "string",
        "precio": "number"
      },
      "reservationId": {
        "_id": "string",
        "tourId": "string",
        "userId": "string",
        "date": "date",
        "persons": "number",
        "total": "number",
        "status": "string"
      },
      "userId": "string",
      "monto": "number",
      "fecha_pago": "date",
      "status": "pendiente de verificación",
      "metodo_pago": "string",
      "comprobante": "string",
      "notas": "string",
      "createdAt": "date",
      "updatedAt": "date"
    },
    "reservation": {
      "_id": "string",
      "tourId": "string",
      "userId": "string",
      "date": "date",
      "persons": "number",
      "total": "number",
      "status": "pendiente",
      "createdAt": "date"
    }
  }
}
```

### GET /api/pagos
Obtiene lista de pagos con filtros opcionales.

**Query Parameters:**
- `userId` (string): Filtrar por usuario
- `tourId` (string): Filtrar por tour
- `status` (string): Filtrar por estado
- `page` (number): Página actual (default: 1)
- `limit` (number): Límite de resultados (default: 10)
- `startDate` (string): Fecha inicial (ISO date)
- `endDate` (string): Fecha final (ISO date)

**Response:**
```json
{
  "success": true,
  "data": {
    "pagos": [
      {
        "_id": "string",
        "referencia": "string",
        "tourId": {
          "_id": "string",
          "titulo": "string",
          "precio": "number"
        },
        "reservationId": {
          "_id": "string",
          "status": "string"
        },
        "userId": "string",
        "monto": "number",
        "fecha_pago": "date",
        "status": "string",
        "metodo_pago": "string",
        "comprobante": "string",
        "notas": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### PUT /api/pagos?id={pagoId}
Actualiza el estado de un pago y automáticamente actualiza el estado de la reservación asociada.

**Query Parameters:**
- `id` (string): ID del pago a actualizar

**Body:**
```json
{
  "status": "verificado|rechazado|pendiente de verificación",
  "notas": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pago actualizado exitosamente",
  "data": {
    "_id": "string",
    "referencia": "string",
    "tourId": {
      "_id": "string",
      "titulo": "string",
      "precio": "number"
    },
    "reservationId": {
      "_id": "string",
      "status": "confirmada|cancelada|pendiente"
    },
    "userId": "string",
    "monto": "number",
    "fecha_pago": "date",
    "status": "string",
    "metodo_pago": "string",
    "comprobante": "string",
    "notas": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

## Estados del Pago

- **pendiente de verificación**: Pago registrado pero no verificado
- **verificado**: Pago confirmado y válido
- **rechazado**: Pago invalidado

## Estados de la Reservación

La reservación se actualiza automáticamente según el estado del pago:

- Pago **verificado** → Reservación **confirmada**
- Pago **rechazado** → Reservación **cancelada**
- Pago **pendiente de verificación** → Reservación **pendiente**

## Referencia Única

Cada pago genera automáticamente una referencia única con formato:
`PAY-{timestamp}-{random}` (ej: `PAY-1K2J3M-ABC12`)

## Validaciones

- El monto debe coincidir con: `precio_tour × número_personas`
- La referencia es única y se genera automáticamente
- Todos los campos obligatorios deben estar presentes
- Los estados deben ser válidos según los enums definidos
