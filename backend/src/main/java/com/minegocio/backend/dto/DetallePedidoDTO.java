package com.minegocio.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class DetallePedidoDTO {
    
    private Long id;
    
    @NotNull(message = "El ID del producto es requerido")
    private Long productoId;
    
    private String productoNombre;
    
    private String productoDescripcion;
    
    private String productoImagen; // URL de la imagen principal
    
    private String productoCategoria;
    
    private String productoMarca; // Agregar campo para la marca
    
    private BigDecimal productoPrecionUnitario;
    
    @NotNull(message = "La cantidad es requerida")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;
    
    @NotNull(message = "El precio unitario es requerido")
    @DecimalMin(value = "0.0", inclusive = false, message = "El precio unitario debe ser mayor a 0")
    private BigDecimal precioUnitario;
    
    private BigDecimal subtotal;
    
    // Constructores
    public DetallePedidoDTO() {}
    
    public DetallePedidoDTO(Long id, Long productoId, String productoNombre, 
                           String productoDescripcion, String productoImagen, String productoCategoria,
                           String productoMarca, BigDecimal productoPrecionUnitario, Integer cantidad, 
                           BigDecimal precioUnitario, BigDecimal subtotal) {
        this.id = id;
        this.productoId = productoId;
        this.productoNombre = productoNombre;
        this.productoDescripcion = productoDescripcion;
        this.productoImagen = productoImagen;
        this.productoCategoria = productoCategoria;
        this.productoMarca = productoMarca;
        this.productoPrecionUnitario = productoPrecionUnitario;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getProductoId() {
        return productoId;
    }
    
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    
    public String getProductoNombre() {
        return productoNombre;
    }
    
    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }
    
    public String getProductoDescripcion() {
        return productoDescripcion;
    }
    
    public void setProductoDescripcion(String productoDescripcion) {
        this.productoDescripcion = productoDescripcion;
    }
    
    public String getProductoImagen() {
        return productoImagen;
    }
    
    public void setProductoImagen(String productoImagen) {
        this.productoImagen = productoImagen;
    }
    
    public String getProductoCategoria() {
        return productoCategoria;
    }
    
    public void setProductoCategoria(String productoCategoria) {
        this.productoCategoria = productoCategoria;
    }
    
    public String getProductoMarca() {
        return productoMarca;
    }
    
    public void setProductoMarca(String productoMarca) {
        this.productoMarca = productoMarca;
    }
    
    public BigDecimal getProductoPrecionUnitario() {
        return productoPrecionUnitario;
    }
    
    public void setProductoPrecionUnitario(BigDecimal productoPrecionUnitario) {
        this.productoPrecionUnitario = productoPrecionUnitario;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }
    
    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }
    
    public BigDecimal getSubtotal() {
        return subtotal;
    }
    
    public void setSubtotal(BigDecimal subtotal) {
        this.subtotal = subtotal;
    }
}
