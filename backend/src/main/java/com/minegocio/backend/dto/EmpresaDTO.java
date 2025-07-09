package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.Empresa;

import java.time.LocalDateTime;

/**
 * DTO para mostrar información de la empresa
 */
public class EmpresaDTO {

    private Long id;
    private String nombre;
    private String subdominio;
    private String email;
    private String telefono;
    private String descripcion;
    private String logoUrl;
    private String colorPrimario;
    private String colorSecundario;
    private String moneda;
    private Empresa.EstadoSuscripcion estadoSuscripcion;
    private LocalDateTime fechaFinPrueba;
    private Boolean activa;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Estadísticas básicas
    private Long totalUsuarios;
    private Long totalProductos;
    private Long totalClientes;
    private Long totalPedidos;

    // Constructores
    public EmpresaDTO() {}

    public EmpresaDTO(Empresa empresa) {
        this.id = empresa.getId();
        this.nombre = empresa.getNombre();
        this.subdominio = empresa.getSubdominio();
        this.email = empresa.getEmail();
        this.telefono = empresa.getTelefono();
        this.descripcion = empresa.getDescripcion();
        this.logoUrl = empresa.getLogoUrl();
        this.colorPrimario = empresa.getColorPrimario();
        this.colorSecundario = empresa.getColorSecundario();
        this.moneda = empresa.getMoneda();
        this.estadoSuscripcion = empresa.getEstadoSuscripcion();
        this.fechaFinPrueba = empresa.getFechaFinPrueba();
        this.activa = empresa.getActiva();
        this.fechaCreacion = empresa.getFechaCreacion();
        this.fechaActualizacion = empresa.getFechaActualizacion();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getSubdominio() { return subdominio; }
    public void setSubdominio(String subdominio) { this.subdominio = subdominio; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getColorPrimario() { return colorPrimario; }
    public void setColorPrimario(String colorPrimario) { this.colorPrimario = colorPrimario; }

    public String getColorSecundario() { return colorSecundario; }
    public void setColorSecundario(String colorSecundario) { this.colorSecundario = colorSecundario; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public Empresa.EstadoSuscripcion getEstadoSuscripcion() { return estadoSuscripcion; }
    public void setEstadoSuscripcion(Empresa.EstadoSuscripcion estadoSuscripcion) { this.estadoSuscripcion = estadoSuscripcion; }

    public LocalDateTime getFechaFinPrueba() { return fechaFinPrueba; }
    public void setFechaFinPrueba(LocalDateTime fechaFinPrueba) { this.fechaFinPrueba = fechaFinPrueba; }

    public Boolean getActiva() { return activa; }
    public void setActiva(Boolean activa) { this.activa = activa; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public Long getTotalUsuarios() { return totalUsuarios; }
    public void setTotalUsuarios(Long totalUsuarios) { this.totalUsuarios = totalUsuarios; }

    public Long getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Long totalProductos) { this.totalProductos = totalProductos; }

    public Long getTotalClientes() { return totalClientes; }
    public void setTotalClientes(Long totalClientes) { this.totalClientes = totalClientes; }

    public Long getTotalPedidos() { return totalPedidos; }
    public void setTotalPedidos(Long totalPedidos) { this.totalPedidos = totalPedidos; }
}
