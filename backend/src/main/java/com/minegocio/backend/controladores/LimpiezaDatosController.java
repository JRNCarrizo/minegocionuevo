package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.LimpiezaDatosService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/limpieza-datos")
@CrossOrigin(origins = "*")
public class LimpiezaDatosController {

    @Autowired
    private LimpiezaDatosService limpiezaDatosService;

    /**
     * Limpiar datos inconsistentes para la empresa del usuario autenticado
     */
    @PostMapping("/limpiar")
    public ResponseEntity<LimpiezaDatosService.LimpiezaResultadoDTO> limpiarDatosInconsistentes(Authentication authentication) {
        try {
            // Obtener el ID de la empresa del usuario autenticado
            Long empresaId = obtenerEmpresaId(authentication);
            
            LimpiezaDatosService.LimpiezaResultadoDTO resultado = limpiezaDatosService.limpiarDatosInconsistentes(empresaId);
            
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("❌ Error al limpiar datos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtener el ID de la empresa del usuario autenticado
     */
    private Long obtenerEmpresaId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioPrincipal.getEmpresaId();
        }
        throw new RuntimeException("No se pudo obtener la información de la empresa");
    }
}
