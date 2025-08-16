/**
 * Utilidades para manejo de fechas en la aplicación
 * Maneja fechas de manera consistente sin problemas de zona horaria
 */

/**
 * Crea una fecha local a partir de un string YYYY-MM-DD
 * Evita problemas de zona horaria interpretando la fecha como local
 */
export const crearFechaLocal = (fechaString: string): Date => {
  const [year, month, day] = fechaString.split('-').map(Number);
  return new Date(year, month - 1, day); // month - 1 porque los meses van de 0-11
};

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param fecha - String en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 * @param opciones - Opciones de formato (opcional)
 */
export const formatearFecha = (
  fecha: string, 
  opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  // Si la fecha incluye tiempo (formato ISO), extraer solo la parte de la fecha
  const fechaSolo = fecha.split('T')[0];
  const fechaLocal = crearFechaLocal(fechaSolo);
  return fechaLocal.toLocaleDateString('es-ES', opciones);
};

/**
 * Formatea una fecha para mostrar en formato corto
 * @param fecha - String en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 */
export const formatearFechaCorta = (fecha: string): string => {
  return formatearFecha(fecha, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD en zona horaria local
 */
export const obtenerFechaActual = (): string => {
  const ahora = new Date();
  const year = ahora.getFullYear();
  const month = String(ahora.getMonth() + 1).padStart(2, '0');
  const day = String(ahora.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Valida si una fecha es válida
 * @param fecha - String en formato YYYY-MM-DD
 */
export const esFechaValida = (fecha: string): boolean => {
  const fechaLocal = crearFechaLocal(fecha);
  return fechaLocal instanceof Date && !isNaN(fechaLocal.getTime());
};

/**
 * Compara dos fechas en formato YYYY-MM-DD
 * @param fechaA - Primera fecha
 * @param fechaB - Segunda fecha
 * @returns -1 si fechaA < fechaB, 0 si son iguales, 1 si fechaA > fechaB
 */
export const compararFechas = (fechaA: string, fechaB: string): number => {
  const fechaLocalA = crearFechaLocal(fechaA);
  const fechaLocalB = crearFechaLocal(fechaB);
  return fechaLocalA.getTime() - fechaLocalB.getTime();
};

/**
 * Formatea una fecha con hora para mostrar en la interfaz
 * @param fechaString - String en formato ISO o similar, o array de números
 */
export const formatearFechaConHora = (fechaString: any): string => {
  try {
    console.log('🔍 formatearFechaConHora - Input:', fechaString, 'Tipo:', typeof fechaString);
    
    // Si es null o undefined
    if (fechaString == null) {
      return 'N/A';
    }
    
         // Si es un array (formato [year, month, day, hour, minute, second, nanoseconds])
     if (Array.isArray(fechaString)) {
       console.log('🔍 Procesando array de fecha:', fechaString);
       const [year, month, day, hour = 0, minute = 0, second = 0, nanoseconds = 0] = fechaString;
       const fecha = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde array:', fechaString);
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // Si es un número (timestamp)
    if (typeof fechaString === 'number') {
      console.log('🔍 Procesando timestamp:', fechaString);
      const fecha = new Date(fechaString);
      
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde timestamp:', fechaString);
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // Si es un string
    if (typeof fechaString === 'string') {
      console.log('🔍 Procesando string de fecha:', fechaString);
      
      // Si la fecha termina en Z, removerla para evitar problemas de zona horaria
      const fechaLimpia = fechaString.endsWith('Z') ? fechaString.slice(0, -1) : fechaString;
      
      // Crear fecha local sin interpretar zona horaria
      const fecha = new Date(fechaLimpia);
      
      // Verificar que la fecha es válida
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde string:', fechaString);
        return 'Fecha inválida';
      }
      
      // Formatear usando la zona horaria local
      return fecha.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    // Si es un objeto Date
    if (fechaString instanceof Date) {
      console.log('🔍 Procesando objeto Date:', fechaString);
      
      if (isNaN(fechaString.getTime())) {
        console.log('🔍 Fecha inválida desde objeto Date');
        return 'Fecha inválida';
      }
      
      return fechaString.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    
    console.log('🔍 Tipo de fecha no reconocido:', typeof fechaString, fechaString);
    return 'Fecha inválida';
    
  } catch (error) {
    console.error('Error formateando fecha con hora:', error, 'Input:', fechaString);
    return 'Fecha inválida';
  }
};
