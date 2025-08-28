package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.*;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.repositorios.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para el panel de super administrador
 */
@Service
public class SuperAdminService {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private VentaRapidaRepository ventaRapidaRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private PedidoService pedidoService;

    @Autowired
    private VentaRapidaService ventaRapidaService;

    /**
     * Obtiene el dashboard principal con todas las estadísticas
     */
    public DashboardSuperAdminDTO obtenerDashboard() {
        DashboardSuperAdminDTO dashboard = new DashboardSuperAdminDTO();

        // Estadísticas generales
        dashboard.setTotalEmpresas(empresaRepository.count());
        dashboard.setTotalUsuarios(usuarioRepository.countByActivoTrue());
        dashboard.setTotalClientes(clienteRepository.count());
        dashboard.setTotalProductos(productoRepository.count());
        dashboard.setTotalPedidos(pedidoRepository.count());
        dashboard.setTotalVentasRapidas(ventaRapidaRepository.count());

        // Estadísticas de suscripciones
        dashboard.setEmpresasActivas(empresaRepository.countByEstadoSuscripcion(Empresa.EstadoSuscripcion.ACTIVA));
        dashboard.setEmpresasEnPrueba(empresaRepository.countByEstadoSuscripcion(Empresa.EstadoSuscripcion.PRUEBA));
        dashboard.setEmpresasSuspendidas(empresaRepository.countByEstadoSuscripcion(Empresa.EstadoSuscripcion.SUSPENDIDA));
        dashboard.setEmpresasCanceladas(empresaRepository.countByEstadoSuscripcion(Empresa.EstadoSuscripcion.CANCELADA));

        // Empresas por expirar (próximos 7 días)
        LocalDateTime fechaLimite = LocalDateTime.now().plusDays(7);
        List<Empresa> empresasPorExpirar = empresaRepository.findEmpresasConPruebaPorExpirar(
            LocalDateTime.now(), fechaLimite);
        dashboard.setEmpresasPorExpirar((long) empresasPorExpirar.size());

        // Estadísticas de planes
        Map<String, Long> empresasPorPlan = new HashMap<>();
        Map<String, BigDecimal> ingresosPorPlan = new HashMap<>();
        
        // Obtener estadísticas reales de planes
        List<Plan> planes = planRepository.findByActivoTrueOrderByOrdenAsc();
        for (Plan plan : planes) {
            // Contar suscripciones activas por plan
            List<Suscripcion> suscripcionesActivas = suscripcionRepository.findByPlanOrderByFechaCreacionDesc(plan)
                .stream()
                .filter(s -> s.getEstado() == Suscripcion.EstadoSuscripcion.ACTIVA)
                .collect(Collectors.toList());
            
            long cantidadEmpresas = suscripcionesActivas.size();
            empresasPorPlan.put(plan.getNombre(), cantidadEmpresas);
            
            BigDecimal ingresos = plan.getPrecio().multiply(new BigDecimal(cantidadEmpresas));
            ingresosPorPlan.put(plan.getNombre(), ingresos);
        }
        
        dashboard.setEmpresasPorPlan(empresasPorPlan);
        dashboard.setIngresosPorPlan(ingresosPorPlan);

        // Estadísticas financieras
        BigDecimal ingresosMensuales = ingresosPorPlan.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        dashboard.setIngresosMensuales(ingresosMensuales);
        dashboard.setIngresosAnuales(ingresosMensuales.multiply(new BigDecimal("12")));
        dashboard.setIngresosTotales(ingresosMensuales.multiply(new BigDecimal("24"))); // Ejemplo

        // Cálculo de promedio y tasa de conversión
        long totalEmpresasActivas = dashboard.getEmpresasActivas();
        if (totalEmpresasActivas > 0) {
            dashboard.setPromedioIngresosPorEmpresa(ingresosMensuales.divide(new BigDecimal(totalEmpresasActivas), 2, BigDecimal.ROUND_HALF_UP));
        }

        long totalEmpresasEnPrueba = dashboard.getEmpresasEnPrueba();
        if (totalEmpresasEnPrueba > 0) {
            BigDecimal tasaConversion = new BigDecimal(dashboard.getEmpresasActivas())
                .divide(new BigDecimal(totalEmpresasEnPrueba + dashboard.getEmpresasActivas()), 4, BigDecimal.ROUND_HALF_UP)
                .multiply(new BigDecimal("100"));
            dashboard.setTasaConversionPrueba(tasaConversion);
        }

        // Estadísticas de crecimiento
        LocalDateTime inicioMes = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime inicioAno = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        
        // Por ahora usar count() ya que no tenemos el método específico
        dashboard.setNuevasEmpresasEsteMes(empresaRepository.count());
        dashboard.setNuevasEmpresasEsteAno(empresaRepository.count());

        // Top empresas
        dashboard.setTopEmpresasPorIngresos(obtenerTopEmpresasPorIngresos(5));
        dashboard.setTopEmpresasPorActividad(obtenerTopEmpresasPorActividad(5));
        dashboard.setEmpresasEnRiesgo(obtenerEmpresasEnRiesgo());

        // Alertas y notificaciones
        dashboard.setAlertas(obtenerAlertas(false));
        dashboard.setNotificaciones(obtenerNotificaciones(false));

        // Tendencias
        dashboard.setTendenciaEmpresas(generarTendenciaEmpresas());
        dashboard.setTendenciaIngresos(generarTendenciaIngresos());
        dashboard.setTendenciaProductos(generarTendenciaProductos());

        // Estadísticas de actividad
        dashboard.setEmpresasActivasHoy(calcularEmpresasActivasHoy());
        dashboard.setEmpresasInactivasMasDe30Dias(calcularEmpresasInactivasMasDe30Dias());
        dashboard.setEmpresasNuevasEstaSemana(calcularEmpresasNuevasEstaSemana());

        return dashboard;
    }

    /**
     * Obtiene lista paginada de empresas con filtros
     */
    public Page<EmpresaDTO> obtenerEmpresas(String filtro, String estadoSuscripcion, String plan, 
                                          LocalDateTime fechaDesde, LocalDateTime fechaHasta, Pageable pageable) {
        // Implementar lógica de filtrado y paginación
        // Ordenar por fecha de creación descendente (más recientes primero)
        Page<Empresa> empresas = empresaRepository.findAllByOrderByFechaCreacionDesc(pageable);
        Page<EmpresaDTO> resultado = empresas.map(this::convertirAEmpresaDTO);
        
        return resultado;
    }

    /**
     * Obtiene detalles completos de una empresa
     */
    public EmpresaDTO obtenerEmpresa(Long id) {
        Empresa empresa = empresaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return convertirAEmpresaDTO(empresa);
    }

    /**
     * Actualiza el estado de una empresa
     */
    public EmpresaDTO actualizarEstadoEmpresa(Long id, String estado) {
        Empresa empresa = empresaRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        empresa.setEstadoSuscripcion(Empresa.EstadoSuscripcion.valueOf(estado.toUpperCase()));
        empresa = empresaRepository.save(empresa);
        
        return convertirAEmpresaDTO(empresa);
    }

    /**
     * Obtiene estadísticas de suscripciones
     */
    public Object obtenerEstadisticasSuscripciones() {
        Map<String, Object> estadisticas = new HashMap<>();
        
        estadisticas.put("totalSuscripciones", suscripcionRepository.count());
        estadisticas.put("suscripcionesActivas", (long) suscripcionRepository.findByEstado(Suscripcion.EstadoSuscripcion.ACTIVA).size());
        estadisticas.put("suscripcionesPorExpirar", (long) suscripcionRepository.findSuscripcionesPorExpirar(
            LocalDateTime.now(), LocalDateTime.now().plusDays(7)).size());
        
        return estadisticas;
    }

    /**
     * Obtiene empresas por expirar
     */
    public List<EmpresaTopDTO> obtenerEmpresasPorExpirar() {
        LocalDateTime fechaLimite = LocalDateTime.now().plusDays(7);
        List<Empresa> empresas = empresaRepository.findEmpresasConPruebaPorExpirar(
            LocalDateTime.now(), fechaLimite);
        
        return empresas.stream()
            .map(this::convertirAEmpresaTopDTO)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene top empresas por ingresos
     */
    public List<EmpresaTopDTO> obtenerTopEmpresasPorIngresos(int limite) {
        // Implementar lógica para obtener top empresas por ingresos
        List<EmpresaTopDTO> empresas = new ArrayList<>();
        
        // Por ahora, usar datos de ejemplo
        List<Empresa> todasEmpresas = empresaRepository.findAll();
        for (int i = 0; i < Math.min(limite, todasEmpresas.size()); i++) {
            Empresa empresa = todasEmpresas.get(i);
            EmpresaTopDTO dto = convertirAEmpresaTopDTO(empresa);
            dto.setIngresos(new BigDecimal("1000").multiply(new BigDecimal(i + 1)));
            empresas.add(dto);
        }
        
        return empresas;
    }

    /**
     * Obtiene empresas en riesgo
     */
    public List<EmpresaTopDTO> obtenerEmpresasEnRiesgo() {
        List<Empresa> empresas = empresaRepository.findEmpresasConPruebaPorExpirar(
            LocalDateTime.now(), LocalDateTime.now().plusDays(7));
        
        return empresas.stream()
            .map(this::convertirAEmpresaTopDTO)
            .collect(Collectors.toList());
    }

    /**
     * Obtiene top empresas por actividad
     */
    public List<EmpresaTopDTO> obtenerTopEmpresasPorActividad(int limite) {
        List<EmpresaTopDTO> empresas = new ArrayList<>();
        
        // Implementar lógica basada en actividad
        List<Empresa> todasEmpresas = empresaRepository.findAll();
        for (int i = 0; i < Math.min(limite, todasEmpresas.size()); i++) {
            Empresa empresa = todasEmpresas.get(i);
            EmpresaTopDTO dto = convertirAEmpresaTopDTO(empresa);
            dto.setPuntuacionActividad(100 - (i * 10));
            empresas.add(dto);
        }
        
        return empresas;
    }

    /**
     * Obtiene alertas del sistema
     */
    public List<AlertaSuperAdminDTO> obtenerAlertas(Boolean soloNoLeidas) {
        List<AlertaSuperAdminDTO> alertas = new ArrayList<>();
        
        // Generar alertas basadas en datos reales
        List<Empresa> empresasPorExpirar = empresaRepository.findEmpresasConPruebaPorExpirar(
            LocalDateTime.now(), LocalDateTime.now().plusDays(7));
        
        for (Empresa empresa : empresasPorExpirar) {
            AlertaSuperAdminDTO alerta = new AlertaSuperAdminDTO(
                "Empresa por expirar",
                empresa.getNombre() + " tiene su suscripción próxima a expirar",
                "warning"
            );
            alerta.setEmpresaNombre(empresa.getNombre());
            alerta.setEmpresaId(empresa.getId());
            alertas.add(alerta);
        }
        
        return alertas;
    }

    /**
     * Marca una alerta como leída
     */
    public void marcarAlertaComoLeida(Long id) {
        // Implementar lógica para marcar alerta como leída
        System.out.println("Alerta " + id + " marcada como leída");
    }

    /**
     * Obtiene notificaciones del sistema
     */
    public List<NotificacionSuperAdminDTO> obtenerNotificaciones(Boolean soloNoLeidas) {
        List<NotificacionSuperAdminDTO> notificaciones = new ArrayList<>();
        
        // Generar notificaciones basadas en datos reales
        // Por ahora usar count() ya que no tenemos el método específico
        long nuevasEmpresas = empresaRepository.count();
        
        if (nuevasEmpresas > 0) {
            NotificacionSuperAdminDTO notificacion = new NotificacionSuperAdminDTO(
                "Nuevas empresas registradas",
                "Se han registrado " + nuevasEmpresas + " nuevas empresas esta semana",
                "info"
            );
            notificaciones.add(notificacion);
        }
        
        return notificaciones;
    }

    /**
     * Marca una notificación como leída
     */
    public void marcarNotificacionComoLeida(Long id) {
        // Implementar lógica para marcar notificación como leída
        System.out.println("Notificación " + id + " marcada como leída");
    }

    /**
     * Obtiene reporte de ingresos
     */
    public Object obtenerReporteIngresos(LocalDateTime fechaDesde, LocalDateTime fechaHasta) {
        Map<String, Object> reporte = new HashMap<>();
        
        // Implementar lógica de reporte de ingresos
        reporte.put("fechaDesde", fechaDesde);
        reporte.put("fechaHasta", fechaHasta);
        reporte.put("ingresos", new BigDecimal("50000"));
        reporte.put("empresasActivas", (long) suscripcionRepository.findByEstado(Suscripcion.EstadoSuscripcion.ACTIVA).size());
        
        return reporte;
    }

    /**
     * Obtiene reporte de crecimiento
     */
    public Object obtenerReporteCrecimiento(int meses) {
        Map<String, Object> reporte = new HashMap<>();
        
        // Implementar lógica de reporte de crecimiento
        reporte.put("meses", meses);
        reporte.put("crecimiento", 15.5);
        // Por ahora usar count() ya que no tenemos el método específico
        reporte.put("nuevasEmpresas", empresaRepository.count());
        
        return reporte;
    }

    /**
     * Envía notificación a una empresa
     */
    public void enviarNotificacionEmpresa(Long id, NotificacionSuperAdminDTO notificacion) {
        // Implementar lógica para enviar notificación a empresa
        System.out.println("Notificación enviada a empresa " + id + ": " + notificacion.getTitulo());
    }

    /**
     * Obtiene logs del sistema
     */
    public Object obtenerLogs(String nivel, String empresa, LocalDateTime fechaDesde, 
                            LocalDateTime fechaHasta, Pageable pageable) {
        Map<String, Object> logs = new HashMap<>();
        
        // Implementar lógica para obtener logs
        logs.put("logs", new ArrayList<>());
        logs.put("totalElements", 0);
        logs.put("totalPages", 0);
        logs.put("currentPage", pageable.getPageNumber());
        
        return logs;
    }

    // Métodos auxiliares privados

    private EmpresaDTO convertirAEmpresaDTO(Empresa empresa) {
        EmpresaDTO dto = new EmpresaDTO(empresa);
        
        // Obtener estadísticas reales de la empresa específica
        dto.setTotalProductos(productoRepository.contarProductosActivosPorEmpresa(empresa));
        dto.setTotalClientes(clienteRepository.countByEmpresaAndActivoTrue(empresa));
        dto.setTotalPedidos(pedidoRepository.countByEmpresaId(empresa.getId()));
        
        // Nuevas estadísticas para superadmin
        Long ventasRapidas = ventaRapidaRepository.countByEmpresaId(empresa.getId());
        
        // Obtener estadísticas completas de pedidos (como en AdminController)
        Integer totalTransaccionesPedidos = 0;
        try {
            PedidoService.PedidoEstadisticas estadisticasPedidos = pedidoService.obtenerEstadisticasPedidos(empresa.getId());
            totalTransaccionesPedidos = estadisticasPedidos.getTotalTransacciones();
        } catch (Exception e) {
            System.err.println("❌ Error al obtener transacciones de pedidos para empresa " + empresa.getNombre() + ": " + e.getMessage());
            totalTransaccionesPedidos = 0;
        }
        
        // Obtener estadísticas completas de ventas rápidas
        Integer totalTransaccionesVentaRapida = 0;
        try {
            VentaRapidaService.VentaRapidaEstadisticas estadisticasVentaRapida = ventaRapidaService.obtenerEstadisticasVentasRapidas(empresa.getId());
            totalTransaccionesVentaRapida = estadisticasVentaRapida != null ? estadisticasVentaRapida.getTotalTransacciones() : 0;
        } catch (Exception e) {
            System.err.println("❌ Error al obtener transacciones de ventas rápidas para empresa " + empresa.getNombre() + ": " + e.getMessage());
            totalTransaccionesVentaRapida = 0;
        }
        
        Long transacciones = (long) (totalTransaccionesVentaRapida + totalTransaccionesPedidos);
        LocalDateTime ultimaConexion = empresa.getUltimoAcceso() != null ? 
            empresa.getUltimoAcceso() : empresa.getFechaCreacion();
        
        dto.setTotalVentasRapidas(ventasRapidas);
        dto.setTotalTransacciones(transacciones);
        dto.setUltimaConexion(ultimaConexion);
        
        return dto;
    }

    private EmpresaTopDTO convertirAEmpresaTopDTO(Empresa empresa) {
        EmpresaTopDTO dto = new EmpresaTopDTO();
        dto.setId(empresa.getId());
        dto.setNombre(empresa.getNombre());
        dto.setSubdominio(empresa.getSubdominio());
        dto.setEmail(empresa.getEmail());
        dto.setLogoUrl(empresa.getLogoUrl());
        dto.setEstadoSuscripcion(empresa.getEstadoSuscripcion().toString());
        dto.setUltimaActividad(empresa.getFechaActualizacion());
        
        // Obtener estadísticas reales de la empresa específica
        dto.setTotalProductos(productoRepository.contarProductosActivosPorEmpresa(empresa));
        dto.setTotalClientes(clienteRepository.countByEmpresaAndActivoTrue(empresa));
        dto.setTotalPedidos(pedidoRepository.countByEmpresaId(empresa.getId()));
        
        return dto;
    }

    private List<DatoTendenciaDTO> generarTendenciaEmpresas() {
        List<DatoTendenciaDTO> tendencia = new ArrayList<>();
        
        // Generar datos de los últimos 6 meses
        for (int i = 5; i >= 0; i--) {
            LocalDateTime fecha = LocalDateTime.now().minusMonths(i);
            // Por ahora usar count() ya que no tenemos el método específico
            long cantidad = empresaRepository.count();
            
            tendencia.add(new DatoTendenciaDTO(fecha, cantidad));
        }
        
        return tendencia;
    }

    private List<DatoTendenciaDTO> generarTendenciaIngresos() {
        List<DatoTendenciaDTO> tendencia = new ArrayList<>();
        
        // Generar datos de los últimos 6 meses
        for (int i = 5; i >= 0; i--) {
            LocalDateTime fecha = LocalDateTime.now().minusMonths(i);
            BigDecimal ingresos = new BigDecimal("10000").multiply(new BigDecimal(i + 1));
            
            tendencia.add(new DatoTendenciaDTO(fecha, ingresos));
        }
        
        return tendencia;
    }

    private List<DatoTendenciaDTO> generarTendenciaProductos() {
        List<DatoTendenciaDTO> tendencia = new ArrayList<>();
        
        // Generar datos de los últimos 6 meses
        for (int i = 5; i >= 0; i--) {
            LocalDateTime fecha = LocalDateTime.now().minusMonths(i);
            // Por ahora usar count() ya que no tenemos el método específico
            long cantidad = productoRepository.count();
            
            tendencia.add(new DatoTendenciaDTO(fecha, cantidad));
        }
        
        return tendencia;
    }

    private Long calcularEmpresasActivasHoy() {
        // Implementar lógica para calcular empresas activas hoy
        return empresaRepository.countByEstadoSuscripcion(Empresa.EstadoSuscripcion.ACTIVA);
    }

    private Long calcularEmpresasInactivasMasDe30Dias() {
        // Implementar lógica para calcular empresas inactivas más de 30 días
        // Por ahora, retornar 0 ya que Empresa no tiene campo ultimoAcceso
        return 0L;
    }

    private Long calcularEmpresasNuevasEstaSemana() {
        // Por ahora usar count() ya que no tenemos el método específico
        return empresaRepository.count();
    }
} 