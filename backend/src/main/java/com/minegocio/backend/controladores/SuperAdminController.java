package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.SuperAdminService;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    private SuperAdminService superAdminService;
    
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
            
            // Crear Pageable para obtener todas las empresas
            Pageable pageable = PageRequest.of(0, 100);
            
            // Usar SuperAdminService para obtener empresas con estadísticas completas
            var resultado = superAdminService.obtenerEmpresas(null, null, null, null, null, pageable);
            
            System.out.println("🔍 === RESPUESTA FINAL ===");
            System.out.println("🔍 Total empresas en respuesta: " + resultado.getContent().size());
            
            // Debug de las primeras 3 empresas
            for (int i = 0; i < Math.min(3, resultado.getContent().size()); i++) {
                var empresa = resultado.getContent().get(i);
                System.out.println("🔍 Empresa " + (i+1) + ": " + empresa.getNombre());
                System.out.println("  - totalVentasRapidas: " + empresa.getTotalVentasRapidas());
                System.out.println("  - totalTransacciones: " + empresa.getTotalTransacciones());
                System.out.println("  - ultimaConexion: " + empresa.getUltimaConexion());
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresas obtenidas correctamente",
                "data", resultado.getContent()
            ));
            
        } catch (Exception e) {
            System.err.println("Error al obtener empresas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }
} 