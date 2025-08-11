package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.SuperAdminService;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.HashMap;
import com.minegocio.backend.entidades.SuperAdmin;
import com.minegocio.backend.repositorios.SuperAdminRepository;

@RestController
@RequestMapping("/api/super-admin")
@CrossOrigin(origins = {"http://localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org"}, allowedHeaders = "*")
public class SuperAdminController {

    @Autowired
    private EmpresaService empresaService;
    
    @Autowired
    private SuperAdminService superAdminService;
    
    @Autowired
    private AutenticacionService autenticacionService;
    
    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SuperAdminRepository superAdminRepository;

    /**
     * Endpoint para crear automáticamente un super usuario
     * URL: http://localhost:8080/api/super-admin/crear-super-admin
     */
    @GetMapping("/crear-super-admin")
    public ResponseEntity<?> crearSuperAdmin() {
        System.out.println("🎯 Endpoint crear-super-admin llamado");
        try {
            String email = "jrncarrizo@gmail.com";
            String password = "123456";
            System.out.println("🎯 Verificando si existe usuario: " + email);
            
            // Verificar si ya existe un usuario con ese email
            Optional<Usuario> usuarioExistente = autenticacionService.obtenerPorEmail(email);
            System.out.println("🎯 Usuario existente encontrado: " + usuarioExistente.isPresent());
            if (usuarioExistente.isPresent()) {
                System.out.println("🎯 Retornando: Usuario ya existe");
                return ResponseEntity.ok(Map.of(
                    "mensaje", "El super usuario ya existe",
                    "email", email,
                    "password", password,
                    "rol", "SUPER_ADMIN"
                ));
            }
            
            // Crear nuevo super usuario
            Usuario superAdmin = new Usuario();
            superAdmin.setNombre("Super");
            superAdmin.setApellidos("Administrador");
            superAdmin.setEmail(email);
            superAdmin.setPassword(passwordEncoder.encode(password));
            superAdmin.setRol(Usuario.RolUsuario.SUPER_ADMIN);
            superAdmin.setActivo(true);
            superAdmin.setEmailVerificado(true);
            superAdmin.setEmpresa(null); // Super admin no pertenece a una empresa específica
            
            // Guardar el super usuario
            System.out.println("🎯 Guardando super usuario...");
            Usuario usuarioGuardado = usuarioRepository.save(superAdmin);
            System.out.println("🎯 Super usuario guardado con ID: " + usuarioGuardado.getId());
            
            System.out.println("🎯 Retornando: Usuario creado exitosamente");
            return ResponseEntity.ok(Map.of(
                "mensaje", "Super usuario creado exitosamente",
                "email", email,
                "password", password,
                "rol", "SUPER_ADMIN",
                "id", usuarioGuardado.getId()
            ));
            
        } catch (Exception e) {
            System.err.println("Error al crear super admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Endpoint de debug para verificar el usuario actual
     */
    @GetMapping("/debug/usuario-actual")
    public ResponseEntity<?> debugUsuarioActual(HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "No se encontró token de autenticación"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            if (email == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }

            Usuario usuario = usuarioRepository.findByEmail(email)
                    .orElse(null);

            if (usuario == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("id", usuario.getId());
            respuesta.put("email", usuario.getEmail());
            respuesta.put("nombre", usuario.getNombre());
            respuesta.put("apellidos", usuario.getApellidos());
            respuesta.put("rol", usuario.getRol());
            respuesta.put("empresaId", usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null);
            respuesta.put("empresaNombre", usuario.getEmpresa() != null ? usuario.getEmpresa().getNombre() : null);
            respuesta.put("esSuperAdmin", "SUPER_ADMIN".equals(usuario.getRol()));
            respuesta.put("tokenValido", true);

            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para crear un super admin de prueba
     */
    @PostMapping("/crear-super-admin-prueba")
    public ResponseEntity<?> crearSuperAdminPrueba() {
        try {
            String email = "superadmin@minegocio.com";
            
            // Verificar si ya existe
            if (usuarioRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Super Admin ya existe",
                    "email", email,
                    "password", "admin123",
                    "rol", "SUPER_ADMIN"
                ));
            }

            // Crear nuevo super admin
            Usuario superAdmin = new Usuario();
            superAdmin.setEmail(email);
            superAdmin.setPassword(passwordEncoder.encode("admin123"));
            superAdmin.setNombre("Super");
            superAdmin.setApellidos("Administrador");
            superAdmin.setRol(Usuario.RolUsuario.SUPER_ADMIN);
            superAdmin.setActivo(true);
            superAdmin.setEmailVerificado(true);

            usuarioRepository.save(superAdmin);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Super usuario creado exitosamente",
                "email", email,
                "password", "admin123",
                "rol", "SUPER_ADMIN"
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error creando super admin: " + e.getMessage()));
        }
    }

    /**
     * Dashboard del super admin
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> obtenerDashboard(HttpServletRequest request) {
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
            
            // Verificar que sea super admin
            if (!usuario.get().getRol().name().equals("SUPER_ADMIN")) {
                return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado. Se requiere rol SUPER_ADMIN"));
            }
            
            // Obtener estadísticas generales
            List<Empresa> todasLasEmpresas = empresaService.obtenerTodasLasEmpresas();
            long empresasActivas = todasLasEmpresas.stream().filter(Empresa::getActiva).count();
            long empresasInactivas = todasLasEmpresas.stream().filter(e -> !e.getActiva()).count();
            
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("totalEmpresas", todasLasEmpresas.size());
            dashboard.put("totalUsuarios", 0);
            dashboard.put("totalClientes", 0);
            dashboard.put("totalProductos", 0);
            dashboard.put("totalPedidos", 0);
            dashboard.put("totalVentasRapidas", 0);
            dashboard.put("empresasActivas", empresasActivas);
            dashboard.put("empresasEnPrueba", 0);
            dashboard.put("empresasSuspendidas", 0);
            dashboard.put("empresasCanceladas", 0);
            dashboard.put("empresasPorExpirar", 0);
            dashboard.put("ingresosMensuales", 0.0);
            dashboard.put("ingresosAnuales", 0.0);
            dashboard.put("ingresosTotales", 0.0);
            dashboard.put("promedioIngresosPorEmpresa", 0.0);
            dashboard.put("tasaConversionPrueba", 0.0);
            dashboard.put("nuevasEmpresasEsteMes", 0);
            dashboard.put("nuevasEmpresasEsteAno", 0);
            dashboard.put("empresasCanceladasEsteMes", 0);
            dashboard.put("tasaRetencion", 0.0);
            dashboard.put("empresasActivasHoy", empresasActivas);
            dashboard.put("empresasInactivasMasDe30Dias", empresasInactivas);
            dashboard.put("empresasNuevasEstaSemana", 0);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Dashboard del Super Admin",
                "data", dashboard
            ));
            
        } catch (Exception e) {
            System.err.println("Error al obtener dashboard super admin: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Obtener todas las empresas (para el super admin)
     */
    @GetMapping("/empresas")
    public ResponseEntity<?> obtenerTodasLasEmpresas(HttpServletRequest request) {
        try {
            System.out.println("🔍 === INICIO OBTENER EMPRESAS SUPER ADMIN ===");
            
            String token = request.getHeader("Authorization");
            System.out.println("🔍 Token recibido: " + (token != null ? "SÍ" : "NO"));
            
            if (token == null || !token.startsWith("Bearer ")) {
                System.out.println("❌ Token no válido o ausente");
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            System.out.println("🔍 Email extraído del token: " + email);
            
            Optional<Usuario> usuario = autenticacionService.obtenerPorEmail(email);
            System.out.println("🔍 Usuario encontrado: " + (usuario.isPresent() ? "SÍ" : "NO"));
            
            if (usuario.isEmpty()) {
                System.out.println("❌ Usuario no encontrado");
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }
            
            System.out.println("🔍 Rol del usuario: " + usuario.get().getRol().name());
            
            // Verificar que sea super admin
            if (!usuario.get().getRol().name().equals("SUPER_ADMIN")) {
                System.out.println("❌ Acceso denegado. Rol requerido: SUPER_ADMIN, Rol actual: " + usuario.get().getRol().name());
                return ResponseEntity.status(403).body(Map.of("error", "Acceso denegado. Se requiere rol SUPER_ADMIN"));
            }
            
            System.out.println("✅ Usuario autenticado como SUPER_ADMIN");
            
            // Crear Pageable para obtener todas las empresas
            Pageable pageable = PageRequest.of(0, 100);
            System.out.println("🔍 Pageable creado: page=0, size=100");
            
            // Usar SuperAdminService para obtener empresas con estadísticas completas
            System.out.println("🔍 Llamando a superAdminService.obtenerEmpresas...");
            var resultado = superAdminService.obtenerEmpresas(null, null, null, null, null, pageable);
            System.out.println("🔍 Resultado obtenido. Total empresas: " + resultado.getTotalElements());
            System.out.println("🔍 Contenido del resultado: " + resultado.getContent().size() + " empresas");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresas obtenidas correctamente",
                "data", resultado.getContent()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error al obtener empresas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        } finally {
            System.out.println("🔍 === FIN OBTENER EMPRESAS SUPER ADMIN ===");
        }
    }
} 