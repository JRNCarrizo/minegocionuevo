package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "detalle_cierre_dia")
public class DetalleCierreDia {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cierre_dia_id", nullable = false)
    private CierreDia cierreDia;
    
    @Column(name = "producto_id", nullable = false)
    private Long productoId;
    
    @Column(name = "nombre_producto", nullable = false)
    private String nombreProducto;
    
    @Column(name = "codigo_personalizado")
    private String codigoPersonalizado;
    
    @Column(name = "tipo_movimiento", nullable = false)
    @Enumerated(EnumType.STRING)
    private TipoMovimiento tipoMovimiento;
    
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    
    @Column(name = "observaciones")
    private String observaciones;
    
    @Column(name = "fecha_movimiento")
    private LocalDateTime fechaMovimiento;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    // Enum para tipos de movimiento
    public enum TipoMovimiento {
        STOCK_INICIAL,
        INGRESO,
        DEVOLUCION,
        SALIDA,
        ROTURA,
        BALANCE_FINAL
    }
    
    // Constructores
    public DetalleCierreDia() {}
    
    public DetalleCierreDia(CierreDia cierreDia, Long productoId, String nombreProducto, 
                           String codigoPersonalizado, TipoMovimiento tipoMovimiento, 
                           Integer cantidad, String observaciones) {
        this.cierreDia = cierreDia;
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.codigoPersonalizado = codigoPersonalizado;
        this.tipoMovimiento = tipoMovimiento;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
        this.fechaCreacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public CierreDia getCierreDia() {
        return cierreDia;
    }
    
    public void setCierreDia(CierreDia cierreDia) {
        this.cierreDia = cierreDia;
    }
    
    public Long getProductoId() {
        return productoId;
    }
    
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    
    public String getNombreProducto() {
        return nombreProducto;
    }
    
    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public TipoMovimiento getTipoMovimiento() {
        return tipoMovimiento;
    }
    
    public void setTipoMovimiento(TipoMovimiento tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    public LocalDateTime getFechaMovimiento() {
        return fechaMovimiento;
    }
    
    public void setFechaMovimiento(LocalDateTime fechaMovimiento) {
        this.fechaMovimiento = fechaMovimiento;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}
