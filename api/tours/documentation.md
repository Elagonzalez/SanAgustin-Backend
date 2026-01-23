# API de Tours - Documentación

## Base URL
```
https://tu-backend.vercel.app/api
```

---

## Endpoints Disponibles

### 1. Crear un Tour
**POST** `/tours`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):**
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| titulo | String | Sí | Título del tour (máx. 100 caracteres) |
| descripcion | String | Sí | Descripción detallada del tour |
| precio | Number | Sí | Precio del tour (debe ser >= 0) |
| duracion | String | Sí | Duración (ej: "3 días", "5 horas") |
| fecha_disponible | Date | Sí | Fecha disponible (ISO 8601 o formato date) |
| max_personas | Number | Sí | Máximo de personas permitidas |
| incluye | Array/JSON | No | Array de strings con lo que incluye el tour |
| imagen | File | No | Archivo de imagen (JPEG, PNG, WEBP, máx 5MB) |

**Ejemplo de request (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('titulo', 'Tour por Caracas Colonial');
formData.append('descripcion', 'Recorrido histórico por el centro de Caracas');
formData.append('precio', 50);
formData.append('duracion', '4 horas');
formData.append('fecha_disponible', '2026-02-15T09:00:00.000Z');
formData.append('max_personas', 20);
formData.append('incluye', JSON.stringify(['Transporte', 'Guía', 'Refrigerios']));
formData.append('imagen', imageFile); // File object

const response = await fetch('https://tu-backend.vercel.app/api/tours', {
  method: 'POST',
  body: formData
});
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Tour creado exitosamente",
  "tour": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Tour por Caracas Colonial",
    "descripcion": "Recorrido histórico por el centro de Caracas",
    "precio": 50,
    "duracion": "4 horas",
    "fecha_disponible": "2026-02-15T09:00:00.000Z",
    "max_personas": 20,
    "incluye": ["Transporte", "Guía", "Refrigerios"],
    "is_active": true,
    "imagenBase64": "...",
    "imagenContentType": "image/jpeg",
    "createdAt": "2026-01-23T10:00:00.000Z",
    "updatedAt": "2026-01-23T10:00:00.000Z"
  }
}
```

---

### 2. Obtener Todos los Tours Activos
**GET** `/tours`

**Query Parameters:** Ninguno

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "count": 3,
  "tours": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "titulo": "Tour por Caracas Colonial",
      "descripcion": "Recorrido histórico...",
      "precio": 50,
      "duracion": "4 horas",
      "fecha_disponible": "2026-02-15T09:00:00.000Z",
      "max_personas": 20,
      "incluye": ["Transporte", "Guía", "Refrigerios"],
      "is_active": true,
      "imagenBase64": "...",
      "imagenContentType": "image/jpeg",
      "createdAt": "2026-01-23T10:00:00.000Z",
      "updatedAt": "2026-01-23T10:00:00.000Z"
    },
    // ... más tours
  ]
}
```

**Ejemplo de uso (JavaScript):**
```javascript
const response = await fetch('https://tu-backend.vercel.app/api/tours');
const data = await response.json();

if (data.success) {
  console.log(`Se encontraron ${data.count} tours activos`);
  data.tours.forEach(tour => {
    console.log(`${tour.titulo} - $${tour.precio}`);
  });
}
```

---

### 3. Obtener Detalles de un Tour
**GET** `/tours/:id`

**URL Parameters:**
- `id` (String): ID del tour (formato MongoDB ObjectId)

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "tour": {
    "_id": "507f1f77bcf86cd799439011",
    "titulo": "Tour por Caracas Colonial",
    "descripcion": "Recorrido histórico completo...",
    "precio": 50,
    "duracion": "4 horas",
    "fecha_disponible": "2026-02-15T09:00:00.000Z",
    "max_personas": 20,
    "incluye": ["Transporte", "Guía", "Refrigerios"],
    "is_active": true,
    "imagenBase64": "...",
    "imagenContentType": "image/jpeg",
    "createdAt": "2026-01-23T10:00:00.000Z",
    "updatedAt": "2026-01-23T10:00:00.000Z"
  }
}
```

**Errores posibles:**
```json
// Tour no encontrado (404)
{
  "success": false,
  "error": "Tour no encontrado"
}

// ID inválido (400)
{
  "success": false,
  "error": "ID de tour inválido"
}
```

---

### 4. Actualizar un Tour (BONUS)
**PUT** `/tours/:id`

**Headers:**
```
Content-Type: multipart/form-data
```

**Body (FormData):** Mismos campos que POST, todos opcionales

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tour actualizado exitosamente",
  "tour": { /* tour actualizado */ }
}
```

---

### 5. Desactivar un Tour (BONUS)
**DELETE** `/tours/:id`

**Nota:** Este es un "soft delete", solo cambia `is_active` a `false`

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Tour desactivado exitosamente",
  "tour": {
    "_id": "507f1f77bcf86cd799439011",
    "is_active": false,
    // ... otros campos
  }
}
```

---

## Integración en tu Backend

### 1. En tu archivo principal (app.js o index.js):
```javascript
const tourRoutes = require('./routes/tourRoutes');

// ... otras configuraciones

app.use('/api', tourRoutes);
```

### 2. Asegúrate de tener instaladas las dependencias:
```bash
npm install multer mongoose express
```

### 3. Estructura de carpetas sugerida:
```
proyecto/
├── models/
│   └── Tour.js
├── routes/
│   └── tourRoutes.js
├── app.js
└── package.json
```

---

## Códigos de Estado

| Código | Significado |
|--------|-------------|
| 200 | OK - Operación exitosa |
| 201 | Created - Tour creado exitosamente |
| 400 | Bad Request - Datos inválidos |
| 404 | Not Found - Tour no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## Notas Importantes

1. **Imágenes en Base64:** Las imágenes se almacenan en Base64 en la BD. Para mostrarlas:
   ```javascript
   const imageSrc = `data:${tour.imagenContentType};base64,${tour.imagenBase64}`;
   ```

2. **Campo "incluye":** Debe enviarse como JSON string o array:
   ```javascript
   // Opción 1: JSON string
   formData.append('incluye', JSON.stringify(['Item 1', 'Item 2']));
   
   // Opción 2: Array (algunos clientes lo soportan)
   formData.append('incluye', ['Item 1', 'Item 2']);
   ```

3. **Fechas:** Usa formato ISO 8601 para mejor compatibilidad:
   ```javascript
   const fecha = new Date('2026-02-15T09:00:00').toISOString();
   ```

4. **Validaciones:** El backend valida:
   - Formato de ID de MongoDB
   - Tipos de archivo de imagen (JPEG, PNG, WEBP)
   - Tamaño máximo de imagen (5MB)
   - Campos requeridos
   - Valores numéricos positivos