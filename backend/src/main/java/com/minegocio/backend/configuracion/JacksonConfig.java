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
import java.time.format.DateTimeParseException;

@Configuration
public class JacksonConfig {

    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        System.out.println("🔧 [JACKSON] Iniciando configuración de ObjectMapper...");
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Configurar módulo para Java Time
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Configurar serializador y deserializador para LocalDateTime
        // Usar deserializador personalizado que acepta ambos formatos
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter));
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter) {
            @Override
            public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
                String text = p.getText();
                if (text == null || text.trim().isEmpty()) {
                    return null;
                }
                
                try {
                    // Primero intentar con el formato simple
                    return LocalDateTime.parse(text, dateTimeFormatter);
                } catch (DateTimeParseException e1) {
                    try {
                        // Si falla, intentar con formato ISO completo (con 'Z')
                        return LocalDateTime.parse(text, DateTimeFormatter.ISO_DATE_TIME);
                    } catch (DateTimeParseException e2) {
                        // Si ambos fallan, intentar con formato ISO sin 'Z'
                        return LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    }
                }
            }
        });
        
        // Registrar el módulo
        objectMapper.registerModule(javaTimeModule);
        
        // Configuraciones adicionales
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATES_WITH_ZONE_ID);
        
        // NO configurar zona horaria para mantener fechas locales
        // objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        
        System.out.println("🔧 Jackson configurado para aceptar fechas con y sin 'Z'");
        System.out.println("🔧 [JACKSON] Configuración completada. ObjectMapper listo.");
        
        return objectMapper;
    }
}
