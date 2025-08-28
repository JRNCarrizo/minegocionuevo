package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa los productos de cada empresa
 */
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del producto es obligatorio")
    @Size(max = 200, message = "El nombre no puede exceder 200 caracteres")
    @Column(nullable = false, length = 200)
    private String nombre;

    @Size(max = 1000, message = "La descripción no puede exceder 1000 caracteres")
    @Column(length = 1000)
    private String descripcion;

    @DecimalMin(value = "0.0", inclusive = true, message = "El precio debe ser mayor o igual a 0")
    @Column(nullable = true, precision = 10, scale = 2)
    private BigDecimal precio;

    @Min(value = 0, message = "El stock no puede ser negativo")
    @Column(nullable = false)
    private Integer stock = 0;

    @Min(value = 0, message = "El stock mínimo no puede ser negativo")
    @Column(name = "stock_minimo")
    private Integer stockMinimo = 0;

    @Size(max = 100, message = "La categoría no puede exceder 100 caracteres")
    @Column(length = 100)
    private String categoria;

    @Size(max = 100, message = "La marca no puede exceder 100 caracteres")
    @Column(length = 100)
    private String marca;

    @Size(max = 50, message = "La unidad no puede exceder 50 caracteres")
    @Column(length = 50)
    private String unidad; // ej: "kg", "litros", "unidades"

    @Size(max = 100, message = "El sector de almacenamiento no puede exceder 100 caracteres")
    @Column(name = "sector_almacenamiento", length = 100)
    private String sectorAlmacenamiento; // ej: "depósito2", "habitación A33", "góndola 4", "estante 23"

    @Size(max = 50, message = "El código personalizado no puede exceder 50 caracteres")
    @Column(name = "codigo_personalizado", length = 50)
    private String codigoPersonalizado; // ej: "330", "420", "EL001", "ROP001"

    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras; // ej: "1234567890123", "7891234567890"

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "destacado")
    private Boolean destacado = false;

    // Imágenes del producto
    @ElementCollection
    @CollectionTable(name = "producto_imagenes", joinColumns = @JoinColumn(name = "producto_id"))
    @Column(name = "url_imagen")
    private List<String> imagenes = new ArrayList<>();

    // Relación con empresa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    @JsonIgnore
    private Empresa empresa;

    // Relación con detalles de pedidos
    @OneToMany(mappedBy = "producto", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<DetallePedido> detallesPedidos = new ArrayList<>();

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public Producto() {}

    public Producto(String nombre, String descripcion, BigDecimal precio, Integer stock, Empresa empresa) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
        this.empresa = empresa;
    }

    // Métodos de utilidad
    public boolean tieneStockSuficiente(Integer cantidad) {
        return this.stock >= cantidad;
    }

    public boolean necesitaReabastecimiento() {
        return this.stock <= this.stockMinimo;
    }

    public void reducirStock(Integer cantidad) {
        if (tieneStockSuficiente(cantidad)) {
            this.stock -= cantidad;
        } else {
            throw new IllegalArgumentException("Stock insuficiente para el producto: " + this.nombre);
        }
    }

    public void aumentarStock(Integer cantidad) {
        this.stock += cantidad;
    }

    public String getImagenPrincipal() {
        return imagenes.isEmpty() ? null : imagenes.get(0);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getStockMinimo() { return stockMinimo; }
    public void setStockMinimo(Integer stockMinimo) { this.stockMinimo = stockMinimo; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public String getUnidad() { return unidad; }
    public void setUnidad(String unidad) { this.unidad = unidad; }

    public String getSectorAlmacenamiento() { return sectorAlmacenamiento; }
    public void setSectorAlmacenamiento(String sectorAlmacenamiento) { this.sectorAlmacenamiento = sectorAlmacenamiento; }

    public String getCodigoPersonalizado() { return codigoPersonalizado; }
    public void setCodigoPersonalizado(String codigoPersonalizado) { this.codigoPersonalizado = codigoPersonalizado; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Boolean getDestacado() { return destacado; }
    public void setDestacado(Boolean destacado) { this.destacado = destacado; }

    public List<String> getImagenes() { return imagenes; }
    public void setImagenes(List<String> imagenes) { this.imagenes = imagenes; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public List<DetallePedido> getDetallesPedidos() { return detallesPedidos; }
    public void setDetallesPedidos(List<DetallePedido> detallesPedidos) { this.detallesPedidos = detallesPedidos; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
}
