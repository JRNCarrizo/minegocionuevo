package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.servicios.ProductoService;
import com.minegocio.backend.servicios.CloudinaryService;
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

    /**
     * Obtiene todos los productos de una empresa
     */
    @GetMapping
    public ResponseEntity<List<ProductoDTO>> obtenerProductos(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene todos los productos de una empresa (incluye inactivos)
     */
    @GetMapping("/todos")
    public ResponseEntity<List<ProductoDTO>> obtenerTodosLosProductosIncluirInactivos(@PathVariable Long empresaId) {
        try {
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductosIncluirInactivos(empresaId);
            return ResponseEntity.ok(productos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
            System.err.println("Error al crear producto: " + e.getMessage());
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
            
            ProductoDTO productoActualizado = productoService.actualizarProducto(empresaId, id, productoDTO);
            
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
     * Elimina un producto (eliminación lógica)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarProducto(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            productoService.eliminarProducto(empresaId, id);
            return ResponseEntity.noContent().build();
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
     * Obtiene todas las categorías de productos de la empresa
     */
    @GetMapping("/categorias")
    public ResponseEntity<?> obtenerCategorias(@PathVariable Long empresaId) {
        try {
            List<String> categorias = productoService.obtenerCategoriasPorEmpresa(empresaId);
            
            return ResponseEntity.ok(Map.of("data", categorias));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("mensaje", "Error al obtener categorías: " + e.getMessage()));
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
            String urlImagen = cloudinaryService.subirImagen(archivo, empresaId);

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
}
