package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para el historial de ventas rápidas sin referencias circulares
 */
public class VentaRapidaHistorialDTO {
    private Long id;
    private String clienteNombre;
    private String clienteEmail;
    private BigDecimal total;
    private BigDecimal subtotal;
    private String metodoPago;
    private BigDecimal montoRecibido;
    private BigDecimal vuelto;
    private String observaciones;
    private String numeroComprobante;
    
    private String fechaVenta;
    
    private List<DetalleVentaRapidaHistorialDTO> detalles;

    // Constructores
    public VentaRapidaHistorialDTO() {}

    public VentaRapidaHistorialDTO(Long id, String clienteNombre, String clienteEmail, 
                                  BigDecimal total, BigDecimal subtotal, String metodoPago,
                                  BigDecimal montoRecibido, BigDecimal vuelto, String observaciones,
                                  String numeroComprobante, String fechaVenta) {
        this.id = id;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.total = total;
        this.subtotal = subtotal;
        this.metodoPago = metodoPago;
        this.montoRecibido = montoRecibido;
        this.vuelto = vuelto;
        this.observaciones = observaciones;
        this.numeroComprobante = numeroComprobante;
        this.fechaVenta = fechaVenta;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getNumeroComprobante() { return numeroComprobante; }
    public void setNumeroComprobante(String numeroComprobante) { this.numeroComprobante = numeroComprobante; }

    public String getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(String fechaVenta) { this.fechaVenta = fechaVenta; }

    public List<DetalleVentaRapidaHistorialDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVentaRapidaHistorialDTO> detalles) { this.detalles = detalles; }

    /**
     * DTO interno para los detalles del historial
     */
    public static class DetalleVentaRapidaHistorialDTO {
        private Long id;
        private String productoNombre;
        private Integer cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;

        // Constructores
        public DetalleVentaRapidaHistorialDTO() {}

        public DetalleVentaRapidaHistorialDTO(Long id, String productoNombre, Integer cantidad, 
                                            BigDecimal precioUnitario, BigDecimal subtotal) {
            this.id = id;
            this.productoNombre = productoNombre;
            this.cantidad = cantidad;
            this.precioUnitario = precioUnitario;
            this.subtotal = subtotal;
        }

        // Getters y Setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

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