package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "cierre_dia")
public class CierreDia {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;
    
    @Column(name = "fecha", nullable = false)
    private LocalDate fecha;
    
    @Column(name = "stock_inicial_total")
    private Integer stockInicialTotal;
    
    @Column(name = "ingresos_total")
    private Integer ingresosTotal;
    
    @Column(name = "devoluciones_total")
    private Integer devolucionesTotal;
    
    @Column(name = "salidas_total")
    private Integer salidasTotal;
    
    @Column(name = "roturas_total")
    private Integer roturasTotal;
    
    @Column(name = "balance_final_total")
    private Integer balanceFinalTotal;
    
    @Column(name = "cerrado")
    private Boolean cerrado;
    
    @Column(name = "fecha_cierre")
    private LocalDateTime fechaCierre;
    
    @Column(name = "fecha_creacion")
    private LocalDateTime fechaCreacion;
    
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @OneToMany(mappedBy = "cierreDia", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetalleCierreDia> detalles;
    
    // Constructores
    public CierreDia() {}
    
    public CierreDia(Long empresaId, LocalDate fecha) {
        this.empresaId = empresaId;
        this.fecha = fecha;
        this.cerrado = false;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public LocalDate getFecha() {
        return fecha;
    }
    
    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }
    
    public Integer getStockInicialTotal() {
        return stockInicialTotal;
    }
    
    public void setStockInicialTotal(Integer stockInicialTotal) {
        this.stockInicialTotal = stockInicialTotal;
    }
    
    public Integer getIngresosTotal() {
        return ingresosTotal;
    }
    
    public void setIngresosTotal(Integer ingresosTotal) {
        this.ingresosTotal = ingresosTotal;
    }
    
    public Integer getDevolucionesTotal() {
        return devolucionesTotal;
    }
    
    public void setDevolucionesTotal(Integer devolucionesTotal) {
        this.devolucionesTotal = devolucionesTotal;
    }
    
    public Integer getSalidasTotal() {
        return salidasTotal;
    }
    
    public void setSalidasTotal(Integer salidasTotal) {
        this.salidasTotal = salidasTotal;
    }
    
    public Integer getRoturasTotal() {
        return roturasTotal;
    }
    
    public void setRoturasTotal(Integer roturasTotal) {
        this.roturasTotal = roturasTotal;
    }
    
    public Integer getBalanceFinalTotal() {
        return balanceFinalTotal;
    }
    
    public void setBalanceFinalTotal(Integer balanceFinalTotal) {
        this.balanceFinalTotal = balanceFinalTotal;
    }
    
    public Boolean getCerrado() {
        return cerrado;
    }
    
    public void setCerrado(Boolean cerrado) {
        this.cerrado = cerrado;
    }
    
    public LocalDateTime getFechaCierre() {
        return fechaCierre;
    }
    
    public void setFechaCierre(LocalDateTime fechaCierre) {
        this.fechaCierre = fechaCierre;
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
    
    public List<DetalleCierreDia> getDetalles() {
        return detalles;
    }
    
    public void setDetalles(List<DetalleCierreDia> detalles) {
        this.detalles = detalles;
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}
