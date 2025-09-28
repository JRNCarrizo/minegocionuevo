package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa el detalle de reconteo de un producto específico
 * Esta entidad almacena los reconteos sin modificar los datos originales
 */
@Entity
@Table(name = "reconteo_detalle")
public class ReconteoDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El conteo sector es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conteo_sector_id", nullable = false)
    private ConteoSector conteoSector;

    @NotNull(message = "El producto es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @NotNull(message = "El usuario es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(name = "numero_reconteo", nullable = false)
    private Integer numeroReconteo; // 1, 2, 3, etc.

    @Column(name = "cantidad_reconteo")
    private Integer cantidadReconteo;

    @Column(name = "formula_calculo", length = 500)
    private String formulaCalculo;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "eliminado", nullable = false)
    private Boolean eliminado = false;

    // Constructores
    public ReconteoDetalle() {
    }

    public ReconteoDetalle(ConteoSector conteoSector, Producto producto, Usuario usuario, Integer numeroReconteo) {
        this.conteoSector = conteoSector;
        this.producto = producto;
        this.usuario = usuario;
        this.numeroReconteo = numeroReconteo;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ConteoSector getConteoSector() {
        return conteoSector;
    }

    public void setConteoSector(ConteoSector conteoSector) {
        this.conteoSector = conteoSector;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Integer getNumeroReconteo() {
        return numeroReconteo;
    }

    public void setNumeroReconteo(Integer numeroReconteo) {
        this.numeroReconteo = numeroReconteo;
    }

    public Integer getCantidadReconteo() {
        return cantidadReconteo;
    }

    public void setCantidadReconteo(Integer cantidadReconteo) {
        this.cantidadReconteo = cantidadReconteo;
    }

    public String getFormulaCalculo() {
        return formulaCalculo;
    }

    public void setFormulaCalculo(String formulaCalculo) {
        this.formulaCalculo = formulaCalculo;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
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

    public Boolean getEliminado() {
        return eliminado;
    }

    public void setEliminado(Boolean eliminado) {
        this.eliminado = eliminado;
    }
}

