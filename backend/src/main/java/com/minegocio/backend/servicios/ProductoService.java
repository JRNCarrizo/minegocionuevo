package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.dto.InventarioRequestDTO;
import com.minegocio.backend.dto.DependenciasProductoDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.HistorialCargaProductos;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import java.time.LocalDateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.UUID;
import java.util.Random;

@Service
@Transactional
public class ProductoService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private NotificacionService notificacionService;
    
    @Autowired
    private HistorialInventarioService historialInventarioService;
    
    @Autowired
    private HistorialCargaProductosService historialCargaProductosService;
    
    // Repositorios para verificar dependencias
    @Autowired
    private com.minegocio.backend.repositorios.DetalleRemitoIngresoRepository detalleRemitoIngresoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private SectorRepository sectorRepository;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Método auxiliar para crear sector automáticamente si no existe
     */
    private Sector crearSectorAutomaticamente(String nombreSector, Long empresaId) {
        if (nombreSector == null || nombreSector.trim().isEmpty()) {
            return null;
        }
        
        // Verificar si el sector ya existe
        Optional<Sector> sectorExistente = sectorRepository.findByNombreAndEmpresaId(nombreSector.trim(), empresaId);
        if (sectorExistente.isPresent()) {
            return sectorExistente.get();
        }
        
        // Crear nuevo sector
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        Sector nuevoSector = new Sector();
        nuevoSector.setNombre(nombreSector.trim());
        nuevoSector.setDescripcion("Sector creado automáticamente desde producto");
        nuevoSector.setUbicacion("Ubicación por definir");
        nuevoSector.setEmpresa(empresa);
        nuevoSector.setActivo(true);
        
        Sector sectorGuardado = sectorRepository.save(nuevoSector);
        System.out.println("✅ Sector creado automáticamente: " + nombreSector);
        
        return sectorGuardado;
    }

    /**
     * Método auxiliar para asignar stock a sector automáticamente
     */
    private void asignarStockASectorAutomaticamente(Producto producto, Sector sector, Integer stock) {
        if (sector == null || stock == null || stock <= 0) {
            return;
        }
        
        // Verificar si ya existe un registro para este producto y sector
        Optional<StockPorSector> stockExistente = stockPorSectorRepository
            .findByProductoIdAndSectorId(producto.getId(), sector.getId());
        
        if (stockExistente.isEmpty()) {
            // Crear registro de stock por sector
            StockPorSector stockPorSector = new StockPorSector();
            stockPorSector.setProducto(producto);
            stockPorSector.setSector(sector);
            stockPorSector.setCantidad(stock);
            
            stockPorSectorRepository.save(stockPorSector);
            System.out.println("✅ Stock asignado automáticamente al sector: " + sector.getNombre() + " - Cantidad: " + stock);
        }
    }

    public List<ProductoDTO> obtenerTodosLosProductos(Long empresaId) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndActivoTrue(empresaId);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<ProductoDTO> obtenerTodosLosProductosIncluirInactivos(Long empresaId) {
        List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public Page<ProductoDTO> obtenerProductosPaginados(Long empresaId, Pageable pageable) {
        Page<Producto> productos = productoRepository.findByEmpresaIdAndActivoTrue(empresaId, pageable);
        return productos.map(this::convertirADTO);
    }

    public List<ProductoDTO> buscarProductos(Long empresaId, String termino) {
        List<Producto> productos = productoRepository.buscarPorNombreOCategoria(empresaId, termino);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public Optional<ProductoDTO> obtenerProductoPorId(Long id, Long empresaId) {
        Optional<Producto> producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId);
        return producto.map(this::convertirADTO);
    }

    /**
     * Obtiene un producto por ID sin filtro (para edición)
     */
    public Optional<ProductoDTO> obtenerProductoPorIdSinFiltro(Long id, Long empresaId) {
        Optional<Producto> producto = productoRepository.findByIdAndEmpresaId(id, empresaId);
        return producto.map(this::convertirADTO);
    }

    public ProductoDTO crearProducto(Long empresaId, ProductoDTO productoDTO) {
        System.out.println("🔍 ProductoService.crearProducto - Iniciando...");
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        System.out.println("✅ Empresa encontrada: " + empresa.getNombre());

        Producto producto = new Producto();
        producto.setNombre(productoDTO.getNombre());
        producto.setDescripcion(productoDTO.getDescripcion());
        producto.setPrecio(productoDTO.getPrecio()); // El precio puede ser null
        producto.setStock(productoDTO.getStock() != null ? productoDTO.getStock() : 0);
        producto.setStockMinimo(productoDTO.getStockMinimo() != null ? productoDTO.getStockMinimo() : 0);
        
        System.out.println("🔍 Configurando imágenes...");
        // Manejar imágenes
        if (productoDTO.getImagenes() != null && !productoDTO.getImagenes().isEmpty()) {
            System.out.println("✅ Usando lista de imágenes: " + productoDTO.getImagenes());
            producto.setImagenes(new ArrayList<>(productoDTO.getImagenes()));
        } else if (productoDTO.getImagenUrl() != null && !productoDTO.getImagenUrl().isEmpty()) {
            System.out.println("✅ Usando imagen URL: " + productoDTO.getImagenUrl());
            // Compatibilidad hacia atrás
            List<String> imagenes = new ArrayList<>();
            imagenes.add(productoDTO.getImagenUrl());
            producto.setImagenes(imagenes);
        } else {
            System.out.println("ℹ️ No se proporcionaron imágenes");
        }
        
        producto.setCategoria(productoDTO.getCategoria());
        producto.setMarca(productoDTO.getMarca());
        producto.setUnidad(productoDTO.getUnidad());
        producto.setSectorAlmacenamiento(productoDTO.getSectorAlmacenamiento());
        producto.setCodigoPersonalizado(productoDTO.getCodigoPersonalizado());
        producto.setCodigoBarras(productoDTO.getCodigoBarras());
        producto.setActivo(true);
        producto.setEmpresa(empresa);

        System.out.println("🔍 Guardando producto en base de datos...");
        Producto productoGuardado = productoRepository.save(producto);
        System.out.println("✅ Producto guardado con ID: " + productoGuardado.getId());
        
        // Crear sector automáticamente si se especificó un sector de almacenamiento
        if (productoDTO.getSectorAlmacenamiento() != null && !productoDTO.getSectorAlmacenamiento().trim().isEmpty()) {
            try {
                System.out.println("🔍 Procesando sector de almacenamiento: " + productoDTO.getSectorAlmacenamiento());
                Sector sector = crearSectorAutomaticamente(productoDTO.getSectorAlmacenamiento(), empresaId);
                
                if (sector != null && productoDTO.getStock() != null && productoDTO.getStock() > 0) {
                    asignarStockASectorAutomaticamente(productoGuardado, sector, productoDTO.getStock());
                }
            } catch (Exception e) {
                System.err.println("❌ Error al procesar sector automáticamente: " + e.getMessage());
                // No fallar la creación del producto si hay error en el sector
            }
        }
        
        // Registrar la creación en el historial de inventario
        /*
        try {
            System.out.println("🔍 Registrando en historial de inventario...");
            InventarioRequestDTO request = new InventarioRequestDTO();
            request.setProductoId(productoGuardado.getId());
            request.setTipoOperacion("CARGA_INICIAL");
            request.setCantidad(productoDTO.getStock() != null ? productoDTO.getStock() : 0);
            request.setStockAnterior(0);
            request.setStockNuevo(productoDTO.getStock() != null ? productoDTO.getStock() : 0);
            request.setPrecioUnitario(productoDTO.getPrecio() != null ? productoDTO.getPrecio() : BigDecimal.ZERO);
            request.setObservacion("Creación de producto nuevo");
            request.setCodigoBarras(productoDTO.getCodigoBarras());
            request.setMetodoEntrada("MANUAL");
            
            historialInventarioService.registrarOperacionInventario(request, null, empresaId);
            System.out.println("✅ Historial de inventario registrado");
        } catch (Exception e) {
            // Log del error pero no fallar la operación principal
            System.err.println("❌ Error al registrar historial de inventario en creación de producto: " + e.getMessage());
        }
        */
        System.out.println("ℹ️ Historial de inventario temporalmente deshabilitado");
        
        // Registrar la carga inicial en el historial de carga de productos
        /*
        try {
            System.out.println("🔍 Registrando en historial de carga de productos...");
            historialCargaProductosService.registrarCargaInicial(productoGuardado, empresa, null);
            System.out.println("✅ Historial de carga de productos registrado");
        } catch (Exception e) {
            // Log del error pero no fallar la operación principal
            System.err.println("❌ Error al registrar historial de carga de productos en creación de producto: " + e.getMessage());
        }
        */
        System.out.println("ℹ️ Historial de carga de productos temporalmente deshabilitado");
        
        // Crear notificación de producto creado
        /*
        try {
            System.out.println("🔍 Creando notificación...");
            notificacionService.crearNotificacionProductoActualizado(empresaId, productoDTO.getNombre(), "Producto creado");
            System.out.println("✅ Notificación creada");
        } catch (Exception e) {
            System.err.println("❌ Error al crear notificación: " + e.getMessage());
        }
        */
        System.out.println("ℹ️ Notificaciones temporalmente deshabilitadas");
        
        System.out.println("🔍 Convirtiendo a DTO...");
        ProductoDTO resultado = convertirADTO(productoGuardado);
        System.out.println("✅ Producto creado exitosamente: " + resultado.getId());
        
        return resultado;
    }

    public ProductoDTO actualizarProducto(Long empresaId, Long id, ProductoDTO productoDTO, Long usuarioId) {
        // Usar findByIdAndEmpresaId para permitir actualizar productos inactivos
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Guardar stock anterior para el historial
        Integer stockAnterior = producto.getStock();

        // Solo actualizar campos que no son null
        if (productoDTO.getNombre() != null) {
            producto.setNombre(productoDTO.getNombre());
        }
        
        if (productoDTO.getDescripcion() != null) {
            producto.setDescripcion(productoDTO.getDescripcion());
        }
        
        if (productoDTO.getPrecio() != null) {
            producto.setPrecio(productoDTO.getPrecio());
        }
        // Si el precio es null, no se modifica el precio existente
        
        if (productoDTO.getStock() != null) {
            System.out.println("🔍 === DEBUG ACTUALIZACIÓN STOCK ===");
            System.out.println("🔍 Stock anterior: " + producto.getStock());
            System.out.println("🔍 Stock nuevo recibido: " + productoDTO.getStock());
            System.out.println("🔍 Stock nuevo a establecer: " + productoDTO.getStock());
            producto.setStock(productoDTO.getStock());
            System.out.println("🔍 Stock establecido: " + producto.getStock());
        }
        
        if (productoDTO.getStockMinimo() != null) {
            producto.setStockMinimo(productoDTO.getStockMinimo());
        }
        
        if (productoDTO.getCategoria() != null) {
            producto.setCategoria(productoDTO.getCategoria());
        }
        
        if (productoDTO.getMarca() != null) {
            producto.setMarca(productoDTO.getMarca());
        }
        
        if (productoDTO.getUnidad() != null) {
            producto.setUnidad(productoDTO.getUnidad());
        }
        
        if (productoDTO.getSectorAlmacenamiento() != null) {
            // 🔄 TRANSFERIR STOCK: Verificar si el sector cambió
            String sectorAnterior = producto.getSectorAlmacenamiento();
            String sectorNuevo = productoDTO.getSectorAlmacenamiento();
            
            if (!sectorNuevo.equals(sectorAnterior)) {
                System.out.println("🔄 TRANSFERIR STOCK - Cambio de sector detectado:");
                System.out.println("🔄 TRANSFERIR STOCK - Sector anterior: " + sectorAnterior);
                System.out.println("🔄 TRANSFERIR STOCK - Sector nuevo: " + sectorNuevo);
                
                try {
                    // Transferir stock del sector anterior al nuevo
                    transferirStockEntreSectores(empresaId, producto.getId(), sectorAnterior, sectorNuevo);
                } catch (Exception e) {
                    System.err.println("❌ TRANSFERIR STOCK - Error al transferir stock: " + e.getMessage());
                    // No fallar la actualización del producto si hay error en la transferencia
                }
            }
            
            producto.setSectorAlmacenamiento(productoDTO.getSectorAlmacenamiento());
        }
        
        if (productoDTO.getCodigoPersonalizado() != null) {
            producto.setCodigoPersonalizado(productoDTO.getCodigoPersonalizado());
        }
        
        if (productoDTO.getCodigoBarras() != null) {
            producto.setCodigoBarras(productoDTO.getCodigoBarras());
        }
        
        if (productoDTO.getActivo() != null) {
            producto.setActivo(productoDTO.getActivo());
        }
        
        if (productoDTO.getDestacado() != null) {
            producto.setDestacado(productoDTO.getDestacado());
        }
        
        // Actualizar imágenes si se proporciona
        if (productoDTO.getImagenes() != null) {
            producto.setImagenes(new ArrayList<>(productoDTO.getImagenes()));
        }
        
        // Actualizar imagen principal si se proporciona (para compatibilidad)
        if (productoDTO.getImagenUrl() != null && !productoDTO.getImagenUrl().isEmpty()) {
            List<String> imagenes = producto.getImagenes();
            if (imagenes == null || imagenes.isEmpty()) {
                imagenes = new ArrayList<>();
                imagenes.add(productoDTO.getImagenUrl());
                producto.setImagenes(imagenes);
            } else if (!imagenes.contains(productoDTO.getImagenUrl())) {
                imagenes.set(0, productoDTO.getImagenUrl());
            }
        }

        Producto productoActualizado = productoRepository.save(producto);
        System.out.println("🔍 === DESPUÉS DE GUARDAR ===");
        System.out.println("🔍 Stock en producto guardado: " + productoActualizado.getStock());
        System.out.println("🔍 Stock en producto original: " + producto.getStock());
        
        // Crear sector automáticamente si se especificó un sector de almacenamiento
        if (productoDTO.getSectorAlmacenamiento() != null && !productoDTO.getSectorAlmacenamiento().trim().isEmpty()) {
            try {
                System.out.println("🔍 Procesando sector de almacenamiento en actualización: " + productoDTO.getSectorAlmacenamiento());
                Sector sector = crearSectorAutomaticamente(productoDTO.getSectorAlmacenamiento(), empresaId);
                
                if (sector != null && productoDTO.getStock() != null && productoDTO.getStock() > 0) {
                    asignarStockASectorAutomaticamente(productoActualizado, sector, productoDTO.getStock());
                }
            } catch (Exception e) {
                System.err.println("❌ Error al procesar sector automáticamente en actualización: " + e.getMessage());
                // No fallar la actualización del producto si hay error en el sector
            }
        }
        
        // Registrar cambio de stock en el historial si hubo cambio
        if (productoDTO.getStock() != null && !productoDTO.getStock().equals(stockAnterior) && usuarioId != null) {
            System.out.println("🔍 === REGISTRANDO HISTORIAL ===");
            System.out.println("🔍 Stock anterior guardado: " + stockAnterior);
            System.out.println("🔍 Stock nuevo: " + productoDTO.getStock());
            System.out.println("🔍 Diferencia: " + (productoDTO.getStock() - stockAnterior));
            System.out.println("🔍 Cantidad a registrar: " + Math.abs(productoDTO.getStock() - stockAnterior));
            
            // ACTUALIZACIÓN DIRECTA DEL STOCK DEL PRODUCTO (sin afectar sectores)
            try {
                System.out.println("🔄 ACTUALIZACIÓN - Actualizando stock del producto principal desde Gestión de Productos");
                
                // Cuando se edita un producto, el stock se actualiza directamente
                // sin afectar el stock en sectores
                productoActualizado.setStock(productoDTO.getStock());
                productoRepository.save(productoActualizado);
                
                System.out.println("✅ ACTUALIZACIÓN - Stock del producto actualizado a: " + productoDTO.getStock());
                
            } catch (Exception e) {
                System.err.println("❌ ACTUALIZACIÓN - Error al actualizar stock del producto: " + e.getMessage());
                // No fallar la operación principal si hay error en actualización
            }
            
            try {
                InventarioRequestDTO request = new InventarioRequestDTO();
                request.setProductoId(id);
                request.setTipoOperacion("AJUSTE");
                request.setCantidad(Math.abs(productoDTO.getStock() - stockAnterior));
                request.setStockNuevo(productoDTO.getStock());
                request.setPrecioUnitario(producto.getPrecio());
                request.setObservacion("Actualización de producto");
                request.setCodigoBarras(producto.getCodigoBarras());
                request.setMetodoEntrada("MANUAL");
                
                historialInventarioService.registrarOperacionInventario(request, usuarioId, empresaId, false);
            } catch (Exception e) {
                // Log del error pero no fallar la operación principal
                System.err.println("Error al registrar historial de inventario: " + e.getMessage());
            }
            
            // Registrar el cambio de stock en el historial de carga de productos
            try {
                // Determinar el tipo de operación basado en si aumentó o disminuyó el stock
                HistorialCargaProductos.TipoOperacion tipoOperacion = productoDTO.getStock() > stockAnterior ? 
                    HistorialCargaProductos.TipoOperacion.REPOSICION : 
                    HistorialCargaProductos.TipoOperacion.AJUSTE_NEGATIVO;
                
                // Obtener el usuario si está disponible
                Usuario usuario = null;
                if (usuarioId != null) {
                    usuario = usuarioRepository.findById(usuarioId).orElse(null);
                }
                
                // Crear el registro de historial para el cambio de stock
                HistorialCargaProductos historial = new HistorialCargaProductos();
                historial.setProducto(productoActualizado);
                historial.setUsuario(usuario);
                historial.setEmpresa(productoActualizado.getEmpresa());
                historial.setTipoOperacion(tipoOperacion);
                historial.setCantidad(Math.abs(productoDTO.getStock() - stockAnterior));
                historial.setStockAnterior(stockAnterior);
                historial.setStockNuevo(productoDTO.getStock());
                historial.setPrecioUnitario(producto.getPrecio() != null ? producto.getPrecio() : BigDecimal.ZERO);
                historial.setValorTotal(
                    (producto.getPrecio() != null ? producto.getPrecio() : BigDecimal.ZERO)
                    .multiply(BigDecimal.valueOf(Math.abs(productoDTO.getStock() - stockAnterior)))
                );
                historial.setObservacion("Actualización de stock de producto");
                historial.setMetodoEntrada("MANUAL");
                historial.setCodigoBarras(producto.getCodigoBarras());
                historial.setFechaOperacion(LocalDateTime.now());
                
                // Usar el método del servicio en lugar de acceder directamente al repositorio
                historialCargaProductosService.registrarOperacion(
                    empresaId,
                    productoActualizado.getId(),
                    usuarioId,
                    tipoOperacion,
                    Math.abs(productoDTO.getStock() - stockAnterior),
                    producto.getPrecio() != null ? producto.getPrecio() : BigDecimal.ZERO,
                    "Actualización de stock de producto",
                    "MANUAL",
                    producto.getCodigoBarras(),
                    false // No actualizar stock porque ya se actualizó arriba
                );
            } catch (Exception e) {
                // Log del error pero no fallar la operación principal
                System.err.println("Error al registrar historial de carga de productos en actualización: " + e.getMessage());
            }
        }
        
        // Crear notificación de producto actualizado
        notificacionService.crearNotificacionProductoActualizado(empresaId, producto.getNombre(), "Producto actualizado");
        
        // Verificar si el stock está bajo después de la actualización
        if (producto.getStock() != null && producto.getStockMinimo() != null && producto.getStock() <= producto.getStockMinimo()) {
            notificacionService.crearNotificacionStockBajo(empresaId, producto.getNombre(), producto.getStock());
        }
        
        return convertirADTO(productoActualizado);
    }
    
    public void eliminarProducto(Long empresaId, Long id) {
        Producto producto = productoRepository.findByIdAndEmpresaIdAndActivoTrue(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        producto.setActivo(false);
        productoRepository.save(producto);
    }

    public void eliminarProductoFisicamente(Long empresaId, Long id) {
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Eliminar físicamente de la base de datos
        productoRepository.delete(producto);
    }

    public ProductoDTO reactivarProducto(Long empresaId, Long id) {
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        producto.setActivo(true);
        Producto productoReactivo = productoRepository.save(producto);
        return convertirADTO(productoReactivo);
    }

    public void actualizarStock(Long empresaId, Long id, Integer nuevoStock, Long usuarioId, String observacion) {
        // Usar findByIdAndEmpresaId para permitir actualizar stock de productos inactivos
        Producto producto = productoRepository.findByIdAndEmpresaId(id, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        Integer stockAnterior = producto.getStock();
        producto.setStock(nuevoStock);
        productoRepository.save(producto);
        
        // Registrar la operación en el historial de inventario
        try {
            InventarioRequestDTO request = new InventarioRequestDTO();
            request.setProductoId(id);
            request.setTipoOperacion("AJUSTE");
            request.setCantidad(Math.abs(nuevoStock - stockAnterior));
            request.setStockNuevo(nuevoStock);
            request.setPrecioUnitario(producto.getPrecio());
            request.setObservacion(observacion != null ? observacion : "Ajuste de stock manual");
            request.setCodigoBarras(producto.getCodigoBarras());
            request.setMetodoEntrada("MANUAL");
            
            historialInventarioService.registrarOperacionInventario(request, usuarioId, empresaId);
        } catch (Exception e) {
            // Log del error pero no fallar la operación principal
            System.err.println("Error al registrar historial de inventario: " + e.getMessage());
        }
        
        // Verificar si el stock está bajo después de la actualización
        if (producto.getStockMinimo() != null && nuevoStock <= producto.getStockMinimo()) {
            notificacionService.crearNotificacionStockBajo(empresaId, producto.getNombre(), nuevoStock);
        }
    }
    
    /**
     * Método sobrecargado para compatibilidad hacia atrás
     */
    public void actualizarStock(Long empresaId, Long id, Integer nuevoStock) {
        actualizarStock(empresaId, id, nuevoStock, null, null);
    }

    public List<ProductoDTO> obtenerProductosConStockBajo(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Producto> productos = productoRepository.findProductosConStockBajo(empresa);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<ProductoDTO> obtenerProductosPorCategoria(Long empresaId, String categoria) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCategoriaAndActivoTrue(empresaId, categoria);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos por empresa y estado específico
     */
    public List<ProductoDTO> obtenerProductosPorEstado(Long empresaId, Boolean activo) {
        List<Producto> productos;
        
        if (activo == null) {
            // Si activo es null, obtener todos (activos e inactivos)
            productos = productoRepository.findByEmpresaId(empresaId);
        } else {
            // Filtrar por estado específico
            productos = productoRepository.findByEmpresaIdAndActivo(empresaId, activo);
        }
        
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos paginados por empresa y estado específico
     */
    public Page<ProductoDTO> obtenerProductosPaginadosPorEstado(Long empresaId, Boolean activo, Pageable pageable) {
        Page<Producto> productos;
        
        if (activo == null) {
            // Si activo es null, obtener todos (activos e inactivos)
            productos = productoRepository.findByEmpresaId(empresaId, pageable);
        } else {
            // Filtrar por estado específico
            productos = productoRepository.findByEmpresaIdAndActivo(empresaId, activo, pageable);
        }
        
        return productos.map(this::convertirADTO);
    }

    /**
     * Obtiene todas las categorías únicas de productos activos de una empresa
     */
    public List<String> obtenerCategoriasPorEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            throw new RuntimeException("Empresa no encontrada");
        }
        
        return productoRepository.findCategoriasPorEmpresa(empresaOpt.get());
    }

    /**
     * Obtiene todos los sectores de almacenamiento únicos de productos de una empresa
     */
    public List<String> obtenerSectoresAlmacenamientoPorEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            throw new RuntimeException("Empresa no encontrada");
        }
        
        return productoRepository.findSectoresAlmacenamientoPorEmpresa(empresaOpt.get());
    }

    /**
     * Obtiene productos por empresa y sector de almacenamiento
     */
    public List<ProductoDTO> obtenerProductosPorSector(Long empresaId, String sectorAlmacenamiento) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndSectorAlmacenamiento(empresaId, sectorAlmacenamiento);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos por empresa, sector de almacenamiento y estado
     */
    public List<ProductoDTO> obtenerProductosPorSectorYEstado(Long empresaId, String sectorAlmacenamiento, Boolean activo) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndSectorAlmacenamientoAndActivo(empresaId, sectorAlmacenamiento, activo);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los códigos personalizados únicos de productos de una empresa
     */
    public List<String> obtenerCodigosPersonalizadosPorEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            throw new RuntimeException("Empresa no encontrada");
        }
        
        return productoRepository.findCodigosPersonalizadosPorEmpresa(empresaOpt.get());
    }

    /**
     * Obtiene productos por empresa y código personalizado
     */
    public List<ProductoDTO> obtenerProductosPorCodigo(Long empresaId, String codigoPersonalizado) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoPersonalizado(empresaId, codigoPersonalizado);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos por empresa, código personalizado y estado
     */
    public List<ProductoDTO> obtenerProductosPorCodigoYEstado(Long empresaId, String codigoPersonalizado, Boolean activo) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoPersonalizadoAndActivo(empresaId, codigoPersonalizado, activo);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los códigos de barras únicos de productos de una empresa
     */
    public List<String> obtenerCodigosBarrasPorEmpresa(Long empresaId) {
        Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
        if (empresaOpt.isEmpty()) {
            throw new RuntimeException("Empresa no encontrada");
        }
        
        return productoRepository.findCodigosBarrasPorEmpresa(empresaOpt.get());
    }

    /**
     * Obtiene productos por empresa y código de barras
     */
    public List<ProductoDTO> obtenerProductosPorCodigoBarras(Long empresaId, String codigoBarras) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoBarras(empresaId, codigoBarras);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene productos por empresa, código de barras y estado
     */
    public List<ProductoDTO> obtenerProductosPorCodigoBarrasYEstado(Long empresaId, String codigoBarras, Boolean activo) {
        List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoBarrasAndActivo(empresaId, codigoBarras, activo);
        return productos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Busca un producto por código de barras (para verificar duplicados)
     */
    public Optional<ProductoDTO> buscarProductoPorCodigoBarras(Long empresaId, String codigoBarras) {
        Optional<Producto> producto = productoRepository.findByEmpresaIdAndCodigoBarras(empresaId, codigoBarras).stream().findFirst();
        return producto.map(this::convertirADTO);
    }

    /**
     * Genera un código de barras único para la empresa
     */
    public String generarCodigoBarras(Long empresaId) {
        String codigo;
        boolean esUnico = false;
        int intentos = 0;
        final int MAX_INTENTOS = 10;
        
        do {
            // Generar código con formato: EMP-{empresaId}-{timestamp}-{random}
            long timestamp = System.currentTimeMillis();
            int random = new Random().nextInt(1000);
            codigo = String.format("EMP-%d-%d-%03d", empresaId, timestamp, random);
            
            // Verificar que sea único en la empresa
            List<Producto> productosConMismoCodigo = productoRepository.findByEmpresaIdAndCodigoBarras(empresaId, codigo);
            esUnico = productosConMismoCodigo.isEmpty();
            
            intentos++;
        } while (!esUnico && intentos < MAX_INTENTOS);
        
        if (!esUnico) {
            // Si no se pudo generar uno único, usar UUID
            codigo = "EMP-" + empresaId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }
        
        return codigo;
    }

    /**
     * Verifica si un código de barras ya existe en la empresa
     */
    public boolean codigoBarrasExiste(Long empresaId, String codigoBarras) {
        if (codigoBarras == null || codigoBarras.trim().isEmpty()) {
            return false;
        }
        List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoBarras(empresaId, codigoBarras.trim());
        return !productos.isEmpty();
    }

    /**
     * Transfiere stock de un sector a otro cuando se edita un producto
     * Este método se ejecuta automáticamente cuando se cambia el sector de un producto
     */
    @Transactional
    public void transferirStockEntreSectores(Long empresaId, Long productoId, String sectorAnterior, String sectorNuevo) {
        System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Iniciando transferencia:");
        System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Producto ID: " + productoId);
        System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Sector anterior: " + sectorAnterior);
        System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Sector nuevo: " + sectorNuevo);
        
        // Obtener el producto
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Buscar el sector anterior si existe
        final Sector sectorAnteriorEntity;
        if (sectorAnterior != null && !sectorAnterior.trim().isEmpty()) {
            sectorAnteriorEntity = sectorRepository.findByNombreAndEmpresaId(sectorAnterior, empresaId).orElse(null);
        } else {
            sectorAnteriorEntity = null;
        }
        
        // Buscar o crear el sector nuevo
        final Sector sectorNuevoEntity;
        if (sectorNuevo != null && !sectorNuevo.trim().isEmpty()) {
            Sector sectorTemp = sectorRepository.findByNombreAndEmpresaId(sectorNuevo, empresaId).orElse(null);
            
            // Si el sector nuevo no existe, crearlo automáticamente
            if (sectorTemp == null) {
                System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Creando sector nuevo: " + sectorNuevo);
                sectorTemp = crearSectorAutomaticamente(sectorNuevo, empresaId);
            }
            sectorNuevoEntity = sectorTemp;
        } else {
            sectorNuevoEntity = null;
        }
        
        // Obtener stock actual del producto en sectores
        List<StockPorSector> stockActual = stockPorSectorRepository.findByProductoId(productoId);
        
        // Calcular cantidad a transferir
        Integer cantidadATransferir = 0;
        
        if (sectorAnteriorEntity != null) {
            // Buscar stock en el sector anterior
            StockPorSector stockAnterior = stockActual.stream()
                    .filter(stock -> stock.getSector().getId().equals(sectorAnteriorEntity.getId()))
                    .findFirst()
                    .orElse(null);
            
            if (stockAnterior != null) {
                cantidadATransferir = stockAnterior.getCantidad();
                System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Stock encontrado en sector anterior: " + cantidadATransferir);
                
                // Eliminar stock del sector anterior
                stockPorSectorRepository.delete(stockAnterior);
                System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Stock eliminado del sector anterior");
            }
        }
        
        // Si no había stock en el sector anterior, usar el stock total del producto
        if (cantidadATransferir == 0) {
            cantidadATransferir = producto.getStock() != null ? producto.getStock() : 0;
            System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - No había stock en sector anterior, usando stock total: " + cantidadATransferir);
        }
        
        // Asignar stock al sector nuevo
        if (sectorNuevoEntity != null && cantidadATransferir > 0) {
            // Verificar si ya existe stock en el sector nuevo
            StockPorSector stockNuevo = stockActual.stream()
                    .filter(stock -> stock.getSector().getId().equals(sectorNuevoEntity.getId()))
                    .findFirst()
                    .orElse(null);
            
            if (stockNuevo != null) {
                // Actualizar stock existente
                stockNuevo.setCantidad(stockNuevo.getCantidad() + cantidadATransferir);
                stockPorSectorRepository.save(stockNuevo);
                System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Stock actualizado en sector nuevo: " + stockNuevo.getCantidad());
            } else {
                // Crear nuevo stock en el sector nuevo
                StockPorSector nuevoStock = new StockPorSector();
                nuevoStock.setProducto(producto);
                nuevoStock.setSector(sectorNuevoEntity);
                nuevoStock.setCantidad(cantidadATransferir);
                stockPorSectorRepository.save(nuevoStock);
                System.out.println("🔄 TRANSFERIR STOCK ENTRE SECTORES - Stock creado en sector nuevo: " + cantidadATransferir);
            }
        }
        
        System.out.println("✅ TRANSFERIR STOCK ENTRE SECTORES - Transferencia completada exitosamente");
    }
    
    /**
     * Migra el stock de un producto a un nuevo sector
     */
    @Transactional
    public void migrarSectorProducto(Long empresaId, Long productoId, String sectorDestino) {
        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        // Verificar que el sector destino existe
        Sector sectorDestinoEntity = sectorRepository.findByNombreAndEmpresaId(sectorDestino, empresaId)
                .orElseThrow(() -> new RuntimeException("Sector destino no encontrado: " + sectorDestino));
        
        if (!sectorDestinoEntity.getActivo()) {
            throw new RuntimeException("Sector destino está inactivo: " + sectorDestino);
        }
        
        String sectorAnterior = producto.getSectorAlmacenamiento();
        
        if (sectorAnterior != null && sectorAnterior.equals(sectorDestino)) {
            // No hay cambio de sector
            return;
        }
        
        // Buscar el sector anterior si existe
        final Sector sectorAnteriorEntity;
        if (sectorAnterior != null && !sectorAnterior.trim().isEmpty()) {
            sectorAnteriorEntity = sectorRepository.findByNombreAndEmpresaId(sectorAnterior, empresaId).orElse(null);
        } else {
            sectorAnteriorEntity = null;
        }
        
        // Buscar asignaciones de stock existentes para este producto
        List<StockPorSector> asignacionesExistentes = stockPorSectorRepository.findByProductoId(productoId);
        
        // Obtener la cantidad que estaba asignada al sector anterior
        Integer cantidadAMigrar = 0;
        if (sectorAnteriorEntity != null) {
            StockPorSector stockAnterior = asignacionesExistentes.stream()
                    .filter(stock -> stock.getSector().getId().equals(sectorAnteriorEntity.getId()))
                    .findFirst()
                    .orElse(null);
            
            if (stockAnterior != null) {
                cantidadAMigrar = stockAnterior.getCantidad();
                // Remover stock del sector anterior
                stockPorSectorRepository.delete(stockAnterior);
                System.out.println("🗑️ Removido stock del sector anterior: " + sectorAnterior + " (cantidad: " + cantidadAMigrar + ")");
            }
        }
        
        // Si no había stock asignado al sector anterior, usar el stock total del producto
        if (cantidadAMigrar == 0) {
            cantidadAMigrar = producto.getStock() != null ? producto.getStock() : 0;
            System.out.println("📊 No había stock asignado al sector anterior, usando stock total del producto: " + cantidadAMigrar);
        }
        
        // Verificar si ya existe stock asignado al sector destino
        StockPorSector stockDestino = asignacionesExistentes.stream()
                .filter(stock -> stock.getSector().getId().equals(sectorDestinoEntity.getId()))
                .findFirst()
                .orElse(null);
        
        if (stockDestino != null) {
            // Actualizar cantidad existente
            stockDestino.setCantidad(stockDestino.getCantidad() + cantidadAMigrar);
            stockPorSectorRepository.save(stockDestino);
            System.out.println("📈 Actualizado stock existente en sector destino: " + sectorDestino + " (nueva cantidad: " + stockDestino.getCantidad() + ")");
        } else {
            // Crear nueva asignación de stock
            StockPorSector nuevaAsignacion = new StockPorSector(producto, sectorDestinoEntity, cantidadAMigrar);
            stockPorSectorRepository.save(nuevaAsignacion);
            System.out.println("➕ Creada nueva asignación de stock en sector destino: " + sectorDestino + " (cantidad: " + cantidadAMigrar + ")");
        }
        
        // Actualizar el sector de almacenamiento del producto
        producto.setSectorAlmacenamiento(sectorDestino);
        productoRepository.save(producto);
        
        System.out.println("✅ Producto " + producto.getNombre() + " migrado del sector '" + 
                          sectorAnterior + "' al sector '" + sectorDestino + "' (cantidad migrada: " + cantidadAMigrar + ")");
    }

    /**
     * Verifica las dependencias de un producto para determinar si se puede eliminar
     */
    public DependenciasProductoDTO verificarDependenciasProducto(Long empresaId, Long productoId) {
        System.out.println("🔍 VERIFICANDO DEPENDENCIAS - Producto ID: " + productoId + ", Empresa ID: " + empresaId);
        
        // Verificar que el producto existe
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        DependenciasProductoDTO dependencias = new DependenciasProductoDTO();
        List<String> razonesBloqueo = new ArrayList<>();
        List<String> dependenciasEncontradas = new ArrayList<>();
        
        // 1. Verificar pedidos (Pedido) - verificar si hay pedidos que contengan este producto
        // Por ahora, asumimos que no hay pedidos directos, solo planillas de pedido
        int cantidadPedidos = 0;
        dependencias.setCantidadPedidos(cantidadPedidos);
        dependencias.setTienePedidos(cantidadPedidos > 0);
        
        // 2. Verificar ingresos (DetalleRemitoIngreso)
        int cantidadIngresos = detalleRemitoIngresoRepository.findByProductoId(productoId).size();
        dependencias.setCantidadIngresos(cantidadIngresos);
        dependencias.setTieneIngresos(cantidadIngresos > 0);
        if (cantidadIngresos > 0) {
            dependenciasEncontradas.add("Ingresos de inventario (" + cantidadIngresos + ")");
        }
        
        // 3. Verificar devoluciones (DetallePlanillaDevolucion)
        // Por ahora, asumimos que no hay devoluciones directas
        int cantidadDevoluciones = 0;
        dependencias.setCantidadDevoluciones(cantidadDevoluciones);
        dependencias.setTieneDevoluciones(cantidadDevoluciones > 0);
        
        // 4. Verificar planillas de pedido (DetallePlanillaPedido)
        // Por ahora, asumimos que no hay planillas de pedido directas
        int cantidadPlanillasPedido = 0;
        dependencias.setTienePedidos(dependencias.isTienePedidos() || cantidadPlanillasPedido > 0);
        
        // 5. Verificar stock en sectores (StockPorSector)
        int cantidadSectoresConStock = stockPorSectorRepository.findByProductoId(productoId).size();
        dependencias.setCantidadSectoresConStock(cantidadSectoresConStock);
        dependencias.setTieneStockEnSectores(cantidadSectoresConStock > 0);
        if (cantidadSectoresConStock > 0) {
            dependenciasEncontradas.add("Stock en sectores (" + cantidadSectoresConStock + " sectores)");
            razonesBloqueo.add("El producto tiene stock asignado en " + cantidadSectoresConStock + " sectores");
        }
        
        // 6. Verificar roturas (RoturaPerdida)
        // Por ahora, asumimos que no hay roturas directas
        int cantidadRoturas = 0;
        dependencias.setCantidadRoturas(cantidadRoturas);
        dependencias.setTieneRoturas(cantidadRoturas > 0);
        
        // 7. Verificar historial de inventario (HistorialInventario)
        // Por ahora, asumimos que no hay historial directo
        int cantidadHistorial = 0;
        dependencias.setTieneHistorial(cantidadHistorial > 0);
        
        // 8. Verificar ventas rápidas (VentaRapida)
        // Por ahora, asumimos que no hay ventas directas
        int cantidadVentas = 0;
        dependencias.setCantidadVentas(cantidadVentas);
        dependencias.setTieneVentas(cantidadVentas > 0);
        
        // 9. Verificar favoritos (ProductoFavorito)
        // Por ahora, asumimos que no hay favoritos directos
        int cantidadFavoritos = 0;
        dependencias.setCantidadFavoritos(cantidadFavoritos);
        dependencias.setTieneFavoritos(cantidadFavoritos > 0);
        
        // 10. Verificar inventarios físicos (InventarioFisico)
        // Por ahora, asumimos que no hay inventarios físicos directos
        int cantidadInventariosFisicos = 0;
        dependencias.setCantidadInventariosFisicos(cantidadInventariosFisicos);
        dependencias.setTieneInventariosFisicos(cantidadInventariosFisicos > 0);
        
        // 11. Verificar cierres de día (DetalleCierreDia)
        // Por ahora, asumimos que no hay cierres de día directos
        int cantidadCierresDia = 0;
        dependencias.setCantidadCierresDia(cantidadCierresDia);
        dependencias.setTieneCierresDia(cantidadCierresDia > 0);
        
        // 12. Verificar mensajes (Mensaje)
        // Por ahora, asumimos que no hay mensajes directos
        int cantidadMensajes = 0;
        dependencias.setCantidadMensajes(cantidadMensajes);
        dependencias.setTieneMensajes(cantidadMensajes > 0);
        
        // Determinar tipo de eliminación
        boolean tieneDependenciasCriticas = dependencias.isTienePedidos() || 
                                          dependencias.isTieneStockEnSectores() || 
                                          dependencias.isTieneVentas();
        
        boolean tieneDependenciasHistoricas = dependencias.isTieneIngresos() || 
                                            dependencias.isTieneDevoluciones() || 
                                            dependencias.isTieneRoturas() || 
                                            dependencias.isTieneHistorial() ||
                                            dependencias.isTieneInventariosFisicos() ||
                                            dependencias.isTieneCierresDia();
        
        boolean tieneDependenciasMenores = dependencias.isTieneFavoritos() || 
                                         dependencias.isTieneMensajes();
        
        if (!tieneDependenciasCriticas && !tieneDependenciasHistoricas && !tieneDependenciasMenores) {
            // Sin dependencias - eliminación segura
            dependencias.setTipoEliminacion("SEGURA");
            dependencias.setPuedeEliminarFisicamente(true);
            dependencias.setPuedeDesactivar(true);
        } else if (tieneDependenciasCriticas) {
            // Con dependencias críticas - solo desactivación
            dependencias.setTipoEliminacion("BLOQUEADA");
            dependencias.setPuedeEliminarFisicamente(false);
            dependencias.setPuedeDesactivar(true);
        } else {
            // Con dependencias históricas o menores - eliminación con advertencia
            dependencias.setTipoEliminacion("ADVERTENCIA");
            dependencias.setPuedeEliminarFisicamente(false);
            dependencias.setPuedeDesactivar(true);
        }
        
        dependencias.setRazonesBloqueo(razonesBloqueo);
        dependencias.setDependenciasEncontradas(dependenciasEncontradas);
        
        System.out.println("🔍 DEPENDENCIAS VERIFICADAS - Tipo: " + dependencias.getTipoEliminacion());
        System.out.println("🔍 DEPENDENCIAS ENCONTRADAS: " + dependenciasEncontradas);
        System.out.println("🔍 PUEDE ELIMINAR FÍSICAMENTE: " + dependencias.isPuedeEliminarFisicamente());
        
        return dependencias;
    }

    private ProductoDTO convertirADTO(Producto producto) {
        ProductoDTO dto = new ProductoDTO();
        dto.setId(producto.getId());
        dto.setNombre(producto.getNombre());
        dto.setDescripcion(producto.getDescripcion());
        dto.setPrecio(producto.getPrecio());
        dto.setStock(producto.getStock());
        dto.setStockMinimo(producto.getStockMinimo());
        dto.setImagenUrl(producto.getImagenPrincipal());
        dto.setImagenes(new ArrayList<>(producto.getImagenes()));
        dto.setCategoria(producto.getCategoria());
        dto.setMarca(producto.getMarca());
        dto.setUnidad(producto.getUnidad());
        dto.setSectorAlmacenamiento(producto.getSectorAlmacenamiento());
        dto.setCodigoPersonalizado(producto.getCodigoPersonalizado());
        dto.setCodigoBarras(producto.getCodigoBarras());
        dto.setActivo(producto.getActivo());
        dto.setDestacado(producto.getDestacado());
        dto.setEmpresaId(producto.getEmpresa().getId());
        dto.setEmpresaNombre(producto.getEmpresa().getNombre());
        dto.setFechaCreacion(producto.getFechaCreacion());
        dto.setFechaActualizacion(producto.getFechaActualizacion());
        return dto;
    }
}
