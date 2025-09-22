package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.ConteoSector;
import java.time.LocalDateTime;

public class ConteoSectorDTO {
    private Long id;
    private Long sectorId;
    private String sectorNombre;
    private String sectorDescripcion;
    private Long usuario1Id;
    private String usuario1Nombre;
    private Long usuario2Id;
    private String usuario2Nombre;
    private String estado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFinalizacion;
    private Double porcentajeCompletado;
    private Integer productosContados;
    private Integer totalProductos;
    private Integer productosConDiferencias;
    private InventarioCompletoInfo inventarioCompleto;
    
    // Nuevos campos específicos por usuario
    private String estadoUsuario1;
    private String estadoUsuario2;
    private LocalDateTime fechaInicioUsuario1;
    private LocalDateTime fechaInicioUsuario2;
    private Integer productosContadosUsuario1;
    private Integer productosContadosUsuario2;
    
    // Campos de finalización
    private Boolean conteo1Finalizado;
    private Boolean conteo2Finalizado;

    public ConteoSectorDTO() {}

    public ConteoSectorDTO(ConteoSector conteoSector) {
        this.id = conteoSector.getId();
        this.sectorId = conteoSector.getSector() != null ? conteoSector.getSector().getId() : null;
        this.sectorNombre = conteoSector.getNombreSector();
        this.sectorDescripcion = conteoSector.getDescripcion();
        
        if (conteoSector.getUsuarioAsignado1() != null) {
            this.usuario1Id = conteoSector.getUsuarioAsignado1().getId();
            this.usuario1Nombre = conteoSector.getUsuarioAsignado1().getNombre() + " " + conteoSector.getUsuarioAsignado1().getApellidos();
        }
        
        if (conteoSector.getUsuarioAsignado2() != null) {
            this.usuario2Id = conteoSector.getUsuarioAsignado2().getId();
            this.usuario2Nombre = conteoSector.getUsuarioAsignado2().getNombre() + " " + conteoSector.getUsuarioAsignado2().getApellidos();
        }
        
        this.estado = conteoSector.getEstado().name();
        this.fechaInicio = conteoSector.getFechaCreacion(); // Usamos fecha de creación como fecha de inicio
        this.fechaFinalizacion = conteoSector.getFechaFinalizacion();
        this.porcentajeCompletado = conteoSector.getPorcentajeCompletado();
        this.productosContados = conteoSector.getProductosContados();
        this.totalProductos = 0; // Ya no tenemos este campo
        this.productosConDiferencias = conteoSector.getProductosConDiferencias();
        
        // Nuevos campos específicos por usuario
        System.out.println("🔍 DEBUG ConteoSectorDTO - Construyendo DTO:");
        System.out.println("  - Estado Usuario 1: " + conteoSector.getEstadoUsuario1());
        System.out.println("  - Estado Usuario 2: " + conteoSector.getEstadoUsuario2());
        System.out.println("  - Productos contados Usuario 1: " + conteoSector.getProductosContadosUsuario1());
        System.out.println("  - Productos contados Usuario 2: " + conteoSector.getProductosContadosUsuario2());
        
        // Los estados por usuario se determinarán en el servicio que construye el DTO
        this.estadoUsuario1 = "PENDIENTE"; // Valor por defecto, se actualizará en el servicio
        this.estadoUsuario2 = "PENDIENTE"; // Valor por defecto, se actualizará en el servicio
        this.fechaInicioUsuario1 = conteoSector.getFechaInicioUsuario1();
        this.fechaInicioUsuario2 = conteoSector.getFechaInicioUsuario2();
        this.productosContadosUsuario1 = conteoSector.getProductosContadosUsuario1();
        this.productosContadosUsuario2 = conteoSector.getProductosContadosUsuario2();
        
        // Campos de finalización
        this.conteo1Finalizado = conteoSector.isConteo1Finalizado();
        this.conteo2Finalizado = conteoSector.isConteo2Finalizado();
        
        System.out.println("  - DTO Estado Usuario 1: " + this.estadoUsuario1);
        System.out.println("  - DTO Estado Usuario 2: " + this.estadoUsuario2);
        System.out.println("  - DTO Productos contados Usuario 1: " + this.productosContadosUsuario1);
        System.out.println("  - DTO Productos contados Usuario 2: " + this.productosContadosUsuario2);
        System.out.println("  - DTO Conteo 1 Finalizado: " + this.conteo1Finalizado);
        System.out.println("  - DTO Conteo 2 Finalizado: " + this.conteo2Finalizado);
        
        // Agregar información del inventario completo
        if (conteoSector.getInventarioCompleto() != null) {
            this.inventarioCompleto = new InventarioCompletoInfo(
                conteoSector.getInventarioCompleto().getId(),
                conteoSector.getInventarioCompleto().getEmpresa().getId()
            );
        }
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSectorId() {
        return sectorId;
    }

    public void setSectorId(Long sectorId) {
        this.sectorId = sectorId;
    }

    public String getSectorNombre() {
        return sectorNombre;
    }

    public void setSectorNombre(String sectorNombre) {
        this.sectorNombre = sectorNombre;
    }

    public String getSectorDescripcion() {
        return sectorDescripcion;
    }

    public void setSectorDescripcion(String sectorDescripcion) {
        this.sectorDescripcion = sectorDescripcion;
    }

    public Long getUsuario1Id() {
        return usuario1Id;
    }

    public void setUsuario1Id(Long usuario1Id) {
        this.usuario1Id = usuario1Id;
    }

    public String getUsuario1Nombre() {
        return usuario1Nombre;
    }

    public void setUsuario1Nombre(String usuario1Nombre) {
        this.usuario1Nombre = usuario1Nombre;
    }

    public Long getUsuario2Id() {
        return usuario2Id;
    }

    public void setUsuario2Id(Long usuario2Id) {
        this.usuario2Id = usuario2Id;
    }

    public String getUsuario2Nombre() {
        return usuario2Nombre;
    }

    public void setUsuario2Nombre(String usuario2Nombre) {
        this.usuario2Nombre = usuario2Nombre;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaFinalizacion() {
        return fechaFinalizacion;
    }

    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) {
        this.fechaFinalizacion = fechaFinalizacion;
    }

    public Double getPorcentajeCompletado() {
        return porcentajeCompletado;
    }

    public void setPorcentajeCompletado(Double porcentajeCompletado) {
        this.porcentajeCompletado = porcentajeCompletado;
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

    public InventarioCompletoInfo getInventarioCompleto() {
        return inventarioCompleto;
    }

    public void setInventarioCompleto(InventarioCompletoInfo inventarioCompleto) {
        this.inventarioCompleto = inventarioCompleto;
    }

    // Getters y Setters para los nuevos campos específicos por usuario
    public String getEstadoUsuario1() {
        return estadoUsuario1;
    }

    public void setEstadoUsuario1(String estadoUsuario1) {
        this.estadoUsuario1 = estadoUsuario1;
    }

    public String getEstadoUsuario2() {
        return estadoUsuario2;
    }

    public void setEstadoUsuario2(String estadoUsuario2) {
        this.estadoUsuario2 = estadoUsuario2;
    }

    public LocalDateTime getFechaInicioUsuario1() {
        return fechaInicioUsuario1;
    }

    public void setFechaInicioUsuario1(LocalDateTime fechaInicioUsuario1) {
        this.fechaInicioUsuario1 = fechaInicioUsuario1;
    }

    public LocalDateTime getFechaInicioUsuario2() {
        return fechaInicioUsuario2;
    }

    public void setFechaInicioUsuario2(LocalDateTime fechaInicioUsuario2) {
        this.fechaInicioUsuario2 = fechaInicioUsuario2;
    }

    public Integer getProductosContadosUsuario1() {
        return productosContadosUsuario1;
    }

    public void setProductosContadosUsuario1(Integer productosContadosUsuario1) {
        this.productosContadosUsuario1 = productosContadosUsuario1;
    }

    public Integer getProductosContadosUsuario2() {
        return productosContadosUsuario2;
    }

    public void setProductosContadosUsuario2(Integer productosContadosUsuario2) {
        this.productosContadosUsuario2 = productosContadosUsuario2;
    }

    public Boolean getConteo1Finalizado() {
        return conteo1Finalizado;
    }

    public void setConteo1Finalizado(Boolean conteo1Finalizado) {
        this.conteo1Finalizado = conteo1Finalizado;
    }

    public Boolean getConteo2Finalizado() {
        return conteo2Finalizado;
    }

    public void setConteo2Finalizado(Boolean conteo2Finalizado) {
        this.conteo2Finalizado = conteo2Finalizado;
    }

    // Clase interna para información del inventario completo
    public static class InventarioCompletoInfo {
        private Long id;
        private Long empresaId;

        public InventarioCompletoInfo() {}

        public InventarioCompletoInfo(Long id, Long empresaId) {
            this.id = id;
            this.empresaId = empresaId;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getEmpresaId() {
            return empresaId;
        }

        public void setEmpresaId(Long empresaId) {
            this.empresaId = empresaId;
        }
    }

    // Método para actualizar estados por usuario
    public void actualizarEstadosUsuario(String estadoUsuario1, String estadoUsuario2) {
        this.estadoUsuario1 = estadoUsuario1;
        this.estadoUsuario2 = estadoUsuario2;
    }
}