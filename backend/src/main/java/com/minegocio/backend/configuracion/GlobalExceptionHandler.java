package com.minegocio.backend.configuracion;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        System.err.println("❌ ERROR de deserialización JSON: " + ex.getMessage());
        System.err.println("❌ Causa: " + (ex.getCause() != null ? ex.getCause().getMessage() : "No hay causa"));
        ex.printStackTrace();
        
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Error al procesar los datos JSON: " + ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        System.err.println("❌ ERROR de tipo de argumento: " + ex.getMessage());
        System.err.println("❌ Nombre del parámetro: " + ex.getName());
        System.err.println("❌ Valor recibido: " + ex.getValue());
        System.err.println("❌ Tipo esperado: " + ex.getRequiredType());
        
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Error en el tipo de datos del parámetro '" + ex.getName() + "': " + ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        System.err.println("❌ ERROR de integridad referencial: " + ex.getMessage());
        ex.printStackTrace();
        
        // Verificar si es un error de integridad referencial
        String errorMessage = ex.getMessage();
        if (errorMessage != null && (
            errorMessage.contains("Referential integrity constraint violation") ||
            errorMessage.contains("FKFV2533EDPICKXPHXASYRU2Q9A") ||
            errorMessage.contains("PLANILLAS_DEVOLUCIONES") ||
            errorMessage.contains("FOREIGN KEY") ||
            errorMessage.contains("23503-224") ||
            errorMessage.contains("could not execute statement")
        )) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                    "error", "No se puede eliminar este administrador",
                    "mensaje", "El administrador tiene registros relacionados en el sistema (planillas, devoluciones, etc.). " +
                              "Para eliminar el administrador, primero debe desactivarlo y luego eliminar o reasignar todos sus registros relacionados. " +
                              "Alternativamente, puede usar la opción 'Desactivar' para mantener el historial."
                ));
        }
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", "Error de integridad de datos: " + ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        System.err.println("❌ ERROR genérico no manejado: " + ex.getMessage());
        ex.printStackTrace();
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Error interno del servidor: " + ex.getMessage()));
    }
}
