package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.JwtRespuestaDTO;
import com.minegocio.backend.dto.LoginDTO;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.servicios.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Controlador REST para la autenticación de usuarios
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AutenticacionController {

    @Autowired
    private AutenticacionService autenticacionService;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    /**
     * Autentica un usuario y devuelve un token JWT
     */
    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            JwtRespuestaDTO jwtRespuesta = autenticacionService.autenticarUsuario(loginDTO);
            return ResponseEntity.ok(jwtRespuesta);
        } catch (RuntimeException e) {
            if ("EMAIL_NO_VERIFICADO".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                            "error", "Debe verificar su email antes de iniciar sesión",
                            "codigo", "EMAIL_NO_VERIFICADO",
                            "mensaje", "Revise su bandeja de entrada y haga clic en el enlace de verificación"
                        ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Credenciales inválidas"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Autentica un usuario con Google y devuelve un token JWT
     */
    @PostMapping("/google/login")
    public ResponseEntity<?> autenticarUsuarioGoogle(@RequestBody Map<String, Object> googleData) {
        try {
            String email = (String) googleData.get("email");
            String name = (String) googleData.get("name");
            String picture = (String) googleData.get("picture");
            String sub = (String) googleData.get("sub");

            System.out.println("=== DEBUG GOOGLE LOGIN ===");
            System.out.println("Email: " + email);
            System.out.println("Name: " + name);
            System.out.println("Sub: " + sub);

            JwtRespuestaDTO jwtRespuesta = autenticacionService.autenticarUsuarioGoogle(email, name, picture, sub);
            return ResponseEntity.ok(jwtRespuesta);
        } catch (RuntimeException e) {
            if ("USUARIO_NUEVO_GOOGLE".equals(e.getMessage())) {
                // Usuario nuevo, devolver información para completar registro
                return ResponseEntity.status(HttpStatus.OK)
                        .body(Map.of(
                            "usuarioNuevo", true,
                            "mensaje", "Usuario nuevo detectado",
                            "datosGoogle", Map.of(
                                "email", googleData.get("email"),
                                "name", googleData.get("name"),
                                "picture", googleData.get("picture"),
                                "sub", googleData.get("sub")
                            )
                        ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", e.getMessage()));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Valida un token JWT
     */
    @PostMapping("/validar-token")
    public ResponseEntity<?> validarToken(@RequestParam String token) {
        try {
            boolean valido = autenticacionService.validarToken(token);
            
            if (valido) {
                String email = autenticacionService.obtenerEmailDelToken(token);
                return ResponseEntity.ok(Map.of(
                    "valido", true,
                    "email", email
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("valido", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valido", false));
        }
    }

    /**
     * Verifica disponibilidad de email
     */
    @GetMapping("/verificar-email")
    public ResponseEntity<?> verificarEmail(@RequestParam String email) {
        try {
            boolean disponible = autenticacionService.isEmailDisponible(email);
            return ResponseEntity.ok(Map.of("disponible", disponible));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error verificando email"));
        }
    }

    /**
     * Cierra sesión (invalidar token en el cliente)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> cerrarSesion() {
        // En implementaciones JWT stateless, el logout se maneja en el cliente
        // eliminando el token del almacenamiento local
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente"));
    }

    /**
     * Debug endpoint para verificar datos del usuario
     */
    @GetMapping("/debug-usuario")
    public ResponseEntity<?> debugUsuario(@RequestParam String email) {
        try {
            var usuario = autenticacionService.obtenerUsuarioPorEmail(email);
            if (usuario.isPresent()) {
                var u = usuario.get();
                return ResponseEntity.ok(Map.of(
                    "encontrado", true,
                    "id", u.getId(),
                    "email", u.getEmail(),
                    "activo", u.getActivo(),
                    "emailVerificado", u.getEmailVerificado(),
                    "rol", u.getRol(),
                    "empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null
                ));
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para verificar la autenticación
     */
    @PostMapping("/test-login")
    public ResponseEntity<?> testLogin(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            System.out.println("=== TEST LOGIN ===");
            System.out.println("Email: " + loginDTO.getUsuario());
            System.out.println("Contraseña: " + loginDTO.getContrasena());
            
            JwtRespuestaDTO jwtRespuesta = autenticacionService.autenticarUsuario(loginDTO);
            
            System.out.println("✅ Login exitoso");
            System.out.println("Token: " + jwtRespuesta.getToken().substring(0, 20) + "...");
            System.out.println("Usuario: " + jwtRespuesta.getNombreUsuario());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login exitoso",
                "token", jwtRespuesta.getToken(),
                "user", Map.of(
                    "email", jwtRespuesta.getEmail(),
                    "nombre", jwtRespuesta.getNombre(),
                    "apellidos", jwtRespuesta.getApellidos(),
                    "roles", jwtRespuesta.getRoles(),
                    "empresaId", jwtRespuesta.getEmpresaId(),
                    "empresaNombre", jwtRespuesta.getEmpresaNombre()
                )
            ));
        } catch (RuntimeException e) {
            System.out.println("❌ Error en login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "success", false,
                        "error", e.getMessage()
                    ));
        } catch (Exception e) {
            System.out.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "success", false,
                        "error", "Error interno del servidor"
                    ));
        }
    }

    /**
     * Registra un nuevo administrador (Etapa 1 del flujo de registro)
     */
    @PostMapping("/registrar-administrador")
    public ResponseEntity<?> registrarAdministrador(@RequestBody Map<String, Object> datos) {
        try {
            System.out.println("=== REGISTRO ADMINISTRADOR ETAPA 1 ===");
            System.out.println("Datos recibidos: " + datos);
            
            String nombre = (String) datos.get("nombre");
            String apellidos = (String) datos.get("apellidos");
            String email = (String) datos.get("email");
            String password = (String) datos.get("password");
            String telefono = (String) datos.get("telefono");
            
            // Validaciones básicas
            if (nombre == null || nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El nombre es obligatorio"));
            }
            if (apellidos == null || apellidos.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Los apellidos son obligatorios"));
            }
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email es obligatorio"));
            }
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La contraseña es obligatoria"));
            }
            
            // Verificar si el email ya existe
            if (usuarioRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Este email ya está registrado"));
            }
            
            // Verificar si ya existe una empresa temporal para este email
            Empresa empresaTemporal = empresaRepository.findByEmail(email).orElse(null);
            
            if (empresaTemporal == null) {
                // Crear una empresa temporal para evitar la restricción NOT NULL
                empresaTemporal = new Empresa();
                empresaTemporal.setNombre("Empresa Temporal - " + email);
                empresaTemporal.setSubdominio("temp-" + System.currentTimeMillis());
                empresaTemporal.setEmail(email);
                empresaTemporal.setTelefono(telefono != null ? telefono : "");
                empresaTemporal.setDireccion("");
                empresaTemporal.setCiudad("");
                empresaTemporal.setCodigoPostal("");
                empresaTemporal.setPais("");
                empresaTemporal.setDescripcion("Empresa temporal para registro en dos etapas");
                empresaTemporal.setFechaFinPrueba(LocalDateTime.now().plusDays(1));
                empresaTemporal.setActiva(false); // Marcar como inactiva
                empresaTemporal.setEstadoSuscripcion(Empresa.EstadoSuscripcion.SUSPENDIDA);
                
                empresaTemporal = empresaRepository.save(empresaTemporal);
                System.out.println("✅ Nueva empresa temporal creada: " + empresaTemporal.getId());
            } else {
                System.out.println("✅ Reutilizando empresa temporal existente: " + empresaTemporal.getId());
            }
            
            // Crear el usuario administrador con la empresa temporal
            Usuario nuevoUsuario = new Usuario();
            nuevoUsuario.setNombre(nombre);
            nuevoUsuario.setApellidos(apellidos);
            nuevoUsuario.setEmail(email);
            nuevoUsuario.setPassword(passwordEncoder.encode(password));
            nuevoUsuario.setTelefono(telefono != null ? telefono : "");
            nuevoUsuario.setRol(Usuario.RolUsuario.ADMINISTRADOR);
            nuevoUsuario.setActivo(true);
            nuevoUsuario.setEmailVerificado(false); // Requiere verificación
            nuevoUsuario.setEmpresa(empresaTemporal); // Usar empresa temporal
            
            // Generar token de verificación
            String tokenVerificacion = UUID.randomUUID().toString();
            nuevoUsuario.setTokenVerificacion(tokenVerificacion);
            nuevoUsuario.setFechaCreacion(LocalDateTime.now());
            
            nuevoUsuario = usuarioRepository.save(nuevoUsuario);
            
            System.out.println("✅ Usuario administrador creado: " + nuevoUsuario.getEmail());
            System.out.println("✅ Empresa temporal creada: " + empresaTemporal.getId());
            System.out.println("Token de verificación: " + tokenVerificacion);
            
            // Enviar email de verificación (temporalmente comentado para diagnosticar)
            /*
            try {
                emailService.enviarEmailVerificacion(nuevoUsuario.getEmail(), nuevoUsuario.getNombre(), tokenVerificacion);
                System.out.println("✅ Email de verificación enviado");
            } catch (Exception e) {
                System.out.println("❌ Error enviando email: " + e.getMessage());
                // No fallar el registro si el email no se puede enviar
            }
            */
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Administrador registrado exitosamente",
                "requiereVerificacion", true,
                "email", nuevoUsuario.getEmail(),
                "empresaTemporalId", empresaTemporal.getId()
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Error en registro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para crear un usuario administrador
     */
    @PostMapping("/crear-usuario-prueba")
    public ResponseEntity<?> crearUsuarioPrueba() {
        try {
            // Crear una empresa de prueba si no existe
            Empresa empresaPrueba = empresaRepository.findBySubdominio("test")
                .orElseGet(() -> {
                    Empresa empresa = new Empresa();
                    empresa.setNombre("Empresa de Prueba");
                    empresa.setSubdominio("test");
                    empresa.setEmail("test@test.com");
                    empresa.setTelefono("123456789");
                    empresa.setDireccion("Dirección de Prueba");
                    empresa.setCiudad("Ciudad de Prueba");
                    empresa.setCodigoPostal("12345");
                    empresa.setPais("País de Prueba");
                    empresa.setDescripcion("Empresa de prueba para testing");
                    empresa.setFechaFinPrueba(LocalDateTime.now().plusMonths(1));
                    return empresaRepository.save(empresa);
                });

            // Crear usuario administrador de prueba
            Usuario usuarioPrueba = new Usuario();
            usuarioPrueba.setNombre("Admin");
            usuarioPrueba.setApellidos("Test");
            usuarioPrueba.setEmail("admin@test.com");
            usuarioPrueba.setPassword(passwordEncoder.encode("password123"));
            usuarioPrueba.setTelefono("123456789");
            usuarioPrueba.setRol(Usuario.RolUsuario.ADMINISTRADOR);
            usuarioPrueba.setActivo(true);
            usuarioPrueba.setEmailVerificado(true);
            usuarioPrueba.setEmpresa(empresaPrueba);

            usuarioPrueba = usuarioRepository.save(usuarioPrueba);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Usuario de prueba creado exitosamente",
                "usuario", Map.of(
                    "id", usuarioPrueba.getId(),
                    "nombre", usuarioPrueba.getNombre(),
                    "apellidos", usuarioPrueba.getApellidos(),
                    "email", usuarioPrueba.getEmail(),
                    "rol", usuarioPrueba.getRol(),
                    "empresa", Map.of(
                        "id", empresaPrueba.getId(),
                        "nombre", empresaPrueba.getNombre(),
                        "subdominio", empresaPrueba.getSubdominio()
                    )
                ),
                "credenciales", Map.of(
                    "email", "admin@test.com",
                    "password", "password123"
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al crear usuario de prueba: " + e.getMessage()));
        }
    }
}
