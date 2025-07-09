package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.ProductoService;
import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.dto.ClienteDTO;
import org.springframework.beans.factory.annotation.Autowired;
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
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173"}, allowedHeaders = "*")
public class PublicoController {

    @Autowired
    private EmpresaService empresaService;

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ClienteService clienteService;

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
            
            // Crear respuesta manual para evitar problemas de serialización
            Map<String, Object> empresaData = Map.of(
                "id", empresa.getId() != null ? empresa.getId() : 0L,
                "nombre", empresa.getNombre() != null ? empresa.getNombre() : "",
                "descripcion", empresa.getDescripcion() != null ? empresa.getDescripcion() : "",
                "subdominio", empresa.getSubdominio() != null ? empresa.getSubdominio() : "",
                "logoUrl", empresa.getLogoUrl() != null ? empresa.getLogoUrl() : "",
                "colorPrimario", empresa.getColorPrimario() != null ? empresa.getColorPrimario() : "#3B82F6",
                "colorSecundario", empresa.getColorSecundario() != null ? empresa.getColorSecundario() : "#1F2937",
                "moneda", empresa.getMoneda() != null ? empresa.getMoneda() : "USD"
            );
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa encontrada",
                "data", empresaData
            ));
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
                return ResponseEntity.ok(Map.of(
                    "mensaje", "La empresa 'minegocio' ya existe",
                    "empresa", Map.of(
                        "id", existente.get().getId(),
                        "nombre", existente.get().getNombre(),
                        "subdominio", existente.get().getSubdominio()
                    )
                ));
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
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa demo creada exitosamente",
                "empresa", Map.of(
                    "id", empresaGuardada.getId(),
                    "nombre", empresaGuardada.getNombre(),
                    "subdominio", empresaGuardada.getSubdominio(),
                    "email", empresaGuardada.getEmail()
                )
            ));
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
            
            // Filtrar solo productos activos
            List<ProductoDTO> productosActivos = productos.stream()
                .filter(p -> p.getActivo() != null && p.getActivo())
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
            
            // Solo devolver el producto si está activo
            if (prod.getActivo() == null || !prod.getActivo()) {
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
                productosCreados.add(Map.of(
                    "id", creado1.getId(),
                    "nombre", creado1.getNombre(),
                    "precio", creado1.getPrecio()
                ));
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
                productosCreados.add(Map.of(
                    "id", creado2.getId(),
                    "nombre", creado2.getNombre(),
                    "precio", creado2.getPrecio()
                ));
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
                productosCreados.add(Map.of(
                    "id", creado3.getId(),
                    "nombre", creado3.getNombre(),
                    "precio", creado3.getPrecio()
                ));
            } catch (Exception e) {
                System.out.println("Error creando producto 3: " + e.getMessage());
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos demo creados exitosamente",
                "empresa", empresa.getNombre(),
                "subdominio", subdominio,
                "productos", productosCreados
            ));
        } catch (Exception e) {
            System.err.println("Error al crear productos demo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al crear productos demo",
                "detalle", e.getMessage()
            ));
        }
    }
}
