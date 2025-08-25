package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.util.List;

public class MovimientoDiaDTO {
    
    private String fecha;
    private StockInicialDTO stockInicial;
    private MovimientosDTO ingresos;
    private MovimientosDTO devoluciones;
    private MovimientosDTO salidas;
    private MovimientosDTO roturas;
    private StockInicialDTO balanceFinal;
    private Boolean diaCerrado;
    
    // Constructores
    public MovimientoDiaDTO() {}
    
    public MovimientoDiaDTO(String fecha, StockInicialDTO stockInicial, MovimientosDTO ingresos,
                           MovimientosDTO devoluciones, MovimientosDTO salidas, MovimientosDTO roturas,
                           StockInicialDTO balanceFinal, Boolean diaCerrado) {
        this.fecha = fecha;
        this.stockInicial = stockInicial;
        this.ingresos = ingresos;
        this.devoluciones = devoluciones;
        this.salidas = salidas;
        this.roturas = roturas;
        this.balanceFinal = balanceFinal;
        this.diaCerrado = diaCerrado;
    }
    
    // Getters y Setters
    public String getFecha() {
        return fecha;
    }
    
    public void setFecha(String fecha) {
        this.fecha = fecha;
    }
    
    public StockInicialDTO getStockInicial() {
        return stockInicial;
    }
    
    public void setStockInicial(StockInicialDTO stockInicial) {
        this.stockInicial = stockInicial;
    }
    
    public MovimientosDTO getIngresos() {
        return ingresos;
    }
    
    public void setIngresos(MovimientosDTO ingresos) {
        this.ingresos = ingresos;
    }
    
    public MovimientosDTO getDevoluciones() {
        return devoluciones;
    }
    
    public void setDevoluciones(MovimientosDTO devoluciones) {
        this.devoluciones = devoluciones;
    }
    
    public MovimientosDTO getSalidas() {
        return salidas;
    }
    
    public void setSalidas(MovimientosDTO salidas) {
        this.salidas = salidas;
    }
    
    public MovimientosDTO getRoturas() {
        return roturas;
    }
    
    public void setRoturas(MovimientosDTO roturas) {
        this.roturas = roturas;
    }
    
    public StockInicialDTO getBalanceFinal() {
        return balanceFinal;
    }
    
    public void setBalanceFinal(StockInicialDTO balanceFinal) {
        this.balanceFinal = balanceFinal;
    }
    
    public Boolean getDiaCerrado() {
        return diaCerrado;
    }
    
    public void setDiaCerrado(Boolean diaCerrado) {
        this.diaCerrado = diaCerrado;
    }
    
    // DTOs internos
    public static class StockInicialDTO {
        private Integer cantidadTotal;
        private List<ProductoStockDTO> productos;
        
        public StockInicialDTO() {}
        
        public StockInicialDTO(Integer cantidadTotal, List<ProductoStockDTO> productos) {
            this.cantidadTotal = cantidadTotal;
            this.productos = productos;
        }
        
        public Integer getCantidadTotal() {
            return cantidadTotal;
        }
        
        public void setCantidadTotal(Integer cantidadTotal) {
            this.cantidadTotal = cantidadTotal;
        }
        
        public List<ProductoStockDTO> getProductos() {
            return productos;
        }
        
        public void setProductos(List<ProductoStockDTO> productos) {
            this.productos = productos;
        }
    }
    
    public static class MovimientosDTO {
        private Integer cantidadTotal;
        private List<ProductoMovimientoDTO> productos;
        
        public MovimientosDTO() {}
        
        public MovimientosDTO(Integer cantidadTotal, List<ProductoMovimientoDTO> productos) {
            this.cantidadTotal = cantidadTotal;
            this.productos = productos;
        }
        
        public Integer getCantidadTotal() {
            return cantidadTotal;
        }
        
        public void setCantidadTotal(Integer cantidadTotal) {
            this.cantidadTotal = cantidadTotal;
        }
        
        public List<ProductoMovimientoDTO> getProductos() {
            return productos;
        }
        
        public void setProductos(List<ProductoMovimientoDTO> productos) {
            this.productos = productos;
        }
    }
    
    public static class ProductoStockDTO {
        private Long id;
        private String nombre;
        private String codigoPersonalizado;
        private Integer cantidad;
        private Double precio;
        private Integer cantidadInicial; // Para balance final
        private Integer variacion; // Para balance final: positivo = incremento, negativo = decremento, 0 = sin cambios
        private String tipoVariacion; // "INCREMENTO", "DECREMENTO", "SIN_CAMBIOS"
        
        public ProductoStockDTO() {}
        
        public ProductoStockDTO(Long id, String nombre, String codigoPersonalizado, Integer cantidad, Double precio) {
            this.id = id;
            this.nombre = nombre;
            this.codigoPersonalizado = codigoPersonalizado;
            this.cantidad = cantidad;
            this.precio = precio;
        }
        
        public ProductoStockDTO(Long id, String nombre, String codigoPersonalizado, Integer cantidad, Double precio, 
                               Integer cantidadInicial, Integer variacion, String tipoVariacion) {
            this.id = id;
            this.nombre = nombre;
            this.codigoPersonalizado = codigoPersonalizado;
            this.cantidad = cantidad;
            this.precio = precio;
            this.cantidadInicial = cantidadInicial;
            this.variacion = variacion;
            this.tipoVariacion = tipoVariacion;
        }
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getNombre() {
            return nombre;
        }
        
        public void setNombre(String nombre) {
            this.nombre = nombre;
        }
        
        public String getCodigoPersonalizado() {
            return codigoPersonalizado;
        }
        
        public void setCodigoPersonalizado(String codigoPersonalizado) {
            this.codigoPersonalizado = codigoPersonalizado;
        }
        
        public Integer getCantidad() {
            return cantidad;
        }
        
        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
        
        public Double getPrecio() {
            return precio;
        }
        
        public void setPrecio(Double precio) {
            this.precio = precio;
        }
        
        public Integer getCantidadInicial() {
            return cantidadInicial;
        }
        
        public void setCantidadInicial(Integer cantidadInicial) {
            this.cantidadInicial = cantidadInicial;
        }
        
        public Integer getVariacion() {
            return variacion;
        }
        
        public void setVariacion(Integer variacion) {
            this.variacion = variacion;
        }
        
        public String getTipoVariacion() {
            return tipoVariacion;
        }
        
        public void setTipoVariacion(String tipoVariacion) {
            this.tipoVariacion = tipoVariacion;
        }
    }
    
    public static class ProductoMovimientoDTO {
        private Long id;
        private String nombre;
        private String codigoPersonalizado;
        private Integer cantidad;
        private String fechaMovimiento;
        private String observaciones;
        
        public ProductoMovimientoDTO() {}
        
        public ProductoMovimientoDTO(Long id, String nombre, String codigoPersonalizado, 
                                   Integer cantidad, String fechaMovimiento, String observaciones) {
            this.id = id;
            this.nombre = nombre;
            this.codigoPersonalizado = codigoPersonalizado;
            this.cantidad = cantidad;
            this.fechaMovimiento = fechaMovimiento;
            this.observaciones = observaciones;
        }
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
        
        public String getNombre() {
            return nombre;
        }
        
        public void setNombre(String nombre) {
            this.nombre = nombre;
        }
        
        public String getCodigoPersonalizado() {
            return codigoPersonalizado;
        }
        
        public void setCodigoPersonalizado(String codigoPersonalizado) {
            this.codigoPersonalizado = codigoPersonalizado;
        }
        
        public Integer getCantidad() {
            return cantidad;
        }
        
        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }
        
        public String getFechaMovimiento() {
            return fechaMovimiento;
        }
        
        public void setFechaMovimiento(String fechaMovimiento) {
            this.fechaMovimiento = fechaMovimiento;
        }
        
        public String getObservaciones() {
            return observaciones;
        }
        
        public void setObservaciones(String observaciones) {
            this.observaciones = observaciones;
        }
    }
}
