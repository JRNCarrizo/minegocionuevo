package com.minegocio.backend.configuracion;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;

import java.util.TimeZone;

@Configuration
public class TimeZoneConfig {

    @PostConstruct
    public void init() {
        // Configurar zona horaria por defecto (puede ser UTC para ser neutral)
        // En el futuro, esto se puede hacer dinámico basado en la empresa/usuario
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        System.out.println("🌍 Zona horaria del servidor configurada: " + TimeZone.getDefault().getID());
        System.out.println("🌍 Zona horaria actual: " + TimeZone.getDefault().getDisplayName());
    }
}
