package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class StockPorSectorDTO {
    private Long id;
    private ProductoSimpleDTO producto;
    private SectorSimpleDTO sector;
    private Integer cantidad;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;

    // Constructor vacío
    public StockPorSectorDTO() {}

    // Constructor con parámetros
    public StockPorSectorDTO(Long id, ProductoSimpleDTO producto, SectorSimpleDTO sector, 
                            Integer cantidad, LocalDateTime fechaActualizacion) {
        this.id = id;
        this.producto = producto;
        this.sector = sector;
        this.cantidad = cantidad;
        this.fechaActualizacion = fechaActualizacion;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ProductoSimpleDTO getProducto() {
        return producto;
    }

    public void setProducto(ProductoSimpleDTO producto) {
        this.producto = producto;
    }

    public SectorSimpleDTO getSector() {
        return sector;
    }

    public void setSector(SectorSimpleDTO sector) {
        this.sector = sector;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    // Clases internas para evitar referencias circulares
    public static class ProductoSimpleDTO {
        private Long id;
        private String nombre;
        private String codigoPersonalizado;

        public ProductoSimpleDTO() {}

        public ProductoSimpleDTO(Long id, String nombre, String codigoPersonalizado) {
            this.id = id;
            this.nombre = nombre;
            this.codigoPersonalizado = codigoPersonalizado;
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
    }

    public static class SectorSimpleDTO {
        private Long id;
        private String nombre;

        public SectorSimpleDTO() {}

        public SectorSimpleDTO(Long id, String nombre) {
            this.id = id;
            this.nombre = nombre;
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
    }
}























