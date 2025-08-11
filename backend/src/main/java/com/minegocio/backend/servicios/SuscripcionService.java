package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.PlanDTO;
import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servicio para la gestión de suscripciones
 */
@Service
@Transactional
public class SuscripcionService {

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private AlmacenamientoService almacenamientoService;

    @Autowired
    private EmailService emailService;

    /**
     * Obtiene todos los planes con estadísticas
     */
    public List<PlanDTO> obtenerPlanesConEstadisticas() {
        List<Object[]> resultados = planRepository.findPlanesConEstadisticas();
        List<PlanDTO> planes = new ArrayList<>();

        for (Object[] resultado : resultados) {
            Plan plan = (Plan) resultado[0];
            Long totalSuscripciones = (Long) resultado[1];
            Long suscripcionesActivas = (Long) resultado[2];
            BigDecimal ingresosTotales = (BigDecimal) resultado[3];

            PlanDTO planDTO = new PlanDTO(plan);
            planDTO.setTotalSuscripciones(totalSuscripciones.intValue());
            planDTO.setSuscripcionesActivas(suscripcionesActivas.intValue());
            planDTO.setIngresosTotales(ingresosTotales != null ? ingresosTotales : BigDecimal.ZERO);

            planes.add(planDTO);
        }

        return planes;
    }

    /**
     * Obtiene todos los planes activos
     */
    public List<PlanDTO> obtenerPlanesActivos() {
        return planRepository.findByActivoTrueOrderByOrdenAsc()
                .stream()
                .map(PlanDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un plan por ID
     */
    public Optional<PlanDTO> obtenerPlanPorId(Long planId) {
        return planRepository.findById(planId)
                .map(PlanDTO::new);
    }

    /**
     * Crea un nuevo plan
     */
    public PlanDTO crearPlan(PlanDTO planDTO) {
        Plan plan = new Plan();
        actualizarPlanDesdeDTO(plan, planDTO);
        plan = planRepository.save(plan);
        return new PlanDTO(plan);
    }

    /**
     * Actualiza un plan existente
     */
    public PlanDTO actualizarPlan(Long planId, PlanDTO planDTO) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        
        actualizarPlanDesdeDTO(plan, planDTO);
        plan = planRepository.save(plan);
        return new PlanDTO(plan);
    }

    /**
     * Elimina un plan
     */
    public void eliminarPlan(Long planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        
        // Verificar que no tenga suscripciones activas
        if (!plan.getSuscripciones().isEmpty()) {
            throw new RuntimeException("No se puede eliminar un plan que tiene suscripciones activas");
        }
        
        planRepository.delete(plan);
    }

    /**
     * Obtiene todas las suscripciones con detalles
     */
    public List<SuscripcionDTO> obtenerSuscripcionesConDetalles() {
        List<Object[]> resultados = suscripcionRepository.findSuscripcionesConDetalles();
        List<SuscripcionDTO> suscripciones = new ArrayList<>();

        for (Object[] resultado : resultados) {
            Suscripcion suscripcion = (Suscripcion) resultado[0];
            String empresaNombre = (String) resultado[1];
            String empresaSubdominio = (String) resultado[2];
            String planNombre = (String) resultado[3];

            SuscripcionDTO suscripcionDTO = new SuscripcionDTO(suscripcion);
            suscripcionDTO.setEmpresaNombre(empresaNombre);
            suscripcionDTO.setEmpresaSubdominio(empresaSubdominio);
            suscripcionDTO.setPlanNombre(planNombre);

            suscripciones.add(suscripcionDTO);
        }

        return suscripciones;
    }

    /**
     * Obtiene suscripciones por empresa
     */
    public List<SuscripcionDTO> obtenerSuscripcionesPorEmpresa(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        List<Object[]> resultados = suscripcionRepository.findSuscripcionesPorEmpresaConDetalles(empresa);
        List<SuscripcionDTO> suscripciones = new ArrayList<>();

        for (Object[] resultado : resultados) {
            Suscripcion suscripcion = (Suscripcion) resultado[0];
            String planNombre = (String) resultado[1];

            SuscripcionDTO suscripcionDTO = new SuscripcionDTO(suscripcion);
            suscripcionDTO.setPlanNombre(planNombre);

            suscripciones.add(suscripcionDTO);
        }

        return suscripciones;
    }

    /**
     * Crea una nueva suscripción
     */
    public SuscripcionDTO crearSuscripcion(Long empresaId, Long planId, LocalDateTime fechaInicio) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        // Verificar que la empresa no tenga una suscripción activa
        if (suscripcionRepository.existsByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)) {
            throw new RuntimeException("La empresa ya tiene una suscripción activa");
        }

        Suscripcion suscripcion = new Suscripcion(empresa, plan, fechaInicio);
        suscripcion = suscripcionRepository.save(suscripcion);

        return new SuscripcionDTO(suscripcion);
    }

    /**
     * Suspende una suscripción
     */
    public SuscripcionDTO suspenderSuscripcion(Long suscripcionId) {
        Suscripcion suscripcion = suscripcionRepository.findById(suscripcionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));

        suscripcion.suspender();
        suscripcion = suscripcionRepository.save(suscripcion);

        return new SuscripcionDTO(suscripcion);
    }

    /**
     * Reactiva una suscripción
     */
    public SuscripcionDTO reactivarSuscripcion(Long suscripcionId) {
        Suscripcion suscripcion = suscripcionRepository.findById(suscripcionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));

        suscripcion.reactivar();
        suscripcion = suscripcionRepository.save(suscripcion);

        return new SuscripcionDTO(suscripcion);
    }

    /**
     * Cancela una suscripción
     */
    public SuscripcionDTO cancelarSuscripcion(Long suscripcionId, String motivo) {
        Suscripcion suscripcion = suscripcionRepository.findById(suscripcionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));

        suscripcion.cancelar(motivo);
        suscripcion = suscripcionRepository.save(suscripcion);

        return new SuscripcionDTO(suscripcion);
    }

    /**
     * Renueva una suscripción
     */
    public SuscripcionDTO renovarSuscripcion(Long suscripcionId) {
        Suscripcion suscripcion = suscripcionRepository.findById(suscripcionId)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));

        suscripcion.renovar();
        suscripcion = suscripcionRepository.save(suscripcion);

        return new SuscripcionDTO(suscripcion);
    }

    /**
     * Obtiene estadísticas de suscripciones
     */
    public Map<String, Object> obtenerEstadisticas() {
        Map<String, Object> estadisticas = new HashMap<>();

        // Contar suscripciones por estado
        List<Object[]> conteoPorEstado = suscripcionRepository.contarSuscripcionesPorEstado();
        Map<String, Long> conteoEstados = new HashMap<>();
        for (Object[] resultado : conteoPorEstado) {
            String estado = resultado[0].toString();
            Long cantidad = (Long) resultado[1];
            conteoEstados.put(estado, cantidad);
        }

        estadisticas.put("totalSuscripciones", conteoEstados.values().stream().mapToLong(Long::longValue).sum());
        estadisticas.put("suscripcionesActivas", conteoEstados.getOrDefault("ACTIVA", 0L));
        estadisticas.put("suscripcionesSuspendidas", conteoEstados.getOrDefault("SUSPENDIDA", 0L));
        estadisticas.put("suscripcionesCanceladas", conteoEstados.getOrDefault("CANCELADA", 0L));

        // Calcular suscripciones por expirar
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaLimite = ahora.plusDays(30);
        List<Suscripcion> porExpirar = suscripcionRepository.findSuscripcionesPorExpirar(ahora, fechaLimite);
        estadisticas.put("suscripcionesPorExpirar", porExpirar.size());

        // Calcular ingresos
        LocalDateTime inicioMes = ahora.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finMes = inicioMes.plusMonths(1).minusSeconds(1);
        Double ingresosMensuales = suscripcionRepository.calcularIngresosPorPeriodo(inicioMes, finMes);
        estadisticas.put("ingresosMensuales", ingresosMensuales != null ? ingresosMensuales : 0.0);

        LocalDateTime inicioAno = ahora.withDayOfYear(1).withHour(0).withMinute(0).withSecond(0);
        LocalDateTime finAno = inicioAno.plusYears(1).minusSeconds(1);
        Double ingresosAnuales = suscripcionRepository.calcularIngresosPorPeriodo(inicioAno, finAno);
        estadisticas.put("ingresosAnuales", ingresosAnuales != null ? ingresosAnuales : 0.0);

        return estadisticas;
    }

    /**
     * Actualiza un plan desde DTO
     */
    private void actualizarPlanDesdeDTO(Plan plan, PlanDTO planDTO) {
        // Validar que el precio no sea negativo
        if (planDTO.getPrecio() != null && planDTO.getPrecio().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("El precio no puede ser negativo");
        }
        
        // Si se está marcando como plan por defecto, desmarcar otros planes
        if (Boolean.TRUE.equals(planDTO.getPlanPorDefecto())) {
            desmarcarOtrosPlanesPorDefecto(plan.getId());
        }
        
        plan.setNombre(planDTO.getNombre());
        plan.setDescripcion(planDTO.getDescripcion());
        plan.setPrecio(planDTO.getPrecio());
        plan.setPeriodo(Plan.PeriodoPlan.valueOf(planDTO.getPeriodo()));
        plan.setActivo(planDTO.getActivo());
        plan.setDestacado(planDTO.getDestacado());
        plan.setOrden(planDTO.getOrden());
        plan.setMaxProductos(planDTO.getMaxProductos());
        plan.setMaxUsuarios(planDTO.getMaxUsuarios());
        plan.setMaxClientes(planDTO.getMaxClientes());
        plan.setMaxAlmacenamientoGB(planDTO.getMaxAlmacenamientoGB());
        plan.setPersonalizacionCompleta(planDTO.getPersonalizacionCompleta());
        plan.setEstadisticasAvanzadas(planDTO.getEstadisticasAvanzadas());
        plan.setSoportePrioritario(planDTO.getSoportePrioritario());
        plan.setIntegracionesAvanzadas(planDTO.getIntegracionesAvanzadas());
        plan.setBackupAutomatico(planDTO.getBackupAutomatico());
        plan.setDominioPersonalizado(planDTO.getDominioPersonalizado());
        plan.setPlanPorDefecto(planDTO.getPlanPorDefecto());
    }

    /**
     * Desmarca otros planes como plan por defecto
     */
    private void desmarcarOtrosPlanesPorDefecto(Long planIdExcluir) {
        Optional<Plan> planPorDefecto = planRepository.findByPlanPorDefectoTrue();
        if (planPorDefecto.isPresent()) {
            Plan plan = planPorDefecto.get();
            if (!plan.getId().equals(planIdExcluir)) {
                plan.setPlanPorDefecto(false);
                planRepository.save(plan);
            }
        }
    }

    /**
     * Obtiene el plan por defecto
     */
    public Optional<PlanDTO> obtenerPlanPorDefecto() {
        return planRepository.findByPlanPorDefectoTrue()
                .map(PlanDTO::new);
    }

    /**
     * Marca un plan como plan por defecto
     */
    public PlanDTO marcarPlanPorDefecto(Long planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        
        // Desmarcar otros planes
        desmarcarOtrosPlanesPorDefecto(planId);
        
        // Marcar este plan como por defecto
        plan.setPlanPorDefecto(true);
        plan = planRepository.save(plan);
        
        return new PlanDTO(plan);
    }

    /**
     * Obtiene suscripciones que expiran en los próximos días
     */
    public List<SuscripcionDTO> obtenerSuscripcionesPorExpirar(int dias) {
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaLimite = ahora.plusDays(dias);
        
        List<Suscripcion> suscripciones = suscripcionRepository.findSuscripcionesPorExpirar(ahora, fechaLimite);
        
        return suscripciones.stream()
                .map(SuscripcionDTO::new)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene estadísticas de consumo para una empresa
     */
    public Map<String, Object> obtenerEstadisticasConsumo(Long empresaId) {
        System.out.println("🔍 DEBUG: Obteniendo estadísticas de consumo para empresa ID: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        System.out.println("🔍 DEBUG: Empresa encontrada: " + empresa.getNombre());
        
        Suscripcion suscripcion = suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .orElse(null);
        
        if (suscripcion == null) {
            System.out.println("❌ DEBUG: No se encontró suscripción activa para empresa: " + empresaId);
            return Map.of("error", "No se encontró suscripción activa");
        }
        
        System.out.println("✅ DEBUG: Suscripción activa encontrada para empresa: " + empresaId);
        
        Plan plan = suscripcion.getPlan();
        
        // Contar productos activos
        long productosActuales = productoRepository.countByEmpresaAndActivoTrue(empresa);
        System.out.println("🔍 DEBUG: Productos activos: " + productosActuales);
        
        // Contar clientes activos
        long clientesActuales = clienteRepository.countByEmpresaAndActivoTrue(empresa);
        System.out.println("🔍 DEBUG: Clientes activos: " + clientesActuales);
        
        // Contar usuarios activos de la empresa
        long usuariosActuales = usuarioRepository.contarUsuariosActivosPorEmpresa(empresa);
        System.out.println("🔍 DEBUG: Usuarios activos: " + usuariosActuales);
        
        // Obtener almacenamiento total (archivos + base de datos)
        long almacenamientoActualBytes = almacenamientoService.obtenerAlmacenamientoTotalBytes(empresaId);
        double almacenamientoActualGB = almacenamientoActualBytes / (1024.0 * 1024.0 * 1024.0);
        System.out.println("🔍 DEBUG: Almacenamiento Total: " + almacenamientoActualGB + " GB (" + almacenamientoActualBytes + " bytes)");
        
        Map<String, Object> estadisticas = new HashMap<>();
        estadisticas.put("plan", Map.of(
            "id", plan.getId(),
            "nombre", plan.getNombre(),
            "maxProductos", plan.getMaxProductos(),
            "maxClientes", plan.getMaxClientes(),
            "maxUsuarios", plan.getMaxUsuarios(),
            "maxAlmacenamientoGB", plan.getMaxAlmacenamientoGB()
        ));
        
        Map<String, Object> consumo = new HashMap<>();
        consumo.put("productos", productosActuales);
        consumo.put("clientes", clientesActuales);
        consumo.put("usuarios", usuariosActuales);
        consumo.put("almacenamientoGB", Math.round(almacenamientoActualGB * 100.0) / 100.0); // Redondear a 2 decimales
        
        estadisticas.put("consumo", consumo);
        
        estadisticas.put("suscripcion", Map.of(
            "diasRestantes", suscripcion.getDiasRestantes(),
            "estaPorExpirar", suscripcion.estaPorExpirar(),
            "fechaFin", suscripcion.getFechaFin()
        ));
        
        System.out.println("✅ DEBUG: Estadísticas generadas: " + estadisticas);
        return estadisticas;
    }
} 