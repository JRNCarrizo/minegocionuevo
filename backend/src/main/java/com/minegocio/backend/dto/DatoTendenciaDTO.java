package com.minegocio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para datos de tendencia utilizados en gráficos
 */
public class DatoTendenciaDTO {

    private LocalDateTime fecha;
    private Long valor;
    private BigDecimal valorDecimal;
    private String etiqueta;
    private String color;

    // Constructores
    public DatoTendenciaDTO() {}

    public DatoTendenciaDTO(LocalDateTime fecha, Long valor) {
        this.fecha = fecha;
        this.valor = valor;
    }

    public DatoTendenciaDTO(LocalDateTime fecha, BigDecimal valorDecimal) {
        this.fecha = fecha;
        this.valorDecimal = valorDecimal;
    }

    public DatoTendenciaDTO(String etiqueta, Long valor, String color) {
        this.etiqueta = etiqueta;
        this.valor = valor;
        this.color = color;
    }

    // Getters y Setters
    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Long getValor() { return valor; }
    public void setValor(Long valor) { this.valor = valor; }

    public BigDecimal getValorDecimal() { return valorDecimal; }
    public void setValorDecimal(BigDecimal valorDecimal) { this.valorDecimal = valorDecimal; }

    public String getEtiqueta() { return etiqueta; }
    public void setEtiqueta(String etiqueta) { this.etiqueta = etiqueta; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
} 