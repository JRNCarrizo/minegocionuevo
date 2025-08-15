package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa las planillas de pedidos realizados
 */
@Entity
@Table(name = "planillas_pedidos")
public class PlanillaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_planilla", unique = true, nullable = false, length = 8)
    private String numeroPlanilla;

    @Column(length = 1000)
    private String observaciones;

    @NotNull(message = "La fecha de la planilla es obligatoria")
    @Column(name = "fecha_planilla", nullable = false)
    private LocalDate fechaPlanilla;

    @Min(value = 0, message = "El total de productos debe ser mayor o igual a 0")
    @Column(name = "total_productos", nullable = false)
    private Integer totalProductos = 0;

    // Relación con empresa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    // Usuario que creó la planilla
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Detalles de la planilla
    @OneToMany(mappedBy = "planillaPedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetallePlanillaPedido> detalles = new ArrayList<>();

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public PlanillaPedido() {}

    public PlanillaPedido(Empresa empresa, Usuario usuario, LocalDate fechaPlanilla) {
        this.empresa = empresa;
        this.usuario = usuario;
        this.fechaPlanilla = fechaPlanilla;
        this.numeroPlanilla = generarNumeroPlanilla();
    }

    // Métodos de utilidad
    public String generarNumeroPlanilla() {
        // Generar número de 8 dígitos basado en timestamp
        long timestamp = System.currentTimeMillis();
        String numero = String.valueOf(timestamp % 100000000); // Últimos 8 dígitos
        return String.format("%08d", Long.parseLong(numero));
    }

    public void calcularTotalProductos() {
        this.totalProductos = detalles.stream()
                .mapToInt(DetallePlanillaPedido::getCantidad)
                .sum();
    }

    public void agregarDetalle(DetallePlanillaPedido detalle) {
        detalles.add(detalle);
        detalle.setPlanillaPedido(this);
        calcularTotalProductos();
    }

    public void removerDetalle(DetallePlanillaPedido detalle) {
        detalles.remove(detalle);
        detalle.setPlanillaPedido(null);
        calcularTotalProductos();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPlanilla() { return numeroPlanilla; }
    public void setNumeroPlanilla(String numeroPlanilla) { this.numeroPlanilla = numeroPlanilla; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDate getFechaPlanilla() { return fechaPlanilla; }
    public void setFechaPlanilla(LocalDate fechaPlanilla) { this.fechaPlanilla = fechaPlanilla; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public List<DetallePlanillaPedido> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaPedido> detalles) { 
        this.detalles = detalles;
        calcularTotalProductos();
    }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
