# Calculadora de Cantidades en Planillas

## Funcionalidad Implementada

Se ha agregado la funcionalidad de calculadora de cantidades en la sección de **Crear Planilla**, similar a la que ya existía en las secciones de Ingresos, Retornos y Devoluciones.

## Características

### 🧮 Calculadora Inteligente
- **Operadores soportados**: `+`, `-`, `*`, `/`, `x`, `()`
- **Evaluación en tiempo real**: Los cálculos se muestran instantáneamente mientras escribes
- **Validación de seguridad**: Solo permite operaciones matemáticas seguras
- **Resultado visual**: Muestra el resultado con formato de miles (ej: 1,500 unidades)

### 📝 Ejemplos de Uso

```
Entrada: 3x60
Resultado: 180 unidades

Entrada: (10+5)*12
Resultado: 180 unidades

Entrada: 100-25+50
Resultado: 125 unidades

Entrada: 500/2
Resultado: 250 unidades
```

### 🎯 Cómo Usar

1. **Seleccionar producto**: Busca y selecciona el producto que quieres agregar a la planilla
2. **Ingresar cantidad**: En el campo de cantidad puedes:
   - Escribir un número simple: `50`
   - Hacer un cálculo: `3x60`, `(10+5)*12`, `100-25+50`
3. **Ver resultado**: El sistema muestra el resultado del cálculo en tiempo real
4. **Confirmar**: Presiona Enter o el botón para agregar el producto

### 🔒 Seguridad

- **Validación de entrada**: Solo permite números y operadores matemáticos básicos
- **Protección contra código malicioso**: Bloquea palabras clave peligrosas
- **Resultado entero**: Solo acepta resultados que sean números enteros positivos
- **Límites de stock**: Valida que la cantidad no exceda el stock disponible

### 🎨 Interfaz Visual

- **Campo de texto**: Cambió de `type="number"` a `type="text"` para permitir operadores
- **Indicador de resultado**: Muestra el resultado en verde con formato de miles
- **Indicador de error**: Muestra errores en rojo con mensaje descriptivo
- **Ayuda contextual**: Muestra los operadores disponibles

### 🔄 Compatibilidad

- **Retrocompatible**: Sigue funcionando con números simples
- **Móvil optimizado**: Funciona correctamente en dispositivos móviles
- **Teclado**: Soporta navegación por teclado (Enter para confirmar, Escape para cancelar)

## Implementación Técnica

### Estados Agregados
```typescript
const [cantidadTemporalTexto, setCantidadTemporalTexto] = useState<string>('');
const [resultadoCalculoPlanilla, setResultadoCalculoPlanilla] = useState<number | null>(null);
const [errorCalculoPlanilla, setErrorCalculoPlanilla] = useState<string | null>(null);
```

### Función de Evaluación
```typescript
const evaluarExpresion = (expresion: string): { resultado: number | null; error: string | null }
```

### Validaciones
- Caracteres permitidos: `[0-9+\-*/().\s]`
- Palabras bloqueadas: `eval`, `function`, `constructor`, `prototype`, `window`, `document`, `global`
- Resultado debe ser: número entero positivo

## Beneficios

1. **Eficiencia**: Permite cálculos rápidos sin necesidad de calculadora externa
2. **Precisión**: Reduce errores de cálculo manual
3. **Flexibilidad**: Soporta múltiples operadores y paréntesis
4. **Consistencia**: Misma funcionalidad en todas las secciones de movimiento
5. **Usabilidad**: Interfaz intuitiva con feedback visual inmediato

## Casos de Uso Comunes

- **Cajas por unidades**: `12x24` (12 cajas de 24 unidades cada una)
- **Cálculos con descuentos**: `100-10+5` (100 unidades menos 10 más 5)
- **Distribución por sectores**: `(50+30)*2` (50 para sector A, 30 para sector B, duplicar)
- **Cálculos complejos**: `(100+50)/2` (promedio de dos cantidades)

Esta funcionalidad mejora significativamente la experiencia del usuario al crear planillas, permitiendo cálculos rápidos y precisos directamente en la interfaz.
