package com.minegocio.backend.configuracion;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateTimeDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateTimeSerializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Configuration
public class JacksonConfig {

    private static final String DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        System.out.println("🔧 [JACKSON] ==========================================");
        System.out.println("🔧 [JACKSON] INICIANDO CONFIGURACIÓN DE JACKSON");
        System.out.println("🔧 [JACKSON] ==========================================");
        
        ObjectMapper objectMapper = new ObjectMapper();
        
        // Configurar módulo para Java Time
        JavaTimeModule javaTimeModule = new JavaTimeModule();
        
        // Configurar serializador y deserializador personalizados para LocalDateTime
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern(DATETIME_FORMAT);
        
        System.out.println("🔧 [JACKSON] Registrando serializador personalizado para LocalDateTime...");
        
        // Serializador personalizado que NO hace conversiones de zona horaria
        javaTimeModule.addSerializer(LocalDateTime.class, new LocalDateTimeSerializer(dateTimeFormatter) {
            @Override
            public void serialize(LocalDateTime value, JsonGenerator gen, SerializerProvider provider) throws IOException {
                System.out.println("🔧 [JACKSON] === SERIALIZADOR PERSONALIZADO EJECUTÁNDOSE ===");
                System.out.println("🔧 [JACKSON] Valor LocalDateTime a serializar: " + value);
                
                if (value == null) {
                    gen.writeNull();
                } else {
                    // Formatear como string local SIN conversiones de zona horaria
                    String formatted = value.format(dateTimeFormatter);
                    System.out.println("🔧 [JACKSON] Serializando fecha SIN conversión: " + value + " → " + formatted);
                    System.out.println("🔧 [JACKSON] Zona horaria del servidor: " + java.util.TimeZone.getDefault().getID());
                    System.out.println("🔧 [JACKSON] IMPORTANTE: NO se hace conversión UTC, se mantiene fecha local del usuario");
                    gen.writeString(formatted);
                }
            }
        });
        
        System.out.println("🔧 [JACKSON] Serializador personalizado registrado exitosamente");
        
        // Deserializador personalizado que acepta múltiples formatos
        javaTimeModule.addDeserializer(LocalDateTime.class, new LocalDateTimeDeserializer(dateTimeFormatter) {
            @Override
            public LocalDateTime deserialize(com.fasterxml.jackson.core.JsonParser p, com.fasterxml.jackson.databind.DeserializationContext ctxt) throws java.io.IOException {
                String text = p.getText();
                if (text == null || text.trim().isEmpty()) {
                    return null;
                }
                
                System.out.println("🔧 [JACKSON] Deserializando fecha: " + text);
                
                try {
                    // Primero intentar con el formato simple
                    LocalDateTime result = LocalDateTime.parse(text, dateTimeFormatter);
                    System.out.println("🔧 [JACKSON] Deserializado con formato simple: " + result);
                    return result;
                } catch (DateTimeParseException e1) {
                    try {
                        // Si falla, intentar con formato ISO completo (con 'Z')
                        LocalDateTime result = LocalDateTime.parse(text, DateTimeFormatter.ISO_DATE_TIME);
                        System.out.println("🔧 [JACKSON] Deserializado con formato ISO completo: " + result);
                        return result;
                    } catch (DateTimeParseException e2) {
                        // Si ambos fallan, intentar con formato ISO sin 'Z'
                        LocalDateTime result = LocalDateTime.parse(text, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                        System.out.println("🔧 [JACKSON] Deserializado con formato ISO local: " + result);
                        return result;
                    }
                }
            }
        });
        
        System.out.println("🔧 [JACKSON] Deserializador personalizado registrado exitosamente");
        
        // Registrar el módulo
        objectMapper.registerModule(javaTimeModule);
        
        System.out.println("🔧 [JACKSON] Módulo JavaTime registrado exitosamente");
        
        // Configuraciones adicionales - IMPORTANTE: NO hacer conversiones de zona horaria
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        objectMapper.disable(SerializationFeature.WRITE_DATES_WITH_ZONE_ID);
        
        System.out.println("🔧 [JACKSON] Configuraciones de serialización aplicadas");
        
        // NO configurar zona horaria para evitar conversiones automáticas
        // objectMapper.setTimeZone(java.util.TimeZone.getTimeZone("UTC"));
        
        System.out.println("🔧 [JACKSON] ==========================================");
        System.out.println("🔧 [JACKSON] CONFIGURACIÓN COMPLETADA EXITOSAMENTE");
        System.out.println("🔧 [JACKSON] ObjectMapper listo para usar");
        System.out.println("🔧 [JACKSON] ==========================================");
        
        return objectMapper;
    }
}
