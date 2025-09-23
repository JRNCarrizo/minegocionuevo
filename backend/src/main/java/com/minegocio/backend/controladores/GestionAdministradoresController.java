package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.AsignarAdministradorDTO;
import com.minegocio.backend.dto.UsuarioDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controlador para gestionar múltiples administradores por empresa
 */
@RestController
@RequestMapping("/api/administradores")
@CrossOrigin(origins = "*", maxAge = 3600)
public class GestionAdministradoresController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private DataSource dataSource;

    /**
     * Obtener todos los administradores de la empresa actual
     */
    @GetMapping("/mi-empresa")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerAdministradoresMiEmpresa(HttpServletRequest request) {
        try {
            System.out.println("🔍 === OBTENIENDO ADMINISTRADORES DE MI EMPRESA ===");

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            System.out.println("🔍 Empresa: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");

            // Obtener todos los administradores de la empresa (activos e inactivos)
            List<Usuario> administradores = usuarioRepository.findAllAdministradoresByEmpresa(empresa);
            
            System.out.println("🔍 Administradores encontrados: " + administradores.size());
            administradores.forEach(admin -> {
                System.out.println("  👤 " + admin.getNombre() + " " + admin.getApellidos() + 
                                 " (ID: " + admin.getId() + ", Activo: " + admin.getActivo() + 
                                 ", Doc: " + admin.getNumeroDocumento() + ")");
            });
            
            // Identificar al administrador principal (el primero creado)
            final Long adminPrincipalId = obtenerIdAdministradorPrincipal(empresa, administradores);

            List<UsuarioDTO> administradoresDTO = administradores.stream()
                .map(admin -> {
                    UsuarioDTO dto = convertirAUsuarioDTO(admin);
                    // Marcar si es el administrador principal
                    dto.setEsPrincipal(adminPrincipalId != null && adminPrincipalId.equals(admin.getId()));
                    return dto;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "mensaje", "Administradores obtenidos exitosamente",
                "administradores", administradoresDTO,
                "total", administradoresDTO.size()
            ));

        } catch (Exception e) {
            System.err.println("❌ Error obteniendo administradores: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Asignar un nuevo administrador a la empresa
     */
    @PostMapping("/asignar")
    @Transactional
    public ResponseEntity<?> asignarAdministrador(
            @Valid @RequestBody AsignarAdministradorDTO adminDTO,
            HttpServletRequest request) {
        try {
            System.out.println("🔍 === ASIGNANDO NUEVO ADMINISTRADOR ===");
            System.out.println("🔍 Datos: " + adminDTO.getNombre() + " " + adminDTO.getApellidos());
            System.out.println("🔍 Documento: " + adminDTO.getNumeroDocumento());

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Verificar que no existe otro administrador con el mismo documento en la empresa
            Optional<Usuario> usuarioExistente = usuarioRepository.findByEmpresaAndNumeroDocumento(empresa, adminDTO.getNumeroDocumento());
            if (usuarioExistente.isPresent()) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "Ya existe un administrador con ese número de documento en la empresa"
                ));
            }

            // Crear nuevo usuario administrador
            Usuario nuevoAdmin = new Usuario();
            nuevoAdmin.setNombre(adminDTO.getNombre());
            nuevoAdmin.setApellidos(adminDTO.getApellidos());
            nuevoAdmin.setNumeroDocumento(adminDTO.getNumeroDocumento());
            nuevoAdmin.setTelefono(adminDTO.getTelefono());
            
            // Email será el email de la empresa + sufijo con documento (para uso interno)
            String emailAdmin = empresa.getEmail().toLowerCase().replace("@", "+" + adminDTO.getNumeroDocumento() + "@");
            nuevoAdmin.setEmail(emailAdmin);
            
            // Contraseña será el número de documento
            nuevoAdmin.setPassword(passwordEncoder.encode(adminDTO.getNumeroDocumento()));
            
            nuevoAdmin.setEmpresa(empresa);
            nuevoAdmin.setRol(Usuario.RolUsuario.ASIGNADO);
            nuevoAdmin.setActivo(true);
            nuevoAdmin.setEmailVerificado(true); // Los administradores asignados están pre-verificados

            Usuario adminGuardado = usuarioRepository.save(nuevoAdmin);

            System.out.println("✅ Administrador asignado exitosamente con ID: " + adminGuardado.getId());
            System.out.println("✅ Email generado: " + emailAdmin);

            UsuarioDTO adminDTO_response = convertirAUsuarioDTO(adminGuardado);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Administrador asignado exitosamente",
                "administrador", adminDTO_response,
                "credenciales", Map.of(
                    "email", empresa.getEmail(), // Mostrar solo el email de la empresa
                    "password", adminDTO.getNumeroDocumento(),
                    "instrucciones", "Use el email de la empresa y su número de documento como contraseña"
                )
            ));

        } catch (Exception e) {
            System.err.println("❌ Error asignando administrador: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Obtener información de un administrador específico
     */
    @GetMapping("/{adminId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerAdministrador(
            @PathVariable Long adminId,
            HttpServletRequest request) {
        try {
            System.out.println("🔍 === OBTENIENDO ADMINISTRADOR ===");
            System.out.println("🔍 ID Administrador: " + adminId);

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el administrador
            Optional<Usuario> adminOpt = usuarioRepository.findById(adminId);
            if (adminOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Administrador no encontrado"));
            }

            Usuario admin = adminOpt.get();

            // Verificar que el administrador pertenece a la empresa
            if (admin.getEmpresa() == null || !admin.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para acceder a este administrador"));
            }

            // Crear DTO del administrador
            UsuarioDTO adminDTO = convertirAUsuarioDTO(admin);
            
            System.out.println("✅ Administrador obtenido exitosamente: " + admin.getNombre() + " " + admin.getApellidos());

            return ResponseEntity.ok(adminDTO);

        } catch (Exception e) {
            System.err.println("❌ Error obteniendo administrador: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Desactivar un administrador
     */
    @PutMapping("/{adminId}/desactivar")
    @Transactional
    public ResponseEntity<?> desactivarAdministrador(
            @PathVariable Long adminId,
            HttpServletRequest request) {
        try {
            System.out.println("🔍 === DESACTIVANDO ADMINISTRADOR ===");
            System.out.println("🔍 ID Administrador: " + adminId);

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el administrador
            Optional<Usuario> adminOpt = usuarioRepository.findById(adminId);
            if (adminOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Administrador no encontrado"));
            }

            Usuario admin = adminOpt.get();

            // Verificar que el administrador pertenece a la empresa
            if (!admin.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para esta operación"));
            }

            // Verificar si es el administrador principal
            try {
                Optional<Usuario> adminPrincipalOpt = usuarioRepository.findAdministradorPrincipal(empresa);
                System.out.println("🔍 Admin principal encontrado: " + adminPrincipalOpt.isPresent());
                if (adminPrincipalOpt.isPresent()) {
                    System.out.println("🔍 Admin principal ID: " + adminPrincipalOpt.get().getId());
                    System.out.println("🔍 Admin a desactivar ID: " + adminId);
                    if (adminPrincipalOpt.get().getId().equals(adminId)) {
                        return ResponseEntity.status(400).body(Map.of(
                            "error", "No se puede desactivar al administrador principal de la empresa"
                        ));
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error verificando admin principal en desactivar: " + e.getMessage());
                // Continuar sin verificación si hay error
            }

            // Los administradores asignados SÍ se pueden desactivar
            // No hay restricción de "último administrador" para asignados

            // Desactivar administrador
            admin.setActivo(false);
            usuarioRepository.save(admin);

            System.out.println("✅ Administrador desactivado exitosamente");

            return ResponseEntity.ok(Map.of(
                "mensaje", "Administrador desactivado exitosamente"
            ));

        } catch (Exception e) {
            System.err.println("❌ Error desactivando administrador: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Eliminar un administrador
     */
    @DeleteMapping("/{adminId}")
    @Transactional
    public ResponseEntity<?> eliminarAdministrador(
            @PathVariable Long adminId,
            HttpServletRequest request) {
        try {
            System.out.println("🔍 === ELIMINANDO ADMINISTRADOR ===");
            System.out.println("🔍 ID Administrador: " + adminId);

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el administrador
            Optional<Usuario> adminOpt = usuarioRepository.findById(adminId);
            if (adminOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Administrador no encontrado"));
            }

            Usuario admin = adminOpt.get();

            // Verificar que el administrador pertenece a la empresa
            if (!admin.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para esta operación"));
            }

            // Verificar si es el administrador principal y validar estado
            try {
                Optional<Usuario> adminPrincipalOpt = usuarioRepository.findAdministradorPrincipal(empresa);
                if (adminPrincipalOpt.isPresent()) {
                    if (adminPrincipalOpt.get().getId().equals(adminId)) {
                        return ResponseEntity.status(400).body(Map.of(
                            "error", "No se puede eliminar al administrador principal de la empresa"
                        ));
                    }
                    // Verificar que el admin principal esté activo
                    if (!adminPrincipalOpt.get().getActivo()) {
                        return ResponseEntity.status(400).body(Map.of(
                            "error", "No se puede eliminar administradores cuando el administrador principal está desactivado"
                        ));
                    }
                } else {
                    return ResponseEntity.status(400).body(Map.of(
                        "error", "No se puede eliminar administradores: no se encontró un administrador principal"
                    ));
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error verificando admin principal en eliminar: " + e.getMessage());
                // Continuar sin verificación si hay error - permitir eliminación
            }

            // Intentar eliminación física
            usuarioRepository.delete(admin);

            System.out.println("✅ Administrador eliminado exitosamente");

            return ResponseEntity.ok(Map.of(
                "mensaje", "Administrador eliminado exitosamente"
            ));

        } catch (Exception e) {
            System.err.println("❌ Error eliminando administrador: " + e.getMessage());
            e.printStackTrace();
            
            // Verificar si es un error de integridad referencial
            String errorMessage = e.getMessage();
            if (errorMessage != null && (
                errorMessage.contains("Referential integrity constraint violation") ||
                errorMessage.contains("FKFV2533EDPICKXPHXASYRU2Q9A") ||
                errorMessage.contains("PLANILLAS_DEVOLUCIONES") ||
                errorMessage.contains("FOREIGN KEY") ||
                errorMessage.contains("23503-224") ||
                errorMessage.contains("could not execute statement")
            )) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "No se puede eliminar este administrador",
                    "mensaje", "El administrador tiene registros relacionados en el sistema (planillas, devoluciones, etc.). " +
                              "Para eliminar el administrador, primero debe desactivarlo y luego eliminar o reasignar todos sus registros relacionados. " +
                              "Alternativamente, puede usar la opción 'Desactivar' para mantener el historial."
                ));
            }
            
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Reactivar un administrador
     */
    @PutMapping("/{adminId}/reactivar")
    @Transactional
    public ResponseEntity<?> reactivarAdministrador(
            @PathVariable Long adminId,
            HttpServletRequest request) {
        try {
            System.out.println("🔍 === REACTIVANDO ADMINISTRADOR ===");
            System.out.println("🔍 ID Administrador: " + adminId);

            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el administrador
            Optional<Usuario> adminOpt = usuarioRepository.findById(adminId);
            if (adminOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Administrador no encontrado"));
            }

            Usuario admin = adminOpt.get();

            // Verificar que el administrador pertenece a la empresa
            if (!admin.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para esta operación"));
            }

            // Reactivar administrador
            admin.setActivo(true);
            usuarioRepository.save(admin);

            System.out.println("✅ Administrador reactivado exitosamente");

            return ResponseEntity.ok(Map.of(
                "mensaje", "Administrador reactivado exitosamente"
            ));

        } catch (Exception e) {
            System.err.println("❌ Error reactivando administrador: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    // Métodos auxiliares

    private Empresa obtenerEmpresaDelUsuarioAutenticado(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return null;
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            return usuarioOpt.map(Usuario::getEmpresa).orElse(null);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo empresa del usuario: " + e.getMessage());
            return null;
        }
    }

    private Long obtenerIdAdministradorPrincipal(Empresa empresa, List<Usuario> administradores) {
        try {
            Optional<Usuario> adminPrincipalOpt = usuarioRepository.findAdministradorPrincipal(empresa);
            return adminPrincipalOpt.map(Usuario::getId).orElse(null);
        } catch (Exception e) {
            System.err.println("⚠️ Error identificando admin principal: " + e.getMessage());
            // Usar el primer admin por ID como fallback
            if (!administradores.isEmpty()) {
                return administradores.get(0).getId();
            }
            return null;
        }
    }

    private UsuarioDTO convertirAUsuarioDTO(Usuario usuario) {
        return new UsuarioDTO(
            usuario.getId(),
            usuario.getEmail(), // nombreUsuario es el email
            usuario.getEmail(),
            usuario.getNombre(),
            usuario.getApellidos(), // esto va a apellido en el DTO
            usuario.getNumeroDocumento(),
            usuario.getRol().toString(),
            usuario.getActivo(),
            usuario.getEmpresa() != null ? usuario.getEmpresa().getId() : null,
            usuario.getEmpresa() != null ? usuario.getEmpresa().getNombre() : null
        );
    }

    /**
     * Endpoint de diagnóstico para verificar el estado de la restricción CHECK
     */
    @GetMapping("/diagnostico-rol-constraint")
    public ResponseEntity<?> diagnosticarRolConstraint() {
        try {
            System.out.println("🔍 Iniciando diagnóstico de restricción CHECK del campo rol...");
            
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                
                // Verificar si existe la restricción
                String query = "SELECT constraint_name, check_clause FROM information_schema.check_constraints " +
                              "WHERE table_name = 'usuarios' AND constraint_name = 'usuarios_rol_check'";
                
                ResultSet rs = statement.executeQuery(query);
                
                if (rs.next()) {
                    String constraintName = rs.getString("constraint_name");
                    String checkClause = rs.getString("check_clause");
                    
                    System.out.println("✅ Restricción encontrada: " + constraintName);
                    System.out.println("📋 Cláusula CHECK: " + checkClause);
                    
                    return ResponseEntity.ok(Map.of(
                        "estado", "EXISTE",
                        "constraint_name", constraintName,
                        "check_clause", checkClause,
                        "mensaje", "La restricción existe. Verificar si permite ASIGNADO."
                    ));
                } else {
                    System.out.println("❌ Restricción usuarios_rol_check NO encontrada");
                    
                    return ResponseEntity.ok(Map.of(
                        "estado", "NO_EXISTE",
                        "mensaje", "La restricción usuarios_rol_check no existe en la base de datos."
                    ));
                }
                
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error en diagnóstico: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error en diagnóstico: " + e.getMessage()
            ));
        }
    }

    /**
     * Endpoint para corregir manualmente la restricción CHECK
     */
    @PostMapping("/corregir-rol-constraint")
    public ResponseEntity<?> corregirRolConstraint() {
        try {
            System.out.println("🔧 Iniciando corrección manual de restricción CHECK...");
            
            try (Connection connection = dataSource.getConnection();
                 Statement statement = connection.createStatement()) {
                
                // Eliminar restricción existente
                System.out.println("🗑️ Eliminando restricción existente...");
                try {
                    statement.execute("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check");
                    System.out.println("✅ Restricción eliminada");
                } catch (Exception e) {
                    System.out.println("⚠️ Error al eliminar (puede no existir): " + e.getMessage());
                }
                
                // Crear nueva restricción
                System.out.println("🔨 Creando nueva restricción...");
                statement.execute("ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'))");
                System.out.println("✅ Nueva restricción creada");
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Restricción CHECK corregida exitosamente",
                    "estado", "SUCCESS"
                ));
                
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error corrigiendo restricción: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error corrigiendo restricción: " + e.getMessage()
            ));
        }
    }
}
