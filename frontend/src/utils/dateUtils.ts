/**
 * Utilidades para manejo de fechas en la aplicación
 * Maneja fechas de manera consistente con soporte global para zonas horarias
 */

/**
 * Obtiene la zona horaria local del cliente
 */
export const obtenerZonaHorariaLocal = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn('No se pudo detectar la zona horaria local, usando UTC');
    return 'UTC';
  }
};

/**
 * Obtiene el offset de la zona horaria local en minutos
 */
export const obtenerOffsetLocal = (): number => {
  return new Date().getTimezoneOffset();
};

/**
 * Convierte una fecha UTC a la zona horaria local del cliente
 * @param fechaUTC - Fecha en UTC (string ISO o Date)
 */
export const convertirUTCALocal = (fechaUTC: string | Date): Date => {
  try {
    let fecha: Date;
    
    if (typeof fechaUTC === 'string') {
      // Asegurar que la fecha se interprete como UTC
      const fechaConZ = fechaUTC.endsWith('Z') ? fechaUTC : fechaUTC + 'Z';
      fecha = new Date(fechaConZ);
    } else {
      fecha = new Date(fechaUTC);
    }
    
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha inválida');
    }
    
    return fecha;
  } catch (error) {
    console.error('Error convirtiendo fecha UTC a local:', error);
    return new Date();
  }
};

/**
 * Crea una fecha local a partir de un string YYYY-MM-DD
 * Evita problemas de zona horaria interpretando la fecha como local
 */
export const crearFechaLocal = (fechaString: string): Date => {
  // Agregar 'T00:00:00' para asegurar que se interprete como fecha local
  const fechaConTiempo = fechaString + 'T00:00:00';
  return new Date(fechaConTiempo);
};

/**
 * Formatea una fecha para mostrar en la interfaz
 * Convierte automáticamente de UTC a la zona horaria local del cliente
 * @param fecha - String en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 * @param opciones - Opciones de formato (opcional)
 */
export const formatearFecha = (
  fecha: string | Date,
  opciones: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
): string => {
  try {
    console.log('🔍 formatearFecha - Input:', fecha, 'Tipo:', typeof fecha);
    
    // Si es null o undefined
    if (fecha == null) {
      return 'N/A';
    }
    
    let fechaLocal: Date;
    
    // Si es un objeto Date
    if (fecha instanceof Date) {
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde objeto Date');
        return 'Fecha inválida';
      }
      fechaLocal = fecha;
    } else if (typeof fecha === 'string') {
      // Si la fecha incluye tiempo (formato ISO), convertir de UTC a local
      if (fecha.includes('T') || fecha.includes('Z')) {
        fechaLocal = convertirUTCALocal(fecha);
      } else {
        // Si es solo fecha (YYYY-MM-DD), crear fecha en zona horaria local
        const [year, month, day] = fecha.split('-').map(Number);
        fechaLocal = new Date(year, month - 1, day);
      }
    } else {
      console.error('❌ Tipo de fecha no válido:', typeof fecha, fecha);
      return 'Fecha inválida';
    }
    
    // Verificar que la fecha es válida
    if (isNaN(fechaLocal.getTime())) {
      console.log('🔍 Fecha inválida después de procesamiento:', fecha);
      return 'Fecha inválida';
    }
    
    // Obtener zona horaria local del cliente
    const zonaHorariaLocal = obtenerZonaHorariaLocal();
    
    // Formatear usando la zona horaria local del cliente
    return fechaLocal.toLocaleDateString('es-ES', {
      ...opciones,
      timeZone: zonaHorariaLocal
    });
  } catch (error) {
    console.error('❌ Error al formatear fecha:', error, fecha);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha para mostrar en formato corto
 * Convierte automáticamente de UTC a la zona horaria local del cliente
 * @param fecha - String en formato YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss
 */
export const formatearFechaCorta = (fecha: string | Date): string => {
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
 * Convierte automáticamente de UTC a la zona horaria local del cliente
 * @param fechaString - String en formato ISO o similar, o array de números
 */
export const formatearFechaConHora = (fechaString: any): string => {
  try {
    console.log('🔍 formatearFechaConHora - Input:', fechaString, 'Tipo:', typeof fechaString);
    
    // Si es null o undefined
    if (fechaString == null) {
      return 'N/A';
    }
    
    // Obtener zona horaria local del cliente
    const zonaHorariaLocal = obtenerZonaHorariaLocal();
    console.log('🌍 Zona horaria detectada:', zonaHorariaLocal);
    
    // Si es un array (formato [year, month, day, hour, minute, second, nanoseconds])
    if (Array.isArray(fechaString)) {
      console.log('🔍 Procesando array de fecha:', fechaString);
      const [year, month, day, hour = 0, minute = 0, second = 0, nanoseconds = 0] = fechaString;
      const fecha = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde array:', fechaString);
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: zonaHorariaLocal
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
      
      return fecha.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: zonaHorariaLocal
      });
    }
    
    // Si es un string
    if (typeof fechaString === 'string') {
      console.log('🔍 Procesando string de fecha:', fechaString);
      
      // Convertir de UTC a zona horaria local
      const fechaLocal = convertirUTCALocal(fechaString);
      
      // Verificar que la fecha es válida
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde string:', fechaString);
        return 'Fecha inválida';
      }
      
      // Formatear usando la zona horaria local del cliente
      return fechaLocal.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: zonaHorariaLocal
      });
    }
    
    // Si es un objeto Date
    if (fechaString instanceof Date) {
      console.log('🔍 Procesando objeto Date:', fechaString);
      
      if (isNaN(fechaString.getTime())) {
        console.log('🔍 Fecha inválida desde objeto Date');
        return 'Fecha inválida';
      }
      
      return fechaString.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: zonaHorariaLocal
      });
    }
    
    console.log('🔍 Tipo de fecha no reconocido:', typeof fechaString, fechaString);
    return 'Fecha inválida';
    
  } catch (error) {
    console.error('Error formateando fecha con hora:', error, 'Input:', fechaString);
    return 'Fecha inválida';
  }
};

/**
 * Formatea una fecha con hora en formato más detallado
 * Incluye información de la zona horaria
 */
export const formatearFechaConHoraDetallada = (fechaString: any): string => {
  try {
    const fechaFormateada = formatearFechaConHora(fechaString);
    const zonaHoraria = obtenerZonaHorariaLocal();
    const offset = obtenerOffsetLocal();
    const offsetHoras = Math.abs(Math.floor(offset / 60));
    const offsetMinutos = Math.abs(offset % 60);
    const signo = offset <= 0 ? '+' : '-';
    
    return `${fechaFormateada} (${zonaHoraria}, UTC${signo}${offsetHoras.toString().padStart(2, '0')}:${offsetMinutos.toString().padStart(2, '0')})`;
  } catch (error) {
    console.error('Error formateando fecha detallada:', error);
    return formatearFechaConHora(fechaString);
  }
};
