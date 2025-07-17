package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.minegocio.backend.entidades.HistorialCargaProductos;
import com.minegocio.backend.repositorios.HistorialCargaProductosRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private HistorialCargaProductosRepository historialCargaProductosRepository;

    /**
     * Lista todos los usuarios en la base de datos
     */
    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios() {
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            
            List<Map<String, Object>> usuariosInfo = usuarios.stream()
                .map(u -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", u.getId());
                    info.put("nombre", u.getNombre());
                    info.put("apellidos", u.getApellidos());
                    info.put("email", u.getEmail());
                    info.put("activo", u.getActivo());
                    info.put("emailVerificado", u.getEmailVerificado());
                    info.put("rol", u.getRol());
                    info.put("empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null);
                    info.put("empresaNombre", u.getEmpresa() != null ? u.getEmpresa().getNombre() : null);
                    return info;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "total", usuarios.size(),
                "usuarios", usuariosInfo
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica un usuario específico por email
     */
    @GetMapping("/usuario/{email}")
    public ResponseEntity<?> verificarUsuario(@PathVariable String email) {
        try {
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario u = usuarioOpt.get();
                Map<String, Object> resultado = new HashMap<>();
                resultado.put("encontrado", true);
                resultado.put("id", u.getId());
                resultado.put("nombre", u.getNombre());
                resultado.put("apellidos", u.getApellidos());
                resultado.put("email", u.getEmail());
                resultado.put("activo", u.getActivo());
                resultado.put("emailVerificado", u.getEmailVerificado());
                resultado.put("rol", u.getRol());
                resultado.put("empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null);
                resultado.put("empresaNombre", u.getEmpresa() != null ? u.getEmpresa().getNombre() : null);
                resultado.put("fechaCreacion", u.getFechaCreacion());
                resultado.put("fechaActualizacion", u.getFechaActualizacion());
                
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false, "email", email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica una contraseña contra un hash
     */
    @PostMapping("/verificar-password")
    public ResponseEntity<?> verificarPassword(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String password = datos.get("password");
            
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                boolean coincide = passwordEncoder.matches(password, usuario.getPassword());
                
                return ResponseEntity.ok(Map.of(
                    "email", email,
                    "passwordCoincide", coincide,
                    "hashEnBD", usuario.getPassword().substring(0, 20) + "...",
                    "algoritmo", usuario.getPassword().startsWith("$2a$") ? "BCrypt" : "Desconocido"
                ));
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false, "email", email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Información del sistema
     */
    @GetMapping("/info")
    public ResponseEntity<?> informacionSistema() {
        try {
            long totalUsuarios = usuarioRepository.count();
            
            return ResponseEntity.ok(Map.of(
                "totalUsuarios", totalUsuarios,
                "timestamp", System.currentTimeMillis(),
                "passwordEncoder", passwordEncoder.getClass().getSimpleName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Genera un hash BCrypt para una contraseña
     */
    @PostMapping("/generar-hash")
    public ResponseEntity<?> generarHash(@RequestBody Map<String, String> datos) {
        try {
            String password = datos.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password requerido"));
            }
            
            String hash = passwordEncoder.encode(password);
            boolean verificacion = passwordEncoder.matches(password, hash);
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("password", password);
            resultado.put("hash", hash);
            resultado.put("verificacion", verificacion);
            resultado.put("sqlUpdate", "UPDATE usuarios SET password = '" + hash + "' WHERE email = 'admin@demo.com';");
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Genera un hash BCrypt para una contraseña
     */
    @GetMapping("/generar-hash/{password}")
    public ResponseEntity<?> generarHash(@PathVariable String password) {
        try {
            String hash = passwordEncoder.encode(password);
            return ResponseEntity.ok(Map.of(
                "password", password,
                "hash", hash,
                "algoritmo", "BCrypt"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualiza la contraseña de un usuario
     */
    @PostMapping("/actualizar-password")
    public ResponseEntity<?> actualizarPassword(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String nuevaPassword = datos.get("password");
            
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                String nuevoHash = passwordEncoder.encode(nuevaPassword);
                usuario.setPassword(nuevoHash);
                usuarioRepository.save(usuario);
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña actualizada correctamente",
                    "email", email,
                    "nuevoHash", nuevoHash.substring(0, 20) + "..."
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado: " + email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint simple para verificar que el servidor responde
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of(
            "mensaje", "Servidor funcionando correctamente",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Verifica el estado de autenticación actual
     */
    @GetMapping("/auth-status")
    public ResponseEntity<?> verificarAutenticacion() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("authenticated", auth != null && auth.isAuthenticated());
            
            if (auth != null) {
                resultado.put("name", auth.getName());
                resultado.put("authorities", auth.getAuthorities().toString());
                resultado.put("principal", auth.getPrincipal().getClass().getSimpleName());
                
                if (auth.getPrincipal() instanceof UsuarioPrincipal) {
                    UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
                    resultado.put("userId", principal.getId());
                    resultado.put("empresaId", principal.getEmpresaId());
                    resultado.put("nombreCompleto", principal.getNombreCompleto());
                    resultado.put("rol", principal.getUsuario().getRol());
                    resultado.put("email", principal.getUsername());
                }
            }
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Reset de emergencia para la contraseña del usuario admin
     */
    @PostMapping("/reset-admin")
    public ResponseEntity<?> resetearAdmin() {
        try {
            // Buscar el usuario admin
            Optional<Usuario> adminOpt = usuarioRepository.findByEmail("admin@demo.com");
            
            if (adminOpt.isPresent()) {
                Usuario admin = adminOpt.get();
                
                // Generar nuevo hash para admin123
                String nuevaPassword = "admin123";
                String nuevoHash = passwordEncoder.encode(nuevaPassword);
                
                // Actualizar la contraseña
                admin.setPassword(nuevoHash);
                usuarioRepository.save(admin);
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña del admin reseteada exitosamente",
                    "email", "admin@demo.com",
                    "password", "admin123",
                    "nota", "Usar estas credenciales para iniciar sesión"
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario admin no encontrado"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica si una contraseña coincide con el hash del usuario
     */
    @PostMapping("/verificar-password-usuario")
    public ResponseEntity<?> verificarPasswordUsuario(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String password = datos.get("password");
            
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Se requieren email y password"));
            }
            
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                String hashAlmacenado = usuario.getPassword();
                
                // Verificar la contraseña
                boolean coincide = passwordEncoder.matches(password, hashAlmacenado);
                
                return ResponseEntity.ok(Map.of(
                    "email", email,
                    "password", password,
                    "hashAlmacenado", hashAlmacenado.substring(0, 20) + "...",
                    "coincide", coincide,
                    "mensaje", coincide ? "La contraseña es correcta" : "La contraseña no coincide"
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado: " + email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica y corrige la contraseña del usuario admin si es necesario
     */
    @PostMapping("/fix-admin-password")
    public ResponseEntity<?> corregirPasswordAdmin() {
        try {
            Optional<Usuario> adminOpt = usuarioRepository.findByEmail("admin@demo.com");
            
            if (adminOpt.isPresent()) {
                Usuario admin = adminOpt.get();
                String passwordTextoPlano = "admin123";
                
                // Verificar si la contraseña actual funciona
                boolean passwordActualFunciona = passwordEncoder.matches(passwordTextoPlano, admin.getPassword());
                
                Map<String, Object> resultado = new HashMap<>();
                resultado.put("email", admin.getEmail());
                resultado.put("passwordActualFunciona", passwordActualFunciona);
                resultado.put("hashActual", admin.getPassword().substring(0, 20) + "...");
                
                if (!passwordActualFunciona) {
                    // Generar nuevo hash
                    String nuevoHash = passwordEncoder.encode(passwordTextoPlano);
                    admin.setPassword(nuevoHash);
                    usuarioRepository.save(admin);
                    
                    resultado.put("accion", "Contraseña corregida");
                    resultado.put("nuevoHash", nuevoHash.substring(0, 20) + "...");
                    
                    // Verificar que el nuevo hash funciona
                    boolean nuevoHashFunciona = passwordEncoder.matches(passwordTextoPlano, nuevoHash);
                    resultado.put("nuevoHashFunciona", nuevoHashFunciona);
                } else {
                    resultado.put("accion", "Contraseña ya funciona correctamente");
                }
                
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario admin no encontrado"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simula la respuesta del endpoint de historial de carga de productos
     */
    @GetMapping("/simular-respuesta-historial/{empresaId}")
    public ResponseEntity<?> simularRespuestaHistorial(@PathVariable Long empresaId) {
        try {
            // Usar el repositorio JPA para obtener datos reales
            Page<HistorialCargaProductos> historialesPage = historialCargaProductosRepository.findByEmpresaIdOrderByFechaOperacionDesc(empresaId, PageRequest.of(0, 5));
            List<HistorialCargaProductos> historiales = historialesPage.getContent();
            
            // Crear la estructura que espera el frontend
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("contenido", historiales.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", h.getId());
                item.put("productoId", h.getProducto() != null ? h.getProducto().getId() : null);
                item.put("productoNombre", h.getProducto() != null ? h.getProducto().getNombre() : null);
                item.put("tipoOperacion", h.getTipoOperacion() != null ? h.getTipoOperacion().name() : null);
                item.put("tipoOperacionDescripcion", h.getTipoOperacion() != null ? h.getTipoOperacion().getDescripcion() : null);
                item.put("cantidad", h.getCantidad());
                item.put("stockAnterior", h.getStockAnterior());
                item.put("stockNuevo", h.getStockNuevo());
                item.put("precioUnitario", h.getPrecioUnitario());
                item.put("valorTotal", h.getValorTotal());
                item.put("observacion", h.getObservacion());
                item.put("metodoEntrada", h.getMetodoEntrada());
                item.put("codigoBarras", h.getCodigoBarras());
                item.put("fechaOperacion", h.getFechaOperacion());
                return item;
            }).collect(Collectors.toList()));
            
            respuesta.put("totalElementos", historialesPage.getTotalElements());
            respuesta.put("totalPaginas", historialesPage.getTotalPages());
            respuesta.put("paginaActual", historialesPage.getNumber());
            respuesta.put("tamano", historialesPage.getSize());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("=== ERROR EN SIMULACIÓN ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Simula la respuesta exacta del endpoint /historial-carga-productos/buscar
     */
    @GetMapping("/test-endpoint-historial/{empresaId}")
    public ResponseEntity<?> testEndpointHistorial(@PathVariable Long empresaId) {
        try {
            // Usar el repositorio JPA para obtener datos reales
            Page<HistorialCargaProductos> historialesPage = historialCargaProductosRepository.findByEmpresaIdOrderByFechaOperacionDesc(empresaId, PageRequest.of(0, 20));
            List<HistorialCargaProductos> historiales = historialesPage.getContent();
            
            // Crear la estructura EXACTA que espera el frontend
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("contenido", historiales.stream().map(h -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", h.getId());
                item.put("productoId", h.getProducto() != null ? h.getProducto().getId() : null);
                item.put("productoNombre", h.getProducto() != null ? h.getProducto().getNombre() : null);
                item.put("productoDescripcion", h.getProducto() != null ? h.getProducto().getDescripcion() : null);
                item.put("productoMarca", h.getProducto() != null ? h.getProducto().getMarca() : null);
                item.put("productoCategoria", h.getProducto() != null ? h.getProducto().getCategoria() : null);
                item.put("productoUnidad", h.getProducto() != null ? h.getProducto().getUnidad() : null);
                item.put("codigoBarras", h.getProducto() != null ? h.getProducto().getCodigoBarras() : null);
                item.put("codigoPersonalizado", h.getProducto() != null ? h.getProducto().getCodigoPersonalizado() : null);
                
                item.put("usuarioId", h.getUsuario() != null ? h.getUsuario().getId() : null);
                item.put("usuarioNombre", h.getUsuario() != null ? h.getUsuario().getNombre() : null);
                item.put("usuarioApellidos", h.getUsuario() != null ? h.getUsuario().getApellidos() : null);
                
                item.put("empresaId", h.getEmpresa() != null ? h.getEmpresa().getId() : null);
                item.put("empresaNombre", h.getEmpresa() != null ? h.getEmpresa().getNombre() : null);
                
                item.put("tipoOperacion", h.getTipoOperacion() != null ? h.getTipoOperacion().name() : null);
                item.put("tipoOperacionDescripcion", h.getTipoOperacion() != null ? h.getTipoOperacion().getDescripcion() : null);
                item.put("cantidad", h.getCantidad());
                item.put("stockAnterior", h.getStockAnterior());
                item.put("stockNuevo", h.getStockNuevo());
                item.put("precioUnitario", h.getPrecioUnitario());
                item.put("valorTotal", h.getValorTotal());
                item.put("observacion", h.getObservacion());
                item.put("metodoEntrada", h.getMetodoEntrada());
                item.put("fechaOperacion", h.getFechaOperacion());
                item.put("fechaCreacion", h.getFechaCreacion());
                item.put("fechaActualizacion", h.getFechaActualizacion());
                return item;
            }).collect(Collectors.toList()));
            
            resultado.put("totalElementos", historialesPage.getTotalElements());
            resultado.put("totalPaginas", historialesPage.getTotalPages());
            resultado.put("paginaActual", historialesPage.getNumber());
            resultado.put("tamano", historialesPage.getSize());
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("=== ERROR EN TEST ENDPOINT ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica los datos en la tabla historial_carga_productos usando JPA
     */
    @GetMapping("/verificar-historial-jpa/{empresaId}")
    public ResponseEntity<?> verificarHistorialJPA(@PathVariable Long empresaId) {
        try {
            Map<String, Object> resultado = new HashMap<>();
            
            // Usar el repositorio JPA
            Page<HistorialCargaProductos> historialesPage = historialCargaProductosRepository.findByEmpresaIdOrderByFechaOperacionDesc(empresaId, PageRequest.of(0, 5));
            List<HistorialCargaProductos> historiales = historialesPage.getContent();
            
            resultado.put("totalRegistros", historiales.size());
            
            List<Map<String, Object>> registros = new ArrayList<>();
            for (HistorialCargaProductos historial : historiales) {
                Map<String, Object> registro = new HashMap<>();
                registro.put("id", historial.getId());
                registro.put("producto_id", historial.getProducto() != null ? historial.getProducto().getId() : null);
                registro.put("producto_nombre", historial.getProducto() != null ? historial.getProducto().getNombre() : null);
                registro.put("tipo_operacion", historial.getTipoOperacion() != null ? historial.getTipoOperacion().name() : null);
                registro.put("cantidad", historial.getCantidad());
                registro.put("stock_anterior", historial.getStockAnterior());
                registro.put("stock_nuevo", historial.getStockNuevo());
                registro.put("precio_unitario", historial.getPrecioUnitario());
                registro.put("valor_total", historial.getValorTotal());
                registro.put("observacion", historial.getObservacion());
                registro.put("fecha_operacion", historial.getFechaOperacion());
                registros.add(registro);
            }
            
            resultado.put("registros", registros);
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("=== ERROR EN VERIFICACIÓN JPA ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica los datos en la tabla historial_carga_productos
     */
    @GetMapping("/verificar-historial-productos/{empresaId}")
    public ResponseEntity<?> verificarHistorialProductos(@PathVariable Long empresaId) {
        try {
            Map<String, Object> resultado = new HashMap<>();
            
            try (Connection connection = dataSource.getConnection()) {
                // Verificar cuántos registros hay
                String countQuery = "SELECT COUNT(*) as total FROM historial_carga_productos WHERE empresa_id = ?";
                int totalRegistros = 0;
                try (PreparedStatement countStmt = connection.prepareStatement(countQuery)) {
                    countStmt.setLong(1, empresaId);
                    try (ResultSet countRs = countStmt.executeQuery()) {
                        if (countRs.next()) {
                            totalRegistros = countRs.getInt("total");
                        }
                    }
                }
                
                resultado.put("totalRegistros", totalRegistros);
                
                if (totalRegistros > 0) {
                    // Obtener los últimos 5 registros
                    String selectQuery = """
                        SELECT 
                            hcp.id,
                            hcp.producto_id,
                            hcp.tipo_operacion,
                            hcp.cantidad,
                            hcp.stock_anterior,
                            hcp.stock_nuevo,
                            hcp.precio_unitario,
                            hcp.valor_total,
                            hcp.observacion,
                            hcp.fecha_operacion,
                            p.nombre as producto_nombre
                        FROM historial_carga_productos hcp
                        LEFT JOIN productos p ON hcp.producto_id = p.id
                        WHERE hcp.empresa_id = ?
                        ORDER BY hcp.fecha_operacion DESC
                        LIMIT 5
                        """;
                    
                    List<Map<String, Object>> registros = new ArrayList<>();
                    try (PreparedStatement selectStmt = connection.prepareStatement(selectQuery)) {
                        selectStmt.setLong(1, empresaId);
                        try (ResultSet selectRs = selectStmt.executeQuery()) {
                            while (selectRs.next()) {
                                Map<String, Object> registro = new HashMap<>();
                                registro.put("id", selectRs.getLong("id"));
                                registro.put("producto_id", selectRs.getLong("producto_id"));
                                registro.put("producto_nombre", selectRs.getString("producto_nombre"));
                                registro.put("tipo_operacion", selectRs.getString("tipo_operacion"));
                                registro.put("cantidad", selectRs.getInt("cantidad"));
                                registro.put("stock_anterior", selectRs.getInt("stock_anterior"));
                                registro.put("stock_nuevo", selectRs.getInt("stock_nuevo"));
                                registro.put("precio_unitario", selectRs.getBigDecimal("precio_unitario"));
                                registro.put("valor_total", selectRs.getBigDecimal("valor_total"));
                                registro.put("observacion", selectRs.getString("observacion"));
                                registro.put("fecha_operacion", selectRs.getTimestamp("fecha_operacion"));
                                registros.add(registro);
                            }
                        }
                    }
                    
                    resultado.put("ultimosRegistros", registros);
                }
                
            } catch (SQLException e) {
                System.err.println("=== ERROR SQL EN VERIFICACIÓN ===");
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
                resultado.put("error", "Error de base de datos: " + e.getMessage());
                return ResponseEntity.badRequest().body(resultado);
            }
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("=== ERROR GENERAL EN VERIFICACIÓN ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Crea la tabla historial_carga_productos si no existe
     */
    @PostMapping("/crear-tabla-historial")
    public ResponseEntity<?> crearTablaHistorial() {
        try {
            Map<String, Object> resultado = new HashMap<>();
            
            try (Connection connection = dataSource.getConnection()) {
                // Crear la tabla si no existe
                String createTableQuery = """
                    CREATE TABLE IF NOT EXISTS historial_carga_productos (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        producto_id BIGINT NOT NULL,
                        producto_nombre VARCHAR(255),
                        producto_descripcion TEXT,
                        producto_marca VARCHAR(100),
                        producto_categoria VARCHAR(100),
                        producto_unidad VARCHAR(50),
                        codigo_barras VARCHAR(50),
                        codigo_personalizado VARCHAR(50),
                        usuario_id BIGINT,
                        usuario_nombre VARCHAR(255),
                        usuario_apellidos VARCHAR(255),
                        empresa_id BIGINT NOT NULL,
                        empresa_nombre VARCHAR(255),
                        tipo_operacion VARCHAR(50) NOT NULL,
                        tipo_operacion_descripcion VARCHAR(100),
                        cantidad INT NOT NULL,
                        stock_anterior INT,
                        stock_nuevo INT,
                        precio_unitario DECIMAL(10,2),
                        valor_total DECIMAL(10,2),
                        observacion VARCHAR(500),
                        metodo_entrada VARCHAR(100),
                        fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
                        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
                    )
                    """;
                
                try (PreparedStatement createTableStmt = connection.prepareStatement(createTableQuery)) {
                    createTableStmt.executeUpdate();
                    resultado.put("tablaCreada", true);
                    resultado.put("mensaje", "Tabla historial_carga_productos creada exitosamente");
                }
                
                // Crear índices si no existen
                String[] indexQueries = {
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_empresa_id ON historial_carga_productos (empresa_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_producto_id ON historial_carga_productos (producto_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_usuario_id ON historial_carga_productos (usuario_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_fecha_operacion ON historial_carga_productos (fecha_operacion)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_tipo_operacion ON historial_carga_productos (tipo_operacion)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_codigo_barras ON historial_carga_productos (codigo_barras)"
                };
                
                for (String indexQuery : indexQueries) {
                    try (PreparedStatement indexStmt = connection.prepareStatement(indexQuery)) {
                        indexStmt.executeUpdate();
                    }
                }
                
                resultado.put("indicesCreados", true);
                
            } catch (SQLException e) {
                System.err.println("=== ERROR SQL EN CREACIÓN DE TABLA ===");
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
                resultado.put("error", "Error de base de datos: " + e.getMessage());
                return ResponseEntity.badRequest().body(resultado);
            }
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("=== ERROR GENERAL EN CREACIÓN DE TABLA ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Ejecuta la migración para agregar historial de carga inicial a productos existentes
     */
    @PostMapping("/migrar-historial-productos")
    public ResponseEntity<?> migrarHistorialProductos() {
        try {
            Map<String, Object> resultado = new HashMap<>();
            
            try (Connection connection = dataSource.getConnection()) {
                // Primero, crear la tabla si no existe
                String createTableQuery = """
                    CREATE TABLE IF NOT EXISTS historial_carga_productos (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        producto_id BIGINT NOT NULL,
                        producto_nombre VARCHAR(255),
                        producto_descripcion TEXT,
                        producto_marca VARCHAR(100),
                        producto_categoria VARCHAR(100),
                        producto_unidad VARCHAR(50),
                        codigo_barras VARCHAR(50),
                        codigo_personalizado VARCHAR(50),
                        usuario_id BIGINT,
                        usuario_nombre VARCHAR(255),
                        usuario_apellidos VARCHAR(255),
                        empresa_id BIGINT NOT NULL,
                        empresa_nombre VARCHAR(255),
                        tipo_operacion VARCHAR(50) NOT NULL,
                        tipo_operacion_descripcion VARCHAR(100),
                        cantidad INT NOT NULL,
                        stock_anterior INT,
                        stock_nuevo INT,
                        precio_unitario DECIMAL(10,2),
                        valor_total DECIMAL(10,2),
                        observacion VARCHAR(500),
                        metodo_entrada VARCHAR(100),
                        fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
                        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                        FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
                    )
                    """;
                
                try (PreparedStatement createTableStmt = connection.prepareStatement(createTableQuery)) {
                    createTableStmt.executeUpdate();
                    resultado.put("tablaCreada", true);
                }
                
                // Crear índices si no existen
                String[] indexQueries = {
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_empresa_id ON historial_carga_productos (empresa_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_producto_id ON historial_carga_productos (producto_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_usuario_id ON historial_carga_productos (usuario_id)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_fecha_operacion ON historial_carga_productos (fecha_operacion)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_tipo_operacion ON historial_carga_productos (tipo_operacion)",
                    "CREATE INDEX IF NOT EXISTS idx_historial_carga_codigo_barras ON historial_carga_productos (codigo_barras)"
                };
                
                for (String indexQuery : indexQueries) {
                    try (PreparedStatement indexStmt = connection.prepareStatement(indexQuery)) {
                        indexStmt.executeUpdate();
                    }
                }
                
                resultado.put("indicesCreados", true);
                
                // Verificar cuántos productos existen sin historial
                String countQuery = """
                    SELECT COUNT(*) as total_productos
                    FROM productos p
                    WHERE p.activo = true
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM historial_carga_productos h 
                        WHERE h.producto_id = p.id 
                        AND h.tipo_operacion = 'CARGA_INICIAL'
                    )
                    """;
                
                int productosSinHistorial = 0;
                try (PreparedStatement countStmt = connection.prepareStatement(countQuery);
                     ResultSet countRs = countStmt.executeQuery()) {
                    if (countRs.next()) {
                        productosSinHistorial = countRs.getInt("total_productos");
                    }
                }
                
                resultado.put("productosSinHistorial", productosSinHistorial);
                
                if (productosSinHistorial > 0) {
                    // Ejecutar la migración
                    String insertQuery = """
                        INSERT INTO historial_carga_productos (
                            producto_id, producto_nombre, producto_descripcion, producto_marca,
                            producto_categoria, producto_unidad, codigo_barras, codigo_personalizado,
                            usuario_id, usuario_nombre, usuario_apellidos, empresa_id, empresa_nombre,
                            tipo_operacion, tipo_operacion_descripcion, cantidad, stock_anterior,
                            stock_nuevo, precio_unitario, valor_total, observacion, metodo_entrada,
                            fecha_operacion, fecha_creacion, fecha_actualizacion
                        )
                        SELECT 
                            p.id as producto_id,
                            p.nombre as producto_nombre,
                            p.descripcion as producto_descripcion,
                            p.marca as producto_marca,
                            p.categoria as producto_categoria,
                            p.unidad as producto_unidad,
                            p.codigo_barras,
                            p.codigo_personalizado,
                            NULL as usuario_id,
                            'Sistema' as usuario_nombre,
                            'Inicialización' as usuario_apellidos,
                            p.empresa_id,
                            e.nombre as empresa_nombre,
                            'CARGA_INICIAL' as tipo_operacion,
                            'Carga Inicial' as tipo_operacion_descripcion,
                            COALESCE(p.stock, 0) as cantidad,
                            0 as stock_anterior,
                            COALESCE(p.stock, 0) as stock_nuevo,
                            COALESCE(p.precio, 0) as precio_unitario,
                            COALESCE(p.precio * p.stock, 0) as valor_total,
                            'Carga inicial de producto desde script SQL' as observacion,
                            'SISTEMA' as metodo_entrada,
                            p.fecha_creacion as fecha_operacion,
                            NOW() as fecha_creacion,
                            NOW() as fecha_actualizacion
                        FROM productos p
                        INNER JOIN empresas e ON p.empresa_id = e.id
                        WHERE p.activo = true
                        AND NOT EXISTS (
                            SELECT 1 
                            FROM historial_carga_productos h 
                            WHERE h.producto_id = p.id 
                            AND h.tipo_operacion = 'CARGA_INICIAL'
                        )
                        """;
                    
                    try (PreparedStatement insertStmt = connection.prepareStatement(insertQuery)) {
                        int registrosInsertados = insertStmt.executeUpdate();
                        resultado.put("registrosInsertados", registrosInsertados);
                        resultado.put("mensaje", "Migración completada exitosamente");
                    }
                } else {
                    resultado.put("mensaje", "No hay productos que requieran migración");
                }
                
                // Verificar el resultado final
                String finalCountQuery = """
                    SELECT COUNT(*) as total_historial
                    FROM historial_carga_productos 
                    WHERE tipo_operacion = 'CARGA_INICIAL' 
                    AND observacion = 'Carga inicial de producto desde script SQL'
                    """;
                
                try (PreparedStatement finalCountStmt = connection.prepareStatement(finalCountQuery);
                     ResultSet finalCountRs = finalCountStmt.executeQuery()) {
                    if (finalCountRs.next()) {
                        resultado.put("totalRegistrosHistorial", finalCountRs.getInt("total_historial"));
                    }
                }
                
            } catch (SQLException e) {
                System.err.println("=== ERROR SQL EN MIGRACIÓN ===");
                System.err.println("Error: " + e.getMessage());
                e.printStackTrace();
                resultado.put("error", "Error de base de datos: " + e.getMessage());
                return ResponseEntity.badRequest().body(resultado);
            }
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("=== ERROR GENERAL EN MIGRACIÓN ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
