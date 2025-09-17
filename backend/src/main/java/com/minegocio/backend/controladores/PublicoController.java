package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.ProductoDTO;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.ProductoService;
import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.PedidoService;
import com.minegocio.backend.servicios.EmailService;
import com.minegocio.backend.servicios.SectorService;
import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.math.BigDecimal;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import java.util.HashMap;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

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
    
    @Autowired
    private EmailService emailService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private PedidoRepository pedidoRepository;
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private com.minegocio.backend.repositorios.UsuarioRepository usuarioRepository;
    
    @Autowired
    private SectorService sectorService;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;

    /**
     * Health check endpoint para Railway
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("message", "MiNegocio Backend is running");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "DOWN");
            response.put("message", "Service unavailable");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * Database health check endpoint para Railway
     */
    @GetMapping("/health/db")
    public ResponseEntity<?> databaseHealthCheck() {
        try {
            // Probar conexión a la base de datos
            empresaService.obtenerPorSubdominio("test");
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("message", "Database connection successful");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "DOWN");
            response.put("message", "Database connection failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * Configuración check endpoint para Railway
     */
    @GetMapping("/health/config")
    public ResponseEntity<?> configHealthCheck() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "UP");
            response.put("message", "Configuration check");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            // Verificar variables críticas
            Map<String, Object> config = new HashMap<>();
            config.put("datasource_url", System.getenv("SPRING_DATASOURCE_URL") != null ? "SET" : "NOT_SET");
            config.put("datasource_username", System.getenv("SPRING_DATASOURCE_USERNAME") != null ? "SET" : "NOT_SET");
            config.put("datasource_password", System.getenv("SPRING_DATASOURCE_PASSWORD") != null ? "SET" : "NOT_SET");
            config.put("jwt_secret", System.getenv("MINE_NEGOCIO_APP_JWT_SECRET") != null ? "SET" : "NOT_SET");
            config.put("cloudinary_cloud_name", System.getenv("CLOUDINARY_CLOUD_NAME") != null ? "SET" : "NOT_SET");
            config.put("mail_username", System.getenv("MAIL_USERNAME") != null ? "SET" : "NOT_SET");
            
            response.put("config", config);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "DOWN");
            response.put("message", "Configuration check failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
        }
    }

    /**
     * Debug endpoint para verificar variables de entorno en Railway
     */
    @GetMapping("/debug/env")
    public ResponseEntity<?> debugEnvironmentVariables() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "DEBUG");
            response.put("message", "Environment variables debug");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            
            // Obtener todas las variables de entorno relevantes
            Map<String, Object> envVars = new HashMap<>();
            envVars.put("SPRING_DATASOURCE_URL", System.getenv("SPRING_DATASOURCE_URL"));
            envVars.put("SPRING_DATASOURCE_USERNAME", System.getenv("SPRING_DATASOURCE_USERNAME"));
            envVars.put("SPRING_DATASOURCE_PASSWORD", System.getenv("SPRING_DATASOURCE_PASSWORD") != null ? "***HIDDEN***" : null);
            envVars.put("SPRING_PROFILES_ACTIVE", System.getenv("SPRING_PROFILES_ACTIVE"));
            envVars.put("MINE_NEGOCIO_APP_JWT_SECRET", System.getenv("MINE_NEGOCIO_APP_JWT_SECRET") != null ? "***HIDDEN***" : null);
            envVars.put("PORT", System.getenv("PORT"));
            envVars.put("RAILWAY_ENVIRONMENT", System.getenv("RAILWAY_ENVIRONMENT"));
            envVars.put("RAILWAY_PROJECT_ID", System.getenv("RAILWAY_PROJECT_ID"));
            envVars.put("RAILWAY_SERVICE_ID", System.getenv("RAILWAY_SERVICE_ID"));
            
            response.put("environment_variables", envVars);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Debug failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Debug endpoint para probar autenticación
     */
    @GetMapping("/debug/auth-test")
    public ResponseEntity<?> debugAuthTest() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "AUTH_TEST");
            response.put("message", "Authentication test endpoint");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            response.put("public_endpoint", true);
            response.put("auth_required", false);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Auth test failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Debug endpoint público para verificar si el backend está funcionando
     */
    @GetMapping("/debug/backend-status")
    public ResponseEntity<?> debugBackendStatus() {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "BACKEND_OK");
            response.put("message", "Backend is running correctly");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            response.put("public_endpoint", true);
            response.put("auth_required", false);
            response.put("jwt_secret_configured", System.getenv("MINE_NEGOCIO_APP_JWT_SECRET") != null);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Backend status check failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * Debug endpoint para verificar estado de autenticación
     */
    @GetMapping("/debug/auth-status")
    public ResponseEntity<?> debugAuthStatus(Authentication authentication) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "AUTH_STATUS");
            response.put("timestamp", java.time.LocalDateTime.now().toString());
            response.put("authentication", authentication != null ? "PRESENT" : "NULL");
            
            if (authentication != null) {
                response.put("principal_type", authentication.getPrincipal().getClass().getSimpleName());
                response.put("principal_name", authentication.getName());
                response.put("authorities", authentication.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()));
                response.put("authenticated", authentication.isAuthenticated());
                
                // Información adicional del usuario
                if (authentication.getPrincipal() instanceof com.minegocio.backend.seguridad.UsuarioPrincipal) {
                    com.minegocio.backend.seguridad.UsuarioPrincipal principal = 
                        (com.minegocio.backend.seguridad.UsuarioPrincipal) authentication.getPrincipal();
                    response.put("user_id", principal.getId());
                    response.put("empresa_id", principal.getEmpresaId());
                    response.put("nombre_completo", principal.getNombreCompleto());
                    response.put("rol_usuario", principal.getUsuario().getRol().name());
                    response.put("usuario_activo", principal.getUsuario().getActivo());
                    response.put("email_verificado", principal.getUsuario().getEmailVerificado());
                }
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("status", "ERROR");
            response.put("message", "Auth status check failed");
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
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
            System.out.println("  - Mostrar Stock: " + empresa.getMostrarStock());
            System.out.println("  - Mostrar Categorías: " + empresa.getMostrarCategorias());
            System.out.println("  - Mostrar Precios: " + empresa.getMostrarPrecios());
            
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
            // Métodos de pago - Transferencia bancaria
            empresaData.put("transferenciaBancariaHabilitada", empresa.getTransferenciaBancariaHabilitada() != null ? empresa.getTransferenciaBancariaHabilitada() : false);
            empresaData.put("banco", empresa.getBanco() != null ? empresa.getBanco() : "");
            empresaData.put("tipoCuenta", empresa.getTipoCuenta() != null ? empresa.getTipoCuenta() : "");
            empresaData.put("numeroCuenta", empresa.getNumeroCuenta() != null ? empresa.getNumeroCuenta() : "");
            empresaData.put("cbu", empresa.getCbu() != null ? empresa.getCbu() : "");
            empresaData.put("alias", empresa.getAlias() != null ? empresa.getAlias() : "");
            empresaData.put("titular", empresa.getTitular() != null ? empresa.getTitular() : "");
            // Configuración del catálogo
            empresaData.put("mostrarStock", empresa.getMostrarStock() != null ? empresa.getMostrarStock() : true);
            empresaData.put("mostrarCategorias", empresa.getMostrarCategorias() != null ? empresa.getMostrarCategorias() : true);
            empresaData.put("mostrarPrecios", empresa.getMostrarPrecios() != null ? empresa.getMostrarPrecios() : true);

            
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
     * Obtener datos bancarios de una empresa
     */
    @GetMapping("/{subdominio}/datos-bancarios")
    public ResponseEntity<?> obtenerDatosBancarios(@PathVariable String subdominio) {
        try {
            System.out.println("Buscando datos bancarios para empresa con subdominio: " + subdominio);
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresaOpt.isEmpty()) {
                System.out.println("No se encontró empresa con subdominio: " + subdominio);
                return ResponseEntity.status(404).body(Map.of(
                    "error", "No se encontró empresa con el subdominio: " + subdominio,
                    "mensaje", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Verificar si la transferencia bancaria está habilitada
            if (empresa.getTransferenciaBancariaHabilitada() == null || !empresa.getTransferenciaBancariaHabilitada()) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "La transferencia bancaria no está habilitada para esta empresa",
                    "mensaje", "Método de pago no disponible"
                ));
            }
            
            // Crear respuesta con datos bancarios
            Map<String, Object> datosBancarios = new java.util.HashMap<>();
            datosBancarios.put("banco", empresa.getBanco() != null ? empresa.getBanco() : "");
            datosBancarios.put("tipoCuenta", empresa.getTipoCuenta() != null ? empresa.getTipoCuenta() : "");
            datosBancarios.put("numeroCuenta", empresa.getNumeroCuenta() != null ? empresa.getNumeroCuenta() : "");
            datosBancarios.put("cbu", empresa.getCbu() != null ? empresa.getCbu() : "");
            datosBancarios.put("alias", empresa.getAlias() != null ? empresa.getAlias() : "");
            datosBancarios.put("titular", empresa.getTitular() != null ? empresa.getTitular() : "");
            datosBancarios.put("empresaNombre", empresa.getNombre());
            
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("mensaje", "Datos bancarios obtenidos correctamente");
            response.put("data", datosBancarios);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error al obtener datos bancarios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error interno del servidor",
                "mensaje", "No se pudieron obtener los datos bancarios"
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
     * DEBUG PÚBLICO: Obtener información específica del stock general
     */
    @GetMapping("/debug/stock-general/{empresaId}")
    public ResponseEntity<?> debugStockGeneralPublico(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 DEBUG STOCK GENERAL PÚBLICO - Endpoint llamado para empresa: " + empresaId);
            
            // Verificar que la empresa existe
            if (!empresaRepository.existsById(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            
            Map<String, Object> debugInfo = new HashMap<>();
            
            // Obtener stock por sector con detalles
            List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
            // System.out.println("🔍 DEBUG STOCK GENERAL PÚBLICO - StockPorSectores encontrados: " + stockPorSectores.size());
            
            List<Map<String, Object>> stockDetallado = new ArrayList<>();
            for (StockPorSector stock : stockPorSectores) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", stock.getId());
                item.put("productoId", stock.getProducto().getId());
                item.put("productoNombre", stock.getProducto().getNombre());
                item.put("sectorId", stock.getSector().getId());
                item.put("sectorNombre", stock.getSector().getNombre());
                item.put("cantidad", stock.getCantidad());
                item.put("cantidadNull", stock.getCantidad() == null);
                item.put("cantidadCero", stock.getCantidad() != null && stock.getCantidad() == 0);
                item.put("cantidadMayorCero", stock.getCantidad() != null && stock.getCantidad() > 0);
                stockDetallado.add(item);
            }
            
            debugInfo.put("totalStockPorSector", stockPorSectores.size());
            debugInfo.put("stockDetallado", stockDetallado);
            
            // Contar por tipo
            long stockConCantidadNull = stockPorSectores.stream().filter(s -> s.getCantidad() == null).count();
            long stockConCantidadCero = stockPorSectores.stream().filter(s -> s.getCantidad() != null && s.getCantidad() == 0).count();
            long stockConCantidadMayorCero = stockPorSectores.stream().filter(s -> s.getCantidad() != null && s.getCantidad() > 0).count();
            
            debugInfo.put("stockConCantidadNull", stockConCantidadNull);
            debugInfo.put("stockConCantidadCero", stockConCantidadCero);
            debugInfo.put("stockConCantidadMayorCero", stockConCantidadMayorCero);
            
            // Probar el método obtenerStockGeneral
            List<Map<String, Object>> stockGeneral = sectorService.obtenerStockGeneral(empresaId);
            debugInfo.put("stockGeneralResultado", stockGeneral.size());
            debugInfo.put("stockGeneralItems", stockGeneral);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Información de debug del stock general obtenida (PÚBLICO)",
                "data", debugInfo
            ));
        } catch (Exception e) {
            System.err.println("🔍 DEBUG STOCK GENERAL PÚBLICO - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener información de debug del stock general: " + e.getMessage()
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
            
            // Enviar notificación por email a la empresa
            try {
                emailService.enviarNotificacionPedidoCancelado(
                    empresa.get().getEmail(),
                    empresa.get().getNombre(),
                    pedidoCancelado.getNumeroPedido(),
                    pedidoCancelado.getClienteNombre(),
                    pedidoCancelado.getClienteEmail(),
                    pedidoCancelado.getTotal()
                );
            } catch (Exception e) {
                System.err.println("Error enviando notificación de pedido cancelado: " + e.getMessage());
                // No lanzar excepción para no fallar la cancelación del pedido
            }
            
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
            String metodoPago = (String) pedidoData.get("metodoPago");
            Number totalNumber = (Number) pedidoData.get("total");
            BigDecimal total = BigDecimal.valueOf(totalNumber.doubleValue());
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> detallesData = (List<Map<String, Object>>) pedidoData.get("detalles");
            
            // Validar método de pago
            com.minegocio.backend.entidades.Pedido.EstadoPedido estadoInicial = com.minegocio.backend.entidades.Pedido.EstadoPedido.PENDIENTE;
            if ("TRANSFERENCIA".equals(metodoPago)) {
                // Verificar si la transferencia bancaria está habilitada
                if (empresa.get().getTransferenciaBancariaHabilitada() == null || !empresa.get().getTransferenciaBancariaHabilitada()) {
                    var error = java.util.Map.of(
                        "error", "La transferencia bancaria no está habilitada para esta empresa"
                    );
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
                }
                estadoInicial = com.minegocio.backend.entidades.Pedido.EstadoPedido.PENDIENTE_PAGO;
            }
            
            // Crear DTO del pedido
            com.minegocio.backend.dto.PedidoDTO pedidoDTO = new com.minegocio.backend.dto.PedidoDTO();
            pedidoDTO.setClienteNombre(clienteNombre);
            pedidoDTO.setClienteEmail(clienteEmail);
            pedidoDTO.setDireccionEntrega(direccionEnvio);
            pedidoDTO.setTotal(total);
            pedidoDTO.setEmpresaId(empresaId);
            pedidoDTO.setEstado(estadoInicial);
            pedidoDTO.setMetodoPago(metodoPago);
            
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
            
            // Enviar notificación por email a la empresa
            try {
                emailService.enviarNotificacionNuevoPedido(
                    empresa.get().getEmail(),
                    empresa.get().getNombre(),
                    pedidoCreado.getNumeroPedido(),
                    clienteNombre,
                    clienteEmail,
                    total,
                    direccionEnvio
                );
            } catch (Exception e) {
                System.err.println("Error enviando notificación de nuevo pedido: " + e.getMessage());
                // No lanzar excepción para no fallar la creación del pedido
            }
            
            // Enviar confirmación de compra al cliente
            try {
                emailService.enviarConfirmacionCompraCliente(
                    clienteEmail,
                    clienteNombre,
                    empresa.get().getNombre(),
                    pedidoCreado.getNumeroPedido(),
                    total,
                    direccionEnvio
                );
            } catch (Exception e) {
                System.err.println("Error enviando confirmación de compra al cliente: " + e.getMessage());
                // No lanzar excepción para no fallar la creación del pedido
            }
            
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

    /**
     * Endpoint de debug para verificar pedidos de un cliente
     */
    @GetMapping("/{subdominio}/debug/pedidos/cliente/{clienteId}")
    public ResponseEntity<?> debugPedidosCliente(
            @PathVariable String subdominio,
            @PathVariable Long clienteId) {
        try {
            System.out.println("=== DEBUG PEDIDOS CLIENTE ===");
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
            
            // Buscar cliente
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorId(empresaId, clienteId);
            if (clienteOpt.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Cliente no encontrado"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            ClienteDTO clienteDTO = clienteOpt.get();
            System.out.println("Cliente encontrado: " + clienteDTO.getNombre() + " " + clienteDTO.getApellidos() + " - Email: " + clienteDTO.getEmail());
            
            // Obtener la entidad Cliente para usar en el método de pedidos
            Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado en repositorio"));
            
            // Buscar todos los pedidos de la empresa
            List<com.minegocio.backend.dto.PedidoDTO> todosLosPedidos = pedidoService.obtenerPedidosPorEmpresa(empresaId);
            System.out.println("Total de pedidos en la empresa: " + todosLosPedidos.size());
            
            // Filtrar pedidos del cliente
            List<com.minegocio.backend.dto.PedidoDTO> pedidosDelCliente = todosLosPedidos.stream()
                .filter(pedido -> {
                    boolean porClienteId = clienteId.equals(pedido.getClienteId());
                    boolean porEmail = clienteDTO.getEmail().equals(pedido.getClienteEmail());
                    System.out.println("Pedido " + pedido.getId() + " - ClienteId: " + pedido.getClienteId() + 
                                     " (match: " + porClienteId + "), Email: " + pedido.getClienteEmail() + 
                                     " (match: " + porEmail + ")");
                    return porClienteId || porEmail;
                })
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("Pedidos del cliente encontrados: " + pedidosDelCliente.size());
            
            // Usar el método original para comparar
            List<com.minegocio.backend.dto.PedidoDTO> pedidosMetodoOriginal = pedidoService.obtenerPedidosPorClienteYEmpresa(clienteId, empresaId);
            System.out.println("Pedidos usando método original: " + pedidosMetodoOriginal.size());
            
            // Mostrar los 5 pedidos más recientes de la empresa para debug
            List<com.minegocio.backend.dto.PedidoDTO> pedidosRecientes = todosLosPedidos.stream()
                .sorted((p1, p2) -> p2.getFechaCreacion().compareTo(p1.getFechaCreacion()))
                .limit(5)
                .collect(java.util.stream.Collectors.toList());
            
            System.out.println("=== PEDIDOS MÁS RECIENTES DE LA EMPRESA ===");
            for (com.minegocio.backend.dto.PedidoDTO pedido : pedidosRecientes) {
                System.out.println("Pedido ID: " + pedido.getId() + 
                                 ", Cliente ID: " + pedido.getClienteId() + 
                                 ", Email: " + pedido.getClienteEmail() + 
                                 ", Estado: " + pedido.getEstado() + 
                                 ", Fecha: " + pedido.getFechaCreacion());
            }
            System.out.println("=== FIN PEDIDOS RECIENTES ===");
            
            var respuesta = java.util.Map.of(
                "cliente", java.util.Map.of(
                    "id", clienteId,
                    "nombre", clienteDTO.getNombre(),
                    "apellidos", clienteDTO.getApellidos(),
                    "email", clienteDTO.getEmail()
                ),
                "empresa", java.util.Map.of(
                    "id", empresa.get().getId(),
                    "nombre", empresa.get().getNombre(),
                    "subdominio", empresa.get().getSubdominio()
                ),
                "totalPedidosEmpresa", todosLosPedidos.size(),
                "pedidosDelCliente", pedidosDelCliente,
                "pedidosMetodoOriginal", pedidosMetodoOriginal,
                "pedidosRecientes", pedidosRecientes,
                "debug", java.util.Map.of(
                    "clienteId", clienteId,
                    "clienteEmail", clienteDTO.getEmail()
                )
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("Error en debug de pedidos del cliente: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint para buscar cuentas de cliente duplicadas por email
     */
    @GetMapping("/{subdominio}/debug/clientes/duplicados")
    public ResponseEntity<?> debugClientesDuplicados(
            @PathVariable String subdominio) {
        try {
            System.out.println("=== DEBUG CLIENTES DUPLICADOS ===");
            System.out.println("Subdominio: " + subdominio);
            
            Optional<Empresa> empresa = empresaService.obtenerPorSubdominio(subdominio);
            
            if (empresa.isEmpty()) {
                var error = java.util.Map.of(
                    "error", "Empresa no encontrada"
                );
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
            
            Long empresaId = empresa.get().getId();
            System.out.println("Empresa ID: " + empresaId);
            
            // Obtener todos los clientes de la empresa
            List<Cliente> todosLosClientes = clienteRepository.findByEmpresaAndActivoTrue(empresa.get());
            System.out.println("Total clientes en la empresa: " + todosLosClientes.size());
            
            // Agrupar por email base (sin números al final)
            Map<String, List<Cliente>> clientesPorEmailBase = new HashMap<>();
            
            for (Cliente cliente : todosLosClientes) {
                String email = cliente.getEmail();
                // Mejorar la detección de emails similares
                String emailBase = email.replaceAll("\\d+@", "@"); // Remover números antes del @
                emailBase = emailBase.replaceAll("\\d+$", ""); // Remover números al final
                
                // También considerar emails que solo difieren en números
                if (emailBase.equals("jrncarrizo@gmail.com")) {
                    emailBase = "jrncarrizo@gmail.com"; // Normalizar
                }
                
                System.out.println("Email original: " + email + " -> Email base: " + emailBase);
                
                clientesPorEmailBase.computeIfAbsent(emailBase, k -> new ArrayList<>()).add(cliente);
            }
            
            // Filtrar solo los que tienen múltiples cuentas
            Map<String, List<Map<String, Object>>> duplicados = new HashMap<>();
            
            for (Map.Entry<String, List<Cliente>> entry : clientesPorEmailBase.entrySet()) {
                if (entry.getValue().size() > 1) {
                    List<Map<String, Object>> clientesInfo = new ArrayList<>();
                    
                    for (Cliente cliente : entry.getValue()) {
                        Map<String, Object> clienteInfo = new HashMap<>();
                        clienteInfo.put("id", cliente.getId());
                        clienteInfo.put("nombre", cliente.getNombre());
                        clienteInfo.put("apellidos", cliente.getApellidos());
                        clienteInfo.put("email", cliente.getEmail());
                        clienteInfo.put("fechaCreacion", cliente.getFechaCreacion().toString());
                        clienteInfo.put("totalPedidos", pedidoRepository.contarPedidosPorCliente(cliente, empresa.get()));
                        clientesInfo.add(clienteInfo);
                    }
                    
                    duplicados.put(entry.getKey(), clientesInfo);
                }
            }
            
            var respuesta = java.util.Map.of(
                "empresa", java.util.Map.of(
                    "id", empresa.get().getId(),
                    "nombre", empresa.get().getNombre(),
                    "subdominio", empresa.get().getSubdominio()
                ),
                "totalClientes", todosLosClientes.size(),
                "clientesDuplicados", duplicados
            );
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("Error en debugClientesDuplicados: " + e.getMessage());
            e.printStackTrace();
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint temporal para cambiar el rol del usuario actual a ADMINISTRADOR
     */
    @PostMapping("/debug/cambiar-rol-admin")
    public ResponseEntity<?> cambiarRolAAdmin(Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            if (!(authentication.getPrincipal() instanceof com.minegocio.backend.seguridad.UsuarioPrincipal)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Tipo de usuario no válido"));
            }

            com.minegocio.backend.seguridad.UsuarioPrincipal principal = 
                (com.minegocio.backend.seguridad.UsuarioPrincipal) authentication.getPrincipal();
            
            com.minegocio.backend.entidades.Usuario usuario = principal.getUsuario();
            
            System.out.println("=== CAMBIANDO ROL DE USUARIO ===");
            System.out.println("Usuario ID: " + usuario.getId());
            System.out.println("Email: " + usuario.getEmail());
            System.out.println("Rol anterior: " + usuario.getRol());
            
            // Cambiar rol a ADMINISTRADOR
            usuario.setRol(com.minegocio.backend.entidades.Usuario.RolUsuario.ADMINISTRADOR);
            
            // Guardar en la base de datos
            usuarioRepository.save(usuario);
            
            System.out.println("Rol nuevo: " + usuario.getRol());
            System.out.println("================================");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Rol cambiado exitosamente a ADMINISTRADOR",
                "usuario_id", usuario.getId(),
                "email", usuario.getEmail(),
                "rol_anterior", principal.getUsuario().getRol().name(),
                "rol_nuevo", "ADMINISTRADOR"
            ));
            
        } catch (Exception e) {
            System.err.println("Error al cambiar rol: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error al cambiar rol: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público temporal para diagnosticar la restricción CHECK del campo rol
     */
    @GetMapping("/diagnostico-rol-constraint")
    public ResponseEntity<?> diagnosticarRolConstraint() {
        try {
            System.out.println("🔍 [PUBLICO] Iniciando diagnóstico de restricción CHECK del campo rol...");
            
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                
                // Verificar si existe la restricción
                String query = "SELECT constraint_name, check_clause FROM information_schema.check_constraints " +
                              "WHERE constraint_name = 'usuarios_rol_check'";
                
                ResultSet rs = statement.executeQuery(query);
                
                if (rs.next()) {
                    String constraintName = rs.getString("constraint_name");
                    String checkClause = rs.getString("check_clause");
                    
                    System.out.println("✅ [PUBLICO] Restricción encontrada: " + constraintName);
                    System.out.println("📋 [PUBLICO] Cláusula CHECK: " + checkClause);
                    
                    return ResponseEntity.ok(Map.of(
                        "estado", "EXISTE",
                        "constraint_name", constraintName,
                        "check_clause", checkClause,
                        "mensaje", "La restricción existe. Verificar si permite ASIGNADO."
                    ));
                } else {
                    System.out.println("❌ [PUBLICO] Restricción usuarios_rol_check NO encontrada");
                    
                    return ResponseEntity.ok(Map.of(
                        "estado", "NO_EXISTE",
                        "mensaje", "La restricción usuarios_rol_check no existe en la base de datos."
                    ));
                }
                
            }
            
        } catch (Exception e) {
            System.err.println("❌ [PUBLICO] Error en diagnóstico: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error en diagnóstico: " + e.getMessage()
            ));
        }
    }

    /**
     * Endpoint público temporal para corregir la restricción CHECK (GET)
     */
    @GetMapping("/corregir-rol-constraint")
    public ResponseEntity<?> corregirRolConstraintGet() {
        return corregirRolConstraint();
    }

    /**
     * Endpoint público temporal para corregir la restricción CHECK (POST)
     */
    @PostMapping("/corregir-rol-constraint")
    public ResponseEntity<?> corregirRolConstraint() {
        try {
            System.out.println("🔧 [PUBLICO] Iniciando corrección manual de restricción CHECK...");
            
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                
                // Eliminar restricción existente
                System.out.println("🗑️ [PUBLICO] Eliminando restricción existente...");
                try {
                    statement.execute("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check");
                    System.out.println("✅ [PUBLICO] Restricción eliminada");
                } catch (Exception e) {
                    System.out.println("⚠️ [PUBLICO] Error al eliminar (puede no existir): " + e.getMessage());
                }
                
                // Crear nueva restricción
                System.out.println("🔨 [PUBLICO] Creando nueva restricción...");
                statement.execute("ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'))");
                System.out.println("✅ [PUBLICO] Nueva restricción creada");
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Restricción CHECK corregida exitosamente",
                    "estado", "SUCCESS"
                ));
                
            }
            
        } catch (Exception e) {
            System.err.println("❌ [PUBLICO] Error corrigiendo restricción: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error corrigiendo restricción: " + e.getMessage()
            ));
        }
    }
}
