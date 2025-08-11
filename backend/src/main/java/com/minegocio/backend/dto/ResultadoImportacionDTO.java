package com.minegocio.backend.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO para el resultado de la importación masiva de productos
 */
public class ResultadoImportacionDTO {
    
    private int totalRegistros;
    private int registrosExitosos;
    private int registrosConErrores;
    private List<Map<String, Object>> errores;
    private List<ImportacionProductoDTO> productosPreview;
    private String mensaje;
    
    // Constructores
    public ResultadoImportacionDTO() {}
    
    public ResultadoImportacionDTO(int totalRegistros, int registrosExitosos, 
                                  int registrosConErrores, List<Map<String, Object>> errores,
                                  List<ImportacionProductoDTO> productosPreview, String mensaje) {
        this.totalRegistros = totalRegistros;
        this.registrosExitosos = registrosExitosos;
        this.registrosConErrores = registrosConErrores;
        this.errores = errores;
        this.productosPreview = productosPreview;
        this.mensaje = mensaje;
    }
    
    // Getters y Setters
    public int getTotalRegistros() {
        return totalRegistros;
    }
    
    public void setTotalRegistros(int totalRegistros) {
        this.totalRegistros = totalRegistros;
    }
    
    public int getRegistrosExitosos() {
        return registrosExitosos;
    }
    
    public void setRegistrosExitosos(int registrosExitosos) {
        this.registrosExitosos = registrosExitosos;
    }
    
    public int getRegistrosConErrores() {
        return registrosConErrores;
    }
    
    public void setRegistrosConErrores(int registrosConErrores) {
        this.registrosConErrores = registrosConErrores;
    }
    
    public List<Map<String, Object>> getErrores() {
        return errores;
    }
    
    public void setErrores(List<Map<String, Object>> errores) {
        this.errores = errores;
    }
    
    public List<ImportacionProductoDTO> getProductosPreview() {
        return productosPreview;
    }
    
    public void setProductosPreview(List<ImportacionProductoDTO> productosPreview) {
        this.productosPreview = productosPreview;
    }
    
    public String getMensaje() {
        return mensaje;
    }
    
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
    
    @Override
    public String toString() {
        return "ResultadoImportacionDTO{" +
                "totalRegistros=" + totalRegistros +
                ", registrosExitosos=" + registrosExitosos +
                ", registrosConErrores=" + registrosConErrores +
                ", errores=" + errores +
                ", productosPreview=" + productosPreview +
                ", mensaje='" + mensaje + '\'' +
                '}';
    }
}
