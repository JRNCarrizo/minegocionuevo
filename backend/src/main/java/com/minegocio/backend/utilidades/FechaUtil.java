package com.minegocio.backend.utilidades;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Clase utilitaria para manejar fechas con la zona horaria de Argentina
 */
public class FechaUtil {
    
    // Zona horaria para Argentina
    public static final ZoneId ZONA_HORARIA_ARGENTINA = ZoneId.of("America/Argentina/Buenos_Aires");
    
    // Formato de fecha y hora para Argentina
    public static final DateTimeFormatter FORMATO_FECHA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    
    /**
     * Obtiene la fecha y hora actual en la zona horaria de Argentina
     * @return String formateado en dd/MM/yyyy HH:mm en zona horaria de Argentina
     */
    public static String ahoraFormateado() {
        return ZonedDateTime.now(ZONA_HORARIA_ARGENTINA).format(FORMATO_FECHA_HORA);
    }
    
    /**
     * Obtiene la fecha y hora actual en la zona horaria de Argentina
     * @return LocalDateTime en zona horaria de Argentina
     */
    public static LocalDateTime ahora() {
        return ZonedDateTime.now(ZONA_HORARIA_ARGENTINA).toLocalDateTime();
    }
    
    /**
     * Formatea una fecha y hora en formato legible para Argentina
     * @param fecha La fecha a formatear
     * @return String formateado en dd/MM/yyyy HH:mm
     */
    public static String formatearFechaHora(LocalDateTime fecha) {
        if (fecha == null) {
            return "";
        }
        return fecha.atZone(ZoneId.systemDefault())
                   .withZoneSameInstant(ZONA_HORARIA_ARGENTINA)
                   .toLocalDateTime()
                   .format(FORMATO_FECHA_HORA);
    }
    
    /**
     * Convierte una fecha UTC a la zona horaria de Argentina
     * @param fechaUTC La fecha en UTC
     * @return LocalDateTime en zona horaria de Argentina
     */
    public static LocalDateTime convertirAArgentina(LocalDateTime fechaUTC) {
        if (fechaUTC == null) {
            return null;
        }
        return fechaUTC.atZone(ZoneId.systemDefault())
                      .withZoneSameInstant(ZONA_HORARIA_ARGENTINA)
                      .toLocalDateTime();
    }
} 