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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.io.IOException;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
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
     * Obtener información completa de la empresa del usuario autenticado
     */
    @GetMapping("/empresa")
    public ResponseEntity<?> obtenerEmpresaAdmin(HttpServletRequest request) {
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
            
            System.out.println("=== DEBUG ADMIN EMPRESA ===");
            System.out.println("Empresa encontrada: " + empresa.getNombre());
            System.out.println("Colores de la empresa:");
            System.out.println("  - Primario: " + empresa.getColorPrimario());
            System.out.println("  - Secundario: " + empresa.getColorSecundario());
            System.out.println("  - Acento: " + empresa.getColorAcento());
            System.out.println("  - Fondo: " + empresa.getColorFondo());
            System.out.println("  - Texto: " + empresa.getColorTexto());
            System.out.println("  - Título Principal: " + empresa.getColorTituloPrincipal());
            System.out.println("  - Card Filtros: " + empresa.getColorCardFiltros());
            System.out.println("  - Imagen Fondo: " + empresa.getImagenFondoUrl());
            System.out.println("=== FIN DEBUG ===");
            
            // Devolver información completa de la empresa para administradores
            EmpresaDTO empresaDTO = new EmpresaDTO();
            empresaDTO.setId(empresa.getId());
            empresaDTO.setNombre(empresa.getNombre());
            empresaDTO.setDescripcion(empresa.getDescripcion());
            empresaDTO.setSubdominio(empresa.getSubdominio());
            empresaDTO.setEmail(empresa.getEmail());
            empresaDTO.setTelefono(empresa.getTelefono());
            empresaDTO.setLogoUrl(empresa.getLogoUrl());
            empresaDTO.setColorPrimario(empresa.getColorPrimario());
            empresaDTO.setColorSecundario(empresa.getColorSecundario());
            empresaDTO.setColorAcento(empresa.getColorAcento());
            empresaDTO.setColorFondo(empresa.getColorFondo());
            empresaDTO.setColorTexto(empresa.getColorTexto());
            empresaDTO.setColorTituloPrincipal(empresa.getColorTituloPrincipal());
            empresaDTO.setColorCardFiltros(empresa.getColorCardFiltros());
            empresaDTO.setImagenFondoUrl(empresa.getImagenFondoUrl());
            empresaDTO.setMoneda(empresa.getMoneda());
            empresaDTO.setInstagramUrl(empresa.getInstagramUrl());
            empresaDTO.setFacebookUrl(empresa.getFacebookUrl());

            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa obtenida correctamente",
                "data", empresaDTO
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Actualizar información de la empresa del usuario autenticado
     */
    @PutMapping("/empresa")
    public ResponseEntity<?> actualizarEmpresaAdmin(@RequestBody EmpresaDTO empresaDTO, HttpServletRequest request) {
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
            
            // Usar el nuevo método con validaciones
            EmpresaDTO empresaActualizadaDTO = empresaService.actualizarConfiguracionEmpresa(empresa.getId(), empresaDTO);
            
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
    public ResponseEntity<?> obtenerEstadisticasVentas(HttpServletRequest request) {
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
            
            // Obtener estadísticas de ventas de pedidos
            Double totalVentasPedidos = pedidoService.obtenerTotalVentasPorEmpresa(empresa.getId());
            
            // Obtener estadísticas de ventas rápidas (todas las ventas)
            VentaRapidaEstadisticas estadisticasVentaRapida = ventaRapidaService.obtenerEstadisticasVentasRapidas(empresa.getId());
            Double totalVentasRapidas = estadisticasVentaRapida != null ? estadisticasVentaRapida.getTotalVentas().doubleValue() : 0.0;
            
            // Sumar ambos totales
            Double totalVentas = (totalVentasPedidos != null ? totalVentasPedidos : 0.0) + 
                                (totalVentasRapidas != null ? totalVentasRapidas : 0.0);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estadísticas obtenidas correctamente",
                "data", Map.of(
                    "totalVentas", totalVentas,
                    "totalVentasPedidos", totalVentasPedidos != null ? totalVentasPedidos : 0.0,
                    "totalVentasRapidas", totalVentasRapidas != null ? totalVentasRapidas : 0.0
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Subir logo de la empresa
     */
    @PostMapping("/empresa/logo")
    public ResponseEntity<?> subirLogoEmpresa(@RequestParam("logo") MultipartFile archivo, HttpServletRequest request) {
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
            
            // Validar archivo
            if (archivo.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No se seleccionó ningún archivo"));
            }
            
            if (!archivo.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo debe ser una imagen"));
            }
            
            if (archivo.getSize() > 2 * 1024 * 1024) { // 2MB
                return ResponseEntity.badRequest().body(Map.of("error", "El archivo no puede superar 2MB"));
            }
            
            // Eliminar logo anterior si existe
            if (empresa.getLogoUrl() != null && !empresa.getLogoUrl().isEmpty()) {
                cloudinaryService.eliminarImagen(empresa.getLogoUrl());
            }
            
            // Subir nueva imagen
            String urlLogo = cloudinaryService.subirImagen(archivo, empresa.getId());
            
            // Actualizar empresa con nueva URL del logo
            empresa.setLogoUrl(urlLogo);
            empresaService.guardar(empresa);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Logo subido correctamente",
                "data", Map.of(
                    "logoUrl", urlLogo
                )
            ));
            
        } catch (Exception e) {
            System.err.println("Error al subir logo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Sube la imagen de fondo de la empresa
     */
    @PostMapping("/empresa/fondo")
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
            EmpresaDTO empresaDTO = empresaService.actualizarPersonalizacion(empresa.getId(), null, null, null, null, null, null,null,null, urlImagen, null, null);
            
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
                null, null, null, null, null, null,null,null,
                urlImagenPrueba, null, null
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
