package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.AutenticacionService;
import com.minegocio.backend.servicios.PedidoService;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.dto.EmpresaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;

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
            empresaDTO.setMoneda(empresa.getMoneda());
            
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
            
            // Actualizar datos de la empresa
            empresa.setNombre(empresaDTO.getNombre());
            empresa.setDescripcion(empresaDTO.getDescripcion());
            empresa.setEmail(empresaDTO.getEmail());
            empresa.setTelefono(empresaDTO.getTelefono());
            empresa.setColorPrimario(empresaDTO.getColorPrimario());
            empresa.setColorSecundario(empresaDTO.getColorSecundario());
            empresa.setMoneda(empresaDTO.getMoneda());
            
            // El subdominio no se puede cambiar por ahora
            // empresa.setSubdominio(empresaDTO.getSubdominio());
            
            Empresa empresaActualizada = empresaService.guardar(empresa);
            
            // Devolver empresa actualizada
            EmpresaDTO empresaActualizadaDTO = new EmpresaDTO();
            empresaActualizadaDTO.setId(empresaActualizada.getId());
            empresaActualizadaDTO.setNombre(empresaActualizada.getNombre());
            empresaActualizadaDTO.setDescripcion(empresaActualizada.getDescripcion());
            empresaActualizadaDTO.setSubdominio(empresaActualizada.getSubdominio());
            empresaActualizadaDTO.setEmail(empresaActualizada.getEmail());
            empresaActualizadaDTO.setTelefono(empresaActualizada.getTelefono());
            empresaActualizadaDTO.setLogoUrl(empresaActualizada.getLogoUrl());
            empresaActualizadaDTO.setColorPrimario(empresaActualizada.getColorPrimario());
            empresaActualizadaDTO.setColorSecundario(empresaActualizada.getColorSecundario());
            empresaActualizadaDTO.setMoneda(empresaActualizada.getMoneda());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa actualizada correctamente",
                "data", empresaActualizadaDTO
            ));
            
        } catch (Exception e) {
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
            
            // Obtener estadísticas de ventas
            Double totalVentas = pedidoService.obtenerTotalVentasPorEmpresa(empresa.getId());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estadísticas obtenidas correctamente",
                "data", Map.of(
                    "totalVentas", totalVentas != null ? totalVentas : 0.0
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Error interno del servidor"));
        }
    }
}
