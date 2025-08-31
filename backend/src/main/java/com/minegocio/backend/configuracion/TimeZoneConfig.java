package com.minegocio.backend.configuracion;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // NO configurar zona horaria UTC globalmente
        // Permitir que las fechas se manejen localmente sin conversiones
        System.out.println("🌍 Zona horaria del servidor actual: " + TimeZone.getDefault().getID());
        System.out.println("🌍 Zona horaria actual: " + TimeZone.getDefault().getDisplayName());
        System.out.println("🌍 Offset actual: " + TimeZone.getDefault().getRawOffset() / (1000 * 60 * 60) + " horas");
        System.out.println("🌍 Configuración: Las fechas se manejan localmente sin conversiones UTC");
        
        // NO configurar zona horaria del sistema
        // System.setProperty("user.timezone", "UTC");
        System.out.println("🌍 Sistema usando zona horaria: " + System.getProperty("user.timezone"));
    }
}
