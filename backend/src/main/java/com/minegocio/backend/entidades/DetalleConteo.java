package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa el detalle de conteo de un producto específico
 */
@Entity
@Table(name = "detalle_conteo")
public class DetalleConteo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conteo_sector_id")
    private ConteoSector conteoSector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_por_sector_id")
    private InventarioPorSector inventarioPorSector;

    @NotNull(message = "El producto es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "codigo_producto")
    private String codigoProducto;

    @Column(name = "nombre_producto")
    private String nombreProducto;

    @Column(name = "stock_sistema")
    private Integer stockSistema;

    @Column(name = "cantidad_conteo_1")
    private Integer cantidadConteo1;

    @Column(name = "cantidad_conteo_2")
    private Integer cantidadConteo2;

    @Column(name = "cantidad_final")
    private Integer cantidadFinal;

    @Column(name = "diferencia_sistema")
    private Integer diferenciaSistema;

    @Column(name = "diferencia_entre_conteos")
    private Integer diferenciaEntreConteos;

    @Column(name = "formula_calculo_1", length = 500)
    private String formulaCalculo1;

    @Column(name = "formula_calculo_2", length = 500)
    private String formulaCalculo2;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "valor_diferencia", precision = 10, scale = 2)
    private BigDecimal valorDiferencia;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "marca")
    private String marca;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoDetalle estado;

    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    // Enum para estados del detalle
    public enum EstadoDetalle {
        PENDIENTE("Pendiente"),
        CONTADO_1("Contado por Usuario 1"),
        CONTADO_2("Contado por Usuario 2"),
        CON_DIFERENCIAS("Con Diferencias"),
        VERIFICADO("Verificado"),
        FINALIZADO("Finalizado");

        private final String descripcion;

        EstadoDetalle(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Constructores
    public DetalleConteo() {
        this.estado = EstadoDetalle.PENDIENTE;
        this.cantidadConteo1 = 0;
        this.cantidadConteo2 = 0;
        this.cantidadFinal = 0;
        this.diferenciaSistema = 0;
        this.diferenciaEntreConteos = 0;
    }

    public DetalleConteo(ConteoSector conteoSector, Producto producto) {
        this();
        this.conteoSector = conteoSector;
        this.producto = producto;
        this.codigoProducto = producto.getCodigoBarras() != null ? producto.getCodigoBarras() : producto.getCodigoPersonalizado();
        this.nombreProducto = producto.getNombre();
        this.stockSistema = producto.getStock();
        this.precioUnitario = producto.getPrecio();
        this.categoria = producto.getCategoria();
        this.marca = producto.getMarca();
    }

    public DetalleConteo(InventarioPorSector inventarioPorSector, Producto producto) {
        this();
        this.inventarioPorSector = inventarioPorSector;
        this.producto = producto;
        this.codigoProducto = producto.getCodigoBarras() != null ? producto.getCodigoBarras() : producto.getCodigoPersonalizado();
        this.nombreProducto = producto.getNombre();
        this.stockSistema = producto.getStock();
        this.precioUnitario = producto.getPrecio();
        this.categoria = producto.getCategoria();
        this.marca = producto.getMarca();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ConteoSector getConteoSector() { return conteoSector; }
    public void setConteoSector(ConteoSector conteoSector) { this.conteoSector = conteoSector; }

    public InventarioPorSector getInventarioPorSector() { return inventarioPorSector; }
    public void setInventarioPorSector(InventarioPorSector inventarioPorSector) { this.inventarioPorSector = inventarioPorSector; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public String getCodigoProducto() { return codigoProducto; }
    public void setCodigoProducto(String codigoProducto) { this.codigoProducto = codigoProducto; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public Integer getStockSistema() { return stockSistema; }
    public void setStockSistema(Integer stockSistema) { this.stockSistema = stockSistema; }

    public Integer getCantidadConteo1() { return cantidadConteo1; }
    public void setCantidadConteo1(Integer cantidadConteo1) { this.cantidadConteo1 = cantidadConteo1; }

    public Integer getCantidadConteo2() { return cantidadConteo2; }
    public void setCantidadConteo2(Integer cantidadConteo2) { this.cantidadConteo2 = cantidadConteo2; }

    public Integer getCantidadFinal() { return cantidadFinal; }
    public void setCantidadFinal(Integer cantidadFinal) { this.cantidadFinal = cantidadFinal; }

    public Integer getDiferenciaSistema() { return diferenciaSistema; }
    public void setDiferenciaSistema(Integer diferenciaSistema) { this.diferenciaSistema = diferenciaSistema; }

    public Integer getDiferenciaEntreConteos() { return diferenciaEntreConteos; }
    public void setDiferenciaEntreConteos(Integer diferenciaEntreConteos) { this.diferenciaEntreConteos = diferenciaEntreConteos; }

    public String getFormulaCalculo1() { return formulaCalculo1; }
    public void setFormulaCalculo1(String formulaCalculo1) { this.formulaCalculo1 = formulaCalculo1; }

    public String getFormulaCalculo2() { return formulaCalculo2; }
    public void setFormulaCalculo2(String formulaCalculo2) { this.formulaCalculo2 = formulaCalculo2; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public BigDecimal getValorDiferencia() { return valorDiferencia; }
    public void setValorDiferencia(BigDecimal valorDiferencia) { this.valorDiferencia = valorDiferencia; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }

    public EstadoDetalle getEstado() { return estado; }
    public void setEstado(EstadoDetalle estado) { this.estado = estado; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
