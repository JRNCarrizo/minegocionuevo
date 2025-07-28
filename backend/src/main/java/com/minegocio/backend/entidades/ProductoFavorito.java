package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

/**
 * Entidad para productos favoritos de clientes
 */
@Entity
@Table(name = "productos_favoritos", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"cliente_id", "producto_id"})
})
public class ProductoFavorito {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "El cliente es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;
    
    @NotNull(message = "El producto es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
    
    @NotNull(message = "La empresa es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;
    
    @Column(name = "fecha_agregado", nullable = false)
    private LocalDateTime fechaAgregado;
    
    @PrePersist
    protected void onCreate() {
        fechaAgregado = LocalDateTime.now();
    }
    
    // Constructores
    public ProductoFavorito() {}
    
    public ProductoFavorito(Cliente cliente, Producto producto, Empresa empresa) {
        this.cliente = cliente;
        this.producto = producto;
        this.empresa = empresa;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Cliente getCliente() {
        return cliente;
    }
    
    public void setCliente(Cliente cliente) {
        this.cliente = cliente;
    }
    
    public Producto getProducto() {
        return producto;
    }
    
    public void setProducto(Producto producto) {
        this.producto = producto;
    }
    
    public Empresa getEmpresa() {
        return empresa;
    }
    
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }
    
    public LocalDateTime getFechaAgregado() {
        return fechaAgregado;
    }
    
    public void setFechaAgregado(LocalDateTime fechaAgregado) {
        this.fechaAgregado = fechaAgregado;
    }
} 