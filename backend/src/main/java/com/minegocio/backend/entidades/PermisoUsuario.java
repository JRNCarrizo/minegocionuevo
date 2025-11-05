package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa los permisos específicos de un usuario
 */
@Entity
@Table(name = "permisos_usuario")
public class PermisoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "funcionalidad", nullable = false, length = 100)
    private String funcionalidad;

    @Column(name = "permitido", nullable = false)
    private Boolean permitido = false;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public PermisoUsuario() {}

    public PermisoUsuario(Usuario usuario, String funcionalidad, Boolean permitido) {
        this.usuario = usuario;
        this.funcionalidad = funcionalidad;
        this.permitido = permitido;
    }

    // Enum para las secciones disponibles (acceso a cards)
    public enum Funcionalidad {
        PRODUCTOS("Productos"),
        CLIENTES("Clientes"),
        PEDIDOS("Pedidos"),
        CAJA_RAPIDA("Venta Rápida"),
        ESTADISTICAS("Estadísticas"),
        CONFIGURACION("Configuración"),
        GESTION_ADMINISTRADORES("Gestión de Administradores"),
        GESTION_EMPRESA("Gestión de Empresa"),
        CONSUMO_SUSCRIPCIONES("Consumo y Suscripciones"),
        // Sub-permisos de Gestión de Empresa
        CARGA_PLANILLAS("Carga de Planillas"),
        ROTURAS_PERDIDAS("Roturas y Pérdidas"),
        INGRESOS("Ingresos"),
        GESTION_RETORNOS("Gestión de Retornos"),
        GESTION_SECTORES("Gestión de Sectores"),
        GESTION_TRANSPORTISTAS("Gestión de Transportistas"),
        INVENTARIO_COMPLETO("Inventario Completo"),
        MOVIMIENTOS_DIA("Movimientos del Día");

        private final String descripcion;

        Funcionalidad(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public String getFuncionalidad() { return funcionalidad; }
    public void setFuncionalidad(String funcionalidad) { this.funcionalidad = funcionalidad; }

    public Boolean getPermitido() { return permitido; }
    public void setPermitido(Boolean permitido) { this.permitido = permitido; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
