package com.minegocio.backend.configuracion;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.CommandLineRunner;

import javax.annotation.PostConstruct;
import java.time.ZoneId;
import java.util.TimeZone;

@Configuration
public class TimezoneConfig {

    private static final String TIMEZONE = "America/Argentina/Buenos_Aires";

    @PostConstruct
    public void init() {
        // Establecer la zona horaria del sistema Java
        TimeZone.setDefault(TimeZone.getTimeZone(TIMEZONE));
        System.out.println("🌍 [TIMEZONE] Zona horaria del sistema establecida a: " + TIMEZONE);
        System.out.println("🌍 [TIMEZONE] Zona horaria actual del sistema: " + TimeZone.getDefault().getID());
        System.out.println("🌍 [TIMEZONE] Offset actual: " + TimeZone.getDefault().getRawOffset() / (1000 * 60 * 60) + " horas");
    }

    @Bean
    @Primary
    public CommandLineRunner timezoneInfo() {
        return args -> {
            System.out.println("🌍 [TIMEZONE] Información de zona horaria al inicio:");
            System.out.println("🌍 [TIMEZONE] Zona horaria del sistema: " + TimeZone.getDefault().getID());
            System.out.println("🌍 [TIMEZONE] Zona horaria de Java: " + ZoneId.systemDefault());
            System.out.println("🌍 [TIMEZONE] Hora actual del sistema: " + java.time.LocalDateTime.now());
            System.out.println("🌍 [TIMEZONE] Hora actual UTC: " + java.time.Instant.now());
        };
    }
}