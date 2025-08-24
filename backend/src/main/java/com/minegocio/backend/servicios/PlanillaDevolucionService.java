package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetallePlanillaDevolucionDTO;
import com.minegocio.backend.dto.DetallePlanillaDevolucionResponseDTO;
import com.minegocio.backend.dto.PlanillaDevolucionDTO;
import com.minegocio.backend.dto.PlanillaDevolucionResponseDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.DetallePlanillaDevolucionRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanillaDevolucionRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanillaDevolucionService {

    @Autowired
    private PlanillaDevolucionRepository planillaDevolucionRepository;

    @Autowired
    private DetallePlanillaDevolucionRepository detallePlanillaDevolucionRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Crear una nueva planilla de devolución y SUMAR al stock
     */
    public PlanillaDevolucion crearPlanillaDevolucion(PlanillaDevolucionDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        System.out.println("🔄 [DEVOLUCION] Creando planilla de devolución...");
        System.out.println("🔄 [DEVOLUCION] Fecha recibida en DTO: " + dto.getFechaPlanilla());
        
        // Asegurar que la fecha se procese correctamente en UTC
        LocalDateTime fechaPlanilla = dto.getFechaPlanilla();
        if (fechaPlanilla == null) {
            fechaPlanilla = LocalDateTime.now();
            System.out.println("🔄 [DEVOLUCION] Fecha nula, usando fecha actual: " + fechaPlanilla);
        }
        
        PlanillaDevolucion planilla = new PlanillaDevolucion(empresa, usuario, fechaPlanilla);
        planilla.setObservaciones(dto.getObservaciones());

        // Si se proporciona un número de planilla específico, usarlo
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
        }

        planilla = planillaDevolucionRepository.save(planilla);

        // Calcular el total de productos basándose en los detalles del DTO
        int totalProductos = 0;
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            totalProductos = dto.getDetalles().stream()
                    .mapToInt(DetallePlanillaDevolucionDTO::getCantidad)
                    .sum();
        }
        planilla.setTotalProductos(totalProductos);

        // Agregar detalles si se proporcionan y SUMAR al stock
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (DetallePlanillaDevolucionDTO detalleDTO : dto.getDetalles()) {
                DetallePlanillaDevolucion detalle = new DetallePlanillaDevolucion(planilla, detalleDTO.getDescripcion(), detalleDTO.getCantidad());
                detalle.setNumeroPersonalizado(detalleDTO.getNumeroPersonalizado());
                detalle.setObservaciones(detalleDTO.getObservaciones());

                // Si se especifica un producto, asociarlo y SUMAR al stock
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
                        
                        // SUMAR al stock del producto (devolución)
                        sumarAlStock(producto, detalleDTO.getCantidad());
                    }
                }

                detallePlanillaDevolucionRepository.save(detalle);
            }
        }

        return planillaDevolucionRepository.save(planilla);
    }

    /**
     * SUMAR cantidad al stock de un producto (para devoluciones)
     */
    private void sumarAlStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int stockAnterior = producto.getStock();
            int nuevoStock = producto.getStock() + cantidad;
            
            System.out.println("🔄 [DEVOLUCION] Sumando al stock:");
            System.out.println("   Producto: " + producto.getNombre());
            System.out.println("   Stock anterior: " + stockAnterior);
            System.out.println("   Cantidad a sumar: " + cantidad);
            System.out.println("   Nuevo stock: " + nuevoStock);
            
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock actualizado exitosamente");
        }
    }

    /**
     * Obtener todas las planillas de devolución de una empresa
     */
    public List<PlanillaDevolucionResponseDTO> obtenerPlanillasDevolucionPorEmpresa(Long empresaId) {
        System.out.println("🔍 [DEVOLUCION] Buscando planillas para empresa ID: " + empresaId);
        List<PlanillaDevolucion> planillas = planillaDevolucionRepository.findByEmpresaIdOrderByFechaPlanillaDesc(empresaId);
        System.out.println("🔍 [DEVOLUCION] Planillas encontradas: " + planillas.size());
        
        List<PlanillaDevolucionResponseDTO> result = planillas.stream().map(planilla -> {
            System.out.println("🔍 [DEVOLUCION] Procesando planilla ID: " + planilla.getId());
            // Cargar los detalles para cada planilla
            List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
            System.out.println("🔍 [DEVOLUCION] Detalles encontrados para planilla " + planilla.getId() + ": " + detalles.size());
            
            // Convertir detalles a DTOs
            List<DetallePlanillaDevolucionResponseDTO> detallesDTO = detalles.stream()
                .map(detalle -> new DetallePlanillaDevolucionResponseDTO(
                    detalle.getId(),
                    detalle.getNumeroPersonalizado(),
                    detalle.getDescripcion(),
                    detalle.getCantidad(),
                    detalle.getObservaciones(),
                    detalle.getFechaCreacion()
                ))
                .collect(Collectors.toList());
            
            return new PlanillaDevolucionResponseDTO(
                planilla.getId(),
                planilla.getNumeroPlanilla(),
                planilla.getObservaciones(),
                planilla.getFechaPlanilla(),
                planilla.getTotalProductos(),
                planilla.getFechaCreacion(),
                planilla.getFechaActualizacion(),
                detallesDTO
            );
        }).collect(Collectors.toList());
        
        System.out.println("🔍 [DEVOLUCION] Total DTOs retornados: " + result.size());
        return result;
    }

    /**
     * Obtener planilla de devolución por ID
     */
    public Optional<PlanillaDevolucion> obtenerPlanillaDevolucionPorId(Long id) {
        return planillaDevolucionRepository.findById(id);
    }

    /**
     * Eliminar planilla de devolución y RESTAR del stock
     */
    public void eliminarPlanillaDevolucion(Long id) {
        PlanillaDevolucion planilla = planillaDevolucionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla de devolución no encontrada"));

        // Restar del stock antes de eliminar
        List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(id);
        
        for (DetallePlanillaDevolucion detalle : detalles) {
            if (detalle.getProducto() != null) {
                // Restar del stock (revertir la devolución)
                restarDelStock(detalle.getProducto(), detalle.getCantidad());
            }
        }

        // Eliminar detalles primero
        detallePlanillaDevolucionRepository.deleteByPlanillaDevolucionId(id);
        
        // Eliminar la planilla
        planillaDevolucionRepository.delete(planilla);
    }

    /**
     * RESTAR cantidad del stock de un producto (para revertir devoluciones)
     */
    private void restarDelStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int stockAnterior = producto.getStock();
            int nuevoStock = producto.getStock() - cantidad;
            
            if (nuevoStock < 0) {
                throw new RuntimeException("No se puede restar más stock del disponible para el producto: " + producto.getNombre() + 
                    ". Stock disponible: " + producto.getStock() + ", Cantidad a restar: " + cantidad);
            }
            
            System.out.println("🔄 [DEVOLUCION] Revertiendo devolución - Restando del stock:");
            System.out.println("   Producto: " + producto.getNombre());
            System.out.println("   Stock anterior: " + stockAnterior);
            System.out.println("   Cantidad a restar: " + cantidad);
            System.out.println("   Nuevo stock: " + nuevoStock);
            
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock revertido exitosamente");
        }
    }
}
