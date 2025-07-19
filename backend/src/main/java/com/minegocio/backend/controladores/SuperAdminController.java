package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import java.util.List;
import java.util.HashMap;

@RestController
@RequestMapping("/api/super-admin")
@CrossOrigin(origins = {"http://localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org"}, allowedHeaders = "*")
public class SuperAdminController {

    @Autowired
    private EmpresaService empresaService;
    
    @Autowired
    private AutenticacionService autenticacionService;
    
    @Autowired
    private JwtUtils jwtUtils;

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
            dashboard.put("empresasActivas", empresasActivas);
            dashboard.put("empresasInactivas", empresasInactivas);
            dashboard.put("empresas", todasLasEmpresas.stream().map(empresa -> {
                Map<String, Object> empresaMap = new HashMap<>();
                empresaMap.put("id", empresa.getId());
                empresaMap.put("nombre", empresa.getNombre());
                empresaMap.put("subdominio", empresa.getSubdominio());
                empresaMap.put("email", empresa.getEmail());
                empresaMap.put("activa", empresa.getActiva());
                empresaMap.put("fechaCreacion", empresa.getFechaCreacion());
                return empresaMap;
            }).toList());
            
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
            
            List<Empresa> empresas = empresaService.obtenerTodasLasEmpresas();
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresas obtenidas correctamente",
                "data", empresas
            ));
            
        } catch (Exception e) {
            System.err.println("Error al obtener empresas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }
} 