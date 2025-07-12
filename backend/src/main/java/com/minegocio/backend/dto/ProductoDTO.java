package com.minegocio.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductoDTO {
    
    private Long id;
    
    @NotBlank(message = "El nombre del producto es requerido")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    private String nombre;
    
    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    private String descripcion;
    
    @NotNull(message = "El precio es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio debe ser mayor a 0")
    private BigDecimal precio;
    
    @NotNull(message = "El stock es requerido")
    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock;
    
    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    private Integer stockMinimo;
    
    @Size(max = 255, message = "La URL de la imagen no puede exceder 255 caracteres")
    private String imagenUrl;
    
    // Lista de URLs de imágenes
    private List<String> imagenes;
    
    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    private String categoria;
    
    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    private String marca;
    
    @Size(max = 50, message = "La unidad no puede exceder 50 caracteres")
    private String unidad;
    
    @Size(max = 100, message = "El sector de almacenamiento no puede exceder 100 caracteres")
    private String sectorAlmacenamiento;
    
    @Size(max = 50, message = "El código personalizado no puede exceder 50 caracteres")
    private String codigoPersonalizado;
    
    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    private String codigoBarras;
    
    private Boolean activo;
    
    private Boolean destacado;
    
    private Long empresaId;
    
    private String empresaNombre;
    
    // Nuevos campos para las fechas
    private LocalDateTime fechaCreacion;
    
    private LocalDateTime fechaActualizacion;
    
    // Constructores
    public ProductoDTO() {}
    
    public ProductoDTO(Long id, String nombre, String descripcion, BigDecimal precio, 
                      Integer stock, Integer stockMinimo, String imagenUrl, String categoria, 
                      String marca, Boolean activo, Boolean destacado, Long empresaId, String empresaNombre, 
                      LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.stockMinimo = stockMinimo;
        this.imagenUrl = imagenUrl;
        this.categoria = categoria;
        this.marca = marca;
        this.activo = activo;
        this.destacado = destacado;
        this.empresaId = empresaId;
        this.empresaNombre = empresaNombre;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
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
    
    public Integer getStockMinimo() {
        return stockMinimo;
    }
    
    public void setStockMinimo(Integer stockMinimo) {
        this.stockMinimo = stockMinimo;
    }
    
    public String getImagenUrl() {
        return imagenUrl;
    }
    
    public void setImagenUrl(String imagenUrl) {
        this.imagenUrl = imagenUrl;
    }
    
    public List<String> getImagenes() {
        return imagenes;
    }
    
    public void setImagenes(List<String> imagenes) {
        this.imagenes = imagenes;
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
    
    public String getUnidad() {
        return unidad;
    }
    
    public void setUnidad(String unidad) {
        this.unidad = unidad;
    }
    
    public String getSectorAlmacenamiento() {
        return sectorAlmacenamiento;
    }
    
    public void setSectorAlmacenamiento(String sectorAlmacenamiento) {
        this.sectorAlmacenamiento = sectorAlmacenamiento;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public String getCodigoBarras() {
        return codigoBarras;
    }
    
    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }
    
    public Boolean getActivo() {
        return activo;
    }
    
    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
    
    public Boolean getDestacado() {
        return destacado;
    }
    
    public void setDestacado(Boolean destacado) {
        this.destacado = destacado;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public String getEmpresaNombre() {
        return empresaNombre;
    }
    
    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    @Override
    public String toString() {
        return "ProductoDTO{" +
                "id=" + id +
                ", nombre='" + nombre + '\'' +
                ", descripcion='" + descripcion + '\'' +
                ", precio=" + precio +
                ", stock=" + stock +
                ", stockMinimo=" + stockMinimo +
                ", imagenUrl='" + imagenUrl + '\'' +
                ", imagenes=" + imagenes +
                ", categoria='" + categoria + '\'' +
                ", marca='" + marca + '\'' +
                ", activo=" + activo +
                ", destacado=" + destacado +
                ", empresaId=" + empresaId +
                ", empresaNombre='" + empresaNombre + '\'' +
                ", fechaCreacion=" + fechaCreacion +
                ", fechaActualizacion=" + fechaActualizacion +
                '}';
    }
}
