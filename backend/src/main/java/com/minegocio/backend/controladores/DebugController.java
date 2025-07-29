package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Pedido;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DebugController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PedidoRepository pedidoRepository;

    @GetMapping("/auth-status")
    public ResponseEntity<?> getAuthStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            response.put("authenticated", auth != null && auth.isAuthenticated());
            response.put("principal", auth != null ? auth.getPrincipal().toString() : "null");
            response.put("authorities", auth != null ? auth.getAuthorities().toString() : "null");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/usuarios")
    public ResponseEntity<?> getUsuarios() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            response.put("total", usuarios.size());
            response.put("usuarios", usuarios.stream().map(u -> {
                Map<String, Object> userMap = new HashMap<>();
                userMap.put("id", u.getId());
                userMap.put("email", u.getEmail());
                userMap.put("rol", u.getRol());
                userMap.put("activo", u.getActivo());
                userMap.put("empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null);
                return userMap;
            }).toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/empresas")
    public ResponseEntity<?> getEmpresas() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Empresa> empresas = empresaRepository.findAll();
            response.put("total", empresas.size());
            response.put("empresas", empresas.stream().map(e -> {
                Map<String, Object> empresaMap = new HashMap<>();
                empresaMap.put("id", e.getId());
                empresaMap.put("nombre", e.getNombre());
                empresaMap.put("subdominio", e.getSubdominio());
                empresaMap.put("activo", e.getActiva());
                return empresaMap;
            }).toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/pedidos/{empresaId}")
    public ResponseEntity<?> getPedidos(@PathVariable Long empresaId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Empresa empresa = empresaRepository.findById(empresaId).orElse(null);
            if (empresa == null) {
                response.put("error", "Empresa no encontrada");
                return ResponseEntity.status(404).body(response);
            }
            
            List<Pedido> pedidos = pedidoRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
            response.put("total", pedidos.size());
            response.put("pedidos", pedidos.stream().map(p -> {
                Map<String, Object> pedidoMap = new HashMap<>();
                pedidoMap.put("id", p.getId());
                pedidoMap.put("numeroPedido", p.getNumeroPedido());
                pedidoMap.put("estado", p.getEstado());
                pedidoMap.put("total", p.getTotal());
                pedidoMap.put("cliente", p.getCliente() != null ? p.getCliente().getId() : null);
                pedidoMap.put("detalles", p.getDetalles() != null ? p.getDetalles().size() : 0);
                return pedidoMap;
            }).toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/test-db")
    public ResponseEntity<?> testDatabase() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            long usuariosCount = usuarioRepository.count();
            long empresasCount = empresaRepository.count();
            long pedidosCount = pedidoRepository.count();
            
            response.put("usuarios", usuariosCount);
            response.put("empresas", empresasCount);
            response.put("pedidos", pedidosCount);
            response.put("status", "OK");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(response);
        }
    }
}
