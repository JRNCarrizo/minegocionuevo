package com.minegocio.backend.dto;

import java.math.BigDecimal;

public class EstadisticasInventarioDTO {

    private Long totalOperaciones = 0L;
    private Long totalIncrementos = 0L;
    private Long totalDecrementos = 0L;
    private Long totalAjustes = 0L;
    private BigDecimal valorTotalIncrementos = BigDecimal.ZERO;
    private BigDecimal valorTotalDecrementos = BigDecimal.ZERO;
    private BigDecimal valorTotalAjustes = BigDecimal.ZERO;
    private BigDecimal valorTotalMovimientos = BigDecimal.ZERO;

    // Constructores
    public EstadisticasInventarioDTO() {}

    public EstadisticasInventarioDTO(Object[] estadisticas) {
        if (estadisticas != null && estadisticas.length >= 8) {
            this.totalOperaciones = estadisticas[0] != null ? ((Number) estadisticas[0]).longValue() : 0L;
            this.totalIncrementos = estadisticas[1] != null ? ((Number) estadisticas[1]).longValue() : 0L;
            this.totalDecrementos = estadisticas[2] != null ? ((Number) estadisticas[2]).longValue() : 0L;
            this.totalAjustes = estadisticas[3] != null ? ((Number) estadisticas[3]).longValue() : 0L;
            this.valorTotalIncrementos = estadisticas[4] != null ? new BigDecimal(estadisticas[4].toString()) : BigDecimal.ZERO;
            this.valorTotalDecrementos = estadisticas[5] != null ? new BigDecimal(estadisticas[5].toString()) : BigDecimal.ZERO;
            this.valorTotalAjustes = estadisticas[6] != null ? new BigDecimal(estadisticas[6].toString()) : BigDecimal.ZERO;
            this.valorTotalMovimientos = estadisticas[7] != null ? new BigDecimal(estadisticas[7].toString()) : BigDecimal.ZERO;
        }
    }

    // Getters y Setters
    public Long getTotalOperaciones() { return totalOperaciones; }
    public void setTotalOperaciones(Long totalOperaciones) { this.totalOperaciones = totalOperaciones; }

    public Long getTotalIncrementos() { return totalIncrementos; }
    public void setTotalIncrementos(Long totalIncrementos) { this.totalIncrementos = totalIncrementos; }

    public Long getTotalDecrementos() { return totalDecrementos; }
    public void setTotalDecrementos(Long totalDecrementos) { this.totalDecrementos = totalDecrementos; }

    public Long getTotalAjustes() { return totalAjustes; }
    public void setTotalAjustes(Long totalAjustes) { this.totalAjustes = totalAjustes; }

    public BigDecimal getValorTotalIncrementos() { return valorTotalIncrementos; }
    public void setValorTotalIncrementos(BigDecimal valorTotalIncrementos) { this.valorTotalIncrementos = valorTotalIncrementos; }

    public BigDecimal getValorTotalDecrementos() { return valorTotalDecrementos; }
    public void setValorTotalDecrementos(BigDecimal valorTotalDecrementos) { this.valorTotalDecrementos = valorTotalDecrementos; }

    public BigDecimal getValorTotalAjustes() { return valorTotalAjustes; }
    public void setValorTotalAjustes(BigDecimal valorTotalAjustes) { this.valorTotalAjustes = valorTotalAjustes; }

    public BigDecimal getValorTotalMovimientos() { return valorTotalMovimientos; }
    public void setValorTotalMovimientos(BigDecimal valorTotalMovimientos) { this.valorTotalMovimientos = valorTotalMovimientos; }

    // Métodos de utilidad
    public BigDecimal calcularValorTotalMovimientos() {
        BigDecimal total = BigDecimal.ZERO;
        if (valorTotalIncrementos != null) total = total.add(valorTotalIncrementos);
        if (valorTotalDecrementos != null) total = total.add(valorTotalDecrementos);
        if (valorTotalAjustes != null) total = total.add(valorTotalAjustes);
        return total;
    }
} 