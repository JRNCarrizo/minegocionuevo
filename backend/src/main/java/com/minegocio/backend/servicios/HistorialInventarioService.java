package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.EstadisticasInventarioDTO;
import com.minegocio.backend.dto.HistorialInventarioDTO;
import com.minegocio.backend.dto.InventarioRequestDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.HistorialInventarioRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HistorialInventarioService {

    @Autowired
    private HistorialInventarioRepository historialInventarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Registrar una operación de inventario
     */
    @Transactional
    public ApiResponse<HistorialInventarioDTO> registrarOperacionInventario(InventarioRequestDTO request, Long usuarioId, Long empresaId) {
        try {
            // Validar que el producto existe y pertenece a la empresa
            Optional<Producto> productoOpt = productoRepository.findByIdAndEmpresaId(request.getProductoId(), empresaId);
            if (productoOpt.isEmpty()) {
                return new ApiResponse<>(false, "Producto no encontrado", null);
            }

            Producto producto = productoOpt.get();

            // Obtener la empresa del producto
            Empresa empresa = producto.getEmpresa();

            // Buscar usuario si se proporciona usuarioId
            Usuario usuario = null;
            if (usuarioId != null) {
                Optional<Usuario> usuarioOpt = usuarioRepository.findByIdAndEmpresaId(usuarioId, empresaId);
                if (usuarioOpt.isPresent()) {
                    usuario = usuarioOpt.get();
                } else {
                    // Si no se encuentra el usuario, buscar un usuario administrador de la empresa
                    Optional<Usuario> adminOpt = usuarioRepository.findAdministradorPrincipal(empresa);
                    if (adminOpt.isPresent()) {
                        usuario = adminOpt.get();
                    }
                }
            } else {
                // Si no se proporciona usuarioId, buscar un usuario administrador de la empresa
                Optional<Usuario> adminOpt = usuarioRepository.findAdministradorPrincipal(empresa);
                if (adminOpt.isPresent()) {
                    usuario = adminOpt.get();
                }
            }

            // Validar tipo de operación
            HistorialInventario.TipoOperacion tipoOperacion;
            try {
                tipoOperacion = HistorialInventario.TipoOperacion.valueOf(request.getTipoOperacion());
            } catch (IllegalArgumentException e) {
                return new ApiResponse<>(false, "Tipo de operación inválido", null);
            }

            // Obtener stock anterior
            Integer stockAnterior = producto.getStock();
            Integer stockNuevo = stockAnterior;

            // Calcular nuevo stock según el tipo de operación
            switch (tipoOperacion) {
                case INCREMENTO:
                    stockNuevo = stockAnterior + request.getCantidad();
                    break;
                case DECREMENTO:
                    if (stockAnterior < request.getCantidad()) {
                        return new ApiResponse<>(false, "Stock insuficiente para realizar la operación", null);
                    }
                    stockNuevo = stockAnterior - request.getCantidad();
                    break;
                case AJUSTE:
                case INVENTARIO_FISICO:
                    stockNuevo = request.getStockNuevo() != null ? request.getStockNuevo() : request.getCantidad();
                    break;
            }

            // Validar que el stock nuevo no sea negativo
            if (stockNuevo < 0) {
                return new ApiResponse<>(false, "El stock no puede ser negativo", null);
            }

            // Actualizar el stock del producto
            producto.setStock(stockNuevo);
            productoRepository.save(producto);

            // Crear el registro de historial
            HistorialInventario historial = new HistorialInventario();
            historial.setProducto(producto);
            historial.setUsuario(usuario);
            historial.setEmpresa(empresa);
            historial.setTipoOperacion(tipoOperacion);
            historial.setCantidad(request.getCantidad());
            historial.setStockAnterior(stockAnterior);
            historial.setStockNuevo(stockNuevo);
            historial.setPrecioUnitario(request.getPrecioUnitario());
            historial.setValorTotal(historial.calcularValorTotal());
            historial.setObservacion(request.getObservacion());
            historial.setCodigoBarras(request.getCodigoBarras());
            historial.setMetodoEntrada(request.getMetodoEntrada());

            // Guardar el historial
            System.out.println("=== DEBUG HISTORIAL INVENTARIO ===");
            System.out.println("Guardando historial para empresa: " + empresa.getId());
            System.out.println("Producto: " + producto.getNombre() + " (ID: " + producto.getId() + ")");
            System.out.println("Usuario: " + (usuario != null ? usuario.getNombre() : "Sistema"));
            System.out.println("Tipo operación: " + tipoOperacion);
            System.out.println("Cantidad: " + request.getCantidad());
            System.out.println("Stock anterior: " + stockAnterior + " -> Stock nuevo: " + stockNuevo);
            System.out.println("Observación: " + request.getObservacion());
            
            HistorialInventario historialGuardado = historialInventarioRepository.save(historial);
            
            System.out.println("Historial guardado con ID: " + historialGuardado.getId());
            System.out.println("=== FIN DEBUG HISTORIAL INVENTARIO ===");

            return new ApiResponse<>(true, "Operación de inventario registrada exitosamente", 
                                   new HistorialInventarioDTO(historialGuardado));

        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al registrar la operación de inventario: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener historial de inventario por empresa
     */
    public ApiResponse<Page<HistorialInventarioDTO>> obtenerHistorialPorEmpresa(Long empresaId, int pagina, int tamano) {
        try {
            System.out.println("=== DEBUG CONSULTA HISTORIAL ===");
            System.out.println("Consultando historial para empresa: " + empresaId);
            System.out.println("Página: " + pagina + ", Tamaño: " + tamano);
            
            Pageable pageable = PageRequest.of(pagina, tamano);
            Page<HistorialInventario> historialPage = historialInventarioRepository.findByEmpresaId(empresaId, pageable);
            
            System.out.println("Total de elementos encontrados: " + historialPage.getTotalElements());
            System.out.println("Total de páginas: " + historialPage.getTotalPages());
            System.out.println("Elementos en esta página: " + historialPage.getContent().size());
            
            if (!historialPage.getContent().isEmpty()) {
                System.out.println("Primer elemento: " + historialPage.getContent().get(0).getId());
                System.out.println("Último elemento: " + historialPage.getContent().get(historialPage.getContent().size() - 1).getId());
            }
            
            System.out.println("=== FIN DEBUG CONSULTA HISTORIAL ===");
            
            Page<HistorialInventarioDTO> historialDTOPage = historialPage.map(HistorialInventarioDTO::new);
            
            return new ApiResponse<>(true, "Historial obtenido exitosamente", historialDTOPage);
        } catch (Exception e) {
            System.err.println("Error al obtener historial: " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, "Error al obtener el historial: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener historial de inventario por producto
     */
    public ApiResponse<List<HistorialInventarioDTO>> obtenerHistorialPorProducto(Long empresaId, Long productoId) {
        try {
            List<HistorialInventario> historial = historialInventarioRepository.findByEmpresaIdAndProductoId(empresaId, productoId);
            List<HistorialInventarioDTO> historialDTO = historial.stream()
                    .map(HistorialInventarioDTO::new)
                    .collect(Collectors.toList());
            
            return new ApiResponse<>(true, "Historial del producto obtenido exitosamente", historialDTO);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el historial del producto: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener historial de inventario por rango de fechas
     */
    public ApiResponse<List<HistorialInventarioDTO>> obtenerHistorialPorFechas(Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        try {
            List<HistorialInventario> historial = historialInventarioRepository.findByEmpresaIdAndFechaOperacionBetween(empresaId, fechaInicio, fechaFin);
            List<HistorialInventarioDTO> historialDTO = historial.stream()
                    .map(HistorialInventarioDTO::new)
                    .collect(Collectors.toList());
            
            return new ApiResponse<>(true, "Historial por fechas obtenido exitosamente", historialDTO);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el historial por fechas: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener estadísticas de inventario
     */
    public ApiResponse<EstadisticasInventarioDTO> obtenerEstadisticas(Long empresaId) {
        try {
            System.out.println("=== DEBUG ESTADÍSTICAS ===");
            System.out.println("Consultando estadísticas para empresa: " + empresaId);
            
            Object[] estadisticas = historialInventarioRepository.getEstadisticasByEmpresaId(empresaId);
            
            System.out.println("Resultado de la consulta SQL:");
            if (estadisticas != null) {
                for (int i = 0; i < estadisticas.length; i++) {
                    System.out.println("  [" + i + "]: " + estadisticas[i] + " (tipo: " + (estadisticas[i] != null ? estadisticas[i].getClass().getSimpleName() : "null") + ")");
                }
            } else {
                System.out.println("  Resultado es null");
            }
            
            EstadisticasInventarioDTO estadisticasDTO = new EstadisticasInventarioDTO(estadisticas);
            
            System.out.println("DTO creado:");
            System.out.println("  totalOperaciones: " + estadisticasDTO.getTotalOperaciones());
            System.out.println("  totalIncrementos: " + estadisticasDTO.getTotalIncrementos());
            System.out.println("  totalDecrementos: " + estadisticasDTO.getTotalDecrementos());
            System.out.println("  totalAjustes: " + estadisticasDTO.getTotalAjustes());
            System.out.println("  valorTotalIncrementos: " + estadisticasDTO.getValorTotalIncrementos());
            System.out.println("  valorTotalDecrementos: " + estadisticasDTO.getValorTotalDecrementos());
            System.out.println("  valorTotalAjustes: " + estadisticasDTO.getValorTotalAjustes());
            System.out.println("  valorTotalMovimientos: " + estadisticasDTO.getValorTotalMovimientos());
            System.out.println("=== FIN DEBUG ESTADÍSTICAS ===");
            
            return new ApiResponse<>(true, "Estadísticas obtenidas exitosamente", estadisticasDTO);
        } catch (Exception e) {
            System.err.println("Error al obtener estadísticas: " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, "Error al obtener las estadísticas: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener estadísticas de inventario por rango de fechas
     */
    public ApiResponse<EstadisticasInventarioDTO> obtenerEstadisticasPorFechas(Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        try {
            System.out.println("=== DEBUG ESTADÍSTICAS POR FECHAS ===");
            System.out.println("Consultando estadísticas para empresa: " + empresaId);
            System.out.println("Fecha inicio: " + fechaInicio);
            System.out.println("Fecha fin: " + fechaFin);
            
            Object[] estadisticas = historialInventarioRepository.getEstadisticasByEmpresaIdAndFechaOperacionBetween(empresaId, fechaInicio, fechaFin);
            
            System.out.println("Resultado de la consulta SQL por fechas:");
            if (estadisticas != null) {
                for (int i = 0; i < estadisticas.length; i++) {
                    System.out.println("  [" + i + "]: " + estadisticas[i] + " (tipo: " + (estadisticas[i] != null ? estadisticas[i].getClass().getSimpleName() : "null") + ")");
                }
            } else {
                System.out.println("  Resultado es null");
            }
            
            EstadisticasInventarioDTO estadisticasDTO = new EstadisticasInventarioDTO(estadisticas);
            
            System.out.println("DTO creado por fechas:");
            System.out.println("  totalOperaciones: " + estadisticasDTO.getTotalOperaciones());
            System.out.println("  totalIncrementos: " + estadisticasDTO.getTotalIncrementos());
            System.out.println("  totalDecrementos: " + estadisticasDTO.getTotalDecrementos());
            System.out.println("  totalAjustes: " + estadisticasDTO.getTotalAjustes());
            System.out.println("  valorTotalIncrementos: " + estadisticasDTO.getValorTotalIncrementos());
            System.out.println("  valorTotalDecrementos: " + estadisticasDTO.getValorTotalDecrementos());
            System.out.println("  valorTotalAjustes: " + estadisticasDTO.getValorTotalAjustes());
            System.out.println("  valorTotalMovimientos: " + estadisticasDTO.getValorTotalMovimientos());
            System.out.println("=== FIN DEBUG ESTADÍSTICAS POR FECHAS ===");
            
            return new ApiResponse<>(true, "Estadísticas por fechas obtenidas exitosamente", estadisticasDTO);
        } catch (Exception e) {
            System.err.println("Error al obtener estadísticas por fechas: " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, "Error al obtener las estadísticas por fechas: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener productos más movidos en inventario
     */
    public ApiResponse<List<Object[]>> obtenerProductosMasMovidos(Long empresaId, int limite) {
        try {
            Pageable pageable = PageRequest.of(0, limite);
            List<Object[]> productosMasMovidos = historialInventarioRepository.getProductosMasMovidos(empresaId, pageable);
            
            return new ApiResponse<>(true, "Productos más movidos obtenidos exitosamente", productosMasMovidos);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener los productos más movidos: " + e.getMessage(), null);
        }
    }

    /**
     * Obtener usuarios más activos en inventario
     */
    public ApiResponse<List<Object[]>> obtenerUsuariosMasActivos(Long empresaId, int limite) {
        try {
            Pageable pageable = PageRequest.of(0, limite);
            List<Object[]> usuariosMasActivos = historialInventarioRepository.getUsuariosMasActivos(empresaId, pageable);
            
            return new ApiResponse<>(true, "Usuarios más activos obtenidos exitosamente", usuariosMasActivos);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener los usuarios más activos: " + e.getMessage(), null);
        }
    }

    /**
     * Buscar historial por código de barras
     */
    public ApiResponse<List<HistorialInventarioDTO>> buscarPorCodigoBarras(Long empresaId, String codigoBarras) {
        try {
            List<HistorialInventario> historial = historialInventarioRepository.findByEmpresaIdAndCodigoBarras(empresaId, codigoBarras);
            List<HistorialInventarioDTO> historialDTO = historial.stream()
                    .map(HistorialInventarioDTO::new)
                    .collect(Collectors.toList());
            
            return new ApiResponse<>(true, "Historial por código de barras obtenido exitosamente", historialDTO);
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al buscar por código de barras: " + e.getMessage(), null);
        }
    }
} 