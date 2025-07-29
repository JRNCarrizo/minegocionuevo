package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.servicios.PedidoService;
import com.minegocio.backend.servicios.VentaRapidaService;
import com.minegocio.backend.servicios.CloudinaryService;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.servicios.VentaRapidaService.VentaRapidaEstadisticas;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org"}, allowedHeaders = "*")
public class AdminController {

    @Autowired
    private EmpresaService empresaService;
    
    @Autowired
    private AutenticacionService autenticacionService;
    
    @Autowired
    private PedidoService pedidoService;
    
    @Autowired
    private VentaRapidaService ventaRapidaService;
    
    @Autowired
    private CloudinaryService cloudinaryService;
    
    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Endpoint de salud para verificar conectividad y funcionalidad básica
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck(HttpServletRequest request) {
        try {
            System.out.println("=== HEALTH CHECK ===");
            
            Map<String, Object> healthData = new HashMap<>();
            healthData.put("status", "OK");
            healthData.put("timestamp", java.time.LocalDateTime.now().toString());
            healthData.put("environment", "production");
            
            // Verificar token si está presente
            String token = request.getHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                try {
                    token = token.substring(7);
                    String email = jwtUtils.extractUsername(token);
                    healthData.put("token_valid", true);
                    healthData.put("user_email", email);
                    
                    Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
                    if (usuario.isPresent()) {
                        healthData.put("user_found", true);
                        healthData.put("user_id", usuario.get().getId());
                        
                        Empresa empresa = usuario.get().getEmpresa();
                        if (empresa != null) {
                            healthData.put("empresa_found", true);
                            healthData.put("empresa_id", empresa.getId());
                            healthData.put("empresa_nombre", empresa.getNombre());
                        } else {
                            healthData.put("empresa_found", false);
                        }
                    } else {
                        healthData.put("user_found", false);
                    }
                } catch (Exception e) {
                    healthData.put("token_valid", false);
                    healthData.put("token_error", e.getMessage());
                }
            } else {
                healthData.put("token_present", false);
            }
            
            System.out.println("✅ Health check completado");
            return ResponseEntity.ok(healthData);
            
        } catch (Exception e) {
            System.err.println("❌ Error en health check: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "status", "ERROR",
                "error", e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    /**
     * Obtener información completa de la empresa del usuario autenticado
     */
    @GetMapping("/empresa")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerEmpresaAdmin(HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG OBTENER EMPRESA ADMIN ===");
            
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("❌ Token no válido o ausente");
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            System.out.println("📧 Email extraído del token: " + email);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                System.out.println("❌ Usuario no encontrado para email: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                System.out.println("❌ Empresa no encontrada para usuario: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            System.out.println("🏢 Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            System.out.println("Colores de la empresa:");
            System.out.println("  - Primario: " + empresa.getColorPrimario());
            System.out.println("  - Secundario: " + empresa.getColorSecundario());
            System.out.println("  - Acento: " + empresa.getColorAcento());
            System.out.println("  - Fondo: " + empresa.getColorFondo());
            System.out.println("  - Texto: " + empresa.getColorTexto());
            System.out.println("  - Título Principal: " + empresa.getColorTituloPrincipal());
            System.out.println("  - Card Filtros: " + empresa.getColorCardFiltros());
            System.out.println("  - Logo URL: " + empresa.getLogoUrl());
            System.out.println("  - Imagen Fondo URL: " + empresa.getImagenFondoUrl());
            System.out.println("  - Texto Bienvenida: " + empresa.getTextoBienvenida());
            System.out.println("  - Descripción: " + empresa.getDescripcion());
            
            // Convertir a DTO
            EmpresaDTO empresaDTO = new EmpresaDTO(empresa);
            System.out.println("✅ EmpresaDTO creado exitosamente");
            System.out.println("=== FIN DEBUG OBTENER EMPRESA ADMIN ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa obtenida correctamente",
                "data", empresaDTO
            ));
            
        } catch (Exception e) {
            System.err.println("=== ERROR CRÍTICO EN OBTENER EMPRESA ADMIN ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error interno del servidor: " + e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    /**
     * Actualizar información de la empresa del usuario autenticado
     */
    @PutMapping("/empresa")
    @Transactional
    public ResponseEntity<?> actualizarEmpresaAdmin(@RequestBody EmpresaDTO empresaDTO, HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG ADMIN CONTROLLER ===");
            System.out.println("EmpresaDTO recibido: " + empresaDTO);
            System.out.println("Texto de bienvenida recibido: " + empresaDTO.getTextoBienvenida());
            System.out.println("Descripción recibida: " + empresaDTO.getDescripcion());
            System.out.println("Nombre recibido: " + empresaDTO.getNombre());
            
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            System.out.println("Empresa ID: " + empresa.getId());
            System.out.println("=== FIN DEBUG ADMIN CONTROLLER ===");
            
            System.out.println("🔍 Llamando a actualizarConfiguracionEmpresa...");
            // Usar el nuevo método con validaciones
            EmpresaDTO empresaActualizadaDTO = empresaService.actualizarConfiguracionEmpresa(empresa.getId(), empresaDTO);
            System.out.println("✅ actualizarConfiguracionEmpresa completado");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa actualizada correctamente",
                "data", empresaActualizadaDTO
            ));
            
        } catch (RuntimeException e) {
            // Errores de validación (subdominio en uso, email duplicado, etc.)
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error al actualizar empresa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * Obtener estadísticas de ventas de la empresa
     */
    @GetMapping("/estadisticas-ventas")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerEstadisticasVentas(HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG ESTADISTICAS VENTAS ===");
            
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("❌ Token no válido o ausente");
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            System.out.println("📧 Email extraído del token: " + email);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                System.out.println("❌ Usuario no encontrado para email: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                System.out.println("❌ Empresa no encontrada para usuario: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            System.out.println("🏢 Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            // Obtener estadísticas de ventas de pedidos
            System.out.println("📊 Obteniendo estadísticas de pedidos...");
            Double totalVentasPedidos = null;
            try {
                totalVentasPedidos = pedidoService.obtenerTotalVentasPorEmpresa(empresa.getId());
                System.out.println("✅ Total ventas pedidos: " + totalVentasPedidos);
            } catch (Exception e) {
                System.err.println("❌ Error al obtener estadísticas de pedidos: " + e.getMessage());
                e.printStackTrace();
                totalVentasPedidos = 0.0;
            }
            
            // Obtener estadísticas de ventas rápidas
            System.out.println("📊 Obteniendo estadísticas de ventas rápidas...");
            VentaRapidaEstadisticas estadisticasVentaRapida = null;
            Double totalVentasRapidas = 0.0;
            try {
                estadisticasVentaRapida = ventaRapidaService.obtenerEstadisticasVentasRapidas(empresa.getId());
                totalVentasRapidas = estadisticasVentaRapida != null ? estadisticasVentaRapida.getTotalVentas().doubleValue() : 0.0;
                System.out.println("✅ Total ventas rápidas: " + totalVentasRapidas);
            } catch (Exception e) {
                System.err.println("❌ Error al obtener estadísticas de ventas rápidas: " + e.getMessage());
                e.printStackTrace();
                totalVentasRapidas = 0.0;
            }
            
            // Sumar ambos totales
            Double totalVentas = (totalVentasPedidos != null ? totalVentasPedidos : 0.0) + 
                                (totalVentasRapidas != null ? totalVentasRapidas : 0.0);
            
            System.out.println("💰 Total general de ventas: " + totalVentas);
            System.out.println("=== FIN DEBUG ESTADISTICAS VENTAS ===");
            
            // Obtener estadísticas adicionales de ventas rápidas
            Integer totalTransaccionesVentaRapida = 0;
            Integer totalProductos = 0;
            Integer cantidadVentas = 0;
            
            if (estadisticasVentaRapida != null) {
                totalTransaccionesVentaRapida = estadisticasVentaRapida.getTotalTransacciones();
                totalProductos = estadisticasVentaRapida.getTotalProductos();
                cantidadVentas = estadisticasVentaRapida.getCantidadVentas();
            }
            
            // Obtener estadísticas de pedidos para transacciones
            Integer totalTransaccionesPedidos = 0;
            try {
                PedidoService.PedidoEstadisticas estadisticasPedidos = pedidoService.obtenerEstadisticasPedidos(empresa.getId());
                totalTransaccionesPedidos = estadisticasPedidos.getTotalTransacciones();
                System.out.println("✅ Total transacciones pedidos: " + totalTransaccionesPedidos);
            } catch (Exception e) {
                System.err.println("❌ Error al obtener transacciones de pedidos: " + e.getMessage());
                totalTransaccionesPedidos = 0;
            }
            
            // Sumar transacciones de ventas rápidas + pedidos
            Integer totalTransacciones = totalTransaccionesVentaRapida + totalTransaccionesPedidos;
            
            Map<String, Object> estadisticas = Map.of(
                "totalVentas", totalVentas,
                "totalTransacciones", totalTransacciones,
                "totalProductos", totalProductos,
                "cantidadVentas", cantidadVentas,
                "totalVentasPedidos", totalVentasPedidos != null ? totalVentasPedidos : 0.0,
                "totalVentasRapidas", totalVentasRapidas != null ? totalVentasRapidas : 0.0
            );
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Estadísticas obtenidas correctamente", estadisticas));
            
        } catch (Exception e) {
            System.err.println("=== ERROR CRÍTICO EN ESTADISTICAS VENTAS ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error interno del servidor: " + e.getMessage(),
                "timestamp", java.time.LocalDateTime.now().toString()
            ));
        }
    }

    /**
     * Endpoint de debug para probar multipart
     */
    @PostMapping("/debug/multipart")
    @Transactional
    public ResponseEntity<?> debugMultipart(@RequestParam(value = "archivo", required = false) MultipartFile archivo, HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG MULTIPART ===");
            System.out.println("📁 Archivo recibido: " + (archivo != null ? archivo.getOriginalFilename() : "null"));
            System.out.println("📏 Tamaño archivo: " + (archivo != null ? archivo.getSize() : "null"));
            System.out.println("📋 Tipo contenido: " + (archivo != null ? archivo.getContentType() : "null"));
            System.out.println("🔧 Content-Type header: " + request.getHeader("Content-Type"));
            System.out.println("=== FIN DEBUG MULTIPART ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Debug multipart exitoso",
                "archivoRecibido", archivo != null,
                "nombreArchivo", archivo != null ? archivo.getOriginalFilename() : "null",
                "tamañoArchivo", archivo != null ? archivo.getSize() : 0
            ));
        } catch (Exception e) {
            System.err.println("❌ Error en debug multipart: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error en debug multipart: " + e.getMessage()));
        }
    }

    /**
     * Subir logo de la empresa
     */
    @PostMapping("/empresa/logo")
    @Transactional
    public ResponseEntity<?> subirLogoEmpresa(@RequestParam("logo") MultipartFile archivo, HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG SUBIR LOGO ===");
            System.out.println("📁 Archivo recibido: " + (archivo != null ? archivo.getOriginalFilename() : "null"));
            System.out.println("📏 Tamaño archivo: " + (archivo != null ? archivo.getSize() : "null"));
            System.out.println("📋 Tipo contenido: " + (archivo != null ? archivo.getContentType() : "null"));
            
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("❌ Token no válido");
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            System.out.println("👤 Email extraído: " + email);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                System.out.println("❌ Usuario no encontrado");
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                System.out.println("❌ Empresa no encontrada");
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            System.out.println("🏢 Empresa ID: " + empresa.getId());
            System.out.println("🏢 Empresa nombre: " + empresa.getNombre());
            
            // Validar archivo
            if (archivo.isEmpty()) {
                System.out.println("❌ Archivo vacío");
                return ResponseEntity.badRequest().body(Map.of("error", "No se seleccionó ningún archivo"));
            }
            
            if (!archivo.getContentType().startsWith("image/")) {
                System.out.println("❌ Tipo de archivo no válido: " + archivo.getContentType());
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo debe ser una imagen"));
            }
            
            if (archivo.getSize() > 2 * 1024 * 1024) { // 2MB
                System.out.println("❌ Archivo muy grande: " + archivo.getSize());
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo no puede superar 2MB"));
            }
            
            System.out.println("✅ Validaciones pasadas, procediendo a subir...");
            
            // Eliminar logo anterior si existe
            if (empresa.getLogoUrl() != null && !empresa.getLogoUrl().isEmpty()) {
                System.out.println("🗑️ Eliminando logo anterior: " + empresa.getLogoUrl());
                cloudinaryService.eliminarImagen(empresa.getLogoUrl());
            }
            
            // Subir nueva imagen
            System.out.println("☁️ Subiendo imagen a Cloudinary...");
            String urlLogo = cloudinaryService.subirImagen(archivo, empresa.getId());
            System.out.println("✅ URL del logo: " + urlLogo);
            
            // Actualizar empresa con nueva URL del logo
            empresa.setLogoUrl(urlLogo);
            empresaService.guardar(empresa);
            System.out.println("💾 Empresa actualizada en base de datos");
            
            System.out.println("=== FIN DEBUG SUBIR LOGO ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Logo subido correctamente",
                "data", Map.of(
                    "logoUrl", urlLogo
                )
            ));
            
        } catch (Exception e) {
            System.err.println("=== ERROR CRÍTICO SUBIR LOGO ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Sube la imagen de fondo de la empresa
     */
    @PostMapping("/empresa/fondo")
    @Transactional
    public ResponseEntity<?> subirFondoEmpresa(@RequestParam("fondo") MultipartFile archivo, HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            // Validar que el archivo no esté vacío
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No se ha seleccionado ningún archivo"));
            }
            // Validar tipo de archivo
            String tipoContenido = archivo.getContentType();
            if (tipoContenido == null || !tipoContenido.startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo debe ser una imagen"));
            }
            // Validar tamaño del archivo (máximo 5MB)
            if (archivo.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "La imagen no puede ser mayor a 5MB"));
            }
            
            // Eliminar imagen de fondo anterior si existe
            if (empresa.getImagenFondoUrl() != null && !empresa.getImagenFondoUrl().isEmpty()) {
                cloudinaryService.eliminarImagen(empresa.getImagenFondoUrl());
            }
            
            // Subir imagen a Cloudinary con tipo 'fondo'
            String urlImagen = cloudinaryService.subirImagen(archivo, empresa.getId(), "fondo");
            
            // Guardar la URL en la empresa
            EmpresaDTO empresaDTO = empresaService.actualizarPersonalizacion(
                empresa.getId(), 
                empresa.getLogoUrl(), // logoUrl
                empresa.getDescripcion(), // descripcion
                empresa.getTextoBienvenida(), // textoBienvenida
                empresa.getColorPrimario(), // colorPrimario
                empresa.getColorSecundario(), // colorSecundario
                empresa.getColorAcento(), // colorAcento
                empresa.getColorFondo(), // colorFondo
                empresa.getColorTexto(), // colorTexto
                empresa.getColorTituloPrincipal(), // colorTituloPrincipal
                empresa.getColorCardFiltros(), // colorCardFiltros
                urlImagen, // imagenFondoUrl
                empresa.getInstagramUrl(), // instagramUrl
                empresa.getFacebookUrl() // facebookUrl
            );
            
            System.out.println("=== DEBUG SUBIDA FONDO ===");
            System.out.println("Empresa ID: " + empresa.getId());
            System.out.println("URL de imagen subida: " + urlImagen);
            System.out.println("Empresa actualizada: " + empresaDTO.getImagenFondoUrl());
            System.out.println("=== FIN DEBUG ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Imagen de fondo subida exitosamente",
                "data", Map.of("fondoUrl", urlImagen),
                "empresa", empresaDTO
            ));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error al subir la imagen: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error inesperado: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para actualizar imagen de fondo
     */
    @PostMapping("/test-actualizar-fondo")
    public ResponseEntity<?> testActualizarFondo(HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            // URL de prueba para la imagen de fondo
            String urlImagenPrueba = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop";
            
            System.out.println("=== TEST ACTUALIZAR FONDO ===");
            System.out.println("Empresa ID: " + empresa.getId());
            System.out.println("URL de prueba: " + urlImagenPrueba);
            System.out.println("Imagen de fondo actual: " + empresa.getImagenFondoUrl());
            
            // Actualizar solo la imagen de fondo
            EmpresaDTO empresaDTO = empresaService.actualizarPersonalizacion(
                empresa.getId(), 
                empresa.getLogoUrl(), // logoUrl
                empresa.getDescripcion(), // descripcion
                empresa.getTextoBienvenida(), // textoBienvenida
                empresa.getColorPrimario(), // colorPrimario
                empresa.getColorSecundario(), // colorSecundario
                empresa.getColorAcento(), // colorAcento
                empresa.getColorFondo(), // colorFondo
                empresa.getColorTexto(), // colorTexto
                empresa.getColorTituloPrincipal(), // colorTituloPrincipal
                empresa.getColorCardFiltros(), // colorCardFiltros
                urlImagenPrueba, // imagenFondoUrl
                empresa.getInstagramUrl(), // instagramUrl
                empresa.getFacebookUrl() // facebookUrl
            );
            
            System.out.println("Empresa actualizada: " + empresaDTO.getImagenFondoUrl());
            
            // Verificar que se guardó correctamente
            EmpresaDTO empresaVerificada = empresaService.obtenerPorId(empresa.getId()).orElse(null);
            System.out.println("Empresa verificada desde BD: " + (empresaVerificada != null ? empresaVerificada.getImagenFondoUrl() : "null"));
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Imagen de fondo de prueba actualizada",
                "empresa", empresaDTO,
                "verificacion", empresaVerificada != null ? empresaVerificada.getImagenFondoUrl() : "null"
            ));
            
        } catch (Exception e) {
            System.err.println("Error en test: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error en test: " + e.getMessage()));
        }
    }

    /**
     * Verificar disponibilidad de subdominio
     */
    @GetMapping("/verificar-subdominio/{subdominio}")
    public ResponseEntity<?> verificarSubdominio(@PathVariable String subdominio, HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            // Si el subdominio es el mismo que tiene la empresa, está disponible
            if (subdominio.toLowerCase().equals(empresa.getSubdominio())) {
                return ResponseEntity.ok(Map.of(
                    "disponible", true,
                    "mensaje", "Este es tu subdominio actual"
                ));
            }
            
            // Verificar disponibilidad
            boolean disponible = empresaService.verificarDisponibilidadSubdominio(subdominio);
            
            return ResponseEntity.ok(Map.of(
                "disponible", disponible,
                "mensaje", disponible ? "Subdominio disponible" : "Subdominio no disponible"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Endpoint de debug para verificar el estado de la empresa
     */
    @GetMapping("/debug-empresa")
    public ResponseEntity<?> debugEmpresa(HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            if (usuario.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            Empresa empresa = usuario.get().getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            return ResponseEntity.ok(Map.of(
                "empresa", Map.of(
                    "id", empresa.getId(),
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio(),
                    "logoUrl", empresa.getLogoUrl(),
                    "imagenFondoUrl", empresa.getImagenFondoUrl(),
                    "colorPrimario", empresa.getColorPrimario(),
                    "colorSecundario", empresa.getColorSecundario(),
                    "colorAcento", empresa.getColorAcento(),
                    "colorFondo", empresa.getColorFondo(),
                    "colorTexto", empresa.getColorTexto()
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }
}
