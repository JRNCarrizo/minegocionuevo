package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.PlanDTO;
import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

    /**
     * Obtiene todos los planes activos
     */
    public List<PlanDTO> obtenerPlanesActivos() {
        return planRepository.findByActivoTrueOrderByOrdenAsc()
                .stream()
                .map(this::convertirAPlanDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un plan por ID
     */
    public Optional<PlanDTO> obtenerPlan(Long id) {
        return planRepository.findById(id)
                .map(this::convertirAPlanDTO);
    }

    /**
     * Crea un nuevo plan
     */
    public PlanDTO crearPlan(PlanDTO planDTO) {
        Plan plan = new Plan();
        actualizarPlanDesdeDTO(plan, planDTO);
        plan.setOrden(planRepository.findNextOrden());
        plan = planRepository.save(plan);
        return convertirAPlanDTO(plan);
    }

    /**
     * Actualiza un plan existente
     */
    public PlanDTO actualizarPlan(Long id, PlanDTO planDTO) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        
        actualizarPlanDesdeDTO(plan, planDTO);
        plan = planRepository.save(plan);
        return convertirAPlanDTO(plan);
    }

    /**
     * Elimina un plan (desactiva)
     */
    public void eliminarPlan(Long id) {
        Plan plan = planRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));
        
        plan.setActivo(false);
        planRepository.save(plan);
    }

    /**
     * Obtiene suscripciones con filtros
     */
    public Page<SuscripcionDTO> obtenerSuscripciones(Long empresaId, Long planId, 
                                                    Suscripcion.EstadoSuscripcion estado,
                                                    LocalDateTime fechaInicio, LocalDateTime fechaFin,
                                                    Pageable pageable) {
        Page<Suscripcion> suscripciones = suscripcionRepository.findSuscripcionesConFiltros(
                empresaId, planId, estado, fechaInicio, fechaFin, pageable);
        
        return suscripciones.map(this::convertirASuscripcionDTO);
    }

    /**
     * Obtiene una suscripción por ID
     */
    public Optional<SuscripcionDTO> obtenerSuscripcion(Long id) {
        return suscripcionRepository.findById(id)
                .map(this::convertirASuscripcionDTO);
    }

    /**
     * Obtiene la suscripción activa de una empresa
     */
    public Optional<SuscripcionDTO> obtenerSuscripcionActiva(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        return suscripcionRepository.findByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .map(this::convertirASuscripcionDTO);
    }

    /**
     * Crea una nueva suscripción
     */
    public SuscripcionDTO crearSuscripcion(Long empresaId, Long planId, String metodoPago, String referenciaPago) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan no encontrado"));

        // Cancelar suscripción activa anterior si existe
        Optional<Suscripcion> suscripcionAnterior = suscripcionRepository.findByEmpresaAndEstado(
                empresa, Suscripcion.EstadoSuscripcion.ACTIVA);
        
        if (suscripcionAnterior.isPresent()) {
            Suscripcion anterior = suscripcionAnterior.get();
            anterior.cancelar("Nueva suscripción creada");
            suscripcionRepository.save(anterior);
        }

        // Crear nueva suscripción
        Suscripcion suscripcion = new Suscripcion(empresa, plan, LocalDateTime.now());
        suscripcion.setFechaFin(calcularFechaFin(plan.getPeriodo()));
        suscripcion.setMetodoPago(metodoPago);
        suscripcion.setReferenciaPago(referenciaPago);
        suscripcion.setFacturado(true);

        suscripcion = suscripcionRepository.save(suscripcion);
        return convertirASuscripcionDTO(suscripcion);
    }

    /**
     * Cancela una suscripción
     */
    public SuscripcionDTO cancelarSuscripcion(Long id, String motivo) {
        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));
        
        suscripcion.cancelar(motivo);
        suscripcion = suscripcionRepository.save(suscripcion);
        return convertirASuscripcionDTO(suscripcion);
    }

    /**
     * Suspende una suscripción
     */
    public SuscripcionDTO suspenderSuscripcion(Long id) {
        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));
        
        suscripcion.suspender();
        suscripcion = suscripcionRepository.save(suscripcion);
        return convertirASuscripcionDTO(suscripcion);
    }

    /**
     * Reactiva una suscripción
     */
    public SuscripcionDTO reactivarSuscripcion(Long id) {
        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));
        
        suscripcion.reactivar();
        suscripcion = suscripcionRepository.save(suscripcion);
        return convertirASuscripcionDTO(suscripcion);
    }

    /**
     * Renueva una suscripción
     */
    public SuscripcionDTO renovarSuscripcion(Long id) {
        Suscripcion suscripcion = suscripcionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Suscripción no encontrada"));
        
        suscripcion.renovar();
        suscripcion = suscripcionRepository.save(suscripcion);
        return convertirASuscripcionDTO(suscripcion);
    }

    /**
     * Obtiene estadísticas de suscripciones
     */
    public Map<String, Object> obtenerEstadisticas() {
        BigDecimal ingresosMensuales = suscripcionRepository.calcularIngresosPorPeriodo(
            LocalDateTime.now().withDayOfMonth(1), LocalDateTime.now());
        BigDecimal ingresosAnuales = suscripcionRepository.calcularIngresosPorPeriodo(
            LocalDateTime.now().withDayOfYear(1), LocalDateTime.now());
        
        Map<String, Object> estadisticas = Map.of(
            "totalSuscripciones", suscripcionRepository.count(),
            "suscripcionesActivas", suscripcionRepository.countByEstado(Suscripcion.EstadoSuscripcion.ACTIVA),
            "suscripcionesSuspendidas", suscripcionRepository.countByEstado(Suscripcion.EstadoSuscripcion.SUSPENDIDA),
            "suscripcionesCanceladas", suscripcionRepository.countByEstado(Suscripcion.EstadoSuscripcion.CANCELADA),
            "suscripcionesPorExpirar", suscripcionRepository.findSuscripcionesPorExpirar(
                LocalDateTime.now(), LocalDateTime.now().plusDays(7)).size(),
            "ingresosMensuales", ingresosMensuales != null ? ingresosMensuales : BigDecimal.ZERO,
            "ingresosAnuales", ingresosAnuales != null ? ingresosAnuales : BigDecimal.ZERO
        );
        
        return estadisticas;
    }

    /**
     * Obtiene suscripciones por expirar
     */
    public List<SuscripcionDTO> obtenerSuscripcionesPorExpirar() {
        return suscripcionRepository.findSuscripcionesPorExpirar(
                LocalDateTime.now(), LocalDateTime.now().plusDays(7))
                .stream()
                .map(this::convertirASuscripcionDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene suscripciones expiradas
     */
    public List<SuscripcionDTO> obtenerSuscripcionesExpiradas() {
        return suscripcionRepository.findSuscripcionesExpiradas(LocalDateTime.now())
                .stream()
                .map(this::convertirASuscripcionDTO)
                .collect(Collectors.toList());
    }

    /**
     * Procesa renovaciones automáticas
     */
    public void procesarRenovacionesAutomaticas() {
        List<Suscripcion> suscripcionesParaRenovar = suscripcionRepository.findSuscripcionesParaRenovar(
                LocalDateTime.now(), LocalDateTime.now().plusDays(1));
        
        for (Suscripcion suscripcion : suscripcionesParaRenovar) {
            try {
                suscripcion.renovar();
                suscripcionRepository.save(suscripcion);
                // Aquí se podría agregar lógica de facturación automática
            } catch (Exception e) {
                // Log del error y posible notificación
                System.err.println("Error al renovar suscripción " + suscripcion.getId() + ": " + e.getMessage());
            }
        }
    }

    // Métodos auxiliares privados

    private PlanDTO convertirAPlanDTO(Plan plan) {
        PlanDTO dto = new PlanDTO(plan);
        
        // Agregar estadísticas
        dto.setTotalSuscripciones(suscripcionRepository.countByPlanIdAndEstado(plan.getId(), null));
        dto.setSuscripcionesActivas(suscripcionRepository.countByPlanIdAndEstado(plan.getId(), Suscripcion.EstadoSuscripcion.ACTIVA));
        
        // Calcular ingresos totales del plan
        BigDecimal ingresos = suscripcionRepository.findByPlan(plan)
                .stream()
                .filter(s -> Suscripcion.EstadoSuscripcion.ACTIVA.equals(s.getEstado()))
                .map(Suscripcion::getPrecio)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        dto.setIngresosTotales(ingresos);
        
        return dto;
    }

    private SuscripcionDTO convertirASuscripcionDTO(Suscripcion suscripcion) {
        return new SuscripcionDTO(suscripcion);
    }

    private void actualizarPlanDesdeDTO(Plan plan, PlanDTO dto) {
        plan.setNombre(dto.getNombre());
        plan.setDescripcion(dto.getDescripcion());
        plan.setPrecio(dto.getPrecio());
        plan.setPeriodo(dto.getPeriodo());
        plan.setActivo(dto.getActivo());
        plan.setDestacado(dto.getDestacado());
        plan.setMaxProductos(dto.getMaxProductos());
        plan.setMaxUsuarios(dto.getMaxUsuarios());
        plan.setMaxClientes(dto.getMaxClientes());
        plan.setMaxAlmacenamientoGB(dto.getMaxAlmacenamientoGB());
        plan.setPersonalizacionCompleta(dto.getPersonalizacionCompleta());
        plan.setEstadisticasAvanzadas(dto.getEstadisticasAvanzadas());
        plan.setSoportePrioritario(dto.getSoportePrioritario());
        plan.setIntegracionesAvanzadas(dto.getIntegracionesAvanzadas());
        plan.setBackupAutomatico(dto.getBackupAutomatico());
        plan.setDominioPersonalizado(dto.getDominioPersonalizado());
    }

    private LocalDateTime calcularFechaFin(Plan.PeriodoPlan periodo) {
        LocalDateTime ahora = LocalDateTime.now();
        switch (periodo) {
            case MENSUAL:
                return ahora.plusMonths(1);
            case TRIMESTRAL:
                return ahora.plusMonths(3);
            case SEMESTRAL:
                return ahora.plusMonths(6);
            case ANUAL:
                return ahora.plusYears(1);
            default:
                return ahora.plusMonths(1);
        }
    }
} 