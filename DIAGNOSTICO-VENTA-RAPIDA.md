# Diagnóstico de Venta Rápida

## Problema Reportado
- Error 400 al finalizar venta
- No calcula el vuelto correctamente
- No finaliza la compra

## Pasos para Diagnosticar

### 1. Verificar Backend
```powershell
# Ejecutar el backend
.\ejecutar-backend.ps1
```

### 2. Verificar Frontend
```powershell
# En otra terminal, ejecutar el frontend
.\ejecutar-frontend.ps1
```

### 3. Probar Endpoint de Debug
Una vez que ambos servidores estén corriendo, puedes probar el endpoint de debug:

```bash
curl -X POST http://localhost:8080/api/admin/venta-rapida/debug \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN" \
  -d '{
    "clienteNombre": "Cliente Test",
    "clienteEmail": "test@test.com",
    "total": 100.0,
    "subtotal": 100.0,
    "metodoPago": "EFECTIVO",
    "montoRecibido": 150.0,
    "vuelto": 50.0,
    "observaciones": "Test venta rápida",
    "detalles": [
      {
        "productoId": 1,
        "productoNombre": "Producto Test",
        "cantidad": 1,
        "precioUnitario": 100.0,
        "subtotal": 100.0
      }
    ]
  }'
```

### 4. Verificar Base de Datos
```sql
-- Verificar productos disponibles
SELECT id, nombre, precio, stock FROM productos WHERE activo = true;

-- Verificar empresa
SELECT id, nombre, subdominio FROM empresas;

-- Verificar usuarios admin
SELECT id, nombre, email, empresa_id FROM usuarios WHERE rol = 'ADMIN';
```

### 5. Verificar Logs del Backend
Buscar en los logs del backend por:
- Errores de validación
- Errores de autenticación
- Errores de base de datos

### 6. Verificar Console del Frontend
En el navegador, abrir las herramientas de desarrollador (F12) y revisar:
- Errores en la consola
- Peticiones HTTP en la pestaña Network
- Respuestas del servidor

## Posibles Causas

### 1. Problemas de Validación
- Campos requeridos faltantes
- Tipos de datos incorrectos (number vs BigDecimal)
- Validaciones de negocio fallando

### 2. Problemas de Autenticación
- Token expirado
- Permisos insuficientes
- Usuario no autenticado

### 3. Problemas de Base de Datos
- Productos no encontrados
- Stock insuficiente
- Problemas de conexión

### 4. Problemas de Cálculo
- Vuelto calculado incorrectamente
- Totales no coinciden
- Precios con formato incorrecto

## Soluciones Implementadas

1. **Función calcularVuelto corregida**: Ahora usa `inputMontoRecibido` en lugar de `venta.montoRecibido`
2. **Endpoint de debug agregado**: Para validar datos antes del procesamiento
3. **Mejor manejo de errores**: Logs más detallados en frontend y backend
4. **Scripts de PowerShell**: Para ejecutar frontend y backend fácilmente

## Próximos Pasos

1. Ejecutar ambos servidores
2. Probar la funcionalidad de venta rápida
3. Revisar logs y console para errores específicos
4. Usar el endpoint de debug para validar datos
5. Corregir cualquier problema identificado 