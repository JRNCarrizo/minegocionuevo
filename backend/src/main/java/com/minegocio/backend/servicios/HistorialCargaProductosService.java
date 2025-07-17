package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.HistorialCargaProductosDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.HistorialCargaProductos;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.HistorialCargaProductosRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class HistorialCargaProductosService {
    
    @Autowired
    private HistorialCargaProductosRepository historialRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    // Registrar una nueva operación de carga
    public ApiResponse<HistorialCargaProductosDTO> registrarOperacion(
            Long empresaId,
            Long productoId,
            Long usuarioId,
            HistorialCargaProductos.TipoOperacion tipoOperacion,
            Integer cantidad,
            BigDecimal precioUnitario,
            String observacion,
            String metodoEntrada,
            String codigoBarras) {
        
        try {
            // Validar que existan las entidades
            Optional<Producto> productoOpt = productoRepository.findById(productoId);
            if (!productoOpt.isPresent()) {
                return new ApiResponse<>(false, "Producto no encontrado", null);
            }
            
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
            if (!usuarioOpt.isPresent()) {
                return new ApiResponse<>(false, "Usuario no encontrado", null);
            }
            
            Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
            if (!empresaOpt.isPresent()) {
                return new ApiResponse<>(false, "Empresa no encontrada", null);
            }
            
            Producto producto = productoOpt.get();
            Usuario usuario = usuarioOpt.get();
            Empresa empresa = empresaOpt.get();
            
            // Obtener stock anterior
            Integer stockAnterior = producto.getStock();
            Integer stockNuevo = stockAnterior + cantidad;
            
            // Calcular valor total
            BigDecimal valorTotal = precioUnitario.multiply(BigDecimal.valueOf(cantidad));
            
            // Crear el registro de historial
            HistorialCargaProductos historial = new HistorialCargaProductos();
            historial.setProducto(producto);
            historial.setUsuario(usuario);
            historial.setEmpresa(empresa);
            historial.setTipoOperacion(tipoOperacion);
            historial.setCantidad(cantidad);
            historial.setStockAnterior(stockAnterior);
            historial.setStockNuevo(stockNuevo);
            historial.setPrecioUnitario(precioUnitario);
            historial.setValorTotal(valorTotal);
            historial.setObservacion(observacion);
            historial.setMetodoEntrada(metodoEntrada);
            historial.setCodigoBarras(codigoBarras);
            historial.setFechaOperacion(LocalDateTime.now());
            
            // Guardar el historial
            HistorialCargaProductos historialGuardado = historialRepository.save(historial);
            
            // Actualizar el stock del producto
            producto.setStock(stockNuevo);
            productoRepository.save(producto);
            
            return new ApiResponse<>(true, "Operación registrada correctamente", 
                    new HistorialCargaProductosDTO(historialGuardado));
                    
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al registrar la operación: " + e.getMessage(), null);
        }
    }
    
    // Obtener historial paginado por empresa
    public ApiResponse<Page<HistorialCargaProductosDTO>> obtenerHistorialPorEmpresa(
            Long empresaId, int pagina, int tamanio) {
        
        try {
            Pageable pageable = PageRequest.of(pagina, tamanio, 
                    Sort.by(Sort.Direction.DESC, "fechaOperacion"));
            
            Page<HistorialCargaProductos> historialPage = historialRepository
                    .findByEmpresaIdOrderByFechaOperacionDesc(empresaId, pageable);
            
            Page<HistorialCargaProductosDTO> dtoPage = historialPage
                    .map(HistorialCargaProductosDTO::new);
            
            return new ApiResponse<>(true, "Historial obtenido correctamente", dtoPage);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el historial: " + e.getMessage(), null);
        }
    }
    
    // Búsqueda avanzada con filtros
    public ApiResponse<Page<HistorialCargaProductosDTO>> buscarConFiltros(
            Long empresaId,
            Long productoId,
            HistorialCargaProductos.TipoOperacion tipoOperacion,
            Long usuarioId,
            LocalDateTime fechaInicio,
            LocalDateTime fechaFin,
            String codigoBarras,
            int pagina,
            int tamanio) {
        
        try {
            Pageable pageable = PageRequest.of(pagina, tamanio, 
                    Sort.by(Sort.Direction.DESC, "fechaOperacion"));
            
            Page<HistorialCargaProductos> historialPage = historialRepository.buscarConFiltros(
                    empresaId, productoId, tipoOperacion, usuarioId, 
                    fechaInicio, fechaFin, codigoBarras, pageable);
            
            Page<HistorialCargaProductosDTO> dtoPage = historialPage
                    .map(HistorialCargaProductosDTO::new);
            
            return new ApiResponse<>(true, "Búsqueda realizada correctamente", dtoPage);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error en la búsqueda: " + e.getMessage(), null);
        }
    }
    
    // Obtener estadísticas por empresa
    public ApiResponse<Map<String, Object>> obtenerEstadisticasPorEmpresa(Long empresaId) {
        
        try {
            Map<String, Object> estadisticas = new HashMap<>();
            
            // Total de operaciones
            Long totalOperaciones = historialRepository.countByEmpresaId(empresaId);
            estadisticas.put("totalOperaciones", totalOperaciones);
            
            // Operaciones por tipo
            List<Object[]> operacionesPorTipo = historialRepository
                    .countByEmpresaIdAndTipoOperacion(empresaId);
            
            Map<String, Long> operacionesPorTipoMap = operacionesPorTipo.stream()
                    .collect(Collectors.toMap(
                            row -> ((HistorialCargaProductos.TipoOperacion) row[0]).getDescripcion(),
                            row -> (Long) row[1]
                    ));
            estadisticas.put("operacionesPorTipo", operacionesPorTipoMap);
            
            // Total de productos cargados
            Long totalCantidadCargada = historialRepository.sumCantidadCargadaByEmpresaId(empresaId);
            estadisticas.put("totalCantidadCargada", totalCantidadCargada != null ? totalCantidadCargada : 0);
            
            // Valor total de productos cargados
            Double totalValorCargado = historialRepository.sumValorTotalCargadoByEmpresaId(empresaId);
            estadisticas.put("totalValorCargado", totalValorCargado != null ? totalValorCargado : 0.0);
            
            // Últimas operaciones
            List<HistorialCargaProductos> ultimasOperaciones = historialRepository
                    .findTop10ByEmpresaIdOrderByFechaOperacionDesc(empresaId);
            
            List<HistorialCargaProductosDTO> ultimasOperacionesDTO = ultimasOperaciones.stream()
                    .map(HistorialCargaProductosDTO::new)
                    .collect(Collectors.toList());
            estadisticas.put("ultimasOperaciones", ultimasOperacionesDTO);
            
            return new ApiResponse<>(true, "Estadísticas obtenidas correctamente", estadisticas);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener estadísticas: " + e.getMessage(), null);
        }
    }
    
    // Obtener historial por producto
    public ApiResponse<Page<HistorialCargaProductosDTO>> obtenerHistorialPorProducto(
            Long empresaId, Long productoId, int pagina, int tamanio) {
        
        try {
            Pageable pageable = PageRequest.of(pagina, tamanio, 
                    Sort.by(Sort.Direction.DESC, "fechaOperacion"));
            
            Page<HistorialCargaProductos> historialPage = historialRepository
                    .findByEmpresaIdAndProductoIdOrderByFechaOperacionDesc(empresaId, productoId, pageable);
            
            Page<HistorialCargaProductosDTO> dtoPage = historialPage
                    .map(HistorialCargaProductosDTO::new);
            
            return new ApiResponse<>(true, "Historial del producto obtenido correctamente", dtoPage);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener el historial del producto: " + e.getMessage(), null);
        }
    }
    
    // Buscar por código de barras
    public ApiResponse<List<HistorialCargaProductosDTO>> buscarPorCodigoBarras(
            Long empresaId, String codigoBarras) {
        
        try {
            List<HistorialCargaProductos> historial = historialRepository
                    .findByEmpresaIdAndCodigoBarrasOrderByFechaOperacionDesc(empresaId, codigoBarras);
            
            List<HistorialCargaProductosDTO> dtoList = historial.stream()
                    .map(HistorialCargaProductosDTO::new)
                    .collect(Collectors.toList());
            
            return new ApiResponse<>(true, "Búsqueda por código de barras realizada correctamente", dtoList);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error en la búsqueda por código de barras: " + e.getMessage(), null);
        }
    }
    
    // Obtener operación por ID
    public ApiResponse<HistorialCargaProductosDTO> obtenerOperacionPorId(Long id) {
        
        try {
            Optional<HistorialCargaProductos> historialOpt = historialRepository.findById(id);
            
            if (!historialOpt.isPresent()) {
                return new ApiResponse<>(false, "Operación no encontrada", null);
            }
            
            HistorialCargaProductosDTO dto = new HistorialCargaProductosDTO(historialOpt.get());
            return new ApiResponse<>(true, "Operación obtenida correctamente", dto);
            
        } catch (Exception e) {
            return new ApiResponse<>(false, "Error al obtener la operación: " + e.getMessage(), null);
        }
    }
    
    /**
     * Registra la carga inicial de un producto recién creado
     */
    public void registrarCargaInicial(Producto producto, Empresa empresa, Usuario usuario) {
        try {
            // Crear el registro de historial para carga inicial
            HistorialCargaProductos historial = new HistorialCargaProductos();
            historial.setProducto(producto);
            historial.setUsuario(usuario); // Puede ser null para carga inicial del sistema
            historial.setEmpresa(empresa);
            historial.setTipoOperacion(HistorialCargaProductos.TipoOperacion.CARGA_INICIAL);
            historial.setCantidad(producto.getStock() != null ? producto.getStock() : 0);
            historial.setStockAnterior(0); // Stock anterior es 0 para productos nuevos
            historial.setStockNuevo(producto.getStock() != null ? producto.getStock() : 0);
            historial.setPrecioUnitario(producto.getPrecio() != null ? producto.getPrecio() : BigDecimal.ZERO);
            historial.setValorTotal(
                (producto.getPrecio() != null ? producto.getPrecio() : BigDecimal.ZERO)
                .multiply(BigDecimal.valueOf(producto.getStock() != null ? producto.getStock() : 0))
            );
            historial.setObservacion("Carga inicial de producto nuevo");
            historial.setMetodoEntrada("MANUAL");
            historial.setCodigoBarras(producto.getCodigoBarras());
            historial.setFechaOperacion(LocalDateTime.now());
            
            // Guardar el historial
            historialRepository.save(historial);
            
        } catch (Exception e) {
            // Log del error pero no fallar la operación principal
            System.err.println("Error al registrar carga inicial en historial: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 