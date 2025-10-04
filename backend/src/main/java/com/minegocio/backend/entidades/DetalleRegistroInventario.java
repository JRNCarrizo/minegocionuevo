package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "detalles_registro_inventario")
public class DetalleRegistroInventario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registro_inventario_id", nullable = false)
    private RegistroInventario registroInventario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
    
    @Column(name = "nombre_producto", nullable = false)
    private String nombreProducto;
    
    @Column(name = "codigo_producto")
    private String codigoProducto;
    
    @Column(name = "stock_anterior", nullable = false)
    private Integer stockAnterior;
    
    @Column(name = "stock_nuevo", nullable = false)
    private Integer stockNuevo;
    
    @Column(name = "diferencia_stock", nullable = false)
    private Integer diferenciaStock;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;
    
    // Constructores
    public DetalleRegistroInventario() {}
    
    public DetalleRegistroInventario(RegistroInventario registroInventario, Producto producto,
                                   String nombreProducto, String codigoProducto,
                                   Integer stockAnterior, Integer stockNuevo,
                                   Integer diferenciaStock, String observaciones) {
        this.registroInventario = registroInventario;
        this.producto = producto;
        this.nombreProducto = nombreProducto;
        this.codigoProducto = codigoProducto;
        this.stockAnterior = stockAnterior;
        this.stockNuevo = stockNuevo;
        this.diferenciaStock = diferenciaStock;
        this.observaciones = observaciones;
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public RegistroInventario getRegistroInventario() { return registroInventario; }
    public void setRegistroInventario(RegistroInventario registroInventario) { this.registroInventario = registroInventario; }
    
    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }
    
    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }
    
    public String getCodigoProducto() { return codigoProducto; }
    public void setCodigoProducto(String codigoProducto) { this.codigoProducto = codigoProducto; }
    
    public Integer getStockAnterior() { return stockAnterior; }
    public void setStockAnterior(Integer stockAnterior) { this.stockAnterior = stockAnterior; }
    
    public Integer getStockNuevo() { return stockNuevo; }
    public void setStockNuevo(Integer stockNuevo) { this.stockNuevo = stockNuevo; }
    
    public Integer getDiferenciaStock() { return diferenciaStock; }
    public void setDiferenciaStock(Integer diferenciaStock) { this.diferenciaStock = diferenciaStock; }
    
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    
    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
