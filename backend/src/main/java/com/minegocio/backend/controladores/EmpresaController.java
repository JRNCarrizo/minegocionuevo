package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.RegistroEmpresaDTO;
import com.minegocio.backend.servicios.EmpresaService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador para la gestión de empresas
 */
@RestController
@RequestMapping("/api/empresas")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmpresaController {

    @Autowired
    private EmpresaService empresaService;

    /**
     * Registra una nueva empresa
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrarEmpresa(@Valid @RequestBody RegistroEmpresaDTO registroDTO) {
        try {
            // Validar términos y condiciones
            if (!registroDTO.getAceptaTerminos()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("mensaje", "Debe aceptar los términos y condiciones"));
            }

            EmpresaDTO empresaDTO = empresaService.registrarEmpresa(registroDTO);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Empresa registrada exitosamente",
                "empresa", empresaDTO,
                "instrucciones", "Revise su email para verificar la cuenta. Su período de prueba de 1 mes ha comenzado."
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error interno del servidor"));
        }
    }

    /**
     * Verifica la disponibilidad de un subdominio
     */
    @GetMapping("/verificar-subdominio/{subdominio}")
    public ResponseEntity<?> verificarSubdominio(@PathVariable String subdominio) {
        try {
            boolean disponible = empresaService.verificarDisponibilidadSubdominio(subdominio);
            
            return ResponseEntity.ok(Map.of(
                "subdominio", subdominio,
                "disponible", disponible,
                "mensaje", disponible ? "Subdominio disponible" : "Subdominio ya está en uso"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error verificando subdominio"));
        }
    }

    /**
     * Obtiene información de una empresa por subdominio
     */
    @GetMapping("/subdominio/{subdominio}")
    public ResponseEntity<?> obtenerPorSubdominio(@PathVariable String subdominio) {
        try {
            return empresaService.buscarPorSubdominio(subdominio)
                .map(empresa -> ResponseEntity.ok(Map.of("empresa", empresa)))
                .orElse(ResponseEntity.notFound().build());
                
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error obteniendo información de la empresa"));
        }
    }

    /**
     * Actualiza la personalización de la empresa
     */
    @PutMapping("/{id}/personalizacion")
    public ResponseEntity<?> actualizarPersonalizacion(
            @PathVariable Long id,
            @RequestBody Map<String, String> personalizacion) {
        try {
            EmpresaDTO empresaDTO = empresaService.actualizarPersonalizacion(
                id,
                personalizacion.get("logoUrl"),
                personalizacion.get("colorPrimario"),
                personalizacion.get("colorSecundario")
            );
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Personalización actualizada exitosamente",
                "empresa", empresaDTO
            ));
            
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error actualizando personalización"));
        }
    }
}
