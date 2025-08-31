package com.minegocio.backend.configuracion;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // NO configurar zona horaria del servidor
        // Permitir que las fechas se manejen exactamente como las envía el frontend
        System.out.println("🌍 Zona horaria del servidor: " + TimeZone.getDefault().getID());
        System.out.println("🌍 Configuración: Las fechas se manejan sin conversiones de zona horaria");
        System.out.println("🌍 Sistema usando zona horaria: " + System.getProperty("user.timezone"));
        System.out.println("🌍 IMPORTANTE: Las fechas se procesan como vienen del frontend (sin conversiones)");
    }
}
