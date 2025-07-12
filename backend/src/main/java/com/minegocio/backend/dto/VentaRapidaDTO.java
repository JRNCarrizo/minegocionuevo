package com.minegocio.backend.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO para crear ventas rápidas desde la caja
 */
public class VentaRapidaDTO {

    @NotEmpty(message = "El nombre del cliente es obligatorio")
    @Size(max = 100, message = "El nombre del cliente no puede exceder 100 caracteres")
    private String clienteNombre;

    @Size(max = 100, message = "El email del cliente no puede exceder 100 caracteres")
    private String clienteEmail;

    @NotNull(message = "El total es obligatorio")
    @DecimalMin(value = "0.01", message = "El total debe ser mayor a 0")
    private BigDecimal total;

    @NotNull(message = "El subtotal es obligatorio")
    @DecimalMin(value = "0.01", message = "El subtotal debe ser mayor a 0")
    private BigDecimal subtotal;

    @NotNull(message = "El método de pago es obligatorio")
    private String metodoPago;

    @DecimalMin(value = "0.0", message = "El monto recibido no puede ser negativo")
    private BigDecimal montoRecibido;

    @DecimalMin(value = "0.0", message = "El vuelto no puede ser negativo")
    private BigDecimal vuelto;

    @Size(max = 500, message = "Las observaciones no pueden exceder 500 caracteres")
    private String observaciones;

    @NotEmpty(message = "Los detalles de la venta son obligatorios")
    private List<DetalleVentaRapidaDTO> detalles;

    // Constructores
    public VentaRapidaDTO() {}

    public VentaRapidaDTO(String clienteNombre, String clienteEmail, BigDecimal total, 
                         BigDecimal subtotal, String metodoPago, BigDecimal montoRecibido, 
                         BigDecimal vuelto, String observaciones, List<DetalleVentaRapidaDTO> detalles) {
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.total = total;
        this.subtotal = subtotal;
        this.metodoPago = metodoPago;
        this.montoRecibido = montoRecibido;
        this.vuelto = vuelto;
        this.observaciones = observaciones;
        this.detalles = detalles;
    }

    // Getters y Setters
    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }

    public BigDecimal getVuelto() { return vuelto; }
    public void setVuelto(BigDecimal vuelto) { this.vuelto = vuelto; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public List<DetalleVentaRapidaDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVentaRapidaDTO> detalles) { this.detalles = detalles; }

    /**
     * DTO interno para los detalles de la venta rápida
     */
    public static class DetalleVentaRapidaDTO {
        @NotNull(message = "El ID del producto es obligatorio")
        private Long productoId;

        @NotEmpty(message = "El nombre del producto es obligatorio")
        @Size(max = 200, message = "El nombre del producto no puede exceder 200 caracteres")
        private String productoNombre;

        @NotNull(message = "La cantidad es obligatoria")
        @DecimalMin(value = "1", message = "La cantidad debe ser mayor a 0")
        private Integer cantidad;

        @NotNull(message = "El precio unitario es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio unitario debe ser mayor a 0")
        private BigDecimal precioUnitario;

        @NotNull(message = "El subtotal es obligatorio")
        @DecimalMin(value = "0.01", message = "El subtotal debe ser mayor a 0")
        private BigDecimal subtotal;

        // Constructores
        public DetalleVentaRapidaDTO() {}

        public DetalleVentaRapidaDTO(Long productoId, String productoNombre, Integer cantidad, 
                                   BigDecimal precioUnitario, BigDecimal subtotal) {
            this.productoId = productoId;
            this.productoNombre = productoNombre;
            this.cantidad = cantidad;
            this.precioUnitario = precioUnitario;
            this.subtotal = subtotal;
        }

        // Getters y Setters
        public Long getProductoId() { return productoId; }
        public void setProductoId(Long productoId) { this.productoId = productoId; }

        public String getProductoNombre() { return productoNombre; }
        public void setProductoNombre(String productoNombre) { this.productoNombre = productoNombre; }

        public Integer getCantidad() { return cantidad; }
        public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

        public BigDecimal getPrecioUnitario() { return precioUnitario; }
        public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    }
} 