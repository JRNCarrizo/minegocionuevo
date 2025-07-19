package com.minegocio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para empresas top y rankings
 */
public class EmpresaTopDTO {

    private Long id;
    private String nombre;
    private String subdominio;
    private String email;
    private String logoUrl;
    private String planNombre;
    private BigDecimal ingresos;
    private Long totalProductos;
    private Long totalClientes;
    private Long totalPedidos;
    private LocalDateTime ultimaActividad;
    private String estadoSuscripcion;
    private Long diasRestantes;
    private Integer puntuacionActividad;

    // Constructores
    public EmpresaTopDTO() {}

    public EmpresaTopDTO(Long id, String nombre, String subdominio) {
        this.id = id;
        this.nombre = nombre;
        this.subdominio = subdominio;
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

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getPlanNombre() { return planNombre; }
    public void setPlanNombre(String planNombre) { this.planNombre = planNombre; }

    public BigDecimal getIngresos() { return ingresos; }
    public void setIngresos(BigDecimal ingresos) { this.ingresos = ingresos; }

    public Long getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Long totalProductos) { this.totalProductos = totalProductos; }

    public Long getTotalClientes() { return totalClientes; }
    public void setTotalClientes(Long totalClientes) { this.totalClientes = totalClientes; }

    public Long getTotalPedidos() { return totalPedidos; }
    public void setTotalPedidos(Long totalPedidos) { this.totalPedidos = totalPedidos; }

    public LocalDateTime getUltimaActividad() { return ultimaActividad; }
    public void setUltimaActividad(LocalDateTime ultimaActividad) { this.ultimaActividad = ultimaActividad; }

    public String getEstadoSuscripcion() { return estadoSuscripcion; }
    public void setEstadoSuscripcion(String estadoSuscripcion) { this.estadoSuscripcion = estadoSuscripcion; }

    public Long getDiasRestantes() { return diasRestantes; }
    public void setDiasRestantes(Long diasRestantes) { this.diasRestantes = diasRestantes; }

    public Integer getPuntuacionActividad() { return puntuacionActividad; }
    public void setPuntuacionActividad(Integer puntuacionActividad) { this.puntuacionActividad = puntuacionActividad; }
} 