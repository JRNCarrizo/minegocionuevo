package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.InventarioFisicoDTO;
import com.minegocio.backend.dto.DetalleInventarioFisicoDTO;
import com.minegocio.backend.entidades.InventarioFisico;
import com.minegocio.backend.entidades.DetalleInventarioFisico;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.InventarioFisicoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventarioFisicoService {

    @Autowired
    private InventarioFisicoRepository inventarioFisicoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Obtener historial de inventarios físicos por empresa
     */
    @Transactional(readOnly = true)
    public ApiResponse<Page<InventarioFisicoDTO>> obtenerHistorialPorEmpresa(Long empresaId, int pagina, int tamano) {
        try {
            Pageable pageable = PageRequest.of(pagina, tamano);
            Page<InventarioFisico> inventariosPage = inventarioFisicoRepository.findByEmpresaId(empresaId, pageable);
            
            Page<InventarioFisicoDTO> inventariosDTOPage = inventariosPage.map(InventarioFisicoDTO::new);
            
            return new ApiResponse<>(true, "Historial de inventarios físicos obtenido exitosamente", inventariosDTOPage);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el historial de inventarios físicos: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener inventario físico por ID
     */
    @Transactional(readOnly = true)
    public ApiResponse<InventarioFisicoDTO> obtenerInventarioPorId(Long inventarioId, Long empresaId) {
        try {
            InventarioFisico inventario = inventarioFisicoRepository.findById(inventarioId)
                .orElse(null);
            
            if (inventario == null) {
                return new ApiResponse<>(false, "Inventario físico no encontrado", null);
            }
            
            if (!inventario.getEmpresa().getId().equals(empresaId)) {
                return new ApiResponse<>(false, "No tienes permisos para acceder a este inventario", null);
            }
            
            InventarioFisicoDTO inventarioDTO = new InventarioFisicoDTO(inventario);
            return new ApiResponse<>(true, "Inventario físico obtenido exitosamente", inventarioDTO);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el inventario físico: " + e.getMessage(), null);
        }
    }

    /**
     * Guardar inventario físico
     */
    @Transactional
    public ApiResponse<InventarioFisicoDTO> guardarInventario(InventarioFisicoDTO inventarioDTO, Long empresaId, Long usuarioId) {
        try {
            Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
            
            Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

            InventarioFisico inventario = new InventarioFisico(empresa, usuario);
            inventario.setTotalProductos(inventarioDTO.getTotalProductos());
            inventario.setProductosConDiferencias(inventarioDTO.getProductosConDiferencias());
            inventario.setValorTotalDiferencias(inventarioDTO.getValorTotalDiferencias());
            inventario.setPorcentajePrecision(inventarioDTO.getPorcentajePrecision());
            inventario.setEstado(InventarioFisico.EstadoInventario.COMPLETADO);

            // Guardar detalles
            if (inventarioDTO.getDetalles() != null) {
                List<DetalleInventarioFisico> detalles = inventarioDTO.getDetalles().stream()
                    .map(detalleDTO -> {
                        Producto producto = productoRepository.findById(detalleDTO.getProductoId())
                            .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalleDTO.getProductoId()));
                        
                        return new DetalleInventarioFisico(inventario, producto, 
                            detalleDTO.getStockReal(), detalleDTO.getStockEscaneado());
                    })
                    .collect(Collectors.toList());
                
                inventario.setDetalles(detalles);
            }

            InventarioFisico inventarioGuardado = inventarioFisicoRepository.save(inventario);
            InventarioFisicoDTO inventarioGuardadoDTO = new InventarioFisicoDTO(inventarioGuardado);
            
            return new ApiResponse<>(true, "Inventario físico guardado exitosamente", inventarioGuardadoDTO);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al guardar el inventario físico: " + e.getMessage(), null);
        }
    }

    /**
     * Eliminar inventario físico
     */
    @Transactional
    public ApiResponse<Void> eliminarInventario(Long inventarioId, Long empresaId) {
        try {
            InventarioFisico inventario = inventarioFisicoRepository.findById(inventarioId)
                .orElse(null);
            
            if (inventario == null) {
                return new ApiResponse<>(false, "Inventario físico no encontrado", null);
            }
            
            if (!inventario.getEmpresa().getId().equals(empresaId)) {
                return new ApiResponse<>(false, "No tienes permisos para eliminar este inventario", null);
            }
            
            inventarioFisicoRepository.delete(inventario);
            return new ApiResponse<>(true, "Inventario físico eliminado exitosamente", null);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al eliminar el inventario físico: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener estadísticas de inventarios físicos
     */
    public ApiResponse<Object> obtenerEstadisticas(Long empresaId) {
        try {
            Long totalInventarios = inventarioFisicoRepository.countByEmpresaId(empresaId);
            
            List<InventarioFisico> ultimosInventarios = inventarioFisicoRepository
                .findTopByEmpresaIdOrderByFechaInventarioDesc(empresaId, PageRequest.of(0, 5));
            
            BigDecimal valorTotalDiferencias = ultimosInventarios.stream()
                .map(InventarioFisico::getValorTotalDiferencias)
                .filter(valor -> valor != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            Double promedioPrecision = ultimosInventarios.stream()
                .map(InventarioFisico::getPorcentajePrecision)
                .filter(precision -> precision != null)
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.0);
            
            return new ApiResponse<>(true, "Estadísticas obtenidas exitosamente", 
                java.util.Map.of(
                    "totalInventarios", totalInventarios,
                    "valorTotalDiferencias", valorTotalDiferencias,
                    "promedioPrecision", promedioPrecision,
                    "ultimosInventarios", ultimosInventarios.stream()
                        .map(InventarioFisicoDTO::new)
                        .collect(Collectors.toList())
                ));
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener estadísticas: " + e.getMessage(), null);
        }
    }
} 