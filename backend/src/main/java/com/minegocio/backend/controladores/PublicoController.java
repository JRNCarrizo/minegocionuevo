package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.ProductoService;
import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.PedidoService;
import com.minegocio.backend.dto.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/publico")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173", "https://*.onrender.com", "https://*.netlify.app", "https://*.vercel.app", "https://negocio360.org", "https://*.negocio360.org"}, allowedHeaders = "*")
public class PublicoController {

    @Autowired
    private EmpresaService empresaService;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ClienteService clienteService;
    
    @Autowired
    private PedidoService pedidoService;

    /**
     * Obtener información pública de una empresa por subdominio
     */
    @GetMapping("/{subdominio}/empresa")
    public ResponseEntity<?> obtenerEmpresaPublica(@PathVariable String subdominio) {
        try {
            System.out.println("Buscando empresa con subdominio: " + subdominio);
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresaOpt.isEmpty()) {
                System.out.println("No se encontró empresa con subdominio: " + subdominio);
                return ResponseEntity.status(404).body(Map.of(
                    "error", "No se encontró empresa con el subdominio: " + subdominio,
                    "mensaje", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            System.out.println("Empresa encontrada: " + empresa.getNombre());
            System.out.println("Colores de la empresa:");
            System.out.println("  - Primario: " + empresa.getColorPrimario());
            System.out.println("  - Secundario: " + empresa.getColorSecundario());
            System.out.println("  - Acento: " + empresa.getColorAcento());
            System.out.println("  - Fondo: " + empresa.getColorFondo());
            System.out.println("  - Texto: " + empresa.getColorTexto());
            System.out.println("  - Imagen Fondo: " + empresa.getImagenFondoUrl());
            System.out.println("  - Color Título Principal: " + empresa.getColorTituloPrincipal());
            System.out.println("  - Color Card Filtros: " + empresa.getColorCardFiltros());
            
            // Crear respuesta manual para evitar problemas de serialización
            Map<String, Object> empresaData = new java.util.HashMap<>();
            empresaData.put("id", empresa.getId() != null ? empresa.getId() : 0L);
            empresaData.put("nombre", empresa.getNombre() != null ? empresa.getNombre() : "");
            empresaData.put("descripcion", empresa.getDescripcion() != null ? empresa.getDescripcion() : "");
            empresaData.put("textoBienvenida", empresa.getTextoBienvenida() != null ? empresa.getTextoBienvenida() : "");
            empresaData.put("logoUrl", empresa.getLogoUrl() != null ? empresa.getLogoUrl() : "");
            empresaData.put("colorPrimario", empresa.getColorPrimario() != null ? empresa.getColorPrimario() : "#3B82F6");
            empresaData.put("colorSecundario", empresa.getColorSecundario() != null ? empresa.getColorSecundario() : "#1F2937");
            empresaData.put("colorAcento", empresa.getColorAcento() != null ? empresa.getColorAcento() : "#F59E0B");
            empresaData.put("colorFondo", empresa.getColorFondo() != null ? empresa.getColorFondo() : "#FFFFFF");
            empresaData.put("colorTexto", empresa.getColorTexto() != null ? empresa.getColorTexto() : "#1F2937");
            empresaData.put("colorTituloPrincipal", empresa.getColorTituloPrincipal() != null ? empresa.getColorTituloPrincipal() : "#1F2937");
            empresaData.put("colorCardFiltros", empresa.getColorCardFiltros() != null ? empresa.getColorCardFiltros() : "#FFFFFF");
            empresaData.put("imagenFondoUrl", empresa.getImagenFondoUrl() != null ? empresa.getImagenFondoUrl() : "");
            empresaData.put("moneda", empresa.getMoneda() != null ? empresa.getMoneda() : "USD");
            empresaData.put("instagramUrl", empresa.getInstagramUrl() != null ? empresa.getInstagramUrl() : "");
            empresaData.put("facebookUrl", empresa.getFacebookUrl() != null ? empresa.getFacebookUrl() : "");

            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Empresa encontrada");
            response.put("data", empresaData);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al buscar empresa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error interno del servidor",
                "mensaje", "Error al procesar la solicitud"
            ));
        }
    }

    /**
     * Endpoint temporal para insertar datos de demo
     */
    @PostMapping("/debug/crear-empresa-demo")
    public ResponseEntity<?> crearEmpresaDemo() {
        try {
            // Verificar si ya existe
            Optional<Empresa> existente = empresaService.obtenerPorSubdominio("minegocio");
            if (existente.isPresent()) {
                Map<String, Object> empresaMap = new java.util.HashMap<>();
                empresaMap.put("id", existente.get().getId());
                empresaMap.put("nombre", existente.get().getNombre());
                empresaMap.put("subdominio", existente.get().getSubdominio());
                
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("mensaje", "La empresa 'minegocio' ya existe");
                response.put("empresa", empresaMap);
                return ResponseEntity.ok(response);
            }
            
            // Crear nueva empresa
            Empresa empresa = new Empresa();
            empresa.setNombre("miNegocio Demo");
            empresa.setSubdominio("minegocio");
            empresa.setEmail("demo@minegocio.com");
            empresa.setTelefono("+54 11 1234-5678");
            empresa.setDescripcion("Tienda de demostración para el sistema miNegocio");
            empresa.setColorPrimario("#3B82F6");
            empresa.setColorSecundario("#1F2937");
            empresa.setMoneda("USD");
            empresa.setActiva(true);
            
            Empresa empresaGuardada = empresaService.guardar(empresa);
            
            Map<String, Object> empresaMap = new java.util.HashMap<>();
            empresaMap.put("id", empresaGuardada.getId());
            empresaMap.put("nombre", empresaGuardada.getNombre());
            empresaMap.put("subdominio", empresaGuardada.getSubdominio());
            empresaMap.put("email", empresaGuardada.getEmail());
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Empresa demo creada exitosamente");
            response.put("empresa", empresaMap);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al crear empresa demo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al crear empresa demo",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Endpoint para crear empresa de prueba específica
     */
    @PostMapping("/debug/crear-empresa/{subdominio}")
    public ResponseEntity<?> crearEmpresaPrueba(@PathVariable String subdominio) {
        try {
            // Verificar si ya existe
            Optional<Empresa> existente = empresaService.obtenerPorSubdominio(subdominio);
            if (existente.isPresent()) {
                Map<String, Object> empresaMap = new java.util.HashMap<>();
                empresaMap.put("id", existente.get().getId());
                empresaMap.put("nombre", existente.get().getNombre());
                empresaMap.put("subdominio", existente.get().getSubdominio());
                
                Map<String, Object> response = new java.util.HashMap<>();
                response.put("mensaje", "La empresa '" + subdominio + "' ya existe");
                response.put("empresa", empresaMap);
                return ResponseEntity.ok(response);
            }
            
            // Crear nueva empresa
            Empresa empresa = new Empresa();
            empresa.setNombre("Empresa " + subdominio);
            empresa.setSubdominio(subdominio);
            empresa.setEmail("info@" + subdominio + ".negocio360.org");
            empresa.setTelefono("+54 11 1234-5678");
            empresa.setDescripcion("Tienda de prueba para el subdominio " + subdominio);
            empresa.setColorPrimario("#3B82F6");
            empresa.setColorSecundario("#1F2937");
            empresa.setColorAcento("#F59E0B");
            empresa.setColorFondo("#FFFFFF");
            empresa.setColorTexto("#1F2937");
            empresa.setColorTituloPrincipal("#1F2937");
            empresa.setColorCardFiltros("#FFFFFF");
            empresa.setMoneda("USD");
            empresa.setActiva(true);
            
            Empresa empresaGuardada = empresaService.guardar(empresa);
            
            Map<String, Object> empresaMap = new java.util.HashMap<>();
            empresaMap.put("id", empresaGuardada.getId());
            empresaMap.put("nombre", empresaGuardada.getNombre());
            empresaMap.put("subdominio", empresaGuardada.getSubdominio());
            empresaMap.put("email", empresaGuardada.getEmail());
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Empresa '" + subdominio + "' creada exitosamente");
            response.put("empresa", empresaMap);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al crear empresa '" + subdominio + "': " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al crear empresa '" + subdominio + "'",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Endpoint temporal para debug - listar todas las empresas
     */
    @GetMapping("/debug/empresas")
    public ResponseEntity<?> listarEmpresas() {
        try {
            List<Empresa> empresas = empresaService.obtenerTodasLasEmpresas();
            
            List<Map<String, Object>> resultado = empresas.stream()
                .map(empresa -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", empresa.getId());
                    map.put("nombre", empresa.getNombre());
                    map.put("subdominio", empresa.getSubdominio());
                    map.put("email", empresa.getEmail());
                    map.put("activa", empresa.getActiva());
                    return map;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresas encontradas: " + empresas.size(),
                "empresas", resultado
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener empresas: " + e.getMessage()
            ));
        }
    }

    /**
     * Endpoint temporal para debug - verificar productos de una empresa
     */
    @GetMapping("/debug/productos/{empresaId}")
    public ResponseEntity<?> verificarProductos(@PathVariable Long empresaId) {
        try {
            System.out.println("Verificando productos para empresa ID: " + empresaId);
            
            // Verificar si la empresa existe
            Optional<EmpresaDTO> empresaOpt = empresaService.obtenerPorId(empresaId);
            if (empresaOpt.isEmpty()) {
                Map<String, Object> error = new java.util.HashMap<>();
                error.put("error", "Empresa no encontrada");
                error.put("empresaId", empresaId);
                return ResponseEntity.status(404).body(error);
            }
            
            EmpresaDTO empresa = empresaOpt.get();
            System.out.println("Empresa encontrada: " + empresa.getNombre());
            
            // Obtener productos
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            System.out.println("Total de productos obtenidos: " + productos.size());
            
            // Contar por estado
            long totalProductos = productos.size();
            long productosActivos = productos.stream().filter(p -> p.getActivo() != null && p.getActivo()).count();
            long productosConStock = productos.stream().filter(p -> p.getActivo() != null && p.getActivo() && p.getStock() > 0).count();
            
            // Listar productos activos con stock
            List<Map<String, Object>> productosActivosList = productos.stream()
                .filter(p -> p.getActivo() != null && p.getActivo() && p.getStock() > 0)
                .map(p -> {
                    Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", p.getId());
                    map.put("nombre", p.getNombre());
                    map.put("codigoPersonalizado", p.getCodigoPersonalizado());
                    map.put("codigoBarras", p.getCodigoBarras());
                    map.put("stock", p.getStock());
                    map.put("precio", p.getPrecio());
                    map.put("activo", p.getActivo());
                    return map;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> empresaMap = new java.util.HashMap<>();
            empresaMap.put("id", empresa.getId());
            empresaMap.put("nombre", empresa.getNombre());
            empresaMap.put("subdominio", empresa.getSubdominio());
            
            Map<String, Object> estadisticasMap = new java.util.HashMap<>();
            estadisticasMap.put("totalProductos", totalProductos);
            estadisticasMap.put("productosActivos", productosActivos);
            estadisticasMap.put("productosConStock", productosConStock);
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Verificación completada");
            response.put("empresa", empresaMap);
            response.put("estadisticas", estadisticasMap);
            response.put("productosActivos", productosActivosList);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al verificar productos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al verificar productos",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Obtener productos públicos (activos) de una empresa por subdominio
     */
    @GetMapping("/{subdominio}/productos")
    public ResponseEntity<?> obtenerProductosPublicos(
            @PathVariable String subdominio,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String marca,
            @RequestParam(required = false) String buscar) {
        try {
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Long empresaId = empresa.get().getId();
            
            // Obtener todos los productos activos de la empresa
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            
            // Filtrar solo productos activos y con stock disponible
            List<ProductoDTO> productosActivos = productos.stream()
                .filter(p -> p.getActivo() != null && p.getActivo() && p.getStock() != null && p.getStock() > 0)
                .collect(Collectors.toList());
            
            // Aplicar filtros adicionales si se proporcionan
            if (categoria != null && !categoria.isEmpty()) {
                productosActivos = productosActivos.stream()
                    .filter(p -> categoria.equals(p.getCategoria()))
                    .collect(Collectors.toList());
            }
            
            if (marca != null && !marca.isEmpty()) {
                productosActivos = productosActivos.stream()
                    .filter(p -> marca.equals(p.getMarca()))
                    .collect(Collectors.toList());
            }
            
            if (buscar != null && !buscar.isEmpty()) {
                productosActivos = productosActivos.stream()
                    .filter(p -> p.getNombre().toLowerCase().contains(buscar.toLowerCase()) ||
                               (p.getDescripcion() != null && p.getDescripcion().toLowerCase().contains(buscar.toLowerCase())))
                    .collect(Collectors.toList());
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos obtenidos exitosamente",
                "data", productosActivos
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener productos públicos",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtener un producto específico público por ID
     */
    @GetMapping("/{subdominio}/productos/{id}")
    public ResponseEntity<?> obtenerProductoPublico(
            @PathVariable String subdominio,
            @PathVariable Long id) {
        try {
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Long empresaId = empresa.get().getId();
            
            // CORREGIDO: el orden correcto es (id, empresaId)
            Optional<ProductoDTO> producto = productoService.obtenerProductoPorId(id, empresaId);
            
            if (producto.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            ProductoDTO prod = producto.get();
            
            // Solo devolver el producto si está activo y tiene stock disponible
            if (prod.getActivo() == null || !prod.getActivo() || prod.getStock() == null || prod.getStock() <= 0) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto obtenido exitosamente",
                "data", prod
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener producto público",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtener categorías disponibles para una empresa
     */
    @GetMapping("/{subdominio}/categorias")
    public ResponseEntity<?> obtenerCategoriasPublicas(@PathVariable String subdominio) {
        try {
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Long empresaId = empresa.get().getId();
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            
            // Extraer categorías únicas de productos activos
            List<String> categorias = productos.stream()
                .filter(p -> p.getActivo() != null && p.getActivo())
                .map(ProductoDTO::getCategoria)
                .filter(categoria -> categoria != null && !categoria.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Categorías obtenidas exitosamente",
                "data", categorias
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener categorías",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtener marcas disponibles para una empresa
     */
    @GetMapping("/{subdominio}/marcas")
    public ResponseEntity<?> obtenerMarcasPublicas(@PathVariable String subdominio) {
        try {
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Long empresaId = empresa.get().getId();
            List<ProductoDTO> productos = productoService.obtenerTodosLosProductos(empresaId);
            
            // Extraer marcas únicas de productos activos
            List<String> marcas = productos.stream()
                .filter(p -> p.getActivo() != null && p.getActivo())
                .map(ProductoDTO::getMarca)
                .filter(marca -> marca != null && !marca.trim().isEmpty())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Marcas obtenidas exitosamente",
                "data", marcas
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener marcas",
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Endpoint temporal para crear productos demo
     */
    @PostMapping("/debug/crear-productos-demo/{subdominio}")
    public ResponseEntity<?> crearProductosDemo(@PathVariable String subdominio) {
        try {
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "No se encontró empresa con subdominio: " + subdominio
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            Long empresaId = empresa.getId();
            
            // Crear productos de demostración usando el servicio
            List<Map<String, Object>> productosCreados = new ArrayList<>();
            
            // Producto 1
            try {
                ProductoDTO producto1 = new ProductoDTO();
                producto1.setNombre("Producto Demo 1");
                producto1.setDescripcion("Primer producto de demostración para el catálogo público");
                producto1.setPrecio(BigDecimal.valueOf(99.99));
                producto1.setStock(10);
                producto1.setActivo(true);
                producto1.setCategoria("Electrónicos");
                producto1.setMarca("Demo Brand");
                
                ProductoDTO creado1 = productoService.crearProducto(empresaId, producto1);
                Map<String, Object> producto1Map = new java.util.HashMap<>();
                producto1Map.put("id", creado1.getId());
                producto1Map.put("nombre", creado1.getNombre());
                producto1Map.put("precio", creado1.getPrecio());
                productosCreados.add(producto1Map);
            } catch (Exception e) {
                System.out.println("Error creando producto 1: " + e.getMessage());
            }
            
            // Producto 2
            try {
                ProductoDTO producto2 = new ProductoDTO();
                producto2.setNombre("Producto Demo 2");
                producto2.setDescripcion("Segundo producto de demostración");
                producto2.setPrecio(BigDecimal.valueOf(149.99));
                producto2.setStock(5);
                producto2.setActivo(true);
                producto2.setCategoria("Hogar");
                producto2.setMarca("Demo Brand");
                
                ProductoDTO creado2 = productoService.crearProducto(empresaId, producto2);
                Map<String, Object> producto2Map = new java.util.HashMap<>();
                producto2Map.put("id", creado2.getId());
                producto2Map.put("nombre", creado2.getNombre());
                producto2Map.put("precio", creado2.getPrecio());
                productosCreados.add(producto2Map);
            } catch (Exception e) {
                System.out.println("Error creando producto 2: " + e.getMessage());
            }
            
            // Producto 3
            try {
                ProductoDTO producto3 = new ProductoDTO();
                producto3.setNombre("Producto Demo 3");
                producto3.setDescripcion("Tercer producto de demostración");
                producto3.setPrecio(BigDecimal.valueOf(199.99));
                producto3.setStock(8);
                producto3.setActivo(true);
                producto3.setCategoria("Deportes");
                producto3.setMarca("Demo Sports");
                
                ProductoDTO creado3 = productoService.crearProducto(empresaId, producto3);
                Map<String, Object> producto3Map = new java.util.HashMap<>();
                producto3Map.put("id", creado3.getId());
                producto3Map.put("nombre", creado3.getNombre());
                producto3Map.put("precio", creado3.getPrecio());
                productosCreados.add(producto3Map);
            } catch (Exception e) {
                System.out.println("Error creando producto 3: " + e.getMessage());
            }
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Productos demo creados exitosamente");
            response.put("empresa", empresa.getNombre());
            response.put("subdominio", subdominio);
            response.put("productos", productosCreados);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error al crear productos demo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al crear productos demo",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Actualiza el stock de un producto en tiempo real (para el carrito)
     */
    @PostMapping("/{subdominio}/productos/{id}/actualizar-stock-carrito")
    public ResponseEntity<?> actualizarStockCarrito(
            @PathVariable String subdominio,
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("=== DEBUG ACTUALIZAR STOCK CARRITO ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ProductoId: " + id);
            
            Integer cantidadEnCarrito = (Integer) request.get("cantidadEnCarrito");
            if (cantidadEnCarrito == null) {
                cantidadEnCarrito = 0;
            }
            
            System.out.println("Cantidad en carrito: " + cantidadEnCarrito);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
            Optional<ProductoDTO> producto = productoService.obtenerProductoPorId(id, empresaId);
            
            if (producto.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Producto no encontrado"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            ProductoDTO prod = producto.get();
            
            // Solo devolver el producto si está activo
            if (prod.getActivo() == null || !prod.getActivo()) {
                var error = java.util.Map.of(
                    "error", "Producto no disponible"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            int stockDisponible = prod.getStock() - cantidadEnCarrito;
            boolean disponible = stockDisponible > 0;
            
            System.out.println("Stock total: " + prod.getStock());
            System.out.println("Stock disponible: " + stockDisponible);
            System.out.println("Disponible: " + disponible);
            
            var respuesta = java.util.Map.of(
                "productoId", id,
                "stockTotal", prod.getStock(),
                "cantidadEnCarrito", cantidadEnCarrito,
                "stockDisponible", stockDisponible,
                "disponible", disponible,
                "productoNombre", prod.getNombre(),
                "precio", prod.getPrecio()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al actualizar stock del carrito: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Valida el stock disponible para un producto (endpoint público)
     */
    @GetMapping("/{subdominio}/productos/{id}/validar-stock")
    public ResponseEntity<?> validarStockPublico(
            @PathVariable String subdominio,
            @PathVariable Long id,
            @RequestParam Integer cantidad) {
        try {
            System.out.println("=== DEBUG VALIDAR STOCK PÚBLICO ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ProductoId: " + id);
            System.out.println("Cantidad solicitada: " + cantidad);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
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
            System.err.println("Error al validar stock público: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Obtiene los pedidos de un cliente (endpoint público)
     */
    @GetMapping("/{subdominio}/pedidos/cliente/{clienteId}")
    public ResponseEntity<?> obtenerPedidosCliente(
            @PathVariable String subdominio,
            @PathVariable Long clienteId) {
        try {
            System.out.println("=== DEBUG OBTENER PEDIDOS CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ClienteId: " + clienteId);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
            List<com.minegocio.backend.dto.PedidoDTO> pedidos = pedidoService.obtenerPedidosPorClienteYEmpresa(clienteId, empresaId);
            
            System.out.println("Pedidos encontrados: " + pedidos.size());
            
            var respuesta = java.util.Map.of(
                "data", pedidos,
                "totalPedidos", pedidos.size()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al obtener pedidos del cliente: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Cancela un pedido del cliente (endpoint público)
     */
    @PutMapping("/{subdominio}/pedidos/{pedidoId}/cancelar")
    public ResponseEntity<?> cancelarPedidoCliente(
            @PathVariable String subdominio,
            @PathVariable Long pedidoId,
            @RequestParam Long clienteId) {
        try {
            System.out.println("=== DEBUG CANCELAR PEDIDO CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("PedidoId: " + pedidoId);
            System.out.println("ClienteId: " + clienteId);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
            
            // Verificar que el pedido pertenece al cliente
            List<com.minegocio.backend.dto.PedidoDTO> pedidosCliente = pedidoService.obtenerPedidosPorClienteYEmpresa(clienteId, empresaId);
            boolean pedidoPerteneceCliente = pedidosCliente.stream()
                .anyMatch(pedido -> pedido.getId().equals(pedidoId));
            
            if (!pedidoPerteneceCliente) {
                var error = java.util.Map.of(
                    "error", "Pedido no encontrado o no pertenece al cliente"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            // Cancelar el pedido (esto automáticamente restaura el stock)
            com.minegocio.backend.dto.PedidoDTO pedidoCancelado = pedidoService.actualizarEstadoPedido(empresaId, pedidoId, "CANCELADO");
            
            System.out.println("Pedido cancelado exitosamente: " + pedidoCancelado.getNumeroPedido());
            
            var respuesta = java.util.Map.of(
                "mensaje", "Pedido cancelado exitosamente",
                "pedido", pedidoCancelado
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error al cancelar pedido: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al cancelar pedido: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Crea un pedido público (sin autenticación requerida)
     */
    @PostMapping("/{subdominio}/pedidos")
    public ResponseEntity<?> crearPedidoPublico(
            @PathVariable String subdominio,
            @RequestBody Map<String, Object> pedidoData) {
        try {
            System.out.println("=== DEBUG CREAR PEDIDO PÚBLICO ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("Datos del pedido: " + pedidoData);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
            
            // Extraer datos del pedido
            String clienteNombre = (String) pedidoData.get("clienteNombre");
            String clienteEmail = (String) pedidoData.get("clienteEmail");
            String direccionEnvio = (String) pedidoData.get("direccionEnvio");
            Number totalNumber = (Number) pedidoData.get("total");
            BigDecimal total = BigDecimal.valueOf(totalNumber.doubleValue());
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> detallesData = (List<Map<String, Object>>) pedidoData.get("detalles");
            
            // Crear DTO del pedido
            com.minegocio.backend.dto.PedidoDTO pedidoDTO = new com.minegocio.backend.dto.PedidoDTO();
            pedidoDTO.setClienteNombre(clienteNombre);
            pedidoDTO.setClienteEmail(clienteEmail);
            pedidoDTO.setDireccionEntrega(direccionEnvio);
            pedidoDTO.setTotal(total);
            pedidoDTO.setEmpresaId(empresaId);
            
            // Si hay clienteId, establecerlo; si no, dejarlo como null
            Object clienteIdObj = pedidoData.get("clienteId");
            if (clienteIdObj != null) {
                pedidoDTO.setClienteId(((Number) clienteIdObj).longValue());
            }
            
            // Convertir detalles
            List<com.minegocio.backend.dto.DetallePedidoDTO> detalles = new ArrayList<>();
            for (Map<String, Object> detalleData : detallesData) {
                com.minegocio.backend.dto.DetallePedidoDTO detalle = new com.minegocio.backend.dto.DetallePedidoDTO();
                detalle.setProductoId(((Number) detalleData.get("productoId")).longValue());
                detalle.setProductoNombre((String) detalleData.get("productoNombre"));
                detalle.setCantidad(((Number) detalleData.get("cantidad")).intValue());
                detalle.setPrecioUnitario(BigDecimal.valueOf(((Number) detalleData.get("precioUnitario")).doubleValue()));
                detalles.add(detalle);
            }
            pedidoDTO.setDetalles(detalles);
            
            // Crear el pedido
            com.minegocio.backend.dto.PedidoDTO pedidoCreado = pedidoService.crearPedido(empresaId, pedidoDTO);
            
            System.out.println("Pedido creado exitosamente: " + pedidoCreado.getNumeroPedido());
            
            var respuesta = java.util.Map.of(
                "mensaje", "Pedido creado exitosamente",
                "pedido", pedidoCreado
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (Exception e) {
            System.err.println("Error al crear pedido público: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error al crear pedido: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
