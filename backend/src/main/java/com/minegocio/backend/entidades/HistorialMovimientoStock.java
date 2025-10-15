package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historial_movimientos_stock")
public class HistorialMovimientoStock {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_origen_id")
    private Sector sectorOrigen;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_destino_id")
    private Sector sectorDestino;
    
    @Column(nullable = false)
    private Integer cantidad;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoMovimiento tipoMovimiento;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;
    
    @Column(nullable = false)
    private LocalDateTime fechaMovimiento;
    
    @Column(columnDefinition = "TEXT")
    private String observaciones;
    
    // Enums
    public enum TipoMovimiento {
        TRANSFERENCIA("Transferencia"),
        RECEPCION("Recepción"),
        ASIGNACION("Asignación"),
        REMOCION("Remoción");
        
        private final String descripcion;
        
        TipoMovimiento(String descripcion) {
            this.descripcion = descripcion;
        }
        
        public String getDescripcion() {
            return descripcion;
        }
    }
    
    // Constructores
    public HistorialMovimientoStock() {}
    
    public HistorialMovimientoStock(Producto producto, Sector sectorOrigen, Sector sectorDestino, 
                                  Integer cantidad, TipoMovimiento tipoMovimiento, Usuario usuario, 
                                  Empresa empresa, String observaciones) {
        this.producto = producto;
        this.sectorOrigen = sectorOrigen;
        this.sectorDestino = sectorDestino;
        this.cantidad = cantidad;
        this.tipoMovimiento = tipoMovimiento;
        this.usuario = usuario;
        this.empresa = empresa;
        this.fechaMovimiento = LocalDateTime.now();
        this.observaciones = observaciones;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Producto getProducto() {
        return producto;
    }
    
    public void setProducto(Producto producto) {
        this.producto = producto;
    }
    
    public Sector getSectorOrigen() {
        return sectorOrigen;
    }
    
    public void setSectorOrigen(Sector sectorOrigen) {
        this.sectorOrigen = sectorOrigen;
    }
    
    public Sector getSectorDestino() {
        return sectorDestino;
    }
    
    public void setSectorDestino(Sector sectorDestino) {
        this.sectorDestino = sectorDestino;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public TipoMovimiento getTipoMovimiento() {
        return tipoMovimiento;
    }
    
    public void setTipoMovimiento(TipoMovimiento tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }
    
    public Usuario getUsuario() {
        return usuario;
    }
    
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
    
    public Empresa getEmpresa() {
        return empresa;
    }
    
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }
    
    public LocalDateTime getFechaMovimiento() {
        return fechaMovimiento;
    }
    
    public void setFechaMovimiento(LocalDateTime fechaMovimiento) {
        this.fechaMovimiento = fechaMovimiento;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
