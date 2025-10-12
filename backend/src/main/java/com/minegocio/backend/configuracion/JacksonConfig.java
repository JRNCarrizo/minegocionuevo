package com.minegocio.backend.configuracion;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Configuration
public class JacksonConfig {

    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

    /**
     * Serializador personalizado que convierte LocalDateTime a formato ISO sin 'Z'
     * Las fechas se interpretan como locales del servidor (UTC en Railway)
     */
    public static class LocalDateTimeSerializerSinZ extends JsonSerializer<LocalDateTime> {
        private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
        
        @Override
        public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
            if (value != null) {
                gen.writeString(value.format(formatter));
            }
        }
    }

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        System.out.println("🔧 [JACKSON] Configurando ObjectMapper con serializador de fechas locales...");
        
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Configurar módulo para Java Time
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
        
        // Usar serializador personalizado y deserializador simples
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializerSinZ());
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter));
        
        // Registrar el módulo
        objectMapper.registerModule(javaTimeModule);
        
        // Configuraciones básicas
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATES_WITH_ZONE_ID);
        
        System.out.println("🔧 [JACKSON] ObjectMapper configurado exitosamente");
        System.out.println("📅 Formato de fechas: " + DATETIME_FORMAT + " (interpretado como hora del servidor)");
        
        return objectMapper;
    }
}
