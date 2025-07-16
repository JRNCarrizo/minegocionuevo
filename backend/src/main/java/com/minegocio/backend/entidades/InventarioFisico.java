package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad que representa un inventario físico completo
 */
@Entity
@Table(name = "inventario_fisico")
public class InventarioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La empresa es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @NotNull(message = "El usuario es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @NotNull(message = "La fecha es obligatoria")
    @CreationTimestamp
    @Column(name = "fecha_inventario", updatable = false)
    private LocalDateTime fechaInventario;

    @Column(name = "total_productos")
    private Integer totalProductos;

    @Column(name = "productos_con_diferencias")
    private Integer productosConDiferencias;

    @Column(name = "valor_total_diferencias", precision = 10, scale = 2)
    private BigDecimal valorTotalDiferencias;

    @Column(name = "porcentaje_precision")
    private Double porcentajePrecision;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoInventario estado;

    @OneToMany(mappedBy = "inventarioFisico", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetalleInventarioFisico> detalles;

    // Enum para estados del inventario
    public enum EstadoInventario {
        EN_PROGRESO("En Progreso"),
        COMPLETADO("Completado");

        private final String descripcion;

        EstadoInventario(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Constructores
    public InventarioFisico() {}

    public InventarioFisico(Empresa empresa, Usuario usuario) {
        this.empresa = empresa;
        this.usuario = usuario;
        this.estado = EstadoInventario.EN_PROGRESO;
        this.fechaInventario = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public LocalDateTime getFechaInventario() { return fechaInventario; }
    public void setFechaInventario(LocalDateTime fechaInventario) { this.fechaInventario = fechaInventario; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public Integer getProductosConDiferencias() { return productosConDiferencias; }
    public void setProductosConDiferencias(Integer productosConDiferencias) { this.productosConDiferencias = productosConDiferencias; }

    public BigDecimal getValorTotalDiferencias() { return valorTotalDiferencias; }
    public void setValorTotalDiferencias(BigDecimal valorTotalDiferencias) { this.valorTotalDiferencias = valorTotalDiferencias; }

    public Double getPorcentajePrecision() { return porcentajePrecision; }
    public void setPorcentajePrecision(Double porcentajePrecision) { this.porcentajePrecision = porcentajePrecision; }

    public EstadoInventario getEstado() { return estado; }
    public void setEstado(EstadoInventario estado) { this.estado = estado; }

    public List<DetalleInventarioFisico> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleInventarioFisico> detalles) { this.detalles = detalles; }
} 