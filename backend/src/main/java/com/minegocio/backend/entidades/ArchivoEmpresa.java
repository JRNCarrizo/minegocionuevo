package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad para trackear archivos de almacenamiento de cada empresa
 */
@Entity
@Table(name = "archivos_empresa")
public class ArchivoEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(name = "url_archivo", nullable = false, length = 500)
    private String urlArchivo;

    @Column(name = "public_id", length = 200)
    private String publicId; // Cloudinary public_id

    @Column(name = "tipo_archivo", nullable = false, length = 50)
    private String tipoArchivo; // logo, producto, fondo

    @Column(name = "tamaño_bytes")
    private Long tamañoBytes;

    @Column(name = "tamaño_mb")
    private Double tamañoMB;

    @Column(name = "nombre_original", length = 200)
    private String nombreOriginal;

    @Column(name = "tipo_mime", length = 100)
    private String tipoMime;

    @Column(name = "activo")
    private Boolean activo = true;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public ArchivoEmpresa() {}

    public ArchivoEmpresa(Empresa empresa, String urlArchivo, String publicId, String tipoArchivo, Long tamañoBytes, String nombreOriginal, String tipoMime) {
        this.empresa = empresa;
        this.urlArchivo = urlArchivo;
        this.publicId = publicId;
        this.tipoArchivo = tipoArchivo;
        this.tamañoBytes = tamañoBytes;
        this.tamañoMB = tamañoBytes != null ? (double) tamañoBytes / (1024 * 1024) : 0.0;
        this.nombreOriginal = nombreOriginal;
        this.tipoMime = tipoMime;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public String getUrlArchivo() { return urlArchivo; }
    public void setUrlArchivo(String urlArchivo) { this.urlArchivo = urlArchivo; }

    public String getPublicId() { return publicId; }
    public void setPublicId(String publicId) { this.publicId = publicId; }

    public String getTipoArchivo() { return tipoArchivo; }
    public void setTipoArchivo(String tipoArchivo) { this.tipoArchivo = tipoArchivo; }

    public Long getTamañoBytes() { return tamañoBytes; }
    public void setTamañoBytes(Long tamañoBytes) { 
        this.tamañoBytes = tamañoBytes;
        this.tamañoMB = tamañoBytes != null ? (double) tamañoBytes / (1024 * 1024) : 0.0;
    }

    public Double getTamañoMB() { return tamañoMB; }
    public void setTamañoMB(Double tamañoMB) { this.tamañoMB = tamañoMB; }

    public String getNombreOriginal() { return nombreOriginal; }
    public void setNombreOriginal(String nombreOriginal) { this.nombreOriginal = nombreOriginal; }

    public String getTipoMime() { return tipoMime; }
    public void setTipoMime(String tipoMime) { this.tipoMime = tipoMime; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
