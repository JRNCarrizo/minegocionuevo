package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.StockSincronizacionService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

/**
 * Controlador para la sincronización de stock entre sectores y sistema de ingresos/cargas
 */
@RestController
@RequestMapping("/api/empresas/{empresaId}/stock-sincronizacion")
@CrossOrigin(origins = "*")
public class StockSincronizacionController {

    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Descontar stock de un producto aplicando la estrategia híbrida inteligente
     */
    @PostMapping("/descontar")
    public ResponseEntity<?> descontarStockInteligente(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Endpoint de descuento llamado");
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Empresa: " + empresaId);
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Request: " + request);

            Long productoId = Long.valueOf(request.get("productoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            String motivo = (String) request.get("motivo");

            if (productoId == null || cantidad == null || cantidad <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "productoId y cantidad son obligatorios y cantidad debe ser mayor a 0"
                ));
            }

            Map<String, Object> resultado = stockSincronizacionService.descontarStockInteligente(
                empresaId, productoId, cantidad, motivo != null ? motivo : "Descuento automático"
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock descontado exitosamente",
                "data", resultado
            ));

        } catch (Exception e) {
            System.err.println("🔍 STOCK SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al descontar stock: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener detalle de stock disponible por ubicación para un producto
     */
    @GetMapping("/detalle-stock/{productoId}")
    public ResponseEntity<?> obtenerDetalleStockDisponible(
            @PathVariable Long empresaId,
            @PathVariable Long productoId) {
        try {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Obteniendo detalle de stock");
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Empresa: " + empresaId + ", Producto: " + productoId);

            Map<String, Object> resultado = stockSincronizacionService.obtenerDetalleStockDisponible(empresaId, productoId);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Detalle de stock obtenido exitosamente",
                "data", resultado
            ));

        } catch (Exception e) {
            System.err.println("🔍 STOCK SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener detalle de stock: " + e.getMessage()
            ));
        }
    }

    /**
     * Descontar stock de múltiples productos (para cargas de planilla, etc.)
     */
    @PostMapping("/descontar-multiple")
    public ResponseEntity<?> descontarStockMultiple(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Endpoint de descuento múltiple llamado");
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Empresa: " + empresaId);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> productos = (List<Map<String, Object>>) request.get("productos");
            String motivo = (String) request.get("motivo");

            if (productos == null || productos.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "La lista de productos es obligatoria y no puede estar vacía"
                ));
            }

            List<Map<String, Object>> resultados = new java.util.ArrayList<>();

            for (Map<String, Object> producto : productos) {
                try {
                    Long productoId = Long.valueOf(producto.get("productoId").toString());
                    Integer cantidad = Integer.valueOf(producto.get("cantidad").toString());

                    Map<String, Object> resultado = stockSincronizacionService.descontarStockInteligente(
                        empresaId, productoId, cantidad, motivo != null ? motivo : "Descuento múltiple"
                    );
                    resultados.add(resultado);

                } catch (Exception e) {
                    System.err.println("🔍 STOCK SINCRONIZACIÓN - Error en producto individual: " + e.getMessage());
                    Map<String, Object> error = Map.of(
                        "error", "Error al procesar producto: " + e.getMessage(),
                        "producto", producto
                    );
                    resultados.add(error);
                }
            }

            return ResponseEntity.ok(Map.of(
                "mensaje", "Procesamiento de descuentos completado",
                "data", resultados,
                "totalProductos", productos.size(),
                "productosProcesados", resultados.size()
            ));

        } catch (Exception e) {
            System.err.println("🔍 STOCK SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al procesar descuentos múltiples: " + e.getMessage()
            ));
        }
    }

    /**
     * Sincronizar stock del producto con sectores (desde Gestión de Productos)
     */
    @PostMapping("/sincronizar-producto")
    public ResponseEntity<?> sincronizarProductoConSectores(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔄 SINCRONIZACIÓN - Endpoint de sincronización de producto llamado");
            System.out.println("🔄 SINCRONIZACIÓN - Empresa: " + empresaId);

            Long productoId = Long.valueOf(request.get("productoId").toString());
            Integer nuevoStockTotal = Integer.valueOf(request.get("nuevoStockTotal").toString());
            String motivo = (String) request.get("motivo");

            if (productoId == null || nuevoStockTotal == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "productoId y nuevoStockTotal son obligatorios"
                ));
            }

            Map<String, Object> resultado = stockSincronizacionService.sincronizarStockConSectores(
                empresaId, productoId, nuevoStockTotal, motivo != null ? motivo : "Sincronización automática"
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock sincronizado exitosamente con sectores",
                "data", resultado
            ));

        } catch (Exception e) {
            System.err.println("🔄 SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al sincronizar stock: " + e.getMessage()
            ));
        }
    }

    /**
     * Sincronizar stock de un sector con el producto (desde Gestión de Sectores)
     */
    @PostMapping("/sincronizar-sector")
    public ResponseEntity<?> sincronizarSectorConProducto(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔄 SINCRONIZACIÓN - Endpoint de sincronización de sector llamado");
            System.out.println("🔄 SINCRONIZACIÓN - Empresa: " + empresaId);

            Long productoId = Long.valueOf(request.get("productoId").toString());
            Long sectorId = Long.valueOf(request.get("sectorId").toString());
            Integer nuevoStockSector = Integer.valueOf(request.get("nuevoStockSector").toString());
            String motivo = (String) request.get("motivo");

            if (productoId == null || sectorId == null || nuevoStockSector == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "productoId, sectorId y nuevoStockSector son obligatorios"
                ));
            }

            Map<String, Object> resultado = stockSincronizacionService.sincronizarSectorConProducto(
                empresaId, productoId, sectorId, nuevoStockSector, motivo != null ? motivo : "Sincronización automática"
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Sector sincronizado exitosamente con producto",
                "data", resultado
            ));

        } catch (Exception e) {
            System.err.println("🔄 SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al sincronizar sector: " + e.getMessage()
            ));
        }
    }

    /**
     * Verificar consistencia entre producto y sectores
     */
    @GetMapping("/verificar-consistencia/{productoId}")
    public ResponseEntity<?> verificarConsistencia(
            @PathVariable Long empresaId,
            @PathVariable Long productoId) {
        try {
            System.out.println("🔍 SINCRONIZACIÓN - Verificando consistencia");
            System.out.println("🔍 SINCRONIZACIÓN - Empresa: " + empresaId + ", Producto: " + productoId);

            Map<String, Object> resultado = stockSincronizacionService.verificarConsistencia(empresaId, productoId);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Consistencia verificada",
                "data", resultado
            ));

        } catch (Exception e) {
            System.err.println("🔍 SINCRONIZACIÓN - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al verificar consistencia: " + e.getMessage()
            ));
        }
    }
}
