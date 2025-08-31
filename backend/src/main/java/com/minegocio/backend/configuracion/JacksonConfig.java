package com.minegocio.backend.configuracion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class JacksonConfig {

    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";
    private static final String DATETIME_FORMAT_WITH_Z = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        System.out.println("🔧 [JACKSON] Iniciando configuración de ObjectMapper...");
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Configurar módulo para Java Time
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Configurar serializador y deserializador para LocalDateTime
        // Usar formato ISO completo que incluye 'Z' para compatibilidad con frontend
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ISO_DATE_TIME;
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
        
        // Registrar el módulo
        objectMapper.registerModule(javaTimeModule);
        
        // Configuraciones adicionales
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATES_WITH_ZONE_ID);
        
        // NO configurar zona horaria UTC para mantener fechas locales
        // objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        
        System.out.println("🔧 Jackson configurado para usar fechas ISO completas (con 'Z')");
        System.out.println("🔧 [JACKSON] Configuración completada. ObjectMapper listo.");
        
        return objectMapper;
    }
}
