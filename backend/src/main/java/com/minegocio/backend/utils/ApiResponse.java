package com.minegocio.backend.utils;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Clase utilitaria para manejar respuestas de la API de manera consistente
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private boolean success;
    private String mensaje;
    private T data;
    private String error;
    
    // Constructor por defecto
    public ApiResponse() {
    }
    
    // Constructor con parámetros
    public ApiResponse(boolean success, String mensaje, T data) {
        this.success = success;
        this.mensaje = mensaje;
        this.data = data;
    }
    
    // Constructor para respuestas de error
    public ApiResponse(boolean success, String error) {
        this.success = success;
        this.error = error;
    }
    
    // Métodos estáticos para crear respuestas exitosas
    public static <T> ApiResponse<T> success(String mensaje, T data) {
        return new ApiResponse<>(true, mensaje, data);
    }
    
    public static <T> ApiResponse<T> success(String mensaje) {
        return new ApiResponse<>(true, mensaje, null);
    }
    
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Operación exitosa", data);
    }
    
    // Métodos estáticos para crear respuestas de error
    public static <T> ApiResponse<T> error(String error) {
        return new ApiResponse<>(false, error);
    }
    
    public static <T> ApiResponse<T> error(String mensaje, String error) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMensaje(mensaje);
        response.setError(error);
        return response;
    }
    
    // Getters y Setters
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMensaje() {
        return mensaje;
    }
    
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public String getError() {
        return error;
    }
    
    public void setError(String error) {
        this.error = error;
    }
} 