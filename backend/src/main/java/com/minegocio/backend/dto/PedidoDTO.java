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
    
    // Cambiar fechaPedido por fechaCreacion para coincidir con el frontend
    private LocalDateTime fechaCreacion;
    
    private EstadoPedido estado;
    
    private BigDecimal total;
    
    @Size(max = 500, message = "Las notas no pueden exceder 500 caracteres")
    private String notas;
    
    @Size(max = 255, message = "La dirección de envío no puede exceder 255 caracteres")
    private String direccionEntrega; // Cambiar direccionEnvio por direccionEntrega
    
    @NotEmpty(message = "El pedido debe tener al menos un detalle")
    @Valid
    private List<DetallePedidoDTO> detalles;
    
    private Long empresaId;
    
    private String empresaNombre;
    
    // Agregar campos que espera el frontend
    private String numeroPedido;
    
    // Agregar objeto cliente para el modal
    private ClienteDTO cliente;
    
    // Constructores
    public PedidoDTO() {}
    
    public PedidoDTO(Long id, Long clienteId, String clienteNombre, String clienteEmail,
                    LocalDateTime fechaCreacion, EstadoPedido estado, BigDecimal total,
                    String notas, String direccionEntrega, List<DetallePedidoDTO> detalles,
                    Long empresaId, String empresaNombre) {
        this.id = id;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.fechaCreacion = fechaCreacion;
        this.estado = estado;
        this.total = total;
        this.notas = notas;
        this.direccionEntrega = direccionEntrega;
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
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
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
    
    public String getDireccionEntrega() {
        return direccionEntrega;
    }
    
    public void setDireccionEntrega(String direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
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

    public String getNumeroPedido() {
        return numeroPedido;
    }

    public void setNumeroPedido(String numeroPedido) {
        this.numeroPedido = numeroPedido;
    }

    public ClienteDTO getCliente() {
        return cliente;
    }

    public void setCliente(ClienteDTO cliente) {
        this.cliente = cliente;
    }
}
