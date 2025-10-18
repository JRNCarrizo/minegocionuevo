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
      console.log('🔍 [DEBUG] convertirUTCALocal - Input string:', fechaUTC);
      // Si tiene 'Z' al final, es UTC, si no, es fecha local del usuario
      if (fechaUTC.endsWith('Z')) {
        // Es UTC, convertir a local
        console.log('🔍 [DEBUG] Detectado como UTC, convirtiendo a local');
        fecha = new Date(fechaUTC);
      } else {
        // Es fecha local del usuario, parsear manualmente para evitar conversión UTC automática
        console.log('🔍 [DEBUG] Detectado como fecha local, parseando manualmente');
        if (fechaUTC.includes('T')) {
          // Parsear manualmente para evitar conversión UTC automática
          const partes = fechaUTC.split('T');
          const fechaParte = partes[0].split('-');
          const horaParte = partes[1].split(':');
          
          const year = parseInt(fechaParte[0]);
          const month = parseInt(fechaParte[1]) - 1; // Meses van de 0-11
          const day = parseInt(fechaParte[2]);
          const hour = parseInt(horaParte[0]);
          const minute = parseInt(horaParte[1]);
          const second = parseInt(horaParte[2]) || 0;
          
          fecha = new Date(year, month, day, hour, minute, second);
        } else {
          // Solo fecha, crear en zona horaria local
          const [year, month, day] = fechaUTC.split('-').map(Number);
          fecha = new Date(year, month - 1, day);
        }
      }
    } else {
      console.log('🔍 [DEBUG] convertirUTCALocal - Input Date:', fechaUTC);
      fecha = new Date(fechaUTC);
    }
    
    if (isNaN(fecha.getTime())) {
      throw new Error('Fecha inválida');
    }
    
    console.log('🔍 [DEBUG] convertirUTCALocal - Resultado:', fecha.toISOString());
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
  fecha: any,
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
    
    // Obtener zona horaria local del cliente
    const zonaHorariaLocal = obtenerZonaHorariaLocal();
    
    let fechaLocal: Date;
    
    // Si es un array (formato [year, month, day, hour, minute, second, nanoseconds])
    // Los arrays del backend representan fechas locales (no UTC)
    if (Array.isArray(fecha)) {
      console.log('🔍 Procesando array de fecha local:', fecha);
      const [year, month, day, hour = 0, minute = 0, second = 0] = fecha;
      
      // Crear fecha local (no UTC) para evitar conversión automática
      const fechaLocal = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde array local:', fecha);
        return 'Fecha inválida';
      }
      
      console.log('🔍 Array procesado como fecha local:', {
        year, month, day, hour, minute, second,
        fechaLocal: fechaLocal.toISOString()
      });
      
      // Mostrar en zona horaria local del usuario
      return fechaLocal.toLocaleDateString('es-ES', {
        ...opciones
      });
    }
    // Si es un objeto Date
    else if (fecha instanceof Date) {
      if (isNaN(fecha.getTime())) {
        console.log('🔍 Fecha inválida desde objeto Date');
        return 'Fecha inválida';
      }
      fechaLocal = fecha;
    } 
    // Si es un string
    else if (typeof fecha === 'string') {
      // Si la fecha incluye tiempo (formato ISO), convertir de UTC a local
      if (fecha.includes('T') || fecha.includes('Z')) {
        fechaLocal = convertirUTCALocal(fecha);
      } else {
        // Si es solo fecha (YYYY-MM-DD), crear fecha en zona horaria local
        const [year, month, day] = fecha.split('-').map(Number);
        fechaLocal = new Date(year, month - 1, day);
      }
    }
    // Si es un número (timestamp)
    else if (typeof fecha === 'number') {
      console.log('🔍 Procesando timestamp:', fecha);
      fechaLocal = new Date(fecha);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde timestamp:', fecha);
        return 'Fecha inválida';
      }
    }
    else {
      console.error('❌ Tipo de fecha no válido:', typeof fecha, fecha);
      return 'Fecha inválida';
    }
    
    // Verificar que la fecha es válida
    if (isNaN(fechaLocal.getTime())) {
      console.log('🔍 Fecha inválida después de procesamiento:', fecha);
      return 'Fecha inválida';
    }
    
    // Mostrar en zona horaria local del usuario
    return fechaLocal.toLocaleDateString('es-ES', {
      ...opciones
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
 * Maneja fechas locales sin conversión UTC (para planillas de devolución)
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
    // Los arrays del backend representan fechas locales (no UTC)
    if (Array.isArray(fechaString)) {
      console.log('🔍 Procesando array de fecha local:', fechaString);
      const [year, month, day, hour = 0, minute = 0, second = 0, nanoseconds = 0] = fechaString;
      
      // Crear fecha local (no UTC) para evitar conversión automática
      const fechaLocal = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde array local:', fechaString);
        return 'Fecha inválida';
      }
      
      console.log('🔍 Array procesado como fecha local:', {
        year, month, day, hour, minute, second,
        fechaLocal: fechaLocal.toISOString(),
        zonaHorariaLocal: obtenerZonaHorariaLocal()
      });
      
      // Mostrar en zona horaria local del usuario
      return fechaLocal.toLocaleString('es-AR', {
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
      console.log('🔍 String original recibido del backend:', fechaString);
      
      // Si ya tiene formato de fecha (YYYY-MM-DD)
      if (fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return fechaString;
      }
      
      // Si tiene formato ISO con T (YYYY-MM-DDTHH:mm:ss)
      if (fechaString.includes('T')) {
        console.log('🔍 Fecha original:', fechaString);
        
        // DETECCIÓN AUTOMÁTICA: Si la fecha termina en 'Z', es UTC; si no, es fecha local del servidor
        if (fechaString.endsWith('Z')) {
          // Es UTC, convertir a local
          console.log('🔍 Detectado como UTC, convirtiendo a local');
          const fechaObj = new Date(fechaString);
          
          if (isNaN(fechaObj.getTime())) {
            console.log('🔍 Fecha inválida desde string UTC:', fechaString);
            return 'Fecha inválida';
          }
          
          return fechaObj.toLocaleString('es-AR', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
          });
        } else {
          // Es fecha local del servidor (planillas), parsear como fecha local
          console.log('🔍 Detectado como fecha local del servidor, parseando como local');
          const partes = fechaString.split('T');
          const fechaParte = partes[0].split('-');
          const horaParte = partes[1].split(':');
          
          const year = parseInt(fechaParte[0]);
          const month = parseInt(fechaParte[1]) - 1; // Meses van de 0-11
          const day = parseInt(fechaParte[2]);
          const hour = parseInt(horaParte[0]);
          const minute = parseInt(horaParte[1]);
          const second = parseInt(horaParte[2]) || 0;
          
          const fechaLocal = new Date(year, month, day, hour, minute, second);
          
          if (isNaN(fechaLocal.getTime())) {
            console.log('🔍 Fecha inválida desde string local:', fechaString);
            return 'Fecha inválida';
          }
          
          console.log('🔍 String local procesado:', {
            fechaString,
            fechaLocal: fechaLocal.toLocaleString('es-AR')
          });
          
          return fechaLocal.toLocaleString('es-AR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
        }
      }
      
      // Otros formatos, usar Date constructor
      const fechaLocal = new Date(fechaString);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde string:', fechaString);
        return 'Fecha inválida';
      }
      
      return fechaLocal.toLocaleString('es-AR', {
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

/**
 * Formatea una fecha con hora para planillas (fechas locales del servidor)
 * Las fechas de planillas vienen del backend como hora local del servidor, no UTC
 * @param fechaString - String en formato YYYY-MM-DDTHH:mm:ss (sin Z)
 */
export const formatearFechaConHoraPlanilla = (fechaString: any): string => {
  try {
    console.log('🔍 formatearFechaConHoraPlanilla - Input:', fechaString, 'Tipo:', typeof fechaString);
    
    // Si es null o undefined
    if (fechaString == null) {
      return 'N/A';
    }
    
    // Si es un array (formato [year, month, day, hour, minute, second])
    if (Array.isArray(fechaString)) {
      console.log('🔍 Procesando array de fecha planilla:', fechaString);
      const [year, month, day, hour = 0, minute = 0, second = 0] = fechaString;
      
      // Crear fecha local (no UTC) para evitar conversión automática
      const fechaLocal = new Date(year, month - 1, day, hour, minute, second);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde array planilla:', fechaString);
        return 'Fecha inválida';
      }
      
      return fechaLocal.toLocaleString('es-AR', {
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
      console.log('🔍 Procesando string de fecha planilla:', fechaString);
      
      // Si tiene formato ISO con T (YYYY-MM-DDTHH:mm:ss)
      if (fechaString.includes('T')) {
        // IMPORTANTE: Las fechas de planillas vienen como hora local del servidor
        // NO agregar 'Z' - parsear como fecha local
        const partes = fechaString.split('T');
        const fechaParte = partes[0].split('-');
        const horaParte = partes[1].split(':');
        
        const year = parseInt(fechaParte[0]);
        const month = parseInt(fechaParte[1]) - 1; // Meses van de 0-11
        const day = parseInt(fechaParte[2]);
        const hour = parseInt(horaParte[0]);
        const minute = parseInt(horaParte[1]);
        const second = parseInt(horaParte[2]) || 0;
        
        const fechaLocal = new Date(year, month, day, hour, minute, second);
        
        if (isNaN(fechaLocal.getTime())) {
          console.log('🔍 Fecha inválida desde string planilla:', fechaString);
          return 'Fecha inválida';
        }
        
        console.log('🔍 String planilla procesado como fecha local:', {
          fechaString,
          fechaLocal: fechaLocal.toLocaleString('es-AR')
        });
        
        return fechaLocal.toLocaleString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
      
      // Otros formatos, usar Date constructor
      const fechaLocal = new Date(fechaString);
      
      if (isNaN(fechaLocal.getTime())) {
        console.log('🔍 Fecha inválida desde string planilla:', fechaString);
        return 'Fecha inválida';
      }
      
      return fechaLocal.toLocaleString('es-AR', {
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
      if (isNaN(fechaString.getTime())) {
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
    
    console.log('🔍 Tipo de fecha planilla no reconocido:', typeof fechaString, fechaString);
    return 'Fecha inválida';
    
  } catch (error) {
    console.error('Error formateando fecha planilla:', error, 'Input:', fechaString);
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
