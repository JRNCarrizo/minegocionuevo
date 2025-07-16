package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.InventarioFisico;
import com.minegocio.backend.entidades.DetalleInventarioFisico;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class InventarioFisicoDTO {

    private Long id;
    private Long empresaId;
    private Long usuarioId;
    private String usuarioNombre;
    private LocalDateTime fechaInventario;
    private Integer totalProductos;
    private Integer productosConDiferencias;
    private BigDecimal valorTotalDiferencias;
    private Double porcentajePrecision;
    private String estado;
    private List<DetalleInventarioFisicoDTO> detalles;

    // Constructores
    public InventarioFisicoDTO() {}

    public InventarioFisicoDTO(InventarioFisico inventarioFisico) {
        this.id = inventarioFisico.getId();
        this.empresaId = inventarioFisico.getEmpresa().getId();
        this.usuarioId = inventarioFisico.getUsuario().getId();
        this.usuarioNombre = inventarioFisico.getUsuario().getNombre() + " " + inventarioFisico.getUsuario().getApellidos();
        this.fechaInventario = inventarioFisico.getFechaInventario();
        this.totalProductos = inventarioFisico.getTotalProductos();
        this.productosConDiferencias = inventarioFisico.getProductosConDiferencias();
        this.valorTotalDiferencias = inventarioFisico.getValorTotalDiferencias();
        this.porcentajePrecision = inventarioFisico.getPorcentajePrecision();
        this.estado = inventarioFisico.getEstado().name();
        
        if (inventarioFisico.getDetalles() != null) {
            this.detalles = inventarioFisico.getDetalles().stream()
                .map(DetalleInventarioFisicoDTO::new)
                .collect(Collectors.toList());
        }
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

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

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public List<DetalleInventarioFisicoDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleInventarioFisicoDTO> detalles) { this.detalles = detalles; }
} 