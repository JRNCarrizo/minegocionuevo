package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetallePlanillaPedidoDTO;
import com.minegocio.backend.dto.PlanillaPedidoDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.DetallePlanillaPedidoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanillaPedidoRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanillaPedidoService {

    @Autowired
    private PlanillaPedidoRepository planillaPedidoRepository;

    @Autowired
    private DetallePlanillaPedidoRepository detallePlanillaPedidoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Crear una nueva planilla de pedido
     */
    public PlanillaPedido crearPlanillaPedido(PlanillaPedidoDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrada"));

        PlanillaPedido planilla = new PlanillaPedido(empresa, usuario, dto.getFechaPlanilla());
        planilla.setObservaciones(dto.getObservaciones());

        // Si se proporciona un número de planilla específico, usarlo
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
        }

        planilla = planillaPedidoRepository.save(planilla);

        // Agregar detalles si se proporcionan
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (DetallePlanillaPedidoDTO detalleDTO : dto.getDetalles()) {
                DetallePlanillaPedido detalle = new DetallePlanillaPedido(planilla, detalleDTO.getDescripcion(), detalleDTO.getCantidad());
                detalle.setNumeroPersonalizado(detalleDTO.getNumeroPersonalizado());
                detalle.setObservaciones(detalleDTO.getObservaciones());

                // Si se especifica un producto, asociarlo
                if (detalleDTO.getProductoId() != null) {
                    Producto producto = productoRepository.findById(detalleDTO.getProductoId())
                            .orElse(null);
                    if (producto != null) {
                        detalle.setProducto(producto);
                        if (detalle.getNumeroPersonalizado() == null) {
                            detalle.setNumeroPersonalizado(producto.getCodigoPersonalizado());
                        }
                        if (detalle.getDescripcion() == null) {
                            detalle.setDescripcion(producto.getNombre());
                        }
                    }
                }

                detallePlanillaPedidoRepository.save(detalle);
            }
        }

        planilla.calcularTotalProductos();
        return planillaPedidoRepository.save(planilla);
    }

    /**
     * Obtener todas las planillas de una empresa
     */
    public List<PlanillaPedido> obtenerPlanillasPorEmpresa(Long empresaId) {
        return planillaPedidoRepository.findByEmpresaIdOrderByFechaPlanillaDesc(empresaId);
    }

    /**
     * Obtener planillas por empresa y fecha
     */
    public List<PlanillaPedido> obtenerPlanillasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaOrderByFechaCreacionDesc(empresaId, fecha);
    }

    /**
     * Obtener planillas por empresa y rango de fechas
     */
    public List<PlanillaPedido> obtenerPlanillasPorEmpresaYRangoFechas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        return planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaPlanillaDesc(empresaId, fechaInicio, fechaFin);
    }

    /**
     * Obtener planilla por ID
     */
    public Optional<PlanillaPedido> obtenerPlanillaPorId(Long id) {
        return planillaPedidoRepository.findById(id);
    }

    /**
     * Obtener planilla por número de planilla
     */
    public Optional<PlanillaPedido> obtenerPlanillaPorNumero(String numeroPlanilla) {
        return planillaPedidoRepository.findByNumeroPlanilla(numeroPlanilla);
    }

    /**
     * Actualizar planilla de pedido
     */
    public PlanillaPedido actualizarPlanillaPedido(Long id, PlanillaPedidoDTO dto) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        if (dto.getObservaciones() != null) {
            planilla.setObservaciones(dto.getObservaciones());
        }

        if (dto.getFechaPlanilla() != null) {
            planilla.setFechaPlanilla(dto.getFechaPlanilla());
        }

        return planillaPedidoRepository.save(planilla);
    }

    /**
     * Eliminar planilla de pedido
     */
    public void eliminarPlanillaPedido(Long id) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        // Eliminar detalles primero
        detallePlanillaPedidoRepository.deleteByPlanillaPedidoId(id);
        
        // Eliminar planilla
        planillaPedidoRepository.delete(planilla);
    }

    /**
     * Agregar detalle a una planilla
     */
    public DetallePlanillaPedido agregarDetalle(Long planillaId, DetallePlanillaPedidoDTO dto) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(planillaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        DetallePlanillaPedido detalle = new DetallePlanillaPedido(planilla, dto.getDescripcion(), dto.getCantidad());
        detalle.setNumeroPersonalizado(dto.getNumeroPersonalizado());
        detalle.setObservaciones(dto.getObservaciones());

        // Si se especifica un producto, asociarlo
        if (dto.getProductoId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoId())
                    .orElse(null);
            if (producto != null) {
                detalle.setProducto(producto);
                if (detalle.getNumeroPersonalizado() == null) {
                    detalle.setNumeroPersonalizado(producto.getCodigoPersonalizado());
                }
                if (detalle.getDescripcion() == null) {
                    detalle.setDescripcion(producto.getNombre());
                }
            }
        }

        detalle = detallePlanillaPedidoRepository.save(detalle);
        
        // Recalcular total
        planilla.calcularTotalProductos();
        planillaPedidoRepository.save(planilla);

        return detalle;
    }

    /**
     * Obtener detalles de una planilla
     */
    public List<DetallePlanillaPedido> obtenerDetallesPorPlanilla(Long planillaId) {
        return detallePlanillaPedidoRepository.findByPlanillaPedidoIdOrderByFechaCreacionAsc(planillaId);
    }

    /**
     * Eliminar detalle de una planilla
     */
    public void eliminarDetalle(Long detalleId) {
        DetallePlanillaPedido detalle = detallePlanillaPedidoRepository.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado"));

        PlanillaPedido planilla = detalle.getPlanillaPedido();
        
        detallePlanillaPedidoRepository.delete(detalle);
        
        // Recalcular total
        planilla.calcularTotalProductos();
        planillaPedidoRepository.save(planilla);
    }

    /**
     * Contar planillas por empresa
     */
    public long contarPlanillasPorEmpresa(Long empresaId) {
        return planillaPedidoRepository.countByEmpresaId(empresaId);
    }

    /**
     * Contar planillas por empresa y fecha
     */
    public long contarPlanillasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return planillaPedidoRepository.countByEmpresaIdAndFechaPlanilla(empresaId, fecha);
    }
}
