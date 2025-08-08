package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Servicio para manejar suscripciones automáticas
 */
@Service
public class SuscripcionAutomaticaService {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    /**
     * Crea automáticamente una suscripción gratuita para una nueva empresa
     */
    @Transactional
    public Suscripcion crearSuscripcionGratuita(Empresa empresa) {
        try {
            System.out.println("🎯 Creando suscripción gratuita para empresa: " + empresa.getNombre());
            
            // Buscar el plan por defecto
            Plan planGratuito = planRepository.findByPlanPorDefectoTrue()
                .orElseThrow(() -> new RuntimeException("Plan por defecto no encontrado"));
            
            System.out.println("🎯 Plan gratuito encontrado: " + planGratuito.getNombre());
            
            // Crear la suscripción
            Suscripcion suscripcion = new Suscripcion();
            suscripcion.setEmpresa(empresa);
            suscripcion.setPlan(planGratuito);
            suscripcion.setFechaInicio(LocalDateTime.now());
            suscripcion.setFechaFin(LocalDateTime.now().plusDays(45)); // 45 días de prueba
            suscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
            suscripcion.setPrecio(BigDecimal.ZERO);
            suscripcion.setMoneda("USD");
            suscripcion.setRenovacionAutomatica(false); // No renovar automáticamente
            suscripcion.setNotificarAntesRenovacion(true);
            suscripcion.setDiasNotificacionRenovacion(7);
            
            Suscripcion suscripcionGuardada = suscripcionRepository.save(suscripcion);
            
            System.out.println("🎯 Suscripción gratuita creada con ID: " + suscripcionGuardada.getId());
            System.out.println("🎯 Fecha de vencimiento: " + suscripcionGuardada.getFechaFin());
            
            return suscripcionGuardada;
            
        } catch (Exception e) {
            System.out.println("❌ Error creando suscripción gratuita: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Verifica si una empresa tiene una suscripción activa
     */
    public boolean tieneSuscripcionActiva(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
        if (empresa == null) return false;
        return suscripcionRepository.existsByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA);
    }

    /**
     * Obtiene la suscripción activa de una empresa
     */
    public Suscripcion obtenerSuscripcionActiva(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
        if (empresa == null) return null;
        return suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
            .orElse(null);
    }
} 