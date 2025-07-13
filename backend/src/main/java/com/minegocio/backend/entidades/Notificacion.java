package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
public class Notificacion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tipo", nullable = false)
    private String tipo; // PEDIDO_NUEVO, PRODUCTO_ACTUALIZADO, CLIENTE_NUEVO, PEDIDO_CANCELADO, VENTA_RAPIDA, STOCK_BAJO, PEDIDO_COMPLETADO, REPORTE_GENERADO
    
    @Column(name = "titulo", nullable = false)
    private String titulo;
    
    @Column(name = "descripcion", nullable = false)
    private String descripcion;
    
    @Column(name = "detalles")
    private String detalles; // JSON con información adicional
    
    @Column(name = "empresa_id", nullable = false)
    private Long empresaId;
    
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    
    @Column(name = "leida", nullable = false)
    private Boolean leida = false;
    
    @Column(name = "icono")
    private String icono;
    
    @Column(name = "color")
    private String color;
    
    // Constructor por defecto
    public Notificacion() {
        this.fechaCreacion = LocalDateTime.now();
        this.leida = false;
    }
    
    // Constructor con parámetros
    public Notificacion(String tipo, String titulo, String descripcion, Long empresaId) {
        this();
        this.tipo = tipo;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.empresaId = empresaId;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTipo() {
        return tipo;
    }
    
    public void setTipo(String tipo) {
        this.tipo = tipo;
    }
    
    public String getTitulo() {
        return titulo;
    }
    
    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
    
    public String getDetalles() {
        return detalles;
    }
    
    public void setDetalles(String detalles) {
        this.detalles = detalles;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public Boolean getLeida() {
        return leida;
    }
    
    public void setLeida(Boolean leida) {
        this.leida = leida;
    }
    
    public String getIcono() {
        return icono;
    }
    
    public void setIcono(String icono) {
        this.icono = icono;
    }
    
    public String getColor() {
        return color;
    }
    
    public void setColor(String color) {
        this.color = color;
    }
} 