package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa un conteo de inventario por sector
 */
@Entity
@Table(name = "conteo_sector")
public class ConteoSector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El inventario completo es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_completo_id", nullable = false)
    private InventarioCompleto inventarioCompleto;

    @NotNull(message = "El sector es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id", nullable = false)
    private Sector sector;

    @NotNull(message = "El nombre del sector es obligatorio")
    @Column(name = "nombre_sector", nullable = false, length = 255)
    private String nombreSector;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoConteo estado;

    @Column(name = "productos_contados")
    private Integer productosContados;

    @Column(name = "total_productos")
    private Integer totalProductos;

    @Column(name = "productos_con_diferencias")
    private Integer productosConDiferencias;

    @Column(name = "intentos_reconteo")
    private Integer intentosReconteo;

    @Column(name = "porcentaje_completado")
    private Double porcentajeCompletado;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @Column(name = "referencia_actual", length = 2000)
    private String referenciaActual;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignado_1_id")
    private Usuario usuarioAsignado1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignado_2_id")
    private Usuario usuarioAsignado2;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Enum para estados del conteo
    public enum EstadoConteo {
        PENDIENTE("Pendiente"),
        EN_PROGRESO("En Progreso"),
        ESPERANDO_VERIFICACION("Esperando Verificación"),
        CON_DIFERENCIAS("Con Diferencias"),
        COMPLETADO("Completado"),
        COMPLETADO_SIN_CONTEO("Completado sin Conteo"),
        CANCELADO("Cancelado");

        private final String descripcion;

        EstadoConteo(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Constructores
    public ConteoSector() {
        this.estado = EstadoConteo.PENDIENTE;
        this.productosContados = 0;
        this.totalProductos = 0;
        this.productosConDiferencias = 0;
        this.intentosReconteo = 0;
        this.porcentajeCompletado = 0.0;
    }

    public ConteoSector(InventarioCompleto inventarioCompleto, Sector sector) {
        this();
        this.inventarioCompleto = inventarioCompleto;
        this.sector = sector;
        this.nombreSector = sector != null ? sector.getNombre() : null;
        this.descripcion = sector != null ? sector.getDescripcion() : null;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public InventarioCompleto getInventarioCompleto() {
        return inventarioCompleto;
    }

    public void setInventarioCompleto(InventarioCompleto inventarioCompleto) {
        this.inventarioCompleto = inventarioCompleto;
    }

    public Sector getSector() {
        return sector;
    }

    public void setSector(Sector sector) {
        this.sector = sector;
        this.nombreSector = sector != null ? sector.getNombre() : null;
        this.descripcion = sector != null ? sector.getDescripcion() : null;
    }

    public String getNombreSector() {
        return nombreSector;
    }

    public void setNombreSector(String nombreSector) {
        this.nombreSector = nombreSector;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Usuario getUsuarioAsignado1() {
        return usuarioAsignado1;
    }

    public void setUsuarioAsignado1(Usuario usuarioAsignado1) {
        this.usuarioAsignado1 = usuarioAsignado1;
    }

    public Usuario getUsuarioAsignado2() {
        return usuarioAsignado2;
    }

    public void setUsuarioAsignado2(Usuario usuarioAsignado2) {
        this.usuarioAsignado2 = usuarioAsignado2;
    }


    public EstadoConteo getEstado() {
        return estado;
    }

    public void setEstado(EstadoConteo estado) {
        this.estado = estado;
    }

    public Integer getProductosContados() {
        return productosContados;
    }

    public void setProductosContados(Integer productosContados) {
        this.productosContados = productosContados;
    }

    public Integer getTotalProductos() {
        return totalProductos;
    }

    public void setTotalProductos(Integer totalProductos) {
        this.totalProductos = totalProductos;
    }

    public Integer getProductosConDiferencias() {
        return productosConDiferencias;
    }

    public void setProductosConDiferencias(Integer productosConDiferencias) {
        this.productosConDiferencias = productosConDiferencias;
    }

    public Integer getIntentosReconteo() {
        return intentosReconteo;
    }

    public void setIntentosReconteo(Integer intentosReconteo) {
        this.intentosReconteo = intentosReconteo;
    }

    public Double getPorcentajeCompletado() {
        return porcentajeCompletado;
    }

    public void setPorcentajeCompletado(Double porcentajeCompletado) {
        this.porcentajeCompletado = porcentajeCompletado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getReferenciaActual() {
        return referenciaActual;
    }

    public void setReferenciaActual(String referenciaActual) {
        this.referenciaActual = referenciaActual;
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

    // Métodos adicionales requeridos por el controlador y DTO
    public LocalDateTime getFechaFinalizacion() {
        return this.fechaActualizacion; // Usamos fecha de actualización como fecha de finalización
    }

    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) {
        this.fechaActualizacion = fechaFinalizacion;
    }

    public boolean isConteo1Finalizado() {
        // Por ahora, siempre devolver false
        // La lógica real requeriría acceso al repositorio de DetalleConteo
        // para verificar si el usuario 1 ha contado todos los productos del sector
        return false;
    }

    public boolean isConteo2Finalizado() {
        // Por ahora, siempre devolver false
        // La lógica real requeriría acceso al repositorio de DetalleConteo
        // para verificar si el usuario 2 ha contado todos los productos del sector
        return false;
    }

    public EstadoConteo getEstadoUsuario1() {
        // Lógica simple: si el conteo está en progreso, el usuario 1 también está en progreso
        // Esto se puede mejorar más adelante con lógica más específica
        return this.estado;
    }

    public EstadoConteo getEstadoUsuario2() {
        // Lógica simple: si el conteo está en progreso, el usuario 2 también está en progreso
        // Esto se puede mejorar más adelante con lógica más específica
        return this.estado;
    }

    // Métodos adicionales requeridos por el DTO
    public LocalDateTime getFechaInicioUsuario1() {
        // Por ahora retornamos la fecha de creación general
        return this.fechaCreacion;
    }

    public void setFechaInicioUsuario1(LocalDateTime fechaInicioUsuario1) {
        // Por ahora no implementamos lógica específica
    }

    public LocalDateTime getFechaInicioUsuario2() {
        // Por ahora retornamos la fecha de creación general
        return this.fechaCreacion;
    }

    public void setFechaInicioUsuario2(LocalDateTime fechaInicioUsuario2) {
        // Por ahora no implementamos lógica específica
    }

    public Integer getProductosContadosUsuario1() {
        // Por ahora retornamos el total de productos contados dividido por 2
        return this.productosContados != null ? this.productosContados / 2 : 0;
    }

    public void setProductosContadosUsuario1(Integer productosContadosUsuario1) {
        // Por ahora no implementamos lógica específica
    }

    public Integer getProductosContadosUsuario2() {
        // Por ahora retornamos el total de productos contados dividido por 2
        return this.productosContados != null ? this.productosContados / 2 : 0;
    }

    public void setProductosContadosUsuario2(Integer productosContadosUsuario2) {
        // Por ahora no implementamos lógica específica
    }


    // Métodos de utilidad
    public void actualizarPorcentajeCompletado() {
        // Este método será sobrescrito por el servicio con datos reales
        // Por ahora mantenemos el valor actual
        if (this.porcentajeCompletado == null) {
            this.porcentajeCompletado = 0.0;
        }
    }

    public boolean estaCompletado() {
        return EstadoConteo.COMPLETADO.equals(this.estado);
    }

    public boolean tieneDiferencias() {
        return EstadoConteo.CON_DIFERENCIAS.equals(this.estado);
    }

    @Override
    public String toString() {
        return "ConteoSector{" +
                "id=" + id +
                ", nombreSector=" + nombreSector +
                ", estado=" + estado +
                ", productosContados=" + productosContados +
                '}';
    }
}