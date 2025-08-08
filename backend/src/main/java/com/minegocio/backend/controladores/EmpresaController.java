package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.EmpresaDTO;
import com.minegocio.backend.dto.RegistroEmpresaDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.ArchivoEmpresa;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.servicios.LimiteService;
import com.minegocio.backend.servicios.SuscripcionService;
import com.minegocio.backend.servicios.AlmacenamientoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

/**
 * Controlador para la gestión de empresas
 */
@RestController
@RequestMapping("/api/empresas")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmpresaController {

    @Autowired
    private EmpresaService empresaService;

    @Autowired
    private LimiteService limiteService;

    @Autowired
    private AlmacenamientoService almacenamientoService;

    @Autowired
    private SuscripcionService suscripcionService;

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
                "mensaje", "Registro exitoso. Revise su email para verificar la cuenta.",
                "empresa", empresaDTO,
                "instrucciones", "Se ha enviado un email de verificación a su dirección de correo. Haga clic en el enlace del email para activar su cuenta y comenzar su período de prueba de 1 mes.",
                "requiereVerificacion", true
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

    /**
     * Obtiene información de límites de la empresa
     */
    @GetMapping("/{id}/limites")
    public ResponseEntity<?> obtenerLimites(@PathVariable Long id) {
        try {
            LimiteService.LimiteInfo limiteInfo = limiteService.obtenerLimiteInfo(id);
            
            return ResponseEntity.ok(Map.of(
                "limites", limiteInfo,
                "mensaje", "Información de límites obtenida exitosamente"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("mensaje", "Error obteniendo información de límites: " + e.getMessage()));
        }
    }

    /**
     * Obtiene estadísticas de consumo de la empresa actual
     */
    @GetMapping("/{id}/consumo")
    public ResponseEntity<?> obtenerConsumo(@PathVariable Long id) {
        try {
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticasConsumo(id);
            
            return ResponseEntity.ok(estadisticas);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo estadísticas de consumo: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para obtener límites de una empresa (para pruebas)
     */
    @GetMapping("/publico/{id}/limites")
    public ResponseEntity<?> obtenerLimitesPublico(@PathVariable Long id) {
        try {
            LimiteService.LimiteInfo limiteInfo = limiteService.obtenerLimiteInfo(id);
            
            return ResponseEntity.ok(Map.of(
                "limites", limiteInfo,
                "mensaje", "Información de límites obtenida exitosamente"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo información de límites: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para obtener consumo de una empresa (para pruebas)
     */
    @GetMapping("/publico/{id}/consumo")
    public ResponseEntity<?> obtenerConsumoPublico(@PathVariable Long id) {
        try {
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticasConsumo(id);
            
            return ResponseEntity.ok(estadisticas);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo estadísticas de consumo: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para listar empresas (para pruebas)
     */
    @GetMapping("/publico/listar")
    public ResponseEntity<?> listarEmpresasPublico() {
        try {
            List<Empresa> empresas = empresaService.obtenerTodasLasEmpresas();
            List<EmpresaDTO> empresasDTO = empresas.stream()
                .map(EmpresaDTO::new)
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "empresas", empresasDTO,
                "total", empresasDTO.size(),
                "mensaje", "Empresas obtenidas exitosamente"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo empresas: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para crear producto (para pruebas)
     */
    @PostMapping("/publico/{empresaId}/productos")
    public ResponseEntity<?> crearProductoPublico(@PathVariable Long empresaId, @RequestBody Map<String, Object> productoData) {
        try {
            // Verificar límites antes de crear el producto
            if (!limiteService.puedeCrearProducto(empresaId)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Límite de productos alcanzado",
                    "mensaje", "Has alcanzado el límite de productos permitidos en tu plan de suscripción. Actualiza tu plan para crear más productos."
                ));
            }
            
            // Crear el producto usando el servicio
            // Aquí necesitarías convertir el Map a ProductoDTO y usar el ProductoService
            // Por ahora, solo simulamos la creación exitosa
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto creado exitosamente (simulado)",
                "empresaId", empresaId,
                "producto", productoData
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error creando producto: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para crear cliente (para pruebas)
     */
    @PostMapping("/publico/{empresaId}/clientes")
    public ResponseEntity<?> crearClientePublico(@PathVariable Long empresaId, @RequestBody Map<String, Object> clienteData) {
        try {
            // Verificar límites antes de crear el cliente
            if (!limiteService.puedeCrearCliente(empresaId)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Límite de clientes alcanzado",
                    "mensaje", "Has alcanzado el límite de clientes permitidos en tu plan de suscripción. Actualiza tu plan para crear más clientes."
                ));
            }
            
            // Crear el cliente usando el servicio
            // Aquí necesitarías convertir el Map a ClienteDTO y usar el ClienteService
            // Por ahora, solo simulamos la creación exitosa
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Cliente creado exitosamente (simulado)",
                "empresaId", empresaId,
                "cliente", clienteData
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error creando cliente: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para obtener estadísticas de almacenamiento
     */
    @GetMapping("/publico/{empresaId}/almacenamiento")
    public ResponseEntity<?> obtenerEstadisticasAlmacenamiento(@PathVariable Long empresaId) {
        try {
            Map<String, Object> estadisticas = almacenamientoService.obtenerEstadisticasAlmacenamiento(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "empresaId", empresaId,
                "estadisticas", estadisticas,
                "mensaje", "Estadísticas de almacenamiento obtenidas exitosamente"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo estadísticas de almacenamiento: " + e.getMessage()));
        }
    }

    /**
     * Endpoint público para obtener estadísticas de almacenamiento total (archivos + BD)
     */
    @GetMapping("/publico/{empresaId}/almacenamiento-total")
    public ResponseEntity<?> obtenerEstadisticasAlmacenamientoTotal(@PathVariable Long empresaId) {
        try {
            Map<String, Object> estadisticas = almacenamientoService.obtenerEstadisticasAlmacenamientoTotal(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "empresaId", empresaId,
                "estadisticas", estadisticas,
                "mensaje", "Estadísticas de almacenamiento total obtenidas exitosamente"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error obteniendo estadísticas de almacenamiento total: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para simular registro de archivo
     */
    @PostMapping("/publico/{empresaId}/test-archivo")
    public ResponseEntity<?> testRegistrarArchivo(@PathVariable Long empresaId, @RequestBody Map<String, Object> datos) {
        try {
            String urlArchivo = (String) datos.get("urlArchivo");
            String publicId = (String) datos.get("publicId");
            String tipoArchivo = (String) datos.get("tipoArchivo");
            Long tamañoBytes = ((Number) datos.get("tamañoBytes")).longValue();
            String nombreOriginal = (String) datos.get("nombreOriginal");
            String tipoMime = (String) datos.get("tipoMime");
            
            ArchivoEmpresa archivo = almacenamientoService.registrarArchivo(
                empresaId, urlArchivo, publicId, tipoArchivo, 
                tamañoBytes, nombreOriginal, tipoMime
            );
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Archivo registrado exitosamente",
                "archivo", Map.of(
                    "id", archivo.getId(),
                    "url", archivo.getUrlArchivo(),
                    "tipo", archivo.getTipoArchivo(),
                    "tamañoBytes", archivo.getTamañoBytes(),
                    "tamañoMB", archivo.getTamañoMB()
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error registrando archivo: " + e.getMessage()));
        }
    }
}
