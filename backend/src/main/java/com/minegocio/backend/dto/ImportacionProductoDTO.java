package com.minegocio.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * DTO para la importación masiva de productos desde Excel
 */
public class ImportacionProductoDTO {
    
    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String nombre;
    
    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;
    
    // Precio opcional - puede ser null
    private BigDecimal precio;
    
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock = 0;
    
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo = 0;
    
    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    private String categoria;
    
    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    private String marca;
    
    @Size(max = 100, message = "El sector de almacenamiento no puede exceder 100 caracteres")
    private String sectorAlmacenamiento;
    
    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    private String codigoBarras;
    
    @Size(max = 50, message = "El código personalizado no puede exceder 50 caracteres")
    private String codigoPersonalizado;
    
    private String estado = "Activo"; // Por defecto activo
    
    // Constructores
    public ImportacionProductoDTO() {}
    
    public ImportacionProductoDTO(String nombre, String descripcion, BigDecimal precio, 
                                 Integer stock, String categoria, String marca, String sectorAlmacenamiento, 
                                 String codigoBarras, String codigoPersonalizado) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.categoria = categoria;
        this.marca = marca;
        this.sectorAlmacenamiento = sectorAlmacenamiento;
        this.codigoBarras = codigoBarras;
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public ImportacionProductoDTO(String nombre, String descripcion, BigDecimal precio, 
                                 Integer stock, Integer stockMinimo, String categoria, String marca, 
                                 String sectorAlmacenamiento, String codigoBarras, String codigoPersonalizado, 
                                 String estado) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.stockMinimo = stockMinimo;
        this.categoria = categoria;
        this.marca = marca;
        this.sectorAlmacenamiento = sectorAlmacenamiento;
        this.codigoBarras = codigoBarras;
        this.codigoPersonalizado = codigoPersonalizado;
        this.estado = estado != null ? estado : "Activo";
    }
    
    // Getters y Setters
    public String getNombre() {
        return nombre;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    public BigDecimal getPrecio() {
        return precio;
    }
    
    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }
    
    public Integer getStock() {
        return stock;
    }
    
    public void setStock(Integer stock) {
        this.stock = stock;
    }
    
    public String getCategoria() {
        return categoria;
    }
    
    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }
    
    public String getMarca() {
        return marca;
    }
    
    public void setMarca(String marca) {
        this.marca = marca;
    }
    
    public String getSectorAlmacenamiento() {
        return sectorAlmacenamiento;
    }

    public void setSectorAlmacenamiento(String sectorAlmacenamiento) {
        this.sectorAlmacenamiento = sectorAlmacenamiento;
    }
    
    public String getCodigoBarras() {
        return codigoBarras;
    }
    
    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public Integer getStockMinimo() {
        return stockMinimo;
    }
    
    public void setStockMinimo(Integer stockMinimo) {
        this.stockMinimo = stockMinimo;
    }
    
    public String getEstado() {
        return estado;
    }
    
    public void setEstado(String estado) {
        this.estado = estado;
    }
    
    @Override
    public String toString() {
        return "ImportacionProductoDTO{" +
                "nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", precio=" + precio +
                ", stock=" + stock +
                ", stockMinimo=" + stockMinimo +
                ", categoria='" + categoria + '\'' +
                ", marca='" + marca + '\'' +
                ", sectorAlmacenamiento='" + sectorAlmacenamiento + '\'' +
                ", codigoBarras='" + codigoBarras + '\'' +
                ", codigoPersonalizado='" + codigoPersonalizado + '\'' +
                ", estado='" + estado + '\'' +
                '}';
    }
}
