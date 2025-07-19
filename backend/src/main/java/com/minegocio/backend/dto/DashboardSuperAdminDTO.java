package com.minegocio.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO para el dashboard principal del super administrador
 */
public class DashboardSuperAdminDTO {

    // Estadísticas generales
    private Long totalEmpresas;
    private Long totalUsuarios;
    private Long totalClientes;
    private Long totalProductos;
    private Long totalPedidos;
    private Long totalVentasRapidas;

    // Estadísticas de suscripciones
    private Long empresasActivas;
    private Long empresasEnPrueba;
    private Long empresasSuspendidas;
    private Long empresasCanceladas;
    private Long empresasPorExpirar;

    // Estadísticas financieras
    private BigDecimal ingresosMensuales;
    private BigDecimal ingresosAnuales;
    private BigDecimal ingresosTotales;
    private BigDecimal promedioIngresosPorEmpresa;
    private BigDecimal tasaConversionPrueba;

    // Estadísticas de crecimiento
    private Long nuevasEmpresasEsteMes;
    private Long nuevasEmpresasEsteAno;
    private Long empresasCanceladasEsteMes;
    private BigDecimal tasaRetencion;

    // Distribución por planes
    private Map<String, Long> empresasPorPlan;
    private Map<String, BigDecimal> ingresosPorPlan;

    // Top empresas
    private List<EmpresaTopDTO> topEmpresasPorIngresos;
    private List<EmpresaTopDTO> topEmpresasPorActividad;
    private List<EmpresaTopDTO> empresasEnRiesgo;

    // Alertas y notificaciones
    private List<AlertaSuperAdminDTO> alertas;
    private List<NotificacionSuperAdminDTO> notificaciones;

    // Tendencias
    private List<DatoTendenciaDTO> tendenciaEmpresas;
    private List<DatoTendenciaDTO> tendenciaIngresos;
    private List<DatoTendenciaDTO> tendenciaProductos;

    // Estadísticas de actividad
    private Long empresasActivasHoy;
    private Long empresasInactivasMasDe30Dias;
    private Long empresasNuevasEstaSemana;

    // Getters y Setters
    public Long getTotalEmpresas() { return totalEmpresas; }
    public void setTotalEmpresas(Long totalEmpresas) { this.totalEmpresas = totalEmpresas; }

    public Long getTotalUsuarios() { return totalUsuarios; }
    public void setTotalUsuarios(Long totalUsuarios) { this.totalUsuarios = totalUsuarios; }

    public Long getTotalClientes() { return totalClientes; }
    public void setTotalClientes(Long totalClientes) { this.totalClientes = totalClientes; }

    public Long getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Long totalProductos) { this.totalProductos = totalProductos; }

    public Long getTotalPedidos() { return totalPedidos; }
    public void setTotalPedidos(Long totalPedidos) { this.totalPedidos = totalPedidos; }

    public Long getTotalVentasRapidas() { return totalVentasRapidas; }
    public void setTotalVentasRapidas(Long totalVentasRapidas) { this.totalVentasRapidas = totalVentasRapidas; }

    public Long getEmpresasActivas() { return empresasActivas; }
    public void setEmpresasActivas(Long empresasActivas) { this.empresasActivas = empresasActivas; }

    public Long getEmpresasEnPrueba() { return empresasEnPrueba; }
    public void setEmpresasEnPrueba(Long empresasEnPrueba) { this.empresasEnPrueba = empresasEnPrueba; }

    public Long getEmpresasSuspendidas() { return empresasSuspendidas; }
    public void setEmpresasSuspendidas(Long empresasSuspendidas) { this.empresasSuspendidas = empresasSuspendidas; }

    public Long getEmpresasCanceladas() { return empresasCanceladas; }
    public void setEmpresasCanceladas(Long empresasCanceladas) { this.empresasCanceladas = empresasCanceladas; }

    public Long getEmpresasPorExpirar() { return empresasPorExpirar; }
    public void setEmpresasPorExpirar(Long empresasPorExpirar) { this.empresasPorExpirar = empresasPorExpirar; }

    public BigDecimal getIngresosMensuales() { return ingresosMensuales; }
    public void setIngresosMensuales(BigDecimal ingresosMensuales) { this.ingresosMensuales = ingresosMensuales; }

    public BigDecimal getIngresosAnuales() { return ingresosAnuales; }
    public void setIngresosAnuales(BigDecimal ingresosAnuales) { this.ingresosAnuales = ingresosAnuales; }

    public BigDecimal getIngresosTotales() { return ingresosTotales; }
    public void setIngresosTotales(BigDecimal ingresosTotales) { this.ingresosTotales = ingresosTotales; }

    public BigDecimal getPromedioIngresosPorEmpresa() { return promedioIngresosPorEmpresa; }
    public void setPromedioIngresosPorEmpresa(BigDecimal promedioIngresosPorEmpresa) { this.promedioIngresosPorEmpresa = promedioIngresosPorEmpresa; }

    public BigDecimal getTasaConversionPrueba() { return tasaConversionPrueba; }
    public void setTasaConversionPrueba(BigDecimal tasaConversionPrueba) { this.tasaConversionPrueba = tasaConversionPrueba; }

    public Long getNuevasEmpresasEsteMes() { return nuevasEmpresasEsteMes; }
    public void setNuevasEmpresasEsteMes(Long nuevasEmpresasEsteMes) { this.nuevasEmpresasEsteMes = nuevasEmpresasEsteMes; }

    public Long getNuevasEmpresasEsteAno() { return nuevasEmpresasEsteAno; }
    public void setNuevasEmpresasEsteAno(Long nuevasEmpresasEsteAno) { this.nuevasEmpresasEsteAno = nuevasEmpresasEsteAno; }

    public Long getEmpresasCanceladasEsteMes() { return empresasCanceladasEsteMes; }
    public void setEmpresasCanceladasEsteMes(Long empresasCanceladasEsteMes) { this.empresasCanceladasEsteMes = empresasCanceladasEsteMes; }

    public BigDecimal getTasaRetencion() { return tasaRetencion; }
    public void setTasaRetencion(BigDecimal tasaRetencion) { this.tasaRetencion = tasaRetencion; }

    public Map<String, Long> getEmpresasPorPlan() { return empresasPorPlan; }
    public void setEmpresasPorPlan(Map<String, Long> empresasPorPlan) { this.empresasPorPlan = empresasPorPlan; }

    public Map<String, BigDecimal> getIngresosPorPlan() { return ingresosPorPlan; }
    public void setIngresosPorPlan(Map<String, BigDecimal> ingresosPorPlan) { this.ingresosPorPlan = ingresosPorPlan; }

    public List<EmpresaTopDTO> getTopEmpresasPorIngresos() { return topEmpresasPorIngresos; }
    public void setTopEmpresasPorIngresos(List<EmpresaTopDTO> topEmpresasPorIngresos) { this.topEmpresasPorIngresos = topEmpresasPorIngresos; }

    public List<EmpresaTopDTO> getTopEmpresasPorActividad() { return topEmpresasPorActividad; }
    public void setTopEmpresasPorActividad(List<EmpresaTopDTO> topEmpresasPorActividad) { this.topEmpresasPorActividad = topEmpresasPorActividad; }

    public List<EmpresaTopDTO> getEmpresasEnRiesgo() { return empresasEnRiesgo; }
    public void setEmpresasEnRiesgo(List<EmpresaTopDTO> empresasEnRiesgo) { this.empresasEnRiesgo = empresasEnRiesgo; }

    public List<AlertaSuperAdminDTO> getAlertas() { return alertas; }
    public void setAlertas(List<AlertaSuperAdminDTO> alertas) { this.alertas = alertas; }

    public List<NotificacionSuperAdminDTO> getNotificaciones() { return notificaciones; }
    public void setNotificaciones(List<NotificacionSuperAdminDTO> notificaciones) { this.notificaciones = notificaciones; }

    public List<DatoTendenciaDTO> getTendenciaEmpresas() { return tendenciaEmpresas; }
    public void setTendenciaEmpresas(List<DatoTendenciaDTO> tendenciaEmpresas) { this.tendenciaEmpresas = tendenciaEmpresas; }

    public List<DatoTendenciaDTO> getTendenciaIngresos() { return tendenciaIngresos; }
    public void setTendenciaIngresos(List<DatoTendenciaDTO> tendenciaIngresos) { this.tendenciaIngresos = tendenciaIngresos; }

    public List<DatoTendenciaDTO> getTendenciaProductos() { return tendenciaProductos; }
    public void setTendenciaProductos(List<DatoTendenciaDTO> tendenciaProductos) { this.tendenciaProductos = tendenciaProductos; }

    public Long getEmpresasActivasHoy() { return empresasActivasHoy; }
    public void setEmpresasActivasHoy(Long empresasActivasHoy) { this.empresasActivasHoy = empresasActivasHoy; }

    public Long getEmpresasInactivasMasDe30Dias() { return empresasInactivasMasDe30Dias; }
    public void setEmpresasInactivasMasDe30Dias(Long empresasInactivasMasDe30Dias) { this.empresasInactivasMasDe30Dias = empresasInactivasMasDe30Dias; }

    public Long getEmpresasNuevasEstaSemana() { return empresasNuevasEstaSemana; }
    public void setEmpresasNuevasEstaSemana(Long empresasNuevasEstaSemana) { this.empresasNuevasEstaSemana = empresasNuevasEstaSemana; }
} 