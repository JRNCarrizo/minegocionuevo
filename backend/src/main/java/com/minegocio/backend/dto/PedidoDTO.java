package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.Pedido.EstadoPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PedidoDTO {
    
    private Long id;
    
    @NotNull(message = "El ID del cliente es requerido")
    private Long clienteId;
    
    private String clienteNombre;
    
    private String clienteEmail;
    
    private LocalDateTime fechaPedido;
    
    private EstadoPedido estado;
    
    private BigDecimal total;
    
    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
    
    @Size(max = 255, message = "La dirección de envío no puede exceder 255 caracteres")
    private String direccionEnvio;
    
    @NotEmpty(message = "El pedido debe tener al menos un detalle")
    @Valid
    private List<DetallePedidoDTO> detalles;
    
    private Long empresaId;
    
    private String empresaNombre;
    
    // Constructores
    public PedidoDTO() {}
    
    public PedidoDTO(Long id, Long clienteId, String clienteNombre, String clienteEmail,
                    LocalDateTime fechaPedido, EstadoPedido estado, BigDecimal total,
                    String notas, String direccionEnvio, List<DetallePedidoDTO> detalles,
                    Long empresaId, String empresaNombre) {
        this.id = id;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.fechaPedido = fechaPedido;
        this.estado = estado;
        this.total = total;
        this.notas = notas;
        this.direccionEnvio = direccionEnvio;
        this.detalles = detalles;
        this.empresaId = empresaId;
        this.empresaNombre = empresaNombre;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getClienteId() {
        return clienteId;
    }
    
    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }
    
    public String getClienteNombre() {
        return clienteNombre;
    }
    
    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }
    
    public String getClienteEmail() {
        return clienteEmail;
    }
    
    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }
    
    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    }
    
    public void setFechaPedido(LocalDateTime fechaPedido) {
        this.fechaPedido = fechaPedido;
    }
    
    public EstadoPedido getEstado() {
        return estado;
    }
    
    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
    }
    
    public BigDecimal getTotal() {
        return total;
    }
    
    public void setTotal(BigDecimal total) {
        this.total = total;
    }
    
    public String getNotas() {
        return notas;
    }
    
    public void setNotas(String notas) {
        this.notas = notas;
    }
    
    public String getDireccionEnvio() {
        return direccionEnvio;
    }
    
    public void setDireccionEnvio(String direccionEnvio) {
        this.direccionEnvio = direccionEnvio;
    }
    
    public List<DetallePedidoDTO> getDetalles() {
        return detalles;
    }
    
    public void setDetalles(List<DetallePedidoDTO> detalles) {
        this.detalles = detalles;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public String getEmpresaNombre() {
        return empresaNombre;
    }
    
    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }
}
