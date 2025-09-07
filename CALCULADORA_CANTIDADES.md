# 🧮 Calculadora de Cantidades en MiNegocio

## 📋 Descripción

Se ha implementado una funcionalidad de calculadora matemática en los campos de cantidad de los módulos "Recibir Stock", "Transferir Stock", "Gestión de Retornos" y "Gestión de Ingresos". Esta funcionalidad permite ingresar expresiones matemáticas directamente en los campos de cantidad, facilitando el manejo de cantidades grandes por pallet.

## ✨ Características

### 🔢 Operadores Soportados
- **Suma**: `+` (ej: `100 + 50`)
- **Resta**: `-` (ej: `200 - 30`)
- **Multiplicación**: `*` o `x` (ej: `3 * 112` o `3x112`)
- **División**: `/` (ej: `600 / 2`)
- **Paréntesis**: `()` (ej: `(3 + 2) * 60`)

### 🛡️ Seguridad
- Solo permite caracteres matemáticos seguros
- Bloquea palabras clave peligrosas
- Valida que el resultado sea un número entero positivo
- No permite código JavaScript malicioso

### ⚡ Funcionalidades en Tiempo Real
- **Cálculo automático**: El resultado se muestra mientras escribes
- **Validación instantánea**: Errores se muestran inmediatamente
- **Feedback visual**: Indicadores de éxito y error con colores

## 🎯 Casos de Uso

### 📦 Manejo de Pallets
```
Entrada: 3*112
Resultado: 336 unidades
Descripción: 3 pallets de 112 cajas cada uno
```

### 🔢 Cálculos Complejos
```
Entrada: (2*60) + (1*50)
Resultado: 170 unidades
Descripción: 2 pallets de 60 + 1 pallet de 50
```

### ➗ División de Lotes
```
Entrada: 1000/4
Resultado: 250 unidades
Descripción: Dividir 1000 unidades en 4 lotes
```

## 🚀 Cómo Usar

### 📥 En Recibir Productos
1. **Navegar** a Gestión de Sectores
2. **Seleccionar** un sector activo
3. **Hacer clic** en "Recibir Productos"
4. **Buscar** el producto deseado
5. **Seleccionar** la ubicación de origen
6. **En el campo cantidad**, escribir la expresión matemática:
   - `3*112` para 3 pallets de 112 cajas
   - `2x60` para 2 pallets de 60 cajas
   - `(3+2)*50` para cálculos complejos
7. **Verificar** el resultado mostrado en tiempo real
8. **Confirmar** la recepción

### 🔄 En Transferir Stock
1. **Navegar** a Gestión de Sectores
2. **Seleccionar** un sector con productos
3. **Hacer clic** en el botón de transferir (🔄) de un producto
4. **Seleccionar** el sector destino
5. **En el campo cantidad**, escribir la expresión matemática:
   - `3*112` para transferir 3 pallets de 112 cajas
   - `2x60` para transferir 2 pallets de 60 cajas
   - `(3+2)*50` para cálculos complejos
6. **Verificar** el resultado mostrado en tiempo real
7. **Confirmar** la transferencia

### 📦 En Gestión de Retornos
1. **Navegar** a Gestión de Retornos
2. **Crear** un nuevo registro de retorno
3. **Buscar** el producto a devolver
4. **En el campo cantidad**, escribir la expresión matemática:
   - `3*112` para devolver 3 pallets de 112 cajas
   - `2x60` para devolver 2 pallets de 60 cajas
   - `(3+2)*50` para cálculos complejos
5. **Verificar** el resultado mostrado en tiempo real
6. **Seleccionar** el estado del producto
7. **Confirmar** el retorno

### 📥 En Gestión de Ingresos
1. **Navegar** a Gestión de Ingresos
2. **Crear** un nuevo remito de ingreso
3. **Buscar** el producto a ingresar
4. **En el campo cantidad**, escribir la expresión matemática:
   - `3*112` para ingresar 3 pallets de 112 cajas
   - `2x60` para ingresar 2 pallets de 60 cajas
   - `(3+2)*50` para cálculos complejos
5. **Verificar** el resultado mostrado en tiempo real
6. **Confirmar** el ingreso

## 💡 Ejemplos Prácticos

### Ejemplo 1: Recepción de Pallets
```
Producto: Cajas de Producto A
Cantidad: 3*112
Resultado: 336 unidades
```

### Ejemplo 2: Transferencia de Stock
```
Producto: Cajas de Producto B
Cantidad: 2x60
Resultado: 120 unidades
Acción: Transferir 2 pallets de 60 cajas entre sectores
```

### Ejemplo 3: Cálculo Mixto
```
Producto: Cajas de Producto C
Cantidad: (2*60) + (1*50)
Resultado: 170 unidades
```

### Ejemplo 4: División de Stock
```
Producto: Cajas de Producto D
Cantidad: 1000/4
Resultado: 250 unidades
```

### Ejemplo 5: Retorno de Productos
```
Producto: Cajas de Producto E
Cantidad: 2x60
Resultado: 120 unidades
Acción: Devolver 2 pallets de 60 cajas
```

### Ejemplo 6: Ingreso de Productos
```
Producto: Cajas de Producto F
Cantidad: 3*112
Resultado: 336 unidades
Acción: Ingresar 3 pallets de 112 cajas
```

## ⚠️ Validaciones

### ✅ Expresiones Válidas
- `3*112` → 336
- `2x60` → 120
- `(3+2)*50` → 250
- `1000/4` → 250
- `200+50` → 250

### ❌ Expresiones Inválidas
- `3*112.5` → Error: Debe ser entero
- `3*0` → Error: Debe ser positivo
- `abc` → Error: Caracteres no permitidos
- `3**112` → Error: Operador no válido

## 🔧 Detalles Técnicos

### Función de Evaluación
```typescript
const evaluarExpresion = (expresion: string): { resultado: number | null; error: string | null }
```

### Caracteres Permitidos
- Números: `0-9`
- Operadores: `+`, `-`, `*`, `/`, `x`
- Paréntesis: `(`, `)`
- Espacios: ` `

### Validaciones de Seguridad
- Bloquea palabras clave peligrosas
- Solo permite operadores matemáticos básicos
- Valida que el resultado sea un entero positivo
- Usa `Function` constructor en lugar de `eval` para mayor seguridad

## 🎨 Interfaz de Usuario

### Indicadores Visuales
- **Verde**: Resultado válido calculado
- **Rojo**: Error en la expresión
- **Gris**: Información de ayuda

### Placeholder
```
"Ej: 336, 3*112, 3x60..."
```

### Ayuda Contextual
```
"💡 Puedes usar: +, -, *, /, x, paréntesis"
```

## 🚀 Beneficios

1. **Eficiencia**: Cálculos rápidos sin calculadora externa
2. **Precisión**: Elimina errores de cálculo manual
3. **Flexibilidad**: Soporta múltiples operadores
4. **Seguridad**: Validaciones robustas
5. **Usabilidad**: Feedback visual inmediato
6. **Productividad**: Ideal para manejo de pallets y lotes grandes

## 📱 Compatibilidad

- ✅ Desktop
- ✅ Tablet
- ✅ Mobile
- ✅ Todos los navegadores modernos

---

*Esta funcionalidad está diseñada específicamente para facilitar el manejo de cantidades grandes en entornos de almacén y distribución.*
