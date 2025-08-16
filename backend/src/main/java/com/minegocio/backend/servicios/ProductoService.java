package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.dto.InventarioRequestDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.HistorialInventario;
import com.minegocio.backend.entidades.HistorialCargaProductos;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
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
    
    @Autowired
    private UsuarioRepository usuarioRepository;

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
            producto.setStock(productoDTO.getStock());
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
        
        // Registrar cambio de stock en el historial si hubo cambio
        if (productoDTO.getStock() != null && !productoDTO.getStock().equals(stockAnterior) && usuarioId != null) {
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
                
                historialInventarioService.registrarOperacionInventario(request, usuarioId, empresaId);
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
                    producto.getCodigoBarras()
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
