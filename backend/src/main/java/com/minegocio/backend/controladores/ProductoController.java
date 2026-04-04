package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.dto.ImportacionProductoDTO;
import com.minegocio.backend.dto.ResultadoImportacionDTO;
import com.minegocio.backend.dto.DependenciasProductoDTO;
import com.minegocio.backend.servicios.ProductoService;
import com.minegocio.backend.servicios.CloudinaryService;
import com.minegocio.backend.servicios.LimiteService;
import com.minegocio.backend.servicios.ImportacionProductoService;
import com.minegocio.backend.servicios.ReporteInventarioService;
import com.minegocio.backend.servicios.ReporteDiferenciasInventarioService;
import com.minegocio.backend.servicios.ReporteStockService;
import com.minegocio.backend.servicios.PlantillaCargaMasivaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import java.io.IOException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Controlador REST para la gestión de productos
 */
@RestController
@RequestMapping("/api/empresas/{empresaId}/productos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private LimiteService limiteService;

    @Autowired
    private ImportacionProductoService importacionProductoService;

        @Autowired
    private ReporteInventarioService reporteInventarioService;

    @Autowired
    private ReporteDiferenciasInventarioService reporteDiferenciasInventarioService;

    @Autowired
    private ReporteStockService reporteStockService;

    @Autowired
    private PlantillaCargaMasivaService plantillaCargaMasivaService;

    @Autowired
    private com.minegocio.backend.servicios.ImportacionInventarioService importacionInventarioService;

    @Autowired
    private EmpresaService empresaService;

    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;

    /**
     * Obtiene todos los productos de una empresa
     */
    @GetMapping
    public ResponseEntity<?> obtenerProductos(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            
            // Devolver en el formato esperado por el frontend
            var respuesta = java.util.Map.of(
                "data", productos
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al obtener productos: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al obtener productos: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene todos los productos de una empresa (incluye inactivos)
     */
    @GetMapping("/todos")
    public ResponseEntity<?> obtenerTodosLosProductosIncluirInactivos(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Devolver en el formato esperado por el frontend
            var respuesta = java.util.Map.of(
                "data", productos
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al obtener productos: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al obtener productos: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene productos paginados
     */
    @GetMapping("/paginado")
    public ResponseEntity<Page<ProductoDTO>> obtenerProductosPaginados(
            @PathVariable Long empresaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                    Sort.by(sortBy).descending() : 
                    Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ProductoDTO> productos = productoService.obtenerProductosPaginados(empresaId, pageable);
            
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca productos por término
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ProductoDTO>> buscarProductos(
            @PathVariable Long empresaId,
            @RequestParam String termino) {
        try {
            List<ProductoDTO> productos = productoService.buscarProductos(empresaId, termino);
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene un producto por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean incluirInactivos) {
        try {
            System.out.println("=== DEBUG OBTENER PRODUCTO ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ProductoId: " + id);
            System.out.println("Incluir inactivos: " + incluirInactivos);
            
            Optional<ProductoDTO> producto;
            
            if (incluirInactivos) {
                // Para edición, permitir productos inactivos
                producto = productoService.obtenerProductoPorIdSinFiltro(id, empresaId);
            } else {
                // Para visualización normal, solo activos
                producto = productoService.obtenerProductoPorId(id, empresaId);
            }
            
            if (producto.isPresent()) {
                System.out.println("Producto encontrado: " + producto.get());
                
                // Devolver en el formato esperado por el frontend
                var respuesta = java.util.Map.of(
                    "data", producto.get()
                );
                
                return ResponseEntity.ok(respuesta);
            } else {
                System.out.println("Producto no encontrado para empresaId: " + empresaId + ", id: " + id);
                
                var error = java.util.Map.of(
                    "error", "Producto no encontrado"
                );
                
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            System.err.println("Error al obtener producto: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Crea un nuevo producto
     */
    @PostMapping
    public ResponseEntity<?> crearProducto(
            @PathVariable Long empresaId,
            @Valid @RequestBody ProductoDTO productoDTO) {
        try {
            System.out.println("=== DEBUG CREAR PRODUCTO ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ProductoDTO recibido: " + productoDTO);
            System.out.println("Imágenes recibidas: " + productoDTO.getImagenes());
            System.out.println("Imagen URL recibida: " + productoDTO.getImagenUrl());
            
            // Verificar límites de suscripción antes de crear el producto
            System.out.println("Verificando límites de suscripción...");
            /*
            if (!limiteService.puedeCrearProducto(empresaId)) {
                System.out.println("❌ Límite de productos alcanzado");
                var error = java.util.Map.of(
                    "error", "Límite de productos alcanzado",
                    "mensaje", "Has alcanzado el límite de productos permitidos en tu plan de suscripción. Actualiza tu plan para crear más productos."
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            */
            System.out.println("✅ Límites verificados correctamente (temporalmente deshabilitado)");
            
            System.out.println("Creando producto...");
            ProductoDTO nuevoProducto = productoService.crearProducto(empresaId, productoDTO);
            
            System.out.println("Producto creado exitosamente con ID: " + nuevoProducto.getId());
            System.out.println("ProductoDTO de respuesta: " + nuevoProducto);
            
            // Devolver en el formato esperado por el frontend
            var respuesta = java.util.Map.of(
                "data", nuevoProducto,
                "mensaje", "Producto creado exitosamente"
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            System.err.println("❌ Error al crear producto: " + e.getMessage());
            System.err.println("❌ Stack trace completo:");
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al crear producto: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Actualiza un producto existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            @RequestBody ProductoDTO productoDTO) {
        try {
            System.out.println("=== DEBUG ACTUALIZAR PRODUCTO ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ProductoId: " + id);
            System.out.println("ProductoDTO recibido: " + productoDTO);
            
            // Obtener el usuario del contexto de seguridad
            Long usuarioId = null;
            try {
                UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                usuarioId = usuarioPrincipal.getId();
            } catch (Exception e) {
                System.out.println("No se pudo obtener el usuario del contexto de seguridad: " + e.getMessage());
            }
            
            ProductoDTO productoActualizado = productoService.actualizarProducto(empresaId, id, productoDTO, usuarioId);
            
            System.out.println("Producto actualizado exitosamente: " + productoActualizado);
            
            // Devolver en el formato esperado por el frontend
            var respuesta = java.util.Map.of(
                "data", productoActualizado,
                "mensaje", "Producto actualizado exitosamente"
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            System.err.println("Error al actualizar producto - no encontrado: " + e.getMessage());
            
            var error = java.util.Map.of(
                "error", "Producto no encontrado"
            );
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("Error al actualizar producto: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Verifica las dependencias de un producto antes de eliminarlo
     */
    @GetMapping("/{id}/dependencias")
    public ResponseEntity<?> verificarDependenciasProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            System.out.println("🔍 ENDPOINT DEPENDENCIAS - Producto ID: " + id + ", Empresa ID: " + empresaId);
            
            DependenciasProductoDTO dependencias = productoService.verificarDependenciasProducto(empresaId, id);
            
            var respuesta = java.util.Map.of(
                "data", dependencias,
                "mensaje", "Dependencias verificadas exitosamente"
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            System.err.println("❌ Error al verificar dependencias: " + e.getMessage());
            var error = java.util.Map.of(
                "error", "Producto no encontrado: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("❌ Error interno al verificar dependencias: " + e.getMessage());
            e.printStackTrace();
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Elimina un producto (eliminación lógica - desactivación)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            System.out.println("🗑️ ENDPOINT ELIMINAR - Producto ID: " + id + ", Empresa ID: " + empresaId);
            
            // Verificar dependencias antes de eliminar
            DependenciasProductoDTO dependencias = productoService.verificarDependenciasProducto(empresaId, id);
            
            if (!dependencias.isPuedeDesactivar()) {
                var error = java.util.Map.of(
                    "error", "No se puede eliminar el producto",
                    "razones", dependencias.getRazonesBloqueo(),
                    "tipoEliminacion", dependencias.getTipoEliminacion()
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            // Realizar eliminación lógica (desactivación)
            productoService.eliminarProducto(empresaId, id);
            
            var respuesta = java.util.Map.of(
                "mensaje", "Producto desactivado exitosamente",
                "tipoEliminacion", dependencias.getTipoEliminacion(),
                "dependencias", dependencias.getDependenciasEncontradas()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            System.err.println("❌ Error al eliminar producto: " + e.getMessage());
            var error = java.util.Map.of(
                "error", "Producto no encontrado: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("❌ Error interno al eliminar producto: " + e.getMessage());
            e.printStackTrace();
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Elimina un producto físicamente (solo si no tiene dependencias)
     */
    @DeleteMapping("/{id}/fisico")
    public ResponseEntity<?> eliminarProductoFisicamente(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            System.out.println("🗑️ ENDPOINT ELIMINAR FÍSICO - Producto ID: " + id + ", Empresa ID: " + empresaId);
            
            // Verificar dependencias antes de eliminar
            DependenciasProductoDTO dependencias = productoService.verificarDependenciasProducto(empresaId, id);
            
            if (!dependencias.isPuedeEliminarFisicamente()) {
                var error = java.util.Map.of(
                    "error", "No se puede eliminar físicamente el producto",
                    "razones", dependencias.getRazonesBloqueo(),
                    "tipoEliminacion", dependencias.getTipoEliminacion(),
                    "dependencias", dependencias.getDependenciasEncontradas()
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            // Realizar eliminación física
            productoService.eliminarProductoFisicamente(empresaId, id);
            
            var respuesta = java.util.Map.of(
                "mensaje", "Producto eliminado físicamente exitosamente",
                "tipoEliminacion", dependencias.getTipoEliminacion()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            System.err.println("❌ Error al eliminar producto físicamente: " + e.getMessage());
            var error = java.util.Map.of(
                "error", "Producto no encontrado: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("❌ Error interno al eliminar producto físicamente: " + e.getMessage());
            e.printStackTrace();
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Reactiva un producto (marca como activo)
     */
    @PutMapping("/{id}/reactivar")
    public ResponseEntity<?> reactivarProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            ProductoDTO productoReactivo = productoService.reactivarProducto(empresaId, id);
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Producto reactivado exitosamente",
                "data", productoReactivo
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Actualiza el stock de un producto
     */
    @PatchMapping("/{id}/stock")
    public ResponseEntity<?> actualizarStock(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            @RequestBody Map<String, Integer> stockData) {
        try {
            System.out.println("=== DEBUG ACTUALIZAR STOCK ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ProductoId: " + id);
            System.out.println("Nuevo stock: " + stockData.get("stock"));
            
            Integer nuevoStock = stockData.get("stock");
            if (nuevoStock == null || nuevoStock < 0) {
                var error = java.util.Map.of(
                    "error", "El stock debe ser un número válido mayor o igual a 0"
                );
                return ResponseEntity.badRequest().body(error);
            }
            
            productoService.actualizarStock(empresaId, id, nuevoStock);
            
            // Obtener el producto actualizado para devolver la información completa
            Optional<ProductoDTO> productoActualizado = productoService.obtenerProductoPorId(id, empresaId);
            
            if (productoActualizado.isPresent()) {
                System.out.println("Stock actualizado exitosamente: " + nuevoStock);
                
                var respuesta = java.util.Map.of(
                    "data", productoActualizado.get(),
                    "mensaje", "Stock actualizado exitosamente"
                );
                
                return ResponseEntity.ok(respuesta);
            } else {
                var error = java.util.Map.of(
                    "error", "No se pudo obtener el producto actualizado"
                );
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
            }
        } catch (RuntimeException e) {
            System.err.println("Error al actualizar stock: " + e.getMessage());
            
            var error = java.util.Map.of(
                "error", e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("Error interno al actualizar stock: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene productos con stock bajo
     */
    @GetMapping("/stock-bajo")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosConStockBajo(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerProductosConStockBajo(empresaId);
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene productos por categoría
     */
    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosPorCategoria(
            @PathVariable Long empresaId,
            @PathVariable String categoria) {
        try {
            List<ProductoDTO> productos = productoService.obtenerProductosPorCategoria(empresaId, categoria);
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene productos filtrados por estado (activo/inactivo/todos)
     */
    @GetMapping("/por-estado")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosPorEstado(
            @PathVariable Long empresaId,
            @RequestParam(required = false) Boolean activo) {
        try {
            System.out.println("=== DEBUG OBTENER PRODUCTOS POR ESTADO ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("Filtro activo: " + activo);
            
            List<ProductoDTO> productos = productoService.obtenerProductosPorEstado(empresaId, activo);
            
            System.out.println("Productos encontrados: " + productos.size());
            if (activo != null) {
                System.out.println("Productos " + (activo ? "activos" : "inactivos") + ": " + productos.size());
            } else {
                System.out.println("Todos los productos (activos e inactivos): " + productos.size());
            }
            
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            System.err.println("Error al obtener productos por estado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene categorías únicas de productos de una empresa
     */
    @GetMapping("/categorias")
    public ResponseEntity<?> obtenerCategorias(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer categorías únicas
            List<String> categorias = productos.stream()
                .map(ProductoDTO::getCategoria)
                .filter(categoria -> categoria != null && !categoria.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Categorías obtenidas exitosamente",
                "data", categorias
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al obtener categorías",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtiene marcas únicas de productos de una empresa
     */
    @GetMapping("/marcas")
    public ResponseEntity<?> obtenerMarcas(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer marcas únicas
            List<String> marcas = productos.stream()
                .map(ProductoDTO::getMarca)
                .filter(marca -> marca != null && !marca.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Marcas obtenidas exitosamente",
                "data", marcas
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al obtener marcas",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtiene sectores de almacenamiento únicos de productos de una empresa
     */
    @GetMapping("/sectores-almacenamiento")
    public ResponseEntity<?> obtenerSectoresAlmacenamiento(@PathVariable Long empresaId) {
        try {
            // Verificar autenticación
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(java.util.Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioEmpresaId = usuarioPrincipal.getEmpresaId();
            
            // Verificar que el usuario pertenece a la empresa
            if (usuarioEmpresaId == null || !usuarioEmpresaId.equals(empresaId)) {
                return ResponseEntity.status(403).body(java.util.Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer sectores de almacenamiento únicos
            List<String> sectores = productos.stream()
                .map(ProductoDTO::getSectorAlmacenamiento)
                .filter(sector -> sector != null && !sector.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Sectores de almacenamiento obtenidos exitosamente",
                "data", sectores
            ));
        } catch (Exception e) {
            System.err.println("Error al obtener sectores de almacenamiento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al obtener sectores de almacenamiento",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtiene sectores de almacenamiento únicos de productos de una empresa (endpoint alternativo)
     */
    @GetMapping("/sectores-almacenamiento-simple")
    public ResponseEntity<List<String>> obtenerSectoresAlmacenamientoSimple(@PathVariable Long empresaId) {
        try {
            // Verificar autenticación
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("❌ [PRODUCTOS] Usuario no autenticado");
                return ResponseEntity.status(401).build();
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioEmpresaId = usuarioPrincipal.getEmpresaId();
            
            System.out.println("🔍 [PRODUCTOS] Debug permisos:");
            System.out.println("🔍 [PRODUCTOS] EmpresaId de la URL: " + empresaId);
            System.out.println("🔍 [PRODUCTOS] EmpresaId del usuario: " + usuarioEmpresaId);
            System.out.println("🔍 [PRODUCTOS] Usuario ID: " + usuarioPrincipal.getId());
            System.out.println("🔍 [PRODUCTOS] Usuario rol: " + usuarioPrincipal.getAuthorities());
            
            // Verificar que el usuario pertenece a la empresa
            if (usuarioEmpresaId == null || !usuarioEmpresaId.equals(empresaId)) {
                System.out.println("❌ [PRODUCTOS] Usuario no pertenece a la empresa. URL: " + empresaId + ", Usuario: " + usuarioEmpresaId);
                return ResponseEntity.status(403).build();
            }

            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer sectores de almacenamiento únicos
            List<String> sectores = productos.stream()
                .map(ProductoDTO::getSectorAlmacenamiento)
                .filter(sector -> sector != null && !sector.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(sectores);
        } catch (Exception e) {
            System.err.println("Error al obtener sectores de almacenamiento simple: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Obtiene productos por sector de almacenamiento
     */
    @GetMapping("/por-sector")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosPorSector(
            @PathVariable Long empresaId,
            @RequestParam String sector,
            @RequestParam(required = false) Boolean activo) {
        try {
            List<ProductoDTO> productos;
            
            if (activo != null) {
                productos = productoService.obtenerProductosPorSectorYEstado(empresaId, sector, activo);
            } else {
                productos = productoService.obtenerProductosPorSector(empresaId, sector);
            }
            
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene códigos personalizados únicos de productos de una empresa
     */
    @GetMapping("/codigos-personalizados")
    public ResponseEntity<?> obtenerCodigosPersonalizados(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer códigos personalizados únicos
            List<String> codigos = productos.stream()
                .map(ProductoDTO::getCodigoPersonalizado)
                .filter(codigo -> codigo != null && !codigo.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Códigos personalizados obtenidos exitosamente",
                "data", codigos
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al obtener códigos personalizados",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtiene productos por código personalizado
     */
    @GetMapping("/por-codigo")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosPorCodigo(
            @PathVariable Long empresaId,
            @RequestParam String codigo,
            @RequestParam(required = false) Boolean activo) {
        try {
            List<ProductoDTO> productos;
            
            if (activo != null) {
                productos = productoService.obtenerProductosPorCodigoYEstado(empresaId, codigo, activo);
            } else {
                productos = productoService.obtenerProductosPorCodigo(empresaId, codigo);
            }
            
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene códigos de barras únicos de productos de una empresa
     */
    @GetMapping("/codigos-barras")
    public ResponseEntity<?> obtenerCodigosBarras(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            
            // Extraer códigos de barras únicos
            List<String> codigos = productos.stream()
                .map(ProductoDTO::getCodigoBarras)
                .filter(codigo -> codigo != null && !codigo.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Códigos de barras obtenidos exitosamente",
                "data", codigos
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al obtener códigos de barras",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Genera un código de barras único para la empresa
     */
    @PostMapping("/generar-codigo-barras")
    public ResponseEntity<?> generarCodigoBarras(@PathVariable Long empresaId) {
        try {
            String codigoBarras = productoService.generarCodigoBarras(empresaId);
            
            var respuesta = java.util.Map.of(
               "data", java.util.Map.of(
                 "codigoBarras", codigoBarras
                ),
                "mensaje", "Código de barras generado exitosamente"
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al generar código de barras: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al generar código de barras: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Verifica si un código de barras ya existe en la empresa
     */
    @GetMapping("/verificar-codigo-barras")
    public ResponseEntity<?> verificarCodigoBarras(
            @PathVariable Long empresaId,
            @RequestParam String codigoBarras) {
        try {
            boolean existe = productoService.codigoBarrasExiste(empresaId, codigoBarras);
            
            var respuesta = java.util.Map.of(
               "data", java.util.Map.of(
                    "existe", existe
                ),
               "mensaje", existe ? "El código de barras ya existe" : "El código de barras está disponible"
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al verificar código de barras: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al verificar código de barras: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene productos por código de barras
     */
    @GetMapping("/por-codigo-barras")
    public ResponseEntity<List<ProductoDTO>> obtenerProductosPorCodigoBarras(
            @PathVariable Long empresaId,
            @RequestParam String codigoBarras,
            @RequestParam(required = false) Boolean activo) {
        try {
            System.out.println("=== DEBUG OBTENER POR CÓDIGO DE BARRAS ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("Código de barras: " + codigoBarras);
            System.out.println("Activo: " + activo);
            
            List<ProductoDTO> productos;
            
            if (activo != null) {
                productos = productoService.obtenerProductosPorCodigoBarrasYEstado(empresaId, codigoBarras, activo);
            } else {
                productos = productoService.obtenerProductosPorCodigoBarras(empresaId, codigoBarras);
            }
            
            System.out.println("Productos encontrados: " + productos.size());
            if (!productos.isEmpty()) {
                System.out.println("Primer producto: " + productos.get(0).getNombre());
            }
            
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            System.err.println("Error al obtener productos por código de barras: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca un producto específico por código de barras
     */
    @GetMapping("/buscar-por-codigo-barras")
    public ResponseEntity<?> buscarProductoPorCodigoBarras(
            @PathVariable Long empresaId,
            @RequestParam String codigoBarras) {
        try {
            System.out.println("=== DEBUG BUSCAR POR CÓDIGO DE BARRAS ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("Código de barras: " + codigoBarras);
            
            Optional<ProductoDTO> producto = productoService.buscarProductoPorCodigoBarras(empresaId, codigoBarras);
            
            if (producto.isPresent()) {
                System.out.println("Producto encontrado: " + producto.get().getNombre());
                return ResponseEntity.ok(java.util.Map.of(
                    "mensaje", "Producto encontrado",
                    "data", producto.get()
                ));
            } else {
                System.out.println("No se encontró producto con código: " + codigoBarras);
                return ResponseEntity.ok(java.util.Map.of(
                    "mensaje", "No se encontró ningún producto con ese código de barras",
                    "data", null
                ));
            }
        } catch (Exception e) {
            System.err.println("Error al buscar producto por código de barras: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(java.util.Map.of(
                "error", "Error al buscar producto por código de barras",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Sube una imagen a Cloudinary
     */
    @PostMapping("/subir-imagen")
    public ResponseEntity<?> subirImagen(
            @PathVariable Long empresaId,
            @RequestParam("imagen") MultipartFile archivo) {
        try {
            System.out.println("🔍 DEBUG: Endpoint subir-imagen llamado");
            System.out.println("🔍 DEBUG: empresaId=" + empresaId);
            System.out.println("🔍 DEBUG: archivo=" + archivo.getOriginalFilename());
            System.out.println("🔍 DEBUG: archivo.size=" + archivo.getSize());
            System.out.println("🔍 DEBUG: archivo.contentType=" + archivo.getContentType());
            // Validar que el archivo no esté vacío
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "No se ha seleccionado ningún archivo"));
            }

            // Validar tipo de archivo
            String tipoContenido = archivo.getContentType();
            if (tipoContenido == null || !tipoContenido.startsWith("image/")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo debe ser una imagen"));
            }

            // Validar tamaño del archivo (máximo 5MB)
            if (archivo.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "La imagen no puede ser mayor a 5MB"));
            }

            // Subir imagen a Cloudinary
            System.out.println("🔍 DEBUG: Llamando a cloudinaryService.subirImagen...");
            String urlImagen = cloudinaryService.subirImagen(archivo, empresaId);
            System.out.println("✅ DEBUG: Imagen subida a Cloudinary: " + urlImagen);

            return ResponseEntity.ok(Map.of(
                "data", Map.of("url", urlImagen),
                "mensaje", "Imagen subida exitosamente"
            ));

        } catch (Exception e) {
            System.err.println("Error al subir imagen: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al subir la imagen: " + e.getMessage()));
        }
    }

    /**
     * Elimina una imagen de Cloudinary
     */
    @DeleteMapping("/eliminar-imagen")
    public ResponseEntity<?> eliminarImagen(
            @PathVariable Long empresaId,
            @RequestParam("url") String urlImagen) {
        try {
            boolean eliminada = cloudinaryService.eliminarImagen(urlImagen);
            
            if (eliminada) {
                return ResponseEntity.ok(Map.of("mensaje", "Imagen eliminada exitosamente"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No se pudo eliminar la imagen"));
            }

        } catch (Exception e) {
            System.err.println("Error al eliminar imagen: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al eliminar la imagen: " + e.getMessage()));
        }
    }

    /**
     * Valida el stock disponible para un producto
     */
    @GetMapping("/{id}/validar-stock")
    public ResponseEntity<?> validarStock(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            @RequestParam Integer cantidad) {
        try {
            System.out.println("=== DEBUG VALIDAR STOCK ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ProductoId: " + id);
            System.out.println("Cantidad solicitada: " + cantidad);
            
            Optional<ProductoDTO> producto = productoService.obtenerProductoPorId(id, empresaId);
            
            if (producto.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Producto no encontrado"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            ProductoDTO prod = producto.get();
            boolean stockSuficiente = prod.getStock() >= cantidad;
            int stockDisponible = prod.getStock();
            
            System.out.println("Stock disponible: " + stockDisponible);
            System.out.println("Stock suficiente: " + stockSuficiente);
            
            var respuesta = java.util.Map.of(
                "stockDisponible", stockDisponible,
                "stockSuficiente", stockSuficiente,
                "cantidadSolicitada", cantidad,
                "productoNombre", prod.getNombre()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al validar stock: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint de plantilla completamente público sin Spring Security
     */
    @RequestMapping(value = "/plantilla-final", method = RequestMethod.GET, produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> descargarPlantillaFinal() {
        try {
            System.out.println("📥 Descargando plantilla final");
            
            // Generar la plantilla usando el nuevo servicio con formato unificado
            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            
            if (plantilla == null || plantilla.length == 0) {
                System.err.println("❌ Error: Plantilla generada está vacía");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new byte[0]);
            }
            
            System.out.println("✅ Plantilla final generada exitosamente, tamaño: " + plantilla.length + " bytes");
            
            // Configurar headers para descarga
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .body(plantilla);
                
        } catch (Exception e) {
            System.err.println("❌ Error al generar plantilla final: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new byte[0]);
        }
    }

    /**
     * Endpoint de plantilla completamente público con CORS explícito
     */
    @CrossOrigin(origins = "*", allowedHeaders = "*")
    @GetMapping("/plantilla-simple")
    public ResponseEntity<?> descargarPlantillaSimple() {
        try {
            System.out.println("📥 Descargando plantilla simple");
            
            // Generar la plantilla usando el nuevo servicio con formato unificado
            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            
            if (plantilla == null || plantilla.length == 0) {
                System.err.println("❌ Error: Plantilla generada está vacía");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al generar la plantilla: archivo vacío"));
            }
            
            System.out.println("✅ Plantilla simple generada exitosamente, tamaño: " + plantilla.length + " bytes");
            
            // Configurar headers para descarga
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
                .header("Access-Control-Allow-Headers", "*")
                .body(plantilla);
                
        } catch (Exception e) {
            System.err.println("❌ Error al generar plantilla simple: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor al generar la plantilla"));
        }
    }

    /**
     * Endpoint de plantilla completamente público (sin empresaId)
     */
    @GetMapping("/plantilla-publica")
    public ResponseEntity<?> descargarPlantillaPublica() {
        try {
            System.out.println("📥 Descargando plantilla pública");
            
            // Generar la plantilla usando el nuevo servicio con formato unificado
            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            
            if (plantilla == null || plantilla.length == 0) {
                System.err.println("❌ Error: Plantilla generada está vacía");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al generar la plantilla: archivo vacío"));
            }
            
            System.out.println("✅ Plantilla pública generada exitosamente, tamaño: " + plantilla.length + " bytes");
            
            // Configurar headers para descarga
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(plantilla);
                
        } catch (Exception e) {
            System.err.println("❌ Error al generar plantilla pública: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor al generar la plantilla"));
        }
    }

    /**
     * Endpoint completamente público para probar configuración
     */
    @GetMapping("/publico/test")
    public ResponseEntity<?> testPublico() {
        try {
            System.out.println("🌍 TEST PÚBLICO: Endpoint completamente público");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Endpoint público funcionando",
                "timestamp", System.currentTimeMillis(),
                "status", "success"
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error en test público: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error en test público: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para verificar si el problema es de autenticación
     */
    @GetMapping("/test-plantilla")
    public ResponseEntity<?> testPlantilla(@PathVariable Long empresaId) {
        try {
            System.out.println("🧪 TEST: Endpoint de prueba para empresa: " + empresaId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Endpoint de prueba funcionando",
                "empresaId", empresaId,
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error en test: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error en test: " + e.getMessage()));
        }
    }

    /**
     * Descarga la plantilla Excel para importación de productos
     */
    @GetMapping("/plantilla-importacion")
    public ResponseEntity<?> descargarPlantillaImportacion(@PathVariable Long empresaId) {
        try {
            System.out.println("📥 Descargando plantilla para empresa: " + empresaId);
            
            // Generar la plantilla usando el nuevo servicio con formato de reporte de stock
            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            
            if (plantilla == null || plantilla.length == 0) {
                System.err.println("❌ Error: Plantilla generada está vacía");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al generar la plantilla: archivo vacío"));
            }
            
            System.out.println("✅ Plantilla generada exitosamente, tamaño: " + plantilla.length + " bytes");
            
            // Configurar headers para descarga
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header("Content-Length", String.valueOf(plantilla.length))
                .header("Cache-Control", "no-cache")
                .body(plantilla);
                
        } catch (IOException e) {
            System.err.println("❌ Error de I/O al generar plantilla: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar la plantilla: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("❌ Error inesperado al generar plantilla: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor al generar la plantilla"));
        }
    }

    /**
     * Valida un archivo Excel para importación de productos
     */
    @PostMapping("/validar-importacion")
    public ResponseEntity<?> validarArchivoImportacion(
            @PathVariable Long empresaId,
            @RequestParam("archivo") MultipartFile archivo) {
        try {
            // Validar tipo de archivo
            if (!archivo.getOriginalFilename().toLowerCase().endsWith(".xlsx")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos Excel (.xlsx)"));
            }

            // Validar tamaño del archivo (máximo 10MB)
            if (archivo.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede ser mayor a 10MB"));
            }

            ResultadoImportacionDTO resultado = importacionProductoService.validarArchivoExcel(archivo, empresaId);
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("Error al validar archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al validar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Importa productos desde un archivo Excel validado
     */
    @PostMapping("/importar-productos")
    public ResponseEntity<?> importarProductos(
            @PathVariable Long empresaId,
            @RequestBody List<ImportacionProductoDTO> productos) {
        try {
            ResultadoImportacionDTO resultado = importacionProductoService.importarProductos(productos, empresaId);
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("Error al importar productos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al importar productos: " + e.getMessage()));
        }
    }



    /**
     * Descarga el reporte de inventario del día en Excel
     */
    @GetMapping("/reporte-inventario-dia")
    public ResponseEntity<?> descargarReporteInventarioDia(
            @PathVariable Long empresaId,
            @RequestParam(required = false) String fecha) {
        try {
            // Si no se proporciona fecha, usar la fecha actual
            LocalDate fechaReporte = fecha != null ? 
                LocalDate.parse(fecha) : LocalDate.now();
            
            byte[] reporte = reporteInventarioService.generarReporteInventarioDia(empresaId, fechaReporte);

            String nombreArchivo = "reporte_inventario_" + empresaId + "_" +
                fechaReporte.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(reporte);

        } catch (Exception e) {
            System.err.println("Error al generar reporte de inventario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar el reporte de inventario: " + e.getMessage()));
        }
    }

    /**
     * Descarga el reporte de diferencias de inventario del día en Excel
     */
    @GetMapping("/reporte-diferencias-dia")
    public ResponseEntity<?> descargarReporteDiferenciasDia(
            @PathVariable Long empresaId,
            @RequestParam(required = false) String fecha) {
        try {
            // Si no se proporciona fecha, usar la fecha actual
            LocalDate fechaReporte = fecha != null ? 
                LocalDate.parse(fecha) : LocalDate.now();
            
            byte[] reporte = reporteDiferenciasInventarioService.generarReporteDiferenciasDia(empresaId, fechaReporte);

            String nombreArchivo = "reporte_diferencias_" + empresaId + "_" +
                fechaReporte.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(reporte);

        } catch (Exception e) {
            System.err.println("Error al generar reporte de diferencias: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar el reporte de diferencias: " + e.getMessage()));
        }
    }

    /**
     * Descarga el reporte de stock en Excel
     */
    @GetMapping("/reporte-stock")
    public ResponseEntity<?> descargarReporteStock(@PathVariable Long empresaId) {
        try {
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);

            String nombreArchivo = "reporte_stock_" + empresaId + "_" +
                LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";

            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .body(reporte);

        } catch (Exception e) {
            System.err.println("Error al generar reporte de stock: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al generar el reporte de stock: " + e.getMessage()));
        }
    }

    /**
     * Descarga la plantilla de carga masiva con formato de reporte de stock
     */
    @GetMapping("/plantilla-carga-masiva")
    public ResponseEntity<?> descargarPlantillaCargaMasiva(@PathVariable Long empresaId) {
        try {
            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            String nombreArchivo = "plantilla_carga_masiva_" + empresaId + "_" +
                    LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx";
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(plantilla);
        } catch (Exception e) {
            System.err.println("Error al generar plantilla de carga masiva: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al generar la plantilla de carga masiva: " + e.getMessage()));
        }
    }

    /**
     * Endpoint completamente público sin Spring Security
     */
    @RequestMapping(value = "/plantilla-directa", method = RequestMethod.GET)
    public void descargarPlantillaDirecta(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla directa");
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");

            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            response.getOutputStream().write(plantilla);
            response.getOutputStream().flush();

            System.out.println("✅ Plantilla directa generada exitosamente");
            
        } catch (Exception e) {
            System.err.println("❌ Error en plantilla directa: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Migra el stock de un producto a un nuevo sector
     */
    @PostMapping("/{productoId}/migrar-sector")
    public ResponseEntity<?> migrarSectorProducto(
            @PathVariable Long empresaId,
            @PathVariable Long productoId,
            @RequestBody Map<String, String> request) {
        try {
            String sectorDestino = request.get("sectorDestino");
            
            if (sectorDestino == null || sectorDestino.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El sector de destino es requerido"));
            }
            
            productoService.migrarSectorProducto(empresaId, productoId, sectorDestino.trim());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock migrado exitosamente al sector: " + sectorDestino,
                "productoId", productoId,
                "sectorDestino", sectorDestino
            ));
            
        } catch (Exception e) {
            System.err.println("Error al migrar sector del producto: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Error al migrar sector: " + e.getMessage()
            ));
        }
    }

    /**
     * Endpoint completamente público para reporte de stock sin Spring Security
     */
    @RequestMapping(value = "/reporte-stock-directo", method = RequestMethod.GET)
    public void descargarReporteStockDirecto(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock directo para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_" + empresaId + "_" + 
                LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte directamente
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock directo generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock directo: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Sincroniza el stock de un producto específico con sus sectores
     */
    @PostMapping("/{id}/sincronizar-stock")
    public ResponseEntity<?> sincronizarStockProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            System.out.println("🔄 SINCRONIZACIÓN MANUAL - Iniciando sincronización para producto ID: " + id);
            
            // Obtener el producto
            ProductoDTO producto = productoService.obtenerProductoPorIdSinFiltro(id, empresaId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            
            // Obtener stock actual en sectores
            List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoId(id);
            Integer stockTotalEnSectores = stockEnSectores.stream()
                    .mapToInt(StockPorSector::getCantidad)
                    .sum();
            
            System.out.println("🔄 SINCRONIZACIÓN MANUAL - Stock del producto: " + producto.getStock());
            System.out.println("🔄 SINCRONIZACIÓN MANUAL - Stock en sectores: " + stockTotalEnSectores);
            
            // Calcular la diferencia
            Integer diferencia = producto.getStock() - stockTotalEnSectores;
            System.out.println("🔄 SINCRONIZACIÓN MANUAL - Diferencia: " + diferencia);
            
            if (diferencia != 0) {
                // Sincronizar el stock
                productoService.sincronizarStockConSectores(empresaId, id, stockTotalEnSectores, producto.getStock());
                
                return ResponseEntity.ok(java.util.Map.of(
                    "mensaje", "Stock sincronizado exitosamente",
                    "productoId", id,
                    "stockAnterior", stockTotalEnSectores,
                    "stockNuevo", producto.getStock(),
                    "diferencia", diferencia
                ));
            } else {
                return ResponseEntity.ok(java.util.Map.of(
                    "mensaje", "El stock ya está sincronizado",
                    "productoId", id,
                    "stock", producto.getStock()
                ));
            }
            
        } catch (Exception e) {
            System.err.println("❌ SINCRONIZACIÓN MANUAL - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "error", "Error al sincronizar stock",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Sincroniza el stock de todos los productos con sus sectores
     */
    @PostMapping("/sincronizar-todo-stock")
    public ResponseEntity<?> sincronizarTodoStock(@PathVariable Long empresaId) {
        try {
            System.out.println("🔄 SINCRONIZACIÓN MASIVA - Iniciando sincronización para empresa ID: " + empresaId);
            
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            java.util.List<java.util.Map<String, Object>> productosCorregidos = new java.util.ArrayList<>();
            int totalProductos = productos.size();
            int productosConInconsistencias = 0;
            int productosSincronizados = 0;
            
            for (ProductoDTO producto : productos) {
                try {
                    // Obtener stock actual en sectores
                    List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoId(producto.getId());
                    Integer stockTotalEnSectores = stockEnSectores.stream()
                            .mapToInt(StockPorSector::getCantidad)
                            .sum();
                    
                    Integer diferencia = producto.getStock() - stockTotalEnSectores;
                    
                    if (diferencia != 0) {
                        productosConInconsistencias++;
                        // Sincronizar el stock
                        productoService.sincronizarStockConSectores(empresaId, producto.getId(), stockTotalEnSectores, producto.getStock());
                        
                        productosCorregidos.add(java.util.Map.of(
                            "productoId", producto.getId(),
                            "productoNombre", producto.getNombre(),
                            "stockAnterior", stockTotalEnSectores,
                            "stockNuevo", producto.getStock(),
                            "diferencia", diferencia
                        ));
                        
                        productosSincronizados++;
                    }
                } catch (Exception e) {
                    System.err.println("❌ SINCRONIZACIÓN MASIVA - Error en producto " + producto.getId() + ": " + e.getMessage());
                }
            }
            
            System.out.println("✅ SINCRONIZACIÓN MASIVA - Completada: " + productosSincronizados + " productos corregidos de " + totalProductos);
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Sincronización masiva completada",
                "totalProductos", totalProductos,
                "productosConInconsistencias", productosConInconsistencias,
                "productosSincronizados", productosSincronizados,
                "productosYaSincronizados", totalProductos - productosConInconsistencias,
                "productosCorregidos", productosCorregidos
            ));
            
        } catch (Exception e) {
            System.err.println("❌ SINCRONIZACIÓN MASIVA - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "error", "Error al sincronizar stock masivamente",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Diagnostica inconsistencias de stock en todos los productos
     */
    @GetMapping("/diagnostico-stock")
    public ResponseEntity<?> diagnosticarStock(@PathVariable Long empresaId) {
        try {
            System.out.println("🔍 DIAGNÓSTICO STOCK - Iniciando diagnóstico para empresa ID: " + empresaId);
            
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            java.util.List<java.util.Map<String, Object>> inconsistencias = new java.util.ArrayList<>();
            int totalProductos = productos.size();
            int productosConInconsistencias = 0;
            
            for (ProductoDTO producto : productos) {
                try {
                    // Obtener stock actual en sectores
                    List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoId(producto.getId());
                    Integer stockTotalEnSectores = stockEnSectores.stream()
                            .mapToInt(StockPorSector::getCantidad)
                            .sum();
                    
                    Integer diferencia = producto.getStock() - stockTotalEnSectores;
                    
                    if (diferencia != 0) {
                        productosConInconsistencias++;
                        inconsistencias.add(java.util.Map.of(
                            "productoId", producto.getId(),
                            "productoNombre", producto.getNombre(),
                            "stockProducto", producto.getStock(),
                            "stockSectores", stockTotalEnSectores,
                            "diferencia", diferencia,
                            "sectorAsignado", producto.getSectorAlmacenamiento()
                        ));
                    }
                } catch (Exception e) {
                    System.err.println("❌ DIAGNÓSTICO STOCK - Error en producto " + producto.getId() + ": " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok(java.util.Map.of(
                "mensaje", "Diagnóstico completado",
                "totalProductos", totalProductos,
                "productosConInconsistencias", productosConInconsistencias,
                "productosSincronizados", totalProductos - productosConInconsistencias,
                "inconsistencias", inconsistencias
            ));
            
        } catch (Exception e) {
            System.err.println("❌ DIAGNÓSTICO STOCK - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(java.util.Map.of(
                "error", "Error al diagnosticar stock",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Valida un archivo Excel de inventario de la empresa
     * Busca la pestaña "Stock" y valida los datos
     */
    @PostMapping("/validar-inventario")
    public ResponseEntity<?> validarArchivoInventario(
            @PathVariable Long empresaId,
            @RequestParam("archivo") MultipartFile archivo) {
        try {
            System.out.println("🔍 [INVENTARIO] Validando archivo de inventario para empresa: " + empresaId);
            System.out.println("🔍 [INVENTARIO] Archivo: " + archivo.getOriginalFilename() + " (" + archivo.getSize() + " bytes)");

            // Validar tipo de archivo
            if (!archivo.getOriginalFilename().toLowerCase().endsWith(".xlsx")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos Excel (.xlsx)"));
            }

            // Validar tamaño del archivo (máximo 10MB)
            if (archivo.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede ser mayor a 10MB"));
            }

            // Procesar el archivo
            Map<String, Object> resultado = importacionInventarioService.procesarArchivoInventario(archivo, empresaId);
            
            System.out.println("✅ [INVENTARIO] Archivo procesado: " + resultado.get("mensaje"));
            
            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            System.err.println("❌ [INVENTARIO] Error al validar archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al validar el archivo: " + e.getMessage()));
        }
    }

    /**
     * Importa el inventario validado a la base de datos
     */
    @PostMapping("/importar-inventario")
    public ResponseEntity<?> importarInventario(
            @PathVariable Long empresaId,
            @RequestBody List<Map<String, Object>> productos) {
        try {
            System.out.println("🔍 [INVENTARIO] Importando inventario para empresa: " + empresaId);
            System.out.println("🔍 [INVENTARIO] Productos a importar: " + productos.size());

            Map<String, Object> resultado = importacionInventarioService.importarInventario(productos, empresaId);
            
            System.out.println("✅ [INVENTARIO] Importación completada: " + resultado.get("mensaje"));
            
            return ResponseEntity.ok(resultado);

        } catch (Exception e) {
            System.err.println("❌ [INVENTARIO] Error al importar inventario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al importar el inventario: " + e.getMessage()));
        }
    }
}
