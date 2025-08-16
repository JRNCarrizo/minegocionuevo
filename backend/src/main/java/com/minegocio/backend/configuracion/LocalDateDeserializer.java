package com.minegocio.backend.configuracion;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class LocalDateDeserializer extends JsonDeserializer<LocalDate> {
    
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    
    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String dateString = p.getText();
        System.out.println("🔍 Deserializando fecha: " + dateString);
        
        if (dateString == null || dateString.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Parsear la fecha como LocalDate directamente (sin zona horaria)
            // Esto asegura que la fecha se guarde exactamente como la envía el cliente
            LocalDate date = LocalDate.parse(dateString, FORMATTER);
            System.out.println("✅ Fecha deserializada correctamente: " + date);
            System.out.println("✅ Zona horaria del servidor: " + java.time.ZoneId.systemDefault());
            System.out.println("✅ Fecha actual del servidor: " + java.time.LocalDate.now());
            System.out.println("✅ Fecha que se va a guardar: " + date);
            return date;
        } catch (Exception e) {
            System.out.println("❌ Error deserializando fecha: " + dateString + " - " + e.getMessage());
            throw new IOException("Error parsing date: " + dateString, e);
        }
    }
}
