package com.minegocio.backend.configuracion;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // Configurar zona horaria UTC como base para consistencia global
        // El frontend se encargará de convertir a la zona horaria local del cliente
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
        System.out.println("🌍 Zona horaria actual: " + TimeZone.getDefault().getDisplayName());
        System.out.println("🌍 Offset actual: " + TimeZone.getDefault().getRawOffset() / (1000 * 60 * 60) + " horas");
        System.out.println("🌍 Configuración: Todas las fechas se almacenan en UTC y se convierten en el frontend");
        
        // Configurar también el sistema para usar UTC
        System.setProperty("user.timezone", "UTC");
        System.out.println("🌍 Sistema configurado para usar UTC: " + System.getProperty("user.timezone"));
    }
}
