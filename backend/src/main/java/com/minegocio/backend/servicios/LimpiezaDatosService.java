package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Map;

@Service
@Transactional
public class LimpiezaDatosService {

    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private SectorRepository sectorRepository;

    @Autowired
    private DetalleRemitoIngresoRepository detalleRemitoIngresoRepository;

    @Autowired
    private DetallePlanillaDevolucionRepository detallePlanillaDevolucionRepository;

    @Autowired
    private RoturaPerdidaRepository roturaPerdidaRepository;

    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Limpiar datos inconsistentes en el sistema
     */
    public LimpiezaResultadoDTO limpiarDatosInconsistentes(Long empresaId) {
        LimpiezaResultadoDTO resultado = new LimpiezaResultadoDTO();
        
        System.out.println("🧹 [LIMPIEZA] Iniciando limpieza de datos inconsistentes para empresa: " + empresaId);
        
        // 1. Limpiar StockPorSector con productos inexistentes
        resultado.setStockSectorProductosEliminados(limpiarStockSectorProductosInexistentes(empresaId));
        
        // 2. Limpiar StockPorSector con sectores inexistentes
        resultado.setStockSectorSectoresEliminados(limpiarStockSectorSectoresInexistentes(empresaId));
        
        // 3. Limpiar detalles de remitos con productos inexistentes
        resultado.setDetallesRemitoEliminados(limpiarDetallesRemitoProductosInexistentes(empresaId));
        
        // 4. Limpiar detalles de devoluciones con productos inexistentes
        resultado.setDetallesDevolucionEliminados(limpiarDetallesDevolucionProductosInexistentes(empresaId));
        
        // 5. Limpiar detalles de roturas con productos inexistentes
        resultado.setDetallesRoturaEliminados(limpiarDetallesRoturaProductosInexistentes(empresaId));
        
        // 6. Sincronizar stock después de la limpieza
        sincronizarStockDespuesLimpieza(empresaId);
        
        System.out.println("✅ [LIMPIEZA] Limpieza completada: " + resultado);
        
        return resultado;
    }

    /**
     * Limpiar StockPorSector que referencian productos que ya no existen
     */
    private int limpiarStockSectorProductosInexistentes(Long empresaId) {
        System.out.println("🧹 [LIMPIEZA] Verificando StockPorSector con productos inexistentes...");
        
        // Obtener todos los productos de la empresa
        List<Producto> productosEmpresa = productoRepository.findByEmpresaId(empresaId);
        Set<Long> productosIds = productosEmpresa.stream()
            .map(Producto::getId)
            .collect(Collectors.toSet());
        
        // Obtener todos los StockPorSector de la empresa
        List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
        
        int eliminados = 0;
        for (StockPorSector stock : stockPorSectores) {
            if (stock.getProducto() != null && !productosIds.contains(stock.getProducto().getId())) {
                System.out.println("🗑️ [LIMPIEZA] Eliminando StockPorSector con producto inexistente: " + 
                    stock.getProducto().getId() + " - " + stock.getProducto().getNombre());
                stockPorSectorRepository.delete(stock);
                eliminados++;
            }
        }
        
        System.out.println("✅ [LIMPIEZA] StockPorSector con productos inexistentes eliminados: " + eliminados);
        return eliminados;
    }

    /**
     * Limpiar StockPorSector que referencian sectores que ya no existen
     */
    private int limpiarStockSectorSectoresInexistentes(Long empresaId) {
        System.out.println("🧹 [LIMPIEZA] Verificando StockPorSector con sectores inexistentes...");
        
        // Obtener todos los sectores de la empresa
        List<Sector> sectoresEmpresa = sectorRepository.findByEmpresaIdOrderByNombre(empresaId);
        Set<Long> sectoresIds = sectoresEmpresa.stream()
            .map(Sector::getId)
            .collect(Collectors.toSet());
        
        // Obtener todos los StockPorSector de la empresa
        List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
        
        int eliminados = 0;
        for (StockPorSector stock : stockPorSectores) {
            if (stock.getSector() != null && !sectoresIds.contains(stock.getSector().getId())) {
                System.out.println("🗑️ [LIMPIEZA] Eliminando StockPorSector con sector inexistente: " + 
                    stock.getSector().getId() + " - " + stock.getSector().getNombre());
                stockPorSectorRepository.delete(stock);
                eliminados++;
            }
        }
        
        System.out.println("✅ [LIMPIEZA] StockPorSector con sectores inexistentes eliminados: " + eliminados);
        return eliminados;
    }

    /**
     * Limpiar detalles de remitos con productos inexistentes
     */
    private int limpiarDetallesRemitoProductosInexistentes(Long empresaId) {
        System.out.println("🧹 [LIMPIEZA] Verificando detalles de remitos con productos inexistentes...");
        
        // Obtener todos los productos de la empresa
        List<Producto> productosEmpresa = productoRepository.findByEmpresaId(empresaId);
        Set<Long> productosIds = productosEmpresa.stream()
            .map(Producto::getId)
            .collect(Collectors.toSet());
        
        // Obtener todos los detalles de remitos
        List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findAll();
        
        int eliminados = 0;
        for (DetalleRemitoIngreso detalle : detalles) {
            if (detalle.getProducto() != null && !productosIds.contains(detalle.getProducto().getId())) {
                System.out.println("🗑️ [LIMPIEZA] Eliminando detalle de remito con producto inexistente: " + 
                    detalle.getProducto().getId() + " - " + detalle.getProducto().getNombre());
                detalleRemitoIngresoRepository.delete(detalle);
                eliminados++;
            }
        }
        
        System.out.println("✅ [LIMPIEZA] Detalles de remitos con productos inexistentes eliminados: " + eliminados);
        return eliminados;
    }

    /**
     * Limpiar detalles de devoluciones con productos inexistentes
     */
    private int limpiarDetallesDevolucionProductosInexistentes(Long empresaId) {
        System.out.println("🧹 [LIMPIEZA] Verificando detalles de devoluciones con productos inexistentes...");
        
        // Obtener todos los productos de la empresa
        List<Producto> productosEmpresa = productoRepository.findByEmpresaId(empresaId);
        Set<Long> productosIds = productosEmpresa.stream()
            .map(Producto::getId)
            .collect(Collectors.toSet());
        
        // Obtener todos los detalles de devoluciones
        List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findAll();
        
        int eliminados = 0;
        for (DetallePlanillaDevolucion detalle : detalles) {
            if (detalle.getProducto() != null && !productosIds.contains(detalle.getProducto().getId())) {
                System.out.println("🗑️ [LIMPIEZA] Eliminando detalle de devolución con producto inexistente: " + 
                    detalle.getProducto().getId() + " - " + detalle.getProducto().getNombre());
                detallePlanillaDevolucionRepository.delete(detalle);
                eliminados++;
            }
        }
        
        System.out.println("✅ [LIMPIEZA] Detalles de devoluciones con productos inexistentes eliminados: " + eliminados);
        return eliminados;
    }

    /**
     * Limpiar roturas con productos inexistentes
     */
    private int limpiarDetallesRoturaProductosInexistentes(Long empresaId) {
        System.out.println("🧹 [LIMPIEZA] Verificando roturas con productos inexistentes...");
        
        // Obtener todos los productos de la empresa
        List<Producto> productosEmpresa = productoRepository.findByEmpresaId(empresaId);
        Set<Long> productosIds = productosEmpresa.stream()
            .map(Producto::getId)
            .collect(Collectors.toSet());
        
        // Obtener todas las roturas
        List<RoturaPerdida> roturas = roturaPerdidaRepository.findAll();
        
        int eliminados = 0;
        for (RoturaPerdida rotura : roturas) {
            if (rotura.getProducto() != null && !productosIds.contains(rotura.getProducto().getId())) {
                System.out.println("🗑️ [LIMPIEZA] Eliminando rotura con producto inexistente: " + 
                    rotura.getProducto().getId() + " - " + rotura.getProducto().getNombre());
                roturaPerdidaRepository.delete(rotura);
                eliminados++;
            }
        }
        
        System.out.println("✅ [LIMPIEZA] Roturas con productos inexistentes eliminadas: " + eliminados);
        return eliminados;
    }

    /**
     * Sincronizar stock después de la limpieza para asegurar consistencia
     */
    private void sincronizarStockDespuesLimpieza(Long empresaId) {
        System.out.println("🔄 [LIMPIEZA] Sincronizando stock después de la limpieza...");
        
        List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
        
        for (Producto producto : productos) {
            try {
                // Verificar consistencia para cada producto
                Map<String, Object> consistencia = stockSincronizacionService.verificarConsistencia(empresaId, producto.getId());
                Boolean esConsistente = (Boolean) consistencia.get("esConsistente");
                
                if (!esConsistente) {
                    System.out.println("⚠️ [LIMPIEZA] Inconsistencia detectada en producto: " + producto.getNombre());
                    System.out.println("🔄 [LIMPIEZA] Sincronizando producto: " + producto.getNombre());
                    
                    // Sincronizar el producto
                    stockSincronizacionService.sincronizarStockConSectores(
                        empresaId,
                        producto.getId(),
                        producto.getStock(),
                        "Limpieza automática de datos"
                    );
                }
            } catch (Exception e) {
                System.err.println("❌ [LIMPIEZA] Error al sincronizar producto " + producto.getNombre() + ": " + e.getMessage());
            }
        }
        
        System.out.println("✅ [LIMPIEZA] Sincronización completada");
    }

    /**
     * DTO para el resultado de la limpieza
     */
    public static class LimpiezaResultadoDTO {
        private int stockSectorProductosEliminados;
        private int stockSectorSectoresEliminados;
        private int detallesRemitoEliminados;
        private int detallesDevolucionEliminados;
        private int detallesRoturaEliminados;

        public LimpiezaResultadoDTO() {}

        // Getters y Setters
        public int getStockSectorProductosEliminados() { return stockSectorProductosEliminados; }
        public void setStockSectorProductosEliminados(int stockSectorProductosEliminados) { this.stockSectorProductosEliminados = stockSectorProductosEliminados; }

        public int getStockSectorSectoresEliminados() { return stockSectorSectoresEliminados; }
        public void setStockSectorSectoresEliminados(int stockSectorSectoresEliminados) { this.stockSectorSectoresEliminados = stockSectorSectoresEliminados; }

        public int getDetallesRemitoEliminados() { return detallesRemitoEliminados; }
        public void setDetallesRemitoEliminados(int detallesRemitoEliminados) { this.detallesRemitoEliminados = detallesRemitoEliminados; }

        public int getDetallesDevolucionEliminados() { return detallesDevolucionEliminados; }
        public void setDetallesDevolucionEliminados(int detallesDevolucionEliminados) { this.detallesDevolucionEliminados = detallesDevolucionEliminados; }

        public int getDetallesRoturaEliminados() { return detallesRoturaEliminados; }
        public void setDetallesRoturaEliminados(int detallesRoturaEliminados) { this.detallesRoturaEliminados = detallesRoturaEliminados; }

        public int getTotalEliminados() {
            return stockSectorProductosEliminados + stockSectorSectoresEliminados + 
                   detallesRemitoEliminados + detallesDevolucionEliminados + detallesRoturaEliminados;
        }

        @Override
        public String toString() {
            return "LimpiezaResultadoDTO{" +
                "stockSectorProductosEliminados=" + stockSectorProductosEliminados +
                ", stockSectorSectoresEliminados=" + stockSectorSectoresEliminados +
                ", detallesRemitoEliminados=" + detallesRemitoEliminados +
                ", detallesDevolucionEliminados=" + detallesDevolucionEliminados +
                ", detallesRoturaEliminados=" + detallesRoturaEliminados +
                ", totalEliminados=" + getTotalEliminados() +
                '}';
        }
    }
}
