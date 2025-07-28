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
            System.out.println("=== DEBUG: Actualizando personalización ===");
            System.out.println("Empresa ID: " + id);
            System.out.println("Datos recibidos: " + personalizacion);
            System.out.println("Color Título Principal recibido: " + personalizacion.get("colorTituloPrincipal"));
            System.out.println("Color Card Filtros recibido: " + personalizacion.get("colorCardFiltros"));
            System.out.println("Imagen de fondo URL recibida: " + personalizacion.get("imagenFondoUrl"));
            System.out.println("Instagram URL recibida: " + personalizacion.get("instagramUrl"));
            System.out.println("Facebook URL recibida: " + personalizacion.get("facebookUrl"));
            
            EmpresaDTO empresaDTO = empresaService.actualizarPersonalizacion(
                id,
                personalizacion.get("logoUrl"),
                personalizacion.get("descripcion"),
                personalizacion.get("textoBienvenida"),
                personalizacion.get("colorPrimario"),
                personalizacion.get("colorSecundario"),
                personalizacion.get("colorAcento"),
                personalizacion.get("colorFondo"),
                personalizacion.get("colorTexto"),
                personalizacion.get("colorTituloPrincipal"),
                personalizacion.get("colorCardFiltros"),
                personalizacion.get("imagenFondoUrl"),
                personalizacion.get("instagramUrl"),
                personalizacion.get("facebookUrl")
            );
            
            System.out.println("Personalización actualizada exitosamente");
            System.out.println("Empresa actualizada: " + empresaDTO);
            System.out.println("Color Título Principal guardado: " + empresaDTO.getColorTituloPrincipal());
            System.out.println("Color Card Filtros guardado: " + empresaDTO.getColorCardFiltros());
            System.out.println("Imagen de fondo guardada: " + empresaDTO.getImagenFondoUrl());
            System.out.println("Instagram URL guardada: " + empresaDTO.getInstagramUrl());
            System.out.println("Facebook URL guardada: " + empresaDTO.getFacebookUrl());
            
            Map<String, Object> response = Map.of(
                "mensaje", "Personalización actualizada exitosamente",
                "empresa", empresaDTO
            );
            
            System.out.println("Respuesta que se envía: " + response);
            
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            System.err.println("Error de validación: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(Map.of("mensaje", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error actualizando personalización: " + e.getMessage()));
        }
    }
}
